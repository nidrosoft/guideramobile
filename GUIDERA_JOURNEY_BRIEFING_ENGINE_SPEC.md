# Guidera — Journey Briefing Engine
## Cursor-Ready Implementation Specification (AMENDMENT to the Journeys Module spec)

**Version:** 1.0
**Status:** Ready for implementation
**Relationship:** This **amends and extends** `GUIDERA_JOURNEYS_MODULE_SPEC.md`. Where the two differ on **content generation**, **this document wins** for the generation/caching/search layer. Everything else in the module spec (navigation, hub, filters, Pro gating shell, providers, community, toolkit, RLS conventions) still stands.
**Premium:** The **custom briefing builder is a Premium feature.** Pre-existing/cached content stays viewable; building a *custom* briefing requires Premium. Payment is **not** wired yet — build the UI + gating hooks only.

---

## 0. CRITICAL — Reuse-first directives (read before coding)

These are hard requirements from product. Cursor MUST follow them.

### 0.1 Reference Trip Snapshot's CURRENT implementation — UI **and** technical
Guidera already ships **Trip Snapshot**: the user picks topics and the briefing is generated **sequentially, streaming in section-by-section** (summary first, then the next, then the next) so content "drops in" as the user scrolls and they never wait for the whole thing. **Find that code and mirror it.**
- **Before writing any generation/render code**, open and study the existing Trip Snapshot implementation: its topic picker, its **Airbnb-style overlay card** (the `Where / When / Who / What` stacked card in screenshot 1), its **progressive/streaming reveal** + **loading bar** behavior, and its per-topic generation/caching.
- **Reuse the same UI and the same streaming render pattern** for Journey Briefings. Consistency with Trip Snapshot is a requirement, not a preference.
- **Do NOT modify Trip Snapshot.** Its prompt is large and tuned. We are **not** touching its engine, prompt, or tables. We build a **separate** engine for Journeys that *follows the same patterns* and *reuses the same UI components*.

### 0.2 Reuse these existing components/services (don't rebuild)
- **Airbnb-style overlay card component** (Where/When/Who/What) → extract/reuse the **style + layout** as a shared component; render a new Journeys instance with **updated content** (Reason / Where / Stage / Who / What). Same look, new fields.
- **Topic chip UI** (grouped chips, selected = green pill, "select up to N", "more topics take longer to load") → reuse as-is, new taxonomy.
- **Where auto-suggest** → reuse the **existing city/country auto-suggest API/hook** already powering Trip Snapshot's "Search any city or country" field (so users don't type a full country). Do not introduce a new geocoder.
- **Loading bar + sequential drop-in** → reuse the same component/pattern from Trip Snapshot's result screen.

### 0.3 Database: audit BEFORE you create
- **Inspect existing schema first** (Trip Snapshot tables + the Journeys module tables from the main spec). **Do not create tables that duplicate something that already exists.**
- If Trip Snapshot already has a per-topic content cache, **reuse/extend it** rather than creating a parallel one (see §4.0 decision gate).
- Reconcile with the main Journeys spec: the main spec's one-shot `journey_guides.content` is **superseded** by per-topic assembly (§3). Decide per §4.0 whether to (a) keep `journey_guides` as a cached assembly snapshot, or (b) drop its `content` reliance. **Leave the existing Trip Snapshot UI fully working** — changes here must not break it.
- Net rule: **reuse > extend > create.** Only create a table when nothing existing fits.

### 0.4 Models for THIS engine
This engine does **not** use Claude. Per product direction, Journey Briefings use **Perplexity** (research-grounded, real-time web — ideal for costs, visas, legality, safety, "what a country is known for") and **Google Gemini Flash** (fast, cheap, structured — ideal for evergreen descriptive topics). Model IDs are configurable constants (§9.4); confirm the exact strings at build time.

---

## 1. Concept & what changes

### 1.1 The feature
Inside the Journeys hub, tapping the **search box** opens a **bottom sheet** (Trip-Snapshot style) that lets the user compose a **custom briefing** for their journey:

> **Reason** (which journey) → **Where** (country, with auto-suggest, or "recommend countries") → **Stage** (exploring / soon / decided) → **Who** (just me / couple / family / elderly parent) → **What** (topic picker: purpose-pack topics + universal topics)

On submit, the result page **streams in section-by-section** (cached sections instantly, missing ones generated live and dropped in as they finish), exactly like Trip Snapshot — but adapted to the journey, toned by stage, and personalized by who.

The user can also still **type-and-submit** in the search box (e.g. "hair transplant") for the quick path (resolve → guide / country profile, per main spec §9.2). The bottom sheet is the **richer, customizable** path.

### 1.2 What changes vs the main spec
| Area | Main spec (superseded) | This spec (authoritative) |
|---|---|---|
| Generation unit | one-shot full guide JSON (Claude) | **per-topic section** (Perplexity/Gemini) |
| Cache key | guide = `journey × country [× subhub]` | **topic = `journey × country × topic [× subhub]`** |
| Guide vs briefing | separate idea | **unified** — a guide is the *default topic set*; a briefing is a *custom topic set*; both assemble from the same topic cache |
| Reveal | render whole guide | **sequential streaming reveal** (reuse Trip Snapshot) |
| Search | type → result | type → result **OR** bottom-sheet custom builder (Premium) |
| Model | Claude Sonnet | **Perplexity + Gemini Flash** |

