// Image utility functions for BarberBuddy
// Handles image conversion and validation

import * as FileSystem from 'expo-file-system';

export interface ImageConversionResult {
  success: boolean;
  base64Data?: string;
  error?: string;
}

/**
 * Convert image URI to base64 data URL
 * @param uri - The image URI to convert
 * @returns Promise with conversion result
 */
export const convertImageToBase64 = async (uri: string): Promise<ImageConversionResult> => {
  try {
    // Check if the URI is already a data URL
    if (uri.startsWith('data:image/')) {
      return {
        success: true,
        base64Data: uri,
      };
    }

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Determine the MIME type based on file extension
    const mimeType = getMimeTypeFromUri(uri);
    
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return {
      success: true,
      base64Data: dataUrl,
    };
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert image',
    };
  }
};

/**
 * Get MIME type from file URI
 * @param uri - The file URI
 * @returns MIME type string
 */
const getMimeTypeFromUri = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg'; // Default to JPEG
  }
};

/**
 * Validate image file size
 * @param base64Data - Base64 image data
 * @param maxSizeMB - Maximum size in MB (default: 10MB)
 * @returns Validation result
 */
export const validateImageSize = (base64Data: string, maxSizeMB: number = 10): boolean => {
  // Remove data URL prefix to get just the base64 data
  const base64Only = base64Data.replace(/^data:image\/[^;]+;base64,/, '');
  
  // Calculate size in bytes
  const sizeInBytes = Math.ceil((base64Only.length * 3) / 4);
  const maxSizeInBytes = maxSizeMB * 1024 * 1024;
  
  return sizeInBytes <= maxSizeInBytes;
};

/**
 * Validate image format
 * @param base64Data - Base64 image data
 * @returns Validation result
 */
export const validateImageFormat = (base64Data: string): boolean => {
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
  const mimeType = base64Data.match(/^data:([^;]+);/)?.[1];
  
  return mimeType ? supportedFormats.includes(mimeType) : false;
};

/**
 * Compress image if needed
 * @param base64Data - Base64 image data
 * @param maxSizeMB - Maximum size in MB
 * @returns Compressed image data or original if no compression needed
 */
export const compressImageIfNeeded = async (base64Data: string, maxSizeMB: number = 10): Promise<string> => {
  if (validateImageSize(base64Data, maxSizeMB)) {
    return base64Data; // No compression needed
  }

  // For now, return the original data
  // In a real implementation, you would use a library like expo-image-manipulator
  // to compress the image
  console.warn('Image compression not implemented - using original image');
  return base64Data;
}; 