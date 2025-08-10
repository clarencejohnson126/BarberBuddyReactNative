import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GuardResult {
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  errors: string[];
  canProceed: boolean;
}

interface ServiceStatus {
  name: string;
  configured: boolean;
  validated: boolean;
  error?: string;
}

/**
 * API Guard Service
 * 
 * This service validates all API credentials and connections before allowing
 * the app to proceed with API-dependent operations. It acts as a security
 * layer to prevent wrong account usage and provides early error detection.
 */
export class APIGuard {
  private static readonly CACHE_KEY = '@barberbuddy:api_validation_cache';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  private static validationCache: {
    timestamp: number;
    results: ServiceStatus[];
  } | null = null;

  /**
   * Run boot-time API validation
   * This should be called during app initialization
   */
  public static async validateOnBootup(): Promise<GuardResult> {
    console.log('🛡️ API Guard: Starting boot-time validation...');
    
    try {
      // Check cache first
      const cachedResult = await this.getCachedValidation();
      if (cachedResult) {
        console.log('🛡️ API Guard: Using cached validation results');
        return this.buildGuardResult(cachedResult.results);
      }

      // Run fresh validation
      const results: ServiceStatus[] = [];
      
      // Validate environment loading
      const envResult = await this.validateEnvironmentLoading();
      results.push(envResult);

      // Validate individual services
      results.push(await this.validateStripe());
      results.push(await this.validateSupabase());
      results.push(await this.validateOpenAI());
      results.push(await this.validateReplicate());

      // Cache results
      await this.cacheValidationResults(results);

      return this.buildGuardResult(results);

    } catch (error) {
      console.error('🛡️ API Guard: Validation failed:', error);
      
      return {
        status: 'FAIL',
        message: 'API validation failed due to unexpected error',
        errors: [error.message],
        canProceed: false
      };
    }
  }

  /**
   * Quick health check for specific service
   */
  public static async quickHealthCheck(service: 'stripe' | 'supabase' | 'openai' | 'replicate'): Promise<boolean> {
    try {
      switch (service) {
        case 'stripe':
          const stripeResult = await this.validateStripe();
          return stripeResult.configured && stripeResult.validated;
          
        case 'supabase':
          const supabaseResult = await this.validateSupabase();
          return supabaseResult.configured && supabaseResult.validated;
          
        case 'openai':
          const openaiResult = await this.validateOpenAI();
          return openaiResult.configured && openaiResult.validated;
          
        case 'replicate':
          const replicateResult = await this.validateReplicate();
          return replicateResult.configured && replicateResult.validated;
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`🛡️ API Guard: Quick check failed for ${service}:`, error);
      return false;
    }
  }

  /**
   * Clear validation cache (force re-validation)
   */
  public static async clearCache(): Promise<void> {
    this.validationCache = null;
    await AsyncStorage.removeItem(this.CACHE_KEY);
  }

  // Private validation methods
  
  private static async validateEnvironmentLoading(): Promise<ServiceStatus> {
    try {
      const expoConfig = Constants.expoConfig;
      const hasExtra = !!expoConfig?.extra;
      
      if (!hasExtra) {
        return {
          name: 'Environment Loading',
          configured: false,
          validated: false,
          error: 'expo-constants not properly configured or no extra config found'
        };
      }

      const requiredKeys = [
        'STRIPE_SECRET_KEY',
        'STRIPE_ACCOUNT_ID_EXPECTED', 
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY'
      ];

      const missingKeys = requiredKeys.filter(key => !expoConfig.extra[key]);
      
      if (missingKeys.length > 0) {
        return {
          name: 'Environment Loading',
          configured: false,
          validated: false,
          error: `Missing required keys: ${missingKeys.join(', ')}`
        };
      }

      return {
        name: 'Environment Loading',
        configured: true,
        validated: true
      };

    } catch (error) {
      return {
        name: 'Environment Loading',
        configured: false,
        validated: false,
        error: error.message
      };
    }
  }

  private static async validateStripe(): Promise<ServiceStatus> {
    const secretKey = Constants.expoConfig?.extra?.STRIPE_SECRET_KEY;
    const expectedAccountId = Constants.expoConfig?.extra?.STRIPE_ACCOUNT_ID_EXPECTED;
    
    if (!secretKey || !expectedAccountId) {
      return {
        name: 'Stripe',
        configured: false,
        validated: false,
        error: 'Missing STRIPE_SECRET_KEY or STRIPE_ACCOUNT_ID_EXPECTED'
      };
    }

    try {
      // Quick format validation
      if (!secretKey.startsWith('sk_')) {
        return {
          name: 'Stripe',
          configured: true,
          validated: false,
          error: 'Invalid secret key format (should start with sk_)'
        };
      }

      // Test API connection
      const response = await fetch('https://api.stripe.com/v1/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'User-Agent': 'BarberBuddy/1.0.0 (Guard)',
        },
      });

      if (!response.ok) {
        return {
          name: 'Stripe',
          configured: true,
          validated: false,
          error: `API call failed: ${response.status}`
        };
      }

      const account = await response.json();
      
      // Validate account identity
      if (account.id !== expectedAccountId) {
        return {
          name: 'Stripe',
          configured: true,
          validated: false,
          error: `Wrong account connected. Expected: ${expectedAccountId}, Got: ${account.id}`
        };
      }

