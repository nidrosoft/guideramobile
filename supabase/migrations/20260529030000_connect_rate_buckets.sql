-- Phase 5.2 completion: durable Connect read/write rate buckets.

create table if not exists public.connect_rate_buckets (
  id uuid primary key default gen_random_uuid(),
  actor_key text not null,
  user_id uuid references public.profiles(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  window_seconds integer not null,
  limit_count integer not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint connect_rate_buckets_action_check check (
    action in (
      'connect_discover_read',
      'connect_group_write',
      'connect_buddy_write',
      'connect_event_write',
      'connect_post_write',
      'connect_activity_write'
    )
  )
);

alter table public.connect_rate_buckets enable row level security;

create unique index if not exists idx_connect_rate_buckets_unique_window
  on public.connect_rate_buckets (actor_key, action, window_start);

create index if not exists idx_connect_rate_buckets_user_window
  on public.connect_rate_buckets (user_id, action, window_start desc)
  where user_id is not null;

drop policy if exists connect_rate_buckets_service_all on public.connect_rate_buckets;
create policy connect_rate_buckets_service_all
  on public.connect_rate_buckets
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.consume_connect_rate_limit(
  p_user_id uuid default null,
  p_actor_key text default null,
  p_action text default 'connect_discover_read',
  p_limit_count integer default null,
  p_window_seconds integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_key text := coalesce(nullif(p_actor_key, ''), p_user_id::text, 'anonymous');
  v_window_seconds integer;
  v_limit_count integer;
  v_window_start timestamptz;
  v_request_count integer;
begin
  v_window_seconds := coalesce(
    p_window_seconds,
    case p_action
      when 'connect_discover_read' then 60
      when 'connect_group_write' then 60
      when 'connect_buddy_write' then 60
      when 'connect_event_write' then 60
      when 'connect_post_write' then 60
      when 'connect_activity_write' then 60
      else null
    end
  );

  v_limit_count := coalesce(
    p_limit_count,
    case p_action
      when 'connect_discover_read' then 180
      when 'connect_group_write' then 20
      when 'connect_buddy_write' then 20
      when 'connect_event_write' then 20
      when 'connect_post_write' then 45
      when 'connect_activity_write' then 30
      else null
    end
  );

  if v_window_seconds is null or v_limit_count is null then
    raise exception 'Unsupported Connect rate-limit action: %', p_action
      using errcode = '22023';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / v_window_seconds) * v_window_seconds
  );

  insert into public.connect_rate_buckets (
    actor_key,
    user_id,
    action,
    window_start,
    window_seconds,
    limit_count,
    request_count,
    updated_at
  )
  values (
    v_actor_key,
    p_user_id,
    p_action,
    v_window_start,
    v_window_seconds,
    v_limit_count,
    1,
    now()
  )
  on conflict (actor_key, action, window_start)
  do update set
    request_count = public.connect_rate_buckets.request_count + 1,
    limit_count = excluded.limit_count,
    window_seconds = excluded.window_seconds,
    updated_at = now()
  returning request_count into v_request_count;

  return jsonb_build_object(
    'allowed', v_request_count <= v_limit_count,
    'limit', v_limit_count,
    'remaining', greatest(v_limit_count - v_request_count, 0),
    'resetAt', (v_window_start + make_interval(secs => v_window_seconds))::text
  );
end;
$$;

revoke all on function public.consume_connect_rate_limit(uuid, text, text, integer, integer) from public;
grant execute on function public.consume_connect_rate_limit(uuid, text, text, integer, integer) to anon, authenticated;

