/**
 * SOS EMERGENCY HOOKS
 * 
 * React hooks for SOS emergency functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import { sosService } from '@/services/realtime';
import type {
  SOSSettings,
  SOSEvent,
  EmergencyContact,
  GeoLocation,
} from '@/services/realtime/sos/sos.service';

// ============================================
// SOS SETTINGS HOOK
// ============================================

interface UseSOSSettingsResult {
  settings: SOSSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<SOSSettings>) => Promise<void>;
  addContact: (contact: EmergencyContact) => Promise<boolean>;
  removeContact: (index: number) => Promise<boolean>;
  toggleSOS: (enabled: boolean) => Promise<void>;
  toggleCheckin: (enabled: boolean, intervalHours?: number) => Promise<void>;
}

export function useSOSSettings(userId: string | null): UseSOSSettingsResult {
  const [settings, setSettings] = useState<SOSSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await sosService.getSettings(userId);
      setSettings(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch SOS settings');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const updateSettings = useCallback(async (updates: Partial<SOSSettings>) => {
    if (!userId) return;

    try {
      const result = await sosService.updateSettings(userId, updates);
      if (result) {
        setSettings(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    }
  }, [userId]);

  const addContact = useCallback(async (contact: EmergencyContact): Promise<boolean> => {
    if (!userId) return false;

    const success = await sosService.addEmergencyContact(userId, contact);
    if (success) {
      await fetchSettings();
    }
    return success;
  }, [userId, fetchSettings]);

  const removeContact = useCallback(async (index: number): Promise<boolean> => {
    if (!userId) return false;

    const success = await sosService.removeEmergencyContact(userId, index);
    if (success) {
      await fetchSettings();
    }
    return success;
  }, [userId, fetchSettings]);

  const toggleSOS = useCallback(async (enabled: boolean) => {
    await updateSettings({ sosEnabled: enabled });
  }, [updateSettings]);

  const toggleCheckin = useCallback(async (enabled: boolean, intervalHours?: number) => {
    const updates: Partial<SOSSettings> = { checkinEnabled: enabled };
    if (intervalHours !== undefined) {
      updates.checkinIntervalHours = intervalHours;
    }
    await updateSettings(updates);
  }, [updateSettings]);

  useEffect(() => {
    if (userId) {
      fetchSettings();
    }
  }, [userId, fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    addContact,
    removeContact,
    toggleSOS,
    toggleCheckin,
  };
}

// ============================================
// SOS TRIGGER HOOK
// ============================================

interface UseSOSTriggerResult {
  activeEvent: SOSEvent | null;
  isTriggering: boolean;
  error: string | null;
  triggerSOS: (location?: GeoLocation, tripId?: string) => Promise<SOSEvent | null>;
  cancelSOS: (reason?: string) => Promise<boolean>;
  resolveSOS: (notes?: string) => Promise<boolean>;
  checkForActiveEvent: () => Promise<void>;
}

export function useSOSTrigger(userId: string | null): UseSOSTriggerResult {
  const [activeEvent, setActiveEvent] = useState<SOSEvent | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkForActiveEvent = useCallback(async () => {
    if (!userId) return;

    try {
      const event = await sosService.getActiveSOSEvent(userId);
      setActiveEvent(event);
    } catch (err) {
      console.error('Failed to check for active SOS event:', err);
    }
  }, [userId]);

  const triggerSOS = useCallback(async (
    location?: GeoLocation,
    tripId?: string
  ): Promise<SOSEvent | null> => {
    if (!userId) return null;

    setIsTriggering(true);
    setError(null);

    try {
      const event = await sosService.triggerSOS(userId, location, tripId);
      if (event) {
        setActiveEvent(event);
      } else {
        setError('Failed to trigger SOS. Please check your settings.');
      }
      return event;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger SOS');
      return null;
    } finally {
      setIsTriggering(false);
    }
  }, [userId]);

  const cancelSOS = useCallback(async (reason?: string): Promise<boolean> => {
    if (!userId || !activeEvent) return false;

    try {
      const success = await sosService.cancelSOS(userId, activeEvent.id, reason);
      if (success) {
        setActiveEvent(null);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel SOS');
      return false;
    }
  }, [userId, activeEvent]);

  const resolveSOS = useCallback(async (notes?: string): Promise<boolean> => {
    if (!userId || !activeEvent) return false;

    try {
      const success = await sosService.resolveSOS(userId, activeEvent.id, notes);
      if (success) {
        setActiveEvent(null);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve SOS');
      return false;
    }
  }, [userId, activeEvent]);

  useEffect(() => {
    if (userId) {
      checkForActiveEvent();
    }
  }, [userId, checkForActiveEvent]);

  return {
    activeEvent,
    isTriggering,
    error,
    triggerSOS,
    cancelSOS,
    resolveSOS,
    checkForActiveEvent,
  };
}

// ============================================
// SOS HISTORY HOOK
// ============================================

interface UseSOSHistoryResult {
  events: SOSEvent[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useSOSHistory(userId: string | null, limit = 10): UseSOSHistoryResult {
  const [events, setEvents] = useState<SOSEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const history = await sosService.getSOSHistory(userId, limit);
      setEvents(history);
    } catch (error) {
      console.error('Failed to fetch SOS history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId, refresh]);

  return {
    events,
    isLoading,
    refresh,
  };
}

// ============================================
// CHECK-IN HOOK
// ============================================

interface UseCheckinResult {
  lastCheckin: string | null;
  missedCheckins: number;
  isOverdue: boolean;
  checkIn: () => Promise<boolean>;
}

export function useCheckin(userId: string | null): UseCheckinResult {
  const [lastCheckin, setLastCheckin] = useState<string | null>(null);
  const [missedCheckins, setMissedCheckins] = useState(0);
  const [checkinInterval, setCheckinInterval] = useState(24);

  const isOverdue = (() => {
    if (!lastCheckin) return false;
    const lastDate = new Date(lastCheckin);
    const now = new Date();
    const hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
    return hoursSince > checkinInterval;
  })();

  const fetchStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const settings = await sosService.getSettings(userId);
      if (settings) {
        setLastCheckin(settings.lastCheckinAt || null);
        setMissedCheckins(settings.missedCheckins);
        setCheckinInterval(settings.checkinIntervalHours);
      }
    } catch (error) {
      console.error('Failed to fetch check-in status:', error);
    }
  }, [userId]);

  const checkIn = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      const success = await sosService.checkIn(userId);
      if (success) {
        setLastCheckin(new Date().toISOString());
        setMissedCheckins(0);
      }
      return success;
    } catch (error) {
      console.error('Failed to check in:', error);
      return false;
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchStatus();
    }
  }, [userId, fetchStatus]);

  return {
    lastCheckin,
    missedCheckins,
    isOverdue,
    checkIn,
  };
}
