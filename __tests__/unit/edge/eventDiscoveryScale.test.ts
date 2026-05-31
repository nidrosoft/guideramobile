import {
  buildEventDiscoveryKey,
  buildEventRateLimitConfigs,
  resolveEventRequesterKey,
} from '../../../supabase/functions/_shared/events/eventDiscoveryScale';

describe('eventDiscoveryScale', () => {
  it('builds stable location keys for duplicate event discovery requests', () => {
    expect(
      buildEventDiscoveryKey({
        city: '  Paris ',
        country: ' FRANCE ',
        category: ' Music & Concerts ',
        month: ' June ',
      })
    ).toBe('paris|france');
  });

  it('uses the same city-country key across categories and months', () => {
    expect(buildEventDiscoveryKey({ city: 'Douala', country: 'Cameroon' })).toBe('douala|cameroon');
    expect(
      buildEventDiscoveryKey({
        city: 'Douala',
        country: 'Cameroon',
        category: 'Food',
        month: 'July',
      })
    ).toBe('douala|cameroon');
  });

  it('builds user, destination, and global durable rate-limit buckets', () => {
    expect(
      buildEventRateLimitConfigs({
        city: 'Paris',
        country: 'France',
        userId: 'profile-123',
      })
    ).toEqual([
      { namespace: 'events', bucketKey: 'user:profile-123', windowSeconds: 60, maxRequests: 6 },
      {
        namespace: 'events',
        bucketKey: 'destination:paris|france',
        windowSeconds: 300,
        maxRequests: 3,
      },
      { namespace: 'events', bucketKey: 'global', windowSeconds: 60, maxRequests: 90 },
    ]);
  });

  it('falls back to client id or forwarded ip for unauthenticated requests', () => {
    expect(
      resolveEventRequesterKey(new Headers({ 'x-guidera-client-id': 'device-abc' }), null)
    ).toBe('device:device-abc');

    expect(
      resolveEventRequesterKey(new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }), null)
    ).toBe('ip:1.2.3.4');
  });
});
