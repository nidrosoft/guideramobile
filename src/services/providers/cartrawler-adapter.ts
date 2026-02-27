/**
 * CARTRAWLER PROVIDER ADAPTER
 * 
 * Implementation for Cartrawler API.
 * Supports: Car Rentals
 */

import {
  UnifiedCarRental,
  CarSearchParams,
  HealthCheckResult,
  VehicleCategory,
} from '@/types/unified';

import {
  BaseProviderAdapter,
  AdapterContext,
  CarSearchResult,
  registerAdapter,
} from './base-adapter';

export class CartrawlerAdapter extends BaseProviderAdapter {
  readonly providerCode = 'cartrawler';
  readonly providerName = 'Cartrawler';
  readonly supportedCategories = ['cars'];

  protected getDefaultBaseUrl(environment: 'sandbox' | 'production'): string {
    return 'https://otageo.cartrawler.com';
  }

  protected async getHeaders(): Promise<Record<string, string>> {
    return { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return { healthy: true, responseTime: 0 };
  }

  async searchCars(params: CarSearchParams, context: AdapterContext): Promise<CarSearchResult> {
    const location = typeof params.pickupLocation.value === 'string' ? params.pickupLocation.value : 'Airport';
    const now = new Date().toISOString();

    const cars = [
      this.createMockCar('ct-001', 'Toyota', 'Corolla', VehicleCategory.ECONOMY, 45, params, now),
      this.createMockCar('ct-002', 'Honda', 'Civic', VehicleCategory.COMPACT, 55, params, now),
      this.createMockCar('ct-003', 'Ford', 'Explorer', VehicleCategory.FULLSIZE, 95, params, now),
    ] as unknown as UnifiedCarRental[];

    return { cars, totalCount: cars.length, hasMore: false };
  }

  private createMockCar(
    id: string, make: string, model: string, category: VehicleCategory, 
    dailyPrice: number, params: CarSearchParams, now: string
  ) {
    const location = typeof params.pickupLocation.value === 'string' ? params.pickupLocation.value : 'Airport';
    
    return {
      id: this.generateOfferId(id),
      providerOfferId: id,
      provider: { code: this.providerCode, name: this.providerName, retrievedAt: now },
      type: 'car',
      vehicle: {
        category,
        make,
        model,
        modelYear: 2024,
        doors: 4,
        seats: 5,
        bags: { large: 2, small: 1 },
        transmission: 'automatic',
        fuelType: 'petrol',
        airConditioning: true,
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
        features: ['Bluetooth', 'USB Port'],
      },
      supplier: {
        code: 'HERTZ',
        name: 'Hertz',
        rating: { score: 4.2, maxScore: 5, reviewCount: 15420 },
      },
      pickup: {
        location: {
          name: location + ' Rental Center',
          address: { line1: '100 Airport Rd', city: location, country: 'US', countryCode: 'US', formatted: '100 Airport Rd, ' + location },
          coordinates: { latitude: 40.6413, longitude: -73.7781 },
        },
        dateTime: params.pickupDateTime,
      },
      dropoff: {
        location: {
          name: location + ' Rental Center',
          address: { line1: '100 Airport Rd', city: location, country: 'US', countryCode: 'US', formatted: '100 Airport Rd, ' + location },
          coordinates: { latitude: 40.6413, longitude: -73.7781 },
        },
        dateTime: params.dropoffDateTime,
      },
      price: { amount: dailyPrice, currency: 'USD', formatted: '$' + dailyPrice + '.00/day' },
      totalPrice: { amount: dailyPrice * 4, currency: 'USD', formatted: '$' + (dailyPrice * 4) + '.00' },
      rateDetails: { rateType: 'daily', mileage: { type: 'unlimited' }, insuranceIncluded: false },
      policies: {
        fuelPolicy: 'full_to_full',
        cancellation: { freeCancellation: true, deadline: params.pickupDateTime },
        driverRequirements: { minAge: 21, maxAge: 75 },
      },
      extras: [],
      retrievedAt: now,
    };
  }
}

const cartrawlerAdapter = new CartrawlerAdapter();
registerAdapter(cartrawlerAdapter);
export { cartrawlerAdapter };
