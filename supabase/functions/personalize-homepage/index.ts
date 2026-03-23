/**
 * PERSONALIZE-HOMEPAGE EDGE FUNCTION
 * 
 * Takes pre-computed section_cache data and personalizes it per-user:
 * 1. Builds a user profile from preferences + interactions + saved items
 * 2. Generates a "For You" section with explainable match reasons
 * 3. Re-ranks items within each section based on user affinity
 * 4. Dynamically reorders sections based on engagement patterns
 * 5. Applies location-aware and seasonal boosting
 * 
 * Called by homepageService after reading section_cache.
 * Returns personalized sections + meta with strategy info.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Configuration ───────────────────────────────────────────
const CONFIG = {
  thresholds: {
    cold: 3,   // < 3 interactions = cold start
    warm: 20,  // 3-19 = warm
    // 20+ = hot
  },
  forYou: {
    minItems: 5,
    maxItems: 12,
    minInteractions: 3, // Need at least 3 interactions to show "For You"
  },
  scoring: {
    // Weight multipliers for different signal types
    preferenceMatch: 25,
    interactionAffinity: 30,
    savedBoost: 15,
    locationProximity: 10,
    seasonalRelevance: 10,
    popularityBase: 5,
    diversityPenalty: 5,
  },
  sectionOrder: {
    // Default section priorities (lower = higher on page)
    'for-you': 0,
    'popular-destinations': 2,
    'places': 3,
    'trending': 4,
    'editors-choice': 5,
    'must-see': 6,
    'hidden-gems': 7,
    'budget-friendly': 8,
    'luxury-escapes': 9,
    'adventure': 10,
    'family-friendly': 11,
    'beach-islands': 12,
  } as Record<string, number>,
}

// ─── Types ───────────────────────────────────────────────────

interface UserProfile {
  userId: string
  strategy: 'cold' | 'warm' | 'hot'
  confidenceScore: number
  // From travel_preferences
  spendingStyle: string | null       // 'budget', 'midrange', 'luxury'
  tripStyles: string[]               // ['culture', 'adventure', 'shopping']
  interests: string[]                // ['art', 'nightlife', 'food']
  companionType: string | null       // 'solo', 'couple', 'family', 'friends'
  activityLevel: string | null       // 'relaxed', 'moderate', 'active'
  // Derived from interactions
  topSections: string[]              // sections user engages with most
  sectionEngagement: Record<string, number> // slug → engagement score
  viewedDestinationIds: Set<string>
  detailViewedIds: Set<string>
  savedDestinationIds: Set<string>
  preferredContinents: string[]      // continents user gravitates toward
  preferredCategories: string[]      // primary_categories user prefers
  preferredTags: string[]            // most-interacted tags
  budgetAffinity: number             // 1-5 derived from interaction patterns
  // Location & timing
  location: { lat: number; lng: number } | null
  currentSeason: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}

interface PersonalizedSection {
  id: string
  slug: string
  title: string
  subtitle: string | null
  layoutType: string
  cardSize: string
  items: any[]
  itemCount: number
  hasMore: boolean
  isPersonalized: boolean
  priority: number
}

// ─── Main Handler ────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const body = await req.json()
    const {
      user_id,
      sections: rawSections,
      lat,
      lng,
      timezone,
    } = body

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Build user profile
    const profile = await buildUserProfile(user_id, lat, lng, timezone)

    // 2. If cold start (< 3 interactions), return sections as-is with minimal tweaks
    if (profile.strategy === 'cold') {
      const coldSections = applyColdStartPersonalization(rawSections || [], profile)
      return respond(coldSections, profile, startTime)
    }

    // 3. Fetch full destination data for scoring (we need AI enrichment + tags)
    const allDestinations = await fetchDestinationsWithEnrichment()

    // 4. Generate "For You" section
    const forYouSection = generateForYouSection(allDestinations, profile)

    // 5. Re-rank items within each section
    const rerankedSections = rerankSectionItems(rawSections || [], allDestinations, profile)

    // 6. Reorder sections based on user engagement patterns
    const reorderedSections = reorderSections(rerankedSections, profile)

    // 7. Insert "For You" at top if generated
    const finalSections: PersonalizedSection[] = []
    if (forYouSection) {
      finalSections.push(forYouSection)
    }
    finalSections.push(...reorderedSections)

    return respond(finalSections, profile, startTime)

  } catch (error: any) {
    console.error('Personalization error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function respond(sections: any[], profile: UserProfile, startTime: number) {
  return new Response(
    JSON.stringify({
      success: true,
      sections,
      meta: {
        userId: profile.userId,
        strategy: profile.strategy,
        confidenceScore: profile.confidenceScore,
        topSections: profile.topSections,
        preferredCategories: profile.preferredCategories,
        sectionCount: sections.length,
        totalItems: sections.reduce((s: number, sec: any) => s + (sec.items?.length || 0), 0),
        responseTimeMs: Date.now() - startTime,
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// ─── 1. User Profile Builder ─────────────────────────────────

async function buildUserProfile(
  userId: string,
  lat?: number,
  lng?: number,
  timezone?: string
): Promise<UserProfile> {
  // Fetch all user data in parallel
  const [prefsResult, interactionsResult, savedResult] = await Promise.all([
    supabase.from('travel_preferences').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('user_interactions')
      .select('destination_id, interaction_type, source_category, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('user_saved_items')
      .select('destination_id')
      .eq('user_id', userId),
  ])

  const prefs = prefsResult.data
  const interactions = interactionsResult.data || []
  const savedItems = savedResult.data || []
  const interactionCount = interactions.length

  // Determine strategy
  let strategy: 'cold' | 'warm' | 'hot' = 'cold'
  if (interactionCount >= CONFIG.thresholds.warm) strategy = 'hot'
  else if (interactionCount >= CONFIG.thresholds.cold) strategy = 'warm'

  // Build engagement map: section_slug → weighted engagement score
  const sectionEngagement: Record<string, number> = {}
  const destinationEngagement: Record<string, number> = {}
  const viewedIds = new Set<string>()
  const detailViewedIds = new Set<string>()

  for (const ix of interactions) {
    const slug = ix.source_category || 'unknown'
    const destId = ix.destination_id

    // Weight by interaction type
    const weight = ix.interaction_type === 'detail_view' ? 5
      : ix.interaction_type === 'save' ? 8
      : ix.interaction_type === 'share' ? 6
      : 1 // view/impression

    // Time decay: interactions in last 7 days get full weight, older ones decay
    const ageMs = Date.now() - new Date(ix.created_at).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    const decay = ageDays < 7 ? 1.0 : ageDays < 30 ? 0.7 : 0.4

    const weightedScore = weight * decay

    sectionEngagement[slug] = (sectionEngagement[slug] || 0) + weightedScore

    if (destId) {
      destinationEngagement[destId] = (destinationEngagement[destId] || 0) + weightedScore
      viewedIds.add(destId)
      if (ix.interaction_type === 'detail_view') detailViewedIds.add(destId)
    }
  }

  const savedIds = new Set<string>(savedItems.map((s: any) => s.destination_id as string).filter(Boolean))

  // Top sections by engagement
  const topSections = Object.entries(sectionEngagement)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([slug]) => slug)

  // Derive preferred continents/categories/tags from top interacted destinations
  const topDestIds = Object.entries(destinationEngagement)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([id]) => id)

  let preferredContinents: string[] = []
  let preferredCategories: string[] = []
  let preferredTags: string[] = []
  let budgetAffinity = 3 // default midrange

  if (topDestIds.length > 0) {
    const { data: topDests } = await supabase
      .from('curated_destinations')
      .select('continent, primary_category, tags, budget_level')
      .in('id', topDestIds)

    if (topDests && topDests.length > 0) {
      // Count continent occurrences
      const continentCounts: Record<string, number> = {}
      const categoryCounts: Record<string, number> = {}
      const tagCounts: Record<string, number> = {}
      let budgetSum = 0
      let budgetCount = 0

      for (const d of topDests) {
        if (d.continent) continentCounts[d.continent] = (continentCounts[d.continent] || 0) + 1
        if (d.primary_category) categoryCounts[d.primary_category] = (categoryCounts[d.primary_category] || 0) + 1
        if (d.tags) {
          for (const t of d.tags) {
            tagCounts[t] = (tagCounts[t] || 0) + 1
          }
        }
        if (d.budget_level) {
          budgetSum += d.budget_level
          budgetCount++
        }
      }

      preferredContinents = Object.entries(continentCounts)
        .sort(([, a], [, b]) => b - a).slice(0, 3).map(([c]) => c)
      preferredCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a).slice(0, 4).map(([c]) => c)
      preferredTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a).slice(0, 8).map(([t]) => t)
      if (budgetCount > 0) budgetAffinity = Math.round(budgetSum / budgetCount)
    }
  }

  // Calculate confidence score
  let confidenceScore = 0
  if (prefs) {
    if (prefs.preferred_trip_styles?.length > 0) confidenceScore += 10
    if (prefs.interests?.length > 0) confidenceScore += 10
    if (prefs.spending_style) confidenceScore += 5
    if (prefs.default_companion_type) confidenceScore += 5
  }
  confidenceScore += Math.min(interactionCount * 1.5, 40)
  confidenceScore += Math.min(savedIds.size * 3, 15)
  confidenceScore += Math.min(detailViewedIds.size * 2, 15)
  confidenceScore = Math.min(Math.round(confidenceScore), 100)

  // Season and time of day
  const latitude = lat || 40
  const currentSeason = getSeason(latitude)
  const hour = getLocalHour(timezone)
  const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'

  return {
    userId,
    strategy,
    confidenceScore,
    spendingStyle: prefs?.spending_style || null,
    tripStyles: prefs?.preferred_trip_styles || [],
    interests: prefs?.interests || [],
    companionType: prefs?.default_companion_type || null,
    activityLevel: prefs?.activity_level || null,
    topSections,
    sectionEngagement,
    viewedDestinationIds: viewedIds,
    detailViewedIds,
    savedDestinationIds: savedIds,
    preferredContinents,
    preferredCategories,
    preferredTags,
    budgetAffinity,
    location: lat && lng ? { lat, lng } : null,
    currentSeason,
    timeOfDay,
  }
}

function getSeason(latitude: number): string {
  const month = new Date().getMonth() + 1
  const isNorthern = latitude >= 0
  if (isNorthern) {
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'fall'
    return 'winter'
  } else {
    if (month >= 3 && month <= 5) return 'fall'
    if (month >= 6 && month <= 8) return 'winter'
    if (month >= 9 && month <= 11) return 'spring'
    return 'summer'
  }
}

function getLocalHour(timezone?: string): number {
  try {
    if (timezone) {
      const now = new Date()
      const str = now.toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false })
      return parseInt(str, 10)
    }
  } catch { /* fall through */ }
  return new Date().getUTCHours()
}

