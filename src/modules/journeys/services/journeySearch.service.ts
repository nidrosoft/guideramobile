/**
 * Journey search service (spec §9.2/§11.1). Local query resolution + the
 * cache-or-generate country profile via the journeys-search edge function.
 */
import { supabase } from '@/lib/supabase/client';
import type { CountryProfile } from '../types';

// Free-text intent → category slug (+ optional sub-hub).
const CATEGORY_KEYWORDS: Array<{ re: RegExp; categorySlug: string; subhubSlug?: string }> = [
  { re: /\bhair\s*(transplant|restoration)?\b|\bfue\b|\bdhi\b/, categorySlug: 'medical', subhubSlug: 'hair' },
  { re: /\bdental|teeth|implant|veneer|crown\b/, categorySlug: 'medical', subhubSlug: 'dental' },
  { re: /\bcosmetic|plastic surgery|bbl|rhinoplasty|lipo\b/, categorySlug: 'medical', subhubSlug: 'cosmetic' },
  { re: /\bsurgery|medical|treatment|clinic\b/, categorySlug: 'medical' },
  { re: /\bivf|fertility|surrogac|egg donation\b/, categorySlug: 'fertility' },
  { re: /\bretire|retirement\b/, categorySlug: 'retire' },
  { re: /\bnomad|remote work|digital nomad\b/, categorySlug: 'nomad' },
  { re: /\brelocat|move abroad|expat|emigrat\b/, categorySlug: 'relocation' },
  { re: /\bwellness|retreat|yoga|detox\b/, categorySlug: 'wellness' },
  { re: /\bsolo female|solo travel\b/, categorySlug: 'solo' },
  { re: /\bstudy|university|semester abroad\b/, categorySlug: 'study' },
  { re: /\bpilgrim|hajj|umrah|camino\b/, categorySlug: 'pilgrimage' },
  { re: /\badventure|trek|climb|expedition\b/, categorySlug: 'adventure' },
  { re: /\bheritage|ancestry|roots|diaspora\b/, categorySlug: 'heritage' },
  { re: /\blongevity|biohack\b/, categorySlug: 'longevity' },
  { re: /\bcitizenship|second passport|golden visa|residency by investment\b/, categorySlug: 'cbi' },
  { re: /\bworldschool|family gap\b/, categorySlug: 'worldschool' },
  { re: /\bvolunteer|aid|conservation\b/, categorySlug: 'volunteer' },
];

const COUNTRY_ALIASES: Record<string, string> = {
  uk: 'GB', 'united kingdom': 'GB', britain: 'GB', england: 'GB',
  usa: 'US', us: 'US', america: 'US', 'united states': 'US',
  uae: 'AE', emirates: 'AE', dubai: 'AE',
  korea: 'KR', 'south korea': 'KR',
  czech: 'CZ', czechia: 'CZ',
  bali: 'ID', indonesia: 'ID',
  'costa rica': 'CR',
};

export interface ResolvedQuery {
  countryCode?: string;
  categorySlug?: string;
  subhubSlug?: string;
}

export function resolveQuery(raw: string, countries: Array<{ code: string; name: string }>): ResolvedQuery {
  const q = raw.toLowerCase().trim();
  if (!q) return {};
  const out: ResolvedQuery = {};

  for (const k of CATEGORY_KEYWORDS) {
    if (k.re.test(q)) {
      out.categorySlug = k.categorySlug;
      out.subhubSlug = k.subhubSlug;
      break;
    }
  }

  // alias match first
  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
    if (q.includes(alias)) {
      out.countryCode = code;
      break;
    }
  }
  // direct name match
  if (!out.countryCode) {
    const hit = countries.find((c) => q.includes(c.name.toLowerCase()) || c.name.toLowerCase() === q);
    if (hit) out.countryCode = hit.code;
  }
  return out;
}

function mapProfile(row: any): CountryProfile {
  return {
    countryCode: row.country_code ?? row.countryCode,
    countryName: row.countryName ?? undefined,
    overview: row.overview ?? '',
    knownFor: row.known_for ?? row.knownFor ?? [],
    matched: (row.matched ?? []).map((m: any) => ({
      categorySlug: m.categorySlug,
      relevance: m.relevance ?? 0,
      headline: m.headline ?? '',
      why: m.why ?? '',
    })),
    primaryJourney: row.primary_journey ?? row.primaryJourney ?? null,
    confidence: row.confidence ?? undefined,
  };
}

export interface SearchIntent {
  categorySlug: string | null;
  subhubSlug: string | null;
  countryCode: string | null;
  note: string;
  confidence: number;
}

/**
 * Free-text intent resolution via the journeys-search edge function. The LLM maps
 * any natural-language query (a procedure, a goal, a place) to the journey taxonomy.
 */
export async function resolveSearchIntent(query: string): Promise<SearchIntent> {
  const { data, error } = await supabase.functions.invoke('journeys-search', {
    body: { query },
  });
  if (error) throw error;
  const intent = (data as any)?.intent;
  if (!intent) throw new Error((data as any)?.error ?? 'intent_failed');
  return intent as SearchIntent;
}

export async function getCountryProfile(countryCode: string): Promise<CountryProfile> {
  const { data, error } = await supabase.functions.invoke('journeys-search', {
    body: { countryCode },
  });
  if (error) throw error;
  const profile = (data as any)?.profile;
  if (!profile) throw new Error((data as any)?.error ?? 'search_failed');
  return mapProfile(profile);
}

export async function logSearch(input: {
  rawQuery: string;
  resolvedCountry?: string;
  resolvedCategory?: string;
  resultType: string;
}): Promise<void> {
  void supabase
    .from('journey_search_queries')
    .insert({
      raw_query: input.rawQuery,
      resolved_country: input.resolvedCountry ?? null,
      resolved_category: input.resolvedCategory ?? null,
      result_type: input.resultType,
    })
    .then(undefined, () => {});
}
