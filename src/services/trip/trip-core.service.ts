/**
 * TRIP CORE SERVICE
 * Main orchestrator for trip operations
 */

import { supabase } from '@/lib/supabase/client';
import { TripRepository } from './trip-repository';
import {
  Trip,
  TripTraveler,
  TripBooking,
  TripActivity,
  TripAccess,
  TripItinerary,
  ItineraryDay,
  TripWithDetails,
  TripListResponse,
  CreateTripInput,
  UpdateTripInput,
  CreateActivityInput,
  UpdateActivityInput,
  TripFilters,
  GetTripOptions,
  LinkBookingOptions,
  ROLE_PERMISSIONS,
  TravelerRole,
} from './trip.types';
import {
  TripNotFoundError,
  TripAccessDeniedError,
  TripValidationError,
} from './trip.errors';
import {
  generateTripName,
  generateShareToken,
  calculateBookingDays,
  calculateDateFromDay,
  bookingToItineraryItem,
  activityToItineraryItem,
  generateBookingSummary,
  extractDestinationFromBooking,
  extractDatesFromBooking,
} from './trip.utils';

// ============================================
// TRIP CRUD
// ============================================

/**
 * Create a new trip
 */
export async function createTrip(input: CreateTripInput): Promise<Trip> {
  // Validate input
  const errors = validateCreateTripInput(input);
  if (errors.length > 0) {
    throw new TripValidationError(errors);
  }

  // Calculate traveler count
  const travelerCount =
    (input.travelers?.adults || 1) +
    (input.travelers?.children || 0) +
    (input.travelers?.infants || 0);

  // Build trip data
  const tripData: Partial<Trip> = {
    owner_id: input.userId,
    title: input.title || input.name || generateTripName(input.destination, { start: input.startDate }),
    primary_destination_code: input.destination?.code,
    primary_destination_name: input.destination?.name,
    primary_destination_country: input.destination?.country,
    destination_timezone: input.destination?.timezone,
    start_date: input.startDate,
    end_date: input.endDate,
    trip_type: input.tripType || 'leisure',
    budget_total: input.budget?.total,
    budget_currency: input.budget?.currency || 'USD',
    budget_level: input.budget?.level,
    adults: input.travelers?.adults || 1,
    children: input.travelers?.children || 0,
    infants: input.travelers?.infants || 0,
    traveler_count: travelerCount,
    traveler_composition: input.travelers?.composition || (travelerCount === 1 ? 'solo' : undefined),
    created_via: input.createdVia || 'manual',
    source_platform: input.platform,
    status: 'draft',
  };

  // Create trip
  const trip = await TripRepository.createTrip(tripData);

  // Add owner as first traveler
  if (input.ownerDetails) {
    await addOwnerAsTraveler(trip.id, input.userId, input.ownerDetails);
  }

  return trip;
}

/**
 * Create trip from a booking
 */
export async function createTripFromBooking(userId: string, booking: any): Promise<Trip> {
  const destination = extractDestinationFromBooking(booking);
  const dates = extractDatesFromBooking(booking);
  const name = generateTripName(destination, dates);

  const trip = await createTrip({
    userId,
    name,
    destination,
    startDate: dates.start,
    endDate: dates.end,
    createdVia: 'booking',
  });

  // Link booking to trip
  await linkBookingToTrip(trip.id, booking.id, { source: 'guidera_booking' });

  // Auto-transition to confirmed since we have a booking
  await updateTripStatus(trip.id, 'confirmed');

  return trip;
}

/**
 * Get trip by ID with full details
 */
