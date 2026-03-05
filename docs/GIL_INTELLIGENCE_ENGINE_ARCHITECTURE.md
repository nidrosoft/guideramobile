# Guidera Intelligence Layer (GIL) — Personalization & Deal Engine Architecture

## Executive Summary

The Guidera Intelligence Layer (GIL) is a **background intelligence engine** that transforms Guidera from a travel search tool into a **personal travel concierge**. It continuously scans for deals across flights, hotels, experiences, and cars — but unlike generic deal sites, **every deal is scored and ranked against each individual user's profile, behavior, and cultural identity**.

**Core philosophy:** "The app knows me better than I know myself."

**What makes GIL different from a generic deal feed:**
- A user from Cameroon living in San Diego sees flights to Douala during holidays
- A budget-conscious solo traveler sees hostel deals, not luxury resort packages
- A foodie couple sees culinary tour experiences in cities they've been searching
- A family of 4 sees kid-friendly hotel deals near destinations they saved
- On Friday evenings, users see local weekend hotel staycation deals in their home city

---

## Part 1: Signal Sources — The 7 Layers of User Intelligence

### Layer 1: Explicit Preferences (`travel_preferences` table)

What the user **told us** during onboarding. Highest-confidence signal.

| Field | GIL Usage | Example |
|-------|-----------|---------|
| `default_companion_type` | Filter deals by group size | "couple" → romantic getaway deals |
| `preferred_trip_styles` | Match destinations by style | ["foodie","culture"] → Paris, Tokyo |
| `default_trip_pace` | Filter by activity density | "relaxed" → resort/beach deals |
| `time_preference` | Schedule notifications | "morning" → send digest at 7 AM |
| `default_adults/children/infants` | Filter family-compatible deals | 2+2 kids → family resorts |
| `default_budget_amount` | Set price ceiling | $2000 → filter $5000+ trips |
| `default_currency` | Display in user's currency | "EUR" → show €320 not $350 |
| `spending_style` | Weight deal scoring | "budget" → prioritize % savings |
| `budget_priority` | Optimize category | "accommodation" → hotel deals higher |
| `interests` | Match destination tags | ["museums","food","nature"] → Florence |
| `accommodation_type` | Filter hotel type | "boutique" → skip chain hotels |
| `min_star_rating` | Quality threshold | 4 → only 4+ star hotels |
| `preferred_amenities` | Match amenities | ["pool","gym"] → filter hotels |
| `flight_class` | Filter flight class | "business" → business class deals |
| `flight_stops` | Filter by stops | "direct" → only nonstop flights |
| `dietary_restrictions` | Match food deals | ["halal"] → halal-friendly cities |
| `wheelchair_accessible` | Accessibility filter | true → accessible venues only |
| `traveling_with_pet` | Pet-friendly filter | true → pet-friendly hotels |

**Completeness scoring:** `preferences_completed` flag + `calculateCompleteness()` in `preferences.service.ts` determines confidence:
- **100% complete:** Hot start (full personalization)
- **50-99%:** Warm start (good personalization with defaults)
- **< 50%:** Cold start (use popularity + demographics)

### Layer 2: Identity & Heritage (`profiles` table)

Who the user **is**. Uniquely powerful for diaspora travelers.

| Field | GIL Usage | Example |
|-------|-----------|---------|
| `city` + `latitude/longitude` | Home airport, local deals | "San Diego" → SAN airport |
| `country` | Departure country | "United States" → US airports |
| `nationality` | **Heritage destination scanning** | "Cameroonian" → scan DLA, NSI flights |
| `country_of_residence` | Confirm departure | "US" → US-based pricing |
| `ethnicity` | Cultural affinity destinations | Heritage travel patterns |
| `languages_spoken` | Comfort-level destinations | ["French","English"] → francophone countries |
| `countries_visited` | Avoid/re-suggest | ["France","Italy"] → "Try Spain?" |
| `passport_country` | Visa-free prioritization | "US" → 186 visa-free countries |
| `cuisine_preferences` | Match foodie experiences | ["African","French"] → Senegal food tours |
| `activity_level` | Match experience intensity | "high" → hiking, diving deals |
| `morning_person` | Notification timing | true → deals at 7 AM, not 9 PM |
| `profession` | Business travel inference | "consultant" → business class |
| `international_trips_count` | Experience level | 0 → beginner-friendly destinations |

