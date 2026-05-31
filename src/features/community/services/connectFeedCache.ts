const DEFAULT_TTL_MS = 45_000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export const CONNECT_FEED_CACHE_TTL_MS = DEFAULT_TTL_MS;

export function getConnectFeedCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setConnectFeedCache<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export async function getOrSetConnectFeedCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttlMs?: number; forceRefresh?: boolean } = {}
): Promise<T> {
  if (!options.forceRefresh) {
    const cached = getConnectFeedCache<T>(key);
    if (cached) return cached;

    const existing = inFlight.get(key);
    if (existing) return existing as Promise<T>;
  }

  const promise = fetcher()
    .then((value) => {
      setConnectFeedCache(key, value, options.ttlMs ?? DEFAULT_TTL_MS);
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

export function clearConnectFeedCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    inFlight.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
  for (const key of inFlight.keys()) {
    if (key.includes(pattern)) inFlight.delete(key);
  }
}
