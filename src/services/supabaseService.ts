// Supabase service for BarberBuddy
// Handles user data, image metadata storage, and authentication

import Constants from 'expo-constants';
import { createClient, User, Session, AuthError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth-related interfaces
export interface AuthResult {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
  errorType?: 'network' | 'auth' | 'validation' | 'confirmation' | 'unknown';
}

export interface SignUpResult extends AuthResult {
  needsConfirmation?: boolean;
}

export interface ImageMetadata {
  id?: string;
  user_id?: string;
  original_image_url: string;
  generated_image_url: string;
  style_prompt: string;
  gender?: string;
  hair_color?: string;
  output_format: string;
  processing_time?: number;
  created_at?: string;
  is_custom_prompt: boolean;
  character_consistency_warning?: boolean;
  is_favorite?: boolean;
}

export interface UserTier {
  tier: 'free' | 'plus' | 'pro';
  monthly_limit: number;
  current_usage: number;
  reset_date: string;
  features: string[];
}

export class SupabaseService {
  private supabase;

  constructor() {
    const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL || 
                       Constants.expoConfig?.extra?.supabaseUrl ||
                       process.env.SUPABASE_URL;
    const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || 
                           Constants.expoConfig?.extra?.supabaseAnonKey ||
                           process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    console.log('🔍 SUPABASE INIT - Creating client with proper AsyncStorage...');
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    
    console.log('🔍 SUPABASE INIT - Client created with AsyncStorage for session persistence');
  }

  /**
   * Parse Supabase auth errors into user-friendly messages
   */
  private parseAuthError(error: any): { message: string; type: AuthResult['errorType'] } {
    if (!error) return { message: 'Unknown error occurred', type: 'unknown' };

    const errorMessage = error.message || error.toString();
    
    // Network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return { message: 'Network error. Please check your connection and try again.', type: 'network' };
    }

    // Authentication errors
    if (errorMessage.includes('Invalid login credentials')) {
      return { message: 'Email or password is incorrect', type: 'auth' };
    }

    if (errorMessage.includes('Email not confirmed')) {
      return { message: 'Please check your email and confirm your account before signing in', type: 'confirmation' };
    }

    if (errorMessage.includes('User already registered')) {
      return { message: 'An account with this email already exists', type: 'auth' };
    }

    if (errorMessage.includes('Password should be at least')) {
      return { message: 'Password must be at least 6 characters long', type: 'validation' };
    }

    if (errorMessage.includes('Unable to validate email address')) {
      return { message: 'Please enter a valid email address', type: 'validation' };
    }

    if (errorMessage.includes('Signup is disabled')) {
      return { message: 'New account registration is currently disabled', type: 'auth' };
    }

    // Default to the original error message for unknown errors
    return { message: errorMessage, type: 'unknown' };
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    return { valid: true };
  }

  /**
   * Store image metadata in Supabase
   * @param metadata - Image metadata to store
   * @returns Promise with stored metadata
   */
  async storeImageMetadata(metadata: Omit<ImageMetadata, 'id' | 'created_at'>): Promise<ImageMetadata> {
    try {
      const { data, error } = await this.supabase
        .from('image_generations')
        .insert({
          user_id: metadata.user_id || 'anonymous',
          original_image_url: metadata.original_image_url,
          generated_image_url: metadata.generated_image_url,
          style_prompt: metadata.style_prompt,
          gender: metadata.gender,
          hair_color: metadata.hair_color,
          output_format: metadata.output_format,
          processing_time: metadata.processing_time,
          is_custom_prompt: metadata.is_custom_prompt,
          character_consistency_warning: metadata.character_consistency_warning,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store image metadata: ${error.message}`);
      }

      return data as ImageMetadata;
    } catch (error) {
      console.error('Error storing image metadata:', error);
      throw new Error('Failed to store image metadata');
    }
  }

  /**
   * Get user's image generation history
   * @param userId - User ID
   * @param limit - Number of records to return
   * @returns Promise with image metadata array
   */
  async getUserImageHistory(userId: string, limit: number = 20): Promise<ImageMetadata[]> {
    try {
      const { data, error } = await this.supabase
        .from('image_generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch user image history: ${error.message}`);
      }

      return data as ImageMetadata[];
    } catch (error) {
      console.error('Error fetching user image history:', error);
      throw new Error('Failed to fetch image history');
    }
  }

  /**
   * Get user tier information
   * @param userId - User ID
   * @returns Promise with user tier information
   */
  async getUserTier(userId: string): Promise<UserTier> {
    try {
      const { data, error } = await this.supabase
        .from('user_tiers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return {
          tier: 'free',
          monthly_limit: 999999,
          current_usage: 0,
          reset_date: new Date().toISOString(),
          features: ['unlimited_generation'],
        };
      }

      return data as UserTier;
    } catch (error) {
      console.error('Error fetching user tier:', error);
      return {
        tier: 'free',
        monthly_limit: 999999,
        current_usage: 0,
        reset_date: new Date().toISOString(),
        features: ['unlimited_generation'],
      };
    }
  }

  /**
   * Update user's usage count (no longer enforces limits)
   * @param userId - User ID
   * @returns Promise with updated usage count
   */
  async incrementUserUsage(userId: string): Promise<number> {
    try {
      const currentTier = await this.getUserTier(userId);

      // No limit checking - allow unlimited generations
      const { data, error } = await this.supabase
        .from('user_tiers')
        .update({ current_usage: currentTier.current_usage + 1 })
        .eq('user_id', userId)
        .select('current_usage')
        .single();

      if (error) {
        console.log('Failed to update user usage (non-critical):', error.message);
        return currentTier.current_usage + 1;
      }

      return data.current_usage;
    } catch (error) {
      console.log('Error incrementing user usage (non-critical):', error);
      return 0; // Return 0 instead of throwing error
    }
  }

  /**
   * Get global usage statistics
   * @returns Promise with global usage data
   */
  async getGlobalUsageStats(): Promise<{ total_generations: number; free_generations: number }> {
    try {
      const { data, error } = await this.supabase
        .from('image_generations')
        .select('id, user_id');

      if (error) {
        throw new Error(`Failed to fetch global usage stats: ${error.message}`);
      }

      const totalGenerations = data?.length || 0;

      const freeGenerations = data?.filter(gen =>
        gen.user_id === 'anonymous' || gen.user_id === null
      ).length || 0;

      return {
        total_generations: totalGenerations,
        free_generations: freeGenerations,
      };
    } catch (error) {
      console.error('Error fetching global usage stats:', error);
      return {
        total_generations: 0,
        free_generations: 0,
      };
    }
  }

  /**
   * Check if global free limit has been reached (always returns false now)
   * @returns Promise with boolean indicating if limit reached
   */
  async isGlobalFreeLimitReached(): Promise<boolean> {
    // Always return false - no limits
    return false;
  }

  /**
   * Check if admin alert threshold has been reached
   * @returns Promise with boolean indicating if threshold reached
   */
  async shouldSendAdminAlert(): Promise<boolean> {
    try {
      const stats = await this.getGlobalUsageStats();
      const adminAlertThreshold = parseInt(Constants.expoConfig?.extra?.ADMIN_ALERT_THRESHOLD || '500');

      return stats.free_generations >= adminAlertThreshold;
    } catch (error) {
      console.error('Error checking admin alert threshold:', error);
      return false;
    }
  }

  /**
   * Toggle favorite status of an image
   * @param imageId - Image ID
   * @param isFavorite - New favorite status
   * @returns Promise with success status
   */
  async toggleImageFavorite(imageId: string, isFavorite: boolean): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('image_generations')
        .update({ is_favorite: isFavorite })
        .eq('id', imageId);

      if (error) {
        throw new Error(`Failed to toggle favorite: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }

  /**
   * Delete an image from the database
   * @param imageId - Image ID
   * @returns Promise with success status
   */
  async deleteImage(imageId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('image_generations')
        .delete()
        .eq('id', imageId);

      if (error) {
        throw new Error(`Failed to delete image: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Get current user
   * @returns Current user or null
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data } = await this.supabase.auth.getUser();
      return data.user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current session
   * @returns Current session or null
   */
  getCurrentSession(): Promise<Session | null> {
    return this.supabase.auth.getSession().then(({ data }) => data.session).catch(() => null);
  }

  /**
   * Verify OTP for email confirmation
   * @param params - OTP verification parameters
   */
  async verifyOtp(params: { token_hash: string; type: string }): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.auth.verifyOtp(params);
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Sign up with email and password
   * @param email - User email
   * @param password - User password
   * @param options - Additional options like emailRedirectTo
   * @returns Promise with structured auth result
   */
  async signUp(email: string, password: string, options?: { emailRedirectTo?: string }): Promise<SignUpResult> {
    try {
      // Validate inputs
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required',
          errorType: 'validation'
        };
      }

      if (!this.validateEmail(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address',
          errorType: 'validation'
        };
      }

      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.message!,
          errorType: 'validation'
        };
      }

      const { data, error } = await this.supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: options?.emailRedirectTo
        }
      });

      if (error) {
        const parsedError = this.parseAuthError(error);
        return {
          success: false,
          error: parsedError.message,
          errorType: parsedError.type
        };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        needsConfirmation: !data.session // No session means email confirmation needed
      };

    } catch (error) {
      const parsedError = this.parseAuthError(error);
      return {
        success: false,
        error: parsedError.message,
        errorType: parsedError.type
      };
    }
  }

  /**
   * Sign in with email and password
   * @param email - User email
   * @param password - User password
   * @returns Promise with structured auth result
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      // Validate inputs
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required',
          errorType: 'validation'
        };
      }

      if (!this.validateEmail(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address',
          errorType: 'validation'
        };
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const parsedError = this.parseAuthError(error);
        return {
          success: false,
          error: parsedError.message,
          errorType: parsedError.type
        };
      }

      // CRITICAL: Immediately check if session is actually stored
      console.log('🔍 Session storage check after login...');
      setTimeout(async () => {
        const storedSession = await this.supabase.auth.getSession();
        console.log('🔍 Stored session:', {
          hasStoredSession: !!storedSession.data.session,
          storedUserEmail: storedSession.data.session?.user?.email,
          error: storedSession.error?.message
        });
      }, 100);

      return {
        success: true,
        user: data.user,
        session: data.session
      };

    } catch (error) {
      const parsedError = this.parseAuthError(error);
      return {
        success: false,
        error: parsedError.message,
        errorType: parsedError.type
      };
    }
  }

  /**
   * Sign out current user
   * @returns Promise with structured result
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚪 SupabaseService.signOut() calling Supabase signOut with global scope...');
      const { error } = await this.supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.log('❌ SupabaseService.signOut() error:', error.message);
        return {
          success: false,
          error: 'Failed to sign out. Please try again.'
        };
      }

      console.log('✅ SupabaseService.signOut() successful - server-side tokens revoked');
      return { success: true };

    } catch (error) {
      console.log('💥 SupabaseService.signOut() exception:', error);
      return {
        success: false,
        error: 'Failed to sign out. Please try again.'
      };
    }
  }

  /**
   * Force clear ALL auth data from AsyncStorage
   * This ensures complete logout even if normal signOut fails
   */
  async forceSignOut(): Promise<void> {
    try {
      console.log('🔥 SupabaseService.forceSignOut() clearing ALL AsyncStorage auth data...');
      
      // Clear all Supabase-related AsyncStorage keys
      const keysToRemove = [
        'supabase.auth.token',
        'sb-auth-token',
        'sb-refresh-token',
        'sb-session',
        'supabase.session',
        'supabase.auth.session',
        'supabase.auth.user',
        'supabase.token',
        'auth.session',
        'auth.token',
        'auth.user'
      ];

      // Also clear any keys starting with 'sb-' (Supabase prefix)
      const allKeys = await AsyncStorage.getAllKeys();
      const supabaseKeys = allKeys.filter(key => 
        key.startsWith('sb-') || 
        key.includes('supabase') || 
        (key.includes('auth') && key !== 'user_just_logged_out') // PRESERVE logout flag
      );
      
      const allKeysToRemove = [...new Set([...keysToRemove, ...supabaseKeys])];
      
      console.log('🔥 Removing AsyncStorage keys (preserving logout flag):', allKeysToRemove);
      await AsyncStorage.multiRemove(allKeysToRemove);
      
      // Extra nuclear option - clear session from Supabase client  
      await this.supabase.auth.signOut({ scope: 'global' });
      
      console.log('🔥 SupabaseService.forceSignOut() complete - ALL auth data cleared (logout flag preserved)');
    } catch (error) {
      console.log('❌ SupabaseService.forceSignOut() error:', error);
      // Continue anyway - we still want to clear local state
    }
  }

  /**
   * Listen to auth state changes
   * @param callback - Callback function for auth state changes
   * @returns Unsubscribe function
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: authListener } = this.supabase.auth.onAuthStateChange(callback);
    return authListener;
  }
}

let __supabaseServiceSingleton: SupabaseService | null = null;

export const createSupabaseService = (): SupabaseService => {
  if (!__supabaseServiceSingleton) {
    __supabaseServiceSingleton = new SupabaseService();
  }
  return __supabaseServiceSingleton;
};