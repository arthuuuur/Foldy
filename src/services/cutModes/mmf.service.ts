/**
 * Service pour le Mode MMF (Measure, Mark, Fold)
 * SANS coupe - uniquement des plis
 * Chaque page a exactement UNE PAIRE de plis (haut et bas)
 * Les plis sont à 45 degrés ou vers le coin de la page
 */

import { ImageProcessingResult } from '../imageProcessing.service';

export interface CutModeParams {
  lastPageNumber?: number;
  pageHeight?: number;
  pageHeightUnit?: 'cm' | 'in';
  threshold?: number;
  precision?: 'exact' | '0.1mm' | '0.5mm' | '1mm';
}

export interface FoldZone {
  startMark: number;
  endMark: number;
  height: number;
}

export interface PagePattern {
  page: number;
  zones: FoldZone[];
  hasContent: boolean;
}

export interface CutModeResult {
  success: boolean;
  message: string;
  data?: {
    mode: string;
    pattern?: PagePattern[];
    processedAt: string;
    warning?: string;
  };
}

export class MMFService {
  /**
   * Arrondit une valeur selon la précision choisie
   */
  private static roundValue(value: number, precision: 'exact' | '0.1mm' | '0.5mm' | '1mm'): number {
    if (precision === 'exact') {
      return value;
    }

    const valueMm = value * 10;
    let roundedMm: number;

    switch (precision) {
      case '0.1mm':
        roundedMm = Math.round(valueMm * 10) / 10;
        break;
      case '0.5mm':
        roundedMm = Math.round(valueMm * 2) / 2;
        break;
      case '1mm':
        roundedMm = Math.round(valueMm);
        break;
    }

    return roundedMm / 10;
  }

  /**
   * Détecte toutes les zones de pliage potentielles sur une colonne
   * Retourne un tableau de [start, end] pour chaque zone
   */
  private static detectAllZones(
    imageData: ImageData,
    x: number,
    pageHeight: number,
    threshold: number
  ): Array<{ start: number; end: number }> {
    const { width, height, data } = imageData;
    const zones: Array<{ start: number; end: number }> = [];
    let inZone = false;
    let zoneStart = -1;

    for (let y = 0; y < height; y++) {
      const index = (y * width + x) * 4;
      const gray = data[index];
      const isDark = gray < threshold;

      if (isDark && !inZone) {
        inZone = true;
        zoneStart = y;
      } else if (!isDark && inZone) {
        const zoneEnd = y - 1;
        const startCm = (zoneStart / height) * pageHeight;
        const endCm = (zoneEnd / height) * pageHeight;
        zones.push({ start: startCm, end: endCm });
        inZone = false;
        zoneStart = -1;
      }
    }

    // Si on est encore dans une zone à la fin
    if (inZone && zoneStart !== -1) {
      const zoneEnd = height - 1;
      const startCm = (zoneStart / height) * pageHeight;
      const endCm = (zoneEnd / height) * pageHeight;
      zones.push({ start: startCm, end: endCm });
    }

    return zones;
  }

  /**
   * Convertit les zones détectées en une paire de plis MMF (top fold, bottom fold)
   * Pour MMF, on prend les extrémités de toutes les zones combinées
   */
  private static convertToMMFPair(
    zones: Array<{ start: number; end: number }>,
    precision: 'exact' | '0.1mm' | '0.5mm' | '1mm'
  ): FoldZone | null {
    if (zones.length === 0) {
      return null;
    }

    // Trouver le point le plus haut et le plus bas parmi toutes les zones
    let minStart = zones[0].start;
    let maxEnd = zones[0].end;

    for (const zone of zones) {
      minStart = Math.min(minStart, zone.start);
      maxEnd = Math.max(maxEnd, zone.end);
    }

    // Créer une seule zone qui englobe tout
    return {
      startMark: this.roundValue(minStart, precision),
      endMark: this.roundValue(maxEnd, precision),
      height: this.roundValue(maxEnd - minStart, precision),
    };
  }

