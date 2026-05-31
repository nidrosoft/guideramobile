import {
  clearConnectFeedCache,
  getConnectFeedCache,
  getOrSetConnectFeedCache,
  setConnectFeedCache,
} from '@/features/community/services/connectFeedCache';

describe('connectFeedCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-28T00:00:00Z'));
    clearConnectFeedCache();
  });

  afterEach(() => {
    jest.useRealTimers();
    clearConnectFeedCache();
  });

  it('returns cached data until the ttl expires', () => {
    setConnectFeedCache('connect:discover:user-1', { sections: 3 }, 1000);

    expect(getConnectFeedCache('connect:discover:user-1')).toEqual({ sections: 3 });

    jest.advanceTimersByTime(1001);

    expect(getConnectFeedCache('connect:discover:user-1')).toBeNull();
  });

  it('dedupes concurrent fetches for the same key', async () => {
    const fetcher = jest.fn().mockResolvedValue({ sections: 6 });

    const [first, second] = await Promise.all([
      getOrSetConnectFeedCache('connect:discover:user-1', fetcher),
      getOrSetConnectFeedCache('connect:discover:user-1', fetcher),
    ]);

    expect(first).toEqual({ sections: 6 });
    expect(second).toEqual({ sections: 6 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('can clear only matching cache keys', () => {
    setConnectFeedCache('connect:discover:user-1', 'discover');
    setConnectFeedCache('connect:groups:user-1', 'groups');

    clearConnectFeedCache('discover');

    expect(getConnectFeedCache('connect:discover:user-1')).toBeNull();
    expect(getConnectFeedCache('connect:groups:user-1')).toBe('groups');
  });
});
