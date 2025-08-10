#!/usr/bin/env tsx

/**
 * Standalone API Diagnostics
 * 
 * This script can run without React Native dependencies to test
 * API credentials from the command line using .env and app.json files.
 */

import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import fetch from 'node-fetch';

interface APIResult {
  service: string;
  status: 'OK' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
}

class StandaloneDiagnostics {
  private envVars: Record<string, string> = {};
  private appConfig: any = {};

  constructor() {
    this.loadEnvVars();
    this.loadAppConfig();
  }

  private loadEnvVars(): void {
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        envContent.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, value] = trimmed.split('=');
            if (key && value) {
              this.envVars[key] = value;
            }
          }
        });
        
        console.log('✅ Loaded .env file');
      } else {
        console.log('⚠️  No .env file found');
      }
    } catch (error) {
      console.log('❌ Failed to load .env file:', error.message);
    }
  }

  private loadAppConfig(): void {
    try {
      const appJsonPath = path.join(process.cwd(), 'app.json');
      if (fs.existsSync(appJsonPath)) {
        const content = fs.readFileSync(appJsonPath, 'utf8');
        this.appConfig = JSON.parse(content);
        console.log('✅ Loaded app.json config');
      } else {
        console.log('⚠️  No app.json file found');
      }
    } catch (error) {
      console.log('❌ Failed to load app.json:', error.message);
    }
  }

  private getConfigValue(key: string): string | undefined {
    // Check app.json extra config first (this is what the app will use)
    const appValue = this.appConfig?.expo?.extra?.[key];
    if (appValue) return appValue;

    // Fallback to .env
    return this.envVars[key];
  }

  public async runDiagnostics(): Promise<APIResult[]> {
    console.log('\n🔍 BarberBuddy Standalone API Diagnostics');
    console.log('='.repeat(50));
    
    const results: APIResult[] = [];

    // Environment check
    results.push(this.checkEnvironment());
    
    // API tests
    results.push(await this.testStripe());
    results.push(await this.testSupabase());
    results.push(await this.testOpenAI());
    results.push(await this.testReplicate());

    return results;
  }

  private checkEnvironment(): APIResult {
    console.log('📋 Checking environment configuration...');
    
    const requiredKeys = [
      'STRIPE_SECRET_KEY',
      'STRIPE_ACCOUNT_ID_EXPECTED',
      'SUPABASE_URL', 
      'SUPABASE_ANON_KEY',
      'OPENAI_API_KEY',
      'REPLICATE_API_TOKEN'
    ];

    const missing = requiredKeys.filter(key => !this.getConfigValue(key));
    const present = requiredKeys.filter(key => !!this.getConfigValue(key));

    console.log(`  ✅ Configured: ${present.length}/${requiredKeys.length}`);
    
    if (missing.length > 0) {
      console.log(`  ❌ Missing: ${missing.join(', ')}`);
      return {
        service: 'Environment',
        status: 'ERROR',
        message: `Missing ${missing.length} required environment variables`,
        details: { missing }
      };
    }

    console.log('  ✅ All required keys present');
    return {
      service: 'Environment',
      status: 'OK',
      message: 'All environment variables configured'
    };
  }

  private async testStripe(): Promise<APIResult> {
    console.log('🔹 Testing Stripe API...');
    
    const secretKey = this.getConfigValue('STRIPE_SECRET_KEY');
    const expectedAccountId = this.getConfigValue('STRIPE_ACCOUNT_ID_EXPECTED');

    if (!secretKey) {
      return {
        service: 'Stripe',
        status: 'ERROR',
        message: 'STRIPE_SECRET_KEY not configured'
      };
    }

    try {
      const response = await fetch('https://api.stripe.com/v1/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`  ❌ HTTP ${response.status}: ${errorText}`);
        return {
          service: 'Stripe',
          status: 'ERROR',
          message: `API call failed: ${response.status}`
        };
      }

      const account = await response.json();
      const businessName = account.business_profile?.name || account.settings?.dashboard?.display_name || 'Unknown';
      
      console.log(`  ✅ Connected to: ${businessName} (${account.id})`);
      console.log(`  ✅ Mode: ${secretKey.startsWith('sk_live_') ? 'Live' : 'Test'}`);

      // Validate account ID
      if (expectedAccountId && account.id !== expectedAccountId) {
        console.log(`  ⚠️  Account mismatch! Expected: ${expectedAccountId}`);
        return {
          service: 'Stripe',
          status: 'WARNING',
          message: 'Connected to wrong Stripe account',
          details: {
            expected: expectedAccountId,
            actual: account.id,
            businessName
          }
        };
      }

      // Check business name
      if (!businessName.toLowerCase().includes('barberbuddy')) {
        console.log(`  ⚠️  Business name "${businessName}" doesn't contain BarberBuddy`);
        return {
          service: 'Stripe',
          status: 'WARNING',
          message: 'Business name does not contain BarberBuddy',
          details: { businessName, accountId: account.id }
        };
      }

      return {
        service: 'Stripe',
        status: 'OK',
        message: 'Stripe API validated successfully',
        details: {
          accountId: account.id,
          businessName,
          mode: secretKey.startsWith('sk_live_') ? 'live' : 'test'
        }
      };

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log(`  ℹ️  Note: MCP Stripe integration may still work even with direct API failures`);
      return {
        service: 'Stripe',
        status: 'ERROR',
        message: `${error.message} (Note: MCP integration may still work)`
      };
    }
  }

  private async testSupabase(): Promise<APIResult> {
    console.log('🔹 Testing Supabase API...');
    
    const url = this.getConfigValue('SUPABASE_URL');
    const anonKey = this.getConfigValue('SUPABASE_ANON_KEY');

    if (!url || !anonKey) {
      return {
        service: 'Supabase',
        status: 'ERROR',
        message: 'SUPABASE_URL or SUPABASE_ANON_KEY not configured'
      };
    }

    try {
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`  ❌ HTTP ${response.status}: ${errorText}`);
        return {
          service: 'Supabase',
          status: 'ERROR',
          message: `API call failed: ${response.status}`
        };
      }

      console.log(`  ✅ Connected to: ${url}`);
      console.log(`  ✅ Anonymous key validated`);

      return {
        service: 'Supabase',
        status: 'OK',
        message: 'Supabase API validated successfully',
        details: { url }
      };

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      return {
        service: 'Supabase',
        status: 'ERROR',
        message: error.message
      };
    }
  }

  private async testOpenAI(): Promise<APIResult> {
    console.log('🔹 Testing OpenAI API...');
    
    const apiKey = this.getConfigValue('OPENAI_API_KEY');

    if (!apiKey) {
      return {
        service: 'OpenAI',
        status: 'ERROR',
        message: 'OPENAI_API_KEY not configured'
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`  ❌ HTTP ${response.status}: ${errorText}`);
        return {
          service: 'OpenAI',
          status: 'ERROR',
          message: `API call failed: ${response.status}`
        };
      }

      const data = await response.json();
      const modelCount = data.data?.length || 0;

      console.log(`  ✅ API key validated`);
      console.log(`  ✅ Available models: ${modelCount}`);

      return {
        service: 'OpenAI',
        status: 'OK',
        message: 'OpenAI API validated successfully',
        details: { modelCount }
      };

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      return {
        service: 'OpenAI',
        status: 'ERROR',
        message: error.message
      };
    }
  }

  private async testReplicate(): Promise<APIResult> {
    console.log('🔹 Testing Replicate API...');
    
    const token = this.getConfigValue('REPLICATE_API_TOKEN');

    if (!token) {
      return {
        service: 'Replicate',
        status: 'ERROR',
        message: 'REPLICATE_API_TOKEN not configured'
      };
    }

    try {
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${token}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`  ❌ HTTP ${response.status}: ${errorText}`);
        return {
          service: 'Replicate',
          status: 'ERROR',
          message: `API call failed: ${response.status}`
        };
      }

      console.log(`  ✅ Token validated`);
      console.log(`  ✅ Account accessible`);

      return {
        service: 'Replicate',
        status: 'OK',
        message: 'Replicate API validated successfully'
      };

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      return {
        service: 'Replicate',
        status: 'ERROR',
        message: error.message
      };
    }
  }

  public printSummary(results: APIResult[]): void {
    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log('='.repeat(50));
    
    results.forEach(result => {
      const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${icon} ${result.service}: ${result.status} - ${result.message}`);
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

// Run diagnostics
async function main() {
  const diagnostics = new StandaloneDiagnostics();
  const results = await diagnostics.runDiagnostics();
  diagnostics.printSummary(results);
  
  const failedCount = results.filter(r => r.status === 'ERROR').length;
  process.exit(failedCount > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Diagnostics failed:', error);
    process.exit(1);
  });
}