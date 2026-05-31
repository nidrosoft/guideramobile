-- Shared Edge scale hardening primitives.
-- These generic tables/RPCs let future Edge Functions opt into the same
-- cache, coalescing, durable rate-limit, and metrics pattern used by snapshot.

CREATE TABLE IF NOT EXISTS public.edge_response_cache (
  namespace text NOT NULL,
  cache_key text NOT NULL,
  response jsonb NOT NULL,
  provider_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  access_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (namespace, cache_key)
);

CREATE INDEX IF NOT EXISTS edge_response_cache_expires_at_idx
  ON public.edge_response_cache (expires_at);

CREATE TABLE IF NOT EXISTS public.edge_generation_locks (
  namespace text NOT NULL,
  lock_key text NOT NULL,
  owner_id text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  PRIMARY KEY (namespace, lock_key)
);

CREATE INDEX IF NOT EXISTS edge_generation_locks_expires_at_idx
  ON public.edge_generation_locks (expires_at);

CREATE TABLE IF NOT EXISTS public.edge_rate_limit_buckets (
  namespace text NOT NULL,
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (namespace, bucket_key)
);

CREATE INDEX IF NOT EXISTS edge_rate_limit_buckets_reset_at_idx
  ON public.edge_rate_limit_buckets (reset_at);

