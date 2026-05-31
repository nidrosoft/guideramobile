/**
 * EVENT DISCOVERY EDGE FUNCTION
 *
 * Uses Google Gemini 2.0 Flash with Google Search grounding to discover
 * real events happening in any city worldwide. Results are cached in
 * the destination_events table with a 14-day TTL.
 *
 * Actions:
 *   - discover: Fetch events for a city (checks cache first)
 *   - get:      Return cached events for a city
 *   - refresh:  Force re-fetch events (ignores cache)
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai@1.0.0';
import { getUserIdFromRequest } from '../_shared/auth.ts';
import { consumeEdgeRateLimit, edgeRateLimitResponse } from '../_shared/edgeScale/rateLimit.ts';
import { releaseEdgeLock, tryAcquireEdgeLock } from '../_shared/edgeScale/locks.ts';
import { deferEdgeWork, recordEdgeMetric } from '../_shared/edgeScale/metrics.ts';
import {
  buildEventDiscoveryKey,
  buildEventRateLimitConfigs,
  EVENT_DISCOVERY_COALESCE_POLL_MS,
  EVENT_DISCOVERY_COALESCE_WAIT_MS,
  EVENT_DISCOVERY_LOCK_TTL_SECONDS,
  EVENT_DISCOVERY_NAMESPACE,
  resolveEventRequesterKey,
} from '../_shared/events/eventDiscoveryScale.ts';

// ─── Configuration ───────────────────────────────────────────────
const CACHE_TTL_DAYS = 14;
const MAX_EVENTS_PER_FETCH = 15;
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-3-flash-preview'];
const IMAGEN_MODEL = 'imagen-4.0-fast-generate-001';
const IMAGE_BATCH_SIZE = 5;

const EVENT_CATEGORIES = [
  'Music & Concerts',
  'Festivals & Carnivals',
  'Food & Drink',
  'Art & Culture',
  'Sports & Marathons',
  'Conferences & Expos',
  'Markets & Fairs',
  'Nightlife & Entertainment',
  'Outdoor & Adventure',
  'Religious & Spiritual',
  'Theater & Performing Arts',
  'Family & Kids',
  'Community & Local',
  'Parades & Celebrations',
];

// ─── Broken URL blacklist ────────────────────────────────────────
const BROKEN_URL_PATTERNS = [
  'lookaside.instagram.com',
  'lookaside.fbsbx.com',
  'lookaside.',
  'cdn.ticketmaster.com',
  'fbcdn.net',
  'scontent.',
  'instagram.com/p/',
  'graph.facebook.com',
  'fbsbx.com',
  'eventsget.sgp1.cdn',
  'tiktok.com',
  'tiktokcdn',
  'p16-common-sign',
];
function isUrlBroken(url: string): boolean {
  return BROKEN_URL_PATTERNS.some((p) => url.includes(p));
}

// ─── SerpAPI Google Images Search ────────────────────────────────
const SERPAPI_BASE = 'https://serpapi.com/search.json';

/**
 * Search for a real image of an event using SerpAPI Google Images.
 * Returns the best image URL or null if none found.
 */
async function searchEventImage(
  eventName: string,
  city: string,
  category: string,
  serpApiKey: string
): Promise<string | null> {
  try {
    const query = `${eventName} ${city} event ${category}`;
    const params = new URLSearchParams({
      engine: 'google_images',
      q: query,
      num: '5',
      safe: 'active',
      api_key: serpApiKey,
    });

    const resp = await fetch(`${SERPAPI_BASE}?${params}`);
    if (!resp.ok) {
      console.warn(`[SerpAPI Images] HTTP ${resp.status} for "${eventName}"`);
      return null;
    }

    const data = await resp.json();
    const results = data.images_results || [];

    // Filter for quality images: decent resolution, not tiny icons
    for (const img of results) {
      if (
        img.original &&
        img.original_width >= 400 &&
        img.original_height >= 300 &&
        !img.original.includes('unsplash.com') &&
        !img.original.includes('placeholder') &&
        !img.original.includes('no-image') &&
        !isUrlBroken(img.original)
      ) {
        return img.original;
      }
    }

    // Fallback to thumbnail if no large original found
    for (const img of results) {
      if (img.thumbnail && img.thumbnail.startsWith('http')) {
        return img.thumbnail;
      }
    }

    return null;
  } catch (err) {
    console.error(`[SerpAPI Images] Error for "${eventName}":`, (err as Error).message);
    return null;
  }
}

