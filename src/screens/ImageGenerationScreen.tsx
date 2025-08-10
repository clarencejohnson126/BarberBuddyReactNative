// ImageGenerationScreen component for Barber Buddy
// Real image generation with Replicate API integration and loading states

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

import { COLORS } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useGradient } from '../context/GradientContext';
import Header from '../components/Header';
import { createReplicateService } from '../services/replicateService';
import { createOpenAIService } from '../services/openaiService';
import type { GenerationProgress } from '../types/replicate';
import { convertImageToBase64, validateImageSize, validateImageFormat } from '../utils/imageUtils';
import { createSupabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';

type ImageGenerationNavigationProp = StackNavigationProp<RootStackParamList, 'ImageGeneration'>;
type ImageGenerationRouteProp = RouteProp<RootStackParamList, 'ImageGeneration'>;

const { width: screenWidth } = Dimensions.get('window');

export const ImageGenerationScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ImageGenerationNavigationProp>();
  const route = useRoute<ImageGenerationRouteProp>();
  const { setGradientState } = useGradient();
  const { user } = useAuth();
  
  const { 
    photoUri, 
    selectedStyle,
    gender,
    hairColor,
    imageFormat,
    isCustomPrompt 
  } = route.params;
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'preparing' | 'uploading' | 'processing' | 'completed' | 'error'>('preparing');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set gradient state
  React.useEffect(() => {
    setGradientState('DIAGONAL_GRADIENT');
  }, [setGradientState]);

  useEffect(() => {
    startImageGeneration();
  }, []);

  const startImageGeneration = async () => {
    try {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setError(null);
      setStatus('preparing');
      setProgress(10);

      // Convert photo URI to base64
      const imageConversionResult = await convertImageToBase64(photoUri);
      
      if (!imageConversionResult.success || !imageConversionResult.base64Data) {
        throw new Error(imageConversionResult.error || 'Failed to convert image');
      }

      const imageData = imageConversionResult.base64Data;

      // Validate image
      if (!validateImageFormat(imageData)) {
        throw new Error('Unsupported image format. Please use JPEG or PNG.');
      }

      if (!validateImageSize(imageData, 10)) {
        throw new Error('Image file size too large. Maximum size is 10MB.');
      }

      let result;

      if (isCustomPrompt) {
        // Use OpenAI for custom prompts
        console.log('🎨 Using OpenAI GPT Image 1 for custom prompt generation');
        const openaiService = createOpenAIService();
        
        // Test OpenAI connection first
        const isOpenAIAvailable = await openaiService.testConnection();
        if (!isOpenAIAvailable) {
          throw new Error('OpenAI API is not available. Please check your API key configuration.');
        }

        // Prepare OpenAI parameters
        const openaiParams = {
          image: imageData,
          prompt: selectedStyle, // This is the custom prompt
          size: '1024x1024' as const,
        };

        // Handle progress updates for OpenAI
        const onOpenAIProgress = (progressData: { status: string; progress: number; estimatedTime?: number }) => {
          setStatus(progressData.status as any);
          setProgress(progressData.progress);
          if (progressData.estimatedTime) {
            setEstimatedTime(progressData.estimatedTime);
          }
        };

        // Generate with OpenAI
        result = await openaiService.generateImageWithProgress(openaiParams, onOpenAIProgress);
        if (!result.success) {
          throw new Error(result.error || 'OpenAI generation failed');
        }

      } else {
        // Use Replicate for preset styles
        console.log('🔄 Using Replicate flux-kontext-apps/change-haircut for preset style generation');
        const replicateService = createReplicateService();
        
        // Prepare parameters for Replicate API
        const replicateParams = {
          image: imageData,
          style: selectedStyle,
          gender: (gender as 'male' | 'female' | 'unisex') || 'male',
          hairColor: hairColor || 'No change',
          outputFormat: (imageFormat as 'jpg' | 'png') || 'jpg',
        };

        // Handle progress updates for Replicate
        const onReplicateProgress = (progressData: GenerationProgress) => {
          setStatus(progressData.status);
          setProgress(progressData.progress);
          if (progressData.estimatedTime) {
            setEstimatedTime(progressData.estimatedTime);
          }
        };

        // Generate with Replicate
        result = await replicateService.generateHaircutWithProgress(replicateParams, onReplicateProgress);
      }

      if (result.success && result.imageUrl) {
        setStatus('completed');
        setProgress(100);
        
        // Store image metadata in Supabase
        try {
          const supabaseService = createSupabaseService();
          const userId = user?.id || 'anonymous';
          
          await supabaseService.storeImageMetadata({
            user_id: userId,
            original_image_url: photoUri,
            generated_image_url: result.imageUrl,
            style_prompt: isCustomPrompt ? selectedStyle : `Style: ${selectedStyle}`,
            gender: gender || 'male',
            hair_color: hairColor || 'No change',
            output_format: imageFormat || 'jpg',
            processing_time: result.processingTime ? Math.round(result.processingTime) : null,
            is_custom_prompt: isCustomPrompt,
            character_consistency_warning: isCustomPrompt,
          });
          console.log('✅ Successfully stored image metadata in Supabase');
        } catch (metadataError) {
          console.error('❌ Failed to store image metadata:', metadataError);
          // Continue with navigation even if metadata storage fails
          // This is not a critical error that should stop the user flow
        }
        
        // Navigate to result screen with both the generated and original images
        setTimeout(() => {
          navigation.replace('Result', {
            generatedImageUri: result.imageUrl!,
            originalPhotoUri: photoUri,
          });
        }, 1000);
      } else {
        throw new Error('Generation failed - no image URL returned');
      }

    } catch (error) {
      console.error('Image generation error:', error);
      setStatus('error');
      
      // Provide user-friendly error messages
      let userMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('No image URL in prediction output')) {
          userMessage = 'The image could not be generated. Please try a different photo or style.';
        } else if (error.message.includes('Invalid haircut style')) {
          userMessage = 'Please select a valid hairstyle from the dropdown menu.';
        } else if (error.message.includes('API request failed')) {
          userMessage = 'Connection failed. Please check your internet and try again.';
        } else if (error.message.includes('OpenAI API is not available')) {
          userMessage = 'OpenAI service is not available. Please check your API configuration.';
        } else if (error.message.includes('OpenAI API error') || error.message.includes('OpenAI API key')) {
          userMessage = 'OpenAI generation failed. Please check your API key or try later.';
        } else if (error.message.includes('Failed to convert image')) {
          userMessage = 'There was a problem with your photo. Please try a different image.';
        } else {
          userMessage = error.message;
        }
      }
      
      setError(userMessage);
      handleError(userMessage);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const handleError = (msg?: string) => {
    Alert.alert(
      t('common.error'),
      msg || error || t('errors.imageGenerationFailed'),
      [
        {
          text: t('common.retry'),
          onPress: startImageGeneration,
        },
        {
          text: t('common.back'),
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'preparing':
        return t('generation.preparing');
      case 'uploading':
        return t('generation.uploading');
      case 'processing':
        return t('generation.processing');
      case 'completed':
        return t('generation.completed');
      case 'error':
        return t('generation.error');
      default:
        return '';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'preparing':
        return t('generation.preparingDescription');
      case 'uploading':
        return t('generation.uploadingDescription');
      case 'processing':
        return isCustomPrompt 
          ? t('generation.processingOpenAIDescription')
          : t('generation.processingDescription');
      case 'completed':
        return t('generation.completedDescription');
      case 'error':
        return t('generation.errorDescription');
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Header title={t('generation.title')} />
      
      <View style={styles.content}>
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
          
          {/* Status */}
          <Text style={styles.statusText}>{getStatusMessage()}</Text>
          <Text style={styles.statusDescription}>{getStatusDescription()}</Text>
          
          {/* Estimated Time */}
          {status === 'processing' && estimatedTime > 0 && (
            <Text style={styles.timeRemaining}>
              {t('generation.estimatedTime', { time: estimatedTime })}
            </Text>
          )}
        </View>

        {/* Loading Animation */}
        <View style={styles.loadingSection}>
          {status !== 'error' && (
            <ActivityIndicator 
              size="large" 
              color={COLORS.white} 
              style={styles.activityIndicator}
            />
          )}
          {status === 'error' && (
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.statusText, { marginBottom: 10 }]}>{error || t('errors.imageGenerationFailed')}</Text>
              <Text onPress={startImageGeneration} style={{ color: COLORS.white, fontWeight: '700', textDecorationLine: 'underline' }}>
                {t('common.retry')}
              </Text>
            </View>
          )}
          
          {/* Processing Details */}
          <View style={styles.processingDetails}>
            <Text style={styles.detailsTitle}>{t('generation.processingDetails')}</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('generation.style')}:</Text>
              <Text style={styles.detailValue}>
                {isCustomPrompt ? t('generation.customStyle') : selectedStyle}
              </Text>
            </View>
            {gender && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('generation.gender')}:</Text>
                <Text style={styles.detailValue}>{t(`gender.${gender}`)}</Text>
              </View>
            )}
            {hairColor && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('generation.hairColor')}:</Text>
                <Text style={styles.detailValue}>{t(`hairColor.${hairColor}`)}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('generation.format')}:</Text>
              <Text style={styles.detailValue}>{imageFormat?.toUpperCase() || 'JPG'}</Text>
            </View>
          </View>

          {/* Character Consistency Warning for Custom Prompts */}
          {isCustomPrompt && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                {t('generation.customPromptWarning')}
              </Text>
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>{t('generation.tipsTitle')}</Text>
          <Text style={styles.tipsText}>
            {t('generation.tipsDescription')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 22,
  },
  timeRemaining: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  activityIndicator: {
    marginBottom: 30,
  },
  processingDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  warningText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 16,
  },
  tipsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  tipsText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ImageGenerationScreen;