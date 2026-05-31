-- Phase 7b (admin control): Notification dead-letter management RPCs.
-- The dispatcher (send-notification dispatch_pending) selects alerts with
-- status='pending'. A "retry" re-queues the originating alert (status=pending,
-- due now) and marks the dead letter resolved; "resolve" just closes it.
-- security definer + granted to service_role only.

create or replace function public.admin_list_dead_letters(p_include_resolved boolean default false, p_limit integer default 100)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', dl.id,
    'alert_id', dl.alert_id,
    'user_id', dl.user_id,
    'user_name', nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
    'push_token', dl.push_token,
    'reason', dl.reason,
    'attempt_count', dl.attempt_count,
    'retry_after', dl.retry_after,
    'resolved_at', dl.resolved_at,
    'created_at', dl.created_at,
    'alert_title', a.title,
    'alert_body', a.body,
    'alert_status', a.status
  ) order by dl.created_at desc), '[]'::jsonb)
  from (
    select * from notification_dead_letters
    where (p_include_resolved or resolved_at is null)
    order by created_at desc
    limit greatest(coalesce(p_limit,100),1)
  ) dl
  left join alerts a on a.id = dl.alert_id
  left join profiles p on p.id = dl.user_id;
$$;

create or replace function public.admin_dead_letter_stats()
returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object(
    'unresolved', count(*) filter (where resolved_at is null),
    'resolved', count(*) filter (where resolved_at is not null),
    'total', count(*)
  ) from notification_dead_letters;
$$;

create or replace function public.admin_retry_dead_letter(p_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_alert uuid; v_requeued boolean := false;
begin
  select alert_id into v_alert from notification_dead_letters where id = p_id;
  if v_alert is not null then
    update alerts set status = 'pending', delivered_at = null, scheduled_for = now() where id = v_alert;
    v_requeued := true;
  end if;
  update notification_dead_letters set resolved_at = now() where id = p_id;
  return jsonb_build_object('success', true, 'requeued', v_requeued, 'alert_id', v_alert);
end $$;

create or replace function public.admin_resolve_dead_letter(p_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  update notification_dead_letters set resolved_at = now() where id = p_id;
  return jsonb_build_object('success', true);
end $$;

create or replace function public.admin_retry_all_dead_letters(p_limit integer default 200)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_requeued integer := 0; v_resolved integer := 0;
begin
  with picked as (
    select id, alert_id from notification_dead_letters
    where resolved_at is null
    order by created_at desc
    limit greatest(coalesce(p_limit,200),1)
  ),
  requeue as (
    update alerts set status='pending', delivered_at=null, scheduled_for=now()
    where id in (select alert_id from picked where alert_id is not null)
    returning 1
  ),
  resolve as (
    update notification_dead_letters set resolved_at = now()
    where id in (select id from picked)
    returning 1
  )
  select (select count(*) from requeue), (select count(*) from resolve) into v_requeued, v_resolved;
  return jsonb_build_object('success', true, 'requeued', v_requeued, 'resolved', v_resolved);
end $$;

revoke all on function public.admin_list_dead_letters(boolean,integer) from public, anon, authenticated;
revoke all on function public.admin_dead_letter_stats() from public, anon, authenticated;
revoke all on function public.admin_retry_dead_letter(uuid) from public, anon, authenticated;
revoke all on function public.admin_resolve_dead_letter(uuid) from public, anon, authenticated;
revoke all on function public.admin_retry_all_dead_letters(integer) from public, anon, authenticated;
grant execute on function public.admin_list_dead_letters(boolean,integer) to service_role;
grant execute on function public.admin_dead_letter_stats() to service_role;
grant execute on function public.admin_retry_dead_letter(uuid) to service_role;
grant execute on function public.admin_resolve_dead_letter(uuid) to service_role;
grant execute on function public.admin_retry_all_dead_letters(integer) to service_role;
