/**
 * PROVIDER MANAGER SERVICE
 * 
 * Frontend service layer for interacting with the Provider Manager Edge Function.
 * Provides typed methods for search, booking, and provider operations.
 */

import { supabase } from '@/lib/supabase/client';
import {
  UnifiedFlight,
  UnifiedHotel,
  UnifiedCarRental,
  UnifiedExperience,
  UnifiedPackage,
  FlightSearchParams,
  HotelSearchParams,
  CarSearchParams,
  ExperienceSearchParams,
  PackageSearchParams,
  BookingRequest,
  BookingConfirmation,
  PriceVerification,
  ProviderMeta,
  UnifiedPrice,
} from '@/types/unified';

// ============================================
// TYPES
// ============================================

export type TravelCategory = 'flights' | 'hotels' | 'cars' | 'experiences' | 'packages';

export type SearchStrategy = 'single' | 'price_compare' | 'comprehensive';

export interface SearchOptions {
  strategy?: SearchStrategy;
  timeout?: number;
  limit?: number;
  refresh?: boolean;
  currency?: string;
  language?: string;
}

export interface UserSearchPreferences {
  budgetLevel?: 'budget' | 'mid_range' | 'luxury';
  travelStyle?: string;
  preferredAirlines?: string[];
  preferredHotelChains?: string[];
  loyaltyPrograms?: string[];
}

export interface SearchResult<T> {
  results: T[];
  totalCount: number;
  providers: ProviderMeta[];
  sessionId: string;
  priceRange?: {
    min: UnifiedPrice;
    max: UnifiedPrice;
  };
  source: 'live' | 'cache' | 'mixed';
  requestId: string;
  durationMs: number;
}

export interface ProviderManagerResponse<T> {
  success: boolean;
  data?: {
    results: T[];
    totalCount: number;
    providers: ProviderMeta[];
    sessionId: string;
    priceRange?: {
      min: UnifiedPrice;
      max: UnifiedPrice;
    };
  };
  source?: 'live' | 'cache' | 'mixed';
  requestId: string;
  duration: number;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// SERVICE CLASS
// ============================================

class ProviderManagerService {
  private readonly functionName = 'provider-manager';

  // ═══════════════════════════════════════════════════════════════════
  // SEARCH METHODS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Search for flights
   */
  async searchFlights(
    params: FlightSearchParams,
    options?: SearchOptions,
    preferences?: UserSearchPreferences
  ): Promise<SearchResult<UnifiedFlight>> {
    return this.search<UnifiedFlight>('flights', params as unknown as Record<string, unknown>, options, preferences);
  }

  /**
   * Search for hotels
   */
  async searchHotels(
    params: HotelSearchParams,
    options?: SearchOptions,
    preferences?: UserSearchPreferences
  ): Promise<SearchResult<UnifiedHotel>> {
    return this.search<UnifiedHotel>('hotels', params as unknown as Record<string, unknown>, options, preferences);
  }

  /**
   * Search for car rentals
   */
  async searchCars(
    params: CarSearchParams,
    options?: SearchOptions,
    preferences?: UserSearchPreferences
  ): Promise<SearchResult<UnifiedCarRental>> {
    return this.search<UnifiedCarRental>('cars', params as unknown as Record<string, unknown>, options, preferences);
  }

  /**
   * Search for experiences
   */
  async searchExperiences(
    params: ExperienceSearchParams,
    options?: SearchOptions,
    preferences?: UserSearchPreferences
  ): Promise<SearchResult<UnifiedExperience>> {
    return this.search<UnifiedExperience>('experiences', params as unknown as Record<string, unknown>, options, preferences);
  }

  /**
   * Search for packages
   */
  async searchPackages(
    params: PackageSearchParams,
    options?: SearchOptions,
    preferences?: UserSearchPreferences
  ): Promise<SearchResult<UnifiedPackage>> {
    return this.search<UnifiedPackage>('packages', params as unknown as Record<string, unknown>, options, preferences);
  }

