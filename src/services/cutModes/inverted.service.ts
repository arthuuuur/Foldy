/**
 * Service pour le Mode Inverted (Innie)
 * Les espaces REMPLIS (zones sombres) sont pliés vers l'intérieur
 * Analyse l'image colonne par colonne pour détecter les zones de pliage
 */

import { ImageProcessingResult } from '../imageProcessing.service';

export interface CutModeParams {
  lastPageNumber?: number;
  pageHeight?: number;
  pageHeightUnit?: 'cm' | 'in';
  threshold?: number;
  precision?: 'exact' | '0.1mm' | '0.5mm' | '1mm';
}

export interface FoldZone {
  startMark: number;
  endMark: number;
  height: number;
}

export interface PagePattern {
  page: number;
  zones: FoldZone[];
  hasContent: boolean;
}

export interface CutModeResult {
  success: boolean;
  message: string;
  data?: {
    mode: string;
    pattern?: PagePattern[];
    processedAt: string;
  };
}

export class InvertedService {
  /**
   * Arrondit une valeur selon la précision choisie
   * @param value - Valeur en cm à arrondir
   * @param precision - Précision d'arrondi
   * @returns Valeur arrondie
   */
  private static roundValue(value: number, precision: 'exact' | '0.1mm' | '0.5mm' | '1mm'): number {
    if (precision === 'exact') {
      return value;
    }

    // Convertir en mm, arrondir, reconvertir en cm
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

    return roundedMm / 10; // Reconvertir en cm
  }

  /**
   * Génère le pattern de pliage basé sur l'analyse de l'image
   * @param imageData - Les données de l'image traitée en niveaux de gris
   * @param bookPages - Nombre de pages du livre
   * @param pageHeight - Hauteur de la page
   * @param threshold - Seuil de détection (0-255)
   * @param precision - Précision d'arrondi des valeurs
   * @returns Le pattern de pliage pour chaque page
   */
  private static generatePattern(
    imageData: ImageData,
    bookPages: number,
    pageHeight: number,
    threshold: number,
    precision: 'exact' | '0.1mm' | '0.5mm' | '1mm' = '0.1mm'
  ): PagePattern[] {
    const { width, height, data } = imageData;
    const pattern: PagePattern[] = [];

    // Combien de colonnes de pixels par page ?
    const pixelsPerPage = width / bookPages;

    for (let page = 0; page < bookPages; page++) {
      // Quelle position X dans l'espace du livre correspond à cette page ?
      const bookX = page * pixelsPerPage;

      // Convertir en coordonnées de pixel
      const x = Math.floor(bookX);

      // Vérifier si cette page est dans les limites de l'image
      if (x < 0 || x >= width) {
        // Page en dehors de l'image, pas de zones
        pattern.push({
          page: page + 1,
          zones: [],
          hasContent: false,
        });
        continue;
      }

      // Détecter toutes les zones de pliage sur cette colonne (page)
      const zones: FoldZone[] = [];
      let inZone = false;
      let zoneStart = -1;

      // Parcourir la colonne de haut en bas
      for (let y = 0; y < height; y++) {
        // Lire le pixel de l'image
        const index = (y * width + x) * 4;
        const gray = data[index]; // Valeur en niveaux de gris (R = G = B)

        // Détecter si le pixel est foncé
        const isDark = gray < threshold;

        if (isDark && !inZone) {
          // Début d'une nouvelle zone (premier pixel foncé)
          inZone = true;
          zoneStart = y;
        } else if (!isDark && inZone) {
          // Fin de la zone (premier pixel clair après une zone foncée)
          const zoneEnd = y - 1;
          const startMark = (zoneStart / height) * pageHeight;
          const endMark = (zoneEnd / height) * pageHeight;
          const zoneHeight = endMark - startMark;

          zones.push({
            startMark: this.roundValue(startMark, precision),
            endMark: this.roundValue(endMark, precision),
            height: this.roundValue(zoneHeight, precision),
          });

          inZone = false;
          zoneStart = -1;
        }
      }

      // Si on est encore dans une zone à la fin, la fermer
      if (inZone && zoneStart !== -1) {
        const zoneEnd = height - 1;
        const startMark = (zoneStart / height) * pageHeight;
        const endMark = (zoneEnd / height) * pageHeight;
        const zoneHeight = endMark - startMark;

        zones.push({
          startMark: this.roundValue(startMark, precision),
          endMark: this.roundValue(endMark, precision),
          height: this.roundValue(zoneHeight, precision),
        });
      }

      pattern.push({
        page: page + 1,
        zones: zones,
        hasContent: zones.length > 0,
      });
    }

    return pattern;
  }

  /**
   * Extrait les données ImageData depuis une image base64
   * @param base64Image - Image en base64
   * @returns Promise avec les ImageData
   */
  private static async getImageData(base64Image: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };

      img.onerror = () => {
        reject(new Error('Erreur lors du chargement de l\'image'));
      };

      img.src = base64Image;
    });
  }

  /**
   * Applique le Mode Cut and Fold à l'image traitée
   * @param imageData - Les données de l'image traitée en niveaux de gris
   * @param params - Les paramètres de découpe
   * @returns Le résultat avec le pattern de pliage
   */
  static async execute(
    imageData: ImageProcessingResult,
    params: CutModeParams
  ): Promise<CutModeResult> {
    try {
      console.log('Exécution du Mode Inverted avec les paramètres:', params);

      // Validation des paramètres
      if (!params.lastPageNumber || params.lastPageNumber <= 0) {
        return {
          success: false,
          message: 'Le nombre de pages doit être spécifié et supérieur à 0',
        };
      }

      if (!params.pageHeight || params.pageHeight <= 0) {
        return {
          success: false,
          message: 'La hauteur de page doit être spécifiée et supérieure à 0',
        };
      }

      // Utiliser un threshold par défaut si non spécifié
      const threshold = params.threshold ?? 128;

      // Utiliser une précision par défaut si non spécifiée
      const precision = params.precision ?? '0.1mm';

      // Convertir la hauteur en cm si elle est en inches
      const pageHeightInCm =
        params.pageHeightUnit === 'in'
          ? params.pageHeight * 2.54
          : params.pageHeight;

      // Calculer le nombre de pages physiques
      // lastPageNumber est le numéro de la dernière page (ex: 10)
      // Nombre de pages physiques = lastPageNumber / 2 (car chaque page a 2 faces)
      const physicalPages = Math.ceil(params.lastPageNumber / 2);

      console.log(`📖 Inverted - Dernière page: ${params.lastPageNumber} → ${physicalPages} pages physiques`);

      // Extraire les ImageData depuis l'image base64
      const imgData = await this.getImageData(imageData.processedImage);

      // Générer le pattern
      const pattern = this.generatePattern(
        imgData,
        physicalPages,
        pageHeightInCm,
        threshold,
        precision
      );

      // Calculer des statistiques
      const pagesWithContent = pattern.filter((p) => p.hasContent).length;
      const totalZones = pattern.reduce((sum, p) => sum + p.zones.length, 0);

      console.log(`Pattern Inverted généré: ${pagesWithContent}/${physicalPages} pages physiques avec contenu, ${totalZones} zones au total`);

      return {
        success: true,
        message: `Inverted appliqué avec succès (${pagesWithContent} pages avec contenu)`,
        data: {
          mode: 'Inverted',
          pattern: pattern,
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Erreur lors de l\'exécution du Inverted:', error);
      return {
        success: false,
        message: `Erreur lors de l'exécution du Inverted: ${error}`,
      };
    }
  }
}
