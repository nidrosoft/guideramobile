/**
 * AFFILIATE CLICK TRACKING SERVICE
 *
 * Tracks every deal link click with affiliate attribution.
 * Inserts into both `affiliate_click_tracking` (new) and `deal_clicks` (legacy).
 * Includes device and app version metadata in all tracking calls.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase/client';
import { getProviderConfig } from '@/services/deal/affiliate.service';

// ─── Device & App Metadata ──────────────────────────────────────
const getDeviceType = (): string => Platform.OS; // "ios" | "android"
const getAppVersion = (): string =>
  Constants.expoConfig?.version || (Constants.manifest as any)?.version || '0.1.4';

// ─── Types ──────────────────────────────────────────────────────

export interface TrackClickParams {
  userId: string;
  dealCacheId?: string;
  dealMatchId?: string;
  dealType: string;        // "flight" | "hotel" | "experience" | "package"
  provider: string;        // "kiwi" | "booking" | "viator" | etc.
  routeKey?: string;       // e.g. "SAN-CDG"
  priceAmount?: number;
  priceCurrency?: string;  // default "USD"
  dealTitle?: string;
  affiliateUrl: string;    // The full URL being opened
  source: string;          // "app" | "push" | "campaign" | "in_app_deal"
  campaignId?: string;
  notificationId?: string;
  dealSnapshot?: Record<string, any>;
}

// ─── Core Tracking Function ─────────────────────────────────────

/**
 * Tracks an affiliate click.
 *
 * 1. Looks up affiliate_config for the provider to get commission_rate & config id
 * 2. Calculates estimated_commission = priceAmount × commission_rate
 * 3. Inserts into `affiliate_click_tracking`
 * 4. Also inserts into `deal_clicks` for backward compatibility
 * 5. Returns the tracking_id from the inserted row (or null on failure)
 */
export async function trackAffiliateClick(
  params: TrackClickParams
): Promise<string | null> {
  try {
    // 1. Look up affiliate config for commission rate
    const config = await getProviderConfig(params.provider);
    const commissionRate = config?.commission_rate ?? null;
    const affiliateConfigId = config?.id ?? null;

    // 2. Calculate estimated commission
    const estimatedCommission =
      params.priceAmount && commissionRate
        ? Number((params.priceAmount * commissionRate).toFixed(2))
        : null;

    const deviceType = getDeviceType();
    const appVersion = getAppVersion();

    // 3. Insert into affiliate_click_tracking
    const { data: trackingRow, error: trackingError } = await supabase
      .from('affiliate_click_tracking')
      .insert({
        user_id: params.userId,
        deal_cache_id: params.dealCacheId || null,
        deal_match_id: params.dealMatchId || null,
        deal_type: params.dealType,
        provider: params.provider,
        route_key: params.routeKey || null,
        price_amount: params.priceAmount || null,
        price_currency: params.priceCurrency || 'USD',
        deal_title: params.dealTitle || null,
        affiliate_config_id: affiliateConfigId,
        affiliate_url: params.affiliateUrl,
        commission_rate: commissionRate,
        estimated_commission: estimatedCommission,
        source: params.source,
        campaign_id: params.campaignId || null,
        notification_id: params.notificationId || null,
        device_type: deviceType,
        app_version: appVersion,
      })
      .select('tracking_id')
      .single();

    if (trackingError) {
      if (__DEV__) console.warn('[AffiliateTracking] Insert error:', trackingError.message);
    }

    // 4. Return tracking_id
    // Note: deal_clicks insert is handled by the caller (useDealRedirect/handleGetDeal)
    // to avoid duplicate rows. Each call site maintains its own backward-compat insert.
    return trackingRow?.tracking_id || null;
  } catch (err) {
    if (__DEV__) console.warn('[AffiliateTracking] Unexpected error:', err);
    return null;
  }
}

// ─── Deal Match Engagement ──────────────────────────────────────

/**
 * Mark a deal match as viewed when the card enters the viewport.
 */
export async function markDealMatchViewed(matchId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_deal_matches')
      .update({ viewed: true, viewed_at: new Date().toISOString() })
      .eq('id', matchId)
      .is('viewed', false);

    if (error && __DEV__) console.warn('[AffiliateTracking] markViewed error:', error.message);
  } catch (err) {
    if (__DEV__) console.warn('[AffiliateTracking] markViewed unexpected:', err);
  }
}

/**
 * Mark a deal match as clicked when the user taps the card.
 */
export async function markDealMatchClicked(matchId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_deal_matches')
      .update({ clicked: true, clicked_at: new Date().toISOString() })
      .eq('id', matchId);

    if (error && __DEV__) console.warn('[AffiliateTracking] markClicked error:', error.message);
  } catch (err) {
    if (__DEV__) console.warn('[AffiliateTracking] markClicked unexpected:', err);
  }
}

// ─── Search Session Tracking ────────────────────────────────────