Everything else (hub, rail, continent/sub-hub filters, providers, community, toolkit, badges, events, RLS) is unchanged.

---

## 2. Why per-topic + assembly (the core architecture)

The unit of **generation and caching is a single topic-section**, keyed `journey × country × topic [× subhub]`. A briefing (and a guide) is just an **ordered assembly** of topic-sections.

This unlocks everything the product asked for:
- **Streaming reveal** — each topic is independent, so the result page paints cached topics instantly and streams the rest in priority order (Trip-Snapshot behavior).
- **Real reuse / caching** — first user asking *Medical × Turkey × [Cost, Recovery, Accreditation]* generates 3 sections; the next asking *[Cost, Accreditation, Insurance]* reuses 2 from cache, generates only Insurance. Popular `journey × country` pairs trend toward ~100% cache hits.
- **Unified guide + briefing** — the canonical guide is the journey's **default topic set**, assembled and (optionally) snapshotted for instant first paint + curation; a custom briefing is any other topic set. **One cache, no duplicate generation.**
- **Organic library growth** — user "+ Add what you want to know" free-text topics generate ad-hoc sections; common ones get normalized into the topic catalog and cached, so the taxonomy grows from real demand.
- **Smart ordering** — `journey_topic_usage` powers "most-asked" ordering; per-user history powers "recent."

```
Briefing request  =  selected topics
                     ├─ for each topic: cache HIT  → render instantly
                     └─ for each topic: cache MISS → generate (Perplexity|Gemini) → cache → render (streamed)
Guide             =  briefing with the journey's DEFAULT topic set (curated/snapshotted)
```

---

## 4. Data Model

### 4.0 Decision gate — audit before creating (DO THIS FIRST)

Before running any migration, Cursor must inspect existing tables and resolve:

1. **Does Trip Snapshot already cache per-topic content?** If a table like `trip_snapshot_sections` / `snapshot_topic_cache` exists keyed by destination+topic:
   - Prefer to **add a parallel, journey-scoped table** (`journey_topic_content`, below) rather than overloading Trip Snapshot's table — they have different keys (journey×country×topic vs destination×topic) and **different prompts/engines**. Keep them separate to avoid coupling, but **mirror its columns/shape** for consistency.
2. **`journey_guides` (main spec §4.5).** Keep the row (it still anchors catalog stubs, status, badges, ratings, providers, community links), but treat `content` as an **optional cached assembly snapshot** of the default topic set, regenerated from `journey_topic_content`. Do **not** generate `content` one-shot anymore. If `content` is unused at build time, leave the column but stop writing to it via the old path.
3. **No duplicates.** If any table below already exists under another name, **reuse it**. Only create what's missing.
4. **Don't break Trip Snapshot.** No changes to its tables, prompt, or engine.

> Leave this audit note in the codebase (e.g., a comment block atop the migration) so it's explicit.

### 4.1 `journey_topics` — the topic catalog (universal + purpose packs)

```sql
CREATE TABLE journey_topics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key             TEXT UNIQUE NOT NULL,              -- 'cost_vs_home', 'residency_pathways', 'safety_emergency'
    label           TEXT NOT NULL,                     -- 'Cost vs Home'
    icon            TEXT NOT NULL,                      -- icon key (config/icons.ts)
    topic_group     TEXT NOT NULL,                     -- UI group header: 'Medical','Money','Safety & Risk',...
    -- scope: universal topics apply to every journey; pack topics apply to listed journeys
    is_universal    BOOLEAN DEFAULT FALSE,
    applies_to      TEXT[] DEFAULT '{}',               -- category slugs (empty when is_universal)
    subhub_scope    TEXT[] DEFAULT '{}',               -- if set, only shows for these sub-hub slugs (e.g. ['hair'])
    -- generation routing
    needs_research  BOOLEAN DEFAULT FALSE,             -- true => Perplexity (current facts); false => Gemini Flash
    model_override  TEXT,                              -- optional explicit model id
    -- smartness
    default_for     TEXT[] DEFAULT '{}',               -- journeys where this is pre-selected (★)
    sort_weight     INTEGER DEFAULT 100,               -- base ordering (lower = earlier)
    research_basis  TEXT,                              -- 1-line why this topic exists (from the 4 research docs)
    status          TEXT DEFAULT 'active' CHECK (status IN ('active','hidden')),
    is_custom       BOOLEAN DEFAULT FALSE,             -- true for user-generated topics promoted into the catalog
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_journey_topics_universal ON journey_topics(is_universal) WHERE is_universal = TRUE;
CREATE INDEX idx_journey_topics_applies ON journey_topics USING GIN (applies_to);
```

### 4.2 `journey_topic_content` — the atomic cache (THE important table)