// ─── 2. Fetch Destinations + AI Enrichment ───────────────────

async function fetchDestinationsWithEnrichment(): Promise<any[]> {
  const { data: destinations } = await supabase
    .from('curated_destinations')
    .select(`
      id, title, slug, city, country, continent, primary_category,
      tags, budget_level, best_for, travel_style, seasons,
      popularity_score, editor_rating, safety_rating,
      is_featured, is_trending, hero_image_url, thumbnail_url,
      short_description, estimated_daily_budget_usd, latitude, longitude
    `)
    .eq('status', 'published')

  if (!destinations || destinations.length === 0) return []

  // Fetch AI enrichment data
  const { data: enrichments } = await supabase
    .from('destination_ai_enrichment')
    .select('destination_id, section_tags, confidence_scores, generated_description, family_suitability, luxury_suitability, adventure_suitability')

  const enrichmentMap = new Map<string, any>()
  if (enrichments) {
    for (const e of enrichments) {
      enrichmentMap.set(e.destination_id, e)
    }
  }

  return destinations.map((d: any) => ({
    ...d,
    _ai: enrichmentMap.get(d.id) || null,
  }))
}

// ─── 3. Cold Start Personalization ───────────────────────────

function applyColdStartPersonalization(sections: any[], profile: UserProfile): any[] {
  // For cold start: just apply preference-based section reordering
  // If user set spending_style = 'budget', move budget-friendly up
  // If companion = 'family', move family-friendly up
  const reordered = [...sections]

  for (const sec of reordered) {
    sec.priority = CONFIG.sectionOrder[sec.slug] ?? sec.priority ?? 50
  }

  if (profile.spendingStyle === 'budget') {
    const budgetSec = reordered.find((s: any) => s.slug === 'budget-friendly')
    if (budgetSec) budgetSec.priority = 2
  } else if (profile.spendingStyle === 'luxury') {
    const luxSec = reordered.find((s: any) => s.slug === 'luxury-escapes')
    if (luxSec) luxSec.priority = 2
  }

  if (profile.companionType === 'family') {
    const famSec = reordered.find((s: any) => s.slug === 'family-friendly')
    if (famSec) famSec.priority = Math.min(famSec.priority, 3)
  }

  if (profile.tripStyles.includes('adventure')) {
    const advSec = reordered.find((s: any) => s.slug === 'adventure')
    if (advSec) advSec.priority = Math.min(advSec.priority, 4)
  }

  reordered.sort((a: any, b: any) => a.priority - b.priority)
  return reordered
}

