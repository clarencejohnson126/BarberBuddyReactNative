// OpenAI Service for DALL-E 3 Inpainting
// Handles prompt-based hair edits using OpenAI's Image API

import { Platform, Alert } from 'react-native';
import { OPENAI_API_KEY } from '@env';

export interface OpenAIImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  /** Optional machine-readable error code for UI mapping */
  code?:
    | 'missing_api_key'
    | 'invalid_api_key'
    | 'rate_limited'
    | 'bad_request'
    | 'server_error'
    | 'network_error'
    | 'invalid_prompt'
    | 'unknown';
  processingTime?: number;
}

export interface OpenAIImageParams {
  image: string; // base64 encoded image
  prompt: string; // user's custom prompt
  size?: '1024x1024' | '1792x1024' | '1024x1792';
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    // Load API key from @env - proper Expo/React Native way
    this.apiKey = OPENAI_API_KEY || '';
    
    console.log('🔑 OpenAI API Key loaded:', this.apiKey ? '✅ Found' : '❌ Not found');
    
    if (!this.apiKey) {
      console.error('❌ OPENAI_API_KEY not found in environment variables');
      console.error('💡 Make sure OPENAI_API_KEY is in your .env file');
      Alert.alert("Missing API Key", "Please contact support.");
    }
  }

  /**
   * Generate image using DALL-E 3 with inpainting
   */
  async generateImage(params: OpenAIImageParams): Promise<OpenAIImageResponse> {
    // Pre-validate inputs
    if (!this.apiKey) {
      return { success: false, error: 'Missing OpenAI API key', code: 'missing_api_key' };
    }

    const prompt = (params.prompt || '').trim();
    if (prompt.length < 5) {
      return { success: false, error: 'Prompt is too short. Please describe the hairstyle in a few words.', code: 'invalid_prompt' };
    }

    const attempt = async (): Promise<OpenAIImageResponse> => {
      try {
        console.log('🎨 Starting OpenAI GPT Image 1 generation...');
        console.log('📤 Sending to OpenAI API:', {
          prompt,
          size: params.size || '1024x1024',
          imageSize: `${Math.round((params.image || '').length / 1024)}KB`
        });

        const startTime = Date.now();

        const response = await fetch(`${this.baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-image-1',
            prompt: `Transform this person's hair according to this description: ${prompt}. Keep the same person, same pose, same background, only change the hair style and color as described. Maintain facial features and identity.`,
            n: 1,
            size: params.size || '1024x1024',
          }),
        });

        let responseData: any = {};
        try {
          responseData = await response.json();
        } catch {}

        const processingTime = Date.now() - startTime;

        console.log('📥 OpenAI API Response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });

        if (!response.ok) {
          const code: OpenAIImageResponse['code'] =
            response.status === 401 ? 'invalid_api_key' :
            response.status === 429 ? 'rate_limited' :
            response.status >= 500 ? 'server_error' : 'bad_request';

          const message = responseData?.error?.message || response.statusText || 'OpenAI API error';
          return { success: false, error: `${message}`, code };
        }

        // Parse successful formats
        let imageUrl: string | undefined;
        if (responseData?.data?.[0]?.url) {
          imageUrl = responseData.data[0].url;
        } else if (responseData?.data?.[0]?.b64_json) {
          imageUrl = `data:image/png;base64,${responseData.data[0].b64_json}`;
        }

        if (!imageUrl) {
          console.error('❌ OpenAI response structure (no image):', JSON.stringify(responseData, null, 2));
          return { success: false, error: 'No image URL in OpenAI response', code: 'unknown' };
        }

        console.log('✅ OpenAI generation successful:', {
          imageUrl,
          processingTime: `${processingTime}ms`
        });

        return { success: true, imageUrl, processingTime };
      } catch (err) {
        console.error('❌ OpenAI generation failed (network/unknown):', err);
        return { success: false, error: 'Network error contacting OpenAI', code: 'network_error' };
      }
    };

    // First attempt
    const first = await attempt();
    if (first.success) return first;

    // Retry once on transient errors
    if (['rate_limited', 'server_error', 'network_error'].includes(first.code || 'unknown')) {
      await new Promise(res => setTimeout(res, 1200));
      const second = await attempt();
      return second;
    }

    return first;
  }

  /**
   * Generate image with progress tracking
   */
  async generateImageWithProgress(
    params: OpenAIImageParams,
    onProgress?: (progress: { status: string; progress: number; estimatedTime?: number }) => void
  ): Promise<OpenAIImageResponse> {
    try {
      // Update progress
      onProgress?.({ status: 'preparing', progress: 10 });
      
      // Validate API key
      if (!this.apiKey) {
        return { success: false, error: 'OpenAI API key not configured', code: 'missing_api_key' };
      }

      // Validate prompt early for better UX
      const prompt = (params.prompt || '').trim();
      if (prompt.length < 5) {
        return { success: false, error: 'Prompt is too short. Please describe the hairstyle in a few words.', code: 'invalid_prompt' };
      }

      // Update progress
      onProgress?.({ status: 'uploading', progress: 30 });

      // Generate image
      const result = await this.generateImage({ ...params, prompt });

      if (result.success) {
        onProgress?.({ status: 'completed', progress: 100 });
        return result;
      } else {
        return result;
      }

    } catch (error) {
      console.error('❌ OpenAI generation with progress failed:', error);
      
      return { success: false, error: 'OpenAI API request failed', code: 'unknown' };
    }
  }

  /**
   * Test OpenAI API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.error('❌ OPENAI_API_KEY not configured');
        return false;
      }

      // Test with a simple API call
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const success = response.ok;
      console.log(`🔍 OpenAI API connection test: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      return success;
    } catch (error) {
      console.error('❌ OpenAI API connection test failed:', error);
      return false;
    }
  }
}

// Factory function to create OpenAI service instance
export const createOpenAIService = (): OpenAIService => {
  return new OpenAIService();
}; 