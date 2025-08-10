/**
 * Centralized Error Handler for API Services
 * 
 * This service provides structured error handling, localization,
 * and user-friendly error messages for all API operations.
 */

interface LocalizedError {
  code: string;
  message: string;
  userMessage: string;
  suggestions?: string[];
  canRetry: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ErrorTranslations {
  en: Record<string, { message: string; suggestions?: string[] }>;
  de: Record<string, { message: string; suggestions?: string[] }>;
  es: Record<string, { message: string; suggestions?: string[] }>;
  tr: Record<string, { message: string; suggestions?: string[] }>;
}

export class APIErrorHandler {
  private static readonly ERROR_TRANSLATIONS: ErrorTranslations = {
    en: {
      'STRIPE_UNAUTHORIZED': {
        message: 'Unable to connect to payment service. Please check your internet connection.',
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the issue persists'
        ]
      },
      'STRIPE_WRONG_ACCOUNT': {
        message: 'Payment service configuration error. Please contact support.',
        suggestions: ['Contact support immediately - this is a security issue']
      },
      'STRIPE_RATE_LIMITED': {
        message: 'Too many payment requests. Please wait a moment and try again.',
        suggestions: ['Wait 30 seconds before trying again']
      },
      'SUPABASE_CONNECTION_FAILED': {
        message: 'Unable to connect to our servers. Please check your connection.',
        suggestions: ['Check your internet connection', 'Try again in a few moments']
      },
      'OPENAI_UNAUTHORIZED': {
        message: 'AI service is temporarily unavailable. Please try again later.',
        suggestions: ['Try again in a few minutes', 'Contact support if issue persists']
      },
      'OPENAI_RATE_LIMITED': {
        message: 'AI service is busy. Please wait a moment before trying again.',
        suggestions: ['Wait 1 minute before trying again']
      },
      'REPLICATE_UNAUTHORIZED': {
        message: 'Image generation service is unavailable. Please try again.',
        suggestions: ['Try again in a few minutes', 'Check your subscription status']
      },
      'NETWORK_ERROR': {
        message: 'Network connection error. Please check your internet connection.',
        suggestions: ['Check WiFi/cellular connection', 'Try again when connection is stable']
      },
      'TIMEOUT_ERROR': {
        message: 'Request timed out. Please try again.',
        suggestions: ['Try again with a stable connection']
      },
      'ENVIRONMENT_ERROR': {
        message: 'App configuration error. Please restart the app.',
        suggestions: ['Restart the app', 'Update to the latest version', 'Contact support']
      }
    },
    de: {
      'STRIPE_UNAUTHORIZED': {
        message: 'Verbindung zum Zahlungsdienst fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.',
        suggestions: [
          'Internetverbindung überprüfen',
          'In wenigen Momenten erneut versuchen',
          'Support kontaktieren, falls das Problem bestehen bleibt'
        ]
      },
      'STRIPE_WRONG_ACCOUNT': {
        message: 'Zahlungsservice-Konfigurationsfehler. Bitte kontaktieren Sie den Support.',
        suggestions: ['Support sofort kontaktieren - dies ist ein Sicherheitsproblem']
      },
      'STRIPE_RATE_LIMITED': {
        message: 'Zu viele Zahlungsanfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
        suggestions: ['30 Sekunden warten, bevor Sie es erneut versuchen']
      },
      'NETWORK_ERROR': {
        message: 'Netzwerkverbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
        suggestions: ['WiFi/Mobilfunk-Verbindung überprüfen', 'Bei stabiler Verbindung erneut versuchen']
      }
    },
    es: {
      'STRIPE_UNAUTHORIZED': {
        message: 'No se puede conectar al servicio de pago. Por favor, verifica tu conexión a internet.',
        suggestions: [
          'Verifica tu conexión a internet',
          'Inténtalo de nuevo en unos momentos',
          'Contacta soporte si el problema persiste'
        ]
      },
      'STRIPE_WRONG_ACCOUNT': {
        message: 'Error de configuración del servicio de pago. Por favor contacta soporte.',
        suggestions: ['Contacta soporte inmediatamente - esto es un problema de seguridad']
      },
      'NETWORK_ERROR': {
        message: 'Error de conexión de red. Por favor verifica tu conexión a internet.',
        suggestions: ['Verifica conexión WiFi/celular', 'Inténtalo cuando la conexión sea estable']
      }
    },
    tr: {
      'STRIPE_UNAUTHORIZED': {
        message: 'Ödeme servisine bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.',
        suggestions: [
          'İnternet bağlantınızı kontrol edin',
          'Birkaç dakika sonra tekrar deneyin',
          'Sorun devam ederse destek ile iletişime geçin'
        ]
      },
      'STRIPE_WRONG_ACCOUNT': {
        message: 'Ödeme servisi yapılandırma hatası. Lütfen destek ile iletişime geçin.',
        suggestions: ['Hemen destek ile iletişime geçin - bu bir güvenlik sorunudur']
      },
      'NETWORK_ERROR': {
        message: 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
        suggestions: ['WiFi/hücresel bağlantıyı kontrol edin', 'Bağlantı stabil olduğunda tekrar deneyin']
      }
    }
  };

