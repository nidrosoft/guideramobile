/**
 * Push Notification Service
 * 
 * Handles push notifications using expo-notifications:
 * - Permission requests
 * - Token management
 * - Local notifications
 * - Notification handling
 * - Deep link integration
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/services/logging';
import { analytics, EVENTS } from '@/services/analytics';

// Notification categories
export const NOTIFICATION_CATEGORIES = {
  BOOKING: 'booking',
  TRIP: 'trip',
  SAFETY: 'safety',
  PRICE_ALERT: 'price_alert',
  PROMOTIONAL: 'promotional',
  SYSTEM: 'system',
} as const;

export type NotificationCategory = typeof NOTIFICATION_CATEGORIES[keyof typeof NOTIFICATION_CATEGORIES];

// Notification data structure
export interface NotificationData {
  type: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, any>;
  deepLink?: string;
}

// User notification preferences
export interface NotificationPreferences {
  enabled: boolean;
  bookingConfirmations: boolean;
  tripReminders: boolean;
  safetyAlerts: boolean;
  priceDrops: boolean;
  promotional: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  bookingConfirmations: true,
  tripReminders: true,
  safetyAlerts: true,
  priceDrops: true,
  promotional: false,
};

const STORAGE_KEYS = {
  PUSH_TOKEN: '@guidera_push_token',
  PREFERENCES: '@guidera_notification_prefs',
};

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;
  private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  private constructor() {
    this.loadPreferences();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  async init(): Promise<void> {
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Set up notification categories for iOS
    if (Platform.OS === 'ios') {
      await this.setupNotificationCategories();
    }

    // Load saved token
    await this.loadPushToken();

    // Set up listeners
    this.setupListeners();

    logger.info('Notification service initialized');
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      logger.warn('Push notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('Notification permission denied');
      return false;
    }

    // Get push token
    await this.registerForPushNotifications();
    
    return true;
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.pushToken = token.data;
      await this.savePushToken(token.data);

      logger.info('Push token registered', { token: token.data.substring(0, 20) + '...' });

      // TODO: Send token to backend
      // await api.registerPushToken(token.data);

      return token.data;
    } catch (error) {
      logger.error('Failed to get push token', error);
      return null;
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    notification: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    // Check if this category is enabled
    if (!this.shouldShowNotification(notification.type)) {
      logger.debug('Notification blocked by preferences', { type: notification.type });
      return '';
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          type: notification.type,
          deepLink: notification.deepLink,
        },
        categoryIdentifier: notification.type,
      },
      trigger: trigger || null, // null = immediate
    });

    logger.debug('Local notification scheduled', { id, type: notification.type });
    return id;
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    logger.debug('Notification cancelled', { notificationId });
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    logger.debug('All notifications cancelled');
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  }

  // ==================== Preferences ====================

  /**
   * Get notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Update notification preferences
   */
  async setPreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...preferences };
    await this.savePreferences();
    logger.info('Notification preferences updated', preferences);
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted' && this.preferences.enabled;
  }

  // ==================== Convenience Methods ====================

  /**
   * Send booking confirmation notification
   */
  async notifyBookingConfirmation(
    bookingType: string,
    bookingRef: string,
    details: string
  ): Promise<void> {
    await this.scheduleLocalNotification({
      type: NOTIFICATION_CATEGORIES.BOOKING,
      title: `${bookingType} Booking Confirmed! ✈️`,
      body: details,
      data: { bookingRef, bookingType },
      deepLink: `/booking/${bookingRef}`,
    });
  }

  /**
   * Send trip reminder notification
   */
  async notifyTripReminder(
    tripName: string,
    tripId: string,
    daysUntil: number
  ): Promise<void> {
    await this.scheduleLocalNotification({
      type: NOTIFICATION_CATEGORIES.TRIP,
      title: `Trip Reminder: ${tripName}`,
      body: `Your trip is in ${daysUntil} day${daysUntil > 1 ? 's' : ''}! Time to get excited! 🎉`,
      data: { tripId },
      deepLink: `/trip/${tripId}`,
    });
  }

  /**
   * Send safety alert notification
   */
  async notifySafetyAlert(
    location: string,
    alertType: string,
    message: string
  ): Promise<void> {
    await this.scheduleLocalNotification({
      type: NOTIFICATION_CATEGORIES.SAFETY,
      title: `⚠️ Safety Alert: ${location}`,
      body: message,
      data: { location, alertType },
    });
  }

  /**
   * Send price drop notification
   */
  async notifyPriceDrop(
    itemType: string,
    itemName: string,
    oldPrice: number,
    newPrice: number,
    currency: string
  ): Promise<void> {
    const savings = oldPrice - newPrice;
    await this.scheduleLocalNotification({
      type: NOTIFICATION_CATEGORIES.PRICE_ALERT,
      title: `💰 Price Drop Alert!`,
      body: `${itemName} is now ${currency}${newPrice} (Save ${currency}${savings})`,
      data: { itemType, itemName, oldPrice, newPrice },
    });
  }

  // ==================== Private Methods ====================

  private setupListeners(): void {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        logger.debug('Notification received', { 
          title: notification.request.content.title 
        });
        
        analytics.track(EVENTS.NOTIFICATION_RECEIVED, {
          type: notification.request.content.data?.type,
          title: notification.request.content.title,
        });
      }
    );

    // Handle notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        
        logger.info('Notification tapped', { data });
        
        analytics.track(EVENTS.NOTIFICATION_CLICKED, {
          type: data?.type,
          deepLink: data?.deepLink,
        });

        // Handle deep link
        if (data?.deepLink) {
          // TODO: Navigate to deep link
          // router.push(data.deepLink);
        }
      }
    );
  }

  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.BOOKING, [
      { identifier: 'view', buttonTitle: 'View Booking' },
    ]);

    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.TRIP, [
      { identifier: 'view', buttonTitle: 'View Trip' },
      { identifier: 'share', buttonTitle: 'Share' },
    ]);

    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.SAFETY, [
      { identifier: 'details', buttonTitle: 'More Details' },
    ]);
  }

  private shouldShowNotification(type: NotificationCategory): boolean {
    if (!this.preferences.enabled) return false;

    switch (type) {
      case NOTIFICATION_CATEGORIES.BOOKING:
        return this.preferences.bookingConfirmations;
      case NOTIFICATION_CATEGORIES.TRIP:
        return this.preferences.tripReminders;
      case NOTIFICATION_CATEGORIES.SAFETY:
        return this.preferences.safetyAlerts;
      case NOTIFICATION_CATEGORIES.PRICE_ALERT:
        return this.preferences.priceDrops;
      case NOTIFICATION_CATEGORIES.PROMOTIONAL:
        return this.preferences.promotional;
      default:
        return true;
    }
  }

  private async loadPushToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
      if (token) {
        this.pushToken = token;
      }
    } catch (error) {
      logger.error('Failed to load push token', error);
    }
  }

  private async savePushToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
    } catch (error) {
      logger.error('Failed to save push token', error);
    }
  }

  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (stored) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      logger.error('Failed to load notification preferences', error);
    }
  }

  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      logger.error('Failed to save notification preferences', error);
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export convenience functions
export const initNotifications = () => notificationService.init();
export const requestNotificationPermissions = () => notificationService.requestPermissions();
export const scheduleNotification = (data: NotificationData, trigger?: Notifications.NotificationTriggerInput) => 
  notificationService.scheduleLocalNotification(data, trigger);
export const getNotificationPreferences = () => notificationService.getPreferences();
export const setNotificationPreferences = (prefs: Partial<NotificationPreferences>) => 
  notificationService.setPreferences(prefs);

export default notificationService;