  /**
   * Génère le pattern MMF
   * Chaque page a AU MAXIMUM une paire de plis (top + bottom)
   */
  private static generatePattern(
    imageData: ImageData,
    bookPages: number,
    pageHeight: number,
    threshold: number,
    precision: 'exact' | '0.1mm' | '0.5mm' | '1mm' = '0.1mm'
  ): { pattern: PagePattern[]; hasWarning: boolean; maxMarks: number } {
    const { width } = imageData;
    const pattern: PagePattern[] = [];
    const pixelsPerPage = width / bookPages;
    let maxMarks = 0;
    let hasWarning = false;

    for (let page = 0; page < bookPages; page++) {
      const bookX = page * pixelsPerPage;
      const x = Math.floor(bookX);

      if (x < 0 || x >= width) {
        pattern.push({
          page: page + 1,
          zones: [],
          hasContent: false,
        });
        continue;
      }

      // Détecter toutes les zones sur cette colonne
      const detectedZones = this.detectAllZones(imageData, x, pageHeight, threshold);

      // Calculer le nombre de marques que cette page aurait en Cut and Fold
      const numMarks = detectedZones.length * 2; // Chaque zone = 2 marques (start + end)
      maxMarks = Math.max(maxMarks, numMarks);

      // Warning si plus de 6 marques (3 paires)
      if (numMarks > 6) {
        hasWarning = true;
      }

      // Convertir en une seule paire MMF
      const mmfPair = this.convertToMMFPair(detectedZones, precision);

      if (mmfPair) {
        pattern.push({
          page: page + 1,
          zones: [mmfPair],
          hasContent: true,
        });
      } else {
        pattern.push({
          page: page + 1,
          zones: [],
          hasContent: false,
        });
      }
    }

    return { pattern, hasWarning, maxMarks };
  }

  /**
   * Extrait les données ImageData depuis une image base64
   */
  private static async getImageData(base64Image: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };

      img.onerror = () => {
        reject(new Error('Erreur lors du chargement de l\'image'));
      };

      img.src = base64Image;
    });
  }

  /**
   * Applique le Mode MMF à l'image traitée
   */
  static async execute(
    imageData: ImageProcessingResult,
    params: CutModeParams
  ): Promise<CutModeResult> {
    try {
      console.log('Exécution du Mode MMF avec les paramètres:', params);

      if (!params.lastPageNumber || params.lastPageNumber <= 0) {
        return {
          success: false,
          message: 'Le nombre de pages doit être spécifié et supérieur à 0',
        };
      }

      if (!params.pageHeight || params.pageHeight <= 0) {
        return {
          success: false,
          message: 'La hauteur de page doit être spécifiée et supérieure à 0',
        };
      }

      const threshold = params.threshold ?? 128;
      const precision = params.precision ?? '0.1mm';

      const pageHeightInCm =
        params.pageHeightUnit === 'in'
          ? params.pageHeight * 2.54
          : params.pageHeight;

      const physicalPages = Math.ceil(params.lastPageNumber / 2);

      console.log(`📖 MMF - Dernière page: ${params.lastPageNumber} → ${physicalPages} pages physiques`);

      const imgData = await this.getImageData(imageData.processedImage);
      const { pattern, hasWarning, maxMarks } = this.generatePattern(
        imgData,
        physicalPages,
        pageHeightInCm,
        threshold,
        precision
      );

      const pagesWithContent = pattern.filter((p) => p.hasContent).length;
      const totalZones = pattern.reduce((sum, p) => sum + p.zones.length, 0);

      console.log(`Pattern MMF généré: ${pagesWithContent}/${physicalPages} pages avec contenu, ${totalZones} paires de plis`);

      let warningMessage: string | undefined;
      if (hasWarning) {
        warningMessage = `⚠️ MMF is not recommended for this design. Some pages would have more than 6 marks (max found: ${maxMarks}). The design may lack detail. Consider using Cut and Fold instead.`;
        console.warn(warningMessage);
      }

      return {
        success: true,
        message: `MMF appliqué avec succès (${pagesWithContent} pages avec contenu)${hasWarning ? ' - Warning: design complexe' : ''}`,
        data: {
          mode: 'MMF',
          pattern: pattern,
          processedAt: new Date().toISOString(),
          warning: warningMessage,
        },
      };
    } catch (error) {
      console.error('Erreur lors de l\'exécution du MMF:', error);
      return {
        success: false,
        message: `Erreur lors de l'exécution du MMF: ${error}`,
      };
    }
  }
}
