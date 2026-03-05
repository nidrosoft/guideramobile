/**
 * HOMEPAGE DATA CONTEXT
 * 
 * Provides homepage data to all child components.
 * This allows sections to access personalized data without prop drilling.
 */

import React, { createContext, useContext, ReactNode, useState, useCallback, useRef } from 'react'
import { useHomepage } from '../hooks/useHomepage'
import type { HomepageSection, ContentItem, ResponseMeta } from '../types/homepage.types'

interface HomepageDataContextValue {
  sections: HomepageSection[]
  meta: ResponseMeta | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refresh: () => Promise<void>
  trackInteraction: (item: ContentItem, action: 'view' | 'detail_view', sectionSlug?: string, position?: number) => void
  toggleSaved: (item: ContentItem) => Promise<void>
  getSectionBySlug: (slug: string) => HomepageSection | undefined
  getSectionById: (id: string) => HomepageSection | undefined
  /** Increments on every pull-to-refresh so independent sections can re-fetch */
  refreshKey: number
  /** Active category filter from CategoryPills ('all' means no filter) */
  activeCategory: string
  setActiveCategory: (category: string) => void
  /** Set of section componentTypes that are hidden due to category filtering */
  hiddenSections: Set<string>
  setSectionHidden: (sectionType: string, hidden: boolean) => void
}

const HomepageDataContext = createContext<HomepageDataContextValue | null>(null)

interface HomepageDataProviderProps {
  children: ReactNode
}

export function HomepageDataProvider({ children }: HomepageDataProviderProps) {
  const homepage = useHomepage({ autoFetch: true, includeLocation: true })
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set())
  const hiddenRef = useRef<Set<string>>(new Set())

  const setSectionHidden = useCallback((sectionType: string, hidden: boolean) => {
    const current = hiddenRef.current
    const hasIt = current.has(sectionType)
    if (hidden && !hasIt) {
      const next = new Set(current)
      next.add(sectionType)
      hiddenRef.current = next
      setHiddenSections(next)
    } else if (!hidden && hasIt) {
      const next = new Set(current)
      next.delete(sectionType)
      hiddenRef.current = next
      setHiddenSections(next)
    }
  }, [])

  const getSectionBySlug = (slug: string): HomepageSection | undefined => {
    return homepage.sections.find(s => s.slug === slug)
  }

  const getSectionById = (id: string): HomepageSection | undefined => {
    return homepage.sections.find(s => s.id === id)
  }

  const wrappedRefresh = useCallback(async () => {
    setRefreshKey(k => k + 1)
    await homepage.refresh()
  }, [homepage.refresh])

  const value: HomepageDataContextValue = {
    ...homepage,
    refresh: wrappedRefresh,
    getSectionBySlug,
    getSectionById,
    refreshKey,
    activeCategory,
    setActiveCategory,
    hiddenSections,
    setSectionHidden,
  }

  return (
    <HomepageDataContext.Provider value={value}>
      {children}
    </HomepageDataContext.Provider>
  )
}

export function useHomepageData(): HomepageDataContextValue {
  const context = useContext(HomepageDataContext)
  
  if (!context) {
    throw new Error('useHomepageData must be used within a HomepageDataProvider')
  }
  
  return context
}

/**
 * Safe version that returns null if not in provider
 * Useful for components that may or may not be in the provider
 */
export function useHomepageDataSafe(): HomepageDataContextValue | null {
  return useContext(HomepageDataContext)
}

export default HomepageDataContext
