# Document 9: Search & Comparison Engine

## Purpose

This document defines the enterprise-grade search and comparison engine for Guidera — the intelligent system that orchestrates searches across multiple providers, aggregates results, ranks them using advanced algorithms, and delivers the best travel options to users in milliseconds.

This is the core experience users interact with. It must be **fast**, **smart**, and **comprehensive**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SEARCH & COMPARISON ENGINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        SEARCH ORCHESTRATOR                           │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│   │  │   Unified   │  │  Category   │  │    Plan     │  │  Package   │  │   │
│   │  │   Search    │  │   Search    │  │    Mode     │  │  Builder   │  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      QUERY PROCESSOR                                 │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│   │  │   Query     │  │   Intent    │  │   Context   │  │   Query    │  │   │
│   │  │   Parser    │  │  Detector   │  │  Enricher   │  │  Optimizer │  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    MULTI-PROVIDER EXECUTOR                           │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│   │  │  Provider   │  │  Parallel   │  │   Timeout   │  │  Fallback  │  │   │
│   │  │  Selector   │  │  Executor   │  │  Manager    │  │  Handler   │  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     RESULT PROCESSOR                                 │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│   │  │   Result    │  │   Dedup     │  │  Ranking    │  │   Filter   │  │   │
│   │  │ Normalizer  │  │   Engine    │  │   Engine    │  │   Engine   │  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      SESSION MANAGER                                 │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│   │  │   Session   │  │   Result    │  │   Price     │  │  History   │  │   │
│   │  │   Store     │  │   Cache     │  │   Tracker   │  │  Manager   │  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Search Modes

Guidera supports multiple search modes to accommodate different user journeys:

### 1. Unified Search (Airbnb-style)
The main search bar on the homepage. User selects:
- **Where** → Destination (city, country, or "Nearby")
- **When** → Date range
- **Who** → Number of travelers (adults, children, infants)

Returns combined results across all categories relevant to that destination.

### 2. Category Search
Direct search for a specific category:
- **Flight** → Origin, destination, dates, travelers, cabin class
- **Hotel** → Destination, dates, rooms, guests
- **Car** → Pickup location, dates/times, driver age
- **Experience** → Destination, dates, participants
- **Package** → Destination, dates, travelers (bundles flight + hotel + optional car/experience)

### 3. Plan Mode
AI-assisted trip planning:
- **Quick Plan** → Answer a few questions, get a complete itinerary
- **Advanced Plan** → Deep customization with multiple factors
- **Import** → Import existing bookings from other platforms

### 4. Contextual Search
Search triggered from within the app:
- From trip countdown → "Add more to your Singapore trip"
- From deal cards → Pre-filtered search with deal applied
- From destination page → "Book flights to Paris"

---

## Database Schema

### Search Sessions Table

```sql
CREATE TABLE search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id VARCHAR(100),                    -- For non-logged-in users
  
  -- Session identity
  session_token VARCHAR(100) UNIQUE NOT NULL,
  
  -- Search mode
  search_mode VARCHAR(50) NOT NULL,            -- 'unified', 'flight', 'hotel', 'car', 'experience', 'package', 'plan'
  
  -- Search parameters
  search_params JSONB NOT NULL,
  
  -- Destination context
  destination_city VARCHAR(100),
  destination_country VARCHAR(100),
  destination_code VARCHAR(10),                 -- Airport/city code
  origin_city VARCHAR(100),
  origin_code VARCHAR(10),
  
  -- Date context
  start_date DATE,
  end_date DATE,
  flexible_dates BOOLEAN DEFAULT FALSE,
  
  -- Traveler context
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,
  rooms INTEGER DEFAULT 1,
  
  -- Results summary
  total_results INTEGER DEFAULT 0,
  results_by_category JSONB DEFAULT '{}',      -- {"flights": 45, "hotels": 120, ...}
  providers_queried TEXT[],
  providers_succeeded TEXT[],
  providers_failed TEXT[],
  
  -- Timing
  search_started_at TIMESTAMPTZ,
  search_completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',        -- 'pending', 'searching', 'completed', 'partial', 'failed'
  error_message TEXT,
  
  -- Cache info
  served_from_cache BOOLEAN DEFAULT FALSE,
  cache_key VARCHAR(255),
  
  -- User interaction
  filters_applied JSONB DEFAULT '{}',
  sort_applied VARCHAR(50),
  results_viewed INTEGER DEFAULT 0,
  offers_clicked TEXT[],
  
  -- Conversion tracking
  booking_initiated BOOLEAN DEFAULT FALSE,
  booking_completed BOOLEAN DEFAULT FALSE,
  booking_id UUID,
  
  -- Metadata
  client_ip VARCHAR(45),
  user_agent TEXT,
  app_version VARCHAR(20),
  device_type VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Indexes
CREATE INDEX idx_sessions_user ON search_sessions(user_id);
CREATE INDEX idx_sessions_token ON search_sessions(session_token);
CREATE INDEX idx_sessions_status ON search_sessions(status);
CREATE INDEX idx_sessions_created ON search_sessions(created_at DESC);
CREATE INDEX idx_sessions_destination ON search_sessions(destination_code, start_date);
```

### Search Results Table

```sql
CREATE TABLE search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES search_sessions(id) ON DELETE CASCADE,
  
  -- Result identity
  result_hash VARCHAR(64) NOT NULL,            -- Hash for deduplication
  
  -- Category
  category VARCHAR(50) NOT NULL,               -- 'flight', 'hotel', 'car', 'experience'
  
  -- Provider
  provider_code VARCHAR(50) NOT NULL,
  provider_offer_id VARCHAR(255) NOT NULL,
  
  -- Normalized data
  normalized_data JSONB NOT NULL,              -- UnifiedFlight/Hotel/Car/Experience
  
  -- Pricing (denormalized for fast sorting)
  price_amount DECIMAL(12,2) NOT NULL,
  price_currency VARCHAR(3) NOT NULL,
  price_per_unit DECIMAL(12,2),                -- Per night, per day, per person
  original_price DECIMAL(12,2),                -- If discounted
  
  -- Key attributes (denormalized for fast filtering)
  -- Flights
  departure_time TIME,
  arrival_time TIME,
  duration_minutes INTEGER,
  stops INTEGER,
  airlines TEXT[],
  cabin_class VARCHAR(50),
  
  -- Hotels
  star_rating INTEGER,
  guest_rating DECIMAL(3,1),
  property_type VARCHAR(50),
  amenities TEXT[],
  board_type VARCHAR(50),
  
  -- Cars
  vehicle_category VARCHAR(50),
  vehicle_type VARCHAR(50),
  transmission VARCHAR(20),
  supplier VARCHAR(100),
  
  -- Experiences
  experience_category VARCHAR(50),
  experience_duration_hours DECIMAL(4,1),
  experience_rating DECIMAL(3,1),
  
  -- Ranking
  relevance_score DECIMAL(5,2) DEFAULT 0,
  quality_score DECIMAL(5,2) DEFAULT 0,
  value_score DECIMAL(5,2) DEFAULT 0,
  personalization_score DECIMAL(5,2) DEFAULT 0,
  overall_rank INTEGER,
  
  -- Status
  is_available BOOLEAN DEFAULT TRUE,
  is_bookable BOOLEAN DEFAULT TRUE,
  price_verified_at TIMESTAMPTZ,
  
  -- Metadata
  retrieved_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  UNIQUE(session_id, result_hash)
);

-- Indexes for fast filtering and sorting
CREATE INDEX idx_results_session ON search_results(session_id);
CREATE INDEX idx_results_category ON search_results(session_id, category);
CREATE INDEX idx_results_price ON search_results(session_id, category, price_amount);
CREATE INDEX idx_results_rank ON search_results(session_id, category, overall_rank);
CREATE INDEX idx_results_flights ON search_results(session_id, stops, duration_minutes) WHERE category = 'flight';
CREATE INDEX idx_results_hotels ON search_results(session_id, star_rating, guest_rating) WHERE category = 'hotel';
```

### Popular Searches Cache

```sql
CREATE TABLE popular_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Route/destination
  search_type VARCHAR(50) NOT NULL,            -- 'route', 'destination', 'experience'
  origin_code VARCHAR(10),
  destination_code VARCHAR(10) NOT NULL,
  
  -- Aggregated data
  search_count INTEGER DEFAULT 0,
  avg_price DECIMAL(12,2),
  min_price DECIMAL(12,2),
  max_price DECIMAL(12,2),
  
  -- Sample results (for instant display)
  sample_results JSONB DEFAULT '[]',
  
  -- Best deals
  best_deals JSONB DEFAULT '[]',
  
  -- Trending
  is_trending BOOLEAN DEFAULT FALSE,
  trend_score DECIMAL(5,2) DEFAULT 0,
  
  -- Time-based stats
  last_searched_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  UNIQUE(search_type, origin_code, destination_code, period_start, period_end)
);

CREATE INDEX idx_popular_destination ON popular_searches(destination_code, search_count DESC);
CREATE INDEX idx_popular_trending ON popular_searches(is_trending, trend_score DESC);
```

### Price Alerts Table

```sql
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Search criteria
  category VARCHAR(50) NOT NULL,
  search_params JSONB NOT NULL,
  
  -- Alert settings
  target_price DECIMAL(12,2),                  -- Alert when price drops below this
  current_best_price DECIMAL(12,2),
  price_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMPTZ,
  
  -- Notification
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_method VARCHAR(50),              -- 'push', 'email', 'both'
  
  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON price_alerts(user_id, is_active);
CREATE INDEX idx_alerts_category ON price_alerts(category, is_active);
```

### Destination Intelligence Table

