/**
 * Service pour le Mode Combi (Combined)
 * Étape 1: Plier les bords extérieurs
 * Étape 2: Cut and Fold au centre
 */

import { ImageProcessingResult } from '../imageProcessing.service';

export interface CutModeParams {
  lastPageNumber?: number;
  pageHeight?: number;
  pageHeightUnit?: 'cm' | 'in';
  threshold?: number;
  precision?: 'exact' | '0.1mm' | '0.5mm' | '1mm';
  combiEdgeWidth?: number; // Largeur des bords à plier (en cm)
}

export interface FoldZone {
  startMark: number;
  endMark: number;
  height: number;
  isEdgeFold?: boolean; // True si c'est un pli de bord (step 1), false si c'est un cut and fold (step 2)
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
    combiEdgeWidth?: number;
  };
}

export class CombiService {
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
   * Génère le pattern Combi
   * Étape 1: Ajouter les plis de bords (haut et bas sur toute la largeur)
   * Étape 2: Analyser la zone centrale pour le cut and fold
   */
  private static generatePattern(
    imageData: ImageData,
    bookPages: number,
    pageHeight: number,
    threshold: number,
    precision: 'exact' | '0.1mm' | '0.5mm' | '1mm' = '0.1mm',
    edgeWidth: number = 2 // Largeur par défaut des bords en cm
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

      // ÉTAPE 1: Ajouter les plis de bords (toujours présents sur chaque page)
      // Bord du haut
      zones.push({
        startMark: this.roundValue(0, precision),
        endMark: this.roundValue(edgeWidth, precision),
        height: this.roundValue(edgeWidth, precision),
        isEdgeFold: true,
      });

      // Bord du bas
      zones.push({
        startMark: this.roundValue(pageHeight - edgeWidth, precision),
        endMark: this.roundValue(pageHeight, precision),
        height: this.roundValue(edgeWidth, precision),
        isEdgeFold: true,
      });

      // ÉTAPE 2: Analyser la zone centrale pour le cut and fold
      // Zone centrale: entre edgeWidth et pageHeight - edgeWidth
      let inZone = false;
      let zoneStart = -1;

      for (let y = 0; y < height; y++) {
        const index = (y * width + x) * 4;
        const gray = data[index];

        // Convertir y (pixel) en position réelle (cm)
        const yPos = (y / height) * pageHeight;

        // Ignorer les zones de bords
        if (yPos < edgeWidth || yPos > pageHeight - edgeWidth) {
          // Si on était dans une zone, la fermer avant d'entrer dans le bord
          if (inZone && zoneStart !== -1) {
            const zoneEnd = y - 1;
            const startMark = (zoneStart / height) * pageHeight;
            const endMark = (zoneEnd / height) * pageHeight;
            const zoneHeight = endMark - startMark;

            zones.push({
              startMark: this.roundValue(startMark, precision),
              endMark: this.roundValue(endMark, precision),
              height: this.roundValue(zoneHeight, precision),
              isEdgeFold: false,
            });

            inZone = false;
            zoneStart = -1;
          }
          continue;
        }

        // Détecter si le pixel est foncé (comme Inverted)
        const isDark = gray < threshold;

        if (isDark && !inZone) {
          inZone = true;
          zoneStart = y;
        } else if (!isDark && inZone) {
          const zoneEnd = y - 1;
          const startMark = (zoneStart / height) * pageHeight;
          const endMark = (zoneEnd / height) * pageHeight;
          const zoneHeight = endMark - startMark;

          zones.push({
            startMark: this.roundValue(startMark, precision),
            endMark: this.roundValue(endMark, precision),
            height: this.roundValue(zoneHeight, precision),
            isEdgeFold: false,
          });

          inZone = false;
          zoneStart = -1;
        }
      }

      // Si on est encore dans une zone à la fin de la zone centrale, la fermer
      if (inZone && zoneStart !== -1) {
        const zoneEnd = height - 1;
        const yPos = (zoneEnd / height) * pageHeight;

        // Vérifier qu'on est toujours dans la zone centrale
        if (yPos <= pageHeight - edgeWidth) {
          const startMark = (zoneStart / height) * pageHeight;
          const endMark = Math.min((zoneEnd / height) * pageHeight, pageHeight - edgeWidth);
          const zoneHeight = endMark - startMark;

          zones.push({
            startMark: this.roundValue(startMark, precision),
            endMark: this.roundValue(endMark, precision),
            height: this.roundValue(zoneHeight, precision),
            isEdgeFold: false,
          });
        }
      }

      // Trier les zones par startMark
      zones.sort((a, b) => a.startMark - b.startMark);

      pattern.push({
        page: page + 1,
        zones: zones,
        hasContent: zones.length > 2, // Au moins les 2 bords + 1 zone centrale
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
   * Applique le Mode Combi à l'image traitée
   */
  static async execute(
    imageData: ImageProcessingResult,
    params: CutModeParams
  ): Promise<CutModeResult> {
    try {
      console.log('Exécution du Mode Combi avec les paramètres:', params);

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
      const edgeWidth = params.combiEdgeWidth ?? 2;

      const pageHeightInCm =
        params.pageHeightUnit === 'in'
          ? params.pageHeight * 2.54
          : params.pageHeight;

      // Validation: les bords ne doivent pas dépasser la moitié de la hauteur
      if (edgeWidth * 2 >= pageHeightInCm) {
        return {
          success: false,
          message: `La largeur des bords (${edgeWidth}cm) est trop grande pour la hauteur de page (${pageHeightInCm}cm)`,
        };
      }

      const physicalPages = Math.ceil(params.lastPageNumber / 2);

      console.log(`📖 Combi (edge: ${edgeWidth}cm) - Dernière page: ${params.lastPageNumber} → ${physicalPages} pages physiques`);

      const imgData = await this.getImageData(imageData.processedImage);
      const pattern = this.generatePattern(
        imgData,
        physicalPages,
        pageHeightInCm,
        threshold,
        precision,
        edgeWidth
      );

      const pagesWithContent = pattern.filter((p) => p.hasContent).length;
      const totalZones = pattern.reduce((sum, p) => sum + p.zones.length, 0);
      const edgeFolds = pattern.reduce((sum, p) => sum + p.zones.filter(z => z.isEdgeFold).length, 0);
      const centerFolds = totalZones - edgeFolds;

      console.log(`Pattern Combi généré: ${pagesWithContent}/${physicalPages} pages avec contenu, ${totalZones} zones (${edgeFolds} bords + ${centerFolds} centre)`);

      return {
        success: true,
        message: `Combi appliqué avec succès (${pagesWithContent} pages avec contenu)`,
        data: {
          mode: 'Combi',
          pattern: pattern,
          processedAt: new Date().toISOString(),
          combiEdgeWidth: edgeWidth,
        },
      };
    } catch (error) {
      console.error('Erreur lors de l\'exécution du Combi:', error);
      return {
        success: false,
        message: `Erreur lors de l'exécution du Combi: ${error}`,
      };
    }
  }
}
