/**
 * HOMEPAGE TYPES
 * 
 * Type definitions for the homepage recommendation engine.
 */

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
  description?: string | null
  iconName?: string | null
  layoutType: LayoutType
  cardSize: CardSize
  items: ContentItem[]
  itemCount: number
  totalAvailable?: number
  hasMore: boolean
  seeMoreUrl?: string | null
  priority: number
  isPersonalized: boolean
  generatedAt?: string
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
  originalPrice?: PriceInfo | null
  discountPercent?: number | null
  rating: number | null
  reviewCount?: number | null
  location: LocationInfo
  matchScore: number
  matchReasons: string[]
  badges: Badge[]
  ctaText: string
  ctaUrl: string
  isSaved: boolean
  slug?: string
  budgetLevel?: number
  tags?: string[]
  distanceKm?: number | null
  distanceText?: string | null
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
  prefetchUrls?: string[]
}

// ============================================
// STATE TYPES
// ============================================

export interface HomepageState {
  sections: HomepageSection[]
  meta: ResponseMeta | null
  status: 'idle' | 'loading' | 'refreshing' | 'succeeded' | 'failed'
  error: string | null
  lastFetchedAt: number | null
  expandedSections: string[]
}

// ============================================
// REQUEST TYPES
// ============================================

export interface GetHomepageParams {
  userId: string
  latitude?: number
  longitude?: number
  timezone?: string
  refresh?: boolean
  categories?: string[]
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
