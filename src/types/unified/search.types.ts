/**
 * UNIFIED DATA MODEL - SEARCH TYPES
 * 
 * Search request and response types.
 */

import { 
  CabinClass, 
  PropertyType, 
  BoardType, 
  VehicleCategory, 
  VehicleType, 
  ExperienceCategory 
} from './enums';
import { UnifiedPrice, Coordinates, ProviderMeta } from './common.types';
import { UnifiedFlight } from './flight.types';
import { UnifiedHotel } from './hotel.types';
import { UnifiedCarRental } from './car.types';
import { UnifiedExperience } from './experience.types';
import { UnifiedPackage } from './package.types';

// ============================================
// UNIFIED SEARCH REQUEST
// ============================================

export interface UnifiedSearchRequest {
  /** What are we searching for? */
  category: 'flights' | 'hotels' | 'cars' | 'experiences' | 'packages';
  
  /** Category-specific parameters */
  params: FlightSearchParams | HotelSearchParams | CarSearchParams | ExperienceSearchParams | PackageSearchParams;
  
  /** User making the search */
  userId?: string;
  
  /** Search session ID */
  sessionId?: string;
  
  /** User preferences for personalization */
  preferences?: UserSearchPreferences;
  
  /** Search options */
  options?: SearchOptions;
}

// ============================================
// FLIGHT SEARCH PARAMS
// ============================================

export interface FlightSearchParams {
  /** Trip type */
  tripType: 'one_way' | 'round_trip' | 'multi_city';
  
  /** Segments (one for one-way, two for round-trip, 2+ for multi-city) */
  segments: FlightSearchSegment[];
  
  /** Number of travelers */
  travelers: {
    adults: number;
    children: number;
    infants: number;
  };
  
  /** Cabin class */
  cabinClass?: CabinClass;
  
  /** Filters */
  filters?: FlightFilters;
  
  /** Sort by */
  sortBy?: 'price' | 'duration' | 'departure' | 'arrival' | 'stops';
}

export interface FlightSearchSegment {
  /** Origin airport/city code */
  origin: string;
  
  /** Destination airport/city code */
  destination: string;
  
  /** Departure date (YYYY-MM-DD) */
  departureDate: string;
  
  /** Flexible dates? */
  flexibleDates?: boolean;
}

export interface FlightFilters {
  /** Max price */
  maxPrice?: number;
  
  /** Max stops */
  maxStops?: number;
  
  /** Preferred airlines */
  airlines?: string[];
  
  /** Excluded airlines */
  excludeAirlines?: string[];
  
  /** Departure time range */
  departureTime?: {
    earliest: string;
    latest: string;
  };
  
  /** Arrival time range */
  arrivalTime?: {
    earliest: string;
    latest: string;
  };
  
  /** Alliance preference */
  alliance?: string;
  
  /** Bags required */
  bagsRequired?: number;
}

// ============================================
// HOTEL SEARCH PARAMS
// ============================================

export interface HotelSearchParams {
  /** Destination (city, address, or coordinates) */
  destination: {
    type: 'city' | 'coordinates' | 'property_id';
    value: string | Coordinates;
  };
  
  /** Check-in date */
  checkInDate: string;
  
  /** Check-out date */
  checkOutDate: string;
  
  /** Rooms needed */
  rooms: RoomRequest[];
  
  /** Filters */
  filters?: HotelFilters;
  
  /** Sort by */
  sortBy?: 'price' | 'rating' | 'distance' | 'popularity';
}

export interface RoomRequest {
  /** Adults in this room */
  adults: number;
  
  /** Children in this room */
  children: number;
  
  /** Children ages */
  childrenAges?: number[];
}

export interface HotelFilters {
  /** Max price per night */
  maxPricePerNight?: number;
  
  /** Min star rating */
  minStarRating?: number;
  
  /** Property types */
  propertyTypes?: PropertyType[];
  
  /** Required amenities */
  amenities?: string[];
  
  /** Board types */
  boardTypes?: BoardType[];
  
  /** Free cancellation only */
  freeCancellation?: boolean;
  
  /** Max distance from search point */
  maxDistance?: {
    value: number;
    unit: 'km' | 'mi';
  };
  
  /** Guest rating minimum */
  minGuestRating?: number;
  
  /** Specific chains */
  chains?: string[];
}

// ============================================
// CAR SEARCH PARAMS
// ============================================

export interface CarSearchParams {
  /** Pickup location */
  pickupLocation: {
    type: 'airport' | 'city' | 'coordinates';
    value: string | Coordinates;
  };
  
  /** Dropoff location (if different) */
  dropoffLocation?: {
    type: 'airport' | 'city' | 'coordinates';
    value: string | Coordinates;
  };
  
  /** Pickup datetime */
  pickupDateTime: string;
  
  /** Dropoff datetime */
  dropoffDateTime: string;
  
  /** Driver age */
  driverAge: number;
  
  /** Filters */
  filters?: CarFilters;
  
  /** Sort by */
  sortBy?: 'price' | 'category' | 'rating';
}

export interface CarFilters {
  /** Max price per day */
  maxPricePerDay?: number;
  
  /** Vehicle categories */
  categories?: VehicleCategory[];
  
  /** Vehicle types */
  vehicleTypes?: VehicleType[];
  
  /** Transmission */
  transmission?: 'automatic' | 'manual';
  
  /** Min seats */
  minSeats?: number;
  
  /** Air conditioning required */
  airConditioningRequired?: boolean;
  
  /** Unlimited mileage only */
  unlimitedMileageOnly?: boolean;
  
  /** Specific suppliers */
  suppliers?: string[];
}

