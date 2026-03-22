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
  private proxyUrl: string;
  private supabaseKey: string;

  constructor(_apiKey?: string) {
    // API key no longer used client-side — proxied through edge function
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    this.proxyUrl = `${supabaseUrl}/functions/v1/google-api-proxy`;
    this.supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  }

  get isConfigured(): boolean {
    return !!this.proxyUrl;
  }

  private async callProxy(body: Record<string, any>): Promise<any> {
    const res = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': this.supabaseKey },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json();
  }

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult | null> {
    if (!this.isConfigured || !text.trim()) return null;
    try {
      const data = await this.callProxy({ action: 'translate', text, target: targetLanguage, source: sourceLanguage });
      if (!data?.translatedText) return null;
      return { translatedText: data.translatedText, detectedSourceLanguage: data.detectedSourceLanguage };
    } catch (e) {
      if (__DEV__) console.warn('Translation error:', e);
      return null;
    }
  }

  async detectLanguage(text: string): Promise<LanguageDetection | null> {
    if (!this.isConfigured || !text.trim()) return null;
    try {
      const data = await this.callProxy({ action: 'detect', text });
      if (!data?.language) return null;
      return { language: data.language, confidence: data.confidence };
    } catch (e) {
      if (__DEV__) console.warn('Language detection error:', e);
      return null;
    }
  }

  async getSupportedLanguages(targetLanguage: string = 'en'): Promise<SupportedLanguage[]> {
    if (!this.isConfigured) return [];
    try {
      const data = await this.callProxy({ action: 'languages', target: targetLanguage });
      return (data?.languages || []).map((l: any) => ({
        language: l.language,
        name: l.name || l.language,
      }));
    } catch (e) {
      if (__DEV__) console.warn('Supported languages error:', e);
      return [];
    }
  }

  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult[]> {
    if (!this.isConfigured || texts.length === 0) return [];
    // Batch by translating each individually through proxy
    const results = await Promise.all(
      texts.map(text => this.translate(text, targetLanguage, sourceLanguage))
    );
    return results.filter((r): r is TranslationResult => r !== null);
  }
}

// No API key needed — proxied through Supabase edge function
export const translationService = new TranslationService();
