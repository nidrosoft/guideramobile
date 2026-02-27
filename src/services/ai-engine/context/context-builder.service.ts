/**
 * CONTEXT BUILDER SERVICE
 * 
 * Builds comprehensive generation context for AI modules by aggregating
 * trip data, traveler profiles, bookings, and real-time intelligence.
 */

import { supabase } from '@/lib/supabase/client';
import {
  TripGenerationContext,
  TravelerContext,
  TravelerDemographics,
  TravelerProfessional,
  TravelerCultural,
  TravelerHealth,
  TravelerPreferences,
  TravelerExperience,
  TravelerDocuments,
  TravelerFinancial,
  TravelerEmergency,
  TripDetails,
  BookingsContext,
  DestinationIntelligence,
  RealtimeIntelligence,
  AgeCategory,
  TravelerComposition,
  RelationshipDynamic,
  BudgetTier,
} from '../types';

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateAgeCategory(age: number): AgeCategory {
  if (age < 2) return 'infant';
  if (age < 13) return 'child';
  if (age < 18) return 'teen';
  if (age < 65) return 'adult';
  return 'senior';
}

function monthsUntil(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const months = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
  return Math.max(0, months);
}

function inferBudgetTier(budgetPerDay: number | null, spendingStyle?: string): BudgetTier {
  if (spendingStyle === 'luxury') return 'luxury';
  if (spendingStyle === 'budget') return 'budget';
  if (!budgetPerDay) return 'mid_range';
  if (budgetPerDay < 100) return 'budget';
  if (budgetPerDay < 300) return 'mid_range';
  if (budgetPerDay < 600) return 'luxury';
  return 'ultra_luxury';
}

function inferComposition(adults: number, children: number, infants: number, companionType?: string): TravelerComposition {
  if (companionType === 'solo' || (adults === 1 && children === 0 && infants === 0)) return 'solo';
  if (companionType === 'couple' || (adults === 2 && children === 0 && infants === 0)) return 'couple';
  if (children > 0 || infants > 0) {
    if (children > 0 && children <= 12) return 'family_young_kids';
    return 'family_teens';
  }
  if (companionType === 'friends') return 'friends';
  if (companionType === 'group' || adults > 4) return 'group';
  return 'couple';
}

function inferRelationship(travelers: TravelerContext[]): RelationshipDynamic {
  if (travelers.length === 1) return 'solo';
  if (travelers.length === 2) {
    const hasChildren = travelers.some(t => t.demographics.ageCategory === 'child' || t.demographics.ageCategory === 'infant');
    if (hasChildren) return 'family';
    return 'romantic';
  }
  const hasChildren = travelers.some(t => t.demographics.ageCategory === 'child' || t.demographics.ageCategory === 'infant');
  if (hasChildren) return 'family';
  return 'friends';
}

// ============================================
// PROFESSIONAL ITEMS DERIVATION
// ============================================

const PROFESSION_ITEMS_MAP: Record<string, string[]> = {
  'photographer': ['Camera body', 'Lenses', 'Tripod', 'Memory cards', 'Lens cleaning kit', 'Laptop', 'External hard drive', 'Camera bag', 'Extra batteries', 'Charger'],
  'videographer': ['Camera', 'Gimbal', 'Microphone', 'Memory cards', 'Laptop', 'Tripod', 'ND filters', 'Extra batteries', 'Charger', 'Hard drives'],
  'musician': ['Instrument', 'Sheet music/tablet', 'Instrument accessories', 'Tuner', 'Metronome'],
  'writer': ['Laptop', 'Notebook', 'Pens', 'Portable charger', 'Noise-canceling headphones'],
  'journalist': ['Laptop', 'Voice recorder', 'Camera', 'Notebook', 'Press credentials', 'VPN subscription'],
  'doctor': ['Medical license copy', 'Prescription pad', 'Stethoscope', 'Medical reference app', 'Basic medical kit'],
  'nurse': ['Nursing license copy', 'Basic medical supplies', 'Comfortable shoes'],
  'lawyer': ['Laptop', 'Legal documents (encrypted)', 'Business cards', 'Professional attire'],
  'consultant': ['Laptop', 'Presentation clicker', 'Business cards', 'Professional attire', 'Portfolio'],
  'software_engineer': ['Laptop', 'Charger', 'Mouse', 'Headphones', 'VPN setup'],
  'developer': ['Laptop', 'Charger', 'Mouse', 'Coding peripherals'],
  'designer': ['Laptop', 'Design tablet', 'Stylus', 'Portfolio'],
  'teacher': ['Lesson materials', 'Laptop/tablet', 'Educational supplies'],
  'chef': ['Knife kit', 'Chef coat', 'Recipe notes'],
  'athlete': ['Training gear', 'Equipment', 'Supplements', 'Recovery tools'],
};

