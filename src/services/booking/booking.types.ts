/**
 * BOOKING TYPES
 * 
 * Type definitions for the booking management system.
 */

// ============================================
// BOOKING STATUS TYPES
// ============================================

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'partially_confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'partially_cancelled'
  | 'refunded'
  | 'partially_refunded'
  | 'failed'
  | 'on_hold'
  | 'disputed';

export type BookingItemStatus =
  | 'pending'
  | 'confirmed'
  | 'ticketed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'schedule_changed'
  | 'failed';

export type BookingType = 'flight' | 'hotel' | 'car' | 'experience' | 'package';

// ============================================
// BOOKING ENTITY TYPES
// ============================================

export interface Booking {
  id: string;
  user_id: string;
  checkout_session_id: string | null;
  trip_id: string | null;
  booking_reference: string;
  booking_type: BookingType;
  status: BookingStatus;
  previous_status: string | null;
  status_changed_at: string;
  status_change_reason: string | null;
  total_amount: number;
  currency: string;
  amount_paid: number;
  amount_refunded: number;
  travelers: TravelerInfo[];
  contact_info: ContactInfo;
  travel_start_date: string | null;
  travel_end_date: string | null;
  is_cancelled: boolean;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  is_refundable: boolean;
  refund_deadline: string | null;
  cancellation_policy: CancellationPolicy | null;
  is_modifiable: boolean;
  modification_deadline: string | null;
  modification_count: number;
  documents_generated: boolean;
  documents: BookingDocument[];
  confirmation_sent: boolean;
  confirmation_sent_at: string | null;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  has_issue: boolean;
  issue_type: string | null;
  issue_description: string | null;
  issue_resolved: boolean;
  issue_resolved_at: string | null;
  has_dispute: boolean;
  dispute_id: string | null;
  dispute_status: string | null;
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  category: string;
  provider_code: string;
  provider_booking_id: string | null;
  provider_confirmation_number: string | null;
  status: BookingItemStatus;
  previous_status: string | null;
  status_changed_at: string;
  item_details: any;
  price_amount: number;
  price_currency: string;
  start_datetime: string | null;
  end_datetime: string | null;
  documents: BookingDocument[];
  traveler_indices: number[] | null;
  is_cancelled: boolean;
  cancelled_at: string | null;
  cancellation_fee: number | null;
  refund_amount: number | null;
  cancellation_policy: CancellationPolicy | null;
  last_synced_at: string | null;
  provider_status: string | null;
  provider_raw_status: any | null;
  original_details: any | null;
  schedule_change_detected_at: string | null;
  schedule_change_acknowledged: boolean;
  schedule_change_acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithItems extends Booking {
  items: BookingItem[];
}

// ============================================
// TRAVELER & CONTACT TYPES
// ============================================

export interface TravelerInfo {
  type: 'adult' | 'child' | 'infant';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  document?: {
    type: string;
    number: string;
    issuingCountry: string;
    expiryDate: string;
  };
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode?: string;
}

// ============================================
// DOCUMENT TYPES
// ============================================

export interface BookingDocument {
  type: 'eticket' | 'hotel_voucher' | 'car_voucher' | 'experience_voucher' | 'itinerary' | 'receipt';
  format: 'pdf' | 'pkpass' | 'html';
  url: string;
  generatedAt: string;
  expiresAt?: string;
}

// ============================================
// CANCELLATION TYPES
// ============================================

export interface CancellationPolicy {
  isRefundable: boolean;
  rules: CancellationRule[];
  nonRefundableAfterDeadline?: boolean;
}

export interface CancellationRule {
  deadline: string;
  penaltyType: 'percentage' | 'fixed' | 'nights' | 'full';
  penaltyValue: number;
  description?: string;
}

export interface CancellationRequest {
  id: string;
  booking_id: string;
  requested_by: 'user' | 'provider' | 'system' | 'support';
  request_reason: string | null;
  request_notes: string | null;
  cancellation_type: 'full' | 'partial';
  items_to_cancel: string[] | null;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'partial' | 'failed';
  refund_calculation: RefundCalculation | null;
  policy_applied: CancellationPolicy | null;
  provider_cancellations: ProviderCancellation[];
  refund_id: string | null;
  refund_status: string | null;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  auto_processed: boolean;
  auto_process_reason: string | null;
}

export interface RefundCalculation {
  originalAmount: number;
  itemBreakdown: {
    itemId: string;
    category: string;
    originalAmount: number;
    cancellationFee: number;
    refundAmount: number;
    policy: string;
  }[];
  totalFee: number;
  refundAmount: number;
  currency: string;
  isAutomatable: boolean;
  automationReason?: string;
}

export interface ProviderCancellation {
  provider: string;
  item_id: string;
  status: 'cancelled' | 'failed' | 'pending';
  reference?: string;
  cancelled_at?: string;
  error?: string;
}

// ============================================
// MODIFICATION TYPES
// ============================================

export interface BookingModification {
  id: string;
  booking_id: string;
  booking_item_id: string | null;
  modification_type: 'name_change' | 'date_change' | 'upgrade' | 'add_service' | 'other';
  status: 'pending' | 'submitted' | 'confirmed' | 'rejected' | 'failed';
  requested_by: string;
  request_details: any;
  original_data: any;
  modified_data: any;
  provider_code: string | null;
  provider_modification_id: string | null;
  provider_response: any;
  price_difference: number | null;
  fee_amount: number | null;
  total_cost: number | null;
  payment_required: boolean;
  payment_transaction_id: string | null;
  created_at: string;
  submitted_at: string | null;
  completed_at: string | null;
  internal_notes: string | null;
  user_notes: string | null;
}

// ============================================
// SCHEDULE CHANGE TYPES
// ============================================

export interface ScheduleChange {
  itemId: string;
  changeType: 'time_change' | 'route_change' | 'equipment_change' | 'cancellation';
  original: any;
  updated: any;
  significance: 'minor' | 'major' | 'critical';
  detectedAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

// ============================================
// REFUND TYPES
// ============================================

export interface Refund {
  id: string;
  booking_id: string;
  cancellation_request_id: string | null;
  original_transaction_id: string | null;
  refund_reference: string;
  stripe_refund_id: string | null;
  stripe_status: string | null;
  amount: number;
  currency: string;
  refund_breakdown: any;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  reason: string | null;
  requested_by: string | null;
  processed_at: string | null;
  failure_reason: string | null;
  retry_count: number;
  estimated_arrival: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// DISPUTE TYPES
// ============================================

export interface Dispute {
  id: string;
  booking_id: string;
  stripe_dispute_id: string;
  stripe_charge_id: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  evidence_due_by: string;
  evidence_submitted: boolean;
  evidence_submitted_at: string | null;
  evidence_data: any;
  outcome: string | null;
  outcome_reason: string | null;
  assigned_to: string | null;
  priority: string;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

// ============================================
// STATUS TRANSITION TYPES
// ============================================

export const VALID_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'failed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled', 'on_hold', 'disputed'],
  partially_confirmed: ['confirmed', 'cancelled', 'failed'],
  in_progress: ['completed', 'cancelled', 'on_hold'],
  completed: ['refunded', 'partially_refunded', 'disputed'],
  cancelled: ['refunded', 'partially_refunded'],
  partially_cancelled: ['cancelled', 'refunded', 'partially_refunded'],
  refunded: [],
  partially_refunded: ['refunded'],
  failed: ['pending'],
  on_hold: ['confirmed', 'cancelled'],
  disputed: ['confirmed', 'refunded', 'cancelled'],
};

export function isValidStatusTransition(
  currentStatus: BookingStatus,
  newStatus: BookingStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}
