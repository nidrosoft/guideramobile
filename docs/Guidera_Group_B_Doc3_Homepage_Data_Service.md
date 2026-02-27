# Guidera - Group B Document 3: Homepage Data Service

## Overview

This document defines the **Homepage Data Service** — the intelligent backend layer that powers Guidera's personalized homepage. This service fetches curated content from Supabase, applies location-aware filtering, personalizes results based on user preferences, and delivers lightning-fast responses.

**Technology:** Supabase Edge Functions (Deno Runtime)
**Purpose:** Serve personalized homepage content with sub-200ms response times

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HOMEPAGE DATA SERVICE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │   Request   │────▶│   Context   │────▶│  Strategy   │                   │
│   │   Parser    │     │   Builder   │     │  Selector   │                   │
│   └─────────────┘     └─────────────┘     └──────┬──────┘                   │
│                                                   │                          │
│                              ┌────────────────────┼────────────────────┐     │
│                              ▼                    ▼                    ▼     │
│                    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐│
│                    │ Cold Start  │      │ Warm Start  │      │  Hot Start  ││
│                    │  Strategy   │      │  Strategy   │      │  Strategy   ││
│                    └──────┬──────┘      └──────┬──────┘      └──────┬──────┘│
│                           └────────────────────┼────────────────────┘       │
│                                                ▼                            │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │   Section   │◀────│   Content   │◀────│   Query     │                   │
│   │  Generator  │     │   Ranker    │     │   Engine    │                   │
│   └──────┬──────┘     └─────────────┘     └─────────────┘                   │
│          │                                                                   │
│          ▼                                                                   │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │   Cache     │────▶│  Response   │────▶│  Analytics  │                   │
│   │   Manager   │     │  Formatter  │     │   Tracker   │                   │
│   └─────────────┘     └─────────────┘     └─────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
supabase/functions/
├── homepage/
│   ├── index.ts                    # Main entry point
│   ├── types.ts                    # TypeScript interfaces
│   ├── config.ts                   # Configuration constants
│   │
│   ├── core/
│   │   ├── context-builder.ts      # Builds user context
│   │   ├── query-engine.ts         # Database queries
│   │   ├── content-ranker.ts       # Scoring algorithm
│   │   └── section-generator.ts    # Generates sections
│   │
│   ├── strategies/
│   │   ├── base-strategy.ts        # Strategy interface
│   │   ├── cold-start.ts           # New users (0-2 interactions)
│   │   ├── warm-start.ts           # Learning users (3-20 interactions)
│   │   └── hot-start.ts            # Established users (20+ interactions)
│   │
│   ├── sections/
│   │   ├── for-you.ts              # Personalized picks
│   │   ├── deals.ts                # Hot deals
│   │   ├── popular.ts              # Popular destinations
│   │   ├── trending.ts             # Trending now
│   │   ├── nearby.ts               # Location-based
│   │   ├── seasonal.ts             # Season-appropriate
│   │   ├── budget.ts               # Budget-friendly
│   │   ├── luxury.ts               # Luxury escapes
│   │   ├── family.ts               # Family-friendly
│   │   ├── adventure.ts            # Adventure destinations
│   │   ├── romantic.ts             # Romantic getaways
│   │   ├── hidden-gems.ts          # Off-beaten path
│   │   ├── local-experiences.ts    # Experiences near user
│   │   └── last-minute.ts          # Last-minute deals
│   │
│   ├── utils/
│   │   ├── cache.ts                # Caching utilities
│   │   ├── distance.ts             # Geo calculations
│   │   ├── time.ts                 # Time/season utilities
│   │   └── response.ts             # Response helpers
│   │
│   └── middleware/
│       ├── auth.ts                 # Authentication
│       ├── rate-limit.ts           # Rate limiting
│       └── analytics.ts            # Event tracking
```

---

## Type Definitions

```typescript
// types.ts

// ============================================
// REQUEST TYPES
// ============================================

export interface HomepageRequest {
  userId: string
  location?: UserLocation
  timezone?: string
  refresh?: boolean
  categories?: string[]
  limit?: number
}

export interface UserLocation {
  latitude: number
  longitude: number
  city?: string
  country?: string
  countryCode?: string
}

// ============================================
// USER CONTEXT
// ============================================

export interface UserContext {
  // Identity
  userId: string
  isAuthenticated: boolean
  accountAgeDays: number
  
  // Preferences (from user_preferences table)
  preferences: UserPreferences | null
  
  // Behavioral Data
  interactions: UserInteraction[]
  interactionCount: number
  savedItems: SavedItem[]
  bookingHistory: Booking[]
  
  // Location
  location: UserLocation | null
  homeLocation: UserLocation | null
  distanceFromHome: number | null
  
  // Temporal
  currentTime: Date
  localTime: Date
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  dayOfWeek: number
  isWeekend: boolean
  currentSeason: 'spring' | 'summer' | 'fall' | 'winter'
  currentMonth: number
  
  // Computed Scores
  confidenceScore: number        // 0-100: How well we know this user
  engagementLevel: 'low' | 'medium' | 'high'
  
  // Strategy Selection
  strategyType: 'cold' | 'warm' | 'hot'
}

export interface UserPreferences {
  id: string
  userId: string
  travelStyle: string | null
  travelStyles: string[]
  interests: string[]
  favoriteActivities: string[]
  typicalCompanions: string | null
  hasChildren: boolean
  childrenAges: number[]
  budgetPreference: string | null
  budgetLevel: number | null
  preferredCurrency: string
  tripsPerYear: number | null
  averageTripDuration: number | null
  accommodationPreference: string[]
  dietaryRestrictions: string[]
  cuisinePreferences: string[]
  accessibilityNeeds: string[]
  preferredRegions: string[]
  preferredClimates: string[]
  avoidedRegions: string[]
  homeCity: string | null
  homeCountry: string | null
  homeCountryCode: string | null
  homeLatitude: number | null
  homeLongitude: number | null
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface UserInteraction {
  id: string
  userId: string
  destinationId: string | null
  experienceId: string | null
  categorySlug: string | null
  interactionType: InteractionType
  source: string | null
  createdAt: string
  metadata: Record<string, any>
}

export type InteractionType = 
  | 'view'
  | 'detail_view'
  | 'save'
  | 'unsave'
  | 'share'
  | 'search'
  | 'book_start'
  | 'book_complete'
  | 'dismiss'
  | 'not_interested'

export interface SavedItem {
  id: string
  userId: string
  destinationId: string | null
  experienceId: string | null
  savedAt: string
}

export interface Booking {
  id: string
  userId: string
  destinationId: string | null
  bookingType: string
  totalCost: number
  currency: string
  createdAt: string
}

// ============================================
// CONTENT TYPES
// ============================================

export interface Destination {
  id: string
  title: string
  slug: string
  description: string
  shortDescription: string | null
  city: string
  country: string
  countryCode: string
  region: string
  continent: string
  latitude: number
  longitude: number
  timezone: string | null
  heroImageUrl: string
  thumbnailUrl: string
  galleryUrls: string[]
  primaryCategory: string
  secondaryCategories: string[]
  tags: string[]
  budgetLevel: number
  travelStyle: string[]
  bestFor: string[]
  seasons: string[]
  priority: number
  popularityScore: number
  editorRating: number | null
  isFeatured: boolean
  isTrending: boolean
  estimatedFlightPriceUsd: number | null
  estimatedHotelPriceUsd: number | null
  estimatedDailyBudgetUsd: number | null
  currencyCode: string
  languageSpoken: string[]
  safetyRating: number | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface Experience {
  id: string
  destinationId: string
  title: string
  slug: string
  description: string
  shortDescription: string | null
  experienceType: string
  category: string
  imageUrl: string
  thumbnailUrl: string
  priceFrom: number | null
  priceTo: number | null
  currencyCode: string
  durationMinutes: number | null
  durationText: string | null
  bestFor: string[]
  tags: string[]
  priority: number
  popularityScore: number
  averageRating: number | null
  reviewCount: number
  isFeatured: boolean
  isBestseller: boolean
  status: string
}

// ============================================
// SCORED CONTENT (After Ranking)
// ============================================

export interface ScoredDestination extends Destination {
  matchScore: number           // 0-100: Overall match
  relevanceScore: number       // 0-100: Content relevance
  proximityScore: number       // 0-100: Location proximity
  seasonalScore: number        // 0-100: Seasonal fit
  budgetScore: number          // 0-100: Budget match
  interestScore: number        // 0-100: Interest alignment
  freshnessScore: number       // 0-100: Content freshness
  popularityBoost: number      // 0-20: Popularity bonus
  matchReasons: string[]       // Human-readable reasons
  distanceKm: number | null    // Distance from user
}

export interface ScoredExperience extends Experience {
  matchScore: number
  matchReasons: string[]
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface HomepageResponse {
  success: boolean
  data: {
    sections: HomepageSection[]
    meta: ResponseMeta
  }
  error?: string
}

export interface HomepageSection {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  iconName: string | null
  layoutType: LayoutType
  cardSize: CardSize
  items: ContentItem[]
  itemCount: number
  totalAvailable: number
  hasMore: boolean
  seeMoreUrl: string | null
  priority: number
  isPersonalized: boolean
  generatedAt: string
}

export type LayoutType = 
  | 'horizontal_scroll'
  | 'grid_2x2'
  | 'grid_3x2'
  | 'featured_large'
  | 'carousel'
  | 'list'
  | 'map_view'

export type CardSize = 'small' | 'medium' | 'large'

export interface ContentItem {
  id: string
  type: 'destination' | 'experience' | 'deal' | 'promotion'
  title: string
  subtitle: string
  imageUrl: string
  thumbnailUrl: string
  
