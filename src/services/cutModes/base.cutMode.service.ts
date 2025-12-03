/**
 * Classe de base abstraite pour tous les services de modes de découpe
 * Cette classe centralise la logique commune et impose une structure cohérente
 * pour tous les modes de découpe
 */

import { ImageProcessingResult } from '../imageProcessing.service';
import {
  CutModeParams,
  CutModeResult,
  PagePattern,
  Precision,
} from '../../types/cutMode.types';
import { getImageData } from '../../utils/image.utils';
import { validateCutModeParams, getParamsWithDefaults } from '../../utils/validation.utils';
import { convertToCm, calculatePhysicalPages } from '../../utils/measurement.utils';

/**
 * Interface pour les paramètres de génération de pattern
 */
export interface GeneratePatternParams {
  imageData: ImageData;
  bookPages: number;
  pageHeight: number;
  threshold: number;
  precision: Precision;
}

/**
 * Classe de base abstraite pour les services de cut modes
 */
export abstract class BaseCutModeService {
  /**
   * Nom du mode (doit être défini par les classes dérivées)
   */
  protected abstract readonly modeName: string;

  /**
   * Génère le pattern de pliage selon la logique spécifique du mode
   * Méthode abstraite à implémenter par chaque mode
   */
  protected abstract generatePattern(params: GeneratePatternParams): PagePattern[];

  /**
   * Exécute le mode de découpe sur l'image traitée
   * @param imageData - Résultat du traitement d'image
   * @param params - Paramètres de découpe
   * @returns Résultat avec le pattern généré
   */
  public async execute(
    imageData: ImageProcessingResult,
    params: CutModeParams
  ): Promise<CutModeResult> {
    try {
      console.log(`Exécution du Mode ${this.modeName} avec les paramètres:`, params);

      // Validation des paramètres
      const validationResult = validateCutModeParams(params);
      if (!validationResult.success) {
        return validationResult;
      }

      // Récupération des paramètres avec valeurs par défaut
      const { threshold, precision } = getParamsWithDefaults(params);

      // Conversion de la hauteur en cm
      const pageHeightInCm = convertToCm(
        params.pageHeight!,
        params.pageHeightUnit || 'cm'
      );

      // Calcul du nombre de pages physiques
      const physicalPages = calculatePhysicalPages(params.lastPageNumber!);

      console.log(
        `📖 ${this.modeName} - Dernière page: ${params.lastPageNumber} → ${physicalPages} pages physiques`
      );

      // Extraction des ImageData
      const imgData = await getImageData(imageData.processedImage);

      // Génération du pattern (logique spécifique au mode)
      const pattern = this.generatePattern({
        imageData: imgData,
        bookPages: physicalPages,
        pageHeight: pageHeightInCm,
        threshold,
        precision,
      });

      // Calcul des statistiques
      const stats = this.calculateStatistics(pattern, physicalPages);

      console.log(
        `Pattern ${this.modeName} généré: ${stats.pagesWithContent}/${physicalPages} pages avec contenu, ${stats.totalZones} zones au total`
      );

      return {
        success: true,
        message: `${this.modeName} appliqué avec succès (${stats.pagesWithContent} pages avec contenu)`,
        data: {
          mode: this.modeName,
          pattern: pattern,
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(`Erreur lors de l'exécution du ${this.modeName}:`, error);
      return {
        success: false,
        message: `Erreur lors de l'exécution du ${this.modeName}: ${error}`,
      };
    }
  }

  /**
   * Calcule les statistiques du pattern généré
   * @param pattern - Pattern à analyser
   * @param totalPages - Nombre total de pages
   * @returns Statistiques du pattern
   */
  protected calculateStatistics(pattern: PagePattern[], totalPages: number) {
    const pagesWithContent = pattern.filter((p) => p.hasContent).length;
    const totalZones = pattern.reduce((sum, p) => sum + p.zones.length, 0);

    return {
      pagesWithContent,
      totalPages,
      totalZones,
    };
  }
}