function deriveProfessionalItems(profession: string | null): string[] {
  if (!profession) return [];
  const normalized = profession.toLowerCase().replace(/\s+/g, '_');
  
  if (PROFESSION_ITEMS_MAP[normalized]) {
    return PROFESSION_ITEMS_MAP[normalized];
  }
  
  for (const [key, items] of Object.entries(PROFESSION_ITEMS_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return items;
    }
  }
  
  return ['Laptop', 'Business cards', 'Professional attire'];
}

// ============================================
// RELIGIOUS ITEMS DERIVATION
// ============================================

const RELIGIOUS_ITEMS_MAP: Record<string, Record<string, string[]>> = {
  'muslim': {
    'strict': ['Prayer mat', 'Qibla compass/app', 'Prayer beads', 'Quran or Quran app', 'Halal snacks', 'Modest clothing', 'Modest swimwear'],
    'moderate': ['Prayer mat (compact)', 'Qibla compass app', 'Halal snacks', 'Modest clothing'],
    'casual': ['Qibla direction app', 'Modest clothing for mosque visits'],
  },
  'jewish': {
    'strict': ['Kosher snacks', 'Kippah', 'Tallit', 'Tefillin', 'Siddur', 'Shabbat candles', 'Kosher restaurant list'],
    'moderate': ['Kippah', 'Kosher snacks', 'Siddur app', 'Kosher restaurant list'],
    'casual': ['Kippah (for synagogue visits)', 'Kosher-friendly restaurant list'],
  },
  'christian': {
    'strict': ['Bible', 'Rosary', 'Prayer book', 'Modest church attire'],
    'moderate': ['Bible or Bible app', 'Modest attire for church visits'],
    'casual': ['Bible app', 'Appropriate church attire'],
  },
  'hindu': {
    'strict': ['Puja items', 'Incense sticks', 'Bhagavad Gita', 'Vegetarian snacks', 'Temple-appropriate clothing'],
    'moderate': ['Small deity idol', 'Temple-appropriate clothing', 'Vegetarian snacks'],
    'casual': ['Temple-appropriate clothing'],
  },
  'buddhist': {
    'strict': ['Meditation cushion', 'Mala beads', 'Buddhist texts', 'Temple-appropriate clothing'],
    'moderate': ['Mala beads', 'Meditation app', 'Temple-appropriate clothing'],
    'casual': ['Meditation app', 'Temple-appropriate clothing'],
  },
};

function deriveReligiousItems(religion: string | null, observance: string | null): string[] {
  if (!religion || religion.toLowerCase() === 'none') return [];
  const level = observance || 'moderate';
  const normalized = religion.toLowerCase();
  
  if (RELIGIOUS_ITEMS_MAP[normalized]) {
    return RELIGIOUS_ITEMS_MAP[normalized][level] || RELIGIOUS_ITEMS_MAP[normalized]['moderate'] || [];
  }
  
  return [];
}

const DIETARY_FROM_RELIGION: Record<string, string[]> = {
  'muslim': ['Halal only', 'No pork', 'No alcohol'],
  'jewish': ['Kosher only', 'No pork', 'No shellfish'],
  'hindu': ['Vegetarian (often)', 'No beef'],
  'buddhist': ['Vegetarian (often)'],
  'jain': ['Strict vegetarian', 'No root vegetables'],
};

function deriveDietaryFromReligion(religion: string | null): string[] {
  if (!religion) return [];
  return DIETARY_FROM_RELIGION[religion.toLowerCase()] || [];
}

// ============================================
// CONTEXT BUILDER SERVICE
// ============================================

