/**
 * AI GENERATION ENGINE - CONTEXT TYPES
 * 
 * Defines all types for the Context Engine that builds
 * comprehensive trip generation context for AI modules.
 */

// ============================================
// TRAVELER CONTEXT
// ============================================

export type AgeCategory = 'infant' | 'child' | 'teen' | 'adult' | 'senior';
export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
export type ReligiousObservance = 'none' | 'casual' | 'moderate' | 'strict';
export type TravelStyle = 'budget' | 'comfortable' | 'luxury' | 'ultra_luxury';
export type ActivityLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type PackingStyle = 'minimal' | 'normal' | 'overpacker';
export type PhotographyLevel = 'none' | 'phone_only' | 'hobbyist' | 'professional';
export type CrowdComfort = 'avoids' | 'tolerates' | 'enjoys';
export type FoodAdventurousness = 'conservative' | 'somewhat_adventurous' | 'very_adventurous' | 'will_try_anything';
export type SpiceTolerance = 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot';
export type BargainingComfort = 'none' | 'some' | 'comfortable' | 'expert';

export interface TravelerDemographics {
  age: number;
  ageCategory: AgeCategory;
  gender: Gender;
  nationality: string;
  countryOfResidence: string;
  languagesSpoken: string[];
  primaryLanguage: string;
}

export interface TravelerProfessional {
  profession: string | null;
  industry: string | null;
  travelingForWork: boolean;
  needsWorkEquipment: boolean;
  professionalItems: string[];
}

export interface TravelerCultural {
  religion: string | null;
  religiousObservance: ReligiousObservance;
  religiousItems: string[];
  culturalConsiderations: string[];
  dietaryFromReligion: string[];
}

export interface TravelerHealth {
  conditions: string[];
  allergies: string[];
  medications: string[];
  mobilityRestrictions: string[];
  requiresAccessibility: boolean;
  medicalEquipment: string[];
  bloodType: string | null;
}

export interface TravelerFoodPreferences {
  adventurousness: FoodAdventurousness;
  cuisinePreferences: string[];
  avoidFoods: string[];
  spiceTolerance: SpiceTolerance;
}

export interface TravelerPreferences {
  travelStyle: TravelStyle;
  accommodationPreference: string;
  foodPreferences: TravelerFoodPreferences;
  activityLevel: ActivityLevel;
  interestAreas: string[];
  packingStyle: PackingStyle;
  morningPerson: boolean;
  comfortWithCrowds: CrowdComfort;
  photography: PhotographyLevel;
}

export interface TravelerExperience {
  internationalTravelCount: number;
  hasVisitedDestination: boolean;
  previousVisitYear: number | null;
  countriesVisited: string[];
  frequentTraveler: boolean;
  hasGlobalEntry: boolean;
  hasTSAPreCheck: boolean;
  languageProficiency: Record<string, string>;
}

export interface TravelerDocuments {
  passport: {
    hasPassport: boolean;
    passportCountry: string;
    expirationDate: string | null;
    monthsUntilExpiry: number | null;
    needsRenewal: boolean;
  };
  visa: {
    hasValidVisa: boolean;
    visaType: string | null;
    visaExpiration: string | null;
  };
  driversLicense: {
    hasLicense: boolean;
    licenseCountry: string;
    hasInternationalPermit: boolean;
  };
  insurance: {
    hasTravelInsurance: boolean;
    insuranceProvider: string | null;
    policyNumber: string | null;
    coverageType: string | null;
  };
  storedDocuments: string[];
}

export interface TravelerFinancial {
  primaryPaymentMethod: string;
  creditCards: Array<{ type: string; last4?: string; noForeignFee?: boolean }>;
  hasNoForeignTransactionFeeCard: boolean;
  preferredCurrency: string;
  comfortWithBargaining: BargainingComfort;
}

export interface TravelerEmergency {
  contacts: Array<{
    name: string;
    phone: string;
    email?: string;
    relationship: string;
  }>;
  bloodType: string | null;
  organDonor: boolean;
}

export interface TravelerContext {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  isOwner: boolean;
  role: string;
  
  demographics: TravelerDemographics;
  professional: TravelerProfessional;
  cultural: TravelerCultural;
  health: TravelerHealth;
  preferences: TravelerPreferences;
  experience: TravelerExperience;
  documents: TravelerDocuments;
  financial: TravelerFinancial;
  emergency: TravelerEmergency;
}

// ============================================
// TRIP CONTEXT
// ============================================

