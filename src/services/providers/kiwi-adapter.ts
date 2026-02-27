/**
 * KIWI.COM PROVIDER ADAPTER
 * 
 * Implementation for Kiwi.com Tequila API.
 * Supports: Flights (especially budget and multi-city via virtual interlining)
 */

import {
  UnifiedFlight,
  FlightSearchParams,
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
  ProviderApiError,
  registerAdapter,
} from './base-adapter';

// ============================================
// KIWI RESPONSE TYPES
// ============================================

interface KiwiSearchResponse {
  data: KiwiFlight[];
  currency: string;
  search_id: string;
  _results: number;
}

interface KiwiFlight {
  id: string;
  flyFrom: string;
  flyTo: string;
  cityFrom: string;
  cityTo: string;
  cityCodeFrom: string;
  cityCodeTo: string;
  countryFrom: { code: string; name: string };
  countryTo: { code: string; name: string };
  dTime: number;
  dTimeUTC: number;
  aTime: number;
  aTimeUTC: number;
  fly_duration: string;
  return_duration?: string;
  nightsInDest?: number;
  quality: number;
  price: number;
  conversion: { EUR: number; USD: number };
  bags_price: { [key: string]: number };
  baglimit: { hand_width: number; hand_height: number; hand_length: number; hand_weight: number; hold_weight: number };
  availability: { seats: number };
  airlines: string[];
  route: KiwiRoute[];
  booking_token: string;
  deep_link: string;
  facilitated_booking_available: boolean;
  pnr_count: number;
  has_airport_change: boolean;
  technical_stops: number;
  virtual_interlining: boolean;
  local_arrival: string;
  local_departure: string;
}

interface KiwiRoute {
  id: string;
  flyFrom: string;
  flyTo: string;
  cityFrom: string;
  cityTo: string;
  cityCodeFrom: string;
  cityCodeTo: string;
  airline: string;
  flight_no: number;
  operating_carrier: string;
  operating_flight_no: string;
  fare_basis: string;
  fare_category: string;
  fare_classes: string;
  fare_family: string;
  return: number;
  bags_recheck_required: boolean;
  vi_connection: boolean;
  guarantee: boolean;
  equipment: string;
  vehicle_type: string;
  local_arrival: string;
  local_departure: string;
  utc_arrival: string;
  utc_departure: string;
}

// ============================================
// KIWI ADAPTER
// ============================================

export class KiwiAdapter extends BaseProviderAdapter {
  readonly providerCode = 'kiwi';
  readonly providerName = 'Kiwi.com';
  readonly supportedCategories = ['flights'];
  
  protected getDefaultBaseUrl(environment: 'sandbox' | 'production'): string {
    return 'https://api.tequila.kiwi.com';
  }
  
