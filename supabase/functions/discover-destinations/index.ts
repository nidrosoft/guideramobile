/**
 * DISCOVER DESTINATIONS EDGE FUNCTION (v3 — Multi-Model Fallback)
 *
 * Uses AI to generate rich destination data for catalog expansion.
 * 4-provider fallback chain: Gemini → Claude → OpenAI → xAI (Grok)
 * If one provider hits rate limits, automatically falls through to the next.
 *
 * Modes:
 *   - continent: Discover destinations for a specific continent
 *   - gaps:      Fill under-represented sections
 *   - batch:     Run discovery across all continents
 *
 * Pipeline:
 *   1. AI generates destination data (structured JSON) via fallback chain
 *   2. De-duplicate against existing catalog
 *   3. Insert as status='published' into curated_destinations
 *   4. Optionally trigger classify-destination for AI section tagging
 *
 * Environment Variables:
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - GOOGLE_AI_API_KEY  (Gemini — primary)
 *   - ANTHROPIC_API_KEY  (Claude — fallback 1)
 *   - OPENAI_API_KEY     (GPT — fallback 2)
 *   - XAI_API_KEY        (Grok — fallback 3)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─── AI Provider Keys ────────────────────────────────────────────
const GEMINI_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || '';
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const XAI_KEY = Deno.env.get('XAI_API_KEY') || '';

// ─── Types ───────────────────────────────────────────────────────

interface DiscoverRequest {
  mode: 'continent' | 'gaps' | 'batch';
  continent?: string;
  count?: number;
  classify?: boolean;
  dryRun?: boolean;
}

interface GeneratedDestination {
  title: string;
  slug: string;
  description: string;
  short_description: string;
  city: string;
  country: string;
  country_code: string;
  region: string;
  continent: string;
  latitude: number;
  longitude: number;
  timezone: string;
  hero_image_url: string;
  thumbnail_url: string;
  primary_category: string;
  secondary_categories: string[];
  tags: string[];
  budget_level: number;
  travel_style: string[];
  best_for: string[];
  seasons: string[];
  popularity_score: number;
  editor_rating: number;
  is_featured: boolean;
  is_trending: boolean;
  estimated_daily_budget_usd: number;
  estimated_hotel_price_usd: number;
  estimated_flight_price_usd: number;
  currency_code: string;
  language_spoken: string[];
  safety_rating: number;
}

// ─── Continent Discovery Targets ─────────────────────────────────

const CONTINENT_TARGETS: Record<string, { regions: string[]; targetCount: number }> = {
  'Europe': {
    regions: ['Western Europe', 'Eastern Europe', 'Southern Europe', 'Northern Europe', 'Central Europe', 'Balkans', 'Scandinavia', 'Mediterranean'],
    targetCount: 30,
  },
  'Asia': {
    regions: ['East Asia', 'Southeast Asia', 'South Asia', 'Central Asia', 'Middle East', 'West Asia'],
    targetCount: 30,
  },
  'Africa': {
    regions: ['North Africa', 'East Africa', 'West Africa', 'Southern Africa', 'Central Africa'],
    targetCount: 25,
  },
  'North America': {
    regions: ['United States', 'Canada', 'Mexico', 'Caribbean', 'Central America'],
    targetCount: 25,
  },
  'South America': {
    regions: ['Andean', 'Southern Cone', 'Brazil', 'Caribbean Coast', 'Amazon'],
    targetCount: 20,
  },
  'Oceania': {
    regions: ['Australia', 'New Zealand', 'Pacific Islands', 'Melanesia', 'Polynesia'],
    targetCount: 15,
  },
};

// ═════════════════════════════════════════════════════════════════
// MULTI-PROVIDER AI LAYER — Gemini → Claude → OpenAI → xAI (Grok)
// ═════════════════════════════════════════════════════════════════

type ProviderName = 'gemini' | 'claude' | 'openai' | 'xai';

interface ProviderResult {
  text: string;
  provider: ProviderName;
}

// Build the ordered list of available providers (skip those without keys)
function getAvailableProviders(): ProviderName[] {
  const providers: ProviderName[] = [];
  if (GEMINI_KEY) providers.push('gemini');
  if (ANTHROPIC_KEY) providers.push('claude');
  if (OPENAI_KEY) providers.push('openai');
  if (XAI_KEY) providers.push('xai');
  return providers;
}

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 16000,
          responseMimeType: 'application/json',
        },
      }),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini: empty response');
  return text;
}

async function callClaude(prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Claude: empty response');
  return text;
}

async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 16000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI: empty response');
  return text;
}

async function callXAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini-fast',
      max_tokens: 16000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`xAI ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('xAI: empty response');
  return text;
}

// The core fallback dispatcher — tries each provider in order
async function generateWithFallback(prompt: string): Promise<ProviderResult> {
  const providers = getAvailableProviders();
  if (providers.length === 0) throw new Error('No AI provider API keys configured');

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      let text: string;
      switch (provider) {
        case 'gemini': text = await callGemini(prompt); break;
        case 'claude': text = await callClaude(prompt); break;
        case 'openai': text = await callOpenAI(prompt); break;
        case 'xai': text = await callXAI(prompt); break;
      }
      console.log(`[discover] ${provider} succeeded`);
      return { text, provider };
    } catch (err: any) {
      const msg = err.message || String(err);
      console.warn(`[discover] ${provider} failed: ${msg.slice(0, 120)}`);
      errors.push(`${provider}: ${msg.slice(0, 100)}`);
      // Short cooldown before trying next provider
      await new Promise(r => setTimeout(r, 500));
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

// ─── JSON Parsing (robust) ───────────────────────────────────────

function parseDestinationJSON(raw: string): GeneratedDestination[] {
  // First try direct parse
  try {
    const parsed = JSON.parse(raw);
    // OpenAI json_object mode may wrap in { "destinations": [...] }
    if (Array.isArray(parsed)) return parsed;
    if (parsed.destinations && Array.isArray(parsed.destinations)) return parsed.destinations;
    if (parsed.results && Array.isArray(parsed.results)) return parsed.results;
    throw new Error('Parsed JSON is not an array');
  } catch { /* continue to cleanup */ }

  // Clean common issues
  let cleaned = raw
    .replace(/```json\s*/gi, '')  // markdown code fences
    .replace(/```\s*/g, '')
    .replace(/,\s*]/g, ']')      // trailing commas in arrays
    .replace(/,\s*}/g, '}')      // trailing commas in objects
    .replace(/[\x00-\x1f]/g, ' ') // control characters
    .trim();

  // Extract JSON array
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* continue */ }

    // Truncate at last complete object
    const lastBrace = match[0].lastIndexOf('}');
    if (lastBrace > 0) {
      try { return JSON.parse(match[0].slice(0, lastBrace + 1) + ']'); } catch { /* continue */ }
    }
  }

  // Try extracting from object wrapper
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const obj = JSON.parse(objMatch[0]);
      if (obj.destinations) return obj.destinations;
      if (obj.results) return obj.results;
    } catch { /* continue */ }
  }

  throw new Error('Failed to parse AI response as destination JSON');
}

