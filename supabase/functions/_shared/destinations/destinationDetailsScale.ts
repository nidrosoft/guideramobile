export const DESTINATION_DETAILS_NAMESPACE = 'destination_details';
export const DESTINATION_DETAILS_LOCK_TTL_SECONDS = 90;
export const DESTINATION_DETAILS_COALESCE_WAIT_MS = 12_000;
export const DESTINATION_DETAILS_COALESCE_POLL_MS = 750;

export interface EdgeRateLimitConfig {
  namespace: string;
  bucketKey: string;
  windowSeconds: number;
  maxRequests: number;
}

export interface DestinationDetailsScaleInput {
  destinationId?: string | null;
  city?: string | null;
  country?: string | null;
  userId?: string | null;
  requesterKey?: string | null;
}

function normalizeDestinationDetailsKey(value: string): string {
  return value
    .trim()
    .replace(/\s*:\s*/g, ':')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .slice(0, 500);
}

export function buildDestinationDetailsKey(input: DestinationDetailsScaleInput): string {
  if (input.destinationId?.trim()) {
    return `id:${normalizeDestinationDetailsKey(input.destinationId)}`.slice(0, 500);
  }

  const city = normalizeDestinationDetailsKey(input.city || 'unknown');
  const country = normalizeDestinationDetailsKey(input.country || 'unknown');
  return `city:${city}|${country}`.slice(0, 500);
}

export function resolveDestinationDetailsRequesterKey(
  headers: Headers,
  userId?: string | null
): string {
  if (userId) {
    return `user:${normalizeDestinationDetailsKey(userId)}`;
  }

  const clientId = headers.get('x-guidera-client-id') || headers.get('X-Guidera-Client-Id');
  if (clientId) {
    return `device:${normalizeDestinationDetailsKey(clientId)}`;
  }

  const forwardedFor = headers.get('x-forwarded-for') || headers.get('X-Forwarded-For');
  const ip = forwardedFor?.split(',')[0]?.trim();
  if (ip) {
    return `ip:${normalizeDestinationDetailsKey(ip)}`;
  }

  return 'anonymous';
}

export function buildDestinationDetailsRateLimitConfigs(
  input: DestinationDetailsScaleInput
): EdgeRateLimitConfig[] {
  const requesterKey = input.userId ? `user:${input.userId}` : input.requesterKey || 'anonymous';
  const destinationKey = buildDestinationDetailsKey(input);

  return [
    {
      namespace: DESTINATION_DETAILS_NAMESPACE,
      bucketKey: requesterKey,
      windowSeconds: 60,
      maxRequests: 12,
    },
    {
      namespace: DESTINATION_DETAILS_NAMESPACE,
      bucketKey: `destination:${destinationKey}`,
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
  ];
}
