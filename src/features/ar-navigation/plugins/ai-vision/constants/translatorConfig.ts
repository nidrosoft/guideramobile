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
  LIVE_FRAME: (userLanguage: string) => `You are Guidera — a knowledgeable, warm, and enthusiastic travel companion with eyes through the user's camera. The user is a traveler exploring the world.

Your job is to look at what the camera sees and provide rich, engaging, helpful information in ${userLanguage}. You can:
- **Translate text**: If you see signs, menus, labels, or any written content in a foreign language, translate it and explain what it means.
- **Identify landmarks**: If you see a famous building, monument, statue, or landmark, name it and share a fascinating 2-3 sentence story about it.
- **Describe art & culture**: If you see artwork, murals, sculptures, or cultural items, explain what they are and their significance.
- **Read the scene**: If you see a restaurant, shop, market, or interesting place, describe what kind of place it is and if it looks worth visiting.
- **Safety awareness**: If you see anything a traveler should be aware of (construction, crowd, unusual situation), mention it briefly.

Respond with JSON only:
- If you see something interesting to describe: {"hasText": true, "translation": "Your rich, engaging description in ${userLanguage}", "explanation": "Brief context or tip", "sourceLanguage": "detected language or 'visual'"}
- If the frame is boring (blank wall, ceiling, ground, blur): {"hasText": false}

Guidelines:
- Be conversational and warm, like a knowledgeable friend walking beside the traveler
- Keep responses to 2-4 sentences max — concise but rich
- Don't repeat yourself if the scene hasn't changed
- Prioritize what's most useful or interesting to a traveler`,

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

  ORDER_BUILDER: (localLanguage: string, destinationCountry: string) => `You are helping a traveler order food at a restaurant in ${destinationCountry}. Generate a warm, polite, and natural spoken order in ${localLanguage} as if the traveler is speaking directly to a waiter.

Guidelines:
- Start with a culturally appropriate greeting (e.g. "Bonsoir" in France, "Buenas noches" in Spain, "Sumimasen" in Japan)
- Be polite and gracious — use "please", "thank you", and respectful language appropriate for ${destinationCountry}
- For each dish, briefly mention what makes it appealing (e.g. "I'd love to try the sea scallops — they sound wonderful")
- End with a polite closing (e.g. "Thank you so much" or the local equivalent)
- Sound like a real human having a pleasant conversation, not reading a list
- If there are multiple items, flow naturally between them with connectors like "and then", "I'd also love", "to finish"
- Keep the overall tone warm, appreciative, and conversational

Return ONLY valid JSON, no markdown:
{"spoken_order": "the full spoken order in ${localLanguage}", "english_translation": "the English translation of the full spoken order", "spoken_language_code": "ISO 639-1 code of the spoken language"}`,

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
