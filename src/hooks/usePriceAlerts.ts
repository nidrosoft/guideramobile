/**
 * USE PRICE ALERTS HOOK
 *
 * React hook for managing user price alerts.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  createPriceAlert,
  getUserAlerts,
  deactivateAlert,
  deleteAlert,
  hasAlertForRoute,
} from '@/services/deal';
import type { PriceAlert, CreatePriceAlertInput } from '@/services/deal';

export function usePriceAlerts(activeOnly = true) {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUserAlerts(profile.id, activeOnly);
      if (result.error) throw result.error;
      setAlerts(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, activeOnly]);

  const create = useCallback(
    async (input: CreatePriceAlertInput) => {
      if (!profile?.id) return null;
      const result = await createPriceAlert(profile.id, input);
      if (!result.error) await load();
      return result;
    },
    [profile?.id, load]
  );

  const pause = useCallback(
    async (alertId: string) => {
      const result = await deactivateAlert(alertId);
      if (!result.error) await load();
      return result;
    },
    [load]
  );

  const remove = useCallback(
    async (alertId: string) => {
      const result = await deleteAlert(alertId);
      if (!result.error) await load();
      return result;
    },
    [load]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { alerts, isLoading, error, create, pause, remove, refresh: load };
}

export function useHasAlert(routeKey: string | null) {
  const { profile } = useAuth();
  const [hasAlert, setHasAlert] = useState(false);

  useEffect(() => {
    if (!profile?.id || !routeKey) return;
    hasAlertForRoute(profile.id, routeKey).then(setHasAlert);
  }, [profile?.id, routeKey]);

  return hasAlert;
}
