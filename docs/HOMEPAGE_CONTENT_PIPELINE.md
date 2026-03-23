# Homepage Content Pipeline — Architecture & Implementation Plan

> **Status:** In Progress
> **Created:** March 23, 2026
> **Last Updated:** March 23, 2026

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Current State](#current-state)
3. [Target Architecture](#target-architecture)
4. [Available API Infrastructure](#available-api-infrastructure)
5. [Section Independence Model](#section-independence-model)
6. [Phase 1 — Fix the Fuel](#phase-1--fix-the-fuel)
7. [Phase 2 — Per-Section Data Pipelines](#phase-2--per-section-data-pipelines)
8. [Phase 3 — AI Classification Layer](#phase-3--ai-classification-layer)
9. [Phase 4 — Scale the Catalog](#phase-4--scale-the-catalog)
10. [Phase 5 — Personalization](#phase-5--personalization)
11. [Progress Tracker](#progress-tracker)

---

## Problem Statement

The homepage Explore tab shows **identical, static content for every user**. Despite having a personalization engine, scoring algorithm, and 6 integrated APIs, the sections (Popular Destinations, Trending, Editor's Choice, etc.) display the same 58 curated destinations in the same order for everyone.

**Root causes identified:**
- `user_interactions` table has **0 rows** — no tracking data exists
- `travel_preferences` has **1 row** across 10 users — onboarding doesn't persist
- All users permanently stuck in **cold start** (requires 3+ interactions for warm start)
- Single monolithic edge function scores all 58 destinations identically without user-specific inputs
- No external API data feeds into homepage sections (APIs only used for search/booking)
- Fallback path returns pure `popularity_score` ORDER BY — zero personalization

**What we're building:**
A content pipeline where each homepage section is an **independent product** with its own data source, ranking logic, and cache — so one section breaking never affects the others.

---

## Current State

### Database

| Table | Rows | Role |
|-------|------|------|
| `curated_destinations` | 58 | All homepage content comes from here |
| `destination_ai_enrichment` | 29 | AI-generated detail enrichment (exists, partially populated) |
| `user_interactions` | 0 | Should track views, saves, clicks — completely empty |
| `travel_preferences` | 1 | Only 1 of 10 users has saved preferences |
| `user_saved_items` | 0 | No saved items tracked |
| `deal_cache` | 155 | Deals section works independently (GIL engine) |

### Homepage Data Flow (Current)

```
User opens app
  → useHomepage hook fires
    → homepageService.getHomepage()
      → Calls `homepage` edge function
        → Fetches ALL 58 curated_destinations
        → Scores each with calculateMatchScore() (identical for all users)
        → Slices into sections by DB field filters
        → Returns all sections in one response
      → On failure: fallback to direct DB query (even more static)
    → HomepageDataContext stores sections
      → Each section component finds its data by slug match
        → Renders cards
```

### Existing Section Components (All Working, All Data-Driven)

| Section | Component | Slug | Data Source |
|---------|-----------|------|-------------|
| Popular Destinations | `StackedDestinationCards` | `popular-destinations` | HomepageDataContext |
| Popular Places | `PlacesSection` | `places` | HomepageDataContext |
| Trending | `TrendingSection` | `trending` | HomepageDataContext |
| Editor's Choice | `EditorChoicesSection` | `editors-choice` | HomepageDataContext |
| Must See | `MustSeeSection` | `must-see` | HomepageDataContext |
| Budget Friendly | `BudgetFriendlySection` | `budget-friendly` | HomepageDataContext |
| Luxury Escapes | `LuxuryEscapesSection` | `luxury-escapes` | HomepageDataContext |
| Family Friendly | `FamilyFriendlySection` | `family-friendly` | HomepageDataContext |
| Hidden Gems | `BestDiscoverSection` | `hidden-gems` | HomepageDataContext |
| Deals | `DealsSection` | N/A | **Independent** — `useGilDeals` hook |
| Local Experiences | `LocalExperiencesSection` | N/A | **Independent** — `useLocalExperiences` + Viator API |

**Key insight:** Deals and Local Experiences are already independent with their own data pipelines. The other 9 sections all share one monolithic data fetch.

---

## Target Architecture

```
┌─────────────────────────────────────────────────────┐
│                   DISCOVERY LAYER                    │
│  Google Places · Amadeus · Viator · SerpAPI · DB     │
│  (Find candidate destinations and attractions)       │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                  ENRICHMENT LAYER                    │
│  Photos · Ratings · Reviews · Hours · Pricing · Geo  │
│  (Decorate each place with useful travel details)    │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                CLASSIFICATION LAYER                  │
│  Gemini AI · Rule Engine · Editorial Overrides       │
│  (Tag: popular, trending, must-see, budget, luxury)  │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                 STORAGE & CACHE                      │
│  curated_destinations · section_cache · TTL          │
│  (Pre-computed, fast to serve, no API calls at read) │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                PRESENTATION LAYER                    │
│  Per-section hooks · Pagination · Personalization    │
│  (Each section fetches independently from cache)     │
└─────────────────────────────────────────────────────┘
```

---

## Available API Infrastructure

All keys are configured as Supabase Edge Function secrets.

| Provider | Key Variable | Currently Used For | Homepage Potential |
|----------|-------------|-------------------|-------------------|
| **Amadeus** | `AMADEUS_CLIENT_ID` / `AMADEUS_CLIENT_SECRET` | Flight search | Destination Experiences API (tours, activities, city search) |
| **Viator** | `VIATOR_API_KEY` | Local Experiences section | Expand to Must-See activities, experience counts |
| **SerpAPI** | `SERPAPI_KEY` | Google Flights/Hotels, deal discovery | Google Travel Explore for trending signals |
| **RapidAPI** | `RAPIDAPI_KEY` | Kiwi flights, Booking.com hotels/cars/experiences | Booking.com attraction data, hotel pricing for budget tags |
| **Google Places** | `GOOGLE_PLACES_API_KEY` | Destination detail POIs | Popularity data, photo URLs, nearby search |
| **Gemini** | `GEMINI_API_KEY` | AI generation (itineraries, safety, packing) | Classification, summarization, tagging |

---

## Section Independence Model

Each section becomes a self-contained unit with its own data pipeline. If one section's API fails, other sections continue working.

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Popular Dests   │   │ Trending        │   │ Editor's Choice │
│ ─────────────── │   │ ─────────────── │   │ ─────────────── │
│ Source: DB +    │   │ Source: SerpAPI │   │ Source: DB      │
│   Google Places │   │   + time-decay  │   │   (curated)     │
│ Cache: 24h      │   │ Cache: 6h       │   │ Cache: 24h      │
│ Fallback: DB    │   │ Fallback: DB    │   │ Fallback: DB    │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                      │
         ▼                     ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│                     section_cache table                       │
│  section_slug | data (JSONB) | expires_at | updated_at       │
└──────────────────────────────────────────────────────────────┘
         │                     │                      │
         ▼                     ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ StackedDest     │   │ TrendingSection │   │ EditorChoices   │
│ Cards (UI)      │   │ (UI)            │   │ Section (UI)    │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

### Section Pipeline Definitions

| Section | Primary Source | Enrichment | Ranking Logic | Cache TTL | Fallback |
|---------|---------------|------------|---------------|-----------|----------|
| **Popular Destinations** | `curated_destinations` + Google Places | Photos, review count | `popularity_score` + review volume + seasonal boost | 24h | DB `ORDER BY popularity_score` |
| **Popular Places** | Google Places Nearby | Ratings, photos | Rating * review count | 12h | DB popular category |
| **Trending** | SerpAPI Explore + search velocity | Price trends, images | Time-decay score + search growth rate | 6h | DB `is_trending = true` |
| **Editor's Choice** | Manual curation in DB | AI-generated descriptions | `editor_rating` (hand-picked, not algorithmic) | 24h | DB `is_featured = true` |
| **Must See** | Amadeus Destination Experiences + DB | Activity details, photos | Activity density + rating + iconic status | 24h | DB `is_featured = true` |
| **Budget Friendly** | Viator/Booking price data + DB | Real pricing, savings % | Lowest daily cost + value rating | 12h | DB `budget_level <= 2` |
| **Luxury Escapes** | Booking.com premium + DB | Premium amenities, photos | Price band + exclusivity + rating | 24h | DB `budget_level >= 4` |
| **Family Friendly** | Google Places + DB | Kid-friendly tags, safety | Safety rating + family activity count | 24h | DB `best_for @> families` |
| **Hidden Gems** | AI classification + low-popularity DB | Off-beaten descriptions | Low popularity + high rating + unique tags | 24h | DB `primary_category = off_beaten_path` |
| **Deals** | **Already independent** — GIL deal-scanner | Price history, badges | Match score + savings % | Real-time | `deal_cache` table |
| **Local Experiences** | **Already independent** — Viator API | Live pricing, reviews | Location proximity + rating | 1h | Viator fallback cities |

---

## Phase 1 — Fix the Fuel

> **Goal:** Make personalization possible with the existing 58 destinations
> **Effort:** 1-2 days
> **Priority:** CRITICAL — everything else depends on this

### 1.1 Fix Interaction Tracking

**Problem:** `user_interactions` table has 0 rows. The `trackInteraction` function exists in the hooks but data never reaches the DB.

**Investigation needed:**
- [ ] Trace `trackInteraction` in `useHomepage.ts` → does it call `homepageService.trackInteraction()`?
- [ ] Check if `homepageService.trackInteraction()` sends to edge function or direct DB insert
- [ ] Verify RLS policies on `user_interactions` — likely blocking inserts (Clerk auth ≠ Supabase auth)
- [ ] Check if the tracking call is actually invoked from section components on card press/view

**Fix approach:**
- [ ] Ensure `trackInteraction` is called on: card view (impression), card tap (click), save/unsave, detail page view
- [ ] Fix RLS or use service role for inserts
- [ ] Verify data flows to `user_interactions` table
- [ ] Test with real user actions

### 1.2 Fix Travel Preferences Persistence

**Problem:** Only 1 of 10 users has a row in `travel_preferences`. Onboarding may not be persisting.

**Investigation needed:**
- [ ] Trace onboarding setup flow (`src/app/(onboarding)/setup.tsx`) — does it write to `travel_preferences`?
- [ ] Check if the Supabase insert uses the correct user ID format (Clerk ID vs profile UUID)
- [ ] Verify RLS policies on `travel_preferences`
- [ ] Check if skipping onboarding creates a default preferences row

**Fix approach:**
- [ ] Ensure onboarding always saves preferences (even defaults for skipped screens)
- [ ] Fix any auth/RLS issues blocking the insert
- [ ] Add a migration path for existing users without preferences
- [ ] Test end-to-end: new signup → onboarding → verify row in DB

### 1.3 Verify Cold → Warm → Hot Transitions

**After 1.1 and 1.2 are fixed:**
- [ ] Confirm that 3+ interactions trigger `warm` strategy in the edge function
- [ ] Confirm that 20+ interactions trigger `hot` strategy
- [ ] Verify the "For You" section appears for warm/hot users
- [ ] Check that personalized scoring produces different results for different user profiles

### Phase 1 Completion Criteria
- [ ] `user_interactions` rows appear after user actions
- [ ] All new users have `travel_preferences` after onboarding
- [ ] Homepage content visibly changes after a user interacts with 3+ destinations
- [ ] "For You" section appears for warm users

---

## Phase 2 — Per-Section Data Pipelines

> **Goal:** Each section has its own data source, API integration, and cache
> **Effort:** 1-2 weeks
> **Priority:** HIGH

### 2.0 Create section_cache Infrastructure

**New DB table:**
```sql
CREATE TABLE section_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_slug TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '[]',
  item_count INTEGER DEFAULT 0,
  source TEXT NOT NULL,            -- 'google_places', 'serpapi', 'amadeus', 'viator', 'db', 'mixed'
  strategy TEXT DEFAULT 'default', -- 'global', 'location_aware', 'personalized'
  expires_at TIMESTAMPTZ NOT NULL,
  last_refresh_at TIMESTAMPTZ DEFAULT NOW(),
  refresh_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**New edge function: `section-refresh`**
- Takes `section_slug` as parameter
- Runs the appropriate pipeline for that section
- Writes result to `section_cache`
- Can be called by cron or on-demand

**Modified homepage flow:**
```
Frontend request
  → Check section_cache for each section
    → If fresh: return cached data
    → If expired: trigger background refresh, return stale data
    → If missing: run pipeline synchronously, cache result
```

- [ ] Create `section_cache` migration
- [ ] Create `section-refresh` edge function skeleton
- [ ] Modify `homepageService.ts` to read from `section_cache`
- [ ] Add RLS policies for `section_cache` (public read, service-role write)

### 2.1 Popular Destinations Pipeline

**Data sources:** `curated_destinations` + Google Places popularity signals
**API:** Google Places API (Nearby Search / Place Details)
**Ranking:** `popularity_score` + Google `user_ratings_total` + seasonal boost
**Cache TTL:** 24 hours

Implementation:
- [ ] Create section generator: `generatePopularDestinations()`
- [ ] Enrich top destinations with Google Places `user_ratings_total`
- [ ] Store ranked list in `section_cache` with slug `popular-destinations`
- [ ] Frontend reads from cache instead of monolithic edge function
- [ ] Fallback: current DB query `ORDER BY popularity_score DESC`

### 2.2 Trending Section Pipeline

**Data sources:** SerpAPI Google Travel Explore + DB `is_trending` flag + time-decay
**API:** SerpAPI (`SERPAPI_KEY`) — Google Travel Explore endpoint
**Ranking:** Search growth velocity + recency + price attractiveness
**Cache TTL:** 6 hours (trends change faster)

Implementation:
- [ ] Create section generator: `generateTrending()`
- [ ] Call SerpAPI Explore for cheapest/most-searched destinations
- [ ] Cross-reference with `curated_destinations` for matches
- [ ] Apply time-decay scoring (recent trending > old trending)
- [ ] Store in `section_cache` with slug `trending`
- [ ] Fallback: DB `WHERE is_trending = true ORDER BY popularity_score DESC`

### 2.3 Editor's Choice Pipeline

**Data source:** `curated_destinations` WHERE `is_featured = true` (hand-curated)
**API:** None — this section is intentionally editorial
**Ranking:** `editor_rating` DESC (human-determined quality)
**Cache TTL:** 24 hours

Implementation:
- [ ] Create section generator: `generateEditorsChoice()`
- [ ] Query `curated_destinations` with `is_featured = true`
- [ ] Optionally enrich with AI-generated "reason" via Gemini
- [ ] Store in `section_cache` with slug `editors-choice`
- [ ] Fallback: same DB query (this section IS the DB query)

### 2.4 Must See Pipeline

**Data sources:** `curated_destinations` + Amadeus Destination Experiences
**API:** Amadeus Tours & Activities API
**Ranking:** Iconic status + activity density + rating
**Cache TTL:** 24 hours

Implementation:
- [ ] Create section generator: `generateMustSee()`
- [ ] For each featured destination, call Amadeus `/shopping/activities` to get top activities
- [ ] Score by: activity count * avg rating * iconic factor
- [ ] Store in `section_cache` with slug `must-see`
- [ ] Fallback: DB `WHERE is_featured = true ORDER BY editor_rating DESC`

### 2.5 Budget Friendly Pipeline

**Data sources:** `curated_destinations` budget data + Viator/Booking price signals
**API:** Viator (activity pricing) + Booking.com via RapidAPI (hotel pricing)
**Ranking:** Lowest estimated daily cost + value-for-money rating
**Cache TTL:** 12 hours (prices change)

Implementation:
- [ ] Create section generator: `generateBudgetFriendly()`
- [ ] Query destinations with `budget_level <= 2`
- [ ] Enrich with real pricing from Viator (cheapest activities) and Booking.com (cheapest hotels)
- [ ] Calculate true daily cost estimate
- [ ] Store in `section_cache` with slug `budget-friendly`
- [ ] Fallback: DB `WHERE budget_level <= 2 ORDER BY estimated_daily_budget_usd ASC`

### 2.6 Luxury Escapes Pipeline

**Data sources:** `curated_destinations` + Booking.com premium listings
**API:** Booking.com via RapidAPI (luxury filters)
**Ranking:** Premium experience quality + exclusivity + rating
**Cache TTL:** 24 hours

Implementation:
- [ ] Create section generator: `generateLuxuryEscapes()`
- [ ] Query destinations with `budget_level >= 4`
- [ ] Enrich with premium hotel/experience data from Booking.com
- [ ] Store in `section_cache` with slug `luxury-escapes`
- [ ] Fallback: DB `WHERE budget_level >= 4 ORDER BY editor_rating DESC`

### 2.7 Family Friendly Pipeline

**Data sources:** `curated_destinations` + Google Places (kid-friendly POIs)
**API:** Google Places API (search for family-friendly activities)
**Ranking:** Safety rating + family activity count + accessibility
**Cache TTL:** 24 hours

Implementation:
- [ ] Create section generator: `generateFamilyFriendly()`
- [ ] Query destinations with `best_for @> '{families}'`
- [ ] Enrich with Google Places family-friendly POI count per destination
- [ ] Store in `section_cache` with slug `family-friendly`
- [ ] Fallback: DB `WHERE best_for @> '{families}' ORDER BY safety_rating DESC`

### 2.8 Hidden Gems / Best Discover Pipeline

**Data sources:** AI classification + low-popularity high-rating destinations
**API:** Gemini for classification + Google Places for validation
**Ranking:** High rating + low popularity (inverse popularity = hidden)
**Cache TTL:** 24 hours

Implementation:
- [ ] Create section generator: `generateHiddenGems()`
- [ ] Query destinations with `primary_category = 'off_beaten_path'`
- [ ] Also find high-rated but low-popularity destinations (rating > 4.5, popularity < 500)
- [ ] Use Gemini to validate "hidden gem" classification
- [ ] Store in `section_cache` with slug `hidden-gems`
- [ ] Fallback: DB `WHERE primary_category = 'off_beaten_path'`

### 2.9 Deals & Local Experiences (Already Independent)

**Deals:** Already powered by GIL deal-scanner → `deal_cache` → `user_deal_matches`. No changes needed.

**Local Experiences:** Already powered by Viator API via `useLocalExperiences` hook. No changes needed.

- [ ] Verify Deals section continues working independently
- [ ] Verify Local Experiences section continues working independently

### Phase 2 Completion Criteria
- [ ] `section_cache` table exists and is populated
- [ ] Each section reads from its own cache entry
- [ ] One section's API failure doesn't affect other sections
- [ ] View All pages use cursor-based pagination from `section_cache` or direct queries
- [ ] Cache refresh runs on schedule (cron) and on-demand

---

## Phase 3 — AI Classification Layer

> **Goal:** Gemini auto-tags destinations into sections with confidence scores
> **Effort:** 3-5 days
> **Priority:** MEDIUM (after Phase 2 establishes pipelines)

### 3.1 Classification Edge Function

**New edge function: `classify-destination`**

Input:
```json
{
  "destination": {
    "title": "Bali - Island of Gods",
    "city": "Bali",
    "country": "Indonesia",
    "primary_category": "popular",
    "tags": ["temples", "yoga", "surf", "beach"],
    "travel_style": ["relaxer", "wellness"],
    "budget_level": 2,
    "editor_rating": 4.7,
    "popularity_score": 870,
    "safety_rating": 4,
    "best_for": ["couples", "solo", "friends"],
    "seasons": ["spring", "summer"]
  }
}
```

Output:
```json
{
  "section_tags": ["popular", "budget-friendly", "must-see", "hidden-gems"],
  "confidence_scores": {
    "popular": 0.95,
    "budget-friendly": 0.88,
    "must-see": 0.72,
    "hidden-gems": 0.15
  },
  "generated_description": "A spiritual island paradise...",
  "budget_estimate_usd": "$45-80/day",
  "best_time_summary": "April to October for dry season",
  "family_suitability": 0.65,
  "luxury_suitability": 0.40,
  "adventure_suitability": 0.80
}
```

Implementation:
- [ ] Create `classify-destination` edge function using Gemini API
- [ ] Design prompt that outputs structured JSON with section tags and scores
- [ ] Store results in `destination_ai_enrichment` table (already exists, 29 rows)
- [ ] Run classification on all 58 existing destinations
- [ ] Integrate classification output into section generators (Phase 2 pipelines)

### 3.2 Classification Prompt Design

The AI acts as a **classifier and copywriter**, not a data source:
- [ ] Design system prompt for travel destination classification
- [ ] Include section definitions and scoring rubrics in prompt
- [ ] Test with 10 diverse destinations for quality
- [ ] Add confidence threshold (only assign section if confidence > 0.6)
- [ ] Handle edge cases (destinations that fit multiple or no sections)

### 3.3 Batch Classification Job

- [ ] Create edge function or cron job to classify all new/updated destinations
- [ ] Run on: new destination added, destination fields updated, weekly refresh
- [ ] Store classification results with timestamp for staleness detection

### Phase 3 Completion Criteria
- [ ] All destinations have AI classification tags with confidence scores
- [ ] Section generators use AI tags as an input signal alongside DB fields
- [ ] Generated descriptions appear on cards where editorial descriptions are missing
- [ ] Classification runs automatically when catalog changes

---

## Phase 4 — Scale the Catalog

> **Goal:** Expand from 58 to 500+ destinations via automated discovery
> **Effort:** Ongoing (1-2 weeks for initial expansion)
> **Priority:** MEDIUM (after sections are working independently)

### 4.1 Destination Discovery Pipeline

**New edge function: `discover-destinations`**

Sources:
- Google Places: Search for top destinations by continent/country
- Amadeus: City search + popular destinations
- SerpAPI: Google Travel trending destinations

Implementation:
- [ ] Create `discover-destinations` edge function
- [ ] For each continent, discover top 50 cities via Google Places
- [ ] Cross-reference with Amadeus for activity availability
- [ ] Normalize results into `curated_destinations` schema
- [ ] De-duplicate against existing catalog
- [ ] Auto-classify new destinations (Phase 3 pipeline)
- [ ] Flag for editorial review before publishing (`status = 'draft'`)

### 4.2 Enrichment Pipeline

For each new destination:
- [ ] Fetch hero image from Google Places or Unsplash
- [ ] Fetch gallery images (3-5 per destination)
- [ ] Get ratings and review counts from Google Places
- [ ] Get activity counts from Amadeus/Viator
- [ ] Calculate budget estimates from real pricing data
- [ ] Generate descriptions via Gemini
- [ ] Determine safety rating from available signals

### 4.3 Cursor-Based Pagination for View All

- [ ] Replace `useSectionDestinations` limit(50) with cursor pagination
- [ ] Implement `after` cursor parameter in section queries
- [ ] Frontend: infinite scroll with `onEndReached` + cursor
- [ ] Target: 20 items per page, smooth loading states

### 4.4 Content Freshness

- [ ] Weekly cron job to re-enrich existing destinations (rating changes, new photos)
- [ ] Monthly discovery job to find new trending destinations
- [ ] Staleness detection: flag destinations not refreshed in 30+ days
- [ ] Editorial queue for new discoveries needing review

### Phase 4 Completion Criteria
- [ ] Catalog has 200+ published destinations across all continents
- [ ] Each section has 20+ unique items (not the same destinations everywhere)
- [ ] View All pages support infinite scroll
- [ ] Automated enrichment keeps data fresh

---

## Phase 5 — Personalization

> **Goal:** Each user sees a unique homepage based on their preferences and behavior
> **Effort:** 1-2 weeks (after Phases 1-4)
> **Priority:** MEDIUM-HIGH (the ultimate goal)

### 5.1 "For You" Section

With interactions flowing (Phase 1) and a large catalog (Phase 4):
- [ ] "For You" section uses warm/hot personalization strategies
- [ ] Scoring weights shift based on user profile (budget traveler sees budget-friendly first)
- [ ] `matchReasons` populated with explainable reasons ("Because you saved Bali")
- [ ] Section appears only for users with 3+ interactions

### 5.2 Location-Aware Boosting

- [ ] Nearby destinations get ranking boost (user location → regional relevance)
- [ ] Saved/viewed regions get ranking boost
- [ ] Seasonal destinations boost when timing fits
- [ ] Global iconic places remain available regardless of location

### 5.3 Behavioral Personalization

- [ ] Viewed destinations → "similar to what you viewed" signals
- [ ] Saved destinations → strong interest signal for similar content
- [ ] Dismissed destinations → negative signal (rank lower)
- [ ] Booking history → strongest signal (show similar to what they booked)

### 5.4 Section Order Personalization

- [ ] If user primarily saves budget destinations → Budget Friendly moves up in section order
- [ ] If user interacts with luxury → Luxury Escapes moves up
- [ ] Dynamic section ordering based on user segment

### Phase 5 Completion Criteria
- [ ] Two different users see noticeably different homepage content
- [ ] "For You" section shows relevant, personalized recommendations
- [ ] Section order adapts to user behavior
- [ ] Match reasons explain why a destination was recommended

---

## Progress Tracker

### Phase 1 — Fix the Fuel
| Task | Status | Date |
|------|--------|------|
| 1.1 Investigate interaction tracking | Not Started | |
| 1.1 Fix RLS / auth for user_interactions | Not Started | |
| 1.1 Verify tracking calls fire on user actions | Not Started | |
| 1.2 Investigate onboarding preferences persistence | Not Started | |
| 1.2 Fix travel_preferences insert | Not Started | |
| 1.2 Add default preferences for skipped onboarding | Not Started | |
| 1.3 Verify cold → warm → hot transitions | Not Started | |
| 1.3 Verify "For You" section appears for warm users | Not Started | |

### Phase 2 — Per-Section Data Pipelines
| Task | Status | Date |
|------|--------|------|
| 2.0 Create section_cache table | Not Started | |
| 2.0 Create section-refresh edge function | Not Started | |
| 2.0 Modify homepageService to read from cache | Not Started | |
| 2.1 Popular Destinations pipeline | Not Started | |
| 2.2 Trending pipeline | Not Started | |
| 2.3 Editor's Choice pipeline | Not Started | |
| 2.4 Must See pipeline | Not Started | |
| 2.5 Budget Friendly pipeline | Not Started | |
| 2.6 Luxury Escapes pipeline | Not Started | |
| 2.7 Family Friendly pipeline | Not Started | |
| 2.8 Hidden Gems pipeline | Not Started | |
| 2.9 Verify Deals + Local Experiences independence | Not Started | |

### Phase 3 — AI Classification Layer
| Task | Status | Date |
|------|--------|------|
| 3.1 Create classify-destination edge function | Not Started | |
| 3.2 Design and test classification prompt | Not Started | |
| 3.3 Run batch classification on all destinations | Not Started | |
| 3.3 Integrate classification into section generators | Not Started | |

### Phase 4 — Scale the Catalog
| Task | Status | Date |
|------|--------|------|
| 4.1 Create discover-destinations edge function | Not Started | |
| 4.2 Build enrichment pipeline | Not Started | |
| 4.3 Implement cursor-based pagination | Not Started | |
| 4.4 Set up freshness cron jobs | Not Started | |

### Phase 5 — Personalization
| Task | Status | Date |
|------|--------|------|
| 5.1 Activate "For You" section | Not Started | |
| 5.2 Location-aware boosting | Not Started | |
| 5.3 Behavioral personalization | Not Started | |
| 5.4 Section order personalization | Not Started | |

---

## Key Files Reference

| File | Role |
|------|------|
| `supabase/functions/homepage/index.ts` | Current monolithic homepage edge function |
| `src/features/homepage/services/homepageService.ts` | Frontend service (fetches + fallback) |
| `src/features/homepage/hooks/useHomepage.ts` | Data fetching hook |
| `src/features/homepage/context/HomepageDataContext.tsx` | Context provider for section data |
| `src/config/sections.config.ts` | Static section metadata config |
| `src/components/features/home/SectionRenderer.tsx` | Dynamic section component renderer |
| `src/components/features/home/sections/*.tsx` | Individual section components |
| `src/hooks/useSectionDestinations.ts` | View All page data hook |
| `src/components/common/SectionViewAll.tsx` | Universal View All screen |
| `src/app/destinations/[id].tsx` | Destination detail page |
| `supabase/functions/_shared/providers/*.ts` | API provider adapters |
| `src/config/api.config.ts` | API endpoint configuration |

---

## Cost Considerations

| API | Free Tier | Estimated Monthly Usage | Est. Cost |
|-----|-----------|------------------------|-----------|
| Google Places | $200/mo credit | ~5K requests (enrichment + refresh) | Free (within credit) |
| Amadeus | Free (test env) | ~2K requests (must-see activities) | Free (test) / TBD (production) |
| SerpAPI | 100 searches/mo free | ~500 searches (trending refresh) | ~$50/mo |
| Viator | Free (partner API) | ~3K requests (pricing + local exp) | Free |
| RapidAPI / Booking.com | Varies by plan | ~2K requests (hotel/experience pricing) | ~$30-50/mo |
| Gemini | Free tier available | ~500 classifications/mo | Free (within limits) |

**Note:** All heavy API calls happen during background refresh jobs, NOT during user page loads. User requests read from `section_cache` only.
