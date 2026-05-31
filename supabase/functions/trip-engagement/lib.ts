/**
 * Shared helpers for the Trip Engagement engine: time/phase math, dedup ledger
 * access, and small ranking utilities used by the modules.
 */

import type { Phase, SupabaseClient, TripContext } from './types.ts';

/** Resolve the user-local hour + calendar date for a given timezone. */
export function localNow(timezone: string): { hour: number; date: string } {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    const hour = parseInt(get('hour'), 10);
    const date = `${get('year')}-${get('month')}-${get('day')}`;
    return { hour: Number.isFinite(hour) ? hour % 24 : 12, date };
  } catch {
    // Invalid timezone — fall back to UTC.
    return {
      hour: now.getUTCHours(),
      date: now.toISOString().slice(0, 10),
    };
  }
}

/** Whole-day difference (b - a) between two YYYY-MM-DD dates. */
export function dayDiff(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  if (!Number.isFinite(da) || !Number.isFinite(db)) return 0;
  return Math.round((db - da) / 86_400_000);
}

/** Map a value to a descending weight based on its position in an ordered list. */
export function rankWeight(
  value: string | null | undefined,
  ordered: string[],
  base = 40,
  step = 8
): number {
  if (!value) return base - ordered.length * step;
  const idx = ordered.indexOf(value.toLowerCase());
  if (idx < 0) return base - ordered.length * step;
  return base - idx * step;
}

/** Choose the destination timezone while traveling, else the user's home tz. */
export function pickTimezone(
  phase: Phase,
  homeTz: string | null | undefined,
  destinationTz: string | null | undefined
): string {
  if (phase === 'during') return destinationTz || homeTz || 'America/New_York';
  return homeTz || destinationTz || 'America/New_York';
}

/**
 * Load today's send counts and the all-time dedup set for a trip.
 */
export async function loadSendState(
  supabase: SupabaseClient,
  tripId: string,
  localDate: string
): Promise<Pick<TripContext, 'sentTodayByModule' | 'sentTodayTotal' | 'alreadySent'>> {
  const { data, error } = await supabase
    .from('trip_engagement_sends')
    .select('module, content_ref, sent_on')
    .eq('trip_id', tripId);

  const sentTodayByModule: Record<string, number> = {};
  const alreadySent = new Set<string>();
  let sentTodayTotal = 0;

  if (!error && Array.isArray(data)) {
    for (const row of data) {
      alreadySent.add(`${row.module}:${row.content_ref}`);
      if (row.sent_on === localDate) {
        sentTodayByModule[row.module] = (sentTodayByModule[row.module] || 0) + 1;
        sentTodayTotal += 1;
      }
    }
  }

  return { sentTodayByModule, sentTodayTotal, alreadySent };
}

/** Record an emitted notification in the dedup ledger. */
export async function recordSend(
  supabase: SupabaseClient,
  args: {
    userId: string;
    tripId: string;
    module: string;
    contentRef: string;
    phase: Phase;
    localDate: string;
  }
): Promise<boolean> {
  const { error } = await supabase.from('trip_engagement_sends').insert({
    user_id: args.userId,
    trip_id: args.tripId,
    module: args.module,
    content_ref: args.contentRef,
    phase: args.phase,
    sent_on: args.localDate,
  });
  // Unique-constraint violation means a concurrent run already sent it.
  return !error;
}

/** Short, safe truncation for notification bodies. */
export function clamp(text: string | null | undefined, max = 140): string {
  const s = (text || '').trim().replace(/\s+/g, ' ');
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}