```sql
CREATE TABLE destination_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Destination
  destination_code VARCHAR(10) NOT NULL,
  destination_name VARCHAR(100) NOT NULL,
  destination_type VARCHAR(50),                -- 'city', 'region', 'country'
  country_code VARCHAR(2),
  
  -- Location
  coordinates POINT,
  timezone VARCHAR(50),
  
  -- Content
  tagline VARCHAR(255),                        -- "City of lights and romance"
  description TEXT,
  emoji VARCHAR(10),                           -- 🗼 for Paris
  hero_image_url VARCHAR(500),
  
  -- Travel info
  best_months INTEGER[],                       -- [3,4,5,9,10] for spring/fall
  avg_temperature_by_month JSONB,
  currency VARCHAR(3),
  language VARCHAR(50),
  visa_required_for TEXT[],                    -- Country codes that need visa
  
  -- Pricing intelligence
  avg_flight_price_from_us DECIMAL(10,2),
  avg_hotel_price_per_night DECIMAL(10,2),
  budget_level VARCHAR(20),                    -- 'budget', 'moderate', 'expensive'
  
  -- Popularity
  popularity_score INTEGER DEFAULT 0,
  search_volume_30d INTEGER DEFAULT 0,
  booking_volume_30d INTEGER DEFAULT 0,
  
  -- Categories strength
  good_for TEXT[],                             -- ['romance', 'culture', 'food', 'nightlife']
  
  -- Related destinations
  similar_destinations TEXT[],
  nearby_destinations TEXT[],
  
  -- Metadata
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(destination_code)
);

CREATE INDEX idx_destination_code ON destination_intelligence(destination_code);
CREATE INDEX idx_destination_country ON destination_intelligence(country_code);
CREATE INDEX idx_destination_popularity ON destination_intelligence(popularity_score DESC);

-- Enable PostGIS for location queries
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- ALTER TABLE destination_intelligence ADD COLUMN geom geometry(Point, 4326);
-- CREATE INDEX idx_destination_geom ON destination_intelligence USING GIST(geom);
```

---

## Query Processor

### Query Parser

Parses and validates incoming search requests.

```typescript
interface ParsedQuery {
  // Core intent
  mode: SearchMode
  categories: SearchCategory[]
  
  // Location
  origin?: LocationQuery
  destination: LocationQuery
  
  // Dates
  dates: DateQuery
  
  // Travelers
  travelers: TravelerQuery
  
  // Filters (pre-applied)
  filters: SearchFilters
  
  // Sort preference
  sortBy?: SortOption
  
  // Pagination
  page: number
  limit: number
  
  // Options
  options: SearchOptions
}

enum SearchMode {
  UNIFIED = 'unified',
  FLIGHT = 'flight',
  HOTEL = 'hotel',
  CAR = 'car',
  EXPERIENCE = 'experience',
  PACKAGE = 'package',
  PLAN = 'plan'
}

type SearchCategory = 'flights' | 'hotels' | 'cars' | 'experiences'

interface LocationQuery {
  type: 'city' | 'airport' | 'coordinates' | 'nearby' | 'region'
  value: string | Coordinates
  radius?: number              // For nearby searches
  resolved?: ResolvedLocation  // After resolution
}

interface DateQuery {
  type: 'exact' | 'flexible' | 'weekend' | 'month'
  startDate?: string
  endDate?: string
  flexDays?: number
  preferredDays?: ('fri' | 'sat' | 'sun')[]
  month?: number
  year?: number
}

interface TravelerQuery {
  adults: number
  children: number
  childrenAges?: number[]
  infants: number
  rooms?: number               // For hotels
  cabinClass?: CabinClass      // For flights
}
```

### Intent Detector

Understands what the user is trying to accomplish.

```typescript
interface SearchIntent {
  // Primary intent
  primaryIntent: 'explore' | 'book' | 'compare' | 'plan'
  
  // Confidence
  confidence: number
  
  // Detected signals
  signals: IntentSignal[]
  
  // Recommended actions
  recommendations: SearchRecommendation[]
}

interface IntentSignal {
  signal: string
  source: string
  weight: number
}

function detectIntent(query: ParsedQuery, userContext: UserContext): SearchIntent {
  const signals: IntentSignal[] = []
  
  // Analyze date specificity
  if (query.dates.type === 'exact') {
    signals.push({
      signal: 'specific_dates',
      source: 'date_query',
      weight: 0.8
    })
  }
  
  // Analyze traveler details
  if (query.travelers.adults > 0 && query.travelers.cabinClass) {
    signals.push({
      signal: 'detailed_travelers',
      source: 'traveler_query',
      weight: 0.7
    })
  }
  
  // Check if user has searched this before
  if (userContext.searchHistory?.includes(query.destination.value)) {
    signals.push({
      signal: 'repeat_search',
      source: 'user_history',
      weight: 0.6
    })
  }
  
  // Check proximity to travel date
  if (query.dates.startDate) {
    const daysUntilTravel = daysBetween(new Date(), new Date(query.dates.startDate))
    if (daysUntilTravel < 14) {
      signals.push({
        signal: 'urgent_travel',
        source: 'date_proximity',
        weight: 0.9
      })
    }
  }
  
  // Calculate primary intent
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0)
  const bookingSignals = signals.filter(s => 
    ['specific_dates', 'detailed_travelers', 'urgent_travel'].includes(s.signal)
  )
  const bookingWeight = bookingSignals.reduce((sum, s) => sum + s.weight, 0)
  
  let primaryIntent: SearchIntent['primaryIntent']
  if (bookingWeight / totalWeight > 0.6) {
    primaryIntent = 'book'
  } else if (query.mode === 'plan') {
    primaryIntent = 'plan'
  } else if (signals.some(s => s.signal === 'repeat_search')) {
    primaryIntent = 'compare'
  } else {
    primaryIntent = 'explore'
  }
  
  return {
    primaryIntent,
    confidence: bookingWeight / totalWeight,
    signals,
    recommendations: generateRecommendations(primaryIntent, query, userContext)
  }
}
```

### Context Enricher

Adds user preferences, history, and location context.

```typescript
interface EnrichedQuery extends ParsedQuery {
  // User context
  userPreferences?: UserPreferences
  userHistory?: SearchHistory
  userLocation?: UserLocation
  
  // Resolved locations
  resolvedOrigin?: ResolvedLocation
  resolvedDestination?: ResolvedLocation
  
  // Timing context
  searchTime: Date
  localTime: Date
  timezone: string
  
  // Market context
  originMarket: string
  destinationMarket: string
  currency: string
  
  // Intelligence
  destinationIntelligence?: DestinationIntelligence
  pricingIntelligence?: PricingIntelligence
  
  // Intent
  intent: SearchIntent
}

async function enrichQuery(
  query: ParsedQuery,
  userId?: string
): Promise<EnrichedQuery> {
  
  const enriched: EnrichedQuery = {
    ...query,
    searchTime: new Date(),
    localTime: new Date(),
    timezone: 'UTC',
    originMarket: 'US',
    destinationMarket: 'US',
    currency: 'USD',
    intent: null
  }
  
  // Parallel enrichment tasks
  const [
    userContext,
    resolvedDestination,
    resolvedOrigin,
    destinationIntel,
    pricingIntel
  ] = await Promise.all([
    userId ? getUserContext(userId) : null,
    resolveLocation(query.destination),
    query.origin ? resolveLocation(query.origin) : null,
    getDestinationIntelligence(query.destination.value),
    getPricingIntelligence(query.origin?.value, query.destination.value, query.dates)
  ])
  
  // Apply user context
  if (userContext) {
    enriched.userPreferences = userContext.preferences
    enriched.userHistory = userContext.searchHistory
    enriched.userLocation = userContext.location
    enriched.currency = userContext.preferences?.currency || 'USD'
  }
  
  // Apply resolved locations
  enriched.resolvedDestination = resolvedDestination
  enriched.resolvedOrigin = resolvedOrigin
  
  // Apply intelligence
  enriched.destinationIntelligence = destinationIntel
  enriched.pricingIntelligence = pricingIntel
  
  // Detect intent
  enriched.intent = detectIntent(query, userContext)
  
  // Determine markets
  if (resolvedOrigin) {
    enriched.originMarket = resolvedOrigin.countryCode
  }
  if (resolvedDestination) {
    enriched.destinationMarket = resolvedDestination.countryCode
  }
  
  return enriched
}
```

### Query Optimizer

Optimizes the query for each provider.

```typescript
interface OptimizedQuery {
  // Original query
  original: EnrichedQuery
  
  // Optimized per provider
  providerQueries: Map<string, ProviderQuery>
  
  // Execution plan
  executionPlan: ExecutionPlan
}

interface ProviderQuery {
  provider: string
  category: SearchCategory
  params: any
  priority: number
  timeout: number
  fallbackTo?: string
}

interface ExecutionPlan {
  strategy: 'parallel' | 'sequential' | 'hybrid'
  phases: ExecutionPhase[]
  totalTimeout: number
  minResultsRequired: number
}

interface ExecutionPhase {
  phase: number
  providers: string[]
  category: SearchCategory
  timeout: number
  waitForAll: boolean
}

function optimizeQuery(query: EnrichedQuery): OptimizedQuery {
  const providerQueries = new Map<string, ProviderQuery>()
  const phases: ExecutionPhase[] = []
  
  // Determine which categories to search
  const categories = query.mode === 'unified' 
    ? determineRelevantCategories(query)
    : [query.mode as SearchCategory]
  
  // For each category, create optimized provider queries
  for (const category of categories) {
    const providers = selectProvidersForCategory(category, query)
    
    for (const provider of providers) {
      const optimizedParams = optimizeParamsForProvider(provider, category, query)
      
      providerQueries.set(`${provider}-${category}`, {
        provider,
        category,
        params: optimizedParams,
        priority: calculateProviderPriority(provider, category, query),
        timeout: getProviderTimeout(provider, category),
        fallbackTo: getFallbackProvider(provider, category)
      })
    }
    
    // Group into execution phase
    phases.push({
      phase: phases.length + 1,
      providers: providers,
      category,
      timeout: Math.max(...providers.map(p => getProviderTimeout(p, category))),
      waitForAll: query.intent.primaryIntent === 'compare'
    })
  }
  
  return {
    original: query,
    providerQueries,
    executionPlan: {
      strategy: determineStrategy(query, phases),
      phases,
      totalTimeout: calculateTotalTimeout(phases),
      minResultsRequired: query.intent.primaryIntent === 'explore' ? 1 : 3
    }
  }
}
```

---

## Multi-Provider Executor

### Parallel Execution Engine

