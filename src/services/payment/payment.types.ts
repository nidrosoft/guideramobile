/**
 * PAYMENT TYPES
 * 
 * Type definitions for payment processing with Stripe.
 */

// ============================================
// PAYMENT TRANSACTION TYPES
// ============================================

export type TransactionType = 
  | 'payment'
  | 'authorization'
  | 'capture'
  | 'refund'
  | 'void';

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'authorized'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface PaymentTransaction {
  id: string;
  checkout_session_id: string | null;
  booking_id: string | null;
  user_id: string;
  transaction_reference: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  failure_code: string | null;
  failure_message: string | null;
  decline_code: string | null;
  original_transaction_id: string | null;
  refund_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  authorized_at: string | null;
  captured_at: string | null;
  failed_at: string | null;
  refunded_at: string | null;
}

// ============================================
// STRIPE CUSTOMER TYPES
// ============================================

export interface StripeCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// SAVED PAYMENT METHOD TYPES
// ============================================

export interface SavedPaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  stripe_customer_id: string | null;
  type: string;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  is_default: boolean;
  nickname: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodDisplay {
  id: string;
  type: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  nickname?: string;
  icon?: string;
}

// ============================================
// PAYMENT INTENT TYPES
// ============================================

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  customerId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  idempotencyKey: string;
  captureMethod?: 'automatic' | 'manual';
  setupFutureUsage?: 'on_session' | 'off_session';
}

export interface PaymentIntentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  status?: string;
  requiresAction?: boolean;
  actionUrl?: string;
  error?: {
    code: string;
    message: string;
    declineCode?: string;
  };
}

export interface ConfirmPaymentParams {
  paymentIntentId: string;
  paymentMethodId: string;
  returnUrl?: string;
}

export interface CapturePaymentParams {
  paymentIntentId: string;
  amount?: number;
  idempotencyKey: string;
}

// ============================================
// REFUND TYPES
// ============================================

export interface CreateRefundParams {
  chargeId: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
  idempotencyKey: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status?: string;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// PAYMENT ERROR TYPES
// ============================================

export class PaymentError extends Error {
  code: string;
  declineCode?: string;
  details?: any;

  constructor(code: string, message: string, declineCode?: string, details?: any) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.declineCode = declineCode;
    this.details = details;
  }
}

export const PAYMENT_ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'Your card was declined. Please try a different card.',
  insufficient_funds: 'Your card has insufficient funds. Please try a different card.',
  expired_card: 'Your card has expired. Please use a different card.',
  incorrect_cvc: 'The security code (CVC) is incorrect. Please check and try again.',
  incorrect_number: 'The card number is incorrect. Please check and try again.',
  processing_error: 'An error occurred processing your card. Please try again.',
  authentication_required: 'Additional authentication is required. Please complete the verification.',
  card_not_supported: 'This card does not support the required authentication.',
  rate_limit: 'Too many attempts. Please wait a moment and try again.',
  generic_decline: 'Your card was declined. Please contact your bank or try a different card.',
  try_again_later: 'Unable to process payment at this time. Please try again later.',
  fraudulent: 'This payment has been flagged. Please contact support.',
  default: 'Payment failed. Please try a different payment method.',
};

// ============================================
// WEBHOOK EVENT TYPES
// ============================================

export interface StripeWebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  processed_at: string | null;
  processing_error: string | null;
  retry_count: number;
  payload: any;
  payment_transaction_id: string | null;
  booking_id: string | null;
  received_at: string;
  idempotency_processed: boolean;
}

export type StripeEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'payment_intent.requires_action'
  | 'charge.refunded'
  | 'charge.refund.updated'
  | 'charge.dispute.created'
  | 'charge.dispute.updated'
  | 'charge.dispute.closed';
