/**
 * TRANSLATOR CONFIG
 *
 * Model names, language codes, prompt templates, and cost optimization settings
 * for the AI Vision Translator feature.
 */

import { FrameDiffConfig, LanguageOption } from '../types/aiVision.types';

// ─── Model Configuration ──────────────────────────────────────
export const MODELS = {
  /** Used for live mode frame analysis (cheapest capable multimodal model) */
  LIVE_ANALYSIS: 'gemini-2.0-flash',
  /** Used for snapshot OCR follow-up and menu scan extraction */
  SNAPSHOT_ANALYSIS: 'gemini-2.0-flash',
  /** Used for order builder text generation */
  ORDER_GENERATION: 'gemini-2.0-flash',
} as const;

// ─── API Endpoints ────────────────────────────────────────────
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export const getGeminiEndpoint = (model: string) =>
  `${GEMINI_API_BASE}/models/${model}:generateContent`;

// ─── Frame Analysis Config ────────────────────────────────────
export const FRAME_DIFF_CONFIG: FrameDiffConfig = {
  changeThreshold: 0.15,   // 15% pixel change required to send new frame
  captureIntervalMs: 1000, // 1 frame per second
  compareWidth: 64,        // downsample to 64px wide for fast comparison
};

/** Max consecutive identical frames before pausing API calls */
export const MAX_IDLE_FRAMES = 5;

// ─── Cache Configuration ──────────────────────────────────────
/** Translation cache TTL in milliseconds (24 hours) */
export const TRANSLATION_CACHE_TTL = 24 * 60 * 60 * 1000;

/** Audio cache TTL in milliseconds (24 hours) */
export const AUDIO_CACHE_TTL = 24 * 60 * 60 * 1000;

/** Max cached translations before eviction */
export const MAX_CACHE_ENTRIES = 200;

/** AsyncStorage key for language preference */
export const LANGUAGE_PREF_KEY = '@guidera_vision_language';

// ─── Prompt Templates ─────────────────────────────────────────

export const PROMPTS = {
  LIVE_FRAME: (userLanguage: string) => `You are a real-time travel assistant embedded in a camera app. The user is a traveler who does not speak the local language. Analyze what you see in the camera frame. If you see any text, signs, labels, menus, or written content in any language, translate it to ${userLanguage} and briefly explain what it means or what the user should do. Be concise — max 2 sentences. Only respond when you see something meaningful to translate. If there is no text visible, respond with exactly: {"hasText": false}. Otherwise respond with JSON: {"hasText": true, "translation": "...", "explanation": "...", "sourceLanguage": "..."}`,

  SNAPSHOT_FOLLOWUP: (translatedText: string, userLanguage: string) => `The user took a photo and extracted the following translated text:\n\n"${translatedText}"\n\nThe user may ask follow-up questions about this text. Answer in ${userLanguage}. Be helpful, concise, and travel-aware.`,

  MENU_SCAN: (userLanguage: string) => `This is a photo of a restaurant menu. Extract ALL menu items, descriptions, and prices. Translate everything to ${userLanguage}. Return ONLY a valid JSON array in this exact format, no markdown, no explanation:
[
  {
    "category": "Category Name",
    "name_original": "Original text",
    "name_translated": "Translated name",
    "description": "Brief description of the dish translated to ${userLanguage}",
    "price": "Price as shown",
    "dietary_flags": ["contains gluten", "vegetarian", etc]
  }
]
If you cannot read the menu clearly, return: {"error": "Could not read menu clearly. Please try again with better lighting."}`,

  ORDER_BUILDER: (localLanguage: string, destinationCountry: string) => `A traveler wants to place the following food order at a restaurant in ${destinationCountry}. Generate a natural, polite spoken order in ${localLanguage} as if speaking directly to a waiter. The traveler does not speak the local language, so make it sound fluent and natural. Include appropriate greetings and politeness markers for the culture.

Return ONLY valid JSON, no markdown:
{"spoken_order": "...", "english_translation": "..."}`,

  IS_MENU_CHECK: `Look at this image. Does it appear to be a food or drink menu? Respond with ONLY "yes" or "no".`,
};

// ─── Supported Languages ──────────────────────────────────────
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
];

/** Map language code to best expo-speech voice identifier */
export const TTS_VOICE_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-BR',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  ar: 'ar-SA',
  hi: 'hi-IN',
  ru: 'ru-RU',
  th: 'th-TH',
  vi: 'vi-VN',
  tr: 'tr-TR',
  nl: 'nl-NL',
  pl: 'pl-PL',
  sv: 'sv-SE',
  el: 'el-GR',
  he: 'he-IL',
  id: 'id-ID',
  ms: 'ms-MY',
  uk: 'uk-UA',
  cs: 'cs-CZ',
};

/** Get language name from code */
export const getLanguageName = (code: string): string => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.name || code.toUpperCase();
};

/** Get language flag from code */
export const getLanguageFlag = (code: string): string => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.flag || '🌐';
};
