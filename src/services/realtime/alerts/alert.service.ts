/**
 * ALERT SERVICE
 * 
 * Core service for creating, managing, and delivering alerts.
 */

import { supabase } from '@/lib/supabase/client';
import {
  Alert,
  AlertCategory,
  AlertChannel,
  AlertStatus,
  CreateAlertParams,
  CreateAlertForUsersParams,
  GetAlertsOptions,
  PaginatedAlerts,
  UnreadCounts,
  UserNotificationPreferences,
  ALERT_TYPES_REGISTRY,
  AlertTypeDefinition,
} from '../types';

// ============================================
// TEMPLATE ENGINE
// ============================================

function renderTemplate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = context[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

// ============================================
// ALERT SERVICE
// ============================================

class AlertService {
  /**
   * Get alert type definition by code
   */
  getAlertType(typeCode: string): AlertTypeDefinition | undefined {
    return ALERT_TYPES_REGISTRY.find(t => t.code === typeCode);
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Return default preferences if none exist
      return {
        id: '',
        userId,
        notificationsEnabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        quietHoursTimezone: 'UTC',
        categoryPreferences: {} as Record<AlertCategory, { enabled: boolean }>,
        typePreferences: {},
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      id: data.id,
      userId: data.user_id,
      notificationsEnabled: data.notifications_enabled,
      quietHoursEnabled: data.quiet_hours_enabled,
      quietHoursStart: data.quiet_hours_start,
      quietHoursEnd: data.quiet_hours_end,
      quietHoursTimezone: data.quiet_hours_timezone,
      categoryPreferences: data.category_preferences || {},
      typePreferences: data.type_preferences || {},
      pushEnabled: data.push_enabled,
      emailEnabled: data.email_enabled,
      smsEnabled: data.sms_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Check if alert is enabled for user
   */
  private isAlertEnabled(
    alertType: AlertTypeDefinition,
    preferences: UserNotificationPreferences
  ): boolean {
    if (!preferences.notificationsEnabled) {
      return false;
    }

    const typePrefs = preferences.typePreferences?.[alertType.code];
    if (typePrefs?.enabled === false) {
      return false;
    }

    const categoryPrefs = preferences.categoryPreferences?.[alertType.category];
    if (categoryPrefs?.enabled === false) {
      return false;
    }

    return true;
  }

  /**
   * Determine which channels to use for delivery
   */
  private determineChannels(
    alertType: AlertTypeDefinition,
    preferences: UserNotificationPreferences,
    override?: AlertChannel[]
  ): AlertChannel[] {
    if (override) {
      return override.filter(c => alertType.allowedChannels.includes(c));
    }

    const typePrefs = preferences.typePreferences?.[alertType.code];
    if (typePrefs?.channels) {
      return typePrefs.channels.filter(c => alertType.allowedChannels.includes(c));
    }

    const categoryPrefs = preferences.categoryPreferences?.[alertType.category];
    if (categoryPrefs?.channels) {
      return categoryPrefs.channels.filter(c => alertType.allowedChannels.includes(c));
    }

    return [alertType.defaultChannel];
  }

  /**
   * Calculate expiry time for alert
   */
  private calculateExpiry(alertType: AlertTypeDefinition): string {
    const now = new Date();
    // Default expiry: 7 days for most alerts, 24 hours for time-sensitive
    const expiryHours = alertType.priority >= 8 ? 24 : 168;
    return new Date(now.getTime() + expiryHours * 60 * 60 * 1000).toISOString();
  }

  /**
   * Create and dispatch a new alert
   */
  async createAlert(params: CreateAlertParams): Promise<Alert | null> {
    const {
      typeCode,
      userId,
      context,
      tripId,
      priority: priorityOverride,
      scheduledFor,
      channels: channelOverride,
    } = params;

    // Get alert type configuration
    const alertType = this.getAlertType(typeCode);
    if (!alertType) {
      console.error(`Alert type ${typeCode} not found`);
      return null;
    }

    // Check user preferences
    const preferences = await this.getUserPreferences(userId);
    if (!preferences || !this.isAlertEnabled(alertType, preferences)) {
      console.log(`Alert ${typeCode} disabled for user ${userId}`);
      return null;
    }

    // Render templates
    const title = renderTemplate(alertType.titleTemplate, context);
    const body = renderTemplate(alertType.bodyTemplate, context);
    const actionUrl = alertType.actionTemplate
      ? renderTemplate(alertType.actionTemplate, context)
      : null;

    // Determine priority and channels
    const priority = priorityOverride ?? alertType.priority;
    const channels = this.determineChannels(alertType, preferences, channelOverride);

    // Create alert record
    const { data: alert, error } = await supabase
      .from('alerts')
      .insert({
        alert_type_code: typeCode,
        category_code: alertType.category,
        user_id: userId,
        trip_id: tripId,
        title,
        body,
        icon: alertType.icon,
        context,
        priority,
        channels_requested: channels,
        action_url: actionUrl,
        scheduled_for: scheduledFor,
        status: scheduledFor ? 'pending' : 'queued',
        expires_at: this.calculateExpiry(alertType),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create alert:', error);
      return null;
    }

    // If not scheduled, trigger delivery via edge function
    if (!scheduledFor) {
      await this.triggerDelivery(alert.id);
    }

    return this.transformAlert(alert);
  }

  /**
   * Create alerts for multiple users
   */
  async createAlertForUsers(params: CreateAlertForUsersParams): Promise<Alert[]> {
    const { userIds, ...rest } = params;
    const alerts: Alert[] = [];

    for (const userId of userIds) {
      try {
        const alert = await this.createAlert({ ...rest, userId });
        if (alert) alerts.push(alert);
      } catch (error) {
        console.error(`Failed to create alert for user ${userId}:`, error);
      }
    }

    return alerts;
  }

  /**
   * Trigger delivery of an alert via edge function
   */
  private async triggerDelivery(alertId: string): Promise<void> {
    try {
      await supabase.functions.invoke('alert-delivery', {
        body: { alertId },
      });
    } catch (error) {
      console.error('Failed to trigger alert delivery:', error);
    }
  }

  /**
   * Get alerts for user
   */
  async getAlertsForUser(
    userId: string,
    options: GetAlertsOptions = {}
  ): Promise<PaginatedAlerts> {
    const {
      status = ['delivered', 'read'],
      category,
      limit = 50,
      offset = 0,
      unreadOnly = false,
    } = options;

    let query = supabase
      .from('alerts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .in('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category_code', category);
    }

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to get alerts:', error);
      return { alerts: [], total: 0, unreadCount: { total: 0, byCategory: {} as Record<AlertCategory, number> } };
    }

    const alerts = (data || []).map(this.transformAlert);
    const unreadCount = await this.getUnreadCount(userId);

    return {
      alerts,
      total: count || 0,
      unreadCount,
    };
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<UnreadCounts> {
    const { data, error } = await supabase
      .from('alerts')
      .select('category_code')
      .eq('user_id', userId)
      .eq('status', 'delivered')
      .is('read_at', null);

    if (error || !data) {
      return { total: 0, byCategory: {} as Record<AlertCategory, number> };
    }

    const byCategory: Record<string, number> = {};
    for (const alert of data) {
      byCategory[alert.category_code] = (byCategory[alert.category_code] || 0) + 1;
    }

    return {
      total: data.length,
      byCategory: byCategory as Record<AlertCategory, number>,
    };
  }

  /**
   * Mark alerts as read
   */
  async markAsRead(alertIds: string[], userId: string): Promise<void> {
    await supabase
      .from('alerts')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .in('id', alertIds)
      .eq('user_id', userId);
  }

  /**
   * Mark all alerts as read
   */
  async markAllAsRead(userId: string, category?: AlertCategory): Promise<void> {
    let query = supabase
      .from('alerts')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'delivered');

    if (category) {
      query = query.eq('category_code', category);
    }

    await query;
  }

  /**
   * Mark alert as actioned
   */
  async markAsActioned(alertId: string, userId: string): Promise<void> {
    await supabase
      .from('alerts')
      .update({
        status: 'actioned',
        actioned_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .eq('user_id', userId);
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string, userId: string): Promise<void> {
    await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', userId);
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<UserNotificationPreferences>
  ): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.notificationsEnabled !== undefined) {
      dbUpdates.notifications_enabled = updates.notificationsEnabled;
    }
    if (updates.quietHoursEnabled !== undefined) {
      dbUpdates.quiet_hours_enabled = updates.quietHoursEnabled;
    }
    if (updates.quietHoursStart !== undefined) {
      dbUpdates.quiet_hours_start = updates.quietHoursStart;
    }
    if (updates.quietHoursEnd !== undefined) {
      dbUpdates.quiet_hours_end = updates.quietHoursEnd;
    }
    if (updates.quietHoursTimezone !== undefined) {
      dbUpdates.quiet_hours_timezone = updates.quietHoursTimezone;
    }
    if (updates.categoryPreferences !== undefined) {
      dbUpdates.category_preferences = updates.categoryPreferences;
    }
    if (updates.typePreferences !== undefined) {
      dbUpdates.type_preferences = updates.typePreferences;
    }
    if (updates.pushEnabled !== undefined) {
      dbUpdates.push_enabled = updates.pushEnabled;
    }
    if (updates.emailEnabled !== undefined) {
      dbUpdates.email_enabled = updates.emailEnabled;
    }
    if (updates.smsEnabled !== undefined) {
      dbUpdates.sms_enabled = updates.smsEnabled;
    }

    dbUpdates.updated_at = new Date().toISOString();

    await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: userId,
        ...dbUpdates,
      });
  }

  /**
   * Register device for push notifications
   */
  async registerDevice(
    userId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
    deviceInfo?: {
      deviceName?: string;
      deviceModel?: string;
      osVersion?: string;
      appVersion?: string;
    }
  ): Promise<void> {
    await supabase
      .from('user_devices')
      .upsert({
        user_id: userId,
        device_token: deviceToken,
        platform,
        device_name: deviceInfo?.deviceName,
        device_model: deviceInfo?.deviceModel,
        os_version: deviceInfo?.osVersion,
        app_version: deviceInfo?.appVersion,
        is_active: true,
        last_used_at: new Date().toISOString(),
        push_enabled: true,
      }, {
        onConflict: 'user_id,device_token',
      });
  }

  /**
   * Unregister device
   */
  async unregisterDevice(userId: string, deviceToken: string): Promise<void> {
    await supabase
      .from('user_devices')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('device_token', deviceToken);
  }

  /**
   * Transform database row to Alert type
   */
  private transformAlert(row: any): Alert {
    return {
      id: row.id,
      alertTypeId: row.alert_type_id,
      alertTypeCode: row.alert_type_code,
      categoryCode: row.category_code,
      userId: row.user_id,
      tripId: row.trip_id,
      title: row.title,
      body: row.body,
      icon: row.icon,
      imageUrl: row.image_url,
      context: row.context || {},
      actionUrl: row.action_url,
      priority: row.priority,
      channelsRequested: row.channels_requested || [],
      channelsDelivered: row.channels_delivered || [],
      batchId: row.batch_id,
      isBatched: row.is_batched || false,
      status: row.status,
      scheduledFor: row.scheduled_for,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
      actionedAt: row.actioned_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }
}

export const alertService = new AlertService();