// ─── Discovery Logic ─────────────────────────────────────────────

const MAX_PER_CALL = 8;

function buildPrompt(
  continent: string,
  regions: string[],
  existingCities: Set<string>,
  count: number
): string {
  const existingList = Array.from(existingCities).join(', ');

  return `You are a world-class travel data curator. Generate exactly ${count} unique travel destinations in ${continent} for a travel app's discovery catalog.

CRITICAL RULES:
1. Each destination MUST be a real, existing city or place that travelers actually visit
2. DO NOT include any of these already-existing destinations: ${existingList}
3. Spread destinations across these sub-regions: ${regions.join(', ')}
4. Include a MIX of: famous cities, hidden gems, beach towns, adventure hubs, cultural centers, luxury resorts, budget-friendly spots
5. Every field must be factually accurate (coordinates, country codes, timezones, currencies, languages)
6. slug format: lowercase-kebab-case, descriptive (e.g., "florence-renaissance-jewel", "chiang-mai-northern-rose")
7. hero_image_url and thumbnail_url: Use Unsplash source URLs in format: https://images.unsplash.com/photo-[ID]?w=800&h=600&fit=crop
8. budget_level: 1=budget, 2=moderate, 3=upscale, 4=luxury
9. safety_rating: 1-5 (5=safest)
10. popularity_score: 0-1000 (based on actual global tourism popularity)
11. editor_rating: 1.0-5.0 (quality of travel experience)
12. primary_category: one of "popular", "trending", "hidden-gem", "luxury", "adventure", "cultural", "beach", "family"
13. travel_style: array from ["relaxer", "explorer", "adventurer", "culture-seeker", "foodie", "luxury", "backpacker", "wellness", "photographer", "history-buff"]
14. best_for: array from ["solo", "couples", "friends", "family", "business", "honeymoon", "digital-nomads"]
15. seasons: array from ["spring", "summer", "fall", "winter"]
16. country_code: ISO 3166-1 alpha-2 (e.g., "FR", "JP", "US")
17. estimated_flight_price_usd: average roundtrip from US in USD
18. estimated_hotel_price_usd: average per night mid-range hotel
19. estimated_daily_budget_usd: food + transport + activities per day

Return ONLY a valid JSON array of objects. No markdown, no explanations, no wrapping object.

Each object schema:
{
  "title": "City Name - Evocative Tagline",
  "slug": "city-name-tagline",
  "description": "2-3 sentence rich description",
  "short_description": "One compelling sentence",
  "city": "City Name",
  "country": "Country Name",
  "country_code": "XX",
  "region": "Sub-Region",
  "continent": "${continent}",
  "latitude": 0.0000,
  "longitude": 0.0000,
  "timezone": "Continent/City",
  "hero_image_url": "https://images.unsplash.com/photo-XXXXX?w=800&h=600&fit=crop",
  "thumbnail_url": "https://images.unsplash.com/photo-XXXXX?w=400&h=300&fit=crop",
  "primary_category": "popular",
  "secondary_categories": ["cultural", "foodie"],
  "tags": ["tag1", "tag2", "tag3"],
  "budget_level": 2,
  "travel_style": ["explorer", "culture-seeker"],
  "best_for": ["couples", "friends"],
  "seasons": ["spring", "summer"],
  "popularity_score": 750,
  "editor_rating": 4.5,
  "is_featured": false,
  "is_trending": false,
  "estimated_daily_budget_usd": 80,
  "estimated_hotel_price_usd": 120,
  "estimated_flight_price_usd": 800,
  "currency_code": "EUR",
  "language_spoken": ["French", "English"],
  "safety_rating": 4
}`;
}

