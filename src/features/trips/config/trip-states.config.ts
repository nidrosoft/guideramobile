/**
 * TRIP STATE MACHINE CONFIGURATION
 * Defines valid state transitions and state-specific behaviors
 */

import { TripState } from '../types/trip.types';

// Valid state transitions
export const TRIP_STATE_TRANSITIONS: Record<TripState, TripState[]> = {
  [TripState.DRAFT]: [TripState.UPCOMING, TripState.CANCELLED],
  [TripState.UPCOMING]: [TripState.ONGOING, TripState.CANCELLED],
  [TripState.ONGOING]: [TripState.PAST, TripState.CANCELLED],
  [TripState.PAST]: [], // No transitions from past
  [TripState.CANCELLED]: [], // No transitions from cancelled
};

// State display configuration
export const TRIP_STATE_CONFIG = {
  [TripState.DRAFT]: {
    label: 'Draft',
    color: '#9CA3AF',
    icon: 'edit',
    description: 'Trip is being planned',
  },
  [TripState.UPCOMING]: {
    label: 'Upcoming',
    color: '#3B82F6',
    icon: 'calendar',
    description: 'Trip is scheduled',
  },
  [TripState.ONGOING]: {
    label: 'Ongoing',
    color: '#10B981',
    icon: 'navigation',
    description: 'Trip is in progress',
  },
  [TripState.PAST]: {
    label: 'Past',
    color: '#6B7280',
    icon: 'archive',
    description: 'Trip is completed',
  },
  [TripState.CANCELLED]: {
    label: 'Cancelled',
    color: '#EF4444',
    icon: 'x-circle',
    description: 'Trip was cancelled',
  },
};

// Check if state transition is valid
export function canTransitionTo(from: TripState, to: TripState): boolean {
  return TRIP_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

// Get next possible states
export function getNextStates(currentState: TripState): TripState[] {
  return TRIP_STATE_TRANSITIONS[currentState] || [];
}

// Auto-transition based on dates
export function getAutoState(startDate: Date, endDate: Date): TripState {
  const now = new Date();
  
  if (now < startDate) {
    return TripState.UPCOMING;
  } else if (now >= startDate && now <= endDate) {
    return TripState.ONGOING;
  } else {
    return TripState.PAST;
  }
}