// ============================================
// EXPERIENCE SEARCH PARAMS
// ============================================

export interface ExperienceSearchParams {
  /** Destination */
  destination: {
    type: 'city' | 'coordinates' | 'attraction';
    value: string | Coordinates;
  };
  
  /** Date(s) */
  dates: {
    startDate: string;
    endDate?: string;
    flexibleDates?: boolean;
  };
  
  /** Number of participants */
  participants: {
    adults: number;
    children: number;
    childrenAges?: number[];
  };
  
  /** Filters */
  filters?: ExperienceFilters;
  
  /** Sort by */
  sortBy?: 'price' | 'rating' | 'popularity' | 'duration';
}

export interface ExperienceFilters {
  /** Max price per person */
  maxPricePerPerson?: number;
  
  /** Categories */
  categories?: ExperienceCategory[];
  
  /** Duration range */
  duration?: {
    min: number;
    max: number;
    unit: 'hours';
  };
  
  /** Time of day */
  timeOfDay?: ('morning' | 'afternoon' | 'evening')[];
  
  /** Languages */
  languages?: string[];
  
  /** Free cancellation only */
  freeCancellation?: boolean;
  
  /** Skip the line */
  skipTheLine?: boolean;
  
  /** Min rating */
  minRating?: number;
  
  /** Wheelchair accessible */
  wheelchairAccessible?: boolean;
}

// ============================================
// PACKAGE SEARCH PARAMS
// ============================================

export interface PackageSearchParams {
  /** Package type */
  packageType: 'flight_hotel' | 'flight_hotel_car' | 'hotel_car';
  
  /** Origin (for flight packages) */
  origin?: string;
  
  /** Destination */
  destination: string;
  
  /** Dates */
  dates: {
    startDate: string;
    endDate: string;
  };
  
  /** Travelers */
  travelers: {
    adults: number;
    children: number;
    childrenAges?: number[];
  };
  
  /** Rooms */
  rooms: number;
  
  /** Filters */
  filters?: PackageFilters;
}

export interface PackageFilters {
  /** Max total price */
  maxTotalPrice?: number;
  
  /** Min hotel star rating */
  minHotelStarRating?: number;
  
  /** Flight cabin class */
  cabinClass?: CabinClass;
  
  /** Max flight stops */
  maxFlightStops?: number;
}

// ============================================
// SEARCH OPTIONS
// ============================================

export interface SearchOptions {
  /** Execution strategy */
  strategy?: 'single' | 'price_compare' | 'comprehensive';
  
  /** Timeout in ms */
  timeout?: number;
  
  /** Maximum results */
  limit?: number;
  
  /** Force refresh (bypass cache) */
  refresh?: boolean;
  
  /** Currency preference */
  currency?: string;
  
  /** Language preference */
  language?: string;
}

export interface UserSearchPreferences {
  /** Budget level */
  budgetLevel?: 'budget' | 'mid_range' | 'luxury';
  
  /** Travel style */
  travelStyle?: string;
  
  /** Preferred airlines */
  preferredAirlines?: string[];
  
  /** Preferred hotel chains */
  preferredHotelChains?: string[];
  
  /** Loyalty programs */
  loyaltyPrograms?: string[];
}

// ============================================
// SEARCH RESPONSE
// ============================================

export interface UnifiedSearchResponse<T> {
  /** Was the search successful? */
  success: boolean;
  
  /** Results */
  data: {
    /** Result items */
    results: T[];
    
    /** Total count (may be more than returned) */
    totalCount: number;
    
    /** Providers used */
    providers: ProviderMeta[];
    
    /** Search session ID */
    sessionId: string;
    
    /** Filter options (for UI) */
    filterOptions?: FilterOptions;
    
    /** Price range of results */
    priceRange?: {
      min: UnifiedPrice;
      max: UnifiedPrice;
    };
  };
  
  /** Source of data */
  source: 'live' | 'cache' | 'mixed';
  
  /** Request ID for debugging */
  requestId: string;
  
  /** How long the search took */
  durationMs: number;
  
  /** Any errors (partial failures) */
  errors?: ProviderError[];
}

// ============================================
// FILTER OPTIONS
// ============================================

export interface FilterOptions {
  /** Available airlines (for flights) */
  airlines?: { code: string; name: string; count: number }[];
  
  /** Available stops options */
  stops?: { value: number; count: number }[];
  
  /** Cabin classes available */
  cabinClasses?: { value: CabinClass; count: number }[];
  
  /** Star ratings available (hotels) */
  starRatings?: { value: number; count: number }[];
  
  /** Amenities available */
  amenities?: { id: string; name: string; count: number }[];
  
  /** Price buckets */
  priceBuckets?: { min: number; max: number; count: number }[];
  
  /** Vehicle categories (cars) */
  vehicleCategories?: { value: VehicleCategory; count: number }[];
  
  /** Experience categories */
  experienceCategories?: { value: ExperienceCategory; count: number }[];
}

// ============================================
// PROVIDER ERROR
// ============================================

export interface ProviderError {
  /** Provider code */
  provider: string;
  
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Is this retryable? */
  retryable: boolean;
}

// ============================================
// TYPE ALIASES FOR CONVENIENCE
// ============================================

export type FlightSearchResponse = UnifiedSearchResponse<UnifiedFlight>;
export type HotelSearchResponse = UnifiedSearchResponse<UnifiedHotel>;
export type CarSearchResponse = UnifiedSearchResponse<UnifiedCarRental>;
export type ExperienceSearchResponse = UnifiedSearchResponse<UnifiedExperience>;
export type PackageSearchResponse = UnifiedSearchResponse<UnifiedPackage>;
