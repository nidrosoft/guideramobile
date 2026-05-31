-- Phase 7.1: Admin observability RPC
-- Aggregates edge request metrics, provider logs, job queues, and notification
-- dispatch health into a single jsonb payload for the admin panel. Answers:
-- "What is failing, what is expensive, and what is overloaded right now?"

create or replace function public.admin_edge_observability(p_minutes integer default 60)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with win as (select greatest(coalesce(p_minutes,60),1) as mins),
  bounds as (select (now() - ((select mins from win) || ' minutes')::interval) as since),
  edge as (
    select namespace,
      count(*) as total,
      count(*) filter (where cache_status = 'hit') as hits,
      count(*) filter (where cache_status in ('miss','generated')) as misses,
      count(*) filter (where cache_status = 'coalesced') as coalesced,
      count(*) filter (where cache_status = 'rate_limited') as rate_limited,
      count(*) filter (where cache_status = 'error' or status_code >= 500) as errors,
      round(percentile_cont(0.5) within group (order by duration_ms))::int as p50,
      round(percentile_cont(0.95) within group (order by duration_ms))::int as p95,
      round(percentile_cont(0.99) within group (order by duration_ms))::int as p99
    from edge_request_metrics, bounds
    where created_at > bounds.since
    group by namespace
  ),
  edge_rows as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'namespace', namespace, 'total', total, 'hits', hits, 'misses', misses,
      'coalesced', coalesced, 'rate_limited', rate_limited, 'errors', errors,
      'cache_hit_rate', round((hits::numeric / nullif(hits + misses, 0)), 4),
      'p50', p50, 'p95', p95, 'p99', p99
    ) order by total desc), '[]'::jsonb) as data,
    coalesce(sum(total),0) as total_requests,
    coalesce(sum(errors),0) as total_errors,
    coalesce(sum(rate_limited),0) as total_rate_limited from edge
  ),
  providers as (
    select provider_code,
      count(*) as calls,
      count(*) filter (where success is false) as failures,
      round(avg(response_time_ms))::int as avg_ms,
      round(coalesce(sum(cost),0)::numeric, 4) as cost
    from provider_logs, bounds
    where started_at > bounds.since and provider_code is not null
    group by provider_code
  ),
  provider_rows as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'provider', provider_code, 'calls', calls, 'failures', failures,
      'error_rate', round((failures::numeric / nullif(calls,0)), 4), 'avg_ms', avg_ms, 'cost', cost
    ) order by calls desc), '[]'::jsonb) as data from providers
  ),
  jobs as (
    select
      count(*) filter (where status in ('pending','queued','scheduled')) as pending,
      count(*) filter (where status = 'failed') as failed,
      round(extract(epoch from (now() - min(scheduled_for) filter (where status in ('pending','queued','scheduled'))))) as oldest_pending_seconds
    from scheduled_jobs
  ),
  notif_jobs as (
    select
      count(*) filter (where status in ('pending','queued','scheduled')) as pending,
      round(extract(epoch from (now() - min(scheduled_for) filter (where status in ('pending','queued','scheduled'))))) as oldest_pending_seconds
    from scheduled_notification_jobs
  ),
  dispatch as (
    select coalesce(sum(push_attempted),0) as push_attempted, coalesce(sum(push_failed),0) as push_failed,
      coalesce(sum(alerts_dispatched),0) as dispatched, coalesce(sum(deferred_count),0) as deferred
    from notification_dispatch_metrics, bounds where created_at > bounds.since
  ),
  dead as (select count(*) filter (where resolved_at is null) as unresolved from notification_dead_letters)
  select jsonb_build_object(
    'window_minutes', (select mins from win),
    'generated_at', now(),
    'edge', jsonb_build_object(
      'total_requests', (select total_requests from edge_rows),
      'total_errors', (select total_errors from edge_rows),
      'total_rate_limited', (select total_rate_limited from edge_rows),
      'by_namespace', (select data from edge_rows)
    ),
    'providers', (select data from provider_rows),
    'jobs', jsonb_build_object(
      'scheduled_pending', (select pending from jobs),
      'scheduled_failed', (select failed from jobs),
      'scheduled_oldest_pending_seconds', (select oldest_pending_seconds from jobs),
      'notification_pending', (select pending from notif_jobs),
      'notification_oldest_pending_seconds', (select oldest_pending_seconds from notif_jobs)
    ),
    'notifications', jsonb_build_object(
      'push_attempted', (select push_attempted from dispatch),
      'push_failed', (select push_failed from dispatch),
      'dispatched', (select dispatched from dispatch),
      'deferred', (select deferred from dispatch),
      'dead_letters_unresolved', (select unresolved from dead)
    )
  );
$$;

revoke all on function public.admin_edge_observability(integer) from public, anon, authenticated;
grant execute on function public.admin_edge_observability(integer) to service_role;
