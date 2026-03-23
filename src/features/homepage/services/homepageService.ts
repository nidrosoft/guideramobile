/**
 * HOMEPAGE SERVICE
 * 
 * Fetches personalized homepage content from the Edge Function.
 * Falls back to direct database queries if Edge Function is unavailable.
 */

import { supabase } from '@/lib/supabase/client'
import { invokeEdgeFn } from '@/utils/retry'
import type { 
  HomepageResponse, 
  HomepageSection, 
  ContentItem, 
  GetHomepageParams,
  ResponseMeta 
} from '../types/homepage.types'

const EDGE_FUNCTION_NAME = 'homepage'
const SECTION_REFRESH_FN = 'section-refresh'
const PERSONALIZE_FN = 'personalize-homepage'

// Section metadata: maps cache slugs to display properties
const SECTION_META: Record<string, {
  id: string
  title: string
  subtitle: string
  layoutType: 'horizontal_scroll' | 'featured_large'
  cardSize: 'small' | 'medium' | 'large'
  priority: number
  isPersonalized: boolean
}> = {
  'for-you': { id: 'for-you', title: 'For You', subtitle: 'Personalized picks based on your interests', layoutType: 'horizontal_scroll', cardSize: 'large', priority: 0, isPersonalized: true },
  'popular-destinations': { id: 'popular', title: 'Popular Destinations', subtitle: "Travelers' top picks this season", layoutType: 'horizontal_scroll', cardSize: 'medium', priority: 1, isPersonalized: false },
  'places': { id: 'places', title: 'Popular Places', subtitle: 'Most visited attractions worldwide', layoutType: 'horizontal_scroll', cardSize: 'medium', priority: 3, isPersonalized: false },
  'must-see': { id: 'must-see', title: 'Must See', subtitle: 'Iconic landmarks worldwide', layoutType: 'horizontal_scroll', cardSize: 'medium', priority: 4, isPersonalized: false },
  'editors-choice': { id: 'editors-choice', title: "Editor's Choice", subtitle: 'Handpicked by our travel experts', layoutType: 'featured_large', cardSize: 'large', priority: 5, isPersonalized: false },
  'trending': { id: 'trending', title: 'Trending Now', subtitle: 'What travelers are loving right now', layoutType: 'horizontal_scroll', cardSize: 'medium', priority: 6, isPersonalized: false },
  'hidden-gems': { id: 'hidden-gems', title: 'Best Discover', subtitle: 'Hidden gems & off the beaten path', layoutType: 'horizontal_scroll', cardSize: 'medium', priority: 7, isPersonalized: false },
  'budget-friendly': { id: 'budget-friendly', title: 'Budget Friendly', subtitle: "Amazing experiences that won't break the bank", layoutType: 'horizontal_scroll', cardSize: 'medium', priority: 8, isPersonalized: false },
  'luxury-escapes': { id: 'luxury', title: 'Luxury Escapes', subtitle: 'Indulge in extraordinary experiences', layoutType: 'horizontal_scroll', cardSize: 'large', priority: 9, isPersonalized: false },
  'adventure': { id: 'adventure', title: 'Adventure Awaits', subtitle: 'For the thrill seekers and explorers', layoutType: 'horizontal_scroll', cardSize: 'medium', priority: 10, isPersonalized: false },
  'family-friendly': { id: 'family', title: 'Family Friendly', subtitle: 'Perfect destinations for the whole family', layoutType: 'horizontal_scroll', cardSize: 'medium', priority: 11, isPersonalized: false },
  'beach-islands': { id: 'beach', title: 'Beach & Islands', subtitle: 'Sun, sand, and paradise found', layoutType: 'horizontal_scroll', cardSize: 'medium', priority: 12, isPersonalized: false },
}

