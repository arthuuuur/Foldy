/**
 * Service centralisé pour la gestion de la précision des calculs
 * Gère l'arrondi selon 3 modes: 0.1mm, 0.5mm, 1mm
 * Tous les résultats sont formatés avec max 2 décimales
 */

export type PrecisionType = '0.1mm' | '0.5mm' | '1mm';

export class PrecisionManager {
  /**
   * Arrondit une valeur (en cm) selon la précision choisie
   */
  static round(valueCm: number, precision: PrecisionType): number {
    const valueMm = valueCm * 10; // Convertir cm -> mm
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

    return roundedMm / 10; // Reconvertir mm -> cm
  }

  /**
   * Formate avec max 2 décimales (règle globale)
   */
  static format(valueCm: number, precision: PrecisionType): number {
    const rounded = this.round(valueCm, precision);
    return Math.round(rounded * 100) / 100;
  }

  /**
   * Applique la précision à un tableau de valeurs
   */
  static formatArray(values: number[], precision: PrecisionType): number[] {
    return values.map(v => this.format(v, precision));
  }
}