export async function getTrip(
  tripId: string,
  userId: string,
  options: GetTripOptions = {}
): Promise<TripWithDetails> {
  const trip = await TripRepository.findById(tripId);
  if (!trip) {
    throw new TripNotFoundError(tripId);
  }

  // Check access
  const access = await checkAccess(tripId, userId);
  if (!access.hasAccess) {
    throw new TripAccessDeniedError(tripId, userId);
  }

  // Build response
  const result: TripWithDetails = { ...trip, access };

  if (options.includeTravelers) {
    result.travelers = await TripRepository.getTravelers(tripId);
  }

  if (options.includeBookings) {
    result.bookings = await TripRepository.getBookings(tripId);
  }

  if (options.includeActivities) {
    result.activities = await TripRepository.getActivities(tripId);
  }

  if (options.includeItinerary) {
    result.itinerary = await buildItinerary(tripId);
  }

  return result;
}

/**
 * Update trip
 */
export async function updateTrip(
  tripId: string,
  userId: string,
  updates: UpdateTripInput
): Promise<Trip> {
  // Check access
  const access = await checkAccess(tripId, userId);
  if (!access.canEdit) {
    throw new TripAccessDeniedError(tripId, userId, 'edit');
  }

  // Build update data
  const updateData: Partial<Trip> = {};

  if (updates.name !== undefined) updateData.title = updates.name;
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.cover_image_url !== undefined) updateData.cover_image_url = updates.cover_image_url;
  if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
  if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
  if (updates.tripType !== undefined) updateData.trip_type = updates.tripType;
  if (updates.tripPurpose !== undefined) updateData.trip_purpose = updates.tripPurpose;
  if (updates.specialOccasion !== undefined) updateData.special_occasion = updates.specialOccasion;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.notificationsEnabled !== undefined) updateData.notifications_enabled = updates.notificationsEnabled;
  if (updates.reminderSettings !== undefined) updateData.reminder_settings = updates.reminderSettings;

  if (updates.destination) {
    updateData.primary_destination_code = updates.destination.code;
    updateData.primary_destination_name = updates.destination.name;
    updateData.primary_destination_country = updates.destination.country;
    updateData.destination_timezone = updates.destination.timezone;
  }

  if (updates.budget) {
    if (updates.budget.total !== undefined) updateData.budget_total = updates.budget.total;
    if (updates.budget.currency !== undefined) updateData.budget_currency = updates.budget.currency;
    if (updates.budget.level !== undefined) updateData.budget_level = updates.budget.level;
  }

  if (updates.travelers) {
    if (updates.travelers.adults !== undefined) updateData.adults = updates.travelers.adults;
    if (updates.travelers.children !== undefined) updateData.children = updates.travelers.children;
    if (updates.travelers.infants !== undefined) updateData.infants = updates.travelers.infants;
    if (updates.travelers.composition !== undefined) updateData.traveler_composition = updates.travelers.composition;
    updateData.traveler_count =
      (updates.travelers.adults ?? 1) +
      (updates.travelers.children ?? 0) +
      (updates.travelers.infants ?? 0);
  }

  return TripRepository.update(tripId, updateData);
}

/**
 * Delete trip
 */
export async function deleteTrip(tripId: string, userId: string): Promise<void> {
  const trip = await TripRepository.findById(tripId);
  if (!trip) {
    throw new TripNotFoundError(tripId);
  }

  // Only owner can delete
  if (trip.owner_id !== userId && trip.user_id !== userId) {
    throw new TripAccessDeniedError(tripId, userId, 'delete');
  }

  // Archive completed trips instead of deleting
  if (trip.status === 'completed') {
    await TripRepository.update(tripId, {
      status: 'archived',
      archived_at: new Date().toISOString(),
    } as any);
  } else {
    await TripRepository.deleteTrip(tripId);
  }
}

// ============================================
// TRIP QUERIES
// ============================================

/**
 * Get user's trips
 */
export async function getUserTrips(
  userId: string,
  filters: TripFilters = {}
): Promise<TripListResponse> {
  const defaultFilters: TripFilters = {
    status: filters.status || ['draft', 'planning', 'confirmed', 'upcoming', 'ongoing'],
    sortBy: filters.sortBy || 'start_date',
    sortOrder: filters.sortOrder || 'asc',
    limit: filters.limit || 20,
    offset: filters.offset || 0,
  };

  const mergedFilters = { ...defaultFilters, ...filters };
  const trips = await TripRepository.findByUser(userId, mergedFilters);
  const total = await TripRepository.countByUser(userId, mergedFilters);

  return {
    trips,
    total,
    hasMore: (mergedFilters.offset || 0) + trips.length < total,
  };
}

