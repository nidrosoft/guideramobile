# Homepage Content Pipeline — Architecture & Implementation Plan

> **Status:** Phase 5 Complete ✅ — 201 destinations, all classified, 11 sections live, personalization active
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
| `user_interactions` | 0 → tracking enabled | FK fixed (`auth.users` → `profiles`), TrackableCard integrated in 8 sections |
| `travel_preferences` | 1 → 10 | FK fixed + backfilled — all 10 users now have rows |
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

## Phase 3 — AI Classification Layer ✅

> **Goal:** Gemini auto-tags destinations into sections with confidence scores
> **Status:** COMPLETE
> **Completed:** March 23, 2026

### 3.1 Classification Edge Function (`classify-destination` v1)

**Deployed edge function** that calls Gemini 2.0 Flash to classify each destination into homepage sections.

- Supports `mode: 'single'` (one destination) and `mode: 'batch'` (all published)
- `force: true` re-classifies even already-classified destinations
- Rate-limited at 500ms between API calls to avoid Gemini rate limits
- Stores results in `destination_ai_enrichment` table

Classification output per destination:
```json
{
  "section_tags": ["popular-destinations", "budget-friendly", "must-see", "adventure"],
  "confidence_scores": { "popular-destinations": 0.95, "budget-friendly": 0.88, ... },
  "generated_description": "A spiritual island paradise blending ancient temples...",
  "budget_estimate_usd": "$45-80/day",
  "best_time_summary": "April to October for dry season",
  "family_suitability": 0.65,
  "luxury_suitability": 0.40,
  "adventure_suitability": 0.80
}
```

### 3.2 Batch Classification Results

- **58/58** curated destinations classified successfully
- Classification data stored in `destination_ai_enrichment` with `classified_at` timestamp
- Section tags cover all 11 homepage sections: `popular-destinations`, `places`, `trending`, `editors-choice`, `must-see`, `budget-friendly`, `luxury-escapes`, `family-friendly`, `hidden-gems`, `adventure`, `beach-islands`

### 3.3 AI Integration into Section Generators (`section-refresh` v2)

The `section-refresh` edge function was upgraded to use AI classification as the **primary signal**:

1. **Data fetch:** Joins `curated_destinations` with `destination_ai_enrichment` on destination_id
2. **Merge:** Each destination gets `_ai` (full enrichment) and `_aiTags` (section_tags array)
3. **Filtering:** Each generator first filters by AI `section_tags` containing the section slug
4. **Ranking:** AI confidence score + suitability ratings used as primary sort key
5. **Fallback:** If AI data missing, falls back to existing DB heuristics (editor_rating, popularity_score, etc.)
6. **Descriptions:** AI-generated descriptions used as subtitle fallback when editorial descriptions are absent
7. **Cache metadata:** Source marked as `'ai+db'`, strategy as `'ai_classification'`

Cache stats after AI-powered refresh:
| Section | Items | Source |
|---------|-------|--------|
| popular-destinations | 12 | ai+db |
| editors-choice | 12 | ai+db |
| trending | 10 | ai+db |
| must-see | 10 | ai+db |
| budget-friendly | 10 | ai+db |
| luxury-escapes | 10 | ai+db |
| family-friendly | 10 | ai+db |
| hidden-gems | 10 | ai+db |
| adventure | 10 | ai+db |
| beach-islands | 10 | ai+db |
| places | 10 | ai+db |

### 3.4 Scheduled Classification Job (`scheduled-jobs` v21)

Added `classify_new_destinations` job type to the `scheduled-jobs` edge function:
- Invokes `classify-destination` with `mode: 'batch', force: false`
- Skips already-classified destinations (only processes new ones)
- Runs as part of the `'all'` default cron cycle
- Runs **before** `refreshSectionCache` so new classifications feed into next cache refresh

### Phase 3 Completion Criteria
- [x] All 58 destinations have AI classification tags with confidence scores
- [x] Section generators use AI tags as primary signal alongside DB fields
- [x] Generated descriptions appear on cards where editorial descriptions are missing
- [x] Classification runs automatically for new/updated destinations via scheduled-jobs

---

## Phase 4 — Scale the Catalog ✅

> **Goal:** Expand from 58 to 200+ destinations via automated AI discovery
> **Status:** COMPLETE — 201 published destinations, all classified, all sections populated
> **Completed:** Mar 23, 2026

### 4.1 Destination Discovery Pipeline ✅

**Edge function: `discover-destinations` (v3 — Multi-Model Fallback)**

