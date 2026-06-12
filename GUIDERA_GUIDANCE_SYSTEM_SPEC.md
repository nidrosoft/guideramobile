# Guidera Guidance System — Design Specification

**Date:** 2026-06-11
**Status:** Approved design — ready for implementation planning
**Owner:** Guidera core team

---

## 1. Overview

Guidera is feature-dense (trips + 9 modules, AI chat, AI Vision, Journeys, Connect/Pulse, safety, deals, navigation). New users see a 13-step onboarding that captures identity basics, then land on Home with no guidance. Two problems follow:

1. **Discovery** — users don't find the launcher, Journeys, trip import, Smart Plan, Pulse, or the travel profile on their own.
2. **Personalization starvation** — the travel profile has 40+ preference fields that power AI personalization, but onboarding fills only ~10. The rest stay empty forever, so generations stay generic.

This spec defines one system — the **Guidance System** — with three consumers:

| Consumer | What it does | When |
|---|---|---|
| **Tours** | Spotlight walkthroughs (hero tour + contextual mini-tours) | First visit to each surface |
| **Profile Intelligence** | Detects profile facts from behavior, prompts to confirm, tracks Profile Strength to 80%+ | Continuously, capped |
| **Smart Tips** | Single-anchor one-off hints for small features | Contextually, capped |

### Confirmed decisions

- **Tour shape:** Hybrid — short hero tour after onboarding + contextual mini-tours per surface.
- **Engine:** Custom in-house (Reanimated 4 + react-native-svg already in the stack; no tour library dependency).
- **Capture UX:** Inline confirm card after the action completes + a Profile Strength hub; lower-value signals batch into the hub.
- **Cadence:** Moderate — ≤1 inline prompt/session/surface, ≤3/day, 7-day decline cooldown, same field never asked 3×, proactive prompts stop at 80% completeness.

### Goals & success metrics

| Goal | Metric | Target |
|---|---|---|
| Feature discovery | % of new users who open the launcher in week 1 | > 60% |
| Trip activation | % of new users who create/import a trip in week 1 | > 40% |
| Tour health | Hero tour completion rate (not skipped before step 4) | > 70% |
| Profile growth | Median profile completeness at day 14 | ≥ 60% (today: ~25%) |
| Profile target | % of MAU at ≥80% completeness by day 30 | > 35% |
| Non-annoyance | Prompt accept rate stays above | > 40% (below → reduce cadence) |

---

## 2. Architecture

```
                       ┌────────────────────────────────┐
                       │        GuidanceProvider         │  (root of (tabs) layout)
                       │  one arbiter, one render slot   │
                       └──────┬──────────┬──────────┬───┘
                              │          │          │
                     ┌────────▼───┐ ┌────▼─────┐ ┌──▼────────┐
                     │ TourEngine │ │ PromptQ   │ │ SmartTips │
                     └────────┬───┘ └────┬─────┘ └──┬────────┘
                              │          │          │
        ┌─────────────────────▼──────────▼──────────▼──────────────┐
        │                  guidanceState (Zustand)                  │
        │   persisted: AsyncStorage  +  user_guidance_state (DB)    │
        └────────────────────────────▲──────────────────────────────┘
                                     │
                   ┌─────────────────┴──────────────────┐
                   │        guidanceEvents bus           │
                   │ (copies journeyEvents fire&forget)  │
                   └─────▲─────────▲──────────▲──────────┘
                         │         │          │
                  screen mounts  signal detectors  user actions
```

### 2.1 Module layout

