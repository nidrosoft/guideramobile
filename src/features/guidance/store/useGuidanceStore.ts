/**
 * Guidance persisted state (Zustand + AsyncStorage, mirrored to Supabase).
 *
 * AsyncStorage is the source of truth for instant reads. The DB row
 * (user_guidance_state) is synced debounced and hydrated at sign-in so
 * reinstalls / second devices don't replay tours.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase/client';
import {
  EMPTY_GUIDANCE_STATE,
  type GuidancePersistedState,
  type ProfileField,
  type PendingFact,
  type TourId,
  type TourStatus,
  type TipId,
  type TipStatus,
  type PromptFieldRecord,
} from '../types';

const STORAGE_KEY = 'guidera-guidance';

function todayKey(): string {
  // Local date YYYY-MM-DD. Date.now via new Date() is fine on-device (RN).
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

interface GuidanceStore {
  hydrated: boolean;
  userId: string | null;
  state: GuidancePersistedState;

  // lifecycle
  hydrate: (userId: string | null) => Promise<void>;
  reset: () => void;

  // tours
  getTourStatus: (id: TourId) => TourStatus;
  setTourStep: (id: TourId, step: number) => void;
  markTour: (id: TourId, status: TourStatus) => void;
  resetTourForReplay: (id: TourId) => void;

  // tips
  getTipStatus: (id: TipId) => TipStatus;
  markTip: (id: TipId, status: TipStatus) => void;

  // prompts / cadence
  getFieldRecord: (field: ProfileField) => PromptFieldRecord;
  canShowPromptToday: () => boolean;
  recordPromptShown: (field: ProfileField) => void;
  recordPromptDeclined: (field: ProfileField) => void;
  suppressField: (field: ProfileField) => void;

  // pending facts (batch review)
  addPendingFact: (fact: PendingFact) => void;
  removePendingFact: (field: ProfileField) => void;
  bumpPendingSighting: (field: ProfileField) => number;

  // milestones
  hasCelebrated: (milestone: number) => boolean;
  markCelebrated: (milestone: number) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let dbTimer: ReturnType<typeof setTimeout> | null = null;

export const useGuidanceStore = create<GuidanceStore>((set, get) => {
  /** Persist locally (debounced) and to the DB (debounced longer). */
  const persist = () => {
    const { state, userId } = get();
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 250);

    if (userId) {
      if (dbTimer) clearTimeout(dbTimer);
      dbTimer = setTimeout(() => {
        supabase
          .from('user_guidance_state')
          .upsert({ user_id: userId, state, updated_at: nowIso() }, { onConflict: 'user_id' })
          .then(undefined, () => {});
      }, 5000);
    }
  };

  const update = (mutator: (s: GuidancePersistedState) => GuidancePersistedState) => {
    set((prev) => ({ state: mutator(prev.state) }));
    persist();
  };

  /** Reset the daily counter if the stored date is not today. */
  const ensureDailyWindow = (s: GuidancePersistedState): GuidancePersistedState => {
    const tk = todayKey();
    if (s.prompts.shownTodayDate === tk) return s;
    return { ...s, prompts: { ...s.prompts, shownToday: 0, shownTodayDate: tk } };
  };

  return {
    hydrated: false,
    userId: null,
    state: EMPTY_GUIDANCE_STATE,

    hydrate: async (userId) => {
      let local: GuidancePersistedState | null = null;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) local = JSON.parse(raw) as GuidancePersistedState;
      } catch {
        /* ignore corrupt cache */
      }

      let remote: GuidancePersistedState | null = null;
      if (userId) {
        try {
          const { data } = await supabase
            .from('user_guidance_state')
            .select('state')
            .eq('user_id', userId)
            .maybeSingle();
          if (data?.state) remote = data.state as GuidancePersistedState;
        } catch {
          /* offline — local wins */
        }
      }

      // Merge: a tour seen on ANY device counts as seen. Prefer the record
      // with more progress; union tips/prompts conservatively.
      const merged = mergeStates(local, remote);
      set({
        state: ensureDailyWindow({ ...EMPTY_GUIDANCE_STATE, ...merged }),
        userId,
        hydrated: true,
      });
    },

    reset: () => {
      if (saveTimer) clearTimeout(saveTimer);
      if (dbTimer) clearTimeout(dbTimer);
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      set({ state: EMPTY_GUIDANCE_STATE, userId: null, hydrated: false });
    },

    // ── tours ──
    getTourStatus: (id) => get().state.tours[id]?.status ?? 'unseen',
    setTourStep: (id, step) =>
      update((s) => ({
        ...s,
        tours: { ...s.tours, [id]: { status: s.tours[id]?.status ?? 'unseen', lastStep: step } },
      })),
    markTour: (id, status) =>
      update((s) => ({
        ...s,
        tours: {
          ...s.tours,
          [id]: {
            status,
            lastStep: s.tours[id]?.lastStep ?? 0,
            completedAt: status === 'completed' ? nowIso() : s.tours[id]?.completedAt,
          },
        },
      })),
    resetTourForReplay: (id) =>
      update((s) => ({ ...s, tours: { ...s.tours, [id]: { status: 'unseen', lastStep: 0 } } })),

    // ── tips ──
    getTipStatus: (id) => get().state.tips[id]?.status ?? 'unseen',
    markTip: (id, status) => update((s) => ({ ...s, tips: { ...s.tips, [id]: { status } } })),

    // ── prompts ──
    getFieldRecord: (field) =>
      get().state.prompts.perField[field] ?? { timesShown: 0, suppressed: false },
    canShowPromptToday: () => {
      const s = ensureDailyWindow(get().state);
      return s.prompts.shownToday < 3;
    },
    recordPromptShown: (field) =>
      update((s0) => {
        const s = ensureDailyWindow(s0);
        const rec = s.prompts.perField[field] ?? { timesShown: 0, suppressed: false };
        return {
          ...s,
          prompts: {
            ...s.prompts,
            shownToday: s.prompts.shownToday + 1,
            lastShownAt: nowIso(),
            perField: {
              ...s.prompts.perField,
              [field]: { ...rec, timesShown: rec.timesShown + 1, lastShownAt: nowIso() },
            },
          },
        };
      }),
    recordPromptDeclined: (field) =>
      update((s) => {
        const rec = s.prompts.perField[field] ?? { timesShown: 0, suppressed: false };
        return {
          ...s,
          prompts: {
            ...s.prompts,
            perField: { ...s.prompts.perField, [field]: { ...rec, declinedAt: nowIso() } },
          },
        };
      }),
    suppressField: (field) =>
      update((s) => {
        const rec = s.prompts.perField[field] ?? { timesShown: 0, suppressed: false };
        return {
          ...s,
          prompts: {
            ...s.prompts,
            perField: { ...s.prompts.perField, [field]: { ...rec, suppressed: true } },
          },
        };
      }),

    // ── pending facts ──
    addPendingFact: (fact) =>
      update((s) => {
        const existing = s.pendingFacts.find((f) => f.field === fact.field);
        if (existing) {
          return {
            ...s,
            pendingFacts: s.pendingFacts.map((f) =>
              f.field === fact.field
                ? { ...fact, sightings: f.sightings + 1, firstSeenAt: f.firstSeenAt }
                : f
            ),
          };
        }
        return { ...s, pendingFacts: [...s.pendingFacts, fact] };
      }),
    removePendingFact: (field) =>
      update((s) => ({ ...s, pendingFacts: s.pendingFacts.filter((f) => f.field !== field) })),
    bumpPendingSighting: (field) => {
      const fact = get().state.pendingFacts.find((f) => f.field === field);
      const next = (fact?.sightings ?? 0) + 1;
      update((s) => ({
        ...s,
        pendingFacts: s.pendingFacts.map((f) =>
          f.field === field ? { ...f, sightings: next } : f
        ),
      }));
      return next;
    },

    // ── milestones ──
    hasCelebrated: (milestone) => (get().state.celebratedMilestones ?? []).includes(milestone),
    markCelebrated: (milestone) =>
      update((s) => ({
        ...s,
        celebratedMilestones: Array.from(new Set([...(s.celebratedMilestones ?? []), milestone])),
      })),
  };
});

