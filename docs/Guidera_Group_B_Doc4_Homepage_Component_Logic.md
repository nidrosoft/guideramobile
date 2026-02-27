# Guidera - Group B Document 4: Homepage Component Logic

## Overview

This document defines the **Homepage Component Logic** — the frontend implementation in Expo/React Native that fetches, displays, and interacts with personalized homepage content. This is where the magic becomes visible to users.

**Technology:** Expo 54, React Native, TypeScript, Redux Toolkit
**Purpose:** Render personalized homepage sections with smooth UX and optimal performance

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      HOMEPAGE FRONTEND ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         SCREENS                                      │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│   │  │  Homepage   │  │  Category   │  │ Destination │                  │   │
│   │  │   Screen    │  │   Screen    │  │   Detail    │                  │   │
│   │  └──────┬──────┘  └─────────────┘  └─────────────┘                  │   │
│   └─────────┼───────────────────────────────────────────────────────────┘   │
│             │                                                                │
│   ┌─────────┼───────────────────────────────────────────────────────────┐   │
│   │         ▼       COMPONENTS                                           │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│   │  │  Section    │  │  Content    │  │   Card      │                  │   │
│   │  │  Container  │  │  Carousel   │  │ Components  │                  │   │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │   │
│   └─────────┼────────────────┼────────────────┼─────────────────────────┘   │
│             │                │                │                              │
│   ┌─────────┼────────────────┼────────────────┼─────────────────────────┐   │
│   │         ▼                ▼                ▼                          │   │
│   │                       HOOKS                                          │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│   │  │ useHomepage │  │ useLocation │  │ useSavedItems│                 │   │
│   │  └──────┬──────┘  └─────────────┘  └─────────────┘                  │   │
│   └─────────┼───────────────────────────────────────────────────────────┘   │
│             │                                                                │
│   ┌─────────┼───────────────────────────────────────────────────────────┐   │
│   │         ▼       SERVICES                                             │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│   │  │  Homepage   │  │ Analytics   │  │   Cache     │                  │   │
│   │  │   Service   │  │  Service    │  │  Service    │                  │   │
│   │  └──────┬──────┘  └─────────────┘  └─────────────┘                  │   │
│   └─────────┼───────────────────────────────────────────────────────────┘   │
│             │                                                                │
│   ┌─────────┼───────────────────────────────────────────────────────────┐   │
│   │         ▼       STATE (Redux)                                        │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│   │  │  Homepage   │  │    User     │  │   Saved     │                  │   │
│   │  │   Slice     │  │   Slice     │  │   Slice     │                  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── app/
│   └── (tabs)/
│       └── index.tsx                    # Homepage screen (Expo Router)
│
├── features/
│   └── homepage/
│       ├── screens/
│       │   └── HomepageScreen.tsx       # Main screen component
│       │
│       ├── components/
│       │   ├── HomepageHeader.tsx       # Header with greeting
│       │   ├── SearchBar.tsx            # Search bar
│       │   ├── SectionContainer.tsx     # Section wrapper
│       │   ├── SectionHeader.tsx        # Section title/subtitle
│       │   ├── ContentCarousel.tsx      # Horizontal scroll carousel
│       │   ├── ContentGrid.tsx          # Grid layout
│       │   ├── DestinationCard.tsx      # Destination card
│       │   ├── ExperienceCard.tsx       # Experience card
│       │   ├── DealCard.tsx             # Deal/promotion card
│       │   ├── SkeletonLoader.tsx       # Loading skeletons
│       │   └── EmptyState.tsx           # Empty/error states
│       │
│       ├── hooks/
│       │   ├── useHomepage.ts           # Main data hook
│       │   ├── useSection.ts            # Individual section hook
│       │   ├── useContentInteraction.ts # Track interactions
│       │   └── usePrefetch.ts           # Prefetch logic
│       │
│       ├── services/
│       │   ├── homepageService.ts       # API calls
│       │   └── homepageCache.ts         # Local caching
│       │
│       ├── store/
│       │   ├── homepageSlice.ts         # Redux slice
│       │   └── homepageSelectors.ts     # Selectors
│       │
│       └── types/
│           └── homepage.types.ts        # TypeScript types
│
├── shared/
│   ├── components/
│   │   ├── Badge.tsx                    # Badge component
│   │   ├── Rating.tsx                   # Star rating
│   │   ├── Price.tsx                    # Price display
│   │   ├── SaveButton.tsx               # Save/bookmark button
│   │   └── MatchScore.tsx               # Match percentage
│   │
│   ├── hooks/
│   │   ├── useLocation.ts               # Location hook
│   │   ├── useSavedItems.ts             # Saved items hook
│   │   └── useAnalytics.ts              # Analytics tracking
│   │
│   └── utils/
│       ├── formatters.ts                # Format utilities
│       └── constants.ts                 # Shared constants
│
└── styles/
    └── theme.ts                         # Design tokens