class ContextBuilderService {
  /**
   * Build complete generation context for a trip
   */
  async buildContext(tripId: string): Promise<TripGenerationContext> {
    // Step 1: Get core trip data
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    // Step 2: Get travelers
    const { data: travelers } = await supabase
      .from('trip_travelers')
      .select('*')
      .eq('trip_id', tripId);

    // Step 3: Get bookings
    const { data: bookings } = await supabase
      .from('trip_bookings')
      .select('*, bookings(*)')
      .eq('trip_id', tripId);

    // Step 4: Enrich traveler profiles
    const enrichedTravelers = await Promise.all(
      (travelers || []).map(t => this.enrichTravelerContext(t))
    );

    // If no travelers, create a default from trip owner
    if (enrichedTravelers.length === 0) {
      const ownerContext = await this.createOwnerTravelerContext(trip.user_id || trip.owner_id);
      if (ownerContext) {
        enrichedTravelers.push(ownerContext);
      }
    }

    const primaryTraveler = enrichedTravelers.find(t => t.isOwner) || enrichedTravelers[0];

    // Step 5: Build destination intelligence
    const destinationIntel = await this.buildDestinationIntelligence(
      trip.destination?.code || trip.primary_destination_code,
      trip.destination?.country || trip.primary_destination_country
    );

    // Step 6: Build bookings context
    const bookingsContext = this.buildBookingsContext(bookings || []);

    // Step 7: Get real-time intelligence (placeholder - will be populated by external APIs)
    const realtimeIntel = await this.buildRealtimeIntelligence(
      trip.destination?.code || trip.primary_destination_code,
      trip.start_date,
      trip.end_date,
      primaryTraveler?.demographics.nationality
    );

    // Step 8: Calculate trip details
    const durationDays = this.calculateDuration(trip.start_date, trip.end_date);
    const budgetPerDay = trip.budget_total ? trip.budget_total / durationDays : null;

    // Step 9: Assemble complete context
    return {
      travelers: enrichedTravelers,
      primaryTraveler: primaryTraveler!,
      travelerCount: enrichedTravelers.length,
      hasChildren: enrichedTravelers.some(t => t.demographics.ageCategory === 'child'),
      hasInfants: enrichedTravelers.some(t => t.demographics.ageCategory === 'infant'),
      hasElderly: enrichedTravelers.some(t => t.demographics.ageCategory === 'senior'),

      trip: {
        id: trip.id,
        name: trip.title || trip.name || 'My Trip',
        primaryDestination: {
          code: trip.destination?.code || trip.primary_destination_code || '',
          name: trip.destination?.name || trip.primary_destination_name || '',
          country: trip.destination?.country || trip.primary_destination_country || '',
        },
        additionalDestinations: trip.additional_destinations || [],
        isMultiCity: (trip.additional_destinations?.length || 0) > 0,
        startDate: trip.start_date,
        endDate: trip.end_date,
        durationDays,
        durationNights: Math.max(0, durationDays - 1),
        tripType: trip.trip_type || 'leisure',
        purpose: trip.purpose || null,
        pacePreference: trip.pace_preference || 'moderate',
        composition: inferComposition(
          trip.adults || 1,
          trip.children || 0,
          trip.infants || 0,
          trip.traveler_composition
        ),
        relationshipDynamic: inferRelationship(enrichedTravelers),
        budgetTier: inferBudgetTier(budgetPerDay, trip.budget_level),
        budgetTotal: trip.budget_total,
        budgetCurrency: trip.budget_currency || 'USD',
        budgetPerDay,
      },

      bookings: bookingsContext,
      destination: destinationIntel,
      realtime: realtimeIntel,

      generation: {
        requestedModules: ['all'],
        generatedAt: new Date().toISOString(),
        contextVersion: '2.0',
        cacheHints: this.generateCacheHints(trip, enrichedTravelers),
      },
    };
  }

  /**
   * Enrich traveler with derived data
   */
  private async enrichTravelerContext(traveler: any): Promise<TravelerContext> {
    let user: any = null;

    if (traveler.user_id) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', traveler.user_id)
        .single();
      user = data;
    }