```sql
CREATE TABLE journey_topic_content (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID NOT NULL REFERENCES journey_categories(id) ON DELETE CASCADE,
    country_code    CHAR(2) NOT NULL REFERENCES journey_countries(code),
    subhub_id       UUID REFERENCES journey_subhubs(id) ON DELETE SET NULL,
    topic_key       TEXT NOT NULL REFERENCES journey_topics(key),

    -- composite cache key (empty string when subhub null)
    cache_key       TEXT GENERATED ALWAYS AS (
                      category_id::text || ':' || country_code || ':' || COALESCE(subhub_id::text,'_') || ':' || topic_key
                    ) STORED,

    -- generated section payload (see §9.3 schema)
    content         JSONB NOT NULL,                    -- { title, blocks:[...], bullets:[...], note?, ... }
    summary         TEXT,                              -- short 1-2 line preview (used in collapsed/teaser states)

    -- provenance
    engine          TEXT,                              -- 'perplexity' | 'gemini'
    model           TEXT,
    prompt_version  INTEGER,
    confidence      NUMERIC(3,2),
    sources         JSONB DEFAULT '[]'::jsonb,         -- Perplexity citations (label/url) when available

    -- lifecycle (mirror main-spec guide lifecycle)
    status          journey_guide_status NOT NULL DEFAULT 'ai_generated', -- ai_generated|pending_review|curated|archived
    generated_at    TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by     UUID REFERENCES profiles(id),
    reviewed_at     TIMESTAMPTZ,

    view_count      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cache_key)
);
CREATE INDEX idx_jtc_lookup ON journey_topic_content(category_id, country_code);
CREATE INDEX idx_jtc_topic ON journey_topic_content(topic_key);
CREATE INDEX idx_jtc_status ON journey_topic_content(status);
```

### 4.3 `journey_briefings` — a composed briefing (powers Recent + Saved + reuse)

```sql
CREATE TABLE journey_briefings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES journey_categories(id) ON DELETE CASCADE,
    country_code    CHAR(2) NOT NULL REFERENCES journey_countries(code),
    subhub_id       UUID REFERENCES journey_subhubs(id) ON DELETE SET NULL,

    -- the composition inputs
    topic_keys      TEXT[] NOT NULL,                   -- selected topics, in display order
    stage           TEXT CHECK (stage IN ('exploring','soon','decided')),  -- nullable
    who             TEXT,                              -- 'solo','couple','family','elderly_parent', ...
    who_detail      JSONB DEFAULT '{}'::jsonb,         -- {childrenAges:[...], ...} optional

    title           TEXT,                              -- auto: "Medical & Cosmetic · Turkey"
    is_saved        BOOLEAN DEFAULT FALSE,             -- user explicitly saved this result page
    last_opened_at  TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_journey_briefings_user_recent ON journey_briefings(user_id, last_opened_at DESC);
CREATE INDEX idx_journey_briefings_saved ON journey_briefings(user_id, is_saved) WHERE is_saved = TRUE;
```

> A briefing stores only the **recipe** (topics + who + stage), not the content — content lives in `journey_topic_content`. Re-opening a briefing re-assembles from cache (instant for cached topics).

### 4.4 `journey_topic_usage` — popularity (powers "most-asked" ordering)

```sql
CREATE TABLE journey_topic_usage (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID NOT NULL REFERENCES journey_categories(id) ON DELETE CASCADE,
    topic_key       TEXT NOT NULL REFERENCES journey_topics(key),
    selection_count BIGINT DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, topic_key)
);
-- increment on each briefing submit (upsert + 1). Used to sort chips: recent > most-asked > base sort_weight.
```

### 4.5 Custom user topics
When a user adds a free-text "what I want to know" item:
- It is generated as an ad-hoc topic-section (Perplexity by default, since custom asks are usually research-y), cached in `journey_topic_content` with a normalized `topic_key` like `custom:<slug>`.
- A nightly job (or admin) can **promote** frequently-requested custom topics into `journey_topics` with `is_custom = true` so they appear as first-class chips for everyone. (Phase 2.)

### 4.6 RLS (follow main-spec conventions)
```sql
ALTER TABLE journey_topics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_topic_content   ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_briefings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_topic_usage     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read topics"        ON journey_topics        FOR SELECT USING (status = 'active');
CREATE POLICY "public read topic content" ON journey_topic_content FOR SELECT USING (status <> 'archived');
CREATE POLICY "public read usage"         ON journey_topic_usage   FOR SELECT USING (TRUE);
CREATE POLICY "own briefings"             ON journey_briefings     FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- writes to journey_topic_content / journey_topics / usage happen via SERVICE ROLE in edge functions only.
```

---

## 5. Topic Taxonomy (seed data)

