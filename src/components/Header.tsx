// Header component for Barber Buddy
// Used across all screens with avatar, app name, upgrade button, and language switcher

import React, { useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

type HeaderNavigationProp = StackNavigationProp<RootStackParamList>;

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export const Header: React.FC<HeaderProps & { showLibrary?: boolean; showUpgrade?: boolean; showLang?: boolean; showSignOut?: boolean }> = memo(({ 
  title = 'BarberBuddy',
  showBackButton = false,
  showLibrary = true,
  showUpgrade = true,
  showLang = true,
  showSignOut = false,
}) => {
  const navigation = useNavigation<HeaderNavigationProp>();
  const { t, i18n } = useTranslation();
  const { signOut, user } = useAuth();
  
  // DEBUG: Log user state before rendering
  console.log('🔍 Header render - user state:', {
    hasUser: !!user,
    userEmail: user?.email,
    shouldShowProfile: !!user
  });

  const handleLanguageChange = useCallback(() => {
    // Cycle through languages: EN -> DE -> ES -> TR -> EN
    const languages = ['en', 'de', 'es', 'tr'];
    const currentIndex = languages.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    i18n.changeLanguage(languages[nextIndex]);
  }, [i18n]);

  const handleUpgrade = useCallback(() => {
    navigation.navigate('Subscription');
  }, [navigation]);

  const handleAvatarPress = useCallback(() => {
    navigation.navigate('SettingsSupport');
  }, [navigation]);

  const handleLibraryPress = useCallback(() => {
    navigation.navigate('Library');
  }, [navigation]);

  const handleTitlePress = useCallback(() => {
    // Navigate to PhotoUpload (main/upload page) when BarberBuddy logo is tapped
    navigation.navigate('PhotoUpload');
  }, [navigation]);

  const handleSignOut = async () => {
    try {
      if (__DEV__) console.log('🚪 Header.handleSignOut() initiating logout...');
      const result = await signOut();
      if (__DEV__) console.log('🚪 Header.handleSignOut() result:', result);
      
      if (!result.success && result.error) {
        if (__DEV__) console.log('❌ Header.handleSignOut() error:', result.error);
      }
    } catch (error) {
      if (__DEV__) console.error('💥 Header.handleSignOut() exception:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Left: Avatar - Only show if user is authenticated */}
      {user ? (
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={handleAvatarPress}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>CJ</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.avatarContainer}>
          {/* Empty space when logged out */}
        </View>
      )}

      {/* Center: App Name/Title - Clickable to navigate to upload page */}
      <TouchableOpacity 
        style={styles.titleContainer}
        onPress={handleTitlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.titleText} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
      </TouchableOpacity>

      {/* Right: Library, Sign Out, Upgrade Button and Language Switcher */}
      <View style={styles.rightContainer}>
        {showLibrary && (
          <TouchableOpacity 
            style={styles.libraryButton}
            onPress={handleLibraryPress}
            activeOpacity={0.7}
          >
            <Ionicons name="images-outline" size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}
        {user && showSignOut && (
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}
        {showUpgrade && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            activeOpacity={0.7}
          >
            <Text style={styles.upgradeText} numberOfLines={1} ellipsizeMode="tail">{t('common.upgrade')}</Text>
          </TouchableOpacity>
        )}
        {showLang && (
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={handleLanguageChange}
            activeOpacity={0.7}
          >
            <Text style={styles.languageText} numberOfLines={1} ellipsizeMode="tail">
              {i18n.language.toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  avatarContainer: {
    flexShrink: 0,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    minWidth: 100,
  },
  rightContainer: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    maxWidth: 140
  },
  libraryButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  upgradeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  upgradeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  languageButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  languageText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default Header; 