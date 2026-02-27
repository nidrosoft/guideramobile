# Document 7: Provider Manager System

## Purpose

This document defines the complete provider infrastructure for Guidera — the intelligent system that connects to multiple travel providers (Amadeus, Kiwi, Expedia, GetYourGuide, etc.), routes requests optimally, handles failures gracefully, and ensures users always get the best deals with zero manual intervention.

This is the backbone of Guidera's booking capability.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PROVIDER MANAGER SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Request    │───▶│   Routing    │───▶│  Provider    │              │
│  │   Handler    │    │   Engine     │    │  Executor    │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                   │                   │                       │
│         ▼                   ▼                   ▼                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Request    │    │   Provider   │    │   Response   │              │
│  │  Validator   │    │   Scorer     │    │  Normalizer  │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                   │                   │                       │
│         ▼                   ▼                   ▼                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │    Cache     │    │   Health     │    │   Result     │              │
│  │   Manager    │    │   Monitor    │    │  Aggregator  │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │   Amadeus   │ │   Kiwi.com  │ │   Expedia   │
            └─────────────┘ └─────────────┘ └─────────────┘
                    │               │               │
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │   Duffel    │ │ GetYourGuide│ │  Hotelbeds  │
            └─────────────┘ └─────────────┘ └─────────────┘
                    │               │               │
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │ Cartrawler  │ │   Viator    │ │   Future    │
            └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Core Components

### 1. Request Handler
- Receives search/booking requests from the app
- Validates input parameters
- Enriches request with user context (location, preferences, history)
- Passes to Routing Engine

### 2. Routing Engine
- Determines which provider(s) to call
- Calculates provider scores based on multiple factors
- Decides parallel vs sequential execution
- Manages timeout budgets

### 3. Provider Executor
- Makes actual API calls to providers
- Handles authentication per provider
- Manages rate limits
- Implements retry logic

### 4. Response Normalizer
- Transforms provider-specific responses to Unified Data Model
- Handles missing/null fields
- Applies business rules

### 5. Result Aggregator
- Combines results from multiple providers
- Deduplicates identical offerings
- Sorts and ranks results
- Applies user preferences

### 6. Health Monitor
- Tracks provider availability
- Measures response times
- Detects degradation
- Triggers circuit breakers

### 7. Cache Manager
- Caches search results (short TTL)
- Caches provider metadata (longer TTL)
- Manages cache invalidation
- Reduces API costs

---

## Provider Registry

### Provider Configuration Table

```sql
CREATE TABLE api_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  provider_code VARCHAR(50) UNIQUE NOT NULL,  -- 'amadeus', 'kiwi', 'expedia'
  provider_name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(50) NOT NULL,          -- 'gds', 'ota', 'direct', 'aggregator'
  
  -- Capabilities
  supports_flights BOOLEAN DEFAULT FALSE,
  supports_hotels BOOLEAN DEFAULT FALSE,
  supports_cars BOOLEAN DEFAULT FALSE,
  supports_experiences BOOLEAN DEFAULT FALSE,
  supports_packages BOOLEAN DEFAULT FALSE,
  supports_transfers BOOLEAN DEFAULT FALSE,
  
  -- Booking capabilities
  supports_booking BOOLEAN DEFAULT FALSE,      -- Can we book through them?
  supports_hold BOOLEAN DEFAULT FALSE,         -- Can we hold before booking?
  hold_duration_minutes INTEGER,               -- How long can we hold?
  supports_cancel BOOLEAN DEFAULT FALSE,
  supports_modify BOOLEAN DEFAULT FALSE,
  
  -- Coverage
  coverage_regions TEXT[],                     -- ['europe', 'north_america', 'asia']
  strong_regions TEXT[],                       -- Where they're best
  weak_regions TEXT[],                         -- Where they're weak
  coverage_countries TEXT[],                   -- Specific country codes
  
  -- Pricing model
  pricing_model VARCHAR(50),                   -- 'net', 'commission', 'markup'
  commission_percent DECIMAL(5,2),
  markup_percent DECIMAL(5,2),
  
  -- API details
  api_version VARCHAR(20),
  base_url VARCHAR(255),
  auth_type VARCHAR(50),                       -- 'oauth2', 'api_key', 'basic'
  rate_limit_per_minute INTEGER,
  rate_limit_per_day INTEGER,
  avg_response_time_ms INTEGER,
  
  -- Cost
  cost_per_search DECIMAL(10,4),               -- Cost per search API call
  cost_per_booking DECIMAL(10,4),              -- Cost per booking API call
  monthly_minimum DECIMAL(10,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',         -- 'active', 'degraded', 'disabled', 'testing'
  health_score INTEGER DEFAULT 100,            -- 0-100
  last_health_check TIMESTAMPTZ,
  last_successful_call TIMESTAMPTZ,
  last_failed_call TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Settings
  priority INTEGER DEFAULT 50,                 -- Base priority 1-100
  is_primary BOOLEAN DEFAULT FALSE,
  is_fallback BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  notes TEXT,
  documentation_url VARCHAR(255),
  support_email VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_providers_status ON api_providers(status) WHERE enabled = true;
CREATE INDEX idx_providers_flights ON api_providers(supports_flights) WHERE enabled = true;
CREATE INDEX idx_providers_hotels ON api_providers(supports_hotels) WHERE enabled = true;
```

### Provider Credentials Table

```sql
CREATE TABLE provider_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES api_providers(id) ON DELETE CASCADE,
  
  -- Environment
  environment VARCHAR(20) NOT NULL,            -- 'production', 'sandbox', 'test'
  is_active BOOLEAN DEFAULT FALSE,
  
  -- Credentials (encrypted at rest)
  api_key TEXT,
  api_secret TEXT,
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Additional auth
  account_id VARCHAR(100),
  merchant_id VARCHAR(100),
  affiliate_id VARCHAR(100),
  
  -- Endpoints (can override provider defaults)
  custom_base_url VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, environment)
);
```

### Provider Capabilities Matrix

```sql
CREATE TABLE provider_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES api_providers(id) ON DELETE CASCADE,
  
  -- Category
  category VARCHAR(50) NOT NULL,               -- 'flights', 'hotels', 'cars', 'experiences'
  
  -- Search capabilities
  can_search BOOLEAN DEFAULT TRUE,
  can_search_oneway BOOLEAN DEFAULT TRUE,
  can_search_roundtrip BOOLEAN DEFAULT TRUE,
  can_search_multicity BOOLEAN DEFAULT FALSE,
  can_search_flexible_dates BOOLEAN DEFAULT FALSE,
  max_travelers INTEGER,
  max_rooms INTEGER,
  max_segments INTEGER,
  advance_booking_days INTEGER,                -- How far in advance
  same_day_booking BOOLEAN DEFAULT TRUE,
  
  -- Filter capabilities
  supports_cabin_filter BOOLEAN DEFAULT FALSE,
  supports_airline_filter BOOLEAN DEFAULT FALSE,
  supports_stops_filter BOOLEAN DEFAULT FALSE,
  supports_time_filter BOOLEAN DEFAULT FALSE,
  supports_price_filter BOOLEAN DEFAULT FALSE,
  supports_amenity_filter BOOLEAN DEFAULT FALSE,
  supports_rating_filter BOOLEAN DEFAULT FALSE,
  
  -- Sort capabilities
  supports_sort_price BOOLEAN DEFAULT TRUE,
  supports_sort_duration BOOLEAN DEFAULT TRUE,
  supports_sort_departure BOOLEAN DEFAULT TRUE,
  supports_sort_rating BOOLEAN DEFAULT FALSE,
  
  -- Booking capabilities
  instant_confirmation BOOLEAN DEFAULT TRUE,
  requires_passenger_details BOOLEAN DEFAULT TRUE,
  requires_payment_upfront BOOLEAN DEFAULT TRUE,
  supports_hold_booking BOOLEAN DEFAULT FALSE,
  hold_duration_minutes INTEGER,
  
  -- Pricing
  prices_include_taxes BOOLEAN DEFAULT TRUE,
  prices_include_fees BOOLEAN DEFAULT FALSE,
  supports_price_breakdown BOOLEAN DEFAULT TRUE,
  supports_fare_rules BOOLEAN DEFAULT FALSE,
  
  -- Content
  provides_images BOOLEAN DEFAULT TRUE,
  provides_descriptions BOOLEAN DEFAULT TRUE,
  provides_ratings BOOLEAN DEFAULT FALSE,
  provides_reviews BOOLEAN DEFAULT FALSE,
  provides_amenities BOOLEAN DEFAULT TRUE,
  
  -- Special features
  supports_loyalty_programs BOOLEAN DEFAULT FALSE,
  supports_corporate_rates BOOLEAN DEFAULT FALSE,
  supports_group_booking BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, category)
);
```

