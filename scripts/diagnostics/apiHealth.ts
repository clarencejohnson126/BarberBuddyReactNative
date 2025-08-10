import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface APIHealthResult {
  service: string;
  status: 'OK' | 'ERROR' | 'WARNING';
  details: {
    configured: boolean;
    accessible: boolean;
    verified?: boolean;
    accountInfo?: any;
    error?: string;
  };
}

interface EnvironmentMapping {
  key: string;
  source: 'expo-constants' | '.env' | 'app.json';
  value: string | undefined;
  secure: boolean;
}

export class APIHealthChecker {
  
  /**
   * Get comprehensive environment variable mapping
   */
  public static getEnvironmentMapping(): EnvironmentMapping[] {
    const mapping: EnvironmentMapping[] = [];
    
    const keys = [
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY', 
      'STRIPE_ACCOUNT_ID_EXPECTED',
      'STRIPE_ALLOW_CATALOG_MUTATIONS',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'OPENAI_API_KEY',
      'REPLICATE_API_TOKEN',
      'SENTRY_DSN',
    ];

    keys.forEach(key => {
      const expoValue = Constants.expoConfig?.extra?.[key];
      mapping.push({
        key,
        source: 'expo-constants',
        value: expoValue,
        secure: key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN')
      });
    });

    return mapping;
  }

  /**
   * Verify all API credentials and connections
   */
  public static async runFullDiagnostics(): Promise<APIHealthResult[]> {
    console.log('\n🔍 STARTING API HEALTH DIAGNOSTICS...\n');
    
    const results: APIHealthResult[] = [];
    
    // Check environment variable loading
    console.log('📋 Environment Variable Status:');
    const envMapping = this.getEnvironmentMapping();
    envMapping.forEach(env => {
      const displayValue = env.secure && env.value ? 
        `${env.value.substring(0, 12)}...` : 
        env.value || 'NOT SET';
      console.log(`  ${env.key}: ${displayValue} (${env.source})`);
    });
    console.log('');

    // Test Stripe
    results.push(await this.checkStripe());
    
    // Test Supabase
    results.push(await this.checkSupabase());
    
    // Test OpenAI
    results.push(await this.checkOpenAI());
    
    // Test Replicate
    results.push(await this.checkReplicate());

    // Print summary
    this.printSummary(results);
    
    return results;
  }