```typescript
interface ExecutionResult {
  provider: string
  category: SearchCategory
  success: boolean
  results: UnifiedResult[]
  error?: Error
  responseTime: number
  fromCache: boolean
}

async function executeSearch(
  optimizedQuery: OptimizedQuery
): Promise<ExecutionResult[]> {
  
  const { executionPlan, providerQueries } = optimizedQuery
  const allResults: ExecutionResult[] = []
  
  for (const phase of executionPlan.phases) {
    // Create promises for all providers in this phase
    const promises = phase.providers.map(provider => {
      const query = providerQueries.get(`${provider}-${phase.category}`)
      return executeProviderQuery(query, phase.timeout)
    })
    
    if (phase.waitForAll) {
      // Wait for all providers (for comparison)
      const results = await Promise.allSettled(promises)
      allResults.push(...processSettledResults(results, phase.providers, phase.category))
    } else {
      // Race for first results (for speed)
      const raceResult = await Promise.race([
        Promise.any(promises),
        timeout(phase.timeout)
      ])
      
      if (raceResult) {
        allResults.push(raceResult)
        
        // Continue collecting remaining results in background
        Promise.allSettled(promises).then(results => {
          // Update session with additional results
          updateSessionResults(optimizedQuery.original.sessionId, results)
        })
      }
    }
    
    // Check if we have enough results
    if (allResults.length >= executionPlan.minResultsRequired) {
      // Can return early for exploration queries
      if (optimizedQuery.original.intent.primaryIntent === 'explore') {
        break
      }
    }
  }
  
  return allResults
}

async function executeProviderQuery(
  query: ProviderQuery,
  maxTimeout: number
): Promise<ExecutionResult> {
  
  const startTime = Date.now()
  
  // Check cache first
  const cacheKey = generateCacheKey(query)
  const cached = await checkCache(cacheKey)
  
  if (cached && !isExpired(cached)) {
    return {
      provider: query.provider,
      category: query.category,
      success: true,
      results: cached.results,
      responseTime: Date.now() - startTime,
      fromCache: true
    }
  }
  
  try {
    // Execute with timeout
    const result = await Promise.race([
      callProviderAdapter(query.provider, query.category, query.params),
      timeout(Math.min(query.timeout, maxTimeout))
    ])
    
    // Cache successful results
    await cacheResults(cacheKey, result, getCacheTTL(query.category))
    
    return {
      provider: query.provider,
      category: query.category,
      success: true,
      results: result,
      responseTime: Date.now() - startTime,
      fromCache: false
    }
    
  } catch (error) {
    // Log failure
    await logProviderFailure(query.provider, query.category, error)
    
    // Try fallback if available
    if (query.fallbackTo) {
      return executeProviderQuery(
        { ...query, provider: query.fallbackTo, fallbackTo: undefined },
        maxTimeout - (Date.now() - startTime)
      )
    }
    
    return {
      provider: query.provider,
      category: query.category,
      success: false,
      results: [],
      error,
      responseTime: Date.now() - startTime,
      fromCache: false
    }
  }
}
```

### Progressive Loading Strategy

```typescript
interface ProgressiveSearchStream {
  // Initial results (fast)
  initialResults: AsyncGenerator<SearchResultBatch>
  
  // Complete results (comprehensive)
  completeResults: Promise<SearchResults>
  
  // Status updates
  statusUpdates: AsyncGenerator<SearchStatus>
}

async function* streamSearchResults(
  query: OptimizedQuery
): AsyncGenerator<SearchResultBatch> {
  
  const startTime = Date.now()
  const seenResults = new Set<string>()
  
  // Phase 1: Cached results (immediate)
  const cachedResults = await getCachedResults(query)
  if (cachedResults.length > 0) {
    yield {
      phase: 'cached',
      results: cachedResults,
      isComplete: false,
      elapsedMs: Date.now() - startTime
    }
    cachedResults.forEach(r => seenResults.add(r.id))
  }
  
  // Phase 2: Primary provider (fast)
  const primaryProvider = getPrimaryProvider(query)
  const primaryResults = await executeSingleProvider(primaryProvider, query)
  
  const newPrimaryResults = primaryResults.filter(r => !seenResults.has(r.id))
  if (newPrimaryResults.length > 0) {
    yield {
      phase: 'primary',
      results: newPrimaryResults,
      isComplete: false,
      elapsedMs: Date.now() - startTime
    }
    newPrimaryResults.forEach(r => seenResults.add(r.id))
  }
  
  // Phase 3: Secondary providers (comprehensive)
  const secondaryProviders = getSecondaryProviders(query)
  
  for await (const result of executeProvidersStreaming(secondaryProviders, query)) {
    const newResults = result.results.filter(r => !seenResults.has(r.id))
    if (newResults.length > 0) {
      yield {
        phase: 'secondary',
        provider: result.provider,
        results: newResults,
        isComplete: false,
        elapsedMs: Date.now() - startTime
      }
      newResults.forEach(r => seenResults.add(r.id))
    }
  }
  
  // Final yield
  yield {
    phase: 'complete',
    results: [],
    isComplete: true,
    elapsedMs: Date.now() - startTime,
    totalResults: seenResults.size
  }
}
```

---

## Result Processor

### Deduplication Engine

Identifies and merges duplicate offers from different providers.

```typescript
interface DeduplicationResult {
  uniqueResults: UnifiedResult[]
  duplicateGroups: DuplicateGroup[]
  deduplicationStats: {
    totalInput: number
    uniqueOutput: number
    duplicatesFound: number
    duplicateRate: number
  }
}

interface DuplicateGroup {
  primaryResult: UnifiedResult
  duplicates: {
    result: UnifiedResult
    similarityScore: number
    priceDifference: number
  }[]
}

function deduplicateResults(
  results: UnifiedResult[],
  category: SearchCategory
): DeduplicationResult {
  
  const similarityThreshold = getSimilarityThreshold(category)
  const duplicateGroups: DuplicateGroup[] = []
  const uniqueResults: UnifiedResult[] = []
  const processed = new Set<string>()
  
  // Sort by price (prefer cheaper as primary)
  const sortedResults = [...results].sort((a, b) => a.price.amount - b.price.amount)
  
  for (const result of sortedResults) {
    if (processed.has(result.id)) continue
    
    // Find duplicates
    const duplicates: DuplicateGroup['duplicates'] = []
    
    for (const other of sortedResults) {
      if (processed.has(other.id) || result.id === other.id) continue
      
      const similarity = calculateSimilarity(result, other, category)
      
      if (similarity >= similarityThreshold) {
        duplicates.push({
          result: other,
          similarityScore: similarity,
          priceDifference: other.price.amount - result.price.amount
        })
        processed.add(other.id)
      }
    }
    
    // Mark primary as processed
    processed.add(result.id)
    
    if (duplicates.length > 0) {
      duplicateGroups.push({
        primaryResult: result,
        duplicates
      })
      
      // Enrich primary with best attributes from duplicates
      const enrichedResult = enrichFromDuplicates(result, duplicates)
      uniqueResults.push(enrichedResult)
    } else {
      uniqueResults.push(result)
    }
  }
  
  return {
    uniqueResults,
    duplicateGroups,
    deduplicationStats: {
      totalInput: results.length,
      uniqueOutput: uniqueResults.length,
      duplicatesFound: results.length - uniqueResults.length,
      duplicateRate: (results.length - uniqueResults.length) / results.length
    }
  }
}

function calculateSimilarity(
  a: UnifiedResult,
  b: UnifiedResult,
  category: SearchCategory
): number {
  
  switch (category) {
    case 'flights':
      return calculateFlightSimilarity(a as UnifiedFlight, b as UnifiedFlight)
    case 'hotels':
      return calculateHotelSimilarity(a as UnifiedHotel, b as UnifiedHotel)
    case 'cars':
      return calculateCarSimilarity(a as UnifiedCarRental, b as UnifiedCarRental)
    case 'experiences':
      return calculateExperienceSimilarity(a as UnifiedExperience, b as UnifiedExperience)
    default:
      return 0
  }
}

function calculateFlightSimilarity(a: UnifiedFlight, b: UnifiedFlight): number {
  let score = 0
  let maxScore = 0
  
  // Same flight numbers = very likely duplicate
  const aFlights = a.slices.flatMap(s => s.segments.map(seg => seg.flightNumber))
  const bFlights = b.slices.flatMap(s => s.segments.map(seg => seg.flightNumber))
  
  if (JSON.stringify(aFlights.sort()) === JSON.stringify(bFlights.sort())) {
    score += 50
  }
  maxScore += 50
  
  // Same departure times
  if (a.slices[0]?.departureAt === b.slices[0]?.departureAt) {
    score += 20
  }
  maxScore += 20
  
  // Same arrival times
  const aLastSlice = a.slices[a.slices.length - 1]
  const bLastSlice = b.slices[b.slices.length - 1]
  if (aLastSlice?.arrivalAt === bLastSlice?.arrivalAt) {
    score += 15
  }
  maxScore += 15
  
  // Same airlines
  const aAirlines = [...new Set(a.slices.flatMap(s => s.segments.map(seg => seg.marketingCarrier.code)))]
  const bAirlines = [...new Set(b.slices.flatMap(s => s.segments.map(seg => seg.marketingCarrier.code)))]
  if (JSON.stringify(aAirlines.sort()) === JSON.stringify(bAirlines.sort())) {
    score += 15
  }
  maxScore += 15
  
  return score / maxScore
}

function calculateHotelSimilarity(a: UnifiedHotel, b: UnifiedHotel): number {
  let score = 0
  let maxScore = 0
  
  // Same property name (fuzzy)
  const nameSimilarity = fuzzyMatch(a.name, b.name)
  score += nameSimilarity * 40
  maxScore += 40
  
  // Same location (within 100m)
  if (a.location.coordinates && b.location.coordinates) {
    const distance = calculateDistance(a.location.coordinates, b.location.coordinates)
    if (distance < 0.1) { // 100m
      score += 30
    }
  }
  maxScore += 30
  
  // Same star rating
  if (a.starRating === b.starRating) {
    score += 15
  }
  maxScore += 15
  
  // Same property type
  if (a.propertyType === b.propertyType) {
    score += 15
  }
  maxScore += 15
  
  return score / maxScore
}
```

### Ranking Engine

Multi-factor ranking system that considers price, quality, relevance, and personalization.

