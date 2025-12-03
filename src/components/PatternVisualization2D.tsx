/**
 * Composant de visualisation 2D des patterns générés
 * Affiche les statistiques, la grille de pages et les détails des zones
 */

import { Box, Paper, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PagePattern } from '../types/cutMode.types';

interface PatternVisualization2DProps {
  /** Pattern de pages généré */
  pattern: PagePattern[];
  /** Index de la page actuellement affichée */
  currentPageIndex: number;
  /** Callback appelé quand la page change */
  onPageChange: (index: number) => void;
}

export function PatternVisualization2D({
  pattern,
  currentPageIndex,
  onPageChange,
}: PatternVisualization2DProps) {
  const currentPage = pattern[currentPageIndex];
  const totalPages = pattern.length;
  const pagesWithContent = pattern.filter((p) => p.hasContent).length;
  const totalZones = pattern.reduce((sum, p) => sum + p.zones.length, 0);

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
      {/* Statistiques globales */}
      <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Total Pages
            </Typography>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
              {totalPages}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Pages avec contenu
            </Typography>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
              {pagesWithContent}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Zones totales
            </Typography>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
              {totalZones}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Grille d'aperçu des pages */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
          Aperçu des pages
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
            gap: 1,
            maxHeight: '150px',
            overflowY: 'auto',
            p: 1,
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
          }}
        >
          {pattern.map((page, index) => (
            <Paper
              key={page.page}
              onClick={() => onPageChange(index)}
              sx={{
                p: 1,
                cursor: 'pointer',
                backgroundColor:
                  currentPageIndex === index
                    ? '#90caf9'
                    : page.hasContent
                    ? '#e0f2fe'
                    : '#f1f5f9',
                border: '1px solid',
                borderColor:
                  currentPageIndex === index
                    ? '#64b5f6'
                    : page.hasContent
                    ? '#bae6fd'
                    : '#cbd5e1',
                '&:hover': {
                  backgroundColor: currentPageIndex === index ? '#64b5f6' : '#dbeafe',
                },
                transition: 'all 0.2s',
                textAlign: 'center',
              }}
              elevation={currentPageIndex === index ? 3 : 0}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: currentPageIndex === index ? 600 : 400,
                  color: currentPageIndex === index ? '#fff' : '#1e293b',
                }}
              >
                {page.page}
              </Typography>
              {page.hasContent && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontSize: '10px',
                    color: currentPageIndex === index ? '#fff' : '#64748b',
                  }}
                >
                  {page.zones.length}z
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Navigation et détails de la page courante */}
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ color: '#1e293b', fontWeight: 600 }}>
            Page {currentPage.page}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              sx={{
                backgroundColor: '#f1f5f9',
                '&:hover': { backgroundColor: '#e2e8f0' },
                '&.Mui-disabled': { backgroundColor: '#f8fafc' },
              }}
            >
              <ChevronLeft size={20} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onPageChange(Math.min(pattern.length - 1, currentPageIndex + 1))}
              disabled={currentPageIndex === pattern.length - 1}
              sx={{
                backgroundColor: '#f1f5f9',
                '&:hover': { backgroundColor: '#e2e8f0' },
                '&.Mui-disabled': { backgroundColor: '#f8fafc' },
              }}
            >
              <ChevronRight size={20} />
            </IconButton>
          </Box>
        </Box>

        {currentPage.hasContent ? (
          <Box>
            <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
              {currentPage.zones.length} zone(s) de pliage détectée(s)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {currentPage.zones.map((zone, zoneIndex) => (
                <Paper
                  key={zoneIndex}
                  sx={{
                    p: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                  elevation={0}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mb: 1,
                      color: '#64748b',
                      fontWeight: 600,
                    }}
                  >
                    Zone {zoneIndex + 1}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Début
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                        {zone.startMark} cm
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Fin
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                        {zone.endMark} cm
                      </Typography>
                    </Box>
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Hauteur
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                        {zone.height} cm
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        ) : (
          <Paper
            sx={{
              p: 3,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
            }}
            elevation={0}
          >
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Aucun contenu sur cette page
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