```
src/features/guidance/
├── GuidanceProvider.tsx          # context + arbiter + render slot
├── store/useGuidanceStore.ts     # Zustand, AsyncStorage persisted, DB synced
├── events/guidanceEvents.ts      # emitGuidanceEvent() — same pattern as journeyEvents
├── tour/
│   ├── TourAnchor.tsx            # <TourAnchor id="home.search"> wrapper
│   ├── SpotlightOverlay.tsx      # SVG mask dim + animated rounded cutout
│   ├── TourTooltip.tsx           # DS card: title, body, Back/Next/Skip, dots
│   ├── tourController.ts         # step sequencing, preActions, measurement
│   ├── anchorRegistry.ts         # anchorId → measured frame (measureInWindow)
│   └── tours/
│       ├── hero.tour.ts
│       ├── trips.tour.ts
│       ├── tripDetail.tour.ts
│       ├── connect.tour.ts
│       ├── journeys.tour.ts
│       └── search.tour.ts
├── profile/
│   ├── signals/                  # one detector module per source (see §5.3)
│   ├── signalEngine.ts           # signal → eligibility → prompt/pending
│   ├── eligibility.ts            # cadence caps, cooldowns, mutual exclusion
│   ├── PromptCard.tsx            # inline confirm card UI
│   ├── ProfileStrengthRing.tsx   # ring widget (Account + hub)
│   └── strength.ts               # extended completeness scoring (wraps existing)
├── tips/
│   ├── smartTips.catalog.ts      # tip definitions
│   └── SmartTipBubble.tsx        # single-anchor hint UI
└── types.ts
```

### 2.2 Arbitration rules (the one render slot)

The GuidanceProvider renders **at most one** guidance element at any moment. Priority:

1. **Active tour** (user is mid-walkthrough) — suppresses everything else.
2. **Profile prompt** (queued by signal engine, post-action).
3. **Smart tip**.

Rules:
- A tour step change cancels any visible prompt/tip (re-queued, not lost).
- Prompts never appear within 30s after a tour ends (let the user breathe).
- Prompts/tips never appear over modals, the camera, navigation mode, or SOS flows (a `guidanceSuppressed` flag is set by those screens).
- Everything is dismissible; nothing blocks the UI underneath except the tour's dim layer (which forwards taps only to Skip/Next/target).

### 2.3 State model & persistence

```ts
interface GuidanceState {
  tours: Record<TourId, { status: 'unseen'|'completed'|'skipped'; lastStep: number; completedAt?: string }>;
  tips:  Record<TipId,  { status: 'unseen'|'shown'|'dismissed' }>;
  prompts: {
    perField: Record<ProfileField, { timesShown: number; lastShownAt?: string; declinedAt?: string; suppressed: boolean }>;
    shownToday: number;           // resets at local midnight
    lastShownAt?: string;
    sessionSurfaces: string[];    // surfaces prompted this session (memory only)
  };
  pendingFacts: PendingFact[];    // low-confidence signals awaiting hub/batch review
}
```

- **AsyncStorage** is the source of truth for instant reads (key `guidera-guidance`).
- **`user_guidance_state` table** (one row per user, JSONB column) is synced on change (debounced 5s) and hydrated at sign-in — reinstalls and second devices don't replay tours. Last-write-wins is acceptable for this data.
- Migration + RLS in §7.

---

## 3. Part A — The Tour Engine

### 3.1 Component APIs

**`TourAnchor`** — wraps any view; zero cost when no tour is active.

```tsx
<TourAnchor id="home.search">
  <SearchBar ... />
</TourAnchor>
```

Registers a ref in `anchorRegistry`. When the active step targets this id, the registry calls `measureInWindow()` (re-measured on layout change / orientation) and publishes the frame.

