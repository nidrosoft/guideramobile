/**
 * Deep Linking Service
 * 
 * Handles deep links and universal links:
 * - URL parsing and routing
 * - Deferred deep linking for new installs
 * - Link generation for sharing
 */

import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/services/logging';
import { analytics, EVENTS } from '@/services/analytics';

// Deep link routes
export const DEEP_LINK_ROUTES = {
  // Booking
  BOOKING_DETAILS: 'booking/:bookingId',
  FLIGHT_SEARCH: 'flights/search',
  HOTEL_SEARCH: 'hotels/search',
  
  // Trips
  TRIP_DETAILS: 'trip/:tripId',
  TRIP_ITINERARY: 'trip/:tripId/itinerary',
  SHARED_TRIP: 'shared/:shareCode',
  
  // Destinations
  DESTINATION: 'destination/:destinationId',
  
  // User
  PROFILE: 'profile',
  SETTINGS: 'settings',
  
  // Promotional
  PROMO: 'promo/:promoCode',
  REFERRAL: 'referral/:referralCode',
} as const;

// URL scheme configuration
const URL_SCHEMES = {
  APP_SCHEME: 'guidera://',
  WEB_DOMAIN: 'https://guidera.app',
  UNIVERSAL_LINK_DOMAIN: 'https://links.guidera.app',
};

interface DeepLinkParams {
  route: string;
  params: Record<string, string>;
  queryParams: Record<string, string>;
}

interface DeferredDeepLink {
  url: string;
  timestamp: number;
}

const STORAGE_KEY = '@guidera_deferred_deeplink';

class DeepLinkService {
  private static instance: DeepLinkService;
  private isInitialized: boolean = false;
  private pendingDeepLink: DeepLinkParams | null = null;
  private linkingSubscription: { remove: () => void } | null = null;
  private onNavigate: ((route: string, params: Record<string, any>) => void) | null = null;

  private constructor() {}

  static getInstance(): DeepLinkService {
    if (!DeepLinkService.instance) {
      DeepLinkService.instance = new DeepLinkService();
    }
    return DeepLinkService.instance;
  }

  /**
   * Initialize deep link service
   */
  async init(
    onNavigate: (route: string, params: Record<string, any>) => void
  ): Promise<void> {
    if (this.isInitialized) return;

    this.onNavigate = onNavigate;

    // Handle initial URL (app opened via deep link)
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      logger.info('App opened with deep link', { url: initialUrl });
      await this.handleDeepLink(initialUrl);
    }

    // Check for deferred deep link
    await this.checkDeferredDeepLink();