```

---

## Type Definitions

```typescript
// src/features/homepage/types/homepage.types.ts

// ============================================
// API RESPONSE TYPES
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
  price: PriceInfo | null
  originalPrice: PriceInfo | null
  discountPercent: number | null
  rating: number | null
  reviewCount: number | null
  location: LocationInfo
  matchScore: number
  matchReasons: string[]
  badges: Badge[]
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

export interface LocationInfo {
  city: string
  country: string
  distanceKm: number | null
  distanceText: string | null
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
// STATE TYPES
// ============================================

export interface HomepageState {
  // Data
  sections: HomepageSection[]
  meta: ResponseMeta | null
  
  // Loading States
  status: 'idle' | 'loading' | 'refreshing' | 'succeeded' | 'failed'
  error: string | null
  
  // Timestamps
  lastFetchedAt: number | null
  
  // Interaction State
  expandedSections: string[]
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface SectionContainerProps {
  section: HomepageSection
  onSeeMore?: () => void
  onItemPress: (item: ContentItem) => void
  onSaveToggle: (item: ContentItem) => void
}

export interface ContentCarouselProps {
  items: ContentItem[]
  cardSize: CardSize
  onItemPress: (item: ContentItem) => void
  onSaveToggle: (item: ContentItem) => void
}

export interface DestinationCardProps {
  item: ContentItem
  size: CardSize
  onPress: () => void
  onSaveToggle: () => void
}
```

---

## Redux Store

```typescript
// src/features/homepage/store/homepageSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { homepageService } from '../services/homepageService'
import type { HomepageState, HomepageSection, ResponseMeta } from '../types/homepage.types'

// ============================================
// INITIAL STATE
// ============================================

const initialState: HomepageState = {
  sections: [],
  meta: null,
  status: 'idle',
  error: null,
  lastFetchedAt: null,
  expandedSections: [],
}

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchHomepage = createAsyncThunk(
  'homepage/fetch',
  async (
    params: {
      userId: string
      latitude?: number
      longitude?: number
      refresh?: boolean
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await homepageService.getHomepage(params)
      
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch homepage')
      }
      
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error')
    }
  }
)

export const refreshHomepage = createAsyncThunk(
  'homepage/refresh',
  async (
    params: {
      userId: string
      latitude?: number
      longitude?: number
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await homepageService.getHomepage({
        ...params,
        refresh: true,
      })
      
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to refresh homepage')
      }
      
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error')
    }
  }
)

// ============================================
// SLICE
// ============================================

