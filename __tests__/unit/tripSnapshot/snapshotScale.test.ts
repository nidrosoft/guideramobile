import {
  buildSnapshotResponseCacheKey,
  buildSnapshotRateLimitKeys,
  normalizeSnapshotCacheInput,
} from '../../../supabase/functions/_shared/tripSnapshot/snapshotScale';

describe('snapshotScale', () => {
  it('builds the same response cache key for equivalent destination casing and whitespace', () => {
    const first = buildSnapshotResponseCacheKey({
      destination: '  Douala ',
      country: ' Cameroon ',
      startDate: '2026-06-07',
      endDate: '2026-06-12',
      originCity: 'New York',
      currency: 'usd',
      nationality: 'US citizen',
      travelers: { adults: 1, children: 0, infants: 0 },
    });

    const second = buildSnapshotResponseCacheKey({
      destination: 'douala',
      country: 'cameroon',
      startDate: '2026-06-07',
      endDate: '2026-06-12',
      originCity: ' new york ',
      currency: 'USD',
      nationality: 'us citizen',
      travelers: { adults: 1, children: 0, infants: 0 },
    });

    expect(second).toBe(first);
    expect(first).toBe('snapshot:data:v1:douala|cameroon|new york|2026-06-07|2026-06-12|1|0|0|usd|us citizen');
  });

  it('normalizes missing traveler fields and currency defaults', () => {
    const normalized = normalizeSnapshotCacheInput({
      destination: 'Paris',
      startDate: '2026-07-01',
      endDate: '2026-07-05',
    });

    expect(normalized).toEqual({
      destination: 'paris',
      country: '',
      originCity: '',
      originAirport: '',
      startDate: '2026-07-01',
      endDate: '2026-07-05',
      adults: 1,
      children: 0,
      infants: 0,
      currency: 'usd',
      nationality: '',
    });
  });

  it('creates user, destination, and global cold-start rate-limit keys', () => {
    const keys = buildSnapshotRateLimitKeys({
      userId: 'user_123',
      destination: 'Douala',
      country: 'Cameroon',
      startDate: '2026-06-07',
      endDate: '2026-06-12',
    });

    expect(keys).toEqual([
      { key: 'snapshot:user:user_123', windowSeconds: 60, maxRequests: 12 },
      { key: 'snapshot:destination:douala|cameroon|2026-06-07|2026-06-12', windowSeconds: 60, maxRequests: 90 },
      { key: 'snapshot:global', windowSeconds: 60, maxRequests: 300 },
    ]);
  });
});