  private static async checkStripe(): Promise<APIHealthResult> {
    const secretKey = Constants.expoConfig?.extra?.STRIPE_SECRET_KEY;
    const accountIdExpected = Constants.expoConfig?.extra?.STRIPE_ACCOUNT_ID_EXPECTED;
    
    if (!secretKey) {
      return {
        service: 'Stripe',
        status: 'ERROR',
        details: {
          configured: false,
          accessible: false,
          error: 'STRIPE_SECRET_KEY not found in expo-constants'
        }
      };
    }

    try {
      console.log('🔹 Testing Stripe API connection...');
      
      const response = await fetch('https://api.stripe.com/v1/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'BarberBuddy/1.0.0 (Diagnostics)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const account = await response.json();
      
      // Verify account ID matches expected
      const accountVerified = account.id === accountIdExpected;
      const businessName = account.business_profile?.name || account.settings?.dashboard?.display_name || 'Unknown';
      const containsBarberBuddy = businessName.toLowerCase().includes('barberbuddy');

      console.log(`  ✅ Connected to: ${businessName} (${account.id})`);
      console.log(`  ✅ Account ID Match: ${accountVerified ? 'YES' : 'NO'}`);
      console.log(`  ✅ Contains "BarberBuddy": ${containsBarberBuddy ? 'YES' : 'NO'}`);
      console.log(`  ✅ Mode: ${secretKey.startsWith('sk_live_') ? 'Live' : 'Test'}`);

      return {
        service: 'Stripe',
        status: accountVerified && containsBarberBuddy ? 'OK' : 'WARNING',
        details: {
          configured: true,
          accessible: true,
          verified: accountVerified && containsBarberBuddy,
          accountInfo: {
            id: account.id,
            businessName,
            mode: secretKey.startsWith('sk_live_') ? 'live' : 'test',
            expected: accountIdExpected
          }
        }
      };

    } catch (error) {
      console.log(`  ❌ Stripe Error: ${error.message}`);
      
      return {
        service: 'Stripe',
        status: 'ERROR',
        details: {
          configured: true,
          accessible: false,
          error: error.message
        }
      };
    }
  }

  private static async checkSupabase(): Promise<APIHealthResult> {
    const url = Constants.expoConfig?.extra?.SUPABASE_URL;
    const anonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY;
    
    if (!url || !anonKey) {
      return {
        service: 'Supabase',
        status: 'ERROR',
        details: {
          configured: false,
          accessible: false,
          error: 'SUPABASE_URL or SUPABASE_ANON_KEY not configured'
        }
      };
    }

    try {
      console.log('🔹 Testing Supabase connection...');
      
      // Test basic connection
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      console.log(`  ✅ Connected to: ${url}`);
      console.log(`  ✅ Anonymous key valid`);

      return {
        service: 'Supabase',
        status: 'OK',
        details: {
          configured: true,
          accessible: true,
          verified: true,
          accountInfo: {
            url,
            hasAnonKey: true
          }
        }
      };

    } catch (error) {
      console.log(`  ❌ Supabase Error: ${error.message}`);
      
      return {
        service: 'Supabase',
        status: 'ERROR',
        details: {
          configured: true,
          accessible: false,
          error: error.message
        }
      };
    }
  }

  private static async checkOpenAI(): Promise<APIHealthResult> {
    const apiKey = Constants.expoConfig?.extra?.OPENAI_API_KEY;
    
    if (!apiKey) {
      return {
        service: 'OpenAI',
        status: 'ERROR',
        details: {
          configured: false,
          accessible: false,
          error: 'OPENAI_API_KEY not configured'
        }
      };
    }

    try {
      console.log('🔹 Testing OpenAI API connection...');
      
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'BarberBuddy/1.0.0 (Diagnostics)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const modelCount = data.data?.length || 0;
      
      console.log(`  ✅ API Key valid`);
      console.log(`  ✅ Available models: ${modelCount}`);

      return {
        service: 'OpenAI',
        status: 'OK',
        details: {
          configured: true,
          accessible: true,
          verified: true,
          accountInfo: {
            modelCount
          }
        }
      };

    } catch (error) {
      console.log(`  ❌ OpenAI Error: ${error.message}`);
      
      return {
        service: 'OpenAI',
        status: 'ERROR',
        details: {
          configured: true,
          accessible: false,
          error: error.message
        }
      };
    }
  }

  private static async checkReplicate(): Promise<APIHealthResult> {
    const token = Constants.expoConfig?.extra?.REPLICATE_API_TOKEN;
    
    if (!token) {
      return {
        service: 'Replicate',
        status: 'ERROR',
        details: {
          configured: false,
          accessible: false,
          error: 'REPLICATE_API_TOKEN not configured'
        }
      };
    }

    try {
      console.log('🔹 Testing Replicate API connection...');
      
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${token}`,
          'User-Agent': 'BarberBuddy/1.0.0 (Diagnostics)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      console.log(`  ✅ API Token valid`);
      console.log(`  ✅ Account accessible`);

      return {
        service: 'Replicate',
        status: 'OK',
        details: {
          configured: true,
          accessible: true,
          verified: true,
          accountInfo: {
            hasAccess: true
          }
        }
      };

    } catch (error) {
      console.log(`  ❌ Replicate Error: ${error.message}`);
      
      return {
        service: 'Replicate',
        status: 'ERROR',
        details: {
          configured: true,
          accessible: false,
          error: error.message
        }
      };
    }
  }

  private static printSummary(results: APIHealthResult[]): void {
    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log('='.repeat(50));
    
    results.forEach(result => {
      const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${icon} ${result.service}: ${result.status}`);
      
      if (result.details.error) {
        console.log(`   Error: ${result.details.error}`);
      }
      
      if (result.details.accountInfo) {
        const info = result.details.accountInfo;
        if (info.businessName) console.log(`   Business: ${info.businessName}`);
        if (info.id) console.log(`   Account: ${info.id}`);
        if (info.mode) console.log(`   Mode: ${info.mode}`);
        if (info.url) console.log(`   URL: ${info.url}`);
      }
    });
    
    const okCount = results.filter(r => r.status === 'OK').length;
    const total = results.length;
    
    console.log('='.repeat(50));
    console.log(`✨ Overall Status: ${okCount}/${total} services healthy`);
    
    if (okCount === total) {
      console.log('🎉 All APIs are working correctly!');
    } else {
      console.log('⚡ Some APIs need attention - check errors above');
    }
    console.log('');
  }
}