  /**
   * Generic search method
   */
  private async search<T>(
    category: TravelCategory,
    params: Record<string, unknown>,
    options?: SearchOptions,
    preferences?: UserSearchPreferences
  ): Promise<SearchResult<T>> {
    const { data: { user } } = await supabase.auth.getUser();

    const response = await this.invokeFunction<ProviderManagerResponse<T>>({
      action: 'search',
      category,
      params: {
        ...params,
        ...options,
      },
      userId: user?.id,
      preferences,
    });

    if (!response.success || !response.data) {
      throw new ProviderManagerError(
        response.error?.code || 'SEARCH_FAILED',
        response.error?.message || 'Search failed'
      );
    }

    // Log results count for debugging
    console.log(`Provider Manager ${category} search: ${response.data.results?.length || 0} results`);

    return {
      results: response.data.results || [],
      totalCount: response.data.totalCount || 0,
      providers: response.data.providers,
      sessionId: response.data.sessionId,
      priceRange: response.data.priceRange,
      source: response.source || 'live',
      requestId: response.requestId,
      durationMs: response.duration,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // OFFER METHODS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get offer details (refresh/verify)
   */
  async getOfferDetails(
    offerId: string,
    providerCode: string,
    category: TravelCategory
  ): Promise<UnifiedFlight | UnifiedHotel | UnifiedCarRental | UnifiedExperience> {
    const response = await this.invokeFunction<{
      success: boolean;
      data?: UnifiedFlight | UnifiedHotel | UnifiedCarRental | UnifiedExperience;
      error?: { code: string; message: string };
    }>({
      action: 'get_offer',
      category,
      params: {
        offerId,
        providerCode,
      },
    });

    if (!response.success || !response.data) {
      throw new ProviderManagerError(
        response.error?.code || 'OFFER_NOT_FOUND',
        response.error?.message || 'Offer not found'
      );
    }

    return response.data;
  }

  /**
   * Verify price is still valid
   */
  async verifyPrice(
    offerId: string,
    providerCode: string,
    category: TravelCategory
  ): Promise<PriceVerification> {
    const response = await this.invokeFunction<{
      success: boolean;
      data?: PriceVerification;
      error?: { code: string; message: string };
    }>({
      action: 'verify_price',
      category,
      params: {
        offerId,
        providerCode,
      },
    });

    if (!response.success || !response.data) {
      throw new ProviderManagerError(
        response.error?.code || 'VERIFICATION_FAILED',
        response.error?.message || 'Price verification failed'
      );
    }

    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════════
  // BOOKING METHODS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Create a booking
   */
  async createBooking(request: BookingRequest): Promise<BookingConfirmation> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new ProviderManagerError('UNAUTHORIZED', 'User must be logged in to book');
    }

    const response = await this.invokeFunction<{
      success: boolean;
      data?: BookingConfirmation;
      error?: { code: string; message: string };
    }>({
      action: 'book',
      category: request.category,
      params: request as unknown as Record<string, unknown>,
      userId: user.id,
    });

    if (!response.success || !response.data) {
      throw new ProviderManagerError(
        response.error?.code || 'BOOKING_FAILED',
        response.error?.message || 'Booking failed'
      );
    }

    return response.data;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(
    bookingId: string,
    reason?: string
  ): Promise<{ success: boolean; refundAmount?: UnifiedPrice; message: string }> {
    const response = await this.invokeFunction<{
      success: boolean;
      data?: { refundAmount?: UnifiedPrice; message: string };
      error?: { code: string; message: string };
    }>({
      action: 'cancel',
      category: 'flights', // Will be determined from booking
      params: {
        bookingId,
        reason,
      },
    });

    if (!response.success) {
      throw new ProviderManagerError(
        response.error?.code || 'CANCELLATION_FAILED',
        response.error?.message || 'Cancellation failed'
      );
    }

    return {
      success: true,
      refundAmount: response.data?.refundAmount,
      message: response.data?.message || 'Booking cancelled',
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Check provider health
   */
  async checkProviderHealth(providerId: string): Promise<{
    healthy: boolean;
    healthScore: number;
    providerCode: string;
  }> {
    const response = await this.invokeFunction<{
      success: boolean;
      data?: { healthy: boolean; healthScore: number; providerCode: string };
      error?: { code: string; message: string };
    }>({
      action: 'health_check',
      category: 'flights',
      params: { providerId },
    });

    if (!response.success || !response.data) {
      throw new ProviderManagerError(
        response.error?.code || 'HEALTH_CHECK_FAILED',
        response.error?.message || 'Health check failed'
      );
    }

    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════════
  // INTERNAL METHODS
  // ═══════════════════════════════════════════════════════════════════

  private async invokeFunction<T>(body: {
    action: string;
    category: TravelCategory;
    params: Record<string, unknown>;
    userId?: string;
    sessionId?: string;
    preferences?: UserSearchPreferences;
  }): Promise<T> {
    console.log('Provider Manager Request:', JSON.stringify(body).substring(0, 500));
    
    const { data, error } = await supabase.functions.invoke(this.functionName, {
      body,
    });

    if (error) {
      console.error('Provider Manager Error:', error);
      console.error('Request body was:', JSON.stringify(body));
      throw new ProviderManagerError('FUNCTION_ERROR', error.message);
    }

    console.log('Provider Manager Response received:', data?.success ? 'success' : 'failed');
    if (data?.data?.results) {
      console.log('Provider Manager Results count:', data.data.results.length);
    }
    return data as T;
  }
}

// ============================================
// ERROR CLASS
// ============================================

export class ProviderManagerError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ProviderManagerError';
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const providerManagerService = new ProviderManagerService();