**Heritage scanning is GIL's killer feature.** A Nigerian-American in Houston sees:
- Flights IAH → LOS (Lagos) around Christmas
- Flights IAH → ABV (Abuja) around Oct 1 (Independence Day)
- Hotels in Lagos during Detty December
- Nigerian restaurants/cultural experiences in Houston

### Layer 3: Behavioral Signals (`search_sessions` table)

What the user **actually does**. Actions speak louder than preferences.

| Field | GIL Usage |
|-------|-----------|
| `destination_city/country/code` | Most-searched destinations (high-intent) |
| `origin_code` | Confirm departure airport |
| `start_date/end_date` | Travel timing patterns |
| `flexible_dates` | Price sensitivity signal |
| `filters_applied` | Revealed preferences (always filters "nonstop") |
| `sort_applied` | Priority signal ("price_asc" = price is #1) |
| `offers_clicked` | Click-through interest |
| `booking_initiated` but not `completed` | Price alert opportunity |

**Pattern extraction example:**
```
Searched JFK→DLA 3x in 2 weeks (Dec dates) + Hotels in Douala 2x
→ HIGH intent: Douala Christmas trip → auto-scan this route
→ Home airport: JFK confirmed
→ Travel pattern: Dec traveler, plans 2-3 months ahead
```

### Layer 4: Engagement Signals (`deal_clicks` + `saved_deals`)

| Signal | Strength | Usage |
|--------|----------|-------|
| Deal click | Strong | Price tolerance, provider preference |
| Deal saved | Strongest | Exact deal/route they want |
| Confirmed booking | Conversion | Revenue attribution |

### Layer 5: Active Monitoring (`price_alerts`)

Strongest intent signal. Users with active alerts told us **exactly** what they want and what they'll pay.

### Layer 6: Community Signals (`community_posts` + `saved_posts`)

- Posts saved about destinations → interest signal
- "want_to_go" reactions → direct destination interest
- "been_there" reactions → already-visited tracking

### Layer 7: Contextual Signals (Real-time)

Current location, day of week, season, holidays, currency exchange rates.

---

## Part 2: The User Travel DNA

### 2.1 Overview

GIL **pre-computes** a denormalized intelligence profile per user called **Travel DNA**, stored in `user_travel_dna`. This avoids querying 7 tables on every personalization request.

### 2.2 New Table: `user_travel_dna`

```sql
CREATE TABLE user_travel_dna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Geographic Identity
  home_airport_code TEXT,
  home_airport_name TEXT,
  home_city TEXT,
  home_country TEXT,
  home_lat NUMERIC,
  home_lng NUMERIC,
  heritage_countries TEXT[],
  heritage_airport_codes TEXT[],
  visa_free_countries TEXT[],
  
  -- Budget Profile (blended preferences + behavior)
  budget_tier INTEGER DEFAULT 3,          -- 1=ultra-budget to 5=luxury
  max_flight_price NUMERIC,
  max_hotel_nightly NUMERIC,
  preferred_currency TEXT DEFAULT 'USD',
  price_sensitivity NUMERIC DEFAULT 0.5,  -- 0=doesn't care, 1=extremely sensitive
  
  -- Destination Preferences (weighted, scored)
  preferred_regions JSONB DEFAULT '[]',
  top_destinations JSONB DEFAULT '[]',    -- [{city,code,score,searches,last_searched}]
  avoided_destinations TEXT[],
  
  -- Travel Patterns
  typical_trip_length_days INTEGER,
  preferred_months INTEGER[],
  advance_booking_days INTEGER,
  is_weekend_traveler BOOLEAN DEFAULT false,
  is_flexible_dater BOOLEAN DEFAULT false,
  travel_frequency TEXT DEFAULT 'occasional',
  
  -- Companion & Group
  primary_companion_type TEXT,
  typical_group_size INTEGER DEFAULT 1,
  has_children BOOLEAN DEFAULT false,
  has_infants BOOLEAN DEFAULT false,
  
  -- Interest Vector
  interest_vector JSONB DEFAULT '[]',     -- [{tag,weight}]
  
  -- Sub-profiles
  accommodation_preferences JSONB DEFAULT '{}',
  flight_preferences JSONB DEFAULT '{}',
  experience_preferences JSONB DEFAULT '{}',
  
  -- Engagement
  engagement_score INTEGER DEFAULT 0,     -- 0-100
  total_searches INTEGER DEFAULT 0,
  total_deal_clicks INTEGER DEFAULT 0,
  total_deals_saved INTEGER DEFAULT 0,
  active_price_alerts INTEGER DEFAULT 0,
  last_search_at TIMESTAMPTZ,
  last_deal_click_at TIMESTAMPTZ,
  last_app_active_at TIMESTAMPTZ,
  
  -- Notification Profile
  preferred_notification_time TEXT,
  notification_timezone TEXT,
  max_daily_notifications INTEGER DEFAULT 3,
  notifications_sent_today INTEGER DEFAULT 0,
  last_notification_at TIMESTAMPTZ,
  
  -- Computation Metadata
  dna_version INTEGER DEFAULT 1,
  confidence_score INTEGER DEFAULT 0,     -- 0-100
  strategy_tier TEXT DEFAULT 'cold',      -- cold | warm | hot
  data_sources_used TEXT[],
  last_computed_at TIMESTAMPTZ DEFAULT now(),
  next_recompute_at TIMESTAMPTZ,
  computation_duration_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_dna_user ON user_travel_dna(user_id);
CREATE INDEX idx_dna_home_airport ON user_travel_dna(home_airport_code) WHERE home_airport_code IS NOT NULL;
CREATE INDEX idx_dna_heritage ON user_travel_dna USING GIN(heritage_airport_codes);
CREATE INDEX idx_dna_strategy ON user_travel_dna(strategy_tier);
CREATE INDEX idx_dna_engagement ON user_travel_dna(engagement_score DESC);
CREATE INDEX idx_dna_recompute ON user_travel_dna(next_recompute_at) WHERE next_recompute_at IS NOT NULL;
```

### 2.3 DNA Computation Algorithm

**When it runs:**
- On user signup (after onboarding)
- On preference update (immediate)
- Daily batch (2 AM UTC for all active users)
- On significant activity (10+ searches or 5+ clicks since last compute)

**Algorithm steps:**

1. **Geographic Identity**: Map city/lat/lng → nearest IATA airport code using static lookup (top 200 cities). Heritage countries from nationality/ethnicity → major airports. Visa-free from passport_country.

2. **Budget Profile**: Blend stated `spending_style` (40% weight) with median clicked price (40%) and sort behavior (20%). If < 5 clicks, trust stated preferences only.

3. **Destination Preferences**: Score destinations by: searches (3pts × recency), clicks (5pts), saves (10pts), alerts (15pts), heritage bonus (8pts). Top 10 become `top_destinations`.

4. **Travel Patterns**: Median trip length, modal search months, median advance days, weekend/flexible flags from search_sessions (last 90 days).

5. **Interest Vector**: Combine explicit preferences (weight 1.0) + search filters (0.5/occurrence) + clicked categories (0.3/click) + community saves (0.2/save). Normalize to 0-1.

6. **Engagement Score**: min(100, searches×2 + clicks×3 + saves×5 + alerts×5 + interactions×0.5). Determines strategy_tier: ≥60=hot, ≥20=warm, <20=cold.

7. **Confidence Score**: min(100, preferences_complete×25 + nationality×10 + city×10 + airport×10 + searches×2 + clicks×3 + alerts×10).

### 2.4 Airport Derivation

Static lookup embedded in edge function (no API):
```
City → Airport: "San Diego"→"SAN", "New York"→"JFK", "Douala"→"DLA", etc.
Country → Heritage Airports: "Cameroon"→["DLA","NSI"], "Nigeria"→["LOS","ABV"], etc.
```
Fallback: most-used origin_code from search_sessions → country capital airport.

---

## Part 3: The Deal Scanner Engine

### 3.1 Architecture

```
ROUTE BUILDER (reads user_travel_dna)
    ↓
API DISPATCHER (serpapi-flights/hotels/explore + viator)
    ↓
DEAL SCORER (compare with price_history, assign score + badges)
    ↓
USER MATCHER (score relevance per user via DNA)
    ↓
NOTIFICATION DISPATCHER (push/feed/digest based on score)
```

### 3.2 Scan Types & Schedules

| Scan | Frequency | API | Credits/Run |
|------|-----------|-----|-------------|
| Heritage Scanner | Daily 6 AM | serpapi-flights | 20-40 |
| Explore Discovery | Daily 7 AM | serpapi-explore | 10-20 |
| Popular Routes | Every 12h | serpapi-flights | 20-40 |
| Price Alert Check | Every 6h | serpapi-flights+hotels | 10-50 |
| Hotel Deals | Daily 8 AM | serpapi-hotels | 15-30 |
| Local Weekend | Friday 3 PM local | serpapi-hotels+viator | 10-20 |
| Experience Scanner | Daily 9 AM | viator | 15-30 |

### 3.3 Smart Batching

Many users share home airports and heritage countries. Scan per-unique-airport, share results:

```
500 users → 30 unique airports × 25 heritage countries
WITHOUT batching: 1,500 API calls
WITH batching: ~100 unique airport→heritage combos = 100 calls (93% reduction)
```

### 3.4 Credit Budget (SerpAPI Developer: 5,000/mo)

| Scan | Monthly |
|------|---------|
| Heritage | 900 |
| Explore | 450 |
| Popular routes (2x/day) | 1,200 |
| Price alerts (4x/day) | 1,200 |
| Hotels | 600 |
| User searches (real-time) | ~900 |
| **Total** | **~5,250** |

Start on Developer ($75/mo). Upgrade to Production ($150/mo, 15K) when user base > 200.

### 3.5 New Table: `user_deal_matches`

```sql
CREATE TABLE user_deal_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_cache_id UUID NOT NULL REFERENCES deal_cache(id) ON DELETE CASCADE,
  relevance_score NUMERIC NOT NULL DEFAULT 0,
  score_breakdown JSONB DEFAULT '{}',
  match_reasons TEXT[],
  deal_type TEXT NOT NULL,
  deal_title TEXT NOT NULL,
  deal_subtitle TEXT,
  deal_image_url TEXT,
  price_amount NUMERIC NOT NULL,
  price_currency TEXT DEFAULT 'USD',
  original_price NUMERIC,
  discount_percent NUMERIC,
  deal_badges TEXT[],
  booking_url TEXT,
  provider TEXT,
  delivery_channel TEXT,          -- push | feed | digest | none
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, deal_cache_id)
);

CREATE INDEX idx_deal_matches_feed ON user_deal_matches(user_id, relevance_score DESC, created_at DESC)
  WHERE expires_at > now() OR expires_at IS NULL;
CREATE INDEX idx_deal_matches_push ON user_deal_matches(delivery_channel, notification_sent)
  WHERE delivery_channel = 'push' AND notification_sent = false;
```

### 3.6 New Table: `deal_notifications`

```sql
CREATE TABLE deal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_match_id UUID REFERENCES user_deal_matches(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,    -- push | digest | price_alert
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  image_url TEXT,
  status TEXT DEFAULT 'pending',      -- pending | sent | delivered | failed | skipped
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  failure_reason TEXT,
  priority INTEGER DEFAULT 5,
  batch_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_pending ON deal_notifications(scheduled_for, status)
  WHERE status = 'pending';
CREATE INDEX idx_notifications_user ON deal_notifications(user_id, created_at DESC);
```

### 3.7 New Table: `user_search_patterns`

```sql
CREATE TABLE user_search_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  top_flight_routes JSONB DEFAULT '[]',
  top_hotel_cities JSONB DEFAULT '[]',
  top_experience_cities JSONB DEFAULT '[]',
  total_flight_searches INTEGER DEFAULT 0,
  total_hotel_searches INTEGER DEFAULT 0,
  total_experience_searches INTEGER DEFAULT 0,
  total_car_searches INTEGER DEFAULT 0,
  avg_flight_price_clicked NUMERIC,
  avg_hotel_price_clicked NUMERIC,
  most_searched_months INTEGER[],
  avg_trip_length_days NUMERIC,
  avg_advance_booking_days NUMERIC,
  searches_per_week NUMERIC,
  computed_from_sessions INTEGER DEFAULT 0,
  last_computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
```

---

## Part 4: Deal Scoring Algorithm

### 4.1 Objective Deal Score (`deal_cache.deal_score`, 0-100)

How good a deal is regardless of user:

```
price_drop_score (45% weight):
  ≥40% below median → 100
  ≥25% below median → 80
  ≥15% below median → 60
  ≥5% below median  → 30
  else              → 10

historical_low_score (35% weight):
  At/below record low  → 100
  Within 5% of low     → 90
  Within 10% of low    → 70
  Within 20% of low    → 40
  else                 → 10

freshness_score (20% weight):
  Current scan → 100, <6h → 80, <24h → 50, else → 20

deal_score = price_drop×0.45 + historical_low×0.35 + freshness×0.20

Badges assigned:
  record_low, great_deal, good_deal, price_drop,
  near_record_low, direct_flight, last_minute, weekend_getaway
```

### 4.2 Personal Relevance Score (`user_deal_matches.relevance_score`, 0.0-1.0)

How relevant a deal is for a specific user:

```
destination_match (30% weight):
  In top_destinations → 1.0
  Heritage country    → 0.9
  Preferred region    → 0.7
  Visa-free country   → 0.4
  Unknown             → 0.2

price_match (25% weight):
  ≤50% of max budget  → 1.0
  ≤75% of max budget  → 0.9
  ≤100% of max budget → 0.7
  ≤125% of max budget → 0.4
  Over budget          → 0.1

interest_match (15% weight):
  Weighted intersection of deal destination tags with user interest_vector

heritage_match (10% weight):
  Heritage country → 1.0, Heritage region → 0.5, else → 0.0

timing_match (10% weight):
  Preferred month → 1.0, Adjacent month → 0.6, Weekend traveler match → 0.9

deal_quality (10% weight):
  deal_score / 100

relevance = dest×0.30 + price×0.25 + interest×0.15 + heritage×0.10 + timing×0.10 + quality×0.10
```

---

## Part 5: Notification Engine

### 5.1 Channels & Triggers

| Channel | Trigger | Cap |
|---------|---------|-----|
| Push notification | relevance ≥ 0.8 | 3/day |
| In-app deal feed | relevance ≥ 0.3 | Unlimited |
| Daily digest | 9 AM local | 1/day, top 5 deals |
| Price alert | Price ≤ target | Unlimited |
| Weekend special | Friday 5 PM local | 1/week |
| Heritage holiday | 7 days before holiday | 2/year |

### 5.2 Push Templates

```
✈️ FLIGHT: "$420 RT to Douala!" / "Direct from JFK • 45% below average"
🏨 HOTEL: "Hilton San Diego $89/night" / "4-star in your city • 35% off"
🎯 EXPERIENCE: "Douala Food Tour $35" / "Top-rated • Matches your interests"
⏰ PRICE ALERT: "Price dropped to $380!" / "Your JFK→DLA alert triggered"
🏖️ WEEKEND: "Weekend escape from $89" / "Hotels near you this weekend"
```

### 5.3 Throttling Rules

1. Check `user_notification_preferences` (quiet hours, push_enabled)
2. Check `user_travel_dna.notifications_sent_today` < max_daily_notifications
3. Check `user_travel_dna.last_notification_at` > 2 hours ago (minimum gap)
4. Price alerts bypass daily cap (user explicitly requested)
5. Reset `notifications_sent_today` at midnight user's timezone

### 5.4 Integration with Existing System

Uses existing `notifications` table (has `type`, `title`, `body`, `data`, `push_sent` fields) and `user_devices` table (has `push_token`, `push_enabled`). The deal notification dispatcher writes to `notifications` and triggers push via existing Expo push infrastructure.

---

## Part 6: Personalized Explore/Homepage Feed

### 6.1 Current State

The existing `homepage` edge function already:
- Fetches `travel_preferences` and `user_interactions`
- Calculates cold/warm/hot strategy
- Scores destinations using `calculateMatchScore()` (budget, style, interests, season, popularity)
- Generates 12 sections (For You, Deals, Popular, Nearby, Trending, etc.)

**What's missing:**
- No search_sessions behavioral data in scoring
- No heritage/nationality awareness
- No real deal data (deals section uses `curated_destinations` not `deal_cache`)
- No profile data (city, nationality, languages)
- No deal_clicks/saved_deals engagement data

### 6.2 GIL Enhancement Plan

The homepage edge function will be upgraded to use `user_travel_dna` instead of raw queries:

```
CURRENT: homepage reads travel_preferences + user_interactions + curated_destinations
AFTER:   homepage reads user_travel_dna + curated_destinations + user_deal_matches
```

**New/enhanced sections powered by GIL:**

| Section | Current | After GIL |
|---------|---------|-----------|
| For You | Scored by preferences only | Scored by full DNA (heritage, behavior, interests) |
| Hot Deals | From curated_destinations (static) | From user_deal_matches (live, personalized) |
| Heritage Picks | Does not exist | NEW: Destinations in heritage countries |
| Near You | By lat/lng only | By lat/lng + local deals from deal_cache |
| Weekend Escapes | Does not exist | NEW: Local hotel + experience deals |
| Price Drops | Does not exist | NEW: Deals with deal_score ≥ 60 |
| Popular | By popularity_score | Weighted by user's region preferences |
| Trending | By is_trending flag | Boosted if matches user interests |

### 6.3 Explore Page "See Our Deals" Section

This section will show **live deals** from `user_deal_matches`, organized by category:

```
[See Our Deals]
  ├── All Deals (sorted by relevance_score)
  ├── ✈️ Flight Deals
  ├── 🏨 Hotel Deals
  ├── 🎯 Experience Deals
  └── 🚗 Car Deals

Each deal card shows:
  - Deal image
  - Title ("JFK → Douala $420 RT")
  - Badges (["Heritage", "Great Deal", "Direct"])
  - Price + discount % ("$420 • 45% below average")
  - Match reasons ("Heritage destination • Below your budget")
  - CTA: "View Deal →"
```

Users can browse daily/weekly to see fresh personalized deals. The feed refreshes as the scanner discovers new deals.

---

## Part 7: Viator Integration (Experiences)

### 7.1 Viator Partner API

Already approved for Viator Partner Program. Capabilities:
- Search by destination (city, coordinates)
- Search by category (tours, activities, attractions, day trips)
- Availability + pricing in real-time
- Affiliate booking links (8% CPA)
- Product images + reviews

### 7.2 New Adapter: `viator.ts`

```
supabase/functions/_shared/providers/viator.ts

Functions:
  searchExperiences(params) → NormalizedExperience[]
  searchByDestination(city, category?) → NormalizedExperience[]
  getProductDetails(productCode) → ExperienceDetail
  healthCheck() → boolean

Normalized output:
  { id, title, description, imageUrl, price, currency, rating,
    reviewCount, duration, categories, bookingUrl, provider: 'viator' }
```

### 7.3 GIL Experience Scanning

The experience scanner uses Viator to find:
1. **Travel experiences**: Top activities in user's `top_destinations`
2. **Local experiences**: Activities in user's `home_city` (weekend deals)
3. **Heritage experiences**: Cultural tours in heritage countries
4. **Interest-matched**: Activities matching `interest_vector` tags

---

## Part 8: Edge Functions to Build

### 8.1 `compute-travel-dna`
- **Purpose:** Compute/recompute user_travel_dna for one or all users
- **Trigger:** Cron (daily 2 AM) + webhook (on preference update)
- **Input:** `{ user_id?: string }` (omit for batch)
- **Output:** Updated user_travel_dna records

### 8.2 `deal-scanner`
- **Purpose:** Run scan jobs (heritage, explore, popular, hotel, experience)
- **Trigger:** Cron (multiple schedules per scan type)
- **Input:** `{ scan_type: string, batch_size?: number }`
- **Dependencies:** serpapi-flights, serpapi-hotels, serpapi-explore, viator
- **Output:** New entries in deal_cache + price_history + user_deal_matches

### 8.3 `deal-scorer`
- **Purpose:** Score deals from deal_cache against price_history
- **Trigger:** Called by deal-scanner after API results
- **Input:** Deal data + route_key
- **Output:** deal_score + deal_badges

### 8.4 `deal-matcher`
- **Purpose:** Match scored deals to users via user_travel_dna
- **Trigger:** Called by deal-scanner after scoring
- **Input:** Scored deals + all relevant DNA records
- **Output:** user_deal_matches rows

### 8.5 `deal-notifier`
- **Purpose:** Send push notifications for high-relevance matches
- **Trigger:** Cron (every 15 min) + after deal-matcher
- **Input:** Pending notifications from deal_notifications
- **Output:** Push notifications via Expo, notification records

### 8.6 `viator-adapter` (part of provider-manager)
- **Purpose:** Search Viator for experiences
- **Trigger:** User search + deal scanner cron
- **Input:** Destination, dates, categories
- **Output:** Normalized experience results

---

## Part 9: Implementation Plan

### Phase 1: Database Schema (Day 1)
1. Create `user_travel_dna` table + indexes
2. Create `user_deal_matches` table + indexes
3. Create `deal_notifications` table + indexes
4. Create `user_search_patterns` table + indexes
5. Add RLS policies for all new tables

### Phase 2: DNA Computation Engine (Day 2-3)
1. Build static airport lookup (200 cities + heritage mapping)
2. Build `compute-travel-dna` edge function
3. Test with real user data
4. Set up daily cron trigger

### Phase 3: Deal Scanner (Day 3-5)
1. Build `deal-scanner` edge function (route builder + API dispatcher)
2. Build `deal-scorer` (price history comparison + badge assignment)
3. Build `deal-matcher` (DNA-based relevance scoring)
4. Test heritage scanning end-to-end
5. Set up cron schedules

### Phase 4: Viator Adapter (Day 5-6)
1. Build `viator.ts` adapter
2. Wire into provider-manager for user searches
3. Wire into deal-scanner for background scanning
4. Test experience discovery

### Phase 5: Notification Engine (Day 6-7)
1. Build `deal-notifier` edge function
2. Integrate with existing notifications + user_devices tables
3. Implement throttling (quiet hours, daily cap, minimum gap)
4. Test push notification delivery

### Phase 6: Homepage/Explore Integration (Day 7-9)
1. Upgrade homepage edge function to use user_travel_dna
2. Add "See Our Deals" section powered by user_deal_matches
3. Add Heritage Picks, Weekend Escapes, Price Drops sections
4. Build frontend deal feed components
5. Test personalized feed end-to-end

### Phase 7: Amadeus Deprecation (By June 2026)
1. Remove Amadeus from provider-manager flight search
2. Remove AMADEUS_CLIENT_ID/SECRET from Supabase secrets
3. Delete amadeus.ts adapter
4. Update api_providers table

---

## Part 10: Existing Infrastructure Leveraged

| Component | Already Exists | GIL Usage |
|-----------|---------------|-----------|
| `serpapi-flights.ts` | ✅ Built & tested | Heritage/popular/alert scanning |
| `serpapi-hotels.ts` | ✅ Built & tested | Hotel deal scanning |
| `serpapi-explore.ts` | ✅ Built & tested | Cheapest-destination discovery |
| `provider-manager` | ✅ Deployed v32 | Orchestrates all searches |
| `deal_cache` table | ✅ Created | Store scanned deals |
| `price_history` table | ✅ Created | Track price trends |
| `price_alerts` table | ✅ Enhanced | User price monitoring |
| `deal_clicks` table | ✅ Created | Track engagement |
| `saved_deals` table | ✅ Created | Track saves |
| `search_sessions` table | ✅ Populated | Behavioral signals |
| `travel_preferences` table | ✅ Populated | Explicit preferences |
| `profiles` table | ✅ Populated | Identity + heritage |
| `notifications` table | ✅ Exists | Notification delivery |
| `user_devices` table | ✅ Exists | Push token storage |
| `user_notification_preferences` | ✅ Exists | Quiet hours, caps |
| `user_interactions` table | ✅ Exists | Homepage interaction tracking |
| `curated_destinations` table | ✅ Populated | Destination metadata + tags |
| `homepage` edge function | ✅ Deployed | Personalized sections |
| `scheduled-jobs` edge function | ✅ Deployed | Cron scheduling |

**New to build:** 4 tables + 5 edge functions + 1 adapter + homepage upgrade.

---

## Part 11: Success Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Deal feed engagement rate | > 15% CTR | deal_clicks / deal impressions |
| Push notification CTR | > 8% | clicked deals / notifications sent |
| Heritage deal relevance | > 70% score | Avg relevance_score for heritage deals |
| User retention (D7) | > 40% | Users returning within 7 days |
| Price alert conversion | > 20% | Alerts that led to deal clicks |
| Daily active deal viewers | > 30% of MAU | Users viewing deal feed daily |
| Notification opt-out rate | < 5% | Users disabling deal notifications |
| DNA computation time | < 500ms | computation_duration_ms |
| Scanner completion time | < 60s per run | Edge function execution time |

---

## Summary

GIL transforms Guidera from "a travel search app" into "MY travel app." Every user gets:

1. **A DNA profile** that deeply understands their travel identity
2. **Proactive deal discovery** scanning routes they care about
3. **Heritage-aware scanning** connecting them to their cultural roots
4. **Local deals** making the app useful even when not planning trips
5. **Smart notifications** that feel helpful, not spammy
6. **A personalized explore feed** that improves with every interaction

The engine is built on infrastructure that **already exists** (SerpAPI adapters, deal tables, notification system, preferences, profiles). We're adding 4 new tables, 5 edge functions, and 1 adapter to unlock the full potential of data we already capture.
