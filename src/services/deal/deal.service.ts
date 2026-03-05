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
// GIL PERSONALIZED DEALS (user_deal_matches → deal_cache fallback)
// ============================================

export interface PersonalizedDeal {
  id: string;
  deal_type: DealType;
  deal_title: string;
  deal_subtitle: string | null;
  deal_image_url: string | null;
  price_amount: number;
  price_currency: string;
  original_price: number | null;
  discount_percent: number | null;
  deal_badges: string[];
  booking_url: string | null;
  provider: string | null;
  relevance_score: number;
  match_reasons: string[];
  deal_cache_id: string;
  expires_at: string | null;
  source: 'personalized' | 'hot_deals' | 'fallback';
}

export async function getPersonalizedDeals(
  userId: string | null,
  dealType?: DealType,
  limit = 30
): Promise<{ data: PersonalizedDeal[]; error: Error | null }> {
  try {
    let results: PersonalizedDeal[] = [];

    // 1. Try personalized deals from user_deal_matches (if logged in)
    if (userId) {
      try {
        let query = supabase
          .from('user_deal_matches')
          .select('*')
          .eq('user_id', userId)
          .order('relevance_score', { ascending: false })
          .limit(limit);

        if (dealType) {
          query = query.eq('deal_type', dealType);
        }

        const { data: matches, error: matchError } = await query;

        if (!matchError && matches && matches.length > 0) {
          results = matches.map((m: any) => ({
            id: m.id,
            deal_type: m.deal_type,
            deal_title: m.deal_title,
            deal_subtitle: m.deal_subtitle,
            deal_image_url: m.deal_image_url,
            price_amount: Number(m.price_amount) || 0,
            price_currency: m.price_currency || 'USD',
            original_price: m.original_price ? Number(m.original_price) : null,
            discount_percent: m.discount_percent ? Number(m.discount_percent) : null,
            deal_badges: m.deal_badges || [],
            booking_url: m.booking_url,
            provider: m.provider,
            relevance_score: Number(m.relevance_score) || 0,
            match_reasons: m.match_reasons || [],
            deal_cache_id: m.deal_cache_id,
            expires_at: m.expires_at,
            source: 'personalized' as const,
          }));
        }
      } catch (err) {
        console.warn('GIL: user_deal_matches query failed, falling back to deal_cache:', err);
      }
    }

    // 2. If no personalized deals, fall back to deal_cache (hot deals for everyone)
    if (results.length === 0) {
      let query = supabase
        .from('deal_cache')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('deal_score', { ascending: false })
        .limit(limit);

      if (dealType) {
        query = query.eq('deal_type', dealType);
      }

      const { data: cached, error: cacheError } = await query;

      if (cacheError) {
        console.warn('GIL: deal_cache query failed:', cacheError.message);
      }

      if (cached && cached.length > 0) {
        results = cached.map((d: any) => {
          const snapshot = d.deal_data || {};
          return {
            id: d.id,
            deal_type: d.deal_type,
            deal_title: snapshot.title || d.route_key?.replace('-', ' → ') || 'Deal',
            deal_subtitle: snapshot.subtitle || null,
            deal_image_url: snapshot.heroImage || snapshot.imageUrl || snapshot.airlineLogo || null,
            price_amount: Number(d.price_amount) || 0,
            price_currency: d.price_currency || 'USD',
            original_price: snapshot.originalPrice ? Number(snapshot.originalPrice) : null,
            discount_percent: snapshot.originalPrice && d.price_amount
              ? Math.round((1 - Number(d.price_amount) / Number(snapshot.originalPrice)) * 100)
              : null,
            deal_badges: d.deal_badges || [],
            booking_url: snapshot.bookingUrl || snapshot.link || snapshot.productUrl || null,
            provider: d.provider,
            relevance_score: Number(d.deal_score || 50) / 100,
            match_reasons: (d.deal_badges || []).length > 0
              ? [(d.deal_badges[0] || '').replace(/_/g, ' ')]
              : [],
            deal_cache_id: d.id,
            expires_at: d.expires_at,
            source: 'hot_deals' as const,
          };
        });
      }
    }

    // 3. If still empty, trigger a background scan and return empty
    //    The next refresh will have data after the scan completes
    if (results.length === 0 && userId) {
      triggerBackgroundScan(userId).catch(() => {});
    }

    return { data: results, error: null };
  } catch (error) {
    console.warn('GIL: getPersonalizedDeals failed:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Trigger a background deal scan for a user (fire-and-forget).
 * Called when the deal feed is empty to populate initial data.
 */
async function triggerBackgroundScan(userId: string): Promise<void> {
  try {
    // First ensure the user has a Travel DNA computed
    await supabase.functions.invoke('compute-travel-dna', {
      body: { user_id: userId },
    });

    // Then trigger an explore scan
    await supabase.functions.invoke('deal-scanner', {
      body: { scan_type: 'explore', batch_size: 5 },
    });
  } catch (err) {
    console.warn('Background scan trigger failed:', err);
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
