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
            body: {},
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
        // Popular Destinations
        const popularDests = destinations
          .filter(d => d.primary_category === 'popular' || d.popularity_score > 800)
          .slice(0, 12)

        if (popularDests.length >= 3) {
          sections.push(this.createSection(
            'popular',
            'popular-destinations',
            'Popular Destinations',
            "Travelers' top picks this season",
            popularDests,
            savedIds,
            3
          ))
        }

        // Trending
        const trendingDests = destinations.filter(d => d.is_trending).slice(0, 10)
        if (trendingDests.length >= 3) {
          sections.push(this.createSection(
            'trending',
            'trending',
            'Trending Now 📈',
            'What travelers are loving right now',
            trendingDests,
            savedIds,
            5
          ))
        }

        // Editor's Choice
        const editorDests = destinations
          .filter(d => d.is_featured && d.editor_rating >= 4.5)
          .slice(0, 8)

        if (editorDests.length >= 3) {
          sections.push(this.createSection(
            'editors-choice',
            'editors-choice',
            "Editor's Choice ✨",
            'Handpicked by our travel experts',
            editorDests,
            savedIds,
            6,
            'featured_large',
            'large'
          ))
        }

        // Budget Friendly
        const budgetDests = destinations
          .filter(d => d.budget_level <= 2)
          .slice(0, 10)

        if (budgetDests.length >= 3) {
          sections.push(this.createSection(
            'budget-friendly',
            'budget-friendly',
            'Budget Friendly 💰',
            "Amazing experiences that won't break the bank",
            budgetDests,
            savedIds,
            7
          ))
        }

        // Luxury Escapes
        const luxuryDests = destinations
          .filter(d => d.budget_level >= 4 || d.primary_category === 'luxury')
          .slice(0, 8)

        if (luxuryDests.length >= 3) {
          sections.push(this.createSection(
            'luxury',
            'luxury-escapes',
            'Luxury Escapes 👑',
            'Indulge in extraordinary experiences',
            luxuryDests,
            savedIds,
            8,
            'horizontal_scroll',
            'large'
          ))
        }

        // Adventure
        const adventureDests = destinations
          .filter(d => d.primary_category === 'adventure' || d.travel_style?.includes('adventurer'))
          .slice(0, 10)

        if (adventureDests.length >= 3) {
          sections.push(this.createSection(
            'adventure',
            'adventure',
            'Adventure Awaits 🏔️',
            'For the thrill seekers and explorers',
            adventureDests,
            savedIds,
            9
          ))
        }

        // Beach & Islands
        const beachDests = destinations
          .filter(d => d.primary_category === 'beach' || d.tags?.includes('beach'))
          .slice(0, 10)

        if (beachDests.length >= 3) {
          sections.push(this.createSection(
            'beach',
            'beach-islands',
            'Beach & Islands 🏝️',
            'Sun, sand, and paradise found',
            beachDests,
            savedIds,
            10
          ))
        }

        // Family Friendly
        const familyDests = destinations
          .filter(d => d.best_for?.includes('families') || d.primary_category === 'family')
          .slice(0, 10)

        if (familyDests.length >= 3) {
          sections.push(this.createSection(
            'family',
            'family-friendly',
            'Family Adventures 👨‍👩‍👧‍👦',
            'Perfect destinations for the whole family',
            familyDests,
            savedIds,
            11
          ))
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
      matchScore: 0,
      matchReasons: this.generateMatchReasons(dest),
      badges: this.generateBadges(dest),
      ctaText: 'Explore',
      ctaUrl: `/detail/${dest.id}`,
      isSaved: savedIds.has(dest.id),
      slug: dest.slug,
      budgetLevel: dest.budget_level,
      tags: dest.tags,
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