create or replace function public.connect_discover_feed(
  p_user_id uuid default null,
  p_groups_limit integer default 6,
  p_groups_cursor text default null,
  p_events_limit integer default 5,
  p_events_cursor text default null,
  p_destinations_limit integer default 8,
  p_destinations_cursor text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_rate jsonb;
  v_group_official_cursor integer;
  v_group_seed_cursor integer;
  v_group_member_cursor integer;
  v_group_id_cursor text;
  v_event_date_cursor timestamptz;
  v_event_id_cursor text;
  v_destination_score_cursor integer;
  v_destination_id_cursor text;
  v_groups jsonb := '[]'::jsonb;
  v_events jsonb := '[]'::jsonb;
  v_destinations jsonb := '[]'::jsonb;
  v_next_group_cursor text;
  v_next_event_cursor text;
  v_next_destination_cursor text;
begin
  v_rate := public.consume_connect_rate_limit(
    p_user_id,
    coalesce(p_user_id::text, 'anonymous'),
    'connect_discover_read',
    null,
    null
  );

  if coalesce((v_rate->>'allowed')::boolean, false) = false then
    raise exception 'CONNECT_RATE_LIMITED'
      using errcode = 'P0001',
            detail = v_rate::text;
  end if;

  if p_groups_cursor is not null and position(':' in p_groups_cursor) > 0 then
    v_group_official_cursor := nullif(split_part(p_groups_cursor, ':', 1), '')::integer;
    v_group_seed_cursor := nullif(split_part(p_groups_cursor, ':', 2), '')::integer;
    v_group_member_cursor := nullif(split_part(p_groups_cursor, ':', 3), '')::integer;
    v_group_id_cursor := nullif(split_part(p_groups_cursor, ':', 4), '');
  end if;

  if p_events_cursor is not null and position('|' in p_events_cursor) > 0 then
    v_event_date_cursor := nullif(split_part(p_events_cursor, '|', 1), '')::timestamptz;
    v_event_id_cursor := nullif(split_part(p_events_cursor, '|', 2), '');
  end if;

  if p_destinations_cursor is not null and position(':' in p_destinations_cursor) > 0 then
    v_destination_score_cursor := nullif(split_part(p_destinations_cursor, ':', 1), '')::integer;
    v_destination_id_cursor := nullif(split_part(p_destinations_cursor, ':', 2), '');
  end if;

  with group_page as (
    select *
    from public.groups g
    where g.discoverable = true
      and g.status = 'active'
      and (
        v_group_seed_cursor is null
        or coalesce(g.is_official, false)::integer < v_group_official_cursor
        or (
          coalesce(g.is_official, false)::integer = v_group_official_cursor
          and coalesce(g.seed_rank, 0) < v_group_seed_cursor
        )
        or (
          coalesce(g.is_official, false)::integer = v_group_official_cursor
          and coalesce(g.seed_rank, 0) = v_group_seed_cursor
          and coalesce(g.member_count, 0) < v_group_member_cursor
        )
        or (
          coalesce(g.is_official, false)::integer = v_group_official_cursor
          and coalesce(g.seed_rank, 0) = v_group_seed_cursor
          and coalesce(g.member_count, 0) = v_group_member_cursor
          and g.id::text > v_group_id_cursor
        )
      )
    order by coalesce(g.is_official, false) desc, coalesce(g.seed_rank, 0) desc, coalesce(g.member_count, 0) desc, g.id asc
    limit greatest(1, least(coalesce(p_groups_limit, 6), 25))
  ),
  group_rows as (
    select
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'coverImage', cover_photo_url,
          'groupPhotoUrl', group_photo_url,
          'description', description,
          'memberCount', coalesce(member_count, 0),
          'isOfficial', coalesce(is_official, false),
          'isVerified', coalesce(is_verified, false),
          'privacy', privacy,
          'category', category,
          'tags', coalesce(to_jsonb(tags), '[]'::jsonb),
          'destinationName', destination_name,
          'destinationCountry', destination_country
        )
        order by coalesce(is_official, false) desc, coalesce(seed_rank, 0) desc, coalesce(member_count, 0) desc, id asc
      ) as items,
      (array_agg(coalesce(is_official, false)::integer::text || ':' || coalesce(seed_rank, 0)::text || ':' || coalesce(member_count, 0)::text || ':' || id::text order by coalesce(is_official, false) desc, coalesce(seed_rank, 0) desc, coalesce(member_count, 0) desc, id asc))[count(*)] as next_cursor
    from group_page
  )
  select coalesce(items, '[]'::jsonb), next_cursor
  into v_groups, v_next_group_cursor
  from group_rows;

  with event_page as (
    select *
    from public.community_events e
    where e.status = 'upcoming'
      and e.visibility = 'public'
      and e.start_date > now()
      and (
        v_event_date_cursor is null
        or e.start_date > v_event_date_cursor
        or (e.start_date = v_event_date_cursor and e.id::text > v_event_id_cursor)
      )
    order by e.start_date asc, e.id asc
    limit greatest(1, least(coalesce(p_events_limit, 5), 25))
  ),
  event_rows as (
    select
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'groupId', group_id,
          'title', title,
          'coverImageUrl', cover_image_url,
          'type', type,
          'status', status,
          'locationName', location_name,
          'locationType', location_type,
          'startDate', start_date,
          'attendeeCount', coalesce(attendee_count, 0)
        )
        order by start_date asc, id asc
      ) as items,
      (array_agg(start_date::text || '|' || id::text order by start_date asc, id asc))[count(*)] as next_cursor
    from event_page
  )
  select coalesce(items, '[]'::jsonb), next_cursor
  into v_events, v_next_event_cursor
  from event_rows;

  with destination_page as (
    select *
    from public.curated_destinations d
    where d.status = 'active'
      and (
        v_destination_score_cursor is null
        or coalesce(d.popularity_score, 0) < v_destination_score_cursor
        or (coalesce(d.popularity_score, 0) = v_destination_score_cursor and d.id::text > v_destination_id_cursor)
      )
    order by coalesce(d.popularity_score, 0) desc, d.id asc
    limit greatest(1, least(coalesce(p_destinations_limit, 8), 25))
  ),
  destination_rows as (
    select
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', title,
          'country', country,
          'image', coalesce(hero_image_url, thumbnail_url, gallery_urls[1], ''),
          'travelerCount', coalesce(popularity_score, 0)
        )
        order by coalesce(popularity_score, 0) desc, id asc
      ) as items,
      (array_agg(coalesce(popularity_score, 0)::text || ':' || id::text order by coalesce(popularity_score, 0) desc, id asc))[count(*)] as next_cursor
    from destination_page
  )
  select coalesce(items, '[]'::jsonb), next_cursor
  into v_destinations, v_next_destination_cursor
  from destination_rows;

  return jsonb_build_object(
    'groups', v_groups,
    'events', v_events,
    'destinations', v_destinations,
    'cursors', jsonb_build_object(
      'groups', v_next_group_cursor,
      'events', v_next_event_cursor,
      'destinations', v_next_destination_cursor
    )
  );
end;
$$;

revoke all on function public.connect_discover_feed(uuid, integer, text, integer, text, integer, text) from public;
grant execute on function public.connect_discover_feed(uuid, integer, text, integer, text, integer, text) to anon, authenticated;