/**
 * Get trips by category
 */
export async function getTripsByCategory(
  userId: string,
  category: 'upcoming' | 'ongoing' | 'past' | 'cancelled' | 'draft'
): Promise<Trip[]> {
  const statusMap: Record<string, string[]> = {
    upcoming: ['confirmed', 'upcoming'],
    ongoing: ['ongoing'],
    past: ['completed', 'archived'],
    cancelled: ['cancelled'],
    draft: ['draft', 'planning'],
  };

  return TripRepository.findByUser(userId, {
    status: statusMap[category] as any,
  });
}

// ============================================
// BOOKING MANAGEMENT
// ============================================

/**
 * Link a booking to a trip
 */
export async function linkBookingToTrip(
  tripId: string,
  bookingId: string,
  options: LinkBookingOptions = {}
): Promise<TripBooking> {
  const trip = await TripRepository.findById(tripId);
  if (!trip) {
    throw new TripNotFoundError(tripId);
  }

  // Get booking details
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  // Calculate days
  const days = calculateBookingDays(trip, booking.start_datetime || booking.travel_start_date, booking.end_datetime || booking.travel_end_date);
  const summary = generateBookingSummary(booking);

  // Create link
  const tripBooking = await TripRepository.linkBooking({
    trip_id: tripId,
    booking_id: bookingId,
    category: booking.category || booking.type,
    booking_reference: booking.booking_reference,
    summary_title: summary.title,
    summary_subtitle: summary.subtitle,
    summary_datetime: booking.start_datetime,
    summary_price: booking.total_amount,
    summary_status: booking.status,
    start_day: days.start,
    end_day: days.end,
    traveler_ids: options.travelerIds,
    source: options.source || 'guidera_booking',
    import_id: options.importId,
    added_by: options.addedBy,
  });

  // If first booking and trip is draft, transition to planning
  if (trip.status === 'draft') {
    await updateTripStatus(tripId, 'planning');
  }

  return tripBooking;
}

/**
 * Unlink a booking from a trip
 */
export async function unlinkBookingFromTrip(
  tripId: string,
  bookingId: string,
  userId: string
): Promise<void> {
  const access = await checkAccess(tripId, userId);
  if (!access.canEdit) {
    throw new TripAccessDeniedError(tripId, userId, 'edit');
  }

  await TripRepository.unlinkBooking(tripId, bookingId);
}

// ============================================
// ACTIVITY MANAGEMENT
// ============================================

/**
 * Add custom activity to trip
 */
export async function addActivity(
  tripId: string,
  userId: string,
  activity: CreateActivityInput
): Promise<TripActivity> {
  const access = await checkAccess(tripId, userId);
  if (!access.canEdit) {
    throw new TripAccessDeniedError(tripId, userId, 'edit');
  }

  const trip = await TripRepository.findById(tripId);
  if (!trip) {
    throw new TripNotFoundError(tripId);
  }

  const activityDate = calculateDateFromDay(trip, activity.dayNumber);

  const activityData: Partial<TripActivity> = {
    trip_id: tripId,
    title: activity.title,
    description: activity.description,
    category: activity.category || 'custom',
    day_number: activity.dayNumber,
    start_time: activity.startTime,
    end_time: activity.endTime,
    is_all_day: activity.isAllDay || false,
    start_datetime: activity.startTime
      ? `${activityDate}T${activity.startTime}:00`
      : undefined,
    location_name: activity.location?.name,
    location_address: activity.location?.address,
    location_place_id: activity.location?.placeId,
    location_lat: activity.location?.coordinates?.lat,
    location_lng: activity.location?.coordinates?.lng,
    estimated_cost: activity.cost?.amount,
    cost_currency: activity.cost?.currency,
    notes: activity.notes,
    traveler_ids: activity.travelerIds,
    created_by: userId,
  };

  return TripRepository.createActivity(activityData);
}

