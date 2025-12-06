/**
 * Mode Shadow Fold - Variation de Inverted avec pages sautées
 * '1:1' = Fold 1, Skip 1 (skip pages 1, 3, 5, 7...)
 * '2:1' = Fold 2, Skip 1 (skip pages 2, 5, 8, 11...)
 */

import { CutModeBase } from './base/CutModeBase';
import { PagePattern } from './base/types';

export class ShadowFoldMode extends CutModeBase {
  protected readonly modeName = 'shadowFold';
  protected readonly detectDarkZones = true; // Zones sombres

  /**
   * Override pour ajouter la logique de skip
   */
  protected generatePattern(context: any): PagePattern[] {
    const pattern = super.generatePattern(context);
    const shadowFoldType = context.params.shadowFoldType || '1:1';

    // Marquer les pages à sauter
    pattern.forEach((page, index) => {
      page.isSkipped = this.shouldSkipPage(index, shadowFoldType);

      // Si page sautée, vider les zones
      if (page.isSkipped) {
        page.zones = [];
        page.hasContent = false;
      }
    });

    return pattern;
  }

  /**
   * Détermine si une page doit être sautée
   */
  private shouldSkipPage(pageIndex: number, shadowFoldType: '1:1' | '2:1'): boolean {
    if (shadowFoldType === '1:1') {
      // Regular: Fold 1, Skip 1 (skip pages 1, 3, 5, 7...)
      return pageIndex % 2 === 1;
    } else {
      // 2/3: Fold 2, Skip 1 (skip pages 2, 5, 8, 11...)
      return (pageIndex + 1) % 3 === 0;
    }
  }
}