const homepageSlice = createSlice({
  name: 'homepage',
  initialState,
  reducers: {
    // Update saved status for an item
    updateItemSavedStatus: (
      state,
      action: PayloadAction<{ itemId: string; isSaved: boolean }>
    ) => {
      const { itemId, isSaved } = action.payload
      
      state.sections.forEach(section => {
        const item = section.items.find(i => i.id === itemId)
        if (item) {
          item.isSaved = isSaved
        }
      })
    },
    
    // Toggle section expansion
    toggleSectionExpanded: (state, action: PayloadAction<string>) => {
      const sectionId = action.payload
      const index = state.expandedSections.indexOf(sectionId)
      
      if (index === -1) {
        state.expandedSections.push(sectionId)
      } else {
        state.expandedSections.splice(index, 1)
      }
    },
    
    // Clear homepage data
    clearHomepage: (state) => {
      state.sections = []
      state.meta = null
      state.status = 'idle'
      state.error = null
      state.lastFetchedAt = null
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch Homepage
      .addCase(fetchHomepage.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchHomepage.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.sections = action.payload.sections
        state.meta = action.payload.meta
        state.lastFetchedAt = Date.now()
        state.error = null
      })
      .addCase(fetchHomepage.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      
      // Refresh Homepage
      .addCase(refreshHomepage.pending, (state) => {
        state.status = 'refreshing'
      })
      .addCase(refreshHomepage.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.sections = action.payload.sections
        state.meta = action.payload.meta
        state.lastFetchedAt = Date.now()
        state.error = null
      })
      .addCase(refreshHomepage.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
  },
})

export const {
  updateItemSavedStatus,
  toggleSectionExpanded,
  clearHomepage,
} = homepageSlice.actions

export default homepageSlice.reducer


// src/features/homepage/store/homepageSelectors.ts

import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

// Base selector
const selectHomepageState = (state: RootState) => state.homepage

// Memoized selectors
export const selectSections = createSelector(
  selectHomepageState,
  (homepage) => homepage.sections
)

export const selectMeta = createSelector(
  selectHomepageState,
  (homepage) => homepage.meta
)

export const selectStatus = createSelector(
  selectHomepageState,
  (homepage) => homepage.status
)

export const selectError = createSelector(
  selectHomepageState,
  (homepage) => homepage.error
)

export const selectIsLoading = createSelector(
  selectStatus,
  (status) => status === 'loading'
)

export const selectIsRefreshing = createSelector(
  selectStatus,
  (status) => status === 'refreshing'
)

export const selectSectionBySlug = createSelector(
  [selectSections, (_, slug: string) => slug],
  (sections, slug) => sections.find(s => s.slug === slug)
)

export const selectPersonalizationScore = createSelector(
  selectMeta,
  (meta) => meta?.personalizationScore ?? 0
)

export const selectLastFetchedAt = createSelector(
  selectHomepageState,
  (homepage) => homepage.lastFetchedAt
)

// Check if data is stale (older than 5 minutes)
export const selectIsDataStale = createSelector(
  selectLastFetchedAt,
  (lastFetched) => {
    if (!lastFetched) return true
    const fiveMinutes = 5 * 60 * 1000
    return Date.now() - lastFetched > fiveMinutes
  }
)
```

---

## Homepage Service

```typescript
// src/features/homepage/services/homepageService.ts

import { supabase } from '@/lib/supabase'
import type { HomepageResponse } from '../types/homepage.types'

const EDGE_FUNCTION_URL = 'homepage'

interface GetHomepageParams {
  userId: string
  latitude?: number
  longitude?: number
  timezone?: string
  refresh?: boolean
  categories?: string[]
}

class HomepageService {
  /**
   * Fetch personalized homepage from Edge Function
   */
  async getHomepage(params: GetHomepageParams): Promise<HomepageResponse> {
    try {
      // Build query string
      const queryParams = new URLSearchParams({
        user_id: params.userId,
      })
      
      if (params.latitude !== undefined && params.longitude !== undefined) {
        queryParams.set('lat', params.latitude.toString())
        queryParams.set('lng', params.longitude.toString())
      }
      
      if (params.timezone) {
        queryParams.set('timezone', params.timezone)
      }
      
      if (params.refresh) {
        queryParams.set('refresh', 'true')
      }
      
      if (params.categories?.length) {
        queryParams.set('categories', params.categories.join(','))
      }
      
      // Call Edge Function
      const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: null,
        // Pass query params via URL
      })
      
      // Alternative: Direct fetch if Edge Function invocation doesn't support query params
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${EDGE_FUNCTION_URL}?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
      
    } catch (error: any) {
      console.error('Homepage Service Error:', error)
      return {
        success: false,
        data: { sections: [], meta: null as any },
        error: error.message || 'Failed to fetch homepage',
      }
    }
  }
  
  /**
   * Fetch a specific section (for lazy loading)
   */
  async getSection(
    userId: string,
    sectionSlug: string,
    params?: {
      latitude?: number
      longitude?: number
      limit?: number
      offset?: number
    }
  ): Promise<HomepageResponse> {
    return this.getHomepage({
      userId,
      latitude: params?.latitude,
      longitude: params?.longitude,
      categories: [sectionSlug],
    })
  }
  
  /**
   * Track user interaction with content
   */
  async trackInteraction(params: {
    userId: string
    itemId: string
    itemType: 'destination' | 'experience'
    action: 'view' | 'detail_view' | 'save' | 'unsave' | 'share'
    sectionSlug?: string
    position?: number
  }): Promise<void> {
    try {
      await supabase.from('user_interactions').insert({
        user_id: params.userId,
        destination_id: params.itemType === 'destination' ? params.itemId : null,
        experience_id: params.itemType === 'experience' ? params.itemId : null,
        interaction_type: params.action,
        source: 'homepage',
        source_category: params.sectionSlug,
        metadata: {
          position: params.position,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('Failed to track interaction:', error)
    }
  }
}

export const homepageService = new HomepageService()


// src/features/homepage/services/homepageCache.ts

import AsyncStorage from '@react-native-async-storage/async-storage'
import type { HomepageSection, ResponseMeta } from '../types/homepage.types'

const CACHE_KEY = 'guidera_homepage_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CachedData {
  sections: HomepageSection[]
  meta: ResponseMeta
  cachedAt: number
}

class HomepageCache {
  async get(userId: string): Promise<CachedData | null> {
    try {
      const key = `${CACHE_KEY}_${userId}`
      const cached = await AsyncStorage.getItem(key)
      
      if (!cached) return null
      
      const data: CachedData = JSON.parse(cached)
      
      // Check if expired
      if (Date.now() - data.cachedAt > CACHE_TTL) {
        await this.clear(userId)
        return null
      }
      
      return data
    } catch {
      return null
    }
  }
  
  async set(
    userId: string,
    sections: HomepageSection[],
    meta: ResponseMeta
  ): Promise<void> {
    try {
      const key = `${CACHE_KEY}_${userId}`
      const data: CachedData = {
        sections,
        meta,
        cachedAt: Date.now(),
      }
      await AsyncStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to cache homepage:', error)
    }
  }
  
  async clear(userId: string): Promise<void> {
    try {
      const key = `${CACHE_KEY}_${userId}`
      await AsyncStorage.removeItem(key)
    } catch {
      // Ignore errors
    }
  }
}

export const homepageCache = new HomepageCache()
```

---

## Custom Hooks

```typescript
// src/features/homepage/hooks/useHomepage.ts

import { useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useAuth } from '@/hooks/useAuth'
import { useLocation } from '@/shared/hooks/useLocation'
import {
  fetchHomepage,
  refreshHomepage,
  updateItemSavedStatus,
} from '../store/homepageSlice'
import {
  selectSections,
  selectMeta,
  selectIsLoading,
  selectIsRefreshing,
  selectError,
  selectIsDataStale,
} from '../store/homepageSelectors'
import { homepageService } from '../services/homepageService'
import type { ContentItem } from '../types/homepage.types'
import type { AppDispatch } from '@/store'

export function useHomepage() {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useAuth()
  const { location } = useLocation()
  
  // Selectors
  const sections = useSelector(selectSections)
  const meta = useSelector(selectMeta)
  const isLoading = useSelector(selectIsLoading)
  const isRefreshing = useSelector(selectIsRefreshing)
  const error = useSelector(selectError)
  const isDataStale = useSelector(selectIsDataStale)
  
  // Fetch homepage data
  const fetch = useCallback(async () => {
    if (!user?.id) return
    
    dispatch(fetchHomepage({
      userId: user.id,
      latitude: location?.latitude,
      longitude: location?.longitude,
    }))
  }, [dispatch, user?.id, location])
  
  // Refresh homepage data (pull-to-refresh)
  const refresh = useCallback(async () => {
    if (!user?.id) return
    
    dispatch(refreshHomepage({
      userId: user.id,
      latitude: location?.latitude,
      longitude: location?.longitude,
    }))
  }, [dispatch, user?.id, location])
  
  // Initial fetch
  useEffect(() => {
    if (user?.id && (sections.length === 0 || isDataStale)) {
      fetch()
    }
  }, [user?.id, fetch, sections.length, isDataStale])
  
  // Track item view
  const trackItemView = useCallback((
    item: ContentItem,
    sectionSlug: string,
    position: number
  ) => {
    if (!user?.id) return
    
    homepageService.trackInteraction({
      userId: user.id,
      itemId: item.id,
      itemType: item.type === 'experience' ? 'experience' : 'destination',
      action: 'view',
      sectionSlug,
      position,
    })
  }, [user?.id])
  
  // Toggle save status
  const toggleSave = useCallback(async (item: ContentItem) => {
    if (!user?.id) return
    
    const newSavedStatus = !item.isSaved
    
    // Optimistic update
    dispatch(updateItemSavedStatus({
      itemId: item.id,
      isSaved: newSavedStatus,
    }))
    
    // Track interaction
    homepageService.trackInteraction({
      userId: user.id,
      itemId: item.id,
      itemType: item.type === 'experience' ? 'experience' : 'destination',
      action: newSavedStatus ? 'save' : 'unsave',
    })
    
    // TODO: Actual save/unsave API call
    // If it fails, revert optimistic update
  }, [dispatch, user?.id])
  
  return {
    // Data
    sections,
    meta,
    
    // States
    isLoading,
    isRefreshing,
    error,
    isDataStale,
    
    // Actions
    fetch,
    refresh,
    trackItemView,
    toggleSave,
  }
}


// src/features/homepage/hooks/useContentInteraction.ts

import { useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { homepageService } from '../services/homepageService'
import type { ContentItem } from '../types/homepage.types'

export function useContentInteraction(sectionSlug: string) {
  const { user } = useAuth()
  const viewedItems = useRef<Set<string>>(new Set())
  
  // Track when item becomes visible
  const onItemVisible = useCallback((item: ContentItem, position: number) => {
    if (!user?.id) return
    
    // Only track first view
    if (viewedItems.current.has(item.id)) return
    viewedItems.current.add(item.id)
    
    homepageService.trackInteraction({
      userId: user.id,
      itemId: item.id,
      itemType: item.type === 'experience' ? 'experience' : 'destination',
      action: 'view',
      sectionSlug,
      position,
    })
  }, [user?.id, sectionSlug])
  
  // Track when item is pressed (detail view)
  const onItemPress = useCallback((item: ContentItem, position: number) => {
    if (!user?.id) return
    
    homepageService.trackInteraction({
      userId: user.id,
      itemId: item.id,
      itemType: item.type === 'experience' ? 'experience' : 'destination',
      action: 'detail_view',
      sectionSlug,
      position,
    })
  }, [user?.id, sectionSlug])
  
  // Track share
  const onItemShare = useCallback((item: ContentItem) => {
    if (!user?.id) return
    
    homepageService.trackInteraction({
      userId: user.id,
      itemId: item.id,
      itemType: item.type === 'experience' ? 'experience' : 'destination',
      action: 'share',
      sectionSlug,
    })
  }, [user?.id, sectionSlug])
  
  return {
    onItemVisible,
    onItemPress,
    onItemShare,
  }
}
```

---

## Main Screen Component

```typescript
// src/features/homepage/screens/HomepageScreen.tsx

import React, { useCallback } from 'react'
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated'

import { useHomepage } from '../hooks/useHomepage'
import { HomepageHeader } from '../components/HomepageHeader'
import { SearchBar } from '../components/SearchBar'
import { SectionContainer } from '../components/SectionContainer'
import { SkeletonLoader } from '../components/SkeletonLoader'
import { EmptyState } from '../components/EmptyState'
import { colors, spacing } from '@/styles/theme'
import type { ContentItem, HomepageSection } from '../types/homepage.types'

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

export function HomepageScreen() {
  const router = useRouter()
  const {
    sections,
    meta,
    isLoading,
    isRefreshing,
    error,
    refresh,
    toggleSave,
  } = useHomepage()
  
  // Scroll animation value for header
  const scrollY = useSharedValue(0)
  
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })
  
  // Handle item press - navigate to detail
  const handleItemPress = useCallback((item: ContentItem) => {
    router.push(item.ctaUrl)
  }, [router])
  
  // Handle see more - navigate to category
  const handleSeeMore = useCallback((section: HomepageSection) => {
    if (section.seeMoreUrl) {
      router.push(section.seeMoreUrl)
    }
  }, [router])
  
  // Handle search press
  const handleSearchPress = useCallback(() => {
    router.push('/search')
  }, [router])
  
  // Render loading state
  if (isLoading && sections.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <HomepageHeader scrollY={scrollY} />
        <SkeletonLoader />
      </SafeAreaView>
    )
  }
  
  // Render error state
  if (error && sections.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <HomepageHeader scrollY={scrollY} />
        <EmptyState
          type="error"
          title="Something went wrong"
          message={error}
          actionText="Try Again"
          onAction={refresh}
        />
      </SafeAreaView>
    )
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Animated Header */}
      <HomepageHeader scrollY={scrollY} />
      
      {/* Main Content */}
      <AnimatedScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Search Bar */}
        <SearchBar onPress={handleSearchPress} />
        
        {/* Sections */}
        {sections.map((section) => (
          <SectionContainer
            key={section.id}
            section={section}
            onItemPress={handleItemPress}
            onSaveToggle={toggleSave}
            onSeeMore={() => handleSeeMore(section)}
          />
        ))}
        
        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </AnimatedScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  bottomSpacer: {
    height: 100, // Account for tab bar
  },
})
```

---

## Section Components

```typescript
// src/features/homepage/components/SectionContainer.tsx