class HomepageService {
  /**
   * Fetch personalized homepage from Edge Function
   */
  async getHomepage(params: GetHomepageParams): Promise<HomepageResponse> {
    const startTime = Date.now()

    try {
      // 1. Try section_cache first (fastest path)
      if (!params.refresh) {
        try {
          const cacheResult = await this.getSectionsFromCache(params.userId)
          if (cacheResult.sections.length >= 3) {
            if (__DEV__) console.log(`[HomepageService] Cache hit: ${cacheResult.sections.length} sections, ${cacheResult.expiredSlugs.length} expired`)

            // Trigger background refresh for expired sections
            if (cacheResult.expiredSlugs.length > 0) {
              this.triggerBackgroundRefresh(cacheResult.expiredSlugs)
            }

            // Personalize cached sections for this user
            const personalizedSections = await this.personalizeSections(
              cacheResult.sections,
              params
            )

            return {
              success: true,
              data: {
                sections: personalizedSections.sections,
                meta: {
                  userId: params.userId,
                  personalizationScore: personalizedSections.confidenceScore,
                  strategyUsed: personalizedSections.strategy,
                  sectionsReturned: personalizedSections.sections.length,
                  totalItemsReturned: personalizedSections.sections.reduce((sum: number, s: HomepageSection) => sum + s.items.length, 0),
                  generatedAt: new Date().toISOString(),
                  cacheHit: true,
                  responseTimeMs: Date.now() - startTime,
                },
              },
            }
          }
        } catch (cacheErr) {
          if (__DEV__) console.warn('[HomepageService] Cache read failed, continuing to edge function:', cacheErr)
        }
      }

      // 2. Try Edge Function (personalized path)
      try {
        const { data, error } = await invokeEdgeFn(supabase, EDGE_FUNCTION_NAME, {
            user_id: params.userId,
            lat: params.latitude?.toString(),
            lng: params.longitude?.toString(),
            timezone: params.timezone,
            refresh: params.refresh || false,
            categories: params.categories,
        }, 'fast')

        if (!error && data?.success) {
          return data as HomepageResponse
        }
      } catch (edgeFunctionError) {
        if (__DEV__) console.warn('Edge Function unavailable, falling back to direct query:', edgeFunctionError)
      }

      // 3. Fallback: Direct database query
      return await this.getHomepageFallback(params)
      
    } catch (error: any) {
      console.error('Homepage Service Error:', error)
      return {
        success: false,
        data: { sections: [], meta: this.getEmptyMeta(params.userId) },
        error: error.message || 'Failed to fetch homepage',
      }
    }
  }

  /**
   * Read pre-computed sections from section_cache table.
   * Returns cached sections + list of expired slugs that need refresh.
   */
  private async getSectionsFromCache(userId: string): Promise<{
    sections: HomepageSection[]
    expiredSlugs: string[]
  }> {
    const { data: cacheRows, error } = await supabase
      .from('section_cache')
      .select('section_slug, data, item_count, expires_at, refresh_error')
      .gt('item_count', 0)
      .order('section_slug')

    if (error || !cacheRows || cacheRows.length === 0) {
      return { sections: [], expiredSlugs: [] }
    }

    // Fetch user's saved items to overlay isSaved status
    const { data: savedItems } = await supabase
      .from('user_saved_items')
      .select('destination_id')
      .eq('user_id', userId)

    const savedIds = new Set(savedItems?.map(s => s.destination_id) || [])
    const now = new Date()
    const sections: HomepageSection[] = []
    const expiredSlugs: string[] = []

    for (const row of cacheRows) {
      const meta = SECTION_META[row.section_slug]
      if (!meta) continue // unknown slug, skip

      const items = (row.data as ContentItem[]) || []
      if (items.length === 0) continue

      // Overlay isSaved from user's saved items
      const itemsWithSaved = items.map(item => ({
        ...item,
        isSaved: savedIds.has(item.id),
      }))

      sections.push({
        id: meta.id,
        slug: row.section_slug,
        title: meta.title,
        subtitle: meta.subtitle,
        layoutType: meta.layoutType,
        cardSize: meta.cardSize,
        items: itemsWithSaved,
        itemCount: itemsWithSaved.length,
        hasMore: true,
        isPersonalized: meta.isPersonalized,
        priority: meta.priority,
      })

      // Track expired sections for background refresh
      if (new Date(row.expires_at) < now) {
        expiredSlugs.push(row.section_slug)
      }
    }

    // Sort by priority
    sections.sort((a, b) => a.priority - b.priority)

    return { sections, expiredSlugs }
  }