---

## Provider Profiles

### Provider 1: Amadeus

```yaml
provider_code: amadeus
provider_name: Amadeus for Developers
provider_type: gds

capabilities:
  flights: true
  hotels: true
  cars: true
  experiences: false
  packages: false

strengths:
  - Largest GDS with most airline content
  - Strong European and Asian coverage
  - Real-time availability
  - Comprehensive fare rules
  - Good hotel inventory via Amadeus Hotel Search

weaknesses:
  - Complex nested response structure
  - Higher cost per transaction
  - Rate limits can be restrictive
  - Less competitive on budget routes

coverage:
  strong_regions: ['europe', 'middle_east', 'asia', 'south_america']
  weak_regions: ['budget_carriers']
  
pricing:
  model: 'transaction_based'
  cost_per_search: 0.01
  cost_per_booking: 0.50
  
api_details:
  auth_type: oauth2
  rate_limit_per_minute: 40
  avg_response_time_ms: 800
  
use_when:
  - Full-service airline bookings
  - International long-haul flights
  - Premium/business class searches
  - European destinations
  - Need comprehensive fare rules
  
avoid_when:
  - Budget carrier searches (use Kiwi)
  - Simple domestic US flights (use Duffel)
  - Cost is primary concern
```

### Provider 2: Duffel

```yaml
provider_code: duffel
provider_name: Duffel
provider_type: aggregator

capabilities:
  flights: true
  hotels: false
  cars: false
  experiences: false
  packages: false

strengths:
  - Modern, clean API
  - Excellent documentation
  - Direct airline connections
  - Good low-cost carrier coverage
  - Simple pricing (no hidden fees)
  - Seat selection and extras

weaknesses:
  - Flights only
  - Newer platform, less inventory than Amadeus
  - Limited ancillary content

coverage:
  strong_regions: ['north_america', 'europe', 'uk']
  weak_regions: ['asia', 'africa', 'south_america']
  
pricing:
  model: 'commission'
  commission_percent: 1.5
  
api_details:
  auth_type: api_key
  rate_limit_per_minute: 100
  avg_response_time_ms: 600
  
use_when:
  - US domestic flights
  - UK and EU flights
  - Need clean, simple integration
  - Low-cost carrier bookings
  - Seat selection is important
  
avoid_when:
  - Complex multi-city itineraries
  - Asian routes
  - Need hotel bundles
```

### Provider 3: Kiwi.com (Tequila API)

```yaml
provider_code: kiwi
provider_name: Kiwi.com Tequila
provider_type: aggregator

capabilities:
  flights: true
  hotels: false
  cars: false
  experiences: false
  packages: false

strengths:
  - Excellent for budget flights
  - Virtual interlining (combines airlines)
  - Multi-city optimization
  - Flexible date searches
  - Price alerts built-in
  - Kiwi Guarantee (rebooking if miss connection)

weaknesses:
  - Not all bookings are protected
  - Customer service can be slow
  - Complex pricing with add-ons
  - Not ideal for business travel

coverage:
  strong_regions: ['europe', 'budget_routes', 'multi_city']
  weak_regions: ['premium_cabins', 'corporate']
  
pricing:
  model: 'commission'
  commission_percent: 3.0
  
api_details:
  auth_type: api_key
  rate_limit_per_minute: 200
  avg_response_time_ms: 1200
  
use_when:
  - Budget-conscious travelers
  - Complex multi-city routes
  - Flexible date searches
  - European budget carriers
  - Finding creative routings
  
avoid_when:
  - Business/premium class
  - Need strict airline loyalty
  - Time-sensitive bookings
  - Corporate travel policies
```

### Provider 4: Expedia Rapid API (EPS)

```yaml
provider_code: expedia
provider_name: Expedia Rapid API
provider_type: ota

capabilities:
  flights: false  # Limited, mostly hotels
  hotels: true
  cars: true
  experiences: false
  packages: false

strengths:
  - Massive hotel inventory (700K+ properties)
  - Strong US coverage
  - Member pricing available
  - Good car rental inventory
  - Package deals

weaknesses:
  - Complex contract requirements
  - Merchant model complexity
  - No direct flight booking
  - Higher commission expectations

coverage:
  strong_regions: ['north_america', 'europe', 'popular_destinations']
  weak_regions: ['remote_locations', 'boutique_hotels']
  
pricing:
  model: 'merchant'
  commission_percent: 15-25
  
api_details:
  auth_type: api_key
  rate_limit_per_minute: 500
  avg_response_time_ms: 500
  
use_when:
  - US hotel bookings
  - Chain hotels
  - Car rentals in US
  - Need instant confirmation
  - High-volume hotel searches
  
avoid_when:
  - Boutique/unique properties
  - Budget accommodations
  - Non-US destinations
```

### Provider 5: Hotelbeds

```yaml
provider_code: hotelbeds
provider_name: Hotelbeds API
provider_type: wholesaler

capabilities:
  flights: false
  hotels: true
  cars: false
  experiences: true  # Via their TourActivity API
  packages: false

strengths:
  - Wholesale rates (good margins)
  - 180K+ hotels globally
  - Strong international coverage
  - Good activity inventory
  - B2B focused, reliable

weaknesses:
  - Net rates require markup
  - Complex cancellation policies
  - Requires business verification
  - Not consumer-facing brand

coverage:
  strong_regions: ['europe', 'asia', 'middle_east', 'south_america']
  weak_regions: ['budget_us_motels']
  
pricing:
  model: 'net_rate'
  markup_percent: 15-20  # You set your markup
  
api_details:
  auth_type: api_key
  rate_limit_per_minute: 300
  avg_response_time_ms: 700
  
use_when:
  - International hotel bookings
  - Need competitive margins
  - European destinations
  - Premium properties
  - Activities bundling
  
avoid_when:
  - US budget motels
  - Same-day bookings (inventory sync delay)
```

### Provider 6: GetYourGuide

```yaml
provider_code: getyourguide
provider_name: GetYourGuide Partner API
provider_type: direct

capabilities:
  flights: false
  hotels: false
  cars: false
  experiences: true
  packages: false

strengths:
  - Largest activity marketplace
  - 60K+ activities worldwide
  - Instant confirmation
  - Good content (photos, descriptions)
  - Mobile tickets
  - Free cancellation options

weaknesses:
  - Experiences only
  - Commission-based (lower margins)
  - Some overlap with Viator

coverage:
  strong_regions: ['europe', 'north_america', 'popular_cities']
  weak_regions: ['remote_destinations', 'africa']
  
pricing:
  model: 'commission'
  commission_percent: 8
  
api_details:
  auth_type: oauth2
  rate_limit_per_minute: 100
  avg_response_time_ms: 400
  
use_when:
  - Tours and activities
  - Popular tourist destinations
  - Need instant confirmation
  - Skip-the-line tickets
  - Day trips
  
avoid_when:
  - Off-beaten-path activities
  - Very local experiences
```

### Provider 7: Viator (Tripadvisor)

```yaml
provider_code: viator
provider_name: Viator Partner API
provider_type: direct

capabilities:
  flights: false
  hotels: false
  cars: false
  experiences: true
  packages: false

strengths:
  - Strong US activity coverage
  - Tripadvisor reviews integration
  - Good filtering options
  - Private tour options
  - Multi-language support

weaknesses:
  - Similar to GetYourGuide (choose primary)
  - API can be slower
  - Some legacy endpoints

coverage:
  strong_regions: ['north_america', 'europe', 'australia']
  weak_regions: ['asia', 'africa']
  
pricing:
  model: 'commission'
  commission_percent: 8
  
api_details:
  auth_type: api_key
  rate_limit_per_minute: 60
  avg_response_time_ms: 800
  
use_when:
  - US activities
  - Need Tripadvisor reviews
  - Private tours
  - Multi-day tours
  
avoid_when:
  - Already using GetYourGuide (redundant)
  - Need fast response times
```