export type TripType = 'leisure' | 'business' | 'bleisure' | 'family' | 'honeymoon' | 'adventure' | 'wellness' | 'cultural';
export type TripPurpose = 'vacation' | 'wedding' | 'anniversary' | 'birthday' | 'graduation' | 'reunion' | 'conference' | 'other';
export type PacePreference = 'relaxed' | 'moderate' | 'packed';
export type TravelerComposition = 'solo' | 'couple' | 'family_young_kids' | 'family_teens' | 'friends' | 'group' | 'multi_generational';
export type RelationshipDynamic = 'solo' | 'romantic' | 'family' | 'friends' | 'colleagues' | 'mixed';
export type BudgetTier = 'budget' | 'mid_range' | 'luxury' | 'ultra_luxury';

export interface TripDestination {
  code: string;
  name: string;
  country: string;
  countryCode?: string;
}

export interface TripDetails {
  id: string;
  name: string;
  primaryDestination: TripDestination;
  additionalDestinations: TripDestination[];
  isMultiCity: boolean;
  startDate: string;
  endDate: string;
  durationDays: number;
  durationNights: number;
  tripType: TripType;
  purpose: TripPurpose | null;
  pacePreference: PacePreference;
  composition: TravelerComposition;
  relationshipDynamic: RelationshipDynamic;
  budgetTier: BudgetTier;
  budgetTotal: number | null;
  budgetCurrency: string;
  budgetPerDay: number | null;
}

// ============================================
// BOOKING CONTEXT
// ============================================

export interface FlightBookingContext {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departureAirport: string;
  departureAirportCode: string;
  arrivalAirport: string;
  arrivalAirportCode: string;
  departureDateTime: string;
  arrivalDateTime: string;
  cabinClass: string;
  baggageAllowance: {
    carryOn: { weight: number; unit: string };
    checked: { weight: number; pieces: number };
  };
  seatSelection: string | null;
}

export interface HotelBookingContext {
  id: string;
  name: string;
  starRating: number;
  address: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  amenities: string[];
  breakfastIncluded: boolean;
  cancellationPolicy: string;
}

export interface CarBookingContext {
  id: string;
  company: string;
  vehicleType: string;
  pickupLocation: string;
  pickupDateTime: string;
  dropoffLocation: string;
  dropoffDateTime: string;
  insuranceIncluded: boolean;
}

export interface ExperienceBookingContext {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  requirements: string[];
  whatToBring: string[];
}

export interface BookingsContext {
  flights: FlightBookingContext[];
  hotels: HotelBookingContext[];
  cars: CarBookingContext[];
  experiences: ExperienceBookingContext[];
  hasFlights: boolean;
  hasHotels: boolean;
  hasCars: boolean;
  hasExperiences: boolean;
  totalBookings: number;
}

// ============================================
// DESTINATION INTELLIGENCE
// ============================================

export interface DestinationBasic {
  code: string;
  name: string;
  country: string;
  countryCode: string;
  continent: string;
  timezone: string;
}

export interface DestinationGeography {
  latitude: number;
  longitude: number;
  hemisphere: 'northern' | 'southern';
  climateType: string;
  elevation: number;
  coastal: boolean;
}

export interface DestinationCulture {
  primaryLanguage: string;
  otherLanguages: string[];
  greetingStyle: string;
  dressCode: string;
  religiousSensitivities: string[];
  tippingCulture: string;
}

export interface DestinationPractical {
  currency: { code: string; symbol: string; name: string };
  powerPlug: string[];
  voltage: number;
  drivingSide: 'left' | 'right';
  tapWaterSafe: boolean;
  emergencyNumber: string;
}

export interface DestinationIntelligence {
  basic: DestinationBasic;
  geography: DestinationGeography;
  culture: DestinationCulture;
  practical: DestinationPractical;
}

// ============================================
// REAL-TIME INTELLIGENCE
// ============================================

export interface WeatherForecast {
  location: string;
  forecastPeriod: { start: string; end: string };
  summary: {
    overallCondition: string;
    temperatureRange: { min: number; max: number; unit: string };
    rainDays: number;
    sunnyDays: number;
    humidity: string;
  };
  dailyForecast: Array<{
    date: string;
    dayOfWeek: string;
    condition: string;
    tempHigh: number;
    tempLow: number;
    humidity: number;
    uvIndex: number;
    precipitationChance: number;
  }>;
  packingImplications: {
    needsSunProtection: boolean;
    needsRainGear: boolean;
    needsWarmClothing: boolean;
    needsLightClothing: boolean;
    layersRecommended: boolean;
    specificRecommendations: string[];
  };
}

