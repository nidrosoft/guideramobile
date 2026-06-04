-- Guidera "Journeys" module — schema init (spec §4)
-- Self-contained module: all tables prefixed journey_. RLS at the end.

-- ── Enums ──────────────────────────────────────────────────────────
do $$ begin
  create type journey_group as enum ('health','living','purpose');
exception when duplicate_object then null; end $$;
do $$ begin
  create type journey_monetization as enum ('affiliate','lead_gen','none');
exception when duplicate_object then null; end $$;
do $$ begin
  create type journey_risk_tier as enum ('low','medium','high');
exception when duplicate_object then null; end $$;
do $$ begin
  create type journey_continent as enum ('Europe','Asia','Africa','Americas','Oceania');
exception when duplicate_object then null; end $$;
do $$ begin
  create type journey_guide_status as enum ('ai_generated','pending_review','curated','archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type journey_guide_source as enum ('ai','curated','hybrid');
exception when duplicate_object then null; end $$;
do $$ begin
  create type journey_provider_tier as enum ('standard','verified','featured');
exception when duplicate_object then null; end $$;

-- ── journey_categories ─────────────────────────────────────────────
create table if not exists journey_categories (
    id              uuid primary key default gen_random_uuid(),
    slug            text unique not null,
    name            text not null,
    subtitle        text,
    "group"         journey_group not null,
    icon            text not null,
    tint            text not null,
    is_popular      boolean default false,
    has_subhubs     boolean default false,
    sort_order      integer default 100,
    monetization_model  journey_monetization not null default 'affiliate',
    risk_tier           journey_risk_tier not null default 'low',
    is_sensitive        boolean default false,
    requires_disclaimer boolean default false,
    ai_definition       text not null default '',
    ai_emphasis         text not null default '',
    ai_section_order    text[] not null default '{}',
    ai_critical_sections text[] default '{}',
    ai_extra_fields     jsonb default '{}',
    status          text default 'active' check (status in ('active','hidden','archived')),
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);
create index if not exists idx_journey_categories_active on journey_categories(status) where status = 'active';
create index if not exists idx_journey_categories_group on journey_categories("group");
create index if not exists idx_journey_categories_popular on journey_categories(is_popular) where is_popular = true;

-- ── journey_subhubs ────────────────────────────────────────────────
create table if not exists journey_subhubs (
    id              uuid primary key default gen_random_uuid(),
    category_id     uuid not null references journey_categories(id) on delete cascade,
    slug            text not null,
    name            text not null,
    icon            text not null,
    tint            text not null,
    blurb           text,
    stat            text,
    ai_focus        text,
    sort_order      integer default 100,
    status          text default 'active' check (status in ('active','hidden')),
    created_at      timestamptz default now(),
    unique(category_id, slug)
);
create index if not exists idx_journey_subhubs_category on journey_subhubs(category_id);

-- ── journey_countries ──────────────────────────────────────────────
create table if not exists journey_countries (
    code            char(2) primary key,
    name            text not null,
    continent       journey_continent not null,
    flag_emoji      text not null,
    latitude        decimal(10,8),
    longitude       decimal(11,8),
    created_at      timestamptz default now()
);
create index if not exists idx_journey_countries_continent on journey_countries(continent);

-- ── journey_guides ─────────────────────────────────────────────────
create table if not exists journey_guides (
    id              uuid primary key default gen_random_uuid(),
    category_id     uuid not null references journey_categories(id) on delete cascade,
    subhub_id       uuid references journey_subhubs(id) on delete set null,
    country_code    char(2) not null references journey_countries(code),
    focus           text,
    cache_key       text generated always as (
                      category_id::text || ':' || country_code || ':' || coalesce(subhub_id::text, '_')
                    ) stored,
    status          journey_guide_status not null default 'ai_generated',
    source          journey_guide_source not null default 'ai',
    is_published    boolean default true,
    hook            text,
    fit_tags        text[] default '{}',
    headline_tag    text,
    rating          numeric(2,1),
    cost_band       text,
    content         jsonb not null default '{}'::jsonb,
    model           text,
    prompt_version  integer,
    confidence      numeric(3,2),
    generated_at    timestamptz,
    reviewed_by     uuid references profiles(id),
    reviewed_at     timestamptz,
    review_notes    text,
    view_count      integer default 0,
    save_count      integer default 0,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now(),
    unique(cache_key)
);
create index if not exists idx_journey_guides_category on journey_guides(category_id);
create index if not exists idx_journey_guides_country on journey_guides(country_code);
create index if not exists idx_journey_guides_status on journey_guides(status);
create index if not exists idx_journey_guides_published on journey_guides(is_published) where is_published = true;
create index if not exists idx_journey_guides_catalog on journey_guides(category_id, country_code) where is_published = true;

-- ── journey_guide_feedback ─────────────────────────────────────────
create table if not exists journey_guide_feedback (
    id              uuid primary key default gen_random_uuid(),
    guide_id        uuid not null references journey_guides(id) on delete cascade,
    user_id         uuid references profiles(id) on delete set null,
    rating          smallint check (rating between 1 and 5),
    is_helpful      boolean,
    flag_reason     text,
    comment         text,
    created_at      timestamptz default now()
);
create index if not exists idx_journey_guide_feedback_guide on journey_guide_feedback(guide_id);

-- ── journey_country_profiles ───────────────────────────────────────
create table if not exists journey_country_profiles (
    country_code    char(2) primary key references journey_countries(code),
    overview        text,
    known_for       text[] default '{}',
    matched         jsonb not null default '[]'::jsonb,
    primary_journey text,
    confidence      numeric(3,2),
    model           text,
    prompt_version  integer,
    generated_at    timestamptz default now(),
    updated_at      timestamptz default now()
);

-- ── journey_search_queries ─────────────────────────────────────────
create table if not exists journey_search_queries (
    id                uuid primary key default gen_random_uuid(),
    user_id           uuid references profiles(id) on delete set null,
    raw_query         text not null,
    resolved_country  char(2) references journey_countries(code),
    resolved_category text,
    result_type       text,
    created_at        timestamptz default now()
);
create index if not exists idx_journey_search_queries_user on journey_search_queries(user_id);
create index if not exists idx_journey_search_queries_country on journey_search_queries(resolved_country);

-- ── journey_providers + leads ──────────────────────────────────────
create table if not exists journey_providers (
    id              uuid primary key default gen_random_uuid(),
    category_id     uuid not null references journey_categories(id) on delete cascade,
    subhub_id       uuid references journey_subhubs(id) on delete set null,
    country_code    char(2) not null references journey_countries(code),
    name            text not null,
    provider_type   text,
    summary         text,
    website         text,
    contact         jsonb default '{}'::jsonb,
    accreditations  text[] default '{}',
    is_verified     boolean default false,
    verified_at     timestamptz,
    verification_notes text,
    quality_score   numeric(3,2),
    tier            journey_provider_tier default 'standard',
    monetization    journey_monetization default 'lead_gen',
    is_active       boolean default true,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);
create index if not exists idx_journey_providers_lookup on journey_providers(category_id, country_code) where is_active = true;
create index if not exists idx_journey_providers_subhub on journey_providers(subhub_id);

create table if not exists journey_provider_leads (
    id              uuid primary key default gen_random_uuid(),
    provider_id     uuid not null references journey_providers(id) on delete cascade,
    user_id         uuid references profiles(id) on delete set null,
    guide_id        uuid references journey_guides(id) on delete set null,
    status          text default 'new' check (status in ('new','contacted','converted','dismissed')),
    note            text,
    created_at      timestamptz default now()
);
create index if not exists idx_journey_provider_leads_provider on journey_provider_leads(provider_id);

-- ── journey_saves ──────────────────────────────────────────────────
create table if not exists journey_saves (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references profiles(id) on delete cascade,
    category_id     uuid not null references journey_categories(id) on delete cascade,
    country_code    char(2) not null references journey_countries(code),
    subhub_id       uuid references journey_subhubs(id) on delete set null,
    created_at      timestamptz default now(),
    unique(user_id, category_id, country_code, subhub_id)
);
create index if not exists idx_journey_saves_user on journey_saves(user_id);

-- ── Toolkit tables ─────────────────────────────────────────────────
create table if not exists journey_checklist_templates (
    id              uuid primary key default gen_random_uuid(),
    category_id     uuid not null references journey_categories(id) on delete cascade,
    items           jsonb not null,
    created_at      timestamptz default now(),
    unique(category_id)
);
create table if not exists journey_user_checklist_state (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references profiles(id) on delete cascade,
    category_id     uuid not null references journey_categories(id) on delete cascade,
    country_code    char(2) not null references journey_countries(code),
    checked         jsonb not null default '{}'::jsonb,
    updated_at      timestamptz default now(),
    unique(user_id, category_id, country_code)
);
create table if not exists journey_cost_estimates (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references profiles(id) on delete cascade,
    guide_id        uuid references journey_guides(id) on delete set null,
    line_items      jsonb not null,
    total_amount    numeric,
    home_compare    numeric,
    currency        text default 'USD',
    created_at      timestamptz default now()
);
create table if not exists journey_visa_watches (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references profiles(id) on delete cascade,
    country_code    char(2) not null references journey_countries(code),
    category_id     uuid references journey_categories(id) on delete set null,
    nationality     char(2),
    status          jsonb default '{}'::jsonb,
    last_checked    timestamptz,
    alerts_enabled  boolean default true,
    created_at      timestamptz default now(),
    unique(user_id, country_code, category_id)
);

-- ── Community link + peer matching ─────────────────────────────────
create table if not exists journey_group_links (
    id              uuid primary key default gen_random_uuid(),
    category_id     uuid not null references journey_categories(id) on delete cascade,
    country_code    char(2) not null references journey_countries(code),
    subhub_id       uuid references journey_subhubs(id) on delete set null,
    group_id        uuid not null,
    member_count    integer default 0,
    created_at      timestamptz default now(),
    unique(category_id, country_code, subhub_id)
);
create table if not exists journey_peer_match_requests (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references profiles(id) on delete cascade,
    category_id     uuid not null references journey_categories(id) on delete cascade,
    country_code    char(2) not null references journey_countries(code),
    status          text default 'open' check (status in ('open','matched','closed')),
    matched_user_id uuid references profiles(id) on delete set null,
    created_at      timestamptz default now()
);
create index if not exists idx_journey_peer_requests_lookup on journey_peer_match_requests(category_id, country_code, status);

-- ── AI concierge chat (scaffold) ───────────────────────────────────
create table if not exists journey_chat_threads (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references profiles(id) on delete cascade,
    category_id     uuid references journey_categories(id) on delete set null,
    country_code    char(2) references journey_countries(code),
    title           text,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);
create table if not exists journey_chat_messages (
    id              uuid primary key default gen_random_uuid(),
    thread_id       uuid not null references journey_chat_threads(id) on delete cascade,
    role            text not null check (role in ('user','assistant','system')),
    content         text not null,
    tokens          integer,
    created_at      timestamptz default now()
);
create index if not exists idx_journey_chat_messages_thread on journey_chat_messages(thread_id);

-- ── journey_events ─────────────────────────────────────────────────
create table if not exists journey_events (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid references profiles(id) on delete set null,
    event_type      text not null,
    category_slug   text,
    country_code    char(2),
    payload         jsonb default '{}'::jsonb,
    created_at      timestamptz default now()
);
create index if not exists idx_journey_events_type on journey_events(event_type);
create index if not exists idx_journey_events_user on journey_events(user_id);
create index if not exists idx_journey_events_created on journey_events(created_at);

-- ── Row-Level Security ─────────────────────────────────────────────
alter table journey_categories            enable row level security;
alter table journey_subhubs               enable row level security;
alter table journey_countries             enable row level security;
alter table journey_guides                enable row level security;
alter table journey_guide_feedback        enable row level security;
alter table journey_country_profiles      enable row level security;
alter table journey_search_queries        enable row level security;
alter table journey_providers             enable row level security;
alter table journey_provider_leads        enable row level security;
alter table journey_saves                 enable row level security;
alter table journey_checklist_templates   enable row level security;
alter table journey_user_checklist_state  enable row level security;
alter table journey_cost_estimates        enable row level security;
alter table journey_visa_watches          enable row level security;
alter table journey_group_links           enable row level security;
alter table journey_peer_match_requests   enable row level security;
alter table journey_chat_threads          enable row level security;
alter table journey_chat_messages         enable row level security;
alter table journey_events                enable row level security;

-- Public read for catalog/content (published only)
drop policy if exists "public read categories"  on journey_categories;
create policy "public read categories"  on journey_categories for select using (status = 'active');
drop policy if exists "public read subhubs"     on journey_subhubs;
create policy "public read subhubs"     on journey_subhubs    for select using (status = 'active');
drop policy if exists "public read countries"   on journey_countries;
create policy "public read countries"   on journey_countries  for select using (true);
drop policy if exists "public read guides"      on journey_guides;
create policy "public read guides"      on journey_guides     for select using (is_published = true);
drop policy if exists "public read profiles_kf" on journey_country_profiles;
create policy "public read profiles_kf" on journey_country_profiles for select using (true);
drop policy if exists "public read providers"   on journey_providers;
create policy "public read providers"   on journey_providers  for select using (is_active = true);
drop policy if exists "public read group_links" on journey_group_links;
create policy "public read group_links" on journey_group_links for select using (true);
drop policy if exists "public read checklists"  on journey_checklist_templates;
create policy "public read checklists"  on journey_checklist_templates for select using (true);

-- Owner-scoped rows (NOTE: this app maps Clerk identity to profiles via
-- requesting_user_id(); auth.uid() is kept per spec — revisit for Clerk in Phase 2).
drop policy if exists "own saves" on journey_saves;
create policy "own saves"        on journey_saves                for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own checklist" on journey_user_checklist_state;
create policy "own checklist"    on journey_user_checklist_state for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own estimates" on journey_cost_estimates;
create policy "own estimates"    on journey_cost_estimates       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own visa watches" on journey_visa_watches;
create policy "own visa watches" on journey_visa_watches         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own leads" on journey_provider_leads;
create policy "own leads"        on journey_provider_leads       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own peer reqs" on journey_peer_match_requests;
create policy "own peer reqs"    on journey_peer_match_requests  for all using (auth.uid() = user_id or auth.uid() = matched_user_id);
drop policy if exists "own chat threads" on journey_chat_threads;
create policy "own chat threads" on journey_chat_threads         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own chat msgs" on journey_chat_messages;
create policy "own chat msgs"    on journey_chat_messages        for all
  using (exists (select 1 from journey_chat_threads t where t.id = thread_id and t.user_id = auth.uid()));

drop policy if exists "insert feedback" on journey_guide_feedback;
create policy "insert feedback"  on journey_guide_feedback for insert with check (auth.uid() = user_id or user_id is null);
drop policy if exists "insert search" on journey_search_queries;
create policy "insert search"    on journey_search_queries for insert with check (true);
drop policy if exists "insert events" on journey_events;
create policy "insert events"    on journey_events         for insert with check (true);
