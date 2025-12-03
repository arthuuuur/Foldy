/**
 * Utilitaires pour le traitement et l'analyse des images
 */

import { ERROR_MESSAGES } from '../constants/app.constants';

/**
 * Extrait les données ImageData depuis une image en base64
 * @param base64Image - Image encodée en base64
 * @returns Promise résolue avec les ImageData
 * @throws Error si le chargement échoue ou si le contexte canvas ne peut être créé
 *
 * @example
 * const imageData = await getImageData('data:image/png;base64,...');
 */
export async function getImageData(base64Image: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error(ERROR_MESSAGES.CANVAS_CONTEXT_ERROR));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };

    img.onerror = () => {
      reject(new Error(ERROR_MESSAGES.IMAGE_LOAD_ERROR));
    };

    img.src = base64Image;
  });
}

/**
 * Lit la valeur de gris d'un pixel dans ImageData
 * @param imageData - Données de l'image
 * @param x - Position X du pixel
 * @param y - Position Y du pixel
 * @returns Valeur de gris (0-255)
 *
 * @example
 * const gray = getPixelGray(imageData, 10, 20);
 */
export function getPixelGray(imageData: ImageData, x: number, y: number): number {
  const { width, data } = imageData;
  const index = (y * width + x) * 4;
  // Dans une image en niveaux de gris, R = G = B
  return data[index];
}

/**
 * Vérifie si un pixel est sombre selon un seuil
 * @param grayValue - Valeur de gris du pixel (0-255)
 * @param threshold - Seuil de détection
 * @returns true si le pixel est sombre
 *
 * @example
 * isDark(50, 128) // true
 * isDark(200, 128) // false
 */
export function isDark(grayValue: number, threshold: number): boolean {
  return grayValue < threshold;
}

/**
 * Vérifie si un pixel est clair selon un seuil
 * @param grayValue - Valeur de gris du pixel (0-255)
 * @param threshold - Seuil de détection
 * @returns true si le pixel est clair
 *
 * @example
 * isLight(200, 128) // true
 * isLight(50, 128) // false
 */
export function isLight(grayValue: number, threshold: number): boolean {
  return grayValue >= threshold;
}

/**
 * Convertit une position pixel en position physique sur la page
 * @param pixelPosition - Position en pixels
 * @param totalPixels - Nombre total de pixels (hauteur de l'image)
 * @param pageHeight - Hauteur de la page en cm
 * @returns Position en cm sur la page
 *
 * @example
 * pixelToPagePosition(100, 200, 20) // 10 (au milieu de la page)
 */
export function pixelToPagePosition(
  pixelPosition: number,
  totalPixels: number,
  pageHeight: number
): number {
  return (pixelPosition / totalPixels) * pageHeight;
}
