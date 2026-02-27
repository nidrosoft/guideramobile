/**
 * Unified Search Overlay Components
 * 
 * Modular components for the unified search experience across all booking services.
 * Inspired by Airbnb's search overlay with background image support.
 */

// Main components
export { default as UnifiedSearchOverlay } from './UnifiedSearchOverlay';
export { default as UnifiedSearchHeader } from './UnifiedSearchHeader';
export { default as UnifiedSearchFooter } from './UnifiedSearchFooter';

// Flight-specific components
export { default as FlightWhereSection } from './FlightWhereSection';
export { default as MultiCitySection } from './MultiCitySection';
export { default as FlightLegCard } from './FlightLegCard';

// Hotel-specific components
export { default as HotelWhereSection } from './HotelWhereSection';
export { default as HotelGuestSection } from './HotelGuestSection';

// Bottom sheets
export { default as UnifiedAirportSheet } from './UnifiedAirportSheet';
export { default as UnifiedDateSheet } from './UnifiedDateSheet';

// Export types
export type { FlightSearchData, HotelSearchData, SearchData } from './UnifiedSearchOverlay';
export type { Airport, TripType } from './FlightWhereSection';
export type { FlightLeg } from './FlightLegCard';
export type { HotelDestination } from './HotelWhereSection';
export type { HotelGuestCount } from './HotelGuestSection';

// Re-export shared components from parent overlay
export { SearchSectionCard, WhenSection, WhoSection } from '../overlay';
