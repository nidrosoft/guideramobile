import {
  buildDestinationDetailsKey,
  buildDestinationDetailsRateLimitConfigs,
  DESTINATION_DETAILS_NAMESPACE,
  resolveDestinationDetailsRequesterKey,
} from '../../../supabase/functions/_shared/destinations/destinationDetailsScale';

describe('destinationDetailsScale', () => {
  it('builds stable destination keys from ids', () => {
    expect(
      buildDestinationDetailsKey({
        destinationId: '  8F0B4B41-15B7-4F0D-AE53-829D13D001A4  ',
        city: 'Paris',
        country: 'France',
      })
    ).toBe('id:8f0b4b41-15b7-4f0d-ae53-829d13d001a4');
  });

  it('falls back to normalized city and country when id is missing', () => {
    expect(
      buildDestinationDetailsKey({
        city: '  Cape   Town ',
        country: ' South Africa ',
      })
    ).toBe('city:cape town|south africa');
  });

  it('builds Google, AI, requester, destination, and global rate-limit buckets', () => {
    expect(
      buildDestinationDetailsRateLimitConfigs({
        destinationId: 'dest-123',
        city: 'Paris',
        country: 'France',
        userId: 'profile-123',
      })
    ).toEqual([
      {
        namespace: DESTINATION_DETAILS_NAMESPACE,
        bucketKey: 'user:profile-123',
        windowSeconds: 60,
        maxRequests: 12,
      },
      {
        namespace: DESTINATION_DETAILS_NAMESPACE,
        bucketKey: 'destination:id:dest-123',
        windowSeconds: 300,
        maxRequests: 20,
      },
      {
        namespace: DESTINATION_DETAILS_NAMESPACE,
        bucketKey: 'provider:google_places',
        windowSeconds: 60,
        maxRequests: 90,
      },
      {
        namespace: DESTINATION_DETAILS_NAMESPACE,
        bucketKey: 'provider:gemini',
        windowSeconds: 60,
        maxRequests: 60,
      },
      {
        namespace: DESTINATION_DETAILS_NAMESPACE,
        bucketKey: 'global',
        windowSeconds: 60,
        maxRequests: 120,
      },
    ]);
  });

  it('falls back to client id or forwarded ip for requester keys', () => {
    expect(
      resolveDestinationDetailsRequesterKey(new Headers({ 'x-guidera-client-id': 'device-abc' }))
    ).toBe('device:device-abc');

    expect(
      resolveDestinationDetailsRequesterKey(
        new Headers({ 'x-forwarded-for': '203.0.113.10, 10.0.0.1' })
      )
    ).toBe('ip:203.0.113.10');
  });
});
