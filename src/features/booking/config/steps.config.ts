/**
 * STEPS CONFIG
 * 
 * Step definitions for each booking flow.
 */

import { StepConfig } from '../types/booking.types';

// ============================================
// FLIGHT BOOKING STEPS
// ============================================

export const FLIGHT_BOOKING_STEPS: StepConfig[] = [
  {
    id: 'search',
    title: 'Search',
    subtitle: 'Find your flight',
    icon: 'search',
  },
  {
    id: 'results',
    title: 'Flights',
    subtitle: 'Choose your flight',
    icon: 'airplane',
  },
  {
    id: 'detail',
    title: 'Details',
    subtitle: 'Review flight',
    icon: 'document',
  },
  {
    id: 'seats',
    title: 'Seats',
    subtitle: 'Select your seat',
    icon: 'grid',
    optional: true,
  },
  {
    id: 'extras',
    title: 'Extras',
    subtitle: 'Add baggage & meals',
    icon: 'bag',
    optional: true,
  },
  {
    id: 'travelers',
    title: 'Travelers',
    subtitle: 'Passenger details',
    icon: 'people',
  },
  {
    id: 'payment',
    title: 'Payment',
    subtitle: 'Complete booking',
    icon: 'card',
  },
  {
    id: 'confirmation',
    title: 'Done',
    subtitle: 'Booking confirmed',
    icon: 'check',
  },
];

// ============================================
// HOTEL BOOKING STEPS
// ============================================

export const HOTEL_BOOKING_STEPS: StepConfig[] = [
  {
    id: 'search',
    title: 'Search',
    subtitle: 'Find your hotel',
    icon: 'search',
  },
  {
    id: 'results',
    title: 'Hotels',
    subtitle: 'Browse options',
    icon: 'building',
  },
  {
    id: 'detail',
    title: 'Hotel',
    subtitle: 'View details',
    icon: 'info',
  },
  {
    id: 'rooms',
    title: 'Rooms',
    subtitle: 'Choose your room',
    icon: 'bed',
  },
  {
    id: 'guests',
    title: 'Guests',
    subtitle: 'Guest details',
    icon: 'people',
  },
  {
    id: 'payment',
    title: 'Payment',
    subtitle: 'Complete booking',
    icon: 'card',
  },
  {
    id: 'confirmation',
    title: 'Done',
    subtitle: 'Booking confirmed',
    icon: 'check',
  },
];

// ============================================
// CAR RENTAL STEPS
// ============================================

export const CAR_RENTAL_STEPS: StepConfig[] = [
  {
    id: 'search',
    title: 'Search',
    subtitle: 'Find your car',
    icon: 'search',
  },
  {
    id: 'results',
    title: 'Cars',
    subtitle: 'Browse options',
    icon: 'car',
  },
  {
    id: 'detail',
    title: 'Car',
    subtitle: 'View details',
    icon: 'info',
  },
  {
    id: 'extras',
    title: 'Extras',
    subtitle: 'Insurance & add-ons',
    icon: 'shield',
    optional: true,
  },
  {
    id: 'driver',
    title: 'Driver',
    subtitle: 'Driver details',
    icon: 'user',
  },
  {
    id: 'payment',
    title: 'Payment',
    subtitle: 'Complete booking',
    icon: 'card',
  },
  {
    id: 'confirmation',
    title: 'Done',
    subtitle: 'Booking confirmed',
    icon: 'check',
  },
];

// ============================================
// EXPERIENCE BOOKING STEPS
// ============================================

export const EXPERIENCE_BOOKING_STEPS: StepConfig[] = [
  {
    id: 'search',
    title: 'Search',
    subtitle: 'Find experiences',
    icon: 'search',
  },
  {
    id: 'results',
    title: 'Experiences',
    subtitle: 'Browse options',
    icon: 'activity',
  },
  {
    id: 'detail',
    title: 'Details',
    subtitle: 'View experience',
    icon: 'info',
  },
  {
    id: 'options',
    title: 'Options',
    subtitle: 'Date & guests',
    icon: 'calendar',
  },
  {
    id: 'payment',
    title: 'Payment',
    subtitle: 'Complete booking',
    icon: 'card',
  },
  {
    id: 'confirmation',
    title: 'Done',
    subtitle: 'Booking confirmed',
    icon: 'check',
  },
];

// ============================================
// PACKAGE BOOKING STEPS
// ============================================

export const PACKAGE_BOOKING_STEPS: StepConfig[] = [
  {
    id: 'setup',
    title: 'Trip Setup',
    subtitle: 'Where & when',
    icon: 'location',
  },
  {
    id: 'builder',
    title: 'Build Package',
    subtitle: 'Select your bundle',
    icon: 'package',
  },
  {
    id: 'review',
    title: 'Review',
    subtitle: 'Review selections',
    icon: 'document',
  },
  {
    id: 'travelers',
    title: 'Travelers',
    subtitle: 'Traveler details',
    icon: 'people',
  },
  {
    id: 'extras',
    title: 'Extras',
    subtitle: 'Add-ons & insurance',
    icon: 'shield',
    optional: true,
  },
  {
    id: 'payment',
    title: 'Payment',
    subtitle: 'Complete booking',
    icon: 'card',
  },
  {
    id: 'confirmation',
    title: 'Done',
    subtitle: 'Booking confirmed',
    icon: 'check',
  },
];

// ============================================
// STEP HELPERS
// ============================================

export const getStepIndex = (steps: StepConfig[], stepId: string): number => {
  return steps.findIndex(step => step.id === stepId);
};

export const getStepById = (steps: StepConfig[], stepId: string): StepConfig | undefined => {
  return steps.find(step => step.id === stepId);
};

export const getNextStep = (steps: StepConfig[], currentStepId: string): StepConfig | undefined => {
  const currentIndex = getStepIndex(steps, currentStepId);
  return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : undefined;
};

export const getPreviousStep = (steps: StepConfig[], currentStepId: string): StepConfig | undefined => {
  const currentIndex = getStepIndex(steps, currentStepId);
  return currentIndex > 0 ? steps[currentIndex - 1] : undefined;
};

export const isFirstStep = (steps: StepConfig[], stepId: string): boolean => {
  return getStepIndex(steps, stepId) === 0;
};

export const isLastStep = (steps: StepConfig[], stepId: string): boolean => {
  return getStepIndex(steps, stepId) === steps.length - 1;
};

export const getProgress = (steps: StepConfig[], stepId: string): number => {
  const index = getStepIndex(steps, stepId);
  return ((index + 1) / steps.length) * 100;
};
