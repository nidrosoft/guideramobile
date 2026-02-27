/**
 * USE TRAVEL PREFERENCES HOOK
 * 
 * Hook to load and apply user's saved travel preferences to trip planning.
 * Provides pre-filled values and methods to check if preferences exist.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  preferencesService, 
  TravelPreferences,
  DEFAULT_PREFERENCES,
} from '@/services/preferences.service';

interface UseTravelPreferencesReturn {
  preferences: TravelPreferences | null;
  isLoading: boolean;
  hasCompletedSetup: boolean;
  refetch: () => Promise<void>;
  
  // Quick access to common preferences
  defaultCompanion: TravelPreferences['defaultCompanionType'];
  defaultTripStyles: TravelPreferences['preferredTripStyles'];
  defaultPace: TravelPreferences['defaultTripPace'];
  defaultBudget: {
    amount: number;
    currency: TravelPreferences['defaultCurrency'];
    style: TravelPreferences['spendingStyle'];
    priority: TravelPreferences['budgetPriority'];
  };
  defaultInterests: TravelPreferences['interests'];
  defaultAccommodation: {
    type: TravelPreferences['accommodationType'];
    starRating: number;
    locationPriority: TravelPreferences['locationPriority'];
    amenities: TravelPreferences['preferredAmenities'];
  };
  defaultTransportation: {
    mode: TravelPreferences['preferredTravelMode'];
    flightClass: TravelPreferences['flightClass'];
    flightStops: TravelPreferences['flightStops'];
    flightTime: TravelPreferences['flightTimePreference'];
    localTransport: TravelPreferences['localTransport'];
  };
  defaultTravelers: {
    adults: number;
    children: number;
    infants: number;
  };
  accessibility: {
    dietary: TravelPreferences['dietaryRestrictions'];
    wheelchair: boolean;
    pet: boolean;
  };
}

export function useTravelPreferences(): UseTravelPreferencesReturn {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const { data } = await preferencesService.getPreferences(user.id);
      setPreferences(data);
    } catch (error) {
      console.error('Error fetching travel preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Derive values from preferences or use defaults
  const prefs = preferences || null;
  
  return {
    preferences: prefs,
    isLoading,
    hasCompletedSetup: prefs?.preferencesCompleted ?? false,
    refetch: fetchPreferences,
    
    // Quick access properties
    defaultCompanion: prefs?.defaultCompanionType ?? null,
    defaultTripStyles: prefs?.preferredTripStyles ?? [],
    defaultPace: prefs?.defaultTripPace ?? 'moderate',
    
    defaultBudget: {
      amount: prefs?.defaultBudgetAmount ?? DEFAULT_PREFERENCES.defaultBudgetAmount,
      currency: prefs?.defaultCurrency ?? DEFAULT_PREFERENCES.defaultCurrency,
      style: prefs?.spendingStyle ?? DEFAULT_PREFERENCES.spendingStyle,
      priority: prefs?.budgetPriority ?? DEFAULT_PREFERENCES.budgetPriority,
    },
    
    defaultInterests: prefs?.interests ?? [],
    
    defaultAccommodation: {
      type: prefs?.accommodationType ?? DEFAULT_PREFERENCES.accommodationType,
      starRating: prefs?.minStarRating ?? DEFAULT_PREFERENCES.minStarRating,
      locationPriority: prefs?.locationPriority ?? DEFAULT_PREFERENCES.locationPriority,
      amenities: prefs?.preferredAmenities ?? DEFAULT_PREFERENCES.preferredAmenities,
    },
    
    defaultTransportation: {
      mode: prefs?.preferredTravelMode ?? DEFAULT_PREFERENCES.preferredTravelMode,
      flightClass: prefs?.flightClass ?? DEFAULT_PREFERENCES.flightClass,
      flightStops: prefs?.flightStops ?? DEFAULT_PREFERENCES.flightStops,
      flightTime: prefs?.flightTimePreference ?? DEFAULT_PREFERENCES.flightTimePreference,
      localTransport: prefs?.localTransport ?? DEFAULT_PREFERENCES.localTransport,
    },
    
    defaultTravelers: {
      adults: prefs?.defaultAdults ?? DEFAULT_PREFERENCES.defaultAdults,
      children: prefs?.defaultChildren ?? DEFAULT_PREFERENCES.defaultChildren,
      infants: prefs?.defaultInfants ?? DEFAULT_PREFERENCES.defaultInfants,
    },
    
    accessibility: {
      dietary: prefs?.dietaryRestrictions ?? [],
      wheelchair: prefs?.wheelchairAccessible ?? false,
      pet: prefs?.travelingWithPet ?? false,
    },
  };
}

/**
 * Helper to check if user has meaningful preferences set
 */
export function hasUserPreferences(preferences: TravelPreferences | null): boolean {
  if (!preferences) return false;
  
  // Check if user has set at least some preferences
  return (
    preferences.defaultCompanionType !== null ||
    (preferences.preferredTripStyles?.length ?? 0) > 0 ||
    (preferences.interests?.length ?? 0) >= 3
  );
}

/**
 * Get a summary string of user's preferences for display
 */
export function getPreferencesSummaryText(preferences: TravelPreferences | null): string {
  if (!preferences || !hasUserPreferences(preferences)) {
    return 'No preferences set';
  }
  
  const parts: string[] = [];
  
  if (preferences.defaultCompanionType) {
    const companionLabels: Record<string, string> = {
      solo: 'Solo',
      couple: 'Couple',
      family: 'Family',
      friends: 'Friends',
      group: 'Group',
    };
    parts.push(companionLabels[preferences.defaultCompanionType] || preferences.defaultCompanionType);
  }
  
  if (preferences.preferredTripStyles?.length > 0) {
    const styleLabels: Record<string, string> = {
      relaxation: 'Relaxation',
      culture: 'Culture',
      foodie: 'Foodie',
      adventure: 'Adventure',
    };
    const styles = preferences.preferredTripStyles
      .slice(0, 2)
      .map(s => styleLabels[s] || s)
      .join(', ');
    parts.push(styles);
  }
  
  return parts.join(' • ') || 'Preferences set';
}
