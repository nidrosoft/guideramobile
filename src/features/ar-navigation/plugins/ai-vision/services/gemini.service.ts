/**
 * GEMINI SERVICE
 *
 * Calls the ai-vision Supabase edge function which proxies Gemini API requests.
 * The GOOGLE_AI_API_KEY stays server-side (secure) — no API keys in client bundle.
 * Uses gemini-2.0-flash for all tasks via the edge function.
 */

import type { LiveFrameResult, MenuItem } from '../types/aiVision.types';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase/client';

const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/ai-vision`;

/**
 * Call the ai-vision edge function with the given action and body.
 */
async function callEdgeFunction(action: string, payload: Record<string, any>): Promise<any> {
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
    console.warn('[GeminiService] Edge function error:', res.status, errText);
    throw new Error(`AI Vision error: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
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
export async function extractMenu(
  base64Image: string,
  userLanguage: string,
): Promise<MenuItem[]> {
  const result = await callEdgeFunction('extract-menu', {
    image: base64Image,
    userLanguage,
  });

  if (result.error) throw new Error(result.error);

  return (result.items || []).map((item: any) => ({
    ...item,
    isSelected: false,
    quantity: 0,
  }));
}

/**
 * Generate a natural spoken order in the local language.
 */
export async function generateOrder(
  items: Array<{ nameOriginal: string; nameTranslated: string; quantity: number; price: string }>,
  localLanguage: string,
  destinationCountry: string,
): Promise<{ spokenOrder: string; englishTranslation: string }> {
  return callEdgeFunction('generate-order', {
    items,
    localLanguage,
    destinationCountry,
  });
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
