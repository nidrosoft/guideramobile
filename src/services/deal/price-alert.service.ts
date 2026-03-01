/**
 * PRICE ALERT SERVICE
 *
 * Manages user price alerts for routes they want to monitor.
 * Integrates with the deal engine for background price checking.
 */

import { supabase } from '@/lib/supabase/client';
import type {
  PriceAlert,
  CreatePriceAlertInput,
  DealType,
} from './deal.types';

// ============================================
// CRUD
// ============================================

export async function createPriceAlert(
  userId: string,
  input: CreatePriceAlertInput
): Promise<{ data: PriceAlert | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: userId,
        deal_type: input.deal_type,
        route_key: input.route_key,
        alert_type: input.alert_type || 'price_drop',
        target_price: input.target_price || null,
        current_price: input.current_price || null,
        lowest_seen_price: input.current_price || null,
        highest_seen_price: input.current_price || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) return { data: null, error: error as unknown as Error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function getUserAlerts(
  userId: string,
  activeOnly = true
): Promise<{ data: PriceAlert[]; error: Error | null }> {
  try {
    let query = supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error as unknown as Error };
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

export async function deactivateAlert(
  alertId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('price_alerts')
      .update({ is_active: false })
      .eq('id', alertId);

    if (error) return { error: error as unknown as Error };
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function deleteAlert(
  alertId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', alertId);

    if (error) return { error: error as unknown as Error };
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function hasAlertForRoute(
  userId: string,
  routeKey: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('price_alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('route_key', routeKey)
      .eq('is_active', true)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// ============================================
// ROUTE KEY HELPERS
// ============================================

export function buildFlightRouteKey(
  origin: string,
  destination: string,
  date: string,
  returnDate?: string
): string {
  const parts = [origin, destination, date];
  if (returnDate) parts.push(returnDate);
  return parts.join('-');
}

export function buildHotelRouteKey(
  city: string,
  checkIn: string,
  checkOut: string
): string {
  return `hotel-${city.toLowerCase().replace(/\s+/g, '_')}-${checkIn}-${checkOut}`;
}

export function buildCarRouteKey(
  location: string,
  pickupDate: string,
  dropoffDate: string
): string {
  return `car-${location.toLowerCase().replace(/\s+/g, '_')}-${pickupDate}-${dropoffDate}`;
}

export function buildExperienceRouteKey(
  location: string,
  date: string
): string {
  return `exp-${location.toLowerCase().replace(/\s+/g, '_')}-${date}`;
}