/** Merge local + remote persisted state. A tour seen anywhere stays seen. */
function mergeStates(
  a: GuidancePersistedState | null,
  b: GuidancePersistedState | null
): GuidancePersistedState {
  if (!a) return b ?? EMPTY_GUIDANCE_STATE;
  if (!b) return a;

  const tours: GuidancePersistedState['tours'] = { ...a.tours };
  for (const [id, rec] of Object.entries(b.tours)) {
    const cur = tours[id];
    if (!cur) tours[id] = rec;
    else {
      const rank = (s: TourStatus) => (s === 'completed' ? 2 : s === 'skipped' ? 1 : 0);
      tours[id] =
        rank(rec.status) > rank(cur.status)
          ? rec
          : { ...cur, lastStep: Math.max(cur.lastStep, rec.lastStep) };
    }
  }

  const tips: GuidancePersistedState['tips'] = { ...a.tips };
  for (const [id, rec] of Object.entries(b.tips)) {
    if (!tips[id] || tips[id].status === 'unseen') tips[id] = rec;
  }

  // Prompts: take the higher counts to be conservative (don't re-spam).
  const perField: Record<string, PromptFieldRecord> = { ...a.prompts.perField };
  for (const [field, rec] of Object.entries(b.prompts.perField)) {
    const cur = perField[field];
    perField[field] = cur
      ? {
          timesShown: Math.max(cur.timesShown, rec.timesShown),
          lastShownAt: cur.lastShownAt ?? rec.lastShownAt,
          declinedAt: cur.declinedAt ?? rec.declinedAt,
          suppressed: cur.suppressed || rec.suppressed,
        }
      : rec;
  }

  const pendingByField = new Map<string, PendingFact>();
  for (const f of [...a.pendingFacts, ...b.pendingFacts]) pendingByField.set(f.field, f);

  return {
    tours,
    tips,
    prompts: {
      perField,
      shownToday: a.prompts.shownToday,
      shownTodayDate: a.prompts.shownTodayDate,
      lastShownAt: a.prompts.lastShownAt ?? b.prompts.lastShownAt,
    },
    pendingFacts: Array.from(pendingByField.values()),
    celebratedMilestones: Array.from(
      new Set([...(a.celebratedMilestones ?? []), ...(b.celebratedMilestones ?? [])])
    ),
  };
}
