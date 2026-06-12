-- Guidance System: per-user guidance state sync + new capturable profile fields.
-- Applied to production on 2026-06-11 via MCP; kept here for migration parity.

create table if not exists public.user_guidance_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.user_guidance_state enable row level security;

drop policy if exists "guidance_select_own" on public.user_guidance_state;
create policy "guidance_select_own" on public.user_guidance_state
  for select using (requesting_user_id() = user_id);

drop policy if exists "guidance_insert_own" on public.user_guidance_state;
create policy "guidance_insert_own" on public.user_guidance_state
  for insert with check (requesting_user_id() = user_id);

drop policy if exists "guidance_update_own" on public.user_guidance_state;
create policy "guidance_update_own" on public.user_guidance_state
  for update using (requesting_user_id() = user_id)
  with check (requesting_user_id() = user_id);

-- New travel-profile fields captured progressively by Profile Intelligence.
alter table public.travel_preferences
  add column if not exists home_airport text,
  add column if not exists origin_city text,
  add column if not exists passport_country text;