  /**
   * Personalize cached sections via the personalize-homepage edge function.
   * Falls back to raw cached sections if personalization fails.
   */
  private async personalizeSections(
    cachedSections: HomepageSection[],
    params: GetHomepageParams
  ): Promise<{ sections: HomepageSection[]; strategy: 'cold' | 'warm' | 'hot'; confidenceScore: number }> {
    try {
      const { data, error } = await invokeEdgeFn(supabase, PERSONALIZE_FN, {
        user_id: params.userId,
        sections: cachedSections,
        lat: params.latitude,
        lng: params.longitude,
        timezone: params.timezone,
      }, 'fast')

      if (!error && data?.success && data.sections) {
        // Map personalized sections back to HomepageSection format
        const sections: HomepageSection[] = data.sections.map((sec: any) => {
          const meta = SECTION_META[sec.slug]
          return {
            id: sec.id || meta?.id || sec.slug,
            slug: sec.slug,
            title: sec.title || meta?.title || sec.slug,
            subtitle: sec.subtitle || meta?.subtitle || null,
            layoutType: sec.layoutType || meta?.layoutType || 'horizontal_scroll',
            cardSize: sec.cardSize || meta?.cardSize || 'medium',
            items: sec.items || [],
            itemCount: sec.items?.length || 0,
            hasMore: sec.hasMore ?? true,
            isPersonalized: sec.isPersonalized ?? true,
            priority: sec.priority ?? 50,
          }
        })

        return {
          sections,
          strategy: data.meta?.strategy || 'cold',
          confidenceScore: data.meta?.confidenceScore || 50,
        }
      }
    } catch (err) {
      if (__DEV__) console.warn('[HomepageService] Personalization failed, using cached sections:', err)
    }

    // Fallback: return cached sections as-is
    return { sections: cachedSections, strategy: 'cold', confidenceScore: 30 }
  }

  /**
   * Fire-and-forget background refresh for expired sections.
   */
  private triggerBackgroundRefresh(slugs: string[]): void {
    for (const slug of slugs) {
      invokeEdgeFn(supabase, SECTION_REFRESH_FN, { section_slug: slug }, 'fast')
        .catch((err) => {
          if (__DEV__) console.warn(`[HomepageService] Background refresh failed for ${slug}:`, err)
        })
    }
  }

