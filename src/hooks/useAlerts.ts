/**
 * ALERTS HOOKS
 * 
 * React hooks for interacting with the Real-time Intelligence Alert System.
 */

import { useState, useEffect, useCallback } from 'react';
import { alertService } from '@/services/realtime';
import type {
  Alert,
  AlertCategory,
  UnreadCounts,
  UserNotificationPreferences,
  GetAlertsOptions,
} from '@/services/realtime';

// ============================================
// ALERTS LIST HOOK
// ============================================

interface UseAlertsOptions extends GetAlertsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseAlertsResult {
  alerts: Alert[];
  total: number;
  unreadCount: UnreadCounts;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (alertIds: string[]) => Promise<void>;
  markAllAsRead: (category?: AlertCategory) => Promise<void>;
  markAsActioned: (alertId: string) => Promise<void>;
  deleteAlert: (alertId: string) => Promise<void>;
}

export function useAlerts(
  userId: string | null,
  options: UseAlertsOptions = {}
): UseAlertsResult {
  const {
    status = ['delivered', 'read'],
    category,
    limit = 20,
    unreadOnly = false,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState<UnreadCounts>({
    total: 0,
    byCategory: {} as Record<AlertCategory, number>,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchAlerts = useCallback(async (reset = true) => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentOffset = reset ? 0 : offset;
      const result = await alertService.getAlertsForUser(userId, {
        status,
        category,
        limit,
        offset: currentOffset,
        unreadOnly,
      });

      if (reset) {
        setAlerts(result.alerts);
        setOffset(limit);
      } else {
        setAlerts(prev => [...prev, ...result.alerts]);
        setOffset(currentOffset + limit);
      }

      setTotal(result.total);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  }, [userId, status, category, limit, unreadOnly, offset]);

  const refresh = useCallback(async () => {
    await fetchAlerts(true);
  }, [fetchAlerts]);

  const loadMore = useCallback(async () => {
    if (alerts.length < total) {
      await fetchAlerts(false);
    }
  }, [fetchAlerts, alerts.length, total]);

  const markAsRead = useCallback(async (alertIds: string[]) => {
    if (!userId) return;

    await alertService.markAsRead(alertIds, userId);
    
    setAlerts(prev =>
      prev.map(alert =>
        alertIds.includes(alert.id)
          ? { ...alert, status: 'read' as const, readAt: new Date().toISOString() }
          : alert
      )
    );

    // Update unread count
    const readCount = alertIds.length;
    setUnreadCount(prev => ({
      total: Math.max(0, prev.total - readCount),
      byCategory: prev.byCategory,
    }));
  }, [userId]);

  const markAllAsRead = useCallback(async (cat?: AlertCategory) => {
    if (!userId) return;

    await alertService.markAllAsRead(userId, cat);
    
    setAlerts(prev =>
      prev.map(alert =>
        (!cat || alert.categoryCode === cat) && alert.status === 'delivered'
          ? { ...alert, status: 'read' as const, readAt: new Date().toISOString() }
          : alert
      )
    );

    if (cat) {
      setUnreadCount(prev => ({
        total: prev.total - (prev.byCategory[cat] || 0),
        byCategory: { ...prev.byCategory, [cat]: 0 },
      }));
    } else {
      setUnreadCount({ total: 0, byCategory: {} as Record<AlertCategory, number> });
    }
  }, [userId]);

  const markAsActioned = useCallback(async (alertId: string) => {
    if (!userId) return;

    await alertService.markAsActioned(alertId, userId);
    
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'actioned' as const, actionedAt: new Date().toISOString() }
          : alert
      )
    );
  }, [userId]);

  const deleteAlert = useCallback(async (alertId: string) => {
    if (!userId) return;

    await alertService.deleteAlert(alertId, userId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setTotal(prev => prev - 1);
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchAlerts(true);
    }
  }, [userId]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(() => {
      fetchAlerts(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, userId, fetchAlerts]);

  return {
    alerts,
    total,
    unreadCount,
    isLoading,
    error,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    markAsActioned,
    deleteAlert,
  };
}

// ============================================
// UNREAD COUNT HOOK
// ============================================

export function useUnreadCount(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState<UnreadCounts>({
    total: 0,
    byCategory: {} as Record<AlertCategory, number>,
  });
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const count = await alertService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId, refresh]);

  return {
    unreadCount,
    isLoading,
    refresh,
  };
}

