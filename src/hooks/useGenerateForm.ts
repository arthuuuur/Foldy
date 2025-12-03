/**
 * Hook personnalisé pour gérer l'état et la logique du formulaire de génération
 */

import { useState, useCallback } from 'react';
import { GenerateService, type CutMode } from '../services/generate.service';
import type { PagePattern } from '../types/cutMode.types';
import type { Precision } from '../types/cutMode.types';

export interface GenerateFormState {
  // États de l'image
  uploadedImage: File | null;
  imagePreview: string | null;

  // États de génération
  isGenerating: boolean;
  hasGenerated: boolean;
  generationError: string | null;
  generationSuccess: string | null;
  generatedPattern: PagePattern[] | null;

  // États de visualisation
  currentPageIndex: number;
  viewMode: '2d' | '3d';

  // Paramètres du livre
  lastPageNumber: number | '';
  pageHeight: number | '';
  bookDepth: number | '';
  cutDepth: number | '';
  pageHeightUnit: 'cm' | 'in';

  // Paramètres de découpe
  cutMode: CutMode;
  threshold: number;
  precision: Precision;
  shadowFoldType: 'regular' | '2/3';
  combiEdgeWidth: number | '';
}

export function useGenerateForm() {
  // États de l'image
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // États de génération
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);
  const [generatedPattern, setGeneratedPattern] = useState<PagePattern[] | null>(null);

  // États de visualisation
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // Paramètres du livre
  const [lastPageNumber, setLastPageNumber] = useState<number | ''>(300);
  const [pageHeight, setPageHeight] = useState<number | ''>(20);
  const [bookDepth, setBookDepth] = useState<number | ''>(3);
  const [cutDepth, setCutDepth] = useState<number | ''>(1);
  const [pageHeightUnit, setPageHeightUnit] = useState<'cm' | 'in'>('cm');

  // Paramètres de découpe
  const [cutMode, setCutMode] = useState<CutMode>('Inverted');
  const [threshold, setThreshold] = useState<number>(128);
  const [precision, setPrecision] = useState<Precision>('0.1mm');
  const [shadowFoldType, setShadowFoldType] = useState<'regular' | '2/3'>('regular');
  const [combiEdgeWidth, setCombiEdgeWidth] = useState<number | ''>(2);

  /**
   * Gère le changement d'image avec création de la prévisualisation
   */
  const handleImageChange = useCallback((file: File | null) => {
    if (!file) return;

    setUploadedImage(file);

    // Créer la preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  /**
   * Supprime l'image uploadée
   */
  const handleImageRemove = useCallback(() => {
    setUploadedImage(null);
    setImagePreview(null);
  }, []);

  /**
   * Lance la génération du pattern
   */
  const handleGenerate = useCallback(async () => {
    // Réinitialiser les messages
    setGenerationError(null);
    setGenerationSuccess(null);

    // Validation
    if (!uploadedImage) {
      setGenerationError('Veuillez uploader une image');
      return;
    }

    if (!cutMode) {
      setGenerationError('Veuillez sélectionner un mode de cut');
      return;
    }

    setIsGenerating(true);

    try {
      const result = await GenerateService.generate({
        image: uploadedImage,
        cutMode: cutMode,
        lastPageNumber: typeof lastPageNumber === 'number' ? lastPageNumber : undefined,
        pageHeight: typeof pageHeight === 'number' ? pageHeight : undefined,
        pageHeightUnit: pageHeightUnit,
        threshold: threshold,
        precision: precision,
        shadowFoldType: shadowFoldType,
        combiEdgeWidth: typeof combiEdgeWidth === 'number' ? combiEdgeWidth : undefined,
      });

      if (result.success) {
        setHasGenerated(true);
        setGenerationSuccess(result.message);
        console.log('Résultat de la génération:', result);

        // Stocker le pattern généré si disponible
        if (result.cutModeResult?.data?.pattern) {
          setGeneratedPattern(result.cutModeResult.data.pattern);
          setCurrentPageIndex(0); // Réinitialiser à la première page
        }
      } else {
        setGenerationError(result.message);
      }
    } catch (error) {
      setGenerationError(`Erreur inattendue: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  }, [
    uploadedImage,
    cutMode,
    lastPageNumber,
    pageHeight,
    pageHeightUnit,
    threshold,
    precision,
    shadowFoldType,
    combiEdgeWidth,
  ]);

  return {
    // États
    uploadedImage,
    imagePreview,
    isGenerating,
    hasGenerated,
    generationError,
    generationSuccess,
    generatedPattern,
    currentPageIndex,
    viewMode,
    lastPageNumber,
    pageHeight,
    bookDepth,
    cutDepth,
    pageHeightUnit,
    cutMode,
    threshold,
    precision,
    shadowFoldType,
    combiEdgeWidth,

    // Setters
    setUploadedImage,
    setImagePreview,
    setCurrentPageIndex,
    setViewMode,
    setLastPageNumber,
    setPageHeight,
    setBookDepth,
    setCutDepth,
    setPageHeightUnit,
    setCutMode,
    setThreshold,
    setPrecision,
    setShadowFoldType,
    setCombiEdgeWidth,
    setGenerationError,
    setGenerationSuccess,

    // Actions
    handleImageChange,
    handleImageRemove,
    handleGenerate,
  };
}
