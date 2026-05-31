/**
 * Trip Engagement engine.
 *
 * On each run it walks every trip in an engagement window, determines the
 * lifecycle phase (before / during / after), asks each registered module for
 * candidate content, then emits AT MOST ONE notification per trip per run.
 * Spacing across the day is achieved by the cron cadence; per-module daily
 * quotas and a per-phase daily cap prevent overwhelming the user.
 *
 * Emitted notifications are inserted into `alerts` as pending — the existing
 * send-notification `dispatch_pending` job then applies category preferences,
 * quiet hours, and push delivery.
 */

import {
  ENGAGEMENT_BASE_PRIORITY,
  SEND_WINDOW,
  type Candidate,
  type NotificationModule,
  type Phase,
  type SupabaseClient,
  type TripContext,
} from './types.ts';
import { MODULES } from './registry.ts';
import { dayDiff, loadSendState, localNow, pickTimezone, recordSend } from './lib.ts';
import { aiEnabled, buildPersona, lastDebug, personalize } from './copywriter.ts';

interface EngineResult {
  tripsScanned: number;
  emitted: number;
  byModule: Record<string, number>;
  errors: string[];
  preview?: Array<{ tripId: string; phase: Phase; module: string; title: string; body: string }>;
}

interface EngineOptions {
  /** When true, computes what would be sent without writing alerts or ledger rows. */
  dryRun?: boolean;
  /** Debug only (dryRun): bypass the send-window guard to preview selection. */
  ignoreWindow?: boolean;
}

/** Per-user engagement gate derived from notification preferences. */
interface UserGate {
  /** Frequency-scaled per-phase daily caps. */
  caps: Record<Phase, number>;
  /** alert_type_codes the user has explicitly muted. */
  disabledTypes: Set<string>;
}

// Frequency presets scale the per-phase daily ceilings. 'standard' matches the
// engine defaults (PHASE_DAILY_CAP). 'off' disables the whole trip_tips feed.
const FREQUENCY_CAPS: Record<string, Record<Phase, number>> = {
  off: { before: 0, during: 0, after: 0 },
  minimal: { before: 3, during: 1, after: 1 },
  standard: { before: 6, during: 3, after: 2 },
  all: { before: 9, during: 4, after: 3 },
};

function capsForFrequency(freq: string | undefined | null): Record<Phase, number> {
  return FREQUENCY_CAPS[freq || 'standard'] || FREQUENCY_CAPS.standard;
}

const DEFAULT_GATE: UserGate = { caps: FREQUENCY_CAPS.standard, disabledTypes: new Set() };

function resolvePhase(localDate: string, startDate: string, endDate: string): Phase {
  if (localDate < startDate) return 'before';
  if (localDate > endDate) return 'after';
  return 'during';
}

function buildContext(
  trip: TripContext['trip'],
  timezone: string,
  sendState: Pick<TripContext, 'sentTodayByModule' | 'sentTodayTotal' | 'alreadySent'>
): TripContext | null {
  if (!trip.start_date || !trip.end_date) return null;
  const { hour, date } = localNow(timezone);
  const phase = resolvePhase(date, trip.start_date, trip.end_date);

  const daysUntilStart = dayDiff(date, trip.start_date);
  const daysAfterEnd = dayDiff(trip.end_date, date);
  const tripDayCount = Math.max(1, dayDiff(trip.start_date, trip.end_date) + 1);
  const tripDayNumber = phase === 'during' ? dayDiff(trip.start_date, date) + 1 : 0;

  return {
    trip,
    userId: trip.user_id,
    phase,
    daysUntilStart,
    daysAfterEnd,
    tripDayCount,
    tripDayNumber,
    localHour: hour,
    localDate: date,
    timezone,
    destinationName: trip.primary_destination_name || trip.title || 'your destination',
    countryName: trip.primary_destination_country || '',
    ...sendState,
  };
}

/** Score a module's best candidate; higher wins. Interleaves modules by how
 *  far each is from its daily quota so we don't fire one type back-to-back. */
function scoreCandidate(
  ctx: TripContext,
  mod: NotificationModule,
  quota: number,
  candidate: Candidate
): number {
  const sent = ctx.sentTodayByModule[mod.key] || 0;
  const remainingRatio = (quota - sent) / quota;
  return remainingRatio * 100 + candidate.weight;
}

