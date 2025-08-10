// Photo Upload Screen for BarberBuddy
// Screen 1: "Start Your AI Hair Transformation" - only photo upload

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Header } from '../components/Header';
import { COLORS } from '../theme/colors';
import { PreviewCarousel } from '../components/PreviewCarousel';
import { ImageLightbox } from '../components/ImageLightbox';
import { BENEFIT_KEYS, BENEFIT_EMOJI } from '../constants/benefits';
import { useTranslation } from 'react-i18next';

type PhotoUploadScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PhotoUpload'>;

const { width, height } = Dimensions.get('window');

// Sample hairstyle images for the carousel
interface HairstylePreview {
  id: string;
  uri: string;
  title: string;
  description: string;
}

const SAMPLE_HAIRSTYLES: HairstylePreview[] = [
  {
    id: '1',
    uri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//banana%20clip%20updo.jpg',
    title: 'Banana Clip Updo',
    description: 'Classic updo secured with an elegant banana clip'
  },
  {
    id: '2',
    uri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//a_line_bob.jpg',
    title: 'A-Line Bob',
    description: 'Modern bob with sleek angled layers'
  },
  {
    id: '3',
    uri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//bald%20blone%20like%20Amber%20Rose.jpg',
    title: 'Bold Buzz Cut',
    description: 'Confident and edgy ultra-short style'
  },
  {
    id: '4',
    uri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//blonde%20wild%20spiked.png',
    title: 'Blonde Wild Spikes',
    description: 'Textured spiky style with platinum blonde'
  },
  {
    id: '5',
    uri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//curly.png',
    title: 'Natural Curls',
    description: 'Bouncy curls with natural volume'
  },
  {
    id: '6',
    uri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//brown%20Mohawk.png',
    title: 'Brown Mohawk',
    description: 'Edgy mohawk with rich brown tones'
  },
  {
    id: '7',
    uri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//hazel%20sophisticated%20.png',
    title: 'Sophisticated Waves',
    description: 'Elegant waves with hazel highlights'
  },
  {
    id: '8',
    uri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//braided%20ponytail.jpg',
    title: 'Braided Ponytail',
    description: 'Intricate braid flowing into sleek ponytail'
  },
  {
    id: '9',
    uri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//straightend%20rose%20gold.jpg',
    title: 'Rose Gold Straight',
    description: 'Sleek straight hair with rose gold tint'
  },
  {
    id: '10',
    uri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/test//straight_bob.png',
    title: 'Classic Straight Bob',
    description: 'Timeless bob cut with perfect straight lines'
  }
];

