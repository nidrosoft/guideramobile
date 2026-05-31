export const EVENT_DISCOVERY_NAMESPACE = 'events';
export const EVENT_DISCOVERY_LOCK_TTL_SECONDS = 90;
export const EVENT_DISCOVERY_COALESCE_WAIT_MS = 12_000;
export const EVENT_DISCOVERY_COALESCE_POLL_MS = 750;

export interface EdgeRateLimitConfig {
  namespace: string;
  bucketKey: string;
  windowSeconds: number;
  maxRequests: number;
}

export interface EventDiscoveryScaleInput {
  city: string;
  country: string;
  category?: string | null;
  month?: string | null;
  userId?: string | null;
  requesterKey?: string | null;
}

function normalizeEventScaleKey(value: string): string {
  return value
    .trim()
    .replace(/\s*:\s*/g, ':')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .slice(0, 500);
}

export function buildEventDiscoveryKey(input: EventDiscoveryScaleInput): string {
  const city = normalizeEventScaleKey(input.city || 'unknown');
  const country = normalizeEventScaleKey(input.country || 'unknown');

  return `${city}|${country}`.slice(0, 500);
}

export function resolveEventRequesterKey(headers: Headers, userId?: string | null): string {
  if (userId) {
    return `user:${normalizeEventScaleKey(userId)}`;
  }

  const clientId = headers.get('x-guidera-client-id') || headers.get('X-Guidera-Client-Id');
  if (clientId) {
    return `device:${normalizeEventScaleKey(clientId)}`;
  }

  const forwardedFor = headers.get('x-forwarded-for') || headers.get('X-Forwarded-For');
  const ip = forwardedFor?.split(',')[0]?.trim();
  if (ip) {
    return `ip:${normalizeEventScaleKey(ip)}`;
  }

  return 'anonymous';
}

export function buildEventRateLimitConfigs(input: EventDiscoveryScaleInput): EdgeRateLimitConfig[] {
  const requesterKey = input.userId ? `user:${input.userId}` : input.requesterKey || 'anonymous';
  const destinationKey = buildEventDiscoveryKey(input);

  return [
    {
      namespace: EVENT_DISCOVERY_NAMESPACE,
      bucketKey: requesterKey,
      windowSeconds: 60,
      maxRequests: 6,
    },
    {
      namespace: EVENT_DISCOVERY_NAMESPACE,
      bucketKey: `destination:${destinationKey}`,
      windowSeconds: 300,
      maxRequests: 3,
    },
    {
      namespace: EVENT_DISCOVERY_NAMESPACE,
      bucketKey: 'global',
      windowSeconds: 60,
      maxRequests: 90,
    },
  ];
}
