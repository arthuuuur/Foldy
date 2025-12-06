/**
 * Mode Embossed - Zones claires pliées (inverse de Inverted)
 * Détecte les zones claires au lieu des zones sombres
 */

import { CutModeBase } from './base/CutModeBase';

export class EmbossedMode extends CutModeBase {
  protected readonly modeName = 'embossed';
  protected readonly detectDarkZones = false; // Zones claires (>= threshold)
}