  // Pricing
  price: PriceInfo | null
  originalPrice: PriceInfo | null
  discountPercent: number | null
  
  // Ratings
  rating: number | null
  reviewCount: number | null
  
  // Location
  location: {
    city: string
    country: string
    distanceKm: number | null
    distanceText: string | null
  }
  
  // Personalization
  matchScore: number
  matchReasons: string[]
  
  // Badges
  badges: Badge[]
  
  // Actions
  ctaText: string
  ctaUrl: string
  isSaved: boolean
}

export interface PriceInfo {
  amount: number
  currency: string
  period: 'total' | 'per_night' | 'per_person' | 'per_day'
  formatted: string
}

export interface Badge {
  type: 'trending' | 'popular' | 'deal' | 'new' | 'editors_choice' | 'bestseller'
  text: string
  color: string
}

export interface ResponseMeta {
  userId: string
  personalizationScore: number
  strategyUsed: 'cold' | 'warm' | 'hot'
  sectionsReturned: number
  totalItemsReturned: number
  generatedAt: string
  cacheHit: boolean
  responseTimeMs: number
  prefetchUrls: string[]
}

// ============================================
// CONFIGURATION TYPES
// ============================================

export interface SectionConfig {
  slug: string
  enabled: boolean
  priority: number
  itemsToShow: number
  minItemsRequired: number
  requiresLocation: boolean
  requiresPreferences: boolean
  personalizationWeight: number
  cacheMinutes: number
}

export interface StrategyConfig {
  type: 'cold' | 'warm' | 'hot'
  sections: SectionConfig[]
  explorationRate: number      // 0-1: How much novel content to include
  diversityThreshold: number   // 0-1: Similarity threshold for diversity
}
```

---

## Configuration

```typescript
// config.ts

export const CONFIG = {
  // Cache Settings
  cache: {
    homepageTtlMinutes: 30,
    sectionTtlMinutes: 60,
    userContextTtlMinutes: 5,
    maxCacheSize: 10000,
  },
  
  // Performance
  performance: {
    maxResponseTimeMs: 200,
    maxItemsPerSection: 20,
    maxSectionsPerResponse: 15,
    parallelQueryLimit: 10,
  },
  
  // Personalization
  personalization: {
    coldStartThreshold: 3,       // Interactions to exit cold start
    warmStartThreshold: 20,      // Interactions to reach hot start
    explorationRateCold: 0.4,    // 40% exploration for new users
    explorationRateWarm: 0.2,    // 20% exploration for learning users
    explorationRateHot: 0.1,     // 10% exploration for established users
  },
  
  // Scoring Weights
  scoring: {
    relevance: 30,
    budget: 20,
    interests: 20,
    proximity: 15,
    seasonal: 10,
    popularity: 5,
  },
  
  // Location
  location: {
    nearbyRadiusKm: 500,
    weekendTripRadiusKm: 300,
    maxDistanceKm: 20000,
  },
  
  // Sections Configuration
  sections: {
    'for-you': {
      slug: 'for-you',
      enabled: true,
      priority: 1,
      itemsToShow: 12,
      minItemsRequired: 4,
      requiresLocation: false,
      requiresPreferences: false,
      personalizationWeight: 1.0,
      cacheMinutes: 30,
    },
    'deals': {
      slug: 'deals',
      enabled: true,
      priority: 2,
      itemsToShow: 10,
      minItemsRequired: 3,
      requiresLocation: false,
      requiresPreferences: false,
      personalizationWeight: 0.7,
      cacheMinutes: 15,
    },
    'popular': {
      slug: 'popular',
      enabled: true,
      priority: 3,
      itemsToShow: 10,
      minItemsRequired: 4,
      requiresLocation: false,
      requiresPreferences: false,
      personalizationWeight: 0.5,
      cacheMinutes: 60,
    },
    'nearby': {
      slug: 'nearby',
      enabled: true,
      priority: 4,
      itemsToShow: 8,
      minItemsRequired: 3,
      requiresLocation: true,
      requiresPreferences: false,
      personalizationWeight: 0.6,
      cacheMinutes: 30,
    },
    'trending': {
      slug: 'trending',
      enabled: true,
      priority: 5,
      itemsToShow: 10,
      minItemsRequired: 4,
      requiresLocation: false,
      requiresPreferences: false,
      personalizationWeight: 0.4,
      cacheMinutes: 60,
    },
    'budget-friendly': {
      slug: 'budget-friendly',
      enabled: true,
      priority: 6,
      itemsToShow: 10,
      minItemsRequired: 4,
      requiresLocation: false,
      requiresPreferences: true,
      personalizationWeight: 0.8,
      cacheMinutes: 60,
    },
    'luxury': {
      slug: 'luxury',
      enabled: true,
      priority: 7,
      itemsToShow: 8,
      minItemsRequired: 3,
      requiresLocation: false,
      requiresPreferences: true,
      personalizationWeight: 0.8,
      cacheMinutes: 60,
    },
    'family': {
      slug: 'family',
      enabled: true,
      priority: 8,
      itemsToShow: 10,
      minItemsRequired: 3,
      requiresLocation: false,
      requiresPreferences: true,
      personalizationWeight: 0.9,
      cacheMinutes: 60,
    },
    'adventure': {
      slug: 'adventure',
      enabled: true,
      priority: 9,
      itemsToShow: 10,
      minItemsRequired: 4,
      requiresLocation: false,
      requiresPreferences: true,
      personalizationWeight: 0.8,
      cacheMinutes: 60,
    },
    'romantic': {
      slug: 'romantic',
      enabled: true,
      priority: 10,
      itemsToShow: 8,
      minItemsRequired: 3,
      requiresLocation: false,
      requiresPreferences: true,
      personalizationWeight: 0.8,
      cacheMinutes: 60,
    },
    'seasonal': {
      slug: 'seasonal',
      enabled: true,
      priority: 11,
      itemsToShow: 10,
      minItemsRequired: 4,
      requiresLocation: false,
      requiresPreferences: false,
      personalizationWeight: 0.5,
      cacheMinutes: 60,
    },
    'hidden-gems': {
      slug: 'hidden-gems',
      enabled: true,
      priority: 12,
      itemsToShow: 8,
      minItemsRequired: 3,
      requiresLocation: false,
      requiresPreferences: true,
      personalizationWeight: 0.6,
      cacheMinutes: 60,
    },
    'local-experiences': {
      slug: 'local-experiences',
      enabled: true,
      priority: 13,
      itemsToShow: 10,
      minItemsRequired: 3,
      requiresLocation: true,
      requiresPreferences: false,
      personalizationWeight: 0.7,
      cacheMinutes: 30,
    },
    'editors-choice': {
      slug: 'editors-choice',
      enabled: true,
      priority: 14,
      itemsToShow: 8,
      minItemsRequired: 3,
      requiresLocation: false,
      requiresPreferences: false,
      personalizationWeight: 0.3,
      cacheMinutes: 120,
    },
    'weekend-trips': {
      slug: 'weekend-trips',
      enabled: true,
      priority: 15,
      itemsToShow: 8,
      minItemsRequired: 3,
      requiresLocation: true,
      requiresPreferences: false,
      personalizationWeight: 0.6,
      cacheMinutes: 30,
    },
  } as Record<string, SectionConfig>,
}
```

---

## Main Entry Point

```typescript
// index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CONFIG } from './config.ts'
import { buildUserContext } from './core/context-builder.ts'
import { selectStrategy } from './strategies/index.ts'
import { generateSections } from './core/section-generator.ts'
import { CacheManager } from './utils/cache.ts'
import { formatResponse, errorResponse } from './utils/response.ts'
import { trackHomepageView } from './middleware/analytics.ts'
import type { HomepageRequest, HomepageResponse, UserContext } from './types.ts'

// Initialize cache
const cache = new CacheManager()

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now()
  
