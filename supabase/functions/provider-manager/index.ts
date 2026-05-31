/**
 * PROVIDER MANAGER EDGE FUNCTION
 *
 * Core infrastructure for connecting to multiple travel providers.
 * Handles routing, execution, normalization, and aggregation.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUserIdFromRequest } from '../_shared/auth.ts';
import * as amadeus from '../_shared/providers/amadeus.ts';
import * as kiwi from '../_shared/providers/kiwi.ts';
import * as expedia from '../_shared/providers/expedia.ts';
import * as carsAdapter from '../_shared/providers/cars.ts';
import * as experiencesAdapter from '../_shared/providers/experiences.ts';
import * as serpApiFlights from '../_shared/providers/serpapi-flights.ts';
import * as serpApiHotels from '../_shared/providers/serpapi-hotels.ts';
import {
  BOOKING_COALESCE_POLL_MS,
  BOOKING_COALESCE_WAIT_MS,
  BOOKING_LOCK_TTL_SECONDS,
  BOOKING_NAMESPACE,
  buildBookingCacheKey,
  buildBookingRateLimitConfigs,
  buildBookingRouteKey,
  withBookingTimeout,
} from '../_shared/booking/bookingScale.ts';
import { consumeEdgeRateLimit } from '../_shared/edgeScale/rateLimit.ts';
import { releaseEdgeLock, tryAcquireEdgeLock } from '../_shared/edgeScale/locks.ts';
import { deferEdgeWork, recordEdgeMetric } from '../_shared/edgeScale/metrics.ts';
import {
  recordProviderCircuitResult,
  shouldSkipProvider,
} from '../_shared/providers/circuitBreaker.ts';

// Resolve a param that may be a string or {type, value} object into a plain string
function resolveParam(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    if (typeof obj.value === 'string') return obj.value;
    if (typeof obj.code === 'string') return obj.code;
    if (typeof obj.name === 'string') return obj.name;
  }
  return String(val);
}

function getSearchTimeoutMs(params: Record<string, unknown>): number {
  const requestedTimeout = Number(params.timeout);
  if (!Number.isFinite(requestedTimeout) || requestedTimeout <= 0) {
    return CONFIG.execution.defaultTimeoutMs;
  }
  return Math.min(requestedTimeout, CONFIG.execution.bookingTimeoutMs);
}

// Types
interface ProviderManagerRequest {
  action: 'search' | 'package_search' | 'get_offer' | 'health_check';
  category: 'flights' | 'hotels' | 'cars' | 'experiences' | 'packages';
  params: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  preferences?: UserPreferences;
}

interface UserPreferences {
  budgetLevel?: 'budget' | 'mid_range' | 'luxury';
  travelStyle?: string;
  preferredAirlines?: string[];
  preferredHotelChains?: string[];
}

interface Provider {
  id: string;
  provider_code: string;
  provider_name: string;
  supports_flights: boolean;
  supports_hotels: boolean;
  supports_cars: boolean;
  supports_experiences: boolean;
  priority: number;
  health_score: number;
  enabled: boolean;
  cost_per_search: number;
  strong_regions: string[];
  coverage_regions: string[];
  avg_response_time_ms: number;
  consecutive_failures: number;
  last_failed_call?: string | null;
}

interface ProviderScore {
  providerId: string;
  providerCode: string;
  totalScore: number;
  breakdown: {
    geographic: number;
    category: number;
    preference: number;
    performance: number;
    cost: number;
    ruleBoost: number;
  };
  eligible: boolean;
}

interface RoutingRule {
  id: string;
  rule_name: string;
  conditions: Record<string, string>;
  provider_code: string;
  provider_priority_boost: number;
  provider_priority_penalty: number;
  enabled: boolean;
}

// Configuration
const CONFIG = {
  routing: {
    minScoreThreshold: 25,
    maxProvidersParallel: 3,
    maxProvidersComprehensive: 5,
  },
  execution: {
    defaultTimeoutMs: 8000,
    bookingTimeoutMs: 30000,
    maxRetries: 3,
    retryBaseDelayMs: 1000,
  },
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 3,
    openDurationMs: 60000,
  },
  caching: {
    enabled: true,
    searchTtlSeconds: 300,
    offerTtlSeconds: 900,
  },
  budget: {
    dailyLimit: 50,
    monthlyLimit: 1000,
    alertThreshold: 0.8,
  },
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const body: ProviderManagerRequest = await req.json();
    const { action, category, params, sessionId, preferences } = body;

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const isServiceRoleCall =
      authHeader.startsWith('Bearer ') &&
      authHeader.replace('Bearer ', '') === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const userId =
      (await getUserIdFromRequest(
        req,
        body as unknown as Record<string, any>,
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_PUBLIC_KEY') || ''
      )) || undefined;

    if ((action === 'search' || action === 'package_search') && !userId && !isServiceRoleCall) {
      return new Response(JSON.stringify({ error: 'Valid authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route based on action
    let result: unknown;

    switch (action) {
      case 'search':
        result = await handleSearch({
          requestId,
          category,
          params,
          userId,
          sessionId,
          preferences,
          supabase,
        });
        break;

      case 'package_search':
        result = await handlePackageSearch({
          requestId,
          params,
          userId,
          sessionId,
          preferences,
          supabase,
        });
        break;

      case 'get_offer':
        result = await handleGetOffer({
          requestId,
          offerId: params.offerId as string,
          providerCode: params.providerCode as string,
          category,
          supabase,
        });
        break;

      case 'health_check':
        result = await handleHealthCheck({
          providerId: params.providerId as string,
          supabase,
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        requestId,
        duration: Date.now() - startTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Provider Manager Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: (error as { code?: string }).code || 'INTERNAL_ERROR',
          message: (error as Error).message || 'An unexpected error occurred',
        },
        requestId,
        duration: Date.now() - startTime,
      }),
      {
        status: (error as { status?: number }).status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================
// SEARCH HANDLER
// ============================================

async function handleSearch(context: {
  requestId: string;
  category: string;
  params: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  preferences?: UserPreferences;
  supabase: ReturnType<typeof createClient>;
}) {
  const { requestId, category, params, userId, sessionId, preferences, supabase } = context;
  const startTime = Date.now();
  let activeLock: { key: string; ownerId: string } | null = null;
  const recordMetric = (
    cacheStatus: 'hit' | 'miss' | 'coalesced' | 'rate_limited' | 'error',
    statusCode: number,
    providerSummary: Record<string, unknown> = {},
    errorMessage?: string
  ) => {
    deferEdgeWork(
      recordEdgeMetric(supabase, {
        namespace: BOOKING_NAMESPACE,
        phase: `provider-manager:${category}`,
        cacheStatus,
        statusCode,
        durationMs: Date.now() - startTime,
        providerSummary,
        errorMessage,
      })
    );
  };

  const releaseActiveLock = async (status: 'completed' | 'failed') => {
    if (!activeLock) return;
    await releaseEdgeLock(supabase, BOOKING_NAMESPACE, activeLock.key, activeLock.ownerId, status);
    activeLock = null;
  };

  // 1. Check cache first
  const cacheKey = buildBookingCacheKey(category, params);
  const routeKey = buildBookingRouteKey(category, params);
  const cached = await checkCache(supabase, cacheKey);
  if (cached && !params.refresh) {
    recordMetric('hit', 200, { cacheKey, routeKey });
    return {
      results: cached.results,
      totalCount: cached.result_count,
      providers: cached.providers_used,
      sessionId: cached.id,
      source: 'cache',
    };
  }
  const staleCache = await checkStaleCache(supabase, cacheKey);

  // 2. Get provider scores
  const providerScores = await scoreProviders(supabase, category, params, preferences);

  // 3. Select providers based on strategy
  const strategy = (params.strategy as string) || 'price_compare';
  const selectedProviders = selectProviders(providerScores, strategy);

  if (selectedProviders.length === 0) {
    throw {
      code: 'NO_PROVIDERS_AVAILABLE',
      message: 'No healthy providers available for this search',
      status: 503,
    };
  }

  // 4. Check budget
  const budgetStatus = await checkBudget(supabase);
  if (!budgetStatus.allowed) {
    throw {
      code: 'BUDGET_EXCEEDED',
      message: 'API budget has been exceeded',
      status: 503,
    };
  }

  const lock = await tryAcquireEdgeLock(
    supabase,
    BOOKING_NAMESPACE,
    `${category}:${cacheKey}`,
    BOOKING_LOCK_TTL_SECONDS
  );

  if (!lock.acquired) {
    const coalesced = await waitForCachedSearch(
      supabase,
      cacheKey,
      BOOKING_COALESCE_WAIT_MS,
      BOOKING_COALESCE_POLL_MS
    );
    if (coalesced) {
      recordMetric('coalesced', 200, { cacheKey, routeKey });
      return {
        results: coalesced.results,
        totalCount: coalesced.result_count,
        providers: coalesced.providers_used,
        sessionId: coalesced.id,
        source: 'cache',
        coalesced: true,
      };
    }

    recordMetric('coalesced', 202, { cacheKey, routeKey });
    throw {
      code: 'SEARCH_PENDING',
      message: 'A matching booking search is already running. Retry shortly.',
      status: 202,
    };
  }

  activeLock = { key: `${category}:${cacheKey}`, ownerId: lock.ownerId };

  try {
    for (const limitConfig of buildBookingRateLimitConfigs({
      category,
      userId,
      routeKey,
      providerCodes: selectedProviders.map((provider) => provider.providerCode),
    })) {
      const limit = await consumeEdgeRateLimit(supabase, limitConfig);
      if (!limit.allowed) {
        await releaseActiveLock('failed');
        recordMetric('rate_limited', 429, { blockedKey: limit.blockedKey, cacheKey, routeKey });
        throw {
          code: 'RATE_LIMITED',
          message: 'Booking search rate limit exceeded',
          status: 429,
        };
      }
    }

    // 5. Execute search across providers (mock for now - real implementation would call provider APIs)
    const results = await executeSearch(supabase, selectedProviders, category, params, {
      requestId,
      sessionId,
      userId,
      timeout: getSearchTimeoutMs(params),
    });

    // 6. Log the search
    await logProviderCalls(supabase, requestId, selectedProviders, category, results);
    await updateProviderCircuitStates(supabase, selectedProviders, results);

    // 7. Cache results (only if we have results - don't cache empty)
    const newSessionId = sessionId || crypto.randomUUID();
    if (results.items.length > 0) {
      await cacheResults(
        supabase,
        cacheKey,
        category,
        params,
        results,
        selectedProviders.map((p) => p.providerCode)
      );
    }

    // 8. Update cost tracking
    await updateCostTracking(supabase, selectedProviders.length);
    await releaseActiveLock('completed');
    recordMetric('miss', 200, {
      cacheKey,
      routeKey,
      providers: selectedProviders.map((provider) => provider.providerCode),
      resultCount: results.totalCount,
    });

    return {
      results: results.items,
      totalCount: results.totalCount,
      providers: selectedProviders.map((p) => ({
        code: p.providerCode,
        name: p.providerCode,
        responseTimeMs: results.responseTimeMs,
      })),
      sessionId: newSessionId,
      source: 'live',
      priceRange: results.priceRange,
    };
  } catch (error) {
    await releaseActiveLock('failed');
    const status = (error as { status?: number }).status || 500;
    if (status !== 202 && status !== 429) {
      recordMetric('error', status, { cacheKey, routeKey }, (error as Error).message);
    }
    if (staleCache && status >= 500) {
      recordMetric('hit', 200, { cacheKey, routeKey, stale: true, failedStatus: status });
      return {
        results: staleCache.results,
        totalCount: staleCache.result_count,
        providers: staleCache.providers_used,
        sessionId: staleCache.id,
        source: 'cache',
        stale: true,
      };
    }
    throw error;
  }
}

async function handlePackageSearch(context: {
  requestId: string;
  params: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  preferences?: UserPreferences;
  supabase: ReturnType<typeof createClient>;
}) {
  const { requestId, params, userId, sessionId, preferences, supabase } = context;
  const startTime = Date.now();
  const category = 'packages';
  const includedCategories = getPackageIncludedCategories(params);
  const bundleParams = { ...params, includedCategories };
  const cacheKey = buildBookingCacheKey(category, bundleParams);
  const routeKey = buildBookingRouteKey(category, bundleParams);
  let activeLock: { key: string; ownerId: string } | null = null;

  const recordMetric = (
    cacheStatus: 'hit' | 'miss' | 'coalesced' | 'rate_limited' | 'error',
    statusCode: number,
    providerSummary: Record<string, unknown> = {},
    errorMessage?: string
  ) => {
    deferEdgeWork(
      recordEdgeMetric(supabase, {
        namespace: BOOKING_NAMESPACE,
        phase: 'provider-manager:packages',
        cacheStatus,
        statusCode,
        durationMs: Date.now() - startTime,
        providerSummary,
        errorMessage,
      })
    );
  };

  const releaseActiveLock = async (status: 'completed' | 'failed') => {
    if (!activeLock) return;
    await releaseEdgeLock(supabase, BOOKING_NAMESPACE, activeLock.key, activeLock.ownerId, status);
    activeLock = null;
  };

  const cached = await checkCache(supabase, cacheKey);
  if (cached && !params.refresh) {
    recordMetric('hit', 200, { cacheKey, routeKey });
    return {
      bundle: cached.results,
      sessionId: cached.id,
      source: 'cache',
    };
  }
  const staleCache = await checkStaleCache(supabase, cacheKey);

  const lock = await tryAcquireEdgeLock(
    supabase,
    BOOKING_NAMESPACE,
    `${category}:${cacheKey}`,
    BOOKING_LOCK_TTL_SECONDS
  );

  if (!lock.acquired) {
    const coalesced = await waitForCachedSearch(
      supabase,
      cacheKey,
      BOOKING_COALESCE_WAIT_MS,
      BOOKING_COALESCE_POLL_MS
    );
    if (coalesced) {
      recordMetric('coalesced', 200, { cacheKey, routeKey });
      return {
        bundle: coalesced.results,
        sessionId: coalesced.id,
        source: 'cache',
        coalesced: true,
      };
    }

    recordMetric('coalesced', 202, { cacheKey, routeKey });
    throw {
      code: 'SEARCH_PENDING',
      message: 'A matching package search is already running. Retry shortly.',
      status: 202,
    };
  }

  activeLock = { key: `${category}:${cacheKey}`, ownerId: lock.ownerId };

  try {
    const categoryProviders = await selectPackageProviders(
      supabase,
      includedCategories,
      bundleParams,
      preferences
    );
    const providerCodes = Object.values(categoryProviders)
      .flat()
      .map((provider) => provider.providerCode);

    for (const limitConfig of buildBookingRateLimitConfigs({
      category,
      userId,
      routeKey,
      providerCodes,
    })) {
      const limit = await consumeEdgeRateLimit(supabase, limitConfig);
      if (!limit.allowed) {
        await releaseActiveLock('failed');
        recordMetric('rate_limited', 429, { blockedKey: limit.blockedKey, cacheKey, routeKey });
        throw {
          code: 'RATE_LIMITED',
          message: 'Package search rate limit exceeded',
          status: 429,
        };
      }
    }

    const packageSearchParams = buildPackageCategoryParams(bundleParams);
    const timeout = getSearchTimeoutMs(bundleParams);
    const entries = await Promise.all(
      includedCategories.map(async (bundleCategory) => {
        const providers = categoryProviders[bundleCategory] || [];
        if (providers.length === 0) return [bundleCategory, emptyPackageCategoryResult()] as const;

        try {
          const result = await executeSearch(
            supabase,
            providers,
            bundleCategory,
            packageSearchParams[bundleCategory],
            { requestId, sessionId, userId, timeout }
          );
          return [bundleCategory, result] as const;
        } catch (error) {
          console.error(`Package ${bundleCategory} search failed:`, error);
          return [bundleCategory, emptyPackageCategoryResult()] as const;
        }
      })
    );

    const bundle = entries.reduce<Record<string, unknown>>((acc, [bundleCategory, result]) => {
      acc[bundleCategory] = result;
      return acc;
    }, {});
    const totalCount = entries.reduce((sum, [, result]) => sum + result.totalCount, 0);
    const newSessionId = sessionId || crypto.randomUUID();

    if (totalCount > 0) {
      await cachePackageBundle(supabase, cacheKey, bundleParams, bundle, totalCount, providerCodes);
    }

    await updateCostTracking(supabase, Math.max(providerCodes.length, 1));
    await releaseActiveLock('completed');
    recordMetric('miss', 200, {
      cacheKey,
      routeKey,
      providerCodes,
      totalCount,
      includedCategories,
    });

    return {
      bundle,
      sessionId: newSessionId,
      source: 'live',
    };
  } catch (error) {
    await releaseActiveLock('failed');
    const status = (error as { status?: number }).status || 500;
    if (status !== 202 && status !== 429) {
      recordMetric('error', status, { cacheKey, routeKey }, (error as Error).message);
    }
    if (staleCache && status >= 500) {
      recordMetric('hit', 200, { cacheKey, routeKey, stale: true, failedStatus: status });
      return {
        bundle: staleCache.results,
        sessionId: staleCache.id,
        source: 'cache',
        stale: true,
      };
    }
    throw error;
  }
}

type PackageBundleCategory = 'flights' | 'hotels' | 'cars' | 'experiences';

function getPackageIncludedCategories(params: Record<string, unknown>): PackageBundleCategory[] {
  if (Array.isArray(params.includedCategories) && params.includedCategories.length > 0) {
    return params.includedCategories
      .map((category) => normalizePackageCategory(category))
      .filter((category): category is PackageBundleCategory => Boolean(category));
  }

  const packageType = String(params.packageType || 'flight_hotel');
  if (packageType === 'flight_hotel_car') return ['flights', 'hotels', 'cars'];
  if (packageType === 'hotel_car') return ['hotels', 'cars'];
  return ['flights', 'hotels'];
}

function normalizePackageCategory(category: unknown): PackageBundleCategory | null {
  const normalized = String(category).toLowerCase();
  if (normalized === 'flight') return 'flights';
  if (normalized === 'hotel') return 'hotels';
  if (normalized === 'car') return 'cars';
  if (normalized === 'experience') return 'experiences';
  if (['flights', 'hotels', 'cars', 'experiences'].includes(normalized)) {
    return normalized as PackageBundleCategory;
  }
  return null;
}

function getPackageDateRange(params: Record<string, unknown>): {
  startDate: string;
  endDate: string;
} {
  const dates = params.dates as { startDate?: string; endDate?: string } | undefined;
  const startDate =
    dates?.startDate || (params.startDate as string) || new Date().toISOString().split('T')[0];
  const endDate =
    dates?.endDate ||
    (params.endDate as string) ||
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  return { startDate, endDate };
}

function buildPackageCategoryParams(params: Record<string, unknown>) {
  const destination = resolveParam(params.destination) || 'New York';
  const origin = resolveParam(params.origin || params.originCode) || 'JFK';
  const destinationCode = resolveParam(params.destinationCode || params.destination) || destination;
  const { startDate, endDate } = getPackageDateRange(params);
  const travelers = (params.travelers as Record<string, unknown> | undefined) || {};
  const adults = Number(travelers.adults || params.adults || 1);
  const children = Number(travelers.children || params.children || 0);
  const infants = Number(travelers.infants || params.infants || 0);

  return {
    flights: {
      tripType: 'round_trip',
      segments: [
        { origin, destination: destinationCode, departureDate: startDate },
        { origin: destinationCode, destination: origin, departureDate: endDate },
      ],
      travelers: { adults, children, infants },
      cabinClass: (params.cabinClass || (params.filters as any)?.cabinClass || 'economy') as string,
      currency: (params.currency as string) || 'USD',
      limit: Math.min(Number(params.limit || 10), 20),
    },
    hotels: {
      destination: { type: 'city', value: destination },
      checkInDate: startDate,
      checkOutDate: endDate,
      rooms: [{ adults, children }],
      currency: (params.currency as string) || 'USD',
      limit: Math.min(Number(params.limit || 10), 20),
    },
    cars: {
      pickupLocation: { type: 'city', value: destination },
      pickupDateTime: new Date(startDate).toISOString(),
      dropoffDateTime: new Date(endDate).toISOString(),
      driverAge: Number(params.driverAge || 30),
      currency: (params.currency as string) || 'USD',
      limit: Math.min(Number(params.limit || 10), 20),
    },
    experiences: {
      destination: { type: 'city', value: destination },
      dates: { startDate, endDate, flexibleDates: Boolean(params.flexibleDates) },
      participants: { adults, children },
      currency: (params.currency as string) || 'USD',
      limit: Math.min(Number(params.limit || 10), 20),
    },
  } satisfies Record<PackageBundleCategory, Record<string, unknown>>;
}

async function selectPackageProviders(
  supabase: ReturnType<typeof createClient>,
  includedCategories: PackageBundleCategory[],
  params: Record<string, unknown>,
  preferences?: UserPreferences
): Promise<Record<PackageBundleCategory, { providerId: string; providerCode: string }[]>> {
  const selected = {} as Record<
    PackageBundleCategory,
    { providerId: string; providerCode: string }[]
  >;
  await Promise.all(
    includedCategories.map(async (bundleCategory) => {
      const scores = await scoreProviders(supabase, bundleCategory, params, preferences);
      selected[bundleCategory] = selectProviders(scores, 'price_compare');
    })
  );
  return selected;
}

function emptyPackageCategoryResult() {
  return {
    items: [],
    totalCount: 0,
    responseTimeMs: 0,
  };
}

// ============================================
// ROUTING ENGINE
// ============================================

async function scoreProviders(
  supabase: ReturnType<typeof createClient>,
  category: string,
  params: Record<string, unknown>,
  preferences?: UserPreferences
): Promise<ProviderScore[]> {
  // Get providers for this category
  const categoryColumn = `supports_${category}`;
  const { data: providers, error } = await supabase
    .from('api_providers')
    .select('*')
    .eq('enabled', true)
    .eq(categoryColumn, true);

  if (error || !providers) {
    console.error('Error fetching providers:', error);
    return [];
  }

  // Get routing rules
  const { data: rules } = await supabase
    .from('routing_rules')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: false });

  const scores: ProviderScore[] = [];

  for (const provider of providers as Provider[]) {
    if (
      shouldSkipProvider({
        providerCode: provider.provider_code,
        enabled: provider.enabled,
        health_score: provider.health_score,
        consecutive_failures: provider.consecutive_failures,
        last_failed_call: provider.last_failed_call,
      })
    ) {
      continue;
    }

    const score = calculateProviderScore(provider, category, params, preferences, rules || []);
    scores.push(score);
  }

  // Sort by score descending
  scores.sort((a, b) => b.totalScore - a.totalScore);

  return scores;
}

function calculateProviderScore(
  provider: Provider,
  category: string,
  params: Record<string, unknown>,
  preferences: UserPreferences | undefined,
  rules: RoutingRule[]
): ProviderScore {
  let geographic = 0;
  let categoryScore = 0;
  let preference = 0;
  let performance = 0;
  let cost = 0;
  let ruleBoost = 0;

  // Geographic scoring (0-30)
  // Handle both string destinations and object destinations (for hotels)
  let destinationStr = '';
  if (typeof params.destination === 'string') {
    destinationStr = params.destination;
  } else if (params.destination && typeof params.destination === 'object') {
    const dest = params.destination as { value?: string; type?: string };
    destinationStr = typeof dest.value === 'string' ? dest.value : '';
  } else if (params.segments) {
    destinationStr = (params.segments as { destination: string }[])?.[0]?.destination || '';
  }
  const destinationRegion = determineRegion(destinationStr);

  if (provider.strong_regions?.includes(destinationRegion)) {
    geographic += 20;
  } else if (provider.coverage_regions?.includes(destinationRegion)) {
    geographic += 12;
  }
  geographic = Math.min(geographic, 30);

  // Category strength (0-25)
  categoryScore = provider.priority > 70 ? 20 : provider.priority > 50 ? 15 : 10;
  categoryScore = Math.min(categoryScore, 25);

  // User preference alignment (0-20)
  if (preferences?.budgetLevel === 'budget' && provider.provider_code === 'kiwi') {
    preference += 12;
  } else if (preferences?.budgetLevel === 'luxury' && provider.provider_code === 'amadeus') {
    preference += 10;
  }
  preference = Math.min(preference, 20);

  // Historical performance (0-15)
  performance = (provider.health_score / 100) * 8;
  if (provider.consecutive_failures > 0) {
    performance -= Math.min(provider.consecutive_failures * 3, 10);
  }
  if (provider.avg_response_time_ms > 2000) {
    performance -= 3;
  } else if (provider.avg_response_time_ms < 500) {
    performance += 2;
  }
  performance = Math.max(0, Math.min(performance, 15));

  // Cost efficiency (0-10)
  const maxCost = 0.05;
  if (provider.cost_per_search <= maxCost) {
    cost = 10 - (provider.cost_per_search / maxCost) * 10;
  }

  // Apply routing rules
  for (const rule of rules) {
    if (ruleMatches(rule, category, params, preferences)) {
      if (rule.provider_code === provider.provider_code) {
        ruleBoost += rule.provider_priority_boost || 0;
        ruleBoost -= rule.provider_priority_penalty || 0;
      }
    }
  }

  const totalScore = geographic + categoryScore + preference + performance + cost + ruleBoost;

  return {
    providerId: provider.id,
    providerCode: provider.provider_code,
    totalScore,
    breakdown: {
      geographic,
      category: categoryScore,
      preference,
      performance,
      cost,
      ruleBoost,
    },
    eligible:
      totalScore >= CONFIG.routing.minScoreThreshold &&
      provider.enabled &&
      provider.health_score >= 30,
  };
}

function determineRegion(location: string): string {
  const regionMap: Record<string, string> = {
    JFK: 'north_america',
    LAX: 'north_america',
    ORD: 'north_america',
    SFO: 'north_america',
    MIA: 'north_america',
    DFW: 'north_america',
    LHR: 'europe',
    CDG: 'europe',
    FRA: 'europe',
    AMS: 'europe',
    MAD: 'europe',
    FCO: 'europe',
    BCN: 'europe',
    MUC: 'europe',
    NRT: 'asia',
    HND: 'asia',
    PEK: 'asia',
    PVG: 'asia',
    HKG: 'asia',
    SIN: 'asia',
    BKK: 'asia',
    ICN: 'asia',
    DXB: 'middle_east',
    DOH: 'middle_east',
    AUH: 'middle_east',
    GRU: 'south_america',
    EZE: 'south_america',
    BOG: 'south_america',
    JNB: 'africa',
    CAI: 'africa',
    CPT: 'africa',
    SYD: 'oceania',
    MEL: 'oceania',
    AKL: 'oceania',
  };

  const code = location.toUpperCase().substring(0, 3);
  return regionMap[code] || 'other';
}

function ruleMatches(
  rule: RoutingRule,
  category: string,
  params: Record<string, unknown>,
  preferences?: UserPreferences
): boolean {
  const conditions = rule.conditions;

  if (conditions.category && conditions.category !== category) {
    return false;
  }
  if (conditions.user_budget && conditions.user_budget !== preferences?.budgetLevel) {
    return false;
  }

  return true;
}

function selectProviders(
  scores: ProviderScore[],
  strategy: string
): { providerId: string; providerCode: string; score: number; isPrimary: boolean }[] {
  const eligible = scores.filter((s) => s.eligible);

  switch (strategy) {
    case 'single':
      return eligible.slice(0, 1).map((s) => ({
        providerId: s.providerId,
        providerCode: s.providerCode,
        score: s.totalScore,
        isPrimary: true,
      }));

    case 'comprehensive':
      return eligible.slice(0, CONFIG.routing.maxProvidersComprehensive).map((s, i) => ({
        providerId: s.providerId,
        providerCode: s.providerCode,
        score: s.totalScore,
        isPrimary: i === 0,
      }));

    case 'price_compare':
    default:
      return eligible.slice(0, CONFIG.routing.maxProvidersParallel).map((s, i) => ({
        providerId: s.providerId,
        providerCode: s.providerCode,
        score: s.totalScore,
        isPrimary: i === 0,
      }));
  }
}

// ============================================
// EXECUTION
// ============================================

async function executeSearch(
  _supabase: ReturnType<typeof createClient>,
  providers: { providerId: string; providerCode: string }[],
  category: string,
  params: Record<string, unknown>,
  context: { requestId: string; sessionId?: string; userId?: string; timeout: number }
): Promise<{
  items: unknown[];
  totalCount: number;
  responseTimeMs: number;
  priceRange?: { min: number; max: number };
}> {
  const startTime = Date.now();

  try {
    switch (category) {
      case 'flights':
        return await withBookingTimeout(
          executeFlightSearch(providers, params, startTime),
          context.timeout,
          'flight provider search'
        );

      case 'hotels':
        return await withBookingTimeout(
          executeHotelSearch(providers, params, startTime),
          context.timeout,
          'hotel provider search'
        );

      case 'cars':
        return await withBookingTimeout(
          executeCarSearch(providers, params, startTime),
          context.timeout,
          'car provider search'
        );

      case 'experiences':
        return await withBookingTimeout(
          executeExperienceSearch(providers, params, startTime),
          context.timeout,
          'experience provider search'
        );

      default:
        return {
          items: [],
          totalCount: 0,
          responseTimeMs: Date.now() - startTime,
        };
    }
  } catch (error) {
    console.error(`Error in ${category} search:`, error);
    throw error;
  }
}

// Execute flight search using provider adapters directly
async function executeFlightSearch(
  providers: { providerId: string; providerCode: string }[],
  params: Record<string, unknown>,
  startTime: number
): Promise<{
  items: unknown[];
  totalCount: number;
  responseTimeMs: number;
  priceRange?: { min: number; max: number };
}> {
  // Resolve origin/destination which may be strings or {type, value} objects
  const originStr = resolveParam(params.origin || params.originCode);
  const destinationStr = resolveParam(params.destination || params.destinationCode);

  // Build passengers from either nested or flat format
  const passengers = params.passengers as
    | { adults?: number; children?: number; infants?: number }
    | undefined;

  const searchParams = {
    segments: (params.segments as Array<{
      origin: string;
      destination: string;
      departureDate: string;
    }>) || [
      {
        origin: originStr,
        destination: destinationStr,
        departureDate: (params.departureDate || params.outboundDate) as string,
      },
    ],
    travelers: (params.travelers as { adults: number; children?: number; infants?: number }) || {
      adults: passengers?.adults || (params.adults as number) || 1,
      children: passengers?.children || (params.children as number) || 0,
      infants: passengers?.infants || (params.infants as number) || 0,
    },
    tripType: (params.tripType as string) || 'one_way',
    cabinClass: (params.cabinClass as string) || 'economy',
    currency: (params.currency as string) || 'USD',
    limit: (params.limit as number) || 50,
  };

  // Add return segment for round trips
  if (params.returnDate) {
    searchParams.segments.push({
      origin: destinationStr,
      destination: originStr,
      departureDate: params.returnDate as string,
    });
    searchParams.tripType = 'round_trip';
  }

  console.log(
    `Executing flight search with params:`,
    JSON.stringify(searchParams).substring(0, 200)
  );

  // Call providers in parallel based on selected providers
  const providerCodes = providers.map((p) => p.providerCode);
  const searchPromises: Promise<unknown[]>[] = [];

  // Primary: SerpAPI Google Flights (provider_code: google_flights)
  if (providerCodes.includes('google_flights')) {
    searchPromises.push(
      serpApiFlights
        .searchFlights(searchParams)
        .then((results) => {
          console.log(`SerpAPI Google Flights returned ${results.length} flights`);
          return results;
        })
        .catch((err) => {
          console.error('SerpAPI Google Flights error:', err.message);
          return [];
        })
    );
  }

  // Secondary: Kiwi.com (affiliate links + creative routes)
  if (providerCodes.includes('kiwi')) {
    searchPromises.push(
      kiwi
        .searchFlights(searchParams)
        .then((results) => {
          console.log(`Kiwi returned ${results.length} flights`);
          return results;
        })
        .catch((err) => {
          console.error('Kiwi search error:', err.message);
          return [];
        })
    );
  }

  // Fallback: Amadeus (deprecated — sunset July 2026, only if explicitly requested)
  if (providerCodes.includes('amadeus')) {
    searchPromises.push(
      amadeus
        .searchFlights(searchParams)
        .then((results) => {
          console.log(`Amadeus returned ${results.length} flights`);
          return results;
        })
        .catch((err) => {
          console.error('Amadeus search error:', err.message);
          return [];
        })
    );
  }

  // Wait for all providers
  const results = await Promise.all(searchPromises);

  // Flatten and combine results
  const allFlights = results.flat() as Array<{ price: { amount: number } }>;

  // Sort by price
  allFlights.sort((a, b) => a.price.amount - b.price.amount);

  // Calculate price range
  let priceRange: { min: number; max: number } | undefined;
  if (allFlights.length > 0) {
    const prices = allFlights.map((f) => f.price.amount);
    priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  console.log(`Total flights from all providers: ${allFlights.length}`);

  return {
    items: allFlights,
    totalCount: allFlights.length,
    responseTimeMs: Date.now() - startTime,
    priceRange,
  };
}

// Execute hotel search using provider adapters directly
async function executeHotelSearch(
  providers: { providerId: string; providerCode: string }[],
  params: Record<string, unknown>,
  startTime: number
): Promise<{
  items: unknown[];
  totalCount: number;
  responseTimeMs: number;
  priceRange?: { min: number; max: number };
}> {
  // Resolve destination which may be a string or {type, value} object
  const destValue = resolveParam(params.destination);
  const destObj =
    typeof params.destination === 'object' && params.destination !== null
      ? (params.destination as { type?: string; value?: string })
      : { type: 'city', value: destValue };

  const searchParams = {
    destination: destObj.value ? destObj : { type: 'city', value: destValue || 'Paris' },
    checkInDate: (params.checkInDate || params.checkIn || params.checkin) as string,
    checkOutDate: (params.checkOutDate || params.checkOut || params.checkout) as string,
    rooms: (params.rooms as Array<{
      adults: number;
      children?: number;
      childrenAges?: number[];
    }>) || [
      {
        adults: 2,
        children: 0,
        childrenAges: [],
      },
    ],
    currency: (params.currency as string) || 'USD',
    language: (params.language as string) || 'en-US',
    limit: (params.limit as number) || 15,
  };

  console.log(
    `Executing hotel search with params:`,
    JSON.stringify(searchParams).substring(0, 200)
  );

  const providerCodes = providers.map((p) => p.providerCode);

  // Build an ordered list of hotel provider attempts. We never rely on a single
  // provider: the chain is tried in order until one returns results, so a quota
  // limit or outage on one provider automatically fails over to the next.
  //
  //   1. SerpAPI Google Hotels — primary aggregator (Booking.com, Expedia, etc.)
  //   2. Booking.com via RapidAPI (expedia module) — independent fallback
  //
  // Routing preference order is honored first, then both implemented providers
  // are always appended as fallbacks even if routing didn't explicitly select
  // them, so an empty/failed primary still has a backup.
  type HotelAttempt = { code: string; run: () => Promise<any[]> };
  const runners: Record<string, () => Promise<any[]>> = {
    serpapi_hotels: () => serpApiHotels.searchHotels(searchParams as any),
    expedia: () => expedia.searchHotels(searchParams as any),
  };
  const attempts: HotelAttempt[] = [];
  const seen = new Set<string>();
  const addAttempt = (code: string) => {
    if (seen.has(code) || !runners[code]) return;
    seen.add(code);
    attempts.push({ code, run: runners[code] });
  };

  for (const code of providerCodes) {
    if (code === 'google_flights' || code === 'serpapi_hotels') addAttempt('serpapi_hotels');
    else if (code === 'expedia') addAttempt('expedia');
  }
  // Always ensure both implemented providers are available as fallbacks.
  addAttempt('serpapi_hotels');
  addAttempt('expedia');

  let results: any[] = [];
  let usedProvider: string | null = null;
  const providerErrors: string[] = [];

  for (const attempt of attempts) {
    try {
      const r = await attempt.run();
      console.log(`Hotel provider ${attempt.code} returned ${r?.length || 0} hotels`);
      if (r && r.length > 0) {
        results = r;
        usedProvider = attempt.code;
        break;
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      providerErrors.push(`${attempt.code}: ${msg}`);
      console.error(`Hotel provider ${attempt.code} failed:`, msg);
    }
  }

  if (results.length === 0) {
    console.warn(
      `Hotel search returned no results from any provider. Errors: ${
        providerErrors.length ? providerErrors.join(' | ') : 'none (providers returned empty responses)'
      }`
    );
  } else {
    console.log(`Hotel search served ${results.length} hotels via ${usedProvider}`);
  }

  // Calculate price range
  let priceRange: { min: number; max: number } | undefined;
  if (results.length > 0) {
    const prices = results
      .map((h: any) => h.lowestPrice?.amount || 0)
      .filter((p: number) => p > 0);
    if (prices.length > 0) {
      priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices),
      };
    }
  }

  return {
    items: results,
    totalCount: results.length,
    responseTimeMs: Date.now() - startTime,
    priceRange,
  };
}

// Execute car search using car adapter
async function executeCarSearch(
  providers: { providerId: string; providerCode: string }[],
  params: Record<string, unknown>,
  startTime: number
): Promise<{
  items: unknown[];
  totalCount: number;
  responseTimeMs: number;
  priceRange?: { min: number; max: number };
}> {
  // Extract pickup/dropoff date and time from either separate fields or combined ISO datetime
  const pickupDT = (params.pickupDateTime ||
    params.pickupDate ||
    params.pickup_date ||
    params.startDate) as string;
  const dropoffDT = (params.dropoffDateTime ||
    params.dropoffDate ||
    params.dropoff_date ||
    params.endDate) as string;

  const pickupDateStr = pickupDT ? pickupDT.split('T')[0] : '';
  const pickupTimeStr = pickupDT?.includes('T')
    ? pickupDT.split('T')[1]?.substring(0, 5)
    : ((params.pickupTime || params.pickup_time || '10:00') as string);
  const dropoffDateStr = dropoffDT ? dropoffDT.split('T')[0] : '';
  const dropoffTimeStr = dropoffDT?.includes('T')
    ? dropoffDT.split('T')[1]?.substring(0, 5)
    : ((params.dropoffTime || params.dropoff_time || '10:00') as string);

  const searchParams = {
    pickupLocation: resolveParam(params.pickupLocation || params.pickup_location || params.origin),
    dropoffLocation:
      resolveParam(params.dropoffLocation || params.dropoff_location || params.destination) ||
      resolveParam(params.pickupLocation || params.pickup_location || params.origin),
    pickupDate: pickupDateStr,
    dropoffDate: dropoffDateStr,
    pickupTime: pickupTimeStr,
    dropoffTime: dropoffTimeStr,
    driverAge: (params.driverAge || params.driver_age || 30) as number,
    currency: (params.currency as string) || 'USD',
    limit: (params.limit as number) || 20,
  };

  console.log(`Executing car search with params:`, JSON.stringify(searchParams).substring(0, 200));

  try {
    let results: any[] = [];
    const providerCodes = providers.map((p) => p.providerCode);

    // Primary: Booking.com car hire (RapidAPI)
    try {
      if (providerCodes.includes('expedia') || providerCodes.includes('cartrawler')) {
        results = await carsAdapter.searchCars(searchParams);
        console.log(`Car adapter returned ${results.length} cars`);
      }
    } catch (primaryErr: any) {
      console.error('Primary car adapter failed:', primaryErr.message);

      // Fallback: SerpAPI Google search for car rentals
      const serpApiKey = Deno.env.get('SERPAPI_KEY');
      if (serpApiKey) {
        try {
          const serpUrl = new URL('https://serpapi.com/search.json');
          serpUrl.searchParams.set('engine', 'google');
          serpUrl.searchParams.set(
            'q',
            `car rental ${searchParams.pickupLocation} ${searchParams.pickupDate}`
          );
          serpUrl.searchParams.set('api_key', serpApiKey);
          serpUrl.searchParams.set('gl', 'us');
          serpUrl.searchParams.set('hl', 'en');

          const serpResp = await fetch(serpUrl.toString());
          if (serpResp.ok) {
            const serpData = await serpResp.json();

            // Extract from knowledge graph, local results, or organic results
            const localResults = serpData.local_results || [];
            const organicResults = serpData.organic_results || [];
            const combined = [...localResults, ...organicResults].slice(
              0,
              searchParams.limit || 20
            );

            const totalDays = Math.max(
              1,
              Math.ceil(
                (new Date(searchParams.dropoffDate).getTime() -
                  new Date(searchParams.pickupDate).getTime()) /
                  86400000
              )
            );

            results = combined.map((item: any, idx: number) => {
              const dailyRate = item.price
                ? parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 35
                : 35 + idx * 5;
              return {
                id: `serp-car-${idx}`,
                type: 'car',
                provider: { code: 'google', name: 'Google' },
                vehicle: {
                  name: item.title || `Rental Car ${idx + 1}`,
                  category: 'economy',
                  transmission: 'automatic',
                  fuelType: 'gasoline',
                  airConditioning: true,
                  mileage: 'unlimited',
                  seats: 5,
                  doors: 4,
                  imageUrl: item.thumbnail || '',
                },
                rental: {
                  company: {
                    id: `company-${idx}`,
                    name: item.source || item.title || 'Rental Agency',
                    rating: item.rating || 4.0,
                  },
                  pickupLocation: searchParams.pickupLocation,
                  dropoffLocation: searchParams.dropoffLocation || searchParams.pickupLocation,
                  pickupDate: searchParams.pickupDate,
                  dropoffDate: searchParams.dropoffDate,
                },
                price: {
                  amount: dailyRate * totalDays,
                  currency: 'USD',
                  formatted: `$${(dailyRate * totalDays).toFixed(0)}`,
                  perDay: dailyRate,
                  perDayFormatted: `$${dailyRate.toFixed(0)}/day`,
                },
                features: ['Air Conditioning', 'Automatic'],
                policies: {
                  fuelPolicy: 'full-to-full',
                  mileagePolicy: 'unlimited',
                  insuranceIncluded: false,
                  freeCancellation: true,
                },
                deepLink: item.link || '',
                retrievedAt: new Date().toISOString(),
              };
            });
            console.log(`SerpAPI car fallback returned ${results.length} cars`);
          }
        } catch (serpErr: any) {
          console.error('SerpAPI car fallback failed:', serpErr.message);
        }
      }

      if (results.length === 0) {
        // Both primary and fallback failed — return empty instead of failing the request
        console.warn('Car search: all providers failed, returning empty results');
        return { items: [], totalCount: 0, responseTimeMs: Date.now() - startTime };
      }
    }

    let priceRange: { min: number; max: number } | undefined;
    if (results.length > 0) {
      const prices = results.map((c: any) => c.price.amount).filter((p: number) => p > 0);
      if (prices.length > 0) {
        priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices),
        };
      }
    }

    return {
      items: results,
      totalCount: results.length,
      responseTimeMs: Date.now() - startTime,
      priceRange,
    };
  } catch (error) {
    console.error('Car search error (returning empty):', error);
    // Return empty results instead of failing — package flow can continue without cars
    return {
      items: [],
      totalCount: 0,
      responseTimeMs: Date.now() - startTime,
    };
  }
}

// Execute experience search using experience adapter
async function executeExperienceSearch(
  providers: { providerId: string; providerCode: string }[],
  params: Record<string, unknown>,
  startTime: number
): Promise<{
  items: unknown[];
  totalCount: number;
  responseTimeMs: number;
  priceRange?: { min: number; max: number };
}> {
  // Build destination from various param formats
  let destinationValue = '';
  if (typeof params.destination === 'string') {
    destinationValue = params.destination;
  } else if (params.destination && typeof params.destination === 'object') {
    const dest = params.destination as { value?: string; type?: string };
    destinationValue = dest.value || '';
  }

  // Handle nested dates object from frontend
  const datesObj = params.dates as
    | { startDate?: string; endDate?: string; flexibleDates?: boolean }
    | undefined;

  const searchParams = {
    destination: {
      type: 'city' as const,
      value: destinationValue,
    },
    dates: {
      startDate: (datesObj?.startDate ||
        params.startDate ||
        params.date ||
        new Date().toISOString().split('T')[0]) as string,
      endDate: (datesObj?.endDate || params.endDate) as string | undefined,
      flexibleDates: datesObj?.flexibleDates || (params.flexibleDates as boolean) || false,
    },
    participants: {
      adults:
        (params.adults as number) || (params.participants as { adults?: number })?.adults || 2,
      children:
        (params.children as number) ||
        (params.participants as { children?: number })?.children ||
        0,
    },
    category: params.category as string | undefined,
    currency: (params.currency as string) || 'USD',
    limit: (params.limit as number) || 15,
  };

  console.log(
    `Executing experience search with params:`,
    JSON.stringify(searchParams).substring(0, 200)
  );

  try {
    let results: any[] = [];
    const providerCodes = providers.map((p) => p.providerCode);

    // Primary: Booking.com attractions (RapidAPI)
    try {
      if (
        providerCodes.includes('viator') ||
        providerCodes.includes('getyourguide') ||
        providerCodes.includes('hotelbeds')
      ) {
        results = await experiencesAdapter.searchExperiences(searchParams);
        console.log(`Experience adapter returned ${results.length} experiences`);
      }
    } catch (primaryErr: any) {
      console.error('Primary experience adapter failed:', primaryErr.message);

      // Fallback: SerpAPI Google search for activities/things to do
      const serpApiKey = Deno.env.get('SERPAPI_KEY');
      if (serpApiKey) {
        try {
          const query = `things to do in ${searchParams.destination.value}`;
          const serpUrl = new URL('https://serpapi.com/search.json');
          serpUrl.searchParams.set('engine', 'google');
          serpUrl.searchParams.set('q', query);
          serpUrl.searchParams.set('api_key', serpApiKey);
          serpUrl.searchParams.set('gl', 'us');
          serpUrl.searchParams.set('hl', 'en');
          serpUrl.searchParams.set('num', '15');

          const serpResp = await fetch(serpUrl.toString());
          if (serpResp.ok) {
            const serpData = await serpResp.json();
            const topSights = serpData.top_sights?.sights || [];
            const localResults = serpData.local_results || [];
            const combined = [...topSights, ...localResults].slice(0, searchParams.limit || 15);

            results = combined.map((item: any, idx: number) => ({
              id: `serp-exp-${idx}`,
              type: 'experience',
              provider: { code: 'google', name: 'Google' },
              title: item.title || item.name || 'Activity',
              description: item.description || item.snippet || '',
              shortDescription: (item.description || item.snippet || '').substring(0, 150),
              category: 'tours',
              location: {
                city: searchParams.destination.value,
                country: '',
                address: item.address || '',
              },
              images: item.thumbnail ? [{ url: item.thumbnail }] : [],
              heroImage:
                item.thumbnail ||
                `https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800`,
              duration: { value: 2, unit: 'hours', formatted: '2h' },
              rating: {
                score: item.rating || 4.5,
                maxScore: 5,
                reviewCount: item.reviews || 0,
              },
              price: {
                amount: item.price
                  ? parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 30
                  : 30,
                currency: 'USD',
                formatted: item.price || '$30',
                perPerson: true,
              },
              highlights: [],
              included: [],
              notIncluded: [],
              languages: ['English'],
              instantConfirmation: true,
              freeCancellation: true,
              availability: { nextAvailable: searchParams.dates.startDate },
              deepLink: item.link || item.place_id_search || '',
              retrievedAt: new Date().toISOString(),
            }));
            console.log(`SerpAPI fallback returned ${results.length} experiences`);
          }
        } catch (serpErr: any) {
          console.error('SerpAPI experience fallback failed:', serpErr.message);
        }
      }

      if (results.length === 0) {
        throw primaryErr;
      }
    }

    let priceRange: { min: number; max: number } | undefined;
    if (results.length > 0) {
      const prices = results.map((e: any) => e.price.amount).filter((p: number) => p > 0);
      if (prices.length > 0) {
        priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices),
        };
      }
    }

    return {
      items: results,
      totalCount: results.length,
      responseTimeMs: Date.now() - startTime,
      priceRange,
    };
  } catch (error) {
    console.error('Experience search error:', error);
    throw error;
  }
}

// ============================================
// CACHING
// ============================================

function generateCacheKey(category: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = params[key];
        return acc;
      },
      {} as Record<string, unknown>
    );

  const hash = btoa(JSON.stringify({ category, params: sortedParams }));
  return `search:${category}:${hash.substring(0, 64)}`;
}

async function checkCache(
  supabase: ReturnType<typeof createClient>,
  cacheKey: string
): Promise<{
  results: unknown;
  result_count: number;
  providers_used: string[];
  id: string;
} | null> {
  if (!CONFIG.caching.enabled) return null;

  const { data } = await supabase
    .from('search_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (data) {
    // Update hit count
    await supabase
      .from('search_cache')
      .update({ hit_count: (data.hit_count || 0) + 1, last_hit_at: new Date().toISOString() })
      .eq('id', data.id);
  }

  return data;
}

async function checkStaleCache(
  supabase: ReturnType<typeof createClient>,
  cacheKey: string
): Promise<{
  results: unknown;
  result_count: number;
  providers_used: string[];
  id: string;
} | null> {
  if (!CONFIG.caching.enabled) return null;

  const { data } = await supabase
    .from('search_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .lte('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data || null;
}

async function waitForCachedSearch(
  supabase: ReturnType<typeof createClient>,
  cacheKey: string,
  waitMs: number,
  pollMs: number
): Promise<{
  results: unknown;
  result_count: number;
  providers_used: string[];
  id: string;
} | null> {
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, pollMs));
    const cached = await checkCache(supabase, cacheKey);
    if (cached) return cached;
  }
  return null;
}

async function cacheResults(
  supabase: ReturnType<typeof createClient>,
  cacheKey: string,
  category: string,
  params: Record<string, unknown>,
  results: { items: unknown[]; totalCount: number },
  providersUsed: string[]
): Promise<void> {
  if (!CONFIG.caching.enabled) return;

  const expiresAt = new Date(Date.now() + CONFIG.caching.searchTtlSeconds * 1000);

  await supabase.from('search_cache').upsert(
    {
      cache_key: cacheKey,
      category,
      search_params: params,
      results: results.items,
      result_count: results.totalCount,
      providers_used: providersUsed,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      onConflict: 'cache_key',
    }
  );
}

async function cachePackageBundle(
  supabase: ReturnType<typeof createClient>,
  cacheKey: string,
  params: Record<string, unknown>,
  bundle: Record<string, unknown>,
  totalCount: number,
  providersUsed: string[]
): Promise<void> {
  if (!CONFIG.caching.enabled) return;

  const expiresAt = new Date(Date.now() + CONFIG.caching.searchTtlSeconds * 1000);

  await supabase.from('search_cache').upsert(
    {
      cache_key: cacheKey,
      category: 'packages',
      search_params: params,
      results: bundle,
      result_count: totalCount,
      providers_used: providersUsed,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      onConflict: 'cache_key',
    }
  );
}

// ============================================
// BUDGET & COST TRACKING
// ============================================

async function checkBudget(supabase: ReturnType<typeof createClient>): Promise<{
  allowed: boolean;
  dailyRemaining: number;
  monthlyRemaining: number;
  alertTriggered: boolean;
}> {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  // Get daily spend
  const { data: dailyCosts } = await supabase
    .from('provider_costs')
    .select('total_cost')
    .eq('period_type', 'daily')
    .eq('period_start', today);

  const dailySpent = dailyCosts?.reduce((sum, c) => sum + (c.total_cost || 0), 0) || 0;

  // Get monthly spend
  const { data: monthlyCosts } = await supabase
    .from('provider_costs')
    .select('total_cost')
    .eq('period_type', 'monthly')
    .eq('period_start', monthStart);

  const monthlySpent = monthlyCosts?.reduce((sum, c) => sum + (c.total_cost || 0), 0) || 0;

  const dailyRemaining = CONFIG.budget.dailyLimit - dailySpent;
  const monthlyRemaining = CONFIG.budget.monthlyLimit - monthlySpent;
  const allowed = dailyRemaining > 0 && monthlyRemaining > 0;

  const alertTriggered =
    dailySpent / CONFIG.budget.dailyLimit >= CONFIG.budget.alertThreshold ||
    monthlySpent / CONFIG.budget.monthlyLimit >= CONFIG.budget.alertThreshold;

  return { allowed, dailyRemaining, monthlyRemaining, alertTriggered };
}

async function updateCostTracking(
  supabase: ReturnType<typeof createClient>,
  searchCount: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Estimate cost (average across providers)
  const estimatedCost = searchCount * 0.01; // $0.01 per search average

  await supabase.from('provider_costs').upsert(
    {
      period_type: 'daily',
      period_start: today,
      period_end: tomorrow,
      search_calls: searchCount,
      search_cost: estimatedCost,
      total_cost: estimatedCost,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'provider_id,period_type,period_start',
      ignoreDuplicates: false,
    }
  );
}

// ============================================
// LOGGING
// ============================================

async function logProviderCalls(
  supabase: ReturnType<typeof createClient>,
  requestId: string,
  providers: { providerId: string; providerCode: string }[],
  category: string,
  results: { responseTimeMs: number }
): Promise<void> {
  const logs = providers.map((provider, index) => ({
    request_id: requestId,
    provider_id: provider.providerId,
    provider_code: provider.providerCode,
    request_type: 'search',
    category,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    response_time_ms: results.responseTimeMs,
    success: true,
    was_fallback: index > 0,
  }));

  await supabase.from('provider_logs').insert(logs);
}

async function updateProviderCircuitStates(
  supabase: ReturnType<typeof createClient>,
  providers: { providerCode: string }[],
  results: { totalCount: number; responseTimeMs: number }
): Promise<void> {
  if (providers.length === 0) return;

  const providerCodes = providers.map((provider) => provider.providerCode);
  const { data } = await supabase
    .from('api_providers')
    .select('provider_code, health_score, consecutive_failures, last_failed_call, enabled')
    .in('provider_code', providerCodes);

  await Promise.all(
    (data || []).map((provider: any) =>
      recordProviderCircuitResult(
        supabase,
        {
          providerCode: provider.provider_code,
          enabled: provider.enabled,
          health_score: provider.health_score,
          consecutive_failures: provider.consecutive_failures,
          last_failed_call: provider.last_failed_call,
        },
        {
          success: results.totalCount > 0,
          statusCode: results.totalCount > 0 ? 200 : 502,
          responseTimeMs: results.responseTimeMs,
        }
      )
    )
  );
}

// ============================================
// OTHER HANDLERS
// ============================================

async function handleGetOffer(context: {
  requestId: string;
  offerId: string;
  providerCode: string;
  category: string;
  supabase: ReturnType<typeof createClient>;
}) {
  // Placeholder for offer retrieval
  return {
    offerId: context.offerId,
    provider: context.providerCode,
    valid: true,
    message: 'Offer details would be fetched from provider',
  };
}

async function handleHealthCheck(context: {
  providerId: string;
  supabase: ReturnType<typeof createClient>;
}) {
  const { data: provider } = await context.supabase
    .from('api_providers')
    .select('*')
    .eq('id', context.providerId)
    .single();

  if (!provider) {
    throw { code: 'PROVIDER_NOT_FOUND', message: 'Provider not found', status: 404 };
  }

  // Log health check
  await context.supabase.from('provider_health_checks').insert({
    provider_id: context.providerId,
    check_type: 'ping',
    success: true,
    response_time_ms: 50,
    status_code: 200,
  });

  return {
    providerId: context.providerId,
    providerCode: provider.provider_code,
    healthy: true,
    healthScore: provider.health_score,
  };
}
