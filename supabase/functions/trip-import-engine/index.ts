/**
 * TRIP IMPORT ENGINE
 * 
 * Provider-agnostic orchestrator for importing trips from external sources.
 * Supports: email scanning (Traxo, AwardWallet), manual entry, ticket scanning.
 * 
 * Architecture:
 * - Stateless edge function — all state lives in DB (email_scan_jobs, trip_imports, trips)
 * - Provider adapters are pluggable — add new providers without changing the core
 * - Async by design — long-running scans use job polling pattern
 * 
 * Actions:
 *   connect-email    → Initiate email connection via provider OAuth
 *   check-connection → Poll connection status
 *   start-scan       → Begin scanning connected email for bookings
 *   check-scan       → Poll scan progress & get detected bookings
 *   import-bookings  → Import user-selected bookings into trips
 *   create-trip      → Create a trip from imported bookings
 *   disconnect       → Remove email connection
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// PROVIDER CONFIGURATION
// ============================================

interface ProviderConfig {
  name: string;
  baseUrl: string;
  authType: 'oauth2' | 'apikey';
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
}

function getProviderConfig(provider: string): ProviderConfig {
  switch (provider) {
    case 'traxo':
      return {
        name: 'Traxo',
        baseUrl: 'https://api.traxo.com/v2',
        authType: 'oauth2',
        clientId: Deno.env.get('TRAXO_CLIENT_ID') || '',
        clientSecret: Deno.env.get('TRAXO_CLIENT_SECRET') || '',
      };
    case 'awardwallet':
      return {
        name: 'AwardWallet',
        baseUrl: 'https://service.awardwallet.com/email/json/v2',
        authType: 'apikey',
        apiKey: Deno.env.get('AWARDWALLET_API_KEY') || '',
      };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ============================================
// TRAXO ADAPTER
// ============================================

class TraxoAdapter {
  private config: ProviderConfig;
  private supabase: any;

  constructor(supabase: any) {
    this.config = getProviderConfig('traxo');
    this.supabase = supabase;
  }

  /**
   * Get OAuth authorization URL for Traxo
   * User will be redirected here to grant email access
   */
  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId!,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });
    return `https://www.traxo.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange OAuth code for access token
   */
  async exchangeCode(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    member_id: string;
  }> {
    const response = await fetch('https://www.traxo.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Traxo token exchange failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh an expired access token
   */
  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const response = await fetch('https://www.traxo.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Traxo token');
    }

    return response.json();
  }

  /**
   * Get member profile from Traxo
   */
  async getMember(accessToken: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/members/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error('Failed to get Traxo member');
    return response.json();
  }

  /**
   * Fetch trips from Traxo member account
   * This returns parsed trip data from the user's connected email
   */
  async getTrips(accessToken: string, params?: {
    status?: string;
    since?: string;
    until?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.since) queryParams.set('since', params.since);
    if (params?.until) queryParams.set('until', params.until);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.offset) queryParams.set('offset', String(params.offset));

    const url = `${this.config.baseUrl}/trips?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch Traxo trips: ${error}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * Fetch segments (individual bookings) for a trip
   */
  async getTripSegments(accessToken: string, tripId: string): Promise<any[]> {
    const response = await fetch(`${this.config.baseUrl}/trips/${tripId}/segments`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error(`Failed to fetch segments for trip ${tripId}`);
    const data = await response.json();
    return data.data || data;
  }

  /**
   * Fetch all segments (bookings) directly
   */
  async getSegments(accessToken: string, params?: {
    type?: string;
    since?: string;
    until?: string;
    limit?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.set('type', params.type);
    if (params?.since) queryParams.set('since', params.since);
    if (params?.until) queryParams.set('until', params.until);
    if (params?.limit) queryParams.set('limit', String(params.limit || 50));

    const url = `${this.config.baseUrl}/segments?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error('Failed to fetch Traxo segments');
    const data = await response.json();
    return data.data || data;
  }

  /**
   * Normalize Traxo trip data into Guidera's standard format
   */
  normalizeTrip(traxoTrip: any): NormalizedTrip {
    return {
      externalId: String(traxoTrip.id),
      provider: 'traxo',
      title: traxoTrip.headline || traxoTrip.destination || 'Imported Trip',
      destination: {
        name: traxoTrip.destination || '',
        city: traxoTrip.destination_city || '',
        country: traxoTrip.destination_country || '',
        countryCode: traxoTrip.destination_country_code || '',
        latitude: traxoTrip.destination_latitude,
        longitude: traxoTrip.destination_longitude,
      },
      startDate: traxoTrip.begin_datetime || traxoTrip.start_date,
      endDate: traxoTrip.end_datetime || traxoTrip.end_date,
      status: traxoTrip.status || 'confirmed',
      segmentCount: traxoTrip.segment_count || 0,
      segments: [],
      rawData: traxoTrip,
    };
  }

  /**
   * Normalize a Traxo segment into Guidera's booking format
   */
  normalizeSegment(segment: any): NormalizedBooking {
    const type = (segment.type || segment.segment_type || '').toLowerCase();
    let category: string;

    switch (type) {
      case 'air': case 'flight': category = 'flight'; break;
      case 'hotel': case 'lodging': category = 'hotel'; break;
      case 'car': case 'car_rental': category = 'car'; break;
      case 'rail': case 'train': category = 'train'; break;
      case 'cruise': category = 'cruise'; break;
      default: category = 'other';
    }

    return {
      externalId: String(segment.id),
      provider: 'traxo',
      category,
      title: segment.headline || segment.summary || `${category} booking`,
      confirmationNumber: segment.confirmation_no || segment.record_locator,
      providerName: segment.supplier_name || segment.vendor_name,
      status: segment.status || 'confirmed',
      startDate: segment.begin_datetime,
      endDate: segment.end_datetime,
      startLocation: {
        name: segment.begin_location_name || segment.origin_name,
        code: segment.begin_location_code || segment.origin_code,
        city: segment.begin_city_name,
        country: segment.begin_country_name,
        latitude: segment.begin_latitude,
        longitude: segment.begin_longitude,
      },
      endLocation: {
        name: segment.end_location_name || segment.destination_name,
        code: segment.end_location_code || segment.destination_code,
        city: segment.end_city_name,
        country: segment.end_country_name,
        latitude: segment.end_latitude,
        longitude: segment.end_longitude,
      },
      pricing: {
        total: segment.total_cost,
        currency: segment.currency || 'USD',
      },
      travelers: segment.travelers || [],
      details: segment,
      rawData: segment,
    };
  }
}

// ============================================
// NORMALIZED TYPES (Provider-Agnostic)
// ============================================

interface NormalizedTrip {
  externalId: string;
  provider: string;
  title: string;
  destination: {
    name: string;
    city: string;
    country: string;
    countryCode: string;
    latitude?: number;
    longitude?: number;
  };
  startDate: string;
  endDate: string;
  status: string;
  segmentCount: number;
  segments: NormalizedBooking[];
  rawData: any;
}

interface NormalizedBooking {
  externalId: string;
  provider: string;
  category: string;
  title: string;
  confirmationNumber?: string;
  providerName?: string;
  status: string;
  startDate: string;
  endDate?: string;
  startLocation: {
    name?: string;
    code?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  endLocation: {
    name?: string;
    code?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  pricing?: {
    total?: number;
    currency?: string;
  };
  travelers?: any[];
  details?: any;
  rawData: any;
}

// ============================================
// TRIP ASSEMBLY ENGINE
// ============================================

class TripAssemblyEngine {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Find an existing trip that matches the imported data
   */
  async findMatchingTrip(userId: string, normalizedTrip: NormalizedTrip): Promise<string | null> {
    // Strategy 1: Match by destination + overlapping dates
    if (normalizedTrip.destination?.name && normalizedTrip.startDate) {
      const { data } = await this.supabase
        .from('trips')
        .select('id')
        .eq('user_id', userId)
        .or(`primary_destination_name.ilike.%${normalizedTrip.destination.city}%,primary_destination_name.ilike.%${normalizedTrip.destination.name}%`)
        .lte('start_date', normalizedTrip.endDate || normalizedTrip.startDate)
        .gte('end_date', normalizedTrip.startDate)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle();

      if (data) return data.id;
    }

    return null;
  }

  /**
   * Create a new trip from normalized import data
   */
  async createTrip(userId: string, normalizedTrip: NormalizedTrip): Promise<string> {
    const title = this.generateTripTitle(normalizedTrip);
    
    const { data, error } = await this.supabase
      .from('trips')
      .insert({
        user_id: userId,
        owner_id: userId,
        title,
        destination: {
          name: normalizedTrip.destination.name,
          city: normalizedTrip.destination.city,
          country: normalizedTrip.destination.country,
          countryCode: normalizedTrip.destination.countryCode,
          latitude: normalizedTrip.destination.latitude,
          longitude: normalizedTrip.destination.longitude,
        },
        primary_destination_name: normalizedTrip.destination.city || normalizedTrip.destination.name,
        primary_destination_country: normalizedTrip.destination.country,
        primary_destination_code: normalizedTrip.destination.countryCode,
        start_date: normalizedTrip.startDate?.split('T')[0],
        end_date: normalizedTrip.endDate?.split('T')[0] || normalizedTrip.startDate?.split('T')[0],
        state: 'draft',
        status: 'planning',
        created_via: `import_${normalizedTrip.provider}`,
        import_sources: [{ provider: normalizedTrip.provider, externalId: normalizedTrip.externalId }],
      })
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create trip: ${error.message}`);
    return data.id;
  }

  /**
   * Add a booking to a trip
   */
  async addBookingToTrip(
    userId: string,
    tripId: string,
    booking: NormalizedBooking,
    scanJobId?: string
  ): Promise<string> {
    // Create the import record
    const { data: importRecord, error: importError } = await this.supabase
      .from('trip_imports')
      .insert({
        user_id: userId,
        trip_id: tripId,
        import_method: 'email',
        provider: booking.provider,
        provider_booking_id: booking.externalId,
        scan_job_id: scanJobId,
        parsed_data: booking.rawData,
        normalized_data: booking,
        parse_status: 'parsed',
        overall_confidence: 0.95,
        processing_status: 'processed',
        parsed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (importError) throw new Error(`Failed to create import record: ${importError.message}`);

    // Create the trip_bookings link
    const { error: bookingError } = await this.supabase
      .from('trip_bookings')
      .insert({
        trip_id: tripId,
        booking_id: importRecord.id,  // Using import ID as booking ref
        category: booking.category,
        booking_reference: booking.confirmationNumber,
        summary_title: booking.title,
        summary_subtitle: booking.providerName || '',
        summary_datetime: booking.startDate,
        summary_price: booking.pricing?.total,
        summary_status: booking.status,
        source: `import_${booking.provider}`,
        import_id: importRecord.id,
        added_by: userId,
      });

    if (bookingError) {
      console.warn('Failed to link booking to trip:', bookingError.message);
    }

    // Update trip booking counts
    await this.updateTripBookingCounts(tripId);

    return importRecord.id;
  }

  /**
   * Update trip metadata after bookings change
   */
  async updateTripBookingCounts(tripId: string): Promise<void> {
    const { data: bookings } = await this.supabase
      .from('trip_bookings')
      .select('category, summary_price')
      .eq('trip_id', tripId);

    if (!bookings) return;

    const counts = {
      booking_count: bookings.length,
      has_flights: bookings.some((b: any) => b.category === 'flight'),
      has_hotels: bookings.some((b: any) => b.category === 'hotel'),
      has_cars: bookings.some((b: any) => b.category === 'car'),
      has_experiences: bookings.some((b: any) => b.category === 'experience'),
      flight_count: bookings.filter((b: any) => b.category === 'flight').length,
      hotel_count: bookings.filter((b: any) => b.category === 'hotel').length,
      car_count: bookings.filter((b: any) => b.category === 'car').length,
      experience_count: bookings.filter((b: any) => b.category === 'experience').length,
      total_booked_amount: bookings.reduce((sum: number, b: any) => sum + (b.summary_price || 0), 0),
      updated_at: new Date().toISOString(),
    };

    await this.supabase.from('trips').update(counts).eq('id', tripId);
  }

  private generateTripTitle(trip: NormalizedTrip): string {
    const dest = trip.destination.city || trip.destination.name || 'Trip';
    if (trip.startDate) {
      const date = new Date(trip.startDate);
      const month = date.toLocaleString('en-US', { month: 'short' });
      return `${dest} ${month} ${date.getFullYear()}`;
    }
    return `Trip to ${dest}`;
  }
}

// ============================================
// REQUEST HANDLERS
// ============================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================
    // GET — Handle OAuth callback redirect from Traxo
    // Traxo redirects here with ?code=xxx&state=xxx after user grants access
    // ========================================
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code || !state) {
        return new Response('<html><body><h2>Missing OAuth parameters</h2><p>Please try again from the Guidera app.</p></body></html>', {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      try {
        const traxo = new TraxoAdapter(supabase);

        // Find the pending OAuth job by state to get the userId
        const { data: pendingJob } = await supabase
          .from('email_scan_jobs')
          .select('id, user_id')
          .eq('scan_type', 'oauth_pending')
          .eq('status', 'connecting')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const userId = pendingJob?.user_id;
        const redirectUri = `${supabaseUrl}/functions/v1/trip-import-engine`;

        // Exchange the code for tokens
        const tokens = await traxo.exchangeCode(code, redirectUri);

        // Get member info
        const member = await traxo.getMember(tokens.access_token);

        // Store the linked account
        if (userId) {
          await supabase.from('linked_travel_accounts').upsert({
            user_id: userId,
            provider: 'traxo',
            provider_user_id: String(tokens.member_id || member.id),
            provider_email: member.email || '',
            provider_name: [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Traxo User',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
            status: 'active',
            last_sync_at: new Date().toISOString(),
          }, { onConflict: 'user_id,provider' });

          // Update the pending job
          if (pendingJob) {
            await supabase.from('email_scan_jobs').update({
              status: 'completed',
              email_address: member.email || 'connected',
              scan_type: 'oauth_completed',
            }).eq('id', pendingJob.id);
          }
        }

        // Redirect user back to the app
        const appDeepLink = `guidera://import/oauth-callback?success=true&email=${encodeURIComponent(member.email || '')}`;
        return new Response(null, {
          status: 302,
          headers: { 'Location': appDeepLink },
        });
      } catch (oauthErr: any) {
        console.error('OAuth callback error:', oauthErr);
        const errorLink = `guidera://import/oauth-callback?success=false&error=${encodeURIComponent(oauthErr?.message || 'OAuth failed')}`;
        return new Response(null, {
          status: 302,
          headers: { 'Location': errorLink },
        });
      }
    }

    // ========================================
    // POST — Normal API actions
    // ========================================

    // Parse body first to get userId (we use Clerk auth, not Supabase auth)
    const body = await req.json();
    const { action, provider = 'traxo', userId: bodyUserId, ...params } = body;

    // userId comes from the request body (set by frontend via tripImportEngine.setUserId)
    const userId: string | null = bodyUserId || null;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required. Please sign in.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const traxo = new TraxoAdapter(supabase);
    const assembler = new TripAssemblyEngine(supabase);

    let result: any;

    switch (action) {
      // ========================================
      // CONNECT EMAIL — Get OAuth URL
      // ========================================
      case 'connect-email': {
        const { redirectUri } = params;
        const state = crypto.randomUUID();

        // Store state for verification
        await supabase.from('email_scan_jobs').insert({
          user_id: userId,
          provider,
          email_address: 'pending',
          scan_type: 'oauth_pending',
          status: 'connecting',
          provider_response: { oauth_state: state },
        });

        const authUrl = traxo.getAuthUrl(redirectUri, state);
        result = { authUrl, state };
        break;
      }

      // ========================================
      // OAUTH CALLBACK — Exchange code for token
      // ========================================
      case 'oauth-callback': {
        const { code, redirectUri, state } = params;

        // Exchange code for tokens
        const tokens = await traxo.exchangeCode(code, redirectUri);

        // Get member info
        const member = await traxo.getMember(tokens.access_token);

        // Store the linked account
        const { data: account, error } = await supabase
          .from('linked_travel_accounts')
          .upsert({
            user_id: userId,
            provider: 'traxo',
            provider_member_id: String(tokens.member_id || member.id),
            provider_email: member.email,
            provider_name: member.first_name ? `${member.first_name} ${member.last_name}` : member.email,
            provider_access_token: tokens.access_token,
            provider_refresh_token: tokens.refresh_token,
            provider_token_type: tokens.token_type || 'Bearer',
            provider_token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
            connection_method: 'oauth',
            status: 'active',
            auto_sync_enabled: true,
            sync_frequency: 'daily',
            import_flights: true,
            import_hotels: true,
            import_cars: true,
            import_experiences: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,provider' })
          .select()
          .single();

        if (error) throw new Error(`Failed to store account: ${error.message}`);

        result = {
          connected: true,
          accountId: account.id,
          email: member.email,
          memberName: account.provider_name,
        };
        break;
      }

      // ========================================
      // START SCAN — Begin fetching bookings
      // ========================================
      case 'start-scan': {
        const { lookbackDays = 60, accountId } = params;

        // Get the linked account
        const { data: account } = await supabase
          .from('linked_travel_accounts')
          .select('*')
          .eq('id', accountId || '')
          .eq('user_id', userId)
          .maybeSingle();

        // Fallback: get any active account for this provider
        const linkedAccount = account || (await supabase
          .from('linked_travel_accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('provider', provider)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        ).data;

        if (!linkedAccount) {
          throw new Error('No connected email account found. Please connect your email first.');
        }

        // Create scan job
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - lookbackDays);

        const { data: scanJob, error: jobError } = await supabase
          .from('email_scan_jobs')
          .insert({
            user_id: userId,
            provider,
            provider_member_id: linkedAccount.provider_member_id,
            email_address: linkedAccount.provider_email || 'connected',
            email_provider: 'traxo_oauth',
            scan_type: 'initial',
            scan_lookback_days: lookbackDays,
            scan_from_date: sinceDate.toISOString().split('T')[0],
            scan_to_date: new Date().toISOString().split('T')[0],
            status: 'scanning',
            started_at: new Date().toISOString(),
            progress: 10,
            progress_message: 'Connecting to your email...',
          })
          .select()
          .single();

        if (jobError) throw new Error(`Failed to create scan job: ${jobError.message}`);

        // Fetch trips from Traxo (async-like but executed inline for speed)
        try {
          await supabase.from('email_scan_jobs').update({
            progress: 30,
            progress_message: 'Scanning your inbox for travel bookings...',
          }).eq('id', scanJob.id);

          const accessToken = linkedAccount.provider_access_token;
          const trips = await traxo.getTrips(accessToken, {
            since: sinceDate.toISOString(),
            limit: 50,
          });

          await supabase.from('email_scan_jobs').update({
            progress: 60,
            progress_message: `Found ${trips.length} trips. Fetching booking details...`,
            emails_found: trips.length,
          }).eq('id', scanJob.id);

          // Normalize all trips and their segments
          const normalizedTrips: NormalizedTrip[] = [];

          for (const trip of trips) {
            const normalized = traxo.normalizeTrip(trip);

            // Fetch segments for each trip
            try {
              const segments = await traxo.getTripSegments(accessToken, String(trip.id));
              normalized.segments = segments.map((s: any) => traxo.normalizeSegment(s));
              normalized.segmentCount = normalized.segments.length;
            } catch (segErr) {
              console.warn(`Failed to fetch segments for trip ${trip.id}:`, segErr);
            }

            normalizedTrips.push(normalized);
          }

          // Count total bookings
          const totalBookings = normalizedTrips.reduce((sum, t) => sum + t.segments.length, 0);

          // Store results in the scan job
          await supabase.from('email_scan_jobs').update({
            status: 'completed',
            progress: 100,
            progress_message: `Found ${totalBookings} bookings across ${trips.length} trips`,
            emails_found: trips.length,
            emails_parsed: trips.length,
            bookings_detected: totalBookings,
            detected_bookings: normalizedTrips,
            completed_at: new Date().toISOString(),
          }).eq('id', scanJob.id);

          result = {
            scanJobId: scanJob.id,
            status: 'completed',
            tripsFound: normalizedTrips.length,
            bookingsFound: totalBookings,
            trips: normalizedTrips,
          };
        } catch (scanError: any) {
          // Update job with error
          await supabase.from('email_scan_jobs').update({
            status: 'failed',
            error_message: scanError.message,
            progress: 0,
            progress_message: 'Scan failed',
            completed_at: new Date().toISOString(),
          }).eq('id', scanJob.id);

          throw scanError;
        }
        break;
      }

      // ========================================
      // CHECK SCAN — Poll scan job status
      // ========================================
      case 'check-scan': {
        const { scanJobId } = params;

        const { data: job } = await supabase
          .from('email_scan_jobs')
          .select('*')
          .eq('id', scanJobId)
          .eq('user_id', userId)
          .single();

        if (!job) throw new Error('Scan job not found');

        result = {
          scanJobId: job.id,
          status: job.status,
          progress: job.progress,
          progressMessage: job.progress_message,
          tripsFound: (job.detected_bookings || []).length,
          bookingsFound: job.bookings_detected || 0,
          trips: job.status === 'completed' ? job.detected_bookings : undefined,
          error: job.error_message,
        };
        break;
      }

      // ========================================
      // IMPORT BOOKINGS — Import selected bookings into trips
      // ========================================
      case 'import-bookings': {
        const { scanJobId, selectedTrips } = params;
        // selectedTrips: Array of { externalId, segments: [externalId] } or just trip externalIds

        const { data: job } = await supabase
          .from('email_scan_jobs')
          .select('*')
          .eq('id', scanJobId)
          .eq('user_id', userId)
          .single();

        if (!job) throw new Error('Scan job not found');

        const normalizedTrips = job.detected_bookings as NormalizedTrip[];
        const importedTrips: Array<{ tripId: string; title: string; bookingsImported: number }> = [];

        for (const selection of (selectedTrips || normalizedTrips)) {
          // Find the normalized trip
          const externalId = typeof selection === 'string' ? selection : selection.externalId;
          const normalizedTrip = normalizedTrips.find(t => t.externalId === externalId) || selection;

          if (!normalizedTrip) continue;

          // Find or create trip in Guidera
          let tripId = await assembler.findMatchingTrip(userId!, normalizedTrip);

          if (!tripId) {
            tripId = await assembler.createTrip(userId!, normalizedTrip);
          }

          // Import each segment as a booking
          let bookingsImported = 0;
          const segments = normalizedTrip.segments || [];

          for (const segment of segments) {
            try {
              await assembler.addBookingToTrip(userId!, tripId, segment, scanJobId);
              bookingsImported++;
            } catch (err: any) {
              console.warn(`Failed to import segment ${segment.externalId}:`, err.message);
            }
          }

          importedTrips.push({
            tripId,
            title: normalizedTrip.title,
            bookingsImported,
          });
        }

        // Update scan job
        const totalImported = importedTrips.reduce((sum, t) => sum + t.bookingsImported, 0);
        await supabase.from('email_scan_jobs').update({
          bookings_imported: totalImported,
          selected_booking_ids: selectedTrips,
        }).eq('id', scanJobId);

        result = {
          imported: true,
          trips: importedTrips,
          totalBookingsImported: totalImported,
        };
        break;
      }

      // ========================================
      // GET CONNECTION STATUS
      // ========================================
      case 'get-connection': {
        const { data: accounts } = await supabase
          .from('linked_travel_accounts')
          .select('id, provider, provider_email, provider_name, status, last_sync_at, bookings_imported, created_at')
          .eq('user_id', userId)
          .eq('provider', provider)
          .neq('status', 'revoked');

        result = {
          connected: (accounts || []).length > 0,
          accounts: accounts || [],
        };
        break;
      }

      // ========================================
      // DISCONNECT
      // ========================================
      case 'disconnect': {
        const { accountId } = params;

        await supabase
          .from('linked_travel_accounts')
          .update({ status: 'revoked', updated_at: new Date().toISOString() })
          .eq('id', accountId)
          .eq('user_id', userId);

        result = { disconnected: true };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Trip import engine error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: error.message?.includes('Unauthorized') ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