```typescript
interface RankingConfig {
  weights: {
    price: number
    quality: number
    relevance: number
    personalization: number
    freshness: number
  }
  boosts: RankingBoost[]
  penalties: RankingPenalty[]
}

interface RankedResult extends UnifiedResult {
  ranking: {
    priceScore: number
    qualityScore: number
    relevanceScore: number
    personalizationScore: number
    freshnessScore: number
    totalScore: number
    rank: number
    scoreBreakdown: ScoreBreakdown
  }
}

const DEFAULT_RANKING_CONFIG: RankingConfig = {
  weights: {
    price: 0.30,
    quality: 0.25,
    relevance: 0.20,
    personalization: 0.15,
    freshness: 0.10
  },
  boosts: [
    { condition: 'is_refundable', boost: 0.05 },
    { condition: 'free_cancellation', boost: 0.08 },
    { condition: 'instant_confirmation', boost: 0.03 },
    { condition: 'verified_provider', boost: 0.05 },
    { condition: 'includes_breakfast', boost: 0.04 },
    { condition: 'direct_flight', boost: 0.10 }
  ],
  penalties: [
    { condition: 'non_refundable', penalty: 0.05 },
    { condition: 'many_stops', penalty: 0.08 },
    { condition: 'long_layover', penalty: 0.06 },
    { condition: 'low_rating', penalty: 0.10 },
    { condition: 'price_increased', penalty: 0.15 }
  ]
}

function rankResults(
  results: UnifiedResult[],
  query: EnrichedQuery,
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): RankedResult[] {
  
  // Calculate score components for each result
  const scoredResults = results.map(result => {
    const priceScore = calculatePriceScore(result, results)
    const qualityScore = calculateQualityScore(result)
    const relevanceScore = calculateRelevanceScore(result, query)
    const personalizationScore = calculatePersonalizationScore(result, query.userPreferences)
    const freshnessScore = calculateFreshnessScore(result)
    
    // Apply boosts
    let boostTotal = 0
    for (const boost of config.boosts) {
      if (checkCondition(result, boost.condition)) {
        boostTotal += boost.boost
      }
    }
    
    // Apply penalties
    let penaltyTotal = 0
    for (const penalty of config.penalties) {
      if (checkCondition(result, penalty.condition)) {
        penaltyTotal += penalty.penalty
      }
    }
    
    // Calculate total score
    const weightedScore = 
      priceScore * config.weights.price +
      qualityScore * config.weights.quality +
      relevanceScore * config.weights.relevance +
      personalizationScore * config.weights.personalization +
      freshnessScore * config.weights.freshness
    
    const totalScore = Math.max(0, Math.min(100, weightedScore + boostTotal - penaltyTotal))
    
    return {
      ...result,
      ranking: {
        priceScore,
        qualityScore,
        relevanceScore,
        personalizationScore,
        freshnessScore,
        totalScore,
        rank: 0, // Will be set after sorting
        scoreBreakdown: {
          priceScore,
          qualityScore,
          relevanceScore,
          personalizationScore,
          freshnessScore,
          boosts: boostTotal,
          penalties: penaltyTotal
        }
      }
    }
  })
  
  // Sort by total score
  scoredResults.sort((a, b) => b.ranking.totalScore - a.ranking.totalScore)
  
  // Assign ranks
  scoredResults.forEach((result, index) => {
    result.ranking.rank = index + 1
  })
  
  return scoredResults
}

function calculatePriceScore(result: UnifiedResult, allResults: UnifiedResult[]): number {
  const prices = allResults.map(r => r.price.amount)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice
  
  if (priceRange === 0) return 50 // All same price
  
  // Inverse score: lower price = higher score
  const normalizedPrice = (result.price.amount - minPrice) / priceRange
  return (1 - normalizedPrice) * 100
}

function calculateQualityScore(result: UnifiedResult): number {
  let score = 50 // Base score
  
  // Based on type
  if ('starRating' in result && result.starRating) {
    score = (result.starRating / 5) * 40 + 20
  }
  
  if ('guestRating' in result && result.guestRating) {
    const rating = result.guestRating.score / result.guestRating.maxScore
    score = score * 0.6 + rating * 100 * 0.4
  }
  
  if ('rating' in result && result.rating) {
    const rating = result.rating.score / result.rating.maxScore
    score = rating * 100
  }
  
  // Boost for verified reviews
  if ('guestRating' in result && result.guestRating?.reviewCount > 100) {
    score += 5
  }
  
  return Math.min(100, score)
}

function calculateRelevanceScore(result: UnifiedResult, query: EnrichedQuery): number {
  let score = 50
  
  // Flight relevance
  if ('slices' in result) {
    const flight = result as UnifiedFlight
    
    // Prefer fewer stops
    if (flight.totalStops === 0) score += 20
    else if (flight.totalStops === 1) score += 10
    else score -= flight.totalStops * 5
    
    // Prefer reasonable duration
    const avgDurationForRoute = query.pricingIntelligence?.avgDuration || flight.totalDurationMinutes
    if (flight.totalDurationMinutes <= avgDurationForRoute * 1.1) {
      score += 15
    } else if (flight.totalDurationMinutes > avgDurationForRoute * 1.5) {
      score -= 10
    }
    
    // Prefer matching cabin class
    if (query.travelers.cabinClass) {
      const hasCabinClass = flight.slices.every(s => 
        s.segments.every(seg => seg.cabinClass === query.travelers.cabinClass)
      )
      if (hasCabinClass) score += 10
    }
  }
  
  // Hotel relevance
  if ('rooms' in result) {
    const hotel = result as UnifiedHotel
    
    // Distance from search point
    if (hotel.distanceFromSearch) {
      if (hotel.distanceFromSearch.value < 1) score += 20
      else if (hotel.distanceFromSearch.value < 3) score += 10
      else if (hotel.distanceFromSearch.value > 10) score -= 10
    }
    
    // Match property type preference
    if (query.filters?.propertyTypes?.includes(hotel.propertyType)) {
      score += 10
    }
  }
  
  return Math.max(0, Math.min(100, score))
}

function calculatePersonalizationScore(
  result: UnifiedResult,
  preferences?: UserPreferences
): number {
  if (!preferences) return 50 // Neutral score
  
  let score = 50
  
  // Budget alignment
  if (preferences.budgetLevel) {
    const budgetRanges = {
      budget: { min: 0, max: 0.33 },
      mid_range: { min: 0.33, max: 0.66 },
      luxury: { min: 0.66, max: 1.0 }
    }
    
    // This would need actual price percentile calculation
    const pricePercentile = 0.5 // Placeholder
    const range = budgetRanges[preferences.budgetLevel]
    
    if (pricePercentile >= range.min && pricePercentile <= range.max) {
      score += 20
    }
  }
  
  // Airline preferences
  if (preferences.preferredAirlines && 'slices' in result) {
    const flight = result as UnifiedFlight
    const airlines = flight.slices.flatMap(s => s.segments.map(seg => seg.marketingCarrier.code))
    if (airlines.some(a => preferences.preferredAirlines.includes(a))) {
      score += 15
    }
  }
  
  // Hotel chain preferences
  if (preferences.preferredHotelChains && 'brand' in result) {
    const hotel = result as UnifiedHotel
    if (hotel.brand && preferences.preferredHotelChains.includes(hotel.brand)) {
      score += 15
    }
  }
  
  // Amenity preferences
  if (preferences.requiredAmenities && 'amenities' in result) {
    const hotel = result as UnifiedHotel
    const hotelAmenities = hotel.amenities.map(a => a.id)
    const matchedAmenities = preferences.requiredAmenities.filter(a => hotelAmenities.includes(a))
    score += (matchedAmenities.length / preferences.requiredAmenities.length) * 20
  }
  
  return Math.max(0, Math.min(100, score))
}
```

### Filter Engine

Powerful filtering with smart filter suggestions.

