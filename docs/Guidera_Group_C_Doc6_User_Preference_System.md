# Document 6: User Preference System

## Purpose

This document defines how Guidera collects, stores, updates, and uses user preferences. Covers onboarding flow, preference management, and continuous learning.

---

## System Overview

```
Preference Collection Points:
├── Onboarding (explicit) ─────────────────┐
│   └── 4 preference screens               │
├── Settings (explicit) ───────────────────┤──→ user_preferences table
│   └── Edit preferences anytime           │
└── Behavior (implicit) ───────────────────┘
    └── Clicks, saves, bookings, time spent
```

---

## Onboarding Flow

### Screen Sequence

| Screen | Question | Field | Type |
|--------|----------|-------|------|
| 1 | "What's your travel style?" | `travel_style` | Single select |
| 2 | "What interests you?" | `interests` | Multi select (min 1) |
| 3 | "Who do you travel with?" | `typical_travel_with` | Single select |
| 4 | "What's your typical budget?" | `budget_level` | Single select |

### Screen 1: Travel Style

**Options:**
```
adventure     → "Thrill-seeking and outdoor activities"
relaxation    → "Peaceful getaways and wellness"
cultural      → "Museums, history, and local experiences"  
business      → "Work-focused travel"
mix           → "Mix of everything"
```

**Stored as:** `user_preferences.travel_style = 'adventure'`

### Screen 2: Interests

**Options (multi-select, minimum 1):**
```
food          → "Food & Dining"
history       → "History"
nature        → "Nature"
nightlife     → "Nightlife"
shopping      → "Shopping"
art           → "Art & Culture"
sports        → "Sports"
wellness      → "Wellness"
photography   → "Photography"
```

**Stored as:** `user_preferences.interests = ['food', 'nature', 'photography']`

### Screen 3: Travel Companions

**Options:**
```
solo          → "Solo traveler"
couple        → "With partner"
family        → "With family"
friends       → "With friends"
business      → "Business colleagues"
varies        → "It varies"
```

**Stored as:** `user_preferences.typical_travel_with = 'couple'`

### Screen 4: Budget Level

**Options:**
```
budget        → "Budget-friendly" ($ symbol)
mid_range     → "Mid-range" ($$ symbol)
luxury        → "Luxury" ($$$ symbol)
flexible      → "Flexible / depends on trip"
```

**Stored as:** `user_preferences.budget_level = 'mid_range'`

---

## Database Schema

### user_preferences Table

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Explicit preferences (from onboarding)
  travel_style VARCHAR(50),
  interests TEXT[],
  typical_travel_with VARCHAR(50),
  budget_level VARCHAR(50),
  
  -- Location preferences
  preferred_regions TEXT[],
  preferred_climates TEXT[],
  accessibility_needs TEXT[],
  
  -- Communication preferences
  notification_preferences JSONB DEFAULT '{}',
  language VARCHAR(10) DEFAULT 'en',
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Computed fields (updated by system)
  preference_completeness INTEGER DEFAULT 0,  -- 0-100
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_interactions Table

```sql
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  entity_type VARCHAR(50) NOT NULL,  -- 'destination', 'experience', 'article'
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,       -- 'view', 'save', 'unsave', 'book', 'share', 'dismiss'
  
  context JSONB,  -- { source: 'homepage', section: 'for-you', position: 3 }
  duration_seconds INTEGER,  -- Time spent viewing
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_entity ON user_interactions(entity_type, entity_id);
```

---

## Preference Completeness Score

Calculate how much we know about the user:

```typescript
function calculatePreferenceCompleteness(prefs: UserPreferences): number {
  let score = 0
  const weights = {
    travel_style: 25,
    interests: 25,
    typical_travel_with: 20,
    budget_level: 20,
    preferred_regions: 5,
    preferred_climates: 5
  }
  
  if (prefs.travel_style) score += weights.travel_style
  if (prefs.interests?.length > 0) score += weights.interests
  if (prefs.typical_travel_with) score += weights.typical_travel_with
  if (prefs.budget_level) score += weights.budget_level
  if (prefs.preferred_regions?.length > 0) score += weights.preferred_regions
  if (prefs.preferred_climates?.length > 0) score += weights.preferred_climates
  
  return score
}
```

---

## Onboarding Implementation

### Flow Logic

```typescript
// After authentication completes
async function checkOnboardingStatus(userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_preferences')
    .select('onboarding_completed')
    .eq('user_id', userId)
    .single()
  
  if (!data || !data.onboarding_completed) {
    return '/(onboarding)/preferences-1'  // Start onboarding
  }
  
  return '/(tabs)'  // Go to main app
}
```