// ─── 4. "For You" Section Generator ─────────────────────────

function generateForYouSection(
  allDestinations: any[],
  profile: UserProfile
): PersonalizedSection | null {
  if (profile.strategy === 'cold') return null

  // Score every destination for this user
  const scored = allDestinations.map(dest => ({
    dest,
    score: scoreDestination(dest, profile),
    reasons: buildMatchReasons(dest, profile),
  }))

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Filter: don't show destinations user already detail-viewed (they've seen them)
  // But DO show ones they only had impressions of (re-surface with personalized context)
  const filtered = scored.filter(s => !profile.detailViewedIds.has(s.dest.id))

  // Take top N
  const topPicks = filtered.slice(0, CONFIG.forYou.maxItems)
  if (topPicks.length < CONFIG.forYou.minItems) return null

  const items = topPicks.map(({ dest, score, reasons }) => formatForYouItem(dest, score, reasons, profile))

  return {
    id: 'for-you',
    slug: 'for-you',
    title: 'For You',
    subtitle: 'Personalized picks based on your interests',
    layoutType: 'horizontal_scroll',
    cardSize: 'large',
    items,
    itemCount: items.length,
    hasMore: true,
    isPersonalized: true,
    priority: 0, // Always first
  }
}

// ─── 5. Destination Scoring Engine ───────────────────────────

