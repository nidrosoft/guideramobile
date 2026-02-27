/**
 * I18N CONFIGURATION
 * 
 * Internationalization setup using i18next and react-i18next.
 * Supports: English, French, Spanish, German, Italian, Portuguese
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resources, SUPPORTED_LANGUAGES, LanguageCode } from '@/locales';

const LANGUAGE_STORAGE_KEY = '@guidera_app_language';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

/**
 * Load saved language from AsyncStorage
 */
export async function loadSavedLanguage(): Promise<void> {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && isValidLanguage(savedLanguage)) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
}

/**
 * Change the app language and persist to storage
 */
export async function changeLanguage(languageCode: LanguageCode): Promise<void> {
  try {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error('Error changing language:', error);
    throw error;
  }
}

/**
 * Get the current language code
 */
export function getCurrentLanguage(): LanguageCode {
  return (i18n.language || 'en') as LanguageCode;
}

/**
 * Check if a language code is valid/supported
 */
export function isValidLanguage(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

/**
 * Get language info by code
 */
export function getLanguageInfo(code: LanguageCode) {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

export { SUPPORTED_LANGUAGES, LanguageCode };
export default i18n;
