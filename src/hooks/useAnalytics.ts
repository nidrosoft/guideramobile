/**
 * useAnalytics Hook
 * 
 * Provides analytics tracking functions for components.
 * Automatically tracks screen views when used in screen components.
 */

import { useEffect, useCallback, useRef } from 'react';
import { 
  analytics, 
  trackScreen, 
  trackEvent, 
  trackButtonClick,
  trackBookingEvent,
  EVENTS 
} from '@/services/analytics';

interface UseAnalyticsOptions {
  screenName?: string;
  trackScreenView?: boolean;
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { screenName, trackScreenView = true } = options;
  const hasTrackedScreen = useRef(false);

  // Track screen view on mount
  useEffect(() => {
    if (screenName && trackScreenView && !hasTrackedScreen.current) {
      trackScreen(screenName);
      hasTrackedScreen.current = true;
    }
  }, [screenName, trackScreenView]);

  // Track custom event
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    trackEvent(eventName, { screen: screenName, ...properties });
  }, [screenName]);

  // Track button click
  const trackButton = useCallback((buttonName: string, properties?: Record<string, any>) => {
    trackButtonClick(buttonName, { screen: screenName, ...properties });
  }, [screenName]);

  // Track booking event
  const trackBooking = useCallback((
    eventName: string,
    bookingType: 'flight' | 'hotel' | 'car' | 'experience' | 'package',
    properties?: Record<string, any>
  ) => {
    trackBookingEvent(eventName, bookingType, { screen: screenName, ...properties });
  }, [screenName]);

  // Track search
  const trackSearch = useCallback((searchType: string, query: string, filters?: Record<string, any>) => {
    track(EVENTS.SEARCH_PERFORMED, {
      search_type: searchType,
      query,
      filters,
    });
  }, [track]);

  // Track funnel step
  const trackFunnel = useCallback((
    funnelName: string,
    stepName: string,
    stepNumber: number,
    properties?: Record<string, any>
  ) => {
    analytics.trackFunnelStep(funnelName, stepName, stepNumber, {
      screen: screenName,
      ...properties,
    });
  }, [screenName]);

  // Time an event
  const startTiming = useCallback((eventName: string) => {
    analytics.timeEvent(eventName);
  }, []);

  const endTiming = useCallback((eventName: string, properties?: Record<string, any>) => {
    analytics.trackTimedEvent(eventName, { screen: screenName, ...properties });
  }, [screenName]);

  return {
    track,
    trackButton,
    trackBooking,
    trackSearch,
    trackFunnel,
    startTiming,
    endTiming,
    EVENTS,
  };
}

export default useAnalytics;
