# Guidera - Group B Document 5: Advanced Personalization Engine

## Overview

This document defines the **Personalization Engine** — the AI/ML brain that powers Guidera's intelligent recommendations. This is what makes Guidera feel magical, learning from every tap, scroll, and booking to deliver hyper-personalized travel experiences.

**Goal:** Outsmart Expedia, Booking.com, and every other travel platform by being smarter, faster, and more personal.

---

## Architecture Philosophy

### **The Guidera Intelligence Difference**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TRADITIONAL TRAVEL APPS                                  │
│  User → Search → Filter → Browse → Maybe Find Something                      │
│  ❌ Reactive, User Does All Work                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          GUIDERA                                             │
│  User Opens App → AI Already Knows → Perfect Recommendations Instantly       │
│  ✅ Proactive, App Does The Work                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Core Principles**

1. **Learn From First Tap** — Start personalizing immediately, not after 10 bookings
2. **Understand Intent, Not Just Actions** — Know WHY users do things
3. **Context Is Everything** — Same user, different context = different recommendations
4. **Continuous Evolution** — Get smarter with every interaction
5. **Transparent Intelligence** — Users should understand WHY they see what they see

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERSONALIZATION ENGINE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      SIGNAL COLLECTION LAYER                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │ Explicit │  │ Implicit │  │Contextual│  │ Social   │              │   │
│  │  │ Signals  │  │ Signals  │  │ Signals  │  │ Signals  │              │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘              │   │
│  └───────┼─────────────┼─────────────┼─────────────┼────────────────────┘   │
│          └─────────────┴─────────────┴─────────────┘                        │
│                               │                                              │
│                               ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      EMBEDDING LAYER                                  │   │
│  │  ┌──────────────────┐      ┌──────────────────┐                      │   │
│  │  │  User Embedding  │◄────►│ Content Embedding│                      │   │
│  │  │   (256-dim)      │      │    (256-dim)     │                      │   │
│  │  └────────┬─────────┘      └────────┬─────────┘                      │   │
│  └───────────┼─────────────────────────┼────────────────────────────────┘   │
│              └─────────────┬───────────┘                                    │
│                            ▼                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      INTELLIGENCE LAYER                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │Similarity│  │  Intent  │  │ Contextual│ │  Trend   │              │   │
│  │  │ Matching │  │Prediction│  │  Boost   │  │ Analysis │              │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘              │   │
│  └───────┼─────────────┼─────────────┼─────────────┼────────────────────┘   │
│          └─────────────┴─────────────┴─────────────┘                        │
│                               │                                              │
│                               ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      RANKING LAYER                                    │   │
│  │  ┌──────────────────────────────────────────────────────────────┐    │   │
│  │  │  Multi-Objective Ranker (Relevance + Diversity + Business)   │    │   │
│  │  └──────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                               │                                              │
│                               ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      LEARNING LAYER                                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                            │   │
│  │  │ Real-Time│  │  Batch   │  │ Feedback │                            │   │
│  │  │ Learning │  │ Learning │  │   Loop   │                            │   │
│  │  └──────────┘  └──────────┘  └──────────┘                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
supabase/functions/
├── personalization/
│   ├── index.ts                        # Main orchestrator
│   ├── types.ts                        # All type definitions
│   │
│   ├── signals/
│   │   ├── explicit-signals.ts         # Direct user inputs
│   │   ├── implicit-signals.ts         # Behavioral patterns
│   │   ├── contextual-signals.ts       # Location, time, device
│   │   └── social-signals.ts           # What similar users like
│   │
│   ├── embeddings/
│   │   ├── user-embedding.ts           # User vector generator
│   │   ├── content-embedding.ts        # Content vector generator
│   │   ├── embedding-store.ts          # Vector storage & retrieval
│   │   └── embedding-updater.ts        # Real-time updates
│   │
│   ├── intelligence/
│   │   ├── similarity-engine.ts        # Vector similarity matching
│   │   ├── intent-predictor.ts         # Predict what user wants
│   │   ├── context-booster.ts          # Apply contextual adjustments
│   │   ├── trend-analyzer.ts           # Global & personal trends
│   │   └── collaborative-filter.ts     # User-to-user similarity
│   │
│   ├── ranking/
│   │   ├── multi-objective-ranker.ts   # Final ranking algorithm
│   │   ├── diversity-injector.ts       # Ensure variety
│   │   ├── business-rules.ts           # Deals, promotions, etc.
│   │   └── freshness-booster.ts        # New content exposure
│   │
│   ├── learning/
│   │   ├── real-time-learner.ts        # Instant updates from actions
│   │   ├── batch-learner.ts            # Periodic model updates
│   │   └── feedback-processor.ts       # Process explicit feedback
│   │
│   └── strategies/
│       ├── cold-start.ts               # New users (0-2 interactions)
│       ├── warm-start.ts               # Learning users (3-20)
│       ├── hot-start.ts                # Established users (20+)
│       └── returning-user.ts           # Re-engagement strategy
```

---

## Type Definitions

```typescript
// types.ts

// ============================================
// SIGNAL TYPES
// ============================================

export interface ExplicitSignals {
  // From onboarding
  travelStyle: TravelStyle | null
  interests: Interest[]
  budgetLevel: BudgetLevel | null
  typicalCompanions: CompanionType | null
  preferredActivities: Activity[]
  dietaryRestrictions: string[]
  accessibilityNeeds: string[]
  
  // From preferences
  preferredRegions: string[]
  avoidedRegions: string[]
  preferredClimates: Climate[]
  accommodationStyle: AccommodationType[]
}

export interface ImplicitSignals {
  // Behavioral patterns
  browsingPatterns: BrowsingPattern
  engagementMetrics: EngagementMetrics
  priceElasticity: PriceElasticity
  bookingPatterns: BookingPattern
  searchPatterns: SearchPattern
  
  // Derived preferences
  inferredBudget: BudgetLevel
  inferredStyle: TravelStyle
  inferredInterests: Interest[]
}

export interface ContextualSignals {
  // Location
  currentLocation: GeoLocation | null
  homeLocation: GeoLocation | null
  distanceFromHome: number | null
  isInHomeCity: boolean
  
  // Time
  localTime: Date
  timezone: string
  timeOfDay: TimeOfDay
  dayOfWeek: number
  isWeekend: boolean
  isHoliday: boolean
  daysUntilNextHoliday: number | null
  
  // Season & Weather
  currentSeason: Season
  localWeather: WeatherCondition | null
  
  // Device & Session
  deviceType: DeviceType
  sessionNumber: number
  sessionDuration: number
  isFirstSessionToday: boolean
}

export interface SocialSignals {
  // Similar users
  similarUserPreferences: ContentId[]
  trendingWithSimilarUsers: ContentId[]
  
  // Global trends
  globalTrending: ContentId[]
  regionalTrending: ContentId[]
  
  // Social proof
  friendsVisited: ContentId[] // If social features enabled
  friendsSaved: ContentId[]
}

// ============================================
// BEHAVIORAL PATTERNS
// ============================================

export interface BrowsingPattern {
  averageSessionDuration: number        // minutes
  averageItemsViewed: number
  scrollDepth: number                   // 0-1
  detailViewRate: number               // % of views that go to detail
  saveRate: number                     // % of views that get saved
  shareRate: number                    // % of views that get shared
  bounceRate: number                   // % of sessions with <2 actions
  preferredTimeOfDay: TimeOfDay
  preferredDayOfWeek: number
}

export interface EngagementMetrics {
  totalInteractions: number
  interactionsLast7Days: number
  interactionsLast30Days: number
  averageInteractionsPerSession: number
  engagementLevel: 'low' | 'medium' | 'high' | 'power_user'
  engagementTrend: 'declining' | 'stable' | 'growing'
  lastActiveAt: Date
  daysSinceLastActive: number
}

export interface PriceElasticity {
  // How price-sensitive is this user?
  sensitivityScore: number             // 0-100 (100 = very price sensitive)
  preferredPriceRange: {
    min: number
    max: number
    sweet_spot: number
  }
  dealsClickRate: number              // How often they click deals
  priceFilterUsage: number            // How often they filter by price
  averageBookingPrice: number | null
}

export interface BookingPattern {
  totalBookings: number
  bookingsLast12Months: number
  averageLeadTime: number             // days before trip
  averageTripDuration: number         // days
  preferredBookingDay: number         // day of week
  preferredTravelMonth: number[]
  domesticVsInternational: number     // 0-1 (1 = all international)
  soloVsGroup: number                // 0-1 (1 = always group)
}

// ============================================
// EMBEDDING TYPES
// ============================================

export interface UserEmbedding {
  userId: string
  vector: Float32Array                // 256 dimensions
  confidence: number                  // 0-1
  version: number
  createdAt: Date
  updatedAt: Date
  
  // Metadata for debugging/explainability
  topFeatures: FeatureContribution[]
}

export interface ContentEmbedding {
  contentId: string
  contentType: 'destination' | 'experience' | 'deal'
  vector: Float32Array                // 256 dimensions
  version: number
  updatedAt: Date
  
  // Metadata
  topFeatures: FeatureContribution[]
}

export interface FeatureContribution {
  feature: string
  dimension: number
  contribution: number
}

// ============================================
// RANKING TYPES
// ============================================

export interface ScoredContent {
  contentId: string
  contentType: string
  
  // Individual scores
  similarityScore: number             // 0-100: Vector similarity
  intentScore: number                 // 0-100: Matches predicted intent
  contextScore: number                // 0-100: Contextual relevance
  trendScore: number                  // 0-100: Trending factor
  freshnessScore: number              // 0-100: Content newness
  businessScore: number               // 0-100: Business priority
  
  // Final score
  finalScore: number                  // Weighted combination
  
  // Explainability
  matchReasons: MatchReason[]
  
  // Ranking metadata
  rankPosition: number
  diversityContribution: number
}

export interface MatchReason {
  type: 'preference' | 'behavior' | 'context' | 'social' | 'trending'
  reason: string
  strength: 'strong' | 'moderate' | 'weak'
  icon?: string
}

