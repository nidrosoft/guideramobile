/**
 * USE HOMEPAGE HOOK
 * 
 * Main hook for fetching and managing homepage data.
 * Provides personalized content, refresh functionality, and interaction tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import * as Location from 'expo-location'
import { useAuth } from '@/context/AuthContext'
import { homepageService } from '../services/homepageService'
import type { HomepageSection, ContentItem, ResponseMeta } from '../types/homepage.types'

interface UseHomepageResult {
  sections: HomepageSection[]
  meta: ResponseMeta | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refresh: () => Promise<void>
  trackInteraction: (item: ContentItem, action: 'view' | 'detail_view', sectionSlug?: string, position?: number) => void
  toggleSaved: (item: ContentItem) => Promise<void>
}

interface UseHomepageOptions {
  autoFetch?: boolean
  includeLocation?: boolean
}

export function useHomepage(options: UseHomepageOptions = {}): UseHomepageResult {
  const { autoFetch = true, includeLocation = true } = options
  const { user } = useAuth()
  
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [meta, setMeta] = useState<ResponseMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const hasFetched = useRef(false)
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null)

  /**
   * Get user's current location
   */
  const getUserLocation = useCallback(async () => {
    if (!includeLocation) return null
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        console.log('Location permission not granted')
        return null
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      
      locationRef.current = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
      
      return locationRef.current
    } catch (err) {
      console.warn('Failed to get location:', err)
      return null
    }
  }, [includeLocation])

  /**
   * Fetch homepage data
   */
  const fetchHomepage = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      // Get location if needed
      let location = locationRef.current
      if (!location && includeLocation) {
        location = await getUserLocation()
      }

      const response = await homepageService.getHomepage({
        userId: user.id,
        latitude: location?.latitude,
        longitude: location?.longitude,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        refresh: isRefresh,
      })

      if (response.success) {
        setSections(response.data.sections)
        setMeta(response.data.meta)
      } else {
        setError(response.error || 'Failed to load homepage')
      }
    } catch (err: any) {
      console.error('Homepage fetch error:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [user?.id, includeLocation, getUserLocation])

  /**
   * Refresh homepage data
   */
  const refresh = useCallback(async () => {
    await fetchHomepage(true)
  }, [fetchHomepage])

  /**
   * Track user interaction
   */
  const trackInteraction = useCallback((
    item: ContentItem,
    action: 'view' | 'detail_view',
    sectionSlug?: string,
    position?: number
  ) => {
    if (!user?.id) return

    // Fire and forget - don't await
    homepageService.trackInteraction({
      userId: user.id,
      itemId: item.id,
      itemType: item.type as 'destination' | 'experience',
      action,
      sectionSlug,
      position,
    }).catch(console.error)
  }, [user?.id])

  /**
   * Toggle saved status
   */
  const toggleSaved = useCallback(async (item: ContentItem) => {
    if (!user?.id) return

    try {
      const newSavedStatus = await homepageService.toggleSaved(
        user.id,
        item.id,
        item.type as 'destination' | 'experience'
      )

      // Update local state
      setSections(prevSections => 
        prevSections.map(section => ({
          ...section,
          items: section.items.map(i => 
            i.id === item.id ? { ...i, isSaved: newSavedStatus } : i
          ),
        }))
      )
    } catch (err) {
      console.error('Failed to toggle saved:', err)
    }
  }, [user?.id])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && !hasFetched.current && user?.id) {
      hasFetched.current = true
      fetchHomepage()
    }
  }, [autoFetch, user?.id, fetchHomepage])

  return {
    sections,
    meta,
    isLoading,
    isRefreshing,
    error,
    refresh,
    trackInteraction,
    toggleSaved,
  }
}

export default useHomepage
