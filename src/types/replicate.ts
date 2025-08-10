// Replicate API Types for BarberBuddy
// Complete TypeScript definitions for Flux Kontext Haircut model integration

export interface ReplicateConfig {
  apiToken: string;
  modelVersion: string;
  baseUrl: string;
}

export interface HaircutStyle {
  id: string;
  name: string;
  description: string;
  category: 'classic' | 'modern' | 'trendy' | 'professional';
  gender: 'male' | 'female' | 'unisex';
}

export interface HaircutParams {
  image: string; // Base64 encoded image
  prompt?: string; // Custom prompt (optional)
  style?: string; // Preset style ID
  gender?: 'male' | 'female' | 'unisex';
  hairColor?: string;
  outputFormat?: 'jpg' | 'png';
  seed?: number; // For reproducible results
  guidanceScale?: number; // Default: 7.5
  numInferenceSteps?: number; // Default: 20
}

export interface ReplicatePrediction {
  id: string;
  version: string;
  urls: {
    get: string;
    cancel: string;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  input: HaircutParams;
  output?: string[]; // Generated image URLs
  error?: string;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  requestId?: string;
  processingTime?: number;
}

export interface RateLimitInfo {
  currentUsage: number;
  maxUsage: number;
  tier: 'free' | 'plus' | 'pro';
  resetDate: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ModelInfo {
  version: string;
  availableStyles: HaircutStyle[];
  availableColors: string[];
  availableFormats: string[];
  availableHaircuts?: string[]; // Exact API values for haircut parameter
  maxImageSize: number; // in bytes
  supportedFormats: string[];
  characterConsistencyNote: string;
}

// Error types
export class ReplicateError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public requestId?: string
  ) {
    super(message);
    this.name = 'ReplicateError';
  }
}

export class RateLimitError extends ReplicateError {
  constructor(message: string, public resetTime?: string) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends ReplicateError {
  constructor(message: string, public field?: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

// API Response types
export interface ReplicateApiResponse {
  id: string;
  version: string;
  urls: {
    get: string;
    cancel: string;
  };
  created_at: string;
  status: string;
  input: Record<string, any>;
  output?: any;
  error?: string;
  logs?: string;
}

// Progress tracking
export interface GenerationProgress {
  status: 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  estimatedTime?: number; // seconds
  currentStep?: string;
  error?: string;
}

// User tier management
export interface UserTier {
  tier: 'free' | 'plus' | 'pro';
  monthlyLimit: number;
  currentUsage: number;
  resetDate: string;
  features: string[];
}

// Character consistency warning
export interface ConsistencyWarning {
  type: 'custom_prompt' | 'style_mismatch' | 'parameter_conflict';
  message: string;
  severity: 'low' | 'medium' | 'high';
  recommendation?: string;
}