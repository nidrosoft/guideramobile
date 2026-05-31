-- Phase 5.5: saved-content idempotency and lower-write launch paths.

create unique index if not exists idx_user_saved_items_user_destination
  on public.user_saved_items (user_id, destination_id)
  where destination_id is not null;

create unique index if not exists idx_user_saved_items_user_experience
  on public.user_saved_items (user_id, experience_id)
  where experience_id is not null;

create unique index if not exists idx_saved_items_user_type_external
  on public.saved_items (user_id, type, external_id)
  where external_id is not null;

create index if not exists idx_user_interactions_user_created_at
  on public.user_interactions (user_id, created_at desc);

create or replace view public.saved_content_unified
with (security_invoker = true)
as
select
  si.id,
  si.user_id,
  'saved_items'::text as source_table,
  si.type::text as content_type,
  si.external_id,
  null::uuid as content_id,
  si.title,
  si.subtitle,
  si.image_url,
  si.data,
  si.saved_at,
  false as is_archived
from public.saved_items si
union all
select
  usi.id,
  usi.user_id,
  'user_saved_items'::text as source_table,
  coalesce(
    usi.item_type,
    case
      when usi.destination_id is not null then 'destination'
      when usi.experience_id is not null then 'experience'
      else 'unknown'
    end
  ) as content_type,
  coalesce(usi.external_id, usi.destination_id::text, usi.experience_id::text) as external_id,
  coalesce(usi.destination_id, usi.experience_id) as content_id,
  null::text as title,
  usi.notes as subtitle,
  null::text as image_url,
  jsonb_build_object(
    'destination_id', usi.destination_id,
    'experience_id', usi.experience_id,
    'notes', usi.notes
  ) as data,
  usi.saved_at,
  coalesce(usi.is_archived, false) as is_archived
from public.user_saved_items usi
union all
select
  sd.id,
  sd.user_id,
  'saved_deals'::text as source_table,
  sd.deal_type as content_type,
  coalesce(sd.route_key, sd.deal_cache_id::text) as external_id,
  sd.deal_cache_id as content_id,
  coalesce(sd.deal_snapshot->>'title', sd.deal_snapshot->>'name', sd.provider) as title,
  sd.provider as subtitle,
  sd.deal_snapshot->>'image_url' as image_url,
  sd.deal_snapshot as data,
  sd.created_at as saved_at,
  coalesce(sd.is_expired, false) as is_archived
from public.saved_deals sd;

grant select on public.saved_content_unified to authenticated;

create or replace function public.toggle_saved_content(
  p_user_id uuid,
  p_item_type text,
  p_item_id uuid,
  p_should_save boolean default null,
  p_source text default 'detail_page'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_requesting_user_id uuid := public.requesting_user_id();
  v_item_type text := lower(btrim(coalesce(p_item_type, '')));
  v_existing_id uuid;
  v_saved_id uuid;
  v_should_save boolean;
  v_is_saved boolean;
begin
  if v_requesting_user_id is null or v_requesting_user_id <> p_user_id then
    raise exception 'Not authorized to update saved content for this user'
      using errcode = '42501';
  end if;

  if v_item_type not in ('destination', 'experience') then
    raise exception 'Unsupported saved item type: %', p_item_type
      using errcode = '22023';
  end if;

  if p_item_id is null then
    raise exception 'Saved item id is required'
      using errcode = '22023';
  end if;

  if v_item_type = 'destination' then
    select id
    into v_existing_id
    from public.user_saved_items
    where user_id = p_user_id
      and destination_id = p_item_id
      and coalesce(is_archived, false) = false
    limit 1;
  else
    select id
    into v_existing_id
    from public.user_saved_items
    where user_id = p_user_id
      and experience_id = p_item_id
      and coalesce(is_archived, false) = false
    limit 1;
  end if;

  v_should_save := coalesce(p_should_save, v_existing_id is null);

  if v_should_save then
    if v_item_type = 'destination' then
      insert into public.user_saved_items (
        user_id,
        destination_id,
        experience_id,
        item_type,
        is_archived,
        saved_at
      )
      values (p_user_id, p_item_id, null, 'destination', false, now())
      on conflict (user_id, destination_id)
        where destination_id is not null
      do update set
        is_archived = false,
        saved_at = now(),
        item_type = 'destination'
      returning id into v_saved_id;
    else
      insert into public.user_saved_items (
        user_id,
        destination_id,
        experience_id,
        item_type,
        is_archived,
        saved_at
      )
      values (p_user_id, null, p_item_id, 'experience', false, now())
      on conflict (user_id, experience_id)
        where experience_id is not null
      do update set
        is_archived = false,
        saved_at = now(),
        item_type = 'experience'
      returning id into v_saved_id;
    end if;

    v_is_saved := true;
  else
    if v_item_type = 'destination' then
      update public.user_saved_items
      set is_archived = true
      where user_id = p_user_id
        and destination_id = p_item_id
      returning id into v_saved_id;
    else
      update public.user_saved_items
      set is_archived = true
      where user_id = p_user_id
        and experience_id = p_item_id
      returning id into v_saved_id;
    end if;

    v_is_saved := false;
  end if;

  insert into public.user_interactions (
    user_id,
    destination_id,
    experience_id,
    interaction_type,
    source,
    metadata
  )
  values (
    p_user_id,
    case when v_item_type = 'destination' then p_item_id else null end,
    case when v_item_type = 'experience' then p_item_id else null end,
    case when v_is_saved then 'save' else 'unsave' end,
    nullif(btrim(coalesce(p_source, '')), ''),
    jsonb_build_object('saved_item_id', v_saved_id, 'batched_by_rpc', true)
  );

  return jsonb_build_object(
    'is_saved', v_is_saved,
    'saved_item_id', v_saved_id
  );
end;
$$;

revoke all on function public.toggle_saved_content(uuid, text, uuid, boolean, text) from public;
grant execute on function public.toggle_saved_content(uuid, text, uuid, boolean, text) to authenticated;
