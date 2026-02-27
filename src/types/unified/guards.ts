/**
 * UNIFIED DATA MODEL - TYPE GUARDS
 * 
 * Runtime type checking functions for unified types.
 */

import { UnifiedFlight } from './flight.types';
import { UnifiedHotel } from './hotel.types';
import { UnifiedCarRental } from './car.types';
import { UnifiedExperience } from './experience.types';
import { UnifiedPackage } from './package.types';

// ============================================
// ENTITY TYPE GUARDS
// ============================================

/**
 * Check if an entity is a UnifiedFlight
 */
export function isUnifiedFlight(entity: unknown): entity is UnifiedFlight {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'type' in entity &&
    (entity as { type: string }).type === 'flight' &&
    'slices' in entity &&
    'price' in entity
  );
}

/**
 * Check if an entity is a UnifiedHotel
 */
export function isUnifiedHotel(entity: unknown): entity is UnifiedHotel {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'type' in entity &&
    (entity as { type: string }).type === 'hotel' &&
    'rooms' in entity &&
    'location' in entity
  );
}

/**
 * Check if an entity is a UnifiedCarRental
 */
export function isUnifiedCarRental(entity: unknown): entity is UnifiedCarRental {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'type' in entity &&
    (entity as { type: string }).type === 'car' &&
    'vehicle' in entity &&
    'pickupLocation' in entity
  );
}

/**
 * Check if an entity is a UnifiedExperience
 */
export function isUnifiedExperience(entity: unknown): entity is UnifiedExperience {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'type' in entity &&
    (entity as { type: string }).type === 'experience' &&
    'title' in entity &&
    'duration' in entity
  );
}

/**
 * Check if an entity is a UnifiedPackage
 */
export function isUnifiedPackage(entity: unknown): entity is UnifiedPackage {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'type' in entity &&
    (entity as { type: string }).type === 'package' &&
    'components' in entity &&
    'packageType' in entity
  );
}

// ============================================
// CATEGORY TYPE GUARDS
// ============================================

export type TravelCategory = 'flights' | 'hotels' | 'cars' | 'experiences' | 'packages';

export function isValidCategory(category: string): category is TravelCategory {
  return ['flights', 'hotels', 'cars', 'experiences', 'packages'].includes(category);
}

// ============================================
// PRICE VALIDATION
// ============================================

export function isValidPrice(price: unknown): boolean {
  if (typeof price !== 'object' || price === null) return false;
  
  const p = price as Record<string, unknown>;
  return (
    typeof p.amount === 'number' &&
    typeof p.currency === 'string' &&
    typeof p.formatted === 'string'
  );
}

// ============================================
// PROVIDER VALIDATION
// ============================================

export function isValidProviderMeta(provider: unknown): boolean {
  if (typeof provider !== 'object' || provider === null) return false;
  
  const p = provider as Record<string, unknown>;
  return (
    typeof p.code === 'string' &&
    typeof p.name === 'string' &&
    typeof p.retrievedAt === 'string'
  );
}

// ============================================
// SEARCH PARAMS VALIDATION
// ============================================

export function hasValidTravelers(travelers: unknown): boolean {
  if (typeof travelers !== 'object' || travelers === null) return false;
  
  const t = travelers as Record<string, unknown>;
  return (
    typeof t.adults === 'number' &&
    t.adults >= 1 &&
    typeof t.children === 'number' &&
    t.children >= 0
  );
}

export function isValidDateString(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

export function isValidISODateTime(dateTime: string): boolean {
  const parsed = new Date(dateTime);
  return !isNaN(parsed.getTime());
}

// ============================================
// BOOKING VALIDATION
// ============================================

export function isValidTravelerDetails(traveler: unknown): boolean {
  if (typeof traveler !== 'object' || traveler === null) return false;
  
  const t = traveler as Record<string, unknown>;
  return (
    typeof t.firstName === 'string' &&
    t.firstName.length > 0 &&
    typeof t.lastName === 'string' &&
    t.lastName.length > 0 &&
    typeof t.dateOfBirth === 'string' &&
    isValidDateString(t.dateOfBirth) &&
    ['adult', 'child', 'infant'].includes(t.type as string)
  );
}

export function isValidContactInfo(contact: unknown): boolean {
  if (typeof contact !== 'object' || contact === null) return false;
  
  const c = contact as Record<string, unknown>;
  return (
    typeof c.firstName === 'string' &&
    c.firstName.length > 0 &&
    typeof c.lastName === 'string' &&
    c.lastName.length > 0 &&
    typeof c.email === 'string' &&
    c.email.includes('@') &&
    typeof c.phone === 'string' &&
    c.phone.length > 0
  );
}

// ============================================
// UTILITY TYPE GUARDS
// ============================================

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && value >= 0;
}

export function isValidUUID(value: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(value);
}

export function isValidCurrencyCode(code: string): boolean {
  const regex = /^[A-Z]{3}$/;
  return regex.test(code);
}

export function isValidAirportCode(code: string): boolean {
  const regex = /^[A-Z]{3}$/;
  return regex.test(code);
}
