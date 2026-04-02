import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * DESTINATION DETAILS — Edge Function
 *
 * Enriches a curated_destination with live data:
 *   1. Google Places — nearby POIs (attractions, restaurants, hidden gems)
 *   2. Google Places — reviews for the city
 *   3. Google Places — gallery photos (5-8 images)
 *   4. Gemini AI   — safety cards, practical tips (currency, language, visa, emergency, etc.)
 *
 * Speed strategy:
 *   • DB cache check first → instant if cached (<100ms)
 *   • All external calls fire in parallel (Google Places + Gemini)
 *   • Write-through cache → second visitor gets instant data
 *   • Cache TTL = 7 days (travel info doesn't change hourly)
 */

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY") || Deno.env.get("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY") || "";
const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CACHE_TTL_DAYS = 7;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Supabase client ───
function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// ═══════════════════════════════════════════════
// GOOGLE PLACES — POIs
// ═══════════════════════════════════════════════

interface PlacePOI {
  id: string;
  name: string;
  vicinity: string;
  rating: number;
  reviewCount: number;
  photo: string;
  types: string[];
  category: string;
  location: { lat: number; lng: number };
}

async function fetchNearbyPOIs(lat: number, lng: number, city: string): Promise<PlacePOI[]> {
  if (!GOOGLE_API_KEY) return [];

  // Run 3 searches in parallel: attractions, restaurants, and general points of interest
  const searches = [
    fetchPlacesByType(lat, lng, "tourist_attraction", 5000),
    fetchPlacesByType(lat, lng, "restaurant", 3000),
    fetchPlacesByType(lat, lng, "museum", 5000),
  ];

  const [attractions, restaurants, museums] = await Promise.allSettled(searches);
  const all: any[] = [];
  if (attractions.status === "fulfilled") all.push(...attractions.value);
  if (restaurants.status === "fulfilled") all.push(...restaurants.value);
  if (museums.status === "fulfilled") all.push(...museums.value);

  // Deduplicate by place_id
  const seen = new Set<string>();
  const unique: PlacePOI[] = [];
  for (const p of all) {
    if (seen.has(p.place_id)) continue;
    seen.add(p.place_id);

    // Resolve photo
    let photoUrl = "";
    if (p.photos?.[0]?.photo_reference) {
      photoUrl = await resolvePhotoUrl(p.photos[0].photo_reference, 600);
    }

    unique.push({
      id: p.place_id,
      name: p.name,
      vicinity: p.vicinity || p.formatted_address || "",
      rating: p.rating || 0,
      reviewCount: p.user_ratings_total || 0,
      photo: photoUrl,
      types: p.types || [],
      category: categorizePlace(p.types || []),
      location: {
        lat: p.geometry?.location?.lat || 0,
        lng: p.geometry?.location?.lng || 0,
      },
    });

    if (unique.length >= 15) break;
  }

  return unique;
}

async function fetchPlacesByType(lat: number, lng: number, type: string, radius: number): Promise<any[]> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}&rankby=prominence`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

function categorizePlace(types: string[]): string {
  if (types.some(t => ["restaurant", "food", "cafe", "bar", "bakery", "meal_takeaway"].includes(t))) return "Restaurants";
  if (types.some(t => ["museum", "art_gallery", "library"].includes(t))) return "Interaction";
  if (types.some(t => ["park", "natural_feature", "campground", "beach"].includes(t))) return "Hidden Gems";
  if (types.some(t => ["amusement_park", "spa", "gym", "movie_theater", "stadium", "bowling_alley"].includes(t))) return "Interaction";
  return "Attractions";
}

// ═══════════════════════════════════════════════
// GOOGLE PLACES — Reviews
// ═══════════════════════════════════════════════

interface PlaceReview {
  author: string;
  avatar: string;
  rating: number;
  text: string;
  time: string;
  placeName?: string;
}

async function fetchCityReviews(city: string, country: string, pois: PlacePOI[]): Promise<PlaceReview[]> {
  if (!GOOGLE_API_KEY) return [];

  try {
    // Strategy: Collect reviews from the top-rated POIs already fetched.
    // Google Places text search for a city returns a locality with NO reviews,
    // so we pull reviews from the most popular attractions instead.
    const topPois = pois
      .filter(p => p.reviewCount > 50)
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 4);

    // If no POIs yet, do a quick text search for top attractions
    const placeIds = topPois.length > 0
      ? topPois.map(p => p.id)
      : await findTopAttractionIds(city, country);

    if (placeIds.length === 0) return [];

    // Fetch reviews from each place in parallel
    const detailPromises = placeIds.map(async (placeId: string) => {
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,name&key=${GOOGLE_API_KEY}`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();
        const reviews = detailData.result?.reviews || [];
        const placeName = detailData.result?.name || "";
        return reviews.slice(0, 2).map((r: any) => ({
          author: r.author_name || "Traveler",
          avatar: r.profile_photo_url || "",
          rating: r.rating || 5,
          text: r.text || "",
          time: r.relative_time_description || "",
          placeName,
        }));
      } catch {
        return [];
      }
    });

    const results = await Promise.allSettled(detailPromises);
    const allReviews: PlaceReview[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") allReviews.push(...r.value);
    }

    // Deduplicate by author name and return top 8
    const seen = new Set<string>();
    const unique: PlaceReview[] = [];
    for (const review of allReviews) {
      const key = `${review.author}-${review.text?.slice(0, 30)}`;
      if (seen.has(key) || !review.text || review.text.length < 10) continue;
      seen.add(key);
      unique.push(review);
      if (unique.length >= 8) break;
    }

    return unique;
  } catch (err) {
    console.error("Failed to fetch reviews:", err);
    return [];
  }
}