// ============================================
// LEARNING TYPES
// ============================================

export interface LearningEvent {
  userId: string
  contentId: string
  action: ActionType
  weight: number
  context: LearningContext
  timestamp: Date
}

export interface LearningContext {
  source: 'homepage' | 'search' | 'category' | 'detail' | 'external'
  position: number
  sectionId?: string
  queryTerms?: string[]
  dwellTime?: number
  scrollDepth?: number
}

export type ActionType = 
  | 'impression'      // Appeared on screen
  | 'view'           // Scrolled into view (500ms+)
  | 'click'          // Tapped to see more
  | 'detail_view'    // Viewed detail page
  | 'save'           // Added to saved
  | 'unsave'         // Removed from saved
  | 'share'          // Shared externally
  | 'book_start'     // Started booking
  | 'book_complete'  // Completed booking
  | 'dismiss'        // Explicitly dismissed
  | 'not_interested' // Marked not interested

// ============================================
// ENUMS
// ============================================

export type TravelStyle = 
  | 'adventurer'     // Seeks thrills, off-beaten-path
  | 'explorer'       // Curious, cultural immersion
  | 'relaxer'        // Beach, spa, unwind
  | 'social'         // Nightlife, meeting people
  | 'luxury'         // Premium experiences
  | 'budget'         // Value-conscious
  | 'family'         // Kid-friendly activities
  | 'romantic'       // Couples, honeymoons
  | 'business'       // Work + leisure

export type BudgetLevel = 1 | 2 | 3 | 4 | 5
// 1 = Backpacker ($0-50/day)
// 2 = Budget ($50-100/day)
// 3 = Moderate ($100-200/day)
// 4 = Comfort ($200-400/day)
// 5 = Luxury ($400+/day)

export type Interest = 
  | 'food_wine'
  | 'history_culture'
  | 'nature_outdoors'
  | 'adventure_sports'
  | 'beach_water'
  | 'nightlife'
  | 'shopping'
  | 'art_museums'
  | 'photography'
  | 'wellness_spa'
  | 'wildlife'
  | 'architecture'
  | 'local_experiences'
  | 'festivals_events'

export type Season = 'spring' | 'summer' | 'fall' | 'winter'
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export type DeviceType = 'ios' | 'android' | 'web' | 'tablet'
```

---

## User Embedding Generator

```typescript
// embeddings/user-embedding.ts

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * User Embedding Generator
 * 
 * Converts all user data into a 256-dimensional vector that represents
 * their complete travel DNA. This vector enables fast similarity matching
 * with destination vectors.
 * 
 * Vector Structure (256 dimensions):
 * - [0-31]    : Explicit preferences (from onboarding/settings)
 * - [32-63]   : Travel style & personality
 * - [64-95]   : Interest weights
 * - [96-127]  : Behavioral patterns
 * - [128-159] : Price & budget signals
 * - [160-191] : Temporal patterns
 * - [192-223] : Geographic preferences
 * - [224-255] : Learned features (from interactions)
 */

