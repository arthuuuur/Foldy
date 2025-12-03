/**
 * Utilitaires pour la validation des paramètres
 */

import { CutModeParams, CutModeResult } from '../types/cutMode.types';
import { ERROR_MESSAGES, VALIDATION } from '../constants/app.constants';

/**
 * Valide les paramètres de base pour un mode de découpe
 * @param params - Paramètres à valider
 * @returns Résultat avec succès ou message d'erreur
 *
 * @example
 * const result = validateCutModeParams({ lastPageNumber: 10, pageHeight: 20 });
 * if (!result.success) {
 *   console.error(result.message);
 * }
 */
export function validateCutModeParams(params: CutModeParams): CutModeResult {
  // Validation du nombre de pages
  if (!params.lastPageNumber || params.lastPageNumber < VALIDATION.MIN_PAGES) {
    return {
      success: false,
      message: ERROR_MESSAGES.INVALID_PAGE_COUNT,
    };
  }

  // Validation de la hauteur de page
  if (
    !params.pageHeight ||
    params.pageHeight < VALIDATION.MIN_PAGE_HEIGHT ||
    params.pageHeight > VALIDATION.MAX_PAGE_HEIGHT
  ) {
    return {
      success: false,
      message: ERROR_MESSAGES.INVALID_PAGE_HEIGHT,
    };
  }

  return {
    success: true,
    message: 'Validation réussie',
  };
}

/**
 * Récupère les paramètres avec valeurs par défaut
 * @param params - Paramètres fournis
 * @returns Paramètres avec valeurs par défaut appliquées
 *
 * @example
 * const params = getParamsWithDefaults({ lastPageNumber: 10, pageHeight: 20 });
 * // params.threshold sera 128 (valeur par défaut)
 * // params.precision sera '0.1mm' (valeur par défaut)
 */
export function getParamsWithDefaults(params: CutModeParams) {
  return {
    threshold: params.threshold ?? 128,
    precision: params.precision ?? '0.1mm' as const,
    pageHeightUnit: params.pageHeightUnit ?? 'cm' as const,
  };
}