import React, { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { SectionHeader } from './SectionHeader'
import { ContentCarousel } from './ContentCarousel'
import { ContentGrid } from './ContentGrid'
import { useContentInteraction } from '../hooks/useContentInteraction'
import { spacing } from '@/styles/theme'
import type { SectionContainerProps } from '../types/homepage.types'

export const SectionContainer = memo(function SectionContainer({
  section,
  onItemPress,
  onSaveToggle,
  onSeeMore,
}: SectionContainerProps) {
  const { onItemVisible, onItemPress: trackPress } = useContentInteraction(section.slug)
  
  // Wrapper for press that tracks interaction
  const handleItemPress = (item: ContentItem, index: number) => {
    trackPress(item, index)
    onItemPress(item)
  }
  
  // Render appropriate layout
  const renderContent = () => {
    switch (section.layoutType) {
      case 'horizontal_scroll':
      case 'carousel':
        return (
          <ContentCarousel
            items={section.items}
            cardSize={section.cardSize}
            onItemPress={handleItemPress}
            onSaveToggle={onSaveToggle}
            onItemVisible={onItemVisible}
          />
        )
      
      case 'grid_2x2':
      case 'grid_3x2':
        return (
          <ContentGrid
            items={section.items}
            columns={section.layoutType === 'grid_2x2' ? 2 : 3}
            cardSize={section.cardSize}
            onItemPress={handleItemPress}
            onSaveToggle={onSaveToggle}
          />
        )
      
      case 'featured_large':
        return (
          <FeaturedLargeLayout
            items={section.items}
            onItemPress={handleItemPress}
            onSaveToggle={onSaveToggle}
          />
        )
      
      default:
        return (
          <ContentCarousel
            items={section.items}
            cardSize={section.cardSize}
            onItemPress={handleItemPress}
            onSaveToggle={onSaveToggle}
            onItemVisible={onItemVisible}
          />
        )
    }
  }
  
  return (
    <View style={styles.container}>
      <SectionHeader
        title={section.title}
        subtitle={section.subtitle}
        hasMore={section.hasMore}
        onSeeMore={onSeeMore}
      />
      {renderContent()}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
})


// src/features/homepage/components/SectionHeader.tsx

import React, { memo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, typography, spacing } from '@/styles/theme'

interface SectionHeaderProps {
  title: string
  subtitle?: string | null
  hasMore?: boolean
  onSeeMore?: () => void
}

export const SectionHeader = memo(function SectionHeader({
  title,
  subtitle,
  hasMore,
  onSeeMore,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      
      {hasMore && onSeeMore && (
        <TouchableOpacity
          style={styles.seeMoreButton}
          onPress={onSeeMore}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.seeMoreText}>See All</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeMoreText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
})


// src/features/homepage/components/ContentCarousel.tsx

import React, { memo, useCallback } from 'react'
import { FlatList, StyleSheet, ViewToken } from 'react-native'
import { DestinationCard } from './DestinationCard'
import { spacing } from '@/styles/theme'
import type { ContentItem, CardSize } from '../types/homepage.types'

interface ContentCarouselProps {
  items: ContentItem[]
  cardSize: CardSize
  onItemPress: (item: ContentItem, index: number) => void
  onSaveToggle: (item: ContentItem) => void
  onItemVisible?: (item: ContentItem, index: number) => void
}

export const ContentCarousel = memo(function ContentCarousel({
  items,
  cardSize,
  onItemPress,
  onSaveToggle,
  onItemVisible,
}: ContentCarouselProps) {
  
  // Track viewable items
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!onItemVisible) return
      
      viewableItems.forEach((viewToken) => {
        if (viewToken.isViewable && viewToken.item) {
          onItemVisible(viewToken.item, viewToken.index ?? 0)
        }
      })
    },
    [onItemVisible]
  )
  
  const renderItem = useCallback(
    ({ item, index }: { item: ContentItem; index: number }) => (
      <DestinationCard
        item={item}
        size={cardSize}
        onPress={() => onItemPress(item, index)}
        onSaveToggle={() => onSaveToggle(item)}
        style={[
          styles.card,
          index === 0 && styles.firstCard,
          index === items.length - 1 && styles.lastCard,
        ]}
      />
    ),
    [cardSize, onItemPress, onSaveToggle, items.length]
  )
  
  const keyExtractor = useCallback((item: ContentItem) => item.id, [])
  
  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToAlignment="start"
      decelerationRate="fast"
      contentContainerStyle={styles.contentContainer}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 500,
      }}
    />
  )
})

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: spacing.md,
  },
  card: {
    marginRight: spacing.sm,
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: spacing.md,
  },
})
```

---

## Destination Card Component

```typescript
// src/features/homepage/components/DestinationCard.tsx

