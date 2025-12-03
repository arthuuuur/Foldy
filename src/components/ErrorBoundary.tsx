/**
 * Error Boundary React pour attraper les erreurs de rendu
 * Affiche une interface gracieuse en cas d'erreur et log les détails
 */

import { Component, ReactNode } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Message personnalisé à afficher en cas d'erreur */
  fallbackMessage?: string;
  /** Callback appelé quand une erreur est capturée */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log l'erreur
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Mettre à jour l'état
    this.setState({
      error,
      errorInfo,
    });

    // Appeler le callback si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f1f5f9',
            p: 3,
          }}
        >
          <Paper
            sx={{
              maxWidth: 600,
              p: 4,
              textAlign: 'center',
              border: '2px solid #ef4444',
            }}
            elevation={3}
          >
            <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: 16 }} />

            <Typography variant="h5" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
              Une erreur s'est produite
            </Typography>

            <Typography variant="body1" sx={{ mb: 3, color: '#64748b' }}>
              {this.props.fallbackMessage ||
                "Désolé, quelque chose s'est mal passé. L'équipe technique a été notifiée."}
            </Typography>

            {/* Détails de l'erreur (développement uniquement) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: '#fee2e2',
                  borderRadius: '8px',
                  textAlign: 'left',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#991b1b',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo && `\n\n${this.state.errorInfo.componentStack}`}
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={this.handleReset}
                sx={{
                  backgroundColor: '#ef4444',
                  '&:hover': {
                    backgroundColor: '#dc2626',
                  },
                }}
              >
                Réessayer
              </Button>

              <Button
                variant="outlined"
                onClick={() => window.location.href = '/'}
                sx={{
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  '&:hover': {
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  },
                }}
              >
                Retour à l'accueil
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
