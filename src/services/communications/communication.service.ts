/**
 * COMMUNICATION SERVICE
 * 
 * Handles email, SMS, and push notifications for bookings.
 */

import { supabase } from '@/lib/supabase/client';
import {
  CommunicationType,
  CommunicationChannel,
  CommunicationStatus,
  Communication,
  SendEmailRequest,
  SendEmailResult,
  SendSMSRequest,
  SendSMSResult,
  SendPushRequest,
  SendPushResult,
  PushNotificationPayload,
  EMAIL_TEMPLATES,
  PUSH_TEMPLATES,
} from './communication.types';
import { BookingWithItems } from '../booking/booking.types';
import { getBookingWithItems } from '../booking/booking-lifecycle.service';

// ============================================
// EMAIL FUNCTIONS
// ============================================

/**
 * Send email using template
 */
export async function sendEmail(request: SendEmailRequest): Promise<SendEmailResult> {
  const { to, template, data, attachments, bookingId, userId } = request;

  // Get template config
  const templateConfig = EMAIL_TEMPLATES[template];
  if (!templateConfig) {
    return { success: false, error: `Unknown template: ${template}` };
  }

  // Interpolate subject
  const subject = interpolateTemplate(templateConfig.subject, data);

  // Create communication record
  const { data: comm, error: commError } = await supabase
    .from('booking_communications')
    .insert({
      booking_id: bookingId || null,
      type: template as CommunicationType,
      channel: 'email',
      recipient_email: to,
      recipient_user_id: userId || null,
      subject,
      template_id: template,
      template_data: data,
      status: 'pending',
      retry_count: 0,
    })
    .select('id')
    .single();

  if (commError) {
    console.error('Failed to create communication record:', commError);
  }

  try {
    // Send via edge function (which calls SendGrid/Resend)
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        template,
        data,
        attachments,
      },
    });

    if (error) throw error;

    // Update communication record
    if (comm?.id) {
      await supabase
        .from('booking_communications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider: 'sendgrid',
          provider_message_id: result?.messageId,
        })
        .eq('id', comm.id);
    }

    return { success: true, messageId: result?.messageId };
  } catch (error: any) {
    console.error('Email send failed:', error);

    // Update communication record with failure
    if (comm?.id) {
      await supabase
        .from('booking_communications')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: error.message,
          retry_count: 1,
          next_retry_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
        })
        .eq('id', comm.id);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(booking: BookingWithItems): Promise<SendEmailResult> {
  const contact = booking.contact_info as any;
  if (!contact?.email) {
    return { success: false, error: 'No contact email' };
  }

  const destination = getDestinationFromBooking(booking);

  const result = await sendEmail({
    to: contact.email,
    template: 'booking_confirmation',
    data: {
      customerName: contact.firstName,
      booking_reference: booking.booking_reference,
      destination,
      travel_dates: formatDateRange(booking.travel_start_date, booking.travel_end_date),
      travelers: booking.travelers,
      items: booking.items.map(formatItemForEmail),
      total_amount: formatCurrency(booking.total_amount, booking.currency),
      support_email: 'support@guidera.com',
      support_phone: '+1-888-GUIDERA',
    },
    bookingId: booking.id,
    userId: booking.user_id,
  });

  if (result.success) {
    await supabase
      .from('bookings')
      .update({
        confirmation_sent: true,
        confirmation_sent_at: new Date().toISOString(),
      })
      .eq('id', booking.id);
  }

  return result;
}

/**
 * Send cancellation confirmation email
 */
export async function sendCancellationConfirmation(
  booking: BookingWithItems,
  refundAmount?: number
): Promise<SendEmailResult> {
  const contact = booking.contact_info as any;
  if (!contact?.email) {
    return { success: false, error: 'No contact email' };
  }

  return await sendEmail({
    to: contact.email,
    template: 'cancellation_confirmation',
    data: {
      customerName: contact.firstName,
      booking_reference: booking.booking_reference,
      cancellation_date: new Date().toISOString(),
      refund_amount: refundAmount ? formatCurrency(refundAmount, booking.currency) : 'N/A',
      refund_timeline: '5-10 business days',
      support_email: 'support@guidera.com',
    },
    bookingId: booking.id,
    userId: booking.user_id,
  });
}

/**
 * Send refund confirmation email
 */
export async function sendRefundConfirmation(
  booking: BookingWithItems,
  refundAmount: number
): Promise<SendEmailResult> {
  const contact = booking.contact_info as any;
  if (!contact?.email) {
    return { success: false, error: 'No contact email' };
  }

  return await sendEmail({
    to: contact.email,
    template: 'refund_confirmation',
    data: {
      customerName: contact.firstName,
      booking_reference: booking.booking_reference,
      amount: formatCurrency(refundAmount, booking.currency),
      refund_date: new Date().toISOString(),
      estimated_arrival: '5-10 business days',
      support_email: 'support@guidera.com',
    },
    bookingId: booking.id,
    userId: booking.user_id,
  });
}

