/**
 * COMMUNICATION TYPES
 * 
 * Type definitions for the communication engine.
 */

// ============================================
// COMMUNICATION TYPES
// ============================================

export type CommunicationType =
  | 'confirmation_email'
  | 'confirmation_sms'
  | 'reminder_email'
  | 'schedule_change_alert'
  | 'cancellation_notice'
  | 'refund_confirmation'
  | 'modification_confirmation'
  | 'document_delivery'
  | 'trip_reminder'
  | 'review_request'
  | 'payment_failed'
  | 'payment_succeeded'
  | 'dispute_notice'
  | 'welcome_email'
  | 'password_reset';

export type CommunicationChannel = 'email' | 'sms' | 'push';

export type CommunicationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed';

// ============================================
// COMMUNICATION RECORD
// ============================================

export interface Communication {
  id: string;
  booking_id: string | null;
  type: CommunicationType;
  channel: CommunicationChannel;
  recipient_email?: string;
  recipient_phone?: string;
  recipient_user_id?: string;
  subject?: string;
  template_id: string;
  template_data: Record<string, any>;
  status: CommunicationStatus;
  provider?: string;
  provider_message_id?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  failed_at?: string;
  failure_reason?: string;
  retry_count: number;
  next_retry_at?: string;
  created_at: string;
}

// ============================================
// EMAIL TYPES
// ============================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
  htmlTemplate: string;
  textTemplate?: string;
}

export interface SendEmailRequest {
  to: string;
  template: string;
  data: Record<string, any>;
  attachments?: EmailAttachment[];
  bookingId?: string;
  userId?: string;
}

export interface EmailAttachment {
  filename: string;
  url?: string;
  content?: string;
  contentType?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// SMS TYPES
// ============================================

export interface SendSMSRequest {
  to: string;
  message: string;
  bookingId?: string;
  userId?: string;
}

export interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// PUSH NOTIFICATION TYPES
// ============================================

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  imageUrl?: string;
  actionUrl?: string;
}

export interface SendPushRequest {
  userId: string;
  payload: PushNotificationPayload;
  bookingId?: string;
}

export interface SendPushResult {
  success: boolean;
  delivered: number;
  failed: number;
  errors?: string[];
}

// ============================================
// EMAIL TEMPLATES CONFIG
// ============================================

export const EMAIL_TEMPLATES: Record<string, { subject: string; preheader: string }> = {
  booking_confirmation: {
    subject: 'Booking Confirmed: {{destination}} - {{booking_reference}}',
    preheader: 'Your trip is booked! Here are your details.',
  },
  booking_documents: {
    subject: 'Your Travel Documents - {{booking_reference}}',
    preheader: 'Your e-tickets and vouchers are ready.',
  },
  schedule_change: {
    subject: '⚠️ Schedule Change: Your {{category}} booking has changed',
    preheader: 'Important: Your travel plans have been updated.',
  },
  cancellation_confirmation: {
    subject: 'Booking Cancelled: {{booking_reference}}',
    preheader: 'Your cancellation has been processed.',
  },
  refund_confirmation: {
    subject: 'Refund Processed: {{amount}} for booking {{booking_reference}}',
    preheader: 'Your refund is on its way.',
  },
  modification_confirmation: {
    subject: 'Booking Modified: {{booking_reference}}',
    preheader: 'Your booking changes have been confirmed.',
  },
  trip_reminder_week: {
    subject: '✈️ Your trip to {{destination}} is in 1 week!',
    preheader: 'Get ready for your upcoming adventure.',
  },
  trip_reminder_day: {
    subject: '✈️ Your trip to {{destination}} is tomorrow!',
    preheader: 'Final preparations for your trip.',
  },
  review_request: {
    subject: 'How was your trip to {{destination}}?',
    preheader: "We'd love to hear about your experience.",
  },
  payment_failed: {
    subject: 'Payment Failed - Action Required',
    preheader: 'There was an issue with your payment.',
  },
  payment_succeeded: {
    subject: 'Payment Successful - {{booking_reference}}',
    preheader: 'Your payment has been processed.',
  },
  provider_cancellation: {
    subject: '⚠️ Important: Your booking has been cancelled by the provider',
    preheader: 'We need to inform you about a change to your booking.',
  },
};

// ============================================
// PUSH NOTIFICATION TEMPLATES
// ============================================

export const PUSH_TEMPLATES: Record<string, { title: string; body: string }> = {
  booking_confirmed: {
    title: 'Booking Confirmed! 🎉',
    body: 'Your trip to {{destination}} is booked. Tap to view details.',
  },
  documents_ready: {
    title: 'Your travel documents are ready! 📄',
    body: 'Tap to view your booking confirmation and tickets.',
  },
  schedule_change: {
    title: '⚠️ Schedule Change',
    body: 'Your {{category}} has been updated. Tap to review.',
  },
  trip_reminder_week: {
    title: '1 Week Until Your Trip! ✈️',
    body: 'Your trip to {{destination}} is coming up. Time to start packing!',
  },
  trip_reminder_day: {
    title: 'Trip Tomorrow! 🌟',
    body: 'Your adventure to {{destination}} starts tomorrow!',
  },
  refund_processed: {
    title: 'Refund Processed 💰',
    body: '{{amount}} has been refunded to your account.',
  },
  check_in_available: {
    title: 'Online Check-in Available ✓',
    body: 'Check in now for your flight to {{destination}}.',
  },
};

// ============================================
// REMINDER TYPES
// ============================================

export interface ReminderSchedule {
  type: 'trip_reminder';
  reminderType: 'week_before' | 'day_before' | '3_hours_before';
  bookingId: string;
  scheduledFor: Date;
}
