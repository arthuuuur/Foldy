import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect, DragEvent } from 'react'
import {
    Button,
    TextField,
    IconButton,
    Collapse,
    Box,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    InputAdornment,
    CircularProgress,
    Alert,
    Slider,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material'
import {
    CloudUploadIcon,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    X,
    Box as BoxIcon,
    Grid as GridIcon,
} from 'lucide-react'
import { type CutMode } from '../../services/PatternGeneratorService'
import type { PagePattern } from '../../services/cutModes/base/types'
import { BookPreview3D } from '../../components/BookPreview3D'
import { useUnitPreferences } from '../../contexts/UnitPreferencesContext'
import { usePrecision } from '../../contexts/PrecisionContext'
import { usePatternGenerator } from '../../hooks/usePatternGenerator'

export const Route = createFileRoute('/_authenticated/generate')({
    component: RouteComponent,
})

function RouteComponent() {
    // Contexts globaux (unité et précision)
    const { unit, setUnit } = useUnitPreferences()
    const { precision, setPrecision } = usePrecision()
    const { generate, result, isGenerating } = usePatternGenerator()

    // UI State
    const [isPanelOpen, setIsPanelOpen] = useState(true)
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
    const [uploadedImage, setUploadedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [generationError, setGenerationError] = useState<string | null>(null)
    const [generationSuccess, setGenerationSuccess] = useState<string | null>(null)
    const [currentPageIndex, setCurrentPageIndex] = useState(0)
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Paramètres de génération
    const [lastPageNumber, setLastPageNumber] = useState<number | ''>(300)
    const [pageHeight, setPageHeight] = useState<number | ''>(20)
    const [bookDepth, setBookDepth] = useState<number | ''>(3)
    const [cutDepth, setCutDepth] = useState<number | ''>(1)
    const [cutMode, setCutMode] = useState<CutMode>('Inverted')
    const [threshold, setThreshold] = useState<number>(128)
    const [shadowFoldType, setShadowFoldType] = useState<'1:1' | '2:1'>('1:1')
    const [combiEdgeWidth, setCombiEdgeWidth] = useState<number | ''>(2)

    // Extracted pattern depuis result
    const generatedPattern = result?.patternResult?.data?.pattern || null
    const hasGenerated = result?.success || false

    const acceptedFormats = '.png,.jpg,.jpeg,.svg'
    const cutModeOptions: CutMode[] = ['Inverted', 'Embossed', 'Combi', 'Shadow Fold', 'MMF']

    // Ajouter une classe au body pour les styles spécifiques à cette page
    useEffect(() => {
        document.body.classList.add('page-generate')
        return () => {
            document.body.classList.remove('page-generate')
        }
    }, [])

    const handleFileChange = (file: File | null) => {
        if (!file) return

        // Vérifier le format
        const fileExtension = file.name.split('.').pop()?.toLowerCase()
        if (!['png', 'jpg', 'jpeg', 'svg'].includes(fileExtension || '')) {
            alert('Format non accepté. Utilisez uniquement .png, .jpg ou .svg')
            return
        }

        setUploadedImage(file)

        // Créer la preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null
        handleFileChange(file)
    }

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0] || null
        handleFileChange(file)
    }

    const handleRemoveImage = () => {
        setUploadedImage(null)
        setImagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleGenerate = async () => {
        // Réinitialiser les messages
        setGenerationError(null)
        setGenerationSuccess(null)

        // Validation
        if (!uploadedImage) {
            setGenerationError('Veuillez uploader une image')
            return
        }

        if (!cutMode) {
            setGenerationError('Veuillez sélectionner un mode de cut')
            return
        }

        if (typeof lastPageNumber !== 'number' || typeof pageHeight !== 'number') {
            setGenerationError('Veuillez remplir tous les champs requis')
            return
        }

        try {
            await generate({
                image: uploadedImage,
                cutMode: cutMode,
                lastPageNumber: lastPageNumber,
                pageHeight: pageHeight,
                bookDepth: typeof bookDepth === 'number' ? bookDepth : 3,
                cutDepth: typeof cutDepth === 'number' ? cutDepth : 1,
                threshold: threshold,
                shadowFoldType: shadowFoldType,
                combiEdgeWidth: typeof combiEdgeWidth === 'number' ? combiEdgeWidth : undefined,
            })

            setGenerationSuccess('Pattern généré avec succès !')
            setCurrentPageIndex(0) // Réinitialiser à la première page
        } catch (error) {
            setGenerationError(`Erreur inattendue: ${error}`)
        }
    }

    const handleSave = () => {
        console.log('Saving...')
        // Votre logique de sauvegarde ici
    }

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
                        display: { xs: 'none', md: 'flex' }, // Caché en mobile
                    }}
                >
                    {isPanelOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
                </IconButton>

                {/* Panel de gauche */}
                <Box
                    sx={{
                        width: {
                            xs: '100%',
                            md: isPanelOpen ? '300px' : '0px'
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
                    <Box sx={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        p: 3,
                        pb: '100px', // Padding pour les boutons absolus
                    }}>
                        {/* Upload Image */}
                        <Box sx={{ mb: 3 }}>
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
                                    .png, .jpg, .svg
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
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            maxHeight: '200px',
                                            objectFit: 'contain',
                                        }}
                                    />
                                    <IconButton
                                        onClick={handleRemoveImage}
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,0,0,0.8)',
                                            },
                                        }}
                                        size="small"
                                    >
                                        <X size={16} />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>

                        {/* Last page number */}
                        <TextField
                            label="Last page number"
                            type="number"
                            fullWidth
                            value={lastPageNumber}
                            onChange={(e) => setLastPageNumber(e.target.value === '' ? '' : Number(e.target.value))}
                            helperText={`${typeof lastPageNumber === 'number' ? Math.ceil(lastPageNumber / 2) : 150} physical pages (2 page numbers per sheet)`}
                            sx={{
                                mb: 2,
                                '& .MuiInputLabel-root': { color: '#94a3b8' },
                                '& .MuiFormHelperText-root': { color: '#64748b' },
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': { borderColor: '#475569' },
                                    '&:hover fieldset': { borderColor: '#64748b' },
                                    '&.Mui-focused fieldset': { borderColor: '#90caf9' },
                                },
                            }}
                        />

                        {/* Page height avec unité GLOBALE */}
                        <TextField
                            label="Page height"
                            type="number"
                            fullWidth
                            value={pageHeight}
                            onChange={(e) => setPageHeight(e.target.value === '' ? '' : Number(e.target.value))}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Select
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value as 'cm' | 'in')}
                                            sx={{
                                                color: 'white',
                                                '.MuiOutlinedInput-notchedOutline': { border: 0 },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 0 },
                                                '.MuiSvgIcon-root': { color: 'white' },
                                            }}
                                        >
                                            <MenuItem value="cm">cm</MenuItem>
                                            <MenuItem value="in">in</MenuItem>
                                        </Select>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                mb: 2,
                                '& .MuiInputLabel-root': { color: '#94a3b8' },
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': { borderColor: '#475569' },
                                    '&:hover fieldset': { borderColor: '#64748b' },
                                    '&.Mui-focused fieldset': { borderColor: '#90caf9' },
                                },
                            }}
                        />

                        {/* Book depth */}
                        <TextField
                            label="Book depth (spine thickness)"
                            type="number"
                            fullWidth
                            value={bookDepth}
                            onChange={(e) => setBookDepth(e.target.value === '' ? '' : Number(e.target.value))}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <span style={{ color: '#94a3b8' }}>{unit}</span>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                mb: 2,
                                '& .MuiInputLabel-root': { color: '#94a3b8' },
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': { borderColor: '#475569' },
                                    '&:hover fieldset': { borderColor: '#64748b' },
                                    '&.Mui-focused fieldset': { borderColor: '#90caf9' },
                                },
                            }}
                        />

                        {/* Cut depth */}
                        <TextField
                            label="Cut depth (from edge)"
                            type="number"
                            fullWidth
                            value={cutDepth}
                            onChange={(e) => setCutDepth(e.target.value === '' ? '' : Number(e.target.value))}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <span style={{ color: '#94a3b8' }}>{unit}</span>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                mb: 2,
                                '& .MuiInputLabel-root': { color: '#94a3b8' },
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': { borderColor: '#475569' },
                                    '&:hover fieldset': { borderColor: '#64748b' },
                                    '&.Mui-focused fieldset': { borderColor: '#90caf9' },
                                },
                            }}
                        />

                        {/* Cut mode */}
                        <FormControl
                            fullWidth
                            sx={{
                                mb: 3,
                                '& .MuiInputLabel-root': { color: '#94a3b8' },
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': { borderColor: '#475569' },
                                    '&:hover fieldset': { borderColor: '#64748b' },
                                    '&.Mui-focused fieldset': { borderColor: '#90caf9' },
                                },
                            }}
                        >
                            <InputLabel>Cut mode</InputLabel>
                            <Select
                                value={cutMode}
                                label="Cut mode"
                                onChange={(e) => setCutMode(e.target.value)}
                                sx={{
                                    color: 'white',
                                    '.MuiSvgIcon-root': { color: 'white' },
                                }}
                            >
                                {cutModeOptions.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Advanced parameters */}
                        <Box>
                            <Button
                                fullWidth
                                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                endIcon={
                                    isAdvancedOpen ? (
                                        <ChevronUp size={20} />
                                    ) : (
                                        <ChevronDown size={20} />
                                    )
                                }
                                sx={{
                                    justifyContent: 'space-between',
                                    color: 'white',
                                    backgroundColor: '#334155',
                                    '&:hover': {
                                        backgroundColor: '#475569',
                                    },
                                    mb: 1,
                                }}
                            >
                                Advanced parameters
                            </Button>
                            <Collapse in={isAdvancedOpen}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                    }}
                                >
                                    {/* Threshold Slider */}
                                    <Box sx={{ mb: 2 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: '#94a3b8', mb: 1 }}
                                        >
                                            Threshold: {threshold}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                0
                                            </Typography>
                                            <Slider
                                                value={threshold}
                                                onChange={(_, value) => setThreshold(value as number)}
                                                min={0}
                                                max={255}
                                                valueLabelDisplay="auto"
                                                sx={{
                                                    flex: 1,
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
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                255
                                            </Typography>
                                        </Box>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: '#64748b', display: 'block', mt: 0.5 }}
                                        >
                                            Seuil de détection des zones sombres (pixels &lt; threshold)
                                        </Typography>
                                    </Box>

                                    {/* Precision Select GLOBALE */}
                                    <FormControl
                                        fullWidth
                                        sx={{
                                            mb: 2,
                                            '& .MuiInputLabel-root': { color: '#94a3b8' },
                                            '& .MuiOutlinedInput-root': {
                                                color: 'white',
                                                '& fieldset': { borderColor: '#475569' },
                                                '&:hover fieldset': { borderColor: '#64748b' },
                                                '&.Mui-focused fieldset': { borderColor: '#90caf9' },
                                            },
                                        }}
                                    >
                                        <InputLabel>Pattern precision (GLOBAL)</InputLabel>
                                        <Select
                                            value={precision}
                                            label="Pattern precision (GLOBAL)"
                                            onChange={(e) => setPrecision(e.target.value as '0.1mm' | '0.5mm' | '1mm')}
                                        >
                                            <MenuItem value="0.1mm">0.1mm precision</MenuItem>
                                            <MenuItem value="0.5mm">0.5mm precision</MenuItem>
                                            <MenuItem value="1mm">1mm precision</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: '#64748b', display: 'block', mt: 0.5, mb: 2 }}
                                    >
                                        Précision globale - les résultats se mettent à jour automatiquement
                                    </Typography>

                                    {/* Shadow Fold Type - only for Shadow Fold mode */}
                                    {cutMode === 'Shadow Fold' && (
                                        <>
                                            <FormControl
                                                fullWidth
                                                sx={{
                                                    mb: 2,
                                                    '& .MuiInputLabel-root': { color: '#94a3b8' },
                                                    '& .MuiOutlinedInput-root': {
                                                        color: 'white',
                                                        '& fieldset': { borderColor: '#475569' },
                                                        '&:hover fieldset': { borderColor: '#64748b' },
                                                        '&.Mui-focused fieldset': { borderColor: '#90caf9' },
                                                    },
                                                }}
                                            >
                                                <InputLabel>Shadow Fold Type</InputLabel>
                                                <Select
                                                    value={shadowFoldType}
                                                    label="Shadow Fold Type"
                                                    onChange={(e) => setShadowFoldType(e.target.value as '1:1' | '2:1')}
                                                >
                                                    <MenuItem value="1:1">1:1 (Fold 1, Skip 1)</MenuItem>
                                                    <MenuItem value="2:1">2:1 (Fold 2, Skip 1)</MenuItem>
                                                </Select>
                                            </FormControl>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: '#64748b', display: 'block', mt: 0.5, mb: 2 }}
                                            >
                                                1:1: fold 1 page, skip 1 page. 2:1: fold 2 pages, skip 1 page
                                            </Typography>
                                        </>
                                    )}

                                    {/* Combi Edge Width - only for Combi mode */}
                                    {cutMode === 'Combi' && (
                                        <>
                                            <TextField
                                                label="Combi edge width"
                                                type="number"
                                                fullWidth
                                                value={combiEdgeWidth}
                                                onChange={(e) => setCombiEdgeWidth(e.target.value === '' ? '' : Number(e.target.value))}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <span style={{ color: '#94a3b8' }}>{unit}</span>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{
                                                    mb: 2,
                                                    '& .MuiInputLabel-root': { color: '#94a3b8' },
                                                    '& .MuiOutlinedInput-root': {
                                                        color: 'white',
                                                        '& fieldset': { borderColor: '#475569' },
                                                        '&:hover fieldset': { borderColor: '#64748b' },
                                                        '&.Mui-focused fieldset': { borderColor: '#90caf9' },
                                                    },
                                                }}
                                            />
                                            <Typography
                                                variant="caption"
                                                sx={{ color: '#64748b', display: 'block', mt: 0.5, mb: 0 }}
                                            >
                                                Width of edge folds (top and bottom) for Combi mode
                                            </Typography>
                                        </>
                                    )}
                                </Paper>
                            </Collapse>
                        </Box>
                    </Box>

                    {/* Boutons sticky en bas */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            p: 2,
                            backgroundColor: '#1e293b',
                            borderTop: '2px solid #334155',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            zIndex: 10,
                            flexShrink: 0,
                        }}
                    >
                        {/* Messages d'erreur et de succès */}
                        {generationError && (
                            <Alert severity="error" onClose={() => setGenerationError(null)}>
                                {generationError}
                            </Alert>
                        )}
                        {generationSuccess && (
                            <Alert severity="success" onClose={() => setGenerationSuccess(null)}>
                                {generationSuccess}
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                startIcon={isGenerating ? <CircularProgress size={20} /> : null}
                                sx={{
                                    backgroundColor: '#90caf9',
                                    color: '#000000de',
                                    '&:hover': {
                                        backgroundColor: '#64b5f6',
                                    },
                                    '&.Mui-disabled': {
                                        backgroundColor: '#475569',
                                        color: '#64748b',
                                    },
                                }}
                            >
                                {isGenerating ? 'Génération...' : 'Generate'}
                            </Button>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={handleSave}
                                disabled={!hasGenerated || isGenerating}
                                sx={{
                                    borderColor: hasGenerated ? '#90caf9' : '#475569',
                                    color: hasGenerated ? '#90caf9' : '#64748b',
                                    '&:hover': {
                                        borderColor: hasGenerated ? '#64b5f6' : '#475569',
                                        backgroundColor: hasGenerated ? 'rgba(144, 202, 249, 0.1)' : 'transparent',
                                    },
                                    '&.Mui-disabled': {
                                        borderColor: '#475569',
                                        color: '#64748b',
                                    },
                                }}
                            >
                                Save
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* Zone principale de contenu */}
                <Box
                    sx={{
                        flex: 1,
                        width: { xs: '100%', md: 'auto' },
                        height: { xs: 'auto', md: 'calc(100vh - 64px)' },
                        minHeight: { xs: '400px', md: 'calc(100vh - 64px)' },
                        maxHeight: { xs: 'none', md: 'calc(100vh - 64px)' },
                        transition: 'all 0.3s ease',
                        p: { xs: 2, md: 4 },
                        overflow: 'hidden',
                        boxSizing: 'border-box',
                    }}
                >
                    <Box
                        sx={{
                            height: '100%',
                            width: '100%',
                            border: '2px solid #334155',
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            boxSizing: 'border-box',
                            overflow: 'auto',
                        }}
                    >
                        {/* Always show 3D preview */}
                        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* Toggle entre vue 2D et 3D - only show if pattern exists */}
                            {generatedPattern && (
                            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 600 }}>
                                    Pattern généré
                                </Typography>
                                <ToggleButtonGroup
                                    value={viewMode}
                                    exclusive
                                    onChange={(_, newMode) => newMode && setViewMode(newMode)}
                                    size="small"
                                >
                                    <ToggleButton value="2d" sx={{ px: 2 }}>
                                        <GridIcon size={18} style={{ marginRight: '8px' }} />
                                        Vue 2D
                                    </ToggleButton>
                                    <ToggleButton value="3d" sx={{ px: 2 }}>
                                        <BoxIcon size={18} style={{ marginRight: '8px' }} />
                                        Vue 3D
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                            )}

                            {!generatedPattern || viewMode === '3d' ? (
                                // Vue 3D (default or selected)
                                <Box sx={{ flex: 1, minHeight: 0 }}>
                                    <BookPreview3D
                                        pattern={generatedPattern || undefined}
                                        pageHeight={typeof pageHeight === 'number' ? pageHeight : 20}
                                        numberOfPages={typeof lastPageNumber === 'number' ? Math.ceil(lastPageNumber / 2) : 150}
                                        bookDepth={typeof bookDepth === 'number' ? bookDepth : 3}
                                        cutDepth={typeof cutDepth === 'number' ? cutDepth : 1}
                                        unit={unit}
                                        cutMode={cutMode}
                                    />
                                </Box>
                            ) : (
                                    // Vue 2D (existante)
                                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                                {/* Statistiques globales */}
                                <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid #e2e8f0' }}>
                                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                                Total Pages
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
                                                {generatedPattern.length}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                                Pages avec contenu
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
                                                {generatedPattern.filter(p => p.hasContent).length}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                                Zones totales
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
                                                {generatedPattern.reduce((sum, p) => sum + p.zones.length, 0)}
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
                                        {generatedPattern.map((page, index) => (
                                            <Paper
                                                key={page.page}
                                                onClick={() => setCurrentPageIndex(index)}
                                                sx={{
                                                    p: 1,
                                                    cursor: 'pointer',
                                                    backgroundColor: currentPageIndex === index ? '#90caf9' : page.hasContent ? '#e0f2fe' : '#f1f5f9',
                                                    border: '1px solid',
                                                    borderColor: currentPageIndex === index ? '#64b5f6' : page.hasContent ? '#bae6fd' : '#cbd5e1',
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
                                            Page {generatedPattern[currentPageIndex].page}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
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
                                                onClick={() => setCurrentPageIndex(Math.min(generatedPattern.length - 1, currentPageIndex + 1))}
                                                disabled={currentPageIndex === generatedPattern.length - 1}
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

                                    {generatedPattern[currentPageIndex].hasContent ? (
                                        <Box>
                                            <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
                                                {generatedPattern[currentPageIndex].zones.length} zone(s) de pliage détectée(s)
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                {generatedPattern[currentPageIndex].zones.map((zone, zoneIndex) => (
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
                                                        <Box
                                                            sx={{
                                                                display: 'grid',
                                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                                gap: 2,
                                                            }}
                                                        >
                                                            <Box>
                                                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                                                    Début
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                                                                    {zone.startMark} cm
                                                                </Typography>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                                                    Fin
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                                                                    {zone.endMark} cm
                                                                </Typography>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                                                    Hauteur
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                                                                    {zone.height} cm
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Paper>
                                                ))}
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Box
                                            sx={{
                                                p: 3,
                                                textAlign: 'center',
                                                backgroundColor: '#f8fafc',
                                                borderRadius: '8px',
                                                border: '1px dashed #cbd5e1',
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                                Aucune zone de pliage détectée sur cette page
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                                    </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </div>
        </>
    )
}