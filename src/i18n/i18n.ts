/**
 * Internationalization (i18n) Configuration
 * 
 * Sets up i18next with:
 * - Device locale detection
 * - Fallback language
 * - Interpolation
 * - Namespace support
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', rtl: false },
  es: { name: 'Spanish', nativeName: 'Español', rtl: false },
  fr: { name: 'French', nativeName: 'Français', rtl: false },
  de: { name: 'German', nativeName: 'Deutsch', rtl: false },
  zh: { name: 'Chinese', nativeName: '中文', rtl: false },
  ar: { name: 'Arabic', nativeName: 'العربية', rtl: true },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

const STORAGE_KEY = '@guidera_language';

// Language detection plugin
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Check for stored preference
      const storedLang = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedLang && storedLang in SUPPORTED_LANGUAGES) {
        callback(storedLang);
        return;
      }

      // Use device locale
      const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
      const supportedLocale = deviceLocale in SUPPORTED_LANGUAGES ? deviceLocale : 'en';
      callback(supportedLocale);
    } catch (error) {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lng);
    } catch (error) {
      console.error('Failed to cache language:', error);
    }
  },
};

// Resources
const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  zh: { translation: zh },
  ar: { translation: ar },
};

// Initialize i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

/**
 * Change the current language
 */
export const changeLanguage = async (lng: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(STORAGE_KEY, lng);
};

/**
 * Get current language
 */
export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language as SupportedLanguage) || 'en';
};

/**
 * Check if current language is RTL
 */
export const isRTL = (): boolean => {
  const lang = getCurrentLanguage();
  return SUPPORTED_LANGUAGES[lang]?.rtl || false;
};

/**
 * Get language display name
 */
export const getLanguageName = (lng: SupportedLanguage, native = false): string => {
  const lang = SUPPORTED_LANGUAGES[lng];
  return native ? lang.nativeName : lang.name;
};

export default i18n;