```typescript
interface FilterDefinition {
  id: string
  type: 'range' | 'multi_select' | 'single_select' | 'boolean' | 'time_range'
  label: string
  field: string
  options?: FilterOption[]
  range?: { min: number; max: number; step: number }
  format?: string
}

interface FilterOption {
  value: string | number | boolean
  label: string
  count: number
  disabled?: boolean
}

interface AppliedFilters {
  [filterId: string]: any
}

interface FilterResult {
  filteredResults: UnifiedResult[]
  availableFilters: FilterDefinition[]
  appliedFilters: AppliedFilters
  filterStats: {
    totalBefore: number
    totalAfter: number
    removedCount: number
  }
}

const FLIGHT_FILTERS: FilterDefinition[] = [
  {
    id: 'stops',
    type: 'multi_select',
    label: 'Stops',
    field: 'totalStops',
    options: [
      { value: 0, label: 'Nonstop', count: 0 },
      { value: 1, label: '1 stop', count: 0 },
      { value: 2, label: '2+ stops', count: 0 }
    ]
  },
  {
    id: 'price',
    type: 'range',
    label: 'Price',
    field: 'price.amount',
    range: { min: 0, max: 5000, step: 50 }
  },
  {
    id: 'departure_time',
    type: 'time_range',
    label: 'Departure Time',
    field: 'slices.0.departureAt',
    options: [
      { value: 'early_morning', label: 'Early Morning (12am-6am)', count: 0 },
      { value: 'morning', label: 'Morning (6am-12pm)', count: 0 },
      { value: 'afternoon', label: 'Afternoon (12pm-6pm)', count: 0 },
      { value: 'evening', label: 'Evening (6pm-12am)', count: 0 }
    ]
  },
  {
    id: 'duration',
    type: 'range',
    label: 'Duration',
    field: 'totalDurationMinutes',
    range: { min: 0, max: 1440, step: 30 },
    format: 'duration'
  },
  {
    id: 'airlines',
    type: 'multi_select',
    label: 'Airlines',
    field: 'slices.*.segments.*.marketingCarrier.code',
    options: [] // Populated dynamically
  },
  {
    id: 'cabin_class',
    type: 'single_select',
    label: 'Cabin Class',
    field: 'slices.*.segments.*.cabinClass',
    options: [
      { value: 'economy', label: 'Economy', count: 0 },
      { value: 'premium_economy', label: 'Premium Economy', count: 0 },
      { value: 'business', label: 'Business', count: 0 },
      { value: 'first', label: 'First', count: 0 }
    ]
  },
  {
    id: 'refundable',
    type: 'boolean',
    label: 'Refundable',
    field: 'isRefundable'
  },
  {
    id: 'bags_included',
    type: 'boolean',
    label: 'Bags Included',
    field: 'baggage.checked.included'
  }
]

const HOTEL_FILTERS: FilterDefinition[] = [
  {
    id: 'price_per_night',
    type: 'range',
    label: 'Price per Night',
    field: 'lowestPrice.amount',
    range: { min: 0, max: 1000, step: 25 }
  },
  {
    id: 'star_rating',
    type: 'multi_select',
    label: 'Star Rating',
    field: 'starRating',
    options: [
      { value: 5, label: '5 Stars', count: 0 },
      { value: 4, label: '4 Stars', count: 0 },
      { value: 3, label: '3 Stars', count: 0 },
      { value: 2, label: '2 Stars', count: 0 },
      { value: 1, label: '1 Star', count: 0 }
    ]
  },
  {
    id: 'guest_rating',
    type: 'range',
    label: 'Guest Rating',
    field: 'guestRating.score',
    range: { min: 0, max: 10, step: 0.5 }
  },
  {
    id: 'property_type',
    type: 'multi_select',
    label: 'Property Type',
    field: 'propertyType',
    options: [
      { value: 'hotel', label: 'Hotel', count: 0 },
      { value: 'resort', label: 'Resort', count: 0 },
      { value: 'apartment', label: 'Apartment', count: 0 },
      { value: 'villa', label: 'Villa', count: 0 },
      { value: 'hostel', label: 'Hostel', count: 0 }
    ]
  },
  {
    id: 'amenities',
    type: 'multi_select',
    label: 'Amenities',
    field: 'keyAmenities',
    options: [
      { value: 'wifi', label: 'Free WiFi', count: 0 },
      { value: 'pool', label: 'Pool', count: 0 },
      { value: 'gym', label: 'Gym', count: 0 },
      { value: 'spa', label: 'Spa', count: 0 },
      { value: 'restaurant', label: 'Restaurant', count: 0 },
      { value: 'parking', label: 'Parking', count: 0 },
      { value: 'pet_friendly', label: 'Pet Friendly', count: 0 }
    ]
  },
  {
    id: 'board_type',
    type: 'multi_select',
    label: 'Meals',
    field: 'rooms.*.boardType',
    options: [
      { value: 'breakfast', label: 'Breakfast Included', count: 0 },
      { value: 'half_board', label: 'Half Board', count: 0 },
      { value: 'full_board', label: 'Full Board', count: 0 },
      { value: 'all_inclusive', label: 'All Inclusive', count: 0 }
    ]
  },
  {
    id: 'free_cancellation',
    type: 'boolean',
    label: 'Free Cancellation',
    field: 'rooms.*.isRefundable'
  },
  {
    id: 'distance',
    type: 'range',
    label: 'Distance from Center',
    field: 'distanceFromSearch.value',
    range: { min: 0, max: 20, step: 1 },
    format: 'distance'
  }
]

function applyFilters(
  results: UnifiedResult[],
  category: SearchCategory,
  filters: AppliedFilters
): FilterResult {
  
  const filterDefinitions = getFilterDefinitions(category)
  const totalBefore = results.length
  
  // Apply each filter
  let filteredResults = [...results]
  
  for (const [filterId, filterValue] of Object.entries(filters)) {
    if (filterValue === null || filterValue === undefined) continue
    
    const definition = filterDefinitions.find(f => f.id === filterId)
    if (!definition) continue
    
    filteredResults = filteredResults.filter(result => {
      const fieldValue = getNestedValue(result, definition.field)
      return matchesFilter(fieldValue, filterValue, definition.type)
    })
  }
  
  // Update filter counts based on remaining results
  const updatedFilters = filterDefinitions.map(def => {
    if (def.options) {
      const updatedOptions = def.options.map(opt => ({
        ...opt,
        count: countMatchingResults(filteredResults, def.field, opt.value)
      }))
      return { ...def, options: updatedOptions }
    }
    return def
  })
  
  return {
    filteredResults,
    availableFilters: updatedFilters,
    appliedFilters: filters,
    filterStats: {
      totalBefore,
      totalAfter: filteredResults.length,
      removedCount: totalBefore - filteredResults.length
    }
  }
}

function generateSmartFilterSuggestions(
  results: UnifiedResult[],
  query: EnrichedQuery
): FilterSuggestion[] {
  
  const suggestions: FilterSuggestion[] = []
  
  // Suggest based on result distribution
  const priceDistribution = calculateDistribution(results.map(r => r.price.amount))
  
  if (priceDistribution.stdDev > priceDistribution.mean * 0.5) {
    suggestions.push({
      filterId: 'price',
      suggestion: 'budget',
      label: `Budget options under $${Math.round(priceDistribution.percentile25)}`,
      impact: countResultsBelow(results, priceDistribution.percentile25)
    })
  }
  
  // Suggest based on user preferences
  if (query.userPreferences?.preferredAirlines?.length > 0) {
    const preferredCount = countResultsWithAirlines(results, query.userPreferences.preferredAirlines)
    if (preferredCount > 0 && preferredCount < results.length) {
      suggestions.push({
        filterId: 'airlines',
        suggestion: query.userPreferences.preferredAirlines,
        label: `Your preferred airlines (${preferredCount} options)`,
        impact: preferredCount
      })
    }
  }
  
  // Suggest "Best Value" filter
  const bestValueResults = results.filter(r => 
    r.ranking?.valueScore > 70 && r.ranking?.qualityScore > 60
  )
  if (bestValueResults.length > 0 && bestValueResults.length < results.length * 0.3) {
    suggestions.push({
      filterId: 'smart_filter',
      suggestion: 'best_value',
      label: `Best Value (${bestValueResults.length} top picks)`,
      impact: bestValueResults.length
    })
  }
  
  return suggestions.slice(0, 5) // Return top 5 suggestions
}
```

---

## Session Manager

### Session Store

```typescript
interface SearchSession {
  id: string
  token: string
  userId?: string
  anonymousId?: string
  
  // Query
  query: EnrichedQuery
  
  // Results
  results: {
    [category: string]: {
      items: UnifiedResult[]
      totalCount: number
      pageInfo: PageInfo
      providers: ProviderMeta[]
    }
  }
  
  // Filters & Sorting
  appliedFilters: AppliedFilters
  sortBy: SortOption
  
  // State
  status: SessionStatus
  lastActivity: Date
  
  // Price tracking
  priceSnapshots: PriceSnapshot[]
  
  // Analytics
  analytics: SessionAnalytics
}

interface SessionAnalytics {
  searchStarted: Date
  searchCompleted?: Date
  resultsViewed: number
  filtersApplied: number
  sortsApplied: number
  offersClicked: string[]
  offersSaved: string[]
  timeSpentSeconds: number
  deviceType: string
  exitReason?: string
}

class SessionManager {
  private supabase: SupabaseClient
  private cache: Map<string, SearchSession> = new Map()
  
  async createSession(
    query: EnrichedQuery,
    userId?: string
  ): Promise<SearchSession> {
    
    const sessionToken = generateSessionToken()
    
    const session: SearchSession = {
      id: crypto.randomUUID(),
      token: sessionToken,
      userId,
      anonymousId: userId ? undefined : generateAnonymousId(),
      query,
      results: {},
      appliedFilters: {},
      sortBy: 'recommended',
      status: 'pending',
      lastActivity: new Date(),
      priceSnapshots: [],
      analytics: {
        searchStarted: new Date(),
        resultsViewed: 0,
        filtersApplied: 0,
        sortsApplied: 0,
        offersClicked: [],
        offersSaved: [],
        timeSpentSeconds: 0,
        deviceType: query.deviceType || 'unknown'
      }
    }
    
    // Store in database
    await this.saveSession(session)
    
    // Cache locally
    this.cache.set(sessionToken, session)
    
    return session
  }
  
  async updateSessionResults(
    sessionToken: string,
    category: SearchCategory,
    results: ExecutionResult[]
  ): Promise<void> {
    
    const session = await this.getSession(sessionToken)
    if (!session) throw new Error('Session not found')
    
    // Normalize and deduplicate results
    const normalizedResults = results
      .filter(r => r.success)
      .flatMap(r => r.results)
    
    const deduped = deduplicateResults(normalizedResults, category)
    
    // Rank results
    const ranked = rankResults(deduped.uniqueResults, session.query)
    
    // Update session
    session.results[category] = {
      items: ranked,
      totalCount: ranked.length,
      pageInfo: {
        page: 1,
        pageSize: 50,
        totalPages: Math.ceil(ranked.length / 50),
        hasMore: ranked.length > 50
      },
      providers: results.map(r => ({
        code: r.provider,
        responseTime: r.responseTime,
        fromCache: r.fromCache,
        resultCount: r.results.length
      }))
    }
    
    session.status = 'completed'
    session.lastActivity = new Date()
    
    // Save price snapshot
    session.priceSnapshots.push({
      timestamp: new Date(),
      category,
      lowestPrice: ranked[0]?.price,
      avgPrice: calculateAvgPrice(ranked)
    })
    
    await this.saveSession(session)
  }
  
  async applyFilters(
    sessionToken: string,
    category: SearchCategory,
    filters: AppliedFilters
  ): Promise<FilterResult> {
    
    const session = await this.getSession(sessionToken)
    if (!session) throw new Error('Session not found')
    
    const categoryResults = session.results[category]
    if (!categoryResults) throw new Error('No results for category')
    
    // Apply filters
    const filterResult = applyFilters(categoryResults.items, category, filters)
    
    // Update session
    session.appliedFilters = { ...session.appliedFilters, [category]: filters }
    session.analytics.filtersApplied++
    session.lastActivity = new Date()
    
    await this.saveSession(session)
    
    return filterResult
  }
  
  async applySorting(
    sessionToken: string,
    category: SearchCategory,
    sortBy: SortOption
  ): Promise<UnifiedResult[]> {
    
    const session = await this.getSession(sessionToken)
    if (!session) throw new Error('Session not found')
    
    const categoryResults = session.results[category]
    if (!categoryResults) throw new Error('No results for category')
    
    // Sort results
    const sorted = sortResults(categoryResults.items, sortBy)
    
    // Update session
    session.sortBy = sortBy
    session.results[category].items = sorted
    session.analytics.sortsApplied++
    session.lastActivity = new Date()
    
    await this.saveSession(session)
    
    return sorted
  }
  
  async trackOfferClick(
    sessionToken: string,
    offerId: string
  ): Promise<void> {
    
    const session = await this.getSession(sessionToken)
    if (!session) return
    
    session.analytics.offersClicked.push(offerId)
    session.analytics.resultsViewed++
    session.lastActivity = new Date()
    
    await this.saveSession(session)
  }
  
  async getSession(token: string): Promise<SearchSession | null> {
    // Check cache first
    if (this.cache.has(token)) {
      return this.cache.get(token)
    }
    
    // Load from database
    const { data } = await this.supabase
      .from('search_sessions')
      .select('*')
      .eq('session_token', token)
      .single()
    
    if (data) {
      const session = deserializeSession(data)
      this.cache.set(token, session)
      return session
    }
    
    return null
  }
  
  private async saveSession(session: SearchSession): Promise<void> {
    this.cache.set(session.token, session)
    
    await this.supabase
      .from('search_sessions')
      .upsert(serializeSession(session))
  }
}
```

