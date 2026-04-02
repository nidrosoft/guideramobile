/**
 * GEMINI SERVICE
 *
 * Calls the ai-vision Supabase edge function which proxies Gemini API requests.
 * The GOOGLE_AI_API_KEY stays server-side (secure) — no API keys in client bundle.
 * Uses gemini-3-flash for all vision tasks via the edge function.
 */

import type { LiveFrameResult, MenuItem, SnapshotTranslationResult } from '../types/aiVision.types';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase/client';
import { retryWithBackoff } from '@/utils/retry';

const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/ai-vision`;

/**
 * Call the ai-vision edge function with the given action and body.
 */
async function callEdgeFunction(action: string, payload: Record<string, any>): Promise<any> {
  return retryWithBackoff(async () => {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (__DEV__) console.warn('[GeminiService] Edge function error:', res.status, errText);
      throw new Error(`AI Vision error: ${res.status}`);
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }, 'fast', `ai-vision/${action}`);
}

/**
 * Analyze a single camera frame for live translation mode.
 * Returns structured JSON with translation or hasText:false.
 */
export async function analyzeLiveFrame(
  base64Image: string,
  userLanguage: string,
): Promise<LiveFrameResult> {
  try {
    const result = await callEdgeFunction('analyze-frame', {
      image: base64Image,
      userLanguage,
    });

    return {
      hasText: result.hasText ?? false,
      translation: result.translation || '',
      explanation: result.explanation,
      sourceLanguage: result.sourceLanguage,
      timestamp: result.timestamp || Date.now(),
    };
  } catch (e) {
    return {
      hasText: false,
      translation: '',
      timestamp: Date.now(),
    };
  }
}

/**
 * Ask a follow-up question about a previous translation with image context.
 */
export async function askFollowUp(
  base64Image: string,
  translatedText: string,
  question: string,
  userLanguage: string,
): Promise<string> {
  const result = await callEdgeFunction('ask-followup', {
    image: base64Image,
    translatedText,
    question,
    userLanguage,
  });
  return result.answer || '';
}

/**
 * Extract structured menu from a photo using Gemini vision.
 */
export interface ExtractMenuResult {
  items: MenuItem[];
  sourceLanguage: string | null;
  sourceLanguageName: string | null;
}

export async function extractMenu(
  base64Image: string,
  userLanguage: string,
): Promise<ExtractMenuResult> {
  const result = await callEdgeFunction('extract-menu', {
    image: base64Image,
    userLanguage,
  });

  if (result.error) throw new Error(result.error);

  const items = (result.items || []).map((item: any) => ({
    ...item,
    isSelected: false,
    quantity: 0,
  }));

  return {
    items,
    sourceLanguage: result.sourceLanguage || null,
    sourceLanguageName: result.sourceLanguageName || null,
  };
}

/**
 * Generate a natural spoken order in the local language.
 */
export async function generateOrder(
  items: Array<{ nameOriginal: string; nameTranslated: string; quantity: number; price: string }>,
  localLanguage: string,
  destinationCountry: string,
): Promise<{ spokenOrder: string; englishTranslation: string; spokenLanguageCode?: string }> {
  const result = await callEdgeFunction('generate-order', {
    items,
    localLanguage,
    destinationCountry,
  });
  // The edge function may return the language code of the spoken order.
  // If not, we infer it from the destination country or fall back to localLanguage.
  return {
    spokenOrder: result.spokenOrder || result.spoken_order || '',
    englishTranslation: result.englishTranslation || result.english_translation || '',
    spokenLanguageCode: result.spokenLanguageCode || result.spoken_language_code || undefined,
  };
}

/**
 * Check if an image appears to be a food/drink menu.
 */
export async function isMenuImage(base64Image: string): Promise<boolean> {
  try {
    const result = await callEdgeFunction('check-menu', {
      image: base64Image,
    });
    return result.isMenu ?? false;
  } catch {
    return false;
  }
}

/**
 * Send a conversational message to Gemini.
 * Optionally include a camera frame for visual context.
 * Supports conversation history for multi-turn chat.
 */
export async function sendChat(
  message: string,
  userLanguage: string,
  options?: {
    image?: string;
    conversationHistory?: Array<{ role: 'user' | 'ai'; text: string }>;
  },
): Promise<string> {
  const result = await callEdgeFunction('chat', {
    message,
    userLanguage,
    image: options?.image,
    conversationHistory: options?.conversationHistory,
  });
  return result.response || '';
}

/**
 * Extract and translate all visible text from an image in a single Gemini call.
 * Replaces the separate Cloud Vision OCR → Cloud Translation chain.
 * Also detects if the image is a menu.
 */
export async function translateSnapshot(
  base64Image: string,
  userLanguage: string,
): Promise<SnapshotTranslationResult> {
  try {
    const result = await callEdgeFunction('translate-snapshot', {
      image: base64Image,
      userLanguage,
    });

    return {
      originalText: result.originalText || '',
      translatedText: result.translatedText || '',
      sourceLanguage: result.sourceLanguage || 'unknown',
      targetLanguage: userLanguage,
      isMenu: result.isMenu ?? false,
      timestamp: Date.now(),
    };
  } catch (e) {
    return {
      originalText: '',
      translatedText: '',
      sourceLanguage: 'unknown',
      targetLanguage: userLanguage,
      isMenu: false,
      timestamp: Date.now(),
    };
  }
}
