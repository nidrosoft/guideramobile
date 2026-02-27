/**
 * CANCELLATION SERVICE
 * 
 * Handles booking cancellations and refund calculations.
 */

import { supabase } from '@/lib/supabase/client';
import {
  BookingWithItems,
  BookingItem,
  CancellationRequest,
  RefundCalculation,
  CancellationPolicy,
} from './booking.types';
import { getBookingWithItems, updateBookingStatus } from './booking-lifecycle.service';
import { createRefund } from '../payment';

// ============================================
// CANCELLATION REQUEST
// ============================================

export interface CancellationRequestParams {
  bookingId: string;
  requestedBy: 'user' | 'provider' | 'system' | 'support';
  reason: string;
  forceCancel?: boolean;
  itemsToCancel?: string[];
}

export interface CancellationResult {
  success: boolean;
  cancellable?: boolean;
  cancellationId?: string;
  requiresConfirmation?: boolean;
  refundSummary?: {
    originalAmount: number;
    cancellationFee: number;
    refundAmount: number;
    estimatedArrival: string;
  };
  providerCancellations?: any[];
  refundAmount?: number;
  refundStatus?: string;
  reason?: string;
  error?: string;
}

/**
 * Request a cancellation
 */
export async function requestCancellation(
  params: CancellationRequestParams
): Promise<CancellationResult> {
  const { bookingId, requestedBy, reason, forceCancel, itemsToCancel } = params;

  const booking = await getBookingWithItems(bookingId);
  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  // Check if cancellation allowed
  if (!forceCancel && !booking.is_refundable) {
    const policy = await evaluateCancellationPolicy(booking);
    if (!policy.cancellable) {
      return {
        success: false,
        cancellable: false,
        reason: policy.reason,
      };
    }
  }

  // Calculate refund
  const refundCalculation = await calculateCancellationRefund(booking, itemsToCancel);

  // Determine cancellation type
  const cancellationType = itemsToCancel?.length
    ? itemsToCancel.length < booking.items.length
      ? 'partial'
      : 'full'
    : 'full';

  // Create cancellation request
  const { data: cancellationRequest, error } = await supabase
    .from('cancellation_requests')
    .insert({
      booking_id: bookingId,
      requested_by: requestedBy,
      request_reason: reason,
      cancellation_type: cancellationType,
      items_to_cancel: itemsToCancel || null,
      status: 'pending',
      refund_calculation: refundCalculation,
      policy_applied: booking.cancellation_policy,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // For self-service: if refund is straightforward, show confirmation
  if (requestedBy === 'user' && refundCalculation.isAutomatable) {
    return {
      success: true,
      cancellationId: cancellationRequest.id,
      requiresConfirmation: true,
      refundSummary: {
        originalAmount: booking.total_amount,
        cancellationFee: refundCalculation.totalFee,
        refundAmount: refundCalculation.refundAmount,
        estimatedArrival: '5-10 business days',
      },
    };
  }

  // For provider/system cancellations, process immediately
  if (requestedBy === 'provider' || requestedBy === 'system' || forceCancel) {
    return await processCancellation(cancellationRequest.id);
  }

  return {
    success: true,
    cancellationId: cancellationRequest.id,
    requiresConfirmation: !refundCalculation.isAutomatable,
    refundSummary: {
      originalAmount: booking.total_amount,
      cancellationFee: refundCalculation.totalFee,
      refundAmount: refundCalculation.refundAmount,
      estimatedArrival: '5-10 business days',
    },
  };
}

/**
 * Confirm and process cancellation
 */
export async function confirmAndProcessCancellation(
  cancellationId: string
): Promise<CancellationResult> {
  await supabase
    .from('cancellation_requests')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('id', cancellationId);

  return await processCancellation(cancellationId);
}

/**
 * Process cancellation with providers
 */
export async function processCancellation(
  cancellationId: string
): Promise<CancellationResult> {
  // Get cancellation request
  const { data: cancellation } = await supabase
    .from('cancellation_requests')
    .select('*')
    .eq('id', cancellationId)
    .single();

  if (!cancellation) {
    return { success: false, error: 'Cancellation request not found' };
  }

  const booking = await getBookingWithItems(cancellation.booking_id);
  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  // Update status to processing
  await supabase
    .from('cancellation_requests')
    .update({ status: 'processing' })
    .eq('id', cancellationId);

  const providerCancellations: any[] = [];
  let allCancelled = true;

  // Determine which items to cancel
  const itemsToCancel = cancellation.items_to_cancel
    ? booking.items.filter((i) => cancellation.items_to_cancel.includes(i.id))
    : booking.items;

  // Cancel with each provider
  for (const item of itemsToCancel) {
    if (!item.provider_booking_id) continue;

    try {
      const { data, error } = await supabase.functions.invoke('provider-manager', {
        body: {
          action: 'cancelBooking',
          provider: item.provider_code,
          category: item.category,
          params: {
            providerBookingId: item.provider_booking_id,
          },
        },
      });

      const success = !error && data?.success;

      providerCancellations.push({
        provider: item.provider_code,
        item_id: item.id,
        status: success ? 'cancelled' : 'failed',
        reference: data?.cancellationReference,
        cancelled_at: success ? new Date().toISOString() : null,
        error: error?.message || data?.error,
      });

      if (success) {
        await supabase
          .from('booking_items')
          .update({
            status: 'cancelled',
            is_cancelled: true,
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      } else {
        allCancelled = false;
      }
    } catch (err: any) {
      providerCancellations.push({
        provider: item.provider_code,
        item_id: item.id,
        status: 'failed',
        error: err.message,
      });
      allCancelled = false;
    }
  }

  // Update cancellation request
  await supabase
    .from('cancellation_requests')
    .update({
      provider_cancellations: providerCancellations,
      status: allCancelled ? 'completed' : 'partial',
      completed_at: new Date().toISOString(),
    })
    .eq('id', cancellationId);

  // Update booking status
  const newStatus = allCancelled
    ? cancellation.cancellation_type === 'full'
      ? 'cancelled'
      : 'partially_cancelled'
    : 'partially_cancelled';

  await updateBookingStatus({
    bookingId: booking.id,
    newStatus,
    changedBy: cancellation.requested_by,
    reason: cancellation.request_reason,
  });

  // Process refund if applicable
  let refundResult = null;
  const refundCalc = cancellation.refund_calculation as RefundCalculation;
  if (refundCalc?.refundAmount > 0) {
    refundResult = await processRefundForCancellation(
      booking,
      cancellation,
      refundCalc.refundAmount
    );

    await supabase
      .from('cancellation_requests')
      .update({
        refund_id: refundResult?.refundId,
        refund_status: refundResult?.success ? 'processing' : 'failed',
      })
      .eq('id', cancellationId);
  }

  // Handle any failures
  if (!allCancelled) {
    await createManualFollowUp({
      type: 'partial_cancellation',
      priority: 'high',
      bookingId: booking.id,
      title: `Partial cancellation for booking ${booking.booking_reference}`,
      details: {
        failures: providerCancellations.filter((p) => p.status === 'failed'),
      },
    });
  }

  return {
    success: allCancelled,
    cancellationId,
    providerCancellations,
    refundAmount: refundCalc?.refundAmount,
    refundStatus: refundResult?.success ? 'processing' : 'failed',
  };
}

// ============================================
// REFUND CALCULATION
// ============================================

/**
 * Calculate cancellation refund
 */
export async function calculateCancellationRefund(
  booking: BookingWithItems,
  itemsToCancel?: string[]
): Promise<RefundCalculation> {
  const now = new Date();
  const itemBreakdown: RefundCalculation['itemBreakdown'] = [];

  const items = itemsToCancel
    ? booking.items.filter((i) => itemsToCancel.includes(i.id))
    : booking.items;

  for (const item of items) {
    const policy = getCancellationPolicyForItem(item);
    let cancellationFee = 0;
    let refundAmount = item.price_amount;
    let policyApplied = 'Full refund';

    if (!policy || !policy.isRefundable) {
      cancellationFee = item.price_amount;
      refundAmount = 0;
      policyApplied = 'Non-refundable';
    } else {
      // Find applicable rule
      for (const rule of policy.rules || []) {
        const deadline = new Date(rule.deadline);

        if (now >= deadline) {
          // Past this deadline
          switch (rule.penaltyType) {
            case 'percentage':
              cancellationFee = item.price_amount * (rule.penaltyValue / 100);
              break;
            case 'fixed':
              cancellationFee = rule.penaltyValue;
              break;
            case 'nights':
              const perNight = item.price_amount / (getNights(item) || 1);
              cancellationFee = perNight * rule.penaltyValue;
              break;
            case 'full':
              cancellationFee = item.price_amount;
              break;
          }
          policyApplied = rule.description || `${rule.penaltyValue}% penalty`;
          break;
        }
      }

      refundAmount = Math.max(0, item.price_amount - cancellationFee);
    }

    itemBreakdown.push({
      itemId: item.id,
      category: item.category,
      originalAmount: item.price_amount,
      cancellationFee: Math.round(cancellationFee * 100) / 100,
      refundAmount: Math.round(refundAmount * 100) / 100,
      policy: policyApplied,
    });
  }

  const totalFee = itemBreakdown.reduce((sum, i) => sum + i.cancellationFee, 0);
  const totalRefund = itemBreakdown.reduce((sum, i) => sum + i.refundAmount, 0);

  // Determine if automatable
  const isAutomatable = itemBreakdown.every(
    (i) =>
      i.cancellationFee === 0 ||
      i.cancellationFee === i.originalAmount ||
      i.policy !== 'Complex'
  );

  return {
    originalAmount: items.reduce((sum, i) => sum + i.price_amount, 0),
    itemBreakdown,
    totalFee: Math.round(totalFee * 100) / 100,
    refundAmount: Math.round(totalRefund * 100) / 100,
    currency: booking.currency,
    isAutomatable,
    automationReason: isAutomatable ? undefined : 'Complex cancellation policy requires review',
  };
}

/**
 * Evaluate if booking can be cancelled
 */
async function evaluateCancellationPolicy(
  booking: BookingWithItems
): Promise<{ cancellable: boolean; reason?: string }> {
  // Check if past travel date
  if (booking.travel_start_date) {
    const startDate = new Date(booking.travel_start_date);
    if (startDate < new Date()) {
      return { cancellable: false, reason: 'Cannot cancel past bookings' };
    }
  }

  // Check if already cancelled
  if (booking.is_cancelled || booking.status === 'cancelled') {
    return { cancellable: false, reason: 'Booking is already cancelled' };
  }

  // Check individual item policies
  for (const item of booking.items) {
    const policy = getCancellationPolicyForItem(item);
    if (!policy?.isRefundable) {
      // Non-refundable but might still be cancellable
      continue;
    }
  }

  return { cancellable: true };
}

/**
 * Get cancellation policy for item
 */
function getCancellationPolicyForItem(item: BookingItem): CancellationPolicy | null {
  return item.cancellation_policy || item.item_details?.cancellationPolicy || null;
}

/**
 * Get number of nights for hotel item
 */
function getNights(item: BookingItem): number {
  if (item.category !== 'hotel') return 1;
  return item.item_details?.nights || 1;
}

// ============================================
// REFUND PROCESSING
// ============================================

/**
 * Process refund for cancellation
 */
async function processRefundForCancellation(
  booking: BookingWithItems,
  cancellation: any,
  amount: number
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  // Get original transaction
  const { data: transaction } = await supabase
    .from('payment_transactions')
    .select('stripe_charge_id')
    .eq('booking_id', booking.id)
    .eq('status', 'succeeded')
    .single();

  if (!transaction?.stripe_charge_id) {
    return { success: false, error: 'No charge found for refund' };
  }

  // Generate refund reference
  const refundReference = `REF-${Date.now().toString(36).toUpperCase()}`;

  // Create refund record
  const { data: refund, error: refundError } = await supabase
    .from('refunds')
    .insert({
      booking_id: booking.id,
      cancellation_request_id: cancellation.id,
      refund_reference: refundReference,
      amount,
      currency: booking.currency,
      status: 'pending',
      reason: cancellation.request_reason,
      requested_by: cancellation.requested_by,
    })
    .select('id')
    .single();

  if (refundError) {
    return { success: false, error: refundError.message };
  }

  // Process refund via Stripe (through edge function)
  const { data, error } = await supabase.functions.invoke('stripe-api', {
    body: {
      action: 'createRefund',
      params: {
        chargeId: transaction.stripe_charge_id,
        amount: Math.round(amount * 100),
        reason: 'requested_by_customer',
        metadata: {
          booking_id: booking.id,
          refund_id: refund.id,
        },
        idempotencyKey: `refund_${refund.id}`,
      },
    },
  });

  if (error || !data?.success) {
    await supabase
      .from('refunds')
      .update({
        status: 'failed',
        failure_reason: error?.message || data?.error,
      })
      .eq('id', refund.id);

    return { success: false, refundId: refund.id, error: error?.message || data?.error };
  }

  // Update refund with Stripe info
  await supabase
    .from('refunds')
    .update({
      stripe_refund_id: data.refundId,
      stripe_status: data.status,
      status: 'processing',
      processed_at: new Date().toISOString(),
    })
    .eq('id', refund.id);

  // Update booking
  await supabase
    .from('bookings')
    .update({
      amount_refunded: (booking.amount_refunded || 0) + amount,
    })
    .eq('id', booking.id);

  return { success: true, refundId: refund.id };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function createManualFollowUp(params: {
  type: string;
  priority: string;
  bookingId: string;
  title: string;
  details: any;
}): Promise<void> {
  await supabase.from('manual_follow_ups').insert({
    type: params.type,
    priority: params.priority,
    booking_id: params.bookingId,
    title: params.title,
    details: params.details,
    status: 'open',
  });
}
