/**
 * HOMEPAGE FEATURE
 * 
 * Exports for the homepage recommendation engine.
 */

// Types
export * from './types/homepage.types'

// Services
export { homepageService } from './services/homepageService'

// Hooks
export { useHomepage } from './hooks/useHomepage'
export { 
  useSectionData,
  usePopularDestinations,
  useTrendingDestinations,
  useEditorChoices,
  useBudgetFriendly,
  useLuxuryEscapes,
  useAdventureDestinations,
  useFamilyFriendly,
  useNearbyDestinations,
} from './hooks/useSectionData'

// Context
export { 
  HomepageDataProvider, 
  useHomepageData, 
  useHomepageDataSafe 
} from './context/HomepageDataContext'

// Components
export { TrackableCard, useInteractionTracking } from './components/TrackableCard'
