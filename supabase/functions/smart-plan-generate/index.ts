import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  tripModuleUnauthorizedResponse,
  verifyTripModuleAccess,
} from '../_shared/tripModule/auth.ts';
import {
  hasAccountEntitlement,
  INTERNAL_TESTING_ENTITLEMENT,
} from '../_shared/accountEntitlements.ts';
import {
  acquireSmartPlanLock,
  buildSmartPlanInitialModuleStatus,
  buildTripModuleFunctionInvokeHeaders,
  consumeTripModuleRateLimits,
  evaluateSmartPlanCompletion,
  isSmartPlanReady,
  releaseSmartPlanLock,
  shouldSkipReadyModule,
  TRIP_MODULE_NAMESPACE,
} from '../_shared/tripModule/runtime.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const MODULE_INVOKE_TIMEOUT_MS = 105_000;
const SMART_PLAN_MAX_ATTEMPTS = 8;
const SMART_PLAN_CONTINUATION_DELAY_MS = 5_000;

type ModuleStatus = 'waiting' | 'generating' | 'ready' | 'failed' | 'skipped';

interface SmartPlanRequest {
  tripId: string;
  forceRefresh?: boolean;
  userId?: string;
  _internalServiceRole?: string;
}

interface SmartPlanModule {
  key: string;
  statusKey: string;
  functionName: string;
  detailKey?: string;
}

const MODULES: SmartPlanModule[] = [
  {
    key: 'documents',
    statusKey: 'documents',
    functionName: 'generate-documents',
    detailKey: 'totalDocuments',
  },
  {
    key: 'language',
    statusKey: 'language',
    functionName: 'generate-language',
    detailKey: 'totalPhrases',
  },
  { key: 'safety', statusKey: 'safety', functionName: 'generate-safety', detailKey: 'safetyScore' },
  {
    key: 'dos_donts',
    statusKey: 'dos_donts',
    functionName: 'generate-dos-donts',
    detailKey: 'tipsGenerated',
  },
  {
    key: 'itinerary',
    statusKey: 'itinerary',
    functionName: 'generate-itinerary',
    detailKey: 'daysGenerated',
  },
  {
    key: 'packing',
    statusKey: 'packing',
    functionName: 'generate-packing',
    detailKey: 'itemsGenerated',
  },
];
function pickGatewayJwt(...values: Array<string | null | undefined>): string {
  return values.find((value) => typeof value === 'string' && value.startsWith('eyJ')) || '';
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deferSmartPlanWork(work: Promise<unknown>): void {
  const edgeRuntime = (
    globalThis as { EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void } }
  ).EdgeRuntime;
  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(work);
    return;
  }
  work.catch((error) => console.warn('[smart-plan-generate] Deferred work failed:', error));
}

async function notifySmartPlanReady(supabase: any, userId: string, tripId: string): Promise<void> {
  try {
    const { data: trip } = await supabase
      .from('trips')
      .select('title, primary_destination_name')
      .eq('id', tripId)
      .maybeSingle();
    const tripName = trip?.title || trip?.primary_destination_name || 'your trip';

    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('alert_type_code', 'smart_plan_complete')
      .contains('context', { tripId })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (Array.isArray(existing) && existing.length > 0) return;

    await supabase.from('alerts').insert({
      user_id: userId,
      alert_type_code: 'smart_plan_complete',
      category_code: 'trip',
      title: `Smart Plan ready for ${tripName}!`,
      body: 'All 6 trip modules are ready. Your itinerary, packing list, safety tips, language kit, documents, and local tips are complete.',
      context: { tripId, modulesGenerated: MODULES.length },
      action_url: `/trip/${tripId}`,
      priority: 5,
      channels_requested: ['push', 'in_app'],
      status: 'pending',
    });
  } catch (error) {
    console.warn('[smart-plan-generate] Smart Plan notification insert failed:', error);
  }
}