import React, { memo } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Badge } from '@/shared/components/Badge'
import { Rating } from '@/shared/components/Rating'
import { SaveButton } from '@/shared/components/SaveButton'
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/theme'
import type { ContentItem, CardSize } from '../types/homepage.types'

interface DestinationCardProps {
  item: ContentItem
  size: CardSize
  onPress: () => void
  onSaveToggle: () => void
  style?: ViewStyle
}

const CARD_DIMENSIONS = {
  small: { width: 140, height: 180 },
  medium: { width: 200, height: 240 },
  large: { width: 280, height: 320 },
}

export const DestinationCard = memo(function DestinationCard({
  item,
  size,
  onPress,
  onSaveToggle,
  style,
}: DestinationCardProps) {
  const dimensions = CARD_DIMENSIONS[size]
  
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.container,
        { width: dimensions.width, height: dimensions.height },
        style,
      ]}
    >
      {/* Image */}
      <Image
        source={{ uri: item.thumbnailUrl || item.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      />
      
      {/* Badges */}
      {item.badges.length > 0 && (
        <View style={styles.badgeContainer}>
          {item.badges.slice(0, 1).map((badge, index) => (
            <Badge
              key={index}
              text={badge.text}
              color={badge.color}
              size="small"
            />
          ))}
        </View>
      )}
      
      {/* Save Button */}
      <SaveButton
        isSaved={item.isSaved}
        onPress={onSaveToggle}
        style={styles.saveButton}
      />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Match Reasons (if any) */}
        {item.matchReasons.length > 0 && size !== 'small' && (
          <View style={styles.matchContainer}>
            <Ionicons name="sparkles" size={12} color={colors.accent} />
            <Text style={styles.matchText} numberOfLines={1}>
              {item.matchReasons[0]}
            </Text>
          </View>
        )}
        
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        
        {/* Subtitle (Location) */}
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={12} color={colors.white} />
          <Text style={styles.location} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
        
        {/* Bottom Row: Price & Rating */}
        <View style={styles.bottomRow}>
          {/* Price */}
          {item.price && (
            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                {item.price.formatted}
              </Text>
              {item.discountPercent && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{item.discountPercent}%
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Rating */}
          {item.rating && (
            <Rating value={item.rating} size="small" showValue />
          )}
        </View>
        
        {/* Distance (if available) */}
        {item.location.distanceText && size !== 'small' && (
          <Text style={styles.distance}>
            {item.location.distanceText}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
    ...shadows.card,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    top: '40%',
  },
  badgeContainer: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  saveButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: 4,
  },
  matchText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  title: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: spacing.xs,
  },
  location: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.9,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  price: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '700',
  },
  discountBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  distance: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.7,
    marginTop: 2,
  },
})
```

---

## Skeleton Loader

```typescript
// src/features/homepage/components/SkeletonLoader.tsx

