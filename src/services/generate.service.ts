/**
 * Service principal de génération
 * Orchestre le traitement de l'image et l'appel au service de cut approprié
 */

import { ImageProcessingService, ImageProcessingResult } from './imageProcessing.service';
import { Mode1Service } from './cutModes/mode1.service';
import { Mode2Service } from './cutModes/mode2.service';
import { Mode3Service } from './cutModes/mode3.service';
import { CutAndFoldService } from './cutModes/cutAndFold.service';
import type { CutModeParams as Mode1Params, CutModeResult } from './cutModes/mode1.service';
import type { CutModeParams as CutAndFoldParams } from './cutModes/cutAndFold.service';

export type CutMode = 'Mode 1' | 'Mode 2' | 'Mode 3' | 'Cut and Fold';

export interface GenerateParams {
  image: File;
  cutMode: CutMode;
  lastPageNumber?: number;
  pageHeight?: number;
  pageHeightUnit?: 'cm' | 'in';
  threshold?: number;
  precision?: 'exact' | '0.1mm' | '0.5mm' | '1mm';
}

export interface GenerateResult {
  success: boolean;
  message: string;
  imageProcessingResult?: ImageProcessingResult;
  cutModeResult?: CutModeResult;
}

export class GenerateService {
  /**
   * Génère le résultat en traitant l'image et en appliquant le mode de cut sélectionné
   * @param params - Les paramètres de génération
   * @returns Le résultat complet de la génération
   */
  static async generate(params: GenerateParams): Promise<GenerateResult> {
    try {
      // Étape 1: Traitement de l'image
      console.log('Étape 1: Traitement de l\'image...');
      const imageProcessingResult = await ImageProcessingService.processImage(params.image);

      // Étape 2: Application du mode de cut sélectionné
      console.log(`Étape 2: Application du ${params.cutMode}...`);

      let cutModeResult: CutModeResult;

      switch (params.cutMode) {
        case 'Mode 1': {
          const mode1Params: Mode1Params = {
            lastPageNumber: params.lastPageNumber,
            pageHeight: params.pageHeight,
            pageHeightUnit: params.pageHeightUnit,
          };
          cutModeResult = await Mode1Service.execute(imageProcessingResult, mode1Params);
          break;
        }
        case 'Mode 2': {
          const mode2Params: Mode1Params = {
            lastPageNumber: params.lastPageNumber,
            pageHeight: params.pageHeight,
            pageHeightUnit: params.pageHeightUnit,
          };
          cutModeResult = await Mode2Service.execute(imageProcessingResult, mode2Params);
          break;
        }
        case 'Mode 3': {
          const mode3Params: Mode1Params = {
            lastPageNumber: params.lastPageNumber,
            pageHeight: params.pageHeight,
            pageHeightUnit: params.pageHeightUnit,
          };
          cutModeResult = await Mode3Service.execute(imageProcessingResult, mode3Params);
          break;
        }
        case 'Cut and Fold': {
          const cutAndFoldParams: CutAndFoldParams = {
            lastPageNumber: params.lastPageNumber,
            pageHeight: params.pageHeight,
            pageHeightUnit: params.pageHeightUnit,
            threshold: params.threshold,
            precision: params.precision,
          };
          cutModeResult = await CutAndFoldService.execute(imageProcessingResult, cutAndFoldParams);
          break;
        }
        default:
          throw new Error(`Mode de cut inconnu: ${params.cutMode}`);
      }

      if (!cutModeResult.success) {
        return {
          success: false,
          message: cutModeResult.message,
          imageProcessingResult,
          cutModeResult,
        };
      }

      return {
        success: true,
        message: 'Génération terminée avec succès',
        imageProcessingResult,
        cutModeResult,
      };
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      return {
        success: false,
        message: `Erreur lors de la génération: ${error}`,
      };
    }
  }
}
