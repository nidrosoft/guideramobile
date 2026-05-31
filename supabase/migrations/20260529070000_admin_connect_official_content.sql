-- Phase 7b (admin control): Connect official-content management RPCs.
-- Lets the admin panel create/edit official groups, events, and pinned posts
-- without hand-written SQL. All content is flagged is_official/origin='official',
-- authored by a labeled system profile, and tracked in a seed batch so it stays
-- distinct from real user content and is excluded from "real traveler" surfaces.
-- security definer + granted to service_role only (admin panel uses service role).

create or replace function public.admin_ensure_seed_batch(p_name text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if p_name is null or length(trim(p_name))=0 then return null; end if;
  select id into v_id from seed_batches where name = p_name limit 1;
  if v_id is null then
    insert into seed_batches(name, environment, description, applied_by)
    values (p_name, 'production', 'Admin-created official Connect content', 'admin_panel')
    returning id into v_id;
  end if;
  return v_id;
end $$;

create or replace function public.admin_list_connect_authors()
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'label', coalesce(nullif(trim(synthetic_label), ''), trim(coalesce(first_name,'') || ' ' || coalesce(last_name,''))),
    'first_name', first_name, 'last_name', last_name
  ) order by first_name), '[]'::jsonb)
  from profiles where is_synthetic is true;
$$;

create or replace function public.admin_create_official_group(
  p_name text, p_description text default null, p_category text default null,
  p_destination_name text default null, p_destination_country text default null,
  p_destination_code text default null, p_privacy text default 'public',
  p_author_id uuid default '00000000-0000-4000-8000-00000000a001',
  p_cover_photo_url text default null, p_seed_rank integer default 100,
  p_batch_name text default 'Admin Official Content'
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_batch uuid; v_slug text; v_id uuid; v_country text;
begin
  if p_name is null or length(trim(p_name))=0 then raise exception 'name is required'; end if;
  v_country := nullif(left(upper(trim(coalesce(p_destination_country, ''))), 2), '');
  v_batch := admin_ensure_seed_batch(p_batch_name);
  v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);
  v_slug := trim(both '-' from v_slug);
  insert into groups(name, slug, description, category, destination_name, destination_country, destination_code,
     privacy, cover_photo_url, is_official, is_verified, verified_at, origin, status, created_by, seed_rank, seed_batch_id, discoverable)
  values (trim(p_name), v_slug, p_description, p_category, p_destination_name, v_country, p_destination_code,
     coalesce(p_privacy,'public'), p_cover_photo_url, true, true, now(), 'official', 'active', p_author_id, coalesce(p_seed_rank,100), v_batch, true)
  returning id into v_id;
  if v_batch is not null then
    insert into seeded_entities(batch_id, entity_type, entity_id) values (v_batch, 'group', v_id);
  end if;
  return (select to_jsonb(g.*) from groups g where id = v_id);
end $$;

create or replace function public.admin_update_official_group(
  p_group_id uuid, p_name text default null, p_description text default null, p_category text default null,
  p_cover_photo_url text default null, p_privacy text default null, p_is_verified boolean default null,
  p_seed_rank integer default null, p_status text default null
) returns jsonb language plpgsql security definer set search_path=public as $$
begin
  update groups set
    name = coalesce(p_name, name),
    description = coalesce(p_description, description),
    category = coalesce(p_category, category),
    cover_photo_url = coalesce(p_cover_photo_url, cover_photo_url),
    privacy = coalesce(p_privacy, privacy),
    is_verified = coalesce(p_is_verified, is_verified),
    seed_rank = coalesce(p_seed_rank, seed_rank),
    status = coalesce(p_status, status),
    updated_at = now()
  where id = p_group_id;
  return (select to_jsonb(g.*) from groups g where id = p_group_id);
end $$;

