-- Phase 5.4: notification dispatch observability and rate buckets.

create table if not exists public.notification_dispatch_metrics (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  batch_id uuid,
  alerts_selected integer not null default 0,
  alerts_dispatched integer not null default 0,
  push_attempted integer not null default 0,
  push_failed integer not null default 0,
  deferred_count integer not null default 0,
  skipped_count integer not null default 0,
  duration_ms integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_dead_letters (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.alerts(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  push_token text,
  reason text not null,
  details jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 1,
  retry_after timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_rate_buckets (
  scope text not null,
  bucket_key text not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scope, bucket_key, window_start)
);

alter table public.notification_dispatch_metrics enable row level security;
alter table public.notification_dead_letters enable row level security;
alter table public.notification_rate_buckets enable row level security;

create index if not exists idx_notification_dispatch_metrics_created
  on public.notification_dispatch_metrics (created_at desc);

create index if not exists idx_notification_dead_letters_alert
  on public.notification_dead_letters (alert_id, created_at desc);

create index if not exists idx_notification_dead_letters_unresolved
  on public.notification_dead_letters (created_at desc)
  where resolved_at is null;

create index if not exists idx_notification_rate_buckets_window
  on public.notification_rate_buckets (scope, window_start desc);