async function findTopAttractionIds(city: string, country: string): Promise<string[]> {
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`top attractions in ${city}, ${country}`)}&key=${GOOGLE_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    return (searchData.results || [])
      .filter((r: any) => (r.user_ratings_total || 0) > 100)
      .slice(0, 3)
      .map((r: any) => r.place_id);
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════
// GOOGLE PLACES — Gallery Photos
// ═══════════════════════════════════════════════

async function fetchGalleryPhotos(city: string, country: string, existingHero: string): Promise<string[]> {
  if (!GOOGLE_API_KEY) return [];

  try {
    // Search for the city to get photo references
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${city} ${country} landmarks`)}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    const results = data.results || [];

    // Collect photo references from top results
    const photoRefs: string[] = [];
    for (const place of results.slice(0, 10)) {
      if (place.photos) {
        for (const photo of place.photos.slice(0, 2)) {
          if (photo.photo_reference) photoRefs.push(photo.photo_reference);
        }
      }
      if (photoRefs.length >= 8) break;
    }

    // Resolve photo URLs in parallel
    const urls = await Promise.allSettled(
      photoRefs.map(ref => resolvePhotoUrl(ref, 1200))
    );

    const gallery = urls
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled" && !!r.value)
      .map(r => r.value)
      .filter(url => url !== existingHero); // Don't duplicate the hero

    return gallery.slice(0, 7);
  } catch (err) {
    console.error("Failed to fetch gallery photos:", err);
    return [];
  }
}

async function resolvePhotoUrl(photoReference: string, maxWidth: number): Promise<string> {
  try {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;
    const resp = await fetch(photoUrl, { redirect: "manual" });
    if (resp.status === 302 || resp.status === 301) {
      return resp.headers.get("location") || "";
    }
    const followResp = await fetch(photoUrl, { redirect: "follow" });
    return followResp.ok ? followResp.url : "";
  } catch {
    return "";
  }
}

// ═══════════════════════════════════════════════
// GEMINI AI — Safety cards + Practical tips
// ═══════════════════════════════════════════════

interface AIEnrichment {
  safety_cards: Array<{
    category: string;
    title: string;
    detail: string;
    severity: "low" | "medium" | "high";
    iconType: "warning" | "clock" | "location" | "info";
  }>;
  practical_tips: Array<{
    icon: string;
    label: string;
    value: string;
  }>;
  best_time_months: string;
  budget_per_day_usd: string;
  recommended_duration: string;
}

async function fetchAIEnrichment(city: string, country: string): Promise<AIEnrichment | null> {
  if (!GOOGLE_AI_API_KEY) return null;

  const prompt = `You are a travel intelligence API. Return ONLY valid JSON (no markdown, no code fences) for ${city}, ${country}.

{
  "safety_cards": [
    // 4-6 cards with REAL, city-specific safety information
    // Categories: "General Safety", "Scams & Theft", "Transportation Safety", "Health & Medical", "Emergency", "Night Safety", "Natural Hazards"
    // severity: "low" (safe/minor), "medium" (caution needed), "high" (serious risk)
    // iconType: "warning" for risks, "info" for general, "location" for area-specific, "clock" for time-specific
    {"category": "...", "title": "...", "detail": "50-80 word specific advice for THIS city", "severity": "...", "iconType": "..."}
  ],
  "practical_tips": [
    // 6-8 items covering: currency, language, emergency number, tipping, visa info, power outlet, time zone, water safety
    {"icon": "currency", "label": "Currency", "value": "Euro (EUR) — cards widely accepted"},
    {"icon": "language", "label": "Language", "value": "Estonian, English widely spoken"},
    {"icon": "phone", "label": "Emergency Number", "value": "112 (police, fire, ambulance)"},
    {"icon": "info", "label": "Tipping Culture", "value": "10-15% at restaurants, not mandatory"},
    {"icon": "info", "label": "Visa Info", "value": "Schengen zone — 90 days visa-free for most nationalities"},
    {"icon": "info", "label": "Power Outlets", "value": "Type F, 230V — EU standard plug"},
    {"icon": "clock", "label": "Time Zone", "value": "EET (UTC+2), EEST in summer (UTC+3)"},
    {"icon": "info", "label": "Tap Water", "value": "Safe to drink throughout the city"}
  ],
  "best_time_months": "May - September",
  "budget_per_day_usd": "$80 - $150",
  "recommended_duration": "3-5 days"
}

Be specific to ${city}, ${country}. Use real data. No generic advice.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      console.error("Gemini API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // Parse JSON — handle potential markdown fences
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as AIEnrichment;
  } catch (err) {
    console.error("Gemini enrichment failed:", err);
    return null;
  }
}

// ═══════════════════════════════════════════════
// CACHE — DB-backed for instant repeat visits
// ═══════════════════════════════════════════════

interface CachedDetail {
  nearbyPlaces: PlacePOI[];
  reviews: PlaceReview[];
  galleryPhotos: string[];
  enrichment: AIEnrichment | null;
  cached_at: string;
}

async function getCachedDetail(destinationId: string): Promise<CachedDetail | null> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("destination_detail_cache")
      .select("detail_data, cached_at")
      .eq("destination_id", destinationId)
      .single();

    if (!data) return null;

    // Check TTL
    const cachedAt = new Date(data.cached_at);
    const now = new Date();
    const daysSince = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > CACHE_TTL_DAYS) return null;

    return data.detail_data as CachedDetail;
  } catch {
    return null;
  }
}

