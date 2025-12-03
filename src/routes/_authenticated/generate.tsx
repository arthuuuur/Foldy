/**
 * Page principale de génération de patterns
 * Version refactorisée utilisant des composants réutilisables
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Button,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Box as BoxIcon, Grid as GridIcon } from 'lucide-react';

// Composants refactorisés
import { ImageUpload } from '../../components/ImageUpload';
import { GenerateForm } from '../../components/GenerateForm';
import { PatternVisualization2D } from '../../components/PatternVisualization2D';
import { BookPreview3D } from '../../components/BookPreview3D';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Hook personnalisé
import { useGenerateForm } from '../../hooks/useGenerateForm';

export const Route = createFileRoute('/_authenticated/generate')({
  component: () => (
    <ErrorBoundary fallbackMessage="Une erreur s'est produite lors du chargement de la page de génération.">
      <RouteComponent />
    </ErrorBoundary>
  ),
});

function RouteComponent() {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Utiliser le hook personnalisé pour la gestion d'état
  const {
    // États image
    uploadedImage,
    imagePreview,

    // États génération
    isGenerating,
    hasGenerated,
    generationError,
    generationSuccess,
    generatedPattern,

    // États visualisation
    currentPageIndex,
    viewMode,

    // Paramètres
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
  } = useGenerateForm();

  // Ajouter une classe au body pour les styles spécifiques à cette page
  useEffect(() => {
    document.body.classList.add('page-generate');
    return () => {
      document.body.classList.remove('page-generate');
    };
  }, []);

  const handleSave = () => {
    console.log('Saving...');
    // Logique de sauvegarde à implémenter
  };

  return (
    <>
      <div
        className="relative layout-container"
        style={{
          height: 'calc(100vh - var(--header-height))',
          maxHeight: 'calc(100vh - var(--header-height))',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
        }}
      >
        {/* Bouton toggle pour le panel - caché en mobile */}
        <IconButton
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          sx={{
            position: 'absolute',
            left: isPanelOpen ? '280px' : '0px',
            top: '20px',
            zIndex: 1300,
            backgroundColor: '#1e293b',
            color: 'white',
            '&:hover': {
              backgroundColor: '#334155',
            },
            transition: 'left 0.3s ease',
            display: { xs: 'none', md: 'flex' },
          }}
        >
          {isPanelOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </IconButton>

        {/* Panel de gauche */}
        <Box
          sx={{
            width: {
              xs: '100%',
              md: isPanelOpen ? '300px' : '0px',
            },
            minHeight: { xs: 'auto', md: '300px' },
            maxHeight: { xs: 'auto', md: 'calc(100vh - 64px)' },
            backgroundColor: '#1e293b',
            borderRight: { xs: 'none', md: '2px solid #334155' },
            borderBottom: { xs: '2px solid #334155', md: 'none' },
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              p: 3,
              pb: '100px',
            }}
          >
            {/* Composant d'upload d'image */}
            <ImageUpload
              uploadedImage={uploadedImage}
              imagePreview={imagePreview}
              onImageChange={handleImageChange}
              onImageRemove={handleImageRemove}
            />

            {/* Composant de formulaire */}
            <GenerateForm
              lastPageNumber={lastPageNumber}
              pageHeight={pageHeight}
              bookDepth={bookDepth}
              cutDepth={cutDepth}
              pageHeightUnit={pageHeightUnit}
              cutMode={cutMode}
              threshold={threshold}
              precision={precision}
              shadowFoldType={shadowFoldType}
              combiEdgeWidth={combiEdgeWidth}
              onLastPageNumberChange={setLastPageNumber}
              onPageHeightChange={setPageHeight}
              onBookDepthChange={setBookDepth}
              onCutDepthChange={setCutDepth}
              onPageHeightUnitChange={setPageHeightUnit}
              onCutModeChange={setCutMode}
              onThresholdChange={setThreshold}
              onPrecisionChange={setPrecision}
              onShadowFoldTypeChange={setShadowFoldType}
              onCombiEdgeWidthChange={setCombiEdgeWidth}
              isAdvancedOpen={isAdvancedOpen}
              onAdvancedToggle={() => setIsAdvancedOpen(!isAdvancedOpen)}
            />
          </Box>

          {/* Boutons d'action */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              backgroundColor: '#1e293b',
              borderTop: '1px solid #334155',
              display: 'flex',
              gap: 1,
            }}
          >
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={isGenerating}
              sx={{
                flex: 1,
                backgroundColor: '#90caf9',
                color: '#000',
                '&:hover': {
                  backgroundColor: '#64b5f6',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#475569',
                  color: '#94a3b8',
                },
              }}
            >
              {isGenerating ? <CircularProgress size={24} /> : 'Generate'}
            </Button>

            <Button
              variant="outlined"
              onClick={handleSave}
              disabled={!hasGenerated}
              sx={{
                flex: 1,
                borderColor: '#475569',
                color: '#90caf9',
                '&:hover': {
                  borderColor: '#64748b',
                  backgroundColor: 'rgba(144, 202, 249, 0.1)',
                },
                '&.Mui-disabled': {
                  borderColor: '#334155',
                  color: '#475569',
                },
              }}
            >
              Save
            </Button>
          </Box>
        </Box>

        {/* Zone de contenu principale */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: '#f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Messages d'erreur/succès */}
          {generationError && (
            <Alert
              severity="error"
              onClose={() => setGenerationError(null)}
              sx={{ m: 2, mb: 0 }}
            >
              {generationError}
            </Alert>
          )}

          {generationSuccess && (
            <Alert
              severity="success"
              onClose={() => setGenerationSuccess(null)}
              sx={{ m: 2, mb: 0 }}
            >
              {generationSuccess}
            </Alert>
          )}

          {/* Zone de visualisation */}
          {hasGenerated && generatedPattern && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Toggle 2D/3D */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newMode) => {
                    if (newMode !== null) {
                      setViewMode(newMode);
                    }
                  }}
                  sx={{
                    backgroundColor: 'white',
                    '& .MuiToggleButton-root': {
                      border: '1px solid #e2e8f0',
                      '&.Mui-selected': {
                        backgroundColor: '#90caf9',
                        color: '#000',
                        '&:hover': {
                          backgroundColor: '#64b5f6',
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="3d" aria-label="3d view">
                    <BoxIcon size={20} style={{ marginRight: 8 }} />
                    3D
                  </ToggleButton>
                  <ToggleButton value="2d" aria-label="2d view">
                    <GridIcon size={20} style={{ marginRight: 8 }} />
                    2D
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Contenu de visualisation */}
              {viewMode === '3d' ? (
                <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  <BookPreview3D
                    pattern={generatedPattern}
                    bookDepth={typeof bookDepth === 'number' ? bookDepth : 3}
                    pageHeight={typeof pageHeight === 'number' ? pageHeight : 20}
                    pageHeightUnit={pageHeightUnit}
                    cutMode={cutMode}
                  />
                </Box>
              ) : (
                <PatternVisualization2D
                  pattern={generatedPattern}
                  currentPageIndex={currentPageIndex}
                  onPageChange={setCurrentPageIndex}
                />
              )}
            </Box>
          )}

          {/* Message initial quand rien n'est généré */}
          {!hasGenerated && (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
              }}
            >
              <Box sx={{ textAlign: 'center', color: '#64748b' }}>
                <BoxIcon size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
                <Box sx={{ fontSize: '18px', fontWeight: 500, mb: 1 }}>
                  Aucun pattern généré
                </Box>
                <Box sx={{ fontSize: '14px' }}>
                  Uploadez une image et cliquez sur "Generate" pour commencer
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </div>
    </>
  );
}
