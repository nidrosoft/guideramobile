/**
 * Journey Briefing service (amendment spec §11/§8/§10).
 * Topics, per-topic cache batch reads, generate-or-fetch, recent/saved briefings,
 * and country recommendations. Per-topic content is written ONLY by the edge
 * function (service role); the client reads cache + invokes generation.
 */
import { supabase, getAuthenticatedEdgeFunctionHeaders } from '@/lib/supabase/client';
import type {
  JourneyTopic,
  TopicSection,
  BriefingDraft,
  JourneyBriefingRow,
  CountryRecommendation,
} from '../types';

function mapTopic(row: any): JourneyTopic {
  return {
    key: row.key,
    label: row.label,
    icon: row.icon,
    topicGroup: row.topic_group,
    isUniversal: !!row.is_universal,
    appliesTo: row.applies_to ?? [],
    subhubScope: row.subhub_scope ?? [],
    needsResearch: !!row.needs_research,
    defaultFor: row.default_for ?? [],
    sortWeight: row.sort_weight ?? 100,
    researchBasis: row.research_basis ?? undefined,
  };
}

/** Topics applicable to a journey: universal + pack topics for this category. */
export async function getTopicsForJourney(categorySlug: string): Promise<JourneyTopic[]> {
  const { data, error } = await supabase
    .from('journey_topics')
    .select('*')
    .eq('status', 'active')
    .or(`is_universal.eq.true,applies_to.cs.{${categorySlug}}`)
    .order('sort_weight', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapTopic);
}

/** Popularity counts for ordering (journey_topic_usage). */
export async function getTopicUsage(categorySlug: string): Promise<Record<string, number>> {
  const { data: cat } = await supabase.from('journey_categories').select('id').eq('slug', categorySlug).maybeSingle();
  if (!cat) return {};
  const { data } = await supabase
    .from('journey_topic_usage')
    .select('topic_key, selection_count')
    .eq('category_id', cat.id);
  const map: Record<string, number> = {};
  for (const r of data ?? []) map[r.topic_key] = Number(r.selection_count) || 0;
  return map;
}

async function resolveIds(categorySlug: string, subhubSlug?: string): Promise<{ catId: string | null; subhubId: string | null }> {
  const { data: cat } = await supabase.from('journey_categories').select('id').eq('slug', categorySlug).maybeSingle();
  if (!cat) return { catId: null, subhubId: null };
  let subhubId: string | null = null;
  if (subhubSlug) {
    const { data: sh } = await supabase.from('journey_subhubs').select('id').eq('category_id', cat.id).eq('slug', subhubSlug).maybeSingle();
    subhubId = sh?.id ?? null;
  }
  return { catId: cat.id, subhubId };
}

function mapSection(row: any): TopicSection {
  const content = row.content ?? {};
  return {
    topicKey: content.topicKey ?? row.topic_key,
    title: content.title ?? row.topic_key,
    summary: row.summary ?? content.summary,
    blocks: content.blocks ?? [],
    confidence: content.confidence ?? row.confidence ?? undefined,
    sources: row.sources ?? [],
    engine: row.engine ?? undefined,
    status: row.status ?? undefined,
  };
}

/** Single batch read of cached topic-sections (instant cache hits). */
export async function batchGetTopicContent(
  categorySlug: string,
  countryCode: string,
  subhubSlug: string | undefined,
  topicKeys: string[]
): Promise<Record<string, TopicSection>> {
  if (topicKeys.length === 0) return {};
  const { catId, subhubId } = await resolveIds(categorySlug, subhubSlug);
  if (!catId) return {};
  const cacheKeys = topicKeys.map((k) => `${catId}:${countryCode}:${subhubId ?? '_'}:${k}`);
  const { data, error } = await supabase
    .from('journey_topic_content')
    .select('topic_key, content, summary, sources, engine, status, confidence')
    .in('cache_key', cacheKeys)
    .neq('status', 'archived');
  if (error) throw error;
  const map: Record<string, TopicSection> = {};
  for (const row of data ?? []) map[row.topic_key] = mapSection(row);
  return map;
}

/** Generate-or-fetch a single topic-section via the edge function. */
export async function generateTopic(params: {
  categorySlug: string;
  countryCode: string;
  subhubSlug?: string;
  topicKey: string;
  stage?: string;
  who?: string;
}): Promise<TopicSection> {
  const { data, error } = await supabase.functions.invoke('journeys-generate-topic', { body: params });
  if (error) throw error;
  const section = (data as any)?.section;
  if (!section) throw new Error((data as any)?.error ?? 'topic_generation_failed');
  return section as TopicSection;
}

function briefingTitle(categoryName: string, countryName: string): string {
  return `${categoryName} · ${countryName}`;
}

/** Insert a briefing recipe + bump topic usage. Returns the new briefing id. */
export async function createBriefing(draft: BriefingDraft, userId: string): Promise<string | null> {
  const { catId, subhubId } = await resolveIds(draft.categorySlug, draft.subhubSlug);
  if (!catId || !draft.countryCode) return null;
  const { data: cat } = await supabase.from('journey_categories').select('name').eq('id', catId).maybeSingle();
  const title = briefingTitle(cat?.name ?? draft.categorySlug, draft.countryName ?? draft.countryCode);
  const { data, error } = await supabase
    .from('journey_briefings')
    .insert({
      user_id: userId,
      category_id: catId,
      country_code: draft.countryCode,
      subhub_id: subhubId,
      topic_keys: draft.topicKeys,
      stage: draft.stage ?? null,
      who: draft.who ?? null,
      who_detail: draft.whoDetail ?? {},
      title,
    })
    .select('id')
    .single();
  if (error) {
    // briefing logging must never block the result; swallow
    return null;
  }
  void supabase.rpc('journey_increment_topic_usage', { p_category_id: catId, p_topic_keys: draft.topicKeys }).then(undefined, () => {});
  return data?.id ?? null;
}

export async function getRecentBriefings(userId: string, limit = 20, savedOnly = false): Promise<JourneyBriefingRow[]> {
  let query = supabase
    .from('journey_briefings')
    .select('id, topic_keys, stage, who, title, is_saved, last_opened_at, country_code, journey_categories(slug,name), journey_countries(name,flag_emoji), journey_subhubs(slug)')
    .eq('user_id', userId);
  if (savedOnly) query = query.eq('is_saved', true);
  const { data, error } = await query.order('last_opened_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    categorySlug: r.journey_categories?.slug ?? '',
    categoryName: r.journey_categories?.name,
    countryCode: r.country_code,
    countryName: r.journey_countries?.name,
    flagEmoji: r.journey_countries?.flag_emoji,
    subhubSlug: r.journey_subhubs?.slug ?? undefined,
    topicKeys: r.topic_keys ?? [],
    stage: r.stage ?? undefined,
    who: r.who ?? undefined,
    title: r.title ?? undefined,
    isSaved: !!r.is_saved,
    lastOpenedAt: r.last_opened_at,
  }));
}

export async function touchBriefing(id: string): Promise<void> {
  void supabase.from('journey_briefings').update({ last_opened_at: new Date().toISOString() }).eq('id', id).then(undefined, () => {});
}

export async function setBriefingSaved(id: string, saved: boolean): Promise<void> {
  const { error } = await supabase.from('journey_briefings').update({ is_saved: saved }).eq('id', id);
  if (error) throw error;
}

export async function recommendCountries(categorySlug: string): Promise<CountryRecommendation[]> {
  const { data, error } = await supabase.functions.invoke('journeys-recommend-countries', {
    body: { categorySlug },
    headers: await getAuthenticatedEdgeFunctionHeaders(),
  });
  if (error) throw error;
  const recs: CountryRecommendation[] = (data as any)?.recommendations ?? [];
  if (recs.length === 0) return [];
  const { data: countries } = await supabase.from('journey_countries').select('code,name,flag_emoji').in('code', recs.map((r) => r.countryCode));
  const byCode: Record<string, any> = {};
  for (const c of countries ?? []) byCode[c.code] = c;
  return recs.map((r) => ({ ...r, countryName: byCode[r.countryCode]?.name, flagEmoji: byCode[r.countryCode]?.flag_emoji }));
}
