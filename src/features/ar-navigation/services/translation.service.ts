/**
 * TRANSLATION SERVICE
 *
 * Fully implemented Google Cloud Translation API v2.
 * Uses the existing Google Maps API key (same project, just enable Translation API).
 *
 * 🔑 Uses EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (enable Translation API in Google Cloud Console)
 */

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
}

export interface LanguageDetection {
  language: string;
  confidence: number;
}

export interface SupportedLanguage {
  language: string;
  name: string;
}

export class TranslationService {
  private apiKey: string;
  private baseUrl = 'https://translation.googleapis.com/language/translate/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 10;
  }

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult | null> {
    if (!this.isConfigured || !text.trim()) return null;
    try {
      const body: any = { q: text, target: targetLanguage, format: 'text' };
      if (sourceLanguage) body.source = sourceLanguage;

      const res = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const t = data.data?.translations?.[0];
      if (!t) return null;
      return {
        translatedText: t.translatedText,
        detectedSourceLanguage: t.detectedSourceLanguage,
      };
    } catch (e) {
      console.warn('Translation error:', e);
      return null;
    }
  }

  async detectLanguage(text: string): Promise<LanguageDetection | null> {
    if (!this.isConfigured || !text.trim()) return null;
    try {
      const res = await fetch(`${this.baseUrl}/detect?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const d = data.data?.detections?.[0]?.[0];
      if (!d) return null;
      return { language: d.language, confidence: d.confidence };
    } catch (e) {
      console.warn('Language detection error:', e);
      return null;
    }
  }

  async getSupportedLanguages(targetLanguage: string = 'en'): Promise<SupportedLanguage[]> {
    if (!this.isConfigured) return [];
    try {
      const res = await fetch(
        `${this.baseUrl}/languages?key=${this.apiKey}&target=${targetLanguage}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data?.languages || []).map((l: any) => ({
        language: l.language,
        name: l.name || l.language,
      }));
    } catch (e) {
      console.warn('Supported languages error:', e);
      return [];
    }
  }

  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult[]> {
    if (!this.isConfigured || texts.length === 0) return [];
    try {
      const body: any = { q: texts, target: targetLanguage, format: 'text' };
      if (sourceLanguage) body.source = sourceLanguage;

      const res = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data?.translations || []).map((t: any) => ({
        translatedText: t.translatedText,
        detectedSourceLanguage: t.detectedSourceLanguage,
      }));
    } catch (e) {
      console.warn('Batch translation error:', e);
      return [];
    }
  }
}

// Use the same Google API key — just enable Translation API in Google Cloud Console
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
export const translationService = new TranslationService(GOOGLE_API_KEY);
