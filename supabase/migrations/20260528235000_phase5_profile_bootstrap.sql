-- Phase 5.1: Profile bootstrap and account summary RPCs.

create unique index if not exists profiles_clerk_id_key
  on public.profiles (clerk_id);

create table if not exists public.profile_sync_metrics (
  id bigserial primary key,
  profile_id uuid references public.profiles(id) on delete set null,
  outcome text not null,
  duration_ms integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.profile_sync_metrics enable row level security;

drop policy if exists profile_sync_metrics_insert_own on public.profile_sync_metrics;
create policy profile_sync_metrics_insert_own
  on public.profile_sync_metrics
  for insert
  to authenticated
  with check (profile_id = public.requesting_user_id());

grant insert on public.profile_sync_metrics to authenticated;
grant usage, select on sequence public.profile_sync_metrics_id_seq to authenticated;

create or replace function public.bootstrap_profile(
  p_profile_id uuid,
  p_clerk_id text,
  p_first_name text default '',
  p_last_name text default '',
  p_email text default '',
  p_phone text default null,
  p_avatar_url text default null
)
returns public.profiles
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_started_at timestamptz := clock_timestamp();
  v_jwt_clerk_id text := auth.jwt() ->> 'sub';
  v_jwt_email text := nullif(auth.jwt() ->> 'email', '');
  v_jwt_phone text := nullif(coalesce(auth.jwt() ->> 'phone_number', auth.jwt() ->> 'phone'), '');
  v_profile public.profiles%rowtype;
  v_outcome text := 'created';
begin
  if p_clerk_id is null or p_clerk_id = '' or p_clerk_id is distinct from v_jwt_clerk_id then
    raise exception 'Unauthorized profile bootstrap' using errcode = '42501';
  end if;

  select *
    into v_profile
  from public.profiles
  where clerk_id = p_clerk_id
  limit 1
  for update;

  if v_profile.id is not null then
    update public.profiles
    set
      first_name = case when coalesce(public.profiles.first_name, '') = '' and coalesce(p_first_name, '') <> '' then p_first_name else public.profiles.first_name end,
      last_name = case when coalesce(public.profiles.last_name, '') = '' and coalesce(p_last_name, '') <> '' then p_last_name else public.profiles.last_name end,
      email = case when coalesce(public.profiles.email, '') = '' and coalesce(p_email, '') <> '' then p_email else public.profiles.email end,
      phone = case when public.profiles.phone is null and p_phone is not null then p_phone else public.profiles.phone end,
      phone_verified = coalesce(public.profiles.phone_verified, false) or p_phone is not null,
      avatar_url = case when public.profiles.avatar_url is null and p_avatar_url is not null then p_avatar_url else public.profiles.avatar_url end,
      updated_at = now(),
      last_seen_at = now()
    where id = v_profile.id
    returning * into v_profile;
    v_outcome := 'updated';
  elsif v_jwt_email is not null then
    select *
      into v_profile
    from public.profiles
    where clerk_id is null
      and email = v_jwt_email
    limit 1
    for update;

    if v_profile.id is not null then
      update public.profiles
      set
        clerk_id = p_clerk_id,
        first_name = coalesce(nullif(p_first_name, ''), public.profiles.first_name),
        last_name = coalesce(nullif(p_last_name, ''), public.profiles.last_name),
        phone = coalesce(p_phone, public.profiles.phone),
        phone_verified = coalesce(public.profiles.phone_verified, false) or p_phone is not null,
        avatar_url = coalesce(p_avatar_url, public.profiles.avatar_url),
        updated_at = now(),
        last_seen_at = now()
      where id = v_profile.id
      returning * into v_profile;
      v_outcome := 'linked_email';
    end if;
  end if;

  if v_profile.id is null and v_jwt_phone is not null then
    select *
      into v_profile
    from public.profiles
    where clerk_id is null
      and phone = v_jwt_phone
    limit 1
    for update;

    if v_profile.id is not null then
      update public.profiles
      set
        clerk_id = p_clerk_id,
        first_name = coalesce(nullif(p_first_name, ''), public.profiles.first_name),
        last_name = coalesce(nullif(p_last_name, ''), public.profiles.last_name),
        email = case when coalesce(public.profiles.email, '') = '' and coalesce(p_email, '') <> '' then p_email else public.profiles.email end,
        avatar_url = coalesce(p_avatar_url, public.profiles.avatar_url),
        updated_at = now(),
        last_seen_at = now()
      where id = v_profile.id
      returning * into v_profile;
      v_outcome := 'linked_phone';
    end if;
  end if;

  if v_profile.id is null then
    insert into public.profiles (
      id,
      clerk_id,
      first_name,
      last_name,
      email,
      phone,
      avatar_url,
      email_verified,
      phone_verified,
      onboarding_completed,
      onboarding_step
    )
    values (
      p_profile_id,
      p_clerk_id,
      coalesce(p_first_name, ''),
      coalesce(p_last_name, ''),
      coalesce(p_email, ''),
      p_phone,
      p_avatar_url,
      coalesce(p_email, '') <> '',
      p_phone is not null,
      false,
      0
    )
    on conflict (clerk_id) do update
    set
      updated_at = now(),
      last_seen_at = now()
    returning * into v_profile;
    v_outcome := 'created';
  end if;

  begin
    insert into public.profile_sync_metrics (
      profile_id,
      outcome,
      duration_ms
    )
    values (
      v_profile.id,
      v_outcome,
      greatest(0, floor(extract(epoch from (clock_timestamp() - v_started_at)) * 1000)::int)
    );
  exception when others then
    null;
  end;

  return v_profile;
end;
$$;

create or replace function public.get_account_summary(p_user_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_requesting_user_id uuid := public.requesting_user_id();
  v_profile jsonb;
  v_saved_count integer := 0;
  v_partner jsonb;
begin
  if v_requesting_user_id is null or v_requesting_user_id <> p_user_id then
    raise exception 'Unauthorized account summary' using errcode = '42501';
  end if;

  select to_jsonb(p)
    into v_profile
  from public.profiles p
  where p.id = p_user_id;

  if v_profile is null then
    return null;
  end if;

  select count(*)::integer
    into v_saved_count
  from public.saved_items
  where user_id = p_user_id;

  select jsonb_build_object(
      'status', pa.status,
      'didit_verification_status', pa.didit_verification_status,
      'submitted_at', pa.submitted_at,
      'updated_at', pa.updated_at
    )
    into v_partner
  from public.partner_applications pa
  where pa.user_id = p_user_id
  order by pa.created_at desc
  limit 1;

  return jsonb_build_object(
    'profile', v_profile,
    'savedItems', jsonb_build_object('total', v_saved_count),
    'partner', v_partner
  );
end;
$$;

grant execute on function public.bootstrap_profile(uuid, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.get_account_summary(uuid) to anon, authenticated;
