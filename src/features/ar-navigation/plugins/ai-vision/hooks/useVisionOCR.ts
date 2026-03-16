/**
 * USE VISION OCR HOOK
 *
 * Wraps the existing Google Cloud Vision API service for OCR text extraction.
 * Adds state management and error handling on top.
 */

import { useState, useCallback } from 'react';
import { visionService } from '../../../services/vision.service';
import type { OCRResult } from '../types/aiVision.types';

interface UseVisionOCRReturn {
  ocrResult: OCRResult | null;
  isProcessing: boolean;
  error: string | null;
  extractText: (imageUri: string) => Promise<OCRResult | null>;
  clear: () => void;
}

export function useVisionOCR(): UseVisionOCRReturn {
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractText = useCallback(async (imageUri: string): Promise<OCRResult | null> => {
    if (!imageUri) {
      setError('No image provided.');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (!visionService.isConfigured) {
        setError('Vision API not configured. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY and enable Cloud Vision API.');
        return null;
      }

      const result = await visionService.detectText(imageUri);
      if (!result || !result.fullText.trim()) {
        setError('No text detected. Try pointing at text with better lighting.');
        return null;
      }

      const mapped: OCRResult = {
        fullText: result.fullText,
        blocks: result.blocks.map(b => ({
          text: b.text,
          confidence: b.confidence,
        })),
      };

      setOcrResult(mapped);
      return mapped;
    } catch (e: any) {
      const msg = e?.message || 'Failed to extract text from image.';
      setError(msg);
      console.warn('[useVisionOCR] Error:', e);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clear = useCallback(() => {
    setOcrResult(null);
    setError(null);
  }, []);

  return { ocrResult, isProcessing, error, extractText, clear };
}
