/**
 * TRIP NOTIFICATION SCHEDULER
 *
 * Centralized scheduler that creates all trip-related notification jobs
 * when a trip is confirmed or updated. Handles:
 *
 * - Pre-trip reminders (7d, 3d, 1d)
 * - Packing reminder (3d before)
 * - Do's & Don'ts review (2d before)
 * - Travel documents check (3d before)
 * - Check-in reminder (24h before each flight)
 * - Hotel check-in reminder (day of)
 * - Departure advisor "time to leave" (calculated leave-by time)
 * - Post-trip feedback (2d after)
 * - Departure advisor prediction feedback (after flight departs)
 */

import { supabase } from '@/lib/supabase/client';
import * as Notifications from 'expo-notifications';
import { notificationService, NOTIFICATION_CATEGORIES } from './notificationService';
import { logger } from '@/services/logging';

interface TripData {
  id: string;
  ownerId: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  bookings?: BookingData[];
}

interface BookingData {
  id: string;
  type: 'flight' | 'hotel' | 'car_rental' | 'activity';
  details: any;
}

// ============================================
// SCHEDULE ALL TRIP NOTIFICATIONS
// ============================================

/**
 * Schedule all notifications for a confirmed trip.
 * Call this when a trip transitions to "confirmed" or "upcoming".
 */
