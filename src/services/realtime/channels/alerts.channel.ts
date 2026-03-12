/**
 * ALERTS REALTIME CHANNEL
 *
 * Subscribes to the alerts table for live in-app notification updates.
 * Used by useNotifications hook and NotificationBell component.
 */

import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

let activeChannel: RealtimeChannel | null = null;

export type AlertChangeCallback = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}) => void;

/**
 * Subscribe to real-time alert changes for a specific user
 */
export function subscribeToAlerts(
  userId: string,
  onAlert: AlertChangeCallback
): RealtimeChannel {
  // Cleanup existing channel
  if (activeChannel) {
    supabase.removeChannel(activeChannel);
  }

  const channel = supabase
    .channel(`user-alerts:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'alerts',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onAlert({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as Record<string, unknown>,
          old: payload.old as Record<string, unknown>,
        });
      }
    )
    .subscribe();

  activeChannel = channel;
  return channel;
}

/**
 * Unsubscribe from alerts channel
 */
export function unsubscribeFromAlerts(): void {
  if (activeChannel) {
    supabase.removeChannel(activeChannel);
    activeChannel = null;
  }
}