    // Listen for incoming deep links
    this.linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      logger.info('Deep link received', { url });
      this.handleDeepLink(url);
    });

    this.isInitialized = true;
    logger.info('Deep link service initialized');
  }

  /**
   * Handle incoming deep link
   */
  async handleDeepLink(url: string): Promise<void> {
    try {
      const parsed = this.parseDeepLink(url);
      
      if (!parsed) {
        logger.warn('Invalid deep link', { url });
        return;
      }

      // Track analytics
      analytics.track(EVENTS.DEEP_LINK_OPENED, {
        route: parsed.route,
        params: parsed.params,
        source: this.getDeepLinkSource(url),
      });

      // Navigate if handler is set
      if (this.onNavigate) {
        this.onNavigate(parsed.route, {
          ...parsed.params,
          ...parsed.queryParams,
        });
      } else {
        // Store for later if navigation not ready
        this.pendingDeepLink = parsed;
      }
    } catch (error) {
      logger.error('Failed to handle deep link', error);
    }
  }

  /**
   * Parse deep link URL into route and params
   */
  parseDeepLink(url: string): DeepLinkParams | null {
    try {
      const parsed = Linking.parse(url);
      
      if (!parsed.path) {
        return null;
      }

      // Extract route and params
      const pathParts = parsed.path.split('/').filter(Boolean);
      const params: Record<string, string> = {};
      let route = '';

      // Match against known routes
      for (const [routeName, routePattern] of Object.entries(DEEP_LINK_ROUTES)) {
        const patternParts = routePattern.split('/').filter(Boolean);
        
        if (this.matchRoute(pathParts, patternParts, params)) {
          route = routeName;
          break;
        }
      }

      if (!route) {
        // Use path as route if no match
        route = parsed.path;
      }

      return {
        route,
        params,
        queryParams: (parsed.queryParams as Record<string, string>) || {},
      };
    } catch (error) {
      logger.error('Failed to parse deep link', error);
      return null;
    }
  }

  /**
   * Generate a deep link URL
   */
  generateDeepLink(
    route: string,
    params?: Record<string, string>,
    queryParams?: Record<string, string>
  ): string {
    let path = route;

    // Replace route params
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        path = path.replace(`:${key}`, value);
      }
    }

    // Build URL
    let url = `${URL_SCHEMES.APP_SCHEME}${path}`;

    // Add query params
    if (queryParams && Object.keys(queryParams).length > 0) {
      const queryString = Object.entries(queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Generate a universal link (for sharing)
   */
  generateUniversalLink(
    route: string,
    params?: Record<string, string>,
    queryParams?: Record<string, string>
  ): string {
    let path = route;

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        path = path.replace(`:${key}`, value);
      }
    }

    let url = `${URL_SCHEMES.UNIVERSAL_LINK_DOMAIN}/${path}`;

    if (queryParams && Object.keys(queryParams).length > 0) {
      const queryString = Object.entries(queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Generate a shareable trip link
   */
  generateTripShareLink(tripId: string, shareCode: string): string {
    return this.generateUniversalLink(
      DEEP_LINK_ROUTES.SHARED_TRIP.replace(':shareCode', shareCode),
      {},
      { tripId }
    );
  }

  /**
   * Generate a booking link
   */
  generateBookingLink(bookingId: string): string {
    return this.generateUniversalLink(
      DEEP_LINK_ROUTES.BOOKING_DETAILS.replace(':bookingId', bookingId)
    );
  }

  /**
   * Generate a referral link
   */
  generateReferralLink(referralCode: string): string {
    return this.generateUniversalLink(
      DEEP_LINK_ROUTES.REFERRAL.replace(':referralCode', referralCode)
    );
  }

  /**
   * Store deferred deep link (for new installs)
   */
  async storeDeferredDeepLink(url: string): Promise<void> {
    try {
      const data: DeferredDeepLink = {
        url,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      logger.debug('Deferred deep link stored', { url });
    } catch (error) {
      logger.error('Failed to store deferred deep link', error);
    }
  }

  /**
   * Check and handle deferred deep link
   */
  async checkDeferredDeepLink(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const data: DeferredDeepLink = JSON.parse(stored);
      
      // Check if link is still valid (within 24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp > maxAge) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        return;
      }

      logger.info('Processing deferred deep link', { url: data.url });
      await this.handleDeepLink(data.url);
      
      // Clear after processing
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      logger.error('Failed to check deferred deep link', error);
    }
  }

  /**
   * Get pending deep link (if navigation wasn't ready)
   */
  getPendingDeepLink(): DeepLinkParams | null {
    const pending = this.pendingDeepLink;
    this.pendingDeepLink = null;
    return pending;
  }

  /**
   * Check if URL can be opened
   */
  async canOpenURL(url: string): Promise<boolean> {
    return Linking.canOpenURL(url);
  }

  /**
   * Open external URL
   */
  async openURL(url: string): Promise<void> {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      logger.warn('Cannot open URL', { url });
    }
  }

  /**
   * Open app settings
   */
  async openSettings(): Promise<void> {
    await Linking.openSettings();
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.linkingSubscription) {
      this.linkingSubscription.remove();
    }
  }

  // ==================== Private Methods ====================

  private matchRoute(
    pathParts: string[],
    patternParts: string[],
    params: Record<string, string>
  ): boolean {
    if (pathParts.length !== patternParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      const pattern = patternParts[i];
      const path = pathParts[i];

      if (pattern.startsWith(':')) {
        // Dynamic param
        const paramName = pattern.slice(1);
        params[paramName] = path;
      } else if (pattern !== path) {
        // Static part doesn't match
        return false;
      }
    }

    return true;
  }

  private getDeepLinkSource(url: string): string {
    if (url.startsWith(URL_SCHEMES.APP_SCHEME)) {
      return 'app_scheme';
    } else if (url.startsWith(URL_SCHEMES.UNIVERSAL_LINK_DOMAIN)) {
      return 'universal_link';
    } else if (url.startsWith(URL_SCHEMES.WEB_DOMAIN)) {
      return 'web_link';
    }
    return 'unknown';
  }
}

// Export singleton instance
export const deeplinkService = DeepLinkService.getInstance();

// Export convenience functions
export const initDeepLinks = (onNavigate: (route: string, params: Record<string, any>) => void) => 
  deeplinkService.init(onNavigate);
export const handleDeepLink = (url: string) => deeplinkService.handleDeepLink(url);
export const generateDeepLink = (route: string, params?: Record<string, string>) => 
  deeplinkService.generateDeepLink(route, params);
export const generateShareLink = (route: string, params?: Record<string, string>) => 
  deeplinkService.generateUniversalLink(route, params);
export const openExternalURL = (url: string) => deeplinkService.openURL(url);

export default deeplinkService;
