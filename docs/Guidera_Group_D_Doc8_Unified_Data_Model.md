# Document 8: Unified Data Model

## Purpose

This document defines the canonical data structures for Guidera. Every provider (Amadeus, Kiwi, Expedia, etc.) returns different JSON formats. The Unified Data Model is the **single source of truth** — all provider responses are transformed into these structures before reaching the app.

This ensures:
- Frontend code never deals with provider-specific formats
- Easy to add new providers without changing app code
- Consistent user experience regardless of data source
- Simplified testing and debugging

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                        │
└─────────────────────────────────────────────────────────────────────────┘

Provider A Response    Provider B Response    Provider C Response
(Amadeus Format)       (Kiwi Format)          (Expedia Format)
        │                     │                      │
        ▼                     ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Amadeus    │      │    Kiwi      │      │   Expedia    │
│   Adapter    │      │   Adapter    │      │   Adapter    │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                      │
        └─────────────────────┼──────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  UNIFIED DATA    │
                    │     MODEL        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Frontend App   │
                    └──────────────────┘
```

---

## Core Entity Types

### 1. UnifiedFlight

Complete flight offer representation.

```typescript
/**
 * UnifiedFlight
 * 
 * Represents a complete flight offer from any provider.
 * Includes all segments, pricing, policies, and metadata.
 */
interface UnifiedFlight {
  // ═══════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Unique identifier for this offer */
  id: string
  
  /** Provider-specific offer ID (needed for booking) */
  providerOfferId: string
  
  /** Which provider this came from */
  provider: ProviderMeta
  
  /** Type of entity */
  type: 'flight'
  
  // ═══════════════════════════════════════════════════════════════════
  // TRIP STRUCTURE
  // ═══════════════════════════════════════════════════════════════════
  
  /** Type of journey */
  tripType: 'one_way' | 'round_trip' | 'multi_city'
  
  /** All segments/slices of the journey */
  slices: FlightSlice[]
  
  /** Total number of stops across all slices */
  totalStops: number
  
  /** Total journey duration in minutes */
  totalDurationMinutes: number
  
  // ═══════════════════════════════════════════════════════════════════
  // PRICING
  // ═══════════════════════════════════════════════════════════════════
  
  /** Complete pricing information */
  price: UnifiedPrice
  
  /** Price per traveler breakdown */
  pricePerTraveler: TravelerPrice[]
  
  /** Fare type/brand if available */
  fareType?: string
  
  /** Fare brand name (e.g., "Basic Economy", "Premium") */
  fareBrand?: string
  
  // ═══════════════════════════════════════════════════════════════════
  // BAGGAGE
  // ═══════════════════════════════════════════════════════════════════
  
  /** Baggage allowance summary */
  baggage: BaggageAllowance
  
  // ═══════════════════════════════════════════════════════════════════
  // POLICIES
  // ═══════════════════════════════════════════════════════════════════
  
  /** Change/cancellation policies */
  policies: FlightPolicies
  
  /** Is this refundable? */
  isRefundable: boolean
  
  /** Is this changeable? */
  isChangeable: boolean
  
  // ═══════════════════════════════════════════════════════════════════
  // BOOKING INFO
  // ═══════════════════════════════════════════════════════════════════
  
  /** Seats remaining (if known) */
  seatsRemaining?: number
  
  /** Is this a live price or cached? */
  isLivePrice: boolean
  
  /** When does this offer expire? */
  expiresAt?: string
  
  /** Booking class codes */
  bookingClasses?: string[]
  
  // ═══════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════
  
  /** When was this offer retrieved? */
  retrievedAt: string
  
  /** Search session this belongs to */
  sessionId?: string
  
  /** Ranking/sorting metadata */
  ranking?: {
    score: number
    priceRank: number
    durationRank: number
    departureTimeRank: number
  }
  
  /** Deep link to provider (if affiliate fallback needed) */
  deepLink?: string
}

/**
 * FlightSlice
 * 
 * One direction of travel (outbound or return).
 * Contains one or more segments.
 */
interface FlightSlice {
  /** Unique ID for this slice */
  id: string
  
  /** Origin airport */
  origin: Airport
  
  /** Destination airport */
  destination: Airport
  
  /** Departure datetime (ISO 8601 with timezone) */
  departureAt: string
  
  /** Arrival datetime (ISO 8601 with timezone) */
  arrivalAt: string
  
  /** Total duration in minutes */
  durationMinutes: number
  
  /** Number of stops */
  stops: number
  
  /** Individual flight segments */
  segments: FlightSegment[]
  
  /** Layover information */
  layovers?: Layover[]
}

/**
 * FlightSegment
 * 
 * A single flight (one takeoff, one landing).
 */
interface FlightSegment {
  /** Segment ID */
  id: string
  
  /** Marketing carrier (airline selling the ticket) */
  marketingCarrier: Airline
  
  /** Operating carrier (airline flying the plane) */
  operatingCarrier?: Airline
  
  /** Flight number (e.g., "UA1234") */
  flightNumber: string
  
  /** Aircraft type */
  aircraft?: Aircraft
  
  /** Origin airport */
  origin: Airport
  
  /** Destination airport */
  destination: Airport
  
  /** Departure datetime */
  departureAt: string
  
  /** Arrival datetime */
  arrivalAt: string
  
  /** Duration in minutes */
  durationMinutes: number
  
  /** Cabin class */
  cabinClass: CabinClass
  
  /** Booking class code (e.g., "Y", "J") */
  bookingClass?: string
  
  /** Seat pitch (legroom) in inches if known */
  seatPitch?: number
  
  /** Amenities on this segment */
  amenities?: SegmentAmenity[]
}

/**
 * Layover
 */
interface Layover {
  /** Airport where layover occurs */
  airport: Airport
  
  /** Duration in minutes */
  durationMinutes: number
  
  /** Is this an overnight layover? */
  isOvernight: boolean
  
  /** Does this require terminal change? */
  terminalChange: boolean
  
  /** Is this a self-transfer (separate tickets)? */
  isSelfTransfer: boolean
}

/**
 * BaggageAllowance
 */
interface BaggageAllowance {
  /** Cabin baggage */
  cabin: {
    included: boolean
    quantity?: number
    weightKg?: number
    dimensions?: string
  }
  
  /** Checked baggage */
  checked: {
    included: boolean
    quantity: number
    weightKg?: number
    dimensions?: string
    /** Cost to add if not included */
    addOnPrice?: UnifiedPrice
  }
}

/**
 * FlightPolicies
 */
interface FlightPolicies {
  /** Cancellation policy */
  cancellation: {
    allowed: boolean
    penalty?: UnifiedPrice
    deadline?: string
    refundType?: 'full' | 'partial' | 'credit' | 'none'
  }
  
  /** Change/modification policy */
  change: {
    allowed: boolean
    penalty?: UnifiedPrice
    deadline?: string
  }
  
  /** No-show policy */
  noShow?: {
    penalty?: UnifiedPrice
    refundable: boolean
  }
  
  /** Full fare rules text (if available) */
  fareRulesText?: string
}
```

---

### 2. UnifiedHotel

Complete hotel property and room offer representation.

```typescript
/**
 * UnifiedHotel
 * 
 * Represents a hotel property with available room offers.
 */
interface UnifiedHotel {
  // ═══════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Unique identifier for this property */
  id: string
  
  /** Provider-specific property ID */
  providerPropertyId: string
  
  /** Which provider this came from */
  provider: ProviderMeta
  
  /** Type of entity */
  type: 'hotel'
  
  // ═══════════════════════════════════════════════════════════════════
  // PROPERTY INFORMATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Property name */
  name: string
  
  /** Property description */
  description?: string
  
  /** Short description (1-2 sentences) */
  shortDescription?: string
  
  /** Property type */
  propertyType: PropertyType
  
  /** Star rating (1-5) */
  starRating?: number
  
  /** Brand/chain */
  brand?: string
  
  /** Chain code */
  chainCode?: string
  
  // ═══════════════════════════════════════════════════════════════════
  // LOCATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Full location details */
  location: HotelLocation
  
