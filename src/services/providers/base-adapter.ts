/**
 * BASE PROVIDER ADAPTER
 * 
 * Abstract base class for all provider adapters.
 * Each provider (Amadeus, Duffel, Kiwi, etc.) implements this interface.
 */

import {
  UnifiedFlight,
  UnifiedHotel,
  UnifiedCarRental,
  UnifiedExperience,
  FlightSearchParams,
  HotelSearchParams,
  CarSearchParams,
  ExperienceSearchParams,
  BookingRequest,
  BookingConfirmation,
  PriceVerification,
  CancellationRequest,
  CancellationResult,
  HealthCheckResult,
  Provider,
  ProviderCapability,
} from '@/types/unified';

// ============================================
// ADAPTER CONTEXT
// ============================================

export interface AdapterContext {
  requestId: string;
  sessionId?: string;
  userId?: string;
  timeout: number;
  currency?: string;
  language?: string;
}

// ============================================
// SEARCH RESULTS
// ============================================

export interface FlightSearchResult {
  flights: UnifiedFlight[];
  totalCount: number;
  hasMore: boolean;
}

export interface HotelSearchResult {
  hotels: UnifiedHotel[];
  totalCount: number;
  hasMore: boolean;
}

export interface CarSearchResult {
  cars: UnifiedCarRental[];
  totalCount: number;
  hasMore: boolean;
}

export interface ExperienceSearchResult {
  experiences: UnifiedExperience[];
  totalCount: number;
  hasMore: boolean;
}

// ============================================
// BASE ADAPTER INTERFACE
// ============================================

export interface IProviderAdapter {
  /** Provider code (e.g., 'amadeus', 'duffel') */
  readonly providerCode: string;
  
  /** Provider name for display */
  readonly providerName: string;
  
  /** Supported categories */
  readonly supportedCategories: string[];
  
  // ═══════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Initialize the adapter with credentials */
  initialize(credentials: ProviderCredentials): Promise<void>;
  
  /** Check if adapter is initialized */
  isInitialized(): boolean;
  
  // ═══════════════════════════════════════════════════════════════════
  // HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════════
  
  /** Perform a health check */
  healthCheck(): Promise<HealthCheckResult>;
  
  // ═══════════════════════════════════════════════════════════════════
  // SEARCH METHODS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Search for flights */
  searchFlights?(params: FlightSearchParams, context: AdapterContext): Promise<FlightSearchResult>;
  
  /** Search for hotels */
  searchHotels?(params: HotelSearchParams, context: AdapterContext): Promise<HotelSearchResult>;
  
  /** Search for car rentals */
  searchCars?(params: CarSearchParams, context: AdapterContext): Promise<CarSearchResult>;
  
  /** Search for experiences */
  searchExperiences?(params: ExperienceSearchParams, context: AdapterContext): Promise<ExperienceSearchResult>;
  
  // ═══════════════════════════════════════════════════════════════════
  // OFFER METHODS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Get offer details (refresh/verify) */
  getOfferDetails?(offerId: string, category: string, context: AdapterContext): Promise<UnifiedFlight | UnifiedHotel | UnifiedCarRental | UnifiedExperience>;
  
  /** Verify price is still valid */
  verifyPrice?(offerId: string, category: string, context: AdapterContext): Promise<PriceVerification>;
  
  // ═══════════════════════════════════════════════════════════════════
  // BOOKING METHODS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Create a booking */
  createBooking?(request: BookingRequest, context: AdapterContext): Promise<BookingConfirmation>;
  
  /** Cancel a booking */
  cancelBooking?(request: CancellationRequest, context: AdapterContext): Promise<CancellationResult>;
  
  /** Get booking status */
  getBookingStatus?(bookingReference: string, context: AdapterContext): Promise<BookingConfirmation>;
}

// ============================================
// PROVIDER CREDENTIALS
// ============================================

export interface ProviderCredentials {
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  accountId?: string;
  merchantId?: string;
  affiliateId?: string;
  customBaseUrl?: string;
  environment: 'sandbox' | 'production';
}

// ============================================
// BASE ADAPTER ABSTRACT CLASS
// ============================================

export abstract class BaseProviderAdapter implements IProviderAdapter {
  abstract readonly providerCode: string;
  abstract readonly providerName: string;
  abstract readonly supportedCategories: string[];
  
  protected credentials: ProviderCredentials | null = null;
  protected baseUrl: string = '';
  protected accessToken: string | null = null;
  protected tokenExpiresAt: Date | null = null;
  
  // ═══════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════
  
  async initialize(credentials: ProviderCredentials): Promise<void> {
    this.credentials = credentials;
    this.baseUrl = credentials.customBaseUrl || this.getDefaultBaseUrl(credentials.environment);
    
    if (credentials.accessToken) {
      this.accessToken = credentials.accessToken;
      this.tokenExpiresAt = credentials.tokenExpiresAt ? new Date(credentials.tokenExpiresAt) : null;
    }
  }
  
  isInitialized(): boolean {
    return this.credentials !== null;
  }
  
  protected abstract getDefaultBaseUrl(environment: 'sandbox' | 'production'): string;
  
  // ═══════════════════════════════════════════════════════════════════
  // HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════════
  
  abstract healthCheck(): Promise<HealthCheckResult>;
  
  // ═══════════════════════════════════════════════════════════════════
  // HTTP HELPERS
  // ═══════════════════════════════════════════════════════════════════
  
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    context: AdapterContext
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), context.timeout);
    
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new ProviderApiError(
          this.providerCode,
          response.status,
          `API Error: ${response.statusText}`,
          errorBody,
          this.isRetryableStatus(response.status)
        );
      }
      
      return await response.json() as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ProviderApiError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderApiError(
          this.providerCode,
          408,
          'Request timeout',
          undefined,
          true
        );
      }
      
      throw new ProviderApiError(
        this.providerCode,
        0,
        error instanceof Error ? error.message : 'Unknown error',
        undefined,
        true
      );
    }
  }
  
  protected abstract getHeaders(): Promise<Record<string, string>>;
  
  protected isRetryableStatus(status: number): boolean {
    return [408, 429, 500, 502, 503, 504].includes(status);
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════
  
  protected formatPrice(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }
  
  protected parseDuration(isoDuration: string): number {
    // Parse ISO 8601 duration (e.g., "PT2H30M" -> 150 minutes)
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    
    return hours * 60 + minutes;
  }
  
  protected generateOfferId(providerOfferId: string): string {
    return `${this.providerCode}-${providerOfferId}`;
  }
}

// ============================================
// PROVIDER API ERROR
// ============================================

export class ProviderApiError extends Error {
  constructor(
    public readonly providerCode: string,
    public readonly statusCode: number,
    message: string,
    public readonly responseBody?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'ProviderApiError';
  }
  
  toJSON() {
    return {
      provider: this.providerCode,
      statusCode: this.statusCode,
      message: this.message,
      retryable: this.retryable,
    };
  }
}

// ============================================
// ADAPTER REGISTRY
// ============================================

const adapterRegistry = new Map<string, IProviderAdapter>();

export function registerAdapter(adapter: IProviderAdapter): void {
  adapterRegistry.set(adapter.providerCode, adapter);
}

export function getAdapter(providerCode: string): IProviderAdapter | undefined {
  return adapterRegistry.get(providerCode);
}

export function getAllAdapters(): IProviderAdapter[] {
  return Array.from(adapterRegistry.values());
}

export function getAdaptersForCategory(category: string): IProviderAdapter[] {
  return getAllAdapters().filter(adapter => 
    adapter.supportedCategories.includes(category)
  );
}