### Price Tracker

Monitors price changes and notifies users.

```typescript
class PriceTracker {
  
  async checkPriceChanges(sessionToken: string): Promise<PriceChange[]> {
    const session = await sessionManager.getSession(sessionToken)
    if (!session) return []
    
    const changes: PriceChange[] = []
    
    for (const [category, results] of Object.entries(session.results)) {
      const currentPrices = results.items.slice(0, 10) // Top 10 results
      
      // Get fresh prices from providers
      const freshPrices = await this.refreshPrices(currentPrices)
      
      for (const [offerId, freshPrice] of freshPrices) {
        const original = currentPrices.find(r => r.id === offerId)
        if (!original) continue
        
        const priceDiff = freshPrice.amount - original.price.amount
        const percentChange = (priceDiff / original.price.amount) * 100
        
        if (Math.abs(percentChange) >= 5) { // 5% threshold
          changes.push({
            offerId,
            originalPrice: original.price,
            newPrice: freshPrice,
            difference: priceDiff,
            percentChange,
            direction: priceDiff > 0 ? 'increased' : 'decreased'
          })
        }
      }
    }
    
    return changes
  }
  
  async createPriceAlert(
    userId: string,
    searchParams: any,
    targetPrice: number
  ): Promise<PriceAlert> {
    
    const alert = {
      id: crypto.randomUUID(),
      userId,
      category: searchParams.category,
      searchParams,
      targetPrice,
      priceurrency: searchParams.currency || 'USD',
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
    
    await supabase.from('price_alerts').insert(alert)
    
    return alert
  }
  
  async processPriceAlerts(): Promise<void> {
    // Get active alerts
    const { data: alerts } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
    
    for (const alert of alerts || []) {
      // Run search
      const results = await searchEngine.search(alert.searchParams)
      
      // Check if any result meets target price
      const matchingResults = results.filter(r => r.price.amount <= alert.targetPrice)
      
      if (matchingResults.length > 0) {
        // Trigger alert
        await this.triggerAlert(alert, matchingResults[0])
      } else {
        // Update current best price
        const bestPrice = Math.min(...results.map(r => r.price.amount))
        await supabase
          .from('price_alerts')
          .update({ current_best_price: bestPrice, updated_at: new Date() })
          .eq('id', alert.id)
      }
    }
  }
  
  private async triggerAlert(alert: PriceAlert, result: UnifiedResult): Promise<void> {
    // Send notification
    await notificationService.send({
      userId: alert.userId,
      type: 'price_alert_triggered',
      title: 'Price Drop Alert! 🎉',
      body: `Your tracked price dropped to ${result.price.formatted}`,
      data: {
        alertId: alert.id,
        offerId: result.id,
        category: alert.category
      }
    })
    
    // Mark alert as triggered
    await supabase
      .from('price_alerts')
      .update({
        triggered: true,
        triggered_at: new Date(),
        notification_sent: true
      })
      .eq('id', alert.id)
  }
}
```

---

## Sorting System

```typescript
type SortOption = 
  | 'recommended'
  | 'price_low'
  | 'price_high'
  | 'duration_short'
  | 'duration_long'
  | 'departure_early'
  | 'departure_late'
  | 'arrival_early'
  | 'arrival_late'
  | 'rating_high'
  | 'distance_near'
  | 'popularity'

interface SortConfig {
  option: SortOption
  field: string
  direction: 'asc' | 'desc'
  category: SearchCategory[]
}

const SORT_CONFIGS: SortConfig[] = [
  { option: 'recommended', field: 'ranking.totalScore', direction: 'desc', category: ['flights', 'hotels', 'cars', 'experiences'] },
  { option: 'price_low', field: 'price.amount', direction: 'asc', category: ['flights', 'hotels', 'cars', 'experiences'] },
  { option: 'price_high', field: 'price.amount', direction: 'desc', category: ['flights', 'hotels', 'cars', 'experiences'] },
  { option: 'duration_short', field: 'totalDurationMinutes', direction: 'asc', category: ['flights'] },
  { option: 'duration_long', field: 'totalDurationMinutes', direction: 'desc', category: ['flights'] },
  { option: 'departure_early', field: 'slices.0.departureAt', direction: 'asc', category: ['flights'] },
  { option: 'departure_late', field: 'slices.0.departureAt', direction: 'desc', category: ['flights'] },
  { option: 'rating_high', field: 'guestRating.score', direction: 'desc', category: ['hotels', 'experiences'] },
  { option: 'distance_near', field: 'distanceFromSearch.value', direction: 'asc', category: ['hotels'] },
  { option: 'popularity', field: 'bookingCount', direction: 'desc', category: ['experiences'] }
]

function sortResults(results: UnifiedResult[], sortBy: SortOption): UnifiedResult[] {
  const config = SORT_CONFIGS.find(c => c.option === sortBy)
  if (!config) return results
  
  return [...results].sort((a, b) => {
    const aValue = getNestedValue(a, config.field)
    const bValue = getNestedValue(b, config.field)
    
    if (aValue === undefined || aValue === null) return 1
    if (bValue === undefined || bValue === null) return -1
    
    if (config.direction === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
}

function getAvailableSorts(category: SearchCategory): SortOption[] {
  return SORT_CONFIGS
    .filter(c => c.category.includes(category))
    .map(c => c.option)
}
```

---

## Unified Search Flow

### Main Search Endpoint

```typescript
// supabase/functions/search/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { QueryProcessor } from './query-processor.ts'
import { MultiProviderExecutor } from './executor.ts'
import { ResultProcessor } from './result-processor.ts'
import { SessionManager } from './session-manager.ts'

serve(async (req: Request) => {
  const startTime = Date.now()
  
  try {
    const body = await req.json()
    const {
      mode,
      destination,
      origin,
      dates,
      travelers,
      filters,
      sortBy,
      options,
      sessionToken,  // For continuing existing search
      userId
    } = body
    
    // Initialize components
    const queryProcessor = new QueryProcessor()
    const executor = new MultiProviderExecutor()
    const resultProcessor = new ResultProcessor()
    const sessionManager = new SessionManager()
    
    // Check if continuing existing session
    if (sessionToken) {
      return await handleSessionContinuation(sessionToken, body, sessionManager)
    }
    
    // 1. Parse query
    const parsedQuery = queryProcessor.parse({
      mode,
      destination,
      origin,
      dates,
      travelers,
      filters,
      sortBy,
      options
    })
    
    // 2. Enrich query with context
    const enrichedQuery = await queryProcessor.enrich(parsedQuery, userId)
    
    // 3. Optimize query for providers
    const optimizedQuery = queryProcessor.optimize(enrichedQuery)
    
    // 4. Create session
    const session = await sessionManager.createSession(enrichedQuery, userId)
    
    // 5. Execute search across providers
    const executionResults = await executor.execute(optimizedQuery)
    
    // 6. Process results
    const processedResults = await resultProcessor.process(
      executionResults,
      enrichedQuery
    )
    
    // 7. Update session with results
    for (const [category, results] of Object.entries(processedResults)) {
      await sessionManager.updateSessionResults(
        session.token,
        category as SearchCategory,
        results
      )
    }
    
    // 8. Get final session state
    const finalSession = await sessionManager.getSession(session.token)
    
    // 9. Build response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sessionToken: session.token,
          results: finalSession.results,
          query: {
            destination: enrichedQuery.resolvedDestination,
            dates: enrichedQuery.dates,
            travelers: enrichedQuery.travelers
          },
          filters: generateAvailableFilters(finalSession.results, enrichedQuery),
          sorts: getAvailableSorts(enrichedQuery.mode as SearchCategory),
          suggestions: generateSearchSuggestions(enrichedQuery, finalSession.results),
          destinationInfo: enrichedQuery.destinationIntelligence,
          meta: {
            searchDuration: Date.now() - startTime,
            providers: getProviderSummary(executionResults),
            cacheHits: countCacheHits(executionResults)
          }
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Search error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: error.code || 'SEARCH_ERROR',
          message: error.message || 'An error occurred during search'
        }
      }),
      {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleSessionContinuation(
  sessionToken: string,
  body: any,
  sessionManager: SessionManager
): Promise<Response> {
  
  const { action, category, filters, sortBy, page } = body
  
  switch (action) {
    case 'filter':
      const filterResult = await sessionManager.applyFilters(sessionToken, category, filters)
      return jsonResponse({ success: true, data: filterResult })
      
    case 'sort':
      const sortedResults = await sessionManager.applySorting(sessionToken, category, sortBy)
      return jsonResponse({ success: true, data: { results: sortedResults } })
      
    case 'paginate':
      const session = await sessionManager.getSession(sessionToken)
      const pageResults = paginateResults(session.results[category], page)
      return jsonResponse({ success: true, data: pageResults })
      
    case 'refresh':
      // Re-run search with same params
      return jsonResponse({ success: true, action: 'refresh_required' })
      
    default:
      return jsonResponse({ success: false, error: 'Unknown action' }, 400)
  }
}
```

### Unified Search Request Format

