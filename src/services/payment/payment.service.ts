/**
 * PAYMENT SERVICE
 * 
 * Handles Stripe payment processing with manual capture pattern.
 * Implements authorize → book → capture flow for safe payments.
 */

import { supabase } from '@/lib/supabase/client';
import {
  PaymentTransaction,
  TransactionStatus,
  StripeCustomer,
  SavedPaymentMethod,
  PaymentMethodDisplay,
  CreatePaymentIntentParams,
  PaymentIntentResult,
  ConfirmPaymentParams,
  CapturePaymentParams,
  CreateRefundParams,
  RefundResult,
  PaymentError,
  PAYMENT_ERROR_MESSAGES,
} from './payment.types';
import {
  CheckoutSession,
  getCheckoutSession,
  updateCheckoutSession,
} from '../checkout';

// ============================================
// STRIPE CUSTOMER MANAGEMENT
// ============================================

/**
 * Get or create Stripe customer for user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email?: string
): Promise<string> {
  // Check if customer exists
  const { data: existing } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  // Create new customer via Edge Function
  const { data, error } = await supabase.functions.invoke('stripe-api', {
    body: {
      action: 'createCustomer',
      params: { email, metadata: { user_id: userId } },
    },
  });

  if (error || !data?.customerId) {
    throw new PaymentError('CUSTOMER_CREATION_FAILED', 'Failed to create payment customer');
  }

  // Store customer mapping
  await supabase.from('stripe_customers').insert({
    user_id: userId,
    stripe_customer_id: data.customerId,
    email,
  });

  return data.customerId;
}

/**
 * Get Stripe customer ID for user
 */
export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  return data?.stripe_customer_id || null;
}

// ============================================
// PAYMENT INTENT OPERATIONS
// ============================================

/**
 * Create a payment intent with manual capture
 */
export async function createPaymentIntent(
  checkoutToken: string,
  paymentMethodId?: string,
  savePaymentMethod?: boolean
): Promise<PaymentIntentResult> {
  try {
    const session = await getCheckoutSession(checkoutToken);
    if (!session) {
      throw new PaymentError('SESSION_NOT_FOUND', 'Checkout session not found');
    }

    // Check session status
    if (session.status !== 'payment_pending') {
      throw new PaymentError('INVALID_STATE', `Cannot create payment in state: ${session.status}`);
    }

    // Check session not expired
    if (new Date(session.expires_at) < new Date()) {
      throw new PaymentError('SESSION_EXPIRED', 'Checkout session has expired');
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      session.user_id,
      session.contact_info?.email
    );

    // Calculate amount (use final total if available, otherwise locked)
    const amount = session.final_total || session.locked_total;
    const currency = session.currency;

    // Create payment intent via Edge Function
    const { data, error } = await supabase.functions.invoke('stripe-api', {
      body: {
        action: 'createPaymentIntent',
        params: {
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          customerId,
          paymentMethodId,
          captureMethod: 'manual', // CRITICAL: Manual capture
          metadata: {
            checkout_session_id: session.id,
            user_id: session.user_id,
            cart_id: session.cart_id,
          },
          idempotencyKey: `pi_${session.idempotency_key}`,
          setupFutureUsage: savePaymentMethod ? 'on_session' : undefined,
        },
      },
    });

    if (error) {
      throw new PaymentError('PAYMENT_INTENT_FAILED', error.message);
    }

    // Create payment transaction record
    const transactionRef = generateTransactionReference();
    await supabase.from('payment_transactions').insert({
      checkout_session_id: session.id,
      user_id: session.user_id,
      transaction_reference: transactionRef,
      stripe_payment_intent_id: data.paymentIntentId,
      stripe_customer_id: customerId,
      stripe_payment_method_id: paymentMethodId || null,
      transaction_type: 'authorization',
      amount,
      currency,
      status: 'pending',
      metadata: { checkoutToken },
    });

    // Update checkout session
    await updateCheckoutSession(session.id, {
      stripe_customer_id: customerId,
      stripe_payment_intent_id: data.paymentIntentId,
      stripe_payment_method_id: paymentMethodId || null,
      payment_status: 'pending',
      payment_amount: amount,
      status: 'payment_processing',
    });

    return {
      success: true,
      paymentIntentId: data.paymentIntentId,
      clientSecret: data.clientSecret,
      status: data.status,
      requiresAction: data.status === 'requires_action',
    };
  } catch (error: any) {
    console.error('Create payment intent error:', error);
    return {
      success: false,
      error: {
        code: error.code || 'PAYMENT_ERROR',
        message: error.message,
        declineCode: error.declineCode,
      },
    };
  }
}

/**
 * Confirm payment intent with payment method
 */
