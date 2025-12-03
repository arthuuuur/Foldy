/**
 * Constantes de l'application Foldy
 * Ce fichier centralise toutes les valeurs configurables et magic numbers
 * pour faciliter la maintenance et la cohérence
 */

/**
 * Constantes pour le traitement d'image
 */
export const IMAGE_PROCESSING = {
  /** Seuil par défaut pour la détection des zones (0-255) */
  DEFAULT_THRESHOLD: 128,
  /** Coefficients de luminance pour la conversion en niveaux de gris */
  LUMINANCE: {
    RED: 0.299,
    GREEN: 0.587,
    BLUE: 0.114,
  },
} as const;

/**
 * Constantes pour les paramètres de génération
 */
export const GENERATION = {
  /** Précision par défaut pour l'arrondi des mesures */
  DEFAULT_PRECISION: '0.1mm' as const,
  /** Facteur de conversion pouces vers centimètres */
  INCH_TO_CM: 2.54,
} as const;

/**
 * Constantes pour la visualisation 3D
 */
export const VISUALIZATION_3D = {
  /** Épaisseur de base d'une page (en unités 3D) */
  BASE_PAGE_THICKNESS: 0.01,
  /** Facteur multiplicateur pour l'épaisseur des plis */
  FOLD_THICKNESS_FACTOR: 0.015,
  /** Épaisseur de la couverture */
  COVER_THICKNESS: 0.3,
  /** Position par défaut de la caméra */
  CAMERA: {
    POSITION_X: 5,
    POSITION_Y: 3,
    POSITION_Z: 5,
    FOV: 50,
  },
} as const;

/**
 * Constantes pour la validation
 */
export const VALIDATION = {
  /** Nombre minimum de pages */
  MIN_PAGES: 1,
  /** Hauteur minimale de page (en cm) */
  MIN_PAGE_HEIGHT: 0.1,
  /** Hauteur maximale de page (en cm) */
  MAX_PAGE_HEIGHT: 100,
} as const;

/**
 * Messages d'erreur standardisés
 */
export const ERROR_MESSAGES = {
  INVALID_PAGE_COUNT: 'Le nombre de pages doit être spécifié et supérieur à 0',
  INVALID_PAGE_HEIGHT: 'La hauteur de page doit être spécifiée et supérieure à 0',
  CANVAS_CONTEXT_ERROR: 'Impossible de créer le contexte canvas',
  IMAGE_LOAD_ERROR: 'Erreur lors du chargement de l\'image',
} as const;

/**
 * Constantes pour les modes de découpe
 */
export const CUT_MODES = {
  INVERTED: 'Inverted',
  EMBOSSED: 'Embossed',
  COMBI: 'Combi',
  SHADOW_FOLD: 'ShadowFold',
  MMF: 'MMF',
} as const;

/**
 * Type helper pour les modes de découpe
 */
export type CutModeType = typeof CUT_MODES[keyof typeof CUT_MODES];