export interface CreateSearchSessionParams {
  userId: string;
  searchMode: string;       // "flight" | "hotel" | "experience" | "package"
  originCode?: string;
  originCity?: string;
  destinationCode?: string;
  destinationCity?: string;
  destinationCountry?: string;
  startDate?: string;       // ISO date string
  endDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  rooms?: number;
  searchParams?: Record<string, any>;
  filtersApplied?: Record<string, any>;
}

/**
 * Create a search session at search START. Returns the session ID.
 */
export async function createSearchSession(
  params: CreateSearchSessionParams
): Promise<string | null> {
  try {
    const deviceType = getDeviceType();
    const appVersion = getAppVersion();

    const { data, error } = await supabase
      .from('search_sessions')
      .insert({
        user_id: params.userId,
        search_mode: params.searchMode,
        origin_code: params.originCode || null,
        origin_city: params.originCity || null,
        destination_code: params.destinationCode || null,
        destination_city: params.destinationCity || null,
        destination_country: params.destinationCountry || null,
        start_date: params.startDate || null,
        end_date: params.endDate || null,
        adults: params.adults || 1,
        children: params.children || 0,
        infants: params.infants || 0,
        rooms: params.rooms || null,
        search_params: params.searchParams || null,
        filters_applied: params.filtersApplied || null,
        status: 'searching',
        search_started_at: new Date().toISOString(),
        device_type: deviceType,
        app_version: appVersion,
      })
      .select('id')
      .single();

    if (error) {
      if (__DEV__) console.warn('[SearchSession] Create error:', error.message);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    if (__DEV__) console.warn('[SearchSession] Create unexpected:', err);
    return null;
  }
}

/**
 * Update a search session with results data when results arrive.
 */
export async function updateSearchSessionResults(
  sessionId: string,
  results: {
    totalResults?: number;
    resultsByCategory?: Record<string, any>;
    providersQueried?: string[];
    providersSucceeded?: string[];
    providersFailed?: string[];
    servedFromCache?: boolean;
    status?: string;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('search_sessions')
      .update({
        total_results: results.totalResults ?? null,
        results_by_category: results.resultsByCategory ?? null,
        providers_queried: results.providersQueried ?? null,
        providers_succeeded: results.providersSucceeded ?? null,
        providers_failed: results.providersFailed ?? null,
        served_from_cache: results.servedFromCache ?? false,
        status: results.status || 'completed',
        error_message: results.errorMessage || null,
        search_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error && __DEV__) console.warn('[SearchSession] Update results error:', error.message);
  } catch (err) {
    if (__DEV__) console.warn('[SearchSession] Update results unexpected:', err);
  }
}

/**
 * Update a search session when user interacts with results.
 */
export async function updateSearchSessionEngagement(
  sessionId: string,
  engagement: {
    resultsViewed?: number;
    offersClicked?: string[];
    selectedResultIndex?: number;
    sessionDurationMs?: number;
    bookingInitiated?: boolean;
    filtersApplied?: Record<string, any>;
    sortApplied?: string;
  }
): Promise<void> {
  try {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    if (engagement.resultsViewed !== undefined) updateData.results_viewed = engagement.resultsViewed;
    if (engagement.offersClicked !== undefined) updateData.offers_clicked = engagement.offersClicked;
    if (engagement.sessionDurationMs !== undefined) updateData.duration_ms = engagement.sessionDurationMs;
    if (engagement.bookingInitiated !== undefined) updateData.booking_initiated = engagement.bookingInitiated;
    if (engagement.filtersApplied !== undefined) updateData.filters_applied = engagement.filtersApplied;
    if (engagement.sortApplied !== undefined) updateData.sort_applied = engagement.sortApplied;

    const { error } = await supabase
      .from('search_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error && __DEV__) console.warn('[SearchSession] Update engagement error:', error.message);
  } catch (err) {
    if (__DEV__) console.warn('[SearchSession] Update engagement unexpected:', err);
  }
}

// ─── Campaign Notification Tracking ─────────────────────────────

/**
 * Update deal_campaign_sends when user opens a campaign notification.
 */
export async function trackCampaignOpened(
  campaignId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('deal_campaign_sends')
      .update({ opened_at: new Date().toISOString(), status: 'opened' })
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .is('opened_at', null);

    if (error && __DEV__) console.warn('[CampaignTracking] Open error:', error.message);
  } catch (err) {
    if (__DEV__) console.warn('[CampaignTracking] Open unexpected:', err);
  }
}

/**
 * Update deal_campaign_sends when user clicks through from a campaign notification.
 */
export async function trackCampaignClicked(
  campaignId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('deal_campaign_sends')
      .update({ clicked_at: new Date().toISOString(), status: 'clicked' })
      .eq('campaign_id', campaignId)
      .eq('user_id', userId);

    if (error && __DEV__) console.warn('[CampaignTracking] Click error:', error.message);
  } catch (err) {
    if (__DEV__) console.warn('[CampaignTracking] Click unexpected:', err);
  }
}