/**
 * Send schedule change notification
 */
export async function sendScheduleChangeNotification(
  booking: BookingWithItems,
  itemCategory: string,
  changeDetails: any
): Promise<SendEmailResult> {
  const contact = booking.contact_info as any;
  if (!contact?.email) {
    return { success: false, error: 'No contact email' };
  }

  return await sendEmail({
    to: contact.email,
    template: 'schedule_change',
    data: {
      customerName: contact.firstName,
      booking_reference: booking.booking_reference,
      category: itemCategory,
      change_type: changeDetails.changeType,
      original: changeDetails.original,
      updated: changeDetails.updated,
      significance: changeDetails.significance,
      action_required: changeDetails.significance === 'critical',
      support_email: 'support@guidera.com',
    },
    bookingId: booking.id,
    userId: booking.user_id,
  });
}

/**
 * Send trip reminder email
 */
export async function sendTripReminder(
  booking: BookingWithItems,
  reminderType: 'week_before' | 'day_before'
): Promise<SendEmailResult> {
  const contact = booking.contact_info as any;
  if (!contact?.email) {
    return { success: false, error: 'No contact email' };
  }

  const template = reminderType === 'week_before' ? 'trip_reminder_week' : 'trip_reminder_day';
  const destination = getDestinationFromBooking(booking);

  const result = await sendEmail({
    to: contact.email,
    template,
    data: {
      customerName: contact.firstName,
      booking_reference: booking.booking_reference,
      destination,
      travel_date: booking.travel_start_date,
      items: booking.items.map(formatItemForEmail),
      checklist: getReminderChecklist(reminderType),
      support_email: 'support@guidera.com',
    },
    bookingId: booking.id,
    userId: booking.user_id,
  });

  if (result.success) {
    await supabase
      .from('bookings')
      .update({
        reminder_sent: true,
        reminder_sent_at: new Date().toISOString(),
      })
      .eq('id', booking.id);
  }

  return result;
}

/**
 * Send review request email
 */
export async function sendReviewRequest(booking: BookingWithItems): Promise<SendEmailResult> {
  const contact = booking.contact_info as any;
  if (!contact?.email) {
    return { success: false, error: 'No contact email' };
  }

  const destination = getDestinationFromBooking(booking);

  return await sendEmail({
    to: contact.email,
    template: 'review_request',
    data: {
      customerName: contact.firstName,
      booking_reference: booking.booking_reference,
      destination,
      review_url: `https://guidera.com/review/${booking.booking_reference}`,
      support_email: 'support@guidera.com',
    },
    bookingId: booking.id,
    userId: booking.user_id,
  });
}

// ============================================
// SMS FUNCTIONS
// ============================================

/**
 * Send SMS message
 */
export async function sendSMS(request: SendSMSRequest): Promise<SendSMSResult> {
  const { to, message, bookingId, userId } = request;

  // Create communication record
  const { data: comm } = await supabase
    .from('booking_communications')
    .insert({
      booking_id: bookingId || null,
      type: 'confirmation_sms',
      channel: 'sms',
      recipient_phone: to,
      recipient_user_id: userId || null,
      template_data: { message },
      status: 'pending',
      retry_count: 0,
    })
    .select('id')
    .single();

  try {
    // Send via edge function (which calls Twilio)
    const { data: result, error } = await supabase.functions.invoke('send-sms', {
      body: { to, message },
    });

    if (error) throw error;

    if (comm?.id) {
      await supabase
        .from('booking_communications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider: 'twilio',
          provider_message_id: result?.messageId,
        })
        .eq('id', comm.id);
    }

    return { success: true, messageId: result?.messageId };
  } catch (error: any) {
    if (comm?.id) {
      await supabase
        .from('booking_communications')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: error.message,
        })
        .eq('id', comm.id);
    }

    return { success: false, error: error.message };
  }
}

// ============================================
// PUSH NOTIFICATION FUNCTIONS
// ============================================

/**
 * Send push notification to user
 */