/**
 * Update activity
 */
export async function updateActivity(
  tripId: string,
  activityId: string,
  userId: string,
  updates: UpdateActivityInput
): Promise<TripActivity> {
  const access = await checkAccess(tripId, userId);
  if (!access.canEdit) {
    throw new TripAccessDeniedError(tripId, userId, 'edit');
  }

  const updateData: Partial<TripActivity> = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.dayNumber !== undefined) updateData.day_number = updates.dayNumber;
  if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
  if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
  if (updates.isAllDay !== undefined) updateData.is_all_day = updates.isAllDay;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.travelerIds !== undefined) updateData.traveler_ids = updates.travelerIds;

  if (updates.location) {
    updateData.location_name = updates.location.name;
    updateData.location_address = updates.location.address;
    updateData.location_place_id = updates.location.placeId;
    updateData.location_lat = updates.location.coordinates?.lat;
    updateData.location_lng = updates.location.coordinates?.lng;
  }

  if (updates.cost) {
    updateData.estimated_cost = updates.cost.amount;
    updateData.cost_currency = updates.cost.currency;
  }

  return TripRepository.updateActivity(activityId, updateData);
}

/**
 * Delete activity
 */
export async function deleteActivity(
  tripId: string,
  activityId: string,
  userId: string
): Promise<void> {
  const access = await checkAccess(tripId, userId);
  if (!access.canEdit) {
    throw new TripAccessDeniedError(tripId, userId, 'edit');
  }

  await TripRepository.deleteActivity(activityId);
}

// ============================================
// ITINERARY
// ============================================

/**
 * Build complete itinerary for trip
 */
export async function buildItinerary(tripId: string): Promise<TripItinerary> {
  const trip = await TripRepository.findById(tripId);
  if (!trip) {
    throw new TripNotFoundError(tripId);
  }

  const bookings = await TripRepository.getBookings(tripId);
  const activities = await TripRepository.getActivities(tripId);

  const durationDays = trip.duration_days || calculateDurationDays(trip.start_date, trip.end_date);
  const days: ItineraryDay[] = [];

  for (let day = 1; day <= durationDays; day++) {
    const date = calculateDateFromDay(trip, day);

    // Get items for this day
    const dayBookings = bookings.filter(
      (b) => (b.start_day || 1) <= day && (b.end_day || b.start_day || 1) >= day
    );
    const dayActivities = activities.filter((a) => a.day_number === day);

    // Merge and sort by time
    const items = [
      ...dayBookings.map((b) => bookingToItineraryItem(b, day)),
      ...dayActivities.map((a) => activityToItineraryItem(a)),
    ].sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });

    days.push({
      dayNumber: day,
      date,
      dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
      items,
      hasItems: items.length > 0,
    });
  }

  return {
    tripId,
    totalDays: durationDays,
    days,
  };
}

// ============================================
// ACCESS CONTROL
// ============================================

/**
 * Check user's access to a trip
 */
export async function checkAccess(tripId: string, userId: string): Promise<TripAccess> {
  const trip = await TripRepository.findById(tripId);
  if (!trip) {
    return { hasAccess: false, role: null, canEdit: false, canDelete: false, canInvite: false, canManageBookings: false };
  }

  // Owner has full access
  if (trip.owner_id === userId || trip.user_id === userId) {
    return {
      hasAccess: true,
      role: 'owner',
      ...ROLE_PERMISSIONS.owner,
    };
  }

  // Check if user is a traveler
  const traveler = await TripRepository.findTravelerByUserId(tripId, userId);
  if (traveler && traveler.invitation_status === 'accepted') {
    const role = traveler.role as TravelerRole;
    return {
      hasAccess: true,
      role,
      ...ROLE_PERMISSIONS[role],
    };
  }

  // Check share link access
  if (trip.share_link_enabled && trip.share_link_token) {
    // User might have access via share link - but we need the token to verify
    // For now, return no access - share link access is handled separately
  }

  return { hasAccess: false, role: null, canEdit: false, canDelete: false, canInvite: false, canManageBookings: false };
}