  try {
    // =========================================
    // 1. PARSE & VALIDATE REQUEST
    // =========================================
    const request = await parseRequest(req)
    
    // =========================================
    // 2. INITIALIZE SUPABASE CLIENT
    // =========================================
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // =========================================
    // 3. CHECK CACHE (Unless refresh requested)
    // =========================================
    if (!request.refresh) {
      const cacheKey = generateCacheKey(request)
      const cached = await cache.get(cacheKey)
      
      if (cached) {
        const responseTimeMs = Date.now() - startTime
        return formatResponse({
          ...cached,
          meta: {
            ...cached.meta,
            cacheHit: true,
            responseTimeMs,
          }
        })
      }
    }
    
    // =========================================
    // 4. BUILD USER CONTEXT
    // =========================================
    const context = await buildUserContext(supabase, request)
    
    // =========================================
    // 5. SELECT PERSONALIZATION STRATEGY
    // =========================================
    const strategy = selectStrategy(context)
    
    // =========================================
    // 6. GENERATE SECTIONS
    // =========================================
    const sections = await generateSections(
      supabase,
      context,
      strategy,
      request.categories
    )
    
    // =========================================
    // 7. BUILD RESPONSE
    // =========================================
    const responseTimeMs = Date.now() - startTime
    
    const response: HomepageResponse = {
      success: true,
      data: {
        sections,
        meta: {
          userId: context.userId,
          personalizationScore: context.confidenceScore,
          strategyUsed: context.strategyType,
          sectionsReturned: sections.length,
          totalItemsReturned: sections.reduce((sum, s) => sum + s.itemCount, 0),
          generatedAt: new Date().toISOString(),
          cacheHit: false,
          responseTimeMs,
          prefetchUrls: generatePrefetchUrls(sections),
        }
      }
    }
    
    // =========================================
    // 8. CACHE RESPONSE
    // =========================================
    const cacheKey = generateCacheKey(request)
    await cache.set(cacheKey, response.data, CONFIG.cache.homepageTtlMinutes * 60)
    
    // =========================================
    // 9. TRACK ANALYTICS (async, non-blocking)
    // =========================================
    trackHomepageView(supabase, context, sections).catch(console.error)
    
    // =========================================
    // 10. RETURN RESPONSE
    // =========================================
    return formatResponse(response)
    
  } catch (error) {
    console.error('Homepage API Error:', error)
    return errorResponse(error)
  }
})

// ============================================
// HELPER FUNCTIONS
// ============================================

async function parseRequest(req: Request): Promise<HomepageRequest> {
  const url = new URL(req.url)
  
  const userId = url.searchParams.get('user_id')
  if (!userId) {
    throw new Error('user_id is required')
  }
  
  const lat = url.searchParams.get('lat')
  const lng = url.searchParams.get('lng')
  
  return {
    userId,
    location: lat && lng ? {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      city: url.searchParams.get('city') || undefined,
      country: url.searchParams.get('country') || undefined,
      countryCode: url.searchParams.get('country_code') || undefined,
    } : undefined,
    timezone: url.searchParams.get('timezone') || undefined,
    refresh: url.searchParams.get('refresh') === 'true',
    categories: url.searchParams.get('categories')?.split(',').filter(Boolean),
    limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
  }
}

function generateCacheKey(request: HomepageRequest): string {
  const parts = [
    'homepage',
    request.userId,
    request.location ? `${request.location.latitude.toFixed(2)}_${request.location.longitude.toFixed(2)}` : 'no-loc',
    request.categories?.join('-') || 'all',
  ]
  return parts.join(':')
}

function generatePrefetchUrls(sections: HomepageSection[]): string[] {
  const urls: string[] = []
  
  // Prefetch first 3 items from "For You" section
  const forYouSection = sections.find(s => s.slug === 'for-you')
  if (forYouSection) {
    urls.push(...forYouSection.items.slice(0, 3).map(item => item.ctaUrl))
  }
  
  // Prefetch first deal
  const dealsSection = sections.find(s => s.slug === 'deals')
  if (dealsSection?.items[0]) {
    urls.push(dealsSection.items[0].ctaUrl)
  }
  
  return urls
}
```

---

## Context Builder

```typescript
// core/context-builder.ts

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CONFIG } from '../config.ts'
import { calculateDistance } from '../utils/distance.ts'
import { getCurrentSeason, getTimeOfDay } from '../utils/time.ts'
import type {
  HomepageRequest,
  UserContext,
  UserPreferences,
  UserInteraction,
  SavedItem,
  Booking,
} from '../types.ts'

