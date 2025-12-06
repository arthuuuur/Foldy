/**
 * Classe de base abstraite pour tous les modes de découpe
 * Élimine la duplication en centralisant la logique commune
 */

import { UnitConverter } from '../../core/UnitConverter';
import { PrecisionType } from '../../core/PrecisionManager';
import { ZoneDetector } from '../../core/ZoneDetector';
import { GenerationParams, GenerationResult, PagePattern } from './types';

interface GenerationContext {
  imageData: ImageData;
  pageHeightCm: number;
  physicalPages: number;
  threshold: number;
  precision: PrecisionType;
  params: GenerationParams;
}

export abstract class CutModeBase {
  /**
   * Nom du mode (à définir dans chaque classe)
   */
  protected abstract readonly modeName: string;

  /**
   * Type de zone à détecter
   * true = zones sombres (< threshold)
   * false = zones claires (>= threshold)
   */
  protected abstract readonly detectDarkZones: boolean;

  /**
   * Point d'entrée principal - Template Method Pattern
   */
  async execute(params: GenerationParams): Promise<GenerationResult> {
    try {
      // Validation
      this.validateParams(params);

      // Charger l'image
      const imageData = await this.loadImageData(params.processedImage);

      // Convertir hauteur page en cm (unité interne)
      const pageHeightCm = UnitConverter.toCm(params.pageHeight, params.pageHeightUnit);

      // Calculer nombre de pages physiques
      const physicalPages = UnitConverter.calculatePhysicalPages(params.lastPageNumber);

      // Générer le pattern
      const pattern = this.generatePattern({
        imageData,
        pageHeightCm,
        physicalPages,
        threshold: params.threshold,
        precision: params.precision,
        params,
      });

      return {
        success: true,
        message: `Pattern ${this.modeName} généré avec succès`,
        data: {
          mode: this.modeName,
          pattern,
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur génération ${this.modeName}: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Génération du pattern - Logique par défaut
   * Peut être override pour logique custom (Combi, ShadowFold, MMF)
   */
  protected generatePattern(context: GenerationContext): PagePattern[] {
    const { imageData, pageHeightCm, physicalPages, threshold, precision } = context;
    const pattern: PagePattern[] = [];
    const pixelsPerPage = imageData.width / physicalPages;

    for (let page = 0; page < physicalPages; page++) {
      const columnX = Math.floor(page * pixelsPerPage);

      const zones = ZoneDetector.detectZones({
        imageData,
        columnX,
        threshold,
        pageHeightCm,
        precision,
        detectDark: this.detectDarkZones,
      });

      pattern.push({
        page: page + 1,
        zones,
        hasContent: zones.length > 0,
      });
    }

    return pattern;
  }

  /**
   * Charge ImageData depuis base64
   */
  protected async loadImageData(base64Image: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, img.width, img.height));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64Image;
    });
  }

  /**
   * Validation des paramètres
   */
  protected validateParams(params: GenerationParams): void {
    if (!params.processedImage) {
      throw new Error('Image traitée manquante');
    }
    if (params.threshold < 0 || params.threshold > 255) {
      throw new Error('Threshold doit être entre 0 et 255');
    }
    if (params.pageHeight <= 0) {
      throw new Error('Hauteur de page doit être > 0');
    }
    if (params.lastPageNumber <= 0) {
      throw new Error('Nombre de pages doit être > 0');
    }
  }
}
