/**
 * TRANSLATION EDGE FUNCTION
 * 
 * Integrates with Google Cloud Translation API for text translation.
 * Supports 130+ languages, language detection, and batch translation.
 * 
 * Environment Variables Required:
 * - GOOGLE_CLOUD_API_KEY
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface TranslationRequest {
  action: 'translate' | 'detect' | 'languages';
  text?: string | string[];
  sourceLanguage?: string;
  targetLanguage: string;
}

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
}

interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
}

// Supported languages (subset - Google supports 130+)
const LANGUAGES: Record<string, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  es: { name: 'Spanish', nativeName: 'Español' },
  fr: { name: 'French', nativeName: 'Français' },
  de: { name: 'German', nativeName: 'Deutsch' },
  it: { name: 'Italian', nativeName: 'Italiano' },
  pt: { name: 'Portuguese', nativeName: 'Português' },
  nl: { name: 'Dutch', nativeName: 'Nederlands' },
  ru: { name: 'Russian', nativeName: 'Русский' },
  ja: { name: 'Japanese', nativeName: '日本語' },
  ko: { name: 'Korean', nativeName: '한국어' },
  zh: { name: 'Chinese (Simplified)', nativeName: '中文' },
  'zh-TW': { name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  ar: { name: 'Arabic', nativeName: 'العربية' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी' },
  th: { name: 'Thai', nativeName: 'ไทย' },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  ms: { name: 'Malay', nativeName: 'Bahasa Melayu' },
  tl: { name: 'Filipino', nativeName: 'Filipino' },
  tr: { name: 'Turkish', nativeName: 'Türkçe' },
  pl: { name: 'Polish', nativeName: 'Polski' },
  uk: { name: 'Ukrainian', nativeName: 'Українська' },
  cs: { name: 'Czech', nativeName: 'Čeština' },
  sv: { name: 'Swedish', nativeName: 'Svenska' },
  da: { name: 'Danish', nativeName: 'Dansk' },
  no: { name: 'Norwegian', nativeName: 'Norsk' },
  fi: { name: 'Finnish', nativeName: 'Suomi' },
  el: { name: 'Greek', nativeName: 'Ελληνικά' },
  he: { name: 'Hebrew', nativeName: 'עברית' },
  hu: { name: 'Hungarian', nativeName: 'Magyar' },
  ro: { name: 'Romanian', nativeName: 'Română' },
  bg: { name: 'Bulgarian', nativeName: 'Български' },
  hr: { name: 'Croatian', nativeName: 'Hrvatski' },
  sk: { name: 'Slovak', nativeName: 'Slovenčina' },
  sl: { name: 'Slovenian', nativeName: 'Slovenščina' },
  et: { name: 'Estonian', nativeName: 'Eesti' },
  lv: { name: 'Latvian', nativeName: 'Latviešu' },
  lt: { name: 'Lithuanian', nativeName: 'Lietuvių' },
  bn: { name: 'Bengali', nativeName: 'বাংলা' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்' },
  te: { name: 'Telugu', nativeName: 'తెలుగు' },
  mr: { name: 'Marathi', nativeName: 'मराठी' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  ur: { name: 'Urdu', nativeName: 'اردو' },
  fa: { name: 'Persian', nativeName: 'فارسی' },
  sw: { name: 'Swahili', nativeName: 'Kiswahili' },
  af: { name: 'Afrikaans', nativeName: 'Afrikaans' },
  zu: { name: 'Zulu', nativeName: 'isiZulu' },
  am: { name: 'Amharic', nativeName: 'አማርኛ' },
};

// Translate text using Google Cloud Translation API
async function translateText(
  apiKey: string,
  text: string | string[],
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult[]> {
  const texts = Array.isArray(text) ? text : [text];
  
  const body: Record<string, unknown> = {
    q: texts,
    target: targetLanguage,
    format: 'text',
  };

  if (sourceLanguage) {
    body.source = sourceLanguage;
  }

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Google Translation API error:', error);
    throw new Error(`Translation API error: ${response.status}`);
  }

  const data = await response.json();
  const translations = data.data?.translations || [];

  return translations.map((t: { translatedText: string; detectedSourceLanguage?: string }, index: number) => ({
    originalText: texts[index],
    translatedText: t.translatedText,
    sourceLanguage: sourceLanguage || t.detectedSourceLanguage || 'auto',
    targetLanguage,
  }));
}

// Detect language
async function detectLanguage(
  apiKey: string,
  text: string
): Promise<{ language: string; confidence: number; name: string }> {
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2/detect?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: text }),
    }
  );

  if (!response.ok) {
    throw new Error(`Language detection failed: ${response.status}`);
  }

  const data = await response.json();
  const detection = data.data?.detections?.[0]?.[0];

  if (!detection) {
    throw new Error('Could not detect language');
  }

  const langInfo = LANGUAGES[detection.language];

  return {
    language: detection.language,
    confidence: detection.confidence,
    name: langInfo?.name || detection.language,
  };
}

// Fallback translation using simple word replacement (for demo/testing)
function fallbackTranslate(text: string, targetLanguage: string): string {
  // This is a placeholder - in production, always use the API
  // Just returns the original text with a note
  return `[${targetLanguage}] ${text}`;
}

// Main handler
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    const request: TranslationRequest = await req.json();

    let response: unknown;

    switch (request.action) {
      case 'languages': {
        const languages: LanguageInfo[] = Object.entries(LANGUAGES).map(([code, info]) => ({
          code,
          name: info.name,
          nativeName: info.nativeName,
        }));

        response = {
          languages,
          count: languages.length,
        };
        break;
      }

      case 'detect': {
        if (!request.text || Array.isArray(request.text)) {
          throw new Error('Single text string required for detection');
        }

        if (apiKey) {
          const detection = await detectLanguage(apiKey, request.text);
          response = { detection };
        } else {
          // Fallback - can't detect without API
          response = {
            detection: {
              language: 'unknown',
              confidence: 0,
              name: 'Unknown',
              note: 'API key not configured - detection unavailable',
            },
          };
        }
        break;
      }

      case 'translate':
      default: {
        if (!request.text) {
          throw new Error('Text is required for translation');
        }

        if (!request.targetLanguage) {
          throw new Error('Target language is required');
        }

        let translations: TranslationResult[];

        if (apiKey) {
          translations = await translateText(
            apiKey,
            request.text,
            request.targetLanguage,
            request.sourceLanguage
          );
        } else {
          // Fallback translation
          const texts = Array.isArray(request.text) ? request.text : [request.text];
          translations = texts.map(t => ({
            originalText: t,
            translatedText: fallbackTranslate(t, request.targetLanguage),
            sourceLanguage: request.sourceLanguage || 'auto',
            targetLanguage: request.targetLanguage,
          }));
        }

        response = {
          translations,
          count: translations.length,
        };
        break;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
        meta: {
          provider: apiKey ? 'google' : 'fallback',
          requestDuration: Date.now() - startTime,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Translation function error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'TRANSLATION_ERROR',
          message: (error as Error).message || 'Translation request failed',
        },
        meta: {
          requestDuration: Date.now() - startTime,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