### Provider 8: Cartrawler

```yaml
provider_code: cartrawler
provider_name: Cartrawler OTA API
provider_type: aggregator

capabilities:
  flights: false
  hotels: false
  cars: true
  experiences: false
  packages: false

strengths:
  - Largest car rental aggregator
  - 1,700+ suppliers
  - Global coverage
  - Good filtering
  - Airport and city locations
  - Insurance options

weaknesses:
  - Cars only
  - Complex contract
  - Supplier quality varies

coverage:
  strong_regions: ['global', 'airports']
  weak_regions: ['very_rural']
  
pricing:
  model: 'commission'
  commission_percent: 6-10
  
api_details:
  auth_type: api_key
  rate_limit_per_minute: 200
  avg_response_time_ms: 900
  
use_when:
  - Any car rental need
  - Airport pickups
  - Need multiple supplier options
  - International car rentals
  
avoid_when:
  - None, this is primary for cars
```

---

## Smart Routing Engine

### Routing Decision Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTING DECISION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. RECEIVE REQUEST
   │
   ▼
2. IDENTIFY CATEGORY
   │ What are we searching for?
   │ ├── Flights → Flight providers
   │ ├── Hotels → Hotel providers
   │ ├── Cars → Car providers
   │ ├── Experiences → Experience providers
   │ └── Package → Multiple providers
   │
   ▼
3. FILTER ELIGIBLE PROVIDERS
   │ Remove providers that:
   │ ├── Don't support this category
   │ ├── Are disabled/unhealthy
   │ ├── Have exceeded rate limits
   │ └── Don't cover this region
   │
   ▼
4. SCORE REMAINING PROVIDERS
   │ Calculate score for each based on:
   │ ├── Geographic match (30 points)
   │ ├── Category strength (25 points)
   │ ├── User preference alignment (20 points)
   │ ├── Historical performance (15 points)
   │ └── Cost efficiency (10 points)
   │
   ▼
5. SELECT EXECUTION STRATEGY
   │ Based on request type:
   │ ├── Quick Search → Top 1 provider
   │ ├── Best Price → Top 3 parallel
   │ ├── Comprehensive → All eligible parallel
   │ └── Booking → Provider with best offer
   │
   ▼
6. EXECUTE & AGGREGATE
   │
   ▼
7. RETURN RESULTS
```

### Provider Scoring Algorithm

```typescript
interface ProviderScore {
  providerId: string
  providerCode: string
  totalScore: number
  breakdown: {
    geographic: number      // 0-30
    category: number        // 0-25
    preference: number      // 0-20
    performance: number     // 0-15
    cost: number           // 0-10
  }
  eligible: boolean
  reason?: string          // If not eligible, why
}

function scoreProvider(
  provider: Provider,
  request: SearchRequest,
  userContext: UserContext
): ProviderScore {
  
  let score = {
    geographic: 0,
    category: 0,
    preference: 0,
    performance: 0,
    cost: 0
  }
  
  // ═══════════════════════════════════════════════════════════
  // GEOGRAPHIC SCORING (0-30 points)
  // ═══════════════════════════════════════════════════════════
  
  const searchRegion = determineRegion(request.destination)
  const userRegion = determineRegion(userContext.location)
  
  // Strong region match
  if (provider.strongRegions.includes(searchRegion)) {
    score.geographic += 25
  } 
  // General coverage
  else if (provider.coverageRegions.includes(searchRegion)) {
    score.geographic += 15
  }
  // Weak region
  else if (provider.weakRegions.includes(searchRegion)) {
    score.geographic += 5
  }
  
  // Bonus for matching user's home region (familiar providers)
  if (provider.strongRegions.includes(userRegion)) {
    score.geographic += 5
  }
  
  // ═══════════════════════════════════════════════════════════
  // CATEGORY STRENGTH SCORING (0-25 points)
  // ═══════════════════════════════════════════════════════════
  
  const categoryCapability = provider.capabilities[request.category]
  
  if (categoryCapability.isPrimary) {
    score.category += 25
  } else if (categoryCapability.isStrong) {
    score.category += 20
  } else if (categoryCapability.isSupported) {
    score.category += 10
  }
  
  // Bonus for specific features needed
  if (request.needsFlexibleDates && categoryCapability.supportsFlexibleDates) {
    score.category += 5
  }
  if (request.needsMultiCity && categoryCapability.supportsMultiCity) {
    score.category += 5
  }
  
  // Cap at 25
  score.category = Math.min(score.category, 25)
  
  // ═══════════════════════════════════════════════════════════
  // USER PREFERENCE ALIGNMENT (0-20 points)
  // ═══════════════════════════════════════════════════════════
  
  const userPrefs = userContext.preferences
  
  // Budget alignment
  if (userPrefs.budgetLevel === 'budget') {
    if (provider.specialization === 'budget') {
      score.preference += 15
    } else if (provider.hasBudgetOptions) {
      score.preference += 8
    }
  } else if (userPrefs.budgetLevel === 'luxury') {
    if (provider.specialization === 'premium') {
      score.preference += 15
    } else if (provider.hasPremiumOptions) {
      score.preference += 8
    }
  } else {
    score.preference += 10  // Mid-range, all providers okay
  }
  
  // Travel style alignment
  if (userPrefs.travelStyle === 'adventure' && provider.goodForAdventure) {
    score.preference += 5
  }
  if (userPrefs.travelStyle === 'business' && provider.goodForBusiness) {
    score.preference += 5
  }
  
  // ═══════════════════════════════════════════════════════════
  // HISTORICAL PERFORMANCE (0-15 points)
  // ═══════════════════════════════════════════════════════════
  
  // Health score (0-100 normalized to 0-8)
  score.performance += (provider.healthScore / 100) * 8
  
  // Success rate (0-7 points)
  const successRate = provider.successfulCalls / provider.totalCalls
  score.performance += successRate * 7
  
  // Penalize recent failures
  if (provider.consecutiveFailures > 0) {
    score.performance -= Math.min(provider.consecutiveFailures * 2, 10)
  }
  
  // Ensure non-negative
  score.performance = Math.max(score.performance, 0)
  
  // ═══════════════════════════════════════════════════════════
  // COST EFFICIENCY (0-10 points)
  // ═══════════════════════════════════════════════════════════
  
  // Lower cost = higher score
  const maxCostPerSearch = 0.05  // Baseline for comparison
  const costRatio = 1 - (provider.costPerSearch / maxCostPerSearch)
  score.cost = Math.max(costRatio * 10, 0)
  
  // ═══════════════════════════════════════════════════════════
  // CALCULATE TOTAL
  // ═══════════════════════════════════════════════════════════
  
  const totalScore = 
    score.geographic + 
    score.category + 
    score.preference + 
    score.performance + 
    score.cost
  
  return {
    providerId: provider.id,
    providerCode: provider.providerCode,
    totalScore,
    breakdown: score,
    eligible: totalScore >= 30  // Minimum threshold
  }
}
```

### Routing Rules Table

```sql
CREATE TABLE routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Rule identity
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,              -- 'category', 'region', 'user', 'time', 'custom'
  priority INTEGER DEFAULT 50,                  -- Higher = evaluated first
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Conditions (JSONB for flexibility)
  conditions JSONB NOT NULL,
  /*
    Examples:
    { "category": "flights", "region": "europe" }
    { "category": "hotels", "user_budget": "luxury" }
    { "category": "flights", "route_type": "domestic_us" }
    { "time_of_day": "night", "category": "any" }
  */
  
  -- Actions
  provider_code VARCHAR(50),                    -- Specific provider to use
  provider_priority_boost INTEGER,              -- Add to provider score
  provider_priority_penalty INTEGER,            -- Subtract from provider score
  execution_strategy VARCHAR(50),               -- 'single', 'parallel', 'sequential'
  max_providers INTEGER,                        -- Limit providers to call
  timeout_ms INTEGER,                           -- Override default timeout
  
  -- Metadata
  description TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default routing rules
