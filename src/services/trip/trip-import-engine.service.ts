/**
 * TRIP IMPORT ENGINE SERVICE (Frontend)
 * 
 * Provider-agnostic client for the trip-import-engine edge function.
 * Handles: email connection, scanning, booking import, trip creation.
 * 
 * Designed for scalability:
 * - All heavy lifting happens server-side (edge function)
 * - Client polls for progress on async operations
 * - Retry logic built in
 * - Email import now uses forward-based approach (emailImport.service.ts)
 * - This service is primarily used for ticket scanning (OCR)
 */

import { supabase } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

export type ImportProvider = 'traxo' | 'awardwallet' | 'email_forward';

export type ScanStatus = 'pending' | 'connecting' | 'scanning' | 'parsing' | 'completed' | 'failed' | 'cancelled';

export interface NormalizedLocation {
  name?: string;
  code?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface NormalizedBooking {
  externalId: string;
  provider: string;
  category: string;  // flight, hotel, car, train, cruise, other
  title: string;
  confirmationNumber?: string;
  providerName?: string;
  status: string;
  startDate: string;
  endDate?: string;
  startLocation: NormalizedLocation;
  endLocation: NormalizedLocation;
  pricing?: {
    total?: number;
    currency?: string;
  };
  travelers?: any[];
  details?: any;
  rawData?: any;
}

export interface NormalizedTrip {
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
  rawData?: any;
}

export interface ScanJobResult {
  scanJobId: string;
  status: ScanStatus;
  progress: number;
  progressMessage: string;
  tripsFound: number;
  bookingsFound: number;
  trips?: NormalizedTrip[];
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  accounts: Array<{
    id: string;
    provider: string;
    provider_email: string;
    provider_name: string;
    status: string;
    last_sync_at: string;
    bookings_imported: number;
  }>;
}

export interface ImportResult {
  imported: boolean;
  trips: Array<{
    tripId: string;
    title: string;
    bookingsImported: number;
  }>;
  totalBookingsImported: number;
}

// ============================================
// DESTINATION COVER IMAGES (curated Unsplash direct URLs)
// ============================================

const DESTINATION_PHOTOS: Record<string, string> = {
  // Asia
  'tokyo': 'photo-1540959733332-eab4deabeeaf',
  'seoul': 'photo-1534274988757-a28bf1a57c17',
  'singapore': 'photo-1525625293386-3f8f99389edd',
  'bangkok': 'photo-1508009603885-50cf7c579365',
  'bali': 'photo-1537996194471-e657df975ab4',
  'hong kong': 'photo-1536599018102-9f803c140fc1',
  'osaka': 'photo-1590559899731-a382839e5549',
  'kuala lumpur': 'photo-1596422846543-75c6fc197f07',
  'mumbai': 'photo-1529253355930-ddbe423a2ac7',
  'delhi': 'photo-1587474260584-136574528ed5',
  'shanghai': 'photo-1474181487882-5abf3f0ba6c2',
  'beijing': 'photo-1508804185872-d7badad00f7d',
  'taipei': 'photo-1470004914212-05527e49370b',
  // Europe
  'paris': 'photo-1502602898657-3e91760cbb34',
  'london': 'photo-1513635269975-59663e0ac1ad',
  'rome': 'photo-1552832230-c0197dd311b5',
  'barcelona': 'photo-1583422409516-2895a77efded',
  'amsterdam': 'photo-1534351590666-13e3e96b5017',
  'berlin': 'photo-1560969184-10fe8719e047',
  'madrid': 'photo-1539037116277-4db20889f2d7',
  'lisbon': 'photo-1555881400-74d7acaacd8b',
  'prague': 'photo-1519677100203-a0e668c92439',
  'vienna': 'photo-1516550893923-42d28e5677af',
  'athens': 'photo-1555993539-1732b0258235',
  'istanbul': 'photo-1524231757912-21f4fe3a7200',
  'dublin': 'photo-1549918864-48ac978761a4',
  'zurich': 'photo-1515488764276-beab7607c1e6',
  'milan': 'photo-1520440229-6469a149ac59',
  // Americas
  'new york': 'photo-1496442226666-8d4d0e62e6e9',
  'los angeles': 'photo-1534190760961-74e8c1c5c3da',
  'miami': 'photo-1535498730771-e735b998cd64',
  'cancun': 'photo-1510097467424-192d713fd8b2',
  'san francisco': 'photo-1501594907352-04cda38ebc29',
  'chicago': 'photo-1494522855154-9297ac14b55f',
  'toronto': 'photo-1517935706615-2717063c2225',
  'mexico city': 'photo-1518659526054-190340b32735',
  'rio de janeiro': 'photo-1483729558449-99ef09a8c325',
  'bogota': 'photo-1536364652836-e85bedb21e6d',
  'lima': 'photo-1531968455001-5c5272a67c71',
  'buenos aires': 'photo-1589909202802-8f4aadce1849',
  'montego bay': 'photo-1580541631950-7282082b53ce',
  // Middle East & Africa
  'dubai': 'photo-1512453979798-5ea266f8880c',
  'doha': 'photo-1549927681-0b673b8243ab',
  'cairo': 'photo-1572252009286-268acec5ca0a',
  'marrakech': 'photo-1489749798305-4fea3ae63d43',
  'cape town': 'photo-1580060839134-75a5edca2e99',
  'nairobi': 'photo-1611348524140-53c9a25263d6',
  // Oceania
  'sydney': 'photo-1506973035872-a4ec16b8e8d9',
  'melbourne': 'photo-1514395462725-fb4566210144',
  'auckland': 'photo-1507699622108-4be3abd695ad',
};

/**
 * Fetch a destination cover image using Google Places API (primary) with Unsplash fallback.
 * Google Places returns real photos from Google Maps — accurate for any destination.
 */
async function fetchDestinationCoverImage(cityName: string): Promise<string> {
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (GOOGLE_API_KEY && cityName) {
    try {
      // Step 1: Text Search to get place_id
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(cityName + ' city')}&key=${GOOGLE_API_KEY}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.results?.[0]?.photos?.[0]?.photo_reference) {
        const photoRef = searchData.results[0].photos[0].photo_reference;
        // Step 2: Get photo URL (this URL redirects to the actual image)
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
      }
    } catch (err) {
      console.warn('Google Places photo fetch failed, using Unsplash fallback:', err);
    }
  }

  // Fallback: curated Unsplash photos
  return getDestinationCoverImage(cityName);
}