    const age = traveler.age_at_travel || this.calculateAge(user?.date_of_birth);
    const ageCategory = calculateAgeCategory(age);

    const demographics: TravelerDemographics = {
      age,
      ageCategory,
      gender: traveler.gender || user?.gender || 'prefer_not_to_say',
      nationality: traveler.nationality || user?.nationality || 'US',
      countryOfResidence: user?.country_of_residence || user?.country || 'US',
      languagesSpoken: user?.languages_spoken || ['en'],
      primaryLanguage: user?.primary_language || 'en',
    };

    const professional: TravelerProfessional = {
      profession: user?.profession || null,
      industry: user?.industry || null,
      travelingForWork: false,
      needsWorkEquipment: !!user?.profession,
      professionalItems: deriveProfessionalItems(user?.profession),
    };

    const cultural: TravelerCultural = {
      religion: user?.religion || null,
      religiousObservance: user?.religious_observance || 'none',
      religiousItems: deriveReligiousItems(user?.religion, user?.religious_observance),
      culturalConsiderations: [],
      dietaryFromReligion: deriveDietaryFromReligion(user?.religion),
    };

    const health: TravelerHealth = {
      conditions: user?.medical_conditions || traveler.medical_conditions || [],
      allergies: user?.allergies || [],
      medications: user?.medications || [],
      mobilityRestrictions: [],
      requiresAccessibility: false,
      medicalEquipment: [],
      bloodType: user?.blood_type || null,
    };

    const preferences: TravelerPreferences = {
      travelStyle: user?.travel_style || 'comfortable',
      accommodationPreference: user?.accommodation_preference || 'hotel',
      foodPreferences: {
        adventurousness: user?.food_adventurousness || 'somewhat_adventurous',
        cuisinePreferences: user?.cuisine_preferences || [],
        avoidFoods: user?.avoid_foods || [],
        spiceTolerance: user?.spice_tolerance || 'medium',
      },
      activityLevel: user?.activity_level || 'moderate',
      interestAreas: user?.interests || [],
      packingStyle: user?.packing_style || 'normal',
      morningPerson: user?.morning_person ?? true,
      comfortWithCrowds: user?.crowd_comfort || 'tolerates',
      photography: user?.photography_level || 'phone_only',
    };

    const experience: TravelerExperience = {
      internationalTravelCount: user?.international_trips_count || 0,
      hasVisitedDestination: false,
      previousVisitYear: null,
      countriesVisited: user?.countries_visited || [],
      frequentTraveler: (user?.international_trips_count || 0) > 10,
      hasGlobalEntry: user?.has_global_entry || false,
      hasTSAPreCheck: user?.has_tsa_precheck || false,
      languageProficiency: user?.language_proficiency || {},
    };

    const documents: TravelerDocuments = {
      passport: {
        hasPassport: !!user?.passport_expiry,
        passportCountry: user?.passport_country || user?.nationality || 'US',
        expirationDate: user?.passport_expiry || null,
        monthsUntilExpiry: user?.passport_expiry ? monthsUntil(user.passport_expiry) : null,
        needsRenewal: user?.passport_expiry ? monthsUntil(user.passport_expiry) < 6 : true,
      },
      visa: {
        hasValidVisa: false,
        visaType: null,
        visaExpiration: null,
      },
      driversLicense: {
        hasLicense: user?.has_drivers_license ?? true,
        licenseCountry: user?.license_country || user?.nationality || 'US',
        hasInternationalPermit: user?.has_international_driving_permit || false,
      },
      insurance: {
        hasTravelInsurance: !!user?.insurance_provider,
        insuranceProvider: user?.insurance_provider || null,
        policyNumber: user?.insurance_policy || null,
        coverageType: user?.insurance_type || null,
      },
      storedDocuments: [],
    };

    const financial: TravelerFinancial = {
      primaryPaymentMethod: user?.payment_preference || 'credit_card',
      creditCards: user?.credit_cards || [],
      hasNoForeignTransactionFeeCard: this.hasNoFTFCard(user?.credit_cards),
      preferredCurrency: user?.preferred_currency || 'USD',
      comfortWithBargaining: user?.bargaining_comfort || 'some',
    };

