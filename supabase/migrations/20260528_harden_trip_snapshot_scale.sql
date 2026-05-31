-- Harden Trip Snapshot for launch-scale traffic:
-- - full Phase A response cache
-- - durable generation locks for request coalescing
-- - global rate-limit buckets
-- - request metrics for admin visibility

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.snapshot_response_cache (
  cache_key text PRIMARY KEY,
  destination text NOT NULL,
  country text,
  origin text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  nationality text,
  traveler_count integer NOT NULL DEFAULT 1,
  response jsonb NOT NULL,
  provider_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  build_duration_ms integer,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  access_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_snapshot_response_cache_expires_at
  ON public.snapshot_response_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_snapshot_response_cache_destination
  ON public.snapshot_response_cache (lower(destination), lower(country));

ALTER TABLE public.snapshot_response_cache ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.snapshot_generation_locks (
  cache_key text PRIMARY KEY,
  owner_id text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  locked_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshot_generation_locks_locked_until
  ON public.snapshot_generation_locks (locked_until);

ALTER TABLE public.snapshot_generation_locks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.snapshot_rate_limit_buckets (
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  window_seconds integer NOT NULL,
  max_requests integer NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_rate_limit_buckets_updated_at
  ON public.snapshot_rate_limit_buckets (updated_at);

ALTER TABLE public.snapshot_rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.snapshot_request_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  cache_key text,
  phase text NOT NULL DEFAULT 'data',
  destination text,
  country text,
  cache_status text NOT NULL,
  status_code integer NOT NULL DEFAULT 200,
  duration_ms integer,
  provider_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshot_request_metrics_created_at
  ON public.snapshot_request_metrics (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_snapshot_request_metrics_cache_status
  ON public.snapshot_request_metrics (cache_status);

CREATE INDEX IF NOT EXISTS idx_snapshot_request_metrics_destination
  ON public.snapshot_request_metrics (lower(destination), lower(country));

ALTER TABLE public.snapshot_request_metrics ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.snapshot_consume_rate_limit(
  p_bucket_key text,
  p_window_seconds integer,
  p_max_requests integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
  v_retry_after integer;
BEGIN
  DELETE FROM public.snapshot_rate_limit_buckets
  WHERE updated_at < now() - interval '24 hours';

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.snapshot_rate_limit_buckets (
    bucket_key,
    window_start,
    window_seconds,
    max_requests,
    request_count,
    updated_at
  )
  VALUES (
    p_bucket_key,
    v_window_start,
    p_window_seconds,
    p_max_requests,
    1,
    now()
  )
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET
    request_count = public.snapshot_rate_limit_buckets.request_count + 1,
    max_requests = excluded.max_requests,
    updated_at = now()
  RETURNING request_count INTO v_count;

  v_retry_after := greatest(
    1,
    ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - now())))::integer
  );

  RETURN jsonb_build_object(
    'allowed', v_count <= p_max_requests,
    'remaining', greatest(0, p_max_requests - v_count),
    'retryAfterSec', v_retry_after,
    'count', v_count,
    'limit', p_max_requests
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.snapshot_try_acquire_lock(
  p_cache_key text,
  p_owner_id text,
  p_ttl_seconds integer DEFAULT 45
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner text;
BEGIN
  INSERT INTO public.snapshot_generation_locks (
    cache_key,
    owner_id,
    status,
    locked_until,
    created_at,
    updated_at
  )
  VALUES (
    p_cache_key,
    p_owner_id,
    'running',
    now() + make_interval(secs => p_ttl_seconds),
    now(),
    now()
  )
  ON CONFLICT (cache_key)
  DO UPDATE SET
    owner_id = excluded.owner_id,
    status = 'running',
    locked_until = excluded.locked_until,
    updated_at = now()
  WHERE public.snapshot_generation_locks.locked_until < now()
    OR public.snapshot_generation_locks.status IN ('completed', 'failed')
  RETURNING owner_id INTO v_owner;

  RETURN jsonb_build_object(
    'acquired', v_owner = p_owner_id,
    'ownerId', coalesce(v_owner, '')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.snapshot_release_lock(
  p_cache_key text,
  p_owner_id text,
  p_status text DEFAULT 'completed'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.snapshot_generation_locks
  SET
    status = p_status,
    locked_until = now(),
    updated_at = now()
  WHERE cache_key = p_cache_key
    AND owner_id = p_owner_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_snapshot_metrics(p_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH recent AS (
  SELECT *
  FROM public.snapshot_request_metrics
  WHERE created_at >= now() - make_interval(hours => greatest(p_hours, 1))
),
totals AS (
  SELECT
    count(*)::integer AS total_requests,
    count(*) FILTER (WHERE cache_status = 'hit')::integer AS cache_hits,
    count(*) FILTER (WHERE cache_status IN ('miss', 'generated'))::integer AS cache_misses,
    count(*) FILTER (WHERE cache_status = 'coalesced')::integer AS coalesced,
    count(*) FILTER (WHERE cache_status = 'rate_limited')::integer AS rate_limited,
    count(*) FILTER (WHERE status_code >= 500 OR cache_status = 'error')::integer AS errors,
    coalesce(round(avg(duration_ms))::integer, 0) AS avg_duration_ms,
    coalesce(round(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms))::integer, 0) AS p95_duration_ms
  FROM recent
),
by_status AS (
  SELECT coalesce(jsonb_object_agg(cache_status, ct), '{}'::jsonb) AS data
  FROM (
    SELECT cache_status, count(*)::integer AS ct
    FROM recent
    GROUP BY cache_status
  ) s
),
by_destination AS (
  SELECT coalesce(jsonb_agg(row_to_json(d) ORDER BY d.requests DESC), '[]'::jsonb) AS data
  FROM (
    SELECT
      destination,
      country,
      count(*)::integer AS requests,
      count(*) FILTER (WHERE cache_status = 'hit')::integer AS cache_hits
    FROM recent
    WHERE destination IS NOT NULL
    GROUP BY destination, country
    ORDER BY requests DESC
    LIMIT 10
  ) d
)
SELECT jsonb_build_object(
  'windowHours', greatest(p_hours, 1),
  'totalRequests', totals.total_requests,
  'cacheHits', totals.cache_hits,
  'cacheMisses', totals.cache_misses,
  'cacheHitRate', CASE
    WHEN totals.total_requests = 0 THEN 0
    ELSE round((totals.cache_hits::numeric / totals.total_requests::numeric) * 100, 1)
  END,
  'coalesced', totals.coalesced,
  'rateLimited', totals.rate_limited,
  'errors', totals.errors,
  'avgDurationMs', totals.avg_duration_ms,
  'p95DurationMs', totals.p95_duration_ms,
  'byStatus', by_status.data,
  'topDestinations', by_destination.data
)
FROM totals, by_status, by_destination;
$$;
