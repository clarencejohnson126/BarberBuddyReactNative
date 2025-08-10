// Haircut Selection Screen for BarberBuddy
// Screen 2: Full configurator with all options

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Header } from '../components/Header';
import { COLORS } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import { createReplicateService } from '../services/replicateService';
import { HaircutStyle } from '../types/replicate';

type HaircutSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HaircutSelection'>;
type HaircutSelectionScreenRouteProp = RouteProp<RootStackParamList, 'HaircutSelection'>;

const { width } = Dimensions.get('window');

interface HaircutSelectionScreenProps {
  route: HaircutSelectionScreenRouteProp;
}

export const HaircutSelectionScreen: React.FC<HaircutSelectionScreenProps> = ({ route }) => {
  const navigation = useNavigation<HaircutSelectionScreenNavigationProp>();
  const { t } = useTranslation();
  const { photoUri } = route.params;

  // State for all configuration options
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [gender, setGender] = useState<string>('male');
  const [hairColor, setHairColor] = useState<string>('No change');
  const [imageFormat, setImageFormat] = useState<string>('jpg');
  const [imageSize, setImageSize] = useState<string>('original');
  
  // UI state
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [isCustomPrompt, setIsCustomPrompt] = useState(false);
  const [consistencyWarning, setConsistencyWarning] = useState<string | null>(null);

  // Data loading
  const [availableStyles, setAvailableStyles] = useState<HaircutStyle[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableFormats, setAvailableFormats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available options
  const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'unisex', label: 'Unisex' },
  ];

  // Generate dynamic options from loaded data
  const getColorOptions = () => {
    return availableColors.map(color => ({
      value: color,
      label: color.charAt(0).toUpperCase() + color.slice(1).replace(/-/g, ' '),
    }));
  };

  const getFormatOptions = () => {
    return availableFormats.map(format => ({
      value: format,
      label: format.toUpperCase(),
    }));
  };

  const SIZE_OPTIONS = [
    { value: 'original', label: 'Original Size' },
    { value: '1024', label: '1024x1024' },
    { value: '512', label: '512x512' },
  ];

  useEffect(() => {
    loadAvailableStyles();
  }, []);

  useEffect(() => {
    // Update consistency warning when style or custom prompt changes
    if (isCustomPrompt && customPrompt.trim()) {
      setConsistencyWarning('Custom prompts use OpenAI GPT Image 1 and may change facial features. For best identity preservation, use a preset style.');
    } else if (selectedStyle && !isCustomPrompt) {
      setConsistencyWarning(null);
    } else {
      setConsistencyWarning(null);
    }
  }, [selectedStyle, customPrompt, isCustomPrompt]);

  const loadAvailableStyles = async () => {
    try {
      setLoading(true);
      const replicateService = createReplicateService();
      
      // Test API connection first
      console.log('🔍 Testing Replicate API connection...');
      const modelInfo = await replicateService.getModelInfo();
      
      setAvailableStyles(modelInfo.availableStyles);
      setAvailableColors(modelInfo.availableColors);
      setAvailableFormats(modelInfo.availableFormats);
      
      console.log('✅ Successfully loaded LIVE data from flux-kontext-apps/change-haircut:', {
        version: modelInfo.version,
        stylesCount: modelInfo.availableStyles.length,
        colorsCount: modelInfo.availableColors.length,
        formatsCount: modelInfo.availableFormats.length,
        sampleStyles: modelInfo.availableStyles.slice(0, 3).map(s => s.name),
        sampleColors: modelInfo.availableColors.slice(0, 5),
        note: modelInfo.characterConsistencyNote,
        apiStatus: 'ACTIVE - flux-kontext-apps/change-haircut model is responding',
      });
      
    } catch (error) {
      console.error('❌ FAILED to load from Replicate API - using fallback data:', error);
      setError('⚠️ Using fallback data - API connection failed');
      
      // Fallback to hardcoded data based on actual API options
      setAvailableStyles([
        { id: 'undercut', name: 'Undercut', description: 'Modern undercut style', category: 'modern', gender: 'male' },
        { id: 'crew-cut', name: 'Crew Cut', description: 'Classic crew cut', category: 'classic', gender: 'male' },
        { id: 'slicked-back', name: 'Slicked Back', description: 'Sleek slicked back style', category: 'classic', gender: 'male' },
        { id: 'bob', name: 'Bob', description: 'Classic bob haircut', category: 'classic', gender: 'female' },
        { id: 'pixie-cut', name: 'Pixie Cut', description: 'Short pixie style', category: 'modern', gender: 'female' },
        { id: 'straight', name: 'Straight', description: 'Straight hair style', category: 'classic', gender: 'unisex' },
      ]);
      setAvailableColors(['No change', 'Random', 'Blonde', 'Brunette', 'Black', 'Auburn', 'Red', 'Gray']);
      setAvailableFormats(['jpg', 'png']);
    } finally {
      setLoading(false);
    }
  };

  // Close all dropdowns helper function
  const closeAllDropdowns = () => {
    setShowDropdown(null);
  };

  const handleStyleSelection = (style: HaircutStyle) => {
    setSelectedStyle(style.name); // Use the exact name from API instead of ID
    setIsCustomPrompt(false);
    setCustomPrompt('');
    closeAllDropdowns();
  };

  const handleCustomPromptToggle = () => {
    setIsCustomPrompt(!isCustomPrompt);
    if (!isCustomPrompt) {
      setSelectedStyle('');
    } else {
      setCustomPrompt('');
    }
    closeAllDropdowns();
  };

  // Simple dropdown toggle handler
  const toggleDropdown = (dropdownId: string) => {
    if (showDropdown === dropdownId) {
      setShowDropdown(null);
    } else {
      setShowDropdown(dropdownId);
    }
  };

  const handleGenerate = () => {
    if (!photoUri) {
      Alert.alert('Error', 'No photo selected');
      return;
    }

    if (!selectedStyle && !customPrompt.trim()) {
      Alert.alert('Error', 'Please select a style or enter a custom prompt');
      return;
    }

    navigation.navigate('ImageGeneration', {
      photoUri,
      selectedStyle: isCustomPrompt ? customPrompt : selectedStyle,
      gender,
      hairColor,
      imageFormat,
      isCustomPrompt,
    });
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.purplePrimary, COLORS.pinkAccent]}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color={COLORS.white} />
        <Text style={styles.loadingText}>Loading from Replicate API...</Text>
        <Text style={styles.loadingSubtext}>Fetching flux-kontext-apps/change-haircut</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.purplePrimary, COLORS.pinkAccent]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <Header />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setShowDropdown(null)}
      >
        {/* Photo Preview */}
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Configuration Form */}
        <View style={styles.formContainer}>
          {/* Hairstyle Selection */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Choose Hairstyle</Text>
            <View style={styles.simpleDropdownContainer}>
              <TouchableOpacity 
                style={styles.simpleDropdownButton} 
                onPress={() => toggleDropdown('style')}
              >
                <Text style={styles.simpleDropdownText}>
                  {availableStyles.find(style => style.name === selectedStyle)?.name || 'Choose style...'}
                </Text>
                <Text style={styles.simpleDropdownArrow}>{showDropdown === 'style' ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showDropdown === 'style' && (
                <View style={styles.simpleDropdownList}>
                  <ScrollView 
                    style={styles.simpleDropdownScroll}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {availableStyles.map((style) => (
                      <TouchableOpacity
                        key={style.id}
                        style={styles.simpleDropdownItem}
                        onPress={() => {
                          handleStyleSelection(style);
                          setShowDropdown(null);
                        }}
                      >
                        <Text style={styles.simpleDropdownItemText}>{style.name}</Text>
                        <Text style={styles.simpleDropdownItemDesc}>{style.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Custom Prompt */}
          <View style={styles.formSection}>
            <View style={styles.customPromptHeader}>
              <Text style={styles.sectionTitle}>Custom Prompt (Optional)</Text>
              <TouchableOpacity
                style={[styles.toggleButton, isCustomPrompt && styles.toggleButtonActive]}
                onPress={handleCustomPromptToggle}
              >
                <Text style={styles.toggleButtonText}>
                  {isCustomPrompt ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {isCustomPrompt && (
              <TextInput
                style={styles.textInput}
                placeholder="Describe your dream hairstyle..."
                placeholderTextColor={COLORS.white + '80'}
                value={customPrompt}
                onChangeText={setCustomPrompt}
                multiline
              />
            )}
          </View>

          {/* Gender Selection */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Select Gender</Text>
            <View style={styles.simpleDropdownContainer}>
              <TouchableOpacity 
                style={styles.simpleDropdownButton} 
                onPress={() => toggleDropdown('gender')}
              >
                <Text style={styles.simpleDropdownText}>
                  {GENDER_OPTIONS.find(opt => opt.value === gender)?.label || 'Select...'}
                </Text>
                <Text style={styles.simpleDropdownArrow}>{showDropdown === 'gender' ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showDropdown === 'gender' && (
                <View style={styles.simpleDropdownList}>
                  <ScrollView 
                    style={styles.simpleDropdownScroll}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {GENDER_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.simpleDropdownItem}
                        onPress={() => {
                          setGender(option.value);
                          setShowDropdown(null);
                        }}
                      >
                        <Text style={styles.simpleDropdownItemText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Hair Color */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Hair Color</Text>
            <View style={styles.simpleDropdownContainer}>
              <TouchableOpacity 
                style={styles.simpleDropdownButton} 
                onPress={() => toggleDropdown('color')}
              >
                <Text style={styles.simpleDropdownText}>
                  {getColorOptions().find(opt => opt.value === hairColor)?.label || 'Select color...'}
                </Text>
                <Text style={styles.simpleDropdownArrow}>{showDropdown === 'color' ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showDropdown === 'color' && (
                <View style={styles.simpleDropdownList}>
                  <ScrollView 
                    style={styles.simpleDropdownScroll}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {getColorOptions().map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.simpleDropdownItem}
                        onPress={() => {
                          setHairColor(option.value);
                          setShowDropdown(null);
                        }}
                      >
                        <Text style={styles.simpleDropdownItemText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Image Format */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Image Format</Text>
            <View style={styles.simpleDropdownContainer}>
              <TouchableOpacity 
                style={styles.simpleDropdownButton} 
                onPress={() => toggleDropdown('format')}
              >
                <Text style={styles.simpleDropdownText}>
                  {getFormatOptions().find(opt => opt.value === imageFormat)?.label || 'Select format...'}
                </Text>
                <Text style={styles.simpleDropdownArrow}>{showDropdown === 'format' ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showDropdown === 'format' && (
                <View style={styles.simpleDropdownList}>
                  <ScrollView 
                    style={styles.simpleDropdownScroll}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {getFormatOptions().map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.simpleDropdownItem}
                        onPress={() => {
                          setImageFormat(option.value);
                          setShowDropdown(null);
                        }}
                      >
                        <Text style={styles.simpleDropdownItemText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Image Size */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Image Size</Text>
            <View style={styles.simpleDropdownContainer}>
              <TouchableOpacity 
                style={styles.simpleDropdownButton} 
                onPress={() => toggleDropdown('size')}
              >
                <Text style={styles.simpleDropdownText}>
                  {SIZE_OPTIONS.find(opt => opt.value === imageSize)?.label || 'Select size...'}
                </Text>
                <Text style={styles.simpleDropdownArrow}>{showDropdown === 'size' ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showDropdown === 'size' && (
                <View style={styles.simpleDropdownList}>
                  <ScrollView 
                    style={styles.simpleDropdownScroll}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {SIZE_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.simpleDropdownItem}
                        onPress={() => {
                          setImageSize(option.value);
                          setShowDropdown(null);
                        }}
                      >
                        <Text style={styles.simpleDropdownItemText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Character Consistency Warning */}
          {consistencyWarning && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>{consistencyWarning}</Text>
            </View>
          )}

          {/* Generate Button */}
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
            <Text style={styles.generateButtonIcon}>✨</Text>
            <Text style={styles.generateButtonText}>Generate New Look</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },
  loadingSubtext: {
    color: COLORS.white + '80',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  errorText: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 100,
    zIndex: 50,
  },
  scrollContainer: {
    paddingBottom: 120,
    minHeight: '100%',
  },
  photoPreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  formSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 10,
  },
  customPromptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.white,
  },
  toggleButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: COLORS.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  simpleDropdownContainer: {
    marginBottom: 15,
  },
  simpleDropdownButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  simpleDropdownText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  simpleDropdownArrow: {
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 10,
  },
  simpleDropdownList: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    maxHeight: 200,
  },
  simpleDropdownScroll: {
    maxHeight: 200,
  },
  simpleDropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  simpleDropdownItemText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  simpleDropdownItemDesc: {
    color: COLORS.white + '80',
    fontSize: 13,
    marginTop: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    color: COLORS.white,
    fontSize: 14,
    flex: 1,
  },
  generateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  generateButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  generateButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});