INSERT INTO routing_rules (rule_name, rule_type, priority, conditions, provider_code, provider_priority_boost) VALUES
-- Flight rules
('European flights primary', 'region', 80, '{"category": "flights", "region": "europe"}', 'amadeus', 20),
('Budget flights boost Kiwi', 'user', 75, '{"category": "flights", "user_budget": "budget"}', 'kiwi', 25),
('US domestic flights', 'region', 70, '{"category": "flights", "route_type": "domestic_us"}', 'duffel', 15),
('Multi-city flights', 'category', 85, '{"category": "flights", "route_type": "multi_city"}', 'kiwi', 30),

-- Hotel rules
('US hotels primary', 'region', 80, '{"category": "hotels", "region": "north_america"}', 'expedia', 20),
('International hotels', 'region', 75, '{"category": "hotels", "region": "international"}', 'hotelbeds', 15),
('Luxury hotels', 'user', 70, '{"category": "hotels", "user_budget": "luxury"}', 'hotelbeds', 10),

-- Car rules
('All car rentals', 'category', 90, '{"category": "cars"}', 'cartrawler', 30),

-- Experience rules
('Activities primary', 'category', 80, '{"category": "experiences"}', 'getyourguide', 25),
('US activities', 'region', 75, '{"category": "experiences", "region": "north_america"}', 'viator', 10);
```

### Execution Strategies

```typescript
enum ExecutionStrategy {
  SINGLE_FASTEST = 'single_fastest',      // Call top-scored provider only
  SINGLE_CHEAPEST = 'single_cheapest',    // Call provider with best cost/value
  PARALLEL_TOP_3 = 'parallel_top_3',      // Call top 3 providers simultaneously
  PARALLEL_ALL = 'parallel_all',          // Call all eligible providers
  SEQUENTIAL_FALLBACK = 'sequential',     // Try one at a time until success
  WATERFALL = 'waterfall'                 // Primary → Secondary → Fallback
}

interface ExecutionConfig {
  strategy: ExecutionStrategy
  maxProviders: number
  timeoutMs: number
  waitForAll: boolean           // Wait for all or return first?
  minResultsRequired: number    // Minimum results before returning
  deduplication: boolean        // Remove duplicate offers?
}

const DEFAULT_CONFIGS: Record<string, ExecutionConfig> = {
  // Quick search - just need fast results
  quick_search: {
    strategy: ExecutionStrategy.SINGLE_FASTEST,
    maxProviders: 1,
    timeoutMs: 5000,
    waitForAll: true,
    minResultsRequired: 1,
    deduplication: false
  },
  
  // Best price - compare across providers
  price_comparison: {
    strategy: ExecutionStrategy.PARALLEL_TOP_3,
    maxProviders: 3,
    timeoutMs: 8000,
    waitForAll: false,          // Return as results come in
    minResultsRequired: 1,
    deduplication: true
  },
  
  // Comprehensive - user wants all options
  comprehensive: {
    strategy: ExecutionStrategy.PARALLEL_ALL,
    maxProviders: 5,
    timeoutMs: 10000,
    waitForAll: true,
    minResultsRequired: 3,
    deduplication: true
  },
  
  // Booking - must succeed
  booking: {
    strategy: ExecutionStrategy.WATERFALL,
    maxProviders: 3,
    timeoutMs: 30000,
    waitForAll: true,
    minResultsRequired: 1,
    deduplication: false
  }
}
```

---

## Failover & Resilience

### Circuit Breaker Pattern

```typescript
interface CircuitBreakerState {
  providerId: string
  state: 'closed' | 'open' | 'half_open'
  failureCount: number
  successCount: number
  lastFailure: Date | null
  lastSuccess: Date | null
  nextRetryAt: Date | null
}

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,           // Failures before opening circuit
  successThreshold: 3,           // Successes in half-open to close
  openDuration: 60000,           // How long to stay open (1 min)
  halfOpenRequests: 1,           // Requests to allow in half-open
  windowSize: 60000              // Time window for counting failures
}

function evaluateCircuitBreaker(
  state: CircuitBreakerState,
  outcome: 'success' | 'failure'
): CircuitBreakerState {
  
  const now = new Date()
  
  switch (state.state) {
    case 'closed':
      if (outcome === 'failure') {
        state.failureCount++
        state.lastFailure = now
        
        // Check if threshold exceeded
        if (state.failureCount >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
          state.state = 'open'
          state.nextRetryAt = new Date(now.getTime() + CIRCUIT_BREAKER_CONFIG.openDuration)
          logCircuitOpen(state.providerId)
        }
      } else {
        state.successCount++
        state.lastSuccess = now
        state.failureCount = 0  // Reset on success
      }
      break
      
    case 'open':
      // Check if we should transition to half-open
      if (now >= state.nextRetryAt) {
        state.state = 'half_open'
        state.failureCount = 0
        state.successCount = 0
      }
      // Otherwise, reject request (handled by caller)
      break
      
    case 'half_open':
      if (outcome === 'success') {
        state.successCount++
        state.lastSuccess = now
        
        // Check if we can close
        if (state.successCount >= CIRCUIT_BREAKER_CONFIG.successThreshold) {
          state.state = 'closed'
          state.failureCount = 0
          logCircuitClosed(state.providerId)
        }
      } else {
        // Single failure in half-open reopens
        state.state = 'open'
        state.failureCount = CIRCUIT_BREAKER_CONFIG.failureThreshold
        state.nextRetryAt = new Date(now.getTime() + CIRCUIT_BREAKER_CONFIG.openDuration * 2)
        logCircuitReopened(state.providerId)
      }
      break
  }
  
  return state
}
```

### Health Check System

```sql
CREATE TABLE provider_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES api_providers(id) ON DELETE CASCADE,
  
  -- Check details
  check_type VARCHAR(50) NOT NULL,              -- 'ping', 'search', 'availability'
  check_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Results
  success BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  
  -- Context
  endpoint_checked VARCHAR(255),
  request_payload JSONB,
  response_sample JSONB
);

CREATE INDEX idx_health_checks_provider ON provider_health_checks(provider_id, check_timestamp DESC);

-- Aggregated health view
CREATE VIEW provider_health_summary AS
SELECT 
  p.id as provider_id,
  p.provider_code,
  p.provider_name,
  
  -- Recent health (last hour)
  COUNT(CASE WHEN h.success AND h.check_timestamp > NOW() - INTERVAL '1 hour' THEN 1 END) as successes_1h,
  COUNT(CASE WHEN NOT h.success AND h.check_timestamp > NOW() - INTERVAL '1 hour' THEN 1 END) as failures_1h,
  AVG(CASE WHEN h.check_timestamp > NOW() - INTERVAL '1 hour' THEN h.response_time_ms END) as avg_response_1h,
  
  -- Daily health
  COUNT(CASE WHEN h.success AND h.check_timestamp > NOW() - INTERVAL '24 hours' THEN 1 END) as successes_24h,
  COUNT(CASE WHEN NOT h.success AND h.check_timestamp > NOW() - INTERVAL '24 hours' THEN 1 END) as failures_24h,
  
  -- Calculate health score
  CASE 
    WHEN COUNT(CASE WHEN h.check_timestamp > NOW() - INTERVAL '1 hour' THEN 1 END) = 0 THEN 50
    ELSE ROUND(
      100.0 * COUNT(CASE WHEN h.success AND h.check_timestamp > NOW() - INTERVAL '1 hour' THEN 1 END) /
      NULLIF(COUNT(CASE WHEN h.check_timestamp > NOW() - INTERVAL '1 hour' THEN 1 END), 0)
    )
  END as health_score

FROM api_providers p
LEFT JOIN provider_health_checks h ON h.provider_id = p.id
WHERE p.enabled = true
GROUP BY p.id, p.provider_code, p.provider_name;
```

### Fallback Chain Configuration

```typescript
interface FallbackChain {
  category: string
  region?: string
  chain: string[]            // Provider codes in order
  stopOnSuccess: boolean
  maxAttempts: number
}

