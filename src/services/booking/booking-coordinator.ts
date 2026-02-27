/**
 * BOOKING COORDINATOR SERVICE
 * 
 * Handles atomic booking with providers.
 * Implements the authorize → book → capture pattern with rollback on failure.
 */

import { supabase } from '@/lib/supabase/client';
import { getCart } from '../cart/cart.service';
import { CartItem, CartWithItems } from '../cart/cart.types';
import {
  CheckoutSession,
  BookingResult,
  BookingResults,
  getCheckoutSession,
  updateCheckoutSession,
} from '../checkout';
import {
  capturePayment,
  cancelPaymentIntent,
  updateTransactionByPaymentIntent,
} from '../payment';

// ============================================
// TYPES
// ============================================

export interface BookingCoordinatorResult {
  success: boolean;
  bookingReference?: string;
  bookingId?: string;
  items?: BookingItemResult[];
  error?: {
    code: string;
    message: string;
  };
}

export interface BookingItemResult {
  itemId: string;
  category: string;
  provider: string;
  providerReference: string;
  confirmationNumber: string;
  status: string;
}

interface ProviderBookingRequest {
  offerId: string;
  travelers: any[];
  contact: any;
  paymentInfo?: any;
}

interface ProviderBookingResponse {
  success: boolean;
  providerReference?: string;
  confirmationNumber?: string;
  error?: string;
  errorCode?: string;
}

// ============================================
// MAIN BOOKING FLOW
// ============================================

/**
 * Execute the full booking flow after payment authorization
 */
export async function executeBookingFlow(
  checkoutToken: string,
  paymentIntentId: string
): Promise<BookingCoordinatorResult> {
  const session = await getCheckoutSession(checkoutToken);
  if (!session) {
    return {
      success: false,
      error: { code: 'SESSION_NOT_FOUND', message: 'Checkout session not found' },
    };
  }

  const cart = await getCart(session.cart_id);
  if (!cart) {
    return {
      success: false,
      error: { code: 'CART_NOT_FOUND', message: 'Cart not found' },
    };
  }

  try {
    // Update session status
    await updateCheckoutSession(session.id, {
      status: 'booking_in_progress',
    });

    // Step 1: Book with all providers (atomic)
    const bookingResults = await bookWithProviders(session, cart);

    if (bookingResults.allSuccessful) {
      // Step 2: Capture payment
      const captureResult = await capturePayment({
        paymentIntentId,
        idempotencyKey: `capture_${session.idempotency_key}`,
      });

      if (!captureResult.success) {
        // Payment capture failed - need to cancel bookings
        await rollbackBookings(bookingResults.results, cart.items);
        
        await updateCheckoutSession(session.id, {
          status: 'failed',
          payment_status: 'failed',
          error_code: 'CAPTURE_FAILED',
          error_message: captureResult.error?.message || 'Payment capture failed',
        });

        return {
          success: false,
          error: { code: 'CAPTURE_FAILED', message: 'Payment capture failed after booking' },
        };
      }

      // Step 3: Create booking records
      const booking = await createBookingRecords(session, cart, bookingResults);

      // Step 4: Update session as completed
      await updateCheckoutSession(session.id, {
        status: 'completed',
        payment_status: 'captured',
        payment_captured_at: new Date().toISOString(),
        all_bookings_successful: true,
        booking_results: bookingResults.results,
        completed_at: new Date().toISOString(),
      });

      // Step 5: Trigger post-booking tasks (async)
      triggerPostBookingTasks(booking.id, session);

      return {
        success: true,
        bookingReference: booking.booking_reference,
        bookingId: booking.id,
        items: bookingResults.results
          .filter((r) => r.success)
          .map((r) => ({
            itemId: r.itemId,
            category: r.category,
            provider: r.provider,
            providerReference: r.providerReference!,
            confirmationNumber: r.confirmationNumber!,
            status: 'confirmed',
          })),
      };
    } else {
      // Booking failed - cancel payment authorization
      await cancelPaymentIntent(
        paymentIntentId,
        'booking_failed',
        `cancel_${session.idempotency_key}`
      );

      await updateCheckoutSession(session.id, {
        status: 'failed',
        payment_status: 'cancelled',
        all_bookings_successful: false,
        booking_results: bookingResults.results,
        error_code: 'BOOKING_FAILED',
        error_message: bookingResults.errors.join('; '),
      });

      return {
        success: false,
        error: {
          code: 'BOOKING_FAILED',
          message: 'Unable to complete booking. Your card has not been charged.',
        },
      };
    }
  } catch (error: any) {
    console.error('Booking flow error:', error);

    // Cancel payment on any error
    try {
      await cancelPaymentIntent(
        paymentIntentId,
        'error',
        `cancel_error_${session.idempotency_key}`
      );
    } catch (cancelError) {
      console.error('Failed to cancel payment:', cancelError);
    }

    await updateCheckoutSession(session.id, {
      status: 'failed',
      error_code: 'BOOKING_ERROR',
      error_message: error.message,
    });

    return {
      success: false,
      error: { code: 'BOOKING_ERROR', message: error.message },
    };
  }
}