function scheduleSmartPlanContinuation(params: {
  tripId: string;
  userId: string;
  env: { supabaseUrl: string; serviceRoleKey: string; anonKey: string };
}): void {
  const { tripId, userId, env } = params;
  deferSmartPlanWork(
    (async () => {
      await wait(SMART_PLAN_CONTINUATION_DELAY_MS);
      await fetch(`${env.supabaseUrl}/functions/v1/smart-plan-generate`, {
        method: 'POST',
        headers: buildTripModuleFunctionInvokeHeaders(env),
        body: JSON.stringify({
          tripId,
          userId,
          forceRefresh: false,
          _internalServiceRole: env.serviceRoleKey,
        }),
      });
    })()
  );
}

async function getGenerationStatus(
  supabase: any,
  tripId: string
): Promise<Record<string, unknown>> {
  const { data } = await supabase
    .from('trips')
    .select('generation_status')
    .eq('id', tripId)
    .maybeSingle();
  return (data?.generation_status as Record<string, unknown>) || {};
}

async function mergeGenerationStatus(
  supabase: any,
  tripId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const current = await getGenerationStatus(supabase, tripId);
  await supabase
    .from('trips')
    .update({
      generation_status: {
        ...current,
        ...patch,
        smart_plan_updated_at: new Date().toISOString(),
      },
    })
    .eq('id', tripId);
}

async function recordSmartPlanMetric(
  supabase: any,
  params: {
    phase: string;
    cacheStatus: string;
    statusCode: number;
    durationMs: number;
    providerSummary?: Record<string, unknown>;
    errorMessage?: string;
  }
): Promise<void> {
  await supabase.from('edge_request_metrics').insert({
    namespace: TRIP_MODULE_NAMESPACE,
    phase: params.phase,
    cache_status: params.cacheStatus,
    status_code: params.statusCode,
    duration_ms: params.durationMs,
    provider_summary: params.providerSummary || {},
    error_message: params.errorMessage || null,
  });
}

function moduleStatusPatch(
  module: SmartPlanModule,
  status: ModuleStatus,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    [module.statusKey]: status,
    [`${module.statusKey}_${status}_at`]: now,
    ...extra,
  };
  if (status === 'generating') patch[`${module.statusKey}_started_at`] = now;
  if (status === 'ready') patch[`${module.statusKey}_generated_at`] = now;
  return patch;
}

async function invokeModule(
  supabase: any,
  tripId: string,
  module: SmartPlanModule,
  env: { supabaseUrl: string; serviceRoleKey: string; anonKey: string },
  userId: string,
  forceRefresh: boolean
): Promise<{ key: string; success: boolean; detail?: unknown; error?: string }> {
  try {
    const currentStatus = await getGenerationStatus(supabase, tripId);
    if (shouldSkipReadyModule(currentStatus, module.statusKey, forceRefresh)) {
      return {
        key: module.key,
        success: true,
        detail: module.detailKey ? currentStatus[`${module.statusKey}_detail`] : undefined,
      };
    }

    await mergeGenerationStatus(supabase, tripId, moduleStatusPatch(module, 'generating'));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MODULE_INVOKE_TIMEOUT_MS);
    const response = await fetch(`${env.supabaseUrl}/functions/v1/${module.functionName}`, {
      method: 'POST',
      headers: buildTripModuleFunctionInvokeHeaders(env),
      signal: controller.signal,
      body: JSON.stringify({
        tripId,
        forceRefresh,
        userId,
        _internalServiceRole: env.serviceRoleKey,
      }),
    }).finally(() => clearTimeout(timeoutId));
    const responseText = await response.text().catch(() => '');
    let data: Record<string, any> = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = {};
    }
    if (data?.alreadyRunning || data?.status === 'generating') {
      return { key: module.key, success: false, error: 'already_running' };
    }
    if (!response.ok || data?.success === false || data?.error) {
      const error = String(data?.error || data?.message || responseText || `HTTP ${response.status}`);
      await mergeGenerationStatus(
        supabase,
        tripId,
        moduleStatusPatch(module, 'failed', { [`${module.statusKey}_error`]: error })
      );
      return { key: module.key, success: false, error };
    }

    const detail = module.detailKey ? data?.[module.detailKey] : undefined;
    await mergeGenerationStatus(
      supabase,
      tripId,
      moduleStatusPatch(module, 'ready', {
        [`${module.statusKey}_detail`]: detail ?? null,
        [`${module.statusKey}_model`]: data?.modelUsed || null,
      })
    );
    return { key: module.key, success: true, detail };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await mergeGenerationStatus(
      supabase,
      tripId,
      moduleStatusPatch(module, 'failed', { [`${module.statusKey}_error`]: message })
    );
    return { key: module.key, success: false, error: message };
  }
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) await worker(item);
    }
  });
  await Promise.all(workers);
}