async function discoverForContinent(
  continent: string,
  existingCities: Set<string>,
  count: number
): Promise<{ destinations: GeneratedDestination[]; providers: string[] }> {
  const config = CONTINENT_TARGETS[continent];
  if (!config) throw new Error(`Unknown continent: ${continent}`);

  const allResults: GeneratedDestination[] = [];
  const providersUsed: Set<string> = new Set();
  let remaining = count;

  while (remaining > 0) {
    const batchSize = Math.min(remaining, MAX_PER_CALL);
    const prompt = buildPrompt(continent, config.regions, existingCities, batchSize);

    const { text, provider } = await generateWithFallback(prompt);
    providersUsed.add(provider);

    const destinations = parseDestinationJSON(text);

    // Filter duplicates
    const filtered = destinations.filter(d => {
      const key = `${d.city?.toLowerCase()}|${d.country?.toLowerCase()}`;
      if (!d.city || !d.country || existingCities.has(key)) return false;
      existingCities.add(key);
      return true;
    });

    allResults.push(...filtered);
    remaining -= filtered.length;

    if (filtered.length === 0) break;
    if (remaining > 0) await new Promise(r => setTimeout(r, 1000));
  }

  return { destinations: allResults, providers: Array.from(providersUsed) };
}

// ─── Insert Destinations ─────────────────────────────────────────

