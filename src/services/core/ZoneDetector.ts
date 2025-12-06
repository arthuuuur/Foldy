/**
 * Service réutilisable pour la détection de zones dans une image
 * Utilisé par tous les modes de découpe
 */

import { PrecisionManager, PrecisionType } from './PrecisionManager';

export interface DetectionConfig {
  imageData: ImageData;
  columnX: number;
  threshold: number;
  pageHeightCm: number;
  precision: PrecisionType;
  detectDark: boolean; // true = zones sombres, false = zones claires
}

export interface DetectedZone {
  startMark: number; // en cm
  endMark: number; // en cm
  height: number; // en cm
}

export class ZoneDetector {
  /**
   * Détecte les zones sur une colonne de pixels
   * Retourne les zones détectées avec positions en cm
   */
  static detectZones(config: DetectionConfig): DetectedZone[] {
    const { imageData, columnX, threshold, pageHeightCm, precision, detectDark } = config;
    const zones: DetectedZone[] = [];

    const imageHeight = imageData.height;
    let inZone = false;
    let zoneStart = 0;

    for (let y = 0; y < imageHeight; y++) {
      const pixelIndex = (y * imageData.width + columnX) * 4;
      const grayValue = imageData.data[pixelIndex]; // Grayscale => R=G=B

      const isTarget = detectDark ? grayValue < threshold : grayValue >= threshold;

      if (isTarget && !inZone) {
        // Début de zone
        inZone = true;
        zoneStart = y;
      } else if (!isTarget && inZone) {
        // Fin de zone
        inZone = false;
        zones.push(this.createZone(zoneStart, y, imageHeight, pageHeightCm, precision));
      }
    }

    // Zone se termine à la fin de l'image
    if (inZone) {
      zones.push(this.createZone(zoneStart, imageHeight, imageHeight, pageHeightCm, precision));
    }

    return zones;
  }

  /**
   * Crée une zone avec conversion pixel -> cm et application précision
   */
  private static createZone(
    startPixel: number,
    endPixel: number,
    imageHeight: number,
    pageHeightCm: number,
    precision: PrecisionType
  ): DetectedZone {
    const startMarkRaw = (startPixel / imageHeight) * pageHeightCm;
    const endMarkRaw = (endPixel / imageHeight) * pageHeightCm;

    const startMark = PrecisionManager.format(startMarkRaw, precision);
    const endMark = PrecisionManager.format(endMarkRaw, precision);
    const height = PrecisionManager.format(endMark - startMark, precision);

    return { startMark, endMark, height };
  }

  /**
   * Inverse les zones détectées (retourne les "trous")
   * Utilisé par Inverted et Embossed pour la preview 3D
   */
  static invertZones(zones: DetectedZone[], pageHeightCm: number, precision: PrecisionType): DetectedZone[] {
    if (zones.length === 0) {
      return [
        {
          startMark: 0,
          endMark: pageHeightCm,
          height: pageHeightCm,
        },
      ];
    }

    const inverted: DetectedZone[] = [];

    // Zone avant la première
    if (zones[0].startMark > 0) {
      const height = PrecisionManager.format(zones[0].startMark, precision);
      inverted.push({
        startMark: 0,
        endMark: zones[0].startMark,
        height,
      });
    }

    // Zones entre chaque zone détectée
    for (let i = 0; i < zones.length - 1; i++) {
      const start = zones[i].endMark;
      const end = zones[i + 1].startMark;
      const height = PrecisionManager.format(end - start, precision);

      if (height > 0) {
        inverted.push({ startMark: start, endMark: end, height });
      }
    }

    // Zone après la dernière
    const lastZone = zones[zones.length - 1];
    if (lastZone.endMark < pageHeightCm) {
      const height = PrecisionManager.format(pageHeightCm - lastZone.endMark, precision);
      inverted.push({
        startMark: lastZone.endMark,
        endMark: pageHeightCm,
        height,
      });
    }

    return inverted;
  }
}
