// Deep Link Service for BarberBuddy
// Handles email confirmation and other auth-related deep links

import * as Linking from 'expo-linking';
import { createSupabaseService } from './supabaseService';

export interface DeepLinkData {
  token_hash?: string;
  type?: string;
  error?: string;
  error_description?: string;
}

export class DeepLinkService {
  private supabaseService = createSupabaseService();

  /**
   * Handle incoming deep links
   */
  async handleDeepLink(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { queryParams } = Linking.parse(url);
      const data = queryParams as DeepLinkData;

      // Handle email confirmation
      if (data.token_hash && data.type === 'email') {
        return await this.handleEmailConfirmation(data.token_hash);
      }

      // Handle errors
      if (data.error) {
        return {
          success: false,
          error: this.getErrorMessage(data.error) || data.error_description || data.error
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process confirmation link'
      };
    }
  }

  /**
   * Handle email confirmation
   */
  private async handleEmailConfirmation(tokenHash: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseService.verifyOtp({
        token_hash: tokenHash,
        type: 'email'
      });

      if (error) {
        return {
          success: false,
          error: 'Email confirmation failed. The link may have expired.'
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Something went wrong during email confirmation'
      };
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: string): string {
    switch (error) {
      case 'invalid_token_hash':
        return 'This confirmation link has expired. Please sign up again.';
      case 'email_address_invalid':
        return 'Invalid email address. Please check and try again.';
      case 'signup_disabled':
        return 'New account registration is currently disabled.';
      default:
        return 'Email confirmation failed. Please try again.';
    }
  }

  /**
   * Setup deep link listener
   */
  setupListener(onDeepLink: (result: { success: boolean; error?: string }) => void) {
    return Linking.addEventListener('url', async ({ url }) => {
      const result = await this.handleDeepLink(url);
      onDeepLink(result);
    });
  }
}

export const createDeepLinkService = (): DeepLinkService => {
  return new DeepLinkService();
};