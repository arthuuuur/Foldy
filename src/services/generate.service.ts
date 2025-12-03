/**
 * Service principal de génération
 * Orchestre le traitement de l'image et l'appel au service de cut approprié
 */

import { ImageProcessingService, ImageProcessingResult } from './imageProcessing.service';
import { InvertedService } from './cutModes/inverted.service';
import { EmbossedService } from './cutModes/embossed.service';
import { CombiService } from './cutModes/combi.service';
import { ShadowFoldService } from './cutModes/shadowFold.service';
import { MMFService } from './cutModes/mmf.service';
import type { CutModeResult } from './cutModes/inverted.service';
import type { CutModeParams as InvertedParams } from './cutModes/inverted.service';
import type { CutModeParams as EmbossedParams } from './cutModes/embossed.service';
import type { CutModeParams as CombiParams } from './cutModes/combi.service';
import type { CutModeParams as ShadowFoldParams } from './cutModes/shadowFold.service';
import type { CutModeParams as MMFParams } from './cutModes/mmf.service';

export type CutMode = 'Inverted' | 'Embossed' | 'Combi' | 'Shadow Fold' | 'MMF';

export interface GenerateParams {
  image: File;
  cutMode: CutMode;
  lastPageNumber?: number;
  pageHeight?: number;
  pageHeightUnit?: 'cm' | 'in';
  threshold?: number;
  precision?: 'exact' | '0.1mm' | '0.5mm' | '1mm';
  shadowFoldType?: 'regular' | '2/3'; // For Shadow Fold mode
  combiEdgeWidth?: number; // For Combi mode - width of edge fold in cm
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
        case 'Inverted': {
          const invertedParams: InvertedParams = {
            lastPageNumber: params.lastPageNumber,
            pageHeight: params.pageHeight,
            pageHeightUnit: params.pageHeightUnit,
            threshold: params.threshold,
            precision: params.precision,
          };
          cutModeResult = await InvertedService.execute(imageProcessingResult, invertedParams);
          break;
        }
        case 'Embossed': {
          const embossedParams: EmbossedParams = {
            lastPageNumber: params.lastPageNumber,
            pageHeight: params.pageHeight,
            pageHeightUnit: params.pageHeightUnit,
            threshold: params.threshold,
            precision: params.precision,
          };
          cutModeResult = await EmbossedService.execute(imageProcessingResult, embossedParams);
          break;
        }
        case 'Combi': {
          const combiParams: CombiParams = {
            lastPageNumber: params.lastPageNumber,
            pageHeight: params.pageHeight,
            pageHeightUnit: params.pageHeightUnit,
            threshold: params.threshold,
            precision: params.precision,
            combiEdgeWidth: params.combiEdgeWidth,
          };
          cutModeResult = await CombiService.execute(imageProcessingResult, combiParams);
          break;
        }
        case 'Shadow Fold': {
          const shadowFoldParams: ShadowFoldParams = {
            lastPageNumber: params.lastPageNumber,
            pageHeight: params.pageHeight,
            pageHeightUnit: params.pageHeightUnit,
            threshold: params.threshold,
            precision: params.precision,
            shadowFoldType: params.shadowFoldType,
          };
          cutModeResult = await ShadowFoldService.execute(imageProcessingResult, shadowFoldParams);
          break;
        }
        case 'MMF': {
          const mmfParams: MMFParams = {
            lastPageNumber: params.lastPageNumber,
            pageHeight: params.pageHeight,
            pageHeightUnit: params.pageHeightUnit,
            threshold: params.threshold,
            precision: params.precision,
          };
          cutModeResult = await MMFService.execute(imageProcessingResult, mmfParams);
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
