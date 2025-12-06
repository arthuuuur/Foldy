/**
 * Hook principal pour la génération de patterns
 * Gère l'auto-update quand unit ou precision change
 */

import { useState, useEffect, useCallback } from 'react';
import { PatternGeneratorService, PatternGenerationParams, PatternGenerationResult } from '../services/PatternGeneratorService';
import { useUnitPreferences } from '../contexts/UnitPreferencesContext';
import { usePrecision } from '../contexts/PrecisionContext';

export const usePatternGenerator = () => {
  const { unit } = useUnitPreferences();
  const { precision } = usePrecision();

  const [result, setResult] = useState<PatternGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastParams, setLastParams] = useState<PatternGenerationParams | null>(null);

  /**
   * Génération initiale du pattern
   */
  const generate = useCallback(async (params: Omit<PatternGenerationParams, 'pageHeightUnit' | 'precision'>) => {
    setIsGenerating(true);

    try {
      const fullParams: PatternGenerationParams = {
        ...params,
        pageHeightUnit: unit,
        precision,
      };

      const generationResult = await PatternGeneratorService.generate(fullParams);

      setResult(generationResult);
      setLastParams(fullParams);
    } catch (error) {
      console.error('Erreur génération:', error);
      setResult({
        success: false,
        message: `Erreur: ${(error as Error).message}`,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [unit, precision]);

  /**
   * Auto-update quand unit ou precision change
   * Regénère automatiquement avec les nouveaux paramètres
   */
  useEffect(() => {
    if (!result || !lastParams || isGenerating) return;

    console.log('🔄 Auto-update: unité ou précision changée, regénération...');

    const updatedParams: PatternGenerationParams = {
      ...lastParams,
      pageHeightUnit: unit,
      precision,
    };

    // Regénérer silencieusement (sans montrer loading)
    PatternGeneratorService.generate(updatedParams).then((newResult) => {
      setResult(newResult);
      setLastParams(updatedParams);
    });
  }, [unit, precision]); // Intentionnellement pas de lastParams/result pour éviter boucle infinie

  /**
   * Reset le résultat
   */
  const reset = useCallback(() => {
    setResult(null);
    setLastParams(null);
  }, []);

  return {
    generate,
    reset,
    result,
    isGenerating,
  };
};