// ============================================
// PROVIDER BOOKING
// ============================================

/**
 * Book with all providers atomically
 */
async function bookWithProviders(
  session: CheckoutSession,
  cart: CartWithItems
): Promise<BookingResults> {
  const results: BookingResult[] = [];
  const errors: string[] = [];
  const bookedItems: { itemId: string; providerReference: string; provider: string }[] = [];

  // Order items by cancellation difficulty (easiest first)
  const orderedItems = orderItemsForBooking(cart.items);

  try {
    for (const item of orderedItems) {
      // Build booking request
      const bookingRequest = buildProviderBookingRequest(
        item,
        session.travelers || [],
        session.contact_info
      );

      // Book with provider
      const response = await bookWithProvider(item.provider_code, item.category, bookingRequest);

      if (response.success) {
        results.push({
          itemId: item.id,
          provider: item.provider_code,
          category: item.category,
          success: true,
          providerReference: response.providerReference,
          confirmationNumber: response.confirmationNumber,
        });

        bookedItems.push({
          itemId: item.id,
          providerReference: response.providerReference!,
          provider: item.provider_code,
        });
      } else {
        // Booking failed - need to rollback
        results.push({
          itemId: item.id,
          provider: item.provider_code,
          category: item.category,
          success: false,
          error: response.error,
          errorCode: response.errorCode,
        });

        errors.push(`${item.category} booking failed: ${response.error}`);

        // Rollback already booked items
        await rollbackBookings(
          bookedItems.map((b) => ({
            itemId: b.itemId,
            provider: b.provider,
            category: cart.items.find((i) => i.id === b.itemId)?.category || '',
            success: true,
            providerReference: b.providerReference,
          })),
          cart.items
        );

        return {
          allSuccessful: false,
          results,
          errors,
        };
      }
    }

    return {
      allSuccessful: true,
      results,
      errors: [],
    };
  } catch (error: any) {
    // Unexpected error - rollback
    await rollbackBookings(
      bookedItems.map((b) => ({
        itemId: b.itemId,
        provider: b.provider,
        category: cart.items.find((i) => i.id === b.itemId)?.category || '',
        success: true,
        providerReference: b.providerReference,
      })),
      cart.items
    );

    return {
      allSuccessful: false,
      results,
      errors: [`Unexpected error: ${error.message}`],
    };
  }
}

/**
 * Book with a specific provider
 */
