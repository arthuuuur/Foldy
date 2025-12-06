/**
 * Mode Inverted - Zones sombres pliées vers l'intérieur
 * Le mode le plus simple, utilise directement la logique de base
 */

import { CutModeBase } from './base/CutModeBase';

export class InvertedMode extends CutModeBase {
  protected readonly modeName = 'inverted';
  protected readonly detectDarkZones = true; // Zones sombres (< threshold)
}