function scoreDestination(dest: any, profile: UserProfile): number {
  let score = 0
  const w = CONFIG.scoring

  // A) Preference match (0-25 pts)
  score += scorePreferenceMatch(dest, profile) * (w.preferenceMatch / 25)

  // B) Interaction affinity (0-30 pts) — how similar is this to what user has engaged with
  score += scoreInteractionAffinity(dest, profile) * (w.interactionAffinity / 30)

  // C) Saved-similar boost (0-15 pts) — similar to saved destinations
  score += scoreSavedSimilarity(dest, profile) * (w.savedBoost / 15)

  // D) Location proximity (0-10 pts)
  score += scoreLocationProximity(dest, profile) * (w.locationProximity / 10)

  // E) Seasonal relevance (0-10 pts)
  score += scoreSeasonalRelevance(dest, profile) * (w.seasonalRelevance / 10)

  // F) Base popularity (0-5 pts)
  score += Math.min((dest.popularity_score || 0) / 200, 5)

  // G) Featured/trending boost
  if (dest.is_featured) score += 2
  if (dest.is_trending) score += 1.5

  // H) Diversity penalty — slightly penalize if user already has many items from same continent
  // (encourages diverse recommendations)

  return Math.min(Math.round(score * 10) / 10, 100)
}

function scorePreferenceMatch(dest: any, profile: UserProfile): number {
  let pts = 0

  // Budget match
  if (profile.budgetAffinity > 0 && dest.budget_level) {
    const diff = Math.abs(dest.budget_level - profile.budgetAffinity)
    pts += Math.max(0, 8 - diff * 3) // 0 diff = 8pts, 1 diff = 5pts, 2 diff = 2pts
  }

  // Trip style match
  if (profile.tripStyles.length > 0 && dest.travel_style) {
    const destStyles = Array.isArray(dest.travel_style) ? dest.travel_style : [dest.travel_style]
    const overlap = profile.tripStyles.filter(s => destStyles.includes(s)).length
    pts += overlap * 4 // up to ~12pts for 3 style matches
  }

  // Interest/tag match
  if (profile.interests.length > 0 && dest.tags) {
    const overlap = profile.interests.filter((i: string) => dest.tags.includes(i)).length
    pts += overlap * 3
  }

  // Companion type match
  if (profile.companionType === 'family' && dest.best_for?.includes('families')) pts += 5
  if (profile.companionType === 'couple' && (dest.best_for?.includes('couples') || dest.primary_category === 'romantic')) pts += 5
  if (profile.companionType === 'solo' && dest.best_for?.includes('solo')) pts += 5

  return Math.min(pts, 25)
}