CREATE TABLE IF NOT EXISTS public.edge_request_metrics (
  id bigserial PRIMARY KEY,
  namespace text NOT NULL,
  phase text,
  cache_status text,
  status_code integer,
  duration_ms integer,
  provider_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS edge_request_metrics_namespace_created_at_idx
  ON public.edge_request_metrics (namespace, created_at DESC);

ALTER TABLE public.edge_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_generation_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_request_metrics ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.edge_response_cache FROM anon, authenticated;
REVOKE ALL ON public.edge_generation_locks FROM anon, authenticated;
REVOKE ALL ON public.edge_rate_limit_buckets FROM anon, authenticated;
REVOKE ALL ON public.edge_request_metrics FROM anon, authenticated;

GRANT ALL ON public.edge_response_cache TO service_role;
GRANT ALL ON public.edge_generation_locks TO service_role;
GRANT ALL ON public.edge_rate_limit_buckets TO service_role;
GRANT ALL ON public.edge_request_metrics TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.edge_request_metrics_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.edge_consume_rate_limit(
  p_namespace text,
  p_bucket_key text,
  p_window_seconds integer,
  p_max_requests integer
)
RETURNS TABLE (
  allowed boolean,
  remaining integer,
  reset_at timestamptz,
  blocked_key text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_now timestamptz := now();
  v_reset_at timestamptz := now() + make_interval(secs => greatest(p_window_seconds, 1));
  v_count integer;
BEGIN
  IF coalesce(trim(p_namespace), '') = ''
    OR coalesce(trim(p_bucket_key), '') = ''
    OR p_max_requests < 1
    OR p_window_seconds < 1 THEN
    RETURN QUERY SELECT false, 0, v_reset_at, concat_ws(':', p_namespace, p_bucket_key);
    RETURN;
  END IF;

  LOOP
    INSERT INTO public.edge_rate_limit_buckets (
      namespace,
      bucket_key,
      window_start,
      request_count,
      reset_at,
      updated_at
    )
    VALUES (
      p_namespace,
      p_bucket_key,
      v_now,
      1,
      v_reset_at,
      v_now
    )
    ON CONFLICT (namespace, bucket_key) DO NOTHING;

    IF FOUND THEN
      RETURN QUERY SELECT true, greatest(p_max_requests - 1, 0), v_reset_at, NULL::text;
      RETURN;
    END IF;

    SELECT b.request_count, b.reset_at
    INTO v_count, v_reset_at
    FROM public.edge_rate_limit_buckets b
    WHERE b.namespace = p_namespace
      AND b.bucket_key = p_bucket_key
    FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    IF v_now >= v_reset_at THEN
      v_reset_at := v_now + make_interval(secs => greatest(p_window_seconds, 1));
      UPDATE public.edge_rate_limit_buckets
      SET
        window_start = v_now,
        request_count = 1,
        reset_at = v_reset_at,
        updated_at = v_now
      WHERE namespace = p_namespace
        AND bucket_key = p_bucket_key;

      RETURN QUERY SELECT true, greatest(p_max_requests - 1, 0), v_reset_at, NULL::text;
      RETURN;
    END IF;

    IF v_count < p_max_requests THEN
      UPDATE public.edge_rate_limit_buckets
      SET
        request_count = request_count + 1,
        updated_at = v_now
      WHERE namespace = p_namespace
        AND bucket_key = p_bucket_key;

      RETURN QUERY SELECT true, greatest(p_max_requests - v_count - 1, 0), v_reset_at, NULL::text;
      RETURN;
    END IF;

    RETURN QUERY SELECT false, 0, v_reset_at, concat_ws(':', p_namespace, p_bucket_key);
    RETURN;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.edge_try_acquire_lock(
  p_namespace text,
  p_lock_key text,
  p_owner_id text,
  p_ttl_seconds integer DEFAULT 30
)
RETURNS TABLE (
  acquired boolean,
  owner_id text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_now timestamptz := now();
  v_expires_at timestamptz := now() + make_interval(secs => greatest(p_ttl_seconds, 1));
BEGIN
  INSERT INTO public.edge_generation_locks (
    namespace,
    lock_key,
    owner_id,
    status,
    acquired_at,
    expires_at,
    updated_at
  )
  VALUES (
    p_namespace,
    p_lock_key,
    p_owner_id,
    'running',
    v_now,
    v_expires_at,
    v_now
  )
  ON CONFLICT (namespace, lock_key) DO UPDATE
  SET
    owner_id = excluded.owner_id,
    status = 'running',
    acquired_at = excluded.acquired_at,
    expires_at = excluded.expires_at,
    updated_at = excluded.updated_at,
    last_error = NULL
  WHERE public.edge_generation_locks.expires_at <= v_now
     OR public.edge_generation_locks.status IN ('completed', 'failed')
  RETURNING true, public.edge_generation_locks.owner_id
  INTO acquired, owner_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, p_owner_id;
    RETURN;
  END IF;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.edge_release_lock(
  p_namespace text,
  p_lock_key text,
  p_owner_id text,
  p_status text DEFAULT 'completed'
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.edge_generation_locks
  SET
    status = CASE WHEN p_status IN ('completed', 'failed') THEN p_status ELSE 'completed' END,
    updated_at = now(),
    expires_at = now()
  WHERE namespace = p_namespace
    AND lock_key = p_lock_key
    AND owner_id = p_owner_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_edge_metrics(
  p_hours integer DEFAULT 24,
  p_namespace text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
AS $$
  WITH scoped AS (
    SELECT *
    FROM public.edge_request_metrics
    WHERE created_at >= now() - make_interval(hours => greatest(p_hours, 1))
      AND (p_namespace IS NULL OR namespace = p_namespace)
  )
  SELECT jsonb_build_object(
    'totalRequests', count(*),
    'cacheHitRate', coalesce(round(100.0 * count(*) FILTER (WHERE cache_status = 'hit') / nullif(count(*), 0), 2), 0),
    'coalesced', count(*) FILTER (WHERE cache_status = 'coalesced'),
    'rateLimited', count(*) FILTER (WHERE cache_status = 'rate_limited' OR status_code = 429),
    'errors', count(*) FILTER (WHERE status_code >= 500 OR cache_status = 'error'),
    'avgDurationMs', coalesce(round(avg(duration_ms)), 0),
    'p95DurationMs', coalesce(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms), 0)
  )
  FROM scoped;
$$;

REVOKE ALL ON FUNCTION public.edge_consume_rate_limit(text, text, integer, integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.edge_try_acquire_lock(text, text, text, integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.edge_release_lock(text, text, text, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_edge_metrics(integer, text) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.edge_consume_rate_limit(text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.edge_try_acquire_lock(text, text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.edge_release_lock(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_edge_metrics(integer, text) TO service_role;
