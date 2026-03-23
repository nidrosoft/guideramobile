/**
 * USE NOTIFICATIONS HOOK
 *
 * React hook for managing notification state:
 * - Fetches alerts from Supabase
 * - Subscribes to Realtime for live updates
 * - Provides unread count
 * - Mark as read / actioned
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

// ─── Module-level event bus for cross-instance sync ──────────────
type Listener = () => void;
const _listeners = new Set<Listener>();
function emitNotificationsChanged() {
  _listeners.forEach(fn => fn());
}
function onNotificationsChanged(fn: Listener) {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}

export interface AppNotification {
  id: string;
  typeCode: string;
  category: 'trip' | 'safety' | 'financial' | 'social' | 'system';
  title: string;
  body: string;
  icon?: string;
  imageUrl?: string;
  data: Record<string, unknown>;
  actionUrl?: string;
  priority: number;
  status: string;
  isRead: boolean;
  tripId?: string;
  createdAt: string;
  deliveredAt?: string;
}

interface UseNotificationsOptions {
  category?: string;
  excludeCategory?: string;
  limit?: number;
  autoRefresh?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit = 50, category, excludeCategory, autoRefresh = true } = options;
  const { profile } = useAuth();
  const userId = profile?.id;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch notifications from DB
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      if (__DEV__) console.log('[Notifications] No userId yet, skipping fetch');
      setIsLoading(false);
      return;
    }

    if (__DEV__) console.log('[Notifications] Fetching for userId:', userId, 'category:', category, 'excludeCategory:', excludeCategory);

    try {
      let query = supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['delivered', 'read', 'actioned'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category_code', category);
      }
      if (excludeCategory) {
        query = query.neq('category_code', excludeCategory);
      }

      const { data, error: fetchError } = await query;

      if (__DEV__) console.log('[Notifications] Query result:', data?.length, 'items, error:', fetchError?.message || 'none');

      if (fetchError) {
        if (__DEV__) console.warn('Failed to fetch notifications:', fetchError);
        setError(fetchError.message);
        return;
      }

      const mapped: AppNotification[] = (data || []).map((alert: any) => ({
        id: alert.id,
        typeCode: alert.alert_type_code,
        category: alert.category_code,
        title: alert.title,
        body: alert.body,
        icon: alert.icon,
        imageUrl: alert.image_url,
        data: alert.context || {},
        actionUrl: alert.action_url,
        priority: alert.priority,
        status: alert.status,
        isRead: !!alert.read_at,
        tripId: alert.trip_id,
        createdAt: alert.created_at,
        deliveredAt: alert.delivered_at,
      }));

      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.isRead).length);
      setError(null);
    } catch (err) {
      if (__DEV__) console.warn('Notification fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, category, excludeCategory, limit]);

  // Fetch unread count only (lightweight)
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      let query = supabase
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['delivered', 'pending'])
        .is('read_at', null);

      if (category) {
        query = query.eq('category_code', category);
      }
      if (excludeCategory) {
        query = query.neq('category_code', excludeCategory);
      }

      const { count } = await query;
      setUnreadCount(count || 0);
    } catch (err) {
      if (__DEV__) console.warn('Unread count fetch error:', err);
    }
  }, [userId, category, excludeCategory]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      const { error: updateError } = await supabase
        .from('alerts')
        .update({ read_at: new Date().toISOString(), status: 'read' })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (updateError) {
        if (__DEV__) console.warn('Mark as read DB error:', updateError.message);
        return;
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true, status: 'read' } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      emitNotificationsChanged();
    } catch (err) {
      if (__DEV__) console.warn('Mark as read error:', err);
    }
  }, [userId]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      let query = supabase
        .from('alerts')
        .update({ read_at: new Date().toISOString(), status: 'read' })
        .eq('user_id', userId)
        .is('read_at', null);

      if (category) {
        query = query.eq('category_code', category);
      }
      if (excludeCategory) {
        query = query.neq('category_code', excludeCategory);
      }

      const { error: updateError } = await query;

      if (updateError) {
        if (__DEV__) console.warn('Mark all as read DB error:', updateError.message);
        // Fallback: refetch to get accurate state
        await fetchNotifications();
        return;
      }

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, status: 'read' })));
      setUnreadCount(0);
      emitNotificationsChanged();
    } catch (err) {
      if (__DEV__) console.warn('Mark all as read error:', err);
      // Refetch on failure to sync state
      await fetchNotifications();
    }
  }, [userId, category, excludeCategory, fetchNotifications]);

  // Delete a single notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      const { error: delError } = await supabase
        .from('alerts')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (delError) {
        if (__DEV__) console.warn('Delete notification DB error:', delError.message);
        return;
      }

      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notificationId);
        setUnreadCount(updated.filter(n => !n.isRead).length);
        return updated;
      });
      emitNotificationsChanged();
    } catch (err) {
      if (__DEV__) console.warn('Delete notification error:', err);
    }
  }, [userId]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!userId) return;

    try {
      let query = supabase
        .from('alerts')
        .delete()
        .eq('user_id', userId);

      if (category) {
        query = query.eq('category_code', category);
      }
      if (excludeCategory) {
        query = query.neq('category_code', excludeCategory);
      }

      const { error: delError } = await query;

      if (delError) {
        if (__DEV__) console.warn('Clear all notifications DB error:', delError.message);
        await fetchNotifications();
        return;
      }

      setNotifications([]);
      setUnreadCount(0);
      emitNotificationsChanged();
    } catch (err) {
      if (__DEV__) console.warn('Clear all notifications error:', err);
      await fetchNotifications();
    }
  }, [userId, category, excludeCategory, fetchNotifications]);

  // Subscribe to Realtime for new alerts
  useEffect(() => {
    if (!userId || !autoRefresh) return;

    const channel = supabase
      .channel(`alerts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const alert = payload.new as any;
          if (category && alert.category_code !== category) return;
          if (excludeCategory && alert.category_code === excludeCategory) return;

          const newNotif: AppNotification = {
            id: alert.id,
            typeCode: alert.alert_type_code,
            category: alert.category_code,
            title: alert.title,
            body: alert.body,
            icon: alert.icon,
            imageUrl: alert.image_url,
            data: alert.context || {},
            actionUrl: alert.action_url,
            priority: alert.priority,
            status: alert.status,
            isRead: false,
            tripId: alert.trip_id,
            createdAt: alert.created_at,
            deliveredAt: alert.delivered_at,
          };

          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const alert = payload.new as any;
          if (category && alert.category_code !== category) return;
          if (excludeCategory && alert.category_code === excludeCategory) return;

          // Sync read status from other screens (e.g. mark-all-as-read)
          setNotifications(prev => {
            const updated = prev.map(n =>
              n.id === alert.id ? { ...n, isRead: !!alert.read_at, status: alert.status } : n
            );
            setUnreadCount(updated.filter(n => !n.isRead).length);
            return updated;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, category, autoRefresh]);

  // Initial fetch + re-fetch when userId becomes available
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Listen for cross-instance sync events (e.g. another screen marked all as read)
  useEffect(() => {
    return onNotificationsChanged(() => {
      fetchUnreadCount();
    });
  }, [fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications,
    refreshUnreadCount: fetchUnreadCount,
  };
}