async function bookWithProvider(
  providerCode: string,
  category: string,
  request: ProviderBookingRequest
): Promise<ProviderBookingResponse> {
  try {
    // Call provider manager edge function
    const { data, error } = await supabase.functions.invoke('provider-manager', {
      body: {
        action: 'createBooking',
        provider: providerCode,
        category,
        params: request,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'PROVIDER_ERROR',
      };
    }

    return {
      success: data.success,
      providerReference: data.providerReference,
      confirmationNumber: data.confirmationNumber,
      error: data.error,
      errorCode: data.errorCode,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      errorCode: 'BOOKING_ERROR',
    };
  }
}

/**
 * Build provider booking request from cart item
 */
function buildProviderBookingRequest(
  item: CartItem,
  travelers: any[],
  contact: any
): ProviderBookingRequest {
  return {
    offerId: item.provider_offer_id,
    travelers: travelers.map((t, index) => ({
      ...t,
      index,
      // Map traveler to item if specified
      assignedToItem: item.traveler_indices?.includes(index),
    })),
    contact,
  };
}

/**
 * Order items by cancellation difficulty (easiest first)
 */
function orderItemsForBooking(items: CartItem[]): CartItem[] {
  const order: Record<string, number> = {
    experience: 1,
    car: 2,
    hotel: 3,
    flight: 4,
  };

  return [...items].sort(
    (a, b) => (order[a.category] || 5) - (order[b.category] || 5)
  );
}

// ============================================
// ROLLBACK
// ============================================

/**
 * Rollback bookings on failure
 */
async function rollbackBookings(
  bookedItems: BookingResult[],
  allItems: CartItem[]
): Promise<void> {
  for (const booked of bookedItems) {
    if (!booked.success || !booked.providerReference) continue;

    const item = allItems.find((i) => i.id === booked.itemId);
    if (!item) continue;

    try {
      // Cancel with provider
      const { error } = await supabase.functions.invoke('provider-manager', {
        body: {
          action: 'cancelBooking',
          provider: booked.provider,
          category: booked.category,
          params: {
            providerReference: booked.providerReference,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Log successful rollback
      await logRollback(booked.itemId, booked.providerReference, 'success');
    } catch (error: any) {
      // Log failed rollback - needs manual intervention
      await logRollback(booked.itemId, booked.providerReference, 'failed', error.message);

      // Create alert for manual follow-up
      await createManualFollowUp({
        type: 'rollback_failed',
        priority: 'critical',
        title: `Failed to cancel booking ${booked.providerReference}`,
        details: {
          itemId: booked.itemId,
          provider: booked.provider,
          category: booked.category,
          error: error.message,
        },
      });
    }
  }
}

/**
 * Log rollback attempt
 */
async function logRollback(
  itemId: string,
  providerReference: string,
  status: 'success' | 'failed',
  error?: string
): Promise<void> {
  console.log(`[Rollback] Item ${itemId}, Ref ${providerReference}: ${status}`, error || '');
  
  // TODO: Log to rollback_logs table
}

// ============================================
// BOOKING RECORD CREATION
// ============================================

/**
 * Create booking records in database
 */
async function createBookingRecords(
  session: CheckoutSession,
  cart: CartWithItems,
  bookingResults: BookingResults
): Promise<{ id: string; booking_reference: string }> {
  // Generate booking reference
  const bookingReference = generateBookingReference();

  // Determine booking type
  const categories = [...new Set(cart.items.map((i) => i.category))];
  const bookingType = categories.length > 1 ? 'package' : categories[0];

  // Get travel dates from items
  const { startDate, endDate } = getTravelDates(cart.items);

  // Create main booking record
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: session.user_id,
      checkout_session_id: session.id,
      booking_reference: bookingReference,
      booking_type: bookingType,
      status: 'confirmed',
      total_amount: session.final_total || session.locked_total,
      currency: session.currency,
      amount_paid: session.final_total || session.locked_total,
      travelers: session.travelers,
      contact_info: session.contact_info,
      travel_start_date: startDate,
      travel_end_date: endDate,
      is_refundable: true, // Will be updated based on policies
      documents_generated: false,
      confirmation_sent: false,
    })
    .select('id, booking_reference')
    .single();

  if (bookingError) throw bookingError;

  // Create booking items
  for (const item of cart.items) {
    const result = bookingResults.results.find((r) => r.itemId === item.id);
    
    await supabase.from('booking_items').insert({
      booking_id: booking.id,
      category: item.category,
      provider_code: item.provider_code,
      provider_booking_id: result?.providerReference || null,
      provider_confirmation_number: result?.confirmationNumber || null,
      status: result?.success ? 'confirmed' : 'failed',
      item_details: item.offer_snapshot,
      price_amount: item.price_amount,
      price_currency: item.price_currency,
      start_datetime: getItemStartDate(item),
      end_datetime: getItemEndDate(item),
      traveler_indices: item.traveler_indices,
      cancellation_policy: item.offer_snapshot?.cancellationPolicy || null,
    });
  }

  // Create initial status history
  await supabase.from('booking_status_history').insert({
    booking_id: booking.id,
    from_status: null,
    to_status: 'confirmed',
    changed_by: 'system',
    change_reason: 'Booking completed successfully',
  });

  return booking;
}

/**
 * Generate unique booking reference
 */
function generateBookingReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let reference = 'GDR-';
  for (let i = 0; i < 8; i++) {
    reference += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return reference;
}

/**
 * Get travel dates from cart items
 */
function getTravelDates(items: CartItem[]): { startDate: string | null; endDate: string | null } {
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  for (const item of items) {
    const itemStart = getItemStartDate(item);
    const itemEnd = getItemEndDate(item);

    if (itemStart) {
      const start = new Date(itemStart);
      if (!startDate || start < startDate) startDate = start;
    }

    if (itemEnd) {
      const end = new Date(itemEnd);
      if (!endDate || end > endDate) endDate = end;
    }
  }

  return {
    startDate: startDate?.toISOString().split('T')[0] || null,
    endDate: endDate?.toISOString().split('T')[0] || null,
  };
}

/**
 * Get item start date
 */
function getItemStartDate(item: CartItem): string | null {
  const snapshot = item.offer_snapshot;
  switch (item.category) {
    case 'flight':
      return snapshot?.slices?.[0]?.departureAt || null;
    case 'hotel':
      return snapshot?.checkIn || null;
    case 'car':
      return snapshot?.pickupDateTime || null;
    case 'experience':
      return snapshot?.date || snapshot?.startDateTime || null;
    default:
      return null;
  }
}

/**
 * Get item end date
 */
function getItemEndDate(item: CartItem): string | null {
  const snapshot = item.offer_snapshot;
  switch (item.category) {
    case 'flight':
      const lastSlice = snapshot?.slices?.[snapshot.slices.length - 1];
      return lastSlice?.arrivalAt || null;
    case 'hotel':
      return snapshot?.checkOut || null;
    case 'car':
      return snapshot?.dropoffDateTime || null;
    case 'experience':
      return snapshot?.endDateTime || snapshot?.date || null;
    default:
      return null;
  }
}

// ============================================
// POST-BOOKING TASKS
// ============================================

/**
 * Trigger async post-booking tasks
 */
function triggerPostBookingTasks(bookingId: string, session: CheckoutSession): void {
  // These run asynchronously and don't block the response
  
  // Schedule document generation
  scheduleJob('generate_documents', { bookingId }, new Date());

  // Schedule confirmation email
  scheduleJob('send_confirmation', { bookingId, email: session.contact_info?.email }, new Date());

  // Schedule trip reminders
  scheduleJob('schedule_reminders', { bookingId }, new Date());
}

/**
 * Schedule a job for later execution
 */
async function scheduleJob(
  jobType: string,
  jobData: any,
  scheduledFor: Date
): Promise<void> {
  try {
    await supabase.from('scheduled_jobs').insert({
      job_type: jobType,
      job_data: jobData,
      scheduled_for: scheduledFor.toISOString(),
      status: 'pending',
    });
  } catch (error) {
    console.error('Failed to schedule job:', error);
  }
}

/**
 * Create manual follow-up for issues
 */
async function createManualFollowUp(params: {
  type: string;
  priority: string;
  title: string;
  details: any;
  bookingId?: string;
}): Promise<void> {
  try {
    await supabase.from('manual_follow_ups').insert({
      type: params.type,
      priority: params.priority,
      title: params.title,
      details: params.details,
      booking_id: params.bookingId || null,
      status: 'open',
    });

    // Also create system alert for critical issues
    if (params.priority === 'critical') {
      await supabase.from('system_alerts').insert({
        type: params.type,
        severity: 'critical',
        message: params.title,
        data: params.details,
      });
    }
  } catch (error) {
    console.error('Failed to create follow-up:', error);
  }
}
