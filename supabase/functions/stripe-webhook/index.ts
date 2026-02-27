/**
 * STRIPE WEBHOOK HANDLER
 * 
 * Handles Stripe webhook events for payment processing.
 * Implements idempotency to prevent duplicate processing.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Webhook secret for signature verification
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Check for duplicate event (idempotency)
  const { data: existingEvent } = await supabase
    .from('stripe_webhook_events')
    .select('id, processed')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent?.processed) {
    console.log(`Event ${event.id} already processed`);
    return new Response('Already processed', { status: 200 });
  }

  // Store event
  if (!existingEvent) {
    await supabase.from('stripe_webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event,
      received_at: new Date().toISOString(),
    });
  }

  try {
    // Process event based on type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.refund.updated':
        await handleRefundUpdated(event.data.object as Stripe.Refund);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'charge.dispute.updated':
        await handleDisputeUpdated(event.data.object as Stripe.Dispute);
        break;

      case 'charge.dispute.closed':
        await handleDisputeClosed(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark as processed
    await supabase
      .from('stripe_webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        idempotency_processed: true,
      })
      .eq('stripe_event_id', event.id);

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    console.error('Webhook processing error:', error);

    // Store error for retry
    await supabase
      .from('stripe_webhook_events')
      .update({
        processing_error: error.message,
        retry_count: (existingEvent?.retry_count || 0) + 1,
      })
      .eq('stripe_event_id', event.id);

    // Return 500 so Stripe will retry
    return new Response('Processing error', { status: 500 });
  }
});

// ============================================
// PAYMENT INTENT HANDLERS
// ============================================

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const sessionId = paymentIntent.metadata?.checkout_session_id;
  if (!sessionId) {
    console.log('No checkout session ID in payment intent metadata');
    return;
  }

  // Update transaction
  await supabase
    .from('payment_transactions')
    .update({
      status: 'succeeded',
      stripe_charge_id: paymentIntent.latest_charge as string,
      captured_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  // Log event
  console.log(`Payment succeeded for session ${sessionId}, amount: ${paymentIntent.amount / 100} ${paymentIntent.currency}`);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const sessionId = paymentIntent.metadata?.checkout_session_id;
  if (!sessionId) return;

  const error = paymentIntent.last_payment_error;

  // Update checkout session
  await supabase
    .from('checkout_sessions')
    .update({
      status: 'failed',
      payment_status: 'failed',
      error_code: error?.code || 'payment_failed',
      error_message: error?.message || 'Payment failed',
    })
    .eq('id', sessionId);

  // Update transaction
  await supabase
    .from('payment_transactions')
    .update({
      status: 'failed',
      failure_code: error?.code,
      failure_message: error?.message,
      decline_code: error?.decline_code,
      failed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  // Send failure notification
  await sendPaymentFailedNotification(sessionId, error);

  console.log(`Payment failed for session ${sessionId}: ${error?.message}`);
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const sessionId = paymentIntent.metadata?.checkout_session_id;
  if (!sessionId) return;

  // Update transaction
  await supabase
    .from('payment_transactions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  console.log(`Payment canceled for session ${sessionId}`);
}

async function handlePaymentIntentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  const sessionId = paymentIntent.metadata?.checkout_session_id;
  if (!sessionId) return;

  // Update checkout session
  await supabase
    .from('checkout_sessions')
    .update({
      payment_status: 'requires_action',
    })
    .eq('id', sessionId);

  console.log(`Payment requires action for session ${sessionId}`);
}

// ============================================
// REFUND HANDLERS
// ============================================

async function handleChargeRefunded(charge: Stripe.Charge) {
  const refundAmount = charge.amount_refunded / 100;
  
  // Find related transaction
  const { data: transaction } = await supabase
    .from('payment_transactions')
    .select('id, booking_id')
    .eq('stripe_charge_id', charge.id)
    .single();

  if (!transaction) {
    console.log(`No transaction found for charge ${charge.id}`);
    return;
  }

  // Update booking if exists
  if (transaction.booking_id) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('amount_refunded, total_amount')
      .eq('id', transaction.booking_id)
      .single();

    if (booking) {
      const newRefundedAmount = (booking.amount_refunded || 0) + refundAmount;
      const newStatus = newRefundedAmount >= booking.total_amount ? 'refunded' : 'partially_refunded';

      await supabase
        .from('bookings')
        .update({
          amount_refunded: newRefundedAmount,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.booking_id);
    }
  }

  console.log(`Charge ${charge.id} refunded: ${refundAmount}`);
}

async function handleRefundUpdated(refund: Stripe.Refund) {
  // Update refund record
  await supabase
    .from('refunds')
    .update({
      stripe_status: refund.status,
      status: mapRefundStatus(refund.status),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_refund_id', refund.id);

  console.log(`Refund ${refund.id} updated: ${refund.status}`);
}

function mapRefundStatus(stripeStatus: string | null): string {
  const mapping: Record<string, string> = {
    pending: 'processing',
    succeeded: 'succeeded',
    failed: 'failed',
    canceled: 'failed',
  };
  return mapping[stripeStatus || ''] || 'processing';
}

// ============================================
// DISPUTE HANDLERS
// ============================================

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const chargeId = dispute.charge as string;

  // Find related transaction
  const { data: transaction } = await supabase
    .from('payment_transactions')
    .select('id, booking_id')
    .eq('stripe_charge_id', chargeId)
    .single();

  if (!transaction?.booking_id) {
    console.log(`No booking found for disputed charge ${chargeId}`);
    return;
  }

  // Create dispute record
  const { data: disputeRecord } = await supabase
    .from('disputes')
    .insert({
      booking_id: transaction.booking_id,
      stripe_dispute_id: dispute.id,
      stripe_charge_id: chargeId,
      amount: dispute.amount / 100,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      evidence_due_by: new Date((dispute.evidence_details?.due_by || 0) * 1000).toISOString(),
      priority: 'critical',
    })
    .select('id')
    .single();

  // Update booking
  await supabase
    .from('bookings')
    .update({
      has_dispute: true,
      dispute_id: disputeRecord?.id,
      dispute_status: dispute.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transaction.booking_id);

  // Create critical alert
  await supabase.from('system_alerts').insert({
    type: 'dispute_created',
    severity: 'critical',
    message: `New dispute: ${dispute.reason} for $${dispute.amount / 100}`,
    data: {
      bookingId: transaction.booking_id,
      disputeId: dispute.id,
      amount: dispute.amount / 100,
      reason: dispute.reason,
      evidenceDueBy: dispute.evidence_details?.due_by,
    },
  });

  // Auto-gather evidence
  await gatherDisputeEvidence(transaction.booking_id, dispute.id);

  console.log(`Dispute created for booking ${transaction.booking_id}: ${dispute.reason}`);
}

async function handleDisputeUpdated(dispute: Stripe.Dispute) {
  await supabase
    .from('disputes')
    .update({
      status: dispute.status,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_dispute_id', dispute.id);

  // Update booking dispute status
  const { data: disputeRecord } = await supabase
    .from('disputes')
    .select('booking_id')
    .eq('stripe_dispute_id', dispute.id)
    .single();

  if (disputeRecord?.booking_id) {
    await supabase
      .from('bookings')
      .update({
        dispute_status: dispute.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeRecord.booking_id);
  }

  console.log(`Dispute ${dispute.id} updated: ${dispute.status}`);
}

async function handleDisputeClosed(dispute: Stripe.Dispute) {
  const outcome = dispute.status === 'won' ? 'won' : dispute.status === 'lost' ? 'lost' : 'other';

  await supabase
    .from('disputes')
    .update({
      status: dispute.status,
      outcome,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_dispute_id', dispute.id);

  // Update booking
  const { data: disputeRecord } = await supabase
    .from('disputes')
    .select('booking_id')
    .eq('stripe_dispute_id', dispute.id)
    .single();

  if (disputeRecord?.booking_id) {
    await supabase
      .from('bookings')
      .update({
        dispute_status: dispute.status,
        has_dispute: dispute.status !== 'won', // Clear flag if won
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeRecord.booking_id);
  }

  // Create alert for outcome
  await supabase.from('system_alerts').insert({
    type: 'dispute_closed',
    severity: outcome === 'lost' ? 'high' : 'medium',
    message: `Dispute ${dispute.id} closed: ${outcome}`,
    data: {
      disputeId: dispute.id,
      outcome,
      amount: dispute.amount / 100,
    },
  });

  console.log(`Dispute ${dispute.id} closed: ${outcome}`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function sendPaymentFailedNotification(
  sessionId: string,
  error: Stripe.PaymentIntent.LastPaymentError | null
): Promise<void> {
  // Get session details
  const { data: session } = await supabase
    .from('checkout_sessions')
    .select('contact_info, user_id')
    .eq('id', sessionId)
    .single();

  if (!session?.contact_info?.email) return;

  // Create communication record
  await supabase.from('booking_communications').insert({
    type: 'payment_failed',
    channel: 'email',
    recipient_email: session.contact_info.email,
    recipient_user_id: session.user_id,
    template_id: 'payment_failed',
    template_data: {
      errorMessage: getPaymentErrorMessage(error),
      supportEmail: 'support@guidera.com',
    },
    status: 'pending',
  });
}

function getPaymentErrorMessage(error: Stripe.PaymentIntent.LastPaymentError | null): string {
  const messages: Record<string, string> = {
    card_declined: 'Your card was declined. Please try a different card.',
    insufficient_funds: 'Your card has insufficient funds.',
    expired_card: 'Your card has expired.',
    incorrect_cvc: 'The security code is incorrect.',
    processing_error: 'An error occurred processing your card.',
  };

  if (!error) return 'Payment failed. Please try again.';
  return messages[error.decline_code || error.code || ''] || 'Payment failed. Please try again.';
}

async function gatherDisputeEvidence(bookingId: string, disputeId: string): Promise<void> {
  // Get booking details
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, checkout_sessions(*)')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  // Build evidence
  const evidence = {
    bookingReference: booking.booking_reference,
    customerEmail: booking.contact_info?.email,
    customerName: `${booking.contact_info?.firstName} ${booking.contact_info?.lastName}`,
    bookingDate: booking.created_at,
    travelStartDate: booking.travel_start_date,
    totalAmount: booking.total_amount,
    currency: booking.currency,
  };

  // Store evidence
  await supabase
    .from('disputes')
    .update({
      evidence_data: evidence,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_dispute_id', disputeId);

  console.log(`Evidence gathered for dispute ${disputeId}`);
}
