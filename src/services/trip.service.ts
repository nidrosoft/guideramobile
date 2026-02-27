/**
 * TRIP SERVICE
 * Re-exports from modular trip services for backward compatibility
 */

// Re-export everything from the modular trip service
export * from './trip';

// Legacy class wrapper for backward compatibility
export { TripCoreService as TripService } from './trip';
