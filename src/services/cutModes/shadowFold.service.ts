/**
 * Service pour le Mode Shadow Fold
 * Variation de Inverted où on saute des pages pour un effet plus subtil
 * Regular: Fold 1, Skip 1
 * 2/3: Fold 2, Skip 1
 */

import { ImageProcessingResult } from '../imageProcessing.service';

export interface CutModeParams {
  lastPageNumber?: number;
  pageHeight?: number;
  pageHeightUnit?: 'cm' | 'in';
  threshold?: number;
  precision?: 'exact' | '0.1mm' | '0.5mm' | '1mm';
  shadowFoldType?: 'regular' | '2/3';
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
  isSkipped?: boolean; // Pages sautées dans le pattern Shadow Fold
}

export interface CutModeResult {
  success: boolean;
  message: string;
  data?: {
    mode: string;
    pattern?: PagePattern[];
    processedAt: string;
    shadowFoldType?: string;
  };
}

export class ShadowFoldService {
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
   * Détermine si une page doit être sautée selon le type de Shadow Fold
   */
  private static shouldSkipPage(pageIndex: number, shadowFoldType: 'regular' | '2/3'): boolean {
    if (shadowFoldType === 'regular') {
      // Regular: Fold 1, Skip 1 (skip pages 1, 3, 5, 7...)
      return pageIndex % 2 === 1;
    } else {
      // 2/3: Fold 2, Skip 1 (skip pages 2, 5, 8, 11...)
      return (pageIndex + 1) % 3 === 0;
    }
  }

  /**
   * Génère le pattern Shadow Fold - comme Inverted mais avec des pages sautées
   */
  private static generatePattern(
    imageData: ImageData,
    bookPages: number,
    pageHeight: number,
    threshold: number,
    precision: 'exact' | '0.1mm' | '0.5mm' | '1mm' = '0.1mm',
    shadowFoldType: 'regular' | '2/3' = 'regular'
  ): PagePattern[] {
    const { width, height, data } = imageData;
    const pattern: PagePattern[] = [];
    const pixelsPerPage = width / bookPages;

    for (let page = 0; page < bookPages; page++) {
      const bookX = page * pixelsPerPage;
      const x = Math.floor(bookX);

      // Vérifier si cette page doit être sautée
      const isSkipped = this.shouldSkipPage(page, shadowFoldType);

      if (x < 0 || x >= width || isSkipped) {
        pattern.push({
          page: page + 1,
          zones: [],
          hasContent: false,
          isSkipped: isSkipped,
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
        isSkipped: false,
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
   * Applique le Mode Shadow Fold à l'image traitée
   */
  static async execute(
    imageData: ImageProcessingResult,
    params: CutModeParams
  ): Promise<CutModeResult> {
    try {
      console.log('Exécution du Mode Shadow Fold avec les paramètres:', params);

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
      const shadowFoldType = params.shadowFoldType ?? 'regular';

      const pageHeightInCm =
        params.pageHeightUnit === 'in'
          ? params.pageHeight * 2.54
          : params.pageHeight;

      const physicalPages = Math.ceil(params.lastPageNumber / 2);

      console.log(`📖 Shadow Fold (${shadowFoldType}) - Dernière page: ${params.lastPageNumber} → ${physicalPages} pages physiques`);

      const imgData = await this.getImageData(imageData.processedImage);
      const pattern = this.generatePattern(
        imgData,
        physicalPages,
        pageHeightInCm,
        threshold,
        precision,
        shadowFoldType
      );

      const pagesWithContent = pattern.filter((p) => p.hasContent).length;
      const skippedPages = pattern.filter((p) => p.isSkipped).length;
      const totalZones = pattern.reduce((sum, p) => sum + p.zones.length, 0);

      console.log(`Pattern Shadow Fold généré: ${pagesWithContent}/${physicalPages} pages avec contenu, ${skippedPages} pages sautées, ${totalZones} zones au total`);

      return {
        success: true,
        message: `Shadow Fold (${shadowFoldType}) appliqué avec succès (${pagesWithContent} pages avec contenu, ${skippedPages} pages sautées)`,
        data: {
          mode: 'Shadow Fold',
          pattern: pattern,
          processedAt: new Date().toISOString(),
          shadowFoldType: shadowFoldType,
        },
      };
    } catch (error) {
      console.error('Erreur lors de l\'exécution du Shadow Fold:', error);
      return {
        success: false,
        message: `Erreur lors de l'exécution du Shadow Fold: ${error}`,
      };
    }
  }
}
