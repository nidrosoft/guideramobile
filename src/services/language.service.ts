import { supabase } from '@/lib/supabase/client';
import {
  LanguageKit,
  LanguagePhrase,
  PhraseCategory,
} from '@/features/trips/plugins/language/types/language.types';

// ─── Row Mappers ────────────────────────────────────────

function mapKit(row: any): LanguageKit {
  return {
    id: row.id,
    tripId: row.trip_id,
    language: row.language,
    languageCode: row.language_code,
    script: row.script ?? 'latin',
    destination: row.destination ?? '',
    destinationCountry: row.destination_country ?? '',
    englishPenetration: row.english_penetration ?? 'medium',
    languageContext: row.language_context ?? {},
    pronunciationGuide: row.pronunciation_guide ?? [],
    localGems: row.local_gems ?? [],
    emergencyNumbers: row.emergency_numbers ?? {},
    totalPhrases: row.total_phrases ?? 0,
    criticalPhrasesCount: row.critical_phrases_count ?? 0,
    generatedBy: row.generated_by ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPhrase(row: any): LanguagePhrase {
  return {
    id: row.id,
    kitId: row.kit_id,
    tripId: row.trip_id,
    category: row.category,
    subcategory: row.subcategory ?? '',
    english: row.english,
    native: row.native ?? '',
    romanized: row.romanized ?? null,
    phonetic: row.phonetic ?? '',
    pronunciationNotes: row.pronunciation_notes ?? null,
    toneMarks: row.tone_marks ?? null,
    genderVariant: row.gender_variant ?? null,
    contextNote: row.context_note ?? null,
    formality: row.formality ?? 'polite',
    priority: row.priority ?? 'medium',
    displayOrder: row.display_order ?? 0,
    showNativeInCard: row.show_native_in_card ?? false,
    audioPhonetic: row.audio_phonetic ?? null,
    isFavorited: row.is_favorited ?? false,
  };
}

// ─── Service ────────────────────────────────────────────

class LanguageService {
  async generateLanguageKit(tripId: string): Promise<{
    success: boolean;
    language?: string;
    totalPhrases?: number;
    modelUsed?: string;
    error?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('generate-language', {
      body: { tripId },
    });
    if (error) throw new Error(`Language kit generation failed: ${error.message}`);
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async getKits(tripId: string): Promise<LanguageKit[]> {
    const { data, error } = await supabase
      .from('language_kits')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapKit);
  }

  async getKit(kitId: string): Promise<LanguageKit | null> {
    const { data, error } = await supabase
      .from('language_kits')
      .select('*')
      .eq('id', kitId)
      .single();
    if (error) return null;
    return mapKit(data);
  }

  async getPhrases(kitId: string, category?: PhraseCategory): Promise<LanguagePhrase[]> {
    let query = supabase
      .from('language_phrases')
      .select('*')
      .eq('kit_id', kitId)
      .order('display_order', { ascending: true });
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPhrase);
  }

  async searchPhrases(kitId: string, keyword: string): Promise<LanguagePhrase[]> {
    const { data, error } = await supabase
      .from('language_phrases')
      .select('*')
      .eq('kit_id', kitId)
      .or(`english.ilike.%${keyword}%,native.ilike.%${keyword}%,phonetic.ilike.%${keyword}%`)
      .order('display_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPhrase);
  }

  async toggleFavorite(phraseId: string, isFavorited: boolean): Promise<void> {
    const { error } = await supabase
      .from('language_phrases')
      .update({ is_favorited: isFavorited })
      .eq('id', phraseId);
    if (error) throw new Error(error.message);
  }

  async getFavorites(kitId: string): Promise<LanguagePhrase[]> {
    const { data, error } = await supabase
      .from('language_phrases')
      .select('*')
      .eq('kit_id', kitId)
      .eq('is_favorited', true)
      .order('category', { ascending: true })
      .order('display_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPhrase);
  }
}

export const languageService = new LanguageService();
