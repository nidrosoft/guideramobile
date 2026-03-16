/**
 * TRAVEL PREFERENCES SERVICE
 * 
 * Manages user travel preferences for trip planning.
 * Preferences are used to pre-fill trip planning flows.
 */

import { supabase } from '@/lib/supabase/client';

// Types
export type CompanionType = 'solo' | 'couple' | 'family' | 'friends' | 'group';
export type TripStyle = 'relaxation' | 'culture' | 'foodie' | 'adventure' | 'shopping' | 'family' | 'romantic' | 'nightlife' | 'nature' | 'wellness';
export type TripPace = 'relaxed' | 'moderate' | 'packed';
export type TimePreference = 'early' | 'flexible' | 'night';
export type SpendingStyle = 'budget' | 'midrange' | 'luxury';
export type BudgetPriority = 'accommodation' | 'experiences' | 'food' | 'balanced';
export type InterestCategory = 'museums' | 'nature' | 'art' | 'food' | 'nightlife' | 'sports' | 'photography' | 'shopping' | 'wellness' | 'beach' | 'adventure' | 'music';
export type AccommodationType = 'hotel' | 'airbnb' | 'resort' | 'hostel' | 'mix';
export type LocationPriority = 'city_center' | 'near_attractions' | 'quiet' | 'near_transport';
export type Amenity = 'wifi' | 'breakfast' | 'pool' | 'gym' | 'kitchen' | 'parking' | 'spa' | 'ac';
export type TravelMode = 'flight' | 'train' | 'drive';
export type FlightClass = 'economy' | 'business' | 'first';
export type FlightStops = 'direct' | '1stop' | 'any';
export type FlightTimePreference = 'morning' | 'afternoon' | 'evening' | 'any';
export type LocalTransport = 'public' | 'rental' | 'rideshare' | 'walking' | 'mix';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD';
export type DietaryRestriction = 'Vegetarian' | 'Vegan' | 'Halal' | 'Kosher' | 'Gluten-Free' | 'Dairy-Free' | 'Nut Allergy' | 'Seafood Allergy';
export type FoodAdventurousness = 'safe_choices' | 'somewhat_adventurous' | 'very_adventurous';
export type SpiceTolerance = 'none' | 'mild' | 'medium' | 'hot' | 'very_hot';
export type CuisinePreference = 'italian' | 'japanese' | 'chinese' | 'indian' | 'thai' | 'mexican' | 'french' | 'mediterranean' | 'korean' | 'middle_eastern' | 'african' | 'caribbean' | 'vietnamese' | 'greek' | 'spanish' | 'american' | 'turkish' | 'peruvian' | 'ethiopian' | 'brazilian';
export type MedicalCondition = 'asthma' | 'diabetes' | 'heart_condition' | 'mobility_limited' | 'wheelchair_user' | 'anxiety' | 'pregnancy' | 'vision_impaired' | 'hearing_impaired' | 'chronic_pain' | 'epilepsy' | 'none';
export type AccessibilityNeed = 'wheelchair_access' | 'elevator_required' | 'ground_floor' | 'visual_assistance' | 'hearing_assistance' | 'service_animal' | 'extra_legroom' | 'none';
export type ActivityLevel = 'low' | 'moderate' | 'high' | 'extreme';
export type CrowdComfort = 'avoids' | 'tolerates' | 'enjoys';
export type PhotographyLevel = 'phone_only' | 'hobbyist' | 'professional';
export type SustainabilityPreference = 'none' | 'moderate' | 'strong';

export interface TravelPreferences {
  id: string;
  userId: string;
  
  // Travel Style
  defaultCompanionType: CompanionType | null;
  preferredTripStyles: TripStyle[];
  defaultTripPace: TripPace;
  timePreference: TimePreference;
  
  // Default Travelers
  defaultAdults: number;
  defaultChildren: number;
  defaultInfants: number;
  
  // Budget & Spending
  defaultBudgetAmount: number;
  defaultCurrency: Currency;
  spendingStyle: SpendingStyle;
  budgetPriority: BudgetPriority;
  
  // Interests
  interests: InterestCategory[];
  
  // Accommodation
  accommodationType: AccommodationType;
  minStarRating: number;
  locationPriority: LocationPriority;
  preferredAmenities: Amenity[];
  
  // Transportation
  preferredTravelMode: TravelMode;
  flightClass: FlightClass;
  flightStops: FlightStops;
  flightTimePreference: FlightTimePreference;
  localTransport: LocalTransport;
  
  // Dietary & Accessibility
  dietaryRestrictions: DietaryRestriction[];
  wheelchairAccessible: boolean;
  travelingWithPet: boolean;
  
  // Food Preferences
  foodAdventurousness: FoodAdventurousness;
  cuisinePreferences: CuisinePreference[];
  spiceTolerance: SpiceTolerance;
  
  // Health & Medical
  medicalConditions: MedicalCondition[];
  accessibilityNeeds: AccessibilityNeed[];
  
  // Lifestyle & Identity
  activityLevel: ActivityLevel;
  morningPerson: boolean;
  crowdComfort: CrowdComfort;
  photographyLevel: PhotographyLevel;
  sustainabilityPreference: SustainabilityPreference;
  childrenDefaultAges: number[];
  
