/**
 * HOMEPAGE EDGE FUNCTION
 * 
 * Serves personalized homepage content with sub-200ms response times.
 * Implements cold/warm/hot start strategies based on user interaction count.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuration
const CONFIG = {
  personalization: {
    coldStartThreshold: 3,
    warmStartThreshold: 20,
  },
  scoring: {
    relevance: 30,
    budget: 20,
    interests: 20,
    proximity: 15,
    seasonal: 10,
    popularity: 5,
  },
  location: {
    nearbyRadiusKm: 500,
  },
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Parse request
    const url = new URL(req.url)
    const userId = url.searchParams.get('user_id')
    const lat = url.searchParams.get('lat')
    const lng = url.searchParams.get('lng')
    const refresh = url.searchParams.get('refresh') === 'true'

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Build user context
    const context = await buildUserContext(supabase, userId, lat, lng)

    // Generate sections based on strategy
    const sections = await generateSections(supabase, context)

    const responseTimeMs = Date.now() - startTime

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sections,
          meta: {
            userId: context.userId,
            personalizationScore: context.confidenceScore,
            strategyUsed: context.strategyType,
            sectionsReturned: sections.length,
            totalItemsReturned: sections.reduce((sum: number, s: any) => sum + s.items.length, 0),
            generatedAt: new Date().toISOString(),
            cacheHit: false,
            responseTimeMs,
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Homepage API Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================
// CONTEXT BUILDER
// ============================================

interface UserContext {
  userId: string
  isAuthenticated: boolean
  preferences: any | null
  interactions: any[]
  interactionCount: number
  savedItems: any[]
  location: { latitude: number; longitude: number } | null
  currentSeason: string
  confidenceScore: number
  strategyType: 'cold' | 'warm' | 'hot'
}

async function buildUserContext(
  supabase: any,
  userId: string,
  lat: string | null,
  lng: string | null
): Promise<UserContext> {
  // Fetch user data in parallel
  const [preferencesResult, interactionsResult, savedItemsResult] = await Promise.all([
    supabase.from('travel_preferences').select('*').eq('user_id', userId).single(),
    supabase.from('user_interactions').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(100),
    supabase.from('user_saved_items').select('*').eq('user_id', userId),
  ])

  const preferences = preferencesResult.data
  const interactions = interactionsResult.data || []
  const savedItems = savedItemsResult.data || []
  const interactionCount = interactions.length

  // Determine strategy
  let strategyType: 'cold' | 'warm' | 'hot'
  if (interactionCount < CONFIG.personalization.coldStartThreshold) {
    strategyType = 'cold'
  } else if (interactionCount < CONFIG.personalization.warmStartThreshold) {
    strategyType = 'warm'
  } else {
    strategyType = 'hot'
  }

  // Calculate confidence score
  let confidenceScore = 0
  if (preferences) {
    if (preferences.travel_style) confidenceScore += 15
    if (preferences.interests?.length > 0) confidenceScore += 15
    if (preferences.budget_level) confidenceScore += 10
  }
  confidenceScore += Math.min(interactionCount * 2, 40)
  confidenceScore += Math.min(savedItems.length * 3, 20)

  // Get current season based on latitude
  const latitude = lat ? parseFloat(lat) : 40
  const currentSeason = getCurrentSeason(latitude)

  return {
    userId,
    isAuthenticated: true,
    preferences,
    interactions,
    interactionCount,
    savedItems,
    location: lat && lng ? { latitude: parseFloat(lat), longitude: parseFloat(lng) } : null,
    currentSeason,
    confidenceScore: Math.min(confidenceScore, 100),
    strategyType,
  }
}

function getCurrentSeason(latitude: number): string {
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

// ============================================
// SECTION GENERATOR
// ============================================

async function generateSections(supabase: any, context: UserContext): Promise<any[]> {
  const sections: any[] = []
  const savedItemIds = new Set(context.savedItems.map((s: any) => s.destination_id))

  // Fetch all destinations once
  const { data: allDestinations } = await supabase
    .from('curated_destinations')
    .select('*')
    .eq('status', 'published')
    .order('priority', { ascending: false })

  if (!allDestinations) return sections

  // Score and rank destinations
  const scoredDestinations = allDestinations.map((dest: any) => ({
    ...dest,
    matchScore: calculateMatchScore(dest, context),
    isSaved: savedItemIds.has(dest.id),
  }))

  // 1. For You / Personalized (if warm/hot start)
  if (context.strategyType !== 'cold') {
    const forYouItems = scoredDestinations
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 10)
      .map((d: any) => formatContentItem(d, context))

    if (forYouItems.length >= 3) {
      sections.push({
        id: 'for-you',
        slug: 'for-you',
        title: 'For You ✨',
        subtitle: 'Personalized picks based on your preferences',
        layoutType: 'horizontal_scroll',
        cardSize: 'large',
        items: forYouItems,
        itemCount: forYouItems.length,
        hasMore: true,
        isPersonalized: true,
        priority: 1,
      })
    }
  }

  // 2. Deals
  const dealItems = scoredDestinations
    .filter((d: any) => d.primary_category === 'deals' || d.is_featured)
    .slice(0, 10)
    .map((d: any) => formatContentItem(d, context))

  if (dealItems.length >= 3) {
    sections.push({
      id: 'deals',
      slug: 'deals',
      title: 'Hot Deals 🔥',
      subtitle: 'Limited-time offers just for you',
      layoutType: 'horizontal_scroll',
      cardSize: 'large',
      items: dealItems,
      itemCount: dealItems.length,
      hasMore: true,
      isPersonalized: false,
      priority: 2,
    })
  }

  // 3. Popular Destinations
  const popularItems = scoredDestinations
    .filter((d: any) => d.primary_category === 'popular' || d.popularity_score > 800)
    .sort((a: any, b: any) => b.popularity_score - a.popularity_score)
    .slice(0, 12)
    .map((d: any) => formatContentItem(d, context))

  if (popularItems.length >= 3) {
    sections.push({
      id: 'popular',
      slug: 'popular-destinations',
      title: 'Popular Destinations',
      subtitle: "Travelers' top picks this season",
      layoutType: 'horizontal_scroll',
      cardSize: 'medium',
      items: popularItems,
      itemCount: popularItems.length,
      hasMore: true,
      isPersonalized: false,
      priority: 3,
    })
  }

  // 4. Nearby (if location available)
  if (context.location) {
    const { data: nearbyData } = await supabase.rpc('destinations_within_radius', {
      user_lat: context.location.latitude,
      user_lng: context.location.longitude,
      radius_km: CONFIG.location.nearbyRadiusKm,
      max_results: 10,
    })

    if (nearbyData && nearbyData.length >= 3) {
      const nearbyItems = nearbyData.map((d: any) => ({
        ...formatContentItem(d, context),
        distanceKm: d.distance_km,
        distanceText: formatDistance(d.distance_km),
      }))

      sections.push({
        id: 'nearby',
        slug: 'near-you',
        title: 'Explore Near You 📍',
        subtitle: 'Discover amazing places nearby',
        layoutType: 'horizontal_scroll',
        cardSize: 'medium',
        items: nearbyItems,
        itemCount: nearbyItems.length,
        hasMore: true,
        isPersonalized: true,
        priority: 4,
      })
    }
  }

  // 5. Trending
  const trendingItems = scoredDestinations
    .filter((d: any) => d.is_trending)
    .slice(0, 10)
    .map((d: any) => formatContentItem(d, context))

  if (trendingItems.length >= 3) {
    sections.push({
      id: 'trending',
      slug: 'trending',
      title: 'Trending Now 📈',
      subtitle: 'What travelers are loving right now',
      layoutType: 'horizontal_scroll',
      cardSize: 'medium',
      items: trendingItems,
      itemCount: trendingItems.length,
      hasMore: true,
      isPersonalized: false,
      priority: 5,
    })
  }

  // 6. Editor's Choice
  const editorItems = scoredDestinations
    .filter((d: any) => d.is_featured && d.editor_rating >= 4.5)
    .sort((a: any, b: any) => (b.editor_rating || 0) - (a.editor_rating || 0))
    .slice(0, 8)
    .map((d: any) => formatContentItem(d, context))

  if (editorItems.length >= 3) {
    sections.push({
      id: 'editors-choice',
      slug: 'editors-choice',
      title: "Editor's Choice ✨",
      subtitle: 'Handpicked by our travel experts',
      layoutType: 'featured_large',
      cardSize: 'large',
      items: editorItems,
      itemCount: editorItems.length,
      hasMore: true,
      isPersonalized: false,
      priority: 6,
    })
  }

  // 7. Budget Friendly
  const budgetItems = scoredDestinations
    .filter((d: any) => d.budget_level <= 2)
    .sort((a: any, b: any) => (a.estimated_daily_budget_usd || 999) - (b.estimated_daily_budget_usd || 999))
    .slice(0, 10)
    .map((d: any) => formatContentItem(d, context))

  if (budgetItems.length >= 3) {
    sections.push({
      id: 'budget-friendly',
      slug: 'budget-friendly',
      title: 'Budget Friendly 💰',
      subtitle: "Amazing experiences that won't break the bank",
      layoutType: 'horizontal_scroll',
      cardSize: 'medium',
      items: budgetItems,
      itemCount: budgetItems.length,
      hasMore: true,
      isPersonalized: false,
      priority: 7,
    })
  }

  // 8. Luxury Escapes
  const luxuryItems = scoredDestinations
    .filter((d: any) => d.budget_level >= 4 || d.primary_category === 'luxury')
    .slice(0, 8)
    .map((d: any) => formatContentItem(d, context))

  if (luxuryItems.length >= 3) {
    sections.push({
      id: 'luxury',
      slug: 'luxury-escapes',
      title: 'Luxury Escapes 👑',
      subtitle: 'Indulge in extraordinary experiences',
      layoutType: 'horizontal_scroll',
      cardSize: 'large',
      items: luxuryItems,
      itemCount: luxuryItems.length,
      hasMore: true,
      isPersonalized: false,
      priority: 8,
    })
  }

  // 9. Adventure
  const adventureItems = scoredDestinations
    .filter((d: any) => d.primary_category === 'adventure' || d.travel_style?.includes('adventurer'))
    .slice(0, 10)
    .map((d: any) => formatContentItem(d, context))

  if (adventureItems.length >= 3) {
    sections.push({
      id: 'adventure',
      slug: 'adventure',
      title: 'Adventure Awaits 🏔️',
      subtitle: 'For the thrill seekers and explorers',
      layoutType: 'horizontal_scroll',
      cardSize: 'medium',
      items: adventureItems,
      itemCount: adventureItems.length,
      hasMore: true,
      isPersonalized: false,
      priority: 9,
    })
  }

  // 10. Beach & Islands
  const beachItems = scoredDestinations
    .filter((d: any) => d.primary_category === 'beach' || d.tags?.includes('beach'))
    .slice(0, 10)
    .map((d: any) => formatContentItem(d, context))

  if (beachItems.length >= 3) {
    sections.push({
      id: 'beach',
      slug: 'beach-islands',
      title: 'Beach & Islands 🏝️',
      subtitle: 'Sun, sand, and paradise found',
      layoutType: 'horizontal_scroll',
      cardSize: 'medium',
      items: beachItems,
      itemCount: beachItems.length,
      hasMore: true,
      isPersonalized: false,
      priority: 10,
    })
  }

  // 11. Family Friendly
  const familyItems = scoredDestinations
    .filter((d: any) => d.best_for?.includes('families') || d.primary_category === 'family')
    .slice(0, 10)
    .map((d: any) => formatContentItem(d, context))

  if (familyItems.length >= 3) {
    sections.push({
      id: 'family',
      slug: 'family-friendly',
      title: 'Family Adventures 👨‍👩‍👧‍👦',
      subtitle: 'Perfect destinations for the whole family',
      layoutType: 'horizontal_scroll',
      cardSize: 'medium',
      items: familyItems,
      itemCount: familyItems.length,
      hasMore: true,
      isPersonalized: false,
      priority: 11,
    })
  }

  // 12. Hidden Gems
  const hiddenGemItems = scoredDestinations
    .filter((d: any) => d.primary_category === 'off_beaten_path' || d.popularity_score < 700)
    .sort((a: any, b: any) => (b.editor_rating || 0) - (a.editor_rating || 0))
    .slice(0, 8)
    .map((d: any) => formatContentItem(d, context))

  if (hiddenGemItems.length >= 3) {
    sections.push({
      id: 'hidden-gems',
      slug: 'hidden-gems',
      title: 'Hidden Gems 💎',
      subtitle: 'Off-the-beaten-path discoveries',
      layoutType: 'horizontal_scroll',
      cardSize: 'medium',
      items: hiddenGemItems,
      itemCount: hiddenGemItems.length,
      hasMore: true,
      isPersonalized: false,
      priority: 12,
    })
  }

  // Sort by priority
  return sections.sort((a, b) => a.priority - b.priority)
}

// ============================================
// SCORING & FORMATTING
// ============================================

function calculateMatchScore(destination: any, context: UserContext): number {
  let score = 0
  const weights = CONFIG.scoring

  // Base popularity score (0-5 points)
  score += Math.min((destination.popularity_score || 0) / 200, 5) * (weights.popularity / 5)

  // Seasonal match (0-10 points)
  if (destination.seasons?.includes(context.currentSeason)) {
    score += weights.seasonal
  }

  // Budget match (0-20 points)
  if (context.preferences?.budget_level) {
    const budgetDiff = Math.abs((destination.budget_level || 3) - context.preferences.budget_level)
    score += Math.max(0, weights.budget - budgetDiff * 5)
  } else {
    score += weights.budget * 0.5 // Neutral score if no preference
  }

  // Travel style match (0-30 points)
  if (context.preferences?.travel_style && destination.travel_style) {
    const userStyles = Array.isArray(context.preferences.travel_style) 
      ? context.preferences.travel_style 
      : [context.preferences.travel_style]
    const destStyles = destination.travel_style || []
    const styleMatch = userStyles.some((s: string) => destStyles.includes(s))
    if (styleMatch) score += weights.relevance
  } else {
    score += weights.relevance * 0.3 // Partial score for cold start
  }

  // Interest match (0-20 points)
  if (context.preferences?.interests && destination.tags) {
    const userInterests = context.preferences.interests || []
    const destTags = destination.tags || []
    const matchCount = userInterests.filter((i: string) => destTags.includes(i)).length
    score += Math.min(matchCount * 5, weights.interests)
  }

  // Featured/trending boost
  if (destination.is_featured) score += 3
  if (destination.is_trending) score += 2

  return Math.min(Math.round(score), 100)
}

function formatContentItem(destination: any, context: UserContext): any {
  const savedItemIds = new Set(context.savedItems.map((s: any) => s.destination_id))

  return {
    id: destination.id,
    type: 'destination',
    title: destination.title,
    subtitle: destination.short_description || destination.city,
    imageUrl: destination.hero_image_url,
    thumbnailUrl: destination.thumbnail_url,
    price: destination.estimated_daily_budget_usd ? {
      amount: destination.estimated_daily_budget_usd,
      currency: 'USD',
      period: 'per_day',
      formatted: `$${destination.estimated_daily_budget_usd}/day`,
    } : null,
    rating: destination.editor_rating,
    location: {
      city: destination.city,
      country: destination.country,
      distanceKm: null,
      distanceText: null,
    },
    matchScore: destination.matchScore || 0,
    matchReasons: generateMatchReasons(destination, context),
    badges: generateBadges(destination),
    ctaText: 'Explore',
    ctaUrl: `/detail/${destination.id}`,
    isSaved: savedItemIds.has(destination.id),
    slug: destination.slug,
    budgetLevel: destination.budget_level,
    tags: destination.tags,
  }
}

function generateMatchReasons(destination: any, context: UserContext): string[] {
  const reasons: string[] = []

  if (destination.is_trending) reasons.push('Trending now')
  if (destination.is_featured) reasons.push("Editor's pick")
  if (destination.seasons?.includes(context.currentSeason)) reasons.push('Perfect for this season')
  if (destination.budget_level <= 2) reasons.push('Budget friendly')
  if (destination.budget_level >= 4) reasons.push('Luxury experience')
  if (destination.editor_rating >= 4.5) reasons.push('Highly rated')

  return reasons.slice(0, 3)
}

function generateBadges(destination: any): any[] {
  const badges: any[] = []

  if (destination.is_trending) {
    badges.push({ type: 'trending', text: 'Trending', color: '#FF6B35' })
  }
  if (destination.is_featured) {
    badges.push({ type: 'editors_choice', text: "Editor's Choice", color: '#8B5CF6' })
  }
  if (destination.budget_level <= 2) {
    badges.push({ type: 'deal', text: 'Great Value', color: '#10B981' })
  }

  return badges.slice(0, 2)
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`
  if (km < 100) return `${Math.round(km)}km away`
  return `${Math.round(km)}km`
}
