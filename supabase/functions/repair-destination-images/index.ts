import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY") || Deno.env.get("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Search Google Places and return the first high-quality photo URL */
async function findPlacePhoto(query: string, maxWidth = 1200): Promise<string | null> {
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    const results = searchData.results || [];
    for (const result of results.slice(0, 3)) {
      const photoRef = result.photos?.[0]?.photo_reference;
      if (!photoRef) continue;

      // Resolve photo reference to actual image URL
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
      const photoResp = await fetch(photoUrl, { redirect: "manual" });

      if (photoResp.status === 302 || photoResp.status === 301) {
        const redirectUrl = photoResp.headers.get("location");
        if (redirectUrl) return redirectUrl;
      }

      // Follow redirect as fallback
      const followResp = await fetch(photoUrl, { redirect: "follow" });
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
  const strategies = [
    `${city} ${country} city landmark`,
    `${city} tourism skyline`,
    `${city} famous view`,
    city,
  ];

  for (const query of strategies) {
    const url = await findPlacePhoto(query);
    if (url) {
      console.log(`[repair] Found photo for "${city}, ${country}" via: "${query}"`);
      return url;
    }
  }

  console.warn(`[repair] No photo found for "${city}, ${country}" after ${strategies.length} strategies`);
  return null;
}

/** Basic check if an image URL is likely valid (not broken) */
async function isImageUrlValid(url: string): Promise<boolean> {
  if (!url || url.length < 10) return false;
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    const contentType = res.headers.get("content-type") || "";
    return res.ok && contentType.startsWith("image");
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!GOOGLE_API_KEY) {
    return Response.json({ error: "GOOGLE_API_KEY not configured" }, { status: 500, headers: corsHeaders });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Supabase credentials not configured" }, { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "missing"; // "missing" = only null/empty, "validate" = also check broken URLs
    const batchSize = body.batchSize || 10;
    const dryRun = body.dryRun || false;

    // Fetch destinations needing repair
    let query = supabase
      .from("curated_destinations")
      .select("id, title, city, country, hero_image_url, thumbnail_url")
      .eq("status", "published");

    if (mode === "missing") {
      // Only get rows with null/empty hero_image_url
      query = query.or("hero_image_url.is.null,hero_image_url.eq.");
    }
    // For "validate" mode, we get all and check each URL

    const { data: destinations, error: dbError } = await query.limit(batchSize * 2);
    if (dbError) throw dbError;

    if (!destinations || destinations.length === 0) {
      return Response.json({ message: "No destinations need image repair", repaired: 0 }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Filter to destinations that actually need repair
    const needsRepair: typeof destinations = [];

    for (const dest of destinations) {
      if (!dest.hero_image_url || dest.hero_image_url.trim() === "") {
        needsRepair.push(dest);
      } else if (mode === "validate") {
        const valid = await isImageUrlValid(dest.hero_image_url);
        if (!valid) {
          console.log(`[repair] Invalid image URL for "${dest.title}": ${dest.hero_image_url}`);
          needsRepair.push(dest);
        }
      }

      if (needsRepair.length >= batchSize) break;
    }

    if (needsRepair.length === 0) {
      return Response.json({ message: "All destination images are valid", repaired: 0, checked: destinations.length }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[repair] Processing ${needsRepair.length} destinations...`);

    const results: { id: string; title: string; status: string; newUrl?: string }[] = [];

    for (const dest of needsRepair) {
      const city = dest.city || dest.title?.split(" - ")[0] || dest.title;
      const country = dest.country || "";

      const newUrl = await findBestPhoto(city, country);

      if (newUrl) {
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from("curated_destinations")
            .update({ hero_image_url: newUrl })
            .eq("id", dest.id);

          if (updateError) {
            console.error(`[repair] DB update failed for "${dest.title}":`, updateError);
            results.push({ id: dest.id, title: dest.title, status: "db_error" });
          } else {
            results.push({ id: dest.id, title: dest.title, status: "repaired", newUrl });
          }
        } else {
          results.push({ id: dest.id, title: dest.title, status: "dry_run_found", newUrl });
        }
      } else {
        results.push({ id: dest.id, title: dest.title, status: "no_photo_found" });
      }

      // Small delay between API calls to be respectful of rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    const repaired = results.filter(r => r.status === "repaired" || r.status === "dry_run_found").length;
    const failed = results.filter(r => r.status === "no_photo_found" || r.status === "db_error").length;

    console.log(`[repair] Done. Repaired: ${repaired}, Failed: ${failed}`);

    return Response.json({
      message: `Processed ${results.length} destinations`,
      repaired,
      failed,
      dryRun,
      results,
    }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[repair] Error:", err);
    return Response.json(
      { error: "Failed to repair images", details: String(err) },
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
