/**
 * DEAL TYPES
 *
 * Type definitions for the deal aggregator system.
 * Covers deal clicks, saved deals, price alerts, and affiliate config.
 */

export type DealType = 'flight' | 'hotel' | 'car' | 'experience';

export type DealBadge =
  | 'best_price'
  | 'price_drop'
  | 'near_record_low'
  | 'record_low'
  | 'trending'
  | 'limited_availability'
  | 'editors_pick';

export type AlertType = 'price_drop' | 'any_change' | 'target_price';

// ============================================
// DEAL CLICK (tracks redirect to provider)
// ============================================

export interface DealClick {
  id: string;
  user_id: string;
  deal_type: DealType;
  provider: string;
  affiliate_url: string;
  deal_snapshot: DealSnapshot;
  price_amount: number;
  price_currency: string;
  search_session_id: string | null;
  clicked_at: string;
  source: string | null;
  campaign: string | null;
  user_confirmed_booking: boolean;
  confirmed_at: string | null;
}

export interface CreateDealClickInput {
  deal_type: DealType;
  provider: string;
  affiliate_url: string;
  deal_snapshot: DealSnapshot;
  price_amount: number;
  price_currency?: string;
  search_session_id?: string;
  source?: 'search' | 'deal_feed' | 'price_alert' | 'homepage' | 'saved_deals';
  campaign?: string;
}

// ============================================
// SAVED DEAL
// ============================================

export interface SavedDeal {
  id: string;
  user_id: string;
  deal_type: DealType;
  provider: string;
  deal_snapshot: DealSnapshot;
  affiliate_url: string | null;
  price_at_save: number;
  current_price: number | null;
  price_currency: string;
  price_changed: boolean;
  price_change_pct: number | null;
  route_key: string | null;
  is_expired: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSavedDealInput {
  deal_type: DealType;
  provider: string;
  deal_snapshot: DealSnapshot;
  affiliate_url?: string;
  price_at_save: number;
  price_currency?: string;
  route_key?: string;
  expires_at?: string;
}

// ============================================
// DEAL SNAPSHOT (stored with clicks/saves)
// ============================================

export interface DealSnapshot {
  // Common fields
  title: string;
  subtitle?: string;
  provider: { code: string; name: string; logo?: string };
  price: { amount: number; currency: string; formatted: string };
  imageUrl?: string;

  // Flight-specific
  flight?: {
    outbound: FlightLegSnapshot;
    inbound?: FlightLegSnapshot;
    tripType: string;
    totalStops: number;
    totalDuration: number;
    cabinClass?: string;
  };

  // Hotel-specific
  hotel?: {
    name: string;
    starRating?: number;
    guestRating?: { score: number; reviewCount: number };
    address: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    roomType?: string;
    amenities?: string[];
  };

  // Car-specific
  car?: {
    name: string;
    category: string;
    company: string;
    pickupLocation: string;
    dropoffLocation: string;
    pickupDate: string;
    dropoffDate: string;
  };

  // Experience-specific
  experience?: {
    name: string;
    duration: string;
    rating?: number;
    reviewCount?: number;
    date: string;
    participants: number;
  };
}

export interface FlightLegSnapshot {
  departure: { airport: string; time: string };
  arrival: { airport: string; time: string };
  duration: number;
  stops: number;
  airline: { code: string; name: string };
}

// ============================================
// PRICE ALERT
// ============================================

export interface PriceAlert {
  id: string;
  user_id: string;
  deal_type: DealType;
  route_key: string;
  alert_type: AlertType;
  target_price: number | null;
  current_price: number | null;
  lowest_seen_price: number | null;
  highest_seen_price: number | null;
  price_checks_count: number;
  last_checked_at: string | null;
  last_notified_at: string | null;
  notification_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CreatePriceAlertInput {
  deal_type: DealType;
  route_key: string;
  alert_type?: AlertType;
  target_price?: number;
  current_price?: number;
}

// ============================================
// DEAL CACHE (from background scanning)
// ============================================

export interface CachedDeal {
  id: string;
  deal_type: DealType;
  route_key: string;
  provider: string;
  date_range: string | null;
  deal_data: DealSnapshot;
  price_amount: number;
  price_currency: string;
  deal_score: number | null;
  deal_badges: DealBadge[];
  scanned_at: string;
  expires_at: string;
}

// ============================================
// PRICE HISTORY
// ============================================

export interface PriceHistoryPoint {
  price_amount: number;
  price_currency: string;
  recorded_at: string;
  provider: string;
}

// ============================================
// AFFILIATE CONFIG
// ============================================

export interface AffiliateConfig {
  provider: string;
  display_name: string;
  logo_url: string | null;
  deal_types: DealType[];
  affiliate_id: string | null;
  link_template: string | null;
  commission_model: string | null;
  is_active: boolean;
  priority: number;
}

// ============================================
// AFFILIATE LINK GENERATION
// ============================================

export interface GenerateAffiliateLinkParams {
  provider: string;
  deep_link?: string;
  origin?: string;
  destination?: string;
  date?: string;
  return_date?: string;
  query?: string;
  location?: string;
}