function scoreInteractionAffinity(dest: any, profile: UserProfile): number {
  let pts = 0

  // Category affinity: does user engage with this type of destination?
  if (profile.preferredCategories.includes(dest.primary_category)) {
    const rank = profile.preferredCategories.indexOf(dest.primary_category)
    pts += Math.max(0, 12 - rank * 3) // top category = 12pts, 2nd = 9pts, etc.
  }

  // Continent affinity
  if (profile.preferredContinents.includes(dest.continent)) {
    const rank = profile.preferredContinents.indexOf(dest.continent)
    pts += Math.max(0, 8 - rank * 3)
  }

  // Tag affinity: how many of dest's tags match user's preferred tags
  if (dest.tags && profile.preferredTags.length > 0) {
    const tagOverlap = dest.tags.filter((t: string) => profile.preferredTags.includes(t)).length
    pts += Math.min(tagOverlap * 2.5, 10)
  }

  return Math.min(pts, 30)
}

function scoreSavedSimilarity(dest: any, profile: UserProfile): number {
  // If the destination itself is saved, big boost (user explicitly expressed interest)
  if (profile.savedDestinationIds.has(dest.id)) return 15

  // No saved items to compare against
  if (profile.savedDestinationIds.size === 0) return 0

  // For now, a lighter signal: saved destinations share tags/category/continent with this one
  // Full implementation would compute embeddings; here we use tag/category overlap
  return 0 // Will be enhanced when we have saved destination details cached
}

function scoreLocationProximity(dest: any, profile: UserProfile): number {
  if (!profile.location || !dest.latitude || !dest.longitude) return 0

  const dist = haversineKm(profile.location.lat, profile.location.lng, dest.latitude, dest.longitude)

  // Nearby = strong boost, far = small boost for accessibility
  if (dist < 500) return 10
  if (dist < 1500) return 7
  if (dist < 3000) return 4
  if (dist < 6000) return 2
  return 0
}