export async function scheduleAllTripNotifications(trip: TripData): Promise<void> {
  const now = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

  // Cancel any existing scheduled notifications for this trip
  await cancelTripNotifications(trip.id);

  const jobs: Array<{
    userId: string;
    tripId: string;
    alertTypeCode: string;
    alertData: Record<string, unknown>;
    scheduledFor: Date;
  }> = [];

  // ─── 7 DAYS BEFORE: Trip reminder ───
  const sevenDays = new Date(start);
  sevenDays.setDate(sevenDays.getDate() - 7);
  if (sevenDays > now) {
    jobs.push({
      userId: trip.ownerId,
      tripId: trip.id,
      alertTypeCode: 'trip_reminder',
      alertData: {
        category: 'trip',
        title: `🌍 7 days until ${trip.title}!`,
        body: `Your trip to ${trip.destination} is coming up. Time to get excited!`,
        action_url: `/trip/${trip.id}`,
        priority: 5,
      },
      scheduledFor: sevenDays,
    });
  }

  // ─── 3 DAYS BEFORE: Packing reminder + Documents check ───
  const threeDays = new Date(start);
  threeDays.setDate(threeDays.getDate() - 3);
  if (threeDays > now) {
    // Packing reminder
    jobs.push({
      userId: trip.ownerId,
      tripId: trip.id,
      alertTypeCode: 'packing_reminder',
      alertData: {
        category: 'trip',
        title: `🧳 Start packing for ${trip.destination}!`,
        body: `Your trip is in 3 days. Open your packing list to make sure you have everything.`,
        action_url: `/trip/${trip.id}/packing`,
        priority: 5,
      },
      scheduledFor: threeDays,
    });

    // Travel documents check
    jobs.push({
      userId: trip.ownerId,
      tripId: trip.id,
      alertTypeCode: 'documents_check',
      alertData: {
        category: 'trip',
        title: `📄 Check your travel documents`,
        body: `3 days until ${trip.destination}. Make sure your passport, visa, and insurance are ready.`,
        action_url: `/trip/${trip.id}`,
        priority: 6,
      },
      scheduledFor: threeDays,
    });
  }

  // ─── 2 DAYS BEFORE: Do's & Don'ts review ───
  const twoDays = new Date(start);
  twoDays.setDate(twoDays.getDate() - 2);
  if (twoDays > now) {
    jobs.push({
      userId: trip.ownerId,
      tripId: trip.id,
      alertTypeCode: 'dos_donts_review',
      alertData: {
        category: 'trip',
        title: `📋 Review Do's & Don'ts for ${trip.destination}`,
        body: `Brush up on local customs and etiquette before your trip.`,
        action_url: `/trip/${trip.id}/dos-donts`,
        priority: 4,
      },
      scheduledFor: twoDays,
    });
  }

  // ─── 1 DAY BEFORE: Final reminder + Packing incomplete check ───
  const oneDay = new Date(start);
  oneDay.setDate(oneDay.getDate() - 1);
  if (oneDay > now) {
    jobs.push({
      userId: trip.ownerId,
      tripId: trip.id,
      alertTypeCode: 'trip_reminder',
      alertData: {
        category: 'trip',
        title: `✈️ Tomorrow is the day! ${trip.title}`,
        body: `Your trip to ${trip.destination} starts tomorrow. Make sure everything is ready!`,
        action_url: `/trip/${trip.id}`,
        priority: 7,
      },
      scheduledFor: oneDay,
    });

    // Packing incomplete reminder
    jobs.push({
      userId: trip.ownerId,
      tripId: trip.id,
      alertTypeCode: 'packing_incomplete',
      alertData: {
        category: 'trip',
        title: `🧳 Last chance to pack!`,
        body: `Your trip is tomorrow. Double-check your packing list before you go.`,
        action_url: `/trip/${trip.id}/packing`,
        priority: 6,
      },
      scheduledFor: oneDay,
    });
  }

  // ─── FLIGHT-SPECIFIC: Check-in reminders (24h before each flight) ───
  if (trip.bookings) {
    for (const booking of trip.bookings) {
      if (booking.type === 'flight' && booking.details?.departure?.time) {
        const flightDep = new Date(booking.details.departure.time);
        const checkinTime = new Date(flightDep);
        checkinTime.setHours(checkinTime.getHours() - 24);

        if (checkinTime > now) {
          const flightNum = booking.details.flightNumber || 'your flight';
          const airport = booking.details.departure.airport || '';

          jobs.push({
            userId: trip.ownerId,
            tripId: trip.id,
            alertTypeCode: 'checkin_reminder',
            alertData: {
              category: 'trip',
              title: `✈️ Check in for ${flightNum}`,
              body: `Online check-in is now open for your flight from ${airport}. Check in early for the best seats!`,
              action_url: `/trip/${trip.id}`,
              priority: 6,
              booking_id: booking.id,
            },
            scheduledFor: checkinTime,
          });
        }
      }

      // ─── HOTEL: Check-in reminder (morning of check-in day) ───
      if (booking.type === 'hotel' && booking.details?.checkIn) {
        const hotelCheckin = new Date(booking.details.checkIn);
        hotelCheckin.setHours(8, 0, 0, 0); // 8 AM on check-in day

        if (hotelCheckin > now) {
          const hotelName = booking.details.name || 'your hotel';

          jobs.push({
            userId: trip.ownerId,
            tripId: trip.id,
            alertTypeCode: 'hotel_checkin_reminder',
            alertData: {
              category: 'trip',
              title: `🏨 Check-in today at ${hotelName}`,
              body: `Don't forget to check in at ${hotelName}. ${booking.details.address || ''}`,
              action_url: `/trip/${trip.id}`,
              priority: 5,
              booking_id: booking.id,
            },
            scheduledFor: hotelCheckin,
          });
        }
      }
    }
  }

  // ─── POST-TRIP: Feedback request (2 days after trip ends) ───
  const twoDaysAfter = new Date(end);
  twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);
  if (twoDaysAfter > now) {
    jobs.push({
      userId: trip.ownerId,
      tripId: trip.id,
      alertTypeCode: 'trip_review_request',
      alertData: {
        category: 'trip',
        title: `⭐ How was ${trip.destination}?`,
        body: `Share your experience! Your review helps other travelers plan their trips.`,
        action_url: `/trip/${trip.id}`,
        priority: 3,
      },
      scheduledFor: twoDaysAfter,
    });
  }

  // ─── INSERT ALL JOBS ───
  if (jobs.length > 0) {
    const rows = jobs.map(j => ({
      user_id: j.userId,
      trip_id: j.tripId,
      alert_type_code: j.alertTypeCode,
      alert_data: j.alertData,
      scheduled_for: j.scheduledFor.toISOString(),
      status: 'pending',
    }));

    const { error } = await supabase
      .from('scheduled_notification_jobs')
      .insert(rows);

    if (error) {
      logger.error('Failed to schedule trip notifications', error);
    } else {
      logger.info(`Scheduled ${rows.length} notifications for trip ${trip.id}`);
    }
  }
}

