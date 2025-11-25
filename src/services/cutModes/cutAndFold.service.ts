/**
 * Service pour le Mode Cut and Fold
 * Analyse l'image colonne par colonne pour détecter les zones de pliage
 */

import { ImageProcessingResult } from '../imageProcessing.service';

export interface CutModeParams {
  lastPageNumber?: number;
  pageHeight?: number;
  pageHeightUnit?: 'cm' | 'in';
  threshold?: number;
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

export class CutAndFoldService {
  /**
   * Génère le pattern de pliage basé sur l'analyse de l'image
   * @param imageData - Les données de l'image traitée en niveaux de gris
   * @param bookPages - Nombre de pages du livre
   * @param pageHeight - Hauteur de la page
   * @param threshold - Seuil de détection (0-255)
   * @returns Le pattern de pliage pour chaque page
   */
  private static generatePattern(
    imageData: ImageData,
    bookPages: number,
    pageHeight: number,
    threshold: number
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
            startMark: Math.round(startMark * 100) / 100, // Arrondir à 2 décimales
            endMark: Math.round(endMark * 100) / 100,
            height: Math.round(zoneHeight * 100) / 100,
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
          startMark: Math.round(startMark * 100) / 100,
          endMark: Math.round(endMark * 100) / 100,
          height: Math.round(zoneHeight * 100) / 100,
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
      console.log('Exécution du Mode Cut and Fold avec les paramètres:', params);

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

      // Convertir la hauteur en cm si elle est en inches
      const pageHeightInCm =
        params.pageHeightUnit === 'in'
          ? params.pageHeight * 2.54
          : params.pageHeight;

      // Extraire les ImageData depuis l'image base64
      const imgData = await this.getImageData(imageData.processedImage);

      // Générer le pattern
      const pattern = this.generatePattern(
        imgData,
        params.lastPageNumber,
        pageHeightInCm,
        threshold
      );

      // Calculer des statistiques
      const pagesWithContent = pattern.filter((p) => p.hasContent).length;
      const totalZones = pattern.reduce((sum, p) => sum + p.zones.length, 0);

      console.log(`Pattern généré: ${pagesWithContent}/${params.lastPageNumber} pages avec contenu, ${totalZones} zones au total`);

      return {
        success: true,
        message: `Cut and Fold appliqué avec succès (${pagesWithContent} pages avec contenu)`,
        data: {
          mode: 'Cut and Fold',
          pattern: pattern,
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Erreur lors de l\'exécution du Cut and Fold:', error);
      return {
        success: false,
        message: `Erreur lors de l'exécution du Cut and Fold: ${error}`,
      };
    }
  }
}