// ─── Google Places Text Search (fallback) ─────────────────────────
async function searchGooglePlacesImage(
  eventName: string,
  city: string,
  googleApiKey: string
): Promise<string | null> {
  try {
    const query = `${eventName} ${city}`;
    const resp = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': 'places.photos',
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 3 }),
    });
    if (!resp.ok) return null;

    const data = await resp.json();
    for (const place of data.places || []) {
      const photos = place.photos || [];
      if (photos.length > 0) {
        return `https://places.googleapis.com/v1/${photos[0].name}/media?key=${googleApiKey}&maxWidthPx=800`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ─── SerpAPI Google Web Search (secondary fallback) ───────────────
async function searchGoogleWebImage(
  eventName: string,
  city: string,
  serpApiKey: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      engine: 'google',
      q: `${eventName} ${city} event photo`,
      num: '5',
      api_key: serpApiKey,
    });
    const resp = await fetch(`${SERPAPI_BASE}?${params}`);
    if (!resp.ok) return null;

    const data = await resp.json();
    for (const img of data.inline_images || []) {
      if (img.original && !img.original.includes('unsplash.com') && !isUrlBroken(img.original))
        return img.original;
      if (img.thumbnail?.startsWith('http') && !isUrlBroken(img.thumbnail)) return img.thumbnail;
    }
    const kgHeader = data.knowledge_graph?.header_images?.[0]?.image;
    if (kgHeader && !isUrlBroken(kgHeader)) return kgHeader;
    const kgImage = data.knowledge_graph?.image;
    if (kgImage && !isUrlBroken(kgImage)) return kgImage;
    return null;
  } catch {
    return null;
  }
}

/**
 * Search images for a batch of events using multi-API fallback chain:
 * SerpAPI Images → Google Places → SerpAPI Web Search.
 * Returns a Map of event index → image URL.
 */