// ============================================
// NOTIFICATION PREFERENCES HOOK
// ============================================

interface UseNotificationPreferencesResult {
  preferences: UserNotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (updates: Partial<UserNotificationPreferences>) => Promise<void>;
  toggleCategory: (category: AlertCategory, enabled: boolean) => Promise<void>;
  toggleChannel: (channel: 'push' | 'email' | 'sms', enabled: boolean) => Promise<void>;
  setQuietHours: (enabled: boolean, start?: string, end?: string, timezone?: string) => Promise<void>;
}

export function useNotificationPreferences(
  userId: string | null
): UseNotificationPreferencesResult {
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const prefs = await alertService.getUserPreferences(userId);
      setPreferences(prefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const updatePreferences = useCallback(async (updates: Partial<UserNotificationPreferences>) => {
    if (!userId) return;

    try {
      await alertService.updatePreferences(userId, updates);
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  }, [userId]);

  const toggleCategory = useCallback(async (category: AlertCategory, enabled: boolean) => {
    if (!preferences) return;

    const categoryPreferences = {
      ...preferences.categoryPreferences,
      [category]: { ...preferences.categoryPreferences[category], enabled },
    };

    await updatePreferences({ categoryPreferences });
  }, [preferences, updatePreferences]);

  const toggleChannel = useCallback(async (channel: 'push' | 'email' | 'sms', enabled: boolean) => {
    const updates: Partial<UserNotificationPreferences> = {};
    
    switch (channel) {
      case 'push':
        updates.pushEnabled = enabled;
        break;
      case 'email':
        updates.emailEnabled = enabled;
        break;
      case 'sms':
        updates.smsEnabled = enabled;
        break;
    }

    await updatePreferences(updates);
  }, [updatePreferences]);

  const setQuietHours = useCallback(async (
    enabled: boolean,
    start?: string,
    end?: string,
    timezone?: string
  ) => {
    const updates: Partial<UserNotificationPreferences> = {
      quietHoursEnabled: enabled,
    };

    if (start) updates.quietHoursStart = start;
    if (end) updates.quietHoursEnd = end;
    if (timezone) updates.quietHoursTimezone = timezone;

    await updatePreferences(updates);
  }, [updatePreferences]);

  useEffect(() => {
    if (userId) {
      fetchPreferences();
    }
  }, [userId, fetchPreferences]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    toggleCategory,
    toggleChannel,
    setQuietHours,
  };
}

// ============================================
// DEVICE REGISTRATION HOOK
// ============================================

interface UseDeviceRegistrationResult {
  isRegistered: boolean;
  register: (
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
    deviceInfo?: {
      deviceName?: string;
      deviceModel?: string;
      osVersion?: string;
      appVersion?: string;
    }
  ) => Promise<void>;
  unregister: (deviceToken: string) => Promise<void>;
}

export function useDeviceRegistration(userId: string | null): UseDeviceRegistrationResult {
  const [isRegistered, setIsRegistered] = useState(false);

  const register = useCallback(async (
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
    deviceInfo?: {
      deviceName?: string;
      deviceModel?: string;
      osVersion?: string;
      appVersion?: string;
    }
  ) => {
    if (!userId) return;

    try {
      await alertService.registerDevice(userId, deviceToken, platform, deviceInfo);
      setIsRegistered(true);
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  }, [userId]);

  const unregister = useCallback(async (deviceToken: string) => {
    if (!userId) return;

    try {
      await alertService.unregisterDevice(userId, deviceToken);
      setIsRegistered(false);
    } catch (error) {
      console.error('Failed to unregister device:', error);
    }
  }, [userId]);

  return {
    isRegistered,
    register,
    unregister,
  };
}
