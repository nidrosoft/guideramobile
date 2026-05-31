import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireCronOrServiceAuth } from '../_shared/cronAuth.ts';

/**
 * REPAIR DESTINATION IMAGES
 *
 * Scans curated_destinations for rows with missing or broken hero_image_url,
 * then backfills using Google Places Text Search API to find accurate city photos.
 *
 * Strategy per destination:
 *   1. "{city} {country} city landmark" — iconic recognizable photo
 *   2. "{city} tourism skyline"         — scenic tourism photo
 *   3. "{city}"                         — broadest search
 *
 * Can be invoked manually or via cron. Processes in batches to avoid timeouts.
 */

const GOOGLE_API_KEY =
  Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-cron-secret, apikey, content-type',
};

const DESIRABLE_PLACE_TYPES = new Set([
  'tourist_attraction',
  'natural_feature',
  'park',
  'museum',
  'art_gallery',
  'place_of_worship',
  'point_of_interest',
]);

const GENERIC_OR_BUSINESS_TYPES = new Set([
  'travel_agency',
  'lodging',
  'store',
  'shopping_mall',
  'restaurant',
  'cafe',
  'bar',
  'night_club',
  'car_rental',
  'airport',
  'transit_station',
  'real_estate_agency',
  'finance',
]);

function scorePlaceCandidate(result: any, city: string, country: string): number {
  const photoRef = result.photos?.[0]?.photo_reference;
  if (!photoRef) return Number.NEGATIVE_INFINITY;

  const types: string[] = result.types || [];
  const searchableText = `${result.name || ''} ${result.formatted_address || ''}`.toLowerCase();
  const candidateName = String(result.name || '').toLowerCase();
  let score = 0;

  if (city && searchableText.includes(city.toLowerCase())) score += 10;
  if (country && searchableText.includes(country.toLowerCase())) score += 6;

  for (const type of types) {
    if (DESIRABLE_PLACE_TYPES.has(type)) score += 8;
    if (GENERIC_OR_BUSINESS_TYPES.has(type)) score -= 14;
  }

  if (types.includes('tourist_attraction')) score += 10;
  if (types.includes('natural_feature') || types.includes('park')) score += 6;
  if (/\b(landmarks?|directory|guide|agency|tour operator)\b/.test(candidateName)) score -= 16;

  return score;
}

/** Search Google Places and return the best high-quality photo URL */
async function findPlacePhoto(
  query: string,
  maxWidth = 1200,
  context: { city?: string; country?: string } = {}
): Promise<string | null> {
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    const results = (searchData.results || [])
      .slice(0, 5)
      .map((result: any) => ({
        result,
        score: scorePlaceCandidate(result, context.city || '', context.country || ''),
      }))
      .filter((entry: any) => entry.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .map((entry: any) => entry.result);

    for (const result of results.slice(0, 3)) {
      const photoRef = result.photos?.[0]?.photo_reference;
      if (!photoRef) continue;

      // Resolve photo reference to actual image URL
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
      const photoResp = await fetch(photoUrl, { redirect: 'manual' });

      if (photoResp.status === 302 || photoResp.status === 301) {
        const redirectUrl = photoResp.headers.get('location');
        if (redirectUrl) return redirectUrl;
      }

      // Follow redirect as fallback
      const followResp = await fetch(photoUrl, { redirect: 'follow' });
      if (followResp.ok) return followResp.url;
    }
    return null;
  } catch (err) {
    console.error(`[repair] Google Places search failed for "${query}":`, err);
    return null;
  }
}

/** Try multiple search strategies for a destination */
async function findBestPhoto(city: string, country: string): Promise<string | null> {
  const destination = [city, country].filter(Boolean).join(' ');
  const isBali = /bali/i.test(destination);
  const strategies = [
    ...(isBali
      ? [`${city} ${country} beach temple`, `${city} ${country} rice terraces`]
      : []),
    `tourist attractions in ${city} ${country}`,
    `${city} ${country} scenic viewpoint`,
    `${city} ${country} famous landmark`,
    `${city} tourism skyline`,
    `${city} famous view`,
    city,
  ];

  for (const query of strategies) {
    const url = await findPlacePhoto(query, 1200, { city, country });
    if (url) {
      console.log(`[repair] Found photo for "${city}, ${country}" via: "${query}"`);
      return url;
    }
  }

  console.warn(
    `[repair] No photo found for "${city}, ${country}" after ${strategies.length} strategies`
  );
  return null;
}