AI-powered discovery using a 4-provider fallback chain:
1. **Gemini 2.0 Flash** (primary) — Google AI, JSON mode
2. **Claude Sonnet** (fallback 1) — Anthropic
3. **GPT-4o** (fallback 2) — OpenAI, JSON object mode
4. **Grok** (fallback 3) — xAI

Implementation (all complete):
- [x] Create `discover-destinations` edge function with multi-model fallback
- [x] Continent-based discovery with sub-region targeting
- [x] Structured JSON prompts with 19 field validation rules
- [x] Chunked batch generation (max 8 per API call) to avoid rate limits
- [x] Robust JSON parsing with cleanup and fallback extraction
- [x] De-duplicate by city+country and slug against existing catalog
- [x] Auto-classify new destinations via `classify-destination` pipeline
- [x] Auto-refresh section caches after insertion
- [x] Three discovery modes: `continent`, `batch`, `gaps`
- [x] Provider tracking in metadata (`generated_by` field)

Discovery modes:
- `batch` — Run discovery across all 6 continents
- `continent` — Target a specific continent
- `gaps` — Fill under-represented continents to reach target counts

### 4.2 Catalog Expansion Results ✅

| Continent | Total | AI-Discovered | Target |
|-----------|-------|---------------|--------|
| Europe | 54 | 32 | 30 |
| North America | 40 | 32 | 25 |
| Asia | 36 | 21 | 30 |
| South America | 30 | 26 | 20 |
| Africa | 26 | 20 | 25 |
| Oceania | 15 | 12 | 15 |
| **Total** | **201** | **143** | **145** |

### 4.3 Automated Expansion via Scheduled Jobs ✅

- [x] `discover_destinations` job added to `scheduled-jobs` (uses `gaps` mode)
- [x] `classify_new_destinations` job runs after discovery
- [x] `section_refresh_all` job re-seeds caches after classification
- [x] Full pipeline: discover → classify → refresh (automated)

### 4.4 Content Freshness (Future)

- [ ] Weekly cron job to re-enrich existing destinations (rating changes, new photos)
- [ ] Staleness detection: flag destinations not refreshed in 30+ days
- [ ] Gallery image enrichment from Unsplash/Google Places

### 4.5 Cursor-Based Pagination (Future)

- [ ] Replace `useSectionDestinations` limit(50) with cursor pagination
- [ ] Implement `after` cursor parameter in section queries
- [ ] Frontend: infinite scroll with `onEndReached` + cursor

### Phase 4 Completion Criteria
- [x] Catalog has 200+ published destinations across all continents (201 ✅)
- [x] All destinations AI-classified with section tags (201/201 ✅)
- [x] Each section has 10+ unique items from expanded catalog (11 sections refreshed ✅)
- [x] Multi-model fallback ensures robust content generation (4 providers ✅)
- [x] Automated discovery added to scheduled jobs for ongoing expansion ✅
- [ ] View All pages support infinite scroll (Phase 4.5, future)
- [ ] Gallery enrichment and content freshness (Phase 4.4, future)

---

## Phase 5 — Personalization

> **Goal:** Each user sees a unique homepage based on their preferences and behavior
> **Effort:** 1-2 weeks (after Phases 1-4)
> **Priority:** MEDIUM-HIGH (the ultimate goal)

### 5.1 "For You" Section ✅

With interactions flowing (Phase 1) and a large catalog (Phase 4):
- [x] "For You" section uses warm/hot personalization strategies
- [x] Scoring weights shift based on user profile (budget traveler sees budget-friendly first)
- [x] `matchReasons` populated with explainable reasons ("Matches your interest in art & nightlife", "You love exploring Europe")
- [x] Section appears only for users with 3+ interactions (cold start excluded)

### 5.2 Location-Aware Boosting ✅

- [x] Nearby destinations get ranking boost (haversine distance: <500km=10pts, <1500km=7pts, <3000km=4pts)
- [x] Saved/viewed regions get ranking boost (continent affinity from interaction patterns)
- [x] Seasonal destinations boost when timing fits (current season=10pts, adjacent=6pts)
- [x] Global iconic places remain available regardless of location (popularity base score)

### 5.3 Behavioral Personalization ✅

- [x] Viewed destinations → interaction affinity signals (category, continent, tag overlap)
- [x] Saved destinations → strong interest signal (15pt boost for saved items)
- [x] Detail-viewed destinations excluded from "For You" (already seen) but re-surfaced in sections
- [x] Time-decayed weighting: last 7 days full weight, 7-30 days 0.7x, 30+ days 0.4x
- [ ] Booking history → strongest signal (pending booking feature implementation)

### 5.4 Section Order Personalization ✅

