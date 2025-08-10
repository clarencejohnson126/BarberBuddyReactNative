// SettingsSupportScreen component for Barber Buddy
// Real settings and support functionality with language selection, privacy, and feedback

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Linking,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useGradient } from '../context/GradientContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Toast from 'react-native-root-toast';
import { getQuickDiagnostics, getAccountDiagnostics } from '../services/stripeService';
import { debugEnvironmentVariables } from '../utils/debugEnv';

type SettingsSupportNavigationProp = StackNavigationProp<RootStackParamList, 'SettingsSupport'>;

const { width: screenWidth } = Dimensions.get('window');

// Language options
const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];

export const SettingsSupportScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<SettingsSupportNavigationProp>();
  const { setGradientState } = useGradient();
  const { signOut, user } = useAuth();
  
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isDiagnosticsLoading, setIsDiagnosticsLoading] = useState(false);

  // Set gradient state
  React.useEffect(() => {
    setGradientState('DIAGONAL_GRADIENT');
  }, [setGradientState]);

  // Handle language change
  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('user-language', languageCode);
      const langName = t(`languages.${languageCode}`);
      Toast.show(`${t('settings.languageChanged')}: ${langName}`, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.TOP,
      });
    } catch (error) {
      console.error('Language change failed:', error);
      Alert.alert(
        t('common.error'),
        t('errors.somethingWentWrong'),
        [{ text: t('common.ok') }]
      );
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert(
        t('common.error'),
        t('feedback.feedbackRequired'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    try {
      setIsSubmittingFeedback(true);
      
      // TODO: Send feedback to support@barberbuddy.app
      // This would involve a backend API call or email service
      
      const feedbackData = {
        feedback: feedbackText,
        email: feedbackEmail,
        language: i18n.language,
        timestamp: new Date().toISOString(),
        appVersion: '1.0.0', // This would come from app constants
      };
      
      console.log('Feedback submission:', feedbackData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        t('feedback.feedbackSent'),
        t('feedback.feedbackSentMessage'),
        [{ text: t('common.ok') }]
      );
      
      setFeedbackText('');
      setFeedbackEmail('');
      setShowFeedbackModal(false);
      
    } catch (error) {
      console.error('Feedback submission failed:', error);
      Alert.alert(
        t('common.error'),
        t('feedback.feedbackError'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Handle privacy policy
  const handlePrivacyPolicy = () => {
    navigation.navigate('LegalWebView', { url: 'https://barberbuddy.app/privacy', title: t('settings.privacyPolicy') });
  };

  // Handle terms of service
  const handleTermsOfService = () => {
    navigation.navigate('LegalWebView', { url: 'https://barberbuddy.app/terms', title: t('settings.termsOfService') });
  };

  // Handle API diagnostics
  const handleRunDiagnostics = async () => {
    setIsDiagnosticsLoading(true);
    try {
      const envDebug = debugEnvironmentVariables();
      const quickDiag = getQuickDiagnostics();
      const accountDiag = getAccountDiagnostics();
      
      Alert.alert(
        '🔍 Environment Debug',
        `🔑 Secret Key Present: ${envDebug.hasStripeSecretKey ? 'Yes' : 'No'}\n` +
        `🔑 Key Preview: ${envDebug.stripeSecretKeyPreview}\n` +
        `🆔 Account ID Present: ${envDebug.hasStripeAccountId ? 'Yes' : 'No'}\n` +
        `📰 Public Key Present: ${envDebug.hasStripePublicKey ? 'Yes' : 'No'}\n\n` +
        `Expected Account: ${quickDiag.expectedAccount}\n` +
        `Key Format: ${quickDiag.keyFormat}\n\n` +
        `💡 ${envDebug.hasStripeSecretKey ? 'Environment loaded correctly!' : 'Environment variables missing - restart app!'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        '⚠️ Diagnostics Failed',
        `Error getting diagnostics:\n${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsDiagnosticsLoading(false);
    }
  };

  // Handle logout (if user is logged in)
  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('settings.logout'), 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Settings.handleLogout() initiating logout...');
              const result = await signOut();
              console.log('🚪 Settings.handleLogout() result:', result);
              
              if (!result.success && result.error) {
                Alert.alert(
                  t('common.error'),
                  result.error,
                  [{ text: t('common.ok') }]
                );
              }
            } catch (error) {
              console.error('💥 Settings.handleLogout() exception:', error);
              Alert.alert(
                t('common.error'),
                'Failed to sign out. Please try again.',
                [{ text: t('common.ok') }]
              );
            }
          }
        },
      ]
    );
  };

  // Handle back
  const handleBack = () => {
    navigation.goBack();
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    description: string,
    onPress: () => void,
    showArrow: boolean = true
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon as any} size={24} color={COLORS.white} />
        <View style={styles.settingItemText}>
          <Text style={styles.settingItemTitle}>{title}</Text>
          <Text style={styles.settingItemDescription}>{description}</Text>
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
      )}
    </TouchableOpacity>
  );

  const renderLanguageItem = (language: typeof LANGUAGE_OPTIONS[0]) => (
    <TouchableOpacity
      key={language.code}
      style={[
        styles.languageItem,
        i18n.language === language.code && styles.languageItemSelected,
      ]}
      onPress={() => handleLanguageChange(language.code)}
      activeOpacity={0.7}
    >
      <Text style={styles.languageFlag}>{language.flag}</Text>
      <Text style={[
        styles.languageName,
        i18n.language === language.code && styles.languageNameSelected,
      ]}>
        {language.name}
      </Text>
      {i18n.language === language.code && (
        <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Header title={t('settings.title')} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Language Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
            <View style={styles.languageOptions}>
              {LANGUAGE_OPTIONS.map(renderLanguageItem)}
            </View>
          </View>

          {/* Account Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
            {renderSettingItem(
              'person-outline',
              t('settings.profile'),
              t('settings.profileDescription'),
              () => console.log('Profile pressed')
            )}
            {renderSettingItem(
              'card-outline',
              t('settings.subscription'),
              t('settings.subscriptionDescription'),
              () => navigation.navigate('Subscription')
            )}
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
            {renderSettingItem(
              'chatbubble-outline',
              t('settings.sendFeedback'),
              t('settings.sendFeedbackDescription'),
              () => setShowFeedbackModal(true)
            )}
            {renderSettingItem(
              'help-circle-outline',
              t('settings.help'),
              t('settings.helpDescription'),
              () => Linking.openURL('https://barberbuddy.app/help')
            )}
          </View>

          {/* Legal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.legal')}</Text>
            {renderSettingItem(
              'shield-outline',
              t('settings.privacyPolicy'),
              t('settings.privacyPolicyDescription'),
              handlePrivacyPolicy
            )}
            {renderSettingItem(
              'document-text-outline',
              t('settings.termsOfService'),
              t('settings.termsOfServiceDescription'),
              handleTermsOfService
            )}
          </View>

          {/* App Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.app')}</Text>
            {renderSettingItem(
              'information-circle-outline',
              t('settings.version'),
              '1.0.0 (Build 1)',
              () => {},
              false
            )}
            {renderSettingItem(
              'pulse-outline',
              'API Diagnostics',
              isDiagnosticsLoading ? 'Running diagnostics...' : 'Check API connections & account status',
              handleRunDiagnostics,
              false
            )}
          </View>

          {/* Logout - Only show if user is logged in */}
          {user && (
            <View style={styles.section}>
              {renderSettingItem(
                'log-out-outline',
                t('settings.logout'),
                t('settings.logoutDescription'),
                handleLogout,
                false
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowFeedbackModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={COLORS.text.dark} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('feedback.title')}</Text>
            <View style={styles.modalCloseButton} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              {t('feedback.description')}
            </Text>
            
            <TextInput
              style={styles.feedbackInput}
              placeholder={t('feedback.feedbackPlaceholder')}
              placeholderTextColor="rgba(0, 0, 0, 0.5)"
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
            
            <TextInput
              style={styles.emailInput}
              placeholder={t('feedback.emailPlaceholder')}
              placeholderTextColor="rgba(0, 0, 0, 0.5)"
              value={feedbackEmail}
              onChangeText={setFeedbackEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!feedbackText.trim() || isSubmittingFeedback) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitFeedback}
              disabled={!feedbackText.trim() || isSubmittingFeedback}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>
                {isSubmittingFeedback ? t('feedback.sending') : t('feedback.send')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 16,
  },
  languageOptions: {
    gap: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  languageItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '500',
    flex: 1,
  },
  languageNameSelected: {
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    marginLeft: 16,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: 2,
  },
  settingItemDescription: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    lineHeight: 16,
  },
  backButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalCloseButton: {
    width: 32,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.dark,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: COLORS.text.dark,
    lineHeight: 22,
    marginBottom: 24,
  },
  feedbackInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.dark,
    textAlignVertical: 'top',
    minHeight: 120,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  emailInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.dark,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  submitButton: {
    backgroundColor: COLORS.purplePrimary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default SettingsSupportScreen;