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
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/services/logging';
import { analytics, EVENTS } from '@/services/analytics';
import { supabase } from '@/lib/supabase/client';
import { router } from 'expo-router';

// Database notification record (from `notifications` table)
export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  tripId?: string;
  bookingId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

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
  // Trip & Booking
  bookingConfirmations: boolean;
  tripReminders: boolean;
  packingReminders: boolean;
  departureAdvisor: boolean;
  flightTracking: boolean;
  // Safety
  safetyAlerts: boolean;
  weatherAlerts: boolean;
  // Deals & Financial
  priceDrops: boolean;
  // Community & Social
  communityMessages: boolean;
  communityEvents: boolean;
  // System
  promotional: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  bookingConfirmations: true,
  tripReminders: true,
  packingReminders: true,
  departureAdvisor: true,
  flightTracking: true,
  safetyAlerts: true,
  weatherAlerts: true,
  priceDrops: true,
  communityMessages: true,
  communityEvents: true,
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
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        process.env.EXPO_PUBLIC_PROJECT_ID ??
        undefined;

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.pushToken = token.data;
      await this.savePushToken(token.data);

      logger.info('Push token registered', { token: token.data.substring(0, 20) + '...' });

      // Persist token to Supabase user_devices table
      await this.upsertDeviceToken(token.data);

      return token.data;
    } catch (error) {
      // Downgrade to warning — push tokens may not work in Expo Go or simulators
      logger.warn('Push token registration skipped', error);
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
  async setPreferences(preferences: Partial<NotificationPreferences>, userId?: string): Promise<void> {
    this.preferences = { ...this.preferences, ...preferences };
    await this.savePreferences();
    if (userId) {
      await this.syncPreferencesToDB(userId);
    }
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

  // ==================== Database Notification Methods ====================

  /**
   * Fetch notifications from the `notifications` table
   */
  async getNotifications(
    userId: string,
    options?: { limit?: number; offset?: number; unreadOnly?: boolean }
  ): Promise<AppNotification[]> {
    const limit = options?.limit ?? 30;
    const offset = options?.offset ?? 0;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(this.mapNotification);
  }

  /**
   * Get the count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw new Error(error.message);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new Error(error.message);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw new Error(error.message);
  }

  private mapNotification(data: any): AppNotification {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data,
      tripId: data.trip_id,
      bookingId: data.booking_id,
      isRead: data.is_read ?? false,
      readAt: data.read_at,
      createdAt: data.created_at,
    };
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

        // Handle deep link navigation
        if (data?.deepLink) {
          try {
            router.push(data.deepLink as any);
          } catch (navErr) {
            logger.warn('Deep link navigation failed', { deepLink: data.deepLink, error: navErr });
          }
        } else if (data?.actionUrl) {
          try {
            router.push(data.actionUrl as any);
          } catch (navErr) {
            logger.warn('Action URL navigation failed', { actionUrl: data.actionUrl, error: navErr });
          }
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

  private async upsertDeviceToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('Cannot upsert device token: no authenticated user');
        return;
      }

      await supabase.from('user_devices').upsert({
        user_id: user.id,
        device_token: token,
        platform: Platform.OS as 'ios' | 'android',
        device_name: Device.deviceName || undefined,
        device_model: Device.modelName || undefined,
        os_version: Device.osVersion || undefined,
        is_active: true,
        push_enabled: true,
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,device_token',
      });

      logger.info('Device token persisted to Supabase');
    } catch (error) {
      logger.warn('Failed to upsert device token to Supabase', error);
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
   * Sync preferences to Supabase user_notification_preferences table
   */
  async syncPreferencesToDB(userId: string): Promise<void> {
    try {
      const categoryPrefs = {
        booking_confirmations: this.preferences.bookingConfirmations,
        trip_reminders: this.preferences.tripReminders,
        packing_reminders: this.preferences.packingReminders,
        departure_advisor: this.preferences.departureAdvisor,
        flight_tracking: this.preferences.flightTracking,
        safety_alerts: this.preferences.safetyAlerts,
        weather_alerts: this.preferences.weatherAlerts,
        price_drops: this.preferences.priceDrops,
        community_messages: this.preferences.communityMessages,
        community_events: this.preferences.communityEvents,
        promotional: this.preferences.promotional,
      };

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          notifications_enabled: this.preferences.enabled,
          push_enabled: this.preferences.enabled,
          category_preferences: categoryPrefs,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        logger.warn('Failed to sync notification preferences to DB', error);
      } else {
        logger.info('Notification preferences synced to DB');
      }
    } catch (error) {
      logger.warn('Error syncing notification preferences to DB', error);
    }
  }

  /**
   * Load preferences from Supabase, falling back to AsyncStorage
   */
  async loadPreferencesFromDB(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return;
      }

      const catPrefs = data.category_preferences as Record<string, boolean> | null;
      if (catPrefs) {
        this.preferences = {
          enabled: data.notifications_enabled ?? true,
          bookingConfirmations: catPrefs.booking_confirmations ?? true,
          tripReminders: catPrefs.trip_reminders ?? true,
          packingReminders: catPrefs.packing_reminders ?? true,
          departureAdvisor: catPrefs.departure_advisor ?? true,
          flightTracking: catPrefs.flight_tracking ?? true,
          safetyAlerts: catPrefs.safety_alerts ?? true,
          weatherAlerts: catPrefs.weather_alerts ?? true,
          priceDrops: catPrefs.price_drops ?? true,
          communityMessages: catPrefs.community_messages ?? true,
          communityEvents: catPrefs.community_events ?? true,
          promotional: catPrefs.promotional ?? false,
        };
        await this.savePreferences();
      }
    } catch (error) {
      logger.warn('Failed to load notification preferences from DB', error);
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
