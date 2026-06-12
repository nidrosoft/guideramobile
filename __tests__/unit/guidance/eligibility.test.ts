/**
 * Guidance cadence + eligibility engine.
 */
jest.mock('@/lib/supabase/client', () => ({
  supabase: { from: () => ({ upsert: () => Promise.resolve({ error: null }) }) },
  supabaseUrl: 'http://localhost',
  supabaseAnonKey: 'test',
  setClerkTokenGetter: () => {},
  getAuthenticatedEdgeFunctionHeaders: async () => ({}),
  buildClerkEdgeFunctionHeaders: () => ({}),
  supabaseNoAuth: {},
}));

import { useGuidanceStore } from '@/features/guidance/store/useGuidanceStore';
import { evaluateSignal } from '@/features/guidance/profile/signalEngine';
import { EMPTY_GUIDANCE_STATE, type ProfileSignal } from '@/features/guidance/types';

function resetStore() {
  useGuidanceStore.setState({
    hydrated: true,
    userId: 'u1',
    state: JSON.parse(JSON.stringify(EMPTY_GUIDANCE_STATE)),
  });
}

beforeEach(resetStore);

describe('store cadence', () => {
  it('allows up to 3 prompts per day then blocks', () => {
    const s = useGuidanceStore.getState();
    expect(s.canShowPromptToday()).toBe(true);
    s.recordPromptShown('home_airport');
    s.recordPromptShown('spendingStyle');
    s.recordPromptShown('flightClass');
    expect(useGuidanceStore.getState().canShowPromptToday()).toBe(false);
  });

  it('tracks celebrated milestones idempotently', () => {
    const s = useGuidanceStore.getState();
    expect(s.hasCelebrated(50)).toBe(false);
    s.markCelebrated(50);
    s.markCelebrated(50); // idempotent
    expect(useGuidanceStore.getState().hasCelebrated(50)).toBe(true);
    expect(useGuidanceStore.getState().state.celebratedMilestones).toEqual([50]);
    expect(useGuidanceStore.getState().hasCelebrated(80)).toBe(false);
  });

  it('records decline timestamps and suppression', () => {
    const s = useGuidanceStore.getState();
    s.recordPromptDeclined('home_airport');
    expect(useGuidanceStore.getState().getFieldRecord('home_airport').declinedAt).toBeTruthy();
    s.suppressField('home_airport');
    expect(useGuidanceStore.getState().getFieldRecord('home_airport').suppressed).toBe(true);
  });
});

describe('evaluateSignal eligibility', () => {
  const explicitSignal: ProfileSignal = {
    source: 'flight_search',
    surface: 'search',
    facts: [
      { field: 'home_airport', value: 'ATL', confidence: 'explicit' },
      { field: 'flightStops', value: 'direct', confidence: 'explicit' },
    ],
  };

  it('returns the highest-impact explicit fact', () => {
    const prompt = evaluateSignal(explicitSignal, null, null);
    expect(prompt?.field).toBe('home_airport'); // higher impact than flightStops
  });

  it('routes lower-impact facts to pendingFacts', () => {
    evaluateSignal(explicitSignal, null, null);
    const pending = useGuidanceStore.getState().state.pendingFacts.map((f) => f.field);
    expect(pending).toContain('flightStops');
  });

  it('suppressed fields are never promoted', () => {
    useGuidanceStore.getState().suppressField('home_airport');
    const prompt = evaluateSignal(explicitSignal, null, null);
    expect(prompt?.field).not.toBe('home_airport');
  });

  it('weak facts never prompt, only accumulate', () => {
    const weak: ProfileSignal = {
      source: 'saved_item', surface: 'home',
      facts: [{ field: 'interests', value: 'food', confidence: 'weak' }],
    };
    const prompt = evaluateSignal(weak, null, null);
    expect(prompt).toBeNull();
    expect(useGuidanceStore.getState().state.pendingFacts.some((f) => f.field === 'interests')).toBe(true);
  });

  it('behavioral facts require 2 sightings before prompting', () => {
    const behavioral: ProfileSignal = {
      source: 'expense', surface: 'expenses',
      facts: [{ field: 'defaultCurrency', value: 'EUR', confidence: 'behavioral' }],
    };
    expect(evaluateSignal(behavioral, null, null)).toBeNull(); // 1st sighting
    const prompt = evaluateSignal(behavioral, null, null);     // 2nd sighting
    expect(prompt?.field).toBe('defaultCurrency');
  });

  it('does not prompt for an already-set field', () => {
    const prefs: any = { homeAirport: 'JFK', flightStops: 'any' };
    const prompt = evaluateSignal(explicitSignal, prefs, null);
    expect(prompt?.field).not.toBe('home_airport');
  });
});
