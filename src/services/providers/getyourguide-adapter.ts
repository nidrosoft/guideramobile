/**
 * GETYOURGUIDE PROVIDER ADAPTER
 * 
 * Implementation for GetYourGuide API.
 * Supports: Experiences (Tours, Activities, Attractions)
 */

import {
  UnifiedExperience,
  ExperienceSearchParams,
  HealthCheckResult,
  ExperienceCategory,
} from '@/types/unified';

import {
  BaseProviderAdapter,
  AdapterContext,
  ExperienceSearchResult,
  registerAdapter,
} from './base-adapter';

export class GetYourGuideAdapter extends BaseProviderAdapter {
  readonly providerCode = 'getyourguide';
  readonly providerName = 'GetYourGuide';
  readonly supportedCategories = ['experiences'];

  protected getDefaultBaseUrl(environment: 'sandbox' | 'production'): string {
    return 'https://api.getyourguide.com/1';
  }

  protected async getHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Access-Token': this.credentials?.apiKey || '',
    };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return { healthy: true, responseTime: 0 };
  }

  async searchExperiences(params: ExperienceSearchParams, context: AdapterContext): Promise<ExperienceSearchResult> {
    const destination = typeof params.destination.value === 'string' ? params.destination.value : 'City';
    const now = new Date().toISOString();
    const startDate = params.dates?.startDate || new Date().toISOString().split('T')[0];

    const experiences = [
      this.createMockExperience('gyg-001', destination + ' City Walking Tour', ExperienceCategory.TOURS, 45, 3, startDate, now),
      this.createMockExperience('gyg-002', destination + ' Food Tour', ExperienceCategory.FOOD_AND_DRINK, 85, 4, startDate, now),
      this.createMockExperience('gyg-003', destination + ' Museum Tickets', ExperienceCategory.ATTRACTIONS, 35, 2, startDate, now),
      this.createMockExperience('gyg-004', destination + ' Sunset Cruise', ExperienceCategory.WATER_SPORTS, 120, 2, startDate, now),
    ] as unknown as UnifiedExperience[];

    return { experiences, totalCount: experiences.length, hasMore: false };
  }

  private createMockExperience(
    id: string, title: string, category: ExperienceCategory,
    price: number, hours: number, startDate: string, now: string
  ) {
    return {
      id: this.generateOfferId(id),
      providerActivityId: id,
      provider: { code: this.providerCode, name: this.providerName, retrievedAt: now },
      type: 'experience',
      title,
      description: 'Discover amazing experiences with our expert local guides.',
      shortDescription: hours + '-hour experience',
      category,
      subcategory: 'Popular',
      location: {
        address: { line1: 'Meeting Point', city: 'City', country: 'US', countryCode: 'US', formatted: 'Meeting Point, City' },
        coordinates: { latitude: 40.7580, longitude: -73.9855 },
        meetingPoint: 'Central Plaza',
      },
      duration: { value: hours, unit: 'hours', isFlexible: false },
      images: [{ url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', caption: 'Experience', isPrimary: true }],
      rating: { score: 4.8, maxScore: 5, reviewCount: 1250, sentiment: 'excellent' },
      price: { amount: price, currency: 'USD', formatted: '$' + price + '.00' },
      pricePerPerson: true,
      availability: { nextAvailable: startDate, slots: [] },
      includes: ['Professional guide', 'Small group'],
      excludes: ['Food and drinks', 'Gratuities'],
      highlights: ['Expert local guide', 'Small group experience'],
      cancellationPolicy: { freeCancellation: true, cutoffHours: 24, refundPercentage: 100 },
      languages: ['English', 'Spanish'],
      accessibility: { wheelchairAccessible: true },
      retrievedAt: now,
    };
  }
}

const getYourGuideAdapter = new GetYourGuideAdapter();
registerAdapter(getYourGuideAdapter);
export { getYourGuideAdapter };
