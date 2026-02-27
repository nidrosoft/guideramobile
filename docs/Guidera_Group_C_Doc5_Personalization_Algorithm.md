# Document 5: Personalization Algorithm

## Purpose

This document defines Guidera's recommendation engine — the scoring, ranking, and strategy logic that powers personalized content delivery. This is the brain behind "For You" recommendations.

---

## Core Concept

The personalization engine evaluates every destination/experience against the user's profile and returns a **match score (0-100)**. Higher scores = better matches = shown first.

---

## Strategy Selection

Users are segmented into 3 tiers based on their interaction history:

| Strategy | Interactions | Behavior |
|----------|--------------|----------|
| **Cold Start** | 0-2 | Rely on explicit preferences from onboarding |
| **Warm Start** | 3-19 | Blend preferences + behavioral signals |
| **Hot Start** | 20+ | Primarily behavioral with preference validation |

```
interaction_count = COUNT(*) FROM user_interactions WHERE user_id = ?

if interaction_count < 3 → cold_start
else if interaction_count < 20 → warm_start  
else → hot_start
```

---

## Scoring Algorithm

Each destination receives a weighted score from 6 factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Relevance** | 30% | Travel style alignment |
| **Budget** | 20% | Budget level match |
| **Interests** | 20% | Tag/category overlap |
| **Proximity** | 15% | Distance from user location |
| **Seasonal** | 10% | Best time to visit match |
| **Popularity** | 5% | Overall engagement boost |

### Total Score Formula

```
score = (relevance × 0.30) + (budget × 0.20) + (interests × 0.20) + 
        (proximity × 0.15) + (seasonal × 0.10) + (popularity × 0.05)
```

---

## Factor Calculations

### 1. Relevance Score (0-100)

Compares destination's `travel_style` tags against user's `travel_style` preference.

```
user_style = user_preferences.travel_style  // e.g., "adventure"
destination_styles = destination.tags       // e.g., ["adventure", "nature"]

if user_style IN destination_styles → 100
else if partial_match → 50
else → 20
```

### 2. Budget Score (0-100)

Compares destination's `budget_level` against user's `budget_level`.

```
Budget Levels: budget (1), mid-range (2), luxury (3)

difference = ABS(user_budget_level - destination_budget_level)

if difference = 0 → 100
if difference = 1 → 60
if difference = 2 → 20
```

### 3. Interests Score (0-100)

Calculates overlap between user interests and destination categories/tags.

```
user_interests = user_preferences.interests[]
destination_tags = destination.tags[] + destination.categories[]

overlap_count = COUNT(user_interests ∩ destination_tags)
total_user_interests = COUNT(user_interests)

score = (overlap_count / total_user_interests) × 100
```

### 4. Proximity Score (0-100)

Based on distance from user's current location.

```
distance_km = haversine(user_lat, user_lng, dest_lat, dest_lng)

if distance_km < 100 → 100
if distance_km < 500 → 80
if distance_km < 1000 → 60
if distance_km < 5000 → 40
else → 20
```

### 5. Seasonal Score (0-100)

Matches current month against destination's `best_time_to_visit`.

```
current_month = EXTRACT(MONTH FROM NOW())
best_months = destination.best_time_to_visit[]  // e.g., [6, 7, 8]

if current_month IN best_months → 100
if adjacent_month IN best_months → 70
else → 40
```

### 6. Popularity Score (0-100)

Based on overall engagement metrics.

```
total_interactions = destination.view_count + destination.save_count + destination.booking_count

Normalize to 0-100 based on percentile ranking across all destinations
```

---

## Strategy-Specific Weights

Weights shift based on strategy:

### Cold Start Weights
```
relevance: 40%   // Heavy on explicit preferences
budget: 25%
interests: 25%
proximity: 5%
seasonal: 5%
popularity: 0%   // No behavioral data yet
```

### Warm Start Weights (Default)
```
relevance: 30%
budget: 20%
interests: 20%
proximity: 15%
seasonal: 10%
popularity: 5%
```

### Hot Start Weights
```
relevance: 20%   // Less reliance on stated preferences
budget: 15%
interests: 15%
proximity: 15%
seasonal: 10%
popularity: 25%  // Heavy on behavioral signals
```

---

## Behavioral Signals

For warm/hot users, these signals boost or penalize scores:

| Signal | Impact |
|--------|--------|
| Previously viewed | +10 points |
| Previously saved | +20 points |
| Previously booked | +30 points (same category) |
| Dismissed/skipped | -15 points |
| Similar to saved items | +15 points |

```
Apply behavioral modifiers AFTER base score calculation
Final score = base_score + behavioral_modifier
Cap at 100, floor at 0
```