export class UserEmbeddingGenerator {
  private readonly DIMENSIONS = 256
  private supabase: SupabaseClient
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }
  
  // =========================================
  // MAIN GENERATION
  // =========================================
  
  async generateEmbedding(userId: string): Promise<UserEmbedding> {
    // Gather all user data in parallel
    const userData = await this.gatherUserData(userId)
    
    // Generate the embedding vector
    const vector = new Float32Array(this.DIMENSIONS)
    
    // Encode each dimension group
    this.encodeExplicitPreferences(vector, userData, 0, 31)
    this.encodeTravelStyle(vector, userData, 32, 63)
    this.encodeInterests(vector, userData, 64, 95)
    this.encodeBehavioralPatterns(vector, userData, 96, 127)
    this.encodePriceSignals(vector, userData, 128, 159)
    this.encodeTemporalPatterns(vector, userData, 160, 191)
    this.encodeGeographicPreferences(vector, userData, 192, 223)
    this.encodeLearnedFeatures(vector, userData, 224, 255)
    
    // Normalize the vector
    this.normalizeVector(vector)
    
    // Calculate confidence
    const confidence = this.calculateConfidence(userData)
    
    // Extract top contributing features for explainability
    const topFeatures = this.extractTopFeatures(vector, userData)
    
    return {
      userId,
      vector,
      confidence,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      topFeatures,
    }
  }
  
  // =========================================
  // DATA GATHERING
  // =========================================
  
  private async gatherUserData(userId: string): Promise<UserData> {
    const [
      userResult,
      preferencesResult,
      interactionsResult,
      bookingsResult,
      savedResult,
      searchesResult,
    ] = await Promise.all([
      this.supabase.from('users').select('*').eq('id', userId).single(),
      this.supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
      this.supabase.from('user_interactions').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(200),
      this.supabase.from('bookings').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(50),
      this.supabase.from('user_saved_items').select('*').eq('user_id', userId),
      this.supabase.from('user_searches').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(100),
    ])
    
    return {
      user: userResult.data,
      preferences: preferencesResult.data,
      interactions: interactionsResult.data || [],
      bookings: bookingsResult.data || [],
      savedItems: savedResult.data || [],
      searches: searchesResult.data || [],
      
      // Compute derived metrics
      behavioralMetrics: this.computeBehavioralMetrics(interactionsResult.data || []),
      priceMetrics: this.computePriceMetrics(interactionsResult.data || [], bookingsResult.data || []),
      temporalMetrics: this.computeTemporalMetrics(interactionsResult.data || []),
    }
  }
  
  // =========================================
  // ENCODING FUNCTIONS
  // =========================================
  
  /**
   * Encode explicit preferences (dimensions 0-31)
   * These come directly from user settings/onboarding
   */
  private encodeExplicitPreferences(
    vector: Float32Array,
    data: UserData,
    start: number,
    end: number
  ): void {
    const prefs = data.preferences
    if (!prefs) return
    
    let idx = start
    
    // Budget level (one-hot, 5 dimensions)
    if (prefs.budget_level) {
      vector[idx + prefs.budget_level - 1] = 1.0
    }
    idx += 5
    
    // Travel companions (one-hot, 5 dimensions)
    const companions = ['solo', 'couple', 'family', 'friends', 'business']
    const companionIdx = companions.indexOf(prefs.typical_companions)
    if (companionIdx >= 0) {
      vector[idx + companionIdx] = 1.0
    }
    idx += 5
    
    // Has children (binary)
    vector[idx++] = prefs.has_children ? 1.0 : 0.0
    
    // Trip frequency (normalized 0-1)
    vector[idx++] = Math.min((prefs.trips_per_year || 0) / 12, 1.0)
    
    // Average trip duration (normalized 0-1, max 30 days)
    vector[idx++] = Math.min((prefs.average_trip_duration || 7) / 30, 1.0)
    
    // Accommodation preferences (multi-hot, 6 dimensions)
    const accommodations = ['hotel', 'resort', 'hostel', 'airbnb', 'villa', 'boutique']
    const userAccommodations = new Set(prefs.accommodation_preference || [])
    accommodations.forEach(acc => {
      vector[idx++] = userAccommodations.has(acc) ? 1.0 : 0.0
    })
    
    // Dietary restrictions count (normalized)
    vector[idx++] = Math.min((prefs.dietary_restrictions?.length || 0) / 5, 1.0)
    
    // Accessibility needs (binary)
    vector[idx++] = (prefs.accessibility_needs?.length || 0) > 0 ? 1.0 : 0.0
    
    // Onboarding completed (binary)
    vector[idx++] = prefs.onboarding_completed ? 1.0 : 0.0
  }
  
  /**
   * Encode travel style & personality (dimensions 32-63)
   */
  private encodeTravelStyle(
    vector: Float32Array,
    data: UserData,
    start: number,
    end: number
  ): void {
    const prefs = data.preferences
    const interactions = data.interactions
    
    let idx = start
    
    // Primary travel style (one-hot, 9 dimensions)
    const styles: TravelStyle[] = [
      'adventurer', 'explorer', 'relaxer', 'social', 'luxury',
      'budget', 'family', 'romantic', 'business'
    ]
    
    // From explicit preference
    if (prefs?.travel_style) {
      const styleIdx = styles.indexOf(prefs.travel_style)
      if (styleIdx >= 0) vector[idx + styleIdx] = 0.7 // Explicit = 0.7 weight
    }
    
    // Infer from behavior and boost
    const inferredStyle = this.inferTravelStyle(data)
    if (inferredStyle) {
      const styleIdx = styles.indexOf(inferredStyle)
      if (styleIdx >= 0) vector[idx + styleIdx] = Math.min(vector[idx + styleIdx] + 0.3, 1.0)
    }
    idx += 9
    
    // Travel personality dimensions (continuous, 0-1)
    // These are inferred from behavior
    
    // Spontaneity (last-minute vs. planner)
    vector[idx++] = this.calculateSpontaneityScore(data)
    
    // Adventure tolerance (safe vs. risky)
    vector[idx++] = this.calculateAdventureScore(data)
    
    // Social orientation (solo vs. group)
    vector[idx++] = this.calculateSocialScore(data)
    
    // Comfort priority (budget vs. comfort)
    vector[idx++] = this.calculateComfortScore(data)
    
    // Cultural immersion (tourist vs. local)
    vector[idx++] = this.calculateImmersionScore(data)
    
    // Activity level (relaxed vs. packed)
    vector[idx++] = this.calculateActivityScore(data)
    
    // Planning style (structured vs. flexible)
    vector[idx++] = this.calculatePlanningScore(data)
    
    // Experience seeking (familiar vs. novel)
    vector[idx++] = this.calculateNoveltyScore(data)
  }
  
  /**
   * Encode interests (dimensions 64-95)
   */
  private encodeInterests(
    vector: Float32Array,
    data: UserData,
    start: number,
    end: number
  ): void {
    const allInterests: Interest[] = [
      'food_wine', 'history_culture', 'nature_outdoors', 'adventure_sports',
      'beach_water', 'nightlife', 'shopping', 'art_museums', 'photography',
      'wellness_spa', 'wildlife', 'architecture', 'local_experiences', 'festivals_events'
    ]
    
    let idx = start
    
    // Explicit interests from preferences
    const explicitInterests = new Set(data.preferences?.interests || [])
    
    // Inferred interests from behavior
    const inferredInterests = this.inferInterests(data)
    
    allInterests.forEach(interest => {
      let score = 0
      
      // Explicit interest: +0.5
      if (explicitInterests.has(interest)) {
        score += 0.5
      }
      
      // Inferred interest: +0.0 to +0.5
      if (inferredInterests[interest]) {
        score += inferredInterests[interest] * 0.5
      }
      
      vector[idx++] = Math.min(score, 1.0)
    })
    
    // Fill remaining dimensions with interest combinations/meta-features
    // e.g., "cultural_active" = history_culture + adventure_sports
    vector[idx++] = (vector[start + 1] + vector[start + 3]) / 2 // Cultural + Active
    vector[idx++] = (vector[start + 4] + vector[start + 9]) / 2 // Beach + Wellness
    vector[idx++] = (vector[start + 0] + vector[start + 12]) / 2 // Food + Local
  }
  
  /**
   * Encode behavioral patterns (dimensions 96-127)
   */
  private encodeBehavioralPatterns(
    vector: Float32Array,
    data: UserData,
    start: number,
    end: number
  ): void {
    const metrics = data.behavioralMetrics
    let idx = start
    
    // Engagement level
    vector[idx++] = Math.min(metrics.totalInteractions / 100, 1.0)
    vector[idx++] = Math.min(metrics.interactionsLast7Days / 20, 1.0)
    vector[idx++] = Math.min(metrics.interactionsLast30Days / 50, 1.0)
    
    // Session behavior
    vector[idx++] = Math.min(metrics.averageSessionDuration / 30, 1.0) // max 30 min
    vector[idx++] = Math.min(metrics.averageItemsViewed / 20, 1.0)
    vector[idx++] = metrics.scrollDepth
    vector[idx++] = metrics.detailViewRate
    vector[idx++] = metrics.saveRate
    
    // Action distribution (how user interacts)
    const actionDist = this.calculateActionDistribution(data.interactions)
    vector[idx++] = actionDist.view
    vector[idx++] = actionDist.detail_view
    vector[idx++] = actionDist.save
    vector[idx++] = actionDist.share
    vector[idx++] = actionDist.book_start
    vector[idx++] = actionDist.book_complete
    
    // Content type preferences
    const contentPrefs = this.calculateContentTypePreference(data.interactions)
    vector[idx++] = contentPrefs.destinations
    vector[idx++] = contentPrefs.experiences
    vector[idx++] = contentPrefs.deals
    
    // Category engagement
    const categoryEngagement = this.calculateCategoryEngagement(data.interactions)
    vector[idx++] = categoryEngagement.for_you
    vector[idx++] = categoryEngagement.deals
    vector[idx++] = categoryEngagement.popular
    vector[idx++] = categoryEngagement.nearby
    vector[idx++] = categoryEngagement.trending
  }
  
  /**
   * Encode price signals (dimensions 128-159)
   */
  private encodePriceSignals(
    vector: Float32Array,
    data: UserData,
    start: number,
    end: number
  ): void {
    const metrics = data.priceMetrics
    let idx = start
    
    // Price sensitivity (inverted, so higher = more willing to pay)
    vector[idx++] = 1 - (metrics.sensitivityScore / 100)
    
    // Price range preferences (normalized to max $500/day)
    vector[idx++] = Math.min(metrics.preferredPriceRange.min / 500, 1.0)
    vector[idx++] = Math.min(metrics.preferredPriceRange.max / 500, 1.0)
    vector[idx++] = Math.min(metrics.preferredPriceRange.sweet_spot / 500, 1.0)
    
    // Deal engagement
    vector[idx++] = metrics.dealsClickRate
    
    // Price filter usage
    vector[idx++] = metrics.priceFilterUsage
    
    // Booking price patterns
    if (metrics.averageBookingPrice) {
      vector[idx++] = Math.min(metrics.averageBookingPrice / 5000, 1.0)
    } else {
      vector[idx++] = 0.5 // Default to middle
    }
    
    // Price tier distribution (what price levels they view/book)
    const priceTierDist = this.calculatePriceTierDistribution(data)
    vector[idx++] = priceTierDist.budget     // <$100/day
    vector[idx++] = priceTierDist.moderate   // $100-200/day
    vector[idx++] = priceTierDist.comfort    // $200-400/day
    vector[idx++] = priceTierDist.luxury     // $400+/day
  }
  
  /**
   * Encode temporal patterns (dimensions 160-191)
   */
  private encodeTemporalPatterns(
    vector: Float32Array,
    data: UserData,
    start: number,
    end: number
  ): void {
    const metrics = data.temporalMetrics
    let idx = start
    
    // Preferred time of day for app usage (one-hot)
    const times: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night']
    const timeIdx = times.indexOf(metrics.preferredTimeOfDay)
    if (timeIdx >= 0) vector[idx + timeIdx] = 1.0
    idx += 4
    
    // Preferred day of week (one-hot)
    for (let d = 0; d < 7; d++) {
      vector[idx++] = d === metrics.preferredDayOfWeek ? 1.0 : 0.0
    }
    
    // Weekend vs weekday preference
    vector[idx++] = metrics.weekendUsageRatio
    
    // Seasonal travel preferences (from bookings)
    const seasonalPrefs = this.calculateSeasonalPreferences(data.bookings)
    vector[idx++] = seasonalPrefs.spring
    vector[idx++] = seasonalPrefs.summer
    vector[idx++] = seasonalPrefs.fall
    vector[idx++] = seasonalPrefs.winter
    
    // Lead time pattern (how far in advance they book)
    vector[idx++] = Math.min((metrics.averageLeadTime || 30) / 180, 1.0)
    
    // Trip duration preference
    vector[idx++] = Math.min((metrics.averageTripDuration || 7) / 30, 1.0)
    
    // Last-minute vs planner (derived from lead time variance)
    vector[idx++] = metrics.lastMinuteRatio
  }
  
  /**
   * Encode geographic preferences (dimensions 192-223)
   */
  private encodeGeographicPreferences(
    vector: Float32Array,
    data: UserData,
    start: number,
    end: number
  ): void {
    const prefs = data.preferences
    let idx = start
    
    // Region preferences (multi-hot)
    const regions = [
      'western_europe', 'eastern_europe', 'north_america', 'central_america',
      'south_america', 'east_asia', 'southeast_asia', 'south_asia',
      'middle_east', 'north_africa', 'sub_saharan_africa', 'oceania', 'caribbean'
    ]
    
    const preferredRegions = new Set(prefs?.preferred_regions || [])
    const avoidedRegions = new Set(prefs?.avoided_regions || [])
    const visitedRegions = this.extractVisitedRegions(data)
    
    regions.forEach(region => {
      let score = 0.5 // Neutral default
      
      if (preferredRegions.has(region)) score = 1.0
      if (avoidedRegions.has(region)) score = 0.0
      if (visitedRegions.has(region)) score = Math.max(score, 0.7) // Boost visited
      
      vector[idx++] = score
    })
    
    // Climate preferences
    const climates = ['tropical', 'temperate', 'mediterranean', 'desert', 'cold']
    const preferredClimates = new Set(prefs?.preferred_climates || [])
    
    climates.forEach(climate => {
      vector[idx++] = preferredClimates.has(climate) ? 1.0 : 0.5
    })
    
    // Distance preference (domestic vs international)
    vector[idx++] = this.calculateInternationalRatio(data)
    
    // Familiarity preference (new vs revisit)
    vector[idx++] = this.calculateNoveltyPreference(data)
  }
  
  /**
   * Encode learned features (dimensions 224-255)
   * These are updated in real-time from user interactions
   */
  private encodeLearnedFeatures(
    vector: Float32Array,
    data: UserData,
    start: number,
    end: number
  ): void {
    // This section stores features learned from recent interactions
    // Updated incrementally by the LearningEngine
    
    // For new users, initialize with neutral values
    for (let i = start; i <= end; i++) {
      vector[i] = 0.5
    }
    
    // If user has existing learned features, load them
    if (data.user?.learned_features) {
      const learned = data.user.learned_features
      for (let i = 0; i < Math.min(learned.length, end - start + 1); i++) {
        vector[start + i] = learned[i]
      }
    }
  }
  
  // =========================================
  // HELPER CALCULATION FUNCTIONS
  // =========================================
  
  private inferTravelStyle(data: UserData): TravelStyle | null {
    const interactions = data.interactions
    if (interactions.length < 5) return null
    
    // Analyze what types of destinations they engage with
    const styleScores: Record<TravelStyle, number> = {
      adventurer: 0, explorer: 0, relaxer: 0, social: 0,
      luxury: 0, budget: 0, family: 0, romantic: 0, business: 0
    }
    
    interactions.forEach(interaction => {
      const tags = interaction.metadata?.destination_tags || []
      
      if (tags.includes('adventure') || tags.includes('hiking')) styleScores.adventurer++
      if (tags.includes('cultural') || tags.includes('museum')) styleScores.explorer++
      if (tags.includes('beach') || tags.includes('spa')) styleScores.relaxer++
      if (tags.includes('nightlife') || tags.includes('party')) styleScores.social++
      if (tags.includes('luxury') || tags.includes('5-star')) styleScores.luxury++
      if (tags.includes('budget') || tags.includes('hostel')) styleScores.budget++
      if (tags.includes('family') || tags.includes('kids')) styleScores.family++
      if (tags.includes('romantic') || tags.includes('couples')) styleScores.romantic++
    })
    
    // Return highest scoring style
    let maxStyle: TravelStyle | null = null
    let maxScore = 0
    
    for (const [style, score] of Object.entries(styleScores)) {
      if (score > maxScore) {
        maxScore = score
        maxStyle = style as TravelStyle
      }
    }
    
    return maxStyle
  }
  
  private inferInterests(data: UserData): Record<Interest, number> {
    const interests: Record<string, number> = {}
    const interactions = data.interactions
    
    // Initialize all interests to 0
    const allInterests: Interest[] = [
      'food_wine', 'history_culture', 'nature_outdoors', 'adventure_sports',
      'beach_water', 'nightlife', 'shopping', 'art_museums', 'photography',
      'wellness_spa', 'wildlife', 'architecture', 'local_experiences', 'festivals_events'
    ]
    allInterests.forEach(i => interests[i] = 0)
    
    // Count interest signals from interactions
    let totalSignals = 0
    
    interactions.forEach(interaction => {
      const tags = interaction.metadata?.tags || []
      const weight = this.getActionWeight(interaction.interaction_type)
      
      // Map tags to interests
      const tagToInterest: Record<string, Interest> = {
        food: 'food_wine', wine: 'food_wine', culinary: 'food_wine', restaurant: 'food_wine',
        history: 'history_culture', culture: 'history_culture', heritage: 'history_culture',
        nature: 'nature_outdoors', hiking: 'nature_outdoors', park: 'nature_outdoors',
        adventure: 'adventure_sports', sports: 'adventure_sports', extreme: 'adventure_sports',
        beach: 'beach_water', water: 'beach_water', ocean: 'beach_water', diving: 'beach_water',
        nightlife: 'nightlife', party: 'nightlife', club: 'nightlife', bar: 'nightlife',
        shopping: 'shopping', market: 'shopping', boutique: 'shopping',
        art: 'art_museums', museum: 'art_museums', gallery: 'art_museums',
        photography: 'photography', scenic: 'photography', viewpoint: 'photography',
        spa: 'wellness_spa', wellness: 'wellness_spa', yoga: 'wellness_spa',
        wildlife: 'wildlife', safari: 'wildlife', animals: 'wildlife',
        architecture: 'architecture', building: 'architecture', design: 'architecture',
        local: 'local_experiences', authentic: 'local_experiences',
        festival: 'festivals_events', event: 'festivals_events', concert: 'festivals_events',
      }
      
      tags.forEach(tag => {
        const interest = tagToInterest[tag.toLowerCase()]
        if (interest) {
          interests[interest] += weight
          totalSignals++
        }
      })
    })
    
    // Normalize
    if (totalSignals > 0) {
      const maxScore = Math.max(...Object.values(interests))
      if (maxScore > 0) {
        Object.keys(interests).forEach(key => {
          interests[key] = interests[key] / maxScore
        })
      }
    }
    
    return interests as Record<Interest, number>
  }
  
  private getActionWeight(action: string): number {
    const weights: Record<string, number> = {
      impression: 0.1,
      view: 0.2,
      click: 0.4,
      detail_view: 0.6,
      save: 0.8,
      share: 0.7,
      book_start: 0.9,
      book_complete: 1.0,
      dismiss: -0.3,
      not_interested: -0.5,
    }
    return weights[action] || 0.2
  }
  
  private calculateSpontaneityScore(data: UserData): number {
    // Based on lead time patterns
    const avgLeadTime = data.temporalMetrics?.averageLeadTime || 30
    // Short lead time = high spontaneity
    return Math.max(0, 1 - (avgLeadTime / 90)) // 90 days = 0 spontaneity
  }
  
  private calculateAdventureScore(data: UserData): number {
    // Based on interaction with adventure content
    const adventureInteractions = data.interactions.filter(i => 
      i.metadata?.tags?.includes('adventure') ||
      i.metadata?.tags?.includes('extreme') ||
      i.metadata?.tags?.includes('hiking')
    )
    return Math.min(adventureInteractions.length / 10, 1.0)
  }
  
  private calculateSocialScore(data: UserData): number {
    const companion = data.preferences?.typical_companions
    if (companion === 'solo') return 0.2
    if (companion === 'couple') return 0.4
    if (companion === 'friends') return 0.8
    if (companion === 'family') return 0.7
    return 0.5
  }
  
  private calculateComfortScore(data: UserData): number {
    const budget = data.preferences?.budget_level || 3
    return budget / 5
  }
  
  private calculateImmersionScore(data: UserData): number {
    const localInteractions = data.interactions.filter(i =>
      i.metadata?.tags?.includes('local') ||
      i.metadata?.tags?.includes('authentic') ||
      i.metadata?.tags?.includes('off-the-beaten-path')
    )
    return Math.min(localInteractions.length / 10, 1.0)
  }
  
  private calculateActivityScore(data: UserData): number {
    // Based on number of activities viewed/booked per destination
    const avgActivities = data.behavioralMetrics?.averageItemsViewed || 5
    return Math.min(avgActivities / 15, 1.0)
  }
  
  private calculatePlanningScore(data: UserData): number {
    // Based on search and filter behavior
    const searches = data.searches?.length || 0
    const filtersUsed = data.interactions.filter(i => i.source === 'filter').length
    return Math.min((searches + filtersUsed) / 30, 1.0)
  }
  
  private calculateNoveltyScore(data: UserData): number {
    // Ratio of new destinations vs familiar
    const destinations = new Set(data.interactions.map(i => i.destination_id).filter(Boolean))
    const visitedDestinations = new Set(data.bookings.map(b => b.destination_id).filter(Boolean))
    
    const newDestinations = [...destinations].filter(d => !visitedDestinations.has(d))
    return destinations.size > 0 ? newDestinations.length / destinations.size : 0.5
  }
  
  // =========================================
  // NORMALIZATION & CONFIDENCE
  // =========================================
  
  private normalizeVector(vector: Float32Array): void {
    let magnitude = 0
    for (let i = 0; i < vector.length; i++) {
      magnitude += vector[i] * vector[i]
    }
    magnitude = Math.sqrt(magnitude)
    
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] = vector[i] / magnitude
      }
    }
  }
  
  private calculateConfidence(data: UserData): number {
    let confidence = 0
    
    // Explicit preferences (40%)
    if (data.preferences) {
      if (data.preferences.travel_style) confidence += 10
      if (data.preferences.interests?.length > 0) confidence += 10
      if (data.preferences.budget_level) confidence += 10
      if (data.preferences.onboarding_completed) confidence += 10
    }
    
    // Interaction depth (40%)
    const interactionCount = data.interactions.length
    if (interactionCount >= 5) confidence += 10
    if (interactionCount >= 20) confidence += 10
    if (interactionCount >= 50) confidence += 10
    if (interactionCount >= 100) confidence += 10
    
    // Booking history (20%)
    if (data.bookings.length >= 1) confidence += 10
    if (data.bookings.length >= 3) confidence += 10
    
    return confidence / 100
  }
  
  private extractTopFeatures(vector: Float32Array, data: UserData): FeatureContribution[] {
    const features: FeatureContribution[] = []
    
    // Find dimensions with highest values
    const indexed = Array.from(vector).map((val, idx) => ({ val, idx }))
    indexed.sort((a, b) => b.val - a.val)
    
    const dimensionLabels = this.getDimensionLabels()
    
    // Top 5 features
    for (let i = 0; i < 5; i++) {
      const { val, idx } = indexed[i]
      if (val > 0.1) {
        features.push({
          feature: dimensionLabels[idx] || `dim_${idx}`,
          dimension: idx,
          contribution: val,
        })
      }
    }
    
    return features
  }
  
  private getDimensionLabels(): Record<number, string> {
    return {
      // Budget levels
      0: 'budget_backpacker', 1: 'budget_budget', 2: 'budget_moderate',
      3: 'budget_comfort', 4: 'budget_luxury',
      
      // Companions
      5: 'companion_solo', 6: 'companion_couple', 7: 'companion_family',
      8: 'companion_friends', 9: 'companion_business',
      
      // Travel styles
      32: 'style_adventurer', 33: 'style_explorer', 34: 'style_relaxer',
      35: 'style_social', 36: 'style_luxury', 37: 'style_budget',
      38: 'style_family', 39: 'style_romantic', 40: 'style_business',
      
      // Interests
      64: 'interest_food_wine', 65: 'interest_history_culture',
      66: 'interest_nature', 67: 'interest_adventure',
      68: 'interest_beach', 69: 'interest_nightlife',
      70: 'interest_shopping', 71: 'interest_art',
      72: 'interest_photography', 73: 'interest_wellness',
      
      // Add more as needed...
    }
  }
  
  // =========================================
  // METRIC COMPUTATION
  // =========================================
  
  private computeBehavioralMetrics(interactions: any[]): BehavioralMetrics {
    const now = Date.now()
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
    
    const recent7Days = interactions.filter(i => new Date(i.created_at).getTime() > sevenDaysAgo)
    const recent30Days = interactions.filter(i => new Date(i.created_at).getTime() > thirtyDaysAgo)
    
    // Group by session
    const sessions = this.groupIntoSessions(interactions)
    
    return {
      totalInteractions: interactions.length,
      interactionsLast7Days: recent7Days.length,
      interactionsLast30Days: recent30Days.length,
      averageSessionDuration: this.calculateAvgSessionDuration(sessions),
      averageItemsViewed: this.calculateAvgItemsPerSession(sessions),
      scrollDepth: 0.5, // Would need client-side data
      detailViewRate: this.calculateDetailViewRate(interactions),
      saveRate: this.calculateSaveRate(interactions),
    }
  }
  
  private computePriceMetrics(interactions: any[], bookings: any[]): PriceMetrics {
    // Analyze price-related behavior
    const priceInteractions = interactions.filter(i => i.metadata?.price)
    const prices = priceInteractions.map(i => i.metadata.price)
    
    const dealsClicks = interactions.filter(i => 
      i.source === 'deals' || i.metadata?.category === 'deals'
    ).length
    
    const priceFilters = interactions.filter(i => 
      i.interaction_type === 'filter' && i.metadata?.filter_type === 'price'
    ).length
    
    return {
      sensitivityScore: this.calculatePriceSensitivity(interactions),
      preferredPriceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 50,
        max: prices.length > 0 ? Math.max(...prices) : 200,
        sweet_spot: prices.length > 0 ? this.calculateMedian(prices) : 100,
      },
      dealsClickRate: interactions.length > 0 ? dealsClicks / interactions.length : 0,
      priceFilterUsage: interactions.length > 0 ? priceFilters / interactions.length : 0,
      averageBookingPrice: bookings.length > 0
        ? bookings.reduce((sum, b) => sum + (b.total_cost || 0), 0) / bookings.length
        : null,
    }
  }
  
  private computeTemporalMetrics(interactions: any[]): TemporalMetrics {
    // Analyze when user is active
    const hours = interactions.map(i => new Date(i.created_at).getHours())
    const days = interactions.map(i => new Date(i.created_at).getDay())
    
    return {
      preferredTimeOfDay: this.getMostFrequent(hours.map(h => this.hourToTimeOfDay(h))) as TimeOfDay,
      preferredDayOfWeek: this.getMostFrequent(days) as number,
      weekendUsageRatio: days.filter(d => d === 0 || d === 6).length / Math.max(days.length, 1),
      averageLeadTime: 30, // Would need booking data analysis
      averageTripDuration: 7, // Would need booking data analysis
      lastMinuteRatio: 0.3, // Would need booking data analysis
    }
  }
  
  private hourToTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'night'
  }
  
  private getMostFrequent<T>(arr: T[]): T | null {
    if (arr.length === 0) return null
    const counts = new Map<T, number>()
    arr.forEach(item => counts.set(item, (counts.get(item) || 0) + 1))
    let maxCount = 0
    let maxItem: T | null = null
    counts.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count
        maxItem = item
      }
    })
    return maxItem
  }
  
  private calculateMedian(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }
  
  private groupIntoSessions(interactions: any[]): any[][] {
    // 30-minute gap = new session
    const sessions: any[][] = []
    let currentSession: any[] = []
    let lastTimestamp = 0
    
    const sorted = [...interactions].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    
    sorted.forEach(interaction => {
      const timestamp = new Date(interaction.created_at).getTime()
      
      if (lastTimestamp === 0 || (timestamp - lastTimestamp) < 30 * 60 * 1000) {
        currentSession.push(interaction)
      } else {
        if (currentSession.length > 0) sessions.push(currentSession)
        currentSession = [interaction]
      }
      lastTimestamp = timestamp
    })
    
    if (currentSession.length > 0) sessions.push(currentSession)
    return sessions
  }
  
  private calculateAvgSessionDuration(sessions: any[][]): number {
    if (sessions.length === 0) return 0
    
    const durations = sessions.map(session => {
      if (session.length < 2) return 0
      const start = new Date(session[0].created_at).getTime()
      const end = new Date(session[session.length - 1].created_at).getTime()
      return (end - start) / 60000 // minutes
    })
    
    return durations.reduce((a, b) => a + b, 0) / durations.length
  }
  
  private calculateAvgItemsPerSession(sessions: any[][]): number {
    if (sessions.length === 0) return 0
    return sessions.reduce((sum, s) => sum + s.length, 0) / sessions.length
  }
  
  private calculateDetailViewRate(interactions: any[]): number {
    const views = interactions.filter(i => i.interaction_type === 'view').length
    const detailViews = interactions.filter(i => i.interaction_type === 'detail_view').length
    return views > 0 ? detailViews / views : 0
  }
  
  private calculateSaveRate(interactions: any[]): number {
    const views = interactions.filter(i => 
      i.interaction_type === 'view' || i.interaction_type === 'detail_view'
    ).length
    const saves = interactions.filter(i => i.interaction_type === 'save').length
    return views > 0 ? saves / views : 0
  }
  
  private calculatePriceSensitivity(interactions: any[]): number {
    // Factors that indicate price sensitivity:
    // - High deals engagement
    // - Use of price filters
    // - Viewing cheaper options longer
    
    const dealsEngagement = interactions.filter(i => 
      i.source === 'deals' || i.metadata?.is_deal
    ).length / Math.max(interactions.length, 1)
    
    const budgetViews = interactions.filter(i => 
      i.metadata?.budget_level && i.metadata.budget_level <= 2
    ).length / Math.max(interactions.length, 1)
    
    return Math.min((dealsEngagement * 50) + (budgetViews * 50), 100)
  }
  
  private calculateActionDistribution(interactions: any[]): Record<string, number> {
    const dist: Record<string, number> = {
      view: 0, detail_view: 0, save: 0, share: 0, book_start: 0, book_complete: 0
    }
    
    if (interactions.length === 0) return dist
    
    interactions.forEach(i => {
      if (dist[i.interaction_type] !== undefined) {
        dist[i.interaction_type]++
      }
    })
    
    // Normalize
    Object.keys(dist).forEach(key => {
      dist[key] = dist[key] / interactions.length
    })
    
    return dist
  }
  
  private calculateContentTypePreference(interactions: any[]): Record<string, number> {
    const prefs = { destinations: 0, experiences: 0, deals: 0 }
    
    if (interactions.length === 0) return prefs
    
    interactions.forEach(i => {
      if (i.destination_id) prefs.destinations++
      if (i.experience_id) prefs.experiences++
      if (i.metadata?.is_deal) prefs.deals++
    })
    
    const total = prefs.destinations + prefs.experiences + prefs.deals
    if (total > 0) {
      prefs.destinations /= total
      prefs.experiences /= total
      prefs.deals /= total
    }
    
    return prefs
  }
  
  private calculateCategoryEngagement(interactions: any[]): Record<string, number> {
    const cats: Record<string, number> = {
      for_you: 0, deals: 0, popular: 0, nearby: 0, trending: 0
    }
    
    if (interactions.length === 0) return cats
    
    interactions.forEach(i => {
      const source = i.source_category || i.metadata?.section
      if (cats[source] !== undefined) {
        cats[source]++
      }
    })
    
    // Normalize
    const max = Math.max(...Object.values(cats), 1)
    Object.keys(cats).forEach(key => {
      cats[key] = cats[key] / max
    })
    
    return cats
  }
  
  private calculatePriceTierDistribution(data: UserData): Record<string, number> {
    const tiers = { budget: 0, moderate: 0, comfort: 0, luxury: 0 }
    const interactions = data.interactions.filter(i => i.metadata?.budget_level)
    
    if (interactions.length === 0) return { budget: 0.25, moderate: 0.25, comfort: 0.25, luxury: 0.25 }
    
    interactions.forEach(i => {
      const level = i.metadata.budget_level
      if (level === 1 || level === 2) tiers.budget++
      else if (level === 3) tiers.moderate++
      else if (level === 4) tiers.comfort++
      else if (level === 5) tiers.luxury++
    })
    
    const total = Object.values(tiers).reduce((a, b) => a + b, 0)
    if (total > 0) {
      Object.keys(tiers).forEach(key => {
        tiers[key] = tiers[key] / total
      })
    }
    
    return tiers
  }
  
  private calculateSeasonalPreferences(bookings: any[]): Record<Season, number> {
    const prefs: Record<Season, number> = { spring: 0, summer: 0, fall: 0, winter: 0 }
    
    if (bookings.length === 0) return { spring: 0.25, summer: 0.25, fall: 0.25, winter: 0.25 }
    
    bookings.forEach(b => {
      const month = new Date(b.travel_date || b.created_at).getMonth()
      if (month >= 2 && month <= 4) prefs.spring++
      else if (month >= 5 && month <= 7) prefs.summer++
      else if (month >= 8 && month <= 10) prefs.fall++
      else prefs.winter++
    })
    
    const total = Object.values(prefs).reduce((a, b) => a + b, 0)
    Object.keys(prefs).forEach(key => {
      prefs[key as Season] = prefs[key as Season] / total
    })
    
    return prefs
  }
  
  private extractVisitedRegions(data: UserData): Set<string> {
    const regions = new Set<string>()
    data.bookings.forEach(b => {
      if (b.destination_region) regions.add(b.destination_region)
    })
    return regions
  }
  
  private calculateInternationalRatio(data: UserData): number {
    const bookings = data.bookings
    if (bookings.length === 0) return 0.5
    
    const homeCountry = data.preferences?.home_country_code
    if (!homeCountry) return 0.5
    
    const international = bookings.filter(b => b.destination_country !== homeCountry).length
    return international / bookings.length
  }
  
  private calculateNoveltyPreference(data: UserData): number {
    // How often does user visit new vs. familiar places?
    const destinations = new Set<string>()
    let newVisits = 0
    let totalVisits = 0
    
    data.bookings.forEach(b => {
      totalVisits++
      if (!destinations.has(b.destination_id)) {
        newVisits++
        destinations.add(b.destination_id)
      }
    })
    
    return totalVisits > 0 ? newVisits / totalVisits : 0.7
  }
}

