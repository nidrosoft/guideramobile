/**
 * MENU TRANSLATION HOOK
 *
 * Wired to real Google Vision API (OCR) + Google Translate API.
 * No mock data — captures image, extracts text, translates it.
 */

import { useState, useEffect, useRef } from 'react';
import { TranslationResult } from '../components/TranslationSheet';
import { visionService } from '../../../services/vision.service';
import { translationService } from '../../../services/translation.service';

export type TranslationMode = 'scan' | 'live';

export function useMenuTranslation() {
  const [mode, setMode] = useState<TranslationMode>('scan');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLiveFrozen, setIsLiveFrozen] = useState(false);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('en');

  // Scan mode: Capture image → OCR → Translate
  const captureAndTranslate = async (imageUri?: string) => {
    if (!imageUri) {
      setError('No image captured. Point your camera at text and try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: OCR — extract text from image
      if (!visionService.isConfigured) {
        setError('Vision API not configured. Enable Cloud Vision API in Google Cloud Console.');
        return;
      }

      const ocrResult = await visionService.detectText(imageUri);
      if (!ocrResult || !ocrResult.fullText.trim()) {
        setError('No text detected in image. Try pointing your camera at a menu or sign.');
        return;
      }

      // Step 2: Detect source language
      let sourceLanguage: string | undefined;
      if (translationService.isConfigured) {
        const detection = await translationService.detectLanguage(ocrResult.fullText.slice(0, 200));
        sourceLanguage = detection?.language;
      }

      // Step 3: Translate
      if (!translationService.isConfigured) {
        // Show OCR result without translation
        setTranslation({
          originalText: ocrResult.fullText,
          translatedText: ocrResult.fullText,
          sourceLanguage: sourceLanguage || 'unknown',
          targetLanguage,
          confidence: 1,
        });
        setError('Translation API not configured. Showing extracted text only.');
        return;
      }

      const translated = await translationService.translate(
        ocrResult.fullText,
        targetLanguage,
        sourceLanguage
      );

      if (!translated) {
        setError('Translation failed. The text was extracted but could not be translated.');
        setTranslation({
          originalText: ocrResult.fullText,
          translatedText: ocrResult.fullText,
          sourceLanguage: sourceLanguage || 'unknown',
          targetLanguage,
          confidence: 0,
        });
        return;
      }

      setTranslation({
        originalText: ocrResult.fullText,
        translatedText: translated.translatedText,
        sourceLanguage: translated.detectedSourceLanguage || sourceLanguage || 'auto',
        targetLanguage,
        confidence: 0.95,
      });

    } catch (err) {
      setError('Failed to process image. Check your connection and try again.');
      console.error('Menu translation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Live mode is disabled without real-time OCR pipeline
  const startLiveTranslation = () => {
    // Live translation requires continuous camera frames → OCR
    // For now, live mode just prompts user to tap to scan
    setError('Live mode: Tap the capture button to scan visible text.');
  };

  const stopLiveTranslation = () => {
    // No interval to clean up — live mode is tap-to-scan
  };

  const toggleLiveFrozen = () => {
    setIsLiveFrozen(!isLiveFrozen);
  };

  const changeMode = (newMode: TranslationMode) => {
    setMode(newMode);
    setTranslation(null);
    setError(null);
  };

  const clearTranslation = () => {
    setTranslation(null);
    setError(null);
  };

  return {
    mode,
    isProcessing,
    isLiveFrozen,
    translation,
    error,
    targetLanguage,
    setTargetLanguage,
    captureAndTranslate,
    toggleLiveFrozen,
    changeMode,
    clearTranslation,
  };
}
