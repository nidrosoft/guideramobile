/**
 * DO'S & DON'TS PLUGIN - TYPE DEFINITIONS
 * 
 * This plugin provides context-aware cultural guidance that evolves throughout the trip.
 * AI will use these types to generate and categorize tips based on:
 * - Destination (country/city)
 * - Current location (GPS during trip)
 * - Time (pre-trip, during, post-trip)
 * - Activity type (from Planner plugin)
 * - User behavior (search, bookings, expenses)
 */

export enum ContextType {
  DESTINATION = 'destination',      // Country/City level - AI: Use trip.destination
  LOCATION = 'location',            // Specific place - AI: Use GPS + Google Places API
  ACTIVITY = 'activity',            // What they're doing - AI: Use Planner plugin data
  TIME_BASED = 'time_based',        // Pre-trip, during trip - AI: Compare current date with trip dates
}

export enum CategoryType {
  CULTURAL_ETIQUETTE = 'cultural_etiquette',
  DINING_FOOD = 'dining_food',
  SAFETY = 'safety',
  DRESS_CODE = 'dress_code',
  TRANSPORTATION = 'transportation',
  COMMUNICATION = 'communication',
  PHOTOGRAPHY = 'photography',
  RELIGIOUS_CUSTOMS = 'religious_customs',
  TIPPING = 'tipping',
  BUSINESS_ETIQUETTE = 'business_etiquette',
  TABOOS = 'taboos',                      // Cultural taboos and sensitive topics
  LGBTQ = 'lgbtq',                        // LGBTQ+ travel safety and considerations
  ALCOHOL_DRUGS = 'alcohol_drugs',        // Alcohol and substance regulations
  GESTURES = 'gestures',                  // Hand gestures and body language
  GREETINGS = 'greetings',                // Proper greetings and introductions
  SHOPPING = 'shopping',                  // Shopping, bargaining, and markets
  HEALTH = 'health',                      // Health, medical, and hygiene
  EMERGENCY = 'emergency',                // Emergency contacts and procedures
}

export enum ImportanceLevel {
  CRITICAL = 'critical',    // Legal/Safety - Must know
  IMPORTANT = 'important',  // Cultural etiquette - Should know
  HELPFUL = 'helpful',      // Tips & tricks - Nice to know
}

export enum TripPhase {
  PRE_TRIP = 'pre_trip',       // Before departure - AI: Show preparation tips
  DURING_TRIP = 'during_trip', // At destination - AI: Show active tips
  POST_TRIP = 'post_trip',     // After return - AI: Show reflection/review tips
}

export interface SmartTip {
  id: string;
  category: CategoryType;
  context: ContextType;
  
  // AI Context Detection Fields
  location?: string;           // "Dubai", "Burj Khalifa", "Jumeirah Mosque"
  nearbyRadius?: number;       // Meters - AI: Show tip when within this radius
  
  isDo: boolean;              // true = Do, false = Don't
  title: string;
  description: string;
  importance: ImportanceLevel;
  icon: string;               // Emoji or icon name
  
  // AI Activation Rules
  activeWhen: {
    tripPhase: TripPhase[];
    timeOfDay?: ('morning' | 'afternoon' | 'evening' | 'night')[];
    nearLocation?: string;    // AI: Trigger when GPS near this place
    activityType?: string;    // AI: Trigger when user has this activity planned
    weatherCondition?: string; // AI: Trigger based on weather
  };
  
  // AI Learning Fields
  userEngagement?: {
    views: number;
    bookmarked: boolean;
    markedAsRead: boolean;
    sharedCount: number;
  };
  
  // Related content
  relatedTips?: string[];     // IDs of related tips
  sources?: string[];         // URLs or references
  lastUpdated: Date;
  
  // AI Personalization
  relevanceScore?: number;    // AI: Calculate based on user profile and context
  personalizedFor?: {
    travelStyle?: 'business' | 'leisure' | 'adventure' | 'family';
    ageGroup?: 'young_adult' | 'adult' | 'senior' | 'family_with_kids';
    interests?: string[];
  };
}

export interface CategoryInfo {
  id: CategoryType;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface TipStats {
  totalDos: number;
  totalDonts: number;
  criticalCount: number;
  readCount: number;
  bookmarkedCount: number;
}

/**
 * AI IMPLEMENTATION NOTES:
 * 
 * 1. CONTEXT DETECTION:
 *    - Use trip.destination for country/city level tips
 *    - Use GPS coordinates during trip for location-based tips
 *    - Compare current date with trip dates for trip phase
 *    - Monitor Planner plugin for upcoming activities
 * 
 * 2. TIP GENERATION:
 *    - GPT-4: Generate tips based on destination + category
 *    - Include legal requirements, cultural norms, safety info
 *    - Update tips based on current events/news
 *    - Seasonal considerations (weather, holidays, events)
 * 
 * 3. SMART NOTIFICATIONS:
 *    - Pre-trip (7 days): Critical tips
 *    - Day before: Packing, customs, dress code
 *    - Upon arrival: Safety, transportation, currency
 *    - Location-based: When near specific places (mosque, restaurant, etc.)
 * 
 * 4. PERSONALIZATION:
 *    - Learn from user's trip style (business vs leisure)
 *    - Adapt to user's interests (from searches, bookings)
 *    - Consider user demographics (age, family status)
 *    - Track engagement (views, bookmarks, shares)
 * 
 * 5. DATA SOURCES:
 *    - Curated database of country-specific rules
 *    - GPT-4 for real-time, context-specific tips
 *    - Google Places API for location details
 *    - Weather API for weather-based tips
 *    - News API for current events/alerts
 */
