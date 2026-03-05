/**
 * HOMEPAGE SERVICE
 * 
 * Fetches personalized homepage content from the Edge Function.
 * Falls back to direct database queries if Edge Function is unavailable.
 */

import { supabase } from '@/lib/supabase/client'
import type { 
  HomepageResponse, 
  HomepageSection, 
  ContentItem, 
  GetHomepageParams,
  ResponseMeta 
} from '../types/homepage.types'

const EDGE_FUNCTION_NAME = 'homepage'

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

      // Try Edge Function first
      const { data: session } = await supabase.auth.getSession()
      const accessToken = session?.session?.access_token

      if (accessToken) {
        try {
          const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
            body: {
              user_id: params.userId,
              lat: params.latitude?.toString(),
              lng: params.longitude?.toString(),
              timezone: params.timezone,
              refresh: params.refresh || false,
              categories: params.categories,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!error && data?.success) {
            return data as HomepageResponse
          }
        } catch (edgeFunctionError) {
          console.warn('Edge Function unavailable, falling back to direct query:', edgeFunctionError)
        }
      }

      // Fallback: Direct database query
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