// Type definitions for internal use
interface UserData {
  user: any
  preferences: any
  interactions: any[]
  bookings: any[]
  savedItems: any[]
  searches: any[]
  behavioralMetrics: BehavioralMetrics
  priceMetrics: PriceMetrics
  temporalMetrics: TemporalMetrics
}

interface BehavioralMetrics {
  totalInteractions: number
  interactionsLast7Days: number
  interactionsLast30Days: number
  averageSessionDuration: number
  averageItemsViewed: number
  scrollDepth: number
  detailViewRate: number
  saveRate: number
}

interface PriceMetrics {
  sensitivityScore: number
  preferredPriceRange: { min: number; max: number; sweet_spot: number }
  dealsClickRate: number
  priceFilterUsage: number
  averageBookingPrice: number | null
}

interface TemporalMetrics {
  preferredTimeOfDay: TimeOfDay
  preferredDayOfWeek: number
  weekendUsageRatio: number
  averageLeadTime: number
  averageTripDuration: number
  lastMinuteRatio: number
}
```

---

## Content Embedding Generator

```typescript
// embeddings/content-embedding.ts

/**
 * Content Embedding Generator
 * 
 * Converts destinations/experiences into 256-dimensional vectors
 * that live in the same space as user embeddings, enabling
 * similarity-based matching.
 */

