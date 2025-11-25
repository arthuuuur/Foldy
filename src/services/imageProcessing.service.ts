/**
 * Service de traitement d'image
 * Ce service s'occupe du pré-traitement de l'image uploadée
 */

export interface ImageProcessingResult {
  processedImage: string; // base64 ou URL de l'image traitée
  width: number;
  height: number;
  format: string;
}

export class ImageProcessingService {
  /**
   * Traite l'image uploadée avant de l'envoyer aux services de cut
   * @param file - Le fichier image à traiter
   * @returns Les données de l'image traitée
   */
  static async processImage(file: File): Promise<ImageProcessingResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Créer un canvas pour le traitement
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Impossible de créer le contexte canvas'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;

          // Dessiner l'image sur le canvas
          ctx.drawImage(img, 0, 0);

          // TODO: Ajouter ici les traitements d'image nécessaires
          // (redimensionnement, normalisation, etc.)

          // Convertir en base64
          const processedImage = canvas.toDataURL('image/png');

          resolve({
            processedImage,
            width: img.width,
            height: img.height,
            format: file.type,
          });
        };

        img.onerror = () => {
          reject(new Error('Erreur lors du chargement de l\'image'));
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };

      reader.readAsDataURL(file);
    });
  }
}