---

## Section Generation

Each homepage section uses different query + ranking logic:

| Section | Query Filter | Sort By |
|---------|--------------|---------|
| **For You** | All published | Personalized score DESC |
| **Nearby** | Within radius | Distance ASC |
| **Trending** | interaction_count > threshold | Recent interactions DESC |
| **Deals** | has_active_promotion = true | Discount % DESC |
| **Popular** | All published | Total interactions DESC |
| **Seasonal** | best_time_to_visit includes current | Seasonal score DESC |
| **Budget Friendly** | budget_level = user_budget | Price ASC |
| **Luxury Picks** | budget_level = 'luxury' | Rating DESC |
| **Family** | tags contains 'family' | Family score DESC |
| **Adventure** | tags contains 'adventure' | Adventure score DESC |
| **Romantic** | tags contains 'romantic' | Romantic score DESC |
| **Hidden Gems** | popularity_score < 50 | Quality score DESC |

---

## Database Requirements

### Required Tables (from Group A)
- `curated_destinations`
- `curated_experiences`
- `user_preferences`
- `user_interactions`
- `user_saved_items`
- `homepage_categories`
- `seasonal_promotions`

### Required Function

Create in Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION destinations_within_radius(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 500
)
RETURNS SETOF curated_destinations AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM curated_destinations
  WHERE status = 'published'
    AND coordinates IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians((coordinates->>'lat')::float)) *
        cos(radians((coordinates->>'lng')::float) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians((coordinates->>'lat')::float))
      )
    ) <= radius_km
  ORDER BY (
    6371 * acos(
      cos(radians(user_lat)) * cos(radians((coordinates->>'lat')::float)) *
      cos(radians((coordinates->>'lng')::float) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians((coordinates->>'lat')::float))
    )
  ) ASC;
END;
$$ LANGUAGE plpgsql;
```

---

## Configuration

```typescript
// config.ts
export const PERSONALIZATION_CONFIG = {
  // Strategy thresholds
  coldStartThreshold: 3,
  warmStartThreshold: 20,
  
  // Default scoring weights
  weights: {
    relevance: 30,
    budget: 20,
    interests: 20,
    proximity: 15,
    seasonal: 10,
    popularity: 5
  },
  
  // Behavioral modifiers
  behavioral: {
    viewed: 10,
    saved: 20,
    booked: 30,
    dismissed: -15,
    similarToSaved: 15
  },
  
  // Location
  nearbyRadiusKm: 500,
  
  // Limits
  maxItemsPerSection: 20,
  maxSections: 12,
  
  // Cache
  cacheTTLSeconds: 3600
}
```

---

## Implementation Steps

1. **Create config file** with weights and thresholds
2. **Build context builder** — queries user profile, preferences, interactions in parallel
3. **Implement strategy selector** — determines cold/warm/hot based on interaction count
4. **Create score calculator** — applies weighted formula per destination
5. **Build section generators** — each section type with its query + sort logic
6. **Add behavioral modifiers** — boost/penalize based on past actions
7. **Implement caching** — cache results per user for TTL duration

---

## Response Format

The personalization engine returns:

```typescript
{
  user_id: string,
  strategy: 'cold_start' | 'warm_start' | 'hot_start',
  personalization_score: number,  // 0-100, how well we know this user
  generated_at: string,
  sections: [
    {
      id: string,
      title: string,
      subtitle?: string,
      type: 'carousel' | 'grid',
      items: [
        {
          id: string,
          type: 'destination' | 'experience',
          title: string,
          subtitle: string,
          imageUrl: string,
          matchScore: number,      // 0-100
          matchReasons: string[],  // ["Matches your love of adventure", "Within budget"]
          // ... other fields
        }
      ]
    }
  ]
}
```

---

## Match Reasons

Generate human-readable explanations for high-scoring items:

| Condition | Reason Text |
|-----------|-------------|
| travel_style match | "Matches your {style} travel style" |
| budget match | "Within your budget" |
| interest overlap ≥ 2 | "Aligns with your interests" |
| distance < 100km | "Close to you" |
| seasonal match | "Perfect time to visit" |
| previously saved similar | "Similar to places you've saved" |

Show top 2 reasons per item where matchScore > 70.

---

## Performance Notes

- Run all user context queries in parallel (Promise.all)
- Pre-calculate popularity scores nightly via cron job
- Index `user_id` on all user tables
- Cache personalized results for 1 hour per user
- Limit sections to 12, items per section to 20

---

**This algorithm powers the intelligence behind Guidera's recommendations. It learns from every interaction and gets smarter over time.**
