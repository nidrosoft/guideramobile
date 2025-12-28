/**
 * Analytics Service
 * 
 * Centralized analytics tracking for user behavior and app events.
 * Supports multiple analytics providers (Mixpanel, Amplitude, Firebase).
 * 
 * Setup Instructions:
 * 1. Choose your analytics provider
 * 2. Add the appropriate SDK
 * 3. Set EXPO_PUBLIC_ANALYTICS_KEY in .env
 */

import { logger } from '@/services/logging';

// Event categories for organization
export const EVENT_CATEGORIES = {
  NAVIGATION: 'navigation',
  BOOKING: 'booking',
  TRIP: 'trip',
  USER: 'user',
  ENGAGEMENT: 'engagement',
  ERROR: 'error',
  PERFORMANCE: 'performance',
} as const;

// Standard event names
export const EVENTS = {
  // Navigation
  SCREEN_VIEW: 'screen_view',
  TAB_CHANGE: 'tab_change',
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',
  
  // User
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PROFILE_UPDATE: 'profile_update',
  
  // Booking Flow
  BOOKING_STARTED: 'booking_started',
  BOOKING_STEP_COMPLETED: 'booking_step_completed',
  BOOKING_SEARCH: 'booking_search',
  BOOKING_FILTER_APPLIED: 'booking_filter_applied',
  BOOKING_ITEM_SELECTED: 'booking_item_selected',
  BOOKING_EXTRAS_ADDED: 'booking_extras_added',
  BOOKING_PAYMENT_STARTED: 'booking_payment_started',
  BOOKING_COMPLETED: 'booking_completed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_ABANDONED: 'booking_abandoned',
  
  // Trip Planning
  TRIP_CREATED: 'trip_created',
  TRIP_UPDATED: 'trip_updated',
  TRIP_DELETED: 'trip_deleted',
  TRIP_SHARED: 'trip_shared',
  ITINERARY_GENERATED: 'itinerary_generated',
  ACTIVITY_ADDED: 'activity_added',
  ACTIVITY_REMOVED: 'activity_removed',
  
  // Engagement
  FEATURE_USED: 'feature_used',
  BUTTON_CLICKED: 'button_clicked',
  SEARCH_PERFORMED: 'search_performed',
  SHARE_CLICKED: 'share_clicked',
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_CLICKED: 'notification_clicked',
  DEEP_LINK_OPENED: 'deep_link_opened',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  
  // Performance
  SLOW_SCREEN_LOAD: 'slow_screen_load',
  SLOW_API_CALL: 'slow_api_call',
} as const;

// User properties
export const USER_PROPERTIES = {
  USER_ID: 'user_id',
  EMAIL: 'email',
  NAME: 'name',
  CREATED_AT: 'created_at',
  SUBSCRIPTION_TIER: 'subscription_tier',
  TOTAL_BOOKINGS: 'total_bookings',
  TOTAL_TRIPS: 'total_trips',
  PREFERRED_CURRENCY: 'preferred_currency',
  PREFERRED_LANGUAGE: 'preferred_language',
  NOTIFICATION_ENABLED: 'notification_enabled',
  APP_VERSION: 'app_version',
  DEVICE_TYPE: 'device_type',
  OS_VERSION: 'os_version',
} as const;

interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

interface UserProperties {
  [key: string]: string | number | boolean | null;
}

type AnalyticsProvider = 'mixpanel' | 'amplitude' | 'firebase' | 'mock';

