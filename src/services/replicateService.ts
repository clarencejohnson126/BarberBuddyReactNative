// Replicate API Service for BarberBuddy
// REST HTTP endpoints implementation for React Native compatibility

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { REPLICATE_API_TOKEN } from '@env';
import {
  ReplicateConfig,
  HaircutParams,
  ReplicatePrediction,
  GenerationResult,
  ValidationResult,
  ModelInfo,
  HaircutStyle,
  ReplicateError,
  ValidationError,
  GenerationProgress,
} from '../types/replicate';

// Factory function to create ReplicateService instance
export const createReplicateService = (): ReplicateService => {
  const apiToken = REPLICATE_API_TOKEN || 
                   Constants.expoConfig?.extra?.replicateApiToken ||
                   process.env.REPLICATE_API_TOKEN;
  
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN environment variable is required');
  }
  
  return new ReplicateService(apiToken);
};

export class ReplicateService {
  private config: ReplicateConfig;
  private baseUrl = 'https://api.replicate.com/v1';

  constructor(apiToken: string) {
    this.config = {
      apiToken,
      modelVersion: '735c13ba40448758e00e6bb2d764624508bed5a07bbb6a5f33e41482fed8ac88', // Use the working version
      baseUrl: this.baseUrl,
    };
  }

  // Get model information and available parameters
  async getModelInfo(): Promise<ModelInfo> {
    try {
      console.log('🔑 Using API token:', this.config.apiToken.substring(0, 10) + '...');
      
      // First, get the model information including latest version
      const modelResponse = await fetch(`${this.baseUrl}/models/flux-kontext-apps/change-haircut`, {
        headers: {
          'Authorization': `Token ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!modelResponse.ok) {
        throw new ReplicateError(`Failed to fetch model info: ${modelResponse.statusText}`, modelResponse.status);
      }

      const modelData = await modelResponse.json();
      const latestVersionId = modelData.latest_version?.id;

      // Update the model version to the latest, but verify it exists first
      if (latestVersionId) {
        // Test if the version exists by trying to fetch it
        try {
          const versionTestResponse = await fetch(`${this.baseUrl}/models/flux-kontext-apps/change-haircut/versions/${latestVersionId}`, {
            headers: {
              'Authorization': `Token ${this.config.apiToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (versionTestResponse.ok) {
            this.config.modelVersion = latestVersionId;
            console.log('🔄 Updated model version to:', latestVersionId);
          } else {
            console.warn('⚠️ Latest version not accessible, keeping current version:', this.config.modelVersion);
          }
        } catch (versionError) {
          console.warn('⚠️ Could not verify latest version, keeping current version:', this.config.modelVersion);
        }
      }

      // Fetch the actual schema from the current version to get real parameters
      let availableStyles: HaircutStyle[] = [];
      let availableColors = this.getFallbackColors();
      let availableHaircuts: string[] = [];
      
      // Get the schema for the current version
      try {
        const versionResponse = await fetch(`${this.baseUrl}/models/flux-kontext-apps/change-haircut/versions/${this.config.modelVersion}`, {
          headers: {
            'Authorization': `Token ${this.config.apiToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (versionResponse.ok) {
          const versionData = await versionResponse.json();
          console.log('📋 Real Model Schema from flux-kontext-apps/change-haircut:', {
            version: versionData.id,
            created_at: versionData.created_at,
            schema_keys: versionData.openapi_schema ? Object.keys(versionData.openapi_schema) : 'No schema',
          });
          
          // Extract real parameters from the schema if available
          const schema = versionData.openapi_schema;
          if (schema?.components?.schemas?.Input?.properties) {
            const properties = schema.components.schemas.Input.properties;
            
            console.log('🎯 LIVE Model Parameters:', Object.keys(properties));
            
            // Extract haircut options if available
            if (properties.haircut?.enum) {
              availableHaircuts = properties.haircut.enum;
              console.log('✂️ LIVE Haircut Options from API:', availableHaircuts);
              
              // Convert to HaircutStyle format for UI
              availableStyles = availableHaircuts.map((haircut, index) => ({
                id: haircut.toLowerCase().replace(/\s+/g, '-'),
                name: haircut,
                description: `${haircut} style`,
                category: 'modern' as const,
                gender: 'unisex' as const
              }));
            }
            
            // Extract hair colors if available
            if (properties.hair_color?.enum) {
              availableColors = properties.hair_color.enum;
              console.log('🎨 LIVE Hair Colors from API:', availableColors);
            }
            
            // Extract output format options
            if (properties.output_format?.enum) {
              const formats = properties.output_format.enum;
              console.log('📸 LIVE Output Formats from API:', formats);
              
              return {
                version: this.config.modelVersion,
                availableStyles: availableStyles,
                availableColors: availableColors,
                availableFormats: formats,
                availableHaircuts: availableHaircuts, // Store exact API values
                maxImageSize: 10 * 1024 * 1024,
                supportedFormats: formats,
                characterConsistencyNote: 'The flux-kontext-apps/change-haircut model preserves facial identity and character consistency. Custom prompts may reduce consistency.',
              };
            }
          }
        }
      } catch (schemaError) {
        console.warn('Could not fetch model schema, using fallback data:', schemaError);
      }
      
      if (latestVersionId) {
        try {
          const versionResponse = await fetch(`${this.baseUrl}/models/flux-kontext-apps/change-haircut/versions/${latestVersionId}`, {
            headers: {
              'Authorization': `Token ${this.config.apiToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (versionResponse.ok) {
            const versionData = await versionResponse.json();
            console.log('📋 Real Model Schema from flux-kontext-apps/change-haircut:', {
              version: versionData.id,
              created_at: versionData.created_at,
              schema_keys: versionData.openapi_schema ? Object.keys(versionData.openapi_schema) : 'No schema',
            });
            
            // Extract real parameters from the schema if available
            const schema = versionData.openapi_schema;
            if (schema?.components?.schemas?.Input?.properties) {
              const properties = schema.components.schemas.Input.properties;
              
              console.log('🎯 LIVE Model Parameters:', Object.keys(properties));
              
              // Extract hair colors if available
              if (properties.hair_color?.enum) {
                availableColors = properties.hair_color.enum;
                console.log('🎨 LIVE Hair Colors from API:', availableColors);
              }
              
              // Extract output format options
              if (properties.output_format?.enum) {
                const formats = properties.output_format.enum;
                console.log('📸 LIVE Output Formats from API:', formats);
                // Update available formats
                return {
                  version: latestVersionId || 'latest',
                  availableStyles: availableStyles,
                  availableColors: availableColors,
                  availableFormats: formats,
                  maxImageSize: 10 * 1024 * 1024,
                  supportedFormats: formats,
                  characterConsistencyNote: 'The flux-kontext-apps/change-haircut model preserves facial identity and character consistency. Custom prompts may reduce consistency.',
                };
              }
              
              // Extract guidance scale info
              if (properties.guidance_scale) {
                console.log('🎛️ Guidance Scale Range:', properties.guidance_scale);
              }
            }
          }
        } catch (schemaError) {
          console.warn('Could not fetch model schema, using fallback data:', schemaError);
        }
      }
      
      return {
        version: latestVersionId || 'latest',
        availableStyles: availableStyles,
        availableColors: availableColors,
        availableFormats: ['jpg', 'png', 'webp'],
        maxImageSize: 10 * 1024 * 1024, // 10MB
        supportedFormats: ['jpeg', 'jpg', 'png', 'webp'],
        characterConsistencyNote: 'The flux-kontext-apps/change-haircut model preserves facial identity and character consistency. Custom prompts may reduce consistency.',
      };
    } catch (error) {
      console.error('Error fetching model info:', error);
      // Return fallback data if API fails
      return {
        version: 'latest',
        availableStyles: this.getFallbackStyles(),
        availableColors: this.getFallbackColors(),
        availableFormats: ['jpg', 'png'],
        maxImageSize: 10 * 1024 * 1024,
        supportedFormats: ['jpeg', 'jpg', 'png'],
        characterConsistencyNote: 'Custom prompts may reduce character consistency. For best results, use preset styles.',
      };
    }
  }

  // Get fallback haircut styles based on actual Replicate API options
  private getFallbackStyles(): HaircutStyle[] {
    return [
      // Male Styles
      { id: 'undercut', name: 'Undercut', description: 'Modern undercut style', category: 'modern', gender: 'male' },
      { id: 'crew-cut', name: 'Crew Cut', description: 'Classic crew cut', category: 'classic', gender: 'male' },
      { id: 'slicked-back', name: 'Slicked Back', description: 'Sleek slicked back style', category: 'classic', gender: 'male' },
      { id: 'side-parted', name: 'Side-Parted', description: 'Traditional side part', category: 'classic', gender: 'male' },
      { id: 'center-parted', name: 'Center-Parted', description: 'Center part style', category: 'modern', gender: 'male' },
      { id: 'mohawk', name: 'Mohawk', description: 'Edgy mohawk style', category: 'trendy', gender: 'male' },
      { id: 'faux-hawk', name: 'Faux Hawk', description: 'Faux hawk style', category: 'trendy', gender: 'male' },
      { id: 'messy-bun', name: 'Messy Bun', description: 'Casual messy bun', category: 'modern', gender: 'male' },
      { id: 'top-knot', name: 'Top Knot', description: 'Modern top knot', category: 'modern', gender: 'male' },
      
      // Female Styles
      { id: 'bob', name: 'Bob', description: 'Classic bob haircut', category: 'classic', gender: 'female' },
      { id: 'pixie-cut', name: 'Pixie Cut', description: 'Short pixie style', category: 'modern', gender: 'female' },
      { id: 'layered', name: 'Layered', description: 'Layered haircut', category: 'modern', gender: 'female' },
      { id: 'shag', name: 'Shag', description: 'Textured shag style', category: 'trendy', gender: 'female' },
      { id: 'lob', name: 'Lob', description: 'Long bob style', category: 'modern', gender: 'female' },
      { id: 'angled-bob', name: 'Angled Bob', description: 'Angled bob style', category: 'modern', gender: 'female' },
      { id: 'a-line-bob', name: 'A-Line Bob', description: 'A-line bob style', category: 'modern', gender: 'female' },
      { id: 'asymmetrical-bob', name: 'Asymmetrical Bob', description: 'Asymmetrical bob style', category: 'modern', gender: 'female' },
      { id: 'blunt-bangs', name: 'Blunt Bangs', description: 'Blunt bangs style', category: 'modern', gender: 'female' },
      { id: 'side-swept-bangs', name: 'Side-Swept Bangs', description: 'Side-swept bangs', category: 'modern', gender: 'female' },
      { id: 'high-ponytail', name: 'High Ponytail', description: 'High ponytail style', category: 'modern', gender: 'female' },
      { id: 'low-ponytail', name: 'Low Ponytail', description: 'Low ponytail style', category: 'modern', gender: 'female' },
      { id: 'braided-ponytail', name: 'Braided Ponytail', description: 'Braided ponytail style', category: 'modern', gender: 'female' },
      { id: 'french-braid', name: 'French Braid', description: 'French braid style', category: 'modern', gender: 'female' },
      { id: 'dutch-braid', name: 'Dutch Braid', description: 'Dutch braid style', category: 'modern', gender: 'female' },
      { id: 'fishtail-braid', name: 'Fishtail Braid', description: 'Fishtail braid style', category: 'modern', gender: 'female' },
      { id: 'space-buns', name: 'Space Buns', description: 'Space buns style', category: 'trendy', gender: 'female' },
      
      // Unisex Styles
      { id: 'straight', name: 'Straight', description: 'Straight hair style', category: 'classic', gender: 'unisex' },
      { id: 'wavy', name: 'Wavy', description: 'Wavy hair style', category: 'modern', gender: 'unisex' },
      { id: 'curly', name: 'Curly', description: 'Curly hair style', category: 'modern', gender: 'unisex' },
      { id: 'messy', name: 'Messy', description: 'Messy hair style', category: 'modern', gender: 'unisex' },
      { id: 'tousled', name: 'Tousled', description: 'Tousled hair style', category: 'modern', gender: 'unisex' },
      { id: 'feathered', name: 'Feathered', description: 'Feathered hair style', category: 'classic', gender: 'unisex' },
      { id: 'perm', name: 'Perm', description: 'Permed hair style', category: 'classic', gender: 'unisex' },
      { id: 'ombré', name: 'Ombré', description: 'Ombré hair style', category: 'trendy', gender: 'unisex' },
      { id: 'straightened', name: 'Straightened', description: 'Straightened hair style', category: 'modern', gender: 'unisex' },
      { id: 'soft-waves', name: 'Soft Waves', description: 'Soft waves style', category: 'modern', gender: 'unisex' },
      { id: 'glamorous-waves', name: 'Glamorous Waves', description: 'Glamorous waves style', category: 'modern', gender: 'unisex' },
      { id: 'hollywood-waves', name: 'Hollywood Waves', description: 'Hollywood waves style', category: 'modern', gender: 'unisex' },
      { id: 'finger-waves', name: 'Finger Waves', description: 'Finger waves style', category: 'classic', gender: 'unisex' },
    ];
  }

  // Get fallback hair colors if API doesn't provide them (based on REAL API)
  private getFallbackColors(): string[] {
    return [
      'No change', 'Random', 'Blonde', 'Brunette', 'Black', 'Auburn', 'Red', 'Gray', 'White'
    ];
  }

  // Validate image before sending to API
  validateImage(imageData: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if it's a valid base64 image
      if (!imageData.startsWith('data:image/')) {
        errors.push('Invalid image format. Please upload a JPEG or PNG image.');
      }

      // Check file size (max 10MB)
      const base64Size = Math.ceil((imageData.length * 3) / 4);
      if (base64Size > 10 * 1024 * 1024) {
        errors.push('Image file size too large. Maximum size is 10MB.');
      }

      // Check image format
      if (!imageData.includes('image/jpeg') && !imageData.includes('image/png')) {
        errors.push('Unsupported image format. Please use JPEG or PNG.');
      }

      // Check for minimum dimensions (recommended)
      if (imageData.length < 10000) { // Rough estimate for very small images
        warnings.push('Image appears to be very small. For best results, use a high-resolution image.');
      }

    } catch (error) {
      errors.push('Failed to validate image data.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Generate haircut using Flux Kontext model with REST API
  async generateHaircut(params: HaircutParams): Promise<GenerationResult> {
    try {
      // Validate input
      const validation = this.validateImage(params.image);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join(', '));
      }

      // Get model info to validate haircut parameter
      const modelInfo = await this.getModelInfo();
      const availableHaircuts = modelInfo.availableHaircuts || [];
      
      // Validate haircut parameter
      let haircutValue = 'No change';
      if (params.prompt) {
        // Custom prompt - use 'No change' for haircut
        haircutValue = 'No change';
      } else if (params.style && availableHaircuts.includes(params.style)) {
        // Valid preset style
        haircutValue = params.style;
      } else if (params.style) {
        // Invalid style - throw error
        throw new ValidationError(`Invalid haircut style: "${params.style}". Available options: ${availableHaircuts.join(', ')}`);
      }
      
      console.log('✂️ Using haircut value:', haircutValue);
      console.log('📋 Available haircuts:', availableHaircuts);
      
      // Prepare input for Flux Kontext model using REAL API parameters
      const input = {
        input_image: params.image,
        haircut: haircutValue,
        gender: params.gender || 'male',
        hair_color: params.hairColor || 'No change',
        output_format: params.outputFormat || 'jpg',
        aspect_ratio: '1:1', // Add aspect ratio parameter - might be required
        seed: params.seed || Math.floor(Math.random() * 1000000),
        safety_tolerance: 2, // Default safety tolerance
      };

      // Create prediction using REST API
      const createResponse = await fetch(`${this.baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: this.config.modelVersion,
          input,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new ReplicateError(
          errorData.error || `API request failed: ${createResponse.statusText}`,
          createResponse.status
        );
      }

      const prediction: ReplicatePrediction = await createResponse.json();
      
      // Poll for completion
      const result = await this.pollPrediction(prediction.id);
      
      return {
        success: true,
        imageUrl: result.imageUrl,
        requestId: prediction.id,
        processingTime: result.processingTime,
      };

    } catch (error) {
      console.error('Error generating haircut:', error);
      
      if (error instanceof ReplicateError) {
        throw error;
      }
      
      throw new ReplicateError('Failed to generate haircut. Please try again.');
    }
  }

  // Poll prediction status until completion
  private async pollPrediction(predictionId: string): Promise<{ imageUrl: string; processingTime?: number }> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${this.config.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new ReplicateError(`Failed to check prediction status: ${response.statusText}`, response.status);
      }

      const prediction: ReplicatePrediction = await response.json();

      switch (prediction.status) {
        case 'succeeded':
          const output = prediction.output;
          
          // Handle both array and string outputs
          let imageUrl: string | null = null;
          
          if (Array.isArray(output) && output.length > 0) {
            // Output is an array - use first element
            imageUrl = output[0] as string;
          } else if (typeof output === 'string' && (output as string).trim() !== '') {
            // Output is a string - use directly
            imageUrl = output as string;
          }
          
          if (imageUrl) {
            return {
              imageUrl: imageUrl,
              processingTime: prediction.metrics?.predict_time,
            };
          }
          throw new ReplicateError(`No valid image URL in prediction output. Output: ${JSON.stringify(output)}, Type: ${typeof output}`);
          
        case 'failed':
          throw new ReplicateError(prediction.error || 'Generation failed');
          
        case 'canceled':
          throw new ReplicateError('Generation was canceled');
          
        case 'starting':
        case 'processing':
          // Continue polling
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second intervals
          attempts++;
          break;
          
        default:
          throw new ReplicateError(`Unknown prediction status: ${prediction.status}`);
      }
    }

    throw new ReplicateError('Prediction timed out');
  }

  // Generate haircut with progress tracking (async mode)
  async generateHaircutWithProgress(params: HaircutParams, onProgress?: (progress: GenerationProgress) => void): Promise<GenerationResult> {
    try {
      // Validate input
      const validation = this.validateImage(params.image);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join(', '));
      }

      console.log('🔍 Starting Replicate API call with params:', {
        hasImage: !!params.image,
        imagePrefix: params.image.substring(0, 50) + '...',
        prompt: params.prompt,
        style: params.style,
        gender: params.gender,
        hairColor: params.hairColor,
        outputFormat: params.outputFormat
      });

      // Get model info to validate haircut parameter
      const modelInfo = await this.getModelInfo();
      const availableHaircuts = modelInfo.availableHaircuts || [];
      
      // Validate haircut parameter
      let haircutValue = 'No change';
      if (params.prompt) {
        // Custom prompt - use 'No change' for haircut
        haircutValue = 'No change';
      } else if (params.style && availableHaircuts.includes(params.style)) {
        // Valid preset style
        haircutValue = params.style;
      } else if (params.style) {
        // Invalid style - throw error
        throw new ValidationError(`Invalid haircut style: "${params.style}". Available options: ${availableHaircuts.join(', ')}`);
      }
      
      console.log('✂️ Using haircut value:', haircutValue);
      console.log('📋 Available haircuts:', availableHaircuts);
      
      // Prepare input for Flux Kontext model using REAL API parameters
      const input = {
        input_image: params.image,
        haircut: haircutValue,
        gender: params.gender || 'male',
        hair_color: params.hairColor || 'No change',
        output_format: params.outputFormat || 'jpg',
        aspect_ratio: '1:1', // Add aspect ratio parameter - might be required
        seed: params.seed || Math.floor(Math.random() * 1000000),
        safety_tolerance: 2, // Default safety tolerance
      };

      console.log('📤 Sending to Replicate API:', {
        model: 'flux-kontext-apps/change-haircut',
        version: this.config.modelVersion,
        inputKeys: Object.keys(input),
        haircut: input.haircut,
        gender: input.gender,
        hair_color: input.hair_color,
        output_format: input.output_format,
        aspect_ratio: input.aspect_ratio,
        seed: input.seed,
        safety_tolerance: input.safety_tolerance,
        imageSize: `${Math.ceil((input.input_image.length * 3) / 4)} bytes`,
        imagePrefix: input.input_image.substring(0, 100) + '...'
      });

      // Create prediction using REST API
      const createResponse = await fetch(`${this.baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: this.config.modelVersion,
          input,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        console.error('❌ Replicate API Error Details:', {
          status: createResponse.status,
          statusText: createResponse.statusText,
          errorData,
          requestBody: { version: this.config.modelVersion, input: { ...input, input_image: '[base64 image data]' } }
        });
        
        // If version doesn't exist, try with 'latest' instead
        if (createResponse.status === 422 && errorData.detail?.includes('version does not exist')) {
          console.log('🔄 Trying with "latest" version instead...');
          const fallbackResponse = await fetch(`${this.baseUrl}/predictions`, {
            method: 'POST',
            headers: {
              'Authorization': `Token ${this.config.apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              version: 'latest',
              input,
            }),
          });
          
          if (fallbackResponse.ok) {
            const prediction: ReplicatePrediction = await fallbackResponse.json();
            const result = await this.pollPredictionWithProgress(prediction.id, onProgress);
            return {
              success: true,
              imageUrl: result.imageUrl,
              requestId: prediction.id,
              processingTime: result.processingTime,
            };
          } else {
            const fallbackErrorData = await fallbackResponse.json().catch(() => ({}));
            throw new ReplicateError(
              fallbackErrorData.detail || fallbackErrorData.error || 'Both version and latest failed',
              fallbackResponse.status
            );
          }
        }
        
        const errorMessage = errorData.detail || errorData.error || errorData.message || 
                            `API request failed: ${createResponse.status} ${createResponse.statusText}`;
        
        throw new ReplicateError(errorMessage, createResponse.status);
      }

      const prediction: ReplicatePrediction = await createResponse.json();

      // Poll for completion with progress updates
      const result = await this.pollPredictionWithProgress(prediction.id, onProgress);

      return {
        success: true,
        imageUrl: result.imageUrl,
        requestId: prediction.id,
        processingTime: result.processingTime,
      };

    } catch (error) {
      console.error('Error generating haircut with progress:', error);
      
      if (error instanceof ReplicateError) {
        throw error;
      }
      
      throw new ReplicateError('Failed to generate haircut. Please try again.');
    }
  }

  // Poll prediction with progress updates
  private async pollPredictionWithProgress(
    predictionId: string, 
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<{ imageUrl: string; processingTime?: number }> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${this.config.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new ReplicateError(`Failed to check prediction status: ${response.statusText}`, response.status);
      }

      const prediction: ReplicatePrediction = await response.json();

      // Report progress
      if (onProgress) {
        let status: GenerationProgress['status'] = 'preparing';
        let progress = 0;
        let estimatedTime: number | undefined;

        switch (prediction.status) {
          case 'starting':
            status = 'preparing';
            progress = 10;
            estimatedTime = 30;
            break;
          case 'processing':
            status = 'processing';
            progress = 50;
            estimatedTime = 25;
            break;
          case 'succeeded':
            status = 'completed';
            progress = 100;
            break;
          case 'failed':
            status = 'error';
            progress = 0;
            break;
          case 'canceled':
            status = 'error';
            progress = 0;
            break;
        }

        onProgress({
          status,
          progress,
          estimatedTime,
          currentStep: prediction.status,
          error: prediction.error,
        });
      }

      // LOG FULL PREDICTION RESPONSE FOR DEBUGGING
      console.log('🔍 Replicate Prediction Raw:', JSON.stringify(prediction, null, 2));

      switch (prediction.status) {
        case 'succeeded':
          const output = prediction.output;
          console.log('📤 Prediction Output Details:', {
            output: output,
            outputType: typeof output,
            isArray: Array.isArray(output),
            length: Array.isArray(output) ? output.length : 'N/A',
            firstItem: Array.isArray(output) && output.length > 0 ? output[0] : 'None',
            logs: prediction.logs,
            error: prediction.error
          });
          
          // Handle both array and string outputs
          let imageUrl: string | null = null;
          
          if (Array.isArray(output) && output.length > 0) {
            // Output is an array - use first element
            imageUrl = output[0] as string;
            console.log('✅ Using array output, first element:', imageUrl);
          } else if (typeof output === 'string' && (output as string).trim() !== '') {
            // Output is a string - use directly
            imageUrl = output as string;
            console.log('✅ Using string output:', imageUrl);
          }
          
          if (imageUrl) {
            return {
              imageUrl: imageUrl,
              processingTime: prediction.metrics?.predict_time,
            };
          }
          
          // Enhanced error message with full context
          const errorDetails = {
            status: prediction.status,
            output: output,
            outputType: typeof output,
            logs: prediction.logs,
            error: prediction.error,
            metrics: prediction.metrics,
            urls: prediction.urls
          };
          console.error('❌ No valid image URL in prediction output. Full details:', errorDetails);
          throw new ReplicateError(`No valid image URL in prediction output. Status: ${prediction.status}, Output: ${JSON.stringify(output)}, Type: ${typeof output}, Logs: ${prediction.logs || 'No logs'}`);
          
        case 'failed':
          console.error('❌ Prediction Failed:', {
            error: prediction.error,
            logs: prediction.logs,
            status: prediction.status
          });
          throw new ReplicateError(prediction.error || prediction.logs || 'Generation failed');
          
        case 'canceled':
          throw new ReplicateError('Generation was canceled');
          
        case 'starting':
        case 'processing':
          // Log progress info
          console.log('⏳ Prediction in progress:', {
            status: prediction.status,
            attempt: attempts,
            logs: prediction.logs
          });
          // Continue polling
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second intervals
          attempts++;
          break;
          
        default:
          throw new ReplicateError(`Unknown prediction status: ${prediction.status}`);
      }
    }

    throw new ReplicateError('Prediction timed out');
  }

  // Check generation status
  async checkGenerationStatus(requestId: string): Promise<GenerationProgress> {
    try {
      const response = await fetch(`${this.baseUrl}/predictions/${requestId}`, {
        headers: {
          'Authorization': `Token ${this.config.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new ReplicateError(`Failed to check status: ${response.statusText}`, response.status);
      }

      const prediction: ReplicatePrediction = await response.json();
      
      let progress = 0;
      let status: GenerationProgress['status'] = 'preparing';
      let estimatedTime: number | undefined;

      switch (prediction.status) {
        case 'starting':
          status = 'preparing';
          progress = 10;
          estimatedTime = 30;
          break;
        case 'processing':
          status = 'processing';
          progress = 50;
          estimatedTime = 25;
          break;
        case 'succeeded':
          status = 'completed';
          progress = 100;
          break;
        case 'failed':
          status = 'error';
          progress = 0;
          break;
        case 'canceled':
          status = 'error';
          progress = 0;
          break;
      }

      return {
        status,
        progress,
        estimatedTime,
        currentStep: prediction.status,
        error: prediction.error ? String(prediction.error) : undefined,
      };

    } catch (error) {
      console.error('Error checking generation status:', error);
      return {
        status: 'error',
        progress: 0,
        error: 'Failed to check generation status',
      };
    }
  }

  // Cancel generation
  async cancelGeneration(requestId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/predictions/${requestId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.config.apiToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error canceling generation:', error);
      return false;
    }
  }

  // Get character consistency warning
  getConsistencyWarning(params: HaircutParams): string | null {
    if (params.prompt && !params.style) {
      return 'Custom prompts may reduce character consistency. For best results, use a preset style.';
    }
    return null;
  }

  // Validate parameters
  validateParams(params: HaircutParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!params.image) {
      errors.push('Image is required');
    }

    // Check for custom prompt warning
    if (params.prompt && !params.style) {
      warnings.push('Custom prompts may reduce character consistency');
    }

    // Validate gender
    if (params.gender && !['male', 'female', 'unisex'].includes(params.gender)) {
      errors.push('Invalid gender selection');
    }

    // Validate output format
    if (params.outputFormat && !['jpg', 'png'].includes(params.outputFormat)) {
      errors.push('Invalid output format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}