    const emergency: TravelerEmergency = {
      contacts: user?.emergency_contacts || [],
      bloodType: user?.blood_type || null,
      organDonor: user?.organ_donor || false,
    };

    return {
      id: traveler.id,
      userId: traveler.user_id,
      firstName: traveler.first_name || user?.first_name || 'Traveler',
      lastName: traveler.last_name || user?.last_name || '',
      isOwner: traveler.is_owner || false,
      role: traveler.role || 'traveler',
      demographics,
      professional,
      cultural,
      health,
      preferences,
      experience,
      documents,
      financial,
      emergency,
    };
  }

  /**
   * Create traveler context from trip owner when no travelers exist
   */
  private async createOwnerTravelerContext(userId: string): Promise<TravelerContext | null> {
    if (!userId) return null;

    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) return null;

    return this.enrichTravelerContext({
      id: userId,
      user_id: userId,
      first_name: user.first_name,
      last_name: user.last_name,
      is_owner: true,
      role: 'owner',
    });
  }

  /**
   * Build destination intelligence
   */
  private async buildDestinationIntelligence(
    destinationCode: string,
    country: string
  ): Promise<DestinationIntelligence> {
    // Try to get cached destination intelligence
    const { data: cached } = await supabase
      .from('destination_intelligence')
      .select('*')
      .eq('destination_code', destinationCode)
      .single();

    if (cached) {
      return {
        basic: {
          code: cached.destination_code,
          name: cached.name,
          country: cached.country_name,
          countryCode: cached.country_code,
          continent: cached.continent || '',
          timezone: cached.timezone || 'UTC',
        },
        geography: {
          latitude: cached.latitude || 0,
          longitude: cached.longitude || 0,
          hemisphere: cached.hemisphere || 'northern',
          climateType: cached.climate_type || 'temperate',
          elevation: 0,
          coastal: false,
        },
        culture: {
          primaryLanguage: cached.primary_language || 'English',
          otherLanguages: cached.other_languages || [],
          greetingStyle: 'handshake',
          dressCode: 'casual',
          religiousSensitivities: [],
          tippingCulture: 'appreciated',
        },
        practical: {
          currency: { code: cached.currency_code || 'USD', symbol: '$', name: 'US Dollar' },
          powerPlug: cached.power_plug_type || ['A', 'B'],
          voltage: cached.voltage || 120,
          drivingSide: 'right',
          tapWaterSafe: cached.tap_water_safe ?? true,
          emergencyNumber: '911',
        },
      };
    }

    // Return default if not cached
    return {
      basic: {
        code: destinationCode || 'UNKNOWN',
        name: destinationCode || 'Unknown',
        country: country || 'Unknown',
        countryCode: '',
        continent: '',
        timezone: 'UTC',
      },
      geography: {
        latitude: 0,
        longitude: 0,
        hemisphere: 'northern',
        climateType: 'temperate',
        elevation: 0,
        coastal: false,
      },
      culture: {
        primaryLanguage: 'English',
        otherLanguages: [],
        greetingStyle: 'handshake',
        dressCode: 'casual',
        religiousSensitivities: [],
        tippingCulture: 'appreciated',
      },
      practical: {
        currency: { code: 'USD', symbol: '$', name: 'US Dollar' },
        powerPlug: ['A', 'B'],
        voltage: 120,
        drivingSide: 'right',
        tapWaterSafe: true,
        emergencyNumber: '911',
      },
    };
  }

  /**
   * Build bookings context
   */
  private buildBookingsContext(tripBookings: any[]): BookingsContext {
    const flights: any[] = [];
    const hotels: any[] = [];
    const cars: any[] = [];
    const experiences: any[] = [];

    for (const tb of tripBookings) {
      const booking = tb.bookings;
      if (!booking) continue;

      const category = booking.category || tb.booking_category;

      switch (category) {
        case 'flight':
          flights.push({
            id: booking.id,
            airline: booking.provider_name || '',
            airlineCode: booking.provider_code || '',
            flightNumber: booking.booking_reference || '',
            departureAirport: booking.item_details?.departure_airport || '',
            departureAirportCode: booking.item_details?.departure_code || '',
            arrivalAirport: booking.item_details?.arrival_airport || '',
            arrivalAirportCode: booking.item_details?.arrival_code || '',
            departureDateTime: booking.start_datetime || '',
            arrivalDateTime: booking.end_datetime || '',
            cabinClass: booking.item_details?.cabin_class || 'economy',
            baggageAllowance: {
              carryOn: { weight: 7, unit: 'kg' },
              checked: { weight: 23, pieces: 1 },
            },
            seatSelection: null,
          });
          break;

        case 'hotel':
          hotels.push({
            id: booking.id,
            name: booking.provider_name || '',
            starRating: booking.item_details?.star_rating || 4,
            address: booking.item_details?.address || '',
            checkIn: booking.start_datetime || '',
            checkOut: booking.end_datetime || '',
            roomType: booking.item_details?.room_type || 'Standard',
            amenities: booking.item_details?.amenities || [],
            breakfastIncluded: booking.item_details?.breakfast_included || false,
            cancellationPolicy: booking.cancellation_policy || '',
          });
          break;

        case 'car':
          cars.push({
            id: booking.id,
            company: booking.provider_name || '',
            vehicleType: booking.item_details?.vehicle_type || 'Compact',
            pickupLocation: booking.item_details?.pickup_location || '',
            pickupDateTime: booking.start_datetime || '',
            dropoffLocation: booking.item_details?.dropoff_location || '',
            dropoffDateTime: booking.end_datetime || '',
            insuranceIncluded: booking.item_details?.insurance_included || false,
          });
          break;

        case 'experience':
        case 'activity':
          experiences.push({
            id: booking.id,
            name: booking.provider_name || booking.item_details?.name || '',
            type: booking.item_details?.type || 'Activity',
            date: booking.start_datetime || '',
            time: booking.item_details?.time || '',
            duration: booking.item_details?.duration || '',
            location: booking.item_details?.location || '',
            requirements: booking.item_details?.requirements || [],
            whatToBring: booking.item_details?.what_to_bring || [],
          });
          break;
      }
    }

    return {
      flights,
      hotels,
      cars,
      experiences,
      hasFlights: flights.length > 0,
      hasHotels: hotels.length > 0,
      hasCars: cars.length > 0,
      hasExperiences: experiences.length > 0,
      totalBookings: flights.length + hotels.length + cars.length + experiences.length,
    };
  }

  /**
   * Build real-time intelligence (placeholder for external API integration)
   */
  private async buildRealtimeIntelligence(
    _destinationCode: string,
    _startDate: string,
    _endDate: string,
    _nationality?: string
  ): Promise<RealtimeIntelligence> {
    // This will be populated by external APIs (weather, safety, etc.)
    // For now, return empty structure
    return {
      weather: null,
      safety: null,
      events: [],
      financial: null,
      regulations: null,
    };
  }

  /**
   * Generate cache hints for optimization
   */
  private generateCacheHints(trip: any, travelers: TravelerContext[]): Record<string, string> {
    const primaryTraveler = travelers.find(t => t.isOwner) || travelers[0];
    const destinationCode = trip.destination?.code || trip.primary_destination_code || '';

    return {
      destination: destinationCode.toLowerCase(),
      tripType: trip.trip_type || 'leisure',
      composition: trip.traveler_composition || 'couple',
      nationality: primaryTraveler?.demographics.nationality?.toLowerCase() || 'us',
      season: this.determineSeason(trip.start_date),
      durationBucket: this.getDurationBucket(this.calculateDuration(trip.start_date, trip.end_date)),
    };
  }

  private calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  private calculateAge(dateOfBirth: string | null): number {
    if (!dateOfBirth) return 30;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  private hasNoFTFCard(creditCards: any[] | null): boolean {
    if (!creditCards || !Array.isArray(creditCards)) return false;
    return creditCards.some(card => card.noForeignFee === true);
  }

  private determineSeason(dateString: string): string {
    const date = new Date(dateString);
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private getDurationBucket(days: number): string {
    if (days <= 3) return 'weekend';
    if (days <= 7) return 'short';
    if (days <= 14) return 'medium';
    if (days <= 30) return 'long';
    return 'extended';
  }
}

export const contextBuilderService = new ContextBuilderService();