  // Metadata
  preferencesCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Database row type (snake_case)
interface TravelPreferencesRow {
  id: string;
  user_id: string;
  default_companion_type: string | null;
  preferred_trip_styles: string[];
  default_trip_pace: string;
  time_preference: string;
  default_adults: number;
  default_children: number;
  default_infants: number;
  default_budget_amount: number;
  default_currency: string;
  spending_style: string;
  budget_priority: string;
  interests: string[];
  accommodation_type: string;
  min_star_rating: number;
  location_priority: string;
  preferred_amenities: string[];
  preferred_travel_mode: string;
  flight_class: string;
  flight_stops: string;
  flight_time_preference: string;
  local_transport: string;
  dietary_restrictions: string[];
  wheelchair_accessible: boolean;
  traveling_with_pet: boolean;
  food_adventurousness: string;
  cuisine_preferences: string[];
  spice_tolerance: string;
  medical_conditions: string[];
  accessibility_needs: string[];
  activity_level: string;
  morning_person: boolean;
  crowd_comfort: string;
  photography_level: string;
  sustainability_preference: string;
  children_default_ages: number[];
  preferences_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Update payload type
export interface UpdateTravelPreferencesPayload {
  defaultCompanionType?: CompanionType | null;
  preferredTripStyles?: TripStyle[];
  defaultTripPace?: TripPace;
  timePreference?: TimePreference;
  defaultAdults?: number;
  defaultChildren?: number;
  defaultInfants?: number;
  defaultBudgetAmount?: number;
  defaultCurrency?: Currency;
  spendingStyle?: SpendingStyle;
  budgetPriority?: BudgetPriority;
  interests?: InterestCategory[];
  accommodationType?: AccommodationType;
  minStarRating?: number;
  locationPriority?: LocationPriority;
  preferredAmenities?: Amenity[];
  preferredTravelMode?: TravelMode;
  flightClass?: FlightClass;
  flightStops?: FlightStops;
  flightTimePreference?: FlightTimePreference;
  localTransport?: LocalTransport;
  dietaryRestrictions?: DietaryRestriction[];
  wheelchairAccessible?: boolean;
  travelingWithPet?: boolean;
  foodAdventurousness?: FoodAdventurousness;
  cuisinePreferences?: CuisinePreference[];
  spiceTolerance?: SpiceTolerance;
  medicalConditions?: MedicalCondition[];
  accessibilityNeeds?: AccessibilityNeed[];
  activityLevel?: ActivityLevel;
  morningPerson?: boolean;
  crowdComfort?: CrowdComfort;
  photographyLevel?: PhotographyLevel;
  sustainabilityPreference?: SustainabilityPreference;
  childrenDefaultAges?: number[];
  preferencesCompleted?: boolean;
}

// Transform database row to app type
function transformRow(row: TravelPreferencesRow): TravelPreferences {
  return {
    id: row.id,
    userId: row.user_id,
    defaultCompanionType: row.default_companion_type as CompanionType | null,
    preferredTripStyles: row.preferred_trip_styles as TripStyle[],
    defaultTripPace: row.default_trip_pace as TripPace,
    timePreference: row.time_preference as TimePreference,
    defaultAdults: row.default_adults,
    defaultChildren: row.default_children,
    defaultInfants: row.default_infants,
    defaultBudgetAmount: row.default_budget_amount,
    defaultCurrency: row.default_currency as Currency,
    spendingStyle: row.spending_style as SpendingStyle,
    budgetPriority: row.budget_priority as BudgetPriority,
    interests: row.interests as InterestCategory[],
    accommodationType: row.accommodation_type as AccommodationType,
    minStarRating: row.min_star_rating,
    locationPriority: row.location_priority as LocationPriority,
    preferredAmenities: row.preferred_amenities as Amenity[],
    preferredTravelMode: row.preferred_travel_mode as TravelMode,
    flightClass: row.flight_class as FlightClass,
    flightStops: row.flight_stops as FlightStops,
    flightTimePreference: row.flight_time_preference as FlightTimePreference,
    localTransport: row.local_transport as LocalTransport,
    dietaryRestrictions: row.dietary_restrictions as DietaryRestriction[],
    wheelchairAccessible: row.wheelchair_accessible,
    travelingWithPet: row.traveling_with_pet,
    foodAdventurousness: (row.food_adventurousness || 'somewhat_adventurous') as FoodAdventurousness,
    cuisinePreferences: (row.cuisine_preferences || []) as CuisinePreference[],
    spiceTolerance: (row.spice_tolerance || 'medium') as SpiceTolerance,
    medicalConditions: (row.medical_conditions || []) as MedicalCondition[],
    accessibilityNeeds: (row.accessibility_needs || []) as AccessibilityNeed[],
    activityLevel: (row.activity_level || 'moderate') as ActivityLevel,
    morningPerson: row.morning_person ?? true,
    crowdComfort: (row.crowd_comfort || 'tolerates') as CrowdComfort,
    photographyLevel: (row.photography_level || 'phone_only') as PhotographyLevel,
    sustainabilityPreference: (row.sustainability_preference || 'moderate') as SustainabilityPreference,
    childrenDefaultAges: row.children_default_ages || [],
    preferencesCompleted: row.preferences_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Transform update payload to database format
function transformPayloadToRow(payload: UpdateTravelPreferencesPayload): Record<string, any> {
  const row: Record<string, any> = {};
  
  if (payload.defaultCompanionType !== undefined) row.default_companion_type = payload.defaultCompanionType;
  if (payload.preferredTripStyles !== undefined) row.preferred_trip_styles = payload.preferredTripStyles;
  if (payload.defaultTripPace !== undefined) row.default_trip_pace = payload.defaultTripPace;
  if (payload.timePreference !== undefined) row.time_preference = payload.timePreference;
  if (payload.defaultAdults !== undefined) row.default_adults = payload.defaultAdults;
  if (payload.defaultChildren !== undefined) row.default_children = payload.defaultChildren;
  if (payload.defaultInfants !== undefined) row.default_infants = payload.defaultInfants;
  if (payload.defaultBudgetAmount !== undefined) row.default_budget_amount = payload.defaultBudgetAmount;
  if (payload.defaultCurrency !== undefined) row.default_currency = payload.defaultCurrency;
  if (payload.spendingStyle !== undefined) row.spending_style = payload.spendingStyle;
  if (payload.budgetPriority !== undefined) row.budget_priority = payload.budgetPriority;
  if (payload.interests !== undefined) row.interests = payload.interests;
  if (payload.accommodationType !== undefined) row.accommodation_type = payload.accommodationType;
  if (payload.minStarRating !== undefined) row.min_star_rating = payload.minStarRating;
  if (payload.locationPriority !== undefined) row.location_priority = payload.locationPriority;
  if (payload.preferredAmenities !== undefined) row.preferred_amenities = payload.preferredAmenities;
  if (payload.preferredTravelMode !== undefined) row.preferred_travel_mode = payload.preferredTravelMode;
  if (payload.flightClass !== undefined) row.flight_class = payload.flightClass;
  if (payload.flightStops !== undefined) row.flight_stops = payload.flightStops;
  if (payload.flightTimePreference !== undefined) row.flight_time_preference = payload.flightTimePreference;
  if (payload.localTransport !== undefined) row.local_transport = payload.localTransport;
  if (payload.dietaryRestrictions !== undefined) row.dietary_restrictions = payload.dietaryRestrictions;
  if (payload.wheelchairAccessible !== undefined) row.wheelchair_accessible = payload.wheelchairAccessible;
  if (payload.travelingWithPet !== undefined) row.traveling_with_pet = payload.travelingWithPet;
  if (payload.foodAdventurousness !== undefined) row.food_adventurousness = payload.foodAdventurousness;
  if (payload.cuisinePreferences !== undefined) row.cuisine_preferences = payload.cuisinePreferences;
  if (payload.spiceTolerance !== undefined) row.spice_tolerance = payload.spiceTolerance;
  if (payload.medicalConditions !== undefined) row.medical_conditions = payload.medicalConditions;
  if (payload.accessibilityNeeds !== undefined) row.accessibility_needs = payload.accessibilityNeeds;
  if (payload.activityLevel !== undefined) row.activity_level = payload.activityLevel;
  if (payload.morningPerson !== undefined) row.morning_person = payload.morningPerson;
  if (payload.crowdComfort !== undefined) row.crowd_comfort = payload.crowdComfort;
  if (payload.photographyLevel !== undefined) row.photography_level = payload.photographyLevel;
  if (payload.sustainabilityPreference !== undefined) row.sustainability_preference = payload.sustainabilityPreference;
  if (payload.childrenDefaultAges !== undefined) row.children_default_ages = payload.childrenDefaultAges;
  if (payload.preferencesCompleted !== undefined) row.preferences_completed = payload.preferencesCompleted;
  
  return row;
}

// Default preferences for new users
export const DEFAULT_PREFERENCES: Omit<TravelPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  defaultCompanionType: null,
  preferredTripStyles: [],
  defaultTripPace: 'moderate',
  timePreference: 'flexible',
  defaultAdults: 1,
  defaultChildren: 0,
  defaultInfants: 0,
  defaultBudgetAmount: 3000,
  defaultCurrency: 'USD',
  spendingStyle: 'midrange',
  budgetPriority: 'balanced',
  interests: [],
  accommodationType: 'hotel',
  minStarRating: 4,
  locationPriority: 'near_attractions',
  preferredAmenities: ['wifi'],
  preferredTravelMode: 'flight',
  flightClass: 'economy',
  flightStops: 'direct',
  flightTimePreference: 'any',
  localTransport: 'mix',
  dietaryRestrictions: [],
  wheelchairAccessible: false,
  travelingWithPet: false,
  foodAdventurousness: 'somewhat_adventurous',
  cuisinePreferences: [],
  spiceTolerance: 'medium',
  medicalConditions: [],
  accessibilityNeeds: [],
  activityLevel: 'moderate',
  morningPerson: true,
  crowdComfort: 'tolerates',
  photographyLevel: 'phone_only',
  sustainabilityPreference: 'moderate',
  childrenDefaultAges: [],
  preferencesCompleted: false,
};

// Configuration options for UI
export const PREFERENCE_OPTIONS = {
  companionTypes: [
    { id: 'solo', label: 'Solo', emoji: '🧑', description: 'Just me' },
    { id: 'couple', label: 'Couple', emoji: '💑', description: 'With partner' },
    { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦', description: 'With kids' },
    { id: 'friends', label: 'Friends', emoji: '👯', description: 'Friend group' },
    { id: 'group', label: 'Group', emoji: '👥', description: 'Large group' },
  ],
  tripStyles: [
    { id: 'relaxation', label: 'Relaxation', emoji: '🏖️' },
    { id: 'culture', label: 'Culture', emoji: '🏛️' },
    { id: 'foodie', label: 'Foodie', emoji: '🍽️' },
    { id: 'adventure', label: 'Adventure', emoji: '🥾' },
    { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
    { id: 'family', label: 'Family Fun', emoji: '👨‍👩‍👧‍👦' },
    { id: 'romantic', label: 'Romantic', emoji: '💑' },
    { id: 'nightlife', label: 'Nightlife', emoji: '🎭' },
    { id: 'nature', label: 'Nature', emoji: '🌿' },
    { id: 'wellness', label: 'Wellness', emoji: '💆' },
  ],
  tripPaces: [
    { id: 'relaxed', label: 'Relaxed', emoji: '🐢', description: '2-3 activities/day' },
    { id: 'moderate', label: 'Moderate', emoji: '🚶', description: '3-4 activities/day' },
    { id: 'packed', label: 'Packed', emoji: '🏃', description: '5+ activities/day' },
  ],
  timePreferences: [
    { id: 'early', label: 'Early Bird', emoji: '🌅', description: 'Start days early' },
    { id: 'flexible', label: 'Flexible', emoji: '⏰', description: 'Go with the flow' },
    { id: 'night', label: 'Night Owl', emoji: '🌙', description: 'Late starts, late nights' },
  ],
  spendingStyles: [
    { id: 'budget', label: 'Budget', emoji: '💰', description: 'Save where you can' },
    { id: 'midrange', label: 'Mid-Range', emoji: '💰💰', description: 'Balanced spending' },
    { id: 'luxury', label: 'Luxury', emoji: '💰💰💰', description: 'Treat yourself' },
  ],
  budgetPriorities: [
    { id: 'accommodation', label: 'Accommodation', description: 'Prioritize where you stay' },
    { id: 'experiences', label: 'Experiences', description: 'Focus on activities' },
    { id: 'food', label: 'Food & Dining', description: 'Culinary adventures' },
    { id: 'balanced', label: 'Balanced', description: 'Spread evenly' },
  ],
  interests: [
    { id: 'museums', label: 'Museums', emoji: '🏛️' },
    { id: 'nature', label: 'Nature', emoji: '🌿' },
    { id: 'art', label: 'Art', emoji: '🎨' },
    { id: 'food', label: 'Food', emoji: '🍜' },
    { id: 'nightlife', label: 'Nightlife', emoji: '🎭' },
    { id: 'sports', label: 'Sports', emoji: '🏃' },
    { id: 'photography', label: 'Photos', emoji: '📸' },
    { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
    { id: 'wellness', label: 'Wellness', emoji: '💆' },
    { id: 'beach', label: 'Beach', emoji: '🏖️' },
    { id: 'adventure', label: 'Adventure', emoji: '🎢' },
    { id: 'music', label: 'Music', emoji: '🎵' },
  ],
  accommodationTypes: [
    { id: 'hotel', label: 'Hotel', emoji: '🏨' },
    { id: 'airbnb', label: 'Airbnb', emoji: '🏠' },
    { id: 'resort', label: 'Resort', emoji: '🏩' },
    { id: 'hostel', label: 'Hostel', emoji: '🛏️' },
    { id: 'mix', label: 'Mix', emoji: '🎲' },
  ],
  locationPriorities: [
    { id: 'city_center', label: 'City Center', description: 'Heart of the action' },
    { id: 'near_attractions', label: 'Near Attractions', description: 'Close to sights' },
    { id: 'quiet', label: 'Quiet Area', description: 'Peaceful neighborhood' },
    { id: 'near_transport', label: 'Near Transport', description: 'Easy connections' },
  ],
  amenities: [
    { id: 'wifi', label: 'Free WiFi', icon: '📶' },
    { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { id: 'pool', label: 'Pool', icon: '🏊' },
    { id: 'gym', label: 'Gym', icon: '💪' },
    { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
    { id: 'parking', label: 'Parking', icon: '🅿️' },
    { id: 'spa', label: 'Spa', icon: '💆' },
    { id: 'ac', label: 'A/C', icon: '❄️' },
  ],
  travelModes: [
    { id: 'flight', label: 'Flight', emoji: '✈️' },
    { id: 'train', label: 'Train', emoji: '🚂' },
    { id: 'drive', label: 'Drive', emoji: '🚗' },
  ],
  flightClasses: [
    { id: 'economy', label: 'Economy' },
    { id: 'business', label: 'Business' },
    { id: 'first', label: 'First' },
  ],
  flightStops: [
    { id: 'direct', label: 'Direct Only' },
    { id: '1stop', label: '1 Stop Max' },
    { id: 'any', label: 'Any' },
  ],
  flightTimePreferences: [
    { id: 'morning', label: 'Morning', emoji: '🌅' },
    { id: 'afternoon', label: 'Afternoon', emoji: '☀️' },
    { id: 'evening', label: 'Evening', emoji: '🌆' },
    { id: 'any', label: 'Any Time', emoji: '⏰' },
  ],
  localTransports: [
    { id: 'public', label: 'Public Transit', emoji: '🚇' },
    { id: 'rental', label: 'Rental Car', emoji: '🚗' },
    { id: 'rideshare', label: 'Rideshare', emoji: '🚕' },
    { id: 'walking', label: 'Walking', emoji: '🚶' },
    { id: 'mix', label: 'Mix', emoji: '🎲' },
  ],
  currencies: [
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  ],
  dietaryRestrictions: [
    'Vegetarian',
    'Vegan',
    'Halal',
    'Kosher',
    'Gluten-Free',
    'Dairy-Free',
    'Nut Allergy',
    'Seafood Allergy',
  ],
  foodAdventurousness: [
    { id: 'safe_choices', label: 'Safe Choices', emoji: '🍞', description: 'Stick to familiar foods' },
    { id: 'somewhat_adventurous', label: 'Somewhat Adventurous', emoji: '🍜', description: 'Open to trying local dishes' },
    { id: 'very_adventurous', label: 'Very Adventurous', emoji: '🦗', description: 'Try everything, street food included' },
  ],
  spiceTolerances: [
    { id: 'none', label: 'No Spice', emoji: '🥛' },
    { id: 'mild', label: 'Mild', emoji: '🌶️' },
    { id: 'medium', label: 'Medium', emoji: '🌶️🌶️' },
    { id: 'hot', label: 'Hot', emoji: '🌶️🌶️🌶️' },
    { id: 'very_hot', label: 'Bring It On', emoji: '🔥' },
  ],
  cuisinePreferences: [
    { id: 'italian', label: 'Italian', emoji: '🍝' },
    { id: 'japanese', label: 'Japanese', emoji: '🍣' },
    { id: 'chinese', label: 'Chinese', emoji: '🥡' },
    { id: 'indian', label: 'Indian', emoji: '🍛' },
    { id: 'thai', label: 'Thai', emoji: '🍜' },
    { id: 'mexican', label: 'Mexican', emoji: '🌮' },
    { id: 'french', label: 'French', emoji: '🥐' },
    { id: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
    { id: 'korean', label: 'Korean', emoji: '🍱' },
    { id: 'middle_eastern', label: 'Middle Eastern', emoji: '🧆' },
    { id: 'african', label: 'African', emoji: '🍲' },
    { id: 'caribbean', label: 'Caribbean', emoji: '🥥' },
    { id: 'vietnamese', label: 'Vietnamese', emoji: '🍲' },
    { id: 'greek', label: 'Greek', emoji: '🥙' },
    { id: 'spanish', label: 'Spanish', emoji: '🥘' },
    { id: 'american', label: 'American', emoji: '🍔' },
    { id: 'turkish', label: 'Turkish', emoji: '🥙' },
    { id: 'peruvian', label: 'Peruvian', emoji: '🐟' },
    { id: 'ethiopian', label: 'Ethiopian', emoji: '🍛' },
    { id: 'brazilian', label: 'Brazilian', emoji: '🥩' },
  ],
  medicalConditions: [
    { id: 'asthma', label: 'Asthma', emoji: '🫁' },
    { id: 'diabetes', label: 'Diabetes', emoji: '💉' },
    { id: 'heart_condition', label: 'Heart Condition', emoji: '❤️' },
    { id: 'mobility_limited', label: 'Limited Mobility', emoji: '🦯' },
    { id: 'wheelchair_user', label: 'Wheelchair User', emoji: '♿' },
    { id: 'anxiety', label: 'Anxiety / Mental Health', emoji: '🧠' },
    { id: 'pregnancy', label: 'Pregnancy', emoji: '🤰' },
    { id: 'vision_impaired', label: 'Vision Impaired', emoji: '👓' },
    { id: 'hearing_impaired', label: 'Hearing Impaired', emoji: '🦻' },
    { id: 'chronic_pain', label: 'Chronic Pain', emoji: '💊' },
    { id: 'epilepsy', label: 'Epilepsy', emoji: '⚡' },
    { id: 'none', label: 'None', emoji: '✅' },
  ],
  accessibilityNeeds: [
    { id: 'wheelchair_access', label: 'Wheelchair Access', emoji: '♿' },
    { id: 'elevator_required', label: 'Elevator Required', emoji: '🛗' },
    { id: 'ground_floor', label: 'Ground Floor Only', emoji: '🏠' },
    { id: 'visual_assistance', label: 'Visual Assistance', emoji: '👓' },
    { id: 'hearing_assistance', label: 'Hearing Assistance', emoji: '🦻' },
    { id: 'service_animal', label: 'Service Animal', emoji: '🐕‍🦺' },
    { id: 'extra_legroom', label: 'Extra Legroom', emoji: '🦵' },
    { id: 'none', label: 'None', emoji: '✅' },
  ],
  activityLevels: [
    { id: 'low', label: 'Low', emoji: '🧘', description: 'Gentle pace, minimal walking' },
    { id: 'moderate', label: 'Moderate', emoji: '🚶', description: '5-10km walking/day' },
    { id: 'high', label: 'High', emoji: '🏃', description: 'Active, 10-20km/day' },
    { id: 'extreme', label: 'Extreme', emoji: '🧗', description: 'Trekking, diving, climbing' },
  ],
  crowdComforts: [
    { id: 'avoids', label: 'Avoids Crowds', emoji: '🏞️', description: 'Prefer quiet, off-the-beaten-path' },
    { id: 'tolerates', label: 'Tolerates', emoji: '🏙️', description: 'Fine with some crowds' },
    { id: 'enjoys', label: 'Enjoys Crowds', emoji: '🎉', description: 'Love the energy of busy places' },
  ],
  photographyLevels: [
    { id: 'phone_only', label: 'Phone Only', emoji: '📱', description: 'Quick snaps for memories' },
    { id: 'hobbyist', label: 'Hobbyist', emoji: '📷', description: 'Golden hour, composition matters' },
    { id: 'professional', label: 'Professional', emoji: '📸', description: 'Photography drives the itinerary' },
  ],
  sustainabilityPreferences: [
    { id: 'none', label: 'Not a Priority', emoji: '🌍', description: 'No specific eco preferences' },
    { id: 'moderate', label: 'Moderate', emoji: '♻️', description: 'Prefer eco options when convenient' },
    { id: 'strong', label: 'Strong', emoji: '🌱', description: 'Eco-tourism is essential' },
  ],
  hairTypes: [
    { id: 'straight', label: 'Straight', emoji: '💇' },
    { id: 'wavy', label: 'Wavy', emoji: '🌊' },
    { id: 'curly', label: 'Curly', emoji: '🌀' },
    { id: 'coily', label: 'Coily / Afro', emoji: '✨' },
    { id: 'fine', label: 'Fine / Thin', emoji: '🪶' },
    { id: 'thick', label: 'Thick', emoji: '🦁' },
  ],
  skinTones: [
    { id: 'very_fair', label: 'Very Fair', emoji: '☁️', description: 'Burns easily, rarely tans' },
    { id: 'fair', label: 'Fair', emoji: '🌤️', description: 'Burns moderately, tans gradually' },
    { id: 'medium', label: 'Medium', emoji: '☀️', description: 'Burns minimally, tans well' },
    { id: 'olive', label: 'Olive', emoji: '🫒', description: 'Rarely burns, tans easily' },
    { id: 'brown', label: 'Brown', emoji: '🌰', description: 'Very rarely burns' },
    { id: 'dark', label: 'Dark', emoji: '🌑', description: 'Almost never burns' },
  ],
};

class PreferencesService {
  /**
   * Get user's travel preferences
   */
  async getPreferences(userId: string): Promise<{ data: TravelPreferences | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('travel_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
          return this.createDefaultPreferences(userId);
        }
        return { data: null, error };
      }
      
      return { data: transformRow(data as TravelPreferencesRow), error: null };
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return { data: null, error };
    }
  }
  
  /**
   * Create default preferences for a user
   */
  async createDefaultPreferences(userId: string): Promise<{ data: TravelPreferences | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('travel_preferences')
        .insert({ user_id: userId })
        .select()
        .single();
      
      if (error) {
        return { data: null, error };
      }
      
      return { data: transformRow(data as TravelPreferencesRow), error: null };
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return { data: null, error };
    }
  }
  
  /**
   * Update user's travel preferences
   */
  async updatePreferences(
    userId: string, 
    updates: UpdateTravelPreferencesPayload
  ): Promise<{ data: TravelPreferences | null; error: any }> {
    try {
      const rowUpdates = transformPayloadToRow(updates);
      
      const { data, error } = await supabase
        .from('travel_preferences')
        .update(rowUpdates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error };
      }
      
      return { data: transformRow(data as TravelPreferencesRow), error: null };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { data: null, error };
    }
  }
  
  /**
   * Update a single preference section
   */
  async updateTravelStyle(
    userId: string,
    companionType: CompanionType | null,
    tripStyles: TripStyle[],
    pace: TripPace,
    timePreference: TimePreference
  ): Promise<{ data: TravelPreferences | null; error: any }> {
    return this.updatePreferences(userId, {
      defaultCompanionType: companionType,
      preferredTripStyles: tripStyles,
      defaultTripPace: pace,
      timePreference,
    });
  }
  
  /**
   * Update budget preferences
   */
  async updateBudgetPreferences(
    userId: string,
    amount: number,
    currency: Currency,
    style: SpendingStyle,
    priority: BudgetPriority
  ): Promise<{ data: TravelPreferences | null; error: any }> {
    return this.updatePreferences(userId, {
      defaultBudgetAmount: amount,
      defaultCurrency: currency,
      spendingStyle: style,
      budgetPriority: priority,
    });
  }
  
  /**
   * Update interests
   */
  async updateInterests(
    userId: string,
    interests: InterestCategory[]
  ): Promise<{ data: TravelPreferences | null; error: any }> {
    return this.updatePreferences(userId, { interests });
  }
  
  /**
   * Update accommodation preferences
   */
  async updateAccommodationPreferences(
    userId: string,
    type: AccommodationType,
    starRating: number,
    locationPriority: LocationPriority,
    amenities: Amenity[]
  ): Promise<{ data: TravelPreferences | null; error: any }> {
    return this.updatePreferences(userId, {
      accommodationType: type,
      minStarRating: starRating,
      locationPriority,
      preferredAmenities: amenities,
    });
  }
  
  /**
   * Update transportation preferences
   */
  async updateTransportationPreferences(
    userId: string,
    travelMode: TravelMode,
    flightClass: FlightClass,
    flightStops: FlightStops,
    flightTime: FlightTimePreference,
    localTransport: LocalTransport
  ): Promise<{ data: TravelPreferences | null; error: any }> {
    return this.updatePreferences(userId, {
      preferredTravelMode: travelMode,
      flightClass,
      flightStops,
      flightTimePreference: flightTime,
      localTransport,
    });
  }
  
  /**
   * Update dietary, food, and accessibility preferences
   */
  async updateAccessibilityPreferences(
    userId: string,
    dietary: DietaryRestriction[],
    wheelchair: boolean,
    pet: boolean,
    foodAdventurousness?: FoodAdventurousness,
    cuisinePreferences?: CuisinePreference[],
    spiceTolerance?: SpiceTolerance,
    medicalConditions?: MedicalCondition[],
    accessibilityNeeds?: AccessibilityNeed[],
  ): Promise<{ data: TravelPreferences | null; error: any }> {
    const updates: UpdateTravelPreferencesPayload = {
      dietaryRestrictions: dietary,
      wheelchairAccessible: wheelchair,
      travelingWithPet: pet,
    };
    if (foodAdventurousness !== undefined) updates.foodAdventurousness = foodAdventurousness;
    if (cuisinePreferences !== undefined) updates.cuisinePreferences = cuisinePreferences;
    if (spiceTolerance !== undefined) updates.spiceTolerance = spiceTolerance;
    if (medicalConditions !== undefined) updates.medicalConditions = medicalConditions;
    if (accessibilityNeeds !== undefined) updates.accessibilityNeeds = accessibilityNeeds;
    return this.updatePreferences(userId, updates);
  }
  
  /**
   * Update lifestyle & identity preferences
   */
  async updateLifestylePreferences(
    userId: string,
    activityLevel: ActivityLevel,
    morningPerson: boolean,
    crowdComfort: CrowdComfort,
    photographyLevel: PhotographyLevel,
    sustainabilityPreference: SustainabilityPreference,
    childrenDefaultAges: number[],
  ): Promise<{ data: TravelPreferences | null; error: any }> {
    return this.updatePreferences(userId, {
      activityLevel,
      morningPerson,
      crowdComfort,
      photographyLevel,
      sustainabilityPreference,
      childrenDefaultAges,
    });
  }
  
  /**
   * Mark preferences as completed (user has gone through initial setup)
   */
  async markPreferencesCompleted(userId: string): Promise<{ data: TravelPreferences | null; error: any }> {
    return this.updatePreferences(userId, { preferencesCompleted: true });
  }
  
  /**
   * Calculate preference completeness score (0-100)
   * Used by personalization engine to determine confidence level
   */
  calculateCompleteness(preferences: TravelPreferences | null): number {
    if (!preferences) return 0;
    
    let score = 0;
    const weights = {
      // Core preferences (70 points total)
      defaultCompanionType: 15,
      preferredTripStyles: 15,
      spendingStyle: 15,
      interests: 25,
      
      // Secondary preferences (20 points total)
      accommodationType: 5,
      preferredTravelMode: 5,
      defaultTripPace: 5,
      timePreference: 5,
      
      // Optional preferences (10 points total)
      dietaryRestrictions: 3,
      preferredAmenities: 4,
      localTransport: 3,
    };
    
    if (preferences.defaultCompanionType) score += weights.defaultCompanionType;
    if (preferences.preferredTripStyles?.length > 0) score += weights.preferredTripStyles;
    if (preferences.spendingStyle && preferences.spendingStyle !== 'midrange') score += weights.spendingStyle;
    else if (preferences.spendingStyle === 'midrange') score += weights.spendingStyle * 0.5; // Default value gets partial credit
    if (preferences.interests?.length > 0) score += Math.min(preferences.interests.length * 5, weights.interests);
    if (preferences.accommodationType && preferences.accommodationType !== 'hotel') score += weights.accommodationType;
    else if (preferences.accommodationType === 'hotel') score += weights.accommodationType * 0.5;
    if (preferences.preferredTravelMode) score += weights.preferredTravelMode;
    if (preferences.defaultTripPace && preferences.defaultTripPace !== 'moderate') score += weights.defaultTripPace;
    else if (preferences.defaultTripPace === 'moderate') score += weights.defaultTripPace * 0.5;
    if (preferences.timePreference && preferences.timePreference !== 'flexible') score += weights.timePreference;
    else if (preferences.timePreference === 'flexible') score += weights.timePreference * 0.5;
    if (preferences.dietaryRestrictions?.length > 0) score += weights.dietaryRestrictions;
    if (preferences.preferredAmenities?.length > 1) score += weights.preferredAmenities;
    if (preferences.localTransport && preferences.localTransport !== 'mix') score += weights.localTransport;
    
    return Math.min(Math.round(score), 100);
  }
  
  /**
   * Get personalization-ready preferences
   * Maps travel_preferences to the format expected by the personalization engine
   */
  getPersonalizationPreferences(preferences: TravelPreferences | null): {
    travel_style: string | null;
    interests: string[];
    budget_level: number;
    typical_travel_with: string | null;
  } | null {
    if (!preferences) return null;
    
    // Map spending_style to budget_level (1-5)
    const budgetLevelMap: Record<string, number> = {
      'budget': 1,
      'midrange': 3,
      'luxury': 5,
    };
    
    // Map trip styles to travel_style (use first one)
    const travelStyleMap: Record<string, string> = {
      'adventure': 'adventure',
      'relaxation': 'relaxation',
      'culture': 'cultural',
      'foodie': 'cultural',
      'romantic': 'relaxation',
      'nature': 'adventure',
      'wellness': 'relaxation',
      'nightlife': 'adventure',
      'shopping': 'cultural',
      'family': 'relaxation',
    };
    
    const primaryStyle = preferences.preferredTripStyles?.[0];
    
    return {
      travel_style: primaryStyle ? (travelStyleMap[primaryStyle] || 'mix') : null,
      interests: preferences.interests || [],
      budget_level: budgetLevelMap[preferences.spendingStyle] || 3,
      typical_travel_with: preferences.defaultCompanionType || null,
    };
  }
  
  /**
   * Invalidate homepage cache after preference change
   */
  async invalidateHomepageCache(userId: string): Promise<void> {
    try {
      // Call the homepage edge function with refresh flag
      await supabase.functions.invoke('homepage', {
        body: { user_id: userId, refresh: true },
      });
    } catch (error) {
      if (__DEV__) console.warn('Failed to invalidate homepage cache:', error);
    }
  }
  
  /**
   * Update preferences and invalidate cache
   */
  async updatePreferencesWithCacheInvalidation(
    userId: string,
    updates: UpdateTravelPreferencesPayload
  ): Promise<{ data: TravelPreferences | null; error: any }> {
    const result = await this.updatePreferences(userId, updates);
    
    if (result.data && !result.error) {
      // Fire and forget cache invalidation
      this.invalidateHomepageCache(userId).catch(() => {});
    }
    
    return result;
  }
  
  /**
   * Check if user has completed preferences setup
   */
  async hasCompletedPreferences(userId: string): Promise<boolean> {
    const { data } = await this.getPreferences(userId);
    return data?.preferencesCompleted ?? false;
  }
  
  /**
   * Get preferences summary for display
   */
  getPreferencesSummary(preferences: TravelPreferences): {
    travelStyle: string;
    budget: string;
    interests: string;
    accommodation: string;
    transportation: string;
  } {
    const companion = PREFERENCE_OPTIONS.companionTypes.find(c => c.id === preferences.defaultCompanionType);
    const styles = preferences.preferredTripStyles.slice(0, 2).map(s => 
      PREFERENCE_OPTIONS.tripStyles.find(ts => ts.id === s)?.label
    ).filter(Boolean).join(', ');
    
    const currency = PREFERENCE_OPTIONS.currencies.find(c => c.code === preferences.defaultCurrency);
    const spendingLabel = PREFERENCE_OPTIONS.spendingStyles.find(s => s.id === preferences.spendingStyle)?.label;
    
    const interestLabels = preferences.interests.slice(0, 3).map(i =>
      PREFERENCE_OPTIONS.interests.find(int => int.id === i)?.label
    ).filter(Boolean).join(', ');
    
    const accomLabel = PREFERENCE_OPTIONS.accommodationTypes.find(a => a.id === preferences.accommodationType)?.label;
    const transportLabel = PREFERENCE_OPTIONS.travelModes.find(t => t.id === preferences.preferredTravelMode)?.label;
    
    return {
      travelStyle: companion ? `${companion.label}${styles ? ` • ${styles}` : ''}` : 'Not set',
      budget: `${currency?.symbol || '$'}${preferences.defaultBudgetAmount.toLocaleString()} • ${spendingLabel || 'Mid-Range'}`,
      interests: interestLabels || 'Not set',
      accommodation: `${accomLabel || 'Hotel'} • ${preferences.minStarRating}+ stars`,
      transportation: transportLabel || 'Flight',
    };
  }
}

export const preferencesService = new PreferencesService();