export async function confirmPaymentIntent(
  params: ConfirmPaymentParams
): Promise<PaymentIntentResult> {
  try {
    const { paymentIntentId, paymentMethodId, returnUrl } = params;

    const { data, error } = await supabase.functions.invoke('stripe-api', {
      body: {
        action: 'confirmPaymentIntent',
        params: {
          paymentIntentId,
          paymentMethodId,
          returnUrl: returnUrl || `${getAppUrl()}/checkout/3ds-callback`,
        },
      },
    });

    if (error) {
      throw new PaymentError('CONFIRM_FAILED', error.message);
    }

    // Update transaction status
    await updateTransactionByPaymentIntent(paymentIntentId, {
      stripe_payment_method_id: paymentMethodId,
      status: mapStripeStatusToTransaction(data.status),
    });

    return {
      success: data.status !== 'requires_payment_method',
      paymentIntentId,
      status: data.status,
      requiresAction: data.status === 'requires_action',
      actionUrl: data.nextAction?.redirectToUrl?.url,
    };
  } catch (error: any) {
    console.error('Confirm payment intent error:', error);
    return {
      success: false,
      error: {
        code: error.code || 'CONFIRM_ERROR',
        message: getPaymentErrorMessage(error),
        declineCode: error.declineCode,
      },
    };
  }
}

/**
 * Capture authorized payment
 */
export async function capturePayment(
  params: CapturePaymentParams
): Promise<PaymentIntentResult> {
  try {
    const { paymentIntentId, amount, idempotencyKey } = params;

    const { data, error } = await supabase.functions.invoke('stripe-api', {
      body: {
        action: 'capturePaymentIntent',
        params: {
          paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
          idempotencyKey,
        },
      },
    });

    if (error) {
      throw new PaymentError('CAPTURE_FAILED', error.message);
    }

    // Update transaction
    await updateTransactionByPaymentIntent(paymentIntentId, {
      status: 'succeeded',
      stripe_charge_id: data.chargeId,
      captured_at: new Date().toISOString(),
    });

    return {
      success: true,
      paymentIntentId,
      status: 'succeeded',
    };
  } catch (error: any) {
    console.error('Capture payment error:', error);
    return {
      success: false,
      error: {
        code: error.code || 'CAPTURE_ERROR',
        message: error.message,
      },
    };
  }
}

/**
 * Cancel payment authorization
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
  reason: string = 'abandoned',
  idempotencyKey: string
): Promise<PaymentIntentResult> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-api', {
      body: {
        action: 'cancelPaymentIntent',
        params: {
          paymentIntentId,
          cancellationReason: reason,
          idempotencyKey,
        },
      },
    });

    if (error) {
      throw new PaymentError('CANCEL_FAILED', error.message);
    }

    // Update transaction
    await updateTransactionByPaymentIntent(paymentIntentId, {
      status: 'cancelled',
      failure_message: reason,
    });

    return {
      success: true,
      paymentIntentId,
      status: 'canceled',
    };
  } catch (error: any) {
    console.error('Cancel payment error:', error);
    return {
      success: false,
      error: {
        code: error.code || 'CANCEL_ERROR',
        message: error.message,
      },
    };
  }
}

// ============================================
// REFUND OPERATIONS
// ============================================

/**
 * Create a refund
 */
export async function createRefund(params: CreateRefundParams): Promise<RefundResult> {
  try {
    const { chargeId, amount, reason, metadata, idempotencyKey } = params;

    const { data, error } = await supabase.functions.invoke('stripe-api', {
      body: {
        action: 'createRefund',
        params: {
          chargeId,
          amount: amount ? Math.round(amount * 100) : undefined,
          reason,
          metadata,
          idempotencyKey,
        },
      },
    });

    if (error) {
      throw new PaymentError('REFUND_FAILED', error.message);
    }

    return {
      success: true,
      refundId: data.refundId,
      amount: data.amount / 100,
      status: data.status,
    };
  } catch (error: any) {
    console.error('Create refund error:', error);
    return {
      success: false,
      error: {
        code: error.code || 'REFUND_ERROR',
        message: error.message,
      },
    };
  }
}

// ============================================
// SAVED PAYMENT METHODS
// ============================================

/**
 * Get user's saved payment methods
 */
export async function getUserPaymentMethods(userId: string): Promise<PaymentMethodDisplay[]> {
  const { data, error } = await supabase
    .from('user_payment_methods')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((pm) => ({
    id: pm.id,
    type: pm.type,
    brand: pm.card_brand || 'card',
    last4: pm.card_last4 || '****',
    expMonth: pm.card_exp_month || 0,
    expYear: pm.card_exp_year || 0,
    isDefault: pm.is_default,
    nickname: pm.nickname || undefined,
    icon: getCardIcon(pm.card_brand),
  }));
}

/**
 * Save a payment method for future use
 */
