/**
 * SCHEDULED JOBS EDGE FUNCTION
 * 
 * Handles scheduled tasks for booking management:
 * - Sync bookings with providers
 * - Send trip reminders
 * - Mark completed bookings
 * - Process pending refunds
 * - Retry failed communications
 * - Check dispute deadlines
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface JobResult {
  job: string;
  success: boolean;
  processed: number;
  errors: string[];
}

serve(async (req: Request) => {
  // Verify request is from authorized source (cron or admin)
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  
  if (authHeader !== `Bearer ${cronSecret}` && !authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { jobType } = await req.json().catch(() => ({ jobType: 'all' }));

  const results: JobResult[] = [];

  try {
    switch (jobType) {
      case 'sync_bookings':
        results.push(await syncActiveBookings());
        break;

      case 'process_reminders':
        results.push(await processPendingReminders());
        break;

      case 'mark_completed':
        results.push(await markCompletedBookings());
        break;

      case 'process_refunds':
        results.push(await processPendingRefunds());
        break;

      case 'retry_communications':
        results.push(await retryFailedCommunications());
        break;

      case 'check_disputes':
        results.push(await checkDisputeDeadlines());
        break;

      case 'cleanup':
        results.push(await cleanupExpiredData());
        break;

      case 'trip_transitions':
        results.push(await processTripTransitions());
        break;

      case 'all':
      default:
        // Run all jobs
        results.push(await processPendingJobs());
        results.push(await syncActiveBookings());
        results.push(await markCompletedBookings());
        results.push(await checkDisputeDeadlines());
        results.push(await processTripTransitions());
        break;
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Scheduled job error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// ============================================
// PROCESS PENDING JOBS
// ============================================

async function processPendingJobs(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  // Get pending jobs that are due
  const { data: jobs, error } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(100);

  if (error) {
    return { job: 'process_pending_jobs', success: false, processed: 0, errors: [error.message] };
  }

  for (const job of jobs || []) {
    try {
      // Mark as processing
      await supabase
        .from('scheduled_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', job.id);

      // Execute job based on type
      await executeJob(job);

      // Mark as completed
      await supabase
        .from('scheduled_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', job.id);

      processed++;
    } catch (err: any) {
      errors.push(`Job ${job.id} (${job.job_type}): ${err.message}`);

      // Mark as failed
      await supabase
        .from('scheduled_jobs')
        .update({
          status: 'failed',
          error_message: err.message,
          retry_count: (job.retry_count || 0) + 1,
        })
        .eq('id', job.id);

      // Reschedule if retries available
      if ((job.retry_count || 0) < 3) {
        const nextRetry = new Date(Date.now() + (job.retry_count + 1) * 15 * 60 * 1000);
        await supabase
          .from('scheduled_jobs')
          .update({
            status: 'pending',
            scheduled_for: nextRetry.toISOString(),
          })
          .eq('id', job.id);
      }
    }
  }

  return { job: 'process_pending_jobs', success: errors.length === 0, processed, errors };
}

async function executeJob(job: any): Promise<void> {
  const { job_type, job_data } = job;

  switch (job_type) {
    case 'send_trip_reminder':
      await sendTripReminder(job_data.booking_id, job_data.reminder_type);
      break;

    case 'send_review_request':
      await sendReviewRequest(job_data.booking_id);
      break;

    case 'generate_documents':
      await generateDocuments(job_data.booking_id);
      break;

    case 'send_confirmation':
      await sendConfirmation(job_data.booking_id);
      break;

    case 'sync_booking':
      await syncBooking(job_data.booking_id);
      break;

    case 'process_refund':
      await processRefund(job_data.refund_id);
      break;

    case 'send_cancellation_confirmation':
      await sendCancellationConfirmation(job_data.booking_id);
      break;

    case 'send_refund_confirmation':
      await sendRefundConfirmation(job_data.booking_id, job_data.amount);
      break;

    case 'schedule_reminders':
      await scheduleReminders(job_data.booking_id);
      break;

    default:
      console.log(`Unknown job type: ${job_type}`);
  }
}

// ============================================
// SYNC ACTIVE BOOKINGS
// ============================================

async function syncActiveBookings(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  // Get bookings that need sync (not synced in last 6 hours, travel not completed)
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, booking_reference')
    .in('status', ['confirmed', 'ticketed', 'modified'])
    .gt('travel_end_date', new Date().toISOString())
    .or(`last_synced_at.is.null,last_synced_at.lt.${sixHoursAgo}`)
    .limit(50);

  if (error) {
    return { job: 'sync_bookings', success: false, processed: 0, errors: [error.message] };
  }

  for (const booking of bookings || []) {
    try {
      await syncBooking(booking.id);
      processed++;
    } catch (err: any) {
      errors.push(`Booking ${booking.booking_reference}: ${err.message}`);
    }
  }

  return { job: 'sync_bookings', success: errors.length === 0, processed, errors };
}

async function syncBooking(bookingId: string): Promise<void> {
  // Get booking items
  const { data: items } = await supabase
    .from('booking_items')
    .select('*')
    .eq('booking_id', bookingId)
    .not('provider_booking_id', 'is', null);

  if (!items || items.length === 0) return;

  for (const item of items) {
    try {
      // Call provider manager to get status
      const { data, error } = await supabase.functions.invoke('provider-manager', {
        body: {
          action: 'getBookingStatus',
          provider: item.provider_code,
          category: item.category,
          params: { providerBookingId: item.provider_booking_id },
        },
      });

      if (error) throw error;

      // Check for schedule changes
      if (data?.scheduleChanged) {
        await handleScheduleChange(bookingId, item.id, data);
      }

      // Update item sync status
      await supabase
        .from('booking_items')
        .update({
          last_synced_at: new Date().toISOString(),
          provider_status: data?.status,
          provider_raw_status: data,
        })
        .eq('id', item.id);
    } catch (err: any) {
      console.error(`Sync failed for item ${item.id}:`, err);
    }
  }

  // Update booking sync status
  await supabase
    .from('bookings')
    .update({
      last_synced_at: new Date().toISOString(),
      sync_status: 'synced',
    })
    .eq('id', bookingId);
}

async function handleScheduleChange(bookingId: string, itemId: string, data: any): Promise<void> {
  // Update item with schedule change
  await supabase
    .from('booking_items')
    .update({
      schedule_change_detected_at: new Date().toISOString(),
      schedule_change_acknowledged: false,
      original_details: data.originalDetails,
      item_details: data.updatedDetails,
      status: 'schedule_changed',
    })
    .eq('id', itemId);

  // Get booking for notification
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, contact_info')
    .eq('id', bookingId)
    .single();

  if (booking) {
    // Send notification
    await supabase.from('booking_communications').insert({
      booking_id: bookingId,
      type: 'schedule_change_alert',
      channel: 'email',
      recipient_email: booking.contact_info?.email,
      recipient_user_id: booking.user_id,
      template_id: 'schedule_change',
      template_data: {
        bookingReference: booking.booking_reference,
        changeDetails: data,
      },
      status: 'pending',
    });

    // Update booking issue flag
    await supabase
      .from('bookings')
      .update({
        has_issue: true,
        issue_type: 'schedule_change',
        issue_description: 'Schedule change detected',
      })
      .eq('id', bookingId);
  }
}

// ============================================
// MARK COMPLETED BOOKINGS
// ============================================

async function markCompletedBookings(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  // Get bookings where travel has ended
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, booking_reference')
    .in('status', ['confirmed', 'ticketed', 'modified'])
    .lt('travel_end_date', new Date().toISOString())
    .limit(100);

  if (error) {
    return { job: 'mark_completed', success: false, processed: 0, errors: [error.message] };
  }

  for (const booking of bookings || []) {
    try {
      // Update status to completed
      await supabase
        .from('bookings')
        .update({
          status: 'completed',
          previous_status: 'confirmed',
          status_changed_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      // Record status history
      await supabase.from('booking_status_history').insert({
        booking_id: booking.id,
        from_status: 'confirmed',
        to_status: 'completed',
        changed_by: 'system',
        change_reason: 'Travel dates completed',
      });

      // Schedule review request (3 days later)
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() + 3);

      await supabase.from('scheduled_jobs').insert({
        job_type: 'send_review_request',
        job_data: { booking_id: booking.id },
        scheduled_for: reviewDate.toISOString(),
        status: 'pending',
        booking_id: booking.id,
      });

      processed++;
    } catch (err: any) {
      errors.push(`Booking ${booking.booking_reference}: ${err.message}`);
    }
  }

  return { job: 'mark_completed', success: errors.length === 0, processed, errors };
}

// ============================================
// PROCESS PENDING REFUNDS
// ============================================

async function processPendingRefunds(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  // Get pending refunds
  const { data: refunds, error } = await supabase
    .from('refunds')
    .select('*')
    .eq('status', 'pending')
    .lt('retry_count', 3)
    .limit(20);

  if (error) {
    return { job: 'process_refunds', success: false, processed: 0, errors: [error.message] };
  }

  for (const refund of refunds || []) {
    try {
      await processRefund(refund.id);
      processed++;
    } catch (err: any) {
      errors.push(`Refund ${refund.refund_reference}: ${err.message}`);
    }
  }

  return { job: 'process_refunds', success: errors.length === 0, processed, errors };
}

async function processRefund(refundId: string): Promise<void> {
  const { data: refund } = await supabase
    .from('refunds')
    .select('*, bookings(id, booking_reference)')
    .eq('id', refundId)
    .single();

  if (!refund) return;

  // Update status to processing
  await supabase
    .from('refunds')
    .update({ status: 'processing' })
    .eq('id', refundId);

  try {
    // Process via Stripe
    const { data, error } = await supabase.functions.invoke('stripe-api', {
      body: {
        action: 'createRefund',
        params: {
          amount: Math.round(refund.amount * 100),
          reason: 'requested_by_customer',
          metadata: {
            refund_id: refund.id,
            booking_id: refund.booking_id,
          },
        },
      },
    });

    if (error) throw error;

    // Update refund record
    await supabase
      .from('refunds')
      .update({
        status: 'succeeded',
        stripe_refund_id: data.refundId,
        stripe_status: data.status,
        processed_at: new Date().toISOString(),
      })
      .eq('id', refundId);

    // Update booking
    await supabase
      .from('bookings')
      .update({
        amount_refunded: refund.amount,
        status: 'refunded',
      })
      .eq('id', refund.booking_id);
  } catch (err: any) {
    await supabase
      .from('refunds')
      .update({
        status: 'failed',
        failure_reason: err.message,
        retry_count: (refund.retry_count || 0) + 1,
      })
      .eq('id', refundId);

    throw err;
  }
}

// ============================================
// RETRY FAILED COMMUNICATIONS
// ============================================

async function retryFailedCommunications(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  // Get failed communications ready for retry
  const { data: comms, error } = await supabase
    .from('booking_communications')
    .select('*')
    .eq('status', 'failed')
    .lt('retry_count', 3)
    .lte('next_retry_at', new Date().toISOString())
    .limit(50);

  if (error) {
    return { job: 'retry_communications', success: false, processed: 0, errors: [error.message] };
  }

  for (const comm of comms || []) {
    try {
      if (comm.channel === 'email') {
        await supabase.functions.invoke('send-email', {
          body: {
            to: comm.recipient_email,
            template: comm.template_id,
            data: comm.template_data,
          },
        });
      } else if (comm.channel === 'sms') {
        await supabase.functions.invoke('send-sms', {
          body: {
            to: comm.recipient_phone,
            message: comm.template_data.message,
          },
        });
      }

      // Mark as sent
      await supabase
        .from('booking_communications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', comm.id);

      processed++;
    } catch (err: any) {
      errors.push(`Communication ${comm.id}: ${err.message}`);

      // Update retry count
      const nextRetry = new Date(Date.now() + (comm.retry_count + 1) * 30 * 60 * 1000);
      await supabase
        .from('booking_communications')
        .update({
          retry_count: comm.retry_count + 1,
          next_retry_at: nextRetry.toISOString(),
        })
        .eq('id', comm.id);
    }
  }

  return { job: 'retry_communications', success: errors.length === 0, processed, errors };
}

// ============================================
// CHECK DISPUTE DEADLINES
// ============================================

async function checkDisputeDeadlines(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  // Get disputes with upcoming deadlines
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: disputes, error } = await supabase
    .from('disputes')
    .select('*')
    .eq('evidence_submitted', false)
    .lte('evidence_due_by', threeDaysFromNow)
    .in('status', ['needs_response', 'warning_needs_response']);

  if (error) {
    return { job: 'check_disputes', success: false, processed: 0, errors: [error.message] };
  }

  for (const dispute of disputes || []) {
    try {
      const dueDate = new Date(dispute.evidence_due_by);
      const hoursUntilDue = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60);

      // Create alert based on urgency
      let severity = 'medium';
      if (hoursUntilDue < 24) severity = 'critical';
      else if (hoursUntilDue < 48) severity = 'high';

      await supabase.from('system_alerts').insert({
        type: 'dispute_deadline',
        severity,
        message: `Dispute ${dispute.stripe_dispute_id} evidence due in ${Math.round(hoursUntilDue)} hours`,
        data: {
          disputeId: dispute.id,
          stripeDisputeId: dispute.stripe_dispute_id,
          bookingId: dispute.booking_id,
          amount: dispute.amount,
          evidenceDueBy: dispute.evidence_due_by,
        },
      });

      processed++;
    } catch (err: any) {
      errors.push(`Dispute ${dispute.id}: ${err.message}`);
    }
  }

  return { job: 'check_disputes', success: errors.length === 0, processed, errors };
}

// ============================================
// PROCESS PENDING REMINDERS
// ============================================

async function processPendingReminders(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  // Get reminder jobs that are due
  const { data: jobs, error } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .in('job_type', ['send_trip_reminder', 'send_review_request'])
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50);

  if (error) {
    return { job: 'process_reminders', success: false, processed: 0, errors: [error.message] };
  }

  for (const job of jobs || []) {
    try {
      await executeJob(job);

      await supabase
        .from('scheduled_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', job.id);

      processed++;
    } catch (err: any) {
      errors.push(`Job ${job.id}: ${err.message}`);

      await supabase
        .from('scheduled_jobs')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', job.id);
    }
  }

  return { job: 'process_reminders', success: errors.length === 0, processed, errors };
}

// ============================================
// CLEANUP EXPIRED DATA
// ============================================

async function cleanupExpiredData(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  try {
    // Delete expired carts (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: cartsDeleted } = await supabase
      .from('carts')
      .delete()
      .eq('status', 'abandoned')
      .lt('updated_at', sevenDaysAgo);

    processed += cartsDeleted || 0;

    // Delete expired checkout sessions (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: sessionsDeleted } = await supabase
      .from('checkout_sessions')
      .delete()
      .in('status', ['expired', 'cancelled'])
      .lt('created_at', oneDayAgo);

    processed += sessionsDeleted || 0;

    // Archive old completed jobs (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: jobsDeleted } = await supabase
      .from('scheduled_jobs')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', thirtyDaysAgo);

    processed += jobsDeleted || 0;
  } catch (err: any) {
    errors.push(err.message);
  }

  return { job: 'cleanup', success: errors.length === 0, processed, errors };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function sendTripReminder(bookingId: string, reminderType: string): Promise<void> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, contact_info')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  const template = reminderType === 'week_before' ? 'trip_reminder_week' : 'trip_reminder_day';

  await supabase.from('booking_communications').insert({
    booking_id: bookingId,
    type: 'trip_reminder',
    channel: 'email',
    recipient_email: booking.contact_info?.email,
    recipient_user_id: booking.user_id,
    template_id: template,
    template_data: {
      bookingReference: booking.booking_reference,
      travelDate: booking.travel_start_date,
    },
    status: 'pending',
  });
}

async function sendReviewRequest(bookingId: string): Promise<void> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, contact_info')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  await supabase.from('booking_communications').insert({
    booking_id: bookingId,
    type: 'review_request',
    channel: 'email',
    recipient_email: booking.contact_info?.email,
    recipient_user_id: booking.user_id,
    template_id: 'review_request',
    template_data: {
      bookingReference: booking.booking_reference,
    },
    status: 'pending',
  });
}

async function generateDocuments(bookingId: string): Promise<void> {
  await supabase.functions.invoke('document-generator', {
    body: { action: 'generateAll', bookingId },
  });
}

async function sendConfirmation(bookingId: string): Promise<void> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, contact_info')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  await supabase.from('booking_communications').insert({
    booking_id: bookingId,
    type: 'confirmation_email',
    channel: 'email',
    recipient_email: booking.contact_info?.email,
    recipient_user_id: booking.user_id,
    template_id: 'booking_confirmation',
    template_data: {
      bookingReference: booking.booking_reference,
      totalAmount: booking.total_amount,
      currency: booking.currency,
    },
    status: 'pending',
  });
}

async function sendCancellationConfirmation(bookingId: string): Promise<void> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, contact_info')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  await supabase.from('booking_communications').insert({
    booking_id: bookingId,
    type: 'cancellation_notice',
    channel: 'email',
    recipient_email: booking.contact_info?.email,
    recipient_user_id: booking.user_id,
    template_id: 'cancellation_confirmation',
    template_data: {
      bookingReference: booking.booking_reference,
    },
    status: 'pending',
  });
}

async function sendRefundConfirmation(bookingId: string, amount: number): Promise<void> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, contact_info')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  await supabase.from('booking_communications').insert({
    booking_id: bookingId,
    type: 'refund_confirmation',
    channel: 'email',
    recipient_email: booking.contact_info?.email,
    recipient_user_id: booking.user_id,
    template_id: 'refund_confirmation',
    template_data: {
      bookingReference: booking.booking_reference,
      amount,
      currency: booking.currency,
    },
    status: 'pending',
  });
}

async function scheduleReminders(bookingId: string): Promise<void> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('travel_start_date, travel_end_date')
    .eq('id', bookingId)
    .single();

  if (!booking?.travel_start_date) return;

  const startDate = new Date(booking.travel_start_date);
  const now = new Date();

  // 1 week before
  const weekBefore = new Date(startDate);
  weekBefore.setDate(weekBefore.getDate() - 7);
  weekBefore.setHours(9, 0, 0, 0);

  if (weekBefore > now) {
    await supabase.from('scheduled_jobs').insert({
      job_type: 'send_trip_reminder',
      job_data: { booking_id: bookingId, reminder_type: 'week_before' },
      scheduled_for: weekBefore.toISOString(),
      status: 'pending',
      booking_id: bookingId,
    });
  }

  // 1 day before
  const dayBefore = new Date(startDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(9, 0, 0, 0);

  if (dayBefore > now) {
    await supabase.from('scheduled_jobs').insert({
      job_type: 'send_trip_reminder',
      job_data: { booking_id: bookingId, reminder_type: 'day_before' },
      scheduled_for: dayBefore.toISOString(),
      status: 'pending',
      booking_id: bookingId,
    });
  }
}

// ============================================
// TRIP TRANSITIONS
// ============================================

async function processTripTransitions(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;
  const now = new Date().toISOString();

  try {
    // confirmed → upcoming (30 days before start)
    const { data: needUpcoming } = await supabase
      .from('trips')
      .select('id, title, status')
      .eq('status', 'confirmed')
      .lte('transition_to_upcoming_at', now)
      .is('deleted_at', null);

    for (const trip of needUpcoming || []) {
      try {
        await supabase
          .from('trips')
          .update({
            status: 'upcoming',
            previous_status: 'confirmed',
            status_changed_at: now,
            status_change_reason: 'Auto-transition: 30 days before trip',
          })
          .eq('id', trip.id);

        // Schedule module refresh
        await supabase.from('scheduled_jobs').insert({
          job_type: 'refresh_trip_modules',
          job_data: { tripId: trip.id },
          scheduled_for: now,
          status: 'pending',
        });

        processed++;
      } catch (err: any) {
        errors.push(`Trip ${trip.id} to upcoming: ${err.message}`);
      }
    }

    // confirmed/upcoming → ongoing (start date)
    const { data: needOngoing } = await supabase
      .from('trips')
      .select('id, title, status, owner_id')
      .in('status', ['confirmed', 'upcoming'])
      .lte('transition_to_ongoing_at', now)
      .is('deleted_at', null);

    for (const trip of needOngoing || []) {
      try {
        await supabase
          .from('trips')
          .update({
            status: 'ongoing',
            previous_status: trip.status,
            status_changed_at: now,
            started_at: now,
            status_change_reason: 'Auto-transition: trip started',
          })
          .eq('id', trip.id);

        // Send trip started notification
        await supabase.from('scheduled_jobs').insert({
          job_type: 'send_trip_notification',
          job_data: { tripId: trip.id, type: 'trip_started', userId: trip.owner_id },
          scheduled_for: now,
          status: 'pending',
        });

        processed++;
      } catch (err: any) {
        errors.push(`Trip ${trip.id} to ongoing: ${err.message}`);
      }
    }

    // ongoing → completed (end date)
    const { data: needCompleted } = await supabase
      .from('trips')
      .select('id, title, status, owner_id')
      .eq('status', 'ongoing')
      .lte('transition_to_completed_at', now)
      .is('deleted_at', null);

    for (const trip of needCompleted || []) {
      try {
        await supabase
          .from('trips')
          .update({
            status: 'completed',
            previous_status: 'ongoing',
            status_changed_at: now,
            completed_at: now,
            status_change_reason: 'Auto-transition: trip ended',
          })
          .eq('id', trip.id);

        // Send trip completed notification
        await supabase.from('scheduled_jobs').insert({
          job_type: 'send_trip_notification',
          job_data: { tripId: trip.id, type: 'trip_completed', userId: trip.owner_id },
          scheduled_for: now,
          status: 'pending',
        });

        // Schedule review request (2 days later)
        const reviewDate = new Date();
        reviewDate.setDate(reviewDate.getDate() + 2);
        await supabase.from('scheduled_jobs').insert({
          job_type: 'send_review_request',
          job_data: { tripId: trip.id },
          scheduled_for: reviewDate.toISOString(),
          status: 'pending',
        });

        processed++;
      } catch (err: any) {
        errors.push(`Trip ${trip.id} to completed: ${err.message}`);
      }
    }

    // Expire old invitations
    await supabase
      .from('trip_invitations')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('token_expires_at', now);

  } catch (error: any) {
    errors.push(`Trip transitions error: ${error.message}`);
  }

  return {
    job: 'trip_transitions',
    success: errors.length === 0,
    processed,
    errors,
  };
}