export async function buildUserContext(
  supabase: SupabaseClient,
  request: HomepageRequest
): Promise<UserContext> {
  
  // =========================================
  // FETCH ALL USER DATA IN PARALLEL
  // =========================================
  const [
    userResult,
    preferencesResult,
    interactionsResult,
    savedItemsResult,
    bookingsResult,
  ] = await Promise.all([
    // User profile
    supabase
      .from('users')
      .select('*')
      .eq('id', request.userId)
      .single(),
    
    // User preferences
    supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', request.userId)
      .single(),
    
    // Recent interactions (last 100)
    supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', request.userId)
      .order('created_at', { ascending: false })
      .limit(100),
    
    // Saved items
    supabase
      .from('user_saved_items')
      .select('*')
      .eq('user_id', request.userId)
      .eq('is_archived', false),
    
    // Booking history
    supabase
      .from('bookings')
      .select('*')
      .eq('user_id', request.userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])
  
  // =========================================
  // EXTRACT DATA
  // =========================================
  const user = userResult.data
  const preferences = preferencesResult.data as UserPreferences | null
  const interactions = (interactionsResult.data || []) as UserInteraction[]
  const savedItems = (savedItemsResult.data || []) as SavedItem[]
  const bookings = (bookingsResult.data || []) as Booking[]
  
  // =========================================
  // CALCULATE TEMPORAL CONTEXT
  // =========================================
  const now = new Date()
  const localTime = request.timezone 
    ? new Date(now.toLocaleString('en-US', { timeZone: request.timezone }))
    : now
  
  const currentMonth = now.getMonth() + 1
  const dayOfWeek = now.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  
  // =========================================
  // CALCULATE LOCATION CONTEXT
  // =========================================
  let homeLocation = null
  let distanceFromHome = null
  
  if (preferences?.homeLatitude && preferences?.homeLongitude) {
    homeLocation = {
      latitude: preferences.homeLatitude,
      longitude: preferences.homeLongitude,
      city: preferences.homeCity || undefined,
      country: preferences.homeCountry || undefined,
      countryCode: preferences.homeCountryCode || undefined,
    }
    
    if (request.location) {
      distanceFromHome = calculateDistance(
        request.location.latitude,
        request.location.longitude,
        homeLocation.latitude,
        homeLocation.longitude
      )
    }
  }
  
  // =========================================
  // CALCULATE ENGAGEMENT METRICS
  // =========================================
  const interactionCount = interactions.length
  const accountAgeDays = user?.created_at 
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  
  const confidenceScore = calculateConfidenceScore(preferences, interactions, bookings)
  const engagementLevel = calculateEngagementLevel(interactions)
  
  // =========================================
  // DETERMINE STRATEGY TYPE
  // =========================================
  let strategyType: 'cold' | 'warm' | 'hot'
  
  if (interactionCount < CONFIG.personalization.coldStartThreshold) {
    strategyType = 'cold'
  } else if (interactionCount < CONFIG.personalization.warmStartThreshold) {
    strategyType = 'warm'
  } else {
    strategyType = 'hot'
  }
  
  // =========================================
  // BUILD CONTEXT OBJECT
  // =========================================
  return {
    // Identity
    userId: request.userId,
    isAuthenticated: !!user,
    accountAgeDays,
    
    // Preferences
    preferences,
    
    // Behavioral Data
    interactions,
    interactionCount,
    savedItems,
    bookingHistory: bookings,
    
    // Location
    location: request.location || null,
    homeLocation,
    distanceFromHome,
    
    // Temporal
    currentTime: now,
    localTime,
    timeOfDay: getTimeOfDay(localTime),
    dayOfWeek,
    isWeekend,
    currentSeason: getCurrentSeason(request.location?.latitude || 40), // Default to northern hemisphere
    currentMonth,
    
    // Computed Scores
    confidenceScore,
    engagementLevel,
    
    // Strategy
    strategyType,
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateConfidenceScore(
  preferences: UserPreferences | null,
  interactions: UserInteraction[],
  bookings: Booking[]
): number {
  let score = 0
  
  // Preferences completeness (0-40 points)
  if (preferences) {
    if (preferences.travelStyle) score += 8
    if (preferences.interests?.length > 0) score += 8
    if (preferences.budgetLevel) score += 8
    if (preferences.typicalCompanions) score += 8
    if (preferences.onboardingCompleted) score += 8
  }
  
  // Interaction depth (0-40 points)
  const interactionPoints = Math.min(interactions.length * 2, 20)
  score += interactionPoints
  
  // Diversity of interactions
  const actionTypes = new Set(interactions.map(i => i.interactionType))
  score += Math.min(actionTypes.size * 4, 20)
  
  // Booking history (0-20 points)
  score += Math.min(bookings.length * 5, 20)
  
  return Math.min(score, 100)
}

function calculateEngagementLevel(
  interactions: UserInteraction[]
): 'low' | 'medium' | 'high' {
  if (interactions.length === 0) return 'low'
  
  // Check recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentInteractions = interactions.filter(
    i => new Date(i.createdAt) > sevenDaysAgo
  )
  
  if (recentInteractions.length >= 20) return 'high'
  if (recentInteractions.length >= 5) return 'medium'
  return 'low'
}
```

---

## Query Engine

```typescript
// core/query-engine.ts

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Destination, Experience, UserContext, ScoredDestination } from '../types.ts'
import { calculateDistance } from '../utils/distance.ts'

export class QueryEngine {
  constructor(private supabase: SupabaseClient) {}
  
  // =========================================
  // DESTINATION QUERIES
  // =========================================
  
  /**
   * Fetch all active destinations with optional filters
   */
  async getDestinations(filters?: {
    categories?: string[]
    budgetLevels?: number[]
    regions?: string[]
    seasons?: string[]
    tags?: string[]
    isFeatured?: boolean
    isTrending?: boolean
    excludeIds?: string[]
    limit?: number
  }): Promise<Destination[]> {
    let query = this.supabase
      .from('curated_destinations')
      .select('*')
      .eq('status', 'published')
    
    if (filters?.categories?.length) {
      query = query.in('primary_category', filters.categories)
    }
    
    if (filters?.budgetLevels?.length) {
      query = query.in('budget_level', filters.budgetLevels)
    }
    
    if (filters?.regions?.length) {
      query = query.in('region', filters.regions)
    }
    
    if (filters?.seasons?.length) {
      query = query.overlaps('seasons', filters.seasons)
    }
    
    if (filters?.tags?.length) {
      query = query.overlaps('tags', filters.tags)
    }
    
    if (filters?.isFeatured !== undefined) {
      query = query.eq('is_featured', filters.isFeatured)
    }
    
    if (filters?.isTrending !== undefined) {
      query = query.eq('is_trending', filters.isTrending)
    }
    
    if (filters?.excludeIds?.length) {
      query = query.not('id', 'in', `(${filters.excludeIds.join(',')})`)
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    
    const { data, error } = await query.order('priority', { ascending: false })
    
    if (error) throw error
    return data || []
  }
  
  /**
   * Fetch destinations within radius of a point
   */
  async getDestinationsNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    limit: number = 20
  ): Promise<(Destination & { distanceKm: number })[]> {
    // Using PostGIS function for efficient geo query
    const { data, error } = await this.supabase.rpc('destinations_within_radius', {
      user_lat: latitude,
      user_lng: longitude,
      radius_km: radiusKm,
      max_results: limit,
    })
    
    if (error) {
      // Fallback to manual filtering if RPC not available
      const allDestinations = await this.getDestinations({ limit: 200 })
      
      return allDestinations
        .map(dest => ({
          ...dest,
          distanceKm: calculateDistance(latitude, longitude, dest.latitude, dest.longitude)
        }))
        .filter(dest => dest.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, limit)
    }
    
    return data || []
  }
  
  /**
   * Fetch destinations by category with join to destination_categories
   */
  async getDestinationsByCategory(
    categorySlug: string,
    limit: number = 20
  ): Promise<Destination[]> {
    const { data, error } = await this.supabase
      .from('destination_categories')
      .select(`
        priority_override,
        featured_in_category,
        destination:curated_destinations(*)
      `)
      .eq('category_id', categorySlug)
      .eq('is_active', true)
      .order('priority_override', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return (data || [])
      .map(item => item.destination)
      .filter(Boolean) as Destination[]
  }
  
  /**
   * Fetch destinations by homepage category configuration
   */
  async getDestinationsForSection(
    categorySlug: string,
    context: UserContext,
    limit: number = 20
  ): Promise<Destination[]> {
    // First, get the category configuration
    const { data: categoryConfig } = await this.supabase
      .from('homepage_categories')
      .select('*')
      .eq('slug', categorySlug)
      .single()
    
    if (!categoryConfig) {
      return this.getDestinations({ limit })
    }
    
    // Parse filter rules from category config
    const filterRules = categoryConfig.filter_rules || {}
    
    // Build filters based on rules
    const filters: any = { limit }
    
    if (filterRules.primary_category) {
      filters.categories = filterRules.primary_category
    }
    
    if (filterRules.is_featured !== undefined) {
      filters.isFeatured = filterRules.is_featured
    }
    
    if (filterRules.is_trending !== undefined) {
      filters.isTrending = filterRules.is_trending
    }
    
    if (filterRules.budget_level) {
      const min = filterRules.budget_level.min || 1
      const max = filterRules.budget_level.max || 5
      filters.budgetLevels = Array.from({ length: max - min + 1 }, (_, i) => min + i)
    }
    
    // Handle seasonal filter
    if (filterRules.seasons?.includes('current')) {
      filters.seasons = [context.currentSeason]
    }
    
    return this.getDestinations(filters)
  }
  
  // =========================================
  // EXPERIENCE QUERIES
  // =========================================
  
  /**
   * Fetch experiences for a destination
   */
  async getExperiencesByDestination(
    destinationId: string,
    limit: number = 10
  ): Promise<Experience[]> {
    const { data, error } = await this.supabase
      .from('curated_experiences')
      .select('*')
      .eq('destination_id', destinationId)
      .eq('status', 'published')
      .order('priority', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }
  
  /**
   * Fetch experiences near a location
   */
  async getExperiencesNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    limit: number = 20
  ): Promise<Experience[]> {
    // First get nearby destinations
    const nearbyDestinations = await this.getDestinationsNearby(
      latitude,
      longitude,
      radiusKm,
      50
    )
    
    if (nearbyDestinations.length === 0) return []
    
    const destinationIds = nearbyDestinations.map(d => d.id)
    
    const { data, error } = await this.supabase
      .from('curated_experiences')
      .select('*')
      .in('destination_id', destinationIds)
      .eq('status', 'published')
      .order('popularity_score', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }
  
  // =========================================
  // DEALS & PROMOTIONS
  // =========================================
  
  /**
   * Fetch active deals
   */
  async getActiveDeals(
    context: UserContext,
    limit: number = 10
  ): Promise<Destination[]> {
    const now = new Date().toISOString()
    
    // Get active promotions
    const { data: promotions } = await this.supabase
      .from('seasonal_promotions')
      .select('destination_ids')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
    
    // Get promoted destination IDs
    const promotedIds = promotions?.flatMap(p => p.destination_ids || []) || []
    
    // Also get destinations marked with deals category
    const { data: dealDestinations } = await this.supabase
      .from('curated_destinations')
      .select('*')
      .eq('status', 'published')
      .or(`primary_category.eq.deals,id.in.(${promotedIds.join(',') || 'null'})`)
      .order('priority', { ascending: false })
      .limit(limit)
    
    return dealDestinations || []
  }
  
  // =========================================
  // USER-SPECIFIC QUERIES
  // =========================================
  
  /**
   * Get destinations user has interacted with (for exclusion/deduplication)
   */
  async getUserInteractedDestinations(userId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('user_interactions')
      .select('destination_id')
      .eq('user_id', userId)
      .not('destination_id', 'is', null)
    
    return [...new Set((data || []).map(i => i.destination_id))]
  }
  
  /**
   * Get user's saved destination IDs
   */
  async getUserSavedDestinations(userId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('user_saved_items')
      .select('destination_id')
      .eq('user_id', userId)
      .not('destination_id', 'is', null)
    
    return (data || []).map(i => i.destination_id)
  }
}

// ============================================
// DATABASE FUNCTION (Run in Supabase SQL Editor)
// ============================================

/*
-- Create function for efficient geo queries

CREATE OR REPLACE FUNCTION destinations_within_radius(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km INTEGER,
  max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  slug VARCHAR,
  description TEXT,
  short_description VARCHAR,
  city VARCHAR,
  country VARCHAR,
  country_code CHAR(2),
  region VARCHAR,
  continent VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  timezone VARCHAR,
  hero_image_url TEXT,
  thumbnail_url TEXT,
  gallery_urls TEXT[],
  primary_category VARCHAR,
  secondary_categories TEXT[],
  tags TEXT[],
  budget_level INTEGER,
  travel_style TEXT[],
  best_for TEXT[],
  seasons TEXT[],
  priority INTEGER,
  popularity_score INTEGER,
  editor_rating DECIMAL,
  is_featured BOOLEAN,
  is_trending BOOLEAN,
  estimated_flight_price_usd INTEGER,
  estimated_hotel_price_usd INTEGER,
  estimated_daily_budget_usd INTEGER,
  currency_code CHAR(3),
  language_spoken TEXT[],
  safety_rating INTEGER,
  status VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.*,
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(d.latitude)) *
        cos(radians(d.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(d.latitude))
      )
    )::DECIMAL as distance_km
  FROM curated_destinations d
  WHERE d.status = 'published'
  AND (
    6371 * acos(
      cos(radians(user_lat)) * cos(radians(d.latitude)) *
      cos(radians(d.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(d.latitude))
    )
  ) <= radius_km
  ORDER BY distance_km ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
*/
```

---

## Content Ranker

```typescript
// core/content-ranker.ts

import { CONFIG } from '../config.ts'
import { calculateDistance } from '../utils/distance.ts'
import type {
  Destination,
  Experience,
  UserContext,
  ScoredDestination,
  ScoredExperience,
} from '../types.ts'

export class ContentRanker {
  
  // =========================================
  // MAIN RANKING FUNCTION
  // =========================================
  
  /**
   * Score and rank destinations for a user
   */
  rankDestinations(
    destinations: Destination[],
    context: UserContext
  ): ScoredDestination[] {
    const scored = destinations.map(dest => this.scoreDestination(dest, context))
    
    // Sort by match score descending
    scored.sort((a, b) => b.matchScore - a.matchScore)
    
    // Apply diversity filter
    return this.ensureDiversity(scored)
  }
  
  /**
   * Score a single destination
   */
  scoreDestination(
    destination: Destination,
    context: UserContext
  ): ScoredDestination {
    const scores = {
      relevance: this.calculateRelevanceScore(destination, context),
      budget: this.calculateBudgetScore(destination, context),
      interests: this.calculateInterestScore(destination, context),
      proximity: this.calculateProximityScore(destination, context),
      seasonal: this.calculateSeasonalScore(destination, context),
      popularity: this.calculatePopularityScore(destination),
      freshness: this.calculateFreshnessScore(destination),
    }
    
    // Weighted sum
    const weights = CONFIG.scoring
    const matchScore = 
      (scores.relevance * weights.relevance +
       scores.budget * weights.budget +
       scores.interests * weights.interests +
       scores.proximity * weights.proximity +
       scores.seasonal * weights.seasonal +
       scores.popularity * weights.popularity) / 100
    
    // Calculate distance
    const distanceKm = context.location
      ? calculateDistance(
          context.location.latitude,
          context.location.longitude,
          destination.latitude,
          destination.longitude
        )
      : null
    
    // Generate match reasons
    const matchReasons = this.generateMatchReasons(destination, context, scores)
    
    return {
      ...destination,
      matchScore: Math.round(matchScore * 100) / 100,
      relevanceScore: scores.relevance,
      proximityScore: scores.proximity,
      seasonalScore: scores.seasonal,
      budgetScore: scores.budget,
      interestScore: scores.interests,
      freshnessScore: scores.freshness,
      popularityBoost: scores.popularity,
      matchReasons,
      distanceKm,
    }
  }
  
  // =========================================
  // INDIVIDUAL SCORE CALCULATIONS
  // =========================================
  
  /**
   * Relevance: How well destination matches user's travel style
   */
  private calculateRelevanceScore(
    destination: Destination,
    context: UserContext
  ): number {
    if (!context.preferences?.travelStyle) return 50 // Neutral
    
    const styleMapping: Record<string, string[]> = {
      'adventurer': ['adventure', 'nature', 'mountain', 'off_beaten_path'],
      'explorer': ['cultural', 'historical', 'city_break', 'off_beaten_path'],
      'relaxer': ['beach', 'wellness', 'luxury', 'romantic'],
      'cultural': ['cultural', 'historical', 'food_wine', 'city_break'],
      'foodie': ['food_wine', 'cultural', 'city_break'],
      'luxury': ['luxury', 'romantic', 'wellness'],
      'budget': ['budget_friendly', 'adventure', 'off_beaten_path'],
      'family': ['family', 'beach', 'adventure'],
      'solo': ['city_break', 'adventure', 'cultural'],
      'social': ['nightlife', 'city_break', 'beach'],
    }
    
    const preferredCategories = styleMapping[context.preferences.travelStyle] || []
    
    // Check if destination matches preferred categories
    const allCategories = [destination.primaryCategory, ...destination.secondaryCategories]
    const matches = allCategories.filter(cat => preferredCategories.includes(cat))
    
    if (matches.length >= 2) return 100
    if (matches.length === 1) return 75
    if (preferredCategories.length === 0) return 50
    return 30
  }
  
  /**
   * Budget: How well destination matches user's budget
   */
  private calculateBudgetScore(
    destination: Destination,
    context: UserContext
  ): number {
    if (!context.preferences?.budgetLevel) return 50 // Neutral
    
    const userBudget = context.preferences.budgetLevel
    const destBudget = destination.budgetLevel
    
    // Perfect match
    if (userBudget === destBudget) return 100
    
    // Adjacent budget level
    const diff = Math.abs(userBudget - destBudget)
    if (diff === 1) return 70
    if (diff === 2) return 40
    
    return 20
  }
  
  /**
   * Interests: How well destination matches user's interests
   */
  private calculateInterestScore(
    destination: Destination,
    context: UserContext
  ): number {
    const userInterests = new Set(context.preferences?.interests || [])
    if (userInterests.size === 0) return 50 // Neutral
    
    const destTags = new Set([
      ...destination.tags,
      ...destination.travelStyle,
      ...(destination.bestFor || []),
    ])
    
    // Calculate intersection
    const matches = [...userInterests].filter(interest => destTags.has(interest))
    const matchRatio = matches.length / userInterests.size
    
    return Math.round(matchRatio * 100)
  }
  
  /**
   * Proximity: Distance from user's location
   */
  private calculateProximityScore(
    destination: Destination,
    context: UserContext
  ): number {
    if (!context.location) return 50 // Neutral if no location
    
    const distance = calculateDistance(
      context.location.latitude,
      context.location.longitude,
      destination.latitude,
      destination.longitude
    )
    
    // Score based on distance (closer = higher score)
    // Full score under 500km, degrades to 0 at 10000km
    if (distance <= 500) return 100
    if (distance <= 1000) return 85
    if (distance <= 2000) return 70
    if (distance <= 5000) return 50
    if (distance <= 10000) return 30
    return 20
  }
  
  /**
   * Seasonal: Is this a good time to visit?
   */
  private calculateSeasonalScore(
    destination: Destination,
    context: UserContext
  ): number {
    const destSeasons = new Set(destination.seasons || [])
    
    // If destination has no season data, neutral score
    if (destSeasons.size === 0) return 50
    
    // Perfect match for current season
    if (destSeasons.has(context.currentSeason)) return 100
    
    // Adjacent season gets partial credit
    const seasonOrder = ['spring', 'summer', 'fall', 'winter']
    const currentIdx = seasonOrder.indexOf(context.currentSeason)
    const adjacentSeasons = [
      seasonOrder[(currentIdx + 1) % 4],
      seasonOrder[(currentIdx + 3) % 4],
    ]
    
    if (adjacentSeasons.some(s => destSeasons.has(s))) return 60
    
    return 30
  }
  
  /**
   * Popularity: Boost for popular destinations
   */
  private calculatePopularityScore(destination: Destination): number {
    // popularity_score is 0-100 in database
    return Math.min(destination.popularityScore || 0, 100) * 0.2 // Max 20 points
  }
  
  /**
   * Freshness: Boost for recently added/updated content
   */
  private calculateFreshnessScore(destination: Destination): number {
    const updatedAt = new Date(destination.updatedAt)
    const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysSinceUpdate <= 7) return 100
    if (daysSinceUpdate <= 30) return 75
    if (daysSinceUpdate <= 90) return 50
    return 25
  }
  
  // =========================================
  // MATCH REASONS
  // =========================================
  
  private generateMatchReasons(
    destination: Destination,
    context: UserContext,
    scores: Record<string, number>
  ): string[] {
    const reasons: string[] = []
    
    // Budget match
    if (scores.budget >= 80) {
      const budgetLabels = ['', 'Budget', 'Economy', 'Moderate', 'Luxury', 'Ultra-Luxury']
      reasons.push(`Fits your ${budgetLabels[context.preferences?.budgetLevel || 3].toLowerCase()} budget`)
    }
    
    // Interest match
    if (scores.interests >= 70) {
      const userInterests = context.preferences?.interests || []
      const destTags = [...destination.tags, ...destination.travelStyle]
      const matching = userInterests.filter(i => destTags.includes(i))
      if (matching.length > 0) {
        reasons.push(`Great for ${matching[0]} lovers`)
      }
    }
    
    // Seasonal match
    if (scores.seasonal >= 80) {
      reasons.push('Perfect time to visit')
    }
    
    // Proximity
    if (scores.proximity >= 85 && context.location) {
      const distance = calculateDistance(
        context.location.latitude,
        context.location.longitude,
        destination.latitude,
        destination.longitude
      )
      if (distance <= 500) {
        reasons.push('Quick getaway nearby')
      }
    }
    
    // Popularity
    if (destination.popularityScore >= 80) {
      reasons.push('Highly rated by travelers')
    }
    
    // Editor's choice
    if (destination.isFeatured) {
      reasons.push("Editor's pick")
    }
    
    // Trending
    if (destination.isTrending) {
      reasons.push('Trending now')
    }
    
    // Return top 2 most relevant reasons
    return reasons.slice(0, 2)
  }
  
  // =========================================
  // DIVERSITY
  // =========================================
  
  /**
   * Ensure recommendations aren't too similar
   */
  private ensureDiversity(
    destinations: ScoredDestination[],
    maxPerRegion: number = 3,
    maxPerBudget: number = 4
  ): ScoredDestination[] {
    const result: ScoredDestination[] = []
    const regionCounts: Record<string, number> = {}
    const budgetCounts: Record<number, number> = {}
    
    for (const dest of destinations) {
      const region = dest.region
      const budget = dest.budgetLevel
      
      regionCounts[region] = (regionCounts[region] || 0) + 1
      budgetCounts[budget] = (budgetCounts[budget] || 0) + 1
      
      // Check if we're over limits
      if (regionCounts[region] > maxPerRegion) continue
      if (budgetCounts[budget] > maxPerBudget) continue
      
      result.push(dest)
    }
    
    return result
  }
  
  // =========================================
  // EXPERIENCE RANKING
  // =========================================
  
  rankExperiences(
    experiences: Experience[],
    context: UserContext
  ): ScoredExperience[] {
    return experiences.map(exp => ({
      ...exp,
      matchScore: this.scoreExperience(exp, context),
      matchReasons: this.generateExperienceMatchReasons(exp, context),
    })).sort((a, b) => b.matchScore - a.matchScore)
  }
  
  private scoreExperience(
    experience: Experience,
    context: UserContext
  ): number {
    let score = 50 // Base score
    
    // Interest match
    const userInterests = new Set(context.preferences?.interests || [])
    const expTags = new Set(experience.tags || [])
    const matches = [...userInterests].filter(i => expTags.has(i))
    score += matches.length * 10 // +10 per matching interest
    
    // Popularity boost
    score += (experience.popularityScore || 0) * 0.1
    
    // Rating boost
    if (experience.averageRating) {
      score += (experience.averageRating - 3) * 10 // -20 to +20 based on rating
    }
    
    // Featured/bestseller boost
    if (experience.isFeatured) score += 10
    if (experience.isBestseller) score += 15
    
    return Math.min(Math.max(score, 0), 100)
  }
  
  private generateExperienceMatchReasons(
    experience: Experience,
    context: UserContext
  ): string[] {
    const reasons: string[] = []
    
    if (experience.isBestseller) {
      reasons.push('Bestseller')
    }
    
    if (experience.averageRating && experience.averageRating >= 4.5) {
      reasons.push(`${experience.averageRating}★ rating`)
    }
    
    const userInterests = context.preferences?.interests || []
    const matching = userInterests.filter(i => experience.tags?.includes(i))
    if (matching.length > 0) {
      reasons.push(`Perfect for ${matching[0]}`)
    }
    
    return reasons.slice(0, 2)
  }
}
```

---

## Section Generator

```typescript
// core/section-generator.ts

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CONFIG } from '../config.ts'
import { QueryEngine } from './query-engine.ts'
import { ContentRanker } from './content-ranker.ts'
import type {
  UserContext,
  HomepageSection,
  ContentItem,
  ScoredDestination,
  SectionConfig,
  Badge,
} from '../types.ts'

// Import individual section generators
import { generateForYouSection } from '../sections/for-you.ts'
import { generateDealsSection } from '../sections/deals.ts'
import { generatePopularSection } from '../sections/popular.ts'
import { generateTrendingSection } from '../sections/trending.ts'
import { generateNearbySection } from '../sections/nearby.ts'
import { generateSeasonalSection } from '../sections/seasonal.ts'
import { generateBudgetSection } from '../sections/budget.ts'
import { generateLuxurySection } from '../sections/luxury.ts'
import { generateFamilySection } from '../sections/family.ts'
import { generateAdventureSection } from '../sections/adventure.ts'
import { generateRomanticSection } from '../sections/romantic.ts'
import { generateHiddenGemsSection } from '../sections/hidden-gems.ts'
import { generateLocalExperiencesSection } from '../sections/local-experiences.ts'

export async function generateSections(
  supabase: SupabaseClient,
  context: UserContext,
  strategy: StrategyConfig,
  requestedCategories?: string[]
): Promise<HomepageSection[]> {
  const queryEngine = new QueryEngine(supabase)
  const ranker = new ContentRanker()
  
  // Determine which sections to generate
  let sectionsToGenerate = strategy.sections
  
  if (requestedCategories?.length) {
    sectionsToGenerate = sectionsToGenerate.filter(
      s => requestedCategories.includes(s.slug)
    )
  }
  
  // Filter out sections that require location if no location provided
  sectionsToGenerate = sectionsToGenerate.filter(section => {
    if (section.requiresLocation && !context.location) return false
    if (section.requiresPreferences && !context.preferences) return false
    return section.enabled
  })
  
  // Generate sections in parallel
  const sectionPromises = sectionsToGenerate.map(config => 
    generateSection(supabase, queryEngine, ranker, context, config)
  )
  
  const sections = await Promise.all(sectionPromises)
  
  // Filter out null/empty sections and sort by priority
  return sections
    .filter((section): section is HomepageSection => 
      section !== null && section.items.length >= section.minItemsRequired
    )
    .sort((a, b) => a.priority - b.priority)
}

async function generateSection(
  supabase: SupabaseClient,
  queryEngine: QueryEngine,
  ranker: ContentRanker,
  context: UserContext,
  config: SectionConfig
): Promise<HomepageSection | null> {
  try {
    switch (config.slug) {
      case 'for-you':
        return await generateForYouSection(queryEngine, ranker, context, config)
      
      case 'deals':
        return await generateDealsSection(queryEngine, ranker, context, config)
      
      case 'popular':
        return await generatePopularSection(queryEngine, ranker, context, config)
      
      case 'trending':
        return await generateTrendingSection(queryEngine, ranker, context, config)
      
      case 'nearby':
        return await generateNearbySection(queryEngine, ranker, context, config)
      
      case 'seasonal':
        return await generateSeasonalSection(queryEngine, ranker, context, config)
      
      case 'budget-friendly':
        return await generateBudgetSection(queryEngine, ranker, context, config)
      
      case 'luxury':
        return await generateLuxurySection(queryEngine, ranker, context, config)
      
      case 'family':
        return await generateFamilySection(queryEngine, ranker, context, config)
      
      case 'adventure':
        return await generateAdventureSection(queryEngine, ranker, context, config)
      
      case 'romantic':
        return await generateRomanticSection(queryEngine, ranker, context, config)
      
      case 'hidden-gems':
        return await generateHiddenGemsSection(queryEngine, ranker, context, config)
      
      case 'local-experiences':
        return await generateLocalExperiencesSection(queryEngine, ranker, context, config)
      
      default:
        return null
    }
  } catch (error) {
    console.error(`Error generating section ${config.slug}:`, error)
    return null
  }
}

// ============================================
// SHARED HELPERS
// ============================================

export function formatDestinationAsContentItem(
  destination: ScoredDestination,
  savedIds: Set<string>
): ContentItem {
  return {
    id: destination.id,
    type: 'destination',
    title: destination.title,
    subtitle: `${destination.city}, ${destination.country}`,
    imageUrl: destination.heroImageUrl,
    thumbnailUrl: destination.thumbnailUrl,
    
    price: destination.estimatedDailyBudgetUsd ? {
      amount: destination.estimatedDailyBudgetUsd,
      currency: 'USD',
      period: 'per_day',
      formatted: `From $${destination.estimatedDailyBudgetUsd}/day`,
    } : null,
    originalPrice: null,
    discountPercent: null,
    
    rating: destination.editorRating,
    reviewCount: null,
    
    location: {
      city: destination.city,
      country: destination.country,
      distanceKm: destination.distanceKm,
      distanceText: destination.distanceKm 
        ? formatDistance(destination.distanceKm)
        : null,
    },
    
    matchScore: destination.matchScore,
    matchReasons: destination.matchReasons,
    
    badges: generateBadges(destination),
    
    ctaText: 'Explore',
    ctaUrl: `/destinations/${destination.slug}`,
    isSaved: savedIds.has(destination.id),
  }
}

function generateBadges(destination: ScoredDestination): Badge[] {
  const badges: Badge[] = []
  
  if (destination.isTrending) {
    badges.push({ type: 'trending', text: 'Trending', color: '#FF6B6B' })
  }
  
  if (destination.isFeatured) {
    badges.push({ type: 'editors_choice', text: "Editor's Choice", color: '#4ECDC4' })
  }
  
  if (destination.popularityScore >= 90) {
    badges.push({ type: 'popular', text: 'Popular', color: '#FFE66D' })
  }
  
  return badges.slice(0, 2) // Max 2 badges
}

function formatDistance(km: number): string {
  if (km < 1) return 'Nearby'
  if (km < 100) return `${Math.round(km)} km away`
  if (km < 1000) return `${Math.round(km)} km`
  return `${Math.round(km / 100) * 100} km`
}
```

---

## Individual Section Generators

```typescript
// sections/for-you.ts

import type { QueryEngine } from '../core/query-engine.ts'
import type { ContentRanker } from '../core/content-ranker.ts'
import type { UserContext, HomepageSection, SectionConfig } from '../types.ts'
import { formatDestinationAsContentItem } from '../core/section-generator.ts'

export async function generateForYouSection(
  queryEngine: QueryEngine,
  ranker: ContentRanker,
  context: UserContext,
  config: SectionConfig
): Promise<HomepageSection> {
  
  // Get all active destinations
  const destinations = await queryEngine.getDestinations({
    limit: 100, // Fetch more to allow ranking to select best
  })
  
  // Rank based on user preferences
  const ranked = ranker.rankDestinations(destinations, context)
  
  // Get user's saved items for marking
  const savedIds = new Set(context.savedItems.map(s => s.destinationId).filter(Boolean))
  
  // Take top items
  const topItems = ranked.slice(0, config.itemsToShow)
  
  return {
    id: 'for-you',
    slug: 'for-you',
    title: '✨ Picked For You',
    subtitle: 'Destinations that match your style',
    description: null,
    iconName: 'sparkles',
    layoutType: 'horizontal_scroll',
    cardSize: 'large',
    items: topItems.map(dest => formatDestinationAsContentItem(dest, savedIds)),
    itemCount: topItems.length,
    totalAvailable: ranked.length,
    hasMore: ranked.length > config.itemsToShow,
    seeMoreUrl: '/explore?category=for-you',
    priority: config.priority,
    isPersonalized: true,
    generatedAt: new Date().toISOString(),
  }
}


// sections/deals.ts

export async function generateDealsSection(
  queryEngine: QueryEngine,
  ranker: ContentRanker,
  context: UserContext,
  config: SectionConfig
): Promise<HomepageSection> {
  
  const deals = await queryEngine.getActiveDeals(context, 50)
  const ranked = ranker.rankDestinations(deals, context)
  const savedIds = new Set(context.savedItems.map(s => s.destinationId).filter(Boolean))
  
  const topItems = ranked.slice(0, config.itemsToShow)
  
  // Calculate max discount for subtitle
  const maxDiscount = Math.max(
    ...deals.map(d => d.discountPercent || 0),
    0
  )
  
  return {
    id: 'deals',
    slug: 'deals',
    title: '🔥 Hot Deals',
    subtitle: maxDiscount > 0 ? `Up to ${maxDiscount}% off` : 'Limited-time offers',
    description: null,
    iconName: 'tag',
    layoutType: 'horizontal_scroll',
    cardSize: 'large',
    items: topItems.map(dest => formatDestinationAsContentItem(dest, savedIds)),
    itemCount: topItems.length,
    totalAvailable: deals.length,
    hasMore: deals.length > config.itemsToShow,
    seeMoreUrl: '/explore?category=deals',
    priority: config.priority,
    isPersonalized: true,
    generatedAt: new Date().toISOString(),
  }
}


// sections/nearby.ts

export async function generateNearbySection(
  queryEngine: QueryEngine,
  ranker: ContentRanker,
  context: UserContext,
  config: SectionConfig
): Promise<HomepageSection | null> {
  
  if (!context.location) return null
  
  const nearby = await queryEngine.getDestinationsNearby(
    context.location.latitude,
    context.location.longitude,
    CONFIG.location.nearbyRadiusKm,
    50
  )
  
  if (nearby.length === 0) return null
  
  const ranked = ranker.rankDestinations(nearby, context)
  const savedIds = new Set(context.savedItems.map(s => s.destinationId).filter(Boolean))
  
  const topItems = ranked.slice(0, config.itemsToShow)
  
  return {
    id: 'nearby',
    slug: 'nearby',
    title: '📍 Explore Nearby',
    subtitle: `Within ${CONFIG.location.nearbyRadiusKm}km of you`,
    description: null,
    iconName: 'map-pin',
    layoutType: 'horizontal_scroll',
    cardSize: 'medium',
    items: topItems.map(dest => formatDestinationAsContentItem(dest, savedIds)),
    itemCount: topItems.length,
    totalAvailable: nearby.length,
    hasMore: nearby.length > config.itemsToShow,
    seeMoreUrl: '/explore?category=nearby',
    priority: config.priority,
    isPersonalized: true,
    generatedAt: new Date().toISOString(),
  }
}


// sections/seasonal.ts

export async function generateSeasonalSection(
  queryEngine: QueryEngine,
  ranker: ContentRanker,
  context: UserContext,
  config: SectionConfig
): Promise<HomepageSection> {
  
  const destinations = await queryEngine.getDestinations({
    seasons: [context.currentSeason],
    limit: 50,
  })
  
  const ranked = ranker.rankDestinations(destinations, context)
  const savedIds = new Set(context.savedItems.map(s => s.destinationId).filter(Boolean))
  
  const topItems = ranked.slice(0, config.itemsToShow)
  
  const seasonTitles: Record<string, string> = {
    spring: '🌸 Perfect for Spring',
    summer: '☀️ Summer Escapes',
    fall: '🍂 Fall Favorites',
    winter: '❄️ Winter Wonderlands',
  }
  
  return {
    id: 'seasonal',
    slug: 'seasonal',
    title: seasonTitles[context.currentSeason] || 'Best Right Now',
    subtitle: 'Ideal destinations for this time of year',
    description: null,
    iconName: 'calendar',
    layoutType: 'horizontal_scroll',
    cardSize: 'medium',
    items: topItems.map(dest => formatDestinationAsContentItem(dest, savedIds)),
    itemCount: topItems.length,
    totalAvailable: destinations.length,
    hasMore: destinations.length > config.itemsToShow,
    seeMoreUrl: `/explore?season=${context.currentSeason}`,
    priority: config.priority,
    isPersonalized: false,
    generatedAt: new Date().toISOString(),
  }
}


// sections/budget.ts

export async function generateBudgetSection(
  queryEngine: QueryEngine,
  ranker: ContentRanker,
  context: UserContext,
  config: SectionConfig
): Promise<HomepageSection> {
  
  const destinations = await queryEngine.getDestinations({
    budgetLevels: [1, 2], // Budget and Economy
    limit: 50,
  })
  
  const ranked = ranker.rankDestinations(destinations, context)
  const savedIds = new Set(context.savedItems.map(s => s.destinationId).filter(Boolean))
  
  const topItems = ranked.slice(0, config.itemsToShow)
  
  return {
    id: 'budget-friendly',
    slug: 'budget-friendly',
    title: '💰 Budget Friendly',
    subtitle: "Amazing experiences that won't break the bank",
    description: null,
    iconName: 'dollar-sign',
    layoutType: 'horizontal_scroll',
    cardSize: 'medium',
    items: topItems.map(dest => formatDestinationAsContentItem(dest, savedIds)),
    itemCount: topItems.length,
    totalAvailable: destinations.length,
    hasMore: destinations.length > config.itemsToShow,
    seeMoreUrl: '/explore?budget=1,2',
    priority: config.priority,
    isPersonalized: true,
    generatedAt: new Date().toISOString(),
  }
}


// Additional sections follow the same pattern...
// (luxury.ts, family.ts, adventure.ts, romantic.ts, hidden-gems.ts, local-experiences.ts)
```

---

## Personalization Strategies

```typescript
// strategies/index.ts

import { CONFIG } from '../config.ts'
import type { UserContext, StrategyConfig, SectionConfig } from '../types.ts'

export function selectStrategy(context: UserContext): StrategyConfig {
  switch (context.strategyType) {
    case 'cold':
      return getColdStartStrategy()
    case 'warm':
      return getWarmStartStrategy(context)
    case 'hot':
      return getHotStartStrategy(context)
    default:
      return getColdStartStrategy()
  }
}

// ============================================
// COLD START (0-2 interactions)
// ============================================

function getColdStartStrategy(): StrategyConfig {
  // For new users, show popular/trending content with high exploration
  return {
    type: 'cold',
    explorationRate: CONFIG.personalization.explorationRateCold,
    diversityThreshold: 0.7,
    sections: [
      CONFIG.sections['popular'],
      CONFIG.sections['trending'],
      CONFIG.sections['deals'],
      CONFIG.sections['seasonal'],
      CONFIG.sections['editors-choice'],
      CONFIG.sections['budget-friendly'],
      CONFIG.sections['adventure'],
      CONFIG.sections['hidden-gems'],
    ].map((s, i) => ({ ...s, priority: i + 1 })),
  }
}

// ============================================
// WARM START (3-20 interactions)
// ============================================

function getWarmStartStrategy(context: UserContext): StrategyConfig {
  // Starting to learn preferences, mix personalized with popular
  const sections: SectionConfig[] = [
    CONFIG.sections['for-you'],      // Start showing personalized
    CONFIG.sections['deals'],
    CONFIG.sections['popular'],
    CONFIG.sections['trending'],
  ]
  
  // Add location-based if available
  if (context.location) {
    sections.push(CONFIG.sections['nearby'])
    sections.push(CONFIG.sections['weekend-trips'])
  }
  
  // Add preference-based sections
  if (context.preferences?.budgetLevel && context.preferences.budgetLevel <= 2) {
    sections.push(CONFIG.sections['budget-friendly'])
  }
  
  if (context.preferences?.budgetLevel && context.preferences.budgetLevel >= 4) {
    sections.push(CONFIG.sections['luxury'])
  }
  
  if (context.preferences?.typicalCompanions === 'family' || context.preferences?.hasChildren) {
    sections.push(CONFIG.sections['family'])
  }
  
  // Always add these
  sections.push(CONFIG.sections['seasonal'])
  sections.push(CONFIG.sections['hidden-gems'])
  
  return {
    type: 'warm',
    explorationRate: CONFIG.personalization.explorationRateWarm,
    diversityThreshold: 0.6,
    sections: sections.map((s, i) => ({ ...s, priority: i + 1 })),
  }
}

// ============================================
// HOT START (20+ interactions)
// ============================================

function getHotStartStrategy(context: UserContext): StrategyConfig {
  // Established user, heavy personalization
  const sections: SectionConfig[] = [
    CONFIG.sections['for-you'],      // Primary section
  ]
  
  // Add deals if user has shown interest
  const hasBookedBefore = context.bookingHistory.length > 0
  if (hasBookedBefore) {
    sections.push(CONFIG.sections['deals'])
  }
  
  // Location-based sections
  if (context.location) {
    sections.push(CONFIG.sections['nearby'])
    sections.push(CONFIG.sections['local-experiences'])
    
    // Weekend trips on weekdays
    if (!context.isWeekend) {
      sections.push(CONFIG.sections['weekend-trips'])
    }
  }
  
  // Interest-based sections
  const interests = context.preferences?.interests || []
  
  if (interests.includes('adventure') || interests.includes('hiking') || interests.includes('outdoors')) {
    sections.push(CONFIG.sections['adventure'])
  }
  
  if (interests.includes('food') || interests.includes('wine') || interests.includes('culinary')) {
    // Would add food-wine section if defined
  }
  
  if (interests.includes('romance') || context.preferences?.typicalCompanions === 'partner') {
    sections.push(CONFIG.sections['romantic'])
  }
  
  // Budget-appropriate sections
  const budget = context.preferences?.budgetLevel || 3
  if (budget <= 2) {
    sections.push(CONFIG.sections['budget-friendly'])
  } else if (budget >= 4) {
    sections.push(CONFIG.sections['luxury'])
  }
  
  // Family section
  if (context.preferences?.hasChildren || context.preferences?.typicalCompanions === 'family') {
    sections.push(CONFIG.sections['family'])
  }
  
  // Always include for discovery
  sections.push(CONFIG.sections['trending'])
  sections.push(CONFIG.sections['seasonal'])
  sections.push(CONFIG.sections['hidden-gems'])
  
  return {
    type: 'hot',
    explorationRate: CONFIG.personalization.explorationRateHot,
    diversityThreshold: 0.5,
    sections: sections.map((s, i) => ({ ...s, priority: i + 1 })),
  }
}
```

---

## Utility Functions

```typescript
// utils/distance.ts

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}