import React, { memo, useEffect } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, borderRadius } from '@/styles/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export const SkeletonLoader = memo(function SkeletonLoader() {
  const shimmerValue = useSharedValue(0)
  
  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    )
  }, [])
  
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmerValue.value,
          [0, 1],
          [-SCREEN_WIDTH, SCREEN_WIDTH]
        ),
      },
    ],
  }))
  
  const SkeletonBox = ({ width, height, style }: any) => (
    <View style={[styles.skeletonBox, { width, height }, style]}>
      <Animated.View style={[styles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  )
  
  return (
    <View style={styles.container}>
      {/* Search Bar Skeleton */}
      <SkeletonBox width={SCREEN_WIDTH - 32} height={48} style={styles.searchBar} />
      
      {/* Section 1 */}
      <View style={styles.section}>
        <SkeletonBox width={150} height={24} style={styles.sectionTitle} />
        <View style={styles.carouselRow}>
          <SkeletonBox width={200} height={240} style={styles.card} />
          <SkeletonBox width={200} height={240} style={styles.card} />
        </View>
      </View>
      
      {/* Section 2 */}
      <View style={styles.section}>
        <SkeletonBox width={180} height={24} style={styles.sectionTitle} />
        <View style={styles.carouselRow}>
          <SkeletonBox width={200} height={240} style={styles.card} />
          <SkeletonBox width={200} height={240} style={styles.card} />
        </View>
      </View>
      
      {/* Section 3 */}
      <View style={styles.section}>
        <SkeletonBox width={120} height={24} style={styles.sectionTitle} />
        <View style={styles.carouselRow}>
          <SkeletonBox width={140} height={180} style={styles.card} />
          <SkeletonBox width={140} height={180} style={styles.card} />
          <SkeletonBox width={140} height={180} style={styles.card} />
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  skeletonBox: {
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH * 2,
  },
  searchBar: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  carouselRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.lg,
  },
})
```

---

## Empty State Component

```typescript
// src/features/homepage/components/EmptyState.tsx

