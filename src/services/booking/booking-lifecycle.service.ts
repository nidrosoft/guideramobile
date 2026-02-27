/**
 * BOOKING LIFECYCLE SERVICE
 * 
 * Manages booking status transitions, provider sync, and schedule change detection.
 */

import { supabase } from '@/lib/supabase/client';
import {
  Booking,
  BookingItem,
  BookingWithItems,
  BookingStatus,
  BookingItemStatus,
  ScheduleChange,
  isValidStatusTransition,
} from './booking.types';

// ============================================
// BOOKING RETRIEVAL
// ============================================

/**
 * Get booking by ID with items
 */
export async function getBookingWithItems(bookingId: string): Promise<BookingWithItems | null> {
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) return null;

  const { data: items } = await supabase
    .from('booking_items')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  return { ...booking, items: items || [] } as BookingWithItems;
}

/**
 * Get booking by reference
 */
export async function getBookingByReference(reference: string): Promise<BookingWithItems | null> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('id')
    .eq('booking_reference', reference)
    .single();

  if (!booking) return null;
  return getBookingWithItems(booking.id);
}

/**
 * Get user's bookings
 */
export async function getUserBookings(
  userId: string,
  options?: {
    status?: BookingStatus[];
    limit?: number;
    offset?: number;
  }
): Promise<{ bookings: BookingWithItems[]; total: number }> {
  let query = supabase
    .from('bookings')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.status?.length) {
    query = query.in('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data: bookings, count } = await query;

  if (!bookings) return { bookings: [], total: 0 };

  // Get items for each booking
  const bookingsWithItems = await Promise.all(
    bookings.map(async (booking) => {
      const { data: items } = await supabase
        .from('booking_items')
        .select('*')
        .eq('booking_id', booking.id);
      return { ...booking, items: items || [] } as BookingWithItems;
    })
  );

  return { bookings: bookingsWithItems, total: count || 0 };
}

// ============================================
// STATUS MANAGEMENT
// ============================================

/**
 * Update booking status with validation
 */
export async function updateBookingStatus(params: {
  bookingId: string;
  newStatus: BookingStatus;
  changedBy: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { bookingId, newStatus, changedBy, reason } = params;

  // Get current booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  // Validate transition
  if (!isValidStatusTransition(booking.status as BookingStatus, newStatus)) {
    return {
      success: false,
      error: `Invalid status transition from ${booking.status} to ${newStatus}`,
    };
  }

  // Update booking
  const { error } = await supabase
    .from('bookings')
    .update({
      previous_status: booking.status,
      status: newStatus,
      status_changed_at: new Date().toISOString(),
      status_change_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Create status history record
  await supabase.from('booking_status_history').insert({
    booking_id: bookingId,
    from_status: booking.status,
    to_status: newStatus,
    changed_by: changedBy,
    change_reason: reason,
  });

  // Trigger side effects based on new status
  await handleStatusSideEffects(bookingId, newStatus);

  return { success: true };
}

/**
 * Update booking item status
 */
export async function updateBookingItemStatus(params: {
  itemId: string;
  newStatus: BookingItemStatus;
  changedBy: string;
  reason?: string;
  providerData?: any;
}): Promise<{ success: boolean; error?: string }> {
  const { itemId, newStatus, changedBy, reason, providerData } = params;

  // Get current item
  const { data: item } = await supabase
    .from('booking_items')
    .select('status, booking_id')
    .eq('id', itemId)
    .single();

  if (!item) {
    return { success: false, error: 'Booking item not found' };
  }

  // Update item
  const { error } = await supabase
    .from('booking_items')
    .update({
      previous_status: item.status,
      status: newStatus,
      status_changed_at: new Date().toISOString(),
      provider_status: providerData?.status,
      provider_raw_status: providerData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Create status history record
  await supabase.from('booking_status_history').insert({
    booking_id: item.booking_id,
    booking_item_id: itemId,
    from_status: item.status,
    to_status: newStatus,
    changed_by: changedBy,
    change_reason: reason,
    provider_raw_data: providerData,
  });

  return { success: true };
}

/**
 * Handle side effects when status changes
 */
async function handleStatusSideEffects(bookingId: string, newStatus: BookingStatus): Promise<void> {
  switch (newStatus) {
    case 'confirmed':
      // Schedule document generation and confirmation email
      await scheduleJob('generate_documents', { bookingId }, new Date());
      await scheduleJob('send_confirmation', { bookingId }, new Date());
      break;

    case 'cancelled':
      // Send cancellation confirmation
      await scheduleJob('send_cancellation_confirmation', { bookingId }, new Date());
      break;

    case 'refunded':
      // Send refund confirmation
      await scheduleJob('send_refund_confirmation', { bookingId }, new Date());
      break;

    case 'completed':
      // Schedule review request (3 days after completion)
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() + 3);
      await scheduleJob('send_review_request', { bookingId }, reviewDate);
      break;
  }
}

// ============================================
// PROVIDER SYNC
// ============================================

/**
 * Sync booking with provider
 */
export async function syncBookingWithProvider(bookingId: string): Promise<{
  success: boolean;
  changes: ScheduleChange[];
  errors: string[];
}> {
  const booking = await getBookingWithItems(bookingId);
  if (!booking) {
    return { success: false, changes: [], errors: ['Booking not found'] };
  }

  const changes: ScheduleChange[] = [];
  const errors: string[] = [];

  for (const item of booking.items) {
    if (!item.provider_booking_id) continue;

    try {
      // Get current status from provider
      const { data, error } = await supabase.functions.invoke('provider-manager', {
        body: {
          action: 'getBookingStatus',
          provider: item.provider_code,
          category: item.category,
          params: {
            providerBookingId: item.provider_booking_id,
          },
        },
      });

      if (error) {
        errors.push(`Failed to sync ${item.category}: ${error.message}`);
        continue;
      }

      // Check for changes
      const detectedChanges = detectScheduleChanges(item, data);
      if (detectedChanges.length > 0) {
        changes.push(...detectedChanges);

        // Update item with changes
        await supabase
          .from('booking_items')
          .update({
            original_details: item.original_details || item.item_details,
            item_details: data.details,
            schedule_change_detected_at: new Date().toISOString(),
            schedule_change_acknowledged: false,
            last_synced_at: new Date().toISOString(),
            provider_status: data.status,
            provider_raw_status: data,
          })
          .eq('id', item.id);

        // Notify user of changes
        await notifyScheduleChange(booking, item, detectedChanges);
      } else {
        // Just update sync timestamp
        await supabase
          .from('booking_items')
          .update({
            last_synced_at: new Date().toISOString(),
            provider_status: data.status,
            provider_raw_status: data,
          })
          .eq('id', item.id);
      }
    } catch (err: any) {
      errors.push(`Error syncing ${item.category}: ${err.message}`);
    }
  }

  // Update booking sync status
  await supabase
    .from('bookings')
    .update({
      last_synced_at: new Date().toISOString(),
      sync_status: errors.length > 0 ? 'partial' : 'synced',
      sync_error: errors.length > 0 ? errors.join('; ') : null,
    })
    .eq('id', bookingId);

  return { success: errors.length === 0, changes, errors };
}

/**
 * Detect schedule changes between stored and provider data
 */
function detectScheduleChanges(item: BookingItem, providerData: any): ScheduleChange[] {
  const changes: ScheduleChange[] = [];
  const original = item.item_details;
  const updated = providerData.details;

  if (!original || !updated) return changes;

  switch (item.category) {
    case 'flight':
      changes.push(...detectFlightChanges(item.id, original, updated));
      break;
    case 'hotel':
      changes.push(...detectHotelChanges(item.id, original, updated));
      break;
  }

  return changes;
}

/**
 * Detect flight schedule changes
 */
function detectFlightChanges(itemId: string, original: any, updated: any): ScheduleChange[] {
  const changes: ScheduleChange[] = [];

  // Compare slices
  const originalSlices = original.slices || [];
  const updatedSlices = updated.slices || [];

  for (let i = 0; i < Math.max(originalSlices.length, updatedSlices.length); i++) {
    const origSlice = originalSlices[i];
    const updSlice = updatedSlices[i];

    if (!origSlice || !updSlice) {
      changes.push({
        itemId,
        changeType: 'route_change',
        original: origSlice,
        updated: updSlice,
        significance: 'critical',
        detectedAt: new Date().toISOString(),
        acknowledged: false,
      });
      continue;
    }

    // Check departure time
    const origDeparture = new Date(origSlice.departureAt || origSlice.segments?.[0]?.departureAt);
    const updDeparture = new Date(updSlice.departureAt || updSlice.segments?.[0]?.departureAt);
    const timeDiffHours = Math.abs(origDeparture.getTime() - updDeparture.getTime()) / (1000 * 60 * 60);

    if (timeDiffHours > 0) {
      let significance: 'minor' | 'major' | 'critical' = 'minor';
      if (timeDiffHours > 4) significance = 'critical';
      else if (timeDiffHours > 2) significance = 'major';

      changes.push({
        itemId,
        changeType: 'time_change',
        original: { departureAt: origSlice.departureAt },
        updated: { departureAt: updSlice.departureAt },
        significance,
        detectedAt: new Date().toISOString(),
        acknowledged: false,
      });
    }
  }

  return changes;
}

/**
 * Detect hotel changes
 */
function detectHotelChanges(itemId: string, original: any, updated: any): ScheduleChange[] {
  const changes: ScheduleChange[] = [];

  // Check room type changes
  if (original.rooms?.[0]?.name !== updated.rooms?.[0]?.name) {
    changes.push({
      itemId,
      changeType: 'equipment_change',
      original: { roomType: original.rooms?.[0]?.name },
      updated: { roomType: updated.rooms?.[0]?.name },
      significance: 'major',
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    });
  }

  return changes;
}

/**
 * Notify user of schedule change
 */
async function notifyScheduleChange(
  booking: BookingWithItems,
  item: BookingItem,
  changes: ScheduleChange[]
): Promise<void> {
  // Create communication record
  await supabase.from('booking_communications').insert({
    booking_id: booking.id,
    type: 'schedule_change',
    channel: 'email',
    recipient_email: booking.contact_info?.email,
    recipient_user_id: booking.user_id,
    template_id: 'schedule_change',
    template_data: {
      bookingReference: booking.booking_reference,
      category: item.category,
      changes,
      significance: changes[0]?.significance,
    },
    status: 'pending',
  });

  // Update booking with issue flag for critical changes
  const hasCritical = changes.some((c) => c.significance === 'critical');
  if (hasCritical) {
    await supabase
      .from('bookings')
      .update({
        has_issue: true,
        issue_type: 'schedule_change',
        issue_description: `Critical schedule change detected for ${item.category}`,
      })
      .eq('id', booking.id);
  }
}

/**
 * Acknowledge schedule change
 */
export async function acknowledgeScheduleChange(
  bookingId: string,
  itemId: string,
  accepted: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('booking_items')
    .update({
      schedule_change_acknowledged: true,
      schedule_change_acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('booking_id', bookingId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Clear issue flag if all changes acknowledged
  const { data: items } = await supabase
    .from('booking_items')
    .select('schedule_change_acknowledged')
    .eq('booking_id', bookingId)
    .not('schedule_change_detected_at', 'is', null);

  const allAcknowledged = items?.every((i) => i.schedule_change_acknowledged);
  if (allAcknowledged) {
    await supabase
      .from('bookings')
      .update({
        has_issue: false,
        issue_resolved: true,
        issue_resolved_at: new Date().toISOString(),
      })
      .eq('id', bookingId);
  }

  return { success: true };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Schedule a job
 */
async function scheduleJob(jobType: string, jobData: any, scheduledFor: Date): Promise<void> {
  await supabase.from('scheduled_jobs').insert({
    job_type: jobType,
    job_data: jobData,
    scheduled_for: scheduledFor.toISOString(),
    status: 'pending',
    booking_id: jobData.bookingId,
  });
}

/**
 * Get available actions for a booking
 */
export function getAvailableActions(booking: BookingWithItems): string[] {
  const actions: string[] = ['view_details', 'resend_documents'];

  switch (booking.status) {
    case 'confirmed':
    case 'in_progress':
      if (booking.is_modifiable) actions.push('modify');
      if (booking.is_refundable) actions.push('cancel');
      actions.push('contact_support');
      break;

    case 'completed':
      actions.push('leave_review', 'book_again');
      break;

    case 'cancelled':
      if (booking.amount_refunded < booking.amount_paid) {
        actions.push('check_refund_status');
      }
      break;
  }

  // Check for unacknowledged schedule changes
  const hasUnacknowledgedChanges = booking.items.some(
    (i) => i.schedule_change_detected_at && !i.schedule_change_acknowledged
  );
  if (hasUnacknowledgedChanges) {
    actions.push('acknowledge_changes');
  }

  return actions;
}