async function processTrip(
  supabase: SupabaseClient,
  trip: TripContext['trip'],
  timezone: string,
  persona: string,
  gate: UserGate,
  result: EngineResult,
  opts: EngineOptions
): Promise<void> {
  const sendState = await loadSendState(supabase, trip.id, localNow(timezone).date);
  const ctx = buildContext(trip, timezone, sendState);
  if (!ctx) return;

  // Respect the user-local send window.
  if (!opts.ignoreWindow && (ctx.localHour < SEND_WINDOW.startHour || ctx.localHour >= SEND_WINDOW.endHour)) return;

  // Frequency-scaled per-phase daily ceiling (0 = feed muted for this phase).
  const cap = gate.caps[ctx.phase];
  if (cap <= 0) return;
  if (ctx.sentTodayTotal >= cap) return;

  // Gather the best candidate from each eligible module.
  let best: { mod: NotificationModule; candidate: Candidate; score: number } | null = null;

  for (const mod of MODULES) {
    if (!mod.phases.includes(ctx.phase)) continue;
    // Skip modules the user has muted at the per-type level.
    if (gate.disabledTypes.has(mod.alertTypeCode)) continue;
    const quota = mod.quota(ctx);
    if (quota <= 0) continue;
    if ((ctx.sentTodayByModule[mod.key] || 0) >= quota) continue;

    let candidates: Candidate[] = [];
    try {
      candidates = await mod.selectCandidates(ctx, supabase);
    } catch (err) {
      result.errors.push(`${mod.key}: ${err instanceof Error ? err.message : 'select failed'}`);
      continue;
    }
    if (!candidates.length) continue;

    const top = candidates[0];
    const score = scoreCandidate(ctx, mod, quota, top);
    if (!best || score > best.score) best = { mod, candidate: top, score };
  }

  if (!best) return;

  // Phase 3: AI copywriter polish (engaging modules only; template on failure).
  if (best.mod.personalize && persona && aiEnabled()) {
    try {
      const rewritten = await personalize(persona, {
        module: best.mod.key,
        phase: ctx.phase,
        destinationName: ctx.destinationName,
        countryName: ctx.countryName,
        title: best.candidate.title,
        body: best.candidate.body,
      });
      if (rewritten) {
        best.candidate.title = rewritten.title;
        best.candidate.body = rewritten.body;
      }
      if (opts.dryRun) result.errors.push(`ai:${best.mod.key}:${lastDebug}`);
    } catch (err) {
      // Keep the template copy on any copywriter failure.
      if (opts.dryRun) result.errors.push(`ai_throw:${err instanceof Error ? err.message : 'x'}`);
    }
  }

  if (opts.dryRun) {
    result.emitted += 1;
    result.byModule[best.mod.key] = (result.byModule[best.mod.key] || 0) + 1;
    (result.preview ||= []).push({
      tripId: ctx.trip.id,
      phase: ctx.phase,
      module: best.mod.key,
      title: best.candidate.title,
      body: best.candidate.body,
    });
    return;
  }

  // Reserve the slot in the dedup ledger first to avoid duplicate sends.
  const reserved = await recordSend(supabase, {
    userId: ctx.userId,
    tripId: ctx.trip.id,
    module: best.mod.key,
    contentRef: best.candidate.contentRef,
    phase: ctx.phase,
    localDate: ctx.localDate,
  });
  if (!reserved) return; // already emitted by a concurrent run

  const { error } = await supabase.from('alerts').insert({
    user_id: ctx.userId,
    trip_id: ctx.trip.id,
    alert_type_code: best.mod.alertTypeCode,
    category_code: best.mod.categoryCode,
    title: best.candidate.title,
    body: best.candidate.body,
    context: {
      phase: ctx.phase,
      ...(best.candidate.context || {}),
    },
    action_url: best.candidate.actionUrl,
    priority: best.candidate.priority || ENGAGEMENT_BASE_PRIORITY,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  });

  if (error) {
    result.errors.push(`alert insert (${best.mod.key}): ${error.message}`);
    return;
  }

  result.emitted += 1;
  result.byModule[best.mod.key] = (result.byModule[best.mod.key] || 0) + 1;
}

