/**
 * SEND NOTIFICATION EDGE FUNCTION
 *
 * Dispatches push notifications via Expo Push API.
 * Can be called directly or by the scheduled-jobs function.
 *
 * Actions:
 *   dispatch_pending  → Process all pending alerts and send push notifications
 *   send_single       → Send a single notification to a specific user
 *   send_to_user      → Create an alert + send push to a user
 *
 * Required Secrets:
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireCronOrServiceAuth } from '../_shared/cronAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-cron-secret, apikey, content-type',
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error: string };
}

interface QueuedPush {
  alertId: string;
  userId: string;
  pushToken: string;
  message: ExpoPushMessage;
}

const USER_PUSH_LIMIT_PER_MINUTE = Number(Deno.env.get('NOTIFICATION_USER_PUSH_LIMIT_PER_MINUTE') || '20');
const GLOBAL_PUSH_LIMIT_PER_MINUTE = Number(Deno.env.get('NOTIFICATION_GLOBAL_PUSH_LIMIT_PER_MINUTE') || '500');

function currentMinuteWindow(): { start: string; end: string } {
  const start = new Date(Math.floor(Date.now() / 60_000) * 60_000);
  return {
    start: start.toISOString(),
    end: new Date(start.getTime() + 60_000).toISOString(),
  };
}

async function consumeRateBucket(
  supabase: any,
  scope: string,
  bucketKey: string,
  amount: number,
  limit: number
): Promise<boolean> {
  const window = currentMinuteWindow();
  const { data: existing } = await supabase
    .from('notification_rate_buckets')
    .select('attempts')
    .eq('scope', scope)
    .eq('bucket_key', bucketKey)
    .eq('window_start', window.start)
    .maybeSingle();

  const attempts = existing?.attempts || 0;
  if (attempts + amount > limit) return false;

  await supabase.from('notification_rate_buckets').upsert({
    scope,
    bucket_key: bucketKey,
    window_start: window.start,
    window_end: window.end,
    attempts: attempts + amount,
    updated_at: new Date().toISOString(),
  });

  return true;
}

async function recordDispatchMetric(
  supabase: any,
  metric: {
    action: string;
    batchId?: string;
    alertsSelected?: number;
    alertsDispatched?: number;
    pushAttempted?: number;
    pushFailed?: number;
    deferredCount?: number;
    skippedCount?: number;
    durationMs?: number;
    error?: string;
  }
): Promise<void> {
  await supabase.from('notification_dispatch_metrics').insert({
    action: metric.action,
    batch_id: metric.batchId,
    alerts_selected: metric.alertsSelected || 0,
    alerts_dispatched: metric.alertsDispatched || 0,
    push_attempted: metric.pushAttempted || 0,
    push_failed: metric.pushFailed || 0,
    deferred_count: metric.deferredCount || 0,
    skipped_count: metric.skippedCount || 0,
    duration_ms: metric.durationMs || 0,
    error: metric.error,
  });
}

async function recordDeadLetter(
  supabase: any,
  entry: {
    alertId?: string;
    userId?: string;
    pushToken?: string;
    reason: string;
    details?: Record<string, unknown>;
    retryAfter?: string;
  }
): Promise<void> {
  await supabase.from('notification_dead_letters').insert({
    alert_id: entry.alertId,
    user_id: entry.userId,
    push_token: entry.pushToken,
    reason: entry.reason,
    details: entry.details || {},
    retry_after: entry.retryAfter,
  });
}

// ============================================
// EXPO PUSH API
// ============================================

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];

  // Expo accepts batches of up to 100
  const batches: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    batches.push(messages.slice(i, i + 100));
  }

  const allTickets: ExpoPushTicket[] = [];

  for (const batch of batches) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        console.error(`Expo Push API error: ${response.status}`);
        allTickets.push(
          ...batch.map(() => ({
            status: 'error' as const,
            message: `HTTP ${response.status}`,
          }))
        );
        continue;
      }

      const result = await response.json();
      const tickets = result.data || [];
      allTickets.push(...tickets);
    } catch (error) {
      console.error('Expo Push send error:', error);
      allTickets.push(
        ...batch.map(() => ({
          status: 'error' as const,
          message: error instanceof Error ? error.message : 'Unknown error',
        }))
      );
    }
  }

  return allTickets;
}

// ============================================
// QUIET HOURS CHECK
// ============================================

function isInQuietHours(
  prefs: {
    quiet_hours_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
    quiet_hours_timezone: string;
  } | null,
  alertPriority: number
): boolean {
  // High priority (>= 8) bypasses quiet hours (safety, flight cancel, SOS)
  if (alertPriority >= 8) return false;
  if (!prefs?.quiet_hours_enabled) return false;

  // Simple hour-based check (timezone-aware would need a library)
  const now = new Date();
  const currentHour = now.getUTCHours();
  const startHour = parseInt(prefs.quiet_hours_start.split(':')[0], 10);
  const endHour = parseInt(prefs.quiet_hours_end.split(':')[0], 10);

  if (startHour > endHour) {
    // Overnight quiet hours (e.g., 22:00 - 07:00)
    return currentHour >= startHour || currentHour < endHour;
  } else {
    return currentHour >= startHour && currentHour < endHour;
  }
}

// ============================================
// CATEGORY PREFERENCE CHECK
// ============================================

function isCategoryEnabled(
  prefs: { category_preferences: Record<string, boolean | { enabled: boolean }> } | null,
  category: string
): boolean {
  if (!prefs) return true; // Default: all enabled
  const catPref = prefs.category_preferences?.[category];
  if (typeof catPref === 'boolean') return catPref;
  return catPref?.enabled !== false; // Default to enabled
}

// Two-level gate: a per-type preference (type_preferences[alert_type_code]) is
// authoritative when present; otherwise we fall back to the coarse category
// preference. Anything not explicitly set defaults to enabled so new alert
// types keep working until a user opts out.
function isAlertAllowed(
  prefs:
    | {
        notifications_enabled?: boolean | null;
        category_preferences?: Record<string, boolean | { enabled: boolean }> | null;
        type_preferences?: Record<string, boolean> | null;
      }
    | null,
  alert: { category_code?: string | null; alert_type_code?: string | null }
): boolean {
  if (!prefs) return true;
  // Master switch off → suppress everything.
  if (prefs.notifications_enabled === false) return false;

  const typePref = alert.alert_type_code
    ? prefs.type_preferences?.[alert.alert_type_code]
    : undefined;
  if (typeof typePref === 'boolean') return typePref;

  return isCategoryEnabled(
    { category_preferences: prefs.category_preferences || {} },
    alert.category_code || ''
  );
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  try {
    const body = await req.json();
    const { action, type } = body;

    if (action === 'dispatch_pending' || action === 'process_scheduled') {
      const unauthorized = requireCronOrServiceAuth(req, corsHeaders);
      if (unauthorized) return unauthorized;
    }

    // ── SOS / Direct email or SMS notification ──
    // Called by sos.service.ts with { type: 'email'|'sms', to, subject, body }
    if (type === 'email') {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
      if (!RESEND_API_KEY) {
        console.error('[send-notification] RESEND_API_KEY not set — cannot send email');
        return new Response(JSON.stringify({ error: 'Email service not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Guidera Emergency <emergency@guidera.one>',
          to: [body.to],
          subject: body.subject || 'Emergency SOS Alert',
          html: `<div style="font-family:sans-serif;padding:20px;"><h2 style="color:#EF4444;">🚨 Emergency Alert</h2><p>${(body.body || '').replace(/\n/g, '<br>')}</p></div>`,
        }),
      });
      const result = await res.json();
      return new Response(JSON.stringify({ success: res.ok, id: result.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'sms') {
      // SMS requires Twilio or similar — log for now, will be wired when Twilio is configured
      console.warn(
        `[send-notification] SMS requested to ${body.to} but no SMS provider configured. Message: ${(body.body || '').substring(0, 100)}`
      );
      return new Response(
        JSON.stringify({ success: false, error: 'SMS provider not configured yet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── dispatch_pending ──
    // Process all pending alerts that are due
    if (action === 'dispatch_pending') {
      const startedAt = Date.now();
      const now = new Date().toISOString();
      const batchId = crypto.randomUUID();

      // Get pending alerts that are due (scheduled_for <= now or null)
      const { data: pendingAlerts, error: fetchError } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'pending')
        .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
        .order('priority', { ascending: false }) // Highest priority first
        .limit(100);

      if (fetchError) throw fetchError;
      if (!pendingAlerts || pendingAlerts.length === 0) {
        await recordDispatchMetric(supabase, {
          action: 'dispatch_pending',
          batchId,
          durationMs: Date.now() - startedAt,
        });
        return new Response(JSON.stringify({ success: true, dispatched: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Group alerts by user for batch processing
      const userAlerts = new Map<string, typeof pendingAlerts>();
      for (const alert of pendingAlerts) {
        const existing = userAlerts.get(alert.user_id) || [];
        existing.push(alert);
        userAlerts.set(alert.user_id, existing);
      }

      let dispatched = 0;
      let failed = 0;
      let deferredCount = 0;
      let skipped = 0;
      const pushQueue: QueuedPush[] = [];

      for (const [userId, alerts] of userAlerts) {
        // Get user's devices
        const { data: devices } = await supabase
          .from('user_devices')
          .select('push_token, platform, push_enabled')
          .eq('user_id', userId)
          .eq('is_active', true)
          .eq('push_enabled', true);

        // Get user's notification preferences
        const { data: prefs } = await supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        for (const alert of alerts) {
          // Check master + per-type + category preference (type is authoritative)
          if (!isAlertAllowed(prefs, alert)) {
            // Mark as delivered (respected preference) but don't send
            await supabase
              .from('alerts')
              .update({ status: 'delivered', delivered_at: now, channels_delivered: ['in_app'] })
              .eq('id', alert.id);
            dispatched++;
            skipped++;
            continue;
          }

          // Check quiet hours
          if (isInQuietHours(prefs, alert.priority)) {
            // Defer: reschedule for after quiet hours end
            const endHour = parseInt(prefs?.quiet_hours_end?.split(':')[0] || '7', 10);
            const deferredAt = new Date();
            deferredAt.setUTCHours(endHour, 0, 0, 0);
            if (deferredAt <= new Date()) deferredAt.setDate(deferredAt.getDate() + 1);

            await supabase
              .from('alerts')
              .update({ scheduled_for: deferredAt.toISOString() })
              .eq('id', alert.id);
            deferredCount++;
            continue;
          }

          // Check if push is in the requested channels
          const wantsPush = (alert.channels_requested || []).includes('push');
          let alertPushQueued = false;

          if (wantsPush && devices && devices.length > 0) {
            // Create push messages for each device
            for (const device of devices) {
              if (!device.push_token) continue;

              const canSendUser = await consumeRateBucket(
                supabase,
                'user',
                userId,
                1,
                USER_PUSH_LIMIT_PER_MINUTE
              );
              const canSendGlobal = await consumeRateBucket(
                supabase,
                'global',
                'all',
                1,
                GLOBAL_PUSH_LIMIT_PER_MINUTE
              );

              if (!canSendUser || !canSendGlobal) {
                skipped++;
                await recordDeadLetter(supabase, {
                  alertId: alert.id,
                  userId,
                  pushToken: device.push_token,
                  reason: 'rate_limited',
                  details: {
                    category: alert.category_code,
                    type: alert.alert_type_code,
                    scope: canSendUser ? 'global' : 'user',
                  },
                  retryAfter: new Date(Date.now() + 60_000).toISOString(),
                });
                continue;
              }

              alertPushQueued = true;
              pushQueue.push({
                alertId: alert.id,
                userId,
                pushToken: device.push_token,
                message: {
                  to: device.push_token,
                  title: alert.title,
                  body: alert.body,
                  data: {
                    alertId: alert.id,
                    type: alert.alert_type_code,
                    category: alert.category_code,
                    actionUrl: alert.action_url,
                    ...(alert.context || {}),
                  },
                  sound: 'default',
                  priority: alert.priority >= 8 ? 'high' : 'default',
                  channelId: alert.category_code,
                },
              });
            }
          }

          // Mark as delivered
          const deliveredChannels = ['in_app'];
          if (alertPushQueued) {
            deliveredChannels.push('push');
          }

          await supabase
            .from('alerts')
            .update({
              status: 'delivered',
              delivered_at: now,
              channels_delivered: deliveredChannels,
            })
            .eq('id', alert.id);

          dispatched++;
        }
      }

      // Send all push messages in batch
      if (pushQueue.length > 0) {
        const tickets = await sendExpoPush(pushQueue.map((item) => item.message));
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          if (ticket?.status !== 'error') continue;
          failed++;

          const item = pushQueue[i];
          await recordDeadLetter(supabase, {
            alertId: item.alertId,
            userId: item.userId,
            pushToken: item.pushToken,
            reason: ticket.details?.error || ticket.message || 'expo_push_error',
            details: {
              message: ticket.message,
              details: ticket.details || null,
            },
            retryAfter: new Date(Date.now() + 5 * 60_000).toISOString(),
          });

          if (ticket.details?.error === 'DeviceNotRegistered') {
            await supabase
              .from('user_devices')
              .update({ push_enabled: false, is_active: false })
              .eq('push_token', item.pushToken);
          }
        }
      }

      await recordDispatchMetric(supabase, {
        action: 'dispatch_pending',
        batchId,
        alertsSelected: pendingAlerts.length,
        alertsDispatched: dispatched,
        pushAttempted: pushQueue.length,
        pushFailed: failed,
        deferredCount,
        skippedCount: skipped,
        durationMs: Date.now() - startedAt,
      });

      return new Response(
        JSON.stringify({ success: true, batchId, dispatched, failed, pushSent: pushQueue.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── send_to_user ──
    // Create an alert and dispatch immediately
    if (action === 'send_to_user') {
      const {
        userId,
        typeCode,
        category,
        title,
        body: alertBody,
        data,
        actionUrl,
        priority,
        channels,
        tripId,
      } = body;

      if (!userId || !title || !alertBody) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert alert
      const { data: alert, error: insertError } = await supabase
        .from('alerts')
        .insert({
          user_id: userId,
          alert_type_code: typeCode || 'system',
          category_code: category || 'system',
          title,
          body: alertBody,
          context: data || {},
          action_url: actionUrl,
          priority: priority || 5,
          channels_requested: channels || ['push', 'in_app'],
          trip_id: tripId,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Get user's devices for immediate push
      const { data: devices } = await supabase
        .from('user_devices')
        .select('push_token')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('push_enabled', true);

      if (devices && devices.length > 0 && (channels || ['push']).includes('push')) {
        const messages: ExpoPushMessage[] = devices
          .filter((d) => Boolean(d.push_token))
          .map((d) => ({
            to: d.push_token,
            title,
            body: alertBody,
            data: { alertId: alert.id, type: typeCode, actionUrl, ...data },
            sound: 'default',
            priority: (priority || 5) >= 8 ? ('high' as const) : ('default' as const),
          }));

        await sendExpoPush(messages);

        // Mark as delivered
        await supabase
          .from('alerts')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString(),
            channels_delivered: ['push', 'in_app'],
          })
          .eq('id', alert.id);
      } else {
        // No push devices, mark as in-app only
        await supabase
          .from('alerts')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString(),
            channels_delivered: ['in_app'],
          })
          .eq('id', alert.id);
      }

      return new Response(JSON.stringify({ success: true, alertId: alert.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── process_scheduled ──
    // Process scheduled notification jobs (from trip lifecycle)
    if (action === 'process_scheduled') {
      const startedAt = Date.now();
      const now = new Date().toISOString();
      const batchId = crypto.randomUUID();

      const { data: jobs } = await supabase
        .from('scheduled_notification_jobs')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', now)
        .order('scheduled_for', { ascending: true })
        .limit(50);

      let processed = 0;
      let failedJobs = 0;

      for (const job of jobs || []) {
        try {
          // Mark as processing
          await supabase
            .from('scheduled_notification_jobs')
            .update({ status: 'processing' })
            .eq('id', job.id);

          // Create alert from scheduled job
          await supabase.from('alerts').insert({
            user_id: job.user_id,
            alert_type_code: job.alert_type_code,
            category_code: job.alert_data?.category || 'trip',
            title: job.alert_data?.title || 'Notification',
            body: job.alert_data?.body || '',
            context: job.alert_data || {},
            action_url: job.alert_data?.action_url,
            priority: job.alert_data?.priority || 5,
            channels_requested: ['push', 'in_app'],
            trip_id: job.trip_id,
            status: 'pending',
          });

          // Mark job as completed
          await supabase
            .from('scheduled_notification_jobs')
            .update({ status: 'completed', processed_at: now })
            .eq('id', job.id);

          processed++;
        } catch (err) {
          failedJobs++;
          console.error(`Failed to process job ${job.id}:`, err);
          await supabase
            .from('scheduled_notification_jobs')
            .update({
              status: 'failed',
              error: err instanceof Error ? err.message : 'Unknown error',
            })
            .eq('id', job.id);
        }
      }

      // Now dispatch the newly created pending alerts
      if (processed > 0) {
        // Recursive call to dispatch
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ action: 'dispatch_pending' }),
        });
      }

      await recordDispatchMetric(supabase, {
        action: 'process_scheduled',
        batchId,
        alertsSelected: jobs?.length || 0,
        alertsDispatched: processed,
        pushFailed: failedJobs,
        durationMs: Date.now() - startedAt,
      });

      return new Response(JSON.stringify({ success: true, batchId, processed, failed: failedJobs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