export async function savePaymentMethod(
  userId: string,
  paymentMethodId: string,
  setAsDefault: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get Stripe customer
    const customerId = await getOrCreateStripeCustomer(userId);

    // Attach payment method to customer via Edge Function
    const { data, error } = await supabase.functions.invoke('stripe-api', {
      body: {
        action: 'attachPaymentMethod',
        params: {
          paymentMethodId,
          customerId,
        },
      },
    });

    if (error) {
      throw new PaymentError('ATTACH_FAILED', error.message);
    }

    // If setting as default, update Stripe customer
    if (setAsDefault) {
      await supabase.functions.invoke('stripe-api', {
        body: {
          action: 'updateCustomer',
          params: {
            customerId,
            defaultPaymentMethod: paymentMethodId,
          },
        },
      });

      // Unset other defaults
      await supabase
        .from('user_payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    // Store in database
    await supabase.from('user_payment_methods').insert({
      user_id: userId,
      stripe_payment_method_id: paymentMethodId,
      stripe_customer_id: customerId,
      type: data.type,
      card_brand: data.card?.brand,
      card_last4: data.card?.last4,
      card_exp_month: data.card?.expMonth,
      card_exp_year: data.card?.expYear,
      is_default: setAsDefault,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Save payment method error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a saved payment method
 */
export async function removePaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the saved method
    const { data: savedMethod } = await supabase
      .from('user_payment_methods')
      .select('stripe_payment_method_id')
      .eq('id', paymentMethodId)
      .eq('user_id', userId)
      .single();

    if (!savedMethod) {
      return { success: false, error: 'Payment method not found' };
    }

    // Detach from Stripe
    await supabase.functions.invoke('stripe-api', {
      body: {
        action: 'detachPaymentMethod',
        params: { paymentMethodId: savedMethod.stripe_payment_method_id },
      },
    });

    // Mark as inactive in database
    await supabase
      .from('user_payment_methods')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', paymentMethodId);

    return { success: true };
  } catch (error: any) {
    console.error('Remove payment method error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Unset other defaults
    await supabase
      .from('user_payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Set new default
    await supabase
      .from('user_payment_methods')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', paymentMethodId)
      .eq('user_id', userId);

    return { success: true };
  } catch (error: any) {
    console.error('Set default payment method error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// TRANSACTION MANAGEMENT
// ============================================

/**
 * Get transaction by payment intent ID
 */
export async function getTransactionByPaymentIntent(
  paymentIntentId: string
): Promise<PaymentTransaction | null> {
  const { data } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  return data as PaymentTransaction | null;
}

/**
 * Get transaction by charge ID
 */
export async function getTransactionByChargeId(
  chargeId: string
): Promise<PaymentTransaction | null> {
  const { data } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('stripe_charge_id', chargeId)
    .single();

  return data as PaymentTransaction | null;
}

/**
 * Update transaction by payment intent ID
 */
export async function updateTransactionByPaymentIntent(
  paymentIntentId: string,
  updates: Partial<PaymentTransaction>
): Promise<void> {
  await supabase
    .from('payment_transactions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', paymentIntentId);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate unique transaction reference
 */
function generateTransactionReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN-${timestamp}-${random}`.toUpperCase();
}

/**
 * Map Stripe status to transaction status
 */
function mapStripeStatusToTransaction(stripeStatus: string): TransactionStatus {
  const mapping: Record<string, TransactionStatus> = {
    requires_payment_method: 'pending',
    requires_confirmation: 'pending',
    requires_action: 'pending',
    processing: 'processing',
    requires_capture: 'authorized',
    succeeded: 'succeeded',
    canceled: 'cancelled',
  };
  return mapping[stripeStatus] || 'pending';
}

/**
 * Get user-friendly payment error message
 */
function getPaymentErrorMessage(error: any): string {
  if (error.declineCode && PAYMENT_ERROR_MESSAGES[error.declineCode]) {
    return PAYMENT_ERROR_MESSAGES[error.declineCode];
  }
  if (error.code && PAYMENT_ERROR_MESSAGES[error.code]) {
    return PAYMENT_ERROR_MESSAGES[error.code];
  }
  return PAYMENT_ERROR_MESSAGES.default;
}

/**
 * Get card brand icon name
 */
function getCardIcon(brand: string | null): string {
  const icons: Record<string, string> = {
    visa: 'cc-visa',
    mastercard: 'cc-mastercard',
    amex: 'cc-amex',
    discover: 'cc-discover',
    diners: 'cc-diners-club',
    jcb: 'cc-jcb',
  };
  return icons[brand?.toLowerCase() || ''] || 'credit-card';
}

/**
 * Get app URL for redirects
 */
function getAppUrl(): string {
  // In React Native, this would be the deep link URL
  return 'guidera://';
}