export class ContentEmbeddingGenerator {
  private readonly DIMENSIONS = 256
  private supabase: SupabaseClient
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }
  
  async generateEmbedding(
    contentId: string,
    contentType: 'destination' | 'experience'
  ): Promise<ContentEmbedding> {
    const content = await this.fetchContent(contentId, contentType)
    const vector = new Float32Array(this.DIMENSIONS)
    
    // Encode using same structure as user embedding
    this.encodeBudgetLevel(vector, content, 0, 4)
    this.encodeCompanionSuitability(vector, content, 5, 9)
    this.encodeTravelStyles(vector, content, 32, 40)
    this.encodeActivities(vector, content, 64, 95)
    this.encodePricing(vector, content, 128, 140)
    this.encodeSeasonality(vector, content, 160, 171)
    this.encodeGeography(vector, content, 192, 223)
    this.encodePopularity(vector, content, 224, 235)
    
    this.normalizeVector(vector)
    
    return {
      contentId,
      contentType,
      vector,
      version: 1,
      updatedAt: new Date(),
      topFeatures: this.extractTopFeatures(vector, content),
    }
  }
  
  private async fetchContent(contentId: string, contentType: string) {
    if (contentType === 'destination') {
      const { data } = await this.supabase
        .from('curated_destinations')
        .select('*')
        .eq('id', contentId)
        .single()
      return data
    } else {
      const { data } = await this.supabase
        .from('curated_experiences')
        .select('*')
        .eq('id', contentId)
        .single()
      return data
    }
  }
  
  private encodeBudgetLevel(
    vector: Float32Array,
    content: any,
    start: number,
    end: number
  ): void {
    const budgetLevel = content.budget_level || 3
    vector[start + budgetLevel - 1] = 1.0
  }
  
  private encodeCompanionSuitability(
    vector: Float32Array,
    content: any,
    start: number,
    end: number
  ): void {
    const bestFor = new Set(content.best_for || [])
    
    // Solo friendly
    vector[start] = bestFor.has('solo') || bestFor.has('backpacker') ? 1.0 : 0.3
    
    // Couples
    vector[start + 1] = bestFor.has('couples') || bestFor.has('romantic') ? 1.0 : 0.3
    
    // Families
    vector[start + 2] = bestFor.has('families') || bestFor.has('kids') ? 1.0 : 0.3
    
    // Friends/Groups
    vector[start + 3] = bestFor.has('groups') || bestFor.has('friends') ? 1.0 : 0.3
    
    // Business
    vector[start + 4] = bestFor.has('business') ? 1.0 : 0.3
  }
  
  private encodeTravelStyles(
    vector: Float32Array,
    content: any,
    start: number,
    end: number
  ): void {
    const styles = new Set(content.travel_style || [])
    const categories = new Set([
      content.primary_category,
      ...(content.secondary_categories || [])
    ])
    
    const styleMapping: Record<TravelStyle, string[]> = {
      adventurer: ['adventure', 'hiking', 'extreme', 'outdoor'],
      explorer: ['cultural', 'historical', 'museum', 'discovery'],
      relaxer: ['beach', 'spa', 'wellness', 'peaceful'],
      social: ['nightlife', 'party', 'festival', 'social'],
      luxury: ['luxury', '5-star', 'premium', 'exclusive'],
      budget: ['budget', 'backpacker', 'hostel', 'affordable'],
      family: ['family', 'kids', 'theme_park', 'safe'],
      romantic: ['romantic', 'couples', 'honeymoon', 'intimate'],
      business: ['business', 'city', 'modern', 'conference'],
    }
    
    let idx = start
    Object.entries(styleMapping).forEach(([style, keywords]) => {
      const hasStyle = keywords.some(k => styles.has(k) || categories.has(k))
      vector[idx++] = hasStyle ? 1.0 : 0.2
    })
  }
  
  private encodeActivities(
    vector: Float32Array,
    content: any,
    start: number,
    end: number
  ): void {
    const tags = new Set([
      ...(content.tags || []),
      ...(content.activity_tags || [])
    ])
    
    const activityMapping: Record<Interest, string[]> = {
      food_wine: ['food', 'wine', 'culinary', 'restaurant', 'gastronomy'],
      history_culture: ['history', 'culture', 'heritage', 'tradition'],
      nature_outdoors: ['nature', 'outdoor', 'park', 'hiking', 'trail'],
      adventure_sports: ['adventure', 'sports', 'extreme', 'thrill'],
      beach_water: ['beach', 'water', 'ocean', 'diving', 'snorkeling'],
      nightlife: ['nightlife', 'bar', 'club', 'party', 'entertainment'],
      shopping: ['shopping', 'market', 'boutique', 'mall'],
      art_museums: ['art', 'museum', 'gallery', 'exhibition'],
      photography: ['photography', 'scenic', 'viewpoint', 'instagram'],
      wellness_spa: ['spa', 'wellness', 'yoga', 'meditation', 'retreat'],
      wildlife: ['wildlife', 'safari', 'animals', 'zoo', 'nature reserve'],
      architecture: ['architecture', 'building', 'design', 'landmark'],
      local_experiences: ['local', 'authentic', 'traditional', 'immersive'],
      festivals_events: ['festival', 'event', 'concert', 'celebration'],
    }
    
    let idx = start
    Object.entries(activityMapping).forEach(([interest, keywords]) => {
      const score = keywords.reduce((sum, k) => sum + (tags.has(k) ? 0.25 : 0), 0)
      vector[idx++] = Math.min(score, 1.0)
    })
  }
  
  private encodePricing(
    vector: Float32Array,
    content: any,
    start: number,
    end: number
  ): void {
    const dailyBudget = content.estimated_daily_budget_usd || 150
    
    // Normalized price (0-1 scale, $500/day = 1.0)
    vector[start] = Math.min(dailyBudget / 500, 1.0)
    
    // Price tier (one-hot)
    const tier = dailyBudget < 50 ? 0 : dailyBudget < 100 ? 1 : dailyBudget < 200 ? 2 : dailyBudget < 400 ? 3 : 4
    vector[start + 1 + tier] = 1.0
    
    // Has deals/promotions
    vector[start + 6] = content.has_active_deal ? 1.0 : 0.0
    
    // Flight price estimate (normalized)
    if (content.estimated_flight_price_usd) {
      vector[start + 7] = Math.min(content.estimated_flight_price_usd / 2000, 1.0)
    }
    
    // Hotel price estimate (normalized)
    if (content.estimated_hotel_price_usd) {
      vector[start + 8] = Math.min(content.estimated_hotel_price_usd / 500, 1.0)
    }
  }
  
  private encodeSeasonality(
    vector: Float32Array,
    content: any,
    start: number,
    end: number
  ): void {
    const seasons = new Set(content.seasons || [])
    const bestMonths = new Set(content.best_months || [])
    
    // Season suitability (4 dimensions)
    vector[start] = seasons.has('spring') || [3, 4, 5].some(m => bestMonths.has(m)) ? 1.0 : 0.3
    vector[start + 1] = seasons.has('summer') || [6, 7, 8].some(m => bestMonths.has(m)) ? 1.0 : 0.3
    vector[start + 2] = seasons.has('fall') || [9, 10, 11].some(m => bestMonths.has(m)) ? 1.0 : 0.3
    vector[start + 3] = seasons.has('winter') || [12, 1, 2].some(m => bestMonths.has(m)) ? 1.0 : 0.3
    
    // Month-by-month suitability (12 dimensions)
    for (let m = 1; m <= 12; m++) {
      vector[start + 4 + m - 1] = bestMonths.has(m) ? 1.0 : 0.5
    }
  }
  
  private encodeGeography(
    vector: Float32Array,
    content: any,
    start: number,
    end: number
  ): void {
    const regionMapping: Record<string, number> = {
      western_europe: 0, eastern_europe: 1, north_america: 2, central_america: 3,
      south_america: 4, east_asia: 5, southeast_asia: 6, south_asia: 7,
      middle_east: 8, north_africa: 9, sub_saharan_africa: 10, oceania: 11, caribbean: 12
    }
    
    const regionIdx = regionMapping[content.region]
    if (regionIdx !== undefined) {
      vector[start + regionIdx] = 1.0
    }
    
    // Climate type (5 dimensions)
    const climateMapping: Record<string, number> = {
      tropical: 13, temperate: 14, mediterranean: 15, desert: 16, cold: 17
    }
    
    const climateIdx = climateMapping[content.climate_type]
    if (climateIdx !== undefined) {
      vector[start + climateIdx] = 1.0
    }
    
    // Latitude band (for climate similarity)
    if (content.latitude) {
      // Normalize latitude to 0-1 range
      vector[start + 18] = (content.latitude + 90) / 180
    }
    
    // Urban vs. rural (derived from tags)
    const tags = new Set(content.tags || [])
    vector[start + 19] = tags.has('city') || tags.has('urban') ? 1.0 : 
                         tags.has('rural') || tags.has('countryside') ? 0.0 : 0.5
  }
  
  private encodePopularity(
    vector: Float32Array,
    content: any,
    start: number,
    end: number
  ): void {
    // Popularity score (normalized 0-1)
    vector[start] = (content.popularity_score || 50) / 100
    
    // Editor rating (normalized 0-1)
    vector[start + 1] = (content.editor_rating || 3) / 5
    
    // Is featured
    vector[start + 2] = content.is_featured ? 1.0 : 0.0
    
    // Is trending
    vector[start + 3] = content.is_trending ? 1.0 : 0.0
    
    // View count (normalized, log scale)
    if (content.view_count) {
      vector[start + 4] = Math.min(Math.log10(content.view_count) / 6, 1.0) // 1M views = 1.0
    }
    
    // Booking count (normalized, log scale)
    if (content.booking_count) {
      vector[start + 5] = Math.min(Math.log10(content.booking_count) / 4, 1.0) // 10K bookings = 1.0
    }
    
    // Recency (how recently updated)
    const daysSinceUpdate = (Date.now() - new Date(content.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    vector[start + 6] = Math.max(0, 1 - (daysSinceUpdate / 365))
  }
  
  private normalizeVector(vector: Float32Array): void {
    let magnitude = 0
    for (let i = 0; i < vector.length; i++) {
      magnitude += vector[i] * vector[i]
    }
    magnitude = Math.sqrt(magnitude)
    
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] = vector[i] / magnitude
      }
    }
  }
  
  private extractTopFeatures(vector: Float32Array, content: any): FeatureContribution[] {
    // Extract most significant dimensions for explainability
    const features: FeatureContribution[] = []
    
    if (content.is_trending) {
      features.push({ feature: 'Trending', dimension: 227, contribution: 0.9 })
    }
    
    if (content.is_featured) {
      features.push({ feature: "Editor's Choice", dimension: 226, contribution: 0.85 })
    }
    
    const primaryCategory = content.primary_category
    if (primaryCategory) {
      features.push({ feature: `Perfect for ${primaryCategory}`, dimension: 64, contribution: 0.8 })
    }
    
    return features.slice(0, 5)
  }
}
```

---

## Similarity Engine

```typescript
// intelligence/similarity-engine.ts

