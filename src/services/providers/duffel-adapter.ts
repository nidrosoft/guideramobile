/**
 * DUFFEL PROVIDER ADAPTER
 * 
 * Implementation for Duffel API.
 * Supports: Flights
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
// DUFFEL RESPONSE TYPES
// ============================================

interface DuffelOfferRequest {
  data: {
    slices: {
      origin: string;
      destination: string;
      departure_date: string;
    }[];
    passengers: {
      type: 'adult' | 'child' | 'infant_without_seat';
    }[];
    cabin_class?: 'economy' | 'premium_economy' | 'business' | 'first';
  };
}

interface DuffelOfferResponse {
  data: {
    id: string;
    offers: DuffelOffer[];
  };
}

interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  base_amount: string;
  tax_amount: string;
  owner: {
    iata_code: string;
    name: string;
    logo_symbol_url: string;
  };
  slices: DuffelSlice[];
  passengers: DuffelPassenger[];
  payment_requirements: {
    requires_instant_payment: boolean;
    price_guarantee_expires_at: string;
  };
  conditions: {
    refund_before_departure: {
      allowed: boolean;
      penalty_amount: string;
      penalty_currency: string;
    };
    change_before_departure: {
      allowed: boolean;
      penalty_amount: string;
      penalty_currency: string;
    };
  };
}

interface DuffelSlice {
  id: string;
  origin: DuffelLocation;
  destination: DuffelLocation;
  duration: string;
  segments: DuffelSegment[];
}

interface DuffelSegment {
  id: string;
  origin: DuffelLocation;
  destination: DuffelLocation;
  departing_at: string;
  arriving_at: string;
  duration: string;
  marketing_carrier: {
    iata_code: string;
    name: string;
    logo_symbol_url: string;
  };
  operating_carrier: {
    iata_code: string;
    name: string;
  };
  marketing_carrier_flight_number: string;
  aircraft: {
    iata_code: string;
    name: string;
  };
  passengers: {
    passenger_id: string;
    cabin_class: string;
    cabin_class_marketing_name: string;
    baggages: {
      type: string;
      quantity: number;
    }[];
  }[];
}

interface DuffelLocation {
  iata_code: string;
  name: string;
  iata_city_code: string;
  city_name: string;
  iata_country_code: string;
  time_zone: string;
}

interface DuffelPassenger {
  id: string;
  type: string;
}

// ============================================
// DUFFEL ADAPTER
// ============================================

export class DuffelAdapter extends BaseProviderAdapter {
  readonly providerCode = 'duffel';
  readonly providerName = 'Duffel';
  readonly supportedCategories = ['flights'];
  
  protected getDefaultBaseUrl(environment: 'sandbox' | 'production'): string {
    return environment === 'production'
      ? 'https://api.duffel.com'
      : 'https://api.duffel.com'; // Duffel uses same URL with test API key
  }
  
  protected async getHeaders(): Promise<Record<string, string>> {
    if (!this.credentials?.apiKey) {
      throw new ProviderApiError(this.providerCode, 401, 'Missing API key');
    }
    
    return {
      'Authorization': `Bearer ${this.credentials.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Duffel-Version': 'v1',
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════════
  
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/air/airports?limit=1`, {
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
    const requestBody = this.buildOfferRequest(params);
    
    const response = await this.makeRequest<DuffelOfferResponse>(
      '/air/offer_requests',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      },
      context
    );
    
    const flights = response.data.offers.map(offer => 
      this.mapDuffelOfferToUnified(offer)
    );
    
    return {
      flights,
      totalCount: flights.length,
      hasMore: false,
    };
  }
  
  private buildOfferRequest(params: FlightSearchParams): DuffelOfferRequest {
    const slices = params.segments.map(segment => ({
      origin: segment.origin,
      destination: segment.destination,
      departure_date: segment.departureDate,
    }));
    
    const passengers: { type: 'adult' | 'child' | 'infant_without_seat' }[] = [];
    
    for (let i = 0; i < params.travelers.adults; i++) {
      passengers.push({ type: 'adult' });
    }
    for (let i = 0; i < params.travelers.children; i++) {
      passengers.push({ type: 'child' });
    }
    for (let i = 0; i < params.travelers.infants; i++) {
      passengers.push({ type: 'infant_without_seat' });
    }
    
    return {
      data: {
        slices,
        passengers,
        cabin_class: params.cabinClass ? this.mapCabinClass(params.cabinClass) : undefined,
      },
    };
  }
  
  private mapCabinClass(cabinClass: CabinClass): 'economy' | 'premium_economy' | 'business' | 'first' {
    const mapping: Record<CabinClass, 'economy' | 'premium_economy' | 'business' | 'first'> = {
      [CabinClass.ECONOMY]: 'economy',
      [CabinClass.PREMIUM_ECONOMY]: 'premium_economy',
      [CabinClass.BUSINESS]: 'business',
      [CabinClass.FIRST]: 'first',
    };
    return mapping[cabinClass];
  }
  
  private mapDuffelOfferToUnified(offer: DuffelOffer): UnifiedFlight {
    const slices = offer.slices.map((slice, index) => {
      const segments = slice.segments.map(seg => this.mapSegment(seg));
      const firstSeg = slice.segments[0];
      const lastSeg = slice.segments[slice.segments.length - 1];
      
      return {
        id: slice.id,
        origin: {
          code: slice.origin.iata_code,
          name: slice.origin.name,
          city: slice.origin.city_name,
          country: '',
          countryCode: slice.origin.iata_country_code,
          timezone: slice.origin.time_zone,
        },
        destination: {
          code: slice.destination.iata_code,
          name: slice.destination.name,
          city: slice.destination.city_name,
          country: '',
          countryCode: slice.destination.iata_country_code,
          timezone: slice.destination.time_zone,
        },
        departureAt: firstSeg.departing_at,
        arrivalAt: lastSeg.arriving_at,
        durationMinutes: this.parseDuration(slice.duration),
        stops: slice.segments.length - 1,
        segments,
        layovers: this.calculateLayovers(slice.segments),
      };
    });
    
    const price = this.mapPrice(offer);
    const pricePerTraveler = this.mapPassengerPricing(offer);
    
    return {
      id: this.generateOfferId(offer.id),
      providerOfferId: offer.id,
      provider: {
        code: this.providerCode,
        name: this.providerName,
        retrievedAt: new Date().toISOString(),
      },
      type: 'flight',
      tripType: offer.slices.length === 1 ? TripType.ONE_WAY : TripType.ROUND_TRIP,
      slices,
      totalStops: slices.reduce((sum, s) => sum + s.stops, 0),
      totalDurationMinutes: slices.reduce((sum, s) => sum + s.durationMinutes, 0),
      price,
      pricePerTraveler,
      baggage: this.mapBaggage(offer.slices[0]?.segments[0]),
      policies: {
        cancellation: {
          allowed: offer.conditions.refund_before_departure.allowed,
          penalty: offer.conditions.refund_before_departure.allowed ? {
            amount: parseFloat(offer.conditions.refund_before_departure.penalty_amount),
            currency: offer.conditions.refund_before_departure.penalty_currency,
            formatted: this.formatPrice(
              parseFloat(offer.conditions.refund_before_departure.penalty_amount),
              offer.conditions.refund_before_departure.penalty_currency
            ),
          } : undefined,
          refundType: offer.conditions.refund_before_departure.allowed ? 'partial' : 'none',
        },
        change: {
          allowed: offer.conditions.change_before_departure.allowed,
          penalty: offer.conditions.change_before_departure.allowed ? {
            amount: parseFloat(offer.conditions.change_before_departure.penalty_amount),
            currency: offer.conditions.change_before_departure.penalty_currency,
            formatted: this.formatPrice(
              parseFloat(offer.conditions.change_before_departure.penalty_amount),
              offer.conditions.change_before_departure.penalty_currency
            ),
          } : undefined,
        },
      },
      isRefundable: offer.conditions.refund_before_departure.allowed,
      isChangeable: offer.conditions.change_before_departure.allowed,
      isLivePrice: true,
      expiresAt: offer.payment_requirements.price_guarantee_expires_at,
      retrievedAt: new Date().toISOString(),
    };
  }
  
  private mapSegment(seg: DuffelSegment) {
    const passengerInfo = seg.passengers[0];
    
    return {
      id: seg.id,
      marketingCarrier: {
        code: seg.marketing_carrier.iata_code,
        name: seg.marketing_carrier.name,
        logoUrl: seg.marketing_carrier.logo_symbol_url,
      },
      operatingCarrier: {
        code: seg.operating_carrier.iata_code,
        name: seg.operating_carrier.name,
      },
      flightNumber: `${seg.marketing_carrier.iata_code}${seg.marketing_carrier_flight_number}`,
      aircraft: {
        code: seg.aircraft.iata_code,
        name: seg.aircraft.name,
      },
      origin: {
        code: seg.origin.iata_code,
        name: seg.origin.name,
        city: seg.origin.city_name,
        country: '',
        countryCode: seg.origin.iata_country_code,
        timezone: seg.origin.time_zone,
      },
      destination: {
        code: seg.destination.iata_code,
        name: seg.destination.name,
        city: seg.destination.city_name,
        country: '',
        countryCode: seg.destination.iata_country_code,
        timezone: seg.destination.time_zone,
      },
      departureAt: seg.departing_at,
      arrivalAt: seg.arriving_at,
      durationMinutes: this.parseDuration(seg.duration),
      cabinClass: this.mapCabinClassFromDuffel(passengerInfo?.cabin_class || 'economy'),
      bookingClass: undefined,
    };
  }
  
  private mapCabinClassFromDuffel(cabin: string): CabinClass {
    const mapping: Record<string, CabinClass> = {
      'economy': CabinClass.ECONOMY,
      'premium_economy': CabinClass.PREMIUM_ECONOMY,
      'business': CabinClass.BUSINESS,
      'first': CabinClass.FIRST,
    };
    return mapping[cabin] || CabinClass.ECONOMY;
  }
  
  private calculateLayovers(segments: DuffelSegment[]) {
    const layovers = [];
    
    for (let i = 0; i < segments.length - 1; i++) {
      const arrivalTime = new Date(segments[i].arriving_at);
      const departureTime = new Date(segments[i + 1].departing_at);
      const durationMinutes = Math.round((departureTime.getTime() - arrivalTime.getTime()) / 60000);
      
      layovers.push({
        airport: {
          code: segments[i].destination.iata_code,
          name: segments[i].destination.name,
          city: segments[i].destination.city_name,
          country: '',
          countryCode: segments[i].destination.iata_country_code,
          timezone: segments[i].destination.time_zone,
        },
        durationMinutes,
        isOvernight: arrivalTime.getDate() !== departureTime.getDate(),
        terminalChange: false,
        isSelfTransfer: false,
      });
    }
    
    return layovers;
  }
  
  private mapPrice(offer: DuffelOffer): UnifiedPrice {
    const amount = parseFloat(offer.total_amount);
    
    return {
      amount,
      currency: offer.total_currency,
      formatted: this.formatPrice(amount, offer.total_currency),
      breakdown: {
        base: parseFloat(offer.base_amount),
        taxes: parseFloat(offer.tax_amount),
        fees: 0,
      },
    };
  }
  
  private mapPassengerPricing(offer: DuffelOffer): TravelerPrice[] {
    const totalAmount = parseFloat(offer.total_amount);
    const passengerCount = offer.passengers.length;
    const perPassenger = totalAmount / passengerCount;
    
    return offer.passengers.map(p => ({
      travelerType: p.type === 'adult' ? 'adult' : p.type === 'child' ? 'child' : 'infant',
      count: 1,
      pricePerTraveler: {
        amount: perPassenger,
        currency: offer.total_currency,
        formatted: this.formatPrice(perPassenger, offer.total_currency),
      },
      totalPrice: {
        amount: perPassenger,
        currency: offer.total_currency,
        formatted: this.formatPrice(perPassenger, offer.total_currency),
      },
    }));
  }
  
  private mapBaggage(segment?: DuffelSegment) {
    const passengerBaggage = segment?.passengers[0]?.baggages || [];
    const checkedBag = passengerBaggage.find(b => b.type === 'checked');
    const cabinBag = passengerBaggage.find(b => b.type === 'carry_on');
    
    return {
      cabin: {
        included: (cabinBag?.quantity || 0) > 0,
        quantity: cabinBag?.quantity || 1,
      },
      checked: {
        included: (checkedBag?.quantity || 0) > 0,
        quantity: checkedBag?.quantity || 0,
      },
    };
  }
}

// Register the adapter
registerAdapter(new DuffelAdapter());
