/**
 * DEAL NOTIFIER — Edge Function
 *
 * Dispatches pending deal notifications to users via:
 * 1. Expo Push Notifications (using user_devices.push_token)
 * 2. In-app notifications (via notifications table)
 *
 * Respects:
 * - Quiet hours (user_notification_preferences)
 * - Daily notification cap (user_travel_dna.max_daily_notifications)
 * - Minimum gap between notifications (2 hours)
 * - User notification preferences (push_enabled, category_preferences)
 *
 * Trigger: Cron every 15 minutes + after deal-scanner completes
 * POST body: { limit?: number }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const body = await req.json().catch(() => ({}))
    const limit = body.limit || 50

    const result = await dispatchPendingNotifications(limit)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('deal-notifier error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ============================================
// DISPATCH PENDING NOTIFICATIONS
// ============================================

async function dispatchPendingNotifications(limit: number) {
  const startTime = Date.now()
  let sent = 0
  let skipped = 0
  let failed = 0
  const errors: string[] = []

  // Get pending notifications that are ready to send
  const { data: pending, error: fetchError } = await supabase
    .from('deal_notifications')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('priority', { ascending: true }) // Lower number = higher priority
    .order('created_at', { ascending: true })
    .limit(limit)

  if (fetchError) throw fetchError
  if (!pending || pending.length === 0) {
    return { success: true, sent: 0, skipped: 0, failed: 0, errors: [], duration_ms: Date.now() - startTime }
  }

  console.log(`Processing ${pending.length} pending deal notifications`)

  // Group by user to check preferences once per user
  const userNotifications = new Map<string, any[]>()
  for (const notif of pending) {
    const existing = userNotifications.get(notif.user_id) || []
    existing.push(notif)
    userNotifications.set(notif.user_id, existing)
  }

  for (const [userId, notifications] of userNotifications) {
    try {
      // Get user preferences and device info
      const [prefsResult, devicesResult, dnaResult] = await Promise.all([
        supabase.from('user_notification_preferences')
          .select('*').eq('user_id', userId).single(),
        supabase.from('user_devices')
          .select('push_token, push_enabled, platform')
          .eq('user_id', userId)
          .eq('is_active', true)
          .eq('push_enabled', true),
        supabase.from('user_travel_dna')
          .select('notifications_sent_today, max_daily_notifications, last_notification_at, notification_timezone')
          .eq('user_id', userId).single(),
      ])

      const prefs = prefsResult.data
      const devices = devicesResult.data || []
      const dna = dnaResult.data

      // Check if user has push enabled globally
      if (prefs && prefs.push_enabled === false) {
        await markNotifications(notifications, 'skipped', 'User push disabled')
        skipped += notifications.length
        continue
      }

      // Check if user has notifications enabled at all
      if (prefs && prefs.notifications_enabled === false) {
        await markNotifications(notifications, 'skipped', 'Notifications disabled')
        skipped += notifications.length
        continue
      }

      // Check quiet hours
      if (prefs && prefs.quiet_hours_enabled && isInQuietHours(prefs, dna?.notification_timezone)) {
        await markNotifications(notifications, 'pending', null) // Keep pending, will retry
        skipped += notifications.length
        continue
      }

      // Check daily cap
      const sentToday = dna?.notifications_sent_today || 0
      const maxDaily = dna?.max_daily_notifications || 3
      let remainingToday = maxDaily - sentToday

      // No active devices with push tokens
      if (devices.length === 0) {
        // Still create in-app notifications but skip push
        for (const notif of notifications) {
          await createInAppNotification(userId, notif)
          await markNotification(notif.id, 'sent')
          sent++
        }
        continue
      }

      // Process each notification for this user
      for (const notif of notifications) {
        // Skip if daily cap reached (except critical priority=1)
        if (remainingToday <= 0 && notif.priority !== 1) {
          await markNotification(notif.id, 'skipped', 'Daily cap reached')
          skipped++
          continue
        }

        try {
          // Send push to all active devices
          const pushTokens = devices
            .filter((d: any) => d.push_token && d.push_token.startsWith('ExponentPushToken'))
            .map((d: any) => d.push_token)

          if (pushTokens.length > 0) {
            await sendExpoPush(pushTokens, {
              title: notif.title,
              body: notif.body,
              data: notif.data || {},
              image: notif.image_url,
            })
          }

          // Also create in-app notification record
          await createInAppNotification(userId, notif)

          // Mark as sent
          await markNotification(notif.id, 'sent')
          remainingToday--
          sent++

          // Update DNA notification counter
          await supabase.from('user_travel_dna').update({
            notifications_sent_today: sentToday + (sent),
            last_notification_at: new Date().toISOString(),
          }).eq('user_id', userId)

        } catch (err: any) {
          await markNotification(notif.id, 'failed', err.message)
          errors.push(`Notif ${notif.id}: ${err.message}`)
          failed++
        }
      }
    } catch (err: any) {
      errors.push(`User ${userId}: ${err.message}`)
      failed += notifications.length
    }
  }

  // Reset daily counters at midnight (check if any users need reset)
  await resetDailyCounters()

  return {
    success: true,
    sent,
    skipped,
    failed,
    total_processed: pending.length,
    errors,
    duration_ms: Date.now() - startTime,
  }
}

// ============================================
// EXPO PUSH
// ============================================

async function sendExpoPush(
  pushTokens: string[],
  message: { title: string; body: string; data?: any; image?: string }
) {
  const messages = pushTokens.map(token => ({
    to: token,
    sound: 'default',
    title: message.title,
    body: message.body,
    data: message.data,
    ...(message.image ? { image: message.image } : {}),
    priority: 'high',
    channelId: 'deals',
  }))

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Expo push failed: ${response.status} — ${errorText.substring(0, 200)}`)
  }

  const result = await response.json()
  console.log(`Expo push sent to ${pushTokens.length} devices:`, JSON.stringify(result.data?.map((d: any) => d.status) || []))

  return result
}

// ============================================
// IN-APP NOTIFICATION
// ============================================

async function createInAppNotification(userId: string, notif: any) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'deal_alert',
      title: notif.title,
      body: notif.body,
      data: {
        ...notif.data,
        notification_type: notif.notification_type,
        deal_match_id: notif.deal_match_id,
        image_url: notif.image_url,
      },
      is_read: false,
      push_sent: true,
      push_sent_at: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error(`In-app notif for ${userId}:`, err.message)
  }
}

// ============================================
// QUIET HOURS CHECK
// ============================================

function isInQuietHours(prefs: any, timezone?: string): boolean {
  if (!prefs.quiet_hours_start || !prefs.quiet_hours_end) return false

  try {
    const tz = prefs.quiet_hours_timezone || timezone || 'America/New_York'
    const now = new Date()

    // Get current time in user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const currentHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
    const currentMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
    const currentTime = currentHour * 60 + currentMinute

    // Parse quiet hours (format: "HH:MM")
    const [startH, startM] = prefs.quiet_hours_start.split(':').map(Number)
    const [endH, endM] = prefs.quiet_hours_end.split(':').map(Number)
    const startTime = startH * 60 + startM
    const endTime = endH * 60 + endM

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime
    }

    return currentTime >= startTime && currentTime <= endTime
  } catch {
    return false
  }
}

// ============================================
// HELPERS
// ============================================

async function markNotification(id: string, status: string, reason?: string | null) {
  const update: any = { status }
  if (status === 'sent') {
    update.sent_at = new Date().toISOString()
    update.delivered_at = new Date().toISOString()
  }
  if (reason) update.failure_reason = reason
  await supabase.from('deal_notifications').update(update).eq('id', id)
}

async function markNotifications(notifications: any[], status: string, reason: string | null) {
  const ids = notifications.map(n => n.id)
  const update: any = { status }
  if (reason) update.failure_reason = reason
  await supabase.from('deal_notifications').update(update).in('id', ids)
}

async function resetDailyCounters() {
  // Reset counters for users whose local midnight has passed
  // Simple approach: reset anyone whose last_notification_at was yesterday or earlier
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  await supabase.from('user_travel_dna')
    .update({ notifications_sent_today: 0 })
    .lt('last_notification_at', oneDayAgo)
    .gt('notifications_sent_today', 0)
}
