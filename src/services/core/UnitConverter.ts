/**
 * Service centralisé pour la conversion d'unités
 * Toutes les conversions cm/in passent par ce service
 */

export type Unit = 'cm' | 'in';

export class UnitConverter {
  private static readonly CM_TO_INCH = 2.54;

  /**
   * Convertit toujours vers CM (unité interne de calcul)
   */
  static toCm(value: number, unit: Unit): number {
    return unit === 'in' ? value * this.CM_TO_INCH : value;
  }

  /**
   * Convertit depuis CM vers l'unité souhaitée
   */
  static fromCm(valueCm: number, targetUnit: Unit): number {
    return targetUnit === 'in' ? valueCm / this.CM_TO_INCH : valueCm;
  }

  /**
   * Convertit une valeur d'une unité à une autre
   */
  static convert(value: number, fromUnit: Unit, toUnit: Unit): number {
    if (fromUnit === toUnit) return value;
    const cm = this.toCm(value, fromUnit);
    return this.fromCm(cm, toUnit);
  }

  /**
   * Calcule le nombre de pages physiques
   * Une feuille physique = 2 numéros de page
   */
  static calculatePhysicalPages(lastPageNumber: number): number {
    return Math.ceil(lastPageNumber / 2);
  }
}
