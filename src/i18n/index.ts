import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../../assets/locales/en.json';
import de from '../../assets/locales/de.json';
import es from '../../assets/locales/es.json';
import tr from '../../assets/locales/tr.json';

const resources = {
  en: {
    translation: en,
  },
  de: {
    translation: de,
  },
  es: {
    translation: es,
  },
  tr: {
    translation: tr,
  },
};

const getDeviceLanguage = () => {
  const locales = getLocales();
  const deviceLanguage = locales[0]?.languageCode || 'en';
  
  // Map device language to supported languages
  const supportedLanguages = ['en', 'de', 'es', 'tr'];
  return supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';
};

const initI18n = async () => {
  let savedLanguage = null;
  
  try {
    savedLanguage = await AsyncStorage.getItem('user-language');
  } catch (error) {
    console.warn('Could not load saved language preference:', error);
  }
  
  const languageToUse = savedLanguage || getDeviceLanguage();

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: languageToUse,
      fallbackLng: 'en',
      
      interpolation: {
        escapeValue: false,
      },
      
      // Fix for React Native i18n compatibility
      compatibilityJSON: 'v3',
      
      // Disable pluralResolver for React Native compatibility
      pluralSeparator: '_',
      keySeparator: '.',
    });
};

initI18n();

export default i18n;