- [x] If user primarily saves budget destinations → Budget Friendly moves up in section order
- [x] If user interacts with luxury → Luxury Escapes moves up
- [x] Dynamic section ordering based on user segment (spending style, companion type, activity level, trip styles)
- [x] Top-engaged sections get -3/-2/-1 priority boost based on engagement rank

### Phase 5 Completion Criteria
- [x] Two different users see noticeably different homepage content (cold vs warm/hot strategies)
- [x] "For You" section shows relevant, personalized recommendations with explainable match reasons
- [x] Section order adapts to user behavior (engagement-weighted + preference-based reordering)
- [x] Match reasons explain why a destination was recommended (interest, style, budget, location, season)

---

## Progress Tracker

### Phase 1 — Fix the Fuel

**ROOT CAUSE IDENTIFIED:** Both `user_interactions.user_id` and `travel_preferences.user_id` had foreign key constraints pointing to `auth.users(id)` instead of `profiles(id)`. Since the app uses Clerk for auth (users only exist in `profiles`, NOT `auth.users`), every insert silently failed with an FK violation. This single issue was the blocker for both tables.

| Task | Status | Date |
|------|--------|------|
| 1.1a Add `metadata` JSONB column to `user_interactions` | ✅ Done | Mar 23, 2026 |
| 1.1b Fix `trackInteraction` to check Supabase `{ error }` response | ✅ Done | Mar 23, 2026 |
| 1.1c Integrate `TrackableCard` into 8 section components | ✅ Done | Mar 23, 2026 |
| 1.1d **ROOT FIX:** Re-point `user_interactions.user_id` FK → `profiles(id)` | ✅ Done | Mar 23, 2026 |
| 1.2a **ROOT FIX:** Re-point `travel_preferences.user_id` FK → `profiles(id)` | ✅ Done | Mar 23, 2026 |
| 1.2b Add diagnostic logging to `setup.tsx` travel_preferences upsert | ✅ Done | Mar 23, 2026 |
| 1.2c Backfill `travel_preferences` for 9 existing users (now 10/10) | ✅ Done | Mar 23, 2026 |
| 1.2d Fix `user_saved_items.user_id` FK → `profiles(id)` | ✅ Done | Mar 23, 2026 |
| 1.3 Verify cold → warm → hot transitions | ✅ Verified | Mar 23, 2026 |
| 1.3 Verify "For You" section appears for warm users | ✅ Verified | Mar 23, 2026 |

**Additional FK issues found:** 16 more tables have `user_id` FK to `auth.users` — lower priority, will fix as needed.

**Sections with TrackableCard:** TrendingSection, EditorChoicesSection, MustSeeSection, BudgetFriendlySection, BestDiscoverSection, LuxuryEscapesSection, FamilyFriendlySection, PlacesSection

### Phase 2 — Per-Section Data Pipelines

**Architecture:** `section-refresh` edge function generates per-section data → writes to `section_cache` table → `homepageService.ts` reads cache first (cache-first strategy with stale-while-revalidate). Background refresh triggered for expired sections. `scheduled-jobs` can invoke `section_refresh_all` via cron.

**Cache stats (initial seed):** 11 sections, 106 total items, 0 errors. TTLs: trending=6h, budget=12h, all others=24h.

| Task | Status | Date |
|------|--------|------|
| 2.0 Create `section_cache` table (migration) | ✅ Done | Mar 23, 2026 |
| 2.0 Create `section-refresh` edge function (v1 deployed) | ✅ Done | Mar 23, 2026 |
| 2.0 Seed cache (invoke section-refresh for all 11 sections) | ✅ Done | Mar 23, 2026 |
| 2.0 Modify `homepageService.ts` — cache-first read + stale-while-revalidate | ✅ Done | Mar 23, 2026 |
| 2.0 Add `section_refresh_all` job to `scheduled-jobs` edge function | ✅ Done | Mar 23, 2026 |
| 2.1 Popular Destinations pipeline (`generatePopularDestinations`) | ✅ Done | Mar 23, 2026 |
| 2.2 Trending pipeline (`generateTrending`, 6h TTL) | ✅ Done | Mar 23, 2026 |
| 2.3 Editor's Choice pipeline (`generateEditorsChoice`) | ✅ Done | Mar 23, 2026 |
| 2.4 Must See pipeline (`generateMustSee`) | ✅ Done | Mar 23, 2026 |
| 2.5 Budget Friendly pipeline (`generateBudgetFriendly`, 12h TTL) | ✅ Done | Mar 23, 2026 |
| 2.6 Luxury Escapes pipeline (`generateLuxuryEscapes`) | ✅ Done | Mar 23, 2026 |
| 2.7 Family Friendly pipeline (`generateFamilyFriendly`) | ✅ Done | Mar 23, 2026 |
| 2.8 Hidden Gems pipeline (`generateHiddenGems`) | ✅ Done | Mar 23, 2026 |
| 2.8+ Adventure pipeline (`generateAdventure`) | ✅ Done | Mar 23, 2026 |
| 2.8+ Beach & Islands pipeline (`generateBeachIslands`) | ✅ Done | Mar 23, 2026 |
| 2.8+ Places pipeline (`generatePlaces`) | ✅ Done | Mar 23, 2026 |
| 2.9 Verify Deals + Local Experiences independence | ✅ Verified | Mar 23, 2026 |