async function searchImagesForEvents(
  events: any[],
  city: string,
  serpApiKey: string
): Promise<Map<number, string>> {
  const imageMap = new Map<number, string>();
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY') || '';
  console.log(`[ImageSearch] Searching images for ${events.length} events in ${city}...`);

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    // Skip if event already has a valid non-Unsplash image URL
    if (event.image_url && !event.image_url.includes('unsplash.com')) {
      imageMap.set(i, event.image_url);
      continue;
    }

    // 1. SerpAPI Google Images (best quality)
    let imageUrl = await searchEventImage(event.event_name, city, event.category, serpApiKey);

    // 2. Google Places Text Search
    if (!imageUrl && googleApiKey) {
      imageUrl = await searchGooglePlacesImage(event.event_name, city, googleApiKey);
    }

    // 3. SerpAPI Google Web Search (inline images / knowledge graph)
    if (!imageUrl) {
      imageUrl = await searchGoogleWebImage(event.event_name, city, serpApiKey);
    }

    if (imageUrl && !isUrlBroken(imageUrl)) {
      imageMap.set(i, imageUrl);
    }

    // Small delay between requests (200ms) to respect rate limits
    if (i < events.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log(`[ImageSearch] Found images for ${imageMap.size}/${events.length} events`);
  return imageMap;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-guidera-client-id',
};

// ─── Main Handler ────────────────────────────────────────────────
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let supabase: ReturnType<typeof createClient> | null = null;
  let activeLock: { key: string; ownerId: string } | null = null;

  const recordMetric = (
    cacheStatus: 'hit' | 'miss' | 'coalesced' | 'rate_limited' | 'error' | 'skipped',
    statusCode: number,
    phase = 'event-discovery',
    providerSummary: Record<string, unknown> = {},
    errorMessage: string | null = null
  ) => {
    if (!supabase) return;
    deferEdgeWork(
      recordEdgeMetric(supabase, {
        namespace: EVENT_DISCOVERY_NAMESPACE,
        phase,
        cacheStatus,
        statusCode,
        durationMs: Date.now() - startTime,
        providerSummary,
        errorMessage,
      })
    );
  };

  const releaseActiveLock = async (status: 'completed' | 'failed') => {
    if (!supabase || !activeLock) return;
    await releaseEdgeLock(
      supabase,
      EVENT_DISCOVERY_NAMESPACE,
      activeLock.key,
      activeLock.ownerId,
      status
    );
    activeLock = null;
  };

  try {
    console.log('[event-discovery] Request received');
    const body = await req.json().catch(() => ({}));
    const { action = 'discover', city, country, category, month, forceRefresh, metro_area } = body;
    console.log(
      `[event-discovery] action=${action} city=${city} country=${country} metro_area=${metro_area}`
    );

    // Use metro_area for broader coverage (e.g., La Mesa -> San Diego)
    const searchCity = metro_area || city;

    if (!city || !country) {
      return jsonResponse({ success: false, error: 'city and country are required' }, 400);
    }

    supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const userId = await getUserIdFromRequest(
      req,
      body,
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_PUBLIC_KEY') || ''
    ).catch(() => null);
    const requesterKey = resolveEventRequesterKey(req.headers, userId);

    // Determine target month(s)
    const now = new Date();
    const targetMonth = month || now.toLocaleString('en-US', { month: 'long' });
    const targetYear = now.getFullYear();
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonth = nextMonthDate.toLocaleString('en-US', { month: 'long' });

    // ─── ACTION: get (cache only) ────────────────────────────────
    if (action === 'get') {
      const events = await getCachedEvents(supabase, city, country, category);
      recordMetric(events.length > 0 ? 'hit' : 'miss', 200, 'event-discovery-get', {
        events: events.length,
      });
      return jsonResponse({ success: true, events, cached: true, city, country });
    }

    // ─── ACTION: discover / refresh ──────────────────────────────
    const shouldRefresh = action === 'refresh' || forceRefresh === true;

    // Check cache first (unless forcing refresh)
    if (!shouldRefresh) {
      const cached = await getCachedEvents(supabase, city, country, category);
      if (cached.length > 0) {
        recordMetric('hit', 200, 'event-discovery-cache', { events: cached.length });
        return jsonResponse({ success: true, events: cached, cached: true, city, country });
      }
    }

    const discoveryKey = buildEventDiscoveryKey({
      city: searchCity,
      country,
      category,
      month: targetMonth,
    });
    const lock = await tryAcquireEdgeLock(
      supabase,
      EVENT_DISCOVERY_NAMESPACE,
      discoveryKey,
      EVENT_DISCOVERY_LOCK_TTL_SECONDS
    );

    if (!lock.acquired) {
      const coalescedEvents = await waitForCachedEvents(
        supabase,
        city,
        country,
        category,
        EVENT_DISCOVERY_COALESCE_WAIT_MS,
        EVENT_DISCOVERY_COALESCE_POLL_MS
      );
      if (coalescedEvents.length > 0) {
        recordMetric('coalesced', 200, 'event-discovery-coalesce', {
          events: coalescedEvents.length,
        });
        return jsonResponse({
          success: true,
          events: coalescedEvents,
          cached: true,
          coalesced: true,
          city,
          country,
        });
      }

      recordMetric('coalesced', 202, 'event-discovery-coalesce', { events: 0 });
      return jsonResponse(
        {
          success: false,
          events: [],
          cached: false,
          coalesced: true,
          retryAfterSeconds: 2,
          city,
          country,
        },
        202
      );
    }

    activeLock = { key: discoveryKey, ownerId: lock.ownerId };

    for (const limitConfig of buildEventRateLimitConfigs({
      city: searchCity,
      country,
      category,
      month: targetMonth,
      userId,
      requesterKey,
    })) {
      const limit = await consumeEdgeRateLimit(supabase, limitConfig);
      if (!limit.allowed) {
        await releaseActiveLock('failed');
        recordMetric('rate_limited', 429, 'event-discovery-rate-limit', {
          blockedKey: limit.blockedKey,
        });
        return edgeRateLimitResponse(limit, corsHeaders);
      }
    }

    // Fetch fresh events via Gemini
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      await releaseActiveLock('failed');
      recordMetric('error', 500, 'event-discovery-config', {}, 'GOOGLE_AI_API_KEY not configured');
      return jsonResponse({ success: false, error: 'GOOGLE_AI_API_KEY not configured' }, 500);
    }

    console.log(`[event-discovery] No cache for ${searchCity}, calling Gemini...`);
    const events = await discoverEvents(
      apiKey,
      searchCity,
      country,
      targetMonth,
      nextMonth,
      targetYear,
      category
    );
    console.log(`[event-discovery] Gemini returned ${events.length} events`);

    // ── Image acquisition: SerpAPI Google Images (primary) → Imagen AI (secondary) ──
    let imageMap = new Map<number, string>();
    const serpApiKey = Deno.env.get('SERPAPI_KEY');

    if (events.length > 0 && serpApiKey) {
      try {
        imageMap = await searchImagesForEvents(events, searchCity, serpApiKey);
      } catch (serpErr) {
        console.error('SerpAPI image search failed (non-fatal):', (serpErr as Error).message);
      }

      // For events where SerpAPI found nothing, try Imagen AI (only for small batches)
      const missingIdxs = events
        .map((_: any, i: number) => i)
        .filter((i: number) => !imageMap.has(i));
      if (missingIdxs.length > 0 && missingIdxs.length <= 5) {
        console.log(
          `[event-discovery] Trying Imagen for ${missingIdxs.length} events without images...`
        );
        try {
          const missingEvents = missingIdxs.map((i: number) => events[i]);
          const imagenMap = await generateImagesForEvents(
            apiKey,
            supabase,
            missingEvents,
            searchCity
          );
          // Map Imagen results back to original indices
          let batchIdx = 0;
          for (const origIdx of missingIdxs) {
            const url = imagenMap.get(batchIdx);
            if (url) imageMap.set(origIdx, url);
            batchIdx++;
          }
        } catch (imgErr) {
          console.error('Imagen fallback failed (non-fatal):', (imgErr as Error).message);
        }
      }
    } else if (events.length > 0 && !serpApiKey) {
      console.warn('[event-discovery] SERPAPI_KEY not configured — no image search available');
    }

    if (events.length > 0) {
      // Clear old events for this city if refreshing
      if (shouldRefresh) {
        await supabase
          .from('destination_events')
          .delete()
          .ilike('city', city)
          .ilike('country', country);
      }

      // Insert new events with resolved images
      const rows = events.map((e: any, idx: number) => ({
        city: searchCity,
        country: country,
        event_name: e.event_name,
        category: e.category,
        description: e.description || null,
        venue: e.venue || null,
        date_start: e.date_start || null,
        date_end: e.date_end || null,
        time_info: e.time_info || null,
        ticket_price: e.ticket_price || null,
        ticket_url: e.ticket_url || null,
        image_url: imageMap.get(idx) || null,
        source_url: e.source_url || null,
        is_free: e.is_free || false,
        is_recurring: e.is_recurring || false,
        recurrence_info: e.recurrence_info || null,
        estimated_attendees: e.estimated_attendees || null,
        highlights: Array.isArray(e.highlights) ? e.highlights : [],
        tags: e.tags || [],
        fetched_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { data: insertedRows, error: insertErr } = await supabase
        .from('destination_events')
        .insert(rows)
        .select();

      if (insertErr) {
        console.error('Insert error:', insertErr);
      }

      // If insert returned rows with IDs, use those as the response
      if (insertedRows && insertedRows.length > 0) {
        const finalEvents = category
          ? insertedRows.filter((e: any) => e.category === category)
          : insertedRows;

        await releaseActiveLock('completed');
        recordMetric('miss', 200, 'event-discovery-generate', {
          events: finalEvents.length,
          generated: insertedRows.length,
          serpImages: imageMap.size,
        });
        return jsonResponse({
          success: true,
          events: finalEvents,
          cached: false,
          eventsDiscovered: insertedRows.length,
          city,
          country,
        });
      }
    }

    // Fallback: re-read from cache to ensure events have DB-generated IDs
    const freshFromDB = await getCachedEvents(supabase, city, country, category);
    if (freshFromDB.length > 0) {
      await releaseActiveLock('completed');
      recordMetric('miss', 200, 'event-discovery-generate', {
        events: freshFromDB.length,
        serpImages: imageMap.size,
      });
      return jsonResponse({
        success: true,
        events: freshFromDB,
        cached: false,
        eventsDiscovered: freshFromDB.length,
        city,
        country,
      });
    }

    // Last resort: return Gemini events (may lack IDs)
    for (let idx = 0; idx < events.length; idx++) {
      events[idx].image_url = imageMap.get(idx) || events[idx].image_url || null;
    }

    const finalEvents = category ? events.filter((e: any) => e.category === category) : events;

    await releaseActiveLock('completed');
    recordMetric('miss', 200, 'event-discovery-generate', {
      events: finalEvents.length,
      generated: events.length,
      serpImages: imageMap.size,
      persisted: false,
    });
    return jsonResponse({
      success: true,
      events: finalEvents,
      cached: false,
      eventsDiscovered: events.length,
      city,
      country,
    });
  } catch (error) {
    const errMsg = (error as Error).message || String(error);
    console.error('[event-discovery] Error:', errMsg);
    await releaseActiveLock('failed');

    // Detect quota/rate limit errors and return 429 with retry info
    if (
      errMsg.includes('429') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('quota')
    ) {
      recordMetric('error', 429, 'event-discovery-error', {}, errMsg);
      return jsonResponse(
        {
          success: false,
          error: 'AI quota temporarily exceeded. Events will be available shortly.',
          retryAfterSeconds: 60,
          quotaError: true,
        },
        429
      );
    }

    recordMetric('error', 500, 'event-discovery-error', {}, errMsg);
    return jsonResponse({ success: false, error: errMsg }, 500);
  }
});

// ─── Gemini Event Discovery ─────────────────────────────────────
async function discoverEvents(
  apiKey: string,
  city: string,
  country: string,
  currentMonth: string,
  nextMonth: string,
  year: number,
  category?: string
): Promise<any[]> {
  const ai = new GoogleGenAI({ apiKey });

  const categoryFilter = category
    ? `Focus specifically on "${category}" events.`
    : `Cover a variety of categories: ${EVENT_CATEGORIES.join(', ')}.`;

  const prompt = `Find real, upcoming events happening in and around ${city}, ${country} (within approximately 30 miles / 50 km radius) during ${currentMonth} and ${nextMonth} ${year}.

${categoryFilter}

Search for events from sources like local tourism boards, Facebook events, Eventbrite, Meetup, local news, city government event calendars, and any other reliable sources.

Include a wide range: major festivals, local community events, food markets, concerts, sports events, marathons, art exhibitions, theater shows, cultural celebrations, religious observances, outdoor activities, conferences, and family-friendly events.

For each event, provide the following information as accurately as possible:
- event_name: Official event name
- category: One of [${EVENT_CATEGORIES.join(', ')}]
- description: A rich, detailed 3-5 sentence description. Describe what the event is about, what attendees can expect, highlights or featured performers/speakers, what makes it special, and any notable history of the event. Make the description engaging and informative enough for someone deciding whether to attend.
- venue: Full venue or location name including neighborhood/area
- date_start: Start date in YYYY-MM-DD format (use best estimate if exact date unknown)
- date_end: End date in YYYY-MM-DD format (null if single-day)
- time_info: Time information (e.g., "7:00 PM - 11:00 PM" or "All Day")
- ticket_price: Price info (e.g., "$25-50", "Free", "$15 advance / $20 door")
- ticket_url: URL to buy tickets or get more info (if available)
- image_url: null (we will add images separately)
- source_url: URL where you found this event
- is_free: true/false
- is_recurring: true/false (e.g., weekly farmers market)
- recurrence_info: If recurring, describe pattern (e.g., "Every Saturday")
- estimated_attendees: Realistic estimate based on venue capacity and event type. Be conservative and accurate — a local bar show might be "100-200", a mid-size festival "2k-5k", only massive stadiums/marathons reach "20k+". Do NOT inflate numbers. Use ranges like "200-500" or "1k-3k".
- highlights: Array of 3-5 key highlights or things to look forward to at this event (e.g., ["Live performances by 20+ local bands", "Craft beer from 50+ breweries", "Family-friendly activities"])
- tags: Array of 3-5 relevant tags (e.g., ["outdoor", "family-friendly", "food", "live-music"])

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON array of event objects. No markdown, no explanation.
- All string values must use double quotes and properly escape any internal double quotes with backslash.
- Do NOT use curly/smart quotes. Only use straight double quotes for JSON.
- Avoid using double quotes inside description or highlights text; use single quotes instead.
- Ensure all URLs are properly escaped.
- Do not include trailing commas.
Find at least 10-${MAX_EVENTS_PER_FETCH} events if possible.`;

  // Try each model in the fallback chain
  let lastError: Error | null = null;
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[event-discovery] Trying model ${model} for ${city}, ${country}`);
      let response: any;
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.3,
          },
        });
        console.log(`[event-discovery] ${model} with search succeeded`);
      } catch (err) {
        const errMsg = (err as Error).message || '';
        // If quota/rate limit, try next model immediately
        if (
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('quota')
        ) {
          console.warn(`[event-discovery] ${model} quota exhausted, trying next model...`);
          lastError = err as Error;
          continue;
        }
        // For other errors (e.g. search grounding not supported), retry without search
        console.warn(`[event-discovery] ${model} with search failed, trying without: ${errMsg}`);
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        });
        console.log(`[event-discovery] ${model} without search succeeded`);
      }

      const text = response.text || '';

      // Extract JSON array from response
      let jsonStr = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      // Try to extract just the JSON array if there's extra text
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }

      // Sanitize the JSON string to handle common Gemini issues:
      // 1. Fix unescaped control characters inside string values
      // 2. Fix smart quotes and special chars
      jsonStr = jsonStr
        .replace(/\u201C|\u201D/g, '"') // smart double quotes
        .replace(/\u2018|\u2019/g, "'") // smart single quotes
        .replace(/\u2013/g, '-') // en dash
        .replace(/\u2014/g, '--') // em dash
        .replace(/\u2026/g, '...'); // ellipsis

      // Remove control characters but preserve structural whitespace
      // We need to be careful: only strip control chars inside string values
      jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

      // Flatten whitespace and remove trailing commas upfront
      jsonStr = jsonStr.replace(/[\n\r\t]/g, ' ');
      jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

      // Attempt to parse the full JSON
      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.warn(
          'Full JSON parse failed, trying per-object extraction:',
          (parseErr as Error).message
        );

        // Fallback: extract individual event objects using balanced braces
        const eventObjects: any[] = [];
        let depth = 0;
        let objStart = -1;

        for (let i = 0; i < jsonStr.length; i++) {
          const ch = jsonStr[i];
          // Skip characters inside strings
          if (ch === '"') {
            // Find the closing quote (handle escaped quotes)
            i++;
            while (i < jsonStr.length && !(jsonStr[i] === '"' && jsonStr[i - 1] !== '\\')) i++;
            continue;
          }
          if (ch === '{') {
            if (depth === 0) objStart = i;
            depth++;
          } else if (ch === '}') {
            depth--;
            if (depth === 0 && objStart >= 0) {
              const objStr = jsonStr.slice(objStart, i + 1);
              try {
                const obj = JSON.parse(objStr);
                if (obj.event_name) eventObjects.push(obj);
              } catch {
                // Skip malformed individual objects
                console.warn('Skipped malformed event object at position', objStart);
              }
              objStart = -1;
            }
          }
        }

        if (eventObjects.length > 0) {
          parsed = eventObjects;
        } else {
          throw new Error('Could not parse any events from Gemini response');
        }
      }
      const events = Array.isArray(parsed) ? parsed : parsed.events || [];

      // Validate and normalize each event
      return events
        .filter((e: any) => e.event_name && e.category)
        .slice(0, MAX_EVENTS_PER_FETCH)
        .map((e: any) => {
          // Normalize "null" strings to actual null
          const imageUrl =
            e.image_url && e.image_url !== 'null' && e.image_url !== 'undefined'
              ? e.image_url
              : null;
          const dateEnd = e.date_end && e.date_end !== 'null' ? e.date_end : null;
          return {
            ...e,
            category: normalizeCategory(e.category),
            is_free: e.is_free === true || e.ticket_price?.toLowerCase() === 'free',
            tags: Array.isArray(e.tags) ? e.tags : [],
            image_url: imageUrl,
            date_end: dateEnd,
          };
        });
    } catch (outerErr) {
      const errMsg = (outerErr as Error).message || '';
      if (
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('quota')
      ) {
        console.warn(`[event-discovery] ${model} quota exhausted (outer), trying next model...`);
        lastError = outerErr as Error;
        continue;
      }
      // Non-quota error — throw immediately
      throw outerErr;
    }
  }

  // All models exhausted
  throw lastError || new Error('All Gemini models failed — quota exhausted');
}

// ─── Cache Helpers ───────────────────────────────────────────────
async function getCachedEvents(
  supabase: any,
  city: string,
  country: string,
  category?: string
): Promise<any[]> {
  const todayStr = new Date().toISOString().split('T')[0];
  let query = supabase
    .from('destination_events')
    .select('*')
    .ilike('city', city)
    .ilike('country', country)
    .gt('expires_at', new Date().toISOString())
    .or(
      `date_start.is.null,date_start.gte.${todayStr},date_end.gte.${todayStr},is_recurring.eq.true`
    )
    .order('date_start', { ascending: true, nullsFirst: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Cache fetch error:', error);
    return [];
  }

  return data || [];
}

// ─── Utilities ───────────────────────────────────────────────────
function normalizeCategory(cat: string): string {
  // Find the closest matching category
  const lower = cat.toLowerCase();
  for (const valid of EVENT_CATEGORIES) {
    if (valid.toLowerCase() === lower || lower.includes(valid.toLowerCase().split(' ')[0])) {
      return valid;
    }
  }
  // Fallback mappings
  if (lower.includes('music') || lower.includes('concert')) return 'Music & Concerts';
  if (lower.includes('festival') || lower.includes('carnival')) return 'Festivals & Carnivals';
  if (lower.includes('food') || lower.includes('drink') || lower.includes('culinary'))
    return 'Food & Drink';
  if (lower.includes('art') || lower.includes('culture') || lower.includes('museum'))
    return 'Art & Culture';
  if (lower.includes('sport') || lower.includes('marathon') || lower.includes('run'))
    return 'Sports & Marathons';
  if (lower.includes('conference') || lower.includes('expo') || lower.includes('tech'))
    return 'Conferences & Expos';
  if (lower.includes('market') || lower.includes('fair') || lower.includes('bazaar'))
    return 'Markets & Fairs';
  if (lower.includes('night') || lower.includes('club') || lower.includes('party'))
    return 'Nightlife & Entertainment';
  if (lower.includes('outdoor') || lower.includes('hike') || lower.includes('adventure'))
    return 'Outdoor & Adventure';
  if (lower.includes('relig') || lower.includes('spiritual') || lower.includes('church'))
    return 'Religious & Spiritual';
  if (lower.includes('theater') || lower.includes('theatre') || lower.includes('perform'))
    return 'Theater & Performing Arts';
  if (lower.includes('family') || lower.includes('kids') || lower.includes('children'))
    return 'Family & Kids';
  if (lower.includes('parade') || lower.includes('celebration')) return 'Parades & Celebrations';
  return 'Community & Local';
}

// ─── AI Image Generation (Imagen 4 Fast) ────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function buildImagePrompt(event: any, city: string): string {
  const categoryStyles: Record<string, string> = {
    'Music & Concerts': 'live music performance, concert stage with colorful lights, excited crowd',
    'Festivals & Carnivals': 'vibrant outdoor festival, decorations, crowd celebrating',
    'Food & Drink':
      'artisanal food market stalls, gourmet street food, people tasting food outdoors',
    'Art & Culture': 'art exhibition space, cultural installations, gallery atmosphere',
    'Sports & Marathons': 'dynamic sports event, athletic competition, stadium with cheering fans',
    'Conferences & Expos': 'modern conference venue, exhibition hall, professional networking',
    'Markets & Fairs': 'bustling outdoor artisan market, colorful vendor stalls, handmade goods',
    'Nightlife & Entertainment': 'vibrant nightlife scene, entertainment venue, dynamic lighting',
    'Outdoor & Adventure': 'scenic outdoor adventure setting, nature, active participants',
    'Religious & Spiritual': 'peaceful spiritual gathering, ceremonial atmosphere, sacred space',
    'Theater & Performing Arts': 'theater stage, dramatic performance, elegant venue',
    'Family & Kids': 'family-friendly outdoor event, children playing, colorful activities',
    'Community & Local': 'community gathering in a park, local neighborhood celebration',
    'Parades & Celebrations': 'festive street parade, marching participants, colorful floats',
  };

  const style = categoryStyles[event.category] || 'community event, people gathering outdoors';
  const venue = event.venue ? `at ${event.venue}` : '';

  return `A vibrant, photorealistic wide-angle photograph of the event "${event.event_name}" ${venue} in ${city}. The scene shows ${style}. Professional travel magazine photography, natural warm lighting, high quality, no text overlays, no watermarks, no logos.`;
}

async function generateSingleImage(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`Imagen API ${res.status}:`, errBody.slice(0, 500));
      return null;
    }

    const data = await res.json();
    const base64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64) {
      console.warn('No image data in Imagen response:', JSON.stringify(data).slice(0, 300));
      return null;
    }
    return base64;
  } catch (err) {
    console.error('Imagen fetch error:', (err as Error).message);
    return null;
  }
}

async function uploadImageToStorage(
  supabase: any,
  base64: string,
  city: string,
  eventSlug: string
): Promise<string | null> {
  try {
    const raw = atob(base64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

    const filePath = `${slugify(city)}/${eventSlug}-${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('event-images')
      .upload(filePath, bytes, { contentType: 'image/jpeg', upsert: true });

    if (error) {
      console.error('Storage upload error:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Upload error:', (err as Error).message);
    return null;
  }
}

async function generateImagesForEvents(
  apiKey: string,
  supabase: any,
  events: any[],
  city: string
): Promise<Map<number, string>> {
  const imageMap = new Map<number, string>();
  console.log(
    `Generating AI images for ${events.length} events in batches of ${IMAGE_BATCH_SIZE}...`
  );

  for (let i = 0; i < events.length; i += IMAGE_BATCH_SIZE) {
    const batch = events.slice(i, i + IMAGE_BATCH_SIZE);
    const batchStart = Date.now();

    const results = await Promise.allSettled(
      batch.map(async (event: any, batchIdx: number) => {
        const idx = i + batchIdx;
        const prompt = buildImagePrompt(event, city);
        const base64 = await generateSingleImage(apiKey, prompt);
        if (!base64) return;

        const slug = slugify(event.event_name);
        const publicUrl = await uploadImageToStorage(supabase, base64, city, slug);
        if (publicUrl) {
          imageMap.set(idx, publicUrl);
        }
      })
    );

    const batchTime = Date.now() - batchStart;
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    console.log(
      `Batch ${Math.floor(i / IMAGE_BATCH_SIZE) + 1}: ${succeeded}/${batch.length} images in ${batchTime}ms`
    );
  }

  console.log(`Image generation complete: ${imageMap.size}/${events.length} images generated`);
  return imageMap;
}

async function waitForCachedEvents(
  supabase: ReturnType<typeof createClient>,
  city: string,
  country: string,
  category: string | undefined,
  maxWaitMs: number,
  pollMs: number
): Promise<any[]> {
  const deadline = Date.now() + Math.max(0, maxWaitMs);

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, Math.max(100, pollMs)));
    const cached = await getCachedEvents(supabase, city, country, category);
    if (cached.length > 0) {
      return cached;
    }
  }

  return [];
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
