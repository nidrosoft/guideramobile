/**
 * TRANSLATION CACHE
 *
 * In-memory + AsyncStorage cache for translations and audio.
 * Avoids redundant API calls for identical text.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TRANSLATION_CACHE_TTL,
  MAX_CACHE_ENTRIES,
  LANGUAGE_PREF_KEY,
} from '../constants/translatorConfig';
import type { CachedTranslation, TranslationResult } from '../types/aiVision.types';

const CACHE_STORAGE_KEY = '@guidera_translation_cache';

// In-memory LRU cache
const memoryCache = new Map<string, CachedTranslation>();

/**
 * Generate a cache key from source text and target language.
 */
function getCacheKey(sourceText: string, targetLanguage: string): string {
  // Simple hash: first 100 chars + length + target language
  const normalized = sourceText.trim().toLowerCase().slice(0, 100);
  return `${normalized}_${sourceText.length}_${targetLanguage}`;
}

/**
 * Get a cached translation if it exists and hasn't expired.
 */
export function getCachedTranslation(
  sourceText: string,
  targetLanguage: string,
): TranslationResult | null {
  const key = getCacheKey(sourceText, targetLanguage);
  const cached = memoryCache.get(key);

  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return cached.result;
}

/**
 * Store a translation in the cache.
 */
export function cacheTranslation(
  sourceText: string,
  targetLanguage: string,
  result: TranslationResult,
): void {
  const key = getCacheKey(sourceText, targetLanguage);

  // Evict oldest entries if at capacity
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }

  memoryCache.set(key, {
    key,
    result,
    expiresAt: Date.now() + TRANSLATION_CACHE_TTL,
  });
}

/**
 * Persist the memory cache to AsyncStorage (call on app background).
 */
export async function persistCache(): Promise<void> {
  try {
    const entries = Array.from(memoryCache.entries()).slice(-50); // keep last 50
    await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    if (__DEV__) console.warn('[TranslationCache] Persist error:', e);
  }
}

/**
 * Load persisted cache from AsyncStorage on startup.
 */
export async function loadCache(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return;

    const entries: [string, CachedTranslation][] = JSON.parse(raw);
    const now = Date.now();

    for (const [key, cached] of entries) {
      if (now < cached.expiresAt) {
        memoryCache.set(key, cached);
      }
    }
  } catch (e) {
    if (__DEV__) console.warn('[TranslationCache] Load error:', e);
  }
}

/**
 * Clear all cached translations.
 */
export async function clearCache(): Promise<void> {
  memoryCache.clear();
  await AsyncStorage.removeItem(CACHE_STORAGE_KEY);
}

/**
 * Save user's preferred output language.
 */
export async function saveLanguagePreference(languageCode: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_PREF_KEY, languageCode);
}

/**
 * Load user's preferred output language.
 */
export async function loadLanguagePreference(): Promise<string | null> {
  return AsyncStorage.getItem(LANGUAGE_PREF_KEY);
}

/** Get current cache size */
export function getCacheSize(): number {
  return memoryCache.size;
}