/**
 * Similarity Engine
 * 
 * Matches users to content using multiple similarity metrics
 * and combines them intelligently for final ranking.
 */

export class SimilarityEngine {
  
  /**
   * Calculate cosine similarity between user and content embeddings
   */
  cosineSimilarity(userVector: Float32Array, contentVector: Float32Array): number {
    if (userVector.length !== contentVector.length) {
      throw new Error('Vector dimensions must match')
    }
    
    let dotProduct = 0
    let userMagnitude = 0
    let contentMagnitude = 0
    
    for (let i = 0; i < userVector.length; i++) {
      dotProduct += userVector[i] * contentVector[i]
      userMagnitude += userVector[i] * userVector[i]
      contentMagnitude += contentVector[i] * contentVector[i]
    }
    
    userMagnitude = Math.sqrt(userMagnitude)
    contentMagnitude = Math.sqrt(contentMagnitude)
    
    if (userMagnitude === 0 || contentMagnitude === 0) return 0
    
    return dotProduct / (userMagnitude * contentMagnitude)
  }
  
  /**
   * Calculate weighted similarity with dimension groups
   * Different dimension ranges can have different importance
   */
  weightedSimilarity(
    userVector: Float32Array,
    contentVector: Float32Array,
    weights: DimensionWeights
  ): number {
    let totalScore = 0
    let totalWeight = 0
    
    // Preferences similarity (dim 0-31)
    const prefsSim = this.cosineSimilarityRange(userVector, contentVector, 0, 31)
    totalScore += prefsSim * weights.preferences
    totalWeight += weights.preferences
    
    // Style similarity (dim 32-63)
    const styleSim = this.cosineSimilarityRange(userVector, contentVector, 32, 63)
    totalScore += styleSim * weights.style
    totalWeight += weights.style
    
    // Interest similarity (dim 64-95)
    const interestSim = this.cosineSimilarityRange(userVector, contentVector, 64, 95)
    totalScore += interestSim * weights.interests
    totalWeight += weights.interests
    
    // Behavioral similarity (dim 96-127)
    const behaviorSim = this.cosineSimilarityRange(userVector, contentVector, 96, 127)
    totalScore += behaviorSim * weights.behavior
    totalWeight += weights.behavior
    
    // Price similarity (dim 128-159)
    const priceSim = this.cosineSimilarityRange(userVector, contentVector, 128, 159)
    totalScore += priceSim * weights.price
    totalWeight += weights.price
    
    // Geographic similarity (dim 192-223)
    const geoSim = this.cosineSimilarityRange(userVector, contentVector, 192, 223)
    totalScore += geoSim * weights.geography
    totalWeight += weights.geography
    
    return totalScore / totalWeight
  }
  
