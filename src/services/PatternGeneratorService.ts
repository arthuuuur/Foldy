/**
 * Service orchestrateur principal
 * Coordonne le traitement d'image et la génération de pattern
 */

import { ImageProcessingService, ImageProcessingResult } from './imageProcessing.service';
import { InvertedMode } from './cutModes/InvertedMode';
import { EmbossedMode } from './cutModes/EmbossedMode';
import { CombiMode } from './cutModes/CombiMode';
import { ShadowFoldMode } from './cutModes/ShadowFoldMode';
import { MMFMode } from './cutModes/MMFMode';
import { CutModeBase } from './cutModes/base/CutModeBase';
import { GenerationParams, GenerationResult } from './cutModes/base/types';

export type CutMode = 'Inverted' | 'Embossed' | 'Combi' | 'Shadow Fold' | 'MMF';

export interface PatternGenerationParams {
  image: File;
  cutMode: CutMode;
  lastPageNumber: number;
  pageHeight: number;
  pageHeightUnit: 'cm' | 'in';
  threshold: number;
  precision: '0.1mm' | '0.5mm' | '1mm';
  bookDepth: number;
  cutDepth: number;
  shadowFoldType?: '1:1' | '2:1';
  combiEdgeWidth?: number;
}

export interface PatternGenerationResult {
  success: boolean;
  message: string;
  imageProcessingResult?: ImageProcessingResult;
  patternResult?: GenerationResult;
}

export class PatternGeneratorService {
  /**
   * Registry des modes disponibles
   */
  private static modeRegistry: Record<CutMode, new () => CutModeBase> = {
    'Inverted': InvertedMode,
    'Embossed': EmbossedMode,
    'Combi': CombiMode,
    'Shadow Fold': ShadowFoldMode,
    'MMF': MMFMode,
  };

  /**
   * Point d'entrée principal - génère le pattern complet
   */
  static async generate(params: PatternGenerationParams): Promise<PatternGenerationResult> {
    try {
      // Étape 1: Traitement de l'image (grayscale)
      console.log('📸 Étape 1: Traitement de l\'image...');
      const imageProcessingResult = await ImageProcessingService.processImage(params.image);

      // Étape 2: Sélection et instanciation du mode
      console.log(`🔧 Étape 2: Application du mode ${params.cutMode}...`);
      const ModeClass = this.modeRegistry[params.cutMode];

      if (!ModeClass) {
        throw new Error(`Mode de découpe inconnu: ${params.cutMode}`);
      }

      const mode = new ModeClass();

      // Étape 3: Génération du pattern
      const generationParams: GenerationParams = {
        processedImage: imageProcessingResult.processedImage,
        threshold: params.threshold,
        lastPageNumber: params.lastPageNumber,
        pageHeight: params.pageHeight,
        pageHeightUnit: params.pageHeightUnit,
        bookDepth: params.bookDepth,
        cutDepth: params.cutDepth,
        precision: params.precision,
        shadowFoldType: params.shadowFoldType,
        combiEdgeWidth: params.combiEdgeWidth,
      };

      const patternResult = await mode.execute(generationParams);

      if (!patternResult.success) {
        return {
          success: false,
          message: patternResult.message,
          imageProcessingResult,
          patternResult,
        };
      }

      console.log('✅ Génération terminée avec succès');

      return {
        success: true,
        message: 'Pattern généré avec succès',
        imageProcessingResult,
        patternResult,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error);
      return {
        success: false,
        message: `Erreur: ${(error as Error).message}`,
      };
    }
  }
}