      // Check business name contains BarberBuddy
      const businessName = account.business_profile?.name || account.settings?.dashboard?.display_name || '';
      if (!businessName.toLowerCase().includes('barberbuddy')) {
        return {
          name: 'Stripe',
          configured: true,
          validated: false,
          error: `Business name "${businessName}" doesn't contain BarberBuddy`
        };
      }

      return {
        name: 'Stripe',
        configured: true,
        validated: true
      };

    } catch (error) {
      return {
        name: 'Stripe',
        configured: true,
        validated: false,
        error: error.message
      };
    }
  }

  private static async validateSupabase(): Promise<ServiceStatus> {
    const url = Constants.expoConfig?.extra?.SUPABASE_URL;
    const anonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY;
    
    if (!url || !anonKey) {
      return {
        name: 'Supabase',
        configured: false,
        validated: false,
        error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY'
      };
    }

    try {
      // Test connection
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
      });

      if (!response.ok) {
        return {
          name: 'Supabase',
          configured: true,
          validated: false,
          error: `API connection failed: ${response.status}`
        };
      }

      return {
        name: 'Supabase',
        configured: true,
        validated: true
      };

    } catch (error) {
      return {
        name: 'Supabase',
        configured: true,
        validated: false,
        error: error.message
      };
    }
  }

  private static async validateOpenAI(): Promise<ServiceStatus> {
    const apiKey = Constants.expoConfig?.extra?.OPENAI_API_KEY;
    
    if (!apiKey) {
      return {
        name: 'OpenAI',
        configured: false,
        validated: false,
        error: 'Missing OPENAI_API_KEY'
      };
    }

    try {
      // Quick format check
      if (!apiKey.startsWith('sk-')) {
        return {
          name: 'OpenAI',
          configured: true,
          validated: false,
          error: 'Invalid API key format'
        };
      }

      // Light test - just check if key is valid
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'BarberBuddy/1.0.0 (Guard)',
        },
      });

      if (!response.ok) {
        return {
          name: 'OpenAI',
          configured: true,
          validated: false,
          error: `API call failed: ${response.status}`
        };
      }

      return {
        name: 'OpenAI',
        configured: true,
        validated: true
      };

    } catch (error) {
      return {
        name: 'OpenAI',
        configured: true,
        validated: false,
        error: error.message
      };
    }
  }

  private static async validateReplicate(): Promise<ServiceStatus> {
    const token = Constants.expoConfig?.extra?.REPLICATE_API_TOKEN;
    
    if (!token) {
      return {
        name: 'Replicate',
        configured: false,
        validated: false,
        error: 'Missing REPLICATE_API_TOKEN'
      };
    }

    try {
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${token}`,
          'User-Agent': 'BarberBuddy/1.0.0 (Guard)',
        },
      });

      if (!response.ok) {
        return {
          name: 'Replicate',
          configured: true,
          validated: false,
          error: `API call failed: ${response.status}`
        };
      }

      return {
        name: 'Replicate',
        configured: true,
        validated: true
      };

    } catch (error) {
      return {
        name: 'Replicate',
        configured: true,
        validated: false,
        error: error.message
      };
    }
  }

  // Cache management
  
  private static async getCachedValidation(): Promise<{ timestamp: number; results: ServiceStatus[] } | null> {
    try {
      // Check in-memory cache first
      if (this.validationCache) {
        const age = Date.now() - this.validationCache.timestamp;
        if (age < this.CACHE_DURATION) {
          return this.validationCache;
        }
      }

      // Check persistent cache
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;
        
        if (age < this.CACHE_DURATION) {
          this.validationCache = parsed;
          return parsed;
        }
      }

      return null;

    } catch (error) {
      console.warn('🛡️ API Guard: Cache read failed:', error);
      return null;
    }
  }

  private static async cacheValidationResults(results: ServiceStatus[]): Promise<void> {
    try {
      const cacheData = {
        timestamp: Date.now(),
        results
      };

      // Store in memory
      this.validationCache = cacheData;

      // Store persistently
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));

    } catch (error) {
      console.warn('🛡️ API Guard: Cache write failed:', error);
    }
  }

  private static buildGuardResult(results: ServiceStatus[]): GuardResult {
    const errors = results
      .filter(r => !r.validated)
      .map(r => `${r.name}: ${r.error || 'Configuration issue'}`);

    const configuredCount = results.filter(r => r.configured).length;
    const validatedCount = results.filter(r => r.validated).length;
    const total = results.length;

    let status: 'PASS' | 'FAIL' | 'WARNING';
    let canProceed: boolean;

    if (validatedCount === total) {
      status = 'PASS';
      canProceed = true;
    } else if (validatedCount === 0) {
      status = 'FAIL';
      canProceed = false;
    } else {
      status = 'WARNING';
      canProceed = true; // Allow partial operation
    }

    const message = status === 'PASS' 
      ? `All ${total} APIs validated successfully`
      : status === 'FAIL'
      ? `All APIs failed validation - app functionality will be limited`
      : `${validatedCount}/${total} APIs validated - some features may be unavailable`;

    return {
      status,
      message,
      errors,
      canProceed
    };
  }
}