const FALLBACK_CHAINS: FallbackChain[] = [
  // Flights
  {
    category: 'flights',
    region: 'europe',
    chain: ['amadeus', 'kiwi', 'duffel'],
    stopOnSuccess: true,
    maxAttempts: 3
  },
  {
    category: 'flights',
    region: 'north_america',
    chain: ['duffel', 'amadeus', 'kiwi'],
    stopOnSuccess: true,
    maxAttempts: 3
  },
  {
    category: 'flights',
    region: 'default',
    chain: ['amadeus', 'duffel', 'kiwi'],
    stopOnSuccess: true,
    maxAttempts: 3
  },
  
  // Hotels
  {
    category: 'hotels',
    region: 'north_america',
    chain: ['expedia', 'hotelbeds'],
    stopOnSuccess: true,
    maxAttempts: 2
  },
  {
    category: 'hotels',
    region: 'default',
    chain: ['hotelbeds', 'expedia'],
    stopOnSuccess: true,
    maxAttempts: 2
  },
  
  // Cars
  {
    category: 'cars',
    chain: ['cartrawler'],
    stopOnSuccess: true,
    maxAttempts: 1
  },
  
  // Experiences
  {
    category: 'experiences',
    region: 'north_america',
    chain: ['viator', 'getyourguide'],
    stopOnSuccess: true,
    maxAttempts: 2
  },
  {
    category: 'experiences',
    region: 'default',
    chain: ['getyourguide', 'viator'],
    stopOnSuccess: true,
    maxAttempts: 2
  }
]
```

### Retry Logic

```typescript
interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableErrors: string[]
}

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE',
    '502',
    '503',
    '504'
  ]
}

async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = RETRY_CONFIG
): Promise<T> {
  
  let lastError: Error
  let delay = config.baseDelayMs
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Check if retryable
      const isRetryable = config.retryableErrors.some(e => 
        error.message?.includes(e) || error.code === e
      )
      
      if (!isRetryable || attempt === config.maxRetries) {
        throw error
      }
      
      // Log retry attempt
      console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`)
      
      // Wait before retry
      await sleep(delay)
      
      // Exponential backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs)
    }
  }
  
  throw lastError
}
```

---

## Rate Limiting

### Rate Limit Tracking Table

```sql
CREATE TABLE provider_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES api_providers(id) ON DELETE CASCADE,
  
  -- Time window
  window_type VARCHAR(20) NOT NULL,            -- 'minute', 'hour', 'day'
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  
  -- Limits
  max_requests INTEGER NOT NULL,
  current_requests INTEGER DEFAULT 0,
  
  -- Status
  is_exceeded BOOLEAN DEFAULT FALSE,
  exceeded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, window_type, window_start)
);

CREATE INDEX idx_rate_limits_provider ON provider_rate_limits(provider_id, window_type, window_end);
```

### Rate Limit Manager

```typescript
interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  waitMs?: number            // If not allowed, how long to wait
}

async function checkRateLimit(
  providerId: string,
  windowType: 'minute' | 'hour' | 'day'
): Promise<RateLimitResult> {
  
  const provider = await getProvider(providerId)
  const limit = windowType === 'minute' 
    ? provider.rateLimitPerMinute 
    : windowType === 'hour'
      ? provider.rateLimitPerMinute * 60
      : provider.rateLimitPerDay
  
  const now = new Date()
  const windowStart = getWindowStart(now, windowType)
  const windowEnd = getWindowEnd(now, windowType)
  
  // Get or create rate limit record
  const { data: rateLimit } = await supabase
    .from('provider_rate_limits')
    .upsert({
      provider_id: providerId,
      window_type: windowType,
      window_start: windowStart,
      window_end: windowEnd,
      max_requests: limit,
      current_requests: 0
    }, {
      onConflict: 'provider_id,window_type,window_start'
    })
    .select()
    .single()
  
  // Check if exceeded
  if (rateLimit.current_requests >= rateLimit.max_requests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(rateLimit.window_end),
      waitMs: new Date(rateLimit.window_end).getTime() - now.getTime()
    }
  }
  
  // Increment counter
  await supabase
    .from('provider_rate_limits')
    .update({ current_requests: rateLimit.current_requests + 1 })
    .eq('id', rateLimit.id)
  
  return {
    allowed: true,
    remaining: rateLimit.max_requests - rateLimit.current_requests - 1,
    resetAt: new Date(rateLimit.window_end)
  }
}
```

---

## Cost Management

### Cost Tracking Table

```sql
CREATE TABLE provider_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES api_providers(id) ON DELETE CASCADE,
  
  -- Time period
  period_type VARCHAR(20) NOT NULL,            -- 'daily', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Counts
  search_calls INTEGER DEFAULT 0,
  booking_calls INTEGER DEFAULT 0,
  other_calls INTEGER DEFAULT 0,
  
  -- Costs
  search_cost DECIMAL(10,4) DEFAULT 0,
  booking_cost DECIMAL(10,4) DEFAULT 0,
  other_cost DECIMAL(10,4) DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  
  -- Budget
  budget_limit DECIMAL(10,2),
  budget_alert_threshold DECIMAL(10,2),
  budget_exceeded BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, period_type, period_start)
);

-- Daily cost summary view
CREATE VIEW daily_cost_summary AS
SELECT 
  date_trunc('day', l.created_at) as day,
  p.provider_code,
  COUNT(*) as total_calls,
  SUM(l.cost) as total_cost,
  AVG(l.response_time_ms) as avg_response_time,
  COUNT(CASE WHEN l.success THEN 1 END) as successful_calls,
  COUNT(CASE WHEN NOT l.success THEN 1 END) as failed_calls
FROM provider_logs l
JOIN api_providers p ON p.id = l.provider_id
WHERE l.created_at > NOW() - INTERVAL '30 days'
GROUP BY date_trunc('day', l.created_at), p.provider_code
ORDER BY day DESC, total_cost DESC;
```

### Budget Controller

```typescript
interface BudgetConfig {
  dailyLimit: number
  monthlyLimit: number
  alertThreshold: number     // Percentage (e.g., 0.8 = 80%)
  emergencyThreshold: number // Percentage (e.g., 0.95 = 95%)
}

const BUDGET_CONFIG: BudgetConfig = {
  dailyLimit: 50,            // $50/day
  monthlyLimit: 1000,        // $1000/month
  alertThreshold: 0.8,
  emergencyThreshold: 0.95
}

async function checkBudget(providerId?: string): Promise<{
  allowed: boolean
  dailyRemaining: number
  monthlyRemaining: number
  alertTriggered: boolean
}> {
  
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  
  // Get daily spend
  const { data: dailyCosts } = await supabase
    .from('provider_costs')
    .select('total_cost')
    .eq('period_type', 'daily')
    .eq('period_start', today.toISOString().split('T')[0])
    .single()
  
  const dailySpent = dailyCosts?.total_cost || 0
  
  // Get monthly spend
  const { data: monthlyCosts } = await supabase
    .from('provider_costs')
    .select('total_cost')
    .eq('period_type', 'monthly')
    .eq('period_start', monthStart.toISOString().split('T')[0])
    .single()
  
  const monthlySpent = monthlyCosts?.total_cost || 0
  
  // Calculate remaining
  const dailyRemaining = BUDGET_CONFIG.dailyLimit - dailySpent
  const monthlyRemaining = BUDGET_CONFIG.monthlyLimit - monthlySpent
  
  // Check if allowed
  const allowed = dailyRemaining > 0 && monthlyRemaining > 0
  
  // Check alert threshold
  const dailyUsagePercent = dailySpent / BUDGET_CONFIG.dailyLimit
  const monthlyUsagePercent = monthlySpent / BUDGET_CONFIG.monthlyLimit
  const alertTriggered = 
    dailyUsagePercent >= BUDGET_CONFIG.alertThreshold ||
    monthlyUsagePercent >= BUDGET_CONFIG.alertThreshold
  
  if (alertTriggered) {
    await sendBudgetAlert(dailySpent, monthlySpent)
  }
  
  // Emergency mode - disable non-essential calls
  if (dailyUsagePercent >= BUDGET_CONFIG.emergencyThreshold ||
      monthlyUsagePercent >= BUDGET_CONFIG.emergencyThreshold) {
    await enableEmergencyMode()
  }
  
  return {
    allowed,
    dailyRemaining,
    monthlyRemaining,
    alertTriggered
  }
}
```

---

## Provider Logging

### Log Table

```sql
CREATE TABLE provider_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request identity
  request_id UUID NOT NULL,                    -- Unique ID for this request
  session_id UUID,                             -- User's search session
  user_id UUID REFERENCES auth.users(id),
  
  -- Provider
  provider_id UUID REFERENCES api_providers(id),
  provider_code VARCHAR(50),
  
  -- Request details
  endpoint VARCHAR(255),
  method VARCHAR(10),
  request_type VARCHAR(50),                    -- 'search', 'book', 'cancel', 'health'
  category VARCHAR(50),                        -- 'flights', 'hotels', 'cars', 'experiences'
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  response_time_ms INTEGER,
  
  -- Result
  success BOOLEAN,
  status_code INTEGER,
  error_code VARCHAR(50),
  error_message TEXT,
  
  -- Cost
  cost DECIMAL(10,4),
  
  -- Payload (partial, for debugging)
  request_summary JSONB,                       -- Sanitized request data
  response_summary JSONB,                      -- Summary of response (not full payload)
  result_count INTEGER,
  
  -- Context
  routing_score INTEGER,                       -- Score when selected
  was_fallback BOOLEAN DEFAULT FALSE,
  fallback_from VARCHAR(50),                   -- Which provider failed before this
  
  -- Metadata
  client_ip VARCHAR(45),
  user_agent TEXT,
  app_version VARCHAR(20)
);

-- Indexes for common queries
CREATE INDEX idx_logs_request ON provider_logs(request_id);
CREATE INDEX idx_logs_user ON provider_logs(user_id, started_at DESC);
CREATE INDEX idx_logs_provider ON provider_logs(provider_id, started_at DESC);
CREATE INDEX idx_logs_errors ON provider_logs(success, provider_id, started_at DESC) WHERE NOT success;
CREATE INDEX idx_logs_category ON provider_logs(category, started_at DESC);
```

### Logging Middleware

```typescript
interface LogEntry {
  requestId: string
  sessionId?: string
  userId?: string
  providerId: string
  providerCode: string
  endpoint: string
  method: string
  requestType: string
  category: string
  startedAt: Date
  requestSummary: any
}

async function logProviderCall(
  entry: LogEntry,
  result: {
    success: boolean
    statusCode: number
    responseTimeMs: number
    resultCount?: number
    errorCode?: string
    errorMessage?: string
    responseSummary?: any
  },
  cost: number
): Promise<void> {
  
  await supabase.from('provider_logs').insert({
    request_id: entry.requestId,
    session_id: entry.sessionId,
    user_id: entry.userId,
    provider_id: entry.providerId,
    provider_code: entry.providerCode,
    endpoint: entry.endpoint,
    method: entry.method,
    request_type: entry.requestType,
    category: entry.category,
    started_at: entry.startedAt,
    completed_at: new Date(),
    response_time_ms: result.responseTimeMs,
    success: result.success,
    status_code: result.statusCode,
    error_code: result.errorCode,
    error_message: result.errorMessage,
    cost: cost,
    request_summary: sanitizeForLogging(entry.requestSummary),
    response_summary: result.responseSummary,
    result_count: result.resultCount
  })
  
  // Update provider health metrics
  await updateProviderMetrics(entry.providerId, result.success, result.responseTimeMs)
}
```

---

## Edge Function: Provider Manager

### Main Entry Point

```typescript
// supabase/functions/provider-manager/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { RoutingEngine } from './routing-engine.ts'
import { ProviderExecutor } from './provider-executor.ts'
import { ResponseNormalizer } from './response-normalizer.ts'
import { ResultAggregator } from './result-aggregator.ts'
import { CacheManager } from './cache-manager.ts'
import { HealthMonitor } from './health-monitor.ts'

serve(async (req: Request) => {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  try {
    // Parse request
    const { action, category, params, userId, sessionId, preferences } = await req.json()
    
    // Initialize components
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const routing = new RoutingEngine(supabase)
    const executor = new ProviderExecutor(supabase)
    const normalizer = new ResponseNormalizer()
    const aggregator = new ResultAggregator()
    const cache = new CacheManager(supabase)
    const health = new HealthMonitor(supabase)
    
    // Route based on action
    switch (action) {
      case 'search':
        return await handleSearch({
          requestId,
          category,
          params,
          userId,
          sessionId,
          preferences,
          routing,
          executor,
          normalizer,
          aggregator,
          cache,
          health,
          supabase
        })
        
      case 'get_offer':
        return await handleGetOffer({
          requestId,
          offerId: params.offerId,
          providerId: params.providerId,
          executor,
          normalizer,
          supabase
        })
        
      case 'book':
        return await handleBooking({
          requestId,
          offerId: params.offerId,
          providerId: params.providerId,
          travelerDetails: params.travelers,
          paymentDetails: params.payment,
          executor,
          supabase
        })
        
      case 'health_check':
        return await handleHealthCheck({
          providerId: params.providerId,
          health,
          supabase
        })
        
      default:
        throw new Error(`Unknown action: ${action}`)
    }
    
  } catch (error) {
    console.error('Provider Manager Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred'
        },
        requestId,
        duration: Date.now() - startTime
      }),
      {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleSearch(context: SearchContext): Promise<Response> {
  const { 
    requestId, category, params, userId, sessionId, preferences,
    routing, executor, normalizer, aggregator, cache, health, supabase
  } = context
  
  // 1. Check cache first
  const cacheKey = cache.generateKey(category, params)
  const cached = await cache.get(cacheKey)
  if (cached && !params.refresh) {
    return new Response(
      JSON.stringify({
        success: true,
        data: cached,
        source: 'cache',
        requestId
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  // 2. Build user context
  const userContext = await buildUserContext(userId, preferences, supabase)
  
  // 3. Get provider scores and select providers
  const providerScores = await routing.scoreProviders(category, params, userContext)
  const selectedProviders = routing.selectProviders(providerScores, params.strategy)
  
  // 4. Check provider health
  const healthyProviders = await health.filterHealthy(selectedProviders)
  
  if (healthyProviders.length === 0) {
    throw {
      code: 'NO_PROVIDERS_AVAILABLE',
      message: 'No healthy providers available for this search',
      status: 503
    }
  }
  
  // 5. Execute search across providers
  const executionResults = await executor.executeSearch(
    healthyProviders,
    category,
    params,
    {
      requestId,
      sessionId,
      userId,
      timeout: params.timeout || 8000
    }
  )
  
  // 6. Normalize responses
  const normalizedResults = executionResults
    .filter(r => r.success)
    .map(r => normalizer.normalize(r.providerCode, category, r.data))
  
  // 7. Aggregate and rank results
  const aggregatedResults = aggregator.aggregate(normalizedResults, {
    deduplicate: true,
    sortBy: params.sortBy || 'price',
    limit: params.limit || 50,
    userPreferences: preferences
  })
  
  // 8. Cache results
  await cache.set(cacheKey, aggregatedResults, { ttl: 300 }) // 5 min TTL
  
  // 9. Create search session
  const session = await createSearchSession(
    supabase,
    sessionId || crypto.randomUUID(),
    userId,
    category,
    params,
    aggregatedResults
  )
  
  // 10. Return response
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        results: aggregatedResults.results,
        totalCount: aggregatedResults.totalCount,
        providers: aggregatedResults.providersMeta,
        session: session.id
      },
      source: 'live',
      requestId,
      duration: Date.now() - context.startTime
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
```

### Routing Engine Implementation

```typescript
// supabase/functions/provider-manager/routing-engine.ts

export class RoutingEngine {
  private supabase: SupabaseClient
  private rulesCache: RoutingRule[] | null = null
  private providerCache: Map<string, Provider> = new Map()
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }
  
  async scoreProviders(
    category: string,
    params: SearchParams,
    userContext: UserContext
  ): Promise<ProviderScore[]> {
    
    // Load providers for this category
    const providers = await this.getProvidersForCategory(category)
    
    // Load routing rules
    const rules = await this.getRoutingRules()
    
    // Score each provider
    const scores: ProviderScore[] = []
    
    for (const provider of providers) {
      const score = this.calculateScore(provider, category, params, userContext, rules)
      scores.push(score)
    }
    
    // Sort by score descending
    scores.sort((a, b) => b.totalScore - a.totalScore)
    
    return scores
  }
  
  selectProviders(
    scores: ProviderScore[],
    strategy?: string
  ): SelectedProvider[] {
    
    const eligible = scores.filter(s => s.eligible)
    
    switch (strategy) {
      case 'single':
        return eligible.slice(0, 1).map(s => ({
          providerId: s.providerId,
          providerCode: s.providerCode,
          score: s.totalScore,
          isPrimary: true
        }))
        
      case 'comprehensive':
        return eligible.map((s, i) => ({
          providerId: s.providerId,
          providerCode: s.providerCode,
          score: s.totalScore,
          isPrimary: i === 0
        }))
        
      case 'price_compare':
      default:
        // Top 3 for price comparison
        return eligible.slice(0, 3).map((s, i) => ({
          providerId: s.providerId,
          providerCode: s.providerCode,
          score: s.totalScore,
          isPrimary: i === 0
        }))
    }
  }
  
  private calculateScore(
    provider: Provider,
    category: string,
    params: SearchParams,
    userContext: UserContext,
    rules: RoutingRule[]
  ): ProviderScore {
    
    let geographic = 0
    let categoryScore = 0
    let preference = 0
    let performance = 0
    let cost = 0
    let ruleBoost = 0
    
    // ═══════════════════════════════════════════
    // Geographic scoring (0-30)
    // ═══════════════════════════════════════════
    
    const destinationRegion = this.determineRegion(params.destination)
    const originRegion = this.determineRegion(params.origin)
    
    if (provider.strongRegions.includes(destinationRegion)) {
      geographic += 20
    } else if (provider.coverageRegions.includes(destinationRegion)) {
      geographic += 12
    }
    
    if (provider.strongRegions.includes(originRegion)) {
      geographic += 10
    } else if (provider.coverageRegions.includes(originRegion)) {
      geographic += 5
    }
    
    // Route-specific bonuses
    const routeType = this.classifyRoute(params.origin, params.destination)
    if (routeType === 'domestic_us' && provider.providerCode === 'duffel') {
      geographic += 10
    }
    if (routeType === 'intra_europe' && provider.providerCode === 'kiwi') {
      geographic += 8
    }
    if (routeType === 'transatlantic' && provider.providerCode === 'amadeus') {
      geographic += 10
    }
    
    geographic = Math.min(geographic, 30)
    
    // ═══════════════════════════════════════════
    // Category strength (0-25)
    // ═══════════════════════════════════════════
    
    const capability = provider.capabilities[category]
    
    if (capability?.isPrimary) {
      categoryScore += 20
    } else if (capability?.isStrong) {
      categoryScore += 15
    } else if (capability?.isSupported) {
      categoryScore += 8
    }
    
    // Feature bonuses
    if (params.isMultiCity && capability?.supportsMultiCity) {
      categoryScore += 5
    }
    if (params.flexibleDates && capability?.supportsFlexibleDates) {
      categoryScore += 3
    }
    if (params.cabinClass === 'business' && capability?.hasPremiumInventory) {
      categoryScore += 4
    }
    
    categoryScore = Math.min(categoryScore, 25)
    
    // ═══════════════════════════════════════════
    // User preference alignment (0-20)
    // ═══════════════════════════════════════════
    
    if (userContext.preferences) {
      const prefs = userContext.preferences
      
      // Budget alignment
      if (prefs.budgetLevel === 'budget' && provider.specialization === 'budget') {
        preference += 12
      } else if (prefs.budgetLevel === 'luxury' && provider.specialization === 'premium') {
        preference += 12
      } else if (prefs.budgetLevel === 'mid_range') {
        preference += 8
      }
      
      // Travel style
      if (prefs.travelStyle === 'business' && provider.goodForBusiness) {
        preference += 5
      }
      if (prefs.travelStyle === 'adventure' && provider.goodForAdventure) {
        preference += 5
      }
      
      // Historical success with this user
      if (userContext.providerHistory?.[provider.providerCode]?.successRate > 0.9) {
        preference += 3
      }
    }
    
    preference = Math.min(preference, 20)
    
    // ═══════════════════════════════════════════
    // Historical performance (0-15)
    // ═══════════════════════════════════════════
    
    // Health score contribution (0-8)
    performance += (provider.healthScore / 100) * 8
    
    // Success rate contribution (0-7)
    if (provider.totalCalls > 0) {
      const successRate = provider.successfulCalls / provider.totalCalls
      performance += successRate * 7
    } else {
      performance += 5 // Default for new providers
    }
    
    // Penalty for consecutive failures
    if (provider.consecutiveFailures > 0) {
      performance -= Math.min(provider.consecutiveFailures * 3, 10)
    }
    
    // Response time factor
    if (provider.avgResponseTimeMs > 2000) {
      performance -= 3
    } else if (provider.avgResponseTimeMs < 500) {
      performance += 2
    }
    
    performance = Math.max(performance, 0)
    performance = Math.min(performance, 15)
    
    // ═══════════════════════════════════════════
    // Cost efficiency (0-10)
    // ═══════════════════════════════════════════
    
    const maxCost = 0.05 // Baseline comparison
    if (provider.costPerSearch <= maxCost) {
      cost = 10 - (provider.costPerSearch / maxCost) * 10
    }
    
    // ═══════════════════════════════════════════
    // Apply routing rules
    // ═══════════════════════════════════════════
    
    for (const rule of rules) {
      if (this.ruleMatches(rule, category, params, userContext)) {
        if (rule.providerCode === provider.providerCode) {
          ruleBoost += rule.providerPriorityBoost || 0
          ruleBoost -= rule.providerPriorityPenalty || 0
        }
      }
    }
    
    // ═══════════════════════════════════════════
    // Calculate total
    // ═══════════════════════════════════════════
    
    const totalScore = geographic + categoryScore + preference + performance + cost + ruleBoost
    
    return {
      providerId: provider.id,
      providerCode: provider.providerCode,
      totalScore,
      breakdown: {
        geographic,
        category: categoryScore,
        preference,
        performance,
        cost,
        ruleBoost
      },
      eligible: totalScore >= 25 && provider.enabled && provider.healthScore >= 30
    }
  }
  
  private determineRegion(location: string): string {
    // Airport/city code to region mapping
    const regionMap: Record<string, string> = {
      // US
      'JFK': 'north_america', 'LAX': 'north_america', 'ORD': 'north_america',
      'SFO': 'north_america', 'MIA': 'north_america', 'DFW': 'north_america',
      
      // Europe
      'LHR': 'europe', 'CDG': 'europe', 'FRA': 'europe', 'AMS': 'europe',
      'MAD': 'europe', 'FCO': 'europe', 'BCN': 'europe', 'MUC': 'europe',
      
      // Asia
      'NRT': 'asia', 'HND': 'asia', 'PEK': 'asia', 'PVG': 'asia',
      'HKG': 'asia', 'SIN': 'asia', 'BKK': 'asia', 'ICN': 'asia',
      
      // Middle East
      'DXB': 'middle_east', 'DOH': 'middle_east', 'AUH': 'middle_east',
      
      // South America
      'GRU': 'south_america', 'EZE': 'south_america', 'BOG': 'south_america',
      
      // Africa
      'JNB': 'africa', 'CAI': 'africa', 'CPT': 'africa',
      
      // Oceania
      'SYD': 'oceania', 'MEL': 'oceania', 'AKL': 'oceania'
    }
    
    const code = location.toUpperCase().substring(0, 3)
    return regionMap[code] || 'other'
  }
  
  private classifyRoute(origin: string, destination: string): string {
    const originRegion = this.determineRegion(origin)
    const destRegion = this.determineRegion(destination)
    
    if (originRegion === 'north_america' && destRegion === 'north_america') {
      return 'domestic_us'
    }
    if (originRegion === 'europe' && destRegion === 'europe') {
      return 'intra_europe'
    }
    if ((originRegion === 'north_america' && destRegion === 'europe') ||
        (originRegion === 'europe' && destRegion === 'north_america')) {
      return 'transatlantic'
    }
    if ((originRegion === 'north_america' && destRegion === 'asia') ||
        (originRegion === 'asia' && destRegion === 'north_america')) {
      return 'transpacific'
    }
    
    return 'international'
  }
  
  private ruleMatches(
    rule: RoutingRule,
    category: string,
    params: SearchParams,
    userContext: UserContext
  ): boolean {
    const conditions = rule.conditions
    
    if (conditions.category && conditions.category !== category) {
      return false
    }
    if (conditions.region && conditions.region !== this.determineRegion(params.destination)) {
      return false
    }
    if (conditions.routeType && conditions.routeType !== this.classifyRoute(params.origin, params.destination)) {
      return false
    }
    if (conditions.userBudget && conditions.userBudget !== userContext.preferences?.budgetLevel) {
      return false
    }
    
    return true
  }
  
  private async getProvidersForCategory(category: string): Promise<Provider[]> {
    const { data: providers } = await this.supabase
      .from('api_providers')
      .select(`
        *,
        provider_capabilities!inner (*)
      `)
      .eq('enabled', true)
      .eq(`supports_${category}`, true)
    
    return providers || []
  }
  
  private async getRoutingRules(): Promise<RoutingRule[]> {
    if (this.rulesCache) return this.rulesCache
    
    const { data: rules } = await this.supabase
      .from('routing_rules')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: false })
    
    this.rulesCache = rules || []
    return this.rulesCache
  }
}
```

---

## Auto-Recovery & Self-Healing

### Provider Recovery Job

```typescript
// Run every 5 minutes via Supabase scheduled function

async function providerRecoveryJob() {
  const supabase = createClient(...)
  
  // Get providers that need recovery check
  const { data: degradedProviders } = await supabase
    .from('api_providers')
    .select('*')
    .or('status.eq.degraded,status.eq.disabled')
    .eq('enabled', true)
  
  for (const provider of degradedProviders || []) {
    // Perform health check
    const healthResult = await performHealthCheck(provider)
    
    if (healthResult.healthy) {
      // Check if consistently healthy
      const recentChecks = await getRecentHealthChecks(provider.id, 5)
      const successCount = recentChecks.filter(c => c.success).length
      
      if (successCount >= 3) {
        // Recover provider
        await supabase
          .from('api_providers')
          .update({
            status: 'active',
            health_score: Math.min(provider.health_score + 20, 100),
            consecutive_failures: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', provider.id)
        
        // Log recovery
        await logProviderEvent(provider.id, 'recovered', {
          previousStatus: provider.status,
          newHealthScore: Math.min(provider.health_score + 20, 100)
        })
        
        // Send recovery notification
        await sendAlert({
          type: 'provider_recovered',
          provider: provider.provider_code,
          message: `${provider.provider_name} has recovered and is back online`
        })
      }
    }
  }
}

async function performHealthCheck(provider: Provider): Promise<HealthCheckResult> {
  const adapter = getProviderAdapter(provider.providerCode)
  const startTime = Date.now()
  
  try {
    // Perform lightweight health check
    const result = await adapter.healthCheck()
    
    // Log result
    await logHealthCheck(provider.id, {
      success: true,
      responseTimeMs: Date.now() - startTime,
      statusCode: 200
    })
    
    return {
      healthy: true,
      responseTime: Date.now() - startTime
    }
    
  } catch (error) {
    await logHealthCheck(provider.id, {
      success: false,
      responseTimeMs: Date.now() - startTime,
      errorMessage: error.message
    })
    
    return {
      healthy: false,
      error: error.message
    }
  }
}
```

### Alert System

```typescript
interface AlertConfig {
  slackWebhook?: string
  emailRecipients?: string[]
  enabledAlerts: string[]
}

const ALERT_CONFIG: AlertConfig = {
  slackWebhook: Deno.env.get('SLACK_WEBHOOK'),
  emailRecipients: ['alerts@yourdomain.com'],
  enabledAlerts: [
    'provider_down',
    'provider_degraded',
    'provider_recovered',
    'budget_warning',
    'budget_exceeded',
    'high_error_rate'
  ]
}

async function sendAlert(alert: {
  type: string
  provider?: string
  message: string
  severity?: 'info' | 'warning' | 'critical'
  data?: any
}): Promise<void> {
  
  if (!ALERT_CONFIG.enabledAlerts.includes(alert.type)) {
    return
  }
  
  const severity = alert.severity || 'info'
  
  // Send to Slack
  if (ALERT_CONFIG.slackWebhook) {
    const emoji = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️'
    
    await fetch(ALERT_CONFIG.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${emoji} *Guidera Provider Alert*`,
        attachments: [{
          color: severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'good',
          fields: [
            { title: 'Type', value: alert.type, short: true },
            { title: 'Provider', value: alert.provider || 'N/A', short: true },
            { title: 'Message', value: alert.message }
          ],
          ts: Math.floor(Date.now() / 1000)
        }]
      })
    })
  }
  
  // Log to database
  await supabase.from('system_alerts').insert({
    alert_type: alert.type,
    provider_code: alert.provider,
    message: alert.message,
    severity,
    data: alert.data
  })
}
```

---

## Configuration Summary

### Environment Variables

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Provider Credentials (store in Supabase secrets)
AMADEUS_CLIENT_ID=xxx
AMADEUS_CLIENT_SECRET=xxx
DUFFEL_API_KEY=xxx
KIWI_API_KEY=xxx
EXPEDIA_API_KEY=xxx
EXPEDIA_SHARED_SECRET=xxx
HOTELBEDS_API_KEY=xxx
HOTELBEDS_SECRET=xxx
GETYOURGUIDE_API_KEY=xxx
VIATOR_API_KEY=xxx
CARTRAWLER_CLIENT_ID=xxx
CARTRAWLER_API_KEY=xxx

# Alerts
SLACK_WEBHOOK=xxx
ALERT_EMAIL=xxx

# Feature flags
ENABLE_PRICE_COMPARISON=true
ENABLE_PARALLEL_SEARCH=true
ENABLE_CACHING=true
MAX_CONCURRENT_PROVIDERS=3
DEFAULT_SEARCH_TIMEOUT_MS=8000
```

