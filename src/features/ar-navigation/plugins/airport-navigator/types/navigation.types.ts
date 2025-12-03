/**
 * NAVIGATION TYPES
 * 
 * Type definitions for airport navigation.
 */

export type DestinationType = 'gate' | 'baggage' | 'restroom' | 'food' | 'exit' | 'checkin' | 'security';

export type NavigationDirection = 'straight' | 'left' | 'right' | 'upstairs' | 'downstairs' | 'slight_left' | 'slight_right';

export interface NavigationStep {
  id: string;
  instruction: string; // "Turn right", "Go upstairs"
  distance: number; // meters to this step
  direction: NavigationDirection;
  poi?: string; // "Gate 23D", "Restroom", etc.
  floor?: number; // Floor level
}

export interface NavigationRoute {
  destination: string;
  destinationType: DestinationType;
  totalDistance: number; // meters
  estimatedTime: number; // minutes
  currentStep: number;
  totalSteps: number;
  steps: NavigationStep[];
  arrivalTime?: string; // HH:MM format
  flightNumber?: string;
}

export interface DestinationInput {
  type: 'gate' | 'flight' | 'poi';
  value: string; // Gate number, flight number, or POI name
}

export interface QuickDestination {
  id: string;
  name: string;
  icon: string;
  type: DestinationType;
}
