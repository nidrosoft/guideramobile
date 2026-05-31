import {
  BOOKING_NAMESPACE,
  buildBookingCacheKey,
  buildBookingRateLimitConfigs,
  buildBookingRouteKey,
  withBookingTimeout,
} from '../../../supabase/functions/_shared/booking/bookingScale';

describe('bookingScale', () => {
  it('builds stable cache keys while ignoring volatile client options', () => {
    const baseParams = {
      segments: [{ origin: ' JFK ', destination: ' LAX ', departureDate: '2026-06-10' }],
      travelers: { adults: 2, children: 0, infants: 0 },
      cabinClass: 'economy',
      strategy: 'price_compare',
      refresh: false,
      limit: 20,
    };

    const reorderedParams = {
      refresh: true,
      limit: 50,
      cabinClass: 'economy',
      travelers: { infants: 0, children: 0, adults: 2 },
      strategy: 'comprehensive',
      segments: [{ departureDate: '2026-06-10', destination: 'lax', origin: 'jfk' }],
    };

    expect(buildBookingCacheKey('flights', baseParams)).toBe(
      buildBookingCacheKey('flights', reorderedParams)
    );
    expect(buildBookingCacheKey('hotels', baseParams)).not.toBe(
      buildBookingCacheKey('flights', baseParams)
    );
  });

  it('builds normalized route keys for flight searches', () => {
    expect(
      buildBookingRouteKey('flights', {
        segments: [
          { origin: ' JFK ', destination: ' LAX ', departureDate: '2026-06-10' },
          { origin: 'lax', destination: 'jfk', departureDate: '2026-06-17' },
        ],
        travelers: { adults: 2, children: 1, infants: 0 },
        cabinClass: 'Economy',
      })
    ).toBe('flights:jfk-lax-2026-06-10_lax-jfk-2026-06-17:travelers=3:cabin=economy');
  });

  it('builds normalized route keys for hotel searches', () => {
    expect(
      buildBookingRouteKey('hotels', {
        destination: { type: 'city', value: ' Paris, France ' },
        checkInDate: '2026-07-01',
        checkOutDate: '2026-07-05',
        rooms: [{ adults: 2, children: 1 }],
      })
    ).toBe('hotels:paris, france:2026-07-01-2026-07-05:travelers=3');
  });

  it('includes package bundle categories in route keys', () => {
    expect(
      buildBookingRouteKey('packages', {
        destination: 'Paris, France',
        startDate: '2026-07-01',
        endDate: '2026-07-05',
        travelers: { adults: 2 },
        includedCategories: ['flights', 'hotels', 'experiences'],
      })
    ).toBe(
      'packages:paris, france:2026-07-01-2026-07-05:travelers=2:bundle=experiences+flights+hotels'
    );
  });

  it('builds durable user, route, provider, and global rate-limit buckets', () => {
    expect(
      buildBookingRateLimitConfigs({
        category: 'flights',
        userId: 'profile-123',
        routeKey: 'flights:jfk-lax-2026-06-10:travelers=2:cabin=economy',
        providerCodes: ['google_flights', 'kiwi'],
      })
    ).toEqual([
      {
        namespace: BOOKING_NAMESPACE,
        bucketKey: 'user:profile-123',
        windowSeconds: 60,
        maxRequests: 12,
      },
      {
        namespace: BOOKING_NAMESPACE,
        bucketKey: 'route:flights:jfk-lax-2026-06-10:travelers=2:cabin=economy',
        windowSeconds: 300,
        maxRequests: 4,
      },
      {
        namespace: BOOKING_NAMESPACE,
        bucketKey: 'provider:google_flights',
        windowSeconds: 60,
        maxRequests: 60,
      },
      {
        namespace: BOOKING_NAMESPACE,
        bucketKey: 'provider:kiwi',
        windowSeconds: 60,
        maxRequests: 60,
      },
      {
        namespace: BOOKING_NAMESPACE,
        bucketKey: 'global',
        windowSeconds: 60,
        maxRequests: 180,
      },
    ]);
  });

  it('rejects provider operations that exceed the booking timeout', async () => {
    await expect(
      withBookingTimeout(new Promise((resolve) => setTimeout(resolve, 25)), 1, 'kiwi flights')
    ).rejects.toMatchObject({
      code: 'PROVIDER_TIMEOUT',
      status: 504,
      message: 'kiwi flights timed out after 1ms',
    });
  });
});
