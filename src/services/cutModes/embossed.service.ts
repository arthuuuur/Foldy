/**
 * Service pour le Mode Embossed (Outie)
 * Les espaces VIDES (zones claires) sont pliés, l'image ressort
 */

import { PagePattern } from '../../types/cutMode.types';
import { BaseCutModeService, GeneratePatternParams } from './base.cutMode.service';
import { detectZonesInColumn, getColumnXForPage } from '../../utils/zoneDetection.utils';
import { CUT_MODES } from '../../constants/app.constants';

/**
 * Service pour le mode Embossed
 * Hérite de la classe de base et implémente la logique spécifique
 */
export class EmbossedService extends BaseCutModeService {
  protected readonly modeName = CUT_MODES.EMBOSSED;

  /**
   * Génère le pattern Embossed - les zones CLAIRES sont pliées
   */
  protected generatePattern(params: GeneratePatternParams): PagePattern[] {
    const { imageData, bookPages, pageHeight, threshold, precision } = params;
    const { width } = imageData;
    const pattern: PagePattern[] = [];

    for (let page = 0; page < bookPages; page++) {
      const columnX = getColumnXForPage(page, bookPages, width);

      // Détecter les zones claires sur cette colonne
      const zones = detectZonesInColumn({
        imageData,
        columnX,
        pageHeight,
        threshold,
        precision,
        detectionType: 'light', // Embossed détecte les zones claires
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
const embossedService = new EmbossedService();

// Export de la méthode execute pour compatibilité
export const execute = embossedService.execute.bind(embossedService);

// Export de la classe pour les tests et extensions
export default EmbossedService;