### Phase 3 — AI Classification Layer ✅
| Task | Status | Date |
|------|--------|------|
| 3.1 Create classify-destination edge function | ✅ Done | Mar 23, 2026 |
| 3.2 Design and test classification prompt (Gemini 2.0 Flash) | ✅ Done | Mar 23, 2026 |
| 3.3 Run batch classification on all 58 destinations | ✅ Done | Mar 23, 2026 |
| 3.4 Integrate classification into section-refresh generators (v2) | ✅ Done | Mar 23, 2026 |
| 3.5 Re-seed cache with AI-powered data (source: ai+db) | ✅ Done | Mar 23, 2026 |
| 3.6 Add classify_new_destinations to scheduled-jobs (v21) | ✅ Done | Mar 23, 2026 |

### Phase 4 — Scale the Catalog ✅
| Task | Status | Date |
|------|--------|------|
| 4.1 Create discover-destinations edge function (v3, multi-model fallback) | ✅ Done | Mar 23, 2026 |
| 4.1b Multi-model fallback: Gemini → Claude → OpenAI → xAI | ✅ Done | Mar 23, 2026 |
| 4.2 Expand catalog to 200+ destinations (201 achieved) | ✅ Done | Mar 23, 2026 |
| 4.3 Classify all 201 destinations (0 unclassified) | ✅ Done | Mar 23, 2026 |
| 4.4 Re-seed all 11 section caches with expanded catalog | ✅ Done | Mar 23, 2026 |
| 4.5 Add discover_destinations to scheduled-jobs | ✅ Done | Mar 23, 2026 |
| 4.6 Cursor-based pagination for View All | Not Started | |
| 4.7 Content freshness cron jobs (discover/classify/refresh) | ✅ Done | Mar 23, 2026 |

### Phase 5 — Personalization ✅
| Task | Status | Date |
|------|--------|------|
| 5.1 Create `personalize-homepage` edge function (v1) | ✅ Done | Mar 23, 2026 |
| 5.1 User profile builder (preferences + interactions + saved items) | ✅ Done | Mar 23, 2026 |
| 5.1 "For You" section with multi-signal scoring engine | ✅ Done | Mar 23, 2026 |
| 5.1 Explainable match reasons (interest, style, budget, location, season) | ✅ Done | Mar 23, 2026 |
| 5.2 Location-aware boosting (haversine distance scoring) | ✅ Done | Mar 23, 2026 |
| 5.2 Seasonal relevance scoring (current + adjacent season) | ✅ Done | Mar 23, 2026 |
| 5.3 Behavioral signals (view/detail_view/save weighting with time decay) | ✅ Done | Mar 23, 2026 |
| 5.3 Interaction affinity (category, continent, tag preference derivation) | ✅ Done | Mar 23, 2026 |
| 5.3 Per-section item re-ranking based on user affinity scores | ✅ Done | Mar 23, 2026 |
| 5.4 Section order personalization (engagement + preference reordering) | ✅ Done | Mar 23, 2026 |
| 5.5 Integrate personalization into homepageService cache-first path | ✅ Done | Mar 23, 2026 |
| 5.5 Cold start fallback (preference-only section reordering) | ✅ Done | Mar 23, 2026 |

---

## Key Files Reference

| File | Role |
|------|------|
| `supabase/functions/homepage/index.ts` | Monolithic homepage edge function (fallback personalized path) |
| `supabase/functions/personalize-homepage/index.ts` | Per-user personalization engine (v1: scoring, For You, re-ranking, section reorder) |
| `supabase/functions/classify-destination/index.ts` | AI classification edge function (Gemini 2.0 Flash) |
| `supabase/functions/discover-destinations/index.ts` | AI catalog expansion (v3, multi-model fallback: Gemini→Claude→OpenAI→xAI) |
| `supabase/functions/section-refresh/index.ts` | Per-section cache refresh edge function (v2, AI-integrated) |
| `section_cache` (DB table) | Pre-computed section data with TTL-based expiry |
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