export interface SafetyIntelligence {
  overallScore: number;
  overallLevel: 'safe' | 'moderate_caution' | 'exercise_caution' | 'high_risk' | 'dangerous';
  breakdown: {
    crime: number;
    terrorism: number;
    naturalDisasters: number;
    healthRisks: number;
    infrastructure: number;
    politicalStability: number;
  };
  emergencyNumbers: {
    general: string;
    police: string;
    ambulance: string;
    fire: string;
    touristPolice: string | null;
  };
  commonScams: string[];
  areasToAvoid: string[];
}

export interface FinancialIntelligence {
  exchangeRate: {
    baseCurrency: string;
    destinationCurrency: string;
    rate: number;
    trend: 'strengthening' | 'stable' | 'weakening';
  };
  paymentLandscape: {
    primaryMethod: 'cash' | 'card' | 'mobile';
    cashImportance: 'essential' | 'recommended' | 'optional';
    cardAcceptance: Record<string, string>;
    contactlessAvailable: boolean;
  };
  tippingGuidance: {
    culture: 'not_expected' | 'appreciated' | 'expected' | 'essential';
    byService: Record<string, { amount: string; notes: string }>;
  };
  bargainingGuidance: {
    isCommon: boolean;
    whereExpected: string[];
    startingOffer: string;
  };
}

export interface RegulationIntelligence {
  visaRequired: boolean;
  visaType: string | null;
  visaDetails: {
    maxStay: number;
    cost: { amount: number; currency: string } | null;
    processingTime: string;
    requirements: string[];
  } | null;
  passportRequirements: {
    validityRequired: string;
    blankPagesRequired: number;
  };
  customsRules: {
    dutyFreeAllowances: Record<string, string>;
    prohibitedItems: string[];
    currencyDeclarationThreshold: { amount: number; currency: string } | null;
  };
  healthRequirements: {
    requiredVaccinations: string[];
    recommendedVaccinations: string[];
    malariaRisk: boolean;
  };
}

export interface LocalEvent {
  name: string;
  type: string;
  date: string;
  description: string;
  impact: string;
}

export interface RealtimeIntelligence {
  weather: WeatherForecast | null;
  safety: SafetyIntelligence | null;
  events: LocalEvent[];
  financial: FinancialIntelligence | null;
  regulations: RegulationIntelligence | null;
}

// ============================================
// COMPLETE GENERATION CONTEXT
// ============================================

export interface GenerationMetadata {
  requestedModules: string[];
  generatedAt: string;
  contextVersion: string;
  cacheHints: Record<string, string>;
}

export interface TripGenerationContext {
  // Travelers
  travelers: TravelerContext[];
  primaryTraveler: TravelerContext;
  travelerCount: number;
  hasChildren: boolean;
  hasInfants: boolean;
  hasElderly: boolean;
  
  // Trip details
  trip: TripDetails;
  
  // Bookings
  bookings: BookingsContext;
  
  // Destination intelligence
  destination: DestinationIntelligence;
  
  // Real-time data
  realtime: RealtimeIntelligence;
  
  // Generation metadata
  generation: GenerationMetadata;
}

// ============================================
// MODULE TYPES
// ============================================

export type ModuleType = 
  | 'packing'
  | 'dos_donts'
  | 'safety'
  | 'language'
  | 'budget'
  | 'itinerary'
  | 'cultural'
  | 'compensation'
  | 'documents';

export interface ModuleGenerationRequest {
  tripId: string;
  moduleType: ModuleType;
  forceRefresh?: boolean;
  travelerIds?: string[];
}

export interface ModuleGenerationResult<T = unknown> {
  success: boolean;
  moduleType: ModuleType;
  data: T | null;
  cached: boolean;
  cacheKey?: string;
  generatedAt: string;
  error?: string;
}

// ============================================
// CACHE TYPES
// ============================================

export type CacheTier = 'destination_base' | 'context_specific' | 'personal';

export interface CacheEntry {
  id: string;
  cacheKey: string;
  moduleType: ModuleType;
  cacheTier: CacheTier;
  contextHash: string;
  content: unknown;
  ttlDays: number;
  createdAt: string;
  expiresAt: string;
  accessCount: number;
}

export interface CacheStrategy {
  tier: CacheTier;
  ttlDays: number;
  keyComponents: string[];
}
