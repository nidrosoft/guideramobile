export const BOOKING_NAMESPACE = 'booking';
export const BOOKING_LOCK_TTL_SECONDS = 45;
export const BOOKING_COALESCE_WAIT_MS = 8_000;
export const BOOKING_COALESCE_POLL_MS = 250;

type BookingCategory = 'flights' | 'hotels' | 'cars' | 'experiences' | 'packages' | string;

interface BookingRateLimitInput {
  category: BookingCategory;
  userId?: string | null;
  requesterKey?: string | null;
  routeKey: string;
  providerCodes?: string[];
}

const VOLATILE_CACHE_PARAMS = new Set([
  'clientRequestId',
  'forceRefresh',
  'limit',
  'refresh',
  'sessionId',
  'strategy',
  'timeout',
  'userId',
  'user_id',
]);

function normalizeValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
      .trim()
      .replace(/\s*:\s*/g, ':')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .slice(0, 500);
  }
  if (value == null) return '';
  return normalizeValue(String(value));
}

function resolveParam(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.value === 'string') return record.value;
    if (typeof record.code === 'string') return record.code;
    if (typeof record.name === 'string') return record.name;
  }
  return value == null ? '' : String(value);
}

function canonicalize(value: unknown): unknown {
  if (value == null) return undefined;
  if (typeof value === 'string') return normalizeValue(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.map(canonicalize).filter((item) => item !== undefined);
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        if (VOLATILE_CACHE_PARAMS.has(key)) return acc;
        const canonical = canonicalize(record[key]);
        if (canonical !== undefined) acc[key] = canonical;
        return acc;
      }, {});
  }
  return normalizeValue(value);
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function buildBookingCacheKey(
  category: BookingCategory,
  params: Record<string, unknown>
): string {
  const normalizedCategory = normalizeValue(category);
  const canonicalParams = canonicalize(params);
  return `booking:${normalizedCategory}:${hashString(JSON.stringify(canonicalParams))}`;
}

function getTravelerCount(params: Record<string, unknown>): number {
  const travelers = (params.travelers || params.passengers) as Record<string, unknown> | undefined;
  if (travelers && typeof travelers === 'object') {
    return Math.max(
      1,
      Number(travelers.adults || 0) +
        Number(travelers.children || 0) +
        Number(travelers.infants || 0)
    );
  }

  const rooms = params.rooms;
  if (Array.isArray(rooms)) {
    return Math.max(
      1,
      rooms.reduce((sum, room) => {
        if (!room || typeof room !== 'object') return sum;
        const record = room as Record<string, unknown>;
        return sum + Number(record.adults || 0) + Number(record.children || 0);
      }, 0)
    );
  }

  return Math.max(
    1,
    Number(params.adults || 0) + Number(params.children || 0) + Number(params.infants || 0)
  );
}

function buildFlightRouteKey(params: Record<string, unknown>): string {
  const segments = Array.isArray(params.segments)
    ? params.segments
    : [
        {
          origin: params.origin || params.originCode,
          destination: params.destination || params.destinationCode,
          departureDate: params.departureDate || params.outboundDate,
        },
      ];
  const segmentKey = segments
    .map((segment) => {
      const record = (segment || {}) as Record<string, unknown>;
      return [
        normalizeValue(resolveParam(record.origin)),
        normalizeValue(resolveParam(record.destination)),
        normalizeValue(resolveParam(record.departureDate)),
      ].join('-');
    })
    .join('_');
  const cabin = normalizeValue(params.cabinClass || 'economy');
  return `flights:${segmentKey}:travelers=${getTravelerCount(params)}:cabin=${cabin}`;
}

function buildStayRouteKey(category: string, params: Record<string, unknown>): string {
  const destination = normalizeValue(resolveParam(params.destination || params.pickupLocation));
  const start = normalizeValue(params.checkInDate || params.pickupDateTime || params.startDate);
  const end = normalizeValue(
    params.checkOutDate || params.dropoffDateTime || params.endDate || start
  );
  const baseKey = `${category}:${destination}:${start}-${end}:travelers=${getTravelerCount(params)}`;
  if (category !== 'packages') return baseKey;

  const bundleCategories = Array.isArray(params.includedCategories)
    ? params.includedCategories.map(normalizeValue).sort().join('+')
    : 'flights+hotels';
  return `${baseKey}:bundle=${bundleCategories}`;
}

export function buildBookingRouteKey(
  category: BookingCategory,
  params: Record<string, unknown>
): string {
  const normalizedCategory = normalizeValue(category);
  if (normalizedCategory === 'flights') return buildFlightRouteKey(params);
  if (['hotels', 'cars', 'experiences', 'packages'].includes(normalizedCategory)) {
    return buildStayRouteKey(normalizedCategory, params);
  }
  return `${normalizedCategory}:${buildBookingCacheKey(normalizedCategory, params)}`;
}

export function buildBookingRateLimitConfigs(input: BookingRateLimitInput) {
  const userOrRequesterKey = input.userId
    ? `user:${input.userId}`
    : input.requesterKey
      ? `requester:${input.requesterKey}`
      : null;

  return [
    ...(userOrRequesterKey
      ? [
          {
            namespace: BOOKING_NAMESPACE,
            bucketKey: userOrRequesterKey,
            windowSeconds: 60,
            maxRequests: 12,
          },
        ]
      : []),
    {
      namespace: BOOKING_NAMESPACE,
      bucketKey: `route:${input.routeKey}`,
      windowSeconds: 300,
      maxRequests: 4,
    },
    ...(input.providerCodes || []).map((providerCode) => ({
      namespace: BOOKING_NAMESPACE,
      bucketKey: `provider:${normalizeValue(providerCode)}`,
      windowSeconds: 60,
      maxRequests: 60,
    })),
    {
      namespace: BOOKING_NAMESPACE,
      bucketKey: 'global',
      windowSeconds: 60,
      maxRequests: 180,
    },
  ];
}

export function withBookingTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  label = 'booking provider request'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject({
        code: 'PROVIDER_TIMEOUT',
        status: 504,
        message: `${label} timed out after ${timeoutMs}ms`,
      });
    }, timeoutMs);
  });

  return Promise.race([operation, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}