  /**
   * Process and localize API errors
   */
  public static handleError(
    error: Error | any,
    service: 'stripe' | 'supabase' | 'openai' | 'replicate' | 'network',
    language: 'en' | 'de' | 'es' | 'tr' = 'en'
  ): LocalizedError {
    
    const errorCode = this.classifyError(error, service);
    const translations = this.ERROR_TRANSLATIONS[language] || this.ERROR_TRANSLATIONS.en;
    const errorTranslation = translations[errorCode] || translations['NETWORK_ERROR'];

    // Log error for debugging (without sensitive info)
    this.logError(error, service, errorCode);

    return {
      code: errorCode,
      message: error.message || 'Unknown error',
      userMessage: errorTranslation.message,
      suggestions: errorTranslation.suggestions,
      canRetry: this.canRetry(errorCode),
      severity: this.getSeverity(errorCode)
    };
  }

  /**
   * Classify error into standard error codes
   */
  private static classifyError(error: any, service: string): string {
    const message = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode;

    // Network-level errors
    if (message.includes('network') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'TIMEOUT_ERROR';
    }

    // Service-specific errors
    switch (service) {
      case 'stripe':
        if (status === 401 || message.includes('unauthorized')) {
          return 'STRIPE_UNAUTHORIZED';
        }
        if (status === 429 || message.includes('rate limit')) {
          return 'STRIPE_RATE_LIMITED';
        }
        if (message.includes('wrong account') || message.includes('account mismatch')) {
          return 'STRIPE_WRONG_ACCOUNT';
        }
        break;

      case 'supabase':
        if (status === 401 || message.includes('unauthorized')) {
          return 'SUPABASE_UNAUTHORIZED';
        }
        if (!status && message.includes('connection')) {
          return 'SUPABASE_CONNECTION_FAILED';
        }
        break;

      case 'openai':
        if (status === 401 || message.includes('unauthorized')) {
          return 'OPENAI_UNAUTHORIZED';
        }
        if (status === 429 || message.includes('rate limit')) {
          return 'OPENAI_RATE_LIMITED';
        }
        break;

      case 'replicate':
        if (status === 401 || message.includes('unauthorized')) {
          return 'REPLICATE_UNAUTHORIZED';
        }
        break;
    }

    // Environment/config errors
    if (message.includes('not configured') || message.includes('missing')) {
      return 'ENVIRONMENT_ERROR';
    }

    // Default to network error
    return 'NETWORK_ERROR';
  }

  /**
   * Determine if error is retryable
   */
  private static canRetry(errorCode: string): boolean {
    const retryableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'STRIPE_RATE_LIMITED',
      'OPENAI_RATE_LIMITED',
      'SUPABASE_CONNECTION_FAILED'
    ];
    
    return retryableErrors.includes(errorCode);
  }

  /**
   * Get error severity level
   */
  private static getSeverity(errorCode: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (errorCode) {
      case 'STRIPE_WRONG_ACCOUNT':
      case 'ENVIRONMENT_ERROR':
        return 'critical';
      
      case 'STRIPE_UNAUTHORIZED':
      case 'SUPABASE_CONNECTION_FAILED':
        return 'high';
        
      case 'STRIPE_RATE_LIMITED':
      case 'OPENAI_RATE_LIMITED':
      case 'OPENAI_UNAUTHORIZED':
      case 'REPLICATE_UNAUTHORIZED':
        return 'medium';
        
      case 'NETWORK_ERROR':
      case 'TIMEOUT_ERROR':
      default:
        return 'low';
    }
  }

  /**
   * Log error securely (no sensitive data)
   */
  private static logError(error: any, service: string, errorCode: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service,
      errorCode,
      status: error.status || error.statusCode,
      message: (error.message || '').replace(/sk_[a-zA-Z0-9_]+/g, 'sk_***'),
      stack: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : undefined
    };
    
    console.error('🚨 API Error:', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Create user-friendly retry handler
   */
  public static createRetryHandler(
    operation: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ) {
    return async (...args: any[]) => {
      let lastError: any;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation.apply(null, args);
        } catch (error) {
          lastError = error;
          
          const localizedError = this.handleError(error, 'network');
          
          if (!localizedError.canRetry || attempt === maxRetries) {
            throw localizedError;
          }
          
          // Exponential backoff
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`🔄 Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError;
    };
  }

  /**
   * Format error for display in UI
   */
  public static formatForUI(localizedError: LocalizedError): {
    title: string;
    message: string;
    actions: { label: string; action: string }[];
  } {
    const actions: { label: string; action: string }[] = [];
    
    if (localizedError.canRetry) {
      actions.push({ label: 'Try Again', action: 'retry' });
    }
    
    if (localizedError.severity === 'critical') {
      actions.push({ label: 'Contact Support', action: 'support' });
    } else {
      actions.push({ label: 'OK', action: 'dismiss' });
    }

    return {
      title: localizedError.severity === 'critical' ? 'Critical Error' : 'Connection Issue',
      message: localizedError.userMessage,
      actions
    };
  }
}