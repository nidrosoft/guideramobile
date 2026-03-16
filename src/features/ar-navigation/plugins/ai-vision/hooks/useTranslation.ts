/**
 * USE TRANSLATION HOOK
 *
 * Wraps the existing Google Cloud Translation API service.
 * Adds caching layer to avoid redundant API calls for identical text.
 */

import { useState, useCallback } from 'react';
import { translationService } from '../../../services/translation.service';
import {
  getCachedTranslation,
  cacheTranslation,
} from '../services/translationCache';
import type { TranslationResult } from '../types/aiVision.types';

interface UseTranslationReturn {
  translation: TranslationResult | null;
  isTranslating: boolean;
  error: string | null;
  translate: (text: string, targetLang: string, sourceLang?: string) => Promise<TranslationResult | null>;
  clear: () => void;
}

export function useTranslation(): UseTranslationReturn {
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(
    async (
      text: string,
      targetLang: string,
      sourceLang?: string,
    ): Promise<TranslationResult | null> => {
      if (!text.trim()) {
        setError('No text to translate.');
        return null;
      }

      // Check cache first
      const cached = getCachedTranslation(text, targetLang);
      if (cached) {
        setTranslation(cached);
        return cached;
      }

      setIsTranslating(true);
      setError(null);

      try {
        if (!translationService.isConfigured) {
          // Return original text if translation API not configured
          const fallback: TranslationResult = {
            originalText: text,
            translatedText: text,
            sourceLanguage: sourceLang || 'unknown',
            targetLanguage: targetLang,
            confidence: 0,
            timestamp: Date.now(),
          };
          setTranslation(fallback);
          setError('Translation API not configured. Showing original text.');
          return fallback;
        }

        // Detect source language if not provided
        let detectedLang = sourceLang;
        if (!detectedLang) {
          const detection = await translationService.detectLanguage(text.slice(0, 200));
          detectedLang = detection?.language;
        }

        // Skip translation if source === target
        if (detectedLang === targetLang) {
          const result: TranslationResult = {
            originalText: text,
            translatedText: text,
            sourceLanguage: detectedLang || 'unknown',
            targetLanguage: targetLang,
            confidence: 1,
            timestamp: Date.now(),
          };
          setTranslation(result);
          return result;
        }

        const translated = await translationService.translate(text, targetLang, detectedLang);

        if (!translated) {
          setError('Translation failed. Please try again.');
          return null;
        }

        const result: TranslationResult = {
          originalText: text,
          translatedText: translated.translatedText,
          sourceLanguage: translated.detectedSourceLanguage || detectedLang || 'auto',
          targetLanguage: targetLang,
          confidence: 0.95,
          timestamp: Date.now(),
        };

        // Cache the result
        cacheTranslation(text, targetLang, result);
        setTranslation(result);
        return result;
      } catch (e: any) {
        const msg = e?.message || 'Translation failed.';
        setError(msg);
        if (__DEV__) console.warn('[useTranslation] Error:', e);
        return null;
      } finally {
        setIsTranslating(false);
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setTranslation(null);
    setError(null);
  }, []);

  return { translation, isTranslating, error, translate, clear };
}