### Save Preferences

```typescript
async function saveOnboardingPreferences(
  userId: string,
  preferences: OnboardingData
): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      travel_style: preferences.travelStyle,
      interests: preferences.interests,
      typical_travel_with: preferences.travelWith,
      budget_level: preferences.budgetLevel,
      onboarding_completed: true,
      preference_completeness: 90,  // Core preferences complete
      updated_at: new Date().toISOString()
    })
  
  if (error) throw error
}
```

### Skip Handling

Users can skip onboarding. If skipped:

```typescript
async function skipOnboarding(userId: string): Promise<void> {
  await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      onboarding_completed: true,
      preference_completeness: 0,
      updated_at: new Date().toISOString()
    })
}
```

System uses cold start strategy with popular/trending content until preferences are set.

---

## Preference Management Screen

### Location

`src/app/(tabs)/profile/preferences.tsx`

### Sections

1. **Travel Style** — Single select, shows current selection
2. **Interests** — Multi-select chips, can add/remove
3. **Travel Companions** — Single select
4. **Budget** — Single select
5. **Regions** — Optional, multi-select by continent/region
6. **Accessibility** — Optional, multi-select (wheelchair, hearing, visual, etc.)

### Update Logic

```typescript
async function updatePreference(
  userId: string,
  field: string,
  value: any
): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .update({
      [field]: value,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
  
  if (error) throw error
  
  // Recalculate completeness
  await recalculateCompleteness(userId)
  
  // Invalidate homepage cache
  await invalidateHomepageCache(userId)
}
```

---

## Implicit Preference Learning

Track user behavior to refine preferences over time.

### Trackable Actions

| Action | Signal Strength | Inference |
|--------|-----------------|-----------|
| View destination | Low | Mild interest in category/region |
| View 30+ seconds | Medium | Strong interest |
| Save item | High | Confirmed interest |
| Book item | Very High | Preference validated |
| Share item | High | Advocacy-level interest |
| Dismiss/skip | Medium | Disinterest signal |

### Tracking Implementation

```typescript
async function trackInteraction(
  userId: string,
  entityType: string,
  entityId: string,
  action: string,
  context?: object,
  duration?: number
): Promise<void> {
  await supabase.from('user_interactions').insert({
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    action: action,
    context: context,
    duration_seconds: duration
  })
}

// Example usage
trackInteraction(
  user.id,
  'destination',
  'dest_123',
  'view',
  { source: 'homepage', section: 'for-you', position: 2 },
  45  // seconds
)
```

---

## Preference Inference

Run periodically to update derived preferences:

```sql
-- Find user's most engaged interests based on behavior
SELECT 
  unnest(d.tags) as inferred_interest,
  COUNT(*) as engagement_count
FROM user_interactions ui
JOIN curated_destinations d ON d.id = ui.entity_id
WHERE ui.user_id = ?
  AND ui.action IN ('save', 'book', 'share')
  AND ui.created_at > NOW() - INTERVAL '90 days'
GROUP BY unnest(d.tags)
ORDER BY engagement_count DESC
LIMIT 5;
```

Use this to:
- Validate stated preferences match behavior
- Suggest preference updates to user
- Adjust scoring weights for hot users

---

## Smart Defaults

For new users who skip onboarding:

### Location-Based

```typescript
function getLocationDefaults(countryCode: string): Partial<UserPreferences> {
  const defaults = {
    US: { currency: 'USD', language: 'en' },
    GB: { currency: 'GBP', language: 'en' },
    FR: { currency: 'EUR', language: 'fr' },
    JP: { currency: 'JPY', language: 'ja' },
    // ... more countries
  }
  return defaults[countryCode] || { currency: 'USD', language: 'en' }
}
```

### Popular Defaults

If no preferences, show:
- Trending destinations globally
- Seasonal recommendations
- Nearby popular spots

---

## Redux State

```typescript
// store/slices/preferences.slice.ts

interface PreferencesState {
  data: UserPreferences | null
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  },
  reducers: {
    setPreferences: (state, action) => {
      state.data = action.payload
      state.lastUpdated = new Date().toISOString()
    },
    updatePreferenceField: (state, action) => {
      const { field, value } = action.payload
      if (state.data) {
        state.data[field] = value
        state.lastUpdated = new Date().toISOString()
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearPreferences: (state) => {
      state.data = null
      state.lastUpdated = null
    }
  }
})
```

---

## Onboarding Redux State

