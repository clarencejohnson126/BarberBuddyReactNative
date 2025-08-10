// Library Screen for Barber Buddy
// User's personal saved hairstyle library

import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Dimensions, SafeAreaView, RefreshControl, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { RootStackParamList } from '../navigation/AppNavigator';
import { Header } from '../components/Header';
import { COLORS } from '../theme/colors';
import { useGradient } from '../context/GradientContext';
import { createSupabaseService, ImageMetadata } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';

type LibraryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Library'>;

const { width } = Dimensions.get('window');
const gutter = 20;
const numColumns = 2;
const cardWidth = (width - gutter * (numColumns + 1)) / numColumns;
const imageHeight = Math.round(cardWidth * (5 / 4)); // 4:5 aspect ratio

interface SavedImage {
  id: string;
  originalUri: string;
  generatedUri: string;
  style: string;
  createdAt: string;
  isFavorite: boolean;
}

// Mock data for demonstration
const MOCK_SAVED_IMAGES: SavedImage[] = [
  {
    id: '1',
    originalUri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/images//ChatGPT%20Image%20Jun%209,%202025,%2001_55_22%20AM.png',
    generatedUri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//blonde%20wild%20spiked.png',
    style: 'Blonde Wild Spiked',
    createdAt: '2025-01-05T10:30:00Z',
    isFavorite: true,
  },
  {
    id: '2',
    originalUri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/images//ChatGPT%20Image%20Jun%209,%202025,%2001_55_22%20AM.png',
    generatedUri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//curly.png',
    style: 'Curly Style',
    createdAt: '2025-01-04T15:45:00Z',
    isFavorite: false,
  },
  {
    id: '3',
    originalUri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/images//ChatGPT%20Image%20Jun%209,%202025,%2001_55_22%20AM.png',
    generatedUri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//braided%20ponytail.jpg',
    style: 'Braided Ponytail',
    createdAt: '2025-01-03T09:20:00Z',
    isFavorite: true,
  },
  {
    id: '4',
    originalUri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/images//ChatGPT%20Image%20Jun%209,%202025,%2001_55_22%20AM.png',
    generatedUri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//straight_bob.png',
    style: 'Straight Bob',
    createdAt: '2025-01-02T14:10:00Z',
    isFavorite: false,
  },
];

