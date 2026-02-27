/**
 * AMADEUS PROVIDER ADAPTER
 * 
 * Implementation for Amadeus for Developers API.
 * Supports: Flights, Hotels, Cars
 */

import {
  UnifiedFlight,
  UnifiedHotel,
  FlightSearchParams,
  HotelSearchParams,
  HealthCheckResult,
  UnifiedPrice,
  TravelerPrice,
  CabinClass,
  TripType,
} from '@/types/unified';

import {
  BaseProviderAdapter,
  ProviderCredentials,
  AdapterContext,
  FlightSearchResult,
  HotelSearchResult,
  ProviderApiError,
} from './base-adapter';

// ============================================
// AMADEUS RESPONSE TYPES
// ============================================

interface AmadeusAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AmadeusFlightOffersResponse {
  data: AmadeusFlightOffer[];
  dictionaries: AmadeusDictionaries;
  meta?: {
    count: number;
  };
}

interface AmadeusFlightOffer {
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: AmadeusItinerary[];
  price: AmadeusPrice;
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
    refundableFare?: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: AmadeusTravelerPricing[];
}

interface AmadeusItinerary {
  duration: string;
  segments: AmadeusSegment[];
}

interface AmadeusSegment {
  id: string;
  departure: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  operating?: {
    carrierCode: string;
  };
  duration: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

interface AmadeusPrice {
  currency: string;
  total: string;
  base: string;
  fees?: {
    amount: string;
    type: string;
  }[];
  grandTotal: string;
}

interface AmadeusTravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: {
    currency: string;
    total: string;
    base: string;
  };
  fareDetailsBySegment: AmadeusFareDetails[];
}

interface AmadeusFareDetails {
  segmentId: string;
  cabin: string;
  fareBasis: string;
  class: string;
  includedCheckedBags?: {
    quantity?: number;
    weight?: number;
    weightUnit?: string;
  };
}

interface AmadeusDictionaries {
  locations: Record<string, { cityCode: string; countryCode: string }>;
  aircraft: Record<string, string>;
  currencies: Record<string, string>;
  carriers: Record<string, string>;
}

// ============================================
// AMADEUS ADAPTER
// ============================================

export class AmadeusAdapter extends BaseProviderAdapter {
  readonly providerCode = 'amadeus';
  readonly providerName = 'Amadeus';
  readonly supportedCategories = ['flights', 'hotels', 'cars'];
  
  private tokenExpirationBuffer = 60000; // 1 minute buffer
  
  protected getDefaultBaseUrl(environment: 'sandbox' | 'production'): string {
    return environment === 'production'
      ? 'https://api.amadeus.com'
      : 'https://test.api.amadeus.com';
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════════
  
  private async ensureAuthenticated(): Promise<void> {
    if (!this.credentials) {
      throw new ProviderApiError(this.providerCode, 401, 'Adapter not initialized');
    }
    
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiresAt) {
      const now = new Date();
      if (now.getTime() < this.tokenExpiresAt.getTime() - this.tokenExpirationBuffer) {
        return; // Token still valid
      }
    }
    
    // Get new token
    await this.authenticate();
  }
  