function getDestinationCoverImage(cityName: string): string {
  const city = cityName.toLowerCase().trim();

  // Direct match
  if (DESTINATION_PHOTOS[city]) {
    return `https://images.unsplash.com/${DESTINATION_PHOTOS[city]}?w=800&h=600&fit=crop&q=80`;
  }

  // Partial match (e.g., "New York City" matches "new york")
  for (const [key, photoId] of Object.entries(DESTINATION_PHOTOS)) {
    if (city.includes(key) || key.includes(city)) {
      return `https://images.unsplash.com/${photoId}?w=800&h=600&fit=crop&q=80`;
    }
  }

  // Fallback: generic beautiful travel landscape
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80';
}

// ============================================
// ENGINE CLIENT
// ============================================

class TripImportEngineService {
  private readonly EDGE_FUNCTION = 'trip-import-engine';
  private _userId: string | null = null;

  /**
   * Set the current user ID (call this from AuthContext or before using the service)
   * Required because we use Clerk auth, not Supabase auth — the edge function
   * can't extract userId from the JWT token.
   */
  setUserId(userId: string) {
    this._userId = userId;
  }

  /**
   * Call the edge function with userId included in every request
   */
  private async callEngine(action: string, params: Record<string, any> = {}): Promise<any> {
    const { data, error } = await supabase.functions.invoke(this.EDGE_FUNCTION, {
      body: { action, userId: this._userId, ...params },
    });

    if (error) {
      throw new Error(error.message || `Import engine error: ${action}`);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  }

  // ========================================
  // EMAIL CONNECTION
  // ========================================

  /**
   * Get OAuth URL to connect user's email via provider
   */
  /** @deprecated Use emailImport.service.ts forward-based approach instead */
  async connectEmail(provider: ImportProvider = 'traxo'): Promise<{ authUrl: string; state: string }> {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://pkydmdygctojtfzbqcud.supabase.co';
    const redirectUri = `${supabaseUrl}/functions/v1/trip-import-engine`;

    return this.callEngine('connect-email', {
      provider,
      redirectUri,
    });
  }

  /**
   * Handle OAuth callback after user grants access
   */
  async handleOAuthCallback(
    code: string,
    state: string,
    provider: ImportProvider = 'traxo'
  ): Promise<{ connected: boolean; accountId: string; email: string; memberName: string }> {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://pkydmdygctojtfzbqcud.supabase.co';
    const redirectUri = `${supabaseUrl}/functions/v1/trip-import-engine`;

    return this.callEngine('oauth-callback', {
      provider,
      code,
      redirectUri,
      state,
    });
  }

  /**
   * Check if user has a connected email account
   */
  async getConnectionStatus(provider: ImportProvider = 'traxo'): Promise<ConnectionStatus> {
    return this.callEngine('get-connection', { provider });
  }

  /**
   * Disconnect a linked email account
   */
  async disconnect(accountId: string): Promise<void> {
    await this.callEngine('disconnect', { accountId });
  }

  // ========================================
  // EMAIL SCANNING
  // ========================================

  /**
   * Start scanning the user's connected email for travel bookings
   * Returns immediately with a scan job ID for polling
   */
  async startScan(params?: {
    provider?: ImportProvider;
    accountId?: string;
    lookbackDays?: number;
  }): Promise<ScanJobResult> {
    return this.callEngine('start-scan', {
      provider: params?.provider || 'email_forward',
      accountId: params?.accountId,
      lookbackDays: params?.lookbackDays || 60,
    });
  }

  /**
   * Poll scan job progress
   * Use this when the scan takes longer than the initial response
   */
  async checkScan(scanJobId: string): Promise<ScanJobResult> {
    return this.callEngine('check-scan', { scanJobId });
  }

  /**
   * Poll scan until completed or failed
   * Returns the final result with detected bookings
   */
  async waitForScan(
    scanJobId: string,
    onProgress?: (result: ScanJobResult) => void,
    maxPollTime = 120000,  // 2 minutes max
    pollInterval = 2000,    // Poll every 2 seconds
  ): Promise<ScanJobResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxPollTime) {
      const result = await this.checkScan(scanJobId);

      if (onProgress) {
        onProgress(result);
      }

      if (result.status === 'completed' || result.status === 'failed') {
        return result;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Scan timed out. Please try again.');
  }

  // ========================================
  // IMPORT BOOKINGS
  // ========================================

  /**
   * Import selected trips/bookings from a completed scan
   * Creates trips and bookings in Guidera's database
   */
  async importBookings(
    scanJobId: string,
    selectedTrips?: Array<{ externalId: string; segments?: string[] }> | string[]
  ): Promise<ImportResult> {
    return this.callEngine('import-bookings', {
      scanJobId,
      selectedTrips,
    });
  }

  /**
   * Import all detected bookings from a scan
   */
  async importAllBookings(scanJobId: string): Promise<ImportResult> {
    return this.callEngine('import-bookings', { scanJobId });
  }

  // ========================================
  // CONVENIENCE METHODS
  // ========================================

  /**
   * Full flow: connect → scan → return bookings for user selection
   * Used when user is already connected
   */
  async scanAndFetchBookings(
    onProgress?: (result: ScanJobResult) => void,
    lookbackDays = 60,
  ): Promise<ScanJobResult> {
    // Start the scan
    const initialResult = await this.startScan({ lookbackDays });

    // If already completed (fast response), return immediately
    if (initialResult.status === 'completed') {
      if (onProgress) onProgress(initialResult);
      return initialResult;
    }

    // Otherwise poll until done
    return this.waitForScan(initialResult.scanJobId, onProgress);
  }

  // ========================================
  // TICKET SCANNING (OCR)
  // ========================================

  /**
   * Scan a ticket image using AI vision (Claude Sonnet / Gemini Flash)
   * Sends base64 image to scan-ticket edge function for extraction
   */
  async scanTicket(
    imageBase64: string,
    mediaType: string = 'image/jpeg',
    userId?: string,
  ): Promise<{
    success: boolean;
    booking?: NormalizedBooking;
    extracted?: any;
    modelUsed?: string;
    confidence?: number;
    error?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('scan-ticket', {
      body: { imageBase64, mediaType, userId },
    });

    if (error) throw new Error(error.message || 'Scan failed');
    return data;
  }

  /**
   * Import a scanned booking into a new or existing trip
   */
  async importScannedBooking(
    booking: NormalizedBooking,
    userId: string,
  ): Promise<{ tripId: string; title: string }> {
    const destination = booking.endLocation?.name || booking.startLocation?.name || 'Trip';
    const startDate = booking.startDate?.split('T')[0] || new Date().toISOString().split('T')[0];
    const endDate = booking.endDate?.split('T')[0] || startDate;

    const title = `${destination} ${new Date(startDate).toLocaleString('en-US', { month: 'short' })} ${new Date(startDate).getFullYear()}`;

    // Get destination cover image — Google Places API (primary) with Unsplash fallback
    const destCity = (booking.endLocation?.city || booking.endLocation?.name || destination || '').trim();
    const coverImageUrl = await fetchDestinationCoverImage(destCity);

    // Build insert data with category-specific flags
    const tripData: Record<string, any> = {
      user_id: userId,
      owner_id: userId,
      title,
      cover_image_url: coverImageUrl,
      cover_image_source: 'unsplash',
      destination: {
        name: destination,
        city: booking.endLocation?.city || destination,
        country: booking.endLocation?.country || '',
      },
      primary_destination_name: booking.endLocation?.city || destination,
      primary_destination_country: booking.endLocation?.country || '',
      primary_destination_code: booking.endLocation?.code || '',
      start_date: startDate,
      end_date: endDate,
      state: 'draft',
      status: 'planning',
      created_via: 'import_scan',
      booking_count: 1,
    };

    // Set category-specific flags
    const cat = booking.category || 'flight';
    if (cat === 'flight') { tripData.has_flights = true; tripData.flight_count = 1; }
    else if (cat === 'hotel') { tripData.has_hotels = true; tripData.hotel_count = 1; }
    else if (cat === 'car') { tripData.has_cars = true; tripData.car_count = 1; }
    else if (cat === 'experience') { tripData.has_experiences = true; tripData.experience_count = 1; }

    // Store richer flight details for the trip card
    if (booking.details?.airline) tripData.airline_name = booking.details.airline;
    if (booking.details?.cabin) tripData.cabin_class = booking.details.cabin;
    if (booking.details?.route) tripData.route = booking.details.route;
    if (booking.details?.flightNumber) tripData.flight_number = booking.details.flightNumber;
    if (booking.details?.seatNumber) tripData.seat_number = booking.details.seatNumber;

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert(tripData)
      .select('id')
      .single();

    if (tripError) throw new Error(`Failed to create trip: ${tripError.message}`);

    // Link the booking
    await supabase.from('trip_bookings').insert({
      trip_id: trip.id,
      booking_id: trip.id,
      category: booking.category,
      booking_reference: booking.confirmationNumber,
      summary_title: booking.title,
      summary_subtitle: booking.providerName || '',
      summary_datetime: booking.startDate,
      summary_price: booking.pricing?.total,
      summary_status: 'confirmed',
      source: 'import_scan',
      added_by: userId,
    });

    return { tripId: trip.id, title };
  }

  /**
   * Get the category icon name for a booking type
   */
  getCategoryIcon(category: string): string {
    switch (category) {
      case 'flight': return 'Airplane';
      case 'hotel': return 'Building';
      case 'car': return 'Car';
      case 'train': return 'Bus';
      case 'cruise': return 'Ship';
      case 'experience': return 'Activity';
      default: return 'DocumentText';
    }
  }

  /**
   * Format a booking for display in the UI
   */
  formatBookingForDisplay(booking: NormalizedBooking): {
    title: string;
    subtitle: string;
    date: string;
    price: string;
    icon: string;
    category: string;
  } {
    const date = booking.startDate
      ? new Date(booking.startDate).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })
      : 'Date TBD';

