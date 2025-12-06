/**
 * Mode Combi (Combined)
 * Étape 1: Plier les bords extérieurs (haut et bas)
 * Étape 2: Cut and Fold au centre
 */

import { CutModeBase } from './base/CutModeBase';
import { PagePattern, FoldZone } from './base/types';
import { PrecisionManager } from '../core/PrecisionManager';

export class CombiMode extends CutModeBase {
  protected readonly modeName = 'combi';
  protected readonly detectDarkZones = true; // Zones sombres pour le centre

  /**
   * Override pour ajouter les edge folds
   */
  protected generatePattern(context: any): PagePattern[] {
    // Générer le pattern de base (zones centrales)
    const pattern = super.generatePattern(context);

    const edgeWidth = context.params.combiEdgeWidth || 2; // Largeur par défaut 2cm
    const pageHeightCm = context.pageHeightCm;
    const precision = context.precision;

    // Ajouter edge folds top/bottom à chaque page
    pattern.forEach((page) => {
      const topEdge: FoldZone = {
        startMark: 0,
        endMark: PrecisionManager.format(edgeWidth, precision),
        height: PrecisionManager.format(edgeWidth, precision),
        isEdgeFold: true,
      };

      const bottomEdge: FoldZone = {
        startMark: PrecisionManager.format(pageHeightCm - edgeWidth, precision),
        endMark: PrecisionManager.format(pageHeightCm, precision),
        height: PrecisionManager.format(edgeWidth, precision),
        isEdgeFold: true,
      };

      // Edge folds en premier, puis zones centrales
      page.zones = [topEdge, bottomEdge, ...page.zones];
      page.hasContent = true; // Toujours du contenu avec edge folds
    });

    return pattern;
  }
}