  private async authenticate(): Promise<void> {
    if (!this.credentials?.clientId || !this.credentials?.clientSecret) {
      throw new ProviderApiError(this.providerCode, 401, 'Missing client credentials');
    }
    
    const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
      }),
    });
    
    if (!response.ok) {
      throw new ProviderApiError(
        this.providerCode,
        response.status,
        'Authentication failed',
        await response.text()
      );
    }
    
    const data: AmadeusAuthResponse = await response.json();
    
    this.accessToken = data.access_token;
    this.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
  }
  
  protected async getHeaders(): Promise<Record<string, string>> {
    await this.ensureAuthenticated();
    
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════════
  
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      await this.ensureAuthenticated();
      
      // Simple API call to verify connectivity
      const response = await fetch(`${this.baseUrl}/v1/reference-data/locations?keyword=NYC&subType=CITY`, {
        headers: await this.getHeaders(),
      });
      
      return {
        healthy: response.ok,
        responseTime: Date.now() - startTime,
        statusCode: response.status,
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // FLIGHT SEARCH
  // ═══════════════════════════════════════════════════════════════════
  
  async searchFlights(params: FlightSearchParams, context: AdapterContext): Promise<FlightSearchResult> {
    const searchParams = this.buildFlightSearchParams(params);
    
    const response = await this.makeRequest<AmadeusFlightOffersResponse>(
      `/v2/shopping/flight-offers?${searchParams}`,
      { method: 'GET' },
      context
    );
    
    const flights = response.data.map(offer => 
      this.mapAmadeusFlightToUnified(offer, response.dictionaries)
    );
    
    return {
      flights,
      totalCount: response.meta?.count || flights.length,
      hasMore: false,
    };
  }
  
  private buildFlightSearchParams(params: FlightSearchParams): string {
    const searchParams = new URLSearchParams();
    
    // Origin and destination from first segment
    const firstSegment = params.segments[0];
    searchParams.set('originLocationCode', firstSegment.origin);
    searchParams.set('destinationLocationCode', firstSegment.destination);
    searchParams.set('departureDate', firstSegment.departureDate);
    
    // Return date for round trip
    if (params.tripType === 'round_trip' && params.segments[1]) {
      searchParams.set('returnDate', params.segments[1].departureDate);
    }
    
    // Travelers
    searchParams.set('adults', params.travelers.adults.toString());
    if (params.travelers.children > 0) {
      searchParams.set('children', params.travelers.children.toString());
    }
    if (params.travelers.infants > 0) {
      searchParams.set('infants', params.travelers.infants.toString());
    }
    
    // Cabin class
    if (params.cabinClass) {
      searchParams.set('travelClass', this.mapCabinClass(params.cabinClass));
    }
    
    // Filters
    if (params.filters?.maxStops !== undefined) {
      if (params.filters.maxStops === 0) {
        searchParams.set('nonStop', 'true');
      }
    }
    
    if (params.filters?.maxPrice) {
      searchParams.set('maxPrice', params.filters.maxPrice.toString());
    }
    
    // Max results
    searchParams.set('max', '50');
    
    return searchParams.toString();
  }
  
  private mapCabinClass(cabinClass: CabinClass): string {
    const mapping: Record<CabinClass, string> = {
      [CabinClass.ECONOMY]: 'ECONOMY',
      [CabinClass.PREMIUM_ECONOMY]: 'PREMIUM_ECONOMY',
      [CabinClass.BUSINESS]: 'BUSINESS',
      [CabinClass.FIRST]: 'FIRST',
    };
    return mapping[cabinClass] || 'ECONOMY';
  }
  
  private mapAmadeusFlightToUnified(
    offer: AmadeusFlightOffer,
    dictionaries: AmadeusDictionaries
  ): UnifiedFlight {
    const slices = offer.itineraries.map((itinerary, index) => {
      const segments = itinerary.segments.map(seg => this.mapSegment(seg, dictionaries));
      const firstSeg = itinerary.segments[0];
      const lastSeg = itinerary.segments[itinerary.segments.length - 1];
      
      return {
        id: `${offer.id}-slice-${index}`,
        origin: {
          code: firstSeg.departure.iataCode,
          name: dictionaries.locations[firstSeg.departure.iataCode]?.cityCode || firstSeg.departure.iataCode,
          city: dictionaries.locations[firstSeg.departure.iataCode]?.cityCode || '',
          country: '',
          countryCode: dictionaries.locations[firstSeg.departure.iataCode]?.countryCode || '',
          terminal: firstSeg.departure.terminal,
          timezone: '',
        },
        destination: {
          code: lastSeg.arrival.iataCode,
          name: dictionaries.locations[lastSeg.arrival.iataCode]?.cityCode || lastSeg.arrival.iataCode,
          city: dictionaries.locations[lastSeg.arrival.iataCode]?.cityCode || '',
          country: '',
          countryCode: dictionaries.locations[lastSeg.arrival.iataCode]?.countryCode || '',
          terminal: lastSeg.arrival.terminal,
          timezone: '',
        },
        departureAt: firstSeg.departure.at,
        arrivalAt: lastSeg.arrival.at,
        durationMinutes: this.parseDuration(itinerary.duration),
        stops: itinerary.segments.length - 1,
        segments,
        layovers: this.calculateLayovers(itinerary.segments, dictionaries),
      };
    });
    
    const price = this.mapPrice(offer.price);
    const pricePerTraveler = this.mapTravelerPricing(offer.travelerPricings);
    const baggage = this.mapBaggage(offer.travelerPricings[0]?.fareDetailsBySegment);
    
    return {
      id: this.generateOfferId(offer.id),
      providerOfferId: offer.id,
      provider: {
        code: this.providerCode,
        name: this.providerName,
        retrievedAt: new Date().toISOString(),
      },
      type: 'flight',
      tripType: offer.itineraries.length === 1 ? TripType.ONE_WAY : TripType.ROUND_TRIP,
      slices,
      totalStops: slices.reduce((sum, s) => sum + s.stops, 0),
      totalDurationMinutes: slices.reduce((sum, s) => sum + s.durationMinutes, 0),
      price,
      pricePerTraveler,
      fareType: offer.pricingOptions?.fareType?.[0],
      baggage,
      policies: {
        cancellation: {
          allowed: !offer.pricingOptions?.includedCheckedBagsOnly,
          refundType: offer.pricingOptions?.refundableFare ? 'full' : 'none',
        },
        change: {
          allowed: true,
        },
      },
      isRefundable: offer.pricingOptions?.refundableFare || false,
      isChangeable: true,
      seatsRemaining: offer.numberOfBookableSeats,
      isLivePrice: true,
      retrievedAt: new Date().toISOString(),
    };
  }
  
  private mapSegment(seg: AmadeusSegment, dictionaries: AmadeusDictionaries) {
    return {
      id: seg.id,
      marketingCarrier: {
        code: seg.carrierCode,
        name: dictionaries.carriers[seg.carrierCode] || seg.carrierCode,
      },
      operatingCarrier: seg.operating ? {
        code: seg.operating.carrierCode,
        name: dictionaries.carriers[seg.operating.carrierCode] || seg.operating.carrierCode,
      } : undefined,
      flightNumber: `${seg.carrierCode}${seg.number}`,
      aircraft: {
        code: seg.aircraft.code,
        name: dictionaries.aircraft[seg.aircraft.code] || seg.aircraft.code,
      },
      origin: {
        code: seg.departure.iataCode,
        name: dictionaries.locations[seg.departure.iataCode]?.cityCode || seg.departure.iataCode,
        city: dictionaries.locations[seg.departure.iataCode]?.cityCode || '',
        country: '',
        countryCode: dictionaries.locations[seg.departure.iataCode]?.countryCode || '',
        terminal: seg.departure.terminal,
        timezone: '',
      },
      destination: {
        code: seg.arrival.iataCode,
        name: dictionaries.locations[seg.arrival.iataCode]?.cityCode || seg.arrival.iataCode,
        city: dictionaries.locations[seg.arrival.iataCode]?.cityCode || '',
        country: '',
        countryCode: dictionaries.locations[seg.arrival.iataCode]?.countryCode || '',
        terminal: seg.arrival.terminal,
        timezone: '',
      },
      departureAt: seg.departure.at,
      arrivalAt: seg.arrival.at,
      durationMinutes: this.parseDuration(seg.duration),
      cabinClass: CabinClass.ECONOMY, // Will be overridden by fare details
      bookingClass: undefined,
    };
  }
  
  private calculateLayovers(segments: AmadeusSegment[], dictionaries: AmadeusDictionaries) {
    const layovers = [];
    
    for (let i = 0; i < segments.length - 1; i++) {
      const arrivalTime = new Date(segments[i].arrival.at);
      const departureTime = new Date(segments[i + 1].departure.at);
      const durationMinutes = Math.round((departureTime.getTime() - arrivalTime.getTime()) / 60000);
      
      layovers.push({
        airport: {
          code: segments[i].arrival.iataCode,
          name: dictionaries.locations[segments[i].arrival.iataCode]?.cityCode || segments[i].arrival.iataCode,
          city: dictionaries.locations[segments[i].arrival.iataCode]?.cityCode || '',
          country: '',
          countryCode: dictionaries.locations[segments[i].arrival.iataCode]?.countryCode || '',
          timezone: '',
        },
        durationMinutes,
        isOvernight: arrivalTime.getDate() !== departureTime.getDate(),
        terminalChange: segments[i].arrival.terminal !== segments[i + 1].departure.terminal,
        isSelfTransfer: false,
      });
    }
    
    return layovers;
  }
  
  private mapPrice(price: AmadeusPrice): UnifiedPrice {
    const amount = parseFloat(price.total);
    const fees = price.fees?.reduce((sum, f) => sum + parseFloat(f.amount), 0) || 0;
    
    return {
      amount,
      currency: price.currency,
      formatted: this.formatPrice(amount, price.currency),
      breakdown: {
        base: parseFloat(price.base),
        taxes: amount - parseFloat(price.base) - fees,
        fees,
      },
    };
  }
  
  private mapTravelerPricing(travelerPricings: AmadeusTravelerPricing[]): TravelerPrice[] {
    return travelerPricings.map(tp => ({
      travelerType: this.mapTravelerType(tp.travelerType),
      count: 1,
      pricePerTraveler: {
        amount: parseFloat(tp.price.total),
        currency: tp.price.currency,
        formatted: this.formatPrice(parseFloat(tp.price.total), tp.price.currency),
      },
      totalPrice: {
        amount: parseFloat(tp.price.total),
        currency: tp.price.currency,
        formatted: this.formatPrice(parseFloat(tp.price.total), tp.price.currency),
      },
    }));
  }
  
  private mapTravelerType(type: string): 'adult' | 'child' | 'infant' | 'senior' {
    const mapping: Record<string, 'adult' | 'child' | 'infant' | 'senior'> = {
      'ADULT': 'adult',
      'CHILD': 'child',
      'SEATED_INFANT': 'infant',
      'HELD_INFANT': 'infant',
    };
    return mapping[type] || 'adult';
  }
  
  private mapBaggage(fareDetails?: AmadeusFareDetails[]) {
    const firstFare = fareDetails?.[0];
    const checkedBags = firstFare?.includedCheckedBags;
    
    return {
      cabin: {
        included: true,
        quantity: 1,
      },
      checked: {
        included: !!checkedBags?.quantity || !!checkedBags?.weight,
        quantity: checkedBags?.quantity || 0,
        weightKg: checkedBags?.weight,
      },
    };
  }
}

// Register the adapter
import { registerAdapter } from './base-adapter';
registerAdapter(new AmadeusAdapter());
