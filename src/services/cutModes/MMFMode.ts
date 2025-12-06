/**
 * Mode MMF (Measure, Mark, Fold)
 * SANS coupe - uniquement des plis
 * Chaque page a exactement UNE zone qui englobe toutes les zones détectées
 */

import { CutModeBase } from './base/CutModeBase';
import { PagePattern, FoldZone } from './base/types';
import { ZoneDetector, DetectedZone } from '../core/ZoneDetector';
import { PrecisionManager } from '../core/PrecisionManager';

export class MMFMode extends CutModeBase {
  protected readonly modeName = 'mmf';
  protected readonly detectDarkZones = true; // Zones sombres

  /**
   * Override pour combiner toutes les zones en une seule
   */
  protected generatePattern(context: any): PagePattern[] {
    const { imageData, pageHeightCm, physicalPages, threshold, precision } = context;
    const pattern: PagePattern[] = [];
    const pixelsPerPage = imageData.width / physicalPages;

    for (let page = 0; page < physicalPages; page++) {
      const columnX = Math.floor(page * pixelsPerPage);

      // Détecter toutes les zones
      const detectedZones = ZoneDetector.detectZones({
        imageData,
        columnX,
        threshold,
        pageHeightCm,
        precision,
        detectDark: this.detectDarkZones,
      });

      // Combiner en UNE seule zone englobante
      const combinedZone = this.combineZones(detectedZones, precision);

      if (combinedZone) {
        pattern.push({
          page: page + 1,
          zones: [combinedZone],
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

    return pattern;
  }

  /**
   * Combine toutes les zones détectées en une seule zone englobante
   */
  private combineZones(zones: DetectedZone[], precision: any): FoldZone | null {
    if (zones.length === 0) {
      return null;
    }

    // Trouver le point le plus haut et le plus bas
    let minStart = zones[0].startMark;
    let maxEnd = zones[0].endMark;

    for (const zone of zones) {
      minStart = Math.min(minStart, zone.startMark);
      maxEnd = Math.max(maxEnd, zone.endMark);
    }

    return {
      startMark: PrecisionManager.format(minStart, precision),
      endMark: PrecisionManager.format(maxEnd, precision),
      height: PrecisionManager.format(maxEnd - minStart, precision),
    };
  }
}