Two layers: **universal** (reuse Trip Snapshot's existing topics — do NOT redefine them; map by key) and **purpose packs** (NEW topics per journey). `★` = smart-default (pre-selected). `[R]` = `needs_research = true` → Perplexity; otherwise Gemini Flash.

### 5.1 Universal base (reuse existing Trip Snapshot topic keys)
Seed `journey_topics` rows with `is_universal = true` that **alias the existing Trip Snapshot topics** (same `key` where possible) so we don't fork the taxonomy:
`safety_emergency [R]`, `scams_crime [R]`, `visa_entry [R]`, `laws_regulations [R]`, `payments_banking`, `prices_budget [R]`, `getting_around`, `customs_etiquette`, `health_medication [R]`, `weather_packing [R]`, `food_dining`, `whats_happening [R]`.

> If Trip Snapshot's topic definitions are reusable directly, reference them and skip re-seeding; otherwise seed the 12 above mirroring its labels/icons.

### 5.2 Purpose packs (NEW — seed these)

**Medical & Cosmetic** (`applies_to: ['medical']`)
- `cost_vs_home` ★ [R] — itemized procedure cost vs the user's home country (research's #1 driver)
- `clinic_accreditation` ★ [R] — JCI/TEMOS/ISO, how to verify (biggest anxiety / safety)
- `the_procedure` ★ — what actually happens, step by step
- `recovery_aftercare` ★ — recovery timeline + "don't fly yet" (content gap all reports flagged)
- `whats_in_package` — what bundles include (hotel/transfer/translator)
- `complication_insurance` [R] — cover for complications abroad
- `choosing_surgeon` — surgeon vs technician, questions to ask
- `red_flags_mills` — high-volume "mills", scams, warning signs
- *sub-hub `hair`*: `fue_vs_dhi`, `graft_counts` (`subhub_scope:['hair']`)
- *sub-hub `dental`*: `dental_materials_guarantees` (`subhub_scope:['dental']`)

**Relocation & Expat** (`['relocation']`)
- `residency_pathways` ★ [R] — visa routes to long-term residency
- `cost_of_living` ★ [R] — realistic monthly costs
- `housing_rentals` ★ [R] — renting/buying, neighborhoods, deposits
- `banking_transfers` [R] — opening accounts, moving money
- `healthcare_access` [R] — public/private, enrolment
- `schools` — international/local schooling (★ when who=family)
- `taxes_residency` [R] — tax residency rules, treaties
- `setting_up` — registration, SIM, utilities, bureaucracy
- `building_community` — meeting people, expat networks

**Digital Nomad** (`['nomad']`)
- `nomad_visa` ★ [R] — digital-nomad visa, length, income req
- `internet_connectivity` ★ [R] — speeds, reliability, SIM/eSIM
- `monthly_budget` ★ [R] — geo-arbitrage monthly spend
- `coworking` [R] — spaces, cafés, day costs
- `best_neighborhoods` — where nomads base
- `nomad_community` — meetups, communities
- `timezone_fit` — overlap with home/work
- `nomad_taxes` [R] — tax exposure as a nomad

**Wellness & Retreats** (`['wellness']`)
- `retreat_types` ★ — yoga/detox/spiritual/medical-spa
- `cost_included` ★ [R] — price ranges, what's included
- `vetting_legitimacy` ★ [R] — avoiding scams / unsafe retreats
- `best_season` [R] — when to go
- `health_dietary` — dietary/health accommodations
- `reputation_reviews` [R] — credible reviews
- `booking_safely` — deposits, cancellation, safety

**Retirement Abroad** (`['retire']`)
- `col_couple` ★ [R] — monthly cost for a couple on fixed income
- `healthcare_quality` ★ [R] — quality + access for retirees
- `retiree_visa` ★ [R] — pensionado / retirement visas
- `climate_comfort` [R] — climate, comfort, livability
- `accessibility` — mobility/accessibility (★ when who=elderly_parent)
- `retiree_community` — established retiree/expat communities
- `pensions_banking` [R] — receiving pension, banking
- `longterm_safety` [R] — long-term safety/stability

**Fertility & IVF** (`['fertility']`)
- `legally_permitted` ★ [R] — what treatments/arrangements are legal here (the #1 gap)
- `cost_per_cycle` ★ [R] — cost per cycle / package
- `process_timeline` ★ — steps + how long it takes
- `success_rates_caveated` [R] — typical outcomes, heavily caveated
- `clinic_accreditation` [R] — accreditation/verification
- `recovery_aftercare` — recovery + remote follow-up
- `legal_parentage` [R] — parentage/citizenship of the child
- `peer_support` — connecting with others who've gone through it

**Solo Female** (`['solo']`)
- `overall_safety` ★ [R] — realistic safety picture
- `cultural_norms_dress` ★ — norms, dress, harassment context
- `safe_neighborhoods` ★ [R] — where to stay / avoid
- `getting_around_safely` — transport safety
- `meeting_travelers` — meeting other women/travelers
- `scams_targeting_solo` [R] — common scams targeting solo travelers
- `health_wellbeing` — health, pharmacies, products

> The remaining 9 journeys (Study, Pilgrimage, Adventure, Heritage, Longevity, CBI, Worldschool, Volunteer, Family) are seeded by the **same method** — extract their "needs / content gaps" from the 4 research docs into 6–8 pack topics each, mark 3 as `default_for`, flag `[R]` on current-facts topics. (Seed at launch or fast-follow.)

### 5.3 Who → topic personalization (smart pre-selection)
On `who` change, add these to the default-selected set:
- `family` → `schools` (relocation/worldschool), `health_dietary` (wellness), family-safety nuance
- `elderly_parent` → `accessibility`, `healthcare_quality`/`healthcare_access`
- `couple` → `col_couple` (retire), couple-oriented framing
- `solo` → `overall_safety`, `safe_neighborhoods` (always, for any journey, surfaced)

This only **pre-selects**; the user can toggle anything.

---

## 6. The Briefing Bottom Sheet (flow & contracts)

Opens from the hub **search box** (tapping it, not just typing). Reuses Trip Snapshot's **Airbnb-style overlay card** (style/layout) with **updated content**. It is **Premium** (§11) — free users see the upsell here.

### 6.1 Sheet structure (two tabs)

**Tab A — "Build" (default):** the stacked overlay cards, top → bottom:
1. **Reason** — the journey. Pre-filled from the hub's selected journey; tappable to change (mini journey list). *(New axis vs Trip Snapshot.)*
2. **Where** — country field with **existing auto-suggest** (reuse Trip Snapshot's city/country autosuggest API). Plus a secondary chip: **"Not sure — recommend countries"** → ranks top countries for the journey (uses the country-profile/known-for logic, §9.5) and lets the user pick.
3. **Stage** — segmented: `Just exploring · Within ~3 months · Decided`. Optional. Drives tone/depth (§9.2). *(Replaces "When/dates" — dates are irrelevant pre-decision.)*
4. **Who** — `Just me · Couple · Family with kids · With an elderly parent` (+ optional detail like kids' ages). Drives topic pre-selection (§5.3) and framing.
5. **What** — the **topic picker** (reused chip UI): purpose-pack topics first (smart-defaults pre-checked), then universal topics, grouped with headers; "+ Add what you want to know" free-text; "select up to N, more topics take longer" hint (but cached ones are instant).

Footer: **Clear all** + **Generate briefing** (mirrors Trip Snapshot's `Clear all` / `Search`).

**Tab B — "Recent":** the user's recent briefings (`journey_briefings` ordered by `last_opened_at`), each a row: journey + country + topic count. Tapping re-opens the assembled result (instant from cache). Saved briefings pinned/marked. *(This is the "recent search" requirement, surfaced as a tab inside the bottom sheet.)*

### 6.2 Field → state contract

```ts
interface BriefingDraft {
  categorySlug: string;            // Reason
  countryCode?: string;            // Where (resolved via autosuggest)
  subhubSlug?: string;             // medical sub-hub, if chosen
  stage?: "exploring" | "soon" | "decided";
  who?: "solo" | "couple" | "family" | "elderly_parent";
  whoDetail?: { childrenAges?: number[] };
  topicKeys: string[];             // What (ordered)
  customTopics?: string[];         // free-text asks
}
```

Validation to enable **Generate**: `categorySlug` + `countryCode` + ≥1 topic. Stage/who optional.

### 6.3 On Generate
1. Insert `journey_briefings` (recipe + auto title). Increment `journey_topic_usage` per selected topic.
2. Navigate to the **result screen** and begin **streaming assembly** (§8).
3. Emit `briefing_generated` event (§13 of main spec taxonomy + new events §13 here).

---

## 7. Smart Layer (defaults / ordering / country-aware / custom)

When the sheet opens for a journey, topic chips are computed as:

```ts
// pseudo: order = recent(user) ▸ most-asked(journey) ▸ base sort_weight
const chips = topicsFor(categorySlug)               // universal + pack topics for this journey (+subhub scope)
  .map(t => ({ ...t,
      preselected: t.default_for.includes(categorySlug) || personalizationAdds(who).includes(t.key),
      highlighted: countryFocusMatches(countryCode, t),       // e.g. Turkey -> hair topics
      score: rank(userRecency(t.key), usageCount(categorySlug, t.key), t.sort_weight),
  }))
  .sort(byScore);
```

- **Smart defaults** — `default_for` topics pre-checked; `who` adds more (§5.3).
- **Ordering** — user's recent topics first, then journey's most-asked (`journey_topic_usage`), then base weight.
- **Country-aware** — if the country is known for a sub-focus (Turkey→Hair, Mexico→Dental), highlight/pre-check those topics.
- **Custom** — "+ Add what you want to know" → free-text → ad-hoc generated section; common ones promoted to catalog (§4.5).

---

## 8. Streaming / Sequential Reveal (mirror Trip Snapshot)

**This is a hard requirement: match Trip Snapshot's UX exactly.** The result page must paint immediately and **drop sections in one-by-one** as they're ready, so the user scrolls and reads while the rest generates.

### 8.1 Reference + reuse
- Open Trip Snapshot's result/generation code. **Reuse its loading-bar + progressive section-reveal components and its sequential generation orchestration.** Same skeleton cards, same drop-in animation, same "generating…" affordances.
- Our engine differs only in: the **prompt**, the **models** (Perplexity/Gemini), and the **topic cache** it reads/writes.

### 8.2 Assembly algorithm (`useBriefingAssembly`)
```
ordered = orderTopics(draft.topicKeys, journey.ai_section_order)   // critical/above-the-fold first
render N skeleton cards (one per topic), in `ordered`

// 1) instant: hydrate cache hits
const hits = batchGetTopicContent(ordered, journey, country, subhub)  // single query
for each hit -> replace its skeleton with content immediately

// 2) sequential stream: generate misses IN ORDER (top-first), dropping each in as it resolves
for (const topic of misses) {            // sequential, like Trip Snapshot
   const section = await generateTopic(topic, ctx)   // edge fn (Perplexity|Gemini)
   replaceSkeleton(topic, section)                    // drops in; user already scrolling
   advanceLoadingBar()
}
```
- **Cache hits render with zero wait.** Misses stream top-to-bottom so the most important sections appear first.
- Optional optimization: a single **SSE edge function** (`journeys-stream-briefing`) that yields sections as generated, so it's one connection instead of N round-trips. Either approach is acceptable; the **UX (sequential drop-in) is what matters**.
- Generation order respects the journey's `ai_section_order` (main spec §6.3) so Medical leads with cost/process/risk/aftercare, Solo Female with safety, etc.

### 8.3 Result screen
- Header: flag + country + journey + (stage/who chips). **Save** button → sets `journey_briefings.is_saved = true`.
- Body: the assembled, ordered topic-sections (each is a `journey_topic_content.content` block rendered by the matching renderer; reuse the guide section renderers from main spec §6 where the shapes align).
- Footer: provider (Pro) + community blocks injected per main spec §6.4.
- Disclaimer rendered when the journey `requires_disclaimer`.

---

## 9. The Briefing System Prompt + Model Routing

A **separate, custom prompt** for this engine (Trip Snapshot's prompt is untouched). The prompt generates **one topic-section at a time** (not a whole guide), so it's small, fast, and cacheable. Output is **strict JSON**.

### 9.1 Global guardrails (same spirit as main spec §9)
- Output **only valid JSON** matching the section schema (§9.3). No prose outside JSON.
- Truthful, specific, **ranges not false precision**. Never invent stats, clinics, laws, success rates.
- **No medical/legal/financial/immigration advice** — information only. For medical/fertility/cbi/longevity, info framing + the screen shows a disclaimer.
- **Never name specific providers/clinics/agencies** — those come from `journey_providers`.
- If facts vary by nationality/region/clinic, say so.
- Be concise and scannable (this is one section, not an essay).

### 9.2 The prompt (static block) — `ai/prompts/briefing-topic.prompt.ts`

```
You are Guidera's Journey Briefing engine. You write ONE focused section of a purpose-driven
travel briefing — for a specific JOURNEY (reason for travel), COUNTRY, and TOPIC. A first-timer
should finish this section feeling clear and prepared. Output strict JSON only.

You receive:
- JOURNEY: name + 1-line definition + emphasis (how this journey should be framed)
- COUNTRY: name + continent (+ optional sub-hub focus, e.g. "Hair Restoration")
- TOPIC: the single topic to cover, with a short instruction of what it should contain
- STAGE: one of exploring | soon | decided  (calibrate DEPTH/TONE accordingly)
- WHO: solo | couple | family | elderly_parent (tailor relevant details; e.g. family -> schooling,
       elderly -> accessibility/healthcare)

RULES:
1. Cover ONLY this topic for this journey×country. Stay in scope.
2. STAGE calibration:
   - exploring -> orient: the big picture, ranges, what to consider. Lighter, encouraging.
   - soon      -> practical: concrete steps, what to prepare, typical costs/timelines.
   - decided   -> logistics: checklists, exact sequence, what to do next, pitfalls to avoid.
3. WHO calibration: weave in the detail that matters for that traveler type (don't bolt on a generic line).
4. Be specific to the COUNTRY (real cities, real reputations, realistic ranges). No generic filler.
5. Costs/durations/laws as RANGES with caveats. Note nationality/region variance where relevant.
6. Honest about RISKS where the topic implies them — do not soften (safety feature).
7. NO advice. NO named providers/clinics. NO fabricated numbers.
8. Keep it scannable: a 1–2 sentence intro, then 3–6 tight bullets; add a small table only if the
   topic is inherently comparative (e.g. costs vs home). Set "confidence" 0–1.

OUTPUT: strict JSON only, matching this shape (no markdown, no commentary):
{
  "topicKey": "string",
  "title": "string",                 // human title for the section card
  "summary": "string",               // 1–2 line preview
  "blocks": [                        // ordered render blocks
    { "type": "intro", "text": "string" },
    { "type": "bullets", "items": ["string", ...] },
    { "type": "table", "columns": ["string", ...], "rows": [["string", ...]] },   // optional
    { "type": "callout", "tone": "tip|warning", "text": "string" }                 // optional
  ],
  "confidence": 0.0
}
```

### 9.3 Section JSON schema (`ai/schemas/briefing-topic.schema.ts`, zod)
Validate the above; the renderer maps `blocks[]` to UI (intro → paragraph, bullets → list, table → comparison table, callout → tip/warning chip). Cache the whole object in `journey_topic_content.content`; store `summary` to its column.

### 9.4 Model routing (Perplexity + Gemini)

```ts
// config: confirm exact model ids at build time
export const BRIEFING_MODELS = {
  perplexity: process.env.PPLX_MODEL ?? "sonar",        // research-grounded, real-time web + citations
  gemini:     process.env.GEMINI_MODEL ?? "gemini-2.5-flash", // fast/cheap structured (product said "Gemini Flash")
};

// route by topic.needs_research (or topic.model_override)
function pickEngine(topic): "perplexity" | "gemini" {
  if (topic.model_override) return topic.model_override.startsWith("sonar") ? "perplexity" : "gemini";
  return topic.needs_research ? "perplexity" : "gemini";
}
```
- **Perplexity (Sonar):** cost_vs_home, visas/residency, legality, success rates, safety, prices, healthcare, "what a country is known for" — anything where **current, sourced facts** matter. Store returned **citations** into `journey_topic_content.sources`.
- **Gemini Flash:** evergreen/descriptive topics (the_procedure, recovery_aftercare, customs, retreat_types, neighborhoods) — fast and cheap.
- Both are called from edge functions; both return text → extract+validate JSON (retry once on invalid).
- **Caching is at the DB layer** (`journey_topic_content`) — the real cost lever. (Optionally use Gemini context caching for the shared static prompt; not required.)

### 9.5 Country recommendation / "known for" (reuse main spec §9.2)
The **"Not sure — recommend countries"** path and the typed quick-search both use the **country-profile / known-for** logic from main spec §9.2, but **route it to Perplexity** here (research-grounded honesty, e.g. the Cameroon example). Cache stays in `journey_country_profiles`.

### 9.6 Example (Medical × Turkey × `cost_vs_home`, stage=decided, who=solo) → Perplexity
```json
{
  "topicKey": "cost_vs_home",
  "title": "What it costs vs home",
  "summary": "Expect roughly 60–80% less than US/UK prices, often bundled with hotel and transfers.",
  "blocks": [
    { "type": "intro", "text": "Turkey's prices are driven by very high procedure volume; packages frequently bundle hotel, airport transfers, and a translator." },
    { "type": "table",
      "columns": ["Procedure", "In Turkey", "Back home (US/UK)"],
      "rows": [
        ["FUE hair transplant", "$1,800–3,500", "$8,000–15,000"],
        ["DHI hair transplant", "$2,500–4,000", "$10,000–18,000"],
        ["Dental implant (per tooth)", "$400–700", "$3,000–5,000"]
      ] },
    { "type": "bullets", "items": [
      "Confirm exactly what the package includes (graft count, nights, transfers).",
      "Budget a buffer night before flying home.",
      "Unusually low quotes can signal cut corners — verify the clinic and surgeon independently."
    ] },
    { "type": "callout", "tone": "warning", "text": "Prices vary widely by clinic; treat any single quote as a starting point, not a guarantee." }
  ],
  "confidence": 0.83
}
```

---

## 10. Edge Functions (Deno)

Separate from Trip Snapshot's functions. All hold the service-role key; clients never write `journey_topic_content`.

### 10.1 `journeys-generate-topic`
```ts
// supabase/functions/journeys-generate-topic/index.ts
// Input: { categorySlug, countryCode, subhubSlug?, topicKey, stage?, who? }
// 1) build cache_key; SELECT journey_topic_content -> if HIT and fresh -> return (no model call)
// 2) load journey (ai_definition/emphasis), country, topic (instruction, needs_research)
// 3) engine = pickEngine(topic)
//    - perplexity: POST https://api.perplexity.ai/chat/completions (OpenAI-compatible), model=BRIEFING_MODELS.perplexity
//                  capture choices[0].message.content + citations
//    - gemini:     POST Google Generative Language API, model=BRIEFING_MODELS.gemini
// 4) extractJSON -> validate (briefing-topic.schema) -> upsert journey_topic_content (by cache_key),
//    store engine/model/prompt_version/confidence/sources, status='ai_generated'
// 5) return the section
```
> The client calls this **per missing topic, in order** (§8.2). Cache hits are resolved client-side via a single batch read first, so most submits call this only for the few uncached topics.

### 10.2 `journeys-stream-briefing` (optional, recommended)
```ts
// SSE endpoint. Input: the BriefingDraft (resolved topic list, ordered).
// Streams: for each topic in order -> if cache hit, emit immediately; else generate then emit.
// Emits events: { topicKey, section } ... then { done: true }.
// One connection; client renders each event as it arrives (true Trip-Snapshot drop-in).
```

### 10.3 `journeys-recommend-countries` (for "Not sure")
```ts
// Input: { categorySlug }. Uses the §9.5 known-for logic via Perplexity to rank top countries
// for this journey; caches per journey. Returns [{ countryCode, headline, why }].
```

### 10.4 Shared
- `_shared/perplexity.ts`, `_shared/gemini.ts` (thin fetch wrappers), `_shared/json.ts` (extract + zod + 1 retry).
- Secrets: `PERPLEXITY_API_KEY`, `GEMINI_API_KEY` (+ model envs). Add to Supabase function secrets.

---

## 11. Premium Gating

- **Free:** view any **already-available** content — curated guides and **cached** topic-sections / briefings (read-only). The default guide (default topic set) for popular journey×country pairs is effectively free because it's cached.
- **Premium (Pro):** the **custom briefing builder** — opening the bottom sheet to choose custom topics / who / stage, generating new (uncached) sections, the "+ Add what you want to know" custom topic, the **Recent** tab, and **saving** result pages.
- **Mechanism:** wrap the search-box "Build my briefing" entry and the bottom sheet in `ProGate` (main spec §12.2). Free users tapping it see `ProUpsellSheet`. Reading a pre-generated briefing/guide is **not** gated.
- **Payment not wired yet:** build the `ProGate`/entitlement shell only; `entitlements.adapter.isPro()` is the single source. In dev, allow through; in prod, show upsell. (Same approach as main spec.)

> Nuance for the team to confirm (§15): is the **quick typed search** (resolve → existing guide) free, with only the **custom bottom sheet** Premium? Recommended: yes — typed search that lands on cached/curated content is free; composing a *custom* briefing is Premium.

---

## 12. Saved & Recent Result Pages

- **Recent:** `journey_briefings` per user by `last_opened_at DESC` → surfaced as the **Recent tab** in the bottom sheet (§6.1 Tab B) and optionally on the hub. Re-opening updates `last_opened_at` and re-assembles from cache (instant for cached topics).
- **Saved:** **Save** on the result screen sets `is_saved = true`. Saved briefings appear pinned in Recent and (optionally) in a "Saved" list. Saved = the **recipe**; content always reflects the latest cached section (auto-fresh) unless a curated snapshot exists.
- Both are Premium surfaces (they belong to the custom-briefing experience).

---

## 13. Events (extend main spec §17 taxonomy)
```
briefing_sheet_open, briefing_reason_change, briefing_where_select, briefing_recommend_countries,
briefing_stage_select, briefing_who_select, briefing_topic_toggle, briefing_custom_topic_added,
briefing_generate, topic_generated (engine, cache_hit:false), topic_cache_hit,
briefing_saved, briefing_recent_open, briefing_pro_gate_view
```
Carry `{ category_slug, country_code, payload:{ topicKey?, engine?, stage?, who? } }`. Use for: which topics drive Premium, cache-hit ratio (cost), top journey×country to pre-warm, and custom-topic promotion candidates.

---

## 14. Build Sequencing

**Phase 1 — Engine + cache + default guide assembly**
1. Audit existing schema (§4.0). Migrations: `journey_topics`, `journey_topic_content`, `journey_briefings`, `journey_topic_usage` + RLS. Seed universal topics (alias Trip Snapshot) + the 7 launch purpose packs (§5).
2. `journeys-generate-topic` (Perplexity + Gemini routing, §10.1) + `briefing-topic.prompt.ts` + schema.
3. Assembly + **streaming reveal** (`useBriefingAssembly`) **reusing Trip Snapshot's loading/drop-in components** (§8). Wire the existing `journey_guides` screen to assemble the **default topic set** from the cache (unified guide = default briefing).

**Acceptance:** opening a guide assembles from per-topic cache, streaming sections in (cached instant, misses streamed), matching Trip Snapshot's feel.

**Phase 2 — The custom bottom sheet (Premium)**
4. Build the **Airbnb-style overlay** Journeys instance (reuse the component): Reason / Where (reuse autosuggest) / Stage / Who / What (reuse chip UI) + Recent tab.
5. Smart layer (defaults, who-personalization, recent/most-asked ordering, country-aware highlight, custom free-text topic). `journey_topic_usage` increment.
6. `ProGate` on the builder + `ProUpsellSheet`. `journeys-recommend-countries` for "Not sure".
7. Result screen Save + Recent (`journey_briefings`).

**Acceptance:** Premium user composes Medical × Turkey × custom topics, who=solo, stage=decided → streamed custom briefing; Recent + Save work; free user sees upsell.

**Phase 3 — Smart growth**
8. Custom-topic promotion job (§4.5). Pre-warm cron for popular journey×country default sets. Per-topic human-review/curation queue (reuse main-spec lifecycle).

---

## 15. DB Cleanup / Audit Checklist + Open Items

### 15.1 Audit checklist (do at start — leave as a comment in the migration)
```
[ ] List existing tables; identify any Trip Snapshot topic-content cache. Reuse shape; keep engines separate.
[ ] Confirm journey_guides stays as anchor; STOP one-shot writes to journey_guides.content (now an optional snapshot).
[ ] Do NOT duplicate any table that already exists under another name — reuse it.
[ ] Confirm the existing city/country autosuggest hook/service to reuse for "Where".
[ ] Confirm the Trip Snapshot Airbnb-overlay + loading/drop-in components to reuse.
[ ] Verify Trip Snapshot still works unchanged after this lands (no shared-table writes, no prompt edits).
```

### 15.2 Open items to confirm
1. **Trip Snapshot internals** — exact file paths/components for the overlay card, the topic chips, and the streaming render, so we reuse (not rebuild). (Cursor: locate before coding.)
2. **Existing topic cache** — does one exist to mirror? Keep journey engine separate regardless.
3. **Model IDs** — confirm exact Perplexity Sonar model + Gemini Flash model strings; set `PPLX_MODEL` / `GEMINI_MODEL`.
4. **Premium scope** — confirm: custom bottom-sheet builder = Premium; typed search → cached/curated content = free.
5. **Entitlement source** — same `entitlements.adapter` field as main spec.
6. **Stage values** — keep `exploring/soon/decided` (can add more later).
7. **Citations display** — show Perplexity `sources` on research-backed sections? (Recommended: a subtle "sources" affordance.)

### 15.3 Files (Definition of Done — Phase 1+2)
```
supabase/migrations/2026xxxx_journey_briefing_init.sql        # §4 (after audit)
supabase/functions/journeys-generate-topic/index.ts          # §10.1
supabase/functions/journeys-stream-briefing/index.ts         # §10.2 (recommended)
supabase/functions/journeys-recommend-countries/index.ts     # §10.3
supabase/functions/_shared/{perplexity,gemini,json}.ts
src/modules/journeys/ai/prompts/briefing-topic.prompt.ts     # §9.2
src/modules/journeys/ai/schemas/briefing-topic.schema.ts     # §9.3
src/modules/journeys/services/briefing.service.ts            # generate/assemble/recent/save
src/modules/journeys/hooks/useBriefingAssembly.ts            # §8.2 streaming
src/modules/journeys/hooks/useBriefingDraft.ts               # sheet state §6.2
src/modules/journeys/components/briefing/BriefingSheet.tsx   # reuse Airbnb overlay; Build + Recent tabs
src/modules/journeys/components/briefing/TopicPicker.tsx     # reuse chip UI
src/modules/journeys/screens/BriefingResultScreen.tsx        # reuse loading/drop-in; Save
src/modules/journeys/config/topics.seed.ts                   # mirrors §5 seed
# REUSE (do not rebuild): Trip Snapshot overlay-card, topic-chip, loading-bar/streaming components;
#                         existing city/country autosuggest hook.
```

**End of amendment specification.** Use together with `GUIDERA_JOURNEYS_MODULE_SPEC.md`; this document governs the generation/caching/search/briefing layer.