export const LibraryScreen: React.FC = () => {
  const navigation = useNavigation<LibraryScreenNavigationProp>();
  const { t } = useTranslation();
  const { setGradientState } = useGradient();
  const { user } = useAuth();
  
  // DEBUG: Log user state in LibraryScreen
  console.log('🔍 LibraryScreen render - user state:', {
    hasUser: !!user,
    userEmail: user?.email,
    userLoggedIn: !!user
  });
  
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseService] = useState(() => createSupabaseService());

  useEffect(() => {
    setGradientState('DIAGONAL_GRADIENT');
    loadSavedImages();
  }, [setGradientState]);

  const loadSavedImages = async () => {
    try {
      setIsLoading(true);
      
      // Get current user or use anonymous
      const userId = user?.id || 'anonymous';
      
      // Load from Supabase user library
      const imageHistory = await supabaseService.getUserImageHistory(userId, 50);
      
      // Convert ImageMetadata to SavedImage format
      const savedImagesData: SavedImage[] = imageHistory.map((item: ImageMetadata) => ({
        id: item.id || 'unknown',
        originalUri: item.original_image_url,
        generatedUri: item.generated_image_url,
        style: item.style_prompt,
        createdAt: item.created_at || new Date().toISOString(),
        isFavorite: item.is_favorite || false,
      }));
      
      // Limit to max 20 most recent generated images
      setSavedImages(savedImagesData.slice(0, 20));
    } catch (error) {
      console.error('Error loading saved images:', error);
      // Fallback to mock data if Supabase fails
      setSavedImages(MOCK_SAVED_IMAGES);
      Alert.alert(t('common.error'), 'Using demo data - database connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedImages();
    setRefreshing(false);
  };

  const handleImagePress = (image: SavedImage) => {
    // Navigate to result screen to view the image
    navigation.navigate('Result', {
      generatedImageUri: image.generatedUri,
      originalPhotoUri: image.originalUri,
    });
  };

  const toggleFavorite = async (imageId: string) => {
    try {
      // Optimistically update UI
      const newFavoriteStatus = !savedImages.find(img => img.id === imageId)?.isFavorite;
      setSavedImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { ...img, isFavorite: newFavoriteStatus }
            : img
        )
      );
      
      // Update in Supabase
      const success = await supabaseService.toggleImageFavorite(imageId, newFavoriteStatus);
      if (!success) {
        // Revert on failure
        setSavedImages(prev => 
          prev.map(img => 
            img.id === imageId 
              ? { ...img, isFavorite: !newFavoriteStatus }
              : img
          )
        );
        Alert.alert(t('common.error'), 'Failed to update favorite status');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteImage = async (imageId: string) => {
    Alert.alert(
      t('library.deleteTitle'),
      t('library.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistically remove from UI
              const originalImages = savedImages;
              setSavedImages(prev => prev.filter(img => img.id !== imageId));
              
              // Delete from Supabase
              const success = await supabaseService.deleteImage(imageId);
              if (!success) {
                // Revert on failure
                setSavedImages(originalImages);
                Alert.alert(t('common.error'), 'Failed to delete image');
              }
            } catch (error) {
              console.error('Error deleting image:', error);
              Alert.alert(t('common.error'), t('library.deleteError'));
            }
          },
        },
      ]
    );
  };

  const filteredImages = filter === 'favorites' 
    ? savedImages.filter(img => img.isFavorite)
    : savedImages;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={64} color={COLORS.white} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>
        {filter === 'favorites' ? t('library.noFavorites') : t('library.noImages')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'favorites' 
          ? t('library.noFavoritesSubtitle')
          : t('library.noImagesSubtitle')
        }
      </Text>
      {filter === 'all' && (
        <TouchableOpacity
          style={styles.createFirstButton}
          onPress={() => navigation.navigate('PhotoUpload')}
        >
          <Text style={styles.createFirstButtonText}>{t('library.createFirst')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const keyExtractor = useCallback((item: SavedImage) => item.id, []);

  const numColumnsLocal = numColumns;

  const Card = memo(({ item }: { item: SavedImage }) => (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={() => handleImagePress(item)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.generatedUri }} style={styles.gridImage} />
      <Image source={{ uri: item.originalUri }} style={styles.beforeThumb} />
      <View style={styles.imageOverlay}>
        <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(item.id)}>
          <Ionicons
            name={item.isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={item.isFavorite ? '#FF6B6B' : COLORS.white}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteImage(item.id)}>
          <Ionicons name="trash-outline" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.imageInfo}>
        <Text style={styles.imageStyle} numberOfLines={1}>{item.style}</Text>
        <Text style={styles.imageDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  ));

  const renderItem = useCallback(({ item }: { item: SavedImage }) => <Card item={item} />, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.purplePrimary, COLORS.pinkAccent]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <Header title={t('library.title')} />
        
        <View style={styles.content}>
          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                {t('library.all')} ({savedImages.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterTab, filter === 'favorites' && styles.filterTabActive]}
              onPress={() => setFilter('favorites')}
            >
              <Text style={[styles.filterText, filter === 'favorites' && styles.filterTextActive]}>
                {t('library.favorites')} ({savedImages.filter(img => img.isFavorite).length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('library.loading')}</Text>
            </View>
          ) : filteredImages.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredImages}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              numColumns={numColumnsLocal}
              columnWrapperStyle={styles.columnWrapper}
              removeClippedSubviews
              initialNumToRender={8}
              windowSize={7}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.white}
                  titleColor={COLORS.white}
                />
              }
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.7,
  },
  filterTextActive: {
    opacity: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  createFirstButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  imageGrid: {},
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
  },
  imageItem: {
    width: cardWidth,
    marginBottom: gutter,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageItemRight: {
    // No additional styling needed for right items
  },
  gridImage: {
    width: '100%',
    height: imageHeight,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  beforeThumb: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)'
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageInfo: {
    padding: 12,
  },
  imageStyle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  imageDate: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
  },
});