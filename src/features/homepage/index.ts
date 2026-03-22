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

// Context
export { 
  HomepageDataProvider, 
  useHomepageData, 
  useHomepageDataSafe 
} from './context/HomepageDataContext'

// Utils
export { matchesCategory, filterByCategory } from './utils/categoryFilter'
export { useSectionVisibility } from './hooks/useSectionVisibility'

// Components
export { TrackableCard, useInteractionTracking } from './components/TrackableCard'
