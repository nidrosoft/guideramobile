/**
 * SECTION-REFRESH EDGE FUNCTION
 *
 * Refreshes one or all homepage section caches.
 * Each section has its own pipeline that queries curated_destinations
 * with section-specific filters, ranks results, and writes to section_cache.
 *
 * Can be invoked by:
 * - pg_cron (scheduled refresh)
 * - On-demand from homepage edge function (when cache is expired/missing)
 * - Manual admin trigger
 *
 * Usage:
 *   POST { "section_slug": "trending" }        — refresh one section
 *   POST { "section_slug": "all" }             — refresh all sections
 *   POST {}                                     — refresh all sections
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Section TTLs in hours
const SECTION_TTL: Record<string, number> = {
  'popular-destinations': 24,
  'places': 24,
  'trending': 6,
  'editors-choice': 24,
  'must-see': 24,
  'budget-friendly': 12,
  'luxury-escapes': 24,
  'family-friendly': 24,
  'hidden-gems': 24,
  'adventure': 24,
  'beach-islands': 24,
}

interface SectionResult {
  slug: string
  success: boolean
  itemCount: number
  error?: string
  refreshedAt: string
}

interface ContentItem {
  id: string
  type: string
  title: string
  subtitle: string | null
  imageUrl: string | null
  thumbnailUrl: string | null
  price: { amount: number; currency: string; period: string; formatted: string } | null
  rating: number | null
  location: { city: string; country: string }
  matchScore: number
  matchReasons: string[]
  badges: { type: string; text: string; color: string }[]
  ctaText: string
  ctaUrl: string
  slug: string
  budgetLevel: number | null
  tags: string[] | null
}

serve(async (req: Request) => {
  const startTime = Date.now()

  try {
    const body = await req.json().catch(() => ({}))
    const sectionSlug: string = body.section_slug || 'all'

    // Fetch all published destinations once (shared across generators)
    const { data: allDestinations, error: destErr } = await supabase
      .from('curated_destinations')
      .select('*')
      .eq('status', 'published')
      .order('priority', { ascending: false })

    if (destErr || !allDestinations) {
      throw new Error(`Failed to fetch destinations: ${destErr?.message || 'no data'}`)
    }

    // Fetch AI classification data and merge into destinations
    const { data: enrichments } = await supabase
      .from('destination_ai_enrichment')
      .select('destination_id, section_tags, confidence_scores, generated_description, family_suitability, luxury_suitability, adventure_suitability, beach_suitability, cultural_suitability')
      .not('classified_at', 'is', null)

    const enrichMap = new Map<string, any>()
    for (const e of enrichments || []) {
      enrichMap.set(e.destination_id, e)
    }

    // Merge enrichment into destinations
    for (const d of allDestinations) {
      const ai = enrichMap.get(d.id)
      if (ai) {
        d._ai = ai
        d._aiTags = ai.section_tags || []
      } else {
        d._ai = null
        d._aiTags = []
      }
    }

    const results: SectionResult[] = []

    if (sectionSlug === 'all') {
      // Refresh all sections
      const slugs = Object.keys(SECTION_TTL)
      for (const slug of slugs) {
        results.push(await refreshSection(slug, allDestinations))
      }
    } else {
      results.push(await refreshSection(sectionSlug, allDestinations))
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      totalRefreshed: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      responseTimeMs: Date.now() - startTime,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('section-refresh error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      responseTimeMs: Date.now() - startTime,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

// ============================================
// REFRESH DISPATCHER
// ============================================

async function refreshSection(slug: string, destinations: any[]): Promise<SectionResult> {
  const now = new Date().toISOString()

  try {
    const generator = SECTION_GENERATORS[slug]
    if (!generator) {
      return { slug, success: false, itemCount: 0, error: `Unknown section: ${slug}`, refreshedAt: now }
    }

    const items = generator(destinations)
    const ttlHours = SECTION_TTL[slug] || 24
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()

    // Upsert into section_cache
    const { error: upsertErr } = await supabase
      .from('section_cache')
      .upsert({
        section_slug: slug,
        data: items,
        item_count: items.length,
        source: 'db',
        strategy: 'default',
        expires_at: expiresAt,
        last_refresh_at: now,
        refresh_error: null,
        updated_at: now,
      }, { onConflict: 'section_slug' })

    if (upsertErr) {
      throw new Error(upsertErr.message)
    }

    return { slug, success: true, itemCount: items.length, refreshedAt: now }
  } catch (err: any) {
    // Record the error but don't fail the whole batch
    await supabase
      .from('section_cache')
      .upsert({
        section_slug: slug,
        data: [],
        item_count: 0,
        source: 'db',
        strategy: 'default',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // retry in 1h
        last_refresh_at: now,
        refresh_error: err.message,
        updated_at: now,
      }, { onConflict: 'section_slug' })
      .catch(() => {})

    return { slug, success: false, itemCount: 0, error: err.message, refreshedAt: now }
  }
}

// ============================================
// SECTION GENERATORS
// ============================================

const SECTION_GENERATORS: Record<string, (destinations: any[]) => ContentItem[]> = {
  'popular-destinations': generatePopularDestinations,
  'places': generatePlaces,
  'trending': generateTrending,
  'editors-choice': generateEditorsChoice,
  'must-see': generateMustSee,
  'budget-friendly': generateBudgetFriendly,
  'luxury-escapes': generateLuxuryEscapes,
  'family-friendly': generateFamilyFriendly,
  'hidden-gems': generateHiddenGems,
  'adventure': generateAdventure,
  'beach-islands': generateBeachIslands,
}

function generatePopularDestinations(destinations: any[]): ContentItem[] {
  return destinations
    .filter(d => d._aiTags.includes('popular-destinations') || d.primary_category === 'popular' || d.popularity_score > 700)
    .sort((a, b) => {
      const aConf = a._ai?.confidence_scores?.['popular-destinations'] || 0
      const bConf = b._ai?.confidence_scores?.['popular-destinations'] || 0
      if (bConf !== aConf) return bConf - aConf
      return b.popularity_score - a.popularity_score
    })
    .slice(0, 12)
    .map(formatItem)
}

function generatePlaces(destinations: any[]): ContentItem[] {
  return destinations
    .filter(d => d._aiTags.includes('places') || (d.editor_rating || 0) >= 4.0)
    .sort((a, b) => {
      const aConf = a._ai?.confidence_scores?.['places'] || 0
      const bConf = b._ai?.confidence_scores?.['places'] || 0
      if (bConf !== aConf) return bConf - aConf
      return (b.editor_rating || 0) - (a.editor_rating || 0)
    })
    .slice(0, 10)
    .map(formatItem)
}

function generateTrending(destinations: any[]): ContentItem[] {
  return destinations
    .filter(d => d._aiTags.includes('trending') || d.is_trending)
    .sort((a, b) => {
      const aConf = a._ai?.confidence_scores?.['trending'] || 0
      const bConf = b._ai?.confidence_scores?.['trending'] || 0
      if (bConf !== aConf) return bConf - aConf
      return b.popularity_score - a.popularity_score
    })
    .slice(0, 10)
    .map(formatItem)
}

function generateEditorsChoice(destinations: any[]): ContentItem[] {
  return destinations
    .filter(d => d._aiTags.includes('editors-choice') || (d.is_featured && (d.editor_rating || 0) >= 4.5))
    .sort((a, b) => {
      const aConf = a._ai?.confidence_scores?.['editors-choice'] || 0
      const bConf = b._ai?.confidence_scores?.['editors-choice'] || 0
      if (bConf !== aConf) return bConf - aConf
      return (b.editor_rating || 0) - (a.editor_rating || 0)
    })
    .slice(0, 12)
    .map(formatItem)
}

function generateMustSee(destinations: any[]): ContentItem[] {
  return destinations
    .filter(d => d._aiTags.includes('must-see') || (d.is_featured && (d.editor_rating || 0) >= 4.5))
    .sort((a, b) => {
      const aConf = a._ai?.confidence_scores?.['must-see'] || 0
      const bConf = b._ai?.confidence_scores?.['must-see'] || 0
      if (bConf !== aConf) return bConf - aConf
      return (b.editor_rating || 0) - (a.editor_rating || 0)
    })
    .slice(0, 10)
    .map(formatItem)
}

function generateBudgetFriendly(destinations: any[]): ContentItem[] {
  return destinations
    .filter(d => d._aiTags.includes('budget-friendly') || d.budget_level <= 2)
    .sort((a, b) => {
      const aConf = a._ai?.confidence_scores?.['budget-friendly'] || 0
      const bConf = b._ai?.confidence_scores?.['budget-friendly'] || 0
      if (bConf !== aConf) return bConf - aConf
      return (a.estimated_daily_budget_usd || 999) - (b.estimated_daily_budget_usd || 999)
    })
    .slice(0, 10)
    .map(formatItem)
}

function generateLuxuryEscapes(destinations: any[]): ContentItem[] {
  return destinations
    .filter(d => d._aiTags.includes('luxury-escapes') || d.budget_level >= 4 || d.primary_category === 'luxury')
    .sort((a, b) => {
      const aScore = a._ai?.luxury_suitability || 0
      const bScore = b._ai?.luxury_suitability || 0
      if (bScore !== aScore) return bScore - aScore
      return (b.editor_rating || 0) - (a.editor_rating || 0)
    })
    .slice(0, 10)
    .map(formatItem)
}

function generateFamilyFriendly(destinations: any[]): ContentItem[] {
  return destinations
    .filter(d => d._aiTags.includes('family-friendly') || d.best_for?.includes('families') || d.primary_category === 'family')
    .sort((a, b) => {
      const aScore = a._ai?.family_suitability || 0
      const bScore = b._ai?.family_suitability || 0
      if (bScore !== aScore) return bScore - aScore
      return (b.safety_rating || 0) - (a.safety_rating || 0)
    })
    .slice(0, 10)
    .map(formatItem)
}

function generateHiddenGems(destinations: any[]): ContentItem[] {
  return destinations
    .filter(d =>
      d._aiTags.includes('hidden-gems') ||
      d.primary_category === 'off_beaten_path' ||
      d.primary_category === 'cultural' ||
      (d.popularity_score < 600 && (d.editor_rating || 0) >= 4.3)
    )
    .sort((a, b) => {
      const aConf = a._ai?.confidence_scores?.['hidden-gems'] || 0
      const bConf = b._ai?.confidence_scores?.['hidden-gems'] || 0
      if (bConf !== aConf) return bConf - aConf
      return (b.editor_rating || 0) - (a.editor_rating || 0)
    })
    .slice(0, 10)
    .map(formatItem)
}

function generateAdventure(destinations: any[]): ContentItem[] {
  return destinations
    .filter(d => d._aiTags.includes('adventure') || d.primary_category === 'adventure' || d.travel_style?.includes('adventurer'))
    .sort((a, b) => {
      const aScore = a._ai?.adventure_suitability || 0
      const bScore = b._ai?.adventure_suitability || 0
      if (bScore !== aScore) return bScore - aScore
      return b.popularity_score - a.popularity_score
    })
    .slice(0, 10)
    .map(formatItem)
}

function generateBeachIslands(destinations: any[]): ContentItem[] {
  return destinations
    .filter(d => d._aiTags.includes('beach-islands') || d.primary_category === 'beach' || d.tags?.includes('beach'))
    .sort((a, b) => {
      const aScore = a._ai?.beach_suitability || 0
      const bScore = b._ai?.beach_suitability || 0
      if (bScore !== aScore) return bScore - aScore
      return b.popularity_score - a.popularity_score
    })
    .slice(0, 10)
    .map(formatItem)
}

// ============================================
// FORMATTING
// ============================================

function formatItem(dest: any): ContentItem {
  return {
    id: dest.id,
    type: 'destination',
    title: dest.title,
    subtitle: dest.short_description || dest._ai?.generated_description || dest.city,
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
    },
    matchScore: dest.popularity_score || 0,
    matchReasons: generateMatchReasons(dest),
    badges: generateBadges(dest),
    ctaText: 'Explore',
    ctaUrl: `/detail/${dest.id}`,
    slug: dest.slug,
    budgetLevel: dest.budget_level,
    tags: dest.tags,
  }
}

function generateMatchReasons(dest: any): string[] {
  const reasons: string[] = []
  if (dest.is_trending) reasons.push('Trending now')
  if (dest.is_featured) reasons.push("Editor's pick")
  if (dest.budget_level <= 2) reasons.push('Budget friendly')
  if (dest.budget_level >= 4) reasons.push('Luxury experience')
  if (dest.editor_rating >= 4.5) reasons.push('Highly rated')
  return reasons.slice(0, 3)
}

function generateBadges(dest: any): { type: string; text: string; color: string }[] {
  const badges: { type: string; text: string; color: string }[] = []
  if (dest.is_trending) badges.push({ type: 'trending', text: 'Trending', color: '#FF6B35' })
  if (dest.is_featured) badges.push({ type: 'editors_choice', text: "Editor's Choice", color: '#8B5CF6' })
  if (dest.budget_level <= 2) badges.push({ type: 'deal', text: 'Great Value', color: '#10B981' })
  return badges.slice(0, 2)
}
