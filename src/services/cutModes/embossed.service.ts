/**
 * Service pour le Mode Embossed (Outie)
 * Les espaces VIDES sont pliés, l'image ressort (inverse d'Inverted)
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
  };
}

export class EmbossedService {
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
   * Génère le pattern Embossed - les zones CLAIRES sont pliées
   */
  private static generatePattern(
    imageData: ImageData,
    bookPages: number,
    pageHeight: number,
    threshold: number,
    precision: 'exact' | '0.1mm' | '0.5mm' | '1mm' = '0.1mm'
  ): PagePattern[] {
    const { width, height, data } = imageData;
    const pattern: PagePattern[] = [];
    const pixelsPerPage = width / bookPages;

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

      const zones: FoldZone[] = [];
      let inZone = false;
      let zoneStart = -1;

      // Parcourir la colonne de haut en bas
      for (let y = 0; y < height; y++) {
        const index = (y * width + x) * 4;
        const gray = data[index];

        // EMBOSSED: Détecter si le pixel est CLAIR (inverse d'Inverted)
        const isLight = gray >= threshold;

        if (isLight && !inZone) {
          // Début d'une nouvelle zone (premier pixel clair)
          inZone = true;
          zoneStart = y;
        } else if (!isLight && inZone) {
          // Fin de la zone (premier pixel foncé après une zone claire)
          const zoneEnd = y - 1;
          const startMark = (zoneStart / height) * pageHeight;
          const endMark = (zoneEnd / height) * pageHeight;
          const zoneHeight = endMark - startMark;

          zones.push({
            startMark: this.roundValue(startMark, precision),
            endMark: this.roundValue(endMark, precision),
            height: this.roundValue(zoneHeight, precision),
          });

          inZone = false;
          zoneStart = -1;
        }
      }

      // Si on est encore dans une zone à la fin, la fermer
      if (inZone && zoneStart !== -1) {
        const zoneEnd = height - 1;
        const startMark = (zoneStart / height) * pageHeight;
        const endMark = (zoneEnd / height) * pageHeight;
        const zoneHeight = endMark - startMark;

        zones.push({
          startMark: this.roundValue(startMark, precision),
          endMark: this.roundValue(endMark, precision),
          height: this.roundValue(zoneHeight, precision),
        });
      }

      pattern.push({
        page: page + 1,
        zones: zones,
        hasContent: zones.length > 0,
      });
    }

    return pattern;
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
   * Applique le Mode Embossed à l'image traitée
   */
  static async execute(
    imageData: ImageProcessingResult,
    params: CutModeParams
  ): Promise<CutModeResult> {
    try {
      console.log('Exécution du Mode Embossed avec les paramètres:', params);

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

      console.log(`📖 Embossed - Dernière page: ${params.lastPageNumber} → ${physicalPages} pages physiques`);

      const imgData = await this.getImageData(imageData.processedImage);
      const pattern = this.generatePattern(
        imgData,
        physicalPages,
        pageHeightInCm,
        threshold,
        precision
      );

      const pagesWithContent = pattern.filter((p) => p.hasContent).length;
      const totalZones = pattern.reduce((sum, p) => sum + p.zones.length, 0);

      console.log(`Pattern Embossed généré: ${pagesWithContent}/${physicalPages} pages avec contenu, ${totalZones} zones au total`);

      return {
        success: true,
        message: `Embossed appliqué avec succès (${pagesWithContent} pages avec contenu)`,
        data: {
          mode: 'Embossed',
          pattern: pattern,
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Erreur lors de l\'exécution du Embossed:', error);
      return {
        success: false,
        message: `Erreur lors de l'exécution du Embossed: ${error}`,
      };
    }
  }
}