/** Basic check if an image URL is likely valid (not broken) */
async function isImageUrlValid(url: string): Promise<boolean> {
  if (!url || url.length < 10) return false;
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const contentType = res.headers.get('content-type') || '';
    return res.ok && contentType.startsWith('image');
  } catch {
    return false;
  }
}

const STORAGE_BUCKET = 'destination-images';

function isPersistedStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
}

function publicStorageUrl(path: string): string {
  return `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

/** Download image bytes from a (possibly short-lived) URL. */
async function downloadImageBytes(
  url: string,
  timeoutMs = 15000
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (!url || url.length < 10) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: controller.signal });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.startsWith('image')) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength < 1024) return null; // too small to be a real photo
    return { bytes: buf, contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Persist a destination photo into Supabase Storage and return the permanent
 * public URL. Tries the existing URL first (still valid), then re-resolves a
 * fresh Google photo if needed. Returns null if no image could be obtained.
 */
async function persistDestinationImage(
  supabase: ReturnType<typeof createClient>,
  destId: string,
  city: string,
  country: string,
  existingUrl: string | null
): Promise<string | null> {
  let image = existingUrl && !isPersistedStorageUrl(existingUrl)
    ? await downloadImageBytes(existingUrl)
    : null;

  if (!image) {
    const fresh = await findBestPhoto(city, country);
    if (fresh) image = await downloadImageBytes(fresh);
  }

  if (!image) return null;

  const ext = image.contentType.includes('png') ? 'png' : image.contentType.includes('webp') ? 'webp' : 'jpg';
  const path = `destinations/${destId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, image.bytes, { contentType: image.contentType, upsert: true });

  if (uploadError) {
    console.error(`[repair] Storage upload failed for ${destId}:`, uploadError.message);
    return null;
  }

  return publicStorageUrl(path);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const unauthorized = requireCronOrServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  if (!GOOGLE_API_KEY) {
    return Response.json(
      { error: 'GOOGLE_API_KEY not configured' },
      { status: 500, headers: corsHeaders }
    );
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json(
      { error: 'Supabase credentials not configured' },
      { status: 500, headers: corsHeaders }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    // "missing" = null/empty, "unsplash" = replace unsplash, "validate" = check broken,
    // "persist" = download to Supabase Storage so URLs never expire (recommended).
    const mode = body.mode || 'missing';
    const batchSize = body.batchSize || 10;
    const dryRun = body.dryRun || false;

    // Fetch destinations needing repair
    let query = supabase
      .from('curated_destinations')
      .select('id, title, city, country, hero_image_url, thumbnail_url')
      .eq('status', 'published');

    if (mode === 'missing') {
      // Only get rows with null/empty hero_image_url
      query = query.or('hero_image_url.is.null,hero_image_url.eq.');
    } else if (mode === 'unsplash') {
      // Get rows with Unsplash hero or thumbnail URLs
      query = query.or('hero_image_url.ilike.%unsplash.com%,thumbnail_url.ilike.%unsplash.com%');
    } else if (mode === 'persist') {
      // Any row not yet persisted to our Storage bucket (ephemeral Google URLs, etc.)
      query = query.or(
        `hero_image_url.is.null,hero_image_url.eq.,hero_image_url.not.ilike.%/storage/v1/object/public/${STORAGE_BUCKET}/%`
      );
    }
    // For "validate" mode, we get all and check each URL

    const { data: destinations, error: dbError } = await query.limit(batchSize * 2);
    if (dbError) throw dbError;

    if (!destinations || destinations.length === 0) {
      return Response.json(
        { message: 'No destinations need image repair', repaired: 0 },
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter to destinations that actually need repair
    const needsRepair: typeof destinations = [];

    for (const dest of destinations) {
      if (mode === 'persist') {
        if (!isPersistedStorageUrl(dest.hero_image_url)) needsRepair.push(dest);
      } else if (!dest.hero_image_url || dest.hero_image_url.trim() === '') {
        needsRepair.push(dest);
      } else if (mode === 'unsplash') {
        const heroIsUnsplash = dest.hero_image_url?.includes('unsplash.com');
        const thumbIsUnsplash = dest.thumbnail_url?.includes('unsplash.com');
        if (heroIsUnsplash || thumbIsUnsplash) {
          needsRepair.push(dest);
        }
      } else if (mode === 'validate') {
        const valid = await isImageUrlValid(dest.hero_image_url);
        if (!valid) {
          console.log(`[repair] Invalid image URL for "${dest.title}": ${dest.hero_image_url}`);
          needsRepair.push(dest);
        }
      }

      if (needsRepair.length >= batchSize) break;
    }

    if (needsRepair.length === 0) {
      return Response.json(
        { message: 'All destination images are valid', repaired: 0, checked: destinations.length },
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[repair] Processing ${needsRepair.length} destinations...`);

    const results: { id: string; title: string; status: string; newUrl?: string }[] = [];

    for (const dest of needsRepair) {
      const city = dest.city || dest.title?.split(' - ')[0] || dest.title;
      const country = dest.country || '';

      // Persist mode: download the photo into Storage and store a permanent URL.
      if (mode === 'persist') {
        if (dryRun) {
          results.push({ id: dest.id, title: dest.title, status: 'dry_run_found' });
          continue;
        }
        const storageUrl = await persistDestinationImage(
          supabase,
          dest.id,
          city,
          country,
          dest.hero_image_url
        );
        if (storageUrl) {
          const { error: updateError } = await supabase
            .from('curated_destinations')
            .update({ hero_image_url: storageUrl, thumbnail_url: storageUrl })
            .eq('id', dest.id);
          results.push({
            id: dest.id,
            title: dest.title,
            status: updateError ? 'db_error' : 'repaired',
            newUrl: storageUrl,
          });
        } else {
          results.push({ id: dest.id, title: dest.title, status: 'no_photo_found' });
        }
        await new Promise((r) => setTimeout(r, 150));
        continue;
      }

      const newUrl = await findBestPhoto(city, country);

      if (newUrl) {
        // Also get a smaller thumbnail version
        const thumbUrl = (await findPlacePhoto(`${city} ${country} city`, 600, { city, country })) || newUrl;

        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('curated_destinations')
            .update({ hero_image_url: newUrl, thumbnail_url: thumbUrl })
            .eq('id', dest.id);

          if (updateError) {
            console.error(`[repair] DB update failed for "${dest.title}":`, updateError);
            results.push({ id: dest.id, title: dest.title, status: 'db_error' });
          } else {
            results.push({ id: dest.id, title: dest.title, status: 'repaired', newUrl });
          }
        } else {
          results.push({ id: dest.id, title: dest.title, status: 'dry_run_found', newUrl });
        }
      } else {
        results.push({ id: dest.id, title: dest.title, status: 'no_photo_found' });
      }

      // Small delay between API calls to be respectful of rate limits
      await new Promise((r) => setTimeout(r, 200));
    }

    const repaired = results.filter(
      (r) => r.status === 'repaired' || r.status === 'dry_run_found'
    ).length;
    const failed = results.filter(
      (r) => r.status === 'no_photo_found' || r.status === 'db_error'
    ).length;

    console.log(`[repair] Done. Repaired: ${repaired}, Failed: ${failed}`);

    return Response.json(
      {
        message: `Processed ${results.length} destinations`,
        repaired,
        failed,
        dryRun,
        results,
      },
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[repair] Error:', err);
    return Response.json(
      { error: 'Failed to repair images', details: String(err) },
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