  /**
   * Fallback method: Query database directly
   */
  private async getHomepageFallback(params: GetHomepageParams): Promise<HomepageResponse> {
    const startTime = Date.now()
    const sections: HomepageSection[] = []

    try {
      // Fetch all published destinations
      const { data: destinations, error } = await supabase
        .from('curated_destinations')
        .select('*')
        .eq('status', 'published')
        .order('priority', { ascending: false })

      if (error) throw error

      // Fetch user's saved items
      const { data: savedItems } = await supabase
        .from('user_saved_items')
        .select('destination_id')
        .eq('user_id', params.userId)

      const savedIds = new Set(savedItems?.map(s => s.destination_id) || [])

      // Generate sections from destinations
      if (destinations && destinations.length > 0) {
        const MIN = 2 // Minimum items to show a section

        // 1. Popular Destinations (stacked swipe cards)
        const popularDests = destinations
          .filter(d => d.primary_category === 'popular' || d.popularity_score > 700)
          .sort((a, b) => b.popularity_score - a.popularity_score)
          .slice(0, 10)
        if (popularDests.length >= MIN) {
          sections.push(this.createSection('popular', 'popular-destinations', 'Popular Destinations', "Travelers' top picks this season", popularDests, savedIds, 1))
        }

        // 2. Popular Places (horizontal scroll — different sort from popular destinations)
        const placesDests = destinations
          .sort((a, b) => (b.editor_rating || 0) - (a.editor_rating || 0))
          .slice(0, 10)
        if (placesDests.length >= MIN) {
          sections.push(this.createSection('places', 'places', 'Popular Places', 'Most visited attractions worldwide', placesDests, savedIds, 3))
        }

        // 3. Must See (highest-rated featured destinations)
        const mustSeeDests = destinations
          .filter(d => d.is_featured && (d.editor_rating || 0) >= 4.5)
          .sort((a, b) => (b.editor_rating || 0) - (a.editor_rating || 0))
          .slice(0, 8)
        if (mustSeeDests.length >= MIN) {
          sections.push(this.createSection('must-see', 'must-see', 'Must See', 'Iconic landmarks worldwide', mustSeeDests, savedIds, 4))
        }

        // 4. Editor's Choice
        const editorDests = destinations
          .filter(d => d.is_featured)
          .sort((a, b) => (b.editor_rating || 0) - (a.editor_rating || 0))
          .slice(0, 8)
        if (editorDests.length >= MIN) {
          sections.push(this.createSection('editors-choice', 'editors-choice', "Editor's Choice", 'Handpicked by our travel experts', editorDests, savedIds, 5, 'featured_large', 'large'))
        }

        // 5. Trending
        const trendingDests = destinations
          .filter(d => d.is_trending)
          .sort((a, b) => b.popularity_score - a.popularity_score)
          .slice(0, 10)
        if (trendingDests.length >= MIN) {
          sections.push(this.createSection('trending', 'trending', 'Trending Now', 'What travelers are loving right now', trendingDests, savedIds, 6))
        }

        // 6. Best Discover / Hidden Gems
        const hiddenGems = destinations
          .filter(d => d.primary_category === 'off_beaten_path' || d.primary_category === 'cultural' || (d.popularity_score < 600 && (d.editor_rating || 0) >= 4.3))
          .sort((a, b) => (b.editor_rating || 0) - (a.editor_rating || 0))
          .slice(0, 8)
        if (hiddenGems.length >= MIN) {
          sections.push(this.createSection('hidden-gems', 'hidden-gems', 'Best Discover', 'Hidden gems & off the beaten path', hiddenGems, savedIds, 7))
        }

        // 7. Budget Friendly
        const budgetDests = destinations
          .filter(d => d.budget_level <= 2)
          .sort((a, b) => (a.estimated_daily_budget_usd || 999) - (b.estimated_daily_budget_usd || 999))
          .slice(0, 10)
        if (budgetDests.length >= MIN) {
          sections.push(this.createSection('budget-friendly', 'budget-friendly', 'Budget Friendly', "Amazing experiences that won't break the bank", budgetDests, savedIds, 8))
        }

        // 8. Luxury Escapes
        const luxuryDests = destinations
          .filter(d => d.budget_level >= 4 || d.primary_category === 'luxury')
          .sort((a, b) => (b.editor_rating || 0) - (a.editor_rating || 0))
          .slice(0, 8)
        if (luxuryDests.length >= MIN) {
          sections.push(this.createSection('luxury', 'luxury-escapes', 'Luxury Escapes', 'Indulge in extraordinary experiences', luxuryDests, savedIds, 9, 'horizontal_scroll', 'large'))
        }

        // 9. Local Experiences (adventure + diverse destinations)
        const experienceDests = destinations
          .filter(d => d.primary_category === 'adventure' || d.travel_style?.includes('adventurer') || d.tags?.includes('culture'))
          .sort((a, b) => b.popularity_score - a.popularity_score)
          .slice(0, 10)
        if (experienceDests.length >= MIN) {
          sections.push(this.createSection('local-experiences', 'local-experiences', 'Local Experiences', 'Unique activities & cultural immersion', experienceDests, savedIds, 10))
        }

        // 10. Family Friendly
        const familyDests = destinations
          .filter(d => d.best_for?.includes('families') || d.primary_category === 'family')
          .sort((a, b) => (b.safety_rating || 0) - (a.safety_rating || 0))
          .slice(0, 10)
        if (familyDests.length >= MIN) {
          sections.push(this.createSection('family', 'family-friendly', 'Family Friendly', 'Perfect destinations for the whole family', familyDests, savedIds, 11))
        }
      }

      // Sort by priority
      sections.sort((a, b) => a.priority - b.priority)

      const responseTimeMs = Date.now() - startTime

      return {
        success: true,
        data: {
          sections,
          meta: {
            userId: params.userId,
            personalizationScore: 30, // Lower score for fallback
            strategyUsed: 'cold',
            sectionsReturned: sections.length,
            totalItemsReturned: sections.reduce((sum, s) => sum + s.items.length, 0),
            generatedAt: new Date().toISOString(),
            cacheHit: false,
            responseTimeMs,
          }
        }
      }

    } catch (error: any) {
      console.error('Homepage Fallback Error:', error)
      return {
        success: false,
        data: { sections: [], meta: this.getEmptyMeta(params.userId) },
        error: error.message,
      }
    }
  }

  /**
   * Create a section from destinations
   */
  private createSection(
    id: string,
    slug: string,
    title: string,
    subtitle: string,
    destinations: any[],
    savedIds: Set<string>,
    priority: number,
    layoutType: 'horizontal_scroll' | 'featured_large' = 'horizontal_scroll',
    cardSize: 'small' | 'medium' | 'large' = 'medium'
  ): HomepageSection {
    return {
      id,
      slug,
      title,
      subtitle,
      layoutType,
      cardSize,
      items: destinations.map(d => this.formatDestination(d, savedIds)),
      itemCount: destinations.length,
      hasMore: true,
      isPersonalized: false,
      priority,
    }
  }