// ============================================
// DEPARTURE ADVISOR NOTIFICATIONS
// ============================================

/**
 * Schedule departure advisor "time to leave" push notification.
 * Called from DepartureAdvisorSheet when user taps "Set Reminder".
 */
export async function scheduleDepartureReminder(
  leaveByTime: string,
  flightNumber: string,
  departureAirport: string,
  destination: string,
  tripId?: string
): Promise<string | null> {
  const leaveBy = new Date(leaveByTime);
  const now = new Date();

  if (leaveBy <= now) {
    logger.warn('Cannot schedule departure reminder: leave-by time is in the past');
    return null;
  }

  // Schedule "30 minutes before leave-by" warning
  const thirtyMinBefore = new Date(leaveBy.getTime() - 30 * 60000);
  if (thirtyMinBefore > now) {
    await notificationService.scheduleLocalNotification(
      {
        type: NOTIFICATION_CATEGORIES.TRIP,
        title: `🚗 30 min until you should leave!`,
        body: `Head to ${departureAirport} soon for flight ${flightNumber} to ${destination}.`,
        data: { tripId, flightNumber, departureAirport },
        deepLink: tripId ? `/trip/${tripId}` : undefined,
      },
      { type: 'date', date: thirtyMinBefore } as any
    );
  }

  // Schedule exact "time to leave" notification
  const notifId = await notificationService.scheduleLocalNotification(
    {
      type: NOTIFICATION_CATEGORIES.TRIP,
      title: `🚨 Time to leave for the airport!`,
      body: `Leave now for ${departureAirport} to catch flight ${flightNumber} to ${destination}.`,
      data: { tripId, flightNumber, departureAirport },
      deepLink: tripId ? `/trip/${tripId}` : undefined,
    },
    { type: 'date', date: leaveBy } as any
  );

  logger.info('Departure reminder scheduled', { leaveByTime, flightNumber, notifId });
  return notifId;
}

/**
 * Schedule departure advisor prediction feedback.
 * Called after the flight's scheduled departure time.
 */
export async function scheduleDepartureFeedback(
  flightDepartureTime: string,
  advisoryId: string | null,
  tripId?: string
): Promise<void> {
  const depTime = new Date(flightDepartureTime);
  // Schedule feedback 2 hours after flight departure
  const feedbackTime = new Date(depTime.getTime() + 2 * 60 * 60000);
  const now = new Date();

  if (feedbackTime <= now) return;

  await notificationService.scheduleLocalNotification(
    {
      type: NOTIFICATION_CATEGORIES.TRIP,
      title: `✈️ How was our timing?`,
      body: `Was our departure time recommendation accurate? Tap to rate and help us improve.`,
      data: { advisoryId, tripId },
      deepLink: tripId ? `/trip/${tripId}` : undefined,
    },
    { type: 'date', date: feedbackTime } as any
  );

  logger.info('Departure feedback notification scheduled', { feedbackTime: feedbackTime.toISOString() });
}

// ============================================
// CANCEL TRIP NOTIFICATIONS
// ============================================

/**
 * Cancel all scheduled notifications for a trip (e.g., on cancellation).
 */
export async function cancelTripNotifications(tripId: string): Promise<void> {
  try {
    await supabase
      .from('scheduled_notification_jobs')
      .update({ status: 'cancelled' })
      .eq('trip_id', tripId)
      .eq('status', 'pending');

    logger.info('Cancelled all pending notifications for trip', { tripId });
  } catch (error) {
    logger.error('Failed to cancel trip notifications', error);
  }
}

export const TripNotificationScheduler = {
  scheduleAllTripNotifications,
  scheduleDepartureReminder,
  scheduleDepartureFeedback,
  cancelTripNotifications,
};