  /** Distance from search point (if location search) */
  distanceFromSearch?: {
    value: number
    unit: 'km' | 'mi'
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // MEDIA
  // ═══════════════════════════════════════════════════════════════════
  
  /** Images */
  images: HotelImage[]
  
  /** Main/hero image URL */
  heroImage?: string
  
  // ═══════════════════════════════════════════════════════════════════
  // RATINGS & REVIEWS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Guest rating */
  guestRating?: {
    score: number
    maxScore: number
    reviewCount: number
    sentiment?: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor'
  }
  
  /** Category ratings */
  categoryRatings?: {
    cleanliness?: number
    location?: number
    service?: number
    value?: number
    amenities?: number
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // AMENITIES
  // ═══════════════════════════════════════════════════════════════════
  
  /** Property amenities */
  amenities: HotelAmenity[]
  
  /** Key amenities for quick display */
  keyAmenities: string[]
  
  // ═══════════════════════════════════════════════════════════════════
  // ROOM OFFERS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Available room offers */
  rooms: RoomOffer[]
  
  /** Lowest price across all rooms */
  lowestPrice: UnifiedPrice
  
  // ═══════════════════════════════════════════════════════════════════
  // POLICIES
  // ═══════════════════════════════════════════════════════════════════
  
  /** Check-in time */
  checkInTime?: string
  
  /** Check-out time */
  checkOutTime?: string
  
  /** General policies */
  policies?: HotelPolicies
  
  // ═══════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════
  
  /** When was this retrieved? */
  retrievedAt: string
  
  /** Session ID */
  sessionId?: string
  
  /** Deep link */
  deepLink?: string
}

/**
 * RoomOffer
 * 
 * A specific room type with pricing.
 */
interface RoomOffer {
  /** Offer ID */
  id: string
  
  /** Provider offer ID (needed for booking) */
  providerOfferId: string
  
  /** Room name */
  name: string
  
  /** Room description */
  description?: string
  
  /** Room type */
  roomType: RoomType
  
  /** Bed configuration */
  bedConfiguration: BedConfig[]
  
  /** Room size */
  size?: {
    value: number
    unit: 'sqft' | 'sqm'
  }
  
  /** Max occupancy */
  maxOccupancy: {
    adults: number
    children: number
    total: number
  }
  
  /** Room amenities */
  amenities: string[]
  
  /** Room images */
  images?: HotelImage[]
  
  /** Pricing */
  price: UnifiedPrice
  
  /** Price per night */
  pricePerNight: UnifiedPrice
  
  /** What's included */
  inclusions: string[]
  
  /** Board type */
  boardType: BoardType
  
  /** Cancellation policy */
  cancellationPolicy: HotelCancellationPolicy
  
  /** Is this refundable? */
  isRefundable: boolean
  
  /** Payment terms */
  paymentTerms: PaymentTerms
  
  /** Rooms remaining */
  roomsRemaining?: number
  
  /** Is this a special offer? */
  isPromotion?: boolean
  
  /** Promotion name */
  promotionName?: string
}

/**
 * HotelLocation
 */
interface HotelLocation {
  /** Full address */
  address: Address
  
  /** Coordinates */
  coordinates: Coordinates
  
  /** Neighborhood/area */
  neighborhood?: string
  
  /** City */
  city: string
  
  /** Country */
  country: string
  
  /** Country code */
  countryCode: string
  
  /** Timezone */
  timezone?: string
  
  /** Nearby points of interest */
  nearbyPOIs?: NearbyPOI[]
}

/**
 * HotelCancellationPolicy
 */
interface HotelCancellationPolicy {
  /** Is free cancellation available? */
  freeCancellation: boolean
  
  /** Free cancellation deadline */
  freeCancellationDeadline?: string
  
  /** Cancellation rules */
  rules: CancellationRule[]
  
  /** Policy summary text */
  summary: string
}

interface CancellationRule {
  /** From this datetime */
  from?: string
  
  /** To this datetime */
  to?: string
  
  /** Penalty type */
  penaltyType: 'percentage' | 'nights' | 'fixed'
  
  /** Penalty value */
  penaltyValue: number
  
  /** Or fixed amount */
  penaltyAmount?: UnifiedPrice
}

/**
 * HotelPolicies
 */
interface HotelPolicies {
  /** Check-in policy */
  checkIn: {
    time: string
    instructions?: string
    minAge?: number
  }
  
  /** Check-out policy */
  checkOut: {
    time: string
    lateCheckoutAvailable?: boolean
    lateCheckoutFee?: UnifiedPrice
  }
  
  /** Pet policy */
  pets?: {
    allowed: boolean
    fee?: UnifiedPrice
    restrictions?: string
  }
  
  /** Smoking policy */
  smoking?: {
    allowed: boolean
    designatedAreas?: boolean
  }
  
  /** Payment methods accepted */
  paymentMethods?: string[]
  
  /** Required at check-in */
  requiredAtCheckIn?: string[]
}
```

---

### 3. UnifiedCarRental

Complete car rental offer representation.

```typescript
/**
 * UnifiedCarRental
 * 
 * Represents a car rental offer.
 */
interface UnifiedCarRental {
  // ═══════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Unique identifier */
  id: string
  
  /** Provider offer ID */
  providerOfferId: string
  
  /** Provider info */
  provider: ProviderMeta
  
  /** Type */
  type: 'car'
  
  // ═══════════════════════════════════════════════════════════════════
  // VEHICLE INFORMATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Vehicle details */
  vehicle: Vehicle
  
  /** Rental company */
  rentalCompany: RentalCompany
  
  // ═══════════════════════════════════════════════════════════════════
  // RENTAL DETAILS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Pickup location */
  pickupLocation: CarLocation
  
  /** Dropoff location */
  dropoffLocation: CarLocation
  
  /** Pickup datetime */
  pickupAt: string
  
  /** Dropoff datetime */
  dropoffAt: string
  
  /** Rental duration in days */
  rentalDays: number
  
  // ═══════════════════════════════════════════════════════════════════
  // PRICING
  // ═══════════════════════════════════════════════════════════════════
  
  /** Total price */
  price: UnifiedPrice
  
  /** Price per day */
  pricePerDay: UnifiedPrice
  
  /** What's included in price */
  inclusions: CarInclusion[]
  
  /** Available extras */
  extras?: CarExtra[]
  
  // ═══════════════════════════════════════════════════════════════════
  // POLICIES
  // ═══════════════════════════════════════════════════════════════════
  
  /** Mileage policy */
  mileagePolicy: MileagePolicy
  
  /** Fuel policy */
  fuelPolicy: FuelPolicy
  
  /** Insurance options */
  insurance: InsuranceOption[]
  
  /** Cancellation policy */
  cancellationPolicy: CarCancellationPolicy
  
  /** Driver requirements */
  driverRequirements: DriverRequirements
  
  // ═══════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════
  
  /** Supplier rating */
  supplierRating?: number
  
  /** Is pay at pickup? */
  payAtPickup: boolean
  
  /** Pay now vs pay later price difference */
  payLaterPrice?: UnifiedPrice
  
  /** Retrieved at */
  retrievedAt: string
  
  /** Deep link */
  deepLink?: string
}

/**
 * Vehicle
 */
interface Vehicle {
  /** Vehicle name/model */
  name: string
  
  /** Example models */
  exampleModels?: string[]
  
  /** Vehicle category */
  category: VehicleCategory
  
  /** Vehicle type */
  vehicleType: VehicleType
  
  /** Transmission */
  transmission: 'automatic' | 'manual'
  
  /** Fuel type */
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid'
  
  /** Number of seats */
  seats: number
  
  /** Number of doors */
  doors: number
  
  /** Luggage capacity */
  luggage: {
    large: number
    small: number
  }
  
  /** Air conditioning */
  airConditioning: boolean
  
  /** Vehicle image */
  imageUrl?: string
  
  /** ACRISS code */
  acrissCode?: string
  
  /** Features */
  features?: string[]
}

/**
 * RentalCompany
 */
interface RentalCompany {
  /** Company code */
  code: string
  
  /** Company name */
  name: string
  
  /** Logo URL */
  logoUrl?: string
  
  /** Rating */
  rating?: number
  
  /** Review count */
  reviewCount?: number
}

/**
 * CarLocation
 */
interface CarLocation {
  /** Location type */
  type: 'airport' | 'city' | 'train_station' | 'hotel'
  
  /** Location name */
  name: string
  
  /** Full address */
  address: Address
  
  /** Coordinates */
  coordinates?: Coordinates
  
  /** Airport code (if airport) */
  airportCode?: string
  
  /** Is in terminal? */
  inTerminal?: boolean
  
  /** Shuttle available? */
  shuttleAvailable?: boolean
  
  /** Counter location instructions */
  instructions?: string
  
  /** Operating hours */
  operatingHours?: {
    open: string
    close: string
    is24Hours: boolean
  }
}

/**
 * MileagePolicy
 */
interface MileagePolicy {
  /** Is unlimited? */
  unlimited: boolean
  
  /** Included miles/km (if not unlimited) */
  includedDistance?: number
  
  /** Distance unit */
  unit?: 'km' | 'mi'
  
  /** Cost per extra unit */
  extraCost?: UnifiedPrice
}

/**
 * FuelPolicy
 */
interface FuelPolicy {
  /** Policy type */
  type: 'full_to_full' | 'same_to_same' | 'prepaid' | 'full_to_empty'
  
  /** Description */
  description: string
}

/**
 * InsuranceOption
 */
interface InsuranceOption {
  /** Insurance type */
  type: 'cdw' | 'theft' | 'liability' | 'personal' | 'super_cdw'
  
  /** Name */
  name: string
  
  /** Is included in base price? */
  included: boolean
  
  /** Price if not included */
  price?: UnifiedPrice
  
  /** Coverage details */
  coverage?: string
  
  /** Excess/deductible amount */
  excess?: UnifiedPrice
}

/**
 * DriverRequirements
 */
interface DriverRequirements {
  /** Minimum age */
  minimumAge: number
  
  /** Young driver fee (if applicable) */
  youngDriverFee?: {
    maxAge: number
    fee: UnifiedPrice
  }
  
  /** License requirements */
  licenseRequirements: string[]
  
  /** International license needed? */
  internationalLicenseRequired?: boolean
  
  /** Credit card required? */
  creditCardRequired: boolean
  
  /** Additional driver fee */
  additionalDriverFee?: UnifiedPrice
}
```

---

### 4. UnifiedExperience

Complete activity/tour offer representation.

```typescript
/**
 * UnifiedExperience
 * 
 * Represents a tour, activity, or experience offer.
 */
interface UnifiedExperience {
  // ═══════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Unique identifier */
  id: string
  
  /** Provider product ID */
  providerProductId: string
  
  /** Provider info */
  provider: ProviderMeta
  
  /** Type */
  type: 'experience'
  
  // ═══════════════════════════════════════════════════════════════════
  // BASIC INFO
  // ═══════════════════════════════════════════════════════════════════
  
  /** Activity title */
  title: string
  
  /** Short description */
  shortDescription: string
  
  /** Full description */
  description: string
  
  /** Activity category */
  category: ExperienceCategory
  
  /** Subcategories/tags */
  tags: string[]
  
  // ═══════════════════════════════════════════════════════════════════
  // LOCATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Primary location */
  location: ExperienceLocation
  
  /** Meeting point */
  meetingPoint?: MeetingPoint
  
  /** Ending point (if different) */
  endingPoint?: MeetingPoint
  
  // ═══════════════════════════════════════════════════════════════════
  // DURATION & SCHEDULE
  // ═══════════════════════════════════════════════════════════════════
  
  /** Duration */
  duration: {
    value: number
    unit: 'minutes' | 'hours' | 'days'
    isFlexible: boolean
  }
  
  /** Available dates/times */
  availability: ExperienceAvailability
  
  // ═══════════════════════════════════════════════════════════════════
  // PRICING
  // ═══════════════════════════════════════════════════════════════════
  
  /** Starting price (per person) */
  price: UnifiedPrice
  
  /** Price type */
  priceType: 'per_person' | 'per_group' | 'per_unit'
  
  /** Pricing options by participant type */
  pricingOptions: PricingOption[]
  
  /** Group discount available? */
  groupDiscount?: {
    minSize: number
    discountPercent: number
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // MEDIA
  // ═══════════════════════════════════════════════════════════════════
  
  /** Images */
  images: ExperienceImage[]
  
  /** Hero image */
  heroImage: string
  
  /** Video URL */
  videoUrl?: string
  
  // ═══════════════════════════════════════════════════════════════════
  // RATINGS & REVIEWS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Rating */
  rating: {
    score: number
    maxScore: number
    reviewCount: number
  }
  
  /** Sample reviews */
  sampleReviews?: ExperienceReview[]
  
  // ═══════════════════════════════════════════════════════════════════
  // DETAILS
  // ═══════════════════════════════════════════════════════════════════
  
  /** What's included */
  inclusions: string[]
  
  /** What's not included */
  exclusions: string[]
  
  /** Highlights */
  highlights: string[]
  
  /** What to bring */
  whatToBring?: string[]
  
  /** Itinerary (for tours) */
  itinerary?: ItineraryStop[]
  
  // ═══════════════════════════════════════════════════════════════════
  // REQUIREMENTS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Physical requirements */
  physicalRequirements?: {
    fitnessLevel: 'easy' | 'moderate' | 'challenging' | 'difficult'
    description?: string
  }
  
  /** Age restrictions */
  ageRestrictions?: {
    minAge?: number
    maxAge?: number
    childPolicy?: string
  }
  
  /** Accessibility */
  accessibility?: {
    wheelchairAccessible: boolean
    details?: string
  }
  
  /** Language */
  languages: string[]
  
  // ═══════════════════════════════════════════════════════════════════
  // POLICIES
  // ═══════════════════════════════════════════════════════════════════
  
  /** Cancellation policy */
  cancellationPolicy: ExperienceCancellationPolicy
  
  /** Booking requirements */
  bookingRequirements: {
    advanceBookingRequired: boolean
    minAdvanceHours?: number
    instantConfirmation: boolean
    voucherType: 'mobile' | 'printed' | 'both'
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════
  
  /** Is this a bestseller? */
  isBestseller: boolean
  
  /** Is this a special offer? */
  isSpecialOffer: boolean
  
  /** Special offer details */
  specialOffer?: {
    name: string
    discountPercent: number
    validUntil: string
  }
  
  /** Skip the line? */
  skipTheLine: boolean
  
  /** Free cancellation? */
  freeCancellation: boolean
  
  /** Retrieved at */
  retrievedAt: string
  
  /** Deep link */
  deepLink?: string
}

/**
 * ExperienceAvailability
 */
interface ExperienceAvailability {
  /** Available dates (next 30 days summary) */
  availableDates: string[]
  
  /** Time slots for a specific date (populated on date selection) */
  timeSlots?: TimeSlot[]
  
  /** Seasonal availability */
  seasonalAvailability?: {
    available: boolean
    months?: number[]
    note?: string
  }
  
  /** Next available date */
  nextAvailable?: string
}

interface TimeSlot {
  /** Start time */
  startTime: string
  
  /** End time */
  endTime?: string
  
  /** Available spots */
  availableSpots?: number
  
  /** Price for this slot (if different) */
  price?: UnifiedPrice
}

/**
 * PricingOption
 */
interface PricingOption {
  /** Participant type */
  type: 'adult' | 'child' | 'infant' | 'senior' | 'student' | 'group'
  
  /** Label */
  label: string
  
  /** Age range */
  ageRange?: {
    min: number
    max: number
  }
  
  /** Price */
  price: UnifiedPrice
  
  /** Is required? (e.g., must have at least 1 adult) */
  required?: boolean
  
  /** Min quantity */
  minQuantity?: number
  
  /** Max quantity */
  maxQuantity?: number
}

/**
 * MeetingPoint
 */
interface MeetingPoint {
  /** Location name */
  name: string
  
  /** Full address */
  address?: Address
  
  /** Coordinates */
  coordinates?: Coordinates
  
  /** Instructions */
  instructions?: string
  
  /** Image/map */
  imageUrl?: string
}

/**
 * ItineraryStop
 */
interface ItineraryStop {
  /** Order in itinerary */
  order: number
  
  /** Stop name */
  name: string
  
  /** Duration at stop */
  durationMinutes?: number
  
  /** Description */
  description?: string
  
  /** Admission included? */
  admissionIncluded?: boolean
}

/**
 * ExperienceCancellationPolicy
 */
interface ExperienceCancellationPolicy {
  /** Free cancellation available? */
  freeCancellation: boolean
  
  /** Free cancellation deadline (hours before) */
  freeCancellationHours?: number
  
  /** Policy description */
  description: string
  
  /** Refund rules */
  refundRules?: {
    hoursBeforeStart: number
    refundPercent: number
  }[]
}
```

---

### 5. UnifiedPackage

Combined travel package representation.

```typescript
/**
 * UnifiedPackage
 * 
 * Represents a bundled travel package (flight + hotel, etc.)
 */
interface UnifiedPackage {
  // ═══════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Unique identifier */
  id: string
  
  /** Provider package ID */
  providerPackageId: string
  
  /** Provider info */
  provider: ProviderMeta
  
  /** Type */
  type: 'package'
  
  // ═══════════════════════════════════════════════════════════════════
  // PACKAGE COMPOSITION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Package type */
  packageType: 'flight_hotel' | 'flight_hotel_car' | 'hotel_car' | 'custom'
  
  /** Package name/title */
  name: string
  
  /** Description */
  description?: string
  
  /** Included components */
  components: PackageComponent[]
  
  // ═══════════════════════════════════════════════════════════════════
  // DESTINATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Origin (for flight packages) */
  origin?: Location
  
  /** Destination */
  destination: Location
  
  /** Travel dates */
  dates: {
    startDate: string
    endDate: string
    nights: number
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PRICING
  // ═══════════════════════════════════════════════════════════════════
  
  /** Total package price */
  totalPrice: UnifiedPrice
  
  /** Price per person */
  pricePerPerson: UnifiedPrice
  
  /** Breakdown by component */
  priceBreakdown: {
    componentType: string
    price: UnifiedPrice
  }[]
  
  /** Savings vs booking separately */
  savings?: UnifiedPrice
  
  /** Savings percentage */
  savingsPercent?: number
  
  // ═══════════════════════════════════════════════════════════════════
  // TRAVELERS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Number of travelers this price is for */
  travelers: {
    adults: number
    children: number
    infants: number
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // POLICIES
  // ═══════════════════════════════════════════════════════════════════
  
  /** Package cancellation policy */
  cancellationPolicy: PackageCancellationPolicy
  
  /** Payment terms */
  paymentTerms: PaymentTerms
  
  // ═══════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════
  
  /** Is this a deal? */
  isDeal: boolean
  
  /** Deal name */
  dealName?: string
  
  /** Valid until */
  validUntil?: string
  
  /** Limited availability? */
  limitedAvailability: boolean
  
  /** Retrieved at */
  retrievedAt: string
  
  /** Deep link */
  deepLink?: string
}

/**
 * PackageComponent
 */
interface PackageComponent {
  /** Component type */
  type: 'flight' | 'hotel' | 'car' | 'experience' | 'transfer'
  
  /** Is this customizable? */
  isCustomizable: boolean
  
  /** Is this optional? */
  isOptional: boolean
  
  /** Component details */
  details: UnifiedFlight | UnifiedHotel | UnifiedCarRental | UnifiedExperience
  
  /** Alternatives (if customizable) */
  alternatives?: (UnifiedFlight | UnifiedHotel | UnifiedCarRental | UnifiedExperience)[]
}

/**
 * PackageCancellationPolicy
 */
interface PackageCancellationPolicy {
  /** Is package cancellable? */
  cancellable: boolean
  
  /** Free cancellation deadline */
  freeCancellationDeadline?: string
  
  /** Cancellation rules */
  rules: {
    daysBeforeTravel: number
    penaltyPercent: number
    penaltyAmount?: UnifiedPrice
  }[]
  
  /** Note about partial cancellation */
  partialCancellationNote?: string
}
```

---

## Common Types

### Price Types

```typescript
/**
 * UnifiedPrice
 * 
 * Standardized price representation.
 */
interface UnifiedPrice {
  /** Amount in currency's smallest unit precision */
  amount: number
  
  /** Currency code (ISO 4217) */
  currency: string
  
  /** Formatted string for display */
  formatted: string
  
  /** Price breakdown (if available) */
  breakdown?: PriceBreakdown
  
  /** Original price (if discounted) */
  originalPrice?: number
  
  /** Discount percentage */
  discountPercent?: number
}

/**
 * PriceBreakdown
 */
interface PriceBreakdown {
  /** Base fare/rate */
  base: number
  
  /** Taxes */
  taxes: number
  
  /** Fees */
  fees: number
  
  /** Service charge */
  serviceCharge?: number
  
  /** Individual tax items */
  taxItems?: {
    name: string
    amount: number
  }[]
  
  /** Individual fee items */
  feeItems?: {
    name: string
    amount: number
    included: boolean
  }[]
}

/**
 * TravelerPrice
 */
interface TravelerPrice {
  /** Traveler type */
  travelerType: 'adult' | 'child' | 'infant' | 'senior'
  
  /** Number of travelers */
  count: number
  
  /** Price per traveler */
  pricePerTraveler: UnifiedPrice
  
  /** Total for this traveler type */
  totalPrice: UnifiedPrice
}
```

### Location Types

```typescript
/**
 * Address
 */
interface Address {
  /** Street address line 1 */
  line1: string
  
  /** Street address line 2 */
  line2?: string
  
  /** City */
  city: string
  
  /** State/Province */
  stateProvince?: string
  
  /** Postal code */
  postalCode?: string
  
  /** Country */
  country: string
  
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string
  
  /** Full formatted address */
  formatted: string
}

/**
 * Coordinates
 */
interface Coordinates {
  /** Latitude */
  latitude: number
  
  /** Longitude */
  longitude: number
}

/**
 * Location
 */
interface Location {
  /** Location name */
  name: string
  
  /** Location type */
  type: 'city' | 'airport' | 'region' | 'point_of_interest'
  
  /** City name */
  city?: string
  
  /** Country */
  country: string
  
  /** Country code */
  countryCode: string
  
  /** Coordinates */
  coordinates?: Coordinates
  
  /** Airport code (if airport) */
  airportCode?: string
  
  /** Timezone */
  timezone?: string
}

/**
 * Airport
 */
interface Airport {
  /** IATA code */
  code: string
  
  /** Airport name */
  name: string
  
  /** City */
  city: string
  
  /** Country */
  country: string
  
  /** Country code */
  countryCode: string
  
  /** Terminal (if known) */
  terminal?: string
  
  /** Coordinates */
  coordinates?: Coordinates
  
  /** Timezone */
  timezone: string
}

/**
 * NearbyPOI
 */
interface NearbyPOI {
  /** POI name */
  name: string
  
  /** Type */
  type: 'attraction' | 'transport' | 'shopping' | 'dining' | 'beach' | 'park'
  
  /** Distance */
  distance: {
    value: number
    unit: 'km' | 'mi' | 'm'
  }
  
  /** Walk time in minutes */
  walkTimeMinutes?: number
}
```

### Travel Entity Types

```typescript
/**
 * Airline
 */
interface Airline {
  /** IATA code */
  code: string
  
  /** Airline name */
  name: string
  
  /** Logo URL */
  logoUrl?: string
  
  /** Alliance */
  alliance?: 'star_alliance' | 'oneworld' | 'skyteam' | 'none'
}

/**
 * Aircraft
 */
interface Aircraft {
  /** IATA code */
  code: string
  
  /** Name */
  name: string
  
  /** Is wide body? */
  isWidebody?: boolean
}

/**
 * BedConfig
 */
interface BedConfig {
  /** Bed type */
  type: 'king' | 'queen' | 'double' | 'twin' | 'single' | 'sofa_bed' | 'bunk'
  
  /** Count */
  count: number
}
```

### Provider Types

```typescript
/**
 * ProviderMeta
 * 
 * Information about which provider supplied this data.
 */
interface ProviderMeta {
  /** Provider code */
  code: string
  
  /** Provider name */
  name: string
  
  /** Provider logo */
  logoUrl?: string
  
  /** Response time for this request */
  responseTimeMs?: number
  
  /** Confidence in data freshness (0-100) */
  freshnessScore?: number
  
  /** When was this data retrieved? */
  retrievedAt: string
}
```

### Payment Types

```typescript
/**
 * PaymentTerms
 */
interface PaymentTerms {
  /** Payment type */
  type: 'pay_now' | 'pay_later' | 'pay_at_property' | 'deposit'
  
  /** Deposit required? */
  depositRequired?: boolean
  
  /** Deposit amount */
  depositAmount?: UnifiedPrice
  
  /** Deposit deadline */
  depositDeadline?: string
  
  /** Balance due date */
  balanceDueDate?: string
  
  /** Accepted payment methods */
  acceptedMethods?: string[]
}
```

---

## Enums

```typescript
/**
 * CabinClass
 */
enum CabinClass {
  ECONOMY = 'economy',
  PREMIUM_ECONOMY = 'premium_economy',
  BUSINESS = 'business',
  FIRST = 'first'
}

/**
 * PropertyType
 */
enum PropertyType {
  HOTEL = 'hotel',
  RESORT = 'resort',
  APARTMENT = 'apartment',
  VILLA = 'villa',
  HOSTEL = 'hostel',
  MOTEL = 'motel',
  BED_AND_BREAKFAST = 'bed_and_breakfast',
  GUEST_HOUSE = 'guest_house',
  VACATION_RENTAL = 'vacation_rental',
  BOUTIQUE = 'boutique',
  LODGE = 'lodge',
  CABIN = 'cabin'
}

/**
 * RoomType
 */
enum RoomType {
  STANDARD = 'standard',
  SUPERIOR = 'superior',
  DELUXE = 'deluxe',
  SUITE = 'suite',
  JUNIOR_SUITE = 'junior_suite',
  EXECUTIVE = 'executive',
  FAMILY = 'family',
  STUDIO = 'studio',
  PENTHOUSE = 'penthouse',
  VILLA = 'villa',
  BUNGALOW = 'bungalow'
}

/**
 * BoardType
 */
enum BoardType {
  ROOM_ONLY = 'room_only',
  BREAKFAST = 'breakfast',
  HALF_BOARD = 'half_board',
  FULL_BOARD = 'full_board',
  ALL_INCLUSIVE = 'all_inclusive'
}

/**
 * VehicleCategory
 */
enum VehicleCategory {
  MINI = 'mini',
  ECONOMY = 'economy',
  COMPACT = 'compact',
  MIDSIZE = 'midsize',
  STANDARD = 'standard',
  FULLSIZE = 'fullsize',
  PREMIUM = 'premium',
  LUXURY = 'luxury',
  SPECIAL = 'special'
}

/**
 * VehicleType
 */
enum VehicleType {
  CAR = 'car',
  SUV = 'suv',
  VAN = 'van',
  TRUCK = 'truck',
  CONVERTIBLE = 'convertible',
  WAGON = 'wagon',
  SPORTS = 'sports',
  ELECTRIC = 'electric'
}

/**
 * ExperienceCategory
 */
enum ExperienceCategory {
  TOURS = 'tours',
  ACTIVITIES = 'activities',
  ATTRACTIONS = 'attractions',
  DAY_TRIPS = 'day_trips',
  FOOD_AND_DRINK = 'food_and_drink',
  CLASSES = 'classes',
  OUTDOOR = 'outdoor',
  WATER_SPORTS = 'water_sports',
  AIR_ACTIVITIES = 'air_activities',
  WELLNESS = 'wellness',
  NIGHTLIFE = 'nightlife',
  TRANSPORT = 'transport',
  TICKETS = 'tickets'
}
```

---

## Search Request Types

### Unified Search Request

```typescript
/**
 * UnifiedSearchRequest
 * 
 * Standardized search request that works across all categories.
 */
interface UnifiedSearchRequest {
  /** What are we searching for? */
  category: 'flights' | 'hotels' | 'cars' | 'experiences' | 'packages'
  
  /** Category-specific parameters */
  params: FlightSearchParams | HotelSearchParams | CarSearchParams | ExperienceSearchParams | PackageSearchParams
  
  /** User making the search */
  userId?: string
  
  /** Search session ID */
  sessionId?: string
  
  /** User preferences for personalization */
  preferences?: UserPreferences
  
  /** Search options */
  options?: SearchOptions
}

/**
 * FlightSearchParams
 */
interface FlightSearchParams {
  /** Trip type */
  tripType: 'one_way' | 'round_trip' | 'multi_city'
  
  /** Segments (one for one-way, two for round-trip, 2+ for multi-city) */
  segments: FlightSearchSegment[]
  
  /** Number of travelers */
  travelers: {
    adults: number
    children: number
    infants: number
  }
  
  /** Cabin class */
  cabinClass?: CabinClass
  
  /** Filters */
  filters?: FlightFilters
  
  /** Sort by */
  sortBy?: 'price' | 'duration' | 'departure' | 'arrival' | 'stops'
}

interface FlightSearchSegment {
  /** Origin airport/city code */
  origin: string
  
  /** Destination airport/city code */
  destination: string
  
  /** Departure date (YYYY-MM-DD) */
  departureDate: string
  
  /** Flexible dates? */
  flexibleDates?: boolean
}

interface FlightFilters {
  /** Max price */
  maxPrice?: number
  
  /** Max stops */
  maxStops?: number
  
  /** Preferred airlines */
  airlines?: string[]
  
  /** Excluded airlines */
  excludeAirlines?: string[]
  
  /** Departure time range */
  departureTime?: {
    earliest: string
    latest: string
  }
  
  /** Arrival time range */
  arrivalTime?: {
    earliest: string
    latest: string
  }
  
  /** Alliance preference */
  alliance?: string
  
  /** Bags required */
  bagsRequired?: number
}

/**
 * HotelSearchParams
 */
interface HotelSearchParams {
  /** Destination (city, address, or coordinates) */
  destination: {
    type: 'city' | 'coordinates' | 'property_id'
    value: string | Coordinates
  }
  
  /** Check-in date */
  checkInDate: string
  
  /** Check-out date */
  checkOutDate: string
  
  /** Rooms needed */
  rooms: RoomRequest[]
  
  /** Filters */
  filters?: HotelFilters
  
  /** Sort by */
  sortBy?: 'price' | 'rating' | 'distance' | 'popularity'
}

interface RoomRequest {
  /** Adults in this room */
  adults: number
  
  /** Children in this room */
  children: number
  
  /** Children ages */
  childrenAges?: number[]
}

interface HotelFilters {
  /** Max price per night */
  maxPricePerNight?: number
  
  /** Min star rating */
  minStarRating?: number
  
  /** Property types */
  propertyTypes?: PropertyType[]
  
  /** Required amenities */
  amenities?: string[]
  
  /** Board types */
  boardTypes?: BoardType[]
  
  /** Free cancellation only */
  freeCancellation?: boolean
  
  /** Max distance from search point */
  maxDistance?: {
    value: number
    unit: 'km' | 'mi'
  }
  
  /** Guest rating minimum */
  minGuestRating?: number
  
  /** Specific chains */
  chains?: string[]
}

/**
 * CarSearchParams
 */
interface CarSearchParams {
  /** Pickup location */
  pickupLocation: {
    type: 'airport' | 'city' | 'coordinates'
    value: string | Coordinates
  }
  
  /** Dropoff location (if different) */
  dropoffLocation?: {
    type: 'airport' | 'city' | 'coordinates'
    value: string | Coordinates
  }
  
  /** Pickup datetime */
  pickupDateTime: string
  
  /** Dropoff datetime */
  dropoffDateTime: string
  
  /** Driver age */
  driverAge: number
  
  /** Filters */
  filters?: CarFilters
  
  /** Sort by */
  sortBy?: 'price' | 'category' | 'rating'
}

interface CarFilters {
  /** Max price per day */
  maxPricePerDay?: number
  
  /** Vehicle categories */
  categories?: VehicleCategory[]
  
  /** Vehicle types */
  vehicleTypes?: VehicleType[]
  
  /** Transmission */
  transmission?: 'automatic' | 'manual'
  
  /** Min seats */
  minSeats?: number
  
  /** Air conditioning required */
  airConditioningRequired?: boolean
  
  /** Unlimited mileage only */
  unlimitedMileageOnly?: boolean
  
  /** Specific suppliers */
  suppliers?: string[]
}

/**
 * ExperienceSearchParams
 */
interface ExperienceSearchParams {
  /** Destination */
  destination: {
    type: 'city' | 'coordinates' | 'attraction'
    value: string | Coordinates
  }
  
  /** Date(s) */
  dates: {
    startDate: string
    endDate?: string
    flexibleDates?: boolean
  }
  
  /** Number of participants */
  participants: {
    adults: number
    children: number
    childrenAges?: number[]
  }
  
  /** Filters */
  filters?: ExperienceFilters
  
  /** Sort by */
  sortBy?: 'price' | 'rating' | 'popularity' | 'duration'
}

interface ExperienceFilters {
  /** Max price per person */
  maxPricePerPerson?: number
  
  /** Categories */
  categories?: ExperienceCategory[]
  
  /** Duration range */
  duration?: {
    min: number
    max: number
    unit: 'hours'
  }
  
  /** Time of day */
  timeOfDay?: ('morning' | 'afternoon' | 'evening')[]
  
  /** Languages */
  languages?: string[]
  
  /** Free cancellation only */
  freeCancellation?: boolean
  
  /** Skip the line */
  skipTheLine?: boolean
  
  /** Min rating */
  minRating?: number
  
  /** Wheelchair accessible */
  wheelchairAccessible?: boolean
}

/**
 * SearchOptions
 */
interface SearchOptions {
  /** Execution strategy */
  strategy?: 'single' | 'price_compare' | 'comprehensive'
  
  /** Timeout in ms */
  timeout?: number
  
  /** Maximum results */
  limit?: number
  
  /** Force refresh (bypass cache) */
  refresh?: boolean
  
  /** Currency preference */
  currency?: string
  
  /** Language preference */
  language?: string
}
```

---

## Search Response Types

```typescript
/**
 * UnifiedSearchResponse
 */
interface UnifiedSearchResponse<T> {
  /** Was the search successful? */
  success: boolean
  
  /** Results */
  data: {
    /** Result items */
    results: T[]
    
    /** Total count (may be more than returned) */
    totalCount: number
    
    /** Providers used */
    providers: ProviderMeta[]
    
    /** Search session ID */
    sessionId: string
    
    /** Filter options (for UI) */
    filterOptions?: FilterOptions
    
    /** Price range of results */
    priceRange?: {
      min: UnifiedPrice
      max: UnifiedPrice
    }
  }
  
  /** Source of data */
  source: 'live' | 'cache' | 'mixed'
  
  /** Request ID for debugging */
  requestId: string
  
  /** How long the search took */
  durationMs: number
  
  /** Any errors (partial failures) */
  errors?: ProviderError[]
}

/**
 * FilterOptions
 * 
 * Dynamic filter options based on results.
 */
interface FilterOptions {
  /** Available airlines (for flights) */
  airlines?: { code: string; name: string; count: number }[]
  
  /** Available stops options */
  stops?: { value: number; count: number }[]
  
  /** Cabin classes available */
  cabinClasses?: { value: CabinClass; count: number }[]
  
  /** Star ratings available (hotels) */
  starRatings?: { value: number; count: number }[]
  
  /** Amenities available */
  amenities?: { id: string; name: string; count: number }[]
  
  /** Price buckets */
  priceBuckets?: { min: number; max: number; count: number }[]
  
  /** Vehicle categories (cars) */
  vehicleCategories?: { value: VehicleCategory; count: number }[]
  
  /** Experience categories */
  experienceCategories?: { value: ExperienceCategory; count: number }[]
}

/**
 * ProviderError
 */
interface ProviderError {
  /** Provider code */
  provider: string
  
  /** Error code */
  code: string
  
  /** Error message */
  message: string
  
  /** Is this retryable? */
  retryable: boolean
}
```

---

## Booking Types

```typescript
/**
 * BookingRequest
 */
interface BookingRequest {
  /** Session ID (from search) */
  sessionId: string
  
  /** Offer ID to book */
  offerId: string
  
  /** Provider code */
  providerCode: string
  
  /** Category */
  category: 'flights' | 'hotels' | 'cars' | 'experiences' | 'packages'
  
  /** Traveler/guest details */
  travelers: TravelerDetails[]
  
  /** Contact information */
  contact: ContactInfo
  
  /** Payment method */
  payment: PaymentMethod
  
  /** Special requests */
  specialRequests?: string[]
  
  /** Terms accepted */
  termsAccepted: boolean
  
  /** Idempotency key (prevent double booking) */
  idempotencyKey: string
}

/**
 * TravelerDetails
 */
interface TravelerDetails {
  /** Traveler type */
  type: 'adult' | 'child' | 'infant'
  
  /** First name */
  firstName: string
  
  /** Last name */
  lastName: string
  
  /** Date of birth */
  dateOfBirth: string
  
  /** Gender */
  gender: 'male' | 'female' | 'other'
  
  /** Email */
  email?: string
  
  /** Phone */
  phone?: string
  
  /** Passport/ID (for flights) */
  document?: {
    type: 'passport' | 'national_id'
    number: string
    issuingCountry: string
    expiryDate: string
  }
  
  /** Loyalty program (optional) */
  loyaltyProgram?: {
    programCode: string
    memberId: string
  }
  
  /** Seat preference (flights) */
  seatPreference?: 'window' | 'aisle' | 'middle' | 'no_preference'
  
  /** Meal preference (flights) */
  mealPreference?: string
  
  /** Special assistance */
  specialAssistance?: string[]
}

/**
 * ContactInfo
 */
interface ContactInfo {
  /** First name */
  firstName: string
  
  /** Last name */
  lastName: string
  
  /** Email */
  email: string
  
  /** Phone */
  phone: string
  
  /** Country code */
  countryCode: string
  
  /** Address (optional) */
  address?: Address
}

/**
 * PaymentMethod
 */
interface PaymentMethod {
  /** Payment type */
  type: 'card' | 'pay_later' | 'wallet'
  
  /** Stripe payment method ID (if card) */
  stripePaymentMethodId?: string
  
  /** Billing address */
  billingAddress?: Address
}

/**
 * BookingConfirmation
 */
interface BookingConfirmation {
  /** Was booking successful? */
  success: boolean
  
  /** Booking reference */
  bookingReference: string
  
  /** Provider confirmation number */
  providerReference: string
  
  /** Booking details */
  booking: {
    /** Booking ID in our system */
    id: string
    
    /** Status */
    status: BookingStatus
    
    /** Category */
    category: 'flights' | 'hotels' | 'cars' | 'experiences' | 'packages'
    
    /** Booked item */
    item: UnifiedFlight | UnifiedHotel | UnifiedCarRental | UnifiedExperience | UnifiedPackage
    
    /** Total paid */
    totalPaid: UnifiedPrice
    
    /** Payment status */
    paymentStatus: PaymentStatus
    
    /** Travelers */
    travelers: TravelerDetails[]
    
    /** Contact */
    contact: ContactInfo
    
    /** Created at */
    createdAt: string
  }
  
  /** Confirmation documents */
  documents?: {
    type: 'eticket' | 'voucher' | 'confirmation'
    url: string
  }[]
  
  /** Next steps */
  nextSteps?: string[]
  
  /** Warnings */
  warnings?: string[]
}

/**
 * BookingStatus
 */
enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  TICKETED = 'ticketed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

/**
 * PaymentStatus
 */
enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  DISPUTED = 'disputed'
}
```

---

## Provider Mapping Specifications

### Amadeus Flight Mapping

```typescript
/**
 * Amadeus Flight Offer → UnifiedFlight
 * 
 * Amadeus returns complex nested structure with dictionaries.
 * This maps it to our unified format.
 */
function mapAmadeusFlightToUnified(
  offer: AmadeusFlightOffer,
  dictionaries: AmadeusDictionaries
): UnifiedFlight {
  
  // Map slices (itineraries in Amadeus)
  const slices: FlightSlice[] = offer.itineraries.map((itinerary, index) => {
    const segments = itinerary.segments.map(seg => mapAmadeusSegment(seg, dictionaries))
    
    return {
      id: `${offer.id}-slice-${index}`,
      origin: {
        code: itinerary.segments[0].departure.iataCode,
        name: dictionaries.locations[itinerary.segments[0].departure.iataCode]?.name || '',
        city: dictionaries.locations[itinerary.segments[0].departure.iataCode]?.cityCode || '',
        country: '', // Look up separately
        countryCode: '',
        timezone: ''
      },
      destination: {
        code: itinerary.segments[itinerary.segments.length - 1].arrival.iataCode,
        name: dictionaries.locations[itinerary.segments[itinerary.segments.length - 1].arrival.iataCode]?.name || '',
        city: dictionaries.locations[itinerary.segments[itinerary.segments.length - 1].arrival.iataCode]?.cityCode || '',
        country: '',
        countryCode: '',
        timezone: ''
      },
      departureAt: itinerary.segments[0].departure.at,
      arrivalAt: itinerary.segments[itinerary.segments.length - 1].arrival.at,
      durationMinutes: parseDuration(itinerary.duration),
      stops: itinerary.segments.length - 1,
      segments,
      layovers: calculateLayovers(itinerary.segments)
    }
  })
  
  // Map pricing
  const price: UnifiedPrice = {
    amount: parseFloat(offer.price.total),
    currency: offer.price.currency,
    formatted: formatPrice(parseFloat(offer.price.total), offer.price.currency),
    breakdown: {
      base: parseFloat(offer.price.base),
      taxes: offer.price.fees?.reduce((sum, f) => sum + parseFloat(f.amount), 0) || 0,
      fees: 0
    }
  }
  
  // Map traveler pricing
  const pricePerTraveler: TravelerPrice[] = offer.travelerPricings.map(tp => ({
    travelerType: mapTravelerType(tp.travelerType),
    count: 1,
    pricePerTraveler: {
      amount: parseFloat(tp.price.total),
      currency: tp.price.currency,
      formatted: formatPrice(parseFloat(tp.price.total), tp.price.currency)
    },
    totalPrice: {
      amount: parseFloat(tp.price.total),
      currency: tp.price.currency,
      formatted: formatPrice(parseFloat(tp.price.total), tp.price.currency)
    }
  }))
  
  // Map baggage
  const baggage = mapAmadeusBaggage(offer.travelerPricings[0]?.fareDetailsBySegment)
  
  // Build unified flight
  return {
    id: `amadeus-${offer.id}`,
    providerOfferId: offer.id,
    provider: {
      code: 'amadeus',
      name: 'Amadeus',
      retrievedAt: new Date().toISOString()
    },
    type: 'flight',
    tripType: offer.itineraries.length === 1 ? 'one_way' : 'round_trip',
    slices,
    totalStops: slices.reduce((sum, s) => sum + s.stops, 0),
    totalDurationMinutes: slices.reduce((sum, s) => sum + s.durationMinutes, 0),
    price,
    pricePerTraveler,
    fareType: offer.pricingOptions?.fareType?.[0] || undefined,
    baggage,
    policies: {
      cancellation: {
        allowed: !offer.pricingOptions?.includedCheckedBagsOnly,
        refundType: offer.pricingOptions?.refundableFare ? 'full' : 'none'
      },
      change: {
        allowed: true
      }
    },
    isRefundable: offer.pricingOptions?.refundableFare || false,
    isChangeable: true,
    seatsRemaining: offer.numberOfBookableSeats,
    isLivePrice: true,
    retrievedAt: new Date().toISOString()
  }
}

function mapAmadeusSegment(
  seg: AmadeusSegment,
  dictionaries: AmadeusDictionaries
): FlightSegment {
  
  return {
    id: seg.id,
    marketingCarrier: {
      code: seg.carrierCode,
      name: dictionaries.carriers[seg.carrierCode] || seg.carrierCode
    },
    operatingCarrier: seg.operating ? {
      code: seg.operating.carrierCode,
      name: dictionaries.carriers[seg.operating.carrierCode] || seg.operating.carrierCode
    } : undefined,
    flightNumber: `${seg.carrierCode}${seg.number}`,
    aircraft: seg.aircraft ? {
      code: seg.aircraft.code,
      name: dictionaries.aircraft[seg.aircraft.code] || seg.aircraft.code
    } : undefined,
    origin: {
      code: seg.departure.iataCode,
      name: dictionaries.locations[seg.departure.iataCode]?.name || '',
      city: dictionaries.locations[seg.departure.iataCode]?.cityCode || '',
      country: '',
      countryCode: '',
      terminal: seg.departure.terminal,
      timezone: ''
    },
    destination: {
      code: seg.arrival.iataCode,
      name: dictionaries.locations[seg.arrival.iataCode]?.name || '',
      city: dictionaries.locations[seg.arrival.iataCode]?.cityCode || '',
      country: '',
      countryCode: '',
      terminal: seg.arrival.terminal,
      timezone: ''
    },
    departureAt: seg.departure.at,
    arrivalAt: seg.arrival.at,
    durationMinutes: parseDuration(seg.duration),
    cabinClass: CabinClass.ECONOMY, // Default, updated from travelerPricings
    bookingClass: undefined
  }
}
```

### Kiwi Flight Mapping

```typescript
/**
 * Kiwi.com Flight → UnifiedFlight
 * 
 * Kiwi has a flatter structure but different field names.
 */
function mapKiwiFlightToUnified(flight: KiwiFlight): UnifiedFlight {
  
  // Map routes to slices
  const slices: FlightSlice[] = []
  let currentSlice: FlightSegment[] = []
  let sliceIndex = 0
  
  for (const route of flight.route) {
    currentSlice.push({
      id: route.id,
      marketingCarrier: {
        code: route.airline,
        name: route.airline // Kiwi doesn't provide airline names
      },
      operatingCarrier: route.operating_carrier ? {
        code: route.operating_carrier,
        name: route.operating_carrier
      } : undefined,
      flightNumber: `${route.airline}${route.flight_no}`,
      origin: {
        code: route.flyFrom,
        name: route.cityFrom,
        city: route.cityFrom,
        country: '', // Look up separately
        countryCode: route.countryFrom?.code || '',
        timezone: ''
      },
      destination: {
        code: route.flyTo,
        name: route.cityTo,
        city: route.cityTo,
        country: '',
        countryCode: route.countryTo?.code || '',
        timezone: ''
      },
      departureAt: new Date(route.dTime * 1000).toISOString(),
      arrivalAt: new Date(route.aTime * 1000).toISOString(),
      durationMinutes: Math.round((route.aTime - route.dTime) / 60),
      cabinClass: CabinClass.ECONOMY
    })
    
    // Check if this is the end of a slice (return = 1 means outbound)
    if (route.return !== currentSlice[0]?.return || 
        route === flight.route[flight.route.length - 1]) {
      
      const firstSeg = currentSlice[0]
      const lastSeg = currentSlice[currentSlice.length - 1]
      
      slices.push({
        id: `kiwi-slice-${sliceIndex}`,
        origin: firstSeg.origin,
        destination: lastSeg.destination,
        departureAt: firstSeg.departureAt,
        arrivalAt: lastSeg.arrivalAt,
        durationMinutes: currentSlice.reduce((sum, s) => sum + s.durationMinutes, 0),
        stops: currentSlice.length - 1,
        segments: currentSlice,
        layovers: calculateLayoversFromSegments(currentSlice)
      })
      
      currentSlice = []
      sliceIndex++
    }
  }
  
  // Price
  const price: UnifiedPrice = {
    amount: flight.price,
    currency: flight.currency || 'EUR',
    formatted: formatPrice(flight.price, flight.currency || 'EUR'),
    breakdown: {
      base: flight.price,
      taxes: 0,
      fees: 0
    }
  }
  
  return {
    id: `kiwi-${flight.id}`,
    providerOfferId: flight.id,
    provider: {
      code: 'kiwi',
      name: 'Kiwi.com',
      retrievedAt: new Date().toISOString()
    },
    type: 'flight',
    tripType: slices.length === 1 ? 'one_way' : 'round_trip',
    slices,
    totalStops: slices.reduce((sum, s) => sum + s.stops, 0),
    totalDurationMinutes: slices.reduce((sum, s) => sum + s.durationMinutes, 0),
    price,
    pricePerTraveler: [{
      travelerType: 'adult',
      count: 1,
      pricePerTraveler: price,
      totalPrice: price
    }],
    baggage: {
      cabin: {
        included: flight.bags_price?.[0] === 0,
        quantity: 1
      },
      checked: {
        included: flight.bags_price?.['1'] === 0,
        quantity: 0,
        addOnPrice: flight.bags_price?.['1'] ? {
          amount: flight.bags_price['1'],
          currency: flight.currency || 'EUR',
          formatted: formatPrice(flight.bags_price['1'], flight.currency || 'EUR')
        } : undefined
      }
    },
    policies: {
      cancellation: {
        allowed: true,
        refundType: 'credit'
      },
      change: {
        allowed: true
      }
    },
    isRefundable: false,
    isChangeable: true,
    isLivePrice: true,
    retrievedAt: new Date().toISOString(),
    deepLink: flight.deep_link
  }
}
```

### Hotelbeds Hotel Mapping

```typescript
/**
 * Hotelbeds Hotel → UnifiedHotel
 */
function mapHotelbedsToUnified(
  hotel: HotelbedsHotel,
  content: HotelbedsContent
): UnifiedHotel {
  
  // Map rooms
  const rooms: RoomOffer[] = hotel.rooms.map(room => ({
    id: `hotelbeds-${hotel.code}-${room.code}`,
    providerOfferId: room.rateKey,
    name: room.name,
    roomType: mapRoomType(room.code),
    bedConfiguration: parseBedConfig(room.name),
    maxOccupancy: {
      adults: room.adults,
      children: room.children,
      total: room.adults + room.children
    },
    amenities: [], // Not provided by Hotelbeds in search
    price: {
      amount: parseFloat(room.rates[0].net),
      currency: hotel.currency,
      formatted: formatPrice(parseFloat(room.rates[0].net), hotel.currency)
    },
    pricePerNight: {
      amount: parseFloat(room.rates[0].net) / room.rates[0].nights,
      currency: hotel.currency,
      formatted: formatPrice(parseFloat(room.rates[0].net) / room.rates[0].nights, hotel.currency)
    },
    inclusions: parseInclusions(room.rates[0].boardName),
    boardType: mapBoardType(room.rates[0].boardCode),
    cancellationPolicy: {
      freeCancellation: room.rates[0].cancellationPolicies?.some(p => p.amount === '0.00') || false,
      freeCancellationDeadline: room.rates[0].cancellationPolicies?.[0]?.from,
      rules: room.rates[0].cancellationPolicies?.map(p => ({
        from: p.from,
        penaltyType: 'fixed' as const,
        penaltyValue: parseFloat(p.amount),
        penaltyAmount: {
          amount: parseFloat(p.amount),
          currency: hotel.currency,
          formatted: formatPrice(parseFloat(p.amount), hotel.currency)
        }
      })) || [],
      summary: generateCancellationSummary(room.rates[0].cancellationPolicies)
    },
    isRefundable: room.rates[0].rateClass !== 'NRF',
    paymentTerms: {
      type: room.rates[0].paymentType === 'AT_WEB' ? 'pay_now' : 'pay_at_property'
    },
    roomsRemaining: room.rates[0].allotment
  }))
  
  // Find lowest price
  const lowestPrice = rooms.reduce((lowest, room) => 
    room.price.amount < lowest.amount ? room.price : lowest, 
    rooms[0].price
  )
  
  // Map content
  const hotelContent = content.hotels?.find(h => h.code === hotel.code)
  
  return {
    id: `hotelbeds-${hotel.code}`,
    providerPropertyId: hotel.code,
    provider: {
      code: 'hotelbeds',
      name: 'Hotelbeds',
      retrievedAt: new Date().toISOString()
    },
    type: 'hotel',
    name: hotel.name,
    description: hotelContent?.description?.content,
    propertyType: mapPropertyType(hotel.categoryCode),
    starRating: parseInt(hotel.categoryCode?.replace('EST', '')) || undefined,
    location: {
      address: {
        line1: hotelContent?.address?.content || '',
        city: hotelContent?.city?.content || hotel.destinationName,
        country: hotelContent?.country?.description?.content || '',
        countryCode: hotelContent?.countryCode || '',
        postalCode: hotelContent?.postalCode,
        formatted: hotelContent?.address?.content || ''
      },
      coordinates: {
        latitude: hotel.latitude,
        longitude: hotel.longitude
      },
      city: hotel.destinationName,
      country: '',
      countryCode: ''
    },
    images: hotelContent?.images?.map(img => ({
      url: `https://photos.hotelbeds.com/giata/${img.path}`,
      type: img.type?.description?.content,
      order: img.order
    })) || [],
    heroImage: hotelContent?.images?.[0] 
      ? `https://photos.hotelbeds.com/giata/${hotelContent.images[0].path}` 
      : undefined,
    amenities: hotelContent?.facilities?.map(f => ({
      id: f.facilityCode.toString(),
      name: f.description?.content || '',
      category: f.facilityGroupCode.toString()
    })) || [],
    keyAmenities: extractKeyAmenities(hotelContent?.facilities),
    rooms,
    lowestPrice,
    retrievedAt: new Date().toISOString()
  }
}
```

---

## Database Schema Additions

### Unified Search Results Cache

```sql
CREATE TABLE search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cache key
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  
  -- Search parameters (for debugging)
  search_params JSONB NOT NULL,
  
  -- Results
  results JSONB NOT NULL,
  result_count INTEGER NOT NULL,
  providers_used TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Stats
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ
);

CREATE INDEX idx_search_cache_key ON search_cache(cache_key);
CREATE INDEX idx_search_cache_expires ON search_cache(expires_at);
```

### Unified Bookings Table

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Booking identity
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  provider_reference VARCHAR(100),
  provider_code VARCHAR(50) NOT NULL,
  
  -- Category
  category VARCHAR(50) NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  -- Offer details (snapshot at booking time)
  offer_snapshot JSONB NOT NULL,
  
  -- Travelers
  travelers JSONB NOT NULL,
  
  -- Contact
  contact JSONB NOT NULL,
  
  -- Pricing
  currency VARCHAR(3) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  
  -- Payment
  stripe_payment_intent_id VARCHAR(100),
  stripe_charge_id VARCHAR(100),
  
  -- Policies (snapshot)
  cancellation_policy JSONB,
  
  -- Dates
  travel_start_date DATE,
  travel_end_date DATE,
  
  -- Trip association
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Documents
  documents JSONB DEFAULT '[]'
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_trip ON bookings(trip_id);
```

---

## Implementation Checklist

### Phase 1: Core Types
- [ ] Create all TypeScript interfaces in `src/types/unified/`
- [ ] Create enum definitions
- [ ] Create type guards and validators

### Phase 2: Price Utilities
- [ ] Create `formatPrice()` function
- [ ] Create currency conversion utilities
- [ ] Create price comparison functions

### Phase 3: Provider Adapters
- [ ] Create Amadeus adapter with mapping functions
- [ ] Create Kiwi adapter with mapping functions
- [ ] Create Hotelbeds adapter with mapping functions
- [ ] Create GetYourGuide adapter with mapping functions
- [ ] Create Cartrawler adapter with mapping functions

### Phase 4: Response Normalizer
- [ ] Create `ResponseNormalizer` class
- [ ] Implement `normalize(providerCode, category, data)`
- [ ] Add validation for normalized responses
- [ ] Handle missing/null fields gracefully

### Phase 5: Database
- [ ] Create `search_cache` table
- [ ] Create `bookings` table
- [ ] Add necessary indexes

### Phase 6: Testing
- [ ] Unit tests for each mapping function
- [ ] Integration tests with sample provider responses
- [ ] Validation tests for all types

---

**This Unified Data Model ensures Guidera speaks one language internally, regardless of how many providers you integrate. Add a new provider? Just write one adapter. The rest of the app never changes.**
