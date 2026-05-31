import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  buildCityImageQueries,
  buildCityImageSlug,
  pickBestCityImageCandidate,
  type GooglePlaceCandidate,
} from '../_shared/cityImage.ts';
import { cleanCityName, looksLikeAirportName } from '../_shared/airportCity.ts';
import { releaseEdgeLock, tryAcquireEdgeLock } from '../_shared/edgeScale/locks.ts';

const GOOGLE_API_KEY =
  Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const BUCKET = 'destination-images';
const NAMESPACE = 'city_images';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CityImageRow {
  slug: string;
  image_url: string;
  source: string;
  width?: number | null;
  height?: number | null;
}

async function readPayload(req: Request): Promise<Record<string, string>> {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    return Object.fromEntries(url.searchParams.entries());
  }
  return await req.json();
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getCachedCityImage(
  supabase: ReturnType<typeof createClient>,
  slug: string
): Promise<CityImageRow | null> {
  const { data, error } = await supabase
    .from('city_images')
    .select('slug, image_url, source, width, height')
    .eq('slug', slug)
    .eq('status', 'ready')
    .maybeSingle();

  if (error || !data?.image_url) return null;

  try {
    await supabase
      .from('city_images')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('slug', slug);
  } catch {
    // Access accounting should not block cache hits.
  }

  return data as CityImageRow;
}

async function findGooglePhotoReference(city: string, country: string | null): Promise<{
  photoReference: string;
  width?: number;
  height?: number;
} | null> {
  for (const query of buildCityImageQueries(city, country)) {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const results: GooglePlaceCandidate[] = data.results || [];
    const candidate = pickBestCityImageCandidate(results, city, country);
    const photo = candidate?.photos?.[0];
    if (photo?.photo_reference) {
      return {
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      };
    }
  }

  return null;
}

async function downloadGooglePhoto(photoReference: string): Promise<{
  bytes: Uint8Array;
  contentType: string;
}> {
  const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${encodeURIComponent(photoReference)}&key=${GOOGLE_API_KEY}`;
  const response = await fetch(photoUrl, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Google photo download failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const buffer = await response.arrayBuffer();
  return { bytes: new Uint8Array(buffer), contentType };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ success: false, error: 'Supabase service is not configured' }, 500);
  }

  try {
    const payload = await readPayload(req);
    const rawCity = String(payload.city || '').trim();
    // Defensive: callers should pass a city, but if an airport-style name slips
    // through, collapse it to the city so we never cache an airport/random photo.
    const city = looksLikeAirportName(rawCity) ? cleanCityName(rawCity) : rawCity;
    const country = String(payload.country || '').trim() || null;
    const slug = buildCityImageSlug(city, country);

    if (!city || !slug) {
      return json({ success: false, error: 'city is required' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const cached = await getCachedCityImage(supabase, slug);
    if (cached) {
      return json({
        success: true,
        cached: true,
        slug,
        imageUrl: cached.image_url,
        source: cached.source,
        width: cached.width || null,
        height: cached.height || null,
      });
    }

    if (!GOOGLE_API_KEY) {
      return json({ success: false, error: 'Google API key is not configured' }, 500);
    }

    const lock = await tryAcquireEdgeLock(supabase, NAMESPACE, slug, 45);
    if (!lock.acquired) {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 750));
        const nextCached = await getCachedCityImage(supabase, slug);
        if (nextCached) {
          return json({
            success: true,
            cached: true,
            coalesced: true,
            slug,
            imageUrl: nextCached.image_url,
            source: nextCached.source,
            width: nextCached.width || null,
            height: nextCached.height || null,
          });
        }
      }

      return json({ success: false, error: 'image_resolution_in_progress', slug }, 202);
    }

    try {
      const photo = await findGooglePhotoReference(city, country);
      if (!photo) {
        await releaseEdgeLock(supabase, NAMESPACE, slug, lock.ownerId, 'completed');
        return json({ success: false, error: 'No city image found', slug }, 404);
      }

      const downloaded = await downloadGooglePhoto(photo.photoReference);
      const storagePath = `cities/${slug}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, downloaded.bytes, {
          contentType: downloaded.contentType || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`City image upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      const imageUrl = publicUrlData.publicUrl;

      const { error: upsertError } = await supabase.from('city_images').upsert(
        {
          slug,
          city,
          country,
          image_url: imageUrl,
          storage_bucket: BUCKET,
          storage_path: storagePath,
          source: 'google_places',
          source_photo_reference: photo.photoReference,
          width: photo.width || null,
          height: photo.height || null,
          status: 'ready',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      );

      if (upsertError) {
        throw new Error(`City image cache insert failed: ${upsertError.message}`);
      }

      await releaseEdgeLock(supabase, NAMESPACE, slug, lock.ownerId, 'completed');
      return json({
        success: true,
        cached: false,
        slug,
        imageUrl,
        source: 'google_places',
        width: photo.width || null,
        height: photo.height || null,
      });
    } catch (error) {
      await releaseEdgeLock(supabase, NAMESPACE, slug, lock.ownerId, 'failed');
      throw error;
    }
  } catch (error: any) {
    console.error('[resolve-city-image] error:', error);
    return json({ success: false, error: error.message || 'Failed to resolve city image' }, 500);
  }
});