```typescript
// store/slices/onboarding.slice.ts

interface OnboardingState {
  currentStep: number
  totalSteps: number
  travelStyle: string | null
  interests: string[]
  travelWith: string | null
  budgetLevel: string | null
  completed: boolean
}

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: {
    currentStep: 1,
    totalSteps: 4,
    travelStyle: null,
    interests: [],
    travelWith: null,
    budgetLevel: null,
    completed: false
  },
  reducers: {
    setTravelStyle: (state, action) => {
      state.travelStyle = action.payload
    },
    setInterests: (state, action) => {
      state.interests = action.payload
    },
    setTravelWith: (state, action) => {
      state.travelWith = action.payload
    },
    setBudgetLevel: (state, action) => {
      state.budgetLevel = action.payload
    },
    nextStep: (state) => {
      state.currentStep = Math.min(state.currentStep + 1, state.totalSteps)
    },
    prevStep: (state) => {
      state.currentStep = Math.max(state.currentStep - 1, 1)
    },
    completeOnboarding: (state) => {
      state.completed = true
    },
    resetOnboarding: (state) => {
      return { ...initialState }
    }
  }
})
```

---

## Implementation Steps

### Phase 1: Database

1. Ensure `user_preferences` table exists (from Group A)
2. Ensure `user_interactions` table exists (from Group A)
3. Add indexes on `user_id`

### Phase 2: Onboarding Screens

1. Create `src/app/(onboarding)/_layout.tsx`
2. Create 4 preference screens:
   - `preferences-1.tsx` (travel style)
   - `preferences-2.tsx` (interests)
   - `preferences-3.tsx` (travel companions)
   - `preferences-4.tsx` (budget)
3. Create `complete.tsx` (success/welcome screen)
4. Add skip handling on each screen

### Phase 3: Preference Service

1. Create `src/services/preferencesService.ts`
   - `fetchPreferences(userId)`
   - `updatePreference(userId, field, value)`
   - `saveOnboardingPreferences(userId, data)`
   - `calculateCompleteness(prefs)`

### Phase 4: Redux Integration

1. Create `preferences.slice.ts`
2. Create `onboarding.slice.ts`
3. Add thunks for async operations

### Phase 5: Preference Management UI

1. Create `src/app/(tabs)/profile/preferences.tsx`
2. Allow editing each preference section
3. Show preference completeness indicator
4. Prompt to complete missing preferences

### Phase 6: Interaction Tracking

1. Create `src/services/interactionService.ts`
2. Hook into destination card taps
3. Hook into save/unsave actions
4. Track view duration on detail screens

---

## UI Components Needed

| Component | Location | Purpose |
|-----------|----------|---------|
| `OnboardingProgress` | common | Progress bar (step X of Y) |
| `SingleSelectCard` | onboarding | Travel style, companions, budget |
| `MultiSelectChip` | onboarding | Interests selection |
| `PreferenceSection` | profile | Collapsible preference group |
| `CompletenessIndicator` | profile | Shows % of preferences filled |

---

## Configuration

```typescript
export const PREFERENCE_CONFIG = {
  onboarding: {
    totalSteps: 4,
    requiredFields: ['travel_style', 'interests'],
    optionalFields: ['typical_travel_with', 'budget_level']
  },
  
  interests: {
    minRequired: 1,
    maxAllowed: 9
  },
  
  tracking: {
    viewDurationThresholdSeconds: 10,  // Count as "engaged" view
    batchSize: 10,                      // Batch interactions before sync
    syncIntervalMs: 30000               // Sync every 30s
  },
  
  inference: {
    lookbackDays: 90,
    minInteractionsForInference: 10
  }
}
```

---

## Integration with Personalization

When preferences change:

1. Mark homepage cache as stale
2. Trigger background refresh of recommendations
3. Update preference completeness score
4. Recalculate personalization strategy (cold → warm → hot)

```typescript
async function onPreferenceChange(userId: string): Promise<void> {
  // 1. Invalidate cache
  await invalidateCache(`homepage:${userId}`)
  
  // 2. Update completeness
  const prefs = await fetchPreferences(userId)
  const completeness = calculateCompleteness(prefs)
  await updateCompleteness(userId, completeness)
  
  // 3. Notify personalization engine (optional)
  await supabase.functions.invoke('refresh-recommendations', {
    body: { userId }
  })
}
```

---

## Success Metrics

Track these to measure preference system effectiveness:

| Metric | Description |
|--------|-------------|
| Onboarding completion rate | % of users who finish all 4 steps |
| Preference completeness avg | Average completeness score |
| Preference update rate | How often users edit preferences |
| Preference-behavior alignment | Do stated preferences match actions |
| Time to first save | How quickly users find content they like |

---

**This system ensures Guidera learns user preferences quickly and accurately, creating a personalized experience from the first interaction.**
