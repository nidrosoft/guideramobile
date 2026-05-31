import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireCronOrServiceAuth } from '../_shared/cronAuth.ts';

/**
 * REPAIR EVENT IMAGES
 *
 * Finds and replaces missing/broken images on destination_events with real images.
 * Uses a multi-API fallback chain: SerpAPI → Google Places → Google Custom Search.
 *
 * Modes:
 *   - "unsplash" (default): Replace Unsplash URLs
 *   - "null": Fix events with NULL/empty image_url
 *   - "single": Fix a single event by ID (pass eventId)
 *
 * Body params:
 *   - mode: "unsplash" | "null" | "single" (default "null")
 *   - batchSize: number (default 15)
 *   - dryRun: boolean (default false)
 *   - eventId: string (for mode "single")
 */

const SERPAPI_BASE = 'https://serpapi.com/search.json';

// URLs from these domains are known to block external access / expire quickly
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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY') || '';
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-cron-secret, apikey, content-type',
};

// ─── API 1: SerpAPI Google Images ─────────────────────────────────
async function searchSerpAPI(
  eventName: string,
  city: string,
  category: string
): Promise<string | null> {
  if (!SERPAPI_KEY) return null;
  try {
    const query = `${eventName} ${city} event ${category}`;
    const params = new URLSearchParams({
      engine: 'google_images',
      q: query,
      num: '5',
      safe: 'active',
      api_key: SERPAPI_KEY,
    });

    const resp = await fetch(`${SERPAPI_BASE}?${params}`);
    if (!resp.ok) {
      console.warn(`[SerpAPI] HTTP ${resp.status} for "${eventName}"`);
      return null;
    }

    const data = await resp.json();
    const results = data.images_results || [];

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

    for (const img of results) {
      if (img.thumbnail && img.thumbnail.startsWith('http')) {
        return img.thumbnail;
      }
    }

    return null;
  } catch (err) {
    console.error(`[SerpAPI] Error for "${eventName}":`, (err as Error).message);
    return null;
  }
}

// ─── API 2: Google Places Text Search ─────────────────────────────
async function searchGooglePlaces(eventName: string, city: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const query = `${eventName} ${city}`;
    const resp = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.photos',
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 3 }),
    });

    if (!resp.ok) {
      console.warn(`[GooglePlaces] HTTP ${resp.status} for "${eventName}"`);
      return null;
    }

    const data = await resp.json();
    const places = data.places || [];

    for (const place of places) {
      const photos = place.photos || [];
      if (photos.length > 0) {
        const photoName = photos[0].name;
        return `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_API_KEY}&maxWidthPx=800`;
      }
    }

    return null;
  } catch (err) {
    console.error(`[GooglePlaces] Error for "${eventName}":`, (err as Error).message);
    return null;
  }
}

// ─── API 3: SerpAPI regular Google Search (images from results) ───
async function searchGoogleWeb(eventName: string, city: string): Promise<string | null> {
  if (!SERPAPI_KEY) return null;
  try {
    const query = `${eventName} ${city} event photo`;
    const params = new URLSearchParams({
      engine: 'google',
      q: query,
      num: '5',
      api_key: SERPAPI_KEY,
    });

    const resp = await fetch(`${SERPAPI_BASE}?${params}`);
    if (!resp.ok) return null;

    const data = await resp.json();

    // Check inline images from organic results
    const inlineImages = data.inline_images || [];
    for (const img of inlineImages) {
      if (img.original && !img.original.includes('unsplash.com') && !isUrlBroken(img.original)) {
        return img.original;
      }
      if (img.thumbnail && img.thumbnail.startsWith('http') && !isUrlBroken(img.thumbnail)) {
        return img.thumbnail;
      }
    }

    // Check knowledge graph image
    const kgHeader = data.knowledge_graph?.header_images?.[0]?.image;
    if (kgHeader && !isUrlBroken(kgHeader)) return kgHeader;
    const kgImage = data.knowledge_graph?.image;
    if (kgImage && !isUrlBroken(kgImage)) return kgImage;

    return null;
  } catch (err) {
    console.error(`[GoogleWeb] Error for "${eventName}":`, (err as Error).message);
    return null;
  }
}