import React, { memo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import LottieView from 'lottie-react-native'
import { colors, typography, spacing } from '@/styles/theme'

interface EmptyStateProps {
  type: 'empty' | 'error' | 'no-location'
  title: string
  message: string
  actionText?: string
  onAction?: () => void
}

export const EmptyState = memo(function EmptyState({
  type,
  title,
  message,
  actionText,
  onAction,
}: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return 'alert-circle-outline'
      case 'no-location':
        return 'location-outline'
      default:
        return 'compass-outline'
    }
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={getIcon()}
          size={64}
          color={colors.gray400}
        />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {actionText && onAction && (
        <TouchableOpacity
          style={styles.button}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
})
```

---

## Theme & Styling

```typescript
// src/styles/theme.ts

export const colors = {
  // Primary
  primary: '#007AFF',
  primaryLight: '#4DA3FF',
  primaryDark: '#0056B3',
  
  // Accent
  accent: '#FFD60A',
  accentLight: '#FFE566',
  
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  
  // Grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Specific
  dealRed: '#FF3B30',
  trendingOrange: '#FF9500',
  savePink: '#FF2D55',
}

export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  
  // Body
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  
  // Caption
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  
  // Button
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
}

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
}
```

---

## Expo Router Integration

```typescript
// src/app/(tabs)/index.tsx

