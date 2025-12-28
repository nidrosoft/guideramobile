/**
 * PLANNING CONFIGURATION
 * Constants and configuration for trip planning
 */

import { 
  TripStyleOption, 
  CompanionOption, 
  PlanningStep,
  TripStyle,
  CompanionType,
  InterestOption,
  InterestCategory,
  TripTypeOption,
  AdvancedTripType,
  AmenityOption,
} from '../types/planning.types';

// Trip Style Options
export const TRIP_STYLES: TripStyleOption[] = [
  { id: 'relaxation', label: 'Relaxation', emoji: '🏖️', description: 'Unwind and recharge' },
  { id: 'culture', label: 'Culture', emoji: '🏛️', description: 'History & heritage' },
  { id: 'foodie', label: 'Foodie', emoji: '🍽️', description: 'Culinary adventures' },
  { id: 'adventure', label: 'Adventure', emoji: '🥾', description: 'Thrills & excitement' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', description: 'Retail therapy' },
  { id: 'family', label: 'Family Fun', emoji: '👨‍👩‍👧‍👦', description: 'Kid-friendly activities' },
  { id: 'romantic', label: 'Romantic', emoji: '💑', description: 'Couples getaway' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🎭', description: 'Bars & entertainment' },
  { id: 'nature', label: 'Nature', emoji: '🌿', description: 'Outdoor exploration' },
  { id: 'wellness', label: 'Wellness', emoji: '💆', description: 'Spa & self-care' },
];

// Companion Options
export const COMPANION_OPTIONS: CompanionOption[] = [
  { id: 'solo', label: 'Solo', emoji: '🧑', description: 'Just me' },
  { id: 'couple', label: 'Couple', emoji: '💑', description: 'With partner' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦', description: 'With kids' },
  { id: 'friends', label: 'Friends', emoji: '👯', description: 'Friend group' },
  { id: 'group', label: 'Group', emoji: '👥', description: 'Large group' },
];

// Duration Presets
export const DURATION_PRESETS = [
  { id: 'weekend', label: 'Weekend', days: 3, description: 'Fri-Sun' },
  { id: '1week', label: '1 Week', days: 7, description: '7 days' },
  { id: '2weeks', label: '2 Weeks', days: 14, description: '14 days' },
];

// Quick Trip Steps
export const QUICK_TRIP_STEPS: PlanningStep[] = [
  { id: 'destination', title: 'Destination', subtitle: 'Where to?' },
  { id: 'dates', title: 'Dates', subtitle: 'When?' },
  { id: 'style', title: 'Trip Style', subtitle: 'Your vibe' },
  { id: 'generating', title: 'Creating', subtitle: 'AI magic' },
  { id: 'review', title: 'Your Trip', subtitle: 'Review & save' },
];

// Popular Destinations
export const POPULAR_DESTINATIONS = [
  { id: '1', name: 'Paris', code: 'PAR', country: 'France', countryCode: 'FR', type: 'city' as const, emoji: '🇫🇷' },
  { id: '2', name: 'Tokyo', code: 'TYO', country: 'Japan', countryCode: 'JP', type: 'city' as const, emoji: '🇯🇵' },
  { id: '3', name: 'New York', code: 'NYC', country: 'USA', countryCode: 'US', type: 'city' as const, emoji: '🇺🇸' },
  { id: '4', name: 'London', code: 'LON', country: 'UK', countryCode: 'GB', type: 'city' as const, emoji: '🇬🇧' },
  { id: '5', name: 'Dubai', code: 'DXB', country: 'UAE', countryCode: 'AE', type: 'city' as const, emoji: '🇦🇪' },
  { id: '6', name: 'Barcelona', code: 'BCN', country: 'Spain', countryCode: 'ES', type: 'city' as const, emoji: '🇪🇸' },
  { id: '7', name: 'Rome', code: 'ROM', country: 'Italy', countryCode: 'IT', type: 'city' as const, emoji: '🇮🇹' },
  { id: '8', name: 'Bali', code: 'DPS', country: 'Indonesia', countryCode: 'ID', type: 'city' as const, emoji: '🇮🇩' },
  { id: '9', name: 'Sydney', code: 'SYD', country: 'Australia', countryCode: 'AU', type: 'city' as const, emoji: '🇦🇺' },
  { id: '10', name: 'Singapore', code: 'SIN', country: 'Singapore', countryCode: 'SG', type: 'city' as const, emoji: '🇸🇬' },
];

// Max trip styles user can select
export const MAX_TRIP_STYLES = 4;

// Default traveler count
export const DEFAULT_TRAVELERS = {
  adults: 1,
  children: 0,
  infants: 0,
};

// AI Generation messages
export const AI_GENERATION_MESSAGES = [
  'Analyzing your destination...',
  'Finding the best experiences...',
  'Checking local events...',
  'Curating activities for you...',
  'Optimizing your itinerary...',
  'Adding local tips...',
  'Finalizing your trip plan...',
];

// ============================================
// ADVANCED TRIP CONFIGURATION
// ============================================

// Advanced Trip Steps
export const ADVANCED_TRIP_STEPS: PlanningStep[] = [
  { id: 'tripType', title: 'Trip Type', subtitle: 'How are you traveling?' },
  { id: 'destinations', title: 'Destinations', subtitle: 'Where to?' },
  { id: 'dates', title: 'Dates', subtitle: 'When?' },
  { id: 'travelers', title: 'Travelers', subtitle: 'Who\'s going?' },
  { id: 'budget', title: 'Budget', subtitle: 'Your spending' },
  { id: 'interests', title: 'Interests', subtitle: 'What you love' },
  { id: 'accommodation', title: 'Stay', subtitle: 'Where to sleep', optional: true },
  { id: 'transportation', title: 'Transport', subtitle: 'Getting around', optional: true },
  { id: 'bookings', title: 'Bookings', subtitle: 'Add now', optional: true },
  { id: 'review', title: 'Review', subtitle: 'Your trip' },
];

// Trip Type Options
export const TRIP_TYPE_OPTIONS: TripTypeOption[] = [
  { 
    id: 'roundtrip', 
    label: 'Round Trip', 
    description: 'Return to your starting point',
    icon: '🔄'
  },
  { 
    id: 'oneway', 
    label: 'One Way', 
    description: 'Travel to a single destination',
    icon: '➡️'
  },
  { 
    id: 'multicity', 
    label: 'Multi-City', 
    description: 'Visit multiple destinations',
    icon: '🗺️'
  },
];

// Interest Options (for Advanced Trip)
export const INTEREST_OPTIONS: InterestOption[] = [
  { id: 'museums', label: 'Museums', emoji: '🏛️', description: 'Art & history' },
  { id: 'nature', label: 'Nature', emoji: '🌿', description: 'Outdoor exploration' },
  { id: 'art', label: 'Art', emoji: '🎨', description: 'Galleries & exhibits' },
  { id: 'food', label: 'Food', emoji: '🍜', description: 'Culinary experiences' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🎭', description: 'Bars & clubs' },
  { id: 'sports', label: 'Sports', emoji: '🏃', description: 'Active adventures' },
  { id: 'photography', label: 'Photos', emoji: '📸', description: 'Scenic spots' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', description: 'Markets & malls' },
  { id: 'wellness', label: 'Wellness', emoji: '💆', description: 'Spa & relaxation' },
  { id: 'beach', label: 'Beach', emoji: '🏖️', description: 'Sun & sand' },
  { id: 'adventure', label: 'Adventure', emoji: '🎢', description: 'Thrills & excitement' },
  { id: 'music', label: 'Music', emoji: '🎵', description: 'Concerts & shows' },
];

// Spending Style Options
export const SPENDING_STYLE_OPTIONS = [
  { id: 'budget', label: 'Budget', emoji: '💰', description: 'Save where you can' },
  { id: 'midrange', label: 'Mid-Range', emoji: '💰💰', description: 'Balanced spending' },
  { id: 'luxury', label: 'Luxury', emoji: '💰💰💰', description: 'Treat yourself' },
];

// Budget Priority Options
export const BUDGET_PRIORITY_OPTIONS = [
  { id: 'accommodation', label: 'Accommodation', description: 'Prioritize where you stay' },
  { id: 'experiences', label: 'Experiences', description: 'Focus on activities' },
  { id: 'food', label: 'Food & Dining', description: 'Culinary adventures' },
  { id: 'balanced', label: 'Balanced', description: 'Spread evenly' },
];

// Trip Pace Options
export const TRIP_PACE_OPTIONS = [
  { id: 'relaxed', label: 'Relaxed', description: '2-3 activities/day', emoji: '🐢' },
  { id: 'moderate', label: 'Moderate', description: '3-4 activities/day', emoji: '🚶' },
  { id: 'packed', label: 'Packed', description: '5+ activities/day', emoji: '🏃' },
];

// Time Preference Options
export const TIME_PREFERENCE_OPTIONS = [
  { id: 'early', label: 'Early Bird', emoji: '🌅', description: 'Start days early' },
  { id: 'flexible', label: 'Flexible', emoji: '⏰', description: 'Go with the flow' },
  { id: 'night', label: 'Night Owl', emoji: '🌙', description: 'Late starts, late nights' },
];

// Accommodation Type Options
export const ACCOMMODATION_TYPE_OPTIONS = [
  { id: 'hotel', label: 'Hotel', emoji: '🏨', description: 'Traditional hotels' },
  { id: 'airbnb', label: 'Airbnb', emoji: '🏠', description: 'Home rentals' },
  { id: 'resort', label: 'Resort', emoji: '🏩', description: 'All-inclusive' },
  { id: 'hostel', label: 'Hostel', emoji: '🛏️', description: 'Budget-friendly' },
  { id: 'mix', label: 'Mix', emoji: '🎲', description: 'Variety of stays' },
];

// Star Rating Options
export const STAR_RATING_OPTIONS = [
  { value: 3, label: '3-Star' },
  { value: 4, label: '4-Star' },
  { value: 5, label: '5-Star' },
];

// Location Priority Options
export const LOCATION_PRIORITY_OPTIONS = [
  { id: 'city_center', label: 'City Center', description: 'Heart of the action' },
  { id: 'near_attractions', label: 'Near Attractions', description: 'Close to sights' },
  { id: 'quiet', label: 'Quiet Area', description: 'Peaceful neighborhood' },
  { id: 'near_transport', label: 'Near Transport', description: 'Easy connections' },
];

// Amenity Options
export const AMENITY_OPTIONS: AmenityOption[] = [
  { id: 'wifi', label: 'Free WiFi', icon: '📶' },
  { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { id: 'pool', label: 'Pool', icon: '🏊' },
  { id: 'gym', label: 'Gym', icon: '💪' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'parking', label: 'Parking', icon: '🅿️' },
  { id: 'spa', label: 'Spa', icon: '💆' },
  { id: 'ac', label: 'A/C', icon: '❄️' },
];

// Transport Mode Options
export const TRANSPORT_MODE_OPTIONS = [
  { id: 'flight', label: 'Flight', emoji: '✈️', description: 'Fly there' },
  { id: 'train', label: 'Train', emoji: '🚂', description: 'Rail travel' },
  { id: 'drive', label: 'Drive', emoji: '🚗', description: 'Road trip' },
];

// Flight Class Options
export const FLIGHT_CLASS_OPTIONS = [
  { id: 'economy', label: 'Economy' },
  { id: 'business', label: 'Business' },
  { id: 'first', label: 'First' },
];

// Flight Stops Options
export const FLIGHT_STOPS_OPTIONS = [
  { id: 'direct', label: 'Direct' },
  { id: '1stop', label: '1 Stop' },
  { id: 'any', label: 'Any' },
];

// Flight Time Options
export const FLIGHT_TIME_OPTIONS = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'any', label: 'Any' },
];

// Local Transport Options
export const LOCAL_TRANSPORT_OPTIONS = [
  { id: 'public', label: 'Public', emoji: '🚇', description: 'Buses & trains' },
  { id: 'rental', label: 'Rental Car', emoji: '🚗', description: 'Drive yourself' },
  { id: 'rideshare', label: 'Rideshare', emoji: '🚕', description: 'Uber/Lyft' },
  { id: 'walking', label: 'Walking', emoji: '🚶', description: 'On foot' },
  { id: 'mix', label: 'Mix', emoji: '🎲', description: 'Combination' },
];

// Date Flexibility Options
export const DATE_FLEXIBILITY_OPTIONS = [
  { id: 'exact', label: 'Exact dates only', description: 'No flexibility' },
  { id: '3days', label: 'Flexible ±3 days', description: 'Better deals' },
  { id: '1week', label: 'Flexible ±1 week', description: 'Best deals' },
];

// Dietary Restriction Options
export const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Halal',
  'Kosher',
  'Gluten-Free',
  'Dairy-Free',
  'Nut Allergy',
  'Seafood Allergy',
];

// Currency Options
export const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
];

// Default Advanced Trip Data
export const DEFAULT_ADVANCED_TRIP_DATA = {
  tripType: 'roundtrip' as AdvancedTripType,
  origin: null,
  destinations: [{ location: null, nights: 3 }],
  departureDate: null,
  returnDate: null,
  flexibility: 'exact' as const,
  blackoutDates: [],
  travelers: {
    adults: 1,
    children: [],
    infants: 0,
  },
  specialRequirements: {
    wheelchairAccessible: false,
    travelingWithPet: false,
    dietaryRestrictions: [],
  },
  budget: {
    amount: 3000,
    currency: 'USD',
  },
  spendingStyle: 'midrange' as const,
  budgetPriority: 'balanced' as const,
  interests: [],
  pace: 'moderate' as const,
  timePreference: 'flexible' as const,
  accommodation: {
    type: 'hotel' as const,
    starRating: [4],
    locationPriority: 'near_attractions' as const,
    amenities: ['wifi'],
  },
  skipAccommodation: false,
  transportation: {
    gettingThere: 'flight' as const,
    flightPreferences: {
      class: 'economy' as const,
      stops: 'direct' as const,
      timePreference: 'any' as const,
    },
    gettingAround: 'mix' as const,
  },
  skipTransportation: false,
  linkedBookings: {
    flightIds: [],
    hotelIds: [],
    carIds: [],
    experienceIds: [],
  },
};

// Max interests user can select
export const MAX_INTERESTS = 5;

// Min interests user must select
export const MIN_INTERESTS = 3;
