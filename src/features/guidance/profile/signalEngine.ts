/**
 * Signal engine + eligibility (spec §4.4).
 *
 * Converts a ProfileSignal into at most one inline prompt (the highest-impact
 * eligible fact), routing everything else to pendingFacts for the hub. Pure of
 * UI — the GuidanceProvider applies the runtime gates (session cap, arbiter)
 * and renders the result.
 */
import type { TravelPreferences } from '@/services/preferences.service';
import type { Profile } from '@/types/auth.types';
import { useGuidanceStore } from '../store/useGuidanceStore';
import { FIELD_META, fieldImpact } from './fieldMeta';
import { profileStrength, PROACTIVE_PROMPT_CEILING } from './strength';
import type { DetectedFact, ProfileSignal, QueuedPrompt } from '../types';

const DECLINE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BEHAVIORAL_MIN_SIGHTINGS = 2;
const FIELD_MAX_SHOWS = 3;

function nowMs() {
  return new Date().getTime();
}

/**
 * Field-level eligibility (rules 1-6 + strength gate 4). Returns true if this
 * fact could be shown as an inline prompt right now.
 */
function fieldEligible(
  fact: DetectedFact,
  prefs: TravelPreferences | null,
  strength: number
): boolean {
  const meta = FIELD_META[fact.field];
  if (!meta) return false;
  if (meta.isSet(prefs)) return false; // rule 2: already set
  if (strength >= PROACTIVE_PROMPT_CEILING) return false; // rule 4: 80% ceiling

  const rec = useGuidanceStore.getState().getFieldRecord(fact.field);
  if (rec.suppressed) return false; // rule 5: don't-ask-again
  if (rec.timesShown >= FIELD_MAX_SHOWS) return false; // rule 5: never 3×
  if (rec.declinedAt && nowMs() - new Date(rec.declinedAt).getTime() < DECLINE_COOLDOWN_MS) {
    return false; // rule 6: decline cooldown
  }
  return true;
}

/**
 * Evaluate a signal. Mutates pendingFacts via the store for non-promotable
 * facts. Returns the single best inline prompt, or null.
 *
 * `privacyAllowed` and the runtime caps (session/daily/arbiter) are enforced by
 * the caller; this focuses on field-level promotion.
 */
export function evaluateSignal(
  signal: ProfileSignal,
  prefs: TravelPreferences | null,
  profile: Profile | null
): QueuedPrompt | null {
  const store = useGuidanceStore.getState();
  const strength = profileStrength(prefs, profile);

  const candidates: QueuedPrompt[] = [];

  for (const fact of signal.facts) {
    const meta = FIELD_META[fact.field];
    if (!meta || meta.isSet(prefs)) continue; // already set → nothing to learn

    if (fact.confidence === 'weak') {
      // never prompts; accumulate for the hub
      store.addPendingFact({
        field: fact.field,
        value: fact.value,
        source: signal.source,
        confidence: fact.confidence,
        sightings: 1,
        firstSeenAt: new Date().toISOString(),
      });
      continue;
    }

    if (fact.confidence === 'behavioral') {
      // require ≥2 sightings before it can prompt
      store.addPendingFact({
        field: fact.field,
        value: fact.value,
        source: signal.source,
        confidence: fact.confidence,
        sightings: 1,
        firstSeenAt: new Date().toISOString(),
      });
      // Re-read fresh state: addPendingFact created a new state object, so the
      // captured `store.state` snapshot is stale.
      const sightings =
        useGuidanceStore.getState().state.pendingFacts.find((f) => f.field === fact.field)?.sightings ?? 1;
      if (sightings < BEHAVIORAL_MIN_SIGHTINGS) continue;
    }

    // explicit (or behavioral that crossed threshold): check field gates
    if (fieldEligible(fact, prefs, strength)) {
      candidates.push({
        field: fact.field,
        value: fact.value,
        source: signal.source,
        surface: signal.surface,
      });
    }
  }

  if (candidates.length === 0) return null;

  // highest-impact wins; the rest stay as pendingFacts (already added above, or add now)
  candidates.sort((a, b) => fieldImpact(b.field) - fieldImpact(a.field));
  const [chosen, ...rest] = candidates;
  for (const r of rest) {
    if (!useGuidanceStore.getState().state.pendingFacts.find((f) => f.field === r.field)) {
      store.addPendingFact({
        field: r.field,
        value: r.value,
        source: r.source,
        confidence: 'explicit',
        sightings: 1,
        firstSeenAt: new Date().toISOString(),
      });
    }
  }
  // chosen is being shown inline → remove from pending if present
  store.removePendingFact(chosen.field);
  return chosen;
}