    const price = booking.pricing?.total
      ? `${booking.pricing.currency || '$'}${booking.pricing.total.toFixed(2)}`
      : '';

    let subtitle = booking.providerName || '';
    if (booking.startLocation?.code && booking.endLocation?.code) {
      subtitle = `${booking.startLocation.code} → ${booking.endLocation.code}`;
    } else if (booking.startLocation?.name) {
      subtitle = booking.startLocation.name;
    }

    return {
      title: booking.title,
      subtitle,
      date,
      price,
      icon: this.getCategoryIcon(booking.category),
      category: booking.category,
    };
  }

  /**
   * Format a trip for display in the UI
   */
  formatTripForDisplay(trip: NormalizedTrip): {
    title: string;
    destination: string;
    dateRange: string;
    bookingCount: string;
    categories: string[];
  } {
    const start = trip.startDate
      ? new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
    const end = trip.endDate
      ? new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    const dateRange = start && end ? `${start} - ${end}` : start || 'Dates TBD';
    const categories = [...new Set(trip.segments.map(s => s.category))];
    const bookingCount = `${trip.segmentCount || trip.segments.length} booking${trip.segments.length !== 1 ? 's' : ''}`;

    return {
      title: trip.title,
      destination: trip.destination.city || trip.destination.name || trip.destination.country || 'Unknown',
      dateRange,
      bookingCount,
      categories,
    };
  }
}

export const tripImportEngine = new TripImportEngineService();