class AnalyticsService {
  private static instance: AnalyticsService;
  private isInitialized: boolean = false;
  private isEnabled: boolean = true;
  private provider: AnalyticsProvider = 'mock';
  private userId: string | null = null;
  private userProperties: UserProperties = {};
  private eventQueue: AnalyticsEvent[] = [];
  private superProperties: Record<string, any> = {};

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize analytics with provider
   */
  async init(provider: AnalyticsProvider = 'mock'): Promise<void> {
    if (this.isInitialized) return;

    this.provider = provider;

    try {
      switch (provider) {
        case 'mixpanel':
          // TODO: Initialize Mixpanel
          // await Mixpanel.init(process.env.EXPO_PUBLIC_MIXPANEL_TOKEN);
          break;
        case 'amplitude':
          // TODO: Initialize Amplitude
          // await Amplitude.init(process.env.EXPO_PUBLIC_AMPLITUDE_KEY);
          break;
        case 'firebase':
          // TODO: Initialize Firebase Analytics
          // await analytics().setAnalyticsCollectionEnabled(true);
          break;
        case 'mock':
          // Mock provider for development
          break;
      }

      this.isInitialized = true;
      logger.info(`Analytics initialized with provider: ${provider}`);

      // Process any queued events
      await this.processQueue();
    } catch (error) {
      logger.error('Failed to initialize analytics', error);
    }
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logger.info(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Identify user
   */
  identify(userId: string, properties?: UserProperties): void {
    this.userId = userId;
    
    if (properties) {
      this.userProperties = { ...this.userProperties, ...properties };
    }

    if (!this.isEnabled) return;

    switch (this.provider) {
      case 'mixpanel':
        // Mixpanel.identify(userId);
        // Mixpanel.getPeople().set(properties);
        break;
      case 'amplitude':
        // Amplitude.setUserId(userId);
        // Amplitude.setUserProperties(properties);
        break;
      case 'firebase':
        // analytics().setUserId(userId);
        // analytics().setUserProperties(properties);
        break;
      case 'mock':
        logger.debug('Analytics identify', { userId, properties });
        break;
    }
  }

  /**
   * Reset user (on logout)
   */
  reset(): void {
    this.userId = null;
    this.userProperties = {};

    switch (this.provider) {
      case 'mixpanel':
        // Mixpanel.reset();
        break;
      case 'amplitude':
        // Amplitude.clearUserProperties();
        // Amplitude.setUserId(null);
        break;
      case 'firebase':
        // analytics().setUserId(null);
        break;
      case 'mock':
        logger.debug('Analytics reset');
        break;
    }
  }

  /**
   * Set super properties (included in all events)
   */
  setSuperProperties(properties: Record<string, any>): void {
    this.superProperties = { ...this.superProperties, ...properties };
  }

  /**
   * Track an event
   */
  track(
    eventName: string,
    properties?: Record<string, any>,
    category: string = EVENT_CATEGORIES.ENGAGEMENT
  ): void {
    const event: AnalyticsEvent = {
      name: eventName,
      category,
      properties: {
        ...this.superProperties,
        ...properties,
        user_id: this.userId,
      },
      timestamp: new Date(),
    };

    if (!this.isEnabled) {
      logger.debug('Analytics disabled, event not tracked', { eventName });
      return;
    }

    if (!this.isInitialized) {
      // Queue event for later
      this.eventQueue.push(event);
      return;
    }

    this.sendEvent(event);
  }

  /**
   * Track screen view
   */
  trackScreen(screenName: string, properties?: Record<string, any>): void {
    this.track(
      EVENTS.SCREEN_VIEW,
      { screen_name: screenName, ...properties },
      EVENT_CATEGORIES.NAVIGATION
    );
  }

  /**
   * Track button click
   */
  trackButtonClick(buttonName: string, properties?: Record<string, any>): void {
    this.track(
      EVENTS.BUTTON_CLICKED,
      { button_name: buttonName, ...properties },
      EVENT_CATEGORIES.ENGAGEMENT
    );
  }

  /**
   * Track booking event
   */
  trackBooking(
    eventName: string,
    bookingType: 'flight' | 'hotel' | 'car' | 'experience' | 'package',
    properties?: Record<string, any>
  ): void {
    this.track(
      eventName,
      { booking_type: bookingType, ...properties },
      EVENT_CATEGORIES.BOOKING
    );
  }

  /**
   * Track error
   */
  trackError(
    errorName: string,
    errorMessage: string,
    properties?: Record<string, any>
  ): void {
    this.track(
      EVENTS.ERROR_OCCURRED,
      { error_name: errorName, error_message: errorMessage, ...properties },
      EVENT_CATEGORIES.ERROR
    );
  }

  /**
   * Track funnel step
   */
  trackFunnelStep(
    funnelName: string,
    stepName: string,
    stepNumber: number,
    properties?: Record<string, any>
  ): void {
    this.track(
      `${funnelName}_step_${stepNumber}`,
      { funnel_name: funnelName, step_name: stepName, step_number: stepNumber, ...properties },
      EVENT_CATEGORIES.ENGAGEMENT
    );
  }

  /**
   * Set user property
   */
  setUserProperty(key: string, value: string | number | boolean): void {
    this.userProperties[key] = value;

    if (!this.isEnabled) return;

    switch (this.provider) {
      case 'mixpanel':
        // Mixpanel.getPeople().set(key, value);
        break;
      case 'amplitude':
        // Amplitude.setUserProperties({ [key]: value });
        break;
      case 'firebase':
        // analytics().setUserProperty(key, String(value));
        break;
      case 'mock':
        logger.debug('Analytics setUserProperty', { key, value });
        break;
    }
  }

  /**
   * Increment user property
   */
  incrementUserProperty(key: string, amount: number = 1): void {
    const currentValue = (this.userProperties[key] as number) || 0;
    this.userProperties[key] = currentValue + amount;

    switch (this.provider) {
      case 'mixpanel':
        // Mixpanel.getPeople().increment(key, amount);
        break;
      case 'amplitude':
        // Amplitude.identify(new Identify().add(key, amount));
        break;
      default:
        logger.debug('Analytics incrementUserProperty', { key, amount });
        break;
    }
  }

  /**
   * Time an event (start)
   */
  timeEvent(eventName: string): void {
    switch (this.provider) {
      case 'mixpanel':
        // Mixpanel.timeEvent(eventName);
        break;
      default:
        // Store start time for manual calculation
        this.superProperties[`_time_${eventName}`] = Date.now();
        break;
    }
  }

  /**
   * Get event duration and track
   */
  trackTimedEvent(eventName: string, properties?: Record<string, any>): void {
    const startTime = this.superProperties[`_time_${eventName}`];
    let duration: number | undefined;

    if (startTime) {
      duration = Date.now() - startTime;
      delete this.superProperties[`_time_${eventName}`];
    }

    this.track(eventName, { ...properties, duration_ms: duration });
  }

  // ==================== Private Methods ====================

  private sendEvent(event: AnalyticsEvent): void {
    switch (this.provider) {
      case 'mixpanel':
        // Mixpanel.track(event.name, event.properties);
        break;
      case 'amplitude':
        // Amplitude.logEvent(event.name, event.properties);
        break;
      case 'firebase':
        // analytics().logEvent(event.name, event.properties);
        break;
      case 'mock':
        if (__DEV__) {
          logger.debug(`📊 Analytics: ${event.name}`, event.properties);
        }
        break;
    }
  }

  private async processQueue(): Promise<void> {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.sendEvent(event);
      }
    }
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();

// Export convenience functions
export const initAnalytics = (provider?: AnalyticsProvider) => analytics.init(provider);
export const identifyUser = (userId: string, properties?: UserProperties) => 
  analytics.identify(userId, properties);
export const trackEvent = (name: string, properties?: Record<string, any>) => 
  analytics.track(name, properties);
export const trackScreen = (name: string, properties?: Record<string, any>) => 
  analytics.trackScreen(name, properties);
export const trackButtonClick = (name: string, properties?: Record<string, any>) => 
  analytics.trackButtonClick(name, properties);
export const trackBookingEvent = (
  event: string, 
  type: 'flight' | 'hotel' | 'car' | 'experience' | 'package',
  properties?: Record<string, any>
) => analytics.trackBooking(event, type, properties);
export const trackError = (name: string, message: string, properties?: Record<string, any>) => 
  analytics.trackError(name, message, properties);

export default analytics;
