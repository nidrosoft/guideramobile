/**
 * NAVIGATION FEATURE — Barrel Exports
 *
 * Unified Map & Navigation system for Guidera.
 * Modes: City (outdoor), Airport (indoor — coming soon), Landmarks (POI search).
 */

export { default as MapScreen } from './MapScreen';
export type { MapMode } from './MapScreen';
export { useOutdoorNavigation } from './hooks/useOutdoorNavigation';
export { useLandmarkSearch } from './hooks/useLandmarkSearch';
export { voiceService } from './services/voice.service';
