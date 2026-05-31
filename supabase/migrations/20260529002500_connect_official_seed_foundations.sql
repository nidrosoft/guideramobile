-- Phase 5.2B: official Connect launch content foundations.
-- This metadata lets launch content be clearly labeled and managed without
-- pretending synthetic/system accounts are real travelers.

alter table public.profiles
  add column if not exists profile_kind text not null default 'human',
  add column if not exists is_synthetic boolean not null default false,
  add column if not exists synthetic_label text,
  add column if not exists synthetic_metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_profile_kind_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_profile_kind_check
      check (profile_kind in ('human', 'system', 'staff'));
  end if;
end $$;

alter table public.groups
  add column if not exists origin text not null default 'user',
  add column if not exists is_official boolean not null default false,
  add column if not exists seed_rank integer not null default 0,
  add column if not exists seed_batch_id uuid;

alter table public.community_posts
  add column if not exists origin text not null default 'user',
  add column if not exists seed_rank integer not null default 0,
  add column if not exists seed_batch_id uuid,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.community_events
  add column if not exists origin text not null default 'user',
  add column if not exists seed_rank integer not null default 0,
  add column if not exists seed_batch_id uuid,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'groups_origin_check'
      and conrelid = 'public.groups'::regclass
  ) then
    alter table public.groups
      add constraint groups_origin_check
      check (origin in ('user', 'official', 'seed', 'staff'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_posts_origin_check'
      and conrelid = 'public.community_posts'::regclass
  ) then
    alter table public.community_posts
      add constraint community_posts_origin_check
      check (origin in ('user', 'official', 'seed', 'staff', 'ai'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_events_origin_check'
      and conrelid = 'public.community_events'::regclass
  ) then
    alter table public.community_events
      add constraint community_events_origin_check
      check (origin in ('user', 'official', 'seed', 'staff'));
  end if;
end $$;

create table if not exists public.seed_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  environment text not null default 'production',
  description text,
  applied_at timestamptz not null default now(),
  applied_by text not null default 'system'
);

create table if not exists public.seeded_entities (
  batch_id uuid not null references public.seed_batches(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (batch_id, entity_type, entity_id)
);

alter table public.seed_batches enable row level security;
alter table public.seeded_entities enable row level security;

create index if not exists idx_groups_official_discover
  on public.groups (is_official, seed_rank desc, member_count desc)
  where discoverable = true and status = 'active';

create index if not exists idx_community_posts_seeded
  on public.community_posts (origin, seed_rank desc, created_at desc)
  where status = 'published';

create index if not exists idx_community_events_seeded
  on public.community_events (origin, seed_rank desc, start_date asc)
  where status = 'upcoming';