async function runSmartPlanGeneration(params: {
  supabase: any;
  tripId: string;
  forceRefresh: boolean;
  lockOwnerId: string;
  userId: string;
  env: { supabaseUrl: string; serviceRoleKey: string; anonKey: string };
}): Promise<void> {
  const { supabase, tripId, forceRefresh, lockOwnerId, userId, env } = params;
  const startedAt = Date.now();

  try {
    const previousStatus = await getGenerationStatus(supabase, tripId);
    const attempt = (forceRefresh ? 0 : Number(previousStatus.smart_plan_attempt || 0)) + 1;
    const initialStatus = {
      ...buildSmartPlanInitialModuleStatus(
        previousStatus,
        forceRefresh,
        MODULES.map((module) => module.statusKey)
      ),
      smart_plan: 'generating',
      smart_plan_started_at: new Date().toISOString(),
      smart_plan_failed_modules: [],
      smart_plan_missing_modules: [],
      smart_plan_modules_ready: 0,
      smart_plan_modules_total: MODULES.length,
      smart_plan_attempt: attempt,
    };
    await mergeGenerationStatus(supabase, tripId, initialStatus);
    const results: { key: string; success: boolean; detail?: unknown; error?: string }[] = [];

    await runWithConcurrency(MODULES, 3, async (module) => {
      const result = await invokeModule(supabase, tripId, module, env, userId, forceRefresh);
      results.push(result);
    });

    const completion = evaluateSmartPlanCompletion(
      results,
      MODULES.map((module) => module.key)
    );
    const exhausted = completion.status !== 'ready' && attempt >= SMART_PLAN_MAX_ATTEMPTS;
    const finalStatus = exhausted ? 'failed' : completion.status;
    const finalStatusCode = finalStatus === 'ready' ? 200 : finalStatus === 'generating' ? 202 : 500;
    const finalTimestampKey =
      finalStatus === 'ready'
        ? 'smart_plan_completed_at'
        : finalStatus === 'generating'
          ? 'smart_plan_retry_scheduled_at'
          : 'smart_plan_failed_at';
    await supabase
      .from('trips')
      .update({
        modules_generated: finalStatus === 'ready',
        modules_generated_at: finalStatus === 'ready' ? new Date().toISOString() : null,
        generation_status: {
          ...(await getGenerationStatus(supabase, tripId)),
          smart_plan: finalStatus,
          [finalTimestampKey]: new Date().toISOString(),
          smart_plan_modules_ready: completion.modulesReady,
          smart_plan_modules_total: completion.modulesTotal,
          smart_plan_failed_modules: completion.failedModules,
          smart_plan_missing_modules: completion.missingModules,
          smart_plan_attempt: attempt,
        },
      })
      .eq('id', tripId);

    if (finalStatus === 'ready') {
      await notifySmartPlanReady(supabase, userId, tripId);
    }

    await recordSmartPlanMetric(supabase, {
      phase: 'smart_plan',
      cacheStatus: finalStatus === 'generating' ? 'coalesced' : finalStatus,
      statusCode: finalStatusCode,
      durationMs: Date.now() - startedAt,
      providerSummary: {
        tripId,
        modulesReady: completion.modulesReady,
        modulesTotal: completion.modulesTotal,
        failedModules: completion.failedModules,
        missingModules: completion.missingModules,
        attempt,
        retryScheduled: finalStatus === 'generating',
      },
    });
    await releaseSmartPlanLock(
      supabase,
      tripId,
      lockOwnerId,
      finalStatus === 'failed' ? 'failed' : 'completed'
    );
    if (finalStatus === 'generating') {
      scheduleSmartPlanContinuation({ tripId, userId, env });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await mergeGenerationStatus(supabase, tripId, {
      smart_plan: 'failed',
      smart_plan_error: message,
      smart_plan_failed_at: new Date().toISOString(),
    });
    await recordSmartPlanMetric(supabase, {
      phase: 'smart_plan',
      cacheStatus: 'error',
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      providerSummary: { tripId },
      errorMessage: message,
    });
    await releaseSmartPlanLock(supabase, tripId, lockOwnerId, 'failed');
  }
}

Deno.serve(async (req) => {
  const requestStartedAt = Date.now();
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const anonKey = pickGatewayJwt(
    Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    Deno.env.get('SUPABASE_ANON_PUBLIC_KEY'),
    Deno.env.get('SUPABASE_ANON_KEY')
  );
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ success: false, error: 'Server misconfigured' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const body = (await req.json().catch(() => ({}))) as SmartPlanRequest;
  if (!body.tripId) return jsonResponse({ success: false, error: 'tripId is required' }, 400);

  const access = await verifyTripModuleAccess(req, body, supabase, {
    supabaseUrl,
    serviceRoleKey,
    anonKey,
  });
  if (!access.allowed || !access.userId) return tripModuleUnauthorizedResponse(corsHeaders);

  const currentStatus = await getGenerationStatus(supabase, body.tripId);
  if (!body.forceRefresh && isSmartPlanReady(currentStatus)) {
    return jsonResponse({
      success: true,
      status: 'already_running',
      generationStatus: currentStatus,
    });
  }

  const isInternalContinuation = body._internalServiceRole === serviceRoleKey;
  if (!isInternalContinuation) {
    const rateLimit = await consumeTripModuleRateLimits(supabase, {
      userId: access.userId,
      tripId: body.tripId,
      moduleKey: 'smart_plan',
      isPrivilegedTester: await hasAccountEntitlement(
        supabase,
        access.userId,
        INTERNAL_TESTING_ENTITLEMENT,
        'smart_plan'
      ),
    });
    if (!rateLimit.allowed) {
      await recordSmartPlanMetric(supabase, {
        phase: 'smart_plan_start',
        cacheStatus: 'rate_limited',
        statusCode: 429,
        durationMs: Date.now() - requestStartedAt,
        providerSummary: { tripId: body.tripId, blockedKey: rateLimit.blockedKey },
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          resetAt: rateLimit.resetAt,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': rateLimit.resetAt,
            'Retry-After': '60',
          },
        }
      );
    }
  }

  const lock = await acquireSmartPlanLock(supabase, body.tripId);
  if (!lock.acquired) {
    await recordSmartPlanMetric(supabase, {
      phase: 'smart_plan_start',
      cacheStatus: 'coalesced',
      statusCode: 202,
      durationMs: Date.now() - requestStartedAt,
      providerSummary: { tripId: body.tripId },
    });
    return jsonResponse(
      {
        success: true,
        status: 'already_running',
        generationStatus: await getGenerationStatus(supabase, body.tripId),
      },
      202
    );
  }

  await recordSmartPlanMetric(supabase, {
    phase: 'smart_plan_start',
    cacheStatus: 'miss',
    statusCode: 202,
    durationMs: Date.now() - requestStartedAt,
    providerSummary: { tripId: body.tripId },
  });

  deferSmartPlanWork(
    runSmartPlanGeneration({
      supabase,
      tripId: body.tripId,
      forceRefresh: Boolean(body.forceRefresh),
      lockOwnerId: lock.ownerId,
      userId: access.userId,
      env: { supabaseUrl, serviceRoleKey, anonKey },
    })
  );

  return jsonResponse({ success: true, status: 'started' }, 202);
});
