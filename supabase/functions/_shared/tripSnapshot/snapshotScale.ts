export interface SnapshotCacheInput {
  destination: string;
  country?: string;
  originCity?: string;
  originAirport?: string;
  startDate: string;
  endDate: string;
  travelers?: { adults?: number; children?: number; infants?: number };
  currency?: string;
  nationality?: string;
}

export interface NormalizedSnapshotCacheInput {
  destination: string;
  country: string;
  originCity: string;
  originAirport: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  infants: number;
  currency: string;
  nationality: string;
}

export interface SnapshotRateLimitKey {
  key: string;
  windowSeconds: number;
  maxRequests: number;
}

function cleanPart(value: unknown): string {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function cleanDate(value: unknown): string {
  return String(value || '').trim();
}

function nonNegativeInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

export function normalizeSnapshotCacheInput(input: SnapshotCacheInput): NormalizedSnapshotCacheInput {
  return {
    destination: cleanPart(input.destination),
    country: cleanPart(input.country),
    originCity: cleanPart(input.originCity),
    originAirport: cleanPart(input.originAirport),
    startDate: cleanDate(input.startDate),
    endDate: cleanDate(input.endDate),
    adults: nonNegativeInt(input.travelers?.adults, 1) || 1,
    children: nonNegativeInt(input.travelers?.children, 0),
    infants: nonNegativeInt(input.travelers?.infants, 0),
    currency: cleanPart(input.currency || 'USD'),
    nationality: cleanPart(input.nationality),
  };
}

export function buildSnapshotResponseCacheKey(input: SnapshotCacheInput): string {
  const normalized = normalizeSnapshotCacheInput(input);
  const parts = [
    normalized.destination,
    normalized.country,
    normalized.originAirport || normalized.originCity,
    normalized.startDate,
    normalized.endDate,
    normalized.adults,
    normalized.children,
    normalized.infants,
    normalized.currency,
    normalized.nationality,
  ].join('|');
  return `snapshot:data:v1:${parts}`.slice(0, 500);
}

export function buildSnapshotDestinationRateKey(input: Pick<SnapshotCacheInput, 'destination' | 'country' | 'startDate' | 'endDate'>): string {
  return [
    cleanPart(input.destination),
    cleanPart(input.country),
    cleanDate(input.startDate),
    cleanDate(input.endDate),
  ].join('|');
}

export function buildSnapshotRateLimitKeys(
  input: Pick<SnapshotCacheInput, 'destination' | 'country' | 'startDate' | 'endDate'> & { userId?: string | null },
): SnapshotRateLimitKey[] {
  const userKey = cleanPart(input.userId || 'anonymous');
  return [
    { key: `snapshot:user:${userKey}`, windowSeconds: 60, maxRequests: 12 },
    {
      key: `snapshot:destination:${buildSnapshotDestinationRateKey(input)}`,
      windowSeconds: 60,
      maxRequests: 90,
    },
    { key: 'snapshot:global', windowSeconds: 60, maxRequests: 300 },
  ];
}
