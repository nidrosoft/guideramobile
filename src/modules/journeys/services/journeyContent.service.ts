/**
 * Journeys content service (spec §11.1). Reads catalog + guides from Supabase.
 * Journey tables have public-read RLS, so the bridged client works for all users.
 */
import { supabase } from '@/lib/supabase/client';
import { KNOWN_DESTINATIONS } from '../config/categories.seed';
import type {
  JourneyCategory,
  JourneyContinent,
  JourneyCountry,
  JourneyGuide,
  GuideStub,
  GuideContent,
} from '../types';

function mapCategory(row: any): JourneyCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle ?? undefined,
    group: row.group,
    icon: row.icon,
    tint: row.tint,
    isPopular: !!row.is_popular,
    hasSubhubs: !!row.has_subhubs,
    sortOrder: row.sort_order ?? 100,
    monetizationModel: row.monetization_model,
    riskTier: row.risk_tier,
    isSensitive: !!row.is_sensitive,
    requiresDisclaimer: !!row.requires_disclaimer,
    subhubs: (row.journey_subhubs ?? []).map((s: any) => ({
      id: s.id,
      categoryId: row.id,
      slug: s.slug,
      name: s.name,
      icon: s.icon,
      tint: s.tint,
      blurb: s.blurb ?? undefined,
      stat: s.stat ?? undefined,
    })),
  };
}

export async function getCategories(): Promise<JourneyCategory[]> {
  const { data, error } = await supabase
    .from('journey_categories')
    .select('*, journey_subhubs(id,slug,name,icon,tint,blurb,stat,sort_order,status)')
    .eq('status', 'active')
    .order('is_popular', { ascending: false })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const cat = mapCategory(row);
    cat.subhubs = (cat.subhubs ?? [])
      .filter((s) => (row.journey_subhubs ?? []).find((r: any) => r.id === s.id)?.status === 'active')
      .sort((a, b) => {
        const ra = (row.journey_subhubs ?? []).find((r: any) => r.id === a.id)?.sort_order ?? 100;
        const rb = (row.journey_subhubs ?? []).find((r: any) => r.id === b.id)?.sort_order ?? 100;
        return ra - rb;
      });
    return cat;
  });
}

interface CountryRef {
  name: string;
  continent: JourneyContinent;
  flagEmoji: string;
}

export async function getCountries(): Promise<JourneyCountry[]> {
  const { data, error } = await supabase
    .from('journey_countries')
    .select('code,name,continent,flag_emoji')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    code: c.code,
    name: c.name,
    continent: c.continent,
    flagEmoji: c.flag_emoji,
  }));
}

async function getCountryMap(): Promise<Record<string, CountryRef>> {
  const { data, error } = await supabase
    .from('journey_countries')
    .select('code,name,continent,flag_emoji');
  if (error) throw error;
  const map: Record<string, CountryRef> = {};
  for (const c of data ?? []) {
    map[c.code] = { name: c.name, continent: c.continent, flagEmoji: c.flag_emoji };
  }
  return map;
}

const statusRank = (s: string) => (s === 'curated' ? 0 : s === 'none' ? 2 : 1);

