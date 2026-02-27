/**
 * HOMEPAGE DATA CONTEXT
 * 
 * Provides homepage data to all child components.
 * This allows sections to access personalized data without prop drilling.
 */

import React, { createContext, useContext, ReactNode } from 'react'
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
}

const HomepageDataContext = createContext<HomepageDataContextValue | null>(null)

interface HomepageDataProviderProps {
  children: ReactNode
}

export function HomepageDataProvider({ children }: HomepageDataProviderProps) {
  const homepage = useHomepage({ autoFetch: true, includeLocation: true })

  const getSectionBySlug = (slug: string): HomepageSection | undefined => {
    return homepage.sections.find(s => s.slug === slug)
  }

  const getSectionById = (id: string): HomepageSection | undefined => {
    return homepage.sections.find(s => s.id === id)
  }

  const value: HomepageDataContextValue = {
    ...homepage,
    getSectionBySlug,
    getSectionById,
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
