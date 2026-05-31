create table if not exists public.account_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entitlement text not null,
  scope text not null default 'all',
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entitlement, scope)
);

create index if not exists account_entitlements_lookup_idx
  on public.account_entitlements (user_id, entitlement, scope)
  where enabled = true;

alter table public.account_entitlements enable row level security;

revoke all on public.account_entitlements from anon, authenticated;
grant all on public.account_entitlements to service_role;

insert into public.account_entitlements (
  user_id,
  entitlement,
  scope,
  enabled,
  metadata
)
values
  (
    '75736572-5f33-4146-a355-6244714a655a',
    'internal_testing',
    'all',
    true,
    jsonb_build_object('reason', 'Cyriac internal mobile testing')
  )
on conflict (user_id, entitlement, scope) do update set
  enabled = excluded.enabled,
  metadata = excluded.metadata,
  updated_at = now();
