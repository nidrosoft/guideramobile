/**
 * GuidanceProvider — the single arbiter and render slot for the Guidance
 * System. Renders at most one element at a time: an active tour, a profile
 * prompt, or a smart tip (priority in that order). See spec §2.2.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import type { TravelPreferences } from '@/services/preferences.service';

import { useGuidanceStore } from './store/useGuidanceStore';
import { onProfileSignal, guidanceAnalytics } from './events/guidanceEvents';
import { measureAnchor, runActionHandler, type AnchorFrame } from './tour/anchorRegistry';
import { TOURS } from './tour/tours';
import { SMART_TIPS } from './tips/smartTips.catalog';
import { SpotlightOverlay } from './tour/SpotlightOverlay';
import { TourTooltip } from './tour/TourTooltip';
import { PromptCard } from './profile/PromptCard';
import { SmartTipBubble } from './tips/SmartTipBubble';
import { evaluateSignal } from './profile/signalEngine';
import { FIELD_META } from './profile/fieldMeta';
import { profileStrength } from './profile/strength';
import { applyFact, loadPreferences } from './profile/profileCapture';
import { CelebrationCard } from './profile/CelebrationCard';
import { STRENGTH_MILESTONES, type ProfileSignal, type QueuedPrompt, type TipId, type TourId, type Tour, type TourStep } from './types';

const TOUR_END_PROMPT_COOLDOWN_MS = 30_000;
const BETWEEN_TOURS_MS = 120_000;

interface ActiveTour {
  tour: Tour;
  index: number;
  frame: AnchorFrame | null;
}
interface ActivePrompt extends QueuedPrompt {
  fact: string;
  benefit: string;
}
interface ActiveTip {
  id: TipId;
  frame: AnchorFrame | null;
}

interface GuidanceApi {
  maybeStartTour: (id: TourId) => void;
  startTour: (id: TourId) => void;
  maybeShowTip: (id: TipId) => void;
  setSuppressed: (s: boolean) => void;
  refreshPreferences: () => Promise<void>;
  strength: number;
}

const GuidanceContext = createContext<GuidanceApi | null>(null);

export function useGuidance(): GuidanceApi {
  return (
    useContext(GuidanceContext) ?? {
      // No-op fallback so callers outside the provider never crash.
      maybeStartTour: () => {},
      startTour: () => {},
      maybeShowTip: () => {},
      setSuppressed: () => {},
      refreshPreferences: async () => {},
      strength: 0,
    }
  );
}

const tabRoute = (tab: string): string => (tab === 'index' ? '/(tabs)' : `/(tabs)/${tab}`);

export function GuidanceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const store = useGuidanceStore();

  const [prefs, setPrefs] = useState<TravelPreferences | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [activeTour, setActiveTour] = useState<ActiveTour | null>(null);
  const [activePrompt, setActivePrompt] = useState<ActivePrompt | null>(null);
  const [activeTip, setActiveTip] = useState<ActiveTip | null>(null);
  const [activeCelebration, setActiveCelebration] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const suppressedRef = useRef(false);
  const lastTourEndedAt = useRef(0);
  const sessionSurfaces = useRef<Set<string>>(new Set());
  const activeTourRef = useRef<ActiveTour | null>(null);
  activeTourRef.current = activeTour;
  const milestonesInitialized = useRef(false);

  const privacyAllowed = (profile as any)?.privacy_settings?.personalization !== false;
  const strength = useMemo(() => profileStrength(prefs, profile), [prefs, profile]);

  // ── Milestone celebrations (50/80/100) ──
  // Gate on prefsLoaded: `strength` is only meaningful once preferences have
  // actually loaded. Initializing earlier (while strength is still 0) would
  // mis-mark milestones and then falsely celebrate when prefs arrive.
  useEffect(() => {
    if (!store.hydrated || !prefsLoaded || !profile) return;
    // On first real-strength read, silently mark already-reached milestones so
    // we only celebrate genuine in-session crossings (never retroactively).
    if (!milestonesInitialized.current) {
      milestonesInitialized.current = true;
      STRENGTH_MILESTONES.forEach((m) => {
        if (strength >= m && !store.hasCelebrated(m)) store.markCelebrated(m);
      });
      return;
    }
    const crossed = STRENGTH_MILESTONES.filter((m) => strength >= m && !store.hasCelebrated(m));
    if (crossed.length > 0) {
      const top = Math.max(...crossed);
      crossed.forEach((m) => store.markCelebrated(m));
      if (!suppressedRef.current) setActiveCelebration(top);
    }
  }, [strength, store.hydrated, prefsLoaded, profile]);

  // ── hydration ──
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    store.hydrate(profile.id);
    loadPreferences(profile.id)
      .then((p) => { setPrefs(p); setPrefsLoaded(true); })
      .catch(() => setPrefsLoaded(true));
  }, [profile?.id]);

  const refreshPreferences = useCallback(async () => {
    if (!profile?.id) return;
    const p = await loadPreferences(profile.id);
    setPrefs(p);
    setPrefsLoaded(true);
  }, [profile?.id]);

  // ── Tour controller ──
  const endTour = useCallback(() => {
    lastTourEndedAt.current = new Date().getTime();
    setActiveTour(null);
  }, []);

  const runStep = useCallback(
    async (tour: Tour, index: number) => {
      const step: TourStep | undefined = tour.steps[index];
      if (!step) {
        endTour();
        return;
      }

      const pa = step.preAction;
      if (pa) {
        try {
          switch (pa.type) {
            case 'switchTab':
              router.navigate(tabRoute(pa.tab) as any);
              break;
            case 'scrollHomeToSection':
              await runActionHandler('scrollHomeToSection', pa.sectionId);
              break;
            case 'scrollHomeToTop':
              await runActionHandler('scrollHomeToTop');
              break;
            case 'scrollToAnchor':
              await runActionHandler('scrollToAnchor', pa.anchorId);
              break;
            case 'openLauncher':
              await runActionHandler('openLauncher');
              break;
            case 'closeLauncher':
              await runActionHandler('closeLauncher');
              break;
            case 'delay':
              await new Promise((r) => setTimeout(r, pa.ms));
              break;
          }
        } catch {
          /* preAction best-effort */
        }
        await new Promise((r) => setTimeout(r, 180));
      }

      const frame = await measureAnchor(step.anchorId);
      if (!frame) {
        // anchor missing — skip this step gracefully
        if (index + 1 < tour.steps.length) {
          runStep(tour, index + 1);
          return;
        }
        endTour();
        return;
      }

      store.setTourStep(tour.id, index);
      guidanceAnalytics.tourStepViewed(tour.id, step.id, index);
      setActiveTour({ tour, index, frame });
    },
    [router, store, endTour]
  );

  const startTour = useCallback(
    (id: TourId) => {
      const tour = TOURS[id];
      if (!tour) return;
      setActivePrompt(null);
      setActiveTip(null);
      guidanceAnalytics.tourStarted(id);
      runStep(tour, 0);
    },
    [runStep]
  );

  const maybeStartTour = useCallback(
    (id: TourId) => {
      if (suppressedRef.current || activeTourRef.current) return;
      if (!profile?.onboarding_completed) return;
      if (store.getTourStatus(id) !== 'unseen') return;
      // hero must get the first slot before any contextual tour runs
      if (id !== 'hero' && store.getTourStatus('hero') === 'unseen') return;
      if (new Date().getTime() - lastTourEndedAt.current < BETWEEN_TOURS_MS) return;
      setTimeout(() => startTour(id), id === 'hero' ? 600 : 300);
    },
    [profile?.onboarding_completed, store, startTour]
  );

  const onTourNext = useCallback(() => {
    if (!activeTour) return;
    const { tour, index } = activeTour;
    const step = tour.steps[index];
    const isLast = index + 1 >= tour.steps.length;
    if (isLast) {
      store.markTour(tour.id, 'completed');
      guidanceAnalytics.tourCompleted(tour.id);
      endTour();
      if (step.ctaRoute) setTimeout(() => router.push(step.ctaRoute as any), 50);
      return;
    }
    runStep(tour, index + 1);
  }, [activeTour, store, endTour, runStep, router]);

  const onTourBack = useCallback(() => {
    if (!activeTour || activeTour.index === 0) return;
    runStep(activeTour.tour, activeTour.index - 1);
  }, [activeTour, runStep]);

  const onTourSkip = useCallback(() => {
    if (!activeTour) return;
    store.markTour(activeTour.tour.id, 'skipped');
    guidanceAnalytics.tourSkipped(activeTour.tour.id, activeTour.index);
    endTour();
  }, [activeTour, store, endTour]);

  // ── Smart tips ──
  const maybeShowTip = useCallback(
    async (id: TipId) => {
      if (suppressedRef.current || activeTourRef.current || activePrompt || activeTip) return;
      if (store.getTipStatus(id) !== 'unseen') return;
      if (!store.canShowPromptToday()) return; // tips share the daily budget
      const tip = SMART_TIPS[id];
      if (!tip) return;
      const frame = await measureAnchor(tip.anchorId);
      if (!frame) return;
      store.markTip(id, 'shown');
      store.recordPromptShown(`tip:${id}` as any); // count toward daily budget
      guidanceAnalytics.tipShown(id);
      setActiveTip({ id, frame });
    },
    [store, activePrompt, activeTip]
  );

  const dismissTip = useCallback(() => {
    if (activeTip) guidanceAnalytics.tipDismissed(activeTip.id);
    setActiveTip(null);
  }, [activeTip]);

  // ── Profile signal handling ──
  const showPrompt = useCallback(
    (candidate: QueuedPrompt) => {
      const meta = FIELD_META[candidate.field];
      if (!meta) return;
      const fact = t(`guidance.prompts.${meta.copyKey}.fact`, { value: candidate.value });
      const benefit = t(`guidance.prompts.${meta.copyKey}.benefit`, { value: candidate.value });
      store.recordPromptShown(candidate.field);
      sessionSurfaces.current.add(candidate.surface);
      guidanceAnalytics.promptShown(candidate.field, candidate.source, 'explicit');
      setActivePrompt({ ...candidate, fact, benefit });
    },
    [t, store]
  );

  useEffect(() => {
    const unsub = onProfileSignal((signal: ProfileSignal) => {
      if (!privacyAllowed) return;
      if (suppressedRef.current || activeTourRef.current || activePrompt) return;
      if (new Date().getTime() - lastTourEndedAt.current < TOUR_END_PROMPT_COOLDOWN_MS) return;
      if (sessionSurfaces.current.has(signal.surface)) return; // 1/session/surface
      if (!store.canShowPromptToday()) return; // 3/day

      const candidate = evaluateSignal(signal, prefs, profile);
      if (candidate) showPrompt(candidate);
    });
    return () => {
      unsub();
    };
  }, [privacyAllowed, prefs, profile, activePrompt, store, showPrompt]);

  const onPromptSave = useCallback(async () => {
    if (!activePrompt || !profile?.id) {
      setActivePrompt(null);
      return;
    }
    const before = strength;
    const updated = await applyFact(profile.id, activePrompt.field, activePrompt.value);
    if (updated) {
      setPrefs(updated);
      guidanceAnalytics.strengthChanged(before, profileStrength(updated, profile), 'prompt');
    }
    guidanceAnalytics.promptAccepted(activePrompt.field, activePrompt.source);
    store.removePendingFact(activePrompt.field);
    setActivePrompt(null);
  }, [activePrompt, profile, strength, store]);

  const onPromptDismiss = useCallback(() => {
    if (!activePrompt) return;
    store.recordPromptDeclined(activePrompt.field);
    guidanceAnalytics.promptDeclined(activePrompt.field, activePrompt.source);
    setActivePrompt(null);
  }, [activePrompt, store]);

  const onPromptSoftDismiss = useCallback(() => {
    if (activePrompt) guidanceAnalytics.promptExpired(activePrompt.field);
    setActivePrompt(null);
  }, [activePrompt]);

  const onPromptSuppress = useCallback(() => {
    if (!activePrompt) return;
    store.suppressField(activePrompt.field);
    guidanceAnalytics.promptSuppressed(activePrompt.field);
    setActivePrompt(null);
  }, [activePrompt, store]);

  const setSuppressed = useCallback((s: boolean) => {
    suppressedRef.current = s;
  }, []);

  const api = useMemo<GuidanceApi>(
    () => ({
      maybeStartTour,
      startTour,
      maybeShowTip,
      setSuppressed,
      refreshPreferences,
      strength,
    }),
    [maybeStartTour, startTour, maybeShowTip, setSuppressed, refreshPreferences, strength]
  );

  const currentStep = activeTour?.tour.steps[activeTour.index];

  return (
    <GuidanceContext.Provider value={api}>
      {children}

      {/* One render slot — tour > prompt > tip */}
      {activeTour && currentStep ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <SpotlightOverlay
            frame={activeTour.frame}
            reduceMotion={reduceMotion}
            passThroughCutout={!!currentStep.tapTargetToAdvance}
            onPressBackdrop={onTourNext}
          />
          <TourTooltip
            frame={activeTour.frame}
            titleKey={currentStep.titleKey}
            bodyKey={currentStep.bodyKey}
            stepIndex={activeTour.index}
            stepCount={activeTour.tour.steps.length}
            isFirst={activeTour.index === 0}
            isLast={activeTour.index + 1 >= activeTour.tour.steps.length}
            ctaLabelKey={currentStep.ctaLabelKey}
            onNext={onTourNext}
            onBack={onTourBack}
            onSkip={onTourSkip}
          />
        </View>
      ) : activeCelebration !== null ? (
        <CelebrationCard
          milestone={activeCelebration}
          strength={strength}
          reduceMotion={reduceMotion}
          onDismiss={() => setActiveCelebration(null)}
        />
      ) : activePrompt ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <PromptCard
            fact={activePrompt.fact}
            benefit={activePrompt.benefit}
            onSave={onPromptSave}
            onDismiss={onPromptDismiss}
            onSoftDismiss={onPromptSoftDismiss}
            onSuppress={onPromptSuppress}
          />
        </View>
      ) : activeTip ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <SmartTipBubble
            frame={activeTip.frame}
            titleKey={SMART_TIPS[activeTip.id].titleKey}
            bodyKey={SMART_TIPS[activeTip.id].bodyKey}
            onDismiss={dismissTip}
          />
        </View>
      ) : null}
    </GuidanceContext.Provider>
  );
}

export default GuidanceProvider;
