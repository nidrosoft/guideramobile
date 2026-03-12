/**
 * USE DEALS HOOK
 *
 * React hook for managing saved deals, recent clicks, and hot deals.
 */

import { useState, useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import {
  trackDealClick,
  confirmBooking,
  getRecentClicks,
  saveDeal,
  unsaveDeal,
  getSavedDeals,
  isDealSaved,
  getHotDeals,
  getPriceHistory,
  generateAffiliateLink,
  getProviderConfig,
  getPersonalizedDeals,
} from '@/services/deal';
import type {
  DealClick,
  SavedDeal,
  CachedDeal,
  CreateDealClickInput,
  CreateSavedDealInput,
  DealType,
  PriceHistoryPoint,
  GenerateAffiliateLinkParams,
  PersonalizedDeal,
} from '@/services/deal';

// ============================================
// useSavedDeals
// ============================================

export function useSavedDeals(dealType?: DealType) {
  const { profile } = useAuth();
  const [deals, setDeals] = useState<SavedDeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getSavedDeals(profile.id, dealType);
      if (result.error) throw result.error;
      setDeals(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, dealType]);

  const save = useCallback(
    async (input: CreateSavedDealInput) => {
      if (!profile?.id) return;
      const result = await saveDeal(profile.id, input);
      if (!result.error) await load();
      return result;
    },
    [profile?.id, load]
  );

  const remove = useCallback(
    async (dealId: string) => {
      const result = await unsaveDeal(dealId);
      if (!result.error) await load();
      return result;
    },
    [load]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { deals, isLoading, error, save, remove, refresh: load };
}

// ============================================
// useRecentClicks
// ============================================

export function useRecentClicks(limit = 20) {
  const { profile } = useAuth();
  const [clicks, setClicks] = useState<DealClick[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      const result = await getRecentClicks(profile.id, limit);
      setClicks(result.data);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { clicks, isLoading, refresh: load };
}

// ============================================
// useHotDeals
// ============================================

export function useHotDeals(dealType?: DealType, limit = 10) {
  const [deals, setDeals] = useState<CachedDeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getHotDeals(dealType, limit);
      setDeals(result.data);
    } finally {
      setIsLoading(false);
    }
  }, [dealType, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { deals, isLoading, refresh: load };
}

// ============================================
// useDealRedirect
// ============================================

export function useDealRedirect() {
  const { profile } = useAuth();
  const [lastClickId, setLastClickId] = useState<string | null>(null);

  const redirect = useCallback(
    async (input: CreateDealClickInput & GenerateAffiliateLinkParams) => {
      const config = await getProviderConfig(input.provider);
      const affiliateUrl = generateAffiliateLink(
        {
          provider: input.provider,
          deep_link: input.deep_link,
          origin: input.origin,
          destination: input.destination,
          date: input.date,
          return_date: input.return_date,
          query: input.query,
          location: input.location,
        },
        config
      );

      if (profile?.id) {
        const result = await trackDealClick(profile.id, {
          ...input,
          affiliate_url: affiliateUrl,
        });
        if (result.data) {
          setLastClickId(result.data.id);
        }
      }

      try {
        await Linking.openURL(affiliateUrl);
      } catch {
        // If openURL fails, try a Google search fallback
        const fallback = `https://www.google.com/search?q=${encodeURIComponent(input.destination || input.query || '')}`;
        try { await Linking.openURL(fallback); } catch {}
      }

      return { affiliateUrl, clickId: lastClickId };
    },
    [profile?.id, lastClickId]
  );

  const confirmLastBooking = useCallback(async () => {
    if (lastClickId) {
      await confirmBooking(lastClickId);
      setLastClickId(null);
    }
  }, [lastClickId]);

  return { redirect, confirmLastBooking, lastClickId };
}

// ============================================
// usePriceHistory
// ============================================

export function usePriceHistory(
  routeKey: string | null,
  dealType: DealType,
  days = 30
) {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!routeKey) return;
    setIsLoading(true);
    try {
      const result = await getPriceHistory(routeKey, dealType, days);
      setHistory(result.data);
    } finally {
      setIsLoading(false);
    }
  }, [routeKey, dealType, days]);

  useEffect(() => {
    load();
  }, [load]);

  return { history, isLoading, refresh: load };
}

// ============================================
// useIsDealSaved
// ============================================

export function useIsDealSaved(routeKey: string | null) {
  const { profile } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile?.id || !routeKey) return;
    isDealSaved(profile.id, routeKey).then(setSaved);
  }, [profile?.id, routeKey]);

  return saved;
}

// ============================================
// useGilDeals — GIL personalized deal feed
// ============================================

export function useGilDeals(dealType?: DealType, limit = 8) {
  const { profile } = useAuth();
  const [deals, setDeals] = useState<PersonalizedDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPersonalizedDeals(profile?.id || null, dealType, limit);
      if (result.error) throw result.error;
      setDeals(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, dealType, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { deals, isLoading, error, refresh: load };
}
