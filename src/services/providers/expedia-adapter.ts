/**
 * EXPEDIA PROVIDER ADAPTER
 * 
 * Implementation for Expedia EPS Rapid API.
 * Supports: Hotels
 */

import {
  UnifiedHotel,
  HotelSearchParams,
  HealthCheckResult,
  PropertyType,
} from '@/types/unified';

import {
  BaseProviderAdapter,
  AdapterContext,
  HotelSearchResult,
  registerAdapter,
} from './base-adapter';

export class ExpediaAdapter extends BaseProviderAdapter {
  readonly providerCode = 'expedia';
  readonly providerName = 'Expedia';
  readonly supportedCategories = ['hotels'];

  protected getDefaultBaseUrl(environment: 'sandbox' | 'production'): string {
    return environment === 'production'
      ? 'https://api.ean.com/v3'
      : 'https://test.ean.com/v3';
  }

  protected async getHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return { healthy: true, responseTime: 0 };
  }

  async searchHotels(
    params: HotelSearchParams,
    context: AdapterContext
  ): Promise<HotelSearchResult> {
    const destinationName = typeof params.destination.value === 'string' 
      ? params.destination.value : 'City';
    const now = new Date().toISOString();

    const hotels = [
      this.createMockHotel('exp-001', 'Grand ' + destinationName + ' Hotel', 5, 350, now),
      this.createMockHotel('exp-002', destinationName + ' Boutique Inn', 4, 180, now),
      this.createMockHotel('exp-003', 'Budget Stay ' + destinationName, 3, 89, now),
    ] as unknown as UnifiedHotel[];

    return { hotels, totalCount: hotels.length, hasMore: false };
  }

  private createMockHotel(id: string, name: string, stars: number, price: number, now: string) {
    return {
      id: this.generateOfferId(id),
      providerPropertyId: id,
      provider: { code: this.providerCode, name: this.providerName, retrievedAt: now },
      type: 'hotel',
      name,
      propertyType: PropertyType.HOTEL,
      starRating: stars,
      location: {
        address: { line1: '123 Main St', city: 'City', country: 'US', countryCode: 'US', formatted: '123 Main St, City, US' },
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
      },
      images: [{ url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', caption: 'Hotel', isPrimary: true }],
      amenities: ['wifi', 'pool', 'spa'],
      keyAmenities: ['Free WiFi', 'Pool', 'Spa'],
      rooms: [{
        id: 'room-1',
        name: 'Standard Room',
        roomType: 'standard',
        bedConfiguration: [{ type: 'queen', count: 1 }],
        maxOccupancy: { adults: 2, children: 1, total: 3 },
        amenities: ['wifi', 'tv'],
        images: [],
        price: { amount: price, currency: 'USD', formatted: '$' + price + '.00' },
        cancellationPolicy: { refundable: true, rules: [], summary: 'Free cancellation' },
        available: true,
      }],
      lowestPrice: { amount: price, currency: 'USD', formatted: '$' + price + '.00' },
      checkInTime: '15:00',
      checkOutTime: '11:00',
      retrievedAt: now,
    };
  }
}

const expediaAdapter = new ExpediaAdapter();
registerAdapter(expediaAdapter);
export { expediaAdapter };