// ─── Multi-API Fallback Chain ─────────────────────────────────────
async function findImageForEvent(
  eventName: string,
  city: string,
  category: string
): Promise<{ url: string | null; source: string }> {
  // 1. Try SerpAPI Google Images (best quality)
  const serpResult = await searchSerpAPI(eventName, city, category);
  if (serpResult && !isUrlBroken(serpResult)) return { url: serpResult, source: 'serpapi_images' };

  // 2. Try Google Places Text Search
  const placesResult = await searchGooglePlaces(eventName, city);
  if (placesResult && !isUrlBroken(placesResult))
    return { url: placesResult, source: 'google_places' };

  // 3. Try SerpAPI regular Google Search (inline images / knowledge graph)
  const webResult = await searchGoogleWeb(eventName, city);
  if (webResult && !isUrlBroken(webResult)) return { url: webResult, source: 'google_web' };

  return { url: null, source: 'none' };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const unauthorized = requireCronOrServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json(
      { error: 'Supabase credentials not configured' },
      { status: 500, headers: corsHeaders }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'null';
    const batchSize = body.batchSize || 15;
    const dryRun = body.dryRun || false;
    const eventId = body.eventId;

    let events: any[] = [];

    if (mode === 'single' && eventId) {
      // Fix a single event by ID
      const { data, error } = await supabase
        .from('destination_events')
        .select('id, event_name, city, country, category, image_url')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      if (data) events = [data];
    } else if (mode === 'null') {
      // Fix events with NULL/empty image_url
      const { data, error } = await supabase
        .from('destination_events')
        .select('id, event_name, city, country, category, image_url')
        .or('image_url.is.null,image_url.eq.')
        .limit(batchSize);

      if (error) throw error;
      events = data || [];
    } else {
      // Fix events with Unsplash images
      const { data, error } = await supabase
        .from('destination_events')
        .select('id, event_name, city, country, category, image_url')
        .ilike('image_url', '%unsplash.com%')
        .limit(batchSize);

      if (error) throw error;
      events = data || [];
    }

    if (events.length === 0) {
      return Response.json(
        { message: `No events to repair (mode=${mode})`, repaired: 0 },
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[repair-event-images] mode=${mode}, processing ${events.length} events...`);

    const results: {
      id: string;
      event_name: string;
      status: string;
      source?: string;
      newUrl?: string;
    }[] = [];

    for (const event of events) {
      const { url: newUrl, source } = await findImageForEvent(
        event.event_name,
        event.city,
        event.category
      );

      if (newUrl) {
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('destination_events')
            .update({ image_url: newUrl })
            .eq('id', event.id);

          if (updateError) {
            console.error(`[repair] DB update failed for "${event.event_name}":`, updateError);
            results.push({ id: event.id, event_name: event.event_name, status: 'db_error' });
          } else {
            results.push({
              id: event.id,
              event_name: event.event_name,
              status: 'repaired',
              source,
              newUrl,
            });
          }
        } else {
          results.push({
            id: event.id,
            event_name: event.event_name,
            status: 'dry_run_found',
            source,
            newUrl,
          });
        }
      } else {
        results.push({
          id: event.id,
          event_name: event.event_name,
          status: 'no_image_found',
          source: 'none',
        });
      }

      // 300ms delay between API calls to respect rate limits
      await new Promise((r) => setTimeout(r, 300));
    }

    const repaired = results.filter(
      (r) => r.status === 'repaired' || r.status === 'dry_run_found'
    ).length;
    const failed = results.filter(
      (r) => r.status === 'no_image_found' || r.status === 'db_error'
    ).length;

    // Count remaining null images
    const { count: remainingNull } = await supabase
      .from('destination_events')
      .select('id', { count: 'exact', head: true })
      .or('image_url.is.null,image_url.eq.');

    console.log(
      `[repair-event-images] Done. Repaired: ${repaired}, Failed: ${failed}, Remaining null: ${remainingNull}`
    );

    return Response.json(
      {
        message: `Processed ${results.length} events (mode=${mode})`,
        mode,
        repaired,
        failed,
        remainingNull: remainingNull || 0,
        dryRun,
        results,
      },
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[repair-event-images] Error:', err);
    return Response.json(
      { error: 'Failed to repair event images', details: String(err) },
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
