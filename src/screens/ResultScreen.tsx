// ResultScreen component for Barber Buddy
// Real result display with before/after, save/download/share functionality

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Share,
  Dimensions,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import { COLORS } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useGradient } from '../context/GradientContext';
import { useAuth } from '../context/AuthContext';
import { createSupabaseService } from '../services/supabaseService';
import Header from '../components/Header';

type ResultNavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;
type ResultRouteProp = RouteProp<RootStackParamList, 'Result'>;

const { width: screenWidth } = Dimensions.get('window');
const imageWidth = screenWidth - 40;
const imageHeight = (imageWidth * 4) / 3; // 4:3 aspect ratio

export const ResultScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ResultNavigationProp>();
  const route = useRoute<ResultRouteProp>();
  const { setGradientState } = useGradient();
  const { user } = useAuth();
  
  const { generatedImageUri, originalPhotoUri } = route.params;
  
  const [showBefore, setShowBefore] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Set gradient state
  React.useEffect(() => {
    setGradientState('DIAGONAL_GRADIENT');
  }, [setGradientState]);

  // Handle download
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.error'),
          t('permissions.mediaLibraryRequired'),
          [{ text: t('common.ok') }]
        );
        return;
      }

      // Download the image
      const filename = `barber_buddy_result_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      const downloadResult = await FileSystem.downloadAsync(
        generatedImageUri,
        fileUri
      );

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      
      Alert.alert(
        t('result.downloadSuccess'),
        t('result.downloadSuccessMessage'),
        [{ text: t('common.ok') }]
      );
      
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        t('common.error'),
        t('errors.downloadFailed'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    try {
      const result = await Share.share({
        url: generatedImageUri,
        message: t('result.shareMessage'),
      });
      
      if (result.action === Share.sharedAction) {
        // Shared successfully
        console.log('Image shared successfully');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert(
        t('common.error'),
        t('errors.shareFailed'),
        [{ text: t('common.ok') }]
      );
    }
  };

  // Handle save to library (now available for testing)
  const handleSaveToLibrary = async () => {
    // Save to library enabled for testing - no paid subscription required
    try {
      setIsSaving(true);
      const supabaseService = createSupabaseService();
      const userId = user?.id || 'anonymous';
      
      // Save the current result to the library
      await supabaseService.storeImageMetadata({
        user_id: userId,
        original_image_url: originalPhotoUri,
        generated_image_url: generatedImageUri,
        style_prompt: 'Saved from results',
        output_format: 'jpg',
        is_custom_prompt: false,
        character_consistency_warning: false,
        is_favorite: false,
      });
      
      Alert.alert(
        'Saved!',
        'Image saved to your library successfully',
        [{ text: t('common.ok') }]
      );
      
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(
        'Error',
        'Failed to save image to library',
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle upgrade
  const handleUpgrade = () => {
    // TODO: Navigate to upgrade/paywall screen
    Alert.alert(
      t('upgrade.title'),
      t('upgrade.description'),
      [{ text: t('common.ok') }]
    );
  };

  // Handle try another style
  const handleTryAnother = () => {
    // Navigate back to photo upload screen
    navigation.navigate('PhotoUpload');
  };

  // Handle rate limiting for free users (disabled for testing)
  const checkRateLimit = () => {
    // Rate limiting disabled - always allow
    return true;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Header title={t('result.title')} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Result Image */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: showBefore ? originalPhotoUri : generatedImageUri }}
                style={styles.resultImage}
                resizeMode="cover"
              />
              
              {/* Before/After Toggle */}
              <View style={styles.imageToggle}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    !showBefore && styles.toggleButtonActive,
                  ]}
                  onPress={() => setShowBefore(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    !showBefore && styles.toggleButtonTextActive,
                  ]}>
                    {t('result.after')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    showBefore && styles.toggleButtonActive,
                  ]}
                  onPress={() => setShowBefore(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    showBefore && styles.toggleButtonTextActive,
                  ]}>
                    {t('result.before')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.imageDescription}>
              {showBefore ? t('result.beforeDescription') : t('result.afterDescription')}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <Text style={styles.actionsTitle}>{t('result.whatNext')}</Text>
            
            {/* Download Button - Always available */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDownload}
              disabled={isDownloading}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="download-outline" 
                size={24} 
                color={COLORS.white} 
              />
              <View style={styles.actionButtonContent}>
                <Text style={styles.actionButtonTitle}>
                  {isDownloading ? t('result.downloading') : t('result.download')}
                </Text>
                <Text style={styles.actionButtonDescription}>
                  {t('result.downloadDescription')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Share Button - Always available */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="share-outline" 
                size={24} 
                color={COLORS.white} 
              />
              <View style={styles.actionButtonContent}>
                <Text style={styles.actionButtonTitle}>
                  {t('result.share')}
                </Text>
                <Text style={styles.actionButtonDescription}>
                  {t('result.shareDescription')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Save to Library Button - Now free for testing */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSaveToLibrary}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="bookmark-outline" 
                size={24} 
                color={COLORS.white} 
              />
              <View style={styles.actionButtonContent}>
                <Text style={styles.actionButtonTitle}>
                  {isSaving ? t('result.saving') : t('result.saveToLibrary')}
                </Text>
                <Text style={styles.actionButtonDescription}>
                  {t('result.saveToLibraryDescription')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Try Another Style */}
          <View style={styles.tryAnotherSection}>
            <TouchableOpacity
              style={styles.tryAnotherButton}
              onPress={handleTryAnother}
              activeOpacity={0.7}
            >
              <Text style={styles.tryAnotherButtonText}>
                {t('result.tryAnotherStyle')}
              </Text>
              <Ionicons name="refresh" size={20} color={COLORS.white} />
            </TouchableOpacity>
            
            <Text style={styles.tryAnotherDescription}>
              {t('result.tryAnotherDescription')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  resultImage: {
    width: imageWidth,
    height: imageHeight,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageToggle: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.7,
  },
  toggleButtonTextActive: {
    opacity: 1,
  },
  imageDescription: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionsSection: {
    marginBottom: 30,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  premiumButton: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 193, 7, 0.4)',
  },
  actionButtonContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  actionButtonDescription: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    lineHeight: 16,
  },
  premiumBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.4)',
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  tryAnotherSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  tryAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    marginBottom: 8,
  },
  tryAnotherButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  tryAnotherDescription: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ResultScreen;