/**
 * COMPUTE TRAVEL DNA — Edge Function
 *
 * Computes or recomputes the user_travel_dna profile for one or all active users.
 * This is the brain of the GIL (Guidera Intelligence Layer).
 *
 * Triggers:
 *  - POST { user_id } → compute for a single user
 *  - POST { batch: true } → batch recompute all active users
 *  - Called by scheduled-jobs on daily cron
 *  - Called on preference update / significant activity
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// AIRPORT LOOKUP — Static city → IATA mapping
// ============================================

const CITY_TO_AIRPORT: Record<string, string> = {
  // North America
  'new york': 'JFK', 'los angeles': 'LAX', 'chicago': 'ORD', 'houston': 'IAH',
  'phoenix': 'PHX', 'philadelphia': 'PHL', 'san antonio': 'SAT', 'san diego': 'SAN',
  'dallas': 'DFW', 'san jose': 'SJC', 'austin': 'AUS', 'jacksonville': 'JAX',
  'san francisco': 'SFO', 'seattle': 'SEA', 'denver': 'DEN', 'washington': 'IAD',
  'nashville': 'BNA', 'boston': 'BOS', 'atlanta': 'ATL', 'miami': 'MIA',
  'orlando': 'MCO', 'las vegas': 'LAS', 'minneapolis': 'MSP', 'detroit': 'DTW',
  'charlotte': 'CLT', 'portland': 'PDX', 'tampa': 'TPA', 'st louis': 'STL',
  'pittsburgh': 'PIT', 'baltimore': 'BWI', 'salt lake city': 'SLC', 'raleigh': 'RDU',
  'toronto': 'YYZ', 'montreal': 'YUL', 'vancouver': 'YVR', 'calgary': 'YYC',
  'mexico city': 'MEX', 'cancun': 'CUN', 'guadalajara': 'GDL',
  // Europe
  'london': 'LHR', 'paris': 'CDG', 'berlin': 'BER', 'madrid': 'MAD',
  'rome': 'FCO', 'amsterdam': 'AMS', 'barcelona': 'BCN', 'frankfurt': 'FRA',
  'munich': 'MUC', 'milan': 'MXP', 'lisbon': 'LIS', 'brussels': 'BRU',
  'vienna': 'VIE', 'zurich': 'ZRH', 'dublin': 'DUB', 'copenhagen': 'CPH',
  'stockholm': 'ARN', 'oslo': 'OSL', 'helsinki': 'HEL', 'prague': 'PRG',
  'warsaw': 'WAW', 'budapest': 'BUD', 'athens': 'ATH', 'istanbul': 'IST',
  'manchester': 'MAN', 'edinburgh': 'EDI', 'nice': 'NCE', 'geneva': 'GVA',
  // Africa
  'douala': 'DLA', 'yaounde': 'NSI', 'lagos': 'LOS', 'abuja': 'ABV',
  'accra': 'ACC', 'nairobi': 'NBO', 'johannesburg': 'JNB', 'cape town': 'CPT',
  'addis ababa': 'ADD', 'dar es salaam': 'DAR', 'casablanca': 'CMN',
  'cairo': 'CAI', 'algiers': 'ALG', 'tunis': 'TUN', 'dakar': 'DSS',
  'abidjan': 'ABJ', 'kinshasa': 'FIH', 'luanda': 'LAD', 'maputo': 'MPM',
  'kigali': 'KGL', 'kampala': 'EBB', 'lusaka': 'LUN', 'harare': 'HRE',
  'port harcourt': 'PHC', 'enugu': 'ENU', 'bamako': 'BKO', 'ouagadougou': 'OUA',
  'lome': 'LFW', 'cotonou': 'COO', 'libreville': 'LBV', 'brazzaville': 'BZV',
  'antananarivo': 'TNR', 'windhoek': 'WDH', 'gaborone': 'GBE',
  // Asia
  'tokyo': 'NRT', 'beijing': 'PEK', 'shanghai': 'PVG', 'hong kong': 'HKG',
  'singapore': 'SIN', 'bangkok': 'BKK', 'seoul': 'ICN', 'taipei': 'TPE',
  'mumbai': 'BOM', 'delhi': 'DEL', 'bangalore': 'BLR', 'chennai': 'MAA',
  'hyderabad': 'HYD', 'kolkata': 'CCU', 'dubai': 'DXB', 'doha': 'DOH',
  'abu dhabi': 'AUH', 'riyadh': 'RUH', 'jeddah': 'JED', 'kuala lumpur': 'KUL',
  'jakarta': 'CGK', 'manila': 'MNL', 'hanoi': 'HAN', 'ho chi minh city': 'SGN',
  // South America
  'sao paulo': 'GRU', 'rio de janeiro': 'GIG', 'buenos aires': 'EZE',
  'bogota': 'BOG', 'lima': 'LIM', 'santiago': 'SCL', 'medellin': 'MDE',
  'quito': 'UIO', 'caracas': 'CCS', 'montevideo': 'MVD',
  // Oceania
  'sydney': 'SYD', 'melbourne': 'MEL', 'brisbane': 'BNE', 'perth': 'PER',
  'auckland': 'AKL', 'wellington': 'WLG',
}

const COUNTRY_TO_HERITAGE_AIRPORTS: Record<string, string[]> = {
  'cameroon': ['DLA', 'NSI', 'YAO'], 'cameroonian': ['DLA', 'NSI', 'YAO'],
  'nigeria': ['LOS', 'ABV', 'PHC'], 'nigerian': ['LOS', 'ABV', 'PHC'],
  'ghana': ['ACC'], 'ghanaian': ['ACC'],
  'kenya': ['NBO'], 'kenyan': ['NBO'],
  'south africa': ['JNB', 'CPT'], 'south african': ['JNB', 'CPT'],
  'ethiopia': ['ADD'], 'ethiopian': ['ADD'],
  'tanzania': ['DAR'], 'tanzanian': ['DAR'],
  'morocco': ['CMN'], 'moroccan': ['CMN'],
  'egypt': ['CAI'], 'egyptian': ['CAI'],
  'senegal': ['DSS'], 'senegalese': ['DSS'],
  'ivory coast': ['ABJ'], 'ivorian': ['ABJ'], 'cote d\'ivoire': ['ABJ'],
  'congo': ['FIH'], 'congolese': ['FIH'],
  'angola': ['LAD'], 'angolan': ['LAD'],
  'mozambique': ['MPM'], 'mozambican': ['MPM'],
  'rwanda': ['KGL'], 'rwandan': ['KGL'],
  'uganda': ['EBB'], 'ugandan': ['EBB'],
  'zambia': ['LUN'], 'zambian': ['LUN'],
  'zimbabwe': ['HRE'], 'zimbabwean': ['HRE'],
  'mali': ['BKO'], 'malian': ['BKO'],
  'burkina faso': ['OUA'], 'burkinabe': ['OUA'],
  'togo': ['LFW'], 'togolese': ['LFW'],
  'benin': ['COO'], 'beninese': ['COO'],
  'gabon': ['LBV'], 'gabonese': ['LBV'],
  'madagascar': ['TNR'], 'malagasy': ['TNR'],
  'india': ['DEL', 'BOM', 'BLR', 'MAA'], 'indian': ['DEL', 'BOM', 'BLR', 'MAA'],
  'china': ['PEK', 'PVG'], 'chinese': ['PEK', 'PVG'],
  'japan': ['NRT', 'KIX'], 'japanese': ['NRT', 'KIX'],
  'korea': ['ICN'], 'korean': ['ICN'], 'south korea': ['ICN'],
  'philippines': ['MNL'], 'filipino': ['MNL'],
  'vietnam': ['SGN', 'HAN'], 'vietnamese': ['SGN', 'HAN'],
  'thailand': ['BKK'], 'thai': ['BKK'],
  'indonesia': ['CGK'], 'indonesian': ['CGK'],
  'malaysia': ['KUL'], 'malaysian': ['KUL'],
  'mexico': ['MEX', 'CUN', 'GDL'], 'mexican': ['MEX', 'CUN', 'GDL'],
  'brazil': ['GRU', 'GIG'], 'brazilian': ['GRU', 'GIG'],
  'colombia': ['BOG', 'MDE'], 'colombian': ['BOG', 'MDE'],
  'argentina': ['EZE'], 'argentinian': ['EZE'], 'argentine': ['EZE'],
  'peru': ['LIM'], 'peruvian': ['LIM'],
  'chile': ['SCL'], 'chilean': ['SCL'],
  'france': ['CDG', 'ORY', 'NCE'], 'french': ['CDG', 'ORY', 'NCE'],
  'germany': ['FRA', 'MUC', 'BER'], 'german': ['FRA', 'MUC', 'BER'],
  'united kingdom': ['LHR', 'LGW', 'MAN'], 'british': ['LHR', 'LGW', 'MAN'],
  'italy': ['FCO', 'MXP'], 'italian': ['FCO', 'MXP'],
  'spain': ['MAD', 'BCN'], 'spanish': ['MAD', 'BCN'],
  'portugal': ['LIS'], 'portuguese': ['LIS'],
  'netherlands': ['AMS'], 'dutch': ['AMS'],
  'turkey': ['IST'], 'turkish': ['IST'],
  'greece': ['ATH'], 'greek': ['ATH'],
  'ireland': ['DUB'], 'irish': ['DUB'],
  'united arab emirates': ['DXB', 'AUH'], 'emirati': ['DXB', 'AUH'],
  'saudi arabia': ['RUH', 'JED'], 'saudi': ['RUH', 'JED'],
  'qatar': ['DOH'], 'qatari': ['DOH'],
  'australia': ['SYD', 'MEL'], 'australian': ['SYD', 'MEL'],
  'canada': ['YYZ', 'YUL', 'YVR'], 'canadian': ['YYZ', 'YUL', 'YVR'],
  'united states': ['JFK', 'LAX', 'ORD'], 'american': ['JFK', 'LAX', 'ORD'],
}

// Nationality → Country mapping for heritage derivation
const NATIONALITY_TO_COUNTRY: Record<string, string> = {
  'cameroonian': 'cameroon', 'nigerian': 'nigeria', 'ghanaian': 'ghana',
  'kenyan': 'kenya', 'south african': 'south africa', 'ethiopian': 'ethiopia',
  'tanzanian': 'tanzania', 'moroccan': 'morocco', 'egyptian': 'egypt',
  'senegalese': 'senegal', 'ivorian': 'ivory coast', 'congolese': 'congo',
  'angolan': 'angola', 'mozambican': 'mozambique', 'rwandan': 'rwanda',
  'ugandan': 'uganda', 'zambian': 'zambia', 'zimbabwean': 'zimbabwe',
  'malian': 'mali', 'burkinabe': 'burkina faso', 'togolese': 'togo',
  'beninese': 'benin', 'gabonese': 'gabon', 'malagasy': 'madagascar',
  'indian': 'india', 'chinese': 'china', 'japanese': 'japan', 'korean': 'korea',
  'filipino': 'philippines', 'vietnamese': 'vietnam', 'thai': 'thailand',
  'indonesian': 'indonesia', 'malaysian': 'malaysia', 'mexican': 'mexico',
  'brazilian': 'brazil', 'colombian': 'colombia', 'argentinian': 'argentina',
  'argentine': 'argentina', 'peruvian': 'peru', 'chilean': 'chile',
  'french': 'france', 'german': 'germany', 'british': 'united kingdom',
  'italian': 'italy', 'spanish': 'spain', 'portuguese': 'portugal',
  'dutch': 'netherlands', 'turkish': 'turkey', 'greek': 'greece',
  'irish': 'ireland', 'emirati': 'united arab emirates', 'saudi': 'saudi arabia',
  'qatari': 'qatar', 'australian': 'australia', 'canadian': 'canada',
  'american': 'united states',
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { user_id, batch } = body

    if (batch) {
      const result = await batchCompute()
      return jsonResponse(result)
    }

    if (user_id) {
      const result = await computeForUser(user_id)
      return jsonResponse(result)
    }

    return jsonResponse({ success: false, error: 'Provide user_id or batch: true' }, 400)
  } catch (error: any) {
    console.error('compute-travel-dna error:', error)
    return jsonResponse({ success: false, error: error.message }, 500)
  }
})

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ============================================
// BATCH COMPUTE — All active users
// ============================================

async function batchCompute() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Get all users who have been active in last 30 days or have preferences
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .or(`last_seen_at.gte.${thirtyDaysAgo},onboarding_completed.eq.true`)
    .is('deleted_at', null)
    .limit(1000)

  if (error) throw error

  let processed = 0
  let errors: string[] = []

  for (const user of users || []) {
    try {
      await computeForUser(user.id)
      processed++
    } catch (err: any) {
      errors.push(`${user.id}: ${err.message}`)
    }
  }

  return { success: true, batch: true, processed, total: users?.length || 0, errors }
}

// ============================================
// CORE: Compute DNA for a single user
// ============================================

async function computeForUser(userId: string) {
  const startTime = Date.now()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // Step 0: Parallel data fetch
  const [
    profileResult,
    preferencesResult,
    searchesResult,
    clicksResult,
    savedResult,
    alertsResult,
    interactionsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('travel_preferences').select('*').eq('user_id', userId).single(),
    supabase.from('search_sessions').select('*').eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    supabase.from('deal_clicks').select('*').eq('user_id', userId)
      .gte('clicked_at', ninetyDaysAgo).limit(100),
    supabase.from('saved_deals').select('*').eq('user_id', userId)
      .eq('is_expired', false).limit(50),
    supabase.from('price_alerts').select('*').eq('user_id', userId)
      .eq('is_active', true).limit(50),
    supabase.from('user_interactions').select('*').eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo).limit(200),
  ])

  const profile = profileResult.data
  if (!profile) {
    return { success: false, error: 'Profile not found', user_id: userId }
  }

  const preferences = preferencesResult.data
  const searches = searchesResult.data || []
  const clicks = clicksResult.data || []
  const saved = savedResult.data || []
  const alerts = alertsResult.data || []
  const interactions = interactionsResult.data || []

  const dataSources: string[] = ['profile']
  if (preferences) dataSources.push('preferences')
  if (searches.length > 0) dataSources.push('search_sessions')
  if (clicks.length > 0) dataSources.push('deal_clicks')
  if (saved.length > 0) dataSources.push('saved_deals')
  if (alerts.length > 0) dataSources.push('price_alerts')
  if (interactions.length > 0) dataSources.push('user_interactions')

  // Step 1: Geographic Identity
  const geo = computeGeographicIdentity(profile, searches)

  // Step 2: Budget Profile
  const budget = computeBudgetProfile(preferences, clicks)

  // Step 3: Destination Preferences
  const destinations = computeDestinationPreferences(searches, clicks, saved, alerts, geo.heritage_countries)

  // Step 4: Travel Patterns
  const patterns = computeTravelPatterns(searches)

  // Step 5: Companion & Group
  const companion = computeCompanionProfile(preferences, searches)

  // Step 6: Interest Vector
  const interestVector = computeInterestVector(preferences, searches, clicks, interactions)

  // Step 7: Sub-profiles
  const accommodation = computeAccommodationProfile(preferences)
  const flight = computeFlightProfile(preferences)
  const experience = computeExperienceProfile(preferences, profile)

  // Step 8: Engagement Score
  const engagement = computeEngagementScore(searches, clicks, saved, alerts, interactions)

  // Step 9: Confidence Score
  const confidence = computeConfidenceScore(preferences, profile, geo, searches, clicks, alerts)

  // Step 10: Notification Profile
  const notification = computeNotificationProfile(preferences, profile)

  // Step 11: Also upsert user_search_patterns
  await upsertSearchPatterns(userId, searches, clicks)

  // Upsert Travel DNA
  const dna = {
    user_id: userId,
    // Geographic
    home_airport_code: geo.home_airport_code,
    home_airport_name: geo.home_airport_name,
    home_city: geo.home_city,
    home_country: geo.home_country,
    home_lat: geo.home_lat,
    home_lng: geo.home_lng,
    heritage_countries: geo.heritage_countries,
    heritage_airport_codes: geo.heritage_airport_codes,
    visa_free_countries: geo.visa_free_countries,
    // Budget
    budget_tier: budget.budget_tier,
    max_flight_price: budget.max_flight_price,
    max_hotel_nightly: budget.max_hotel_nightly,
    preferred_currency: budget.preferred_currency,
    price_sensitivity: budget.price_sensitivity,
    // Destinations
    preferred_regions: destinations.preferred_regions,
    top_destinations: destinations.top_destinations,
    avoided_destinations: destinations.avoided_destinations,
    // Patterns
    typical_trip_length_days: patterns.typical_trip_length_days,
    preferred_months: patterns.preferred_months,
    advance_booking_days: patterns.advance_booking_days,
    is_weekend_traveler: patterns.is_weekend_traveler,
    is_flexible_dater: patterns.is_flexible_dater,
    travel_frequency: patterns.travel_frequency,
    // Companion
    primary_companion_type: companion.primary_companion_type,
    typical_group_size: companion.typical_group_size,
    has_children: companion.has_children,
    has_infants: companion.has_infants,
    // Interests
    interest_vector: interestVector,
    // Sub-profiles
    accommodation_preferences: accommodation,
    flight_preferences: flight,
    experience_preferences: experience,
    // Engagement
    engagement_score: engagement.engagement_score,
    total_searches: searches.length,
    total_deal_clicks: clicks.length,
    total_deals_saved: saved.length,
    active_price_alerts: alerts.length,
    last_search_at: searches[0]?.created_at || null,
    last_deal_click_at: clicks[0]?.clicked_at || null,
    last_app_active_at: profile.last_seen_at,
    // Notification
    preferred_notification_time: notification.preferred_notification_time,
    notification_timezone: notification.notification_timezone,
    max_daily_notifications: 3,
    // Metadata
    dna_version: 1,
    confidence_score: confidence.score,
    strategy_tier: engagement.strategy_tier,
    data_sources_used: dataSources,
    last_computed_at: new Date().toISOString(),
    next_recompute_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    computation_duration_ms: Date.now() - startTime,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('user_travel_dna')
    .upsert(dna, { onConflict: 'user_id' })

  if (error) throw error

  return {
    success: true,
    user_id: userId,
    strategy_tier: engagement.strategy_tier,
    confidence_score: confidence.score,
    engagement_score: engagement.engagement_score,
    home_airport: geo.home_airport_code,
    heritage_airports: geo.heritage_airport_codes,
    top_destinations_count: destinations.top_destinations.length,
    computation_ms: Date.now() - startTime,
  }
}

// ============================================
// STEP 1: Geographic Identity
// ============================================

function computeGeographicIdentity(profile: any, searches: any[]) {
  const city = (profile.city || '').toLowerCase().trim()
  const country = (profile.country || '').toLowerCase().trim()
  const nationality = (profile.nationality || '').toLowerCase().trim()
  const ethnicity = (profile.ethnicity || '').toLowerCase().trim()
  const countryOfResidence = (profile.country_of_residence || '').toLowerCase().trim()

  // Home airport: city lookup → most-used origin → country capital
  let homeAirportCode = CITY_TO_AIRPORT[city] || null
  if (!homeAirportCode) {
    // Try from most-used origin in search_sessions
    const originCounts: Record<string, number> = {}
    for (const s of searches) {
      if (s.origin_code) {
        originCounts[s.origin_code] = (originCounts[s.origin_code] || 0) + 1
      }
    }
    const topOrigin = Object.entries(originCounts).sort((a, b) => b[1] - a[1])[0]
    if (topOrigin) homeAirportCode = topOrigin[0]
  }
  if (!homeAirportCode && country) {
    // Try country capital
    const countryAirports = COUNTRY_TO_HERITAGE_AIRPORTS[country]
    if (countryAirports) homeAirportCode = countryAirports[0]
  }

  // Heritage countries
  const heritageSet = new Set<string>()
  if (nationality) {
    const natCountry = NATIONALITY_TO_COUNTRY[nationality] || nationality
    heritageSet.add(natCountry)
  }
  if (ethnicity) {
    const ethCountry = NATIONALITY_TO_COUNTRY[ethnicity] || ethnicity
    // Only add if it maps to a known country
    if (COUNTRY_TO_HERITAGE_AIRPORTS[ethCountry]) {
      heritageSet.add(ethCountry)
    }
  }
  // Don't add country_of_residence as heritage — that's where they live, not heritage
  // But DO exclude country_of_residence from heritage to avoid scanning "home → home"
  const residenceCountry = NATIONALITY_TO_COUNTRY[countryOfResidence] || countryOfResidence
  heritageSet.delete(residenceCountry)

  const heritageCountries = Array.from(heritageSet)

  // Heritage airport codes
  const heritageAirportSet = new Set<string>()
  for (const hc of heritageCountries) {
    const airports = COUNTRY_TO_HERITAGE_AIRPORTS[hc] || []
    airports.forEach(a => heritageAirportSet.add(a))
  }
  // Remove home airport from heritage airports (no need to scan home → home)
  if (homeAirportCode) heritageAirportSet.delete(homeAirportCode)

  const homeAirportName = homeAirportCode
    ? Object.entries(CITY_TO_AIRPORT).find(([, code]) => code === homeAirportCode)?.[0] || ''
    : ''

  return {
    home_airport_code: homeAirportCode,
    home_airport_name: homeAirportName ? `${homeAirportName.charAt(0).toUpperCase() + homeAirportName.slice(1)} Airport` : null,
    home_city: profile.city || null,
    home_country: profile.country || null,
    home_lat: profile.latitude || null,
    home_lng: profile.longitude || null,
    heritage_countries: heritageCountries,
    heritage_airport_codes: Array.from(heritageAirportSet),
    visa_free_countries: [], // TODO: populate from passport_country lookup in future
  }
}

// ============================================
// STEP 2: Budget Profile
// ============================================

function computeBudgetProfile(preferences: any, clicks: any[]) {
  const defaultCurrency = preferences?.default_currency || 'USD'
  const statedBudget = preferences?.default_budget_amount || null
  const statedStyle = preferences?.spending_style || 'moderate'

  // Map spending style → tier
  const styleTiers: Record<string, number> = {
    'ultra_budget': 1, 'budget': 2, 'moderate': 3, 'premium': 4, 'luxury': 5,
  }
  const statedTier = styleTiers[statedStyle] || 3

  // Extract click prices
  const flightPrices = clicks
    .filter(c => c.deal_type === 'flight' && c.price_amount > 0)
    .map(c => c.price_amount)
  const hotelPrices = clicks
    .filter(c => c.deal_type === 'hotel' && c.price_amount > 0)
    .map(c => c.price_amount)

  let budgetTier = statedTier
  let priceSensitivity = 0.5

  if (flightPrices.length >= 5) {
    // Blend stated (40%) + behavior (40%) + sort behavior (20%)
    const medianClick = median(flightPrices)
    const behaviorTier = medianClick < 200 ? 1 : medianClick < 400 ? 2 : medianClick < 800 ? 3 : medianClick < 1500 ? 4 : 5
    budgetTier = Math.round(statedTier * 0.4 + behaviorTier * 0.6)
  }

  // Price sensitivity from flexible_dates usage and sort patterns could be added later
  priceSensitivity = budgetTier <= 2 ? 0.8 : budgetTier >= 4 ? 0.2 : 0.5

  // Max prices
  const maxFlight = flightPrices.length >= 3
    ? percentile(flightPrices, 0.75)
    : statedBudget ? statedBudget * 0.6 : budgetTier <= 2 ? 400 : budgetTier >= 4 ? 2000 : 800

  const maxHotel = hotelPrices.length >= 3
    ? percentile(hotelPrices, 0.75)
    : statedBudget ? statedBudget * 0.15 : budgetTier <= 2 ? 100 : budgetTier >= 4 ? 400 : 200

  return {
    budget_tier: Math.max(1, Math.min(5, budgetTier)),
    max_flight_price: Math.round(maxFlight),
    max_hotel_nightly: Math.round(maxHotel),
    preferred_currency: defaultCurrency,
    price_sensitivity: Math.round(priceSensitivity * 100) / 100,
  }
}

// ============================================
// STEP 3: Destination Preferences
// ============================================

function computeDestinationPreferences(
  searches: any[], clicks: any[], saved: any[], alerts: any[], heritageCountries: string[]
) {
  const destScores: Record<string, {
    city?: string, code?: string, country?: string,
    score: number, searches: number, clicks: number, saved: boolean, hasAlert: boolean,
    lastSearched?: string, source?: string
  }> = {}

  const now = Date.now()

  // From searches (3 pts × recency)
  for (const s of searches) {
    const dest = s.destination_code || s.destination_city
    if (!dest) continue
    const key = dest.toLowerCase()
    if (!destScores[key]) {
      destScores[key] = { city: s.destination_city, code: s.destination_code, country: s.destination_country, score: 0, searches: 0, clicks: 0, saved: false, hasAlert: false }
    }
    const daysSince = (now - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24)
    const recencyWeight = Math.max(0.5, 1.0 - (daysSince / 90) * 0.5)
    destScores[key].score += 3 * recencyWeight
    destScores[key].searches++
    destScores[key].lastSearched = s.created_at
  }

  // From clicks (5 pts each)
  for (const c of clicks) {
    const snapshot = c.deal_snapshot || {}
    const dest = snapshot.destination_code || snapshot.destination_city
    if (!dest) continue
    const key = dest.toLowerCase()
    if (!destScores[key]) {
      destScores[key] = { city: snapshot.destination_city, code: snapshot.destination_code, country: snapshot.destination_country, score: 0, searches: 0, clicks: 0, saved: false, hasAlert: false }
    }
    destScores[key].score += 5
    destScores[key].clicks++
  }

  // From saved deals (10 pts each)
  for (const s of saved) {
    const snapshot = s.deal_snapshot || {}
    const dest = snapshot.destination_code || snapshot.destination_city
    if (!dest) continue
    const key = dest.toLowerCase()
    if (!destScores[key]) {
      destScores[key] = { city: snapshot.destination_city, code: snapshot.destination_code, country: snapshot.destination_country, score: 0, searches: 0, clicks: 0, saved: false, hasAlert: false }
    }
    destScores[key].score += 10
    destScores[key].saved = true
  }

  // From active alerts (15 pts each)
  for (const a of alerts) {
    const params = a.search_params || {}
    const dest = params.destination_code || params.destination
    if (!dest) continue
    const key = dest.toLowerCase()
    if (!destScores[key]) {
      destScores[key] = { code: dest, score: 0, searches: 0, clicks: 0, saved: false, hasAlert: false }
    }
    destScores[key].score += 15
    destScores[key].hasAlert = true
  }

  // Heritage bonus (8 pts for any city in heritage countries)
  for (const hc of heritageCountries) {
    const airports = COUNTRY_TO_HERITAGE_AIRPORTS[hc] || []
    for (const apt of airports) {
      const key = apt.toLowerCase()
      if (!destScores[key]) {
        destScores[key] = { code: apt, country: hc, score: 0, searches: 0, clicks: 0, saved: false, hasAlert: false, source: 'heritage' }
      }
      destScores[key].score += 8
      destScores[key].source = 'heritage'
    }
  }

  // Sort and take top 10
  const sortedDests = Object.entries(destScores)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 10)
    .map(([key, data]) => ({
      key,
      city: data.city || key,
      code: data.code || key.toUpperCase(),
      country: data.country || null,
      score: Math.round(data.score * 100) / 100,
      searches: data.searches,
      clicks: data.clicks,
      saved: data.saved,
      has_alert: data.hasAlert,
      last_searched: data.lastSearched || null,
      source: data.source || 'behavior',
    }))

  // Aggregate by region (simplified — use country as proxy for region)
  const regionScores: Record<string, number> = {}
  for (const [, data] of Object.entries(destScores)) {
    if (data.country) {
      const region = data.country.toLowerCase()
      regionScores[region] = (regionScores[region] || 0) + data.score
    }
  }
  const preferredRegions = Object.entries(regionScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([region, score]) => ({ region, score: Math.round(score * 100) / 100 }))

  return {
    top_destinations: sortedDests,
    preferred_regions: preferredRegions,
    avoided_destinations: [] as string[], // Could derive from "never clicked" destinations
  }
}

// ============================================
// STEP 4: Travel Patterns
// ============================================

function computeTravelPatterns(searches: any[]) {
  if (searches.length === 0) {
    return {
      typical_trip_length_days: null,
      preferred_months: [] as number[],
      advance_booking_days: null,
      is_weekend_traveler: false,
      is_flexible_dater: false,
      travel_frequency: 'occasional' as string,
    }
  }

  // Trip lengths
  const tripLengths = searches
    .filter(s => s.start_date && s.end_date)
    .map(s => {
      const start = new Date(s.start_date)
      const end = new Date(s.end_date)
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    })
    .filter(d => d > 0 && d < 365)

  const typicalLength = tripLengths.length > 0 ? Math.round(median(tripLengths)) : null

  // Preferred months
  const monthCounts: Record<number, number> = {}
  for (const s of searches) {
    if (s.start_date) {
      const month = new Date(s.start_date).getMonth() + 1
      monthCounts[month] = (monthCounts[month] || 0) + 1
    }
  }
  const preferredMonths = Object.entries(monthCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([m]) => parseInt(m))

  // Advance booking days
  const advanceDays = searches
    .filter(s => s.start_date)
    .map(s => {
      const searchDate = new Date(s.created_at)
      const travelDate = new Date(s.start_date)
      return Math.round((travelDate.getTime() - searchDate.getTime()) / (1000 * 60 * 60 * 24))
    })
    .filter(d => d > 0 && d < 365)

  const advanceBooking = advanceDays.length > 0 ? Math.round(median(advanceDays)) : null

  // Weekend traveler
  const weekendTrips = searches.filter(s => {
    if (!s.start_date || !s.end_date) return false
    const length = (new Date(s.end_date).getTime() - new Date(s.start_date).getTime()) / (1000 * 60 * 60 * 24)
    const startDay = new Date(s.start_date).getDay()
    return length <= 3 && (startDay === 5 || startDay === 6) // Fri or Sat start, <= 3 days
  })
  const isWeekendTraveler = searches.length >= 3 && weekendTrips.length / searches.length > 0.4

  // Flexible dates
  const flexibleCount = searches.filter(s => s.flexible_dates).length
  const isFlexibleDater = searches.length >= 3 && flexibleCount / searches.length > 0.5

  // Travel frequency
  const oldestSearch = searches[searches.length - 1]?.created_at
  const weeksSpan = oldestSearch
    ? (Date.now() - new Date(oldestSearch).getTime()) / (1000 * 60 * 60 * 24 * 7)
    : 1
  const searchesPerWeek = searches.length / Math.max(weeksSpan, 1)
  let travelFrequency = 'occasional'
  if (searchesPerWeek >= 3) travelFrequency = 'frequent'
  else if (searchesPerWeek >= 1) travelFrequency = 'regular'
  else if (searchesPerWeek >= 0.25) travelFrequency = 'occasional'
  else travelFrequency = 'rare'

  return {
    typical_trip_length_days: typicalLength,
    preferred_months: preferredMonths,
    advance_booking_days: advanceBooking,
    is_weekend_traveler: isWeekendTraveler,
    is_flexible_dater: isFlexibleDater,
    travel_frequency: travelFrequency,
  }
}

// ============================================
// STEP 5: Companion & Group
// ============================================

function computeCompanionProfile(preferences: any, searches: any[]) {
  const companionType = preferences?.default_companion_type || null
  const prefAdults = preferences?.default_adults || 1
  const prefChildren = preferences?.default_children || 0
  const prefInfants = preferences?.default_infants || 0

  // Override with actual search behavior if enough data
  let typicalGroupSize = prefAdults + prefChildren + prefInfants
  let hasChildren = prefChildren > 0
  let hasInfants = prefInfants > 0

  if (searches.length >= 5) {
    const groupSizes = searches
      .map(s => (s.adults || 1) + (s.children || 0) + (s.infants || 0))
    typicalGroupSize = Math.round(median(groupSizes))
    hasChildren = searches.filter(s => (s.children || 0) > 0).length > searches.length * 0.3
    hasInfants = searches.filter(s => (s.infants || 0) > 0).length > searches.length * 0.3
  }

  return {
    primary_companion_type: companionType,
    typical_group_size: Math.max(1, typicalGroupSize),
    has_children: hasChildren,
    has_infants: hasInfants,
  }
}

// ============================================
// STEP 6: Interest Vector
// ============================================

function computeInterestVector(preferences: any, searches: any[], clicks: any[], interactions: any[]) {
  const weights: Record<string, number> = {}

  // From explicit preferences (weight: 1.0)
  if (preferences?.interests && Array.isArray(preferences.interests)) {
    for (const interest of preferences.interests) {
      weights[interest] = (weights[interest] || 0) + 1.0
    }
  }

  // From preferred_trip_styles (weight: 0.8)
  if (preferences?.preferred_trip_styles && Array.isArray(preferences.preferred_trip_styles)) {
    for (const style of preferences.preferred_trip_styles) {
      weights[style] = (weights[style] || 0) + 0.8
    }
  }

  // From search filters (weight: 0.5)
  for (const s of searches) {
    if (s.filters_applied?.categories && Array.isArray(s.filters_applied.categories)) {
      for (const cat of s.filters_applied.categories) {
        weights[cat] = (weights[cat] || 0) + 0.5
      }
    }
    // Search mode as category signal
    if (s.search_mode) {
      weights[s.search_mode] = (weights[s.search_mode] || 0) + 0.3
    }
  }

  // From deal click types (weight: 0.3)
  for (const c of clicks) {
    if (c.deal_type) {
      weights[c.deal_type] = (weights[c.deal_type] || 0) + 0.3
    }
  }

  // From interaction categories (weight: 0.2)
  for (const i of interactions) {
    if (i.category_slug) {
      weights[i.category_slug] = (weights[i.category_slug] || 0) + 0.2
    }
  }

  // Normalize to 0-1
  const maxWeight = Math.max(...Object.values(weights), 1)
  const vector = Object.entries(weights)
    .map(([tag, w]) => ({ tag, weight: Math.round((w / maxWeight) * 100) / 100 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 20) // Top 20 interests

  return vector
}

// ============================================
// STEP 7: Sub-profiles
// ============================================

function computeAccommodationProfile(preferences: any) {
  return {
    type: preferences?.accommodation_type || null,
    min_stars: preferences?.min_star_rating || null,
    location_priority: preferences?.location_priority || null,
    amenities: preferences?.preferred_amenities || [],
  }
}

function computeFlightProfile(preferences: any) {
  return {
    class: preferences?.flight_class || 'economy',
    max_stops: preferences?.flight_stops === 'direct' ? 0 : preferences?.flight_stops === 'one_stop' ? 1 : null,
    time_preference: preferences?.flight_time_preference || null,
    preferred_airlines: [], // Could be derived from clicks in future
  }
}

function computeExperienceProfile(preferences: any, profile: any) {
  return {
    activity_level: profile?.activity_level || null,
    food_adventurousness: profile?.food_adventurousness || null,
    crowd_comfort: profile?.crowd_comfort || null,
    cuisine_preferences: profile?.cuisine_preferences || [],
    dietary_restrictions: preferences?.dietary_restrictions || [],
    categories: [], // Could be derived from interaction patterns
  }
}

// ============================================
// STEP 8: Engagement Score
// ============================================

function computeEngagementScore(
  searches: any[], clicks: any[], saved: any[], alerts: any[], interactions: any[]
) {
  const score = Math.min(100,
    Math.min(searches.length * 2, 30) +
    Math.min(clicks.length * 3, 25) +
    Math.min(saved.length * 5, 20) +
    Math.min(alerts.length * 5, 15) +
    Math.min(interactions.length * 0.5, 10)
  )

  let strategyTier: 'cold' | 'warm' | 'hot'
  if (score >= 60) strategyTier = 'hot'
  else if (score >= 20) strategyTier = 'warm'
  else strategyTier = 'cold'

  return { engagement_score: Math.round(score), strategy_tier: strategyTier }
}

// ============================================
// STEP 9: Confidence Score
// ============================================

function computeConfidenceScore(
  preferences: any, profile: any, geo: any, searches: any[], clicks: any[], alerts: any[]
) {
  let score = 0

  // Preferences completeness
  if (preferences?.preferences_completed) {
    score += 25
  } else if (preferences) {
    // Partial — count filled fields
    let filled = 0
    if (preferences.default_companion_type) filled++
    if (preferences.preferred_trip_styles?.length > 0) filled++
    if (preferences.interests?.length > 0) filled++
    if (preferences.default_budget_amount) filled++
    if (preferences.accommodation_type) filled++
    if (preferences.preferred_travel_mode) filled++
    score += Math.min(filled * 4, 25)
  }

  // Profile data
  if (profile.nationality) score += 10
  if (profile.city) score += 10
  if (geo.home_airport_code) score += 10

  // Behavioral data
  score += Math.min(searches.length, 10) * 2 // Up to 20
  score += Math.min(clicks.length, 5) * 3    // Up to 15
  if (alerts.length > 0) score += 10

  return { score: Math.min(100, score) }
}

// ============================================
// STEP 10: Notification Profile
// ============================================

function computeNotificationProfile(preferences: any, profile: any) {
  let preferredTime = '09:00' // Default: 9 AM
  if (preferences?.time_preference === 'morning' || profile?.morning_person === true) {
    preferredTime = '07:00'
  } else if (preferences?.time_preference === 'evening') {
    preferredTime = '18:00'
  }

  return {
    preferred_notification_time: preferredTime,
    notification_timezone: profile?.timezone || 'America/New_York',
  }
}

// ============================================
// UPSERT SEARCH PATTERNS
// ============================================

async function upsertSearchPatterns(userId: string, searches: any[], clicks: any[]) {
  // Top flight routes
  const flightRoutes: Record<string, { origin: string, dest: string, count: number, last: string }> = {}
  const hotelCities: Record<string, { city: string, country: string, count: number }> = {}

  let flightSearches = 0, hotelSearches = 0, experienceSearches = 0, carSearches = 0

  for (const s of searches) {
    const mode = (s.search_mode || '').toLowerCase()
    if (mode.includes('flight') || (s.origin_code && s.destination_code)) {
      flightSearches++
      if (s.origin_code && s.destination_code) {
        const key = `${s.origin_code}-${s.destination_code}`
        if (!flightRoutes[key]) {
          flightRoutes[key] = { origin: s.origin_code, dest: s.destination_code, count: 0, last: s.created_at }
        }
        flightRoutes[key].count++
        if (s.created_at > flightRoutes[key].last) flightRoutes[key].last = s.created_at
      }
    }
    if (mode.includes('hotel') || s.rooms) {
      hotelSearches++
      if (s.destination_city) {
        const key = s.destination_city.toLowerCase()
        if (!hotelCities[key]) {
          hotelCities[key] = { city: s.destination_city, country: s.destination_country || '', count: 0 }
        }
        hotelCities[key].count++
      }
    }
    if (mode.includes('experience')) experienceSearches++
    if (mode.includes('car')) carSearches++
  }

  const topFlightRoutes = Object.values(flightRoutes)
    .sort((a, b) => b.count - a.count).slice(0, 10)
  const topHotelCities = Object.values(hotelCities)
    .sort((a, b) => b.count - a.count).slice(0, 10)

  // Click price stats
  const flightClickPrices = clicks
    .filter(c => c.deal_type === 'flight' && c.price_amount > 0)
    .map(c => c.price_amount)
  const hotelClickPrices = clicks
    .filter(c => c.deal_type === 'hotel' && c.price_amount > 0)
    .map(c => c.price_amount)

  // Month patterns
  const monthCounts: Record<number, number> = {}
  for (const s of searches) {
    if (s.start_date) {
      const m = new Date(s.start_date).getMonth() + 1
      monthCounts[m] = (monthCounts[m] || 0) + 1
    }
  }
  const mostSearchedMonths = Object.entries(monthCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([m]) => parseInt(m))

  // Trip length & advance booking
  const tripLengths = searches
    .filter(s => s.start_date && s.end_date)
    .map(s => (new Date(s.end_date).getTime() - new Date(s.start_date).getTime()) / (1000 * 60 * 60 * 24))
    .filter(d => d > 0 && d < 365)

  const advanceDays = searches
    .filter(s => s.start_date)
    .map(s => (new Date(s.start_date).getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24))
    .filter(d => d > 0 && d < 365)

  const oldestSearch = searches[searches.length - 1]?.created_at
  const weeksSpan = oldestSearch
    ? (Date.now() - new Date(oldestSearch).getTime()) / (1000 * 60 * 60 * 24 * 7)
    : 1

  await supabase.from('user_search_patterns').upsert({
    user_id: userId,
    top_flight_routes: topFlightRoutes,
    top_hotel_cities: topHotelCities,
    top_experience_cities: [],
    total_flight_searches: flightSearches,
    total_hotel_searches: hotelSearches,
    total_experience_searches: experienceSearches,
    total_car_searches: carSearches,
    avg_flight_price_clicked: flightClickPrices.length > 0 ? Math.round(avg(flightClickPrices)) : null,
    avg_hotel_price_clicked: hotelClickPrices.length > 0 ? Math.round(avg(hotelClickPrices)) : null,
    min_flight_price_clicked: flightClickPrices.length > 0 ? Math.min(...flightClickPrices) : null,
    max_flight_price_clicked: flightClickPrices.length > 0 ? Math.max(...flightClickPrices) : null,
    most_searched_months: mostSearchedMonths,
    avg_trip_length_days: tripLengths.length > 0 ? Math.round(median(tripLengths)) : null,
    avg_advance_booking_days: advanceDays.length > 0 ? Math.round(median(advanceDays)) : null,
    searches_per_week: Math.round((searches.length / Math.max(weeksSpan, 1)) * 100) / 100,
    computed_from_sessions: searches.length,
    last_computed_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

// ============================================
// MATH HELPERS
// ============================================

function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.ceil(p * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}
