/**
 * Utilitaires pour la gestion des mesures et conversions
 */

import { Precision, MeasurementUnit } from '../types/cutMode.types';
import { GENERATION } from '../constants/app.constants';

/**
 * Arrondit une valeur selon la précision choisie
 * @param value - Valeur en cm à arrondir
 * @param precision - Précision d'arrondi
 * @returns Valeur arrondie en cm
 *
 * @example
 * roundValue(1.2345, '0.1mm') // 1.2
 * roundValue(1.2345, '1mm') // 1.2
 * roundValue(1.2345, 'exact') // 1.2345
 */
export function roundValue(value: number, precision: Precision): number {
  if (precision === 'exact') {
    return value;
  }

  // Convertir en mm pour l'arrondi
  const valueMm = value * 10;
  let roundedMm: number;

  switch (precision) {
    case '0.1mm':
      roundedMm = Math.round(valueMm * 10) / 10;
      break;
    case '0.5mm':
      roundedMm = Math.round(valueMm * 2) / 2;
      break;
    case '1mm':
      roundedMm = Math.round(valueMm);
      break;
  }

  // Reconvertir en cm
  return roundedMm / 10;
}

/**
 * Convertit une hauteur dans l'unité spécifiée vers des centimètres
 * @param height - Hauteur à convertir
 * @param unit - Unité de la hauteur
 * @returns Hauteur en centimètres
 *
 * @example
 * convertToCm(10, 'in') // 25.4
 * convertToCm(10, 'cm') // 10
 */
export function convertToCm(height: number, unit: MeasurementUnit): number {
  return unit === 'in' ? height * GENERATION.INCH_TO_CM : height;
}

/**
 * Calcule le nombre de pages physiques à partir du numéro de la dernière page
 * Chaque page physique a 2 faces (recto-verso)
 * @param lastPageNumber - Numéro de la dernière page
 * @returns Nombre de pages physiques
 *
 * @example
 * calculatePhysicalPages(10) // 5
 * calculatePhysicalPages(11) // 6 (arrondi supérieur)
 */
export function calculatePhysicalPages(lastPageNumber: number): number {
  return Math.ceil(lastPageNumber / 2);
}
