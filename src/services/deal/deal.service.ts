/**
 * DEAL SERVICE
 *
 * Core service for the deal aggregator system.
 * Handles deal clicks, saved deals, and deal cache queries.
 */

import { supabase } from '@/lib/supabase/client';
import type {
  DealClick,
  CreateDealClickInput,
  SavedDeal,
  CreateSavedDealInput,
  CachedDeal,
  PriceHistoryPoint,
  DealType,
} from './deal.types';

// ============================================
// DEAL CLICKS
// ============================================

export async function trackDealClick(
  userId: string,
  input: CreateDealClickInput
): Promise<{ data: DealClick | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('deal_clicks')
      .insert({
        user_id: userId,
        deal_type: input.deal_type,
        provider: input.provider,
        affiliate_url: input.affiliate_url,
        deal_snapshot: input.deal_snapshot,
        price_amount: input.price_amount,
        price_currency: input.price_currency || 'USD',
        search_session_id: input.search_session_id || null,
        source: input.source || null,
        campaign: input.campaign || null,
      })
      .select()
      .single();

    if (error) return { data: null, error: error as unknown as Error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function confirmBooking(
  clickId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('deal_clicks')
      .update({
        user_confirmed_booking: true,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', clickId);

    if (error) return { error: error as unknown as Error };
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function getRecentClicks(
  userId: string,
  limit = 20
): Promise<{ data: DealClick[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('deal_clicks')
      .select('*')
      .eq('user_id', userId)
      .order('clicked_at', { ascending: false })
      .limit(limit);

    if (error) return { data: [], error: error as unknown as Error };
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// ============================================
// SAVED DEALS
// ============================================

export async function saveDeal(
  userId: string,
  input: CreateSavedDealInput
): Promise<{ data: SavedDeal | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('saved_deals')
      .upsert(
        {
          user_id: userId,
          deal_type: input.deal_type,
          provider: input.provider,
          deal_snapshot: input.deal_snapshot,
          affiliate_url: input.affiliate_url || null,
          price_at_save: input.price_at_save,
          price_currency: input.price_currency || 'USD',
          route_key: input.route_key || null,
          expires_at: input.expires_at || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,route_key' }
      )
      .select()
      .single();

    if (error) return { data: null, error: error as unknown as Error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function unsaveDeal(
  dealId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('saved_deals')
      .delete()
      .eq('id', dealId);

    if (error) return { error: error as unknown as Error };
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function getSavedDeals(
  userId: string,
  dealType?: DealType
): Promise<{ data: SavedDeal[]; error: Error | null }> {
  try {
    let query = supabase
      .from('saved_deals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_expired', false)
      .order('created_at', { ascending: false });

    if (dealType) {
      query = query.eq('deal_type', dealType);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error as unknown as Error };
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

export async function isDealSaved(
  userId: string,
  routeKey: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('saved_deals')
      .select('id')
      .eq('user_id', userId)
      .eq('route_key', routeKey)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// ============================================
// DEAL CACHE (Hot Deals)
// ============================================

export async function getHotDeals(
  dealType?: DealType,
  limit = 10
): Promise<{ data: CachedDeal[]; error: Error | null }> {
  try {
    let query = supabase
      .from('deal_cache')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('deal_score', { ascending: false })
      .limit(limit);

    if (dealType) {
      query = query.eq('deal_type', dealType);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error as unknown as Error };
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// ============================================
// PRICE HISTORY
// ============================================

export async function getPriceHistory(
  routeKey: string,
  dealType: DealType,
  days = 30
): Promise<{ data: PriceHistoryPoint[]; error: Error | null }> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from('price_history')
      .select('price_amount, price_currency, recorded_at, provider')
      .eq('route_key', routeKey)
      .eq('deal_type', dealType)
      .gte('recorded_at', since.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) return { data: [], error: error as unknown as Error };
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}
