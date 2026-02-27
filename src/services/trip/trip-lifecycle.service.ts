/**
 * TRIP LIFECYCLE SERVICE
 * State machine and automatic transitions
 */

import { supabase } from '@/lib/supabase/client';
import { TripRepository } from './trip-repository';
import { Trip, TripStatus } from './trip.types';
import { TripNotFoundError, TripTransitionError } from './trip.errors';
import { daysUntilStart, daysUntilEnd } from './trip.utils';

// ============================================
// STATE MACHINE
// ============================================

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  draft: ['planning', 'confirmed', 'cancelled'],
  planning: ['draft', 'confirmed', 'cancelled'],
  confirmed: ['planning', 'upcoming', 'ongoing', 'cancelled'],
  upcoming: ['confirmed', 'ongoing', 'cancelled'],
  ongoing: ['completed'],
  completed: ['archived'],
  cancelled: [],
  archived: [],
};

/**
 * Check if transition is valid
 */
export function isValidTransition(from: TripStatus, to: TripStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

/**
 * Transition guards - conditions that must be met
 */
const TRANSITION_GUARDS: Partial<Record<TripStatus, (trip: Trip) => Promise<boolean>>> = {
  confirmed: async (trip: Trip) => {
    // Must have dates OR at least one booking
    return !!(trip.start_date && trip.end_date) || trip.booking_count > 0;
  },
  upcoming: async (trip: Trip) => {
    const days = daysUntilStart(trip);
    return days <= 30 && days > 0;
  },
  ongoing: async (trip: Trip) => {
    return daysUntilStart(trip) <= 0 && daysUntilEnd(trip) >= 0;
  },
  completed: async (trip: Trip) => {
    return daysUntilEnd(trip) < 0;
  },
};

/**
 * Side effects to run when entering a state
 */
const ON_ENTER_EFFECTS: Partial<Record<TripStatus, (trip: Trip) => Promise<void>>> = {
  confirmed: async (trip: Trip) => {
    // Update confirmed_at timestamp
    await TripRepository.update(trip.id, {
      confirmed_at: new Date().toISOString(),
    } as any);

    // Schedule module generation
    await scheduleModuleGeneration(trip.id);

    // Schedule notifications
    await scheduleConfirmationNotifications(trip);
  },

  upcoming: async (trip: Trip) => {
    // Refresh modules
    await scheduleModuleRefresh(trip.id);

    // Send pre-trip reminder
    await sendPreTripReminder(trip, 30);
  },

  ongoing: async (trip: Trip) => {
    // Update started_at timestamp
    await TripRepository.update(trip.id, {
      started_at: new Date().toISOString(),
    } as any);

    // Send trip started notification
    await sendTripStartedNotification(trip);
  },

  completed: async (trip: Trip) => {
    // Update completed_at timestamp
    await TripRepository.update(trip.id, {
      completed_at: new Date().toISOString(),
    } as any);

    // Send trip completed notification
    await sendTripCompletedNotification(trip);

    // Schedule review request
    await scheduleReviewRequest(trip.id);
  },

  cancelled: async (trip: Trip) => {
    // Update cancelled_at timestamp
    await TripRepository.update(trip.id, {
      cancelled_at: new Date().toISOString(),
    } as any);

    // Notify travelers
    await notifyTravelersTripCancelled(trip);
  },
};

// ============================================
// TRANSITION FUNCTIONS
// ============================================

/**
 * Transition trip to a new status
 */
export async function transitionTo(
  tripId: string,
  toStatus: TripStatus,
  triggeredBy: 'user' | 'automatic' | 'system' = 'user',
  reason?: string
): Promise<Trip> {
  const trip = await TripRepository.findById(tripId);
  if (!trip) {
    throw new TripNotFoundError(tripId);
  }

  const fromStatus = trip.status as TripStatus;

  // Check if transition is valid
  if (!isValidTransition(fromStatus, toStatus)) {
    throw new TripTransitionError(
      tripId,
      fromStatus,
      toStatus,
      `Cannot transition from ${fromStatus} to ${toStatus}`
    );
  }

  // Check guard conditions
  const guard = TRANSITION_GUARDS[toStatus];
  if (guard) {
    const canTransition = await guard(trip);
    if (!canTransition) {
      throw new TripTransitionError(
        tripId,
        fromStatus,
        toStatus,
        `Transition guard failed for ${toStatus}`
      );
    }
  }

  // Update status
  const updatedTrip = await TripRepository.update(tripId, {
    status: toStatus,
    previous_status: fromStatus,
    status_changed_at: new Date().toISOString(),
    status_change_reason: reason || `Transitioned by ${triggeredBy}`,
  } as any);

  // Log transition
  await logStatusTransition(tripId, fromStatus, toStatus, triggeredBy, reason);

  // Run side effects
  const onEnter = ON_ENTER_EFFECTS[toStatus];
  if (onEnter) {
    try {
      await onEnter(updatedTrip);
    } catch (error) {
      console.error(`Error running onEnter effect for ${toStatus}:`, error);
    }
  }

  return updatedTrip;
}

/**
 * Confirm a trip (draft/planning → confirmed)
 */
export async function confirmTrip(tripId: string, userId: string): Promise<Trip> {
  const trip = await TripRepository.findById(tripId);
  if (!trip) {
    throw new TripNotFoundError(tripId);
  }

  // Check if user can confirm
  if (trip.owner_id !== userId && trip.user_id !== userId) {
    throw new TripTransitionError(tripId, trip.status, 'confirmed', 'Only owner can confirm trip');
  }

  return transitionTo(tripId, 'confirmed', 'user', 'User confirmed trip');
}

/**
 * Cancel a trip
 */
export async function cancelTrip(tripId: string, userId: string, reason?: string): Promise<Trip> {
  const trip = await TripRepository.findById(tripId);
  if (!trip) {
    throw new TripNotFoundError(tripId);
  }

  // Check if user can cancel
  if (trip.owner_id !== userId && trip.user_id !== userId) {
    throw new TripTransitionError(tripId, trip.status, 'cancelled', 'Only owner can cancel trip');
  }

  // Cannot cancel ongoing or completed trips
  if (trip.status === 'ongoing' || trip.status === 'completed') {
    throw new TripTransitionError(
      tripId,
      trip.status,
      'cancelled',
      'Cannot cancel ongoing or completed trips'
    );
  }

  return transitionTo(tripId, 'cancelled', 'user', reason || 'User cancelled trip');
}

/**
 * Archive a completed trip
 */
export async function archiveTrip(tripId: string, userId: string): Promise<Trip> {
  const trip = await TripRepository.findById(tripId);
  if (!trip) {
    throw new TripNotFoundError(tripId);
  }

  if (trip.status !== 'completed') {
    throw new TripTransitionError(tripId, trip.status, 'archived', 'Only completed trips can be archived');
  }

  return transitionTo(tripId, 'archived', 'user', 'User archived trip');
}

// ============================================
// AUTOMATIC TRANSITIONS
// ============================================

/**
 * Process automatic transitions (called by scheduled job)
 */
export async function processAutomaticTransitions(): Promise<{
  upcoming: number;
  ongoing: number;
  completed: number;
}> {
  const results = { upcoming: 0, ongoing: 0, completed: 0 };

  // confirmed → upcoming (30 days before)
  const needUpcoming = await TripRepository.findTripsNeedingTransition('upcoming');
  for (const trip of needUpcoming) {
    try {
      await transitionTo(trip.id, 'upcoming', 'automatic', 'Auto-transition: 30 days before trip');
      results.upcoming++;
    } catch (error) {
      console.error(`Failed to transition trip ${trip.id} to upcoming:`, error);
    }
  }

  // confirmed/upcoming → ongoing (start date)
  const needOngoing = await TripRepository.findTripsNeedingTransition('ongoing');
  for (const trip of needOngoing) {
    try {
      await transitionTo(trip.id, 'ongoing', 'automatic', 'Auto-transition: trip started');
      results.ongoing++;
    } catch (error) {
      console.error(`Failed to transition trip ${trip.id} to ongoing:`, error);
    }
  }

  // ongoing → completed (end date)
  const needCompleted = await TripRepository.findTripsNeedingTransition('completed');
  for (const trip of needCompleted) {
    try {
      await transitionTo(trip.id, 'completed', 'automatic', 'Auto-transition: trip ended');
      results.completed++;
    } catch (error) {
      console.error(`Failed to transition trip ${trip.id} to completed:`, error);
    }
  }

  return results;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function logStatusTransition(
  tripId: string,
  fromStatus: string,
  toStatus: string,
  triggeredBy: string,
  reason?: string
): Promise<void> {
  try {
    await supabase.from('scheduled_jobs').insert({
      job_type: 'trip_status_log',
      job_data: {
        tripId,
        fromStatus,
        toStatus,
        triggeredBy,
        reason,
        timestamp: new Date().toISOString(),
      },
      scheduled_for: new Date().toISOString(),
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log status transition:', error);
  }
}

async function scheduleModuleGeneration(tripId: string): Promise<void> {
  try {
    await supabase.from('scheduled_jobs').insert({
      job_type: 'generate_trip_modules',
      job_data: { tripId },
      scheduled_for: new Date().toISOString(),
      status: 'pending',
    });
  } catch (error) {
    console.error('Failed to schedule module generation:', error);
  }
}

async function scheduleModuleRefresh(tripId: string): Promise<void> {
  try {
    await supabase.from('scheduled_jobs').insert({
      job_type: 'refresh_trip_modules',
      job_data: { tripId },
      scheduled_for: new Date().toISOString(),
      status: 'pending',
    });
  } catch (error) {
    console.error('Failed to schedule module refresh:', error);
  }
}

async function scheduleConfirmationNotifications(trip: Trip): Promise<void> {
  try {
    // Immediate confirmation notification
    await supabase.from('scheduled_jobs').insert({
      job_type: 'send_trip_notification',
      job_data: {
        tripId: trip.id,
        type: 'trip_confirmed',
        userId: trip.owner_id,
      },
      scheduled_for: new Date().toISOString(),
      status: 'pending',
    });

    // Schedule pre-trip reminders if dates are set
    if (trip.start_date && trip.reminder_settings?.pre_trip_7_days) {
      const sevenDaysBefore = new Date(trip.start_date);
      sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
      
      if (sevenDaysBefore > new Date()) {
        await supabase.from('scheduled_jobs').insert({
          job_type: 'send_trip_reminder',
          job_data: { tripId: trip.id, daysUntil: 7 },
          scheduled_for: sevenDaysBefore.toISOString(),
          status: 'pending',
        });
      }
    }

    if (trip.start_date && trip.reminder_settings?.pre_trip_1_day) {
      const oneDayBefore = new Date(trip.start_date);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      
      if (oneDayBefore > new Date()) {
        await supabase.from('scheduled_jobs').insert({
          job_type: 'send_trip_reminder',
          job_data: { tripId: trip.id, daysUntil: 1 },
          scheduled_for: oneDayBefore.toISOString(),
          status: 'pending',
        });
      }
    }
  } catch (error) {
    console.error('Failed to schedule confirmation notifications:', error);
  }
}

async function sendPreTripReminder(trip: Trip, daysUntil: number): Promise<void> {
  try {
    await supabase.from('scheduled_jobs').insert({
      job_type: 'send_trip_reminder',
      job_data: { tripId: trip.id, daysUntil },
      scheduled_for: new Date().toISOString(),
      status: 'pending',
    });
  } catch (error) {
    console.error('Failed to send pre-trip reminder:', error);
  }
}

async function sendTripStartedNotification(trip: Trip): Promise<void> {
  try {
    await supabase.from('scheduled_jobs').insert({
      job_type: 'send_trip_notification',
      job_data: {
        tripId: trip.id,
        type: 'trip_started',
        userId: trip.owner_id,
      },
      scheduled_for: new Date().toISOString(),
      status: 'pending',
    });
  } catch (error) {
    console.error('Failed to send trip started notification:', error);
  }
}

async function sendTripCompletedNotification(trip: Trip): Promise<void> {
  try {
    await supabase.from('scheduled_jobs').insert({
      job_type: 'send_trip_notification',
      job_data: {
        tripId: trip.id,
        type: 'trip_completed',
        userId: trip.owner_id,
      },
      scheduled_for: new Date().toISOString(),
      status: 'pending',
    });
  } catch (error) {
    console.error('Failed to send trip completed notification:', error);
  }
}

async function scheduleReviewRequest(tripId: string): Promise<void> {
  try {
    // Schedule review request for 2 days after trip ends
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 2);

    await supabase.from('scheduled_jobs').insert({
      job_type: 'send_review_request',
      job_data: { tripId },
      scheduled_for: scheduledFor.toISOString(),
      status: 'pending',
    });
  } catch (error) {
    console.error('Failed to schedule review request:', error);
  }
}

async function notifyTravelersTripCancelled(trip: Trip): Promise<void> {
  try {
    const travelers = await TripRepository.getTravelers(trip.id);
    
    for (const traveler of travelers) {
      if (traveler.user_id && traveler.user_id !== trip.owner_id) {
        await supabase.from('scheduled_jobs').insert({
          job_type: 'send_trip_notification',
          job_data: {
            tripId: trip.id,
            type: 'trip_cancelled',
            userId: traveler.user_id,
          },
          scheduled_for: new Date().toISOString(),
          status: 'pending',
        });
      }
    }
  } catch (error) {
    console.error('Failed to notify travelers of cancellation:', error);
  }
}

export const TripLifecycleService = {
  isValidTransition,
  transitionTo,
  confirmTrip,
  cancelTrip,
  archiveTrip,
  processAutomaticTransitions,
};