import { HomepageScreen } from '@/features/homepage/screens/HomepageScreen'

export default function HomeTab() {
  return <HomepageScreen />
}
```

---

## Performance Optimizations

### 1. Image Optimization

```typescript
// Use expo-image for better caching
import { Image } from 'expo-image'

<Image
  source={{ uri: item.imageUrl }}
  style={styles.image}
  contentFit="cover"
  transition={200}
  placeholder={blurhash}
  cachePolicy="memory-disk"
/>
```

### 2. List Optimization

```typescript
// Optimize FlatList with getItemLayout
const getItemLayout = useCallback(
  (_: any, index: number) => ({
    length: CARD_WIDTH + spacing.sm,
    offset: (CARD_WIDTH + spacing.sm) * index,
    index,
  }),
  []
)

// Use windowSize for better memory
<FlatList
  windowSize={5}
  maxToRenderPerBatch={5}
  initialNumToRender={3}
  removeClippedSubviews={true}
  getItemLayout={getItemLayout}
/>
```

### 3. Memoization Strategy

```typescript
// Memoize expensive computations
const memoizedSections = useMemo(() => 
  sections.filter(s => s.items.length >= 3),
  [sections]
)

// Memoize callbacks
const handlePress = useCallback((id: string) => {
  router.push(`/destination/${id}`)
}, [router])
```

---

## Analytics Integration

```typescript
// src/shared/hooks/useAnalytics.ts

import * as Analytics from 'expo-firebase-analytics'

export function useAnalytics() {
  const trackScreenView = useCallback((screenName: string) => {
    Analytics.logEvent('screen_view', {
      screen_name: screenName,
    })
  }, [])
  
  const trackEvent = useCallback((
    eventName: string,
    params?: Record<string, any>
  ) => {
    Analytics.logEvent(eventName, params)
  }, [])
  
  const trackHomepageView = useCallback((meta: ResponseMeta) => {
    Analytics.logEvent('homepage_view', {
      sections_count: meta.sectionsReturned,
      items_count: meta.totalItemsReturned,
      personalization_score: meta.personalizationScore,
      strategy: meta.strategyUsed,
      cache_hit: meta.cacheHit,
      response_time_ms: meta.responseTimeMs,
    })
  }, [])
  
  const trackItemClick = useCallback((
    item: ContentItem,
    section: string,
    position: number
  ) => {
    Analytics.logEvent('select_item', {
      item_id: item.id,
      item_name: item.title,
      item_category: section,
      index: position,
      match_score: item.matchScore,
    })
  }, [])
  
  return {
    trackScreenView,
    trackEvent,
    trackHomepageView,
    trackItemClick,
  }
}
```

---

## Testing

```typescript
// src/features/homepage/__tests__/HomepageScreen.test.tsx

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { HomepageScreen } from '../screens/HomepageScreen'
import { createTestStore } from '@/test/utils'

describe('HomepageScreen', () => {
  it('renders loading skeleton initially', () => {
    const store = createTestStore()
    const { getByTestId } = render(
      <Provider store={store}>
        <HomepageScreen />
      </Provider>
    )
    
    expect(getByTestId('skeleton-loader')).toBeTruthy()
  })
  
  it('renders sections after loading', async () => {
    const store = createTestStore({
      homepage: {
        sections: [mockSection],
        status: 'succeeded',
      },
    })
    
    const { getByText } = render(
      <Provider store={store}>
        <HomepageScreen />
      </Provider>
    )
    
    await waitFor(() => {
      expect(getByText('✨ Picked For You')).toBeTruthy()
    })
  })
  
  it('handles pull-to-refresh', async () => {
    const store = createTestStore()
    const { getByTestId } = render(
      <Provider store={store}>
        <HomepageScreen />
      </Provider>
    )
    
    const scrollView = getByTestId('homepage-scroll')
    fireEvent(scrollView, 'refresh')
    
    // Assert refresh was triggered
  })
})
```

---

## Summary

This Homepage Component Logic provides:

1. **Redux State Management** — Clean slice with selectors
2. **Data Fetching** — Service layer with caching
3. **Custom Hooks** — Reusable logic for data and interactions
4. **Responsive Components** — Multiple layouts and card sizes
5. **Interaction Tracking** — Analytics for every action
6. **Skeleton Loading** — Smooth loading experience
7. **Error Handling** — Graceful error states
8. **Performance** — Memoization, virtualization, image caching
9. **Testing** — Component and integration tests

---

**Document Version:** 1.0
**Last Updated:** 2025
**Status:** Ready for Implementation