export async function getCatalogStubs(categorySlug: string): Promise<GuideStub[]> {
  const [{ data: cat }, countryMap] = await Promise.all([
    supabase.from('journey_categories').select('id,slug').eq('slug', categorySlug).maybeSingle(),
    getCountryMap(),
  ]);
  if (!cat) return [];

  const { data: guides, error } = await supabase
    .from('journey_guides')
    .select('id,country_code,status,hook,headline_tag,fit_tags,rating,cost_band,subhub_id,journey_subhubs(slug)')
    .eq('category_id', cat.id)
    .eq('is_published', true);
  if (error) throw error;

  const byCountry = new Map<string, GuideStub>();
  for (const g of guides ?? []) {
    const ref = countryMap[g.country_code];
    if (!ref) continue;
    const existing = byCountry.get(g.country_code);
    const subhubSlug = (g.journey_subhubs as any)?.slug;
    if (existing) {
      if (subhubSlug) existing.subhubSlugs = [...new Set([...(existing.subhubSlugs ?? []), subhubSlug])];
      // prefer a curated guide as the representative stub
      if (statusRank(g.status) < statusRank(existing.status as string)) {
        existing.guideId = g.id;
        existing.status = g.status;
        existing.isCurated = g.status === 'curated';
        existing.hook = g.hook ?? existing.hook;
        existing.headlineTag = g.headline_tag ?? existing.headlineTag;
        existing.fitTags = g.fit_tags ?? existing.fitTags;
        existing.rating = g.rating ?? existing.rating;
        existing.costBand = g.cost_band ?? existing.costBand;
      }
      continue;
    }
    byCountry.set(g.country_code, {
      guideId: g.id,
      categorySlug,
      countryCode: g.country_code,
      countryName: ref.name,
      continent: ref.continent,
      flagEmoji: ref.flagEmoji,
      subhubSlugs: subhubSlug ? [subhubSlug] : undefined,
      status: g.status,
      isCurated: g.status === 'curated',
      hook: g.hook ?? undefined,
      headlineTag: g.headline_tag ?? undefined,
      fitTags: g.fit_tags ?? undefined,
      rating: g.rating ?? undefined,
      costBand: g.cost_band ?? undefined,
    });
  }

  // Union the known-destination seed list (breadth) for countries without a guide.
  for (const code of KNOWN_DESTINATIONS[categorySlug] ?? []) {
    if (byCountry.has(code)) continue;
    const ref = countryMap[code];
    if (!ref) continue;
    byCountry.set(code, {
      categorySlug,
      countryCode: code,
      countryName: ref.name,
      continent: ref.continent,
      flagEmoji: ref.flagEmoji,
      status: 'none',
      isCurated: false,
    });
  }

  return Array.from(byCountry.values()).sort((a, b) => {
    const r = statusRank(a.status as string) - statusRank(b.status as string);
    if (r !== 0) return r;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}

function mapGuide(row: any, countryRef?: CountryRef): JourneyGuide {
  return {
    id: row.id,
    categorySlug: row.journey_categories?.slug ?? '',
    countryCode: row.country_code,
    countryName: countryRef?.name ?? row.journey_countries?.name ?? row.country_code,
    flagEmoji: countryRef?.flagEmoji ?? row.journey_countries?.flag_emoji ?? '🏳️',
    subhubSlug: row.journey_subhubs?.slug ?? undefined,
    focus: row.focus ?? undefined,
    status: row.status,
    isCurated: row.status === 'curated',
    confidence: row.confidence ?? undefined,
    rating: row.rating ?? undefined,
    costBand: row.cost_band ?? undefined,
    requiresDisclaimer: !!(row.content as GuideContent)?.requiresDisclaimer,
    content: (row.content ?? {}) as GuideContent,
  };
}

export async function getGuide(
  categorySlug: string,
  countryCode: string,
  subhubSlug?: string
): Promise<JourneyGuide | null> {
  const { data: cat } = await supabase
    .from('journey_categories')
    .select('id,slug')
    .eq('slug', categorySlug)
    .maybeSingle();
  if (!cat) return null;

  let query = supabase
    .from('journey_guides')
    .select('*, journey_categories(slug), journey_countries(name,flag_emoji), journey_subhubs(slug)')
    .eq('category_id', cat.id)
    .eq('country_code', countryCode)
    .eq('is_published', true);

  if (subhubSlug) {
    const { data: sh } = await supabase
      .from('journey_subhubs')
      .select('id')
      .eq('category_id', cat.id)
      .eq('slug', subhubSlug)
      .maybeSingle();
    if (sh?.id) query = query.eq('subhub_id', sh.id);
  }

  const { data, error } = await query
    .order('status', { ascending: true }) // curated < ai alphabetically: 'curated' > 'ai_generated' so handle below
    .limit(5);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  // Prefer curated, then most recent
  const best = data.sort((a: any, b: any) => statusRank(a.status) - statusRank(b.status))[0];
  return mapGuide(best);
}

/**
 * Generate-or-fetch (spec §8.2). Returns an existing guide if present, else
 * invokes the journeys-generate-guide edge function (service-role writes the
 * row) and returns the freshly generated guide.
 */
export async function getOrGenerateGuide(params: {
  categorySlug: string;
  countryCode: string;
  subhubSlug?: string;
}): Promise<JourneyGuide> {
  const existing = await getGuide(params.categorySlug, params.countryCode, params.subhubSlug);
  if (existing) return existing;

  const { data, error } = await supabase.functions.invoke('journeys-generate-guide', {
    body: {
      categorySlug: params.categorySlug,
      countryCode: params.countryCode,
      subhubSlug: params.subhubSlug,
    },
  });
  if (error) throw error;
  const row = (data as any)?.guide;
  if (!row) throw new Error((data as any)?.error ?? 'generation_failed');
  return mapGuide(row);
}

export async function submitGuideFeedback(
  guideId: string,
  input: { userId?: string; isHelpful?: boolean; flagReason?: string; comment?: string }
): Promise<void> {
  const { error } = await supabase.from('journey_guide_feedback').insert({
    guide_id: guideId,
    user_id: input.userId ?? null,
    is_helpful: input.isHelpful ?? null,
    flag_reason: input.flagReason ?? null,
    comment: input.comment ?? null,
  });
  if (error) throw error;
}

export async function prefetchJourneyCatalog(): Promise<void> {
  try {
    await getCategories();
  } catch {
    // best-effort prefetch
  }
}
