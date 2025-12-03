/**
 * Types partagés pour les services de modes de découpe (Cut Modes)
 * Ce fichier centralise toutes les définitions de types utilisées par les différents services
 * pour éviter la duplication et garantir la cohérence
 */

/**
 * Unités de mesure supportées pour les dimensions
 */
export type MeasurementUnit = 'cm' | 'in';

/**
 * Niveaux de précision pour l'arrondi des valeurs
 */
export type Precision = 'exact' | '0.1mm' | '0.5mm' | '1mm';

/**
 * Paramètres communs à tous les modes de découpe
 */
export interface CutModeParams {
  /** Numéro de la dernière page du livre */
  lastPageNumber?: number;
  /** Hauteur d'une page */
  pageHeight?: number;
  /** Unité de mesure de la hauteur de page */
  pageHeightUnit?: MeasurementUnit;
  /** Seuil de détection des zones (0-255) */
  threshold?: number;
  /** Précision d'arrondi des mesures */
  precision?: Precision;
}

/**
 * Représente une zone de pliage sur une page
 */
export interface FoldZone {
  /** Position de début de la zone (en cm) */
  startMark: number;
  /** Position de fin de la zone (en cm) */
  endMark: number;
  /** Hauteur totale de la zone (en cm) */
  height: number;
}

/**
 * Pattern de pliage pour une page spécifique
 */
export interface PagePattern {
  /** Numéro de la page */
  page: number;
  /** Zones de pliage sur cette page */
  zones: FoldZone[];
  /** Indique si la page contient du contenu à plier */
  hasContent: boolean;
}

/**
 * Résultat de l'exécution d'un mode de découpe
 */
export interface CutModeResult {
  /** Indique si l'opération a réussi */
  success: boolean;
  /** Message de retour (succès ou erreur) */
  message: string;
  /** Données du résultat (si succès) */
  data?: {
    /** Nom du mode appliqué */
    mode: string;
    /** Pattern de pliage généré */
    pattern?: PagePattern[];
    /** Date/heure de traitement (ISO 8601) */
    processedAt: string;
  };
}