async function insertDestinations(
  destinations: GeneratedDestination[],
  providerUsed: string
): Promise<{
  inserted: number;
  skipped: number;
  errors: string[];
}> {
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const dest of destinations) {
    try {
      if (!dest.city || !dest.country || !dest.title || !dest.slug) {
        errors.push(`Missing required fields for: ${dest.title || 'unknown'}`);
        skipped++;
        continue;
      }

      // Dedup by slug
      const { data: existing } = await supabase
        .from('curated_destinations')
        .select('id')
        .eq('slug', dest.slug)
        .limit(1)
        .maybeSingle();
      if (existing) { skipped++; continue; }

      // Dedup by city+country
      const { data: existingCity } = await supabase
        .from('curated_destinations')
        .select('id')
        .ilike('city', dest.city)
        .ilike('country', dest.country)
        .limit(1)
        .maybeSingle();
      if (existingCity) { skipped++; continue; }

      const { error: insertErr } = await supabase
        .from('curated_destinations')
        .insert({
          title: dest.title,
          slug: dest.slug,
          description: dest.description,
          short_description: dest.short_description || null,
          city: dest.city,
          country: dest.country,
          country_code: (dest.country_code || 'XX').slice(0, 2),
          region: dest.region || dest.continent,
          continent: dest.continent,
          latitude: dest.latitude || 0,
          longitude: dest.longitude || 0,
          timezone: dest.timezone || null,
          hero_image_url: dest.hero_image_url || 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800&h=600&fit=crop',
          thumbnail_url: dest.thumbnail_url || 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=400&h=300&fit=crop',
          gallery_urls: [],
          primary_category: dest.primary_category || 'popular',
          secondary_categories: dest.secondary_categories || [],
          tags: dest.tags || [],
          budget_level: Math.max(1, Math.min(4, dest.budget_level || 2)),
          travel_style: dest.travel_style || [],
          best_for: dest.best_for || [],
          seasons: dest.seasons || [],
          priority: 50,
          popularity_score: Math.max(0, Math.min(1000, dest.popularity_score || 500)),
          editor_rating: Math.max(1, Math.min(5, dest.editor_rating || 3.5)),
          is_featured: dest.is_featured || false,
          is_trending: dest.is_trending || false,
          estimated_daily_budget_usd: dest.estimated_daily_budget_usd || null,
          estimated_hotel_price_usd: dest.estimated_hotel_price_usd || null,
          estimated_flight_price_usd: dest.estimated_flight_price_usd || null,
          currency_code: (dest.currency_code || 'USD').slice(0, 3),
          language_spoken: dest.language_spoken || [],
          safety_rating: Math.max(1, Math.min(5, dest.safety_rating || 3)),
          status: 'published',
          metadata: {
            source: 'ai_discovery',
            generated_by: providerUsed,
            discovered_at: new Date().toISOString(),
          },
        });

      if (insertErr) {
        errors.push(`Insert ${dest.city}: ${insertErr.message}`);
        skipped++;
      } else {
        inserted++;
      }
    } catch (err: any) {
      errors.push(`${dest.city}: ${err.message}`);
      skipped++;
    }
  }

  return { inserted, skipped, errors };
}

// ─── Main Handler ────────────────────────────────────────────────

