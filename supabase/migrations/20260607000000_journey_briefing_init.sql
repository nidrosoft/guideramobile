-- Journey Briefing Engine — schema (amendment spec §4)
--
-- AUDIT NOTE (spec §4.0 / §15.1):
--  * Trip Snapshot caches per-FULL-RESPONSE in `snapshot_response_cache` (keyed by
--    destination+dates+travelers), with `snapshot_rate_limit_buckets`,
--    `snapshot_generation_locks`, `snapshot_request_metrics` for hardening. There is
--    NO per-topic cache to reuse, and its key scheme/engine differ. We therefore add a
--    parallel, journey-scoped PER-TOPIC cache (`journey_topic_content`) that mirrors the
--    snapshot cache's column shape/conventions but stays fully separate. Trip Snapshot
--    tables/prompts/engine are NOT touched.
--  * `journey_guides` is kept as the catalog anchor (stubs/status/badges/rating/providers/
--    community). Its `content` becomes an OPTIONAL assembly snapshot of the default topic
--    set; we stop one-shot writes to it via the old path.
--  * Owner RLS uses this app's Clerk mapping `public.requesting_user_id()` (NOT auth.uid()).

-- ── journey_topics — topic catalog ─────────────────────────────────
create table if not exists journey_topics (
    id              uuid primary key default gen_random_uuid(),
    key             text unique not null,
    label           text not null,
    icon            text not null,
    topic_group     text not null,
    is_universal    boolean default false,
    applies_to      text[] default '{}',
    subhub_scope    text[] default '{}',
    needs_research  boolean default false,
    model_override  text,
    default_for     text[] default '{}',
    sort_weight     integer default 100,
    research_basis  text,
    status          text default 'active' check (status in ('active','hidden')),
    is_custom       boolean default false,
    created_at      timestamptz default now()
);
create index if not exists idx_journey_topics_universal on journey_topics(is_universal) where is_universal = true;
create index if not exists idx_journey_topics_applies on journey_topics using gin (applies_to);

-- ── journey_topic_content — atomic per-topic cache ─────────────────
create table if not exists journey_topic_content (
    id              uuid primary key default gen_random_uuid(),
    category_id     uuid not null references journey_categories(id) on delete cascade,
    country_code    char(2) not null references journey_countries(code),
    subhub_id       uuid references journey_subhubs(id) on delete set null,
    topic_key       text not null references journey_topics(key),
    cache_key       text generated always as (
                      category_id::text || ':' || country_code || ':' || coalesce(subhub_id::text,'_') || ':' || topic_key
                    ) stored,
    content         jsonb not null,
    summary         text,
    engine          text,
    model           text,
    prompt_version  integer,
    confidence      numeric(3,2),
    sources         jsonb default '[]'::jsonb,
    status          journey_guide_status not null default 'ai_generated',
    generated_at    timestamptz default now(),
    reviewed_by     uuid references profiles(id),
    reviewed_at     timestamptz,
    view_count      integer default 0,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now(),
    unique(cache_key)
);
create index if not exists idx_jtc_lookup on journey_topic_content(category_id, country_code);
create index if not exists idx_jtc_topic on journey_topic_content(topic_key);
create index if not exists idx_jtc_status on journey_topic_content(status);

-- ── journey_briefings — composed recipe (Recent + Saved) ───────────
create table if not exists journey_briefings (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references profiles(id) on delete cascade,
    category_id     uuid not null references journey_categories(id) on delete cascade,
    country_code    char(2) not null references journey_countries(code),
    subhub_id       uuid references journey_subhubs(id) on delete set null,
    topic_keys      text[] not null,
    stage           text check (stage in ('exploring','soon','decided')),
    who             text,
    who_detail      jsonb default '{}'::jsonb,
    title           text,
    is_saved        boolean default false,
    last_opened_at  timestamptz default now(),
    created_at      timestamptz default now()
);
create index if not exists idx_journey_briefings_user_recent on journey_briefings(user_id, last_opened_at desc);
create index if not exists idx_journey_briefings_saved on journey_briefings(user_id, is_saved) where is_saved = true;

-- ── journey_topic_usage — popularity ───────────────────────────────
create table if not exists journey_topic_usage (
    id              uuid primary key default gen_random_uuid(),
    category_id     uuid not null references journey_categories(id) on delete cascade,
    topic_key       text not null references journey_topics(key),
    selection_count bigint default 0,
    updated_at      timestamptz default now(),
    unique(category_id, topic_key)
);

-- ── RLS ────────────────────────────────────────────────────────────
alter table journey_topics        enable row level security;
alter table journey_topic_content enable row level security;
alter table journey_briefings     enable row level security;
alter table journey_topic_usage   enable row level security;

drop policy if exists "public read topics" on journey_topics;
create policy "public read topics" on journey_topics for select using (status = 'active');
drop policy if exists "public read topic content" on journey_topic_content;
create policy "public read topic content" on journey_topic_content for select using (status <> 'archived');
drop policy if exists "public read usage" on journey_topic_usage;
create policy "public read usage" on journey_topic_usage for select using (true);
drop policy if exists "own briefings" on journey_briefings;
create policy "own briefings" on journey_briefings for all
  using (public.requesting_user_id() = user_id)
  with check (public.requesting_user_id() = user_id);
-- writes to journey_topic_content / journey_topics / usage happen via SERVICE ROLE in edge functions only.

-- ── usage increment helper (called from edge fn on briefing submit) ─
create or replace function public.journey_increment_topic_usage(p_category_id uuid, p_topic_keys text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into journey_topic_usage (category_id, topic_key, selection_count, updated_at)
  select p_category_id, k, 1, now() from unnest(p_topic_keys) as k
  where exists (select 1 from journey_topics t where t.key = k)
  on conflict (category_id, topic_key)
  do update set selection_count = journey_topic_usage.selection_count + 1, updated_at = now();
end;
$$;
grant execute on function public.journey_increment_topic_usage(uuid, text[]) to authenticated, service_role;
