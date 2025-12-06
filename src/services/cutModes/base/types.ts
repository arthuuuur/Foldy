/**
 * Types partagés pour tous les modes de découpe
 */

import { Unit } from '../../core/UnitConverter';
import { PrecisionType } from '../../core/PrecisionManager';

export interface GenerationParams {
  processedImage: string; // Base64 de l'image traitée
  threshold: number; // 0-255
  lastPageNumber: number;
  pageHeight: number;
  pageHeightUnit: Unit;
  bookDepth: number;
  cutDepth: number;
  precision: PrecisionType;

  // Paramètres spécifiques modes
  shadowFoldType?: '1:1' | '2:1';
  combiEdgeWidth?: number;
}

export interface FoldZone {
  startMark: number; // Distance depuis le haut (cm)
  endMark: number; // Distance depuis le haut (cm)
  height: number; // Hauteur de la zone (cm)
  isEdgeFold?: boolean; // Pour le mode Combi
}

export interface PagePattern {
  page: number; // Numéro de page (1-indexed)
  zones: FoldZone[]; // Zones de pliage
  hasContent: boolean; // Page a des zones ou non
  isSkipped?: boolean; // Pour Shadow Fold
}

export interface GenerationResult {
  success: boolean;
  message: string;
  data?: {
    mode: string;
    pattern: PagePattern[];
    processedAt: string;
  };
}