create or replace function public.admin_create_official_event(
  p_title text, p_group_id uuid default null, p_description text default null,
  p_type text default 'meetup', p_category text default null,
  p_start_date timestamptz default (now() + interval '7 days'), p_end_date timestamptz default null,
  p_location_type text default 'physical', p_location_name text default null, p_location_address text default null,
  p_cover_image_url text default null, p_author_id uuid default '00000000-0000-4000-8000-00000000a001',
  p_seed_rank integer default 100, p_batch_name text default 'Admin Official Content'
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_batch uuid; v_id uuid;
begin
  if p_title is null or length(trim(p_title))=0 then raise exception 'title is required'; end if;
  v_batch := admin_ensure_seed_batch(p_batch_name);
  insert into community_events(type, title, group_id, description, category, start_date, end_date, location_type,
     location_name, location_address, cover_image_url, created_by, origin, status, seed_rank, seed_batch_id)
  values (coalesce(p_type,'meetup'), trim(p_title), p_group_id, p_description, p_category,
     coalesce(p_start_date, now() + interval '7 days'), p_end_date, coalesce(p_location_type,'physical'),
     p_location_name, p_location_address, p_cover_image_url, p_author_id, 'official', 'upcoming', coalesce(p_seed_rank,100), v_batch)
  returning id into v_id;
  if v_batch is not null then
    insert into seeded_entities(batch_id, entity_type, entity_id) values (v_batch, 'event', v_id);
  end if;
  return (select to_jsonb(e.*) from community_events e where id = v_id);
end $$;

create or replace function public.admin_update_official_event(
  p_event_id uuid, p_title text default null, p_description text default null, p_category text default null,
  p_start_date timestamptz default null, p_end_date timestamptz default null, p_location_name text default null,
  p_location_address text default null, p_cover_image_url text default null, p_status text default null, p_seed_rank integer default null
) returns jsonb language plpgsql security definer set search_path=public as $$
begin
  update community_events set
    title = coalesce(p_title, title),
    description = coalesce(p_description, description),
    category = coalesce(p_category, category),
    start_date = coalesce(p_start_date, start_date),
    end_date = coalesce(p_end_date, end_date),
    location_name = coalesce(p_location_name, location_name),
    location_address = coalesce(p_location_address, location_address),
    cover_image_url = coalesce(p_cover_image_url, cover_image_url),
    status = coalesce(p_status, status),
    seed_rank = coalesce(p_seed_rank, seed_rank),
    updated_at = now()
  where id = p_event_id;
  return (select to_jsonb(e.*) from community_events e where id = p_event_id);
end $$;

create or replace function public.admin_create_official_post(
  p_group_id uuid, p_content text, p_author_id uuid default '00000000-0000-4000-8000-00000000a001',
  p_post_type text default 'general', p_is_pinned boolean default false,
  p_seed_rank integer default 100, p_batch_name text default 'Admin Official Content'
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_batch uuid; v_id uuid;
begin
  if p_group_id is null then raise exception 'group_id is required'; end if;
  if p_content is null or length(trim(p_content))=0 then raise exception 'content is required'; end if;
  v_batch := admin_ensure_seed_batch(p_batch_name);
  insert into community_posts(community_id, author_id, content, post_type, is_pinned, origin, status, seed_rank, seed_batch_id)
  values (p_group_id, p_author_id, p_content, coalesce(p_post_type,'general'), coalesce(p_is_pinned,false), 'official', 'published', coalesce(p_seed_rank,100), v_batch)
  returning id into v_id;
  if v_batch is not null then
    insert into seeded_entities(batch_id, entity_type, entity_id) values (v_batch, 'post', v_id);
  end if;
  return (select to_jsonb(p.*) from community_posts p where id = v_id);
end $$;

create or replace function public.admin_set_post_pinned(p_post_id uuid, p_pinned boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  update community_posts set is_pinned = coalesce(p_pinned, false), updated_at = now() where id = p_post_id;
  return (select to_jsonb(p.*) from community_posts p where id = p_post_id);
end $$;

revoke all on function public.admin_ensure_seed_batch(text) from public, anon, authenticated;
revoke all on function public.admin_list_connect_authors() from public, anon, authenticated;
revoke all on function public.admin_create_official_group(text,text,text,text,text,text,text,uuid,text,integer,text) from public, anon, authenticated;
revoke all on function public.admin_update_official_group(uuid,text,text,text,text,text,boolean,integer,text) from public, anon, authenticated;
revoke all on function public.admin_create_official_event(text,uuid,text,text,text,timestamptz,timestamptz,text,text,text,text,uuid,integer,text) from public, anon, authenticated;
revoke all on function public.admin_update_official_event(uuid,text,text,text,timestamptz,timestamptz,text,text,text,text,integer) from public, anon, authenticated;
revoke all on function public.admin_create_official_post(uuid,text,uuid,text,boolean,integer,text) from public, anon, authenticated;
revoke all on function public.admin_set_post_pinned(uuid,boolean) from public, anon, authenticated;

grant execute on function public.admin_ensure_seed_batch(text) to service_role;
grant execute on function public.admin_list_connect_authors() to service_role;
grant execute on function public.admin_create_official_group(text,text,text,text,text,text,text,uuid,text,integer,text) to service_role;
grant execute on function public.admin_update_official_group(uuid,text,text,text,text,text,boolean,integer,text) to service_role;
grant execute on function public.admin_create_official_event(text,uuid,text,text,text,timestamptz,timestamptz,text,text,text,text,uuid,integer,text) to service_role;
grant execute on function public.admin_update_official_event(uuid,text,text,text,timestamptz,timestamptz,text,text,text,text,integer) to service_role;
grant execute on function public.admin_create_official_post(uuid,text,uuid,text,boolean,integer,text) to service_role;
grant execute on function public.admin_set_post_pinned(uuid,boolean) to service_role;