**`SpotlightOverlay`** — absolute-fill layer rendered by the provider:
- `react-native-svg` `<Mask>`: full-screen dim (`rgba(0,0,0,0.72)`) with a rounded-rect cutout (target frame + 8px padding, radius 16).
- Cutout frame animates between steps with Reanimated spring (translate + resize), plus a subtle 2px pulse loop on the cutout border in brand primary (#3FC39E).
- Tap handling: taps inside the cutout pass through **only when the step declares `tapTargetToAdvance: true`** (used for "tap the launcher" steps); otherwise taps anywhere advance to next.

**`TourTooltip`** — DS-styled card (`DSCard` tokens), auto-placed above or below the cutout (whichever has ≥180px), horizontally clamped to screen ± 16px:
- Title (Host Grotesk semibold), body (≤2 lines ideally), optional lottie/icon.
- Controls: `Back` (ghost, hidden on step 1) · progress dots · `Next` / final-step CTA (primary). `Skip tour` as small text top-right of the card.
- All copy through i18next: keys `guidance.tours.<tourId>.<stepId>.{title,body}` in all 6 locale files.

**Step definition:**

```ts
interface TourStep {
  id: string;
  anchorId: string;                  // must exist in anchorRegistry
  placement?: 'auto'|'top'|'bottom';
  preAction?: PreAction;             // executed before measuring
  tapTargetToAdvance?: boolean;
  ctaLabelKey?: string;              // overrides "Next" (e.g. "Finish", "Set up profile")
  ctaRoute?: string;                 // final-step deep link
}
type PreAction =
  | { type: 'switchTab'; tab: 'index'|'trips'|'community'|'account' }
  | { type: 'scrollHomeToSection'; sectionId: string }   // uses section position registry
  | { type: 'openLauncher' } | { type: 'closeLauncher' }
  | { type: 'delay'; ms: number };
```

**Home section position registry:** each home section (rendered by `SectionRenderer`) reports its `y` via `onLayout` into a small map keyed by section id. `scrollHomeToSection` scrolls the home `ScrollView` (gets a ref) to `y - headerOffset`, waits for scroll end + 150ms, then measures. No magic pixel offsets.

### 3.2 Trigger logic

- **Hero tour:** on Home focus, if `profile.onboarding_completed && tours.hero.status === 'unseen' && !guidanceSuppressed`. Starts after a 600ms settle delay. If the app is killed mid-tour, next Home visit offers *Resume tour? [Resume] [Skip]* (uses `lastStep`).
- **Contextual tours:** on first focus of their surface, only if `tours.hero.status !== 'unseen'` (hero always gets first slot) and no tour ran in the last 2 minutes.
- **Replay:** Account → Help Center → "App walkthrough" lists all tours with a replay button (sets status back to `unseen` for that tour and navigates to its surface).
- Skipping at any step marks the tour `skipped` (counts as seen; never auto-replays).

### 3.3 Tour catalog — full scripts

Copy below is the English source (`en.json`); translate to fr/es/de/it/pt.

#### HERO TOUR — `hero` (7 steps, fires once on first Home landing)

| # | Anchor | preAction | Copy (title / body) |
|---|---|---|---|
| 1 | `home.header` | — | **Welcome to Guidera 👋** / This quick tour shows you the essentials — about 30 seconds. You can skip anytime. |
| 2 | `home.search` | — | **Preview any trip instantly** / Search any city to get a Trip Snapshot — estimated costs, weather, visa info and a feel for the trip before you commit. |
| 3 | `home.section.deals` | scrollHomeToSection(deals) | **Deals picked for you** / Flight and experience deals refresh all day. Tap See all to browse by category. |
| 4 | `home.section.journeys` | scrollHomeToSection(journeys) | **Travel for a reason** / Journeys are research-backed briefs for *why* you travel — relocation, healthcare, study, remote work and more. |
| 5 | `tabbar.launcher` | switchTab(index) + scroll top | **Your toolkit lives here** / Navigate cities, scan menus with AI Vision, get safety alerts, scan receipts and tickets, or ask Guidera AI anything. *(tapTargetToAdvance: true — tapping opens the sheet)* |
| 6 | `launcher.sheet` | openLauncher | **Six tools, one tap away** / Try AI Vision on a real menu — it translates and even builds your order. *(advance closes the sheet)* |
| 7 | `tabbar.trips` | closeLauncher | **It all starts with a trip** / Add or import a trip to unlock Smart Plan: itinerary, packing, safety, language, documents, expenses, journal, do's & don'ts and compensation tracking. **CTA: "Set up my travel profile →"** → routes to `/account/travel-preferences`; fallback "Finish" link ends on Home. |

> Step 7's CTA is the **handoff to Profile Intelligence**: landing on travel-preferences with `?source=hero_tour` shows the Profile Strength ring with a "3 quick wins" card (companion type, budget style, home airport).

#### TRIPS TOUR — `trips` (3 steps, first Trips-tab focus)

| # | Anchor | Copy |
|---|---|---|
| 1 | `trips.createButton` | **Create a trip in seconds** / Build one manually, or let AI plan it for you. |
| 2 | `tabbar.launcher` | **Already booked? Import it** / Scan a boarding pass or forward a booking email — Guidera builds the trip automatically. |
| 3 | `trips.stateTabs` | **Trips organize themselves** / Upcoming, ongoing, past, drafts — everything in its place. CTA: "Create my first trip" → opens PlanBottomSheet. |

#### TRIP DETAIL TOUR — `tripDetail` (4 steps, first trip-detail open)

| # | Anchor | Copy |
|---|---|---|
| 1 | `trip.smartPlan` | **One tap, six modules** / Smart Plan generates your itinerary, packing list, safety brief, language kit, documents checklist and cultural do's & don'ts — personalized to you. |
| 2 | `trip.moduleGrid` | **Your trip command center** / Track expenses, keep a journal, and monitor flight compensation — each card is a full tool. |
| 3 | `trip.invite` | **Travel together** / Invite companions to view and edit this trip with you. |
| 4 | `trip.snapshot` | **Know before you go** / The snapshot keeps live costs, weather and alerts for this destination. CTA: "Generate Smart Plan". |

#### CONNECT TOUR — `connect` (3 steps, first Connect-tab focus)

| # | Anchor | Copy |
|---|---|---|
| 1 | `connect.tabs` | **Find your people** / Discover travelers, join groups, meet local guides and find events wherever you're headed. |
| 2 | `connect.pulse` | **Pulse: live around you** / See real-time traveler activity and meetups on the map — like a heartbeat of the city. |
| 3 | `connect.guides` | **Know the way? Become a guide** / Locals can apply to guide travelers and earn. |

#### JOURNEYS TOUR — `journeys` (2 steps, first Journeys hub open)

| # | Anchor | Copy |
|---|---|---|
| 1 | `journeys.categories` | **Pick your reason** / Every journey type gets a research-grade brief: costs, requirements, timelines, providers. |
| 2 | `journeys.briefing` | **Briefings are personal** / Tell us where, what stage you're at and who's coming — we generate a brief just for your case. |

#### SEARCH TOUR — `search` (2 steps, first search overlay open)

| # | Anchor | Copy |
|---|---|---|
| 1 | `search.input` | **Search like you think** / Type a city, a country, even "warm in December". |
| 2 | `search.snapshotHint` | **Get the full picture** / Selecting a destination builds a Trip Snapshot — costs, flights, weather, safety — before you plan anything. |

### 3.4 Smart Tips catalog (single-anchor one-offs)

Governed by prompt cadence caps (count toward the 3/day budget). Each fires once.

| TipId | Trigger | Anchor | Copy |
|---|---|---|---|
| `tip.savedItems` | 1st time user saves anything | `home.savedButton` | Saved items live here — destinations, deals, guides. |
| `tip.inbox` | 1st notification received | `home.notifButton` | Trip alerts and messages arrive in your inbox. |
| `tip.tripReminder` | Trip reminder card first appears | `home.tripReminder` | Your next trip follows you here — tap for the countdown and quick actions. |
| `tip.categoryPills` | 3rd home session, never tapped pills | `home.categoryPills` | Jump straight to flights, hotels, cars or experiences. |
| `tip.sos` | First safety module open | `safety.sos` | Hold SOS in an emergency — it alerts your emergency contact with your location. |
| `tip.checkin` | First ongoing trip day 1 | `safety.checkin` | Scheduled check-ins let loved ones know you're safe. |
| `tip.rewards` | Day 7, profile ≥40% | `account.rewards` | You're earning points — refer friends to earn faster. |
| `tip.aiVisionLive` | 2nd AI Vision use | `aivision.liveMode` | Try Live mode — point the camera and talk to Guidera in real time. |
| `tip.dmGuides` | First guide profile viewed | `guide.message` | You can message guides directly before booking. |
| `tip.expenseScan` | First manual expense added | `expenses.scanButton` | Skip typing — scan the receipt and we'll log it. |

### 3.5 Accessibility & edge cases

- **Reduce Motion** (OS setting): cutout jumps without spring/pulse animations.
- **Screen readers:** overlay sets `accessibilityViewIsModal`; tooltip is focused and announced ("Step 2 of 7: …"); Skip is always reachable.
- **Deep links / push taps** during a tour: tour pauses (state saved), resume offer on next surface visit.
- **Small screens:** if a tooltip can't fit above or below, it renders as a bottom card with an arrow toward the cutout.
- Anchors missing (feature flagged off, A/B variants): step is silently skipped; tour continues.

---

## 4. Part B — Profile Intelligence

### 4.1 Principle

> Every structured thing a user tells the app while *doing something else* is a profile fact we can ask to keep — at the moment it's fresh, with one tap, never blocking the task.

### 4.2 Field inventory & extended scoring

The existing `calculateCompleteness()` in `src/services/preferences.service.ts` (0–100, weighted) becomes the inner score of a new **Profile Strength** score in `guidance/profile/strength.ts`:

```
strength = 0.7 × preferencesCompleteness        (existing function, extended fields added)
         + 0.3 × identityCompleteness           (profiles table: avatar, bio, languages,
                                                 emergency contact, home location, nationality)
```

**New fields added to `travel_preferences`** (migration in §7): `home_airport text`, `origin_city text`, `passport_country text`. These join the scoring (home_airport 5 pts inside the preferences score; weights of existing optional fields rebalanced so the total stays 100).

**The 80% rule:** proactive inline prompts stop at strength ≥ 80. The hub still lists the remainder. (Strength recomputes locally on each preferences/profile write — no server roundtrip.)

### 4.3 Signal catalog — complete mapping

Confidence tiers: **explicit** (user typed/selected the value) → may prompt immediately. **behavioral** (inferred from a choice) → requires 2 occurrences before prompting. **weak** (a tap, a view) → never prompts; accumulates as `pendingFacts` for the hub.

| # | Source action | Hook location | Field(s) | Confidence | Example prompt copy |
|---|---|---|---|---|---|
| S1 | Flight search submitted | `search-engine.ts` flight path | `home_airport` (origin), `flight_class`, `flight_stops`, `default_adults/children/infants`, `default_currency` | explicit (origin, cabin); behavioral (stops, party) | "✈️ Make {ATL} your home airport? Searches will autofill it." |
| S2 | Hotel search submitted | `search-engine.ts` hotel path | party size; `min_star_rating`, `preferred_amenities` (from filters) | behavioral | "You filter for 4★+ stays — set that as your standard?" |
| S3 | Experience search / category opens | experience search + section taps | `interests`, `activity_level` | behavioral / weak | "Adventure keeps coming up 🧗 Add it to your interests?" |
| S4 | Trip created | `trip-core.service.ts` create | `default_companion_type` (composition), `spending_style` (budget level), `default_budget_amount`+`default_currency`, trip type → `preferred_trip_styles` | explicit | "You're planning for a family — make that your default travel crew?" |
| S5 | Trip Snapshot search | `tripSnapshot.service.ts` params | `origin_city`, `home_airport`, `passport_country` (nationality), budget, interests, `accommodation_type` | explicit | "Save {Lagos} as your home city for future snapshots?" |
| S6 | Journeys briefing inputs | `briefing.service.ts` / `useBriefingDraft` | `default_companion_type` (who), `interests` (topics), dietary/health topics → `dietary_restrictions`, `medical_conditions` | explicit (who); behavioral (topics) | "You said you're traveling with kids — update your travel profile to match?" |
| S7 | Expense added / receipt scanned | expense service | `default_currency`; spending pattern → `spending_style` | behavioral / weak | "Most of your expenses are in EUR — make it your default currency?" |
| S8 | AI Vision menu scan / order built | ai-vision services | `dietary_restrictions`, `cuisine_preferences`, `spice_tolerance` | behavioral | "We noticed you avoid pork dishes — add Halal to your dietary profile?" |
| S9 | Language tools / translation used | language service, translation calls | `languages` | behavioral | — (batch only unless 3+ uses of same language) |
| S10 | Deal section engagement (Budget vs Luxury) | section taps | `spending_style` | weak | hub only |
| S11 | Saved destinations/experiences | saved.service | `interests` | weak | hub only |
| S12 | Group/event joined in Connect | community services | `interests` | weak | hub only |
| S13 | Packing module first use | packing plugin | `wears_glasses/contacts`, `skin_tone`, `hair_type` (asked natively in-module) | explicit | in-module micro-form, writes via same engine |
| S14 | Settings changes (units, currency) | preferences screens | mirrors into prefs | explicit | silent sync, no prompt |

Detectors are thin: each capture point calls `emitProfileSignal({ source, facts: [{field, value, confidence}] })` — one line added per hook location. All logic lives in `signalEngine.ts`.

### 4.4 Eligibility engine (the cadence state machine)

A signal becomes an **inline prompt** only if ALL pass:

```
1. personalization allowed     privacy_settings.personalization !== false
2. field is empty/different    current value null OR differs from detected value
3. confidence gate             explicit → ok; behavioral → ≥2 sightings (counted in pendingFacts)
4. strength gate               profile strength < 80
5. field caps                  timesShown < 3  AND  not suppressed ("don't ask again")
6. decline cooldown            now - declinedAt > 7 days
7. session cap                 this surface not yet prompted this session
8. daily cap                   shownToday < 3   (shared with Smart Tips)
9. arbiter                     no active tour; not within 30s of a tour; not suppressed screen
```

Fail 1–6 → drop or remain pending. Fail 7–9 → stay queued (max 24h, then becomes a `pendingFact`).
**Accepted** → write via `preferences.service` / `profile.service`, show "+{n}% Profile Strength" toast animation, remove related pendingFacts.
**"Not now"** → declinedAt set (7-day cooldown). **"Don't suggest this"** (long-press or overflow) → suppressed forever.

### 4.5 Prompt UI — `PromptCard`

- Slides up from bottom (above tab bar), 1.5s after the triggering screen settles; auto-dismisses after 8s (counts as "Not now" *without* starting the decline cooldown).
- Anatomy: emoji/icon + one-line fact ("You flew from Atlanta (ATL)"), one-line benefit ("Future searches will autofill it"), buttons `Not now` (ghost) / `✓ Save` (primary). Single tap = saved — never opens a form.
- Multi-fact signals (e.g. trip creation reveals 3 facts) prompt only the **highest-impact missing field** (impact = scoring weight); the rest go to pendingFacts.
- i18n: `guidance.prompts.<field>.{fact,benefit}` with interpolation.

### 4.6 Profile Strength hub

1. **Ring widget** on Account screen header (next to stats): animated ring 0–100 with label ("Travel Profile · 64%"). Tap → hub screen.
2. **Hub screen** `/account/profile-strength`:
   - Ring + tier label: <40 "Getting started" · 40–79 "Looking good" · ≥80 "Travel-ready ✦".
   - **Quick wins** — top 3 missing fields by weight, each a one-tap card (opens a focused single-question sheet, not the full form).
   - **Suggestions to review** — accumulated pendingFacts as confirm/deny chips (the batch surface for weak signals).
   - Link to full editor (`/account/travel-preferences`).
   - Explainer: "Why this matters — your Smart Plans, packing lists and safety briefs are personalized from this profile." (This is the honest pitch: §7 of the AI context builder consumes these exact fields.)
3. **Home nudge** (one card, not recurring): if day ≥7 and strength <40, show one dismissible home card "Your trips get smarter when Guidera knows you — 2 minutes to 60%". Dismiss = never again.

### 4.7 Privacy

- Master switch: existing `privacy_settings.personalization`. Off → no detectors run, no signals stored, hub shows an explanation instead.
- Signals containing values are stored **only client-side** (pendingFacts in guidance state) until the user confirms; confirmation writes go through existing RLS-protected services. No raw behavioral log is sent to the server by this system (Mixpanel events carry field *names* and outcomes, never values — see §6).
- Settings → Privacy gains one row: "Profile suggestions" (maps to the same flag).

---

## 5. What ships where (anchors to add)

Minimal invasive changes — wrap existing views with `TourAnchor`, add one `emit` line per detector:

| Surface | File | Changes |
|---|---|---|
| Home | `src/app/(tabs)/index.tsx` | ScrollView ref; anchors: header, search, tripReminder, categoryPills, savedButton, notifButton; section registry in `SectionRenderer.tsx` (+ per-section anchor) |
| Tab bar | `src/app/(tabs)/_layout.tsx` | anchors: launcher, trips, community, account; expose `openLauncher` to tourController |
| Launcher | `ScanBottomSheet.tsx` | anchor: sheet content |
| Trips | `TripListScreen.tsx` | anchors: createButton, stateTabs |
| Trip detail | `TripDetailScreen.tsx` | anchors: smartPlan, moduleGrid, invite, snapshot |
| Connect | `CommunityHubScreen.tsx` | anchors: tabs, pulse, guides |
| Journeys | hub screen | anchors: categories, briefing entry |
| Search | `SearchOverlay.tsx` | anchors: input, snapshotHint |
| Detectors | per §4.3 hook locations | one `emitProfileSignal()` call each |
| Provider | `(tabs)/_layout.tsx` | wrap with `GuidanceProvider` |

---

## 6. Analytics (Mixpanel via existing `trackEvent`)

| Event | Properties |
|---|---|
| `guidance_tour_started / _step_viewed / _completed / _skipped` | tourId, stepId, stepIndex |
| `guidance_tip_shown / _dismissed` | tipId |
| `guidance_prompt_shown / _accepted / _declined / _suppressed / _expired` | field, source, confidence |
| `profile_strength_changed` | from, to, trigger (prompt/hub/form) |
| `profile_hub_opened` | source (ring/tour CTA/home nudge) |

Dashboards: tour funnel (per step drop-off), prompt accept rate per field (kill/raise thresholds), strength distribution cohort curves. **Guardrail:** if any field's accept rate <20% over 200 shows, auto-deprioritize it (config flag).

---

## 7. Data model changes (Supabase)

```sql
-- 1) guidance state sync (one row per user)
create table public.user_guidance_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.user_guidance_state enable row level security;
create policy "guidance_select_own" on public.user_guidance_state
  for select using (requesting_user_id() = user_id);
create policy "guidance_upsert_own" on public.user_guidance_state
  for insert with check (requesting_user_id() = user_id);
create policy "guidance_update_own" on public.user_guidance_state
  for update using (requesting_user_id() = user_id)
  with check (requesting_user_id() = user_id);

-- 2) new capturable fields
alter table public.travel_preferences
  add column if not exists home_airport text,
  add column if not exists origin_city text,
  add column if not exists passport_country text;
```

(Follows the security posture established 2026-06-11: owner-scoped policies with `WITH CHECK`, no anon grants.)

---

## 8. Rollout plan

| Phase | Scope | Acceptance criteria |
|---|---|---|
| **1. Foundation + hero tour** | GuidanceProvider, store/persistence, anchor registry, spotlight/tooltip, hero tour, replay entry, i18n (6 langs), reduce-motion & screen-reader support | Hero tour runs once after onboarding on iOS+Android, resumes after kill, replayable, never double-fires; zero overlap with modals |
| **2. Contextual tours** | trips, tripDetail, connect, journeys, search tours; suppression rules | Each fires exactly once on first surface visit; hero precedence respected |
| **3. Signal engine + top-4 prompts** | signalEngine, eligibility, PromptCard; detectors S1, S4, S5, S6 (home airport, companion, budget style, cabin class); strength.ts; DB migration | Caps verifiably enforced (unit tests); accept writes persist & strength updates; personalization flag kills everything |
| **4. Strength hub + long tail** | Ring widget, hub screen, quick-win sheets, pendingFacts review, home nudge, Smart Tips, detectors S2–S3, S7–S13, guardrail config | Strength visible in Account; batch review functional; 80% stop-rule verified |

Each phase is independently shippable. Feature flag `guidance_enabled` (+ per-consumer flags) for staged rollout.

## 9. Testing

- **Unit:** eligibility engine (every cap/cooldown rule), strength scoring (incl. new fields), tour controller sequencing (preActions, missing anchors, pause/resume).
- **Component:** SpotlightOverlay measurement/clamping, TooltipPlacement on small screens, PromptCard timers.
- **Manual E2E checklist per phase:** fresh signup → onboarding → hero tour → each contextual tour → trigger S1/S4/S5/S6 → verify caps by spamming searches → toggle personalization off → verify silence → reinstall → verify no replay.

## 10. Out of scope (future)

- ML-ranked prompt ordering and send-time optimization (current: static weights + caps).
- Server-side signal aggregation for cross-device behavioral confidence.
- In-tour interactive "try it now" tasks (e.g., guided first search) — candidate for v2 of the hero tour.
- Video/lottie feature spotlights in an updated "What's new" surface.