  /**
   * Format destination to ContentItem
   */
  private formatDestination(dest: any, savedIds: Set<string>): ContentItem {
    return {
      id: dest.id,
      type: 'destination',
      title: dest.title,
      subtitle: dest.short_description || dest.city,
      imageUrl: dest.hero_image_url,
      thumbnailUrl: dest.thumbnail_url,
      price: dest.estimated_daily_budget_usd ? {
        amount: dest.estimated_daily_budget_usd,
        currency: 'USD',
        period: 'per_day',
        formatted: `$${dest.estimated_daily_budget_usd}/day`,
      } : null,
      rating: dest.editor_rating,
      location: {
        city: dest.city,
        country: dest.country,
        distanceKm: null,
        distanceText: null,
      },
      matchScore: dest.popularity_score || 0,
      matchReasons: this.generateMatchReasons(dest),
      badges: this.generateBadges(dest),
      ctaText: 'Explore',
      ctaUrl: `/detail/${dest.id}`,
      isSaved: savedIds.has(dest.id),
      slug: dest.slug,
      budgetLevel: dest.budget_level,
      tags: dest.tags,
      safetyRating: dest.safety_rating,
      bestFor: dest.best_for,
    }
  }

  /**
   * Generate match reasons for a destination
   */
  private generateMatchReasons(dest: any): string[] {
    const reasons: string[] = []
    if (dest.is_trending) reasons.push('Trending now')
    if (dest.is_featured) reasons.push("Editor's pick")
    if (dest.budget_level <= 2) reasons.push('Budget friendly')
    if (dest.budget_level >= 4) reasons.push('Luxury experience')
    if (dest.editor_rating >= 4.5) reasons.push('Highly rated')
    return reasons.slice(0, 3)
  }

  /**
   * Generate badges for a destination
   */
  private generateBadges(dest: any): any[] {
    const badges: any[] = []
    if (dest.is_trending) {
      badges.push({ type: 'trending', text: 'Trending', color: '#FF6B35' })
    }
    if (dest.is_featured) {
      badges.push({ type: 'editors_choice', text: "Editor's Choice", color: '#8B5CF6' })
    }
    if (dest.budget_level <= 2) {
      badges.push({ type: 'deal', text: 'Great Value', color: '#10B981' })
    }
    return badges.slice(0, 2)
  }

  /**
   * Get empty meta object
   */
  private getEmptyMeta(userId: string): ResponseMeta {
    return {
      userId,
      personalizationScore: 0,
      strategyUsed: 'cold',
      sectionsReturned: 0,
      totalItemsReturned: 0,
      generatedAt: new Date().toISOString(),
      cacheHit: false,
      responseTimeMs: 0,
    }
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
      const { error } = await supabase.from('user_interactions').insert({
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

      if (error) {
        if (__DEV__) console.warn('[HomepageService] Interaction tracking failed:', error.message, error.code)
      }
    } catch (error) {
      if (__DEV__) console.error('[HomepageService] Failed to track interaction:', error)
    }
  }

  /**
   * Toggle saved status for an item
   */
  async toggleSaved(userId: string, itemId: string, itemType: 'destination' | 'experience'): Promise<boolean> {
    try {
      // Check if already saved
      const { data: existing } = await supabase
        .from('user_saved_items')
        .select('id')
        .eq('user_id', userId)
        .eq(itemType === 'destination' ? 'destination_id' : 'experience_id', itemId)
        .single()

      if (existing) {
        // Remove from saved
        await supabase
          .from('user_saved_items')
          .delete()
          .eq('id', existing.id)
        
        await this.trackInteraction({
          userId,
          itemId,
          itemType,
          action: 'unsave',
        })
        
        return false
      } else {
        // Add to saved
        await supabase.from('user_saved_items').insert({
          user_id: userId,
          destination_id: itemType === 'destination' ? itemId : null,
          experience_id: itemType === 'experience' ? itemId : null,
        })
        
        await this.trackInteraction({
          userId,
          itemId,
          itemType,
          action: 'save',
        })
        
        return true
      }
    } catch (error) {
      console.error('Failed to toggle saved:', error)
      throw error
    }
  }
}

export const homepageService = new HomepageService()
