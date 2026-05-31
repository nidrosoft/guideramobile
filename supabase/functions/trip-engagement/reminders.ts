/**
 * Smart Plan reminder pass.
 *
 * The main engagement engine only runs for trips with `modules_generated = true`
 * (they have content to drip). That means an upcoming trip whose owner never
 * generated a Smart Trip Plan gets *no* nudges and silently slips by — the exact
 * gap where an imminent trip is neglected while a farther, already-generated trip
 * dominates the feed.
 *
 * This pass closes that gap: it finds upcoming trips WITHOUT a generated plan and
 * emits a single, actionable "generate your plan" reminder (deduped + cooled
 * down), inserted into `alerts` as pending so the existing send-notification
 * dispatcher applies preferences, quiet hours, and push delivery.
 */

import { SEND_WINDOW, type Phase, type SupabaseClient } from './types.ts';
import { clamp, dayDiff, localNow } from './lib.ts';

interface ReminderResult {
  tripsScanned: number;
  emitted: number;
  errors: string[];
  preview?: Array<{ tripId: string; daysUntilStart: number; title: string; body: string }>;
}

interface ReminderOptions {
  dryRun?: boolean;
  ignoreWindow?: boolean;
}

// Remind for trips departing within this many days that have no generated plan.
const REMINDER_WINDOW_DAYS = 14;
// Never remind about the same trip more often than this.
const REMINDER_COOLDOWN_DAYS = 3;

const MODULE_KEY = 'plan_reminder';
const ALERT_TYPE_CODE = 'smart_plan_reminder';
const CATEGORY_CODE = 'trip';

interface ReminderTrip {
  id: string;
  user_id: string;
  title: string | null;
  start_date: string | null;
  destination_timezone: string | null;
  primary_destination_name: string | null;
  notifications_enabled: boolean | null;
}

function buildCopy(destination: string, daysUntilStart: number): { title: string; body: string } {
  const when =
    daysUntilStart <= 0
      ? 'today'
      : daysUntilStart === 1
      ? 'tomorrow'
      : `in ${daysUntilStart} days`;
  const urgent = daysUntilStart <= 3;
  const title = urgent ? '🧠 Don’t travel unprepared' : '🧠 Generate your Smart Trip Plan';
  const body = clamp(
    `${destination} is ${when} and you haven’t generated your Smart Trip Plan yet. ` +
      `Tap to create your itinerary, packing list, safety tips, and more in seconds.`,
    175
  );
  return { title, body };
}

export async function runPlanReminders(
  supabase: SupabaseClient,
  opts: ReminderOptions = {}
): Promise<ReminderResult> {
  const result: ReminderResult = { tripsScanned: 0, emitted: 0, errors: [] };

  const todayUtc = new Date().toISOString().slice(0, 10);
  const upper = new Date(Date.now() + REMINDER_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);

  // Upcoming trips with NO generated plan, departing inside the reminder window.
  const { data: trips, error } = await supabase
    .from('trips')
    .select(
      'id, user_id, title, start_date, destination_timezone, primary_destination_name, notifications_enabled, modules_generated, state, deleted_at'
    )
    .is('deleted_at', null)
    .eq('modules_generated', false)
    .neq('state', 'cancelled')
    .not('start_date', 'is', null)
    .gte('start_date', todayUtc)
    .lte('start_date', upper)
    .limit(500);

  if (error) {
    result.errors.push(`reminder trip query: ${error.message}`);
    return result;
  }
  const candidates = (trips || []) as ReminderTrip[];
  if (candidates.length === 0) return result;

  // Batch-load user timezones + notification gates.
  const userIds = [...new Set(candidates.map((t) => t.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, timezone')
    .in('id', userIds);
  const tzByUser = new Map<string, string | null>();
  for (const p of profiles || []) tzByUser.set(p.id, p.timezone);

  const { data: prefs } = await supabase
    .from('user_notification_preferences')
    .select('user_id, notifications_enabled, category_preferences')
    .in('user_id', userIds);
  const disabledUsers = new Set<string>();
  for (const p of prefs || []) {
    if (p.notifications_enabled === false) {
      disabledUsers.add(p.user_id);
      continue;
    }
    // A disabled 'trip' category mutes trip reminders too.
    const cat = (p.category_preferences || {})['trip'];
    const tripOff = cat === false || (typeof cat === 'object' && cat?.enabled === false);
    if (tripOff) disabledUsers.add(p.user_id);
  }

  for (const trip of candidates) {
    result.tripsScanned += 1;
    if (!trip.start_date) continue;
    if (trip.notifications_enabled === false) continue;
    if (disabledUsers.has(trip.user_id)) continue;

    const timezone = tzByUser.get(trip.user_id) || trip.destination_timezone || 'America/New_York';
    const { hour, date } = localNow(timezone);

    // Respect the user-local send window (skippable in dry-run debug).
    if (!opts.ignoreWindow && (hour < SEND_WINDOW.startHour || hour >= SEND_WINDOW.endHour)) continue;

    const daysUntilStart = dayDiff(date, trip.start_date);
    if (daysUntilStart < 0 || daysUntilStart > REMINDER_WINDOW_DAYS) continue;

    // Cooldown: at most one reminder per trip per REMINDER_COOLDOWN_DAYS.
    const { data: lastSends } = await supabase
      .from('trip_engagement_sends')
      .select('sent_on')
      .eq('trip_id', trip.id)
      .eq('module', MODULE_KEY)
      .order('sent_on', { ascending: false })
      .limit(1);
    const lastSent = lastSends?.[0]?.sent_on as string | undefined;
    if (lastSent && dayDiff(lastSent, date) < REMINDER_COOLDOWN_DAYS) continue;

    const destination = trip.primary_destination_name || trip.title || 'Your trip';
    const { title, body } = buildCopy(destination, daysUntilStart);

    if (opts.dryRun) {
      result.emitted += 1;
      (result.preview ||= []).push({ tripId: trip.id, daysUntilStart, title, body });
      continue;
    }

    // Reserve the dedup slot first to avoid duplicate sends across concurrent runs.
    const { error: ledgerErr } = await supabase.from('trip_engagement_sends').insert({
      user_id: trip.user_id,
      trip_id: trip.id,
      module: MODULE_KEY,
      content_ref: `remind-${date}`,
      phase: 'before' as Phase,
      sent_on: date,
    });
    if (ledgerErr) continue; // already reminded today (unique violation) or transient error

    const { error: alertErr } = await supabase.from('alerts').insert({
      user_id: trip.user_id,
      trip_id: trip.id,
      alert_type_code: ALERT_TYPE_CODE,
      category_code: CATEGORY_CODE,
      title,
      body,
      context: { kind: 'plan_reminder', daysUntilStart },
      action_url: `/trip/${trip.id}`,
      priority: daysUntilStart <= 3 ? 6 : 5,
      channels_requested: ['push', 'in_app'],
      status: 'pending',
    });

    if (alertErr) {
      result.errors.push(`alert insert (plan_reminder ${trip.id}): ${alertErr.message}`);
      continue;
    }
    result.emitted += 1;
  }

  return result;
}
