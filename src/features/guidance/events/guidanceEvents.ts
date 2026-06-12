/**
 * Guidance analytics + a tiny in-process event bus.
 *
 * Analytics: thin wrappers over the app's Mixpanel trackEvent. We never send
 * captured field VALUES to analytics — only field names and outcomes (privacy).
 *
 * Bus: lets detectors push ProfileSignals to the GuidanceProvider without a
 * direct import cycle. Same fire-and-forget spirit as journeyEvents.ts.
 */
import { trackEvent } from '@/services/analytics/analytics';
import type { ProfileSignal } from '../types';

// ─── Analytics ────────────────────────────────────────────────────────────────

export const guidanceAnalytics = {
  tourStarted: (tourId: string) => trackEvent('guidance_tour_started', { tourId }),
  tourStepViewed: (tourId: string, stepId: string, stepIndex: number) =>
    trackEvent('guidance_tour_step_viewed', { tourId, stepId, stepIndex }),
  tourCompleted: (tourId: string) => trackEvent('guidance_tour_completed', { tourId }),
  tourSkipped: (tourId: string, stepIndex: number) =>
    trackEvent('guidance_tour_skipped', { tourId, stepIndex }),

  tipShown: (tipId: string) => trackEvent('guidance_tip_shown', { tipId }),
  tipDismissed: (tipId: string) => trackEvent('guidance_tip_dismissed', { tipId }),

  promptShown: (field: string, source: string, confidence: string) =>
    trackEvent('guidance_prompt_shown', { field, source, confidence }),
  promptAccepted: (field: string, source: string) =>
    trackEvent('guidance_prompt_accepted', { field, source }),
  promptDeclined: (field: string, source: string) =>
    trackEvent('guidance_prompt_declined', { field, source }),
  promptSuppressed: (field: string) => trackEvent('guidance_prompt_suppressed', { field }),
  promptExpired: (field: string) => trackEvent('guidance_prompt_expired', { field }),

  strengthChanged: (from: number, to: number, trigger: string) =>
    trackEvent('profile_strength_changed', { from, to, trigger }),
  hubOpened: (source: string) => trackEvent('profile_hub_opened', { source }),
};

// ─── Signal bus ───────────────────────────────────────────────────────────────

type SignalListener = (signal: ProfileSignal) => void;
const listeners = new Set<SignalListener>();

/** Subscribe to profile signals (the GuidanceProvider does this once). */
export function onProfileSignal(listener: SignalListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Emit a profile signal from a capture point. Fire-and-forget — never throws
 * into the calling feature.
 */
export function emitProfileSignal(signal: ProfileSignal): void {
  try {
    for (const l of listeners) l(signal);
  } catch {
    /* guidance must never break a feature flow */
  }
}