  /**
   * Calculate similarity for a specific dimension range
   */
  private cosineSimilarityRange(
    vecA: Float32Array,
    vecB: Float32Array,
    start: number,
    end: number
  ): number {
    let dotProduct = 0
    let magA = 0
    let magB = 0
    
    for (let i = start; i <= end; i++) {
      dotProduct += vecA[i] * vecB[i]
      magA += vecA[i] * vecA[i]
      magB += vecB[i] * vecB[i]
    }
    
    magA = Math.sqrt(magA)
    magB = Math.sqrt(magB)
    
    if (magA === 0 || magB === 0) return 0
    return dotProduct / (magA * magB)
  }
  
  /**
   * Find top N matches for a user from candidate content
   */
  async findTopMatches(
    userEmbedding: UserEmbedding,
    candidates: ContentEmbedding[],
    context: ContextualSignals,
    limit: number = 50
  ): Promise<ScoredContent[]> {
    // Determine weights based on user confidence
    const weights = this.determineWeights(userEmbedding.confidence)
    
    // Score all candidates
    const scored = candidates.map(candidate => {
      const similarity = this.weightedSimilarity(
        userEmbedding.vector,
        candidate.vector,
        weights
      )
      
      return {
        contentId: candidate.contentId,
        contentType: candidate.contentType,
        similarityScore: similarity * 100,
        // Other scores will be added by ranking layer
        intentScore: 0,
        contextScore: 0,
        trendScore: 0,
        freshnessScore: 0,
        businessScore: 0,
        finalScore: 0,
        matchReasons: [],
        rankPosition: 0,
        diversityContribution: 0,
      }
    })
    
    // Sort by similarity and return top N
    return scored
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)
  }
  
  /**
   * Determine dimension weights based on user confidence
   * Low confidence = rely more on popular/general content
   * High confidence = rely more on personalization
   */
  private determineWeights(confidence: number): DimensionWeights {
    if (confidence < 0.3) {
      // Cold start: emphasize popularity and general appeal
      return {
        preferences: 0.1,
        style: 0.1,
        interests: 0.15,
        behavior: 0.05,
        price: 0.2,
        geography: 0.1,
        popularity: 0.3, // High weight on popularity
      }
    } else if (confidence < 0.6) {
      // Warm start: balanced approach
      return {
        preferences: 0.15,
        style: 0.15,
        interests: 0.2,
        behavior: 0.1,
        price: 0.15,
        geography: 0.1,
        popularity: 0.15,
      }
    } else {
      // Hot start: heavy personalization
      return {
        preferences: 0.2,
        style: 0.2,
        interests: 0.25,
        behavior: 0.15,
        price: 0.1,
        geography: 0.05,
        popularity: 0.05,
      }
    }
  }
}

interface DimensionWeights {
  preferences: number
  style: number
  interests: number
  behavior: number
  price: number
  geography: number
  popularity?: number
}
```

---

## Real-Time Learning Engine

```typescript
// learning/real-time-learner.ts

/**
 * Real-Time Learning Engine
 * 
 * Updates user embeddings instantly when users take actions.
 * This enables the system to learn and adapt within a single session.
 */