export const PhotoUploadScreen: React.FC = () => {
  const navigation = useNavigation<PhotoUploadScreenNavigationProp>();
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.error'),
        t('permissions.mediaLibraryRequired'),
        [{ text: t('common.ok'), style: 'default' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    try {
      setIsUploading(true);
      
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        // Navigate to configurator screen with the selected image
        navigation.navigate('HaircutSelection', { photoUri: imageUri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('errors.somethingWentWrong'), [{ text: t('common.ok'), style: 'default' }]);
    } finally {
      setIsUploading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsUploading(true);
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('permissions.cameraRequired'), [{ text: t('common.ok'), style: 'default' }]);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        // Navigate to configurator screen with the selected image
        navigation.navigate('HaircutSelection', { photoUri: imageUri });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('common.error'), t('errors.somethingWentWrong'), [{ text: t('common.ok'), style: 'default' }]);
    } finally {
      setIsUploading(false);
    }
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      t('photo.source.title'),
      t('photo.source.message'),
      [
        {
          text: t('photo.source.camera'),
          onPress: takePhoto,
        },
        {
          text: t('photo.source.gallery'),
          onPress: pickImage,
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.purplePrimary, COLORS.pinkAccent]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <Header />
      
      <View style={styles.content}>
        {/* Benefit chips with subtle rotation */}
        <BenefitChips />

        {/* Main Title */}
        <Text style={styles.title}>{t('home.title')}</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

        {/* Main Preview Image */}
        <View style={styles.mainPreviewContainer}>
          <Image
            source={{ uri: 'https://eoahpwciwttfavzpqfnz.supabase.co/storage/v1/object/public/images//ChatGPT%20Image%20Jun%209,%202025,%2001_55_22%20AM.png' }}
            style={styles.mainPreviewImage}
            resizeMode="cover"
          />
        </View>

        {/* Photo Upload Buttons */}
        <View style={styles.uploadButtonsContainer}>
          <TouchableOpacity
            style={[styles.uploadButton, styles.uploadButtonPrimary]}
            onPress={pickImage}
            disabled={isUploading}
          >
            <Text style={styles.uploadButtonIcon}>📱</Text>
            <Text style={styles.uploadButtonText}>{t('home.uploadPhoto')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.uploadButton, styles.uploadButtonSecondary]}
            onPress={takePhoto}
            disabled={isUploading}
          >
            <Text style={styles.uploadButtonIcon}>📷</Text>
            <Text style={styles.uploadButtonText}>{t('camera.takePhoto')}</Text>
          </TouchableOpacity>
        </View>

        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{t('generation.processing')}</Text>
          </View>
        )}

        {/* Preview Carousel */}
        <View style={styles.carouselSection}>
          <Text style={styles.carouselTitle}>✨ {t('home.previewHairstyles')}</Text>
          <PreviewCarousel
            hairstyles={SAMPLE_HAIRSTYLES}
            onPressItem={(uri) => {
              setLightboxUri(uri);
              setLightboxVisible(true);
            }}
          />
        </View>
      </View>
      <ImageLightbox visible={lightboxVisible} uri={lightboxUri} onClose={() => setLightboxVisible(false)} />
    </View>
  );
};

// Animated benefit chips (subtle drift)
const BenefitChips: React.FC = () => {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const visibleKeys = [
    BENEFIT_KEYS[index % BENEFIT_KEYS.length],
    BENEFIT_KEYS[(index + 1) % BENEFIT_KEYS.length]
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => prev + 2);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={benefitStyles.container}>
      <View style={benefitStyles.row}>
        <AnimatedChip text={`${BENEFIT_EMOJI[visibleKeys[0]]} ${t(visibleKeys[0])}`} delay={0} fullWidth />
      </View>
      <View style={[benefitStyles.row, { paddingLeft: 10 }]}>
        <AnimatedChip text={`${BENEFIT_EMOJI[visibleKeys[1]]} ${t(visibleKeys[1])}`} delay={200} fullWidth />
      </View>
    </View>
  );
};

const AnimatedChip: React.FC<{ text: string; delay?: number; fullWidth?: boolean }> = ({ text, delay = 0, fullWidth = false }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.delay(1200),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.0, duration: 700, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.95, duration: 700, useNativeDriver: true }),
        ]),
        Animated.delay(400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, scale, delay]);

  return (
    <Animated.View style={[benefitStyles.chip, fullWidth && benefitStyles.chipFullWidth, { opacity, transform: [{ scale }] }]}> 
      <Text style={benefitStyles.chipText}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  // emojis removed
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  mainPreviewContainer: {
    alignItems: 'center',
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mainPreviewImage: {
    width: width * 0.7,
    height: (width * 0.7) * 0.8, // 4:5 aspect ratio
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.8,
    marginBottom: 20,
  },
  uploadButton: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
  },
  uploadButtonPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: COLORS.white,
  },
  uploadButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  uploadButtonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 5,
  },
  uploadSubtext: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.8,
  },
  carouselSection: {
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 20,
    textAlign: 'center',
  },
});

const benefitStyles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  chip: {
    maxWidth: '92%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)'
  },
  chipFullWidth: {
    maxWidth: '92%',
  },
  chipText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
});