/**
 * Service pour le Mode Inverted (Innie)
 * Les espaces REMPLIS (zones sombres) sont pliés vers l'intérieur
 * Analyse l'image colonne par colonne pour détecter les zones de pliage
 */

import { PagePattern } from '../../types/cutMode.types';
import { BaseCutModeService, GeneratePatternParams } from './base.cutMode.service';
import { detectZonesInColumn, getColumnXForPage } from '../../utils/zoneDetection.utils';
import { CUT_MODES } from '../../constants/app.constants';

/**
 * Service pour le mode Inverted
 * Hérite de la classe de base et implémente la logique spécifique
 */
export class InvertedService extends BaseCutModeService {
  protected readonly modeName = CUT_MODES.INVERTED;

  /**
   * Génère le pattern Inverted - les zones SOMBRES sont pliées
   */
  protected generatePattern(params: GeneratePatternParams): PagePattern[] {
    const { imageData, bookPages, pageHeight, threshold, precision } = params;
    const { width } = imageData;
    const pattern: PagePattern[] = [];

    for (let page = 0; page < bookPages; page++) {
      const columnX = getColumnXForPage(page, bookPages, width);

      // Détecter les zones sombres sur cette colonne
      const zones = detectZonesInColumn({
        imageData,
        columnX,
        pageHeight,
        threshold,
        precision,
        detectionType: 'dark', // Inverted détecte les zones sombres
      });

      pattern.push({
        page: page + 1,
        zones,
        hasContent: zones.length > 0,
      });
    }

    return pattern;
  }
}

// Instance singleton pour compatibilité avec l'ancien code
const invertedService = new InvertedService();

// Export de la méthode execute pour compatibilité
export const execute = invertedService.execute.bind(invertedService);

// Export de la classe pour les tests et extensions
export default InvertedService;