serve(async (req: Request) => {
  const startTime = Date.now();

  try {
    const body: DiscoverRequest = await req.json().catch(() => ({
      mode: 'batch',
      count: 25,
      classify: true,
      dryRun: false,
    }));

    const mode = body.mode || 'batch';
    const countPerContinent = body.count || 25;
    const shouldClassify = body.classify !== false;
    const dryRun = body.dryRun === true;

    // Load existing destinations for dedup
    const { data: existingDests } = await supabase
      .from('curated_destinations')
      .select('city, country');

    const existingCities = new Set<string>(
      (existingDests || []).map((d: any) => `${d.city.toLowerCase()}|${d.country.toLowerCase()}`)
    );

    let allDiscovered: GeneratedDestination[] = [];
    const continentResults: Record<string, { discovered: number; providers: string[]; errors: string[] }> = {};
    const allProvidersUsed: Set<string> = new Set();

    if (mode === 'continent') {
      if (!body.continent) {
        return new Response(JSON.stringify({ success: false, error: 'continent is required for mode=continent' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await discoverForContinent(body.continent, existingCities, countPerContinent);
      allDiscovered = result.destinations;
      result.providers.forEach(p => allProvidersUsed.add(p));
      continentResults[body.continent] = { discovered: result.destinations.length, providers: result.providers, errors: [] };

    } else if (mode === 'batch') {
      for (const continent of Object.keys(CONTINENT_TARGETS)) {
        try {
          console.log(`[discover] Starting ${continent} (target: ${countPerContinent})...`);
          const result = await discoverForContinent(continent, existingCities, countPerContinent);
          result.providers.forEach(p => allProvidersUsed.add(p));

          allDiscovered.push(...result.destinations);
          continentResults[continent] = { discovered: result.destinations.length, providers: result.providers, errors: [] };

          await new Promise(r => setTimeout(r, 2000));
        } catch (err: any) {
          console.error(`[discover] ${continent} failed:`, err.message);
          continentResults[continent] = { discovered: 0, providers: [], errors: [err.message] };
        }
      }

    } else if (mode === 'gaps') {
      const { data: continentCounts } = await supabase
        .from('curated_destinations')
        .select('continent')
        .eq('status', 'published');

      const counts: Record<string, number> = {};
      for (const d of continentCounts || []) {
        counts[d.continent] = (counts[d.continent] || 0) + 1;
      }

      for (const [continent, config] of Object.entries(CONTINENT_TARGETS)) {
        const current = counts[continent] || 0;
        const needed = Math.max(0, config.targetCount - current);
        if (needed <= 0) continue;

        try {
          console.log(`[discover] Gap fill: ${continent} needs ${needed} more (has ${current}/${config.targetCount})`);
          const result = await discoverForContinent(continent, existingCities, Math.min(needed, countPerContinent));
          result.providers.forEach(p => allProvidersUsed.add(p));

          allDiscovered.push(...result.destinations);
          continentResults[continent] = { discovered: result.destinations.length, providers: result.providers, errors: [] };
          await new Promise(r => setTimeout(r, 2000));
        } catch (err: any) {
          continentResults[continent] = { discovered: 0, providers: [], errors: [err.message] };
        }
      }
    }

    // Insert into DB
    const providerLabel = Array.from(allProvidersUsed).join('+') || 'none';
    let insertResult = { inserted: 0, skipped: 0, errors: [] as string[] };
    if (!dryRun && allDiscovered.length > 0) {
      insertResult = await insertDestinations(allDiscovered, providerLabel);
    }

    // Trigger classification for new destinations
    let classifyResult: any = null;
    if (!dryRun && shouldClassify && insertResult.inserted > 0) {
      try {
        const { data, error } = await supabase.functions.invoke('classify-destination', {
          body: { mode: 'batch', force: false },
        });
        classifyResult = error ? { error: error.message } : data;
      } catch (err: any) {
        classifyResult = { error: err.message };
      }
    }

    // Trigger section cache refresh
    let refreshResult: any = null;
    if (!dryRun && insertResult.inserted > 0) {
      try {
        const { data, error } = await supabase.functions.invoke('section-refresh', {
          body: { section_slug: 'all' },
        });
        refreshResult = error ? { error: error.message } : data;
      } catch (err: any) {
        refreshResult = { error: err.message };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mode,
      dryRun,
      providersUsed: Array.from(allProvidersUsed),
      totalDiscovered: allDiscovered.length,
      totalInserted: insertResult.inserted,
      totalSkipped: insertResult.skipped,
      continentResults,
      insertErrors: insertResult.errors.length > 0 ? insertResult.errors : undefined,
      classifyResult,
      refreshResult,
      durationMs: Date.now() - startTime,
      ...(dryRun ? { preview: allDiscovered.slice(0, 5) } : {}),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Discover destinations error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      durationMs: Date.now() - startTime,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
