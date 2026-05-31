-- Phase 7b (admin control): Launch guardrails RPCs.
-- Inspect and reset durable rate buckets and purge the edge response cache by
-- namespace so operators can recover on launch day (flush bad cache, relax a
-- limiter). security definer + granted to service_role only.

create or replace function public.admin_guardrails_overview()
returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object(
    'edge_cache', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'namespace', namespace, 'total', total, 'live', live, 'expired', expired
      ) order by total desc), '[]'::jsonb)
      from (
        select namespace,
          count(*) as total,
          count(*) filter (where expires_at > now()) as live,
          count(*) filter (where expires_at <= now()) as expired
        from edge_response_cache group by namespace
      ) c
    ),
    'edge_rate_buckets', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'namespace', namespace, 'active_buckets', active_buckets, 'total_requests', total_requests
      ) order by active_buckets desc), '[]'::jsonb)
      from (
        select namespace,
          count(*) as active_buckets,
          coalesce(sum(request_count),0) as total_requests
        from edge_rate_limit_buckets where reset_at > now() group by namespace
      ) r
    ),
    'connect_rate_buckets', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'action', action, 'active_buckets', active_buckets, 'total_requests', total_requests
      ) order by active_buckets desc), '[]'::jsonb)
      from (
        select action,
          count(*) as active_buckets,
          coalesce(sum(request_count),0) as total_requests
        from connect_rate_buckets where (window_start + (window_seconds || ' seconds')::interval) > now() group by action
      ) cr
    )
  );
$$;

create or replace function public.admin_purge_edge_cache(p_namespace text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
  if p_namespace is null or length(trim(p_namespace))=0 then raise exception 'namespace is required (use * to purge all)'; end if;
  if p_namespace = '*' then
    delete from edge_response_cache; get diagnostics v_count = row_count;
  else
    delete from edge_response_cache where namespace = lower(trim(p_namespace)); get diagnostics v_count = row_count;
  end if;
  return jsonb_build_object('success', true, 'purged', v_count, 'namespace', p_namespace);
end $$;

create or replace function public.admin_reset_edge_rate_buckets(p_namespace text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
  if p_namespace is null or length(trim(p_namespace))=0 then raise exception 'namespace is required (use * to reset all)'; end if;
  if p_namespace = '*' then
    delete from edge_rate_limit_buckets; get diagnostics v_count = row_count;
  else
    delete from edge_rate_limit_buckets where namespace = lower(trim(p_namespace)); get diagnostics v_count = row_count;
  end if;
  return jsonb_build_object('success', true, 'reset', v_count, 'namespace', p_namespace);
end $$;

create or replace function public.admin_reset_connect_rate_buckets(p_action text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
  if p_action is null or length(trim(p_action))=0 or p_action = '*' then
    delete from connect_rate_buckets; get diagnostics v_count = row_count;
  else
    delete from connect_rate_buckets where action = lower(trim(p_action)); get diagnostics v_count = row_count;
  end if;
  return jsonb_build_object('success', true, 'reset', v_count, 'action', p_action);
end $$;

revoke all on function public.admin_guardrails_overview() from public, anon, authenticated;
revoke all on function public.admin_purge_edge_cache(text) from public, anon, authenticated;
revoke all on function public.admin_reset_edge_rate_buckets(text) from public, anon, authenticated;
revoke all on function public.admin_reset_connect_rate_buckets(text) from public, anon, authenticated;
grant execute on function public.admin_guardrails_overview() to service_role;
grant execute on function public.admin_purge_edge_cache(text) to service_role;
grant execute on function public.admin_reset_edge_rate_buckets(text) to service_role;
grant execute on function public.admin_reset_connect_rate_buckets(text) to service_role;