async function setCachedDetail(destinationId: string, detail: CachedDetail): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase
      .from("destination_detail_cache")
      .upsert({
        destination_id: destinationId,
        detail_data: detail,
        cached_at: new Date().toISOString(),
      }, { onConflict: "destination_id" });
  } catch (err) {
    console.error("Cache write failed (non-fatal):", err);
  }
}

// Also backfill gallery_urls on the main table if empty
async function backfillGallery(destinationId: string, galleryUrls: string[]): Promise<void> {
  if (galleryUrls.length === 0) return;
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("curated_destinations")
      .select("gallery_urls")
      .eq("id", destinationId)
      .single();

    if (!data?.gallery_urls || data.gallery_urls.length === 0) {
      await supabase
        .from("curated_destinations")
        .update({ gallery_urls: galleryUrls })
        .eq("id", destinationId);
      console.log(`Backfilled ${galleryUrls.length} gallery photos for ${destinationId}`);
    }
  } catch (err) {
    console.error("Gallery backfill failed (non-fatal):", err);
  }
}

// ═══════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json({ success: false, error: "Missing destination id" }, { status: 400, headers: corsHeaders });
    }

    // ── Step 1: Check cache ──
    const cached = await getCachedDetail(id);
    if (cached) {
      console.log(`Cache HIT for ${id} — ${Date.now() - startTime}ms`);
      return Response.json({
        success: true,
        data: cached,
        source: "cache",
        duration_ms: Date.now() - startTime,
      }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Cache MISS for ${id} — fetching live data`);

    // ── Step 2: Fetch destination from DB ──
    const supabase = getSupabase();
    const { data: dest, error: destError } = await supabase
      .from("curated_destinations")
      .select("id, city, country, latitude, longitude, hero_image_url, safety_rating, budget_level, seasons")
      .eq("id", id)
      .single();

    if (destError || !dest) {
      return Response.json({ success: false, error: "Destination not found" }, { status: 404, headers: corsHeaders });
    }

    const { city, country, latitude, longitude, hero_image_url } = dest;

    // ── Step 3: Fire external calls in parallel ──
    // POIs, gallery, and AI enrichment are independent; reviews depend on POIs
    const [poisResult, galleryResult, aiResult] = await Promise.allSettled([
      fetchNearbyPOIs(latitude, longitude, city),
      fetchGalleryPhotos(city, country, hero_image_url || ""),
      fetchAIEnrichment(city, country),
    ]);

    const nearbyPlaces = poisResult.status === "fulfilled" ? poisResult.value : [];
    const galleryPhotos = galleryResult.status === "fulfilled" ? galleryResult.value : [];
    const enrichment = aiResult.status === "fulfilled" ? aiResult.value : null;

    // Reviews use top POIs for real traveler reviews (runs after POIs resolve)
    let reviews: PlaceReview[] = [];
    try {
      reviews = await fetchCityReviews(city, country, nearbyPlaces);
    } catch (err) {
      console.error("Reviews fetch failed (non-fatal):", err);
    }

    const detail: CachedDetail = {
      nearbyPlaces,
      reviews,
      galleryPhotos,
      enrichment,
      cached_at: new Date().toISOString(),
    };

    // ── Step 4: Write cache + backfill gallery (fire-and-forget) ──
    // Don't await — let the response go out immediately
    const cachePromise = setCachedDetail(id, detail);
    const galleryPromise = backfillGallery(id, galleryPhotos);

    // Wait briefly for cache writes (up to 500ms) but don't block response
    await Promise.race([
      Promise.allSettled([cachePromise, galleryPromise]),
      new Promise(resolve => setTimeout(resolve, 500)),
    ]);

    const duration = Date.now() - startTime;
    console.log(`Live fetch for ${city}, ${country}: ${nearbyPlaces.length} POIs, ${reviews.length} reviews, ${galleryPhotos.length} photos, AI=${!!enrichment} — ${duration}ms`);

    return Response.json({
      success: true,
      data: detail,
      source: "live",
      duration_ms: duration,
    }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("destination-details error:", err);
    return Response.json({
      success: false,
      error: (err as Error).message || "Internal error",
      duration_ms: Date.now() - startTime,
    }, { status: 500, headers: corsHeaders });
  }
});
