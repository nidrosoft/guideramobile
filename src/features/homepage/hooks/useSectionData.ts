/**
 * USE SECTION DATA HOOK
 * 
 * Provides data for individual homepage sections.
 * Can be used by existing section components to get real data.
 */

import { useMemo } from 'react'
import { useHomepage } from './useHomepage'
import type { ContentItem, HomepageSection } from '../types/homepage.types'

interface UseSectionDataResult {
  items: ContentItem[]
  section: HomepageSection | null
  isLoading: boolean
  hasData: boolean
}

/**
 * Get data for a specific section by slug
 */
export function useSectionData(sectionSlug: string): UseSectionDataResult {
  const { sections, isLoading } = useHomepage({ autoFetch: true })

  const result = useMemo(() => {
    const section = sections.find(s => s.slug === sectionSlug)
    
    return {
      items: section?.items || [],
      section: section || null,
      isLoading,
      hasData: (section?.items?.length || 0) > 0,
    }
  }, [sections, sectionSlug, isLoading])

  return result
}

/**
 * Get data for popular destinations section
 */
export function usePopularDestinations() {
  return useSectionData('popular-destinations')
}

/**
 * Get data for trending section
 */
export function useTrendingDestinations() {
  return useSectionData('trending')
}

/**
 * Get data for editor's choice section
 */
export function useEditorChoices() {
  return useSectionData('editors-choice')
}

/**
 * Get data for budget friendly section
 */
export function useBudgetFriendly() {
  return useSectionData('budget-friendly')
}

/**
 * Get data for luxury escapes section
 */
export function useLuxuryEscapes() {
  return useSectionData('luxury-escapes')
}

/**
 * Get data for adventure section
 */
export function useAdventureDestinations() {
  return useSectionData('adventure')
}

/**
 * Get data for family friendly section
 */
export function useFamilyFriendly() {
  return useSectionData('family-friendly')
}

/**
 * Get data for nearby section
 */
export function useNearbyDestinations() {
  return useSectionData('near-you')
}

export default useSectionData
