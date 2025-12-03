/**
 * BOOKING FEATURE
 * 
 * Public exports for the Booking feature module.
 * This is the main entry point for all booking-related functionality.
 */

// ============================================
// TYPES
// ============================================
export * from './types';

// ============================================
// CONFIG
// ============================================
export * from './config/booking.config';
export * from './config/steps.config';

// ============================================
// STORES
// ============================================
export * from './stores';

// ============================================
// HOOKS
// ============================================
export * from './hooks';

// ============================================
// COMPONENTS
// ============================================
// Note: Components are exported separately to avoid naming conflicts with types
export {
  BookingHeader,
  BookingProgress,
  DateRangePicker,
  PassengerSelector,
  PassengerTrigger,
  PriceBreakdown as PriceBreakdownComponent,
  PriceSummary,
} from './components';

// ============================================
// FLOWS
// ============================================
export { FlightBookingFlow, HotelBookingFlow, PackageBookingFlow, CarRentalFlow, ExperienceFlow } from './flows';

// ============================================
// SCREENS (will be added as we build them)
// ============================================
// export { default as BookingHubScreen } from './screens/BookingHubScreen';
// export { default as FlightSearchScreen } from './screens/FlightSearchScreen';
// export { default as HotelSearchScreen } from './screens/HotelSearchScreen';
// export { default as CarSearchScreen } from './screens/CarSearchScreen';
// export { default as ExperienceSearchScreen } from './screens/ExperienceSearchScreen';
// export { default as PackageSearchScreen } from './screens/PackageSearchScreen';
