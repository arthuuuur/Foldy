/**
 * Composant d'upload d'image avec drag & drop
 * Gère l'upload, la prévisualisation et la suppression d'images
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 */

import { useRef, useState, DragEvent, memo } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import { CloudUploadIcon, X } from 'lucide-react';

interface ImageUploadProps {
  /** Image uploadée actuelle */
  uploadedImage: File | null;
  /** URL de prévisualisation de l'image */
  imagePreview: string | null;
  /** Callback appelé quand une nouvelle image est uploadée */
  onImageChange: (file: File | null) => void;
  /** Callback appelé quand l'image est supprimée */
  onImageRemove: () => void;
  /** Formats acceptés (ex: '.png,.jpg,.jpeg,.svg') */
  acceptedFormats?: string;
  /** Liste des extensions acceptées pour validation */
  acceptedExtensions?: string[];
}

const ImageUploadComponent = ({
  uploadedImage,
  imagePreview,
  onImageChange,
  onImageRemove,
  acceptedFormats = '.png,.jpg,.jpeg,.svg',
  acceptedExtensions = ['png', 'jpg', 'jpeg', 'svg'],
}: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // Vérifier le format
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!acceptedExtensions.includes(fileExtension || '')) {
      alert(`Format non accepté. Utilisez uniquement ${acceptedFormats}`);
      return;
    }

    onImageChange(file);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    handleFileChange(file);
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Zone de drag & drop */}
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: isDragging ? '#90caf9' : '#475569',
          borderRadius: '8px',
          p: 2,
          textAlign: 'center',
          backgroundColor: isDragging ? '#1e3a5f' : 'transparent',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUploadIcon size={32} color="#90caf9" />
        <Button
          component="span"
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          sx={{
            mt: 2,
            backgroundColor: '#90caf9',
            color: '#000000de',
            '&:hover': {
              backgroundColor: '#64b5f6',
            },
          }}
        >
          Upload image
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={handleFileInput}
          className="hidden"
        />
        <Box sx={{ mt: 1, fontSize: '12px', color: '#94a3b8' }}>
          ou glissez-déposez un fichier
        </Box>
        <Box sx={{ fontSize: '10px', color: '#64748b' }}>
          {acceptedFormats}
        </Box>
      </Box>

      {/* Preview de l'image */}
      {imagePreview && (
        <Box
          sx={{
            mt: 2,
            position: 'relative',
            border: '2px solid #334155',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <img
            src={imagePreview}
            alt="Preview"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onImageRemove();
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <X size={20} />
          </IconButton>
          {uploadedImage && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                fontSize: '12px',
                p: 1,
                textAlign: 'center',
              }}
            >
              {uploadedImage.name}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

/**
 * Export mémoïsé pour éviter les re-renders inutiles
 * Le composant ne se re-render que si uploadedImage, imagePreview,
 * onImageChange ou onImageRemove changent
 */
export const ImageUpload = memo(ImageUploadComponent);