  protected async getHeaders(): Promise<Record<string, string>> {
    if (!this.credentials?.apiKey) {
      throw new ProviderApiError(this.providerCode, 401, 'Missing API key');
    }
    
    return {
      'apikey': this.credentials.apiKey,
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
      const response = await fetch(`${this.baseUrl}/locations/query?term=NYC&limit=1`, {
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
    const searchParams = this.buildSearchParams(params);
    
    const response = await this.makeRequest<KiwiSearchResponse>(
      `/v2/search?${searchParams}`,
      { method: 'GET' },
      context
    );
    
    const flights = response.data.map(flight => 
      this.mapKiwiFlightToUnified(flight, response.currency)
    );
    
    return {
      flights,
      totalCount: response._results,
      hasMore: response._results > flights.length,
    };
  }
  
  private buildSearchParams(params: FlightSearchParams): string {
    const searchParams = new URLSearchParams();
    
    const firstSegment = params.segments[0];
    searchParams.set('fly_from', firstSegment.origin);
    searchParams.set('fly_to', firstSegment.destination);
    searchParams.set('date_from', this.formatDate(firstSegment.departureDate));
    searchParams.set('date_to', this.formatDate(firstSegment.departureDate));
    
    if (params.tripType === 'round_trip' && params.segments[1]) {
      searchParams.set('return_from', this.formatDate(params.segments[1].departureDate));
      searchParams.set('return_to', this.formatDate(params.segments[1].departureDate));
    }
    
    searchParams.set('adults', params.travelers.adults.toString());
    if (params.travelers.children > 0) {
      searchParams.set('children', params.travelers.children.toString());
    }
    if (params.travelers.infants > 0) {
      searchParams.set('infants', params.travelers.infants.toString());
    }
    
    if (params.cabinClass) {
      searchParams.set('selected_cabins', this.mapCabinClass(params.cabinClass));
    }
    
    if (params.filters?.maxStops !== undefined) {
      searchParams.set('max_stopovers', params.filters.maxStops.toString());
    }
    
    if (params.filters?.maxPrice) {
      searchParams.set('price_to', params.filters.maxPrice.toString());
    }
    
    searchParams.set('curr', 'USD');
    searchParams.set('limit', '50');
    searchParams.set('sort', 'price');
    
    return searchParams.toString();
  }
  
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  private mapCabinClass(cabinClass: CabinClass): string {
    const mapping: Record<CabinClass, string> = {
      [CabinClass.ECONOMY]: 'M',
      [CabinClass.PREMIUM_ECONOMY]: 'W',
      [CabinClass.BUSINESS]: 'C',
      [CabinClass.FIRST]: 'F',
    };
    return mapping[cabinClass] || 'M';
  }
  
  private mapKiwiFlightToUnified(flight: KiwiFlight, currency: string): UnifiedFlight {
    const outboundRoutes = flight.route.filter(r => r.return === 0);
    const returnRoutes = flight.route.filter(r => r.return === 1);
    
    const slices = [];
    
    if (outboundRoutes.length > 0) {
      slices.push(this.buildSlice(outboundRoutes, 'outbound'));
    }
    
    if (returnRoutes.length > 0) {
      slices.push(this.buildSlice(returnRoutes, 'return'));
    }
    
    const price = this.mapPrice(flight, currency);
    const pricePerTraveler = this.estimatePricePerTraveler(flight, currency);
    
    return {
      id: this.generateOfferId(flight.id),
      providerOfferId: flight.booking_token,
      provider: {
        code: this.providerCode,
        name: this.providerName,
        retrievedAt: new Date().toISOString(),
      },
      type: 'flight',
      tripType: returnRoutes.length > 0 ? TripType.ROUND_TRIP : TripType.ONE_WAY,
      slices,
      totalStops: flight.route.length - (returnRoutes.length > 0 ? 2 : 1),
      totalDurationMinutes: this.parseDurationString(flight.fly_duration) + 
        (flight.return_duration ? this.parseDurationString(flight.return_duration) : 0),
      price,
      pricePerTraveler,
      baggage: {
        cabin: {
          included: true,
          quantity: 1,
          weightKg: flight.baglimit.hand_weight,
        },
        checked: {
          included: false,
          quantity: 0,
          addOnPrice: flight.bags_price['1'] ? {
            amount: flight.bags_price['1'],
            currency,
            formatted: this.formatPrice(flight.bags_price['1'], currency),
          } : undefined,
        },
      },
      policies: {
        cancellation: {
          allowed: true,
          refundType: 'partial',
        },
        change: {
          allowed: true,
        },
      },
      isRefundable: false,
      isChangeable: true,
      seatsRemaining: flight.availability.seats,
      isLivePrice: true,
      retrievedAt: new Date().toISOString(),
      deepLink: flight.deep_link,
    };
  }
  
  private buildSlice(routes: KiwiRoute[], direction: string) {
    const firstRoute = routes[0];
    const lastRoute = routes[routes.length - 1];
    
    const segments = routes.map(route => ({
      id: route.id,
      marketingCarrier: {
        code: route.airline,
        name: route.airline,
      },
      operatingCarrier: route.operating_carrier ? {
        code: route.operating_carrier,
        name: route.operating_carrier,
      } : undefined,
      flightNumber: `${route.airline}${route.flight_no}`,
      aircraft: route.equipment ? {
        code: route.equipment,
        name: route.equipment,
      } : undefined,
      origin: {
        code: route.flyFrom,
        name: route.cityFrom,
        city: route.cityFrom,
        country: '',
        countryCode: route.cityCodeFrom,
        timezone: '',
      },
      destination: {
        code: route.flyTo,
        name: route.cityTo,
        city: route.cityTo,
        country: '',
        countryCode: route.cityCodeTo,
        timezone: '',
      },
      departureAt: route.utc_departure,
      arrivalAt: route.utc_arrival,
      durationMinutes: this.calculateDuration(route.utc_departure, route.utc_arrival),
      cabinClass: this.mapFareClassToCabin(route.fare_category),
      bookingClass: route.fare_classes,
    }));
    
    const totalDuration = this.calculateDuration(firstRoute.utc_departure, lastRoute.utc_arrival);
    
    return {
      id: `${direction}-${firstRoute.id}`,
      origin: {
        code: firstRoute.flyFrom,
        name: firstRoute.cityFrom,
        city: firstRoute.cityFrom,
        country: '',
        countryCode: firstRoute.cityCodeFrom,
        timezone: '',
      },
      destination: {
        code: lastRoute.flyTo,
        name: lastRoute.cityTo,
        city: lastRoute.cityTo,
        country: '',
        countryCode: lastRoute.cityCodeTo,
        timezone: '',
      },
      departureAt: firstRoute.utc_departure,
      arrivalAt: lastRoute.utc_arrival,
      durationMinutes: totalDuration,
      stops: routes.length - 1,
      segments,
      layovers: this.calculateLayovers(routes),
    };
  }
  
  private calculateLayovers(routes: KiwiRoute[]) {
    const layovers = [];
    
    for (let i = 0; i < routes.length - 1; i++) {
      const arrivalTime = new Date(routes[i].utc_arrival);
      const departureTime = new Date(routes[i + 1].utc_departure);
      const durationMinutes = Math.round((departureTime.getTime() - arrivalTime.getTime()) / 60000);
      
      layovers.push({
        airport: {
          code: routes[i].flyTo,
          name: routes[i].cityTo,
          city: routes[i].cityTo,
          country: '',
          countryCode: routes[i].cityCodeTo,
          timezone: '',
        },
        durationMinutes,
        isOvernight: arrivalTime.getDate() !== departureTime.getDate(),
        terminalChange: false,
        isSelfTransfer: routes[i + 1].vi_connection || routes[i + 1].bags_recheck_required,
      });
    }
    
    return layovers;
  }
  
  private calculateDuration(departure: string, arrival: string): number {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    return Math.round((arr.getTime() - dep.getTime()) / 60000);
  }
  
  private parseDurationString(duration: string): number {
    const match = duration.match(/(\d+)h\s*(\d+)?m?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    
    return hours * 60 + minutes;
  }
  
  private mapFareClassToCabin(fareCategory: string): CabinClass {
    const mapping: Record<string, CabinClass> = {
      'M': CabinClass.ECONOMY,
      'W': CabinClass.PREMIUM_ECONOMY,
      'C': CabinClass.BUSINESS,
      'F': CabinClass.FIRST,
    };
    return mapping[fareCategory] || CabinClass.ECONOMY;
  }
  
  private mapPrice(flight: KiwiFlight, currency: string): UnifiedPrice {
    return {
      amount: flight.price,
      currency,
      formatted: this.formatPrice(flight.price, currency),
    };
  }
  
  private estimatePricePerTraveler(flight: KiwiFlight, currency: string): TravelerPrice[] {
    return [{
      travelerType: 'adult',
      count: 1,
      pricePerTraveler: {
        amount: flight.price,
        currency,
        formatted: this.formatPrice(flight.price, currency),
      },
      totalPrice: {
        amount: flight.price,
        currency,
        formatted: this.formatPrice(flight.price, currency),
      },
    }];
  }
}

// Register the adapter
registerAdapter(new KiwiAdapter());
