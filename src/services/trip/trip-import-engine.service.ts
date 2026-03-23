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
import { invokeEdgeFn } from '@/utils/retry';
import { fetchDestinationCoverImage } from '@/utils/destinationImage';

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
    const { data, error } = await invokeEdgeFn(supabase, this.EDGE_FUNCTION, { action, userId: this._userId, ...params }, 'slow');

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
    const { data, error } = await invokeEdgeFn(supabase, 'scan-ticket', { imageBase64, mediaType, userId }, 'slow');

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

    // Get destination cover image — Google Places API with multi-strategy retry
    const destCity = (booking.endLocation?.city || booking.endLocation?.name || destination || '').trim();
    const coverImageUrl = await fetchDestinationCoverImage(destCity);

    // Build insert data with category-specific flags
    const tripData: Record<string, any> = {
      user_id: userId,
      owner_id: userId,
      title,
      cover_image_url: coverImageUrl,
      cover_image_source: 'google_places',
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
