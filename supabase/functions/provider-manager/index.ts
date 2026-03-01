/**
 * PROVIDER MANAGER EDGE FUNCTION
 * 
 * Core infrastructure for connecting to multiple travel providers.
 * Handles routing, execution, normalization, and aggregation.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import * as amadeus from '../_shared/providers/amadeus.ts'
import * as kiwi from '../_shared/providers/kiwi.ts'
import * as expedia from '../_shared/providers/expedia.ts'

// Types
interface ProviderManagerRequest {
  action: 'search' | 'get_offer' | 'book' | 'cancel' | 'health_check'
  category: 'flights' | 'hotels' | 'cars' | 'experiences' | 'packages'
  params: Record<string, unknown>
  userId?: string
  sessionId?: string
  preferences?: UserPreferences
}

interface UserPreferences {
  budgetLevel?: 'budget' | 'mid_range' | 'luxury'
  travelStyle?: string
  preferredAirlines?: string[]
  preferredHotelChains?: string[]
}

interface Provider {
  id: string
  provider_code: string
  provider_name: string
  supports_flights: boolean
  supports_hotels: boolean
  supports_cars: boolean
  supports_experiences: boolean
  priority: number
  health_score: number
  enabled: boolean
  cost_per_search: number
  strong_regions: string[]
  coverage_regions: string[]
  avg_response_time_ms: number
  consecutive_failures: number
}

interface ProviderScore {
  providerId: string
  providerCode: string
  totalScore: number
  breakdown: {
    geographic: number
    category: number
    preference: number
    performance: number
    cost: number
    ruleBoost: number
  }
  eligible: boolean
}

interface RoutingRule {
  id: string
  rule_name: string
  conditions: Record<string, string>
  provider_code: string
  provider_priority_boost: number
  provider_priority_penalty: number
  enabled: boolean
}

// Configuration
const CONFIG = {
  routing: {
    minScoreThreshold: 25,
    maxProvidersParallel: 3,
    maxProvidersComprehensive: 5,
  },
  execution: {
    defaultTimeoutMs: 8000,
    bookingTimeoutMs: 30000,
    maxRetries: 3,
    retryBaseDelayMs: 1000,
  },
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 3,
    openDurationMs: 60000,
  },
  caching: {
    enabled: true,
    searchTtlSeconds: 300,
    offerTtlSeconds: 900,
  },
  budget: {
    dailyLimit: 50,
    monthlyLimit: 1000,
    alertThreshold: 0.8,
  },
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    const body: ProviderManagerRequest = await req.json()
    const { action, category, params, userId, sessionId, preferences } = body

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Route based on action
    let result: unknown

    switch (action) {
      case 'search':
        result = await handleSearch({
          requestId,
          category,
          params,
          userId,
          sessionId,
          preferences,
          supabase,
        })
        break

      case 'get_offer':
        result = await handleGetOffer({
          requestId,
          offerId: params.offerId as string,
          providerCode: params.providerCode as string,
          category,
          supabase,
        })
        break

      case 'health_check':
        result = await handleHealthCheck({
          providerId: params.providerId as string,
          supabase,
        })
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        requestId,
        duration: Date.now() - startTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Provider Manager Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: (error as { code?: string }).code || 'INTERNAL_ERROR',
          message: (error as Error).message || 'An unexpected error occurred',
        },
        requestId,
        duration: Date.now() - startTime,
      }),
      {
        status: (error as { status?: number }).status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// ============================================
// SEARCH HANDLER
// ============================================

async function handleSearch(context: {
  requestId: string
  category: string
  params: Record<string, unknown>
  userId?: string
  sessionId?: string
  preferences?: UserPreferences
  supabase: ReturnType<typeof createClient>
}) {
  const { requestId, category, params, userId, sessionId, preferences, supabase } = context

  // 1. Check cache first
  const cacheKey = generateCacheKey(category, params)
  const cached = await checkCache(supabase, cacheKey)
  if (cached && !params.refresh) {
    return {
      results: cached.results,
      totalCount: cached.result_count,
      providers: cached.providers_used,
      sessionId: cached.id,
      source: 'cache',
    }
  }

  // 2. Get provider scores
  const providerScores = await scoreProviders(supabase, category, params, preferences)

  // 3. Select providers based on strategy
  const strategy = (params.strategy as string) || 'price_compare'
  const selectedProviders = selectProviders(providerScores, strategy)

  if (selectedProviders.length === 0) {
    throw {
      code: 'NO_PROVIDERS_AVAILABLE',
      message: 'No healthy providers available for this search',
      status: 503,
    }
  }

  // 4. Check budget
  const budgetStatus = await checkBudget(supabase)
  if (!budgetStatus.allowed) {
    throw {
      code: 'BUDGET_EXCEEDED',
      message: 'API budget has been exceeded',
      status: 503,
    }
  }

  // 5. Execute search across providers (mock for now - real implementation would call provider APIs)
  const results = await executeSearch(supabase, selectedProviders, category, params, {
    requestId,
    sessionId,
    userId,
    timeout: CONFIG.execution.defaultTimeoutMs,
  })

  // 6. Log the search
  await logProviderCalls(supabase, requestId, selectedProviders, category, results)

  // 7. Cache results (only if we have results - don't cache empty)
  const newSessionId = sessionId || crypto.randomUUID()
  if (results.items.length > 0) {
    await cacheResults(supabase, cacheKey, category, params, results, selectedProviders.map(p => p.providerCode))
  }

  // 8. Update cost tracking
  await updateCostTracking(supabase, selectedProviders.length)

  return {
    results: results.items,
    totalCount: results.totalCount,
    providers: selectedProviders.map(p => ({
      code: p.providerCode,
      name: p.providerCode,
      responseTimeMs: results.responseTimeMs,
    })),
    sessionId: newSessionId,
    source: 'live',
    priceRange: results.priceRange,
  }
}

// ============================================
// ROUTING ENGINE
// ============================================

async function scoreProviders(
  supabase: ReturnType<typeof createClient>,
  category: string,
  params: Record<string, unknown>,
  preferences?: UserPreferences
): Promise<ProviderScore[]> {
  // Get providers for this category
  const categoryColumn = `supports_${category}`
  const { data: providers, error } = await supabase
    .from('api_providers')
    .select('*')
    .eq('enabled', true)
    .eq(categoryColumn, true)

  if (error || !providers) {
    console.error('Error fetching providers:', error)
    return []
  }

  // Get routing rules
  const { data: rules } = await supabase
    .from('routing_rules')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: false })

  const scores: ProviderScore[] = []

  for (const provider of providers as Provider[]) {
    const score = calculateProviderScore(provider, category, params, preferences, rules || [])
    scores.push(score)
  }

  // Sort by score descending
  scores.sort((a, b) => b.totalScore - a.totalScore)

  return scores
}

function calculateProviderScore(
  provider: Provider,
  category: string,
  params: Record<string, unknown>,
  preferences: UserPreferences | undefined,
  rules: RoutingRule[]
): ProviderScore {
  let geographic = 0
  let categoryScore = 0
  let preference = 0
  let performance = 0
  let cost = 0
  let ruleBoost = 0

  // Geographic scoring (0-30)
  // Handle both string destinations and object destinations (for hotels)
  let destinationStr = ''
  if (typeof params.destination === 'string') {
    destinationStr = params.destination
  } else if (params.destination && typeof params.destination === 'object') {
    const dest = params.destination as { value?: string; type?: string }
    destinationStr = typeof dest.value === 'string' ? dest.value : ''
  } else if (params.segments) {
    destinationStr = (params.segments as { destination: string }[])?.[0]?.destination || ''
  }
  const destinationRegion = determineRegion(destinationStr)

  if (provider.strong_regions?.includes(destinationRegion)) {
    geographic += 20
  } else if (provider.coverage_regions?.includes(destinationRegion)) {
    geographic += 12
  }
  geographic = Math.min(geographic, 30)

  // Category strength (0-25)
  categoryScore = provider.priority > 70 ? 20 : provider.priority > 50 ? 15 : 10
  categoryScore = Math.min(categoryScore, 25)

  // User preference alignment (0-20)
  if (preferences?.budgetLevel === 'budget' && provider.provider_code === 'kiwi') {
    preference += 12
  } else if (preferences?.budgetLevel === 'luxury' && provider.provider_code === 'amadeus') {
    preference += 10
  }
  preference = Math.min(preference, 20)

  // Historical performance (0-15)
  performance = (provider.health_score / 100) * 8
  if (provider.consecutive_failures > 0) {
    performance -= Math.min(provider.consecutive_failures * 3, 10)
  }
  if (provider.avg_response_time_ms > 2000) {
    performance -= 3
  } else if (provider.avg_response_time_ms < 500) {
    performance += 2
  }
  performance = Math.max(0, Math.min(performance, 15))

  // Cost efficiency (0-10)
  const maxCost = 0.05
  if (provider.cost_per_search <= maxCost) {
    cost = 10 - (provider.cost_per_search / maxCost) * 10
  }

  // Apply routing rules
  for (const rule of rules) {
    if (ruleMatches(rule, category, params, preferences)) {
      if (rule.provider_code === provider.provider_code) {
        ruleBoost += rule.provider_priority_boost || 0
        ruleBoost -= rule.provider_priority_penalty || 0
      }
    }
  }

  const totalScore = geographic + categoryScore + preference + performance + cost + ruleBoost

  return {
    providerId: provider.id,
    providerCode: provider.provider_code,
    totalScore,
    breakdown: {
      geographic,
      category: categoryScore,
      preference,
      performance,
      cost,
      ruleBoost,
    },
    eligible: totalScore >= CONFIG.routing.minScoreThreshold && provider.enabled && provider.health_score >= 30,
  }
}

function determineRegion(location: string): string {
  const regionMap: Record<string, string> = {
    'JFK': 'north_america', 'LAX': 'north_america', 'ORD': 'north_america',
    'SFO': 'north_america', 'MIA': 'north_america', 'DFW': 'north_america',
    'LHR': 'europe', 'CDG': 'europe', 'FRA': 'europe', 'AMS': 'europe',
    'MAD': 'europe', 'FCO': 'europe', 'BCN': 'europe', 'MUC': 'europe',
    'NRT': 'asia', 'HND': 'asia', 'PEK': 'asia', 'PVG': 'asia',
    'HKG': 'asia', 'SIN': 'asia', 'BKK': 'asia', 'ICN': 'asia',
    'DXB': 'middle_east', 'DOH': 'middle_east', 'AUH': 'middle_east',
    'GRU': 'south_america', 'EZE': 'south_america', 'BOG': 'south_america',
    'JNB': 'africa', 'CAI': 'africa', 'CPT': 'africa',
    'SYD': 'oceania', 'MEL': 'oceania', 'AKL': 'oceania',
  }

  const code = location.toUpperCase().substring(0, 3)
  return regionMap[code] || 'other'
}

function ruleMatches(
  rule: RoutingRule,
  category: string,
  params: Record<string, unknown>,
  preferences?: UserPreferences
): boolean {
  const conditions = rule.conditions

  if (conditions.category && conditions.category !== category) {
    return false
  }
  if (conditions.user_budget && conditions.user_budget !== preferences?.budgetLevel) {
    return false
  }

  return true
}

function selectProviders(
  scores: ProviderScore[],
  strategy: string
): { providerId: string; providerCode: string; score: number; isPrimary: boolean }[] {
  const eligible = scores.filter(s => s.eligible)

  switch (strategy) {
    case 'single':
      return eligible.slice(0, 1).map(s => ({
        providerId: s.providerId,
        providerCode: s.providerCode,
        score: s.totalScore,
        isPrimary: true,
      }))

    case 'comprehensive':
      return eligible.slice(0, CONFIG.routing.maxProvidersComprehensive).map((s, i) => ({
        providerId: s.providerId,
        providerCode: s.providerCode,
        score: s.totalScore,
        isPrimary: i === 0,
      }))

    case 'price_compare':
    default:
      return eligible.slice(0, CONFIG.routing.maxProvidersParallel).map((s, i) => ({
        providerId: s.providerId,
        providerCode: s.providerCode,
        score: s.totalScore,
        isPrimary: i === 0,
      }))
  }
}

// ============================================
// EXECUTION
// ============================================

async function executeSearch(
  _supabase: ReturnType<typeof createClient>,
  providers: { providerId: string; providerCode: string }[],
  category: string,
  params: Record<string, unknown>,
  context: { requestId: string; sessionId?: string; userId?: string; timeout: number }
): Promise<{ items: unknown[]; totalCount: number; responseTimeMs: number; priceRange?: { min: number; max: number } }> {
  const startTime = Date.now()
  
  try {
    switch (category) {
      case 'flights':
        return await executeFlightSearch(providers, params, startTime)
        
      case 'hotels':
        return await executeHotelSearch(providers, params, startTime)
        
      case 'cars':
        // Cars not yet implemented with direct adapters
        return {
          items: generateMockResults(category, params),
          totalCount: 1,
          responseTimeMs: Date.now() - startTime,
        }
        
      case 'experiences':
        // Experiences not yet implemented with direct adapters
        return {
          items: generateMockResults(category, params),
          totalCount: 1,
          responseTimeMs: Date.now() - startTime,
        }
        
      default:
        return {
          items: [],
          totalCount: 0,
          responseTimeMs: Date.now() - startTime,
        }
    }
    
  } catch (error) {
    console.error(`Error in ${category} search:`, error)
    return {
      items: [],
      totalCount: 0,
      responseTimeMs: Date.now() - startTime,
    }
  }
}

// Execute flight search using provider adapters directly
async function executeFlightSearch(
  providers: { providerId: string; providerCode: string }[],
  params: Record<string, unknown>,
  startTime: number
): Promise<{ items: unknown[]; totalCount: number; responseTimeMs: number; priceRange?: { min: number; max: number } }> {
  
  // Build search params for adapters
  const searchParams = {
    segments: (params.segments as Array<{ origin: string; destination: string; departureDate: string }>) || [{
      origin: (params.origin || params.originCode) as string,
      destination: (params.destination || params.destinationCode) as string,
      departureDate: (params.departureDate || params.outboundDate) as string,
    }],
    travelers: (params.travelers as { adults: number; children?: number; infants?: number }) || {
      adults: (params.adults as number) || 1,
      children: (params.children as number) || 0,
      infants: (params.infants as number) || 0,
    },
    tripType: (params.tripType as string) || 'one_way',
    cabinClass: (params.cabinClass as string) || 'economy',
    currency: (params.currency as string) || 'USD',
    limit: (params.limit as number) || 50,
  }
  
  // Add return segment for round trips
  if (params.returnDate) {
    searchParams.segments.push({
      origin: (params.destination || params.destinationCode) as string,
      destination: (params.origin || params.originCode) as string,
      departureDate: params.returnDate as string,
    })
    searchParams.tripType = 'round_trip'
  }
  
  console.log(`Executing flight search with params:`, JSON.stringify(searchParams).substring(0, 200))
  
  // Call providers in parallel based on selected providers
  const providerCodes = providers.map(p => p.providerCode)
  const searchPromises: Promise<unknown[]>[] = []
  
  // Always try both Amadeus and Kiwi for flights (per Doc 7 routing)
  // In production, this would be based on provider scoring
  if (providerCodes.includes('amadeus') || providerCodes.length === 0) {
    searchPromises.push(
      amadeus.searchFlights(searchParams)
        .then(results => {
          console.log(`Amadeus returned ${results.length} flights`)
          return results
        })
        .catch(err => {
          console.error('Amadeus search error:', err.message)
          return []
        })
    )
  }
  
  if (providerCodes.includes('kiwi') || providerCodes.length === 0) {
    searchPromises.push(
      kiwi.searchFlights(searchParams)
        .then(results => {
          console.log(`Kiwi returned ${results.length} flights`)
          return results
        })
        .catch(err => {
          console.error('Kiwi search error:', err.message)
          return []
        })
    )
  }
  
  // Wait for all providers
  const results = await Promise.all(searchPromises)
  
  // Flatten and combine results
  const allFlights = results.flat() as Array<{ price: { amount: number } }>
  
  // Sort by price
  allFlights.sort((a, b) => a.price.amount - b.price.amount)
  
  // Calculate price range
  let priceRange: { min: number; max: number } | undefined
  if (allFlights.length > 0) {
    const prices = allFlights.map(f => f.price.amount)
    priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }
  }
  
  console.log(`Total flights from all providers: ${allFlights.length}`)
  
  return {
    items: allFlights,
    totalCount: allFlights.length,
    responseTimeMs: Date.now() - startTime,
    priceRange,
  }
}

// Execute hotel search using provider adapters directly
async function executeHotelSearch(
  providers: { providerId: string; providerCode: string }[],
  params: Record<string, unknown>,
  startTime: number
): Promise<{ items: unknown[]; totalCount: number; responseTimeMs: number; priceRange?: { min: number; max: number } }> {
  
  // Build search params for adapters
  const searchParams = {
    destination: params.destination as { type: string; value: string } || {
      type: 'city',
      value: 'Paris',
    },
    checkInDate: (params.checkInDate || params.checkin) as string,
    checkOutDate: (params.checkOutDate || params.checkout) as string,
    rooms: (params.rooms as Array<{ adults: number; children?: number; childrenAges?: number[] }>) || [{
      adults: 2,
      children: 0,
      childrenAges: [],
    }],
    currency: (params.currency as string) || 'USD',
    language: (params.language as string) || 'en-US',
    limit: (params.limit as number) || 15,
  }
  
  console.log(`Executing hotel search with params:`, JSON.stringify(searchParams).substring(0, 200))
  
  // Call Booking.com adapter (via expedia module which now uses Booking.com RapidAPI)
  const providerCodes = providers.map(p => p.providerCode)
  
  try {
    // Use Booking.com for hotel searches
    const results = await expedia.searchHotels(searchParams)
    
    console.log(`Booking.com returned ${results.length} hotels`)
    
    // Calculate price range
    let priceRange: { min: number; max: number } | undefined
    if (results.length > 0) {
      const prices = results.map(h => h.lowestPrice?.amount || 0).filter(p => p > 0)
      if (prices.length > 0) {
        priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices),
        }
      }
    }
    
    return {
      items: results,
      totalCount: results.length,
      responseTimeMs: Date.now() - startTime,
      priceRange,
    }
  } catch (error) {
    console.error('Hotel search error:', error)
    return {
      items: [],
      totalCount: 0,
      responseTimeMs: Date.now() - startTime,
    }
  }
}

function generateMockResults(category: string, params: Record<string, unknown>): unknown[] {
  // Generate mock results for testing
  // Real implementation would call actual provider APIs
  
  switch (category) {
    case 'flights':
      return [{
        id: 'mock-flight-1',
        type: 'flight',
        provider: { code: 'amadeus', name: 'Amadeus' },
        price: { amount: 450, currency: 'USD', formatted: '$450.00' },
        tripType: 'round_trip',
        totalStops: 1,
        totalDurationMinutes: 480,
      }]
    
    case 'hotels':
      return [{
        id: 'mock-hotel-1',
        type: 'hotel',
        provider: { code: 'expedia', name: 'Expedia' },
        name: 'Sample Hotel',
        starRating: 4,
        lowestPrice: { amount: 150, currency: 'USD', formatted: '$150.00' },
      }]
    
    case 'cars':
      return [{
        id: 'mock-car-1',
        type: 'car',
        provider: { code: 'cartrawler', name: 'Cartrawler' },
        vehicle: { name: 'Economy Car', category: 'economy' },
        price: { amount: 45, currency: 'USD', formatted: '$45.00' },
      }]
    
    case 'experiences':
      return [{
        id: 'mock-experience-1',
        type: 'experience',
        provider: { code: 'getyourguide', name: 'GetYourGuide' },
        title: 'City Walking Tour',
        price: { amount: 35, currency: 'USD', formatted: '$35.00' },
      }]
    
    default:
      return []
  }
}

// ============================================
// CACHING
// ============================================

function generateCacheKey(category: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, unknown>)

  const hash = btoa(JSON.stringify({ category, params: sortedParams }))
  return `search:${category}:${hash.substring(0, 64)}`
}

async function checkCache(
  supabase: ReturnType<typeof createClient>,
  cacheKey: string
): Promise<{ results: unknown; result_count: number; providers_used: string[]; id: string } | null> {
  if (!CONFIG.caching.enabled) return null

  const { data } = await supabase
    .from('search_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (data) {
    // Update hit count
    await supabase
      .from('search_cache')
      .update({ hit_count: (data.hit_count || 0) + 1, last_hit_at: new Date().toISOString() })
      .eq('id', data.id)
  }

  return data
}

async function cacheResults(
  supabase: ReturnType<typeof createClient>,
  cacheKey: string,
  category: string,
  params: Record<string, unknown>,
  results: { items: unknown[]; totalCount: number },
  providersUsed: string[]
): Promise<void> {
  if (!CONFIG.caching.enabled) return

  const expiresAt = new Date(Date.now() + CONFIG.caching.searchTtlSeconds * 1000)

  await supabase.from('search_cache').upsert({
    cache_key: cacheKey,
    category,
    search_params: params,
    results: results.items,
    result_count: results.totalCount,
    providers_used: providersUsed,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
  }, {
    onConflict: 'cache_key',
  })
}

// ============================================
// BUDGET & COST TRACKING
// ============================================

async function checkBudget(supabase: ReturnType<typeof createClient>): Promise<{ allowed: boolean; dailyRemaining: number; monthlyRemaining: number; alertTriggered: boolean }> {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  // Get daily spend
  const { data: dailyCosts } = await supabase
    .from('provider_costs')
    .select('total_cost')
    .eq('period_type', 'daily')
    .eq('period_start', today)

  const dailySpent = dailyCosts?.reduce((sum, c) => sum + (c.total_cost || 0), 0) || 0

  // Get monthly spend
  const { data: monthlyCosts } = await supabase
    .from('provider_costs')
    .select('total_cost')
    .eq('period_type', 'monthly')
    .eq('period_start', monthStart)

  const monthlySpent = monthlyCosts?.reduce((sum, c) => sum + (c.total_cost || 0), 0) || 0

  const dailyRemaining = CONFIG.budget.dailyLimit - dailySpent
  const monthlyRemaining = CONFIG.budget.monthlyLimit - monthlySpent
  const allowed = dailyRemaining > 0 && monthlyRemaining > 0

  const alertTriggered =
    dailySpent / CONFIG.budget.dailyLimit >= CONFIG.budget.alertThreshold ||
    monthlySpent / CONFIG.budget.monthlyLimit >= CONFIG.budget.alertThreshold

  return { allowed, dailyRemaining, monthlyRemaining, alertTriggered }
}

async function updateCostTracking(
  supabase: ReturnType<typeof createClient>,
  searchCount: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  // Estimate cost (average across providers)
  const estimatedCost = searchCount * 0.01 // $0.01 per search average

  await supabase.from('provider_costs').upsert({
    period_type: 'daily',
    period_start: today,
    period_end: tomorrow,
    search_calls: searchCount,
    search_cost: estimatedCost,
    total_cost: estimatedCost,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'provider_id,period_type,period_start',
    ignoreDuplicates: false,
  })
}

// ============================================
// LOGGING
// ============================================

async function logProviderCalls(
  supabase: ReturnType<typeof createClient>,
  requestId: string,
  providers: { providerId: string; providerCode: string }[],
  category: string,
  results: { responseTimeMs: number }
): Promise<void> {
  const logs = providers.map((provider, index) => ({
    request_id: requestId,
    provider_id: provider.providerId,
    provider_code: provider.providerCode,
    request_type: 'search',
    category,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    response_time_ms: results.responseTimeMs,
    success: true,
    was_fallback: index > 0,
  }))

  await supabase.from('provider_logs').insert(logs)
}

// ============================================
// OTHER HANDLERS
// ============================================

async function handleGetOffer(context: {
  requestId: string
  offerId: string
  providerCode: string
  category: string
  supabase: ReturnType<typeof createClient>
}) {
  // Placeholder for offer retrieval
  return {
    offerId: context.offerId,
    provider: context.providerCode,
    valid: true,
    message: 'Offer details would be fetched from provider',
  }
}

async function handleHealthCheck(context: {
  providerId: string
  supabase: ReturnType<typeof createClient>
}) {
  const { data: provider } = await context.supabase
    .from('api_providers')
    .select('*')
    .eq('id', context.providerId)
    .single()

  if (!provider) {
    throw { code: 'PROVIDER_NOT_FOUND', message: 'Provider not found', status: 404 }
  }

  // Log health check
  await context.supabase.from('provider_health_checks').insert({
    provider_id: context.providerId,
    check_type: 'ping',
    success: true,
    response_time_ms: 50,
    status_code: 200,
  })

  return {
    providerId: context.providerId,
    providerCode: provider.provider_code,
    healthy: true,
    healthScore: provider.health_score,
  }
}