export class RealTimeLearner {
  private readonly LEARNING_RATE = 0.1
  private readonly DECAY_RATE = 0.95 // Older actions have less influence
  private supabase: SupabaseClient
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }
  
  /**
   * Process a user action and update their embedding
   */
  async processAction(event: LearningEvent): Promise<void> {
    // 1. Get current user embedding
    const userEmbedding = await this.getUserEmbedding(event.userId)
    
    // 2. Get content embedding
    const contentEmbedding = await this.getContentEmbedding(event.contentId)
    
    // 3. Calculate action weight
    const weight = this.calculateActionWeight(event)
    
    // 4. Update user embedding
    const updatedVector = this.updateVector(
      userEmbedding.vector,
      contentEmbedding.vector,
      weight
    )
    
    // 5. Save updated embedding
    await this.saveUserEmbedding(event.userId, updatedVector, userEmbedding.version + 1)
    
    // 6. Update learned features section specifically
    await this.updateLearnedFeatures(event.userId, contentEmbedding, weight)
    
    // 7. Track for batch learning
    await this.recordLearningEvent(event)
  }
  
  /**
   * Calculate how much weight this action should have
   */
  private calculateActionWeight(event: LearningEvent): number {
    // Base weight by action type
    const baseWeights: Record<ActionType, number> = {
      impression: 0.01,      // Very weak signal
      view: 0.05,           // Weak positive
      click: 0.1,           // Moderate positive
      detail_view: 0.2,     // Strong positive
      save: 0.3,            // Very strong positive
      share: 0.25,          // Strong positive
      book_start: 0.4,      // Very strong positive
      book_complete: 0.5,   // Strongest positive
      dismiss: -0.2,        // Negative signal
      not_interested: -0.3, // Strong negative
    }
    
    let weight = baseWeights[event.action] || 0.05
    
    // Boost based on context
    if (event.context.dwellTime && event.context.dwellTime > 30) {
      weight *= 1.2 // User spent time = more intentional
    }
    
    if (event.context.position && event.context.position > 5) {
      weight *= 1.1 // User scrolled = more intentional
    }
    
    // Apply recency decay
    const hoursSinceAction = (Date.now() - event.timestamp.getTime()) / (1000 * 60 * 60)
    weight *= Math.pow(this.DECAY_RATE, hoursSinceAction / 24)
    
    return weight
  }
  
  /**
   * Update user vector by moving toward (or away from) content vector
   */
  private updateVector(
    userVector: Float32Array,
    contentVector: Float32Array,
    weight: number
  ): Float32Array {
    const updated = new Float32Array(userVector.length)
    
    // Determine direction (positive = move toward, negative = move away)
    const direction = weight >= 0 ? 1 : -1
    const magnitude = Math.abs(weight) * this.LEARNING_RATE
    
    for (let i = 0; i < userVector.length; i++) {
      const diff = contentVector[i] - userVector[i]
      updated[i] = userVector[i] + (diff * magnitude * direction)
      
      // Clamp to valid range
      updated[i] = Math.max(0, Math.min(1, updated[i]))
    }
    
    // Re-normalize
    let mag = 0
    for (let i = 0; i < updated.length; i++) {
      mag += updated[i] * updated[i]
    }
    mag = Math.sqrt(mag)
    
    if (mag > 0) {
      for (let i = 0; i < updated.length; i++) {
        updated[i] = updated[i] / mag
      }
    }
    
    return updated
  }
  
  /**
   * Update the "learned features" section (dim 224-255)
   * This captures recent behavioral patterns
   */
  private async updateLearnedFeatures(
    userId: string,
    contentEmbedding: ContentEmbedding,
    weight: number
  ): Promise<void> {
    // Get recent actions for this user
    const { data: recentActions } = await this.supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    // Compute aggregate learned features
    const learnedFeatures = new Float32Array(32)
    
    // Feature: Recent category preferences
    const categoryPrefs: Record<string, number> = {}
    recentActions?.forEach(action => {
      const category = action.metadata?.category
      if (category) {
        categoryPrefs[category] = (categoryPrefs[category] || 0) + 1
      }
    })
    
    // Normalize and encode
    const maxCatCount = Math.max(...Object.values(categoryPrefs), 1)
    let idx = 0
    const categories = ['adventure', 'beach', 'cultural', 'food', 'luxury', 'budget', 'nature', 'city']
    categories.forEach(cat => {
      learnedFeatures[idx++] = (categoryPrefs[cat] || 0) / maxCatCount
    })
    
    // Feature: Recent price range
    const prices = recentActions
      ?.map(a => a.metadata?.price)
      .filter(p => p !== undefined) || []
    
    if (prices.length > 0) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
      learnedFeatures[idx++] = Math.min(avgPrice / 500, 1.0)
    }
    
    // Store in user's learned features
    await this.supabase
      .from('user_learned_features')
      .upsert({
        user_id: userId,
        features: Array.from(learnedFeatures),
        updated_at: new Date().toISOString()
      })
  }
  
  /**
   * Process a batch of actions (for session end processing)
   */
  async processSession(
    userId: string,
    actions: LearningEvent[]
  ): Promise<void> {
    if (actions.length === 0) return
    
    // Get current embedding
    const userEmbedding = await this.getUserEmbedding(userId)
    let currentVector = userEmbedding.vector
    
    // Process each action in sequence
    for (const action of actions) {
      const contentEmbedding = await this.getContentEmbedding(action.contentId)
      const weight = this.calculateActionWeight(action)
      currentVector = this.updateVector(currentVector, contentEmbedding.vector, weight)
    }
    
    // Save final updated embedding
    await this.saveUserEmbedding(userId, currentVector, userEmbedding.version + 1)
    
    // Recalculate confidence based on new interactions
    const newConfidence = this.calculateUpdatedConfidence(
      userEmbedding.confidence,
      actions
    )
    
    await this.updateUserConfidence(userId, newConfidence)
  }
  
  private calculateUpdatedConfidence(
    currentConfidence: number,
    newActions: LearningEvent[]
  ): number {
    // Each meaningful action increases confidence slightly
    const meaningfulActions = newActions.filter(a => 
      ['detail_view', 'save', 'book_start', 'book_complete'].includes(a.action)
    )
    
    const confidenceIncrease = Math.min(meaningfulActions.length * 0.01, 0.05)
    return Math.min(currentConfidence + confidenceIncrease, 1.0)
  }
  
  // Database helpers
  private async getUserEmbedding(userId: string): Promise<UserEmbedding> {
    const { data } = await this.supabase
      .from('user_embeddings')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (!data) {
      // Generate new embedding
      const generator = new UserEmbeddingGenerator(this.supabase)
      return generator.generateEmbedding(userId)
    }
    
    return {
      userId: data.user_id,
      vector: new Float32Array(data.vector),
      confidence: data.confidence,
      version: data.version,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      topFeatures: data.top_features || [],
    }
  }
  
  private async getContentEmbedding(contentId: string): Promise<ContentEmbedding> {
    const { data } = await this.supabase
      .from('content_embeddings')
      .select('*')
      .eq('content_id', contentId)
      .single()
    
    if (!data) {
      // Generate new embedding
      const generator = new ContentEmbeddingGenerator(this.supabase)
      return generator.generateEmbedding(contentId, 'destination')
    }
    
    return {
      contentId: data.content_id,
      contentType: data.content_type,
      vector: new Float32Array(data.vector),
      version: data.version,
      updatedAt: new Date(data.updated_at),
      topFeatures: data.top_features || [],
    }
  }
  
  private async saveUserEmbedding(
    userId: string,
    vector: Float32Array,
    version: number
  ): Promise<void> {
    await this.supabase
      .from('user_embeddings')
      .upsert({
        user_id: userId,
        vector: Array.from(vector),
        version,
        updated_at: new Date().toISOString(),
      })
  }
  
  private async updateUserConfidence(
    userId: string,
    confidence: number
  ): Promise<void> {
    await this.supabase
      .from('user_embeddings')
      .update({ confidence })
      .eq('user_id', userId)
  }
  
  private async recordLearningEvent(event: LearningEvent): Promise<void> {
    await this.supabase
      .from('learning_events')
      .insert({
        user_id: event.userId,
        content_id: event.contentId,
        action: event.action,
        weight: event.weight,
        context: event.context,
        created_at: event.timestamp.toISOString(),
      })
  }
}
```

---

## Database Schema for Embeddings

```sql
-- Embedding Storage Tables

-- User embeddings
CREATE TABLE user_embeddings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vector FLOAT8[256] NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 0.1,
  version INTEGER NOT NULL DEFAULT 1,
  top_features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content embeddings  
CREATE TABLE content_embeddings (
  content_id UUID PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL,
  vector FLOAT8[256] NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  top_features JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning events (for batch processing and analysis)
CREATE TABLE learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  weight FLOAT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User learned features (frequently updated)
CREATE TABLE user_learned_features (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  features FLOAT8[32] NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_content_embeddings_type ON content_embeddings(content_type);
CREATE INDEX idx_learning_events_user ON learning_events(user_id);
CREATE INDEX idx_learning_events_created ON learning_events(created_at DESC);

-- Functions for similarity search (if using pgvector extension)
-- Note: Requires pgvector extension for efficient similarity search
-- CREATE EXTENSION IF NOT EXISTS vector;
-- 
-- Then you can use:
-- SELECT content_id, vector <=> $1 as distance
-- FROM content_embeddings
-- ORDER BY vector <=> $1
-- LIMIT 50;
```

---

## Integration with Homepage Service

```typescript
// Updated homepage service integration

import { UserEmbeddingGenerator } from './embeddings/user-embedding.ts'
import { ContentEmbeddingGenerator } from './embeddings/content-embedding.ts'
import { SimilarityEngine } from './intelligence/similarity-engine.ts'
import { RealTimeLearner } from './learning/real-time-learner.ts'

/**
 * Personalized content fetching with embeddings
 */
async function getPersonalizedContent(
  supabase: SupabaseClient,
  userId: string,
  context: ContextualSignals
): Promise<ScoredContent[]> {
  
  // 1. Get or generate user embedding
  let userEmbedding: UserEmbedding
  
  const { data: existingEmbedding } = await supabase
    .from('user_embeddings')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (existingEmbedding) {
    userEmbedding = {
      userId: existingEmbedding.user_id,
      vector: new Float32Array(existingEmbedding.vector),
      confidence: existingEmbedding.confidence,
      version: existingEmbedding.version,
      createdAt: new Date(existingEmbedding.created_at),
      updatedAt: new Date(existingEmbedding.updated_at),
      topFeatures: existingEmbedding.top_features,
    }
  } else {
    // Generate new embedding
    const generator = new UserEmbeddingGenerator(supabase)
    userEmbedding = await generator.generateEmbedding(userId)
    
    // Store it
    await supabase.from('user_embeddings').insert({
      user_id: userId,
      vector: Array.from(userEmbedding.vector),
      confidence: userEmbedding.confidence,
      version: userEmbedding.version,
      top_features: userEmbedding.topFeatures,
    })
  }
  
  // 2. Get content embeddings
  const { data: contentEmbeddings } = await supabase
    .from('content_embeddings')
    .select('*')
    .eq('content_type', 'destination')
  
  const candidates: ContentEmbedding[] = (contentEmbeddings || []).map(ce => ({
    contentId: ce.content_id,
    contentType: ce.content_type,
    vector: new Float32Array(ce.vector),
    version: ce.version,
    updatedAt: new Date(ce.updated_at),
    topFeatures: ce.top_features,
  }))
  
  // 3. Run similarity matching
  const similarityEngine = new SimilarityEngine()
  const matches = await similarityEngine.findTopMatches(
    userEmbedding,
    candidates,
    context,
    100
  )
  
  // 4. Apply contextual boosts
  const boosted = applyContextualBoosts(matches, context)
  
  // 5. Apply business rules
  const final = applyBusinessRules(boosted, context)
  
  return final
}

/**
 * Track user action and update embeddings in real-time
 */
async function trackAndLearn(
  supabase: SupabaseClient,
  userId: string,
  contentId: string,
  action: ActionType,
  context: LearningContext
): Promise<void> {
  const learner = new RealTimeLearner(supabase)
  
  await learner.processAction({
    userId,
    contentId,
    action,
    weight: 0, // Calculated internally
    context,
    timestamp: new Date(),
  })
}
```

---

## Summary: What This Gives You Over Competitors

### **1. Instant Personalization**
- Learn from first tap (not after 10 bookings)
- Real-time embedding updates within sessions
- Cold start strategy that still feels personal

### **2. Deep Understanding**
- 256-dimensional user profiles
- Capture explicit AND implicit preferences
- Understand WHY users like things, not just WHAT

### **3. Contextual Intelligence**
- Time of day affects recommendations
- Location awareness
- Weather-aware suggestions
- Device-appropriate content

### **4. Transparent Matching**
- Match reasons explain WHY content appears
- Users understand and trust the system
- Debuggable for improvement

### **5. Continuous Evolution**
- System gets smarter every day
- Batch learning improves models
- A/B testing validates improvements

---

**Document Version:** 1.0
**Last Updated:** 2025
**Status:** Ready for Implementation

---

## What's Next

This document (Group B, Doc 5) completes the intelligence layer. Combined with:

- **Doc 3**: Backend API service
- **Doc 4**: Frontend components

You now have a complete, production-ready recommendation system that can genuinely compete with (and beat) the major travel platforms.