// utils/time.ts

export function getCurrentSeason(latitude: number): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth() + 1
  const isNorthernHemisphere = latitude >= 0
  
  // Northern hemisphere seasons
  let season: 'spring' | 'summer' | 'fall' | 'winter'
  
  if (month >= 3 && month <= 5) season = 'spring'
  else if (month >= 6 && month <= 8) season = 'summer'
  else if (month >= 9 && month <= 11) season = 'fall'
  else season = 'winter'
  
  // Flip for southern hemisphere
  if (!isNorthernHemisphere) {
    const flip: Record<string, 'spring' | 'summer' | 'fall' | 'winter'> = {
      spring: 'fall',
      summer: 'winter',
      fall: 'spring',
      winter: 'summer',
    }
    season = flip[season]
  }
  
  return season
}

export function getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours()
  
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}


// utils/cache.ts

export class CacheManager {
  private cache = new Map<string, { data: any; expiresAt: number }>()
  
  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  async set(key: string, data: any, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    })
  }
  
  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }
  
  async clear(): Promise<void> {
    this.cache.clear()
  }
}


// utils/response.ts

export function formatResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=300',
    },
  })
}

export function errorResponse(error: any, status = 500): Response {
  return new Response(JSON.stringify({
    success: false,
    error: error.message || 'Internal server error',
  }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

---

## Analytics Tracking

```typescript
// middleware/analytics.ts

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { UserContext, HomepageSection } from '../types.ts'

export async function trackHomepageView(
  supabase: SupabaseClient,
  context: UserContext,
  sections: HomepageSection[]
): Promise<void> {
  try {
    await supabase.from('user_interactions').insert({
      user_id: context.userId,
      interaction_type: 'view',
      category_slug: 'homepage',
      source: 'homepage',
      metadata: {
        sections_shown: sections.map(s => s.slug),
        section_count: sections.length,
        total_items: sections.reduce((sum, s) => sum + s.itemCount, 0),
        strategy_used: context.strategyType,
        personalization_score: context.confidenceScore,
        has_location: !!context.location,
        time_of_day: context.timeOfDay,
        is_weekend: context.isWeekend,
      },
    })
  } catch (error) {
    console.error('Failed to track homepage view:', error)
  }
}
```

---

## Deployment

### Deploy to Supabase

```bash
# 1. Login to Supabase CLI
supabase login

# 2. Link to your project
supabase link --project-ref your-project-ref

# 3. Deploy the edge function
supabase functions deploy homepage

# 4. Set environment variables (if not already set)
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### API Usage

```
GET https://your-project.supabase.co/functions/v1/homepage?user_id=123&lat=40.7128&lng=-74.0060

Headers:
  Authorization: Bearer <user_jwt_token>

Query Parameters:
  user_id (required): User's UUID
  lat (optional): User's latitude
  lng (optional): User's longitude
  timezone (optional): User's timezone (e.g., "America/New_York")
  refresh (optional): "true" to bypass cache
  categories (optional): Comma-separated category slugs
  limit (optional): Max items per section
```

---

## Summary

This Homepage Data Service provides:

1. **Intelligent User Context Building** — Aggregates all user data in parallel
2. **Strategy-Based Personalization** — Cold/Warm/Hot start strategies
3. **Efficient Query Engine** — Optimized database queries with geo support
4. **Smart Content Ranking** — Multi-factor scoring algorithm
5. **Dynamic Section Generation** — Personalized section ordering
6. **Caching Layer** — Sub-200ms response times
7. **Analytics Tracking** — Learn from every interaction

---

**Document Version:** 1.0
**Last Updated:** 2025
**Status:** Ready for Implementation
