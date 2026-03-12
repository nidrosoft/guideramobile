/**
 * SCHEDULED JOBS EDGE FUNCTION
 *
 * Handles scheduled tasks for the deal aggregator:
 * - Scan deals (price polling from providers)
 * - Check price alerts (notify users of drops)
 * - Trip transitions (auto-update trip statuses)
 * - Cleanup expired data (deal cache, old price history)
 * - Update saved deals (refresh prices)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface JobResult {
  job: string;
  success: boolean;
  processed: number;
  errors: string[];
}

serve(async (req: Request) => {
  // Auth: allow pg_cron (no header), service_role Bearer, or CRON_SECRET
  // Platform JWT verification is disabled for this function (--no-verify-jwt)
  // so pg_cron can invoke it directly without auth headers

  const { jobType } = await req.json().catch(() => ({ jobType: 'all' }));
  const results: JobResult[] = [];

  try {
    switch (jobType) {
      case 'scan_deals':
        results.push(await scanDeals());
        break;
      case 'check_price_alerts':
        results.push(await checkPriceAlerts());
        break;
      case 'trip_transitions':
        results.push(await processTripTransitions());
        break;
      case 'cleanup':
        results.push(await cleanupExpiredData());
        break;
      case 'update_saved_deals':
        results.push(await updateSavedDeals());
        break;
      // GIL (Guidera Intelligence Layer) jobs
      case 'gil_compute_dna':
        results.push(await gilComputeDna());
        break;
      case 'gil_scan_explore':
        results.push(await gilScanDeals('explore'));
        break;
      case 'gil_scan_heritage':
        results.push(await gilScanDeals('heritage'));
        break;
      case 'gil_scan_popular':
        results.push(await gilScanDeals('popular'));
        break;
      case 'gil_scan_hotels':
        results.push(await gilScanDeals('hotels'));
        break;
      case 'gil_scan_alerts':
        results.push(await gilScanDeals('alerts'));
        break;
      case 'gil_scan_experiences':
        results.push(await gilScanDeals('experiences'));
        break;
      case 'gil_dispatch_notifications':
        results.push(await gilDispatchNotifications());
        break;
      case 'gil_all':
        results.push(await gilComputeDna());
        results.push(await gilScanDeals('explore'));
        results.push(await gilScanDeals('heritage'));
        results.push(await gilScanDeals('hotels'));
        results.push(await gilScanDeals('experiences'));
        results.push(await gilDispatchNotifications());
        break;
      case 'monitor_flights':
        results.push(await monitorFlights());
        break;
      case 'all':
      default:
        results.push(await scanDeals());
        results.push(await checkPriceAlerts());
        results.push(await processTripTransitions());
        results.push(await updateSavedDeals());
        results.push(await monitorFlights());
        break;
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Scheduled job error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// ============================================
// SCAN DEALS — Poll providers for popular routes
// ============================================

async function scanDeals(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  try {
    // Get popular routes from recent searches
    const { data: recentSearches } = await supabase
      .from('search_sessions')
      .select('query_params')
      .order('created_at', { ascending: false })
      .limit(100);

    // Extract unique route keys
    const routeMap = new Map<string, any>();
    for (const session of recentSearches || []) {
      const params = session.query_params;
      if (!params?.origin || !params?.destination) continue;
      const key = `${params.origin}-${params.destination}`;
      if (!routeMap.has(key)) {
        routeMap.set(key, params);
      }
    }

    // Scan top 20 routes
    const routes = Array.from(routeMap.entries()).slice(0, 20);

    for (const [routeKey, params] of routes) {
      try {
        // Call provider-manager for flight search
        const { data, error } = await supabase.functions.invoke('provider-manager', {
          body: {
            action: 'searchFlights',
            params: {
              segments: [{
                origin: params.origin,
                destination: params.destination,
                departureDate: params.departureDate || getDefaultDate(14),
              }],
              travelers: { adults: 1 },
              currency: 'USD',
              limit: 5,
            },
          },
        });

        if (error) throw error;

        const flights = data?.flights || data?.results || [];
        if (!Array.isArray(flights) || flights.length === 0) continue;

        // Find best price
        const bestFlight = flights.reduce((min: any, f: any) =>
          (f.price?.amount || Infinity) < (min.price?.amount || Infinity) ? f : min
        , flights[0]);

        const price = bestFlight.price?.amount || 0;
        if (price <= 0) continue;

        // Get historical stats for deal scoring
        const { data: history } = await supabase
          .from('price_history')
          .select('price_amount')
          .eq('route_key', routeKey)
          .eq('deal_type', 'flight')
          .order('recorded_at', { ascending: false })
          .limit(30);

        const scores = scoreDeal(price, history?.map(h => h.price_amount) || []);

        // Upsert into deal_cache
        await supabase
          .from('deal_cache')
          .upsert({
            deal_type: 'flight',
            route_key: routeKey,
            provider: bestFlight.provider?.code || 'unknown',
            date_range: params.departureDate || getDefaultDate(14),
            deal_data: {
              title: `${params.origin} → ${params.destination}`,
              provider: bestFlight.provider,
              price: bestFlight.price,
              flight: {
                outbound: bestFlight.outbound,
                totalStops: bestFlight.totalStops,
                totalDuration: bestFlight.totalDurationMinutes,
              },
            },
            price_amount: price,
            price_currency: bestFlight.price?.currency || 'USD',
            deal_score: scores.score,
            deal_badges: scores.badges,
            scanned_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: 'deal_type,route_key,provider,date_range' });

        // Record price history
        await supabase.from('price_history').insert({
          route_key: routeKey,
          deal_type: 'flight',
          provider: bestFlight.provider?.code || 'unknown',
          date_range: params.departureDate,
          price_amount: price,
          price_currency: bestFlight.price?.currency || 'USD',
        });

        processed++;
      } catch (err: any) {
        errors.push(`Route ${routeKey}: ${err.message}`);
      }
    }
  } catch (err: any) {
    errors.push(`scanDeals: ${err.message}`);
  }

  return { job: 'scan_deals', success: errors.length === 0, processed, errors };
}

// ============================================
// CHECK PRICE ALERTS — Notify users of drops
// ============================================

async function checkPriceAlerts(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  try {
    const { data: alerts } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('is_active', true)
      .or('last_checked_at.is.null,last_checked_at.lt.' + new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .limit(50);

    for (const alert of alerts || []) {
      try {
        // Look up latest cached price for this route
        const { data: cached } = await supabase
          .from('deal_cache')
          .select('price_amount')
          .eq('route_key', alert.route_key)
          .eq('deal_type', alert.deal_type)
          .order('scanned_at', { ascending: false })
          .limit(1)
          .single();

        if (!cached) continue;

        const currentPrice = cached.price_amount;
        const shouldNotify = shouldSendAlert(alert, currentPrice);

        // Update alert with latest price
        const updateData: any = {
          current_price: currentPrice,
          price_checks_count: (alert.price_checks_count || 0) + 1,
          last_checked_at: new Date().toISOString(),
        };

        if (currentPrice < (alert.lowest_seen_price || Infinity)) {
          updateData.lowest_seen_price = currentPrice;
        }
        if (currentPrice > (alert.highest_seen_price || 0)) {
          updateData.highest_seen_price = currentPrice;
        }

        if (shouldNotify) {
          updateData.last_notified_at = new Date().toISOString();
          updateData.notification_count = (alert.notification_count || 0) + 1;

          // Create an alert notification
          await supabase.from('alerts').insert({
            user_id: alert.user_id,
            category_id: null,
            type_code: 'price_drop',
            title: 'Price Drop Alert',
            body: `Price for ${alert.route_key} dropped to $${currentPrice}`,
            data: {
              route_key: alert.route_key,
              deal_type: alert.deal_type,
              old_price: alert.current_price,
              new_price: currentPrice,
            },
            priority: 'high',
            status: 'pending',
          });
        }

        await supabase
          .from('price_alerts')
          .update(updateData)
          .eq('id', alert.id);

        processed++;
      } catch (err: any) {
        errors.push(`Alert ${alert.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    errors.push(`checkPriceAlerts: ${err.message}`);
  }

  return { job: 'check_price_alerts', success: errors.length === 0, processed, errors };
}

// ============================================
// UPDATE SAVED DEALS — Refresh prices
// ============================================

async function updateSavedDeals(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  try {
    // Get saved deals that haven't been updated in 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: deals } = await supabase
      .from('saved_deals')
      .select('*')
      .eq('is_expired', false)
      .lt('updated_at', oneDayAgo)
      .limit(50);

    for (const deal of deals || []) {
      try {
        // Check deal_cache for latest price
        const { data: cached } = await supabase
          .from('deal_cache')
          .select('price_amount')
          .eq('route_key', deal.route_key)
          .eq('deal_type', deal.deal_type)
          .order('scanned_at', { ascending: false })
          .limit(1)
          .single();

        if (!cached) continue;

        const priceDiff = cached.price_amount - deal.price_at_save;
        const pctChange = (priceDiff / deal.price_at_save) * 100;

        await supabase
          .from('saved_deals')
          .update({
            current_price: cached.price_amount,
            price_changed: Math.abs(pctChange) > 2,
            price_change_pct: Math.round(pctChange * 10) / 10,
            updated_at: new Date().toISOString(),
          })
          .eq('id', deal.id);

        processed++;
      } catch (err: any) {
        errors.push(`Deal ${deal.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    errors.push(`updateSavedDeals: ${err.message}`);
  }

  return { job: 'update_saved_deals', success: errors.length === 0, processed, errors };
}

// ============================================
// TRIP TRANSITIONS
// ============================================

async function processTripTransitions(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;
  const now = new Date().toISOString();

  try {
    // confirmed → upcoming (30 days before start)
    const { data: needUpcoming } = await supabase
      .from('trips')
      .select('id, status')
      .eq('status', 'confirmed')
      .lte('transition_to_upcoming_at', now)
      .is('deleted_at', null);

    for (const trip of needUpcoming || []) {
      try {
        await supabase.from('trips').update({
          status: 'upcoming',
          previous_status: 'confirmed',
          status_changed_at: now,
          status_change_reason: 'Auto-transition: 30 days before trip',
        }).eq('id', trip.id);
        processed++;
      } catch (err: any) {
        errors.push(`Trip ${trip.id} → upcoming: ${err.message}`);
      }
    }

    // confirmed/upcoming → ongoing (start date)
    const { data: needOngoing } = await supabase
      .from('trips')
      .select('id, status, owner_id')
      .in('status', ['confirmed', 'upcoming'])
      .lte('transition_to_ongoing_at', now)
      .is('deleted_at', null);

    for (const trip of needOngoing || []) {
      try {
        await supabase.from('trips').update({
          status: 'ongoing',
          previous_status: trip.status,
          status_changed_at: now,
          started_at: now,
          status_change_reason: 'Auto-transition: trip started',
        }).eq('id', trip.id);
        processed++;
      } catch (err: any) {
        errors.push(`Trip ${trip.id} → ongoing: ${err.message}`);
      }
    }

    // ongoing → completed (end date)
    const { data: needCompleted } = await supabase
      .from('trips')
      .select('id, status, owner_id')
      .eq('status', 'ongoing')
      .lte('transition_to_completed_at', now)
      .is('deleted_at', null);

    for (const trip of needCompleted || []) {
      try {
        await supabase.from('trips').update({
          status: 'completed',
          previous_status: 'ongoing',
          status_changed_at: now,
          completed_at: now,
          status_change_reason: 'Auto-transition: trip ended',
        }).eq('id', trip.id);
        processed++;
      } catch (err: any) {
        errors.push(`Trip ${trip.id} → completed: ${err.message}`);
      }
    }

    // Expire old invitations
    await supabase
      .from('trip_invitations')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('token_expires_at', now);

  } catch (err: any) {
    errors.push(`tripTransitions: ${err.message}`);
  }

  return { job: 'trip_transitions', success: errors.length === 0, processed, errors };
}

// ============================================
// CLEANUP EXPIRED DATA
// ============================================

async function cleanupExpiredData(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  try {
    // Delete expired deal cache
    const { count: cacheDeleted } = await supabase
      .from('deal_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());
    processed += cacheDeleted || 0;

    // Delete price history older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { count: historyDeleted } = await supabase
      .from('price_history')
      .delete()
      .lt('recorded_at', ninetyDaysAgo);
    processed += historyDeleted || 0;

    // Mark expired saved deals
    await supabase
      .from('saved_deals')
      .update({ is_expired: true })
      .lt('expires_at', new Date().toISOString())
      .eq('is_expired', false);

    // Archive old completed jobs
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: jobsDeleted } = await supabase
      .from('scheduled_jobs')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', thirtyDaysAgo);
    processed += jobsDeleted || 0;
  } catch (err: any) {
    errors.push(err.message);
  }

  return { job: 'cleanup', success: errors.length === 0, processed, errors };
}

// ============================================
// MONITOR FLIGHTS — Check upcoming flights for delays/cancellations
// ============================================

async function monitorFlights(): Promise<JobResult> {
  const errors: string[] = [];
  let processed = 0;

  try {
    // Get flights departing in the next 48 hours from trip_bookings
    const now = new Date();
    const fortyEightHours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const { data: bookings } = await supabase
      .from('trip_bookings')
      .select('id, trip_id, type, details, trips!inner(owner_id, title, destination)')
      .eq('type', 'flight')
      .gte('start_date', now.toISOString())
      .lte('start_date', fortyEightHours.toISOString());

    for (const booking of bookings || []) {
      try {
        const details = booking.details as any;
        const flightNumber = details?.flightNumber;
        const departureTime = details?.departure?.time;
        if (!flightNumber || !departureTime) continue;

        const trip = (booking as any).trips;
        const userId = trip?.owner_id;
        if (!userId) continue;

        const date = new Date(departureTime).toISOString().split('T')[0];

        // Call flight-tracking edge function for status
        const { data: trackingData, error: trackErr } = await supabase.functions.invoke('flight-tracking', {
          body: { action: 'status', flightNumber, date },
        });

        if (trackErr || !trackingData?.success) continue;

        const flight = trackingData.data?.flight;
        if (!flight) continue;

        const status = flight.status?.toLowerCase();
        const delay = flight.departure?.delay;
        const newGate = flight.departure?.gate;

        // Check if we already alerted about this flight recently
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
        const { data: recentAlerts } = await supabase
          .from('alerts')
          .select('id, alert_type_code')
          .eq('user_id', userId)
          .gte('created_at', twoHoursAgo)
          .like('context', `%${flightNumber}%`)
          .limit(1);

        // Flight delayed
        if (delay && delay > 15 && (!recentAlerts || recentAlerts.length === 0)) {
          const newTime = flight.departure?.estimatedTime || flight.departure?.scheduledTime || departureTime;
          await supabase.from('alerts').insert({
            user_id: userId,
            alert_type_code: 'flight_delay',
            category_code: 'trip',
            title: `⏰ Flight ${flightNumber} Delayed`,
            body: `Your flight is delayed by ${delay} minutes. New departure: ${new Date(newTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`,
            context: { flightNumber, delay, newTime, tripId: booking.trip_id, bookingId: booking.id },
            action_url: `/trip/${booking.trip_id}`,
            priority: 8,
            channels_requested: ['push', 'in_app'],
            trip_id: booking.trip_id,
            status: 'pending',
          });
          processed++;
        }

        // Flight cancelled
        if (status === 'cancelled' && (!recentAlerts || !recentAlerts.some((a: any) => a.alert_type_code === 'flight_cancelled'))) {
          await supabase.from('alerts').insert({
            user_id: userId,
            alert_type_code: 'flight_cancelled',
            category_code: 'trip',
            title: `❌ Flight ${flightNumber} Cancelled`,
            body: `Your flight has been cancelled. Check with your airline for rebooking options.`,
            context: { flightNumber, tripId: booking.trip_id, bookingId: booking.id },
            action_url: `/trip/${booking.trip_id}`,
            priority: 10,
            channels_requested: ['push', 'in_app', 'sms'],
            trip_id: booking.trip_id,
            status: 'pending',
          });
          processed++;
        }

        // Gate change
        if (newGate && details?.departure?.gate && newGate !== details.departure.gate) {
          await supabase.from('alerts').insert({
            user_id: userId,
            alert_type_code: 'flight_gate_change',
            category_code: 'trip',
            title: `🚪 Gate Changed: ${flightNumber}`,
            body: `Your gate has changed from ${details.departure.gate} to ${newGate}.`,
            context: { flightNumber, oldGate: details.departure.gate, newGate, tripId: booking.trip_id },
            action_url: `/trip/${booking.trip_id}`,
            priority: 7,
            channels_requested: ['push', 'in_app'],
            trip_id: booking.trip_id,
            status: 'pending',
          });
          processed++;
        }
      } catch (err: any) {
        errors.push(`Flight ${booking.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    errors.push(`monitorFlights: ${err.message}`);
  }

  return { job: 'monitor_flights', success: errors.length === 0, processed, errors };
}

// ============================================
// HELPERS
// ============================================

function getDefaultDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

function scoreDeal(
  currentPrice: number,
  historicalPrices: number[]
): { score: number; badges: string[] } {
  if (historicalPrices.length === 0) {
    return { score: 50, badges: [] };
  }

  const sorted = [...historicalPrices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const avg = historicalPrices.reduce((s, p) => s + p, 0) / historicalPrices.length;

  const pctBelowMedian = ((median - currentPrice) / median) * 100;
  const pctBelowAvg = ((avg - currentPrice) / avg) * 100;
  const isNearLow = currentPrice <= min * 1.1;
  const isRecordLow = currentPrice <= min;

  // Score: 0-100 (higher = better deal)
  let score = 50;
  score += Math.min(pctBelowMedian * 2, 30); // Up to 30 pts for being below median
  score += Math.min(pctBelowAvg, 10);         // Up to 10 pts for being below avg
  if (isRecordLow) score += 10;
  if (isNearLow) score += 5;
  score = Math.max(0, Math.min(100, score));

  const badges: string[] = [];
  if (isRecordLow) badges.push('record_low');
  else if (isNearLow) badges.push('near_record_low');
  if (pctBelowMedian > 25) badges.push('best_price');
  else if (pctBelowMedian > 15) badges.push('price_drop');

  return { score: Math.round(score), badges };
}

// ============================================
// GIL CRON JOBS — Invoke GIL edge functions
// ============================================

async function gilComputeDna(): Promise<JobResult> {
  const errors: string[] = [];
  try {
    const { data, error } = await supabase.functions.invoke('compute-travel-dna', {
      body: { batch: true },
    });
    if (error) throw error;
    return { job: 'gil_compute_dna', success: true, processed: data?.processed || 0, errors };
  } catch (err: any) {
    errors.push(err.message);
    return { job: 'gil_compute_dna', success: false, processed: 0, errors };
  }
}

async function gilScanDeals(scanType: string): Promise<JobResult> {
  const errors: string[] = [];
  try {
    const { data, error } = await supabase.functions.invoke('deal-scanner', {
      body: { scan_type: scanType, batch_size: 20 },
    });
    if (error) throw error;
    return {
      job: `gil_scan_${scanType}`,
      success: data?.success ?? true,
      processed: data?.deals_cached || 0,
      errors: data?.errors || [],
    };
  } catch (err: any) {
    errors.push(err.message);
    return { job: `gil_scan_${scanType}`, success: false, processed: 0, errors };
  }
}

async function gilDispatchNotifications(): Promise<JobResult> {
  const errors: string[] = [];
  try {
    const { data, error } = await supabase.functions.invoke('deal-notifier', {
      body: { limit: 50 },
    });
    if (error) throw error;
    return {
      job: 'gil_dispatch_notifications',
      success: true,
      processed: data?.sent || 0,
      errors: data?.errors || [],
    };
  } catch (err: any) {
    errors.push(err.message);
    return { job: 'gil_dispatch_notifications', success: false, processed: 0, errors };
  }
}

function shouldSendAlert(alert: any, currentPrice: number): boolean {
  // Don't spam — max once per 24h
  if (alert.last_notified_at) {
    const hoursSinceNotify = (Date.now() - new Date(alert.last_notified_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceNotify < 24) return false;
  }

  switch (alert.alert_type) {
    case 'target_price':
      return alert.target_price != null && currentPrice <= alert.target_price;
    case 'price_drop': {
      if (!alert.current_price) return false;
      const dropPct = ((alert.current_price - currentPrice) / alert.current_price) * 100;
      return dropPct >= 10; // 10%+ drop
    }
    case 'any_change': {
      if (!alert.current_price) return false;
      const changePct = Math.abs((alert.current_price - currentPrice) / alert.current_price) * 100;
      return changePct >= 5; // 5%+ change
    }
    default:
      return false;
  }
}