export async function runEngagement(
  supabase: SupabaseClient,
  opts: EngineOptions = {}
): Promise<EngineResult> {
  const result: EngineResult = { tripsScanned: 0, emitted: 0, byModule: {}, errors: [] };

  // Window: from 30 days before start to 4 days after end (covers after-phase).
  const lowerEnd = new Date(Date.now() - 4 * 86_400_000).toISOString().slice(0, 10);
  const upperStart = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  const { data: trips, error } = await supabase
    .from('trips')
    .select(
      'id, user_id, title, start_date, end_date, destination_timezone, primary_destination_name, primary_destination_country, budget_total, budget_currency, expense_summary, notifications_enabled, state, modules_generated, deleted_at'
    )
    .is('deleted_at', null)
    // NOTE: trip lifecycle state is computed from dates client-side; the DB
    // `state` column stays 'draft' for most committed trips, so we gate on
    // `modules_generated` (real content = a committed trip) instead of state.
    .eq('modules_generated', true)
    .not('start_date', 'is', null)
    .gte('end_date', lowerEnd)
    .lte('start_date', upperStart)
    .limit(500);

  if (error) {
    result.errors.push(`trip query: ${error.message}`);
    return result;
  }
  if (!Array.isArray(trips) || trips.length === 0) return result;

  // Batch-load user timezones + global notification toggle.
  const userIds = [...new Set(trips.map((t) => t.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select(
      'id, timezone, profession, industry, travel_preferences, packing_style, food_adventurousness, photography_level, activity_level, morning_person'
    )
    .in('id', userIds);
  const tzByUser = new Map<string, string | null>();
  const profileByUser = new Map<string, Record<string, unknown>>();
  for (const p of profiles || []) {
    tzByUser.set(p.id, p.timezone);
    profileByUser.set(p.id, p);
  }

  // Persona signals for the AI copywriter (Phase 3). Best-effort.
  const dnaByUser = new Map<string, Record<string, unknown>>();
  if (aiEnabled()) {
    const { data: dna } = await supabase
      .from('user_travel_dna')
      .select('user_id, primary_companion_type, has_children, travel_frequency')
      .in('user_id', userIds);
    for (const d of dna || []) dnaByUser.set(d.user_id, d);
  }
  const personaByUser = new Map<string, string>();
  for (const uid of userIds) {
    personaByUser.set(
      uid,
      aiEnabled() ? buildPersona(profileByUser.get(uid) || null, dnaByUser.get(uid) || null) : ''
    );
  }

  const { data: prefs } = await supabase
    .from('user_notification_preferences')
    .select(
      'user_id, notifications_enabled, category_preferences, type_preferences, frequency_preferences'
    )
    .in('user_id', userIds);
  const disabledUsers = new Set<string>();
  const gateByUser = new Map<string, UserGate>();
  for (const p of prefs || []) {
    if (p.notifications_enabled === false) disabledUsers.add(p.user_id);

    // A disabled trip_tips category (master) mutes the whole feed; otherwise
    // the frequency preset decides the per-phase caps.
    const catTripTips = (p.category_preferences || {})['trip_tips'];
    const tripTipsOff =
      catTripTips === false ||
      (typeof catTripTips === 'object' && catTripTips?.enabled === false);
    const freq = (p.frequency_preferences || {})['trip_tips'] as string | undefined;
    const caps = tripTipsOff ? FREQUENCY_CAPS.off : capsForFrequency(freq);

    const disabledTypes = new Set<string>();
    const tp = (p.type_preferences || {}) as Record<string, boolean>;
    for (const k of Object.keys(tp)) if (tp[k] === false) disabledTypes.add(k);

    gateByUser.set(p.user_id, { caps, disabledTypes });
  }

  // Bias the feed toward each user's NEXT departure. Process trips soonest-first
  // and let only the closest upcoming (before-phase) trip emit per run, so a
  // farther-out trip can't crowd out the imminent one. Trips already underway
  // ('during') or wrapping up ('after') are unaffected and always considered.
  trips.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
  const beforePhaseLed = new Set<string>();

  for (const trip of trips) {
    result.tripsScanned += 1;
    if (trip.notifications_enabled === false) continue;
    if (disabledUsers.has(trip.user_id)) continue;

    // Resolve the send-window timezone. Use the user's home tz to decide the
    // phase first (avoids a circular dependency), then switch to the
    // destination tz only while actually traveling.
    const homeTz = tzByUser.get(trip.user_id) || trip.destination_timezone || 'America/New_York';
    const prelimDate = localNow(homeTz).date;
    const isTraveling =
      !!trip.start_date &&
      !!trip.end_date &&
      prelimDate >= trip.start_date &&
      prelimDate <= trip.end_date;
    const prelimPhase: Phase = isTraveling
      ? 'during'
      : !!trip.end_date && prelimDate > trip.end_date
      ? 'after'
      : 'before';

    // Only the soonest upcoming trip per user leads the pre-trip feed each run.
    if (prelimPhase === 'before' && beforePhaseLed.has(trip.user_id)) continue;

    const timezone = pickTimezone(
      isTraveling ? 'during' : 'before',
      homeTz,
      trip.destination_timezone
    );
    const emittedBeforeRun = result.emitted;
    try {
      await processTrip(
        supabase,
        trip,
        timezone,
        personaByUser.get(trip.user_id) || '',
        gateByUser.get(trip.user_id) || DEFAULT_GATE,
        result,
        opts
      );
    } catch (err) {
      result.errors.push(`trip ${trip.id}: ${err instanceof Error ? err.message : 'failed'}`);
    }
    // Mark the user's pre-trip slot as taken only if this trip actually emitted,
    // so a soonest trip with no content today doesn't silence the next one.
    if (prelimPhase === 'before' && result.emitted > emittedBeforeRun) {
      beforePhaseLed.add(trip.user_id);
    }
  }

  return result;
}
