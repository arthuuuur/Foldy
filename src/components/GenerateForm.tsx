/**
 * Composant de formulaire pour les paramètres de génération
 * Affiche tous les champs nécessaires pour configurer la génération du pattern
 */

import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Slider,
  Typography,
  Collapse,
  IconButton,
} from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CutMode } from '../services/generate.service';
import type { Precision } from '../types/cutMode.types';

interface GenerateFormProps {
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

  // Callbacks
  onLastPageNumberChange: (value: number | '') => void;
  onPageHeightChange: (value: number | '') => void;
  onBookDepthChange: (value: number | '') => void;
  onCutDepthChange: (value: number | '') => void;
  onPageHeightUnitChange: (value: 'cm' | 'in') => void;
  onCutModeChange: (value: CutMode) => void;
  onThresholdChange: (value: number) => void;
  onPrecisionChange: (value: Precision) => void;
  onShadowFoldTypeChange: (value: 'regular' | '2/3') => void;
  onCombiEdgeWidthChange: (value: number | '') => void;

  // Options
  cutModeOptions?: CutMode[];
  isAdvancedOpen?: boolean;
  onAdvancedToggle?: () => void;
}

export function GenerateForm({
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
  onLastPageNumberChange,
  onPageHeightChange,
  onBookDepthChange,
  onCutDepthChange,
  onPageHeightUnitChange,
  onCutModeChange,
  onThresholdChange,
  onPrecisionChange,
  onShadowFoldTypeChange,
  onCombiEdgeWidthChange,
  cutModeOptions = ['Inverted', 'Embossed', 'Combi', 'Shadow Fold', 'MMF'],
  isAdvancedOpen = false,
  onAdvancedToggle,
}: GenerateFormProps) {
  return (
    <Box>
      {/* Mode de Cut */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Mode</InputLabel>
        <Select
          value={cutMode}
          label="Mode"
          onChange={(e) => onCutModeChange(e.target.value as CutMode)}
          sx={{
            color: 'white',
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: '#475569',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#64748b',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#90caf9',
            },
          }}
        >
          {cutModeOptions.map((mode) => (
            <MenuItem key={mode} value={mode}>
              {mode}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Champs spécifiques selon le mode */}
      {cutMode === 'Shadow Fold' && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Shadow Fold Type</InputLabel>
          <Select
            value={shadowFoldType}
            label="Shadow Fold Type"
            onChange={(e) => onShadowFoldTypeChange(e.target.value as 'regular' | '2/3')}
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: '#475569',
              },
            }}
          >
            <MenuItem value="regular">Regular (every page)</MenuItem>
            <MenuItem value="2/3">2/3 Pattern</MenuItem>
          </Select>
        </FormControl>
      )}

      {cutMode === 'Combi' && (
        <TextField
          fullWidth
          label="Edge Width"
          type="number"
          value={combiEdgeWidth}
          onChange={(e) => {
            const val = e.target.value;
            onCombiEdgeWidthChange(val === '' ? '' : Number(val));
          }}
          InputProps={{
            endAdornment: <InputAdornment position="end">cm</InputAdornment>,
          }}
          sx={{ mb: 2 }}
        />
      )}

      {/* Paramètres du livre */}
      <TextField
        fullWidth
        label="Last Page Number"
        type="number"
        value={lastPageNumber}
        onChange={(e) => {
          const val = e.target.value;
          onLastPageNumberChange(val === '' ? '' : Number(val));
        }}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Page Height"
        type="number"
        value={pageHeight}
        onChange={(e) => {
          const val = e.target.value;
          onPageHeightChange(val === '' ? '' : Number(val));
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Select
                value={pageHeightUnit}
                onChange={(e) => onPageHeightUnitChange(e.target.value as 'cm' | 'in')}
                variant="standard"
                disableUnderline
                sx={{ color: 'white' }}
              >
                <MenuItem value="cm">cm</MenuItem>
                <MenuItem value="in">in</MenuItem>
              </Select>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Book Depth"
        type="number"
        value={bookDepth}
        onChange={(e) => {
          const val = e.target.value;
          onBookDepthChange(val === '' ? '' : Number(val));
        }}
        InputProps={{
          endAdornment: <InputAdornment position="end">cm</InputAdornment>,
        }}
        sx={{ mb: 2 }}
      />

      {/* Section Advanced Settings */}
      <Box sx={{ mb: 2 }}>
        <Box
          onClick={onAdvancedToggle}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            py: 1,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#90caf9' }}>
            Advanced Settings
          </Typography>
          <IconButton size="small" sx={{ color: '#90caf9' }}>
            {isAdvancedOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </IconButton>
        </Box>

        <Collapse in={isAdvancedOpen}>
          <Box sx={{ pt: 2 }}>
            {/* Threshold Slider */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, color: '#cbd5e1' }}>
                Threshold: {threshold}
              </Typography>
              <Slider
                value={threshold}
                onChange={(_, value) => onThresholdChange(value as number)}
                min={0}
                max={255}
                step={1}
                sx={{
                  color: '#90caf9',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#90caf9',
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: '#90caf9',
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: '#475569',
                  },
                }}
              />
            </Box>

            {/* Precision Select */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Precision</InputLabel>
              <Select
                value={precision}
                label="Precision"
                onChange={(e) => onPrecisionChange(e.target.value as Precision)}
                sx={{
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: '#475569',
                  },
                }}
              >
                <MenuItem value="exact">Exact</MenuItem>
                <MenuItem value="0.1mm">0.1mm</MenuItem>
                <MenuItem value="0.5mm">0.5mm</MenuItem>
                <MenuItem value="1mm">1mm</MenuItem>
              </Select>
            </FormControl>

            {/* Cut Depth */}
            <TextField
              fullWidth
              label="Cut Depth"
              type="number"
              value={cutDepth}
              onChange={(e) => {
                const val = e.target.value;
                onCutDepthChange(val === '' ? '' : Number(val));
              }}
              InputProps={{
                endAdornment: <InputAdornment position="end">cm</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}
