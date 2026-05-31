import { tripModuleUnauthorizedResponse, verifyTripModuleAccess } from './auth.ts';
import {
  acquireTripModuleLock,
  consumeTripModuleRateLimits,
  recordTripModuleMetric,
  releaseTripModuleLock,
  shouldSkipReadyModule,
} from './runtime.ts';

interface SupabaseClientLike {
  from: (table: string) => any;
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
}

interface TripModuleWorkerEnv {
  supabaseUrl: string;
  serviceRoleKey: string;
  anonKey: string;
}

interface BeginTripModuleWorkerInput {
  req: Request;
  body: Record<string, any>;
  supabase: SupabaseClientLike;
  moduleKey: string;
  statusKey?: string;
  corsHeaders: Record<string, string>;
  env: TripModuleWorkerEnv;
}

export interface TripModuleWorkerLease {
  tripId: string;
  moduleKey: string;
  ownerId: string;
}

interface BeginTripModuleWorkerResult {
  response?: Response;
  lease?: TripModuleWorkerLease;
  trip?: Record<string, any>;
  userId?: string | null;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function beginTripModuleWorker({
  req,
  body,
  supabase,
  moduleKey,
  statusKey = moduleKey,
  corsHeaders,
  env,
}: BeginTripModuleWorkerInput): Promise<BeginTripModuleWorkerResult> {
  const startedAt = Date.now();
  const tripId = typeof body.tripId === 'string' ? body.tripId : '';
  if (!tripId) {
    return {
      response: jsonResponse({ success: false, error: 'tripId is required' }, 400, corsHeaders),
    };
  }

  const access = await verifyTripModuleAccess(req, body, supabase, env);
  if (!access.allowed || !access.trip) {
    return { response: tripModuleUnauthorizedResponse(corsHeaders) };
  }
  const isInternalOrchestratorCall =
    typeof body._internalServiceRole === 'string' &&
    body._internalServiceRole === env.serviceRoleKey;

  const forceRefresh = body.forceRefresh === true;
  const generationStatus = access.trip.generation_status as Record<string, unknown> | null;
  if (shouldSkipReadyModule(generationStatus, statusKey, forceRefresh)) {
    await recordTripModuleMetric(supabase, {
      moduleKey,
      cacheStatus: 'hit',
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      model: typeof generationStatus?.[`${statusKey}_model`] === 'string'
        ? String(generationStatus?.[`${statusKey}_model`])
        : null,
    });
    return {
      response: jsonResponse(
        {
          success: true,
          skipped: true,
          moduleKey: statusKey,
          status: 'ready',
          cacheStatus: 'ready',
          modelUsed: generationStatus?.[`${statusKey}_model`] ?? null,
        },
        200,
        corsHeaders
      ),
    };
  }

  if (!access.isServiceRoleCall && !isInternalOrchestratorCall) {
    const rateLimit = await consumeTripModuleRateLimits(supabase, {
      userId: access.userId || access.trip.user_id,
      tripId,
      moduleKey,
    });
    if (!rateLimit.allowed) {
      await recordTripModuleMetric(supabase, {
        moduleKey,
        cacheStatus: 'rate_limited',
        statusCode: 429,
        durationMs: Date.now() - startedAt,
        providerSummary: { blockedKey: rateLimit.blockedKey, resetAt: rateLimit.resetAt },
      });
      return {
        response: jsonResponse(
          {
            success: false,
            error: 'rate_limited',
            resetAt: rateLimit.resetAt,
            blockedKey: rateLimit.blockedKey,
          },
          429,
          corsHeaders
        ),
      };
    }
  }

  const lock = await acquireTripModuleLock(supabase, tripId, moduleKey);
  if (!lock.acquired) {
    await recordTripModuleMetric(supabase, {
      moduleKey,
      cacheStatus: 'coalesced',
      statusCode: 202,
      durationMs: Date.now() - startedAt,
    });
    return {
      response: jsonResponse(
        {
          success: true,
          skipped: true,
          alreadyRunning: true,
          moduleKey: statusKey,
          status: 'generating',
          cacheStatus: 'coalesced',
        },
        202,
        corsHeaders
      ),
    };
  }

  return {
    lease: { tripId, moduleKey, ownerId: lock.ownerId },
    trip: access.trip,
    userId: access.userId || access.trip.user_id || null,
  };
}

export async function finishTripModuleWorker(
  supabase: SupabaseClientLike,
  lease: TripModuleWorkerLease | null | undefined,
  status: 'completed' | 'failed'
): Promise<void> {
  if (!lease) return;
  try {
    await releaseTripModuleLock(supabase, lease.tripId, lease.moduleKey, lease.ownerId, status);
  } catch (error) {
    console.warn('[trip-module-worker] Failed to release module lock:', error);
  }
}
