export interface CircuitProviderState {
  providerCode: string;
  enabled?: boolean;
  health_score?: number | null;
  consecutive_failures?: number | null;
  last_failed_call?: string | null;
}

export interface CircuitOpenInput {
  consecutiveFailures: number;
  lastFailedAt?: string | null;
  now?: Date;
  failureThreshold?: number;
  openDurationMs?: number;
}

export interface CircuitNextStateInput {
  previousFailures: number;
  previousHealthScore?: number;
  success: boolean;
  statusCode?: number;
  responseTimeMs?: number;
  now?: Date;
}

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_OPEN_DURATION_MS = 60_000;

export function isCircuitOpen(input: CircuitOpenInput): boolean {
  const threshold = input.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
  if (input.consecutiveFailures < threshold || !input.lastFailedAt) return false;

  const failedAt = new Date(input.lastFailedAt).getTime();
  if (!Number.isFinite(failedAt)) return false;

  const now = input.now?.getTime() ?? Date.now();
  return now - failedAt < (input.openDurationMs ?? DEFAULT_OPEN_DURATION_MS);
}

export function shouldSkipProvider(provider: CircuitProviderState, now = new Date()): boolean {
  if (provider.enabled === false) return true;
  if ((provider.health_score ?? 100) < 10) return true;

  return isCircuitOpen({
    consecutiveFailures: provider.consecutive_failures ?? 0,
    lastFailedAt: provider.last_failed_call,
    now,
  });
}

export function nextCircuitState(input: CircuitNextStateInput): Record<string, unknown> {
  const now = input.now || new Date();

  if (input.success) {
    const responsePenalty = input.responseTimeMs && input.responseTimeMs > 2500 ? 10 : 0;
    return {
      consecutive_failures: 0,
      health_score: Math.max(50, Math.min(100, 100 - responsePenalty)),
      last_successful_call: now.toISOString(),
      last_health_check: now.toISOString(),
      avg_response_time_ms: input.responseTimeMs ?? null,
      updated_at: now.toISOString(),
    };
  }

  const nextFailures = input.previousFailures + 1;
  const severe = input.statusCode === 429 || (input.statusCode ?? 0) >= 500;
  const penalty = severe ? 25 : 15;
  const previousHealth = input.previousHealthScore ?? 100;

  return {
    consecutive_failures: nextFailures,
    health_score: Math.max(0, previousHealth - penalty),
    last_failed_call: now.toISOString(),
    last_health_check: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

export async function recordProviderCircuitResult(
  supabase: {
    from: (table: string) => {
      update: (values: Record<string, unknown>) => {
        eq: (column: string, value: unknown) => Promise<{ error: { message?: string } | null }>;
      };
    };
  },
  provider: CircuitProviderState,
  result: { success: boolean; statusCode?: number; responseTimeMs?: number }
): Promise<void> {
  const update = nextCircuitState({
    previousFailures: provider.consecutive_failures ?? 0,
    previousHealthScore: provider.health_score ?? 100,
    success: result.success,
    statusCode: result.statusCode,
    responseTimeMs: result.responseTimeMs,
  });

  const { error } = await supabase
    .from('api_providers')
    .update(update)
    .eq('provider_code', provider.providerCode);

  if (error) {
    console.warn(
      `[providers] Failed to update circuit for ${provider.providerCode}: ${error.message || 'unknown error'}`
    );
  }
}
