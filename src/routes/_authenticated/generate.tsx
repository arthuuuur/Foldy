import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, DragEvent } from 'react'
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
} from '@mui/material'
import {
    CloudUploadIcon,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    X,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/generate')({
    component: RouteComponent,
})

function RouteComponent() {
    const [isPanelOpen, setIsPanelOpen] = useState(true)
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
    const [uploadedImage, setUploadedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [hasGenerated, setHasGenerated] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [lastPageNumber, setLastPageNumber] = useState<number | ''>('')
    const [pageHeight, setPageHeight] = useState<number | ''>('')
    const [pageHeightUnit, setPageHeightUnit] = useState<'cm' | 'in'>('cm')
    const [cutMode, setCutMode] = useState('')

    const acceptedFormats = '.png,.jpg,.jpeg,.svg'
    const cutModeOptions = ['Mode 1', 'Mode 2', 'Mode 3', 'Auto']

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

    const handleGenerate = () => {
        console.log('Generating...')
        setHasGenerated(true)
        // Votre logique de génération ici
    }

    const handleSave = () => {
        console.log('Saving...')
        // Votre logique de sauvegarde ici
    }

    return (
        <>
            {/* Styles spécifiques à la page generate pour gérer l'overflow du layout */}
            <style>{`
                /* Desktop : empêche le scroll global, le contenu est dans le layout fixe */
                @media (min-width: 900px) {
                    body, html {
                        overflow: hidden;
                    }
                }

                /* Mobile : layout vertical avec scroll normal */
                @media (max-width: 899px) {
                    .layout-container {
                        flex-direction: column !important;
                        height: auto !important;
                        min-height: 100vh !important;
                        max-height: none !important;
                        overflow-y: visible !important;
                    }

                    body, html {
                        overflow-y: auto !important;
                        overflow-x: hidden;
                    }
                }
            `}</style>
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

                        {/* Page height avec unité */}
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
                                            value={pageHeightUnit}
                                            onChange={(e) => setPageHeightUnit(e.target.value as 'cm' | 'in')}
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
                                    {/* Ajoutez vos paramètres avancés ici */}
                                    <TextField
                                        label="Paramètre 1"
                                        fullWidth
                                        size="small"
                                        sx={{
                                            mb: 2,
                                            '& .MuiInputLabel-root': { color: '#94a3b8' },
                                            '& .MuiOutlinedInput-root': {
                                                color: 'white',
                                                '& fieldset': { borderColor: '#475569' },
                                            },
                                        }}
                                    />
                                    <TextField
                                        label="Paramètre 2"
                                        fullWidth
                                        size="small"
                                        sx={{
                                            '& .MuiInputLabel-root': { color: '#94a3b8' },
                                            '& .MuiOutlinedInput-root': {
                                                color: 'white',
                                                '& fieldset': { borderColor: '#475569' },
                                            },
                                        }}
                                    />
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
                            display: { xs: 'flex', md: 'flex' },
                            gap: 2,
                            zIndex: 10,
                            flexShrink: 0,
                        }}
                    >
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleGenerate}
                            sx={{
                                backgroundColor: '#90caf9',
                                color: '#000000de',
                                '&:hover': {
                                    backgroundColor: '#64b5f6',
                                },
                            }}
                        >
                            Generate
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={handleSave}
                            disabled={!hasGenerated}
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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            boxSizing: 'border-box',
                        }}
                    >
                        Votre contenu généré apparaîtra ici
                    </Box>
                </Box>
            </div>
        </>
    )
}