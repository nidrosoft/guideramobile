import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { SNAPSHOT_AI_CACHE_VERSION, TOPIC_TTL_DAYS, LIVE_DATA_CACHE_TTL_SECONDS } from './constants.ts';
import { destinationSlug, seasonFromDate } from './destination.ts';

export interface CachedBriefSection {
  section: {
    id: string;
    icon: string;
    title: string;
    items: { label: string; detail: string }[];
  };
  cachedAt: string;
}

function getServiceClient(): SupabaseClient | null {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  return createClient(url, key);
}

export function buildTopicCacheKey(
  topicId: string,
  city: string,
  country: string,
  nationality: string,
  startDate: string,
): string {
  const slug = destinationSlug(city, country);
  const nat = (nationality || 'US').toLowerCase().replace(/\s+/g, '-').slice(0, 20);
  const season = seasonFromDate(startDate);
  const needsSeason = ['weather', 'crowds', 'history'].includes(topicId);
  const needsNat = ['visa_entry', 'laws', 'health', 'solo_female'].includes(topicId);

  const parts = [SNAPSHOT_AI_CACHE_VERSION, 'snapshot', topicId, slug];
  if (needsNat) parts.push(nat);
  if (needsSeason) parts.push(season);
  return parts.join(':');
}

export async function getCachedOverview(
  city: string,
  country: string,
  startDate: string,
): Promise<{ overview: string; cachedAt: string } | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const cacheKey = buildTopicCacheKey('overview', city, country, '', startDate);

  const { data } = await supabase
    .from('ai_module_cache')
    .select('content, created_at, expires_at')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!data?.content?.overview) return null;

  const overview = String(data.content.overview).trim();
  // Ignore truncated/incomplete cached overviews — force regeneration
  if (overview.length < 220 || !/[.!?]["']?\s*$/.test(overview)) return null;

  return { overview, cachedAt: data.created_at };
}

export async function setCachedOverview(
  city: string,
  country: string,
  startDate: string,
  overview: string,
): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) return;

  const cacheKey = buildTopicCacheKey('overview', city, country, '', startDate);
  const slug = destinationSlug(city, country);
  const ttlDays = 30;
  const expiresAt = new Date(Date.now() + ttlDays * 86400000).toISOString();

  await supabase.from('ai_module_cache').upsert(
    {
      cache_key: cacheKey,
      module_type: 'snapshot_overview',
      cache_tier: 'destination_base',
      context_hash: cacheKey,
      content: { overview },
      destination_code: slug,
      season: seasonFromDate(startDate),
      ttl_days: ttlDays,
      expires_at: expiresAt,
      last_accessed_at: new Date().toISOString(),
      access_count: 1,
    },
    { onConflict: 'cache_key' },
  );
}

export async function getCachedTopicSection(
  topicId: string,
  city: string,
  country: string,
  nationality: string,
  startDate: string,
): Promise<CachedBriefSection | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const cacheKey = buildTopicCacheKey(topicId, city, country, nationality, startDate);

  const { data } = await supabase
    .from('ai_module_cache')
    .select('content, created_at, expires_at')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!data?.content?.section) return null;

  await supabase
    .from('ai_module_cache')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('cache_key', cacheKey);

  return {
    section: data.content.section,
    cachedAt: data.created_at,
  };
}

export async function setCachedTopicSection(
  topicId: string,
  city: string,
  country: string,
  nationality: string,
  startDate: string,
  section: CachedBriefSection['section'],
): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) return;

  const cacheKey = buildTopicCacheKey(topicId, city, country, nationality, startDate);
  const ttlDays = TOPIC_TTL_DAYS[topicId] ?? 30;
  const expiresAt = new Date(Date.now() + ttlDays * 86400000).toISOString();
  const slug = destinationSlug(city, country);

  await supabase.from('ai_module_cache').upsert(
    {
      cache_key: cacheKey,
      module_type: `snapshot_${topicId}`,
      cache_tier: ['visa_entry', 'laws', 'health', 'solo_female'].includes(topicId)
        ? 'context_specific'
        : 'destination_base',
      context_hash: cacheKey,
      content: { section },
      destination_code: slug,
      nationality: nationality || 'US',
      season: seasonFromDate(startDate),
      ttl_days: ttlDays,
      expires_at: expiresAt,
      last_accessed_at: new Date().toISOString(),
      access_count: 1,
    },
    { onConflict: 'cache_key' },
  );
}

export async function getLiveDataCache<T>(cacheKey: string): Promise<T | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('search_cache')
    .select('results')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  return data?.results as T | null;
}

export async function setLiveDataCache(
  cacheKey: string,
  category: string,
  params: Record<string, unknown>,
  results: unknown,
): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) return;

  const expiresAt = new Date(Date.now() + LIVE_DATA_CACHE_TTL_SECONDS * 1000).toISOString();

  await supabase.from('search_cache').upsert(
    {
      cache_key: cacheKey,
      category,
      search_params: params,
      results,
      result_count: 1,
      providers_used: ['trip-snapshot'],
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'cache_key' },
  );
}

export function liveDataCacheKey(
  kind: 'flights' | 'hotels' | 'experiences',
  params: Record<string, string | number>,
): string {
  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('|');
  return `snapshot_${kind}:${sorted}`.slice(0, 250);
}
