/**
 * PLANNING CONFIGURATION
 * Constants and configuration for trip planning
 */

import { 
  TripStyleOption, 
  CompanionOption, 
  PlanningStep,
  TripStyle,
  CompanionType 
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