export async function sendPushNotification(request: SendPushRequest): Promise<SendPushResult> {
  const { userId, payload, bookingId } = request;

  // Get user's device tokens
  const { data: devices } = await supabase
    .from('user_devices')
    .select('push_token, platform')
    .eq('user_id', userId)
    .eq('push_enabled', true);

  if (!devices || devices.length === 0) {
    return { success: true, delivered: 0, failed: 0 };
  }

  let delivered = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const device of devices) {
    try {
      const { error } = await supabase.functions.invoke('send-push', {
        body: {
          token: device.push_token,
          platform: device.platform,
          payload,
        },
      });

      if (error) throw error;
      delivered++;
    } catch (error: any) {
      failed++;
      errors.push(error.message);

      // Handle invalid tokens
      if (isInvalidTokenError(error)) {
        await removeDeviceToken(userId, device.push_token);
      }
    }
  }

  // Record communication
  await supabase.from('booking_communications').insert({
    booking_id: bookingId || null,
    type: 'trip_reminder',
    channel: 'push',
    recipient_user_id: userId,
    template_data: payload,
    status: delivered > 0 ? 'sent' : 'failed',
    sent_at: delivered > 0 ? new Date().toISOString() : null,
    failed_at: failed > 0 ? new Date().toISOString() : null,
    failure_reason: errors.length > 0 ? errors.join('; ') : null,
  });

  return { success: delivered > 0, delivered, failed, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Send push notification using template
 */
export async function sendPushFromTemplate(
  userId: string,
  template: string,
  data: Record<string, any>,
  bookingId?: string
): Promise<SendPushResult> {
  const templateConfig = PUSH_TEMPLATES[template];
  if (!templateConfig) {
    return { success: false, delivered: 0, failed: 1, errors: [`Unknown template: ${template}`] };
  }

  const payload: PushNotificationPayload = {
    title: interpolateTemplate(templateConfig.title, data),
    body: interpolateTemplate(templateConfig.body, data),
    data: {
      type: template,
      bookingId,
      ...data,
    },
  };

  return await sendPushNotification({ userId, payload, bookingId });
}

/**
 * Send booking confirmed push notification
 */
export async function sendBookingConfirmedPush(booking: BookingWithItems): Promise<SendPushResult> {
  if (!booking.user_id) {
    return { success: false, delivered: 0, failed: 0 };
  }

  const destination = getDestinationFromBooking(booking);

  return await sendPushFromTemplate(
    booking.user_id,
    'booking_confirmed',
    { destination, bookingId: booking.id },
    booking.id
  );
}

/**
 * Send documents ready push notification
 */
export async function sendDocumentsReadyPush(booking: BookingWithItems): Promise<SendPushResult> {
  if (!booking.user_id) {
    return { success: false, delivered: 0, failed: 0 };
  }

  return await sendPushFromTemplate(
    booking.user_id,
    'documents_ready',
    { bookingId: booking.id },
    booking.id
  );
}

/**
 * Send trip reminder push notification
 */
export async function sendTripReminderPush(
  booking: BookingWithItems,
  reminderType: 'week_before' | 'day_before'
): Promise<SendPushResult> {
  if (!booking.user_id) {
    return { success: false, delivered: 0, failed: 0 };
  }

  const template = reminderType === 'week_before' ? 'trip_reminder_week' : 'trip_reminder_day';
  const destination = getDestinationFromBooking(booking);

  return await sendPushFromTemplate(booking.user_id, template, { destination }, booking.id);
}

// ============================================
// REMINDER SCHEDULING
// ============================================

/**
 * Schedule reminders for a booking
 */
export async function scheduleReminders(booking: BookingWithItems): Promise<void> {
  if (!booking.travel_start_date) return;

  const startDate = new Date(booking.travel_start_date);
  const now = new Date();

  // Schedule 1 week before reminder
  const oneWeekBefore = new Date(startDate);
  oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);
  oneWeekBefore.setHours(9, 0, 0, 0); // 9 AM

  if (oneWeekBefore > now) {
    await scheduleJob('send_trip_reminder', {
      booking_id: booking.id,
      reminder_type: 'week_before',
    }, oneWeekBefore);
  }

  // Schedule 1 day before reminder
  const oneDayBefore = new Date(startDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  oneDayBefore.setHours(9, 0, 0, 0); // 9 AM

  if (oneDayBefore > now) {
    await scheduleJob('send_trip_reminder', {
      booking_id: booking.id,
      reminder_type: 'day_before',
    }, oneDayBefore);
  }

  // Schedule review request (3 days after trip ends)
  if (booking.travel_end_date) {
    const reviewDate = new Date(booking.travel_end_date);
    reviewDate.setDate(reviewDate.getDate() + 3);
    reviewDate.setHours(10, 0, 0, 0); // 10 AM

    await scheduleJob('send_review_request', {
      booking_id: booking.id,
    }, reviewDate);
  }
}

/**
 * Schedule a job
 */
async function scheduleJob(jobType: string, jobData: any, scheduledFor: Date): Promise<void> {
  await supabase.from('scheduled_jobs').insert({
    job_type: jobType,
    job_data: jobData,
    scheduled_for: scheduledFor.toISOString(),
    status: 'pending',
    booking_id: jobData.booking_id,
  });
}

// ============================================
// RETRY FAILED COMMUNICATIONS
// ============================================

/**
 * Retry failed communications
 */
export async function retryFailedCommunications(): Promise<{ retried: number; succeeded: number }> {
  const now = new Date();

  // Get failed communications ready for retry
  const { data: failedComms } = await supabase
    .from('booking_communications')
    .select('*')
    .eq('status', 'failed')
    .lt('retry_count', 3)
    .lte('next_retry_at', now.toISOString())
    .limit(50);

  if (!failedComms || failedComms.length === 0) {
    return { retried: 0, succeeded: 0 };
  }

  let succeeded = 0;

  for (const comm of failedComms) {
    try {
      let result: { success: boolean };

      if (comm.channel === 'email') {
        result = await sendEmail({
          to: comm.recipient_email!,
          template: comm.template_id,
          data: comm.template_data,
          bookingId: comm.booking_id,
          userId: comm.recipient_user_id,
        });
      } else if (comm.channel === 'sms') {
        result = await sendSMS({
          to: comm.recipient_phone!,
          message: comm.template_data.message,
          bookingId: comm.booking_id,
          userId: comm.recipient_user_id,
        });
      } else {
        continue;
      }

      if (result.success) {
        succeeded++;
      }
    } catch (error) {
      // Update retry count
      const nextRetry = new Date(now.getTime() + (comm.retry_count + 1) * 30 * 60 * 1000); // Exponential backoff
      await supabase
        .from('booking_communications')
        .update({
          retry_count: comm.retry_count + 1,
          next_retry_at: nextRetry.toISOString(),
        })
        .eq('id', comm.id);
    }
  }

  return { retried: failedComms.length, succeeded };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function interpolateTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
}

function getDestinationFromBooking(booking: BookingWithItems): string {
  for (const item of booking.items) {
    if (item.category === 'flight') {
      const lastSlice = item.item_details?.slices?.[item.item_details.slices.length - 1];
      const lastSegment = lastSlice?.segments?.[lastSlice.segments.length - 1];
      if (lastSegment?.destination?.city) {
        return lastSegment.destination.city;
      }
    } else if (item.category === 'hotel') {
      if (item.item_details?.city) {
        return item.item_details.city;
      }
    }
  }
  return 'your destination';
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  const startDate = new Date(start);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  if (!end || start === end) {
    return startDate.toLocaleDateString('en-US', options);
  }
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

function formatItemForEmail(item: any): any {
  const details = item.item_details;
  return {
    category: item.category,
    title: getItemTitle(item),
    dates: formatItemDates(item),
    confirmationNumber: item.provider_confirmation_number,
    price: formatCurrency(item.price_amount, item.price_currency),
  };
}

function getItemTitle(item: any): string {
  const details = item.item_details;
  switch (item.category) {
    case 'flight':
      const origin = details?.slices?.[0]?.segments?.[0]?.origin?.code || '';
      const dest = details?.slices?.[details.slices.length - 1]?.segments?.slice(-1)[0]?.destination?.code || '';
      return `Flight: ${origin} → ${dest}`;
    case 'hotel':
      return details?.name || 'Hotel';
    case 'car':
      return `Car Rental: ${details?.category || 'Vehicle'}`;
    case 'experience':
      return details?.name || details?.title || 'Experience';
    default:
      return item.category;
  }
}

function formatItemDates(item: any): string {
  const start = item.start_datetime?.split('T')[0];
  const end = item.end_datetime?.split('T')[0];
  if (start && end && start !== end) {
    return formatDateRange(start, end);
  }
  return start ? new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
}

function getReminderChecklist(type: 'week_before' | 'day_before'): string[] {
  if (type === 'week_before') {
    return [
      'Check passport validity (6 months from travel date)',
      'Review visa requirements',
      'Confirm hotel and flight details',
      'Start packing essentials',
      'Arrange airport transportation',
    ];
  }
  return [
    'Complete online check-in',
    'Print or download boarding passes',
    'Pack carry-on with essentials',
    'Charge all devices',
    'Set out-of-office replies',
  ];
}

function isInvalidTokenError(error: any): boolean {
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('invalid') ||
    message.includes('unregistered') ||
    message.includes('not found')
  );
}

async function removeDeviceToken(userId: string, token: string): Promise<void> {
  await supabase
    .from('user_devices')
    .delete()
    .eq('user_id', userId)
    .eq('push_token', token);
}