// ============================================
// SHARE LINK
// ============================================

/**
 * Enable share link for trip
 */
export async function enableShareLink(
  tripId: string,
  userId: string,
  options: { permission?: 'view' | 'edit'; expiresInDays?: number } = {}
): Promise<{ token: string; url: string }> {
  const access = await checkAccess(tripId, userId);
  if (!access.canInvite) {
    throw new TripAccessDeniedError(tripId, userId, 'share');
  }

  const token = generateShareToken();
  const expiresAt = options.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  await TripRepository.update(tripId, {
    share_link_enabled: true,
    share_link_token: token,
    share_link_permission: options.permission || 'view',
    share_link_expires_at: expiresAt,
  } as any);

  return {
    token,
    url: `https://guidera.app/trip/join/${token}`,
  };
}

/**
 * Disable share link
 */
export async function disableShareLink(tripId: string, userId: string): Promise<void> {
  const access = await checkAccess(tripId, userId);
  if (!access.canInvite) {
    throw new TripAccessDeniedError(tripId, userId, 'share');
  }

  await TripRepository.update(tripId, {
    share_link_enabled: false,
    share_link_token: null,
  } as any);
}

/**
 * Join trip via share link
 */
export async function joinViaShareLink(token: string, userId: string): Promise<Trip> {
  const trip = await TripRepository.findByShareToken(token);
  if (!trip) {
    throw new Error('Invalid or expired share link');
  }

  // Check if already a traveler
  const existing = await TripRepository.findTravelerByUserId(trip.id, userId);
  if (existing) {
    return trip;
  }

  // Get user details
  const { data: user } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', userId)
    .single();

  // Add as traveler
  const role = trip.share_link_permission === 'edit' ? 'editor' : 'viewer';
  await TripRepository.addTraveler({
    trip_id: trip.id,
    user_id: userId,
    first_name: user?.first_name || 'Guest',
    last_name: user?.last_name || '',
    email: user?.email,
    role,
    invitation_status: 'accepted',
    accepted_at: new Date().toISOString(),
  });

  return trip;
}

// ============================================
// HELPERS
// ============================================

async function addOwnerAsTraveler(
  tripId: string,
  userId: string,
  details: { firstName: string; lastName: string; email?: string }
): Promise<void> {
  await TripRepository.addTraveler({
    trip_id: tripId,
    user_id: userId,
    first_name: details.firstName,
    last_name: details.lastName,
    email: details.email,
    role: 'owner',
    is_owner: true,
    relationship_to_owner: 'self',
    invitation_status: 'accepted',
    accepted_at: new Date().toISOString(),
  });
}

async function updateTripStatus(tripId: string, status: string): Promise<void> {
  const trip = await TripRepository.findById(tripId);
  if (!trip) return;

  await TripRepository.update(tripId, {
    status,
    previous_status: trip.status,
    status_changed_at: new Date().toISOString(),
  } as any);
}

function calculateDurationDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function validateCreateTripInput(input: CreateTripInput): string[] {
  const errors: string[] = [];

  if (!input.userId) {
    errors.push('User ID is required');
  }

  if (input.startDate && input.endDate) {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    if (end < start) {
      errors.push('End date must be after start date');
    }
  }

  return errors;
}

export const TripCoreService = {
  createTrip,
  createTripFromBooking,
  getTrip,
  updateTrip,
  deleteTrip,
  getUserTrips,
  getTripsByCategory,
  linkBookingToTrip,
  unlinkBookingFromTrip,
  addActivity,
  updateActivity,
  deleteActivity,
  buildItinerary,
  checkAccess,
  enableShareLink,
  disableShareLink,
  joinViaShareLink,
};