```typescript
// From App → Search Engine

interface UnifiedSearchRequest {
  // Mode
  mode: 'unified' | 'flight' | 'hotel' | 'car' | 'experience' | 'package'
  
  // Destination (required)
  destination: {
    query?: string          // "Paris" or "Paris, France"
    code?: string           // "PAR" or "CDG"
    type?: 'city' | 'airport' | 'nearby'
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  
  // Origin (for flights/cars)
  origin?: {
    query?: string
    code?: string
    type?: 'city' | 'airport'
  }
  
  // Dates
  dates: {
    startDate: string       // "2024-03-15"
    endDate?: string        // "2024-03-22"
    flexible?: boolean
    flexDays?: number       // ±3 days
  }
  
  // Travelers
  travelers: {
    adults: number
    children: number
    childrenAges?: number[]
    infants: number
  }
  
  // Rooms (for hotels)
  rooms?: number
  
  // Category-specific
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first'
  tripType?: 'one_way' | 'round_trip' | 'multi_city'
  
  // Pre-applied filters
  filters?: {
    maxPrice?: number
    minRating?: number
    [key: string]: any
  }
  
  // Sorting
  sortBy?: SortOption
  
  // Options
  options?: {
    currency?: string
    language?: string
    limit?: number
    strategy?: 'fast' | 'comprehensive'
  }
}
```

### Unified Search Response Format

```typescript
// Search Engine → App

interface UnifiedSearchResponse {
  success: boolean
  
  data: {
    // Session for subsequent operations
    sessionToken: string
    
    // Results by category
    results: {
      flights?: {
        items: UnifiedFlight[]
        totalCount: number
        pageInfo: PageInfo
      }
      hotels?: {
        items: UnifiedHotel[]
        totalCount: number
        pageInfo: PageInfo
      }
      cars?: {
        items: UnifiedCarRental[]
        totalCount: number
        pageInfo: PageInfo
      }
      experiences?: {
        items: UnifiedExperience[]
        totalCount: number
        pageInfo: PageInfo
      }
    }
    
    // Query resolution
    query: {
      destination: ResolvedLocation
      origin?: ResolvedLocation
      dates: DateQuery
      travelers: TravelerQuery
    }
    
    // Available filters (with counts)
    filters: {
      [category: string]: FilterDefinition[]
    }
    
    // Available sorts
    sorts: {
      [category: string]: SortOption[]
    }
    
    // Smart suggestions
    suggestions: SearchSuggestion[]
    
    // Destination info
    destinationInfo?: DestinationIntelligence
    
    // Price insights
    priceInsights?: {
      avgPrice: number
      priceRange: { min: number; max: number }
      priceHistory: PricePoint[]
      bestTimeToBook?: string
    }
    
    // Metadata
    meta: {
      searchDuration: number
      providers: ProviderSummary[]
      cacheHits: number
      resultSources: {
        cached: number
        live: number
      }
    }
  }
  
  // Error (if success: false)
  error?: {
    code: string
    message: string
    details?: any
  }
}

interface SearchSuggestion {
  type: 'filter' | 'sort' | 'alternative' | 'deal'
  title: string
  description: string
  action: any
  impact?: string  // "Save up to $200"
}

interface PageInfo {
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}
```

---

## Plan Mode Integration

### Plan Mode Query Flow

```typescript
interface PlanModeRequest {
  mode: 'plan'
  planType: 'quick' | 'advanced' | 'import'
  
  // Quick plan answers
  quickPlanAnswers?: {
    destination?: string
    budget?: 'budget' | 'moderate' | 'luxury'
    duration?: number  // days
    travelStyle?: string[]  // ['adventure', 'relaxation', 'culture']
    interests?: string[]
    departureCity?: string
    travelDates?: {
      flexibility: 'exact' | 'flexible' | 'anytime'
      startDate?: string
      endDate?: string
      preferredMonths?: number[]
    }
    travelers?: TravelerQuery
  }
  
  // Advanced plan details
  advancedPlanDetails?: {
    // Much more detailed configuration
    mustHaveExperiences?: string[]
    dietaryRestrictions?: string[]
    mobilityNeeds?: string[]
    // ... etc
  }
  
  // Import data
  importData?: {
    type: 'email' | 'confirmation_number' | 'screenshot'
    data: any
  }
}

async function handlePlanModeSearch(request: PlanModeRequest): Promise<PlanSearchResponse> {
  
  switch (request.planType) {
    case 'quick':
      return await handleQuickPlan(request.quickPlanAnswers)
    case 'advanced':
      return await handleAdvancedPlan(request.advancedPlanDetails)
    case 'import':
      return await handleImport(request.importData)
  }
}

async function handleQuickPlan(answers: QuickPlanAnswers): Promise<PlanSearchResponse> {
  
  // 1. Resolve destination
  const destination = await resolveDestination(answers.destination)
  
  // 2. Get destination intelligence
  const destIntel = await getDestinationIntelligence(destination.code)
  
  // 3. Calculate optimal dates if flexible
  const dates = answers.travelDates.flexibility === 'anytime'
    ? suggestBestDates(destination, answers.duration, answers.budget)
    : { startDate: answers.travelDates.startDate, endDate: answers.travelDates.endDate }
  
  // 4. Generate search queries for each component
  const flightQuery = buildFlightQuery(answers.departureCity, destination, dates, answers.travelers)
  const hotelQuery = buildHotelQuery(destination, dates, answers.travelers, answers.budget)
  const experienceQuery = buildExperienceQuery(destination, dates, answers.interests)
  
  // 5. Execute parallel searches
  const [flights, hotels, experiences] = await Promise.all([
    searchFlights(flightQuery),
    searchHotels(hotelQuery),
    searchExperiences(experienceQuery)
  ])
  
  // 6. Build recommended itinerary
  const itinerary = await buildItinerary({
    destination,
    dates,
    flights: flights.items.slice(0, 3),  // Top 3 options
    hotels: hotels.items.slice(0, 3),
    experiences: experiences.items,
    budget: answers.budget,
    interests: answers.interests
  })
  
  // 7. Calculate package pricing
  const packageOptions = calculatePackageOptions(itinerary, answers.budget)
  
  return {
    success: true,
    data: {
      destination: destIntel,
      suggestedDates: dates,
      itinerary,
      packageOptions,
      individualResults: {
        flights,
        hotels,
        experiences
      },
      totalEstimate: calculateTotalEstimate(packageOptions[0])
    }
  }
}
```

---

## Caching Strategy

### Multi-Level Cache

```typescript
interface CacheConfig {
  levels: CacheLevel[]
  defaultTTL: number
}

interface CacheLevel {
  name: string
  type: 'memory' | 'redis' | 'database'
  ttl: number
  maxSize?: number
}

const CACHE_CONFIG: CacheConfig = {
  levels: [
    { name: 'L1', type: 'memory', ttl: 60, maxSize: 1000 },      // 1 min memory
    { name: 'L2', type: 'database', ttl: 300 }                   // 5 min database
  ],
  defaultTTL: 300
}

class MultiLevelCache {
  private l1Cache: Map<string, CacheEntry> = new Map()
  private supabase: SupabaseClient
  
  async get<T>(key: string): Promise<T | null> {
    // Check L1 (memory)
    const l1Entry = this.l1Cache.get(key)
    if (l1Entry && !this.isExpired(l1Entry)) {
      return l1Entry.value as T
    }
    
    // Check L2 (database)
    const { data } = await this.supabase
      .from('search_cache')
      .select('*')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (data) {
      // Populate L1
      this.l1Cache.set(key, {
        value: data.results,
        expiresAt: new Date(data.expires_at)
      })
      
      // Update hit count
      await this.supabase
        .from('search_cache')
        .update({
          hit_count: data.hit_count + 1,
          last_hit_at: new Date().toISOString()
        })
        .eq('id', data.id)
      
      return data.results as T
    }
    
    return null
  }
  
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || CACHE_CONFIG.defaultTTL
    const expiresAt = new Date(Date.now() + ttl * 1000)
    
    // Set L1
    this.l1Cache.set(key, { value, expiresAt })
    
    // Enforce L1 size limit
    if (this.l1Cache.size > 1000) {
      this.evictOldest()
    }
    
    // Set L2
    await this.supabase
      .from('search_cache')
      .upsert({
        cache_key: key,
        category: extractCategory(key),
        search_params: extractParams(key),
        results: value,
        result_count: Array.isArray(value) ? value.length : 1,
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'cache_key'
      })
  }
  
  generateKey(category: string, params: any): string {
    // Create deterministic key from params
    const normalized = {
      category,
      origin: params.origin?.code,
      destination: params.destination?.code,
      startDate: params.dates?.startDate,
      endDate: params.dates?.endDate,
      adults: params.travelers?.adults,
      children: params.travelers?.children,
      cabinClass: params.cabinClass,
      rooms: params.rooms
    }
    
    const sortedKeys = Object.keys(normalized).sort()
    const keyString = sortedKeys
      .filter(k => normalized[k] !== undefined)
      .map(k => `${k}:${normalized[k]}`)
      .join('|')
    
    return `search:${createHash(keyString)}`
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return new Date() > entry.expiresAt
  }
  
  private evictOldest(): void {
    // Simple LRU eviction
    const oldest = [...this.l1Cache.entries()]
      .sort((a, b) => a[1].expiresAt.getTime() - b[1].expiresAt.getTime())
      .slice(0, 100)
    
    oldest.forEach(([key]) => this.l1Cache.delete(key))
  }
}
```

### Cache Invalidation

```typescript
// Invalidate when prices likely changed
async function invalidateStaleCache(): Promise<void> {
  // Delete expired entries
  await supabase
    .from('search_cache')
    .delete()
    .lt('expires_at', new Date().toISOString())
  
  // Log cleanup
  console.log('Cache cleanup completed')
}

// Invalidate specific route when booking made
async function invalidateRouteCache(origin: string, destination: string): Promise<void> {
  await supabase
    .from('search_cache')
    .delete()
    .ilike('cache_key', `%origin:${origin}%`)
    .ilike('cache_key', `%destination:${destination}%`)
}
```

---

## Popular Searches & Suggestions

### Trending Destinations

