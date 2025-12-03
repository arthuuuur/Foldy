/**
 * Service centralisé pour la gestion des erreurs
 * Fournit des méthodes pour logger, formater et gérer les erreurs de l'application
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AppError {
  /** Message d'erreur affiché à l'utilisateur */
  message: string;
  /** Message technique pour les logs */
  technicalMessage?: string;
  /** Code d'erreur unique */
  code?: string;
  /** Sévérité de l'erreur */
  severity: ErrorSeverity;
  /** Timestamp de l'erreur */
  timestamp: Date;
  /** Contexte additionnel */
  context?: Record<string, unknown>;
}

export class ErrorService {
  /**
   * Log une erreur dans la console avec formatting
   */
  static log(error: Error | AppError, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();

    if (error instanceof Error) {
      console.error(`[${timestamp}] Error:`, {
        message: error.message,
        stack: error.stack,
        context,
      });
    } else {
      console.error(`[${timestamp}] AppError [${error.severity}]:`, {
        message: error.message,
        technical: error.technicalMessage,
        code: error.code,
        context: error.context,
      });
    }
  }

  /**
   * Crée un objet AppError standardisé
   */
  static createAppError(
    message: string,
    severity: ErrorSeverity = 'medium',
    options?: {
      technicalMessage?: string;
      code?: string;
      context?: Record<string, unknown>;
    }
  ): AppError {
    return {
      message,
      technicalMessage: options?.technicalMessage,
      code: options?.code,
      severity,
      timestamp: new Date(),
      context: options?.context,
    };
  }

  /**
   * Convertit une erreur native en AppError
   */
  static fromNativeError(
    error: Error,
    userMessage: string,
    severity: ErrorSeverity = 'medium'
  ): AppError {
    this.log(error);

    return this.createAppError(userMessage, severity, {
      technicalMessage: error.message,
      context: {
        name: error.name,
        stack: error.stack,
      },
    });
  }

  /**
   * Gère les erreurs de validation
   */
  static validationError(fieldName: string, reason: string): AppError {
    return this.createAppError(
      `Le champ "${fieldName}" est invalide : ${reason}`,
      'low',
      {
        code: 'VALIDATION_ERROR',
        context: { field: fieldName, reason },
      }
    );
  }

  /**
   * Gère les erreurs réseau
   */
  static networkError(operation: string, error: Error): AppError {
    this.log(error, { operation });

    return this.createAppError(
      'Erreur de connexion. Veuillez vérifier votre connexion internet.',
      'medium',
      {
        code: 'NETWORK_ERROR',
        technicalMessage: error.message,
        context: { operation },
      }
    );
  }

  /**
   * Gère les erreurs de génération de pattern
   */
  static generationError(reason: string, details?: Record<string, unknown>): AppError {
    return this.createAppError(
      `Erreur lors de la génération : ${reason}`,
      'high',
      {
        code: 'GENERATION_ERROR',
        technicalMessage: reason,
        context: details,
      }
    );
  }

  /**
   * Gère les erreurs de traitement d'image
   */
  static imageProcessingError(reason: string): AppError {
    return this.createAppError(
      `Impossible de traiter l'image : ${reason}`,
      'medium',
      {
        code: 'IMAGE_PROCESSING_ERROR',
        technicalMessage: reason,
      }
    );
  }

  /**
   * Gère les erreurs de fichier
   */
  static fileError(reason: string, fileName?: string): AppError {
    return this.createAppError(
      fileName
        ? `Erreur avec le fichier "${fileName}" : ${reason}`
        : `Erreur de fichier : ${reason}`,
      'medium',
      {
        code: 'FILE_ERROR',
        context: { fileName, reason },
      }
    );
  }

  /**
   * Formate un message d'erreur pour l'affichage à l'utilisateur
   */
  static formatErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const appError = error as AppError;
      return appError.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Une erreur inattendue s\'est produite';
  }

  /**
   * Vérifie si une erreur nécessite une notification utilisateur
   */
  static shouldNotifyUser(error: AppError): boolean {
    return error.severity === 'high' || error.severity === 'critical';
  }

  /**
   * Envoie une erreur critique à un service de monitoring (Sentry, etc.)
   * À implémenter selon les besoins
   */
  static reportToCrashReporting(error: Error | AppError): void {
    if (process.env.NODE_ENV === 'production') {
      // TODO: Intégrer avec Sentry, Bugsnag, etc.
      console.error('Critical error reported:', error);
    }
  }
}
