/**
 * Utilitaires pour la détection des zones de pliage dans les images
 */

import { FoldZone, Precision } from '../types/cutMode.types';
import { getPixelGray, pixelToPagePosition } from './image.utils';
import { roundValue } from './measurement.utils';

/**
 * Type de détection pour les zones
 */
export type DetectionType = 'dark' | 'light';

/**
 * Paramètres pour la détection de zones
 */
export interface ZoneDetectionParams {
  imageData: ImageData;
  columnX: number;
  pageHeight: number;
  threshold: number;
  precision: Precision;
  detectionType: DetectionType;
}

/**
 * Détecte les zones de pliage sur une colonne d'image
 * @param params - Paramètres de détection
 * @returns Tableau de zones de pliage détectées
 *
 * @example
 * const zones = detectZonesInColumn({
 *   imageData,
 *   columnX: 10,
 *   pageHeight: 20,
 *   threshold: 128,
 *   precision: '0.1mm',
 *   detectionType: 'dark'
 * });
 */
export function detectZonesInColumn(params: ZoneDetectionParams): FoldZone[] {
  const { imageData, columnX, pageHeight, threshold, precision, detectionType } = params;
  const { width, height } = imageData;

  // Vérifier les limites
  if (columnX < 0 || columnX >= width) {
    return [];
  }

  const zones: FoldZone[] = [];
  let inZone = false;
  let zoneStart = -1;

  // Fonction pour vérifier si un pixel correspond au critère de détection
  const matchesDetection = (grayValue: number): boolean => {
    return detectionType === 'dark'
      ? grayValue < threshold
      : grayValue >= threshold;
  };

  // Parcourir la colonne de haut en bas
  for (let y = 0; y < height; y++) {
    const gray = getPixelGray(imageData, columnX, y);
    const matches = matchesDetection(gray);

    if (matches && !inZone) {
      // Début d'une nouvelle zone
      inZone = true;
      zoneStart = y;
    } else if (!matches && inZone) {
      // Fin de la zone
      const zone = createZone(zoneStart, y - 1, height, pageHeight, precision);
      zones.push(zone);
      inZone = false;
      zoneStart = -1;
    }
  }

  // Si on est encore dans une zone à la fin, la fermer
  if (inZone && zoneStart !== -1) {
    const zone = createZone(zoneStart, height - 1, height, pageHeight, precision);
    zones.push(zone);
  }

  return zones;
}

/**
 * Crée un objet FoldZone à partir des positions pixel
 * @param startPixel - Pixel de début
 * @param endPixel - Pixel de fin
 * @param totalPixels - Nombre total de pixels (hauteur image)
 * @param pageHeight - Hauteur de la page en cm
 * @param precision - Précision d'arrondi
 * @returns Zone de pliage
 */
function createZone(
  startPixel: number,
  endPixel: number,
  totalPixels: number,
  pageHeight: number,
  precision: Precision
): FoldZone {
  const startMark = pixelToPagePosition(startPixel, totalPixels, pageHeight);
  const endMark = pixelToPagePosition(endPixel, totalPixels, pageHeight);
  const height = endMark - startMark;

  return {
    startMark: roundValue(startMark, precision),
    endMark: roundValue(endMark, precision),
    height: roundValue(height, precision),
  };
}

/**
 * Calcule la position X de la colonne correspondant à une page
 * @param page - Numéro de page (0-indexed)
 * @param totalPages - Nombre total de pages
 * @param imageWidth - Largeur de l'image
 * @returns Position X de la colonne
 */
export function getColumnXForPage(
  page: number,
  totalPages: number,
  imageWidth: number
): number {
  const pixelsPerPage = imageWidth / totalPages;
  const bookX = page * pixelsPerPage;
  return Math.floor(bookX);
}