```typescript
async function getTrendingDestinations(
  userLocation?: string,
  limit: number = 10
): Promise<TrendingDestination[]> {
  
  // Get from pre-computed table
  const { data } = await supabase
    .from('popular_searches')
    .select(`
      destination_code,
      search_count,
      avg_price,
      min_price,
      trend_score,
      destination_intelligence!inner (
        destination_name,
        tagline,
        emoji,
        hero_image_url
      )
    `)
    .eq('search_type', 'destination')
    .order('trend_score', { ascending: false })
    .limit(limit)
  
  return data?.map(d => ({
    code: d.destination_code,
    name: d.destination_intelligence.destination_name,
    tagline: d.destination_intelligence.tagline,
    emoji: d.destination_intelligence.emoji,
    imageUrl: d.destination_intelligence.hero_image_url,
    avgPrice: d.avg_price,
    minPrice: d.min_price,
    searchCount: d.search_count,
    trendScore: d.trend_score
  })) || []
}

async function getSuggestedDestinations(userId: string): Promise<SuggestedDestination[]> {
  // Get user's search history
  const { data: history } = await supabase
    .from('search_sessions')
    .select('destination_code, destination_country')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  
  // Get user preferences
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  // Find similar destinations
  const searchedDestinations = [...new Set(history?.map(h => h.destination_code) || [])]
  
  const { data: similar } = await supabase
    .from('destination_intelligence')
    .select('*')
    .overlaps('similar_destinations', searchedDestinations)
    .not('destination_code', 'in', `(${searchedDestinations.join(',')})`)
    .limit(10)
  
  // Score and rank
  const scored = similar?.map(dest => ({
    ...dest,
    score: calculateDestinationScore(dest, prefs, history)
  })) || []
  
  scored.sort((a, b) => b.score - a.score)
  
  return scored.slice(0, 5)
}
```

### Autocomplete

```typescript
interface AutocompleteResult {
  type: 'city' | 'airport' | 'region' | 'country' | 'poi'
  code: string
  name: string
  fullName: string  // "Paris, France"
  emoji?: string
  subtitle?: string  // "City of lights"
  airports?: { code: string; name: string }[]
}

async function autocomplete(
  query: string,
  type?: 'destination' | 'airport' | 'all'
): Promise<AutocompleteResult[]> {
  
  if (query.length < 2) return []
  
  const searchQuery = query.toLowerCase().trim()
  
  // Search destinations
  const { data: destinations } = await supabase
    .from('destination_intelligence')
    .select('*')
    .or(`destination_name.ilike.%${searchQuery}%,destination_code.ilike.${searchQuery}%`)
    .limit(10)
  
  // Search airports (if needed)
  let airports: any[] = []
  if (type === 'airport' || type === 'all') {
    const { data: airportData } = await supabase
      .from('airports')
      .select('*')
      .or(`name.ilike.%${searchQuery}%,iata_code.ilike.${searchQuery}%,city.ilike.%${searchQuery}%`)
      .limit(10)
    
    airports = airportData || []
  }
  
  // Combine and format results
  const results: AutocompleteResult[] = []
  
  // Add destinations
  destinations?.forEach(dest => {
    results.push({
      type: dest.destination_type as any,
      code: dest.destination_code,
      name: dest.destination_name,
      fullName: `${dest.destination_name}, ${dest.country_code}`,
      emoji: dest.emoji,
      subtitle: dest.tagline
    })
  })
  
  // Add airports
  airports.forEach(apt => {
    results.push({
      type: 'airport',
      code: apt.iata_code,
      name: apt.name,
      fullName: `${apt.name} (${apt.iata_code})`,
      subtitle: apt.city
    })
  })
  
  // Sort by relevance
  results.sort((a, b) => {
    // Exact matches first
    if (a.code.toLowerCase() === searchQuery) return -1
    if (b.code.toLowerCase() === searchQuery) return 1
    
    // Starts with query
    if (a.name.toLowerCase().startsWith(searchQuery)) return -1
    if (b.name.toLowerCase().startsWith(searchQuery)) return 1
    
    return 0
  })
  
  return results.slice(0, 10)
}
```

---

## Performance Optimizations

### Query Optimization

```typescript
// Batch similar queries
class QueryBatcher {
  private pendingQueries: Map<string, QueryBatch> = new Map()
  private batchWindow = 100  // ms
  
  async addQuery(query: OptimizedQuery): Promise<ExecutionResult[]> {
    const batchKey = this.getBatchKey(query)
    
    if (!this.pendingQueries.has(batchKey)) {
      const batch: QueryBatch = {
        queries: [],
        promise: null,
        resolvers: []
      }
      this.pendingQueries.set(batchKey, batch)
      
      // Execute batch after window
      batch.promise = new Promise(resolve => {
        setTimeout(async () => {
          const results = await this.executeBatch(batch)
          this.pendingQueries.delete(batchKey)
          resolve(results)
        }, this.batchWindow)
      })
    }
    
    const batch = this.pendingQueries.get(batchKey)!
    batch.queries.push(query)
    
    return new Promise(resolve => {
      batch.resolvers.push(resolve)
    })
  }
  
  private getBatchKey(query: OptimizedQuery): string {
    // Same origin, destination, dates = same batch
    return `${query.original.resolvedOrigin?.code}-${query.original.resolvedDestination?.code}-${query.original.dates.startDate}`
  }
  
  private async executeBatch(batch: QueryBatch): Promise<ExecutionResult[]> {
    // Execute single query (results shared)
    const results = await executeSearch(batch.queries[0])
    
    // Resolve all waiting queries
    batch.resolvers.forEach(resolve => resolve(results))
    
    return results
  }
}
```

### Connection Pooling

```typescript
// Reuse HTTP connections to providers
const httpPool = new Map<string, HttpAgent>()

function getHttpAgent(providerCode: string): HttpAgent {
  if (!httpPool.has(providerCode)) {
    httpPool.set(providerCode, new HttpAgent({
      keepAlive: true,
      maxSockets: 10,
      timeout: 30000
    }))
  }
  return httpPool.get(providerCode)!
}
```

### Result Streaming

```typescript
// Stream results as they arrive
async function* streamResults(
  query: OptimizedQuery
): AsyncGenerator<SearchResultBatch> {
  
  const providers = [...query.providerQueries.values()]
  const completed = new Set<string>()
  
  // Create race promises
  const promises = providers.map(async (pq) => {
    const result = await executeProviderQuery(pq)
    return { provider: pq.provider, result }
  })
  
  // Yield as each completes
  while (completed.size < providers.length) {
    const { provider, result } = await Promise.race(
      promises.filter((_, i) => !completed.has(providers[i].provider))
    )
    
    completed.add(provider)
    
    yield {
      provider,
      results: result.results,
      isComplete: completed.size === providers.length,
      completedCount: completed.size,
      totalCount: providers.length
    }
  }
}
```

---

## Monitoring & Analytics

### Search Analytics

```sql
-- Search performance view
CREATE VIEW search_analytics AS
SELECT 
  date_trunc('hour', created_at) as hour,
  search_mode,
  COUNT(*) as search_count,
  AVG(duration_ms) as avg_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
  COUNT(CASE WHEN served_from_cache THEN 1 END) as cache_hits,
  AVG(total_results) as avg_results,
  COUNT(CASE WHEN booking_completed THEN 1 END) as conversions
FROM search_sessions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY date_trunc('hour', created_at), search_mode
ORDER BY hour DESC;

-- Popular routes view
CREATE VIEW popular_routes AS
SELECT 
  origin_code,
  destination_code,
  COUNT(*) as search_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(total_results) as avg_results,
  COUNT(CASE WHEN booking_completed THEN 1 END) as bookings
FROM search_sessions
WHERE created_at > NOW() - INTERVAL '30 days'
  AND origin_code IS NOT NULL
GROUP BY origin_code, destination_code
ORDER BY search_count DESC
LIMIT 100;
```

### Real-time Dashboards

```typescript
interface SearchMetrics {
  // Real-time
  activeSearches: number
  searchesPerMinute: number
  avgResponseTime: number
  errorRate: number
  cacheHitRate: number
  
  // By provider
  providerMetrics: {
    provider: string
    responseTime: number
    successRate: number
    resultCount: number
  }[]
  
  // By category
  categoryMetrics: {
    category: string
    searchCount: number
    conversionRate: number
  }[]
}

async function getSearchMetrics(): Promise<SearchMetrics> {
  // Implementation using real-time queries
  // Could use Supabase realtime subscriptions
}
```

---

## Implementation Checklist

### Phase 1: Database
- [ ] Create `search_sessions` table
- [ ] Create `search_results` table
- [ ] Create `popular_searches` table
- [ ] Create `price_alerts` table
- [ ] Create `destination_intelligence` table
- [ ] Create indexes and views
- [ ] Seed destination intelligence data

### Phase 2: Query Processing
- [ ] Implement QueryParser
- [ ] Implement IntentDetector
- [ ] Implement ContextEnricher
- [ ] Implement QueryOptimizer
- [ ] Implement location resolution

### Phase 3: Execution
- [ ] Implement MultiProviderExecutor
- [ ] Implement parallel execution
- [ ] Implement progressive loading
- [ ] Implement timeout handling
- [ ] Implement fallback logic

### Phase 4: Result Processing
- [ ] Implement DeduplicationEngine
- [ ] Implement RankingEngine
- [ ] Implement FilterEngine
- [ ] Implement sorting
- [ ] Implement pagination

### Phase 5: Session Management
- [ ] Implement SessionManager
- [ ] Implement PriceTracker
- [ ] Implement session persistence
- [ ] Implement session recovery

### Phase 6: Caching
- [ ] Implement MultiLevelCache
- [ ] Implement cache key generation
- [ ] Implement cache invalidation
- [ ] Set up cache cleanup job

### Phase 7: Features
- [ ] Implement autocomplete
- [ ] Implement trending destinations
- [ ] Implement price alerts
- [ ] Implement Plan mode

### Phase 8: Optimization
- [ ] Implement query batching
- [ ] Implement result streaming
- [ ] Implement connection pooling
- [ ] Performance testing

### Phase 9: Monitoring
- [ ] Set up analytics views
- [ ] Implement metrics collection
- [ ] Set up alerting
- [ ] Create dashboards

---

## Success Metrics

### Performance
- Search latency P50 < 1.5 seconds
- Search latency P95 < 3 seconds
- Cache hit rate > 40%
- Error rate < 1%

### Quality
- Result relevance score > 80%
- Deduplication accuracy > 95%
- Filter accuracy 100%

### Business
- Search to click rate > 30%
- Search to booking rate > 5%
- Return user search rate > 60%

---

**This Search & Comparison Engine is the heart of Guidera's user experience. It orchestrates everything — from understanding what users want, to finding the best options across providers, to presenting results in the most helpful way possible.**