### Default Configuration Object

```typescript
export const PROVIDER_MANAGER_CONFIG = {
  // Routing
  routing: {
    minScoreThreshold: 25,
    maxProvidersParallel: 3,
    maxProvidersComprehensive: 5
  },
  
  // Execution
  execution: {
    defaultTimeoutMs: 8000,
    bookingTimeoutMs: 30000,
    maxRetries: 3,
    retryBaseDelayMs: 1000
  },
  
  // Circuit breaker
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 3,
    openDurationMs: 60000
  },
  
  // Rate limiting
  rateLimiting: {
    enabled: true,
    defaultPerMinute: 100,
    defaultPerDay: 10000
  },
  
  // Caching
  caching: {
    enabled: true,
    searchTtlSeconds: 300,
    offerTtlSeconds: 900
  },
  
  // Budget
  budget: {
    dailyLimit: 50,
    monthlyLimit: 1000,
    alertThreshold: 0.8
  },
  
  // Logging
  logging: {
    logAllRequests: true,
    logPayloads: false,  // Set to true for debugging
    retentionDays: 30
  }
}
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create `api_providers` table
- [ ] Create `provider_credentials` table
- [ ] Create `provider_capabilities` table
- [ ] Create `routing_rules` table with default rules
- [ ] Create `provider_logs` table
- [ ] Create `provider_health_checks` table
- [ ] Create `provider_rate_limits` table
- [ ] Create `provider_costs` table

### Phase 2: Core Edge Function
- [ ] Create `provider-manager` edge function
- [ ] Implement `RoutingEngine` class
- [ ] Implement `ProviderExecutor` class
- [ ] Implement basic error handling
- [ ] Implement logging middleware

### Phase 3: Provider Adapters
- [ ] Implement Amadeus adapter
- [ ] Implement Duffel adapter
- [ ] Implement Kiwi adapter
- [ ] Implement GetYourGuide adapter
- [ ] Implement Cartrawler adapter

### Phase 4: Resilience
- [ ] Implement circuit breaker
- [ ] Implement retry logic
- [ ] Implement rate limiting
- [ ] Implement health checks
- [ ] Implement fallback chains

### Phase 5: Optimization
- [ ] Implement caching layer
- [ ] Implement cost tracking
- [ ] Implement budget controls
- [ ] Implement alert system

### Phase 6: Testing
- [ ] Test single provider search
- [ ] Test multi-provider search
- [ ] Test fallback scenarios
- [ ] Test circuit breaker behavior
- [ ] Test rate limiting
- [ ] Load testing

---

**This Provider Manager System is the foundation for Guidera's multi-provider booking capability. It ensures users always get the best deals by intelligently routing across providers while maintaining reliability and controlling costs.**