function scoreSeasonalRelevance(dest: any, profile: UserProfile): number {
  if (!dest.seasons || dest.seasons.length === 0) return 3 // year-round = modest score
  if (dest.seasons.includes(profile.currentSeason)) return 10
  // Adjacent season
  const seasonOrder = ['spring', 'summer', 'fall', 'winter']
  const currentIdx = seasonOrder.indexOf(profile.currentSeason)
  const nextSeason = seasonOrder[(currentIdx + 1) % 4]
  if (dest.seasons.includes(nextSeason)) return 6
  return 1
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── 6. Match Reasons (Explainable Recommendations) ──────────

function buildMatchReasons(dest: any, profile: UserProfile): string[] {
  const reasons: string[] = []

  // Preference-based reasons
  if (profile.interests.length > 0 && dest.tags) {
    const matchedInterests = profile.interests.filter((i: string) => dest.tags.includes(i))
    if (matchedInterests.length > 0) {
      reasons.push(`Matches your interest in ${matchedInterests.slice(0, 2).join(' & ')}`)
    }
  }

  if (profile.tripStyles.length > 0 && dest.travel_style) {
    const destStyles = Array.isArray(dest.travel_style) ? dest.travel_style : [dest.travel_style]
    const matchedStyles = profile.tripStyles.filter(s => destStyles.includes(s))
    if (matchedStyles.length > 0) {
      const styleLabel = matchedStyles[0].charAt(0).toUpperCase() + matchedStyles[0].slice(1)
      reasons.push(`Fits your ${styleLabel} travel style`)
    }
  }

  // Budget match reason
  if (profile.budgetAffinity > 0 && dest.budget_level) {
    const diff = Math.abs(dest.budget_level - profile.budgetAffinity)
    if (diff === 0) reasons.push('Matches your budget perfectly')
    else if (diff === 1 && dest.budget_level < profile.budgetAffinity) reasons.push('Great value for your budget')
  }

  // Companion match
  if (profile.companionType === 'family' && dest.best_for?.includes('families')) {
    reasons.push('Great for families')
  }
  if (profile.companionType === 'couple' && (dest.best_for?.includes('couples') || dest.primary_category === 'romantic')) {
    reasons.push('Perfect for couples')
  }

  // Behavior-based reasons
  if (profile.preferredContinents[0] === dest.continent) {
    reasons.push(`You love exploring ${dest.continent}`)
  }

  if (profile.preferredCategories.includes(dest.primary_category)) {
    const catLabel = dest.primary_category.replace(/_/g, ' ')
    reasons.push(`Based on your ${catLabel} picks`)
  }

  // Saved similarity
  if (profile.savedDestinationIds.has(dest.id)) {
    reasons.push('In your saved list')
  }

  // Seasonal
  if (dest.seasons?.includes(profile.currentSeason)) {
    reasons.push('Perfect for this season')
  }

  // Location proximity
  if (profile.location && dest.latitude && dest.longitude) {
    const dist = haversineKm(profile.location.lat, profile.location.lng, dest.latitude, dest.longitude)
    if (dist < 500) reasons.push('Close to your location')
    else if (dist < 1500) reasons.push('Within easy reach')
  }

  // Generic quality signals (lower priority)
  if (reasons.length < 2) {
    if (dest.is_trending) reasons.push('Trending now')
    if (dest.is_featured) reasons.push("Editor's pick")
    if (dest.editor_rating >= 4.5) reasons.push('Highly rated')
  }

  return reasons.slice(0, 3)
}

// ─── 7. Format "For You" Item ────────────────────────────────

function formatForYouItem(dest: any, score: number, reasons: string[], profile: UserProfile): any {
  return {
    id: dest.id,
    type: 'destination',
    title: dest.title,
    subtitle: dest._ai?.generated_description || dest.short_description || dest.city,
    imageUrl: dest.hero_image_url,
    thumbnailUrl: dest.thumbnail_url,
    price: dest.estimated_daily_budget_usd ? {
      amount: dest.estimated_daily_budget_usd,
      currency: 'USD',
      period: 'per_day',
      formatted: `$${dest.estimated_daily_budget_usd}/day`,
    } : null,
    rating: dest.editor_rating,
    location: {
      city: dest.city,
      country: dest.country,
      distanceKm: null,
      distanceText: null,
    },
    matchScore: score,
    matchReasons: reasons,
    badges: buildBadges(dest),
    ctaText: 'Explore',
    ctaUrl: `/detail/${dest.id}`,
    isSaved: profile.savedDestinationIds.has(dest.id),
    slug: dest.slug,
    budgetLevel: dest.budget_level,
    tags: dest.tags,
    safetyRating: dest.safety_rating,
    bestFor: dest.best_for,
  }
}

function buildBadges(dest: any): any[] {
  const badges: any[] = []
  if (dest.is_trending) badges.push({ type: 'trending', text: 'Trending', color: '#FF6B35' })
  if (dest.is_featured) badges.push({ type: 'editors_choice', text: "Editor's Choice", color: '#8B5CF6' })
  if (dest.budget_level <= 2) badges.push({ type: 'deal', text: 'Great Value', color: '#10B981' })
  return badges.slice(0, 2)
}

// ─── 8. Re-rank Items Within Sections ────────────────────────

function rerankSectionItems(
  sections: any[],
  allDestinations: any[],
  profile: UserProfile
): any[] {
  // Build a lookup of destination data by ID for scoring
  const destMap = new Map<string, any>()
  for (const d of allDestinations) {
    destMap.set(d.id, d)
  }

  return sections.map((section: any) => {
    const items = section.items || []
    if (items.length <= 1) return section

    // Score each item and re-sort
    const scored = items.map((item: any) => {
      const fullDest = destMap.get(item.id)
      const score = fullDest ? scoreDestination(fullDest, profile) : (item.matchScore || 0)
      const reasons = fullDest ? buildMatchReasons(fullDest, profile) : (item.matchReasons || [])
      return {
        ...item,
        matchScore: score,
        matchReasons: reasons.length > 0 ? reasons : item.matchReasons,
        isSaved: profile.savedDestinationIds.has(item.id),
      }
    })

    // Sort by personalized score (descending)
    scored.sort((a: any, b: any) => b.matchScore - a.matchScore)

    return {
      ...section,
      items: scored,
      isPersonalized: true,
    }
  })
}

// ─── 9. Section Order Personalization ────────────────────────

function reorderSections(sections: any[], profile: UserProfile): any[] {
  const reordered = sections.map((section: any) => {
    let priority = CONFIG.sectionOrder[section.slug] ?? section.priority ?? 50

    // Boost sections user engages with most
    const engagement = profile.sectionEngagement[section.slug] || 0
    if (engagement > 0) {
      // Top engaged section gets -3 priority boost, second gets -2, etc.
      const engagementRank = profile.topSections.indexOf(section.slug)
      if (engagementRank >= 0) {
        priority -= Math.max(0, 3 - engagementRank) // top = -3, 2nd = -2, 3rd = -1
      }
    }

    // Spending style: budget users see budget-friendly higher, luxury users see luxury higher
    if (profile.spendingStyle === 'budget' && section.slug === 'budget-friendly') {
      priority = Math.min(priority, 2)
    } else if (profile.spendingStyle === 'luxury' && section.slug === 'luxury-escapes') {
      priority = Math.min(priority, 2)
    }

    // Family companion → family section higher
    if (profile.companionType === 'family' && section.slug === 'family-friendly') {
      priority = Math.min(priority, 3)
    }

    // Active activity level → adventure higher
    if (profile.activityLevel === 'active' && section.slug === 'adventure') {
      priority = Math.min(priority, 3)
    }

    // Trip style boosts
    if (profile.tripStyles.includes('adventure') && section.slug === 'adventure') {
      priority = Math.min(priority, 4)
    }
    if (profile.tripStyles.includes('culture') && section.slug === 'hidden-gems') {
      priority = Math.min(priority, 5)
    }

    return { ...section, priority }
  })

  reordered.sort((a: any, b: any) => a.priority - b.priority)
  return reordered
}
