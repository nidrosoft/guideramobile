# Guidera Launch Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make every high-traffic API, provider, AI-generation, notification, search, and social flow resilient enough for a 100k-user launch.

**Architecture:** Treat the hardened trip snapshot flow as the reference pattern: durable response caches, generation locks for request coalescing, DB-backed global rate limits, provider circuit breakers, deferred metrics, admin dashboards, and staged load tests. Generalize that pattern into shared backend primitives, then apply it surface by surface.

**Tech Stack:** React Native / Expo, Supabase JS, Supabase Edge Functions, Postgres RPCs, Clerk, external providers including Gemini, Anthropic, OpenAI, Google, SerpAPI, Amadeus, Kiwi, Viator, RapidAPI, Expo Push, Resend, Didit, Mapbox.

---

## Executive Summary

The trip snapshot feature is now the strongest reference implementation in the app. It has full-response caching, request coalescing, DB-backed rate limits, metrics, smoke tests, and staged load tests. Most other app surfaces do not yet have the same protections.

The highest-risk launch areas are:

1. **Trip detail AI plugins / Smart Plan**: six parallel AI generations with retry amplification and no server-side locks or global rate limits.
2. **Booking and provider search**: `provider-manager` fans out to SerpAPI, Kiwi, Booking/RapidAPI, Viator, and other providers without trip-snapshot-grade coalescing, provider timeouts, or rate buckets.
3. **Events and destination enrichment**: Gemini, SerpAPI, Imagen, and Google Places can be triggered by common home/detail surfaces without global coalescing.
4. **Connect, messaging, notifications, profile sync**: high write/read fan-out, schema/RLS drift risk, client-only message rate limits, and incomplete push dispatch wiring.
5. **Open or expensive Edge Functions**: many functions use service role internally and do not enforce JWT ownership, cron secrets, durable rate limits, or structured metrics.
6. **Direct client external API calls**: Google Places autocomplete and AR/navigation API calls can burn quota outside central controls.

This plan is intentionally phased. Do not try to harden all areas in one PR. Each phase should produce working, testable software and be deployed behind measured verification.

---

## Reference Pattern: Trip Snapshot

Use these files as the template for other systems:

| Capability | Reference |
|---|---|
| Full response cache | `supabase/functions/_shared/tripSnapshot/snapshotRuntime.ts` |
| Stable cache keys | `supabase/functions/_shared/tripSnapshot/snapshotScale.ts` |
| Generation locks / coalescing | `snapshot_try_acquire_lock`, `snapshot_release_lock` in `supabase/migrations/20260528_harden_trip_snapshot_scale.sql` |
| DB-backed rate limits | `snapshot_consume_rate_limit` in `supabase/migrations/20260528_harden_trip_snapshot_scale.sql` |
| Metrics | `snapshot_request_metrics`, `admin_snapshot_metrics()` |
| Client retries | `src/services/tripSnapshot.service.ts` |
| Load test harness | `scripts/load-test-trip-snapshot.mjs` |

When this document says "snapshot-style hardening", it means:

- Stable normalized cache key.
- Check durable response cache before provider calls.
- Acquire a durable generation lock before cold generation.
- Coalesce duplicate cold requests by waiting for the cache.
- Consume DB-backed rate-limit buckets only for lock owners or truly expensive work.
- Record structured metrics outside the hot response path where possible.
- Return cache hit / generated / coalesced / rate-limited status for observability.
- Add admin metrics and load tests before calling the phase done.

---

## Global Findings

### Critical Cross-Cutting Gaps

| Gap | Evidence | Risk |
|---|---|---|
| Shared rate limiter exists but is unused | `supabase/functions/_shared/rateLimiter.ts` is not imported by active functions | False sense of protection |
| Many Edge Functions trust body identity | Several functions accept `userId`, `user_id`, `tripId`, `claimId`, or `applicationId` and then use service role | Spoofing and data leakage if called directly |
| Cron/admin functions are publicly reachable unless guarded by deployment config | Functions such as `scheduled-jobs`, `deal-scanner`, `section-refresh`, `send-notification`, `repair-*` need explicit cron/service auth | Launch-day abuse or accidental batch storms |
| Client retries stack with server/provider retries | Smart Plan and booking paths can multiply calls under failure | Provider quota burn |
| No unified provider circuit breaker | `provider-manager` has health scoring but not a true open/half-open breaker | Repeated calls to failing/limited providers |
| Admin visibility is uneven | Snapshot has metrics; most features only log to console | Hard to operate at launch |
| Direct client calls bypass controls | `WhereSection` calls Google Places directly; AR/map services call proxies/external APIs from many places | Quota and key exposure risk |
| RLS/schema drift exists around Clerk and notifications | Several migrations use `auth.uid()` while app stores profile UUIDs; alerts/user_devices naming appears inconsistent | Silent notification/profile failures |

### Launch Risk Ranking

| Rank | Area | Risk |
|---:|---|---|
| 1 | Smart Plan and `generate-*` trip modules | Critical |
| 2 | Provider search / packages / flight and hotel searches | Critical |
| 3 | Events, destination details, destination image repair | Critical |
| 4 | Connect feed, messaging, notifications | Critical |
| 5 | Auth/profile sync and account summary | High |
| 6 | Homepage personalization and section refresh | High |
| 7 | Search autocomplete and discovery | High |
| 8 | AR vision, TTS, translation, Google proxy | High |
| 9 | Deals/deal scanner/affiliate tracking | High |
| 10 | Saved content and preferences | Medium-High |

---

## Complete Surface Inventory

### Home, Explore, Search, Deals, Events

| Surface | Key files | Backend/API path | Current hardening | Required hardening |
|---|---|---|---|---|
| Home bootstrap | `src/features/homepage/services/homepageService.ts`, `src/app/(tabs)/index.tsx` | `homepage`, `personalize-homepage`, `section-refresh`, `section_cache` | Section cache and client retry only | Cache personalized output, batch section refresh, add metrics/rate limits |
| Category pills | `src/components/features/home/CategoryPills.tsx` | Client-only filter | Safe | No backend hardening needed |
| Section view-all pages | `src/hooks/useSectionDestinations.ts`, `src/components/common/SectionViewAll.tsx` | Direct `curated_destinations` reads | No shared cache | Read `section_cache` first; add React Query stale cache |
| Search overlay autocomplete | `src/components/features/search/overlay/WhereSection.tsx` | Direct Google Places client fetch | 300ms debounce only | Route through `google-api-proxy`; rate-limit; cache common cities |
| Search results | `src/services/search.service.ts`, `src/app/search/results.tsx` | `curated_destinations`, `deal_cache` | No cache/retry | Fix schema alignment; full-text index; query cache |
| Trip snapshot | `src/app/search/snapshot.tsx`, `src/services/tripSnapshot.service.ts` | `trip-snapshot`, `trip-snapshot-brief` | Strong reference | Add brief-level coalescing and in-app device tests |
| Events feed | `src/hooks/useEvents.ts`, `src/services/events.service.ts`, `EventsSection.tsx` | `event-discovery`, `destination_events`, `repair-event-images` | DB cache inside EF, client retry | DB-first client read, generation locks, global Gemini/SerpAPI limits, metrics |
| Event detail | `src/app/events/[id].tsx` | `destination_events` | Single-row read | Low priority; ensure indexes |
| Destination detail | `src/app/destinations/[id].tsx` | `destination-details`, `event-discovery`, Google Places | 7-day cache inside EF | Locks, prewarm top destinations, metrics, provider circuit breaker |
| Deals feed | `src/hooks/useDeals.ts`, `src/services/deal/deal.service.ts`, `DealsSection.tsx` | `deal_cache`, `deal-scanner`, `compute-travel-dna` | Cache table only | Stop client-triggered scanner, rate-limit scanner, batch impression writes |
| Deal detail | `src/app/deals/[id].tsx` | `deal_cache`, `saved_deals`, `deal_clicks` | Single-row read | Batch analytics, idempotent save/click writes |

### Booking, Packages, Providers

| Surface | Key files | Backend/API path | Current hardening | Required hardening |
|---|---|---|---|---|
| Flight search | `src/features/booking/flows/flight/*`, `src/hooks/useProviderSearch.ts`, `src/services/flight.service.ts` | `provider-manager`, SerpAPI, Kiwi, Amadeus | `search_cache`, client retry | Booking locks, rate buckets, provider timeouts, circuit breaker |
| Hotel search | `src/features/booking/flows/hotel/*`, `src/services/hotel.service.ts` | `provider-manager`, SerpAPI, Booking/RapidAPI | `search_cache` | Same as flight search |
| Car search | `src/features/booking/flows/car/*`, `src/services/car.service.ts` | `provider-manager`, SerpAPI/RapidAPI | `search_cache` | Avoid synthetic stale results; rate-limit and cache |
| Experience search | `src/features/booking/flows/experience/*`, `src/services/localExperiences.service.ts` | `local-experiences`, `provider-manager`, Viator | Split backend path | Unify path, add Viator rate bucket/cache |
| Package build | `src/features/booking/flows/package/*` | Up to four provider-manager calls | Per-category cache only | Single package search action, bundle cache, lazy/progressive loading |
| Provider manager core | `supabase/functions/provider-manager/index.ts` | External provider fan-out | `search_cache`, provider logs | Snapshot-style coalescing/rate/metrics, hard fetch timeouts, circuit breaker |
| Legacy flight/hotel functions | `supabase/functions/flight-search/index.ts`, `hotel-search/index.ts` | Amadeus/Kiwi/Expedia | Token cache only | Lock down, rate-limit, or remove from public invoke path |
| Affiliate tracking | `src/services/affiliateTracking.ts`, `src/services/deal/*` | `affiliate_click_tracking`, `deal_clicks` | Fire-and-forget writes | Offline/retry queue, search session analytics |

### Trip Detail and AI Plugins

| Surface | Key files | Backend/API path | Current hardening | Required hardening |
|---|---|---|---|---|
| Trip detail hub | `src/app/trip/[id].tsx`, `src/features/trips/screens/TripDetailScreen/*` | `trips`, `trip_members`, Google cover fetch | Direct reads | Local trip detail cache, cover image dedupe |
| Smart Plan all modules | `ComprehensiveTripCard.tsx`, `SmartPlanBottomSheet.tsx`, `GenerationProgressOverlay.tsx` | Six `generate-*` calls | Client monthly count only | Server orchestrator, one job per trip, locks, global rate limits, metrics |
| Itinerary | `src/services/planner.service.ts`, `supabase/functions/generate-itinerary/index.ts` | Gemini/Claude + weather | Provider fallback only | Auth ownership, skip-if-ready, lock, async job |
| Packing | `src/services/packing.service.ts`, `generate-packing` | Gemini/Claude + weather | Deletes/regenerates system rows | Lock, idempotency, item caps |
| Safety | `src/services/safety.service.ts`, `generate-safety` | Gemini/Claude | Upsert only | Destination base cache + trip overlay |
| Do's and Don'ts | `generate-dos-donts`, `safety.service.ts` | Gemini/Claude | Deletes/regenerates tips | Destination+country cache |
| Language | `src/services/language.service.ts`, `generate-language` | Gemini/Claude | Deletes/regenerates phrases | Destination/language kit clone cache |
| Documents | `src/services/document.service.ts`, `generate-documents` | Gemini/Claude | Regenerate path outside Smart Plan | Server rate limit, nationality+destination template cache |
| Journal voice | `EntryEditorScreen.tsx`, `transcribe-audio` | OpenAI Whisper | Client retry only | Per-user audio rate limits, upload size caps |
| Expense summary | `src/services/expenseSummary.service.ts`, `generate-expense-summary` | Gemini/Claude | DB summary cache | Lock/coalesce by trip and expense version |
| Receipt scan | `src/services/receiptScanner.service.ts`, `scan-receipt` | Vision AI | Retry chain | Auth, image hash dedupe, per-user limits |
| Compensation | `src/services/compensation.service.ts`, `generate-compensation` | Gemini/Claude | None | Skip if recent, claim ownership, rate limit |
| Departure advisor | `src/services/departure/departure.service.ts`, `departure-advisor` | Google Maps + AeroDataBox | Local fallback | 15-30m advisory cache, provider rate metrics |
| Trip import / ticket scan | `trip-import-engine`, `scan-ticket`, import services | Email/Ticket parsing providers | Job polling partial | Auth ownership, scan hash dedupe, import rate limits |

### Connect, Profile, Account, Notifications

| Surface | Key files | Backend/API path | Current hardening | Required hardening |
|---|---|---|---|---|
| Auth/profile sync | `src/context/AuthContext.tsx`, `src/lib/clerk/profileSync.ts` | Clerk + `profiles` | AsyncStorage profile cache, retry | Single profile bootstrap RPC, sync coalescing, metrics |
| Account hub | `src/features/account/screens/AccountScreen.tsx`, account routes | Profile, saved, partner, prefs | No shared cache | Account summary RPC/cache |
| Connect hub | `src/features/community/screens/CommunityHubScreen.tsx`, `src/hooks/useCommunity.ts` | Groups/posts/activities/events | Raw parallel queries | Cursor pagination, lazy tabs, feed cache/rate limits |
| Messaging | `src/services/community/chat.service.ts`, chat screens | `chat_messages`, `direct_conversations`, alerts | Client-only rate limit | Server message rate limit, idempotency key, unread count fix |
| Notifications | `src/services/notifications/*`, `useNotifications.ts`, `send-notification` | `alerts`, `user_devices`, Expo Push | Partial dedup, pending queues | Schema/RLS alignment, cron dispatch, push metrics/backoff |
| Preferences | `src/services/preferences.service.ts`, `useTravelPreferences.ts` | `travel_preferences`, `user_interactions`, homepage personalization | No coalescing | Upsert-on-read RPC, batched interactions, personalization cache |
| Saved content | `src/services/saved.service.ts`, `useSaveDestination.ts`, saved routes | `saved_items`, `user_saved_items`, `saved_deals` | Optimistic writes | Unified saved model, idempotent save RPC, offline queue |
| Public profiles/travelers | traveler/buddy/guide screens | Profile/community tables | Direct reads | Visibility-filtered RPC, edge cache for traveler cards |

### AR, Safety, Voice, Utility Proxies

| Surface | Key files | Backend/API path | Current hardening | Required hardening |
|---|---|---|---|---|
| AI vision | `src/features/ar-navigation/plugins/ai-vision/*`, `ai-vision` | Gemini / Google Vision style providers | Client retry in some services | Auth, image size caps, rate limits, metrics |
| Gemini live token | `gemini-live-token`, `geminiLive.service.ts` | Gemini Live | In-memory rate map | DB-backed user/device token limits |
| TTS | `tts`, `voice.service.ts`, `tts.service.ts` | Google/OpenAI TTS | Direct fetch | Per-user limits and cache repeated text |
| Google API proxy | `google-api-proxy`, mapbox/google services | Maps/Vision/TTS/Translate proxy | No central rate bucket | Wire shared rate limiter and action-specific limits |
| Translation | `translation`, AR translation service | Google Translate | No cache/rate | Cache repeated phrases, rate-limit |
| Safety alerts | `safety-alerts`, safety APIs | Riskline, State Dept, GDACS | External cache in some services | Scheduled refresh + DB cache, not direct per-user calls |
| Crash/issue reports | `send-crash-report`, `notify-issue-report` | Resend email | No durable rate limit | Per-user/IP rate limit, spam guard |

---

## Phase 0: Launch Blockers and Security Gates

**Goal:** Stop obvious quota burn, spoofing, public cron abuse, and schema/RLS failures before more load testing.

### Task 0.1: Auth-Gate Cron, Admin, and Batch Edge Functions

**Files:**
- Create: `supabase/functions/_shared/cronAuth.ts`
- Modify: `supabase/functions/scheduled-jobs/index.ts`
- Modify: `supabase/functions/deal-scanner/index.ts`
- Modify: `supabase/functions/section-refresh/index.ts`
- Modify: `supabase/functions/send-notification/index.ts`
- Modify: `supabase/functions/repair-destination-images/index.ts`
- Modify: `supabase/functions/repair-event-images/index.ts`
- Modify: `supabase/functions/classify-destination/index.ts`
- Modify: `supabase/functions/discover-destinations/index.ts`

**Steps:**
- [ ] Add `requireCronOrServiceAuth(req)` that accepts either `Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY` or `x-cron-secret: CRON_SECRET`.
- [ ] Reject missing/invalid credentials with `401`.
- [ ] Deploy these functions and smoke test each authorized path.
- [ ] Add admin panel visibility for failed unauthorized calls.

**Acceptance criteria:**
- Public anon-key calls cannot trigger batch jobs.
- Scheduled jobs still run with `CRON_SECRET`.
- Admin/manual triggers use service role or explicit admin auth.

### Task 0.2: Remove Trusted Body Identity in Edge Functions

**Files:**
- Modify: `supabase/functions/_shared/auth.ts`
- Modify: `supabase/functions/homepage/index.ts`
- Modify: `supabase/functions/trip-import-engine/index.ts`
- Modify: `supabase/functions/scan-ticket/index.ts`
- Modify: `supabase/functions/chat-assistant/index.ts`
- Modify: `supabase/functions/gemini-live-token/index.ts`
- Modify: `supabase/functions/compute-travel-dna/index.ts`
- Modify: `supabase/functions/provider-manager/index.ts`
- Modify: `supabase/functions/search/index.ts`

**Steps:**
- [ ] Require Clerk/Supabase JWT for user-scoped work.
- [ ] Map Clerk `sub` to `profiles.id` server-side.
- [ ] Verify `tripId`, `claimId`, `applicationId`, and `conversationId` ownership before using service role writes.
- [ ] Remove or ignore body-provided `userId` except in service-role admin calls.

**Acceptance criteria:**
- A user cannot generate modules, scan tickets, check Didit status, or send chat messages for another user by changing request JSON.

### Task 0.3: Fix Notification and Clerk RLS/Schema Drift

**Files:**
- Create migration under `supabase/migrations/`
- Review migrations: `20260309_create_notification_infra.sql`, `20260310_fix_direct_conversations_rls.sql`, `20260503_fix_profiles_rls_clerk.sql`
- Modify services as needed: `src/services/notifications/notificationService.ts`, `src/hooks/useNotifications.ts`, community notification services

**Steps:**
- [ ] Confirm production columns for `alerts`, `user_devices`, `user_notification_preferences`, `direct_conversations`, and `chat_messages`.
- [ ] Align column names used by code: `alert_type_code` / `category_code` vs `type_code` / `category`, `push_token` vs `device_token`.
- [ ] Replace `auth.uid()` policies on profile-UUID-owned rows with the same Clerk-aware helper used by `profiles`.
- [ ] Add missing unique constraints for device token and notification preference rows.

**Acceptance criteria:**
- Real Clerk-authenticated users can insert/read alerts, devices, DMs, and preferences.
- Push tokens persist and are visible to notification dispatch functions.

### Task 0.4: Stop Client-Triggered Expensive Background Scans

**Files:**
- Modify: `src/services/deal/deal.service.ts`
- Modify: `src/features/homepage/services/homepageService.ts`
- Modify: `src/services/events.service.ts`

**Steps:**
- [ ] Remove or hard-gate client calls to `deal-scanner`.
- [ ] Batch `section-refresh` calls into a single refresh request or cron-only process.
- [ ] Make events DB-first: read `destination_events` directly before invoking `event-discovery`.

**Acceptance criteria:**
- Empty home/deal/event states do not cause every client to trigger provider/AI scans.

### Task 0.5: Move Google Places Autocomplete Behind Server Controls

**Files:**
- Modify: `src/components/features/search/overlay/WhereSection.tsx`
- Modify: `supabase/functions/google-api-proxy/index.ts` or `supabase/functions/places/index.ts`

**Steps:**
- [ ] Replace direct `maps.googleapis.com` client fetch with an edge function call.
- [ ] Add per-device/user/IP rate limits.
- [ ] Cache normalized city autocomplete results for short TTL.

**Acceptance criteria:**
- Mobile bundle no longer calls Google Places autocomplete directly.

---

## Phase 1: Shared Edge Scale Runtime

**Goal:** Generalize the trip snapshot hardening pattern so future features do not copy/paste one-off code.

### Task 1.1: Add Generic Edge Scale Tables and RPCs

**Files:**
- Create migration: `edge_scale_hardening`
- Create: `supabase/functions/_shared/edgeScale/rateLimit.ts`
- Create: `supabase/functions/_shared/edgeScale/locks.ts`
- Create: `supabase/functions/_shared/edgeScale/metrics.ts`
- Create: `supabase/functions/_shared/edgeScale/cache.ts`

**Database objects:**
- `edge_response_cache`
- `edge_generation_locks`
- `edge_rate_limit_buckets`
- `edge_request_metrics`
- `edge_consume_rate_limit(namespace, bucket_key, window_seconds, max_requests)`
- `edge_try_acquire_lock(namespace, lock_key, owner_id, ttl_seconds)`
- `edge_release_lock(namespace, lock_key, owner_id, status)`
- `admin_edge_metrics(p_hours, p_namespace)`

**Acceptance criteria:**
- New features can opt into cache/lock/rate/metrics by passing a namespace and stable key.
- Snapshot can either stay on its dedicated tables or be migrated later; do not break it in this phase.

### Task 1.2: Wire `_shared/rateLimiter.ts` or Delete It

**Files:**
- Modify or remove: `supabase/functions/_shared/rateLimiter.ts`

**Steps:**
- [ ] Replace its current count-on-`ai_generation_logs` implementation with `edge_consume_rate_limit`, or mark it deprecated and remove references from docs.
- [ ] Add tests for rate-limit key creation and failure behavior.

**Acceptance criteria:**
- There is no unused rate-limiter file implying protection that is not active.

### Task 1.3: Add Shared Provider Circuit Breaker

**Files:**
- Create: `supabase/functions/_shared/providers/circuitBreaker.ts`
- Modify: `supabase/functions/provider-manager/index.ts`
- Modify: `supabase/functions/_shared/providers/*.ts`

**Steps:**
- [ ] Track provider success/failure in `api_providers`.
- [ ] Open circuit after repeated 429/5xx/timeouts.
- [ ] Half-open after cooldown with one test request.
- [ ] Fall back to cached/stale data or alternate provider when open.

**Acceptance criteria:**
- A failing provider is skipped quickly without every user retrying it.

---

## Phase 2: Events, Destination Details, Homepage, Search

**Goal:** Harden the biggest read/discovery surfaces that every user touches.

### Task 2.1: Harden `event-discovery`

**Files:**
- Modify: `src/services/events.service.ts`
- Modify: `src/hooks/useEvents.ts`
- Modify: `supabase/functions/event-discovery/index.ts`
- Add admin API in GuideraAdminPanel if needed

**Steps:**
- [ ] Client reads `destination_events` first.
- [ ] `event-discovery` uses `edge_generation_locks` keyed by `city|country`.
- [ ] Cold generation consumes `events:user`, `events:destination`, and `events:global` buckets.
- [ ] Add `events_request_metrics`.
- [ ] Move image repair to cron/admin-only.

**Acceptance criteria:**
- 500 concurrent requests for the same city generate events once and coalesce the rest.

### Task 2.2: Harden `destination-details`

**Files:**
- Modify: `src/app/destinations/[id].tsx`
- Modify: `supabase/functions/destination-details/index.ts`

**Steps:**
- [ ] Add cache-first response return from `destination_detail_cache`.
- [ ] Add locks by destination id or normalized city/country.
- [ ] Add Google Places per-minute/global buckets.
- [ ] Prewarm top destinations from `curated_destinations`.

**Acceptance criteria:**
- Viral destination pages do not create parallel Google/Gemini calls on cold cache.

### Task 2.3: Harden Homepage and Sections

**Files:**
- Modify: `src/features/homepage/services/homepageService.ts`
- Modify: `src/hooks/useSectionDestinations.ts`
- Modify: `supabase/functions/homepage/index.ts`
- Modify: `supabase/functions/personalize-homepage/index.ts`
- Modify: `supabase/functions/section-refresh/index.ts`

**Steps:**
- [ ] Anonymous home reads `section_cache` without requiring `profile.id`.
- [ ] View-all section pages read `section_cache` first.
- [ ] Cache personalized section ordering by `user_id + section_cache_version`.
- [ ] Batch `user_interactions` writes.
- [ ] Batch or cron-only `section-refresh`.

**Acceptance criteria:**
- Homepage cold start remains useful even if personalization is unavailable.

### Task 2.4: Harden Search Results and Suggestions

**Files:**
- Modify: `src/services/search.service.ts`
- Modify: `src/app/search/results.tsx`
- Modify: `supabase/functions/search/index.ts` if still used

**Steps:**
- [ ] Fix schema alignment for `curated_destinations` fields/status.
- [ ] Add full-text or indexed search path.
- [ ] Cache popular query results in `search_cache`.
- [ ] Add search request metrics.

**Acceptance criteria:**
- Common search queries are served without repeated table scans.

---

## Phase 3: Booking and Provider Search

**Goal:** Make flight, hotel, car, experience, and package searches as protected as trip snapshot.

### Task 3.1: Harden `provider-manager`

**Files:**
- Modify: `supabase/functions/provider-manager/index.ts`
- Modify: `src/services/provider-manager.service.ts`
- Modify: `src/hooks/useProviderSearch.ts`
- Modify: `supabase/functions/_shared/providers/*.ts`

**Steps:**
- [ ] Normalize cache keys by category and search params.
- [ ] Check `search_cache` before provider calls.
- [ ] Acquire `booking:{category}:{cacheKey}` lock.
- [ ] Coalesce duplicate searches.
- [ ] Enforce `booking:user`, `booking:route`, `booking:provider`, and `booking:global` buckets.
- [ ] Add `AbortSignal.timeout` or equivalent to all provider fetches.
- [ ] Return stale cache on provider failures when safe.
- [ ] Record `booking_request_metrics`.

**Acceptance criteria:**
- 1,000 concurrent identical flight searches create one provider call group, not 1,000.

### Task 3.2: Harden Package Build

**Files:**
- Modify: `src/features/booking/flows/package/*`
- Modify: `supabase/functions/provider-manager/index.ts`

**Steps:**
- [ ] Add a single `package_search` action that runs internally with one bundle-level rate-limit key.
- [ ] Cache bundle results by destination/dates/travelers/categories.
- [ ] Load non-flight categories lazily or progressively.

**Acceptance criteria:**
- Package search does not create four independent provider-manager storms.

### Task 3.3: Clean Up Legacy Booking Functions

**Files:**
- Review: `supabase/functions/flight-search/index.ts`
- Review: `supabase/functions/hotel-search/index.ts`
- Review docs: `docs/DEAL_AGGREGATOR_ARCHITECTURE.md`

**Steps:**
- [ ] Confirm no active app path needs legacy functions.
- [ ] Auth-gate, rate-limit, or delete them.
- [ ] Remove unused client provider adapters if not part of the live architecture.

**Acceptance criteria:**
- There is no public expensive booking endpoint outside `provider-manager`.

---

## Phase 4: Trip Detail AI Modules and Smart Plan

**Goal:** Replace client-side six-function orchestration with durable server-side module orchestration.

### Task 4.1: Create Trip Module Scale Runtime

**Files:**
- Create: `supabase/functions/_shared/tripModule/auth.ts`
- Create: `supabase/functions/_shared/tripModule/runtime.ts`
- Create migration for `trip_module_request_metrics` or use generic `edge_request_metrics`

**Steps:**
- [ ] Verify trip ownership/membership before any module generation.
- [ ] Add module locks keyed by `tripId:module`.
- [ ] Add smart-plan lock keyed by `tripId:smart_plan`.
- [ ] Add per-user, per-trip, per-module, and global rate limits.

**Acceptance criteria:**
- Double-tapping Smart Plan from two devices cannot duplicate AI work.

### Task 4.2: Add Server-Side Smart Plan Orchestrator

**Files:**
- Create: `supabase/functions/smart-plan-generate/index.ts`
- Modify: `src/features/trips/components/TripCard/ComprehensiveTripCard.tsx`
- Modify: `src/features/trips/components/SmartPlanBottomSheet.tsx`
- Modify: `src/features/trips/components/GenerationProgressOverlay.tsx`

**Steps:**
- [ ] Client sends one request to start Smart Plan.
- [ ] Server orchestrates or queues module generation with bounded concurrency.
- [ ] Client polls or subscribes to `trips.generation_status`.
- [ ] Existing `generate-*` functions become internal module workers with auth and idempotency.

**Acceptance criteria:**
- Smart Plan cannot create retry-amplified 6x provider storms from the client.

### Task 4.3: Add Module-Specific Cache and Idempotency

**Files:**
- Modify all `supabase/functions/generate-*/index.ts`
- Modify module services in `src/services/*`

**Steps:**
- [x] Return cached ready module when `generation_status.module === 'ready'` and no `forceRefresh`.
- [x] Destination-level cache for shareable modules: language, dos/donts, base safety, documents.
- [x] Trip-level locks for personalized modules: itinerary, packing, expense summary, compensation.
- [x] Add metrics per module: model, duration, cache status, tokens if available, failure reason.

**Acceptance criteria:**
- Reopening a trip or pressing regenerate does not call an LLM unless explicitly needed and allowed.

### Task 4.4: Harden Scan and Voice AI Inputs

**Files:**
- Modify: `supabase/functions/scan-ticket/index.ts`
- Modify: `supabase/functions/scan-receipt/index.ts`
- Modify: `supabase/functions/transcribe-audio/index.ts`
- Modify: client services that send base64 payloads

**Steps:**
- [x] Enforce auth.
- [x] Enforce max payload size.
- [x] Add image/audio hash dedupe.
- [x] Add per-user hourly/day limits.

**Acceptance criteria:**
- Vision/audio endpoints cannot be abused with repeated large base64 payloads.

---

## Phase 5: Connect, Messaging, Notifications, Profile

**Goal:** Make social and account features solid under high concurrent usage.

### Task 5.1: Profile Bootstrap and Account Summary

**Files:**
- Modify: `src/context/AuthContext.tsx`
- Modify: `src/lib/clerk/profileSync.ts`
- Modify: `src/features/account/screens/AccountScreen.tsx`
- Add RPC/migration for profile bootstrap

**Steps:**
- [x] Replace multi-query profile sync with single idempotent RPC.
- [x] Cache account summary for a short TTL.
- [x] Add profile sync metrics.

**Acceptance criteria:**
- Login spikes do not create repeated profile insert/select races.

### Task 5.2: Connect Feed Hardening

**Files:**
- Modify: `src/hooks/useCommunity.ts`
- Modify: community service files under `src/services/community/`
- Add: `src/features/community/services/connectFeed.service.ts`
- Add backend RPCs/views as needed

**Steps:**
- [x] Add cursor pagination to feeds.
- [x] Lazy-load Connect tabs instead of fetching all on mount.
- [x] Cache feed results for 30-60 seconds.
- [x] Add connect read/write rate buckets.

**Acceptance criteria:**
- Opening Connect does not fan out 5+ uncached queries for every user.

**Progress notes:**
- 2026-05-28: Added client-side Connect Discover TTL cache with in-flight request dedupe; gated Groups and Events tab queries until those tabs are active; removed the dead Pulse activity subscription from hub open.
- 2026-05-28: Added official Connect launch seed foundations and remote seed content: labeled Guidera Team / Assistant / Ambassador profiles, 12 official starter groups, 13 pinned official posts, and 4 official upcoming events. Synthetic/system profiles are flagged for exclusion from buddy/live traveler surfaces.
- 2026-05-28: Cleaned remote Connect launch data by removing 7 pre-existing non-official/test groups and 1 orphan user event; official group cards now use fixed heights, January 2026 creation dates, and privacy-protected member-list copy instead of inflated/fake member counts.
- 2026-05-28: Added and deployed `connect_discover_feed` RPC with cursor inputs for groups, events, and destinations; Discover now loads its core feed through one cached bundled RPC and lazy-loads secondary personalized sections after scroll. Join success/request/error feedback now uses the app toast system instead of native device alerts.
- 2026-05-28: Added and deployed durable `connect_rate_buckets` plus `consume_connect_rate_limit`; `connect_discover_feed` now consumes read buckets server-side, and group, buddy, event, post, and live activity write services consume Connect write buckets before mutations.

### Task 5.3: Messaging Hardening

**Files:**
- Modify: `src/services/community/chat.service.ts`
- Modify: chat screens and Realtime channel logic
- Add migrations/RPCs as needed

**Steps:**
- [x] Add server-side message rate limits.
- [x] Add `client_message_id` idempotency.
- [x] Fix unread counts to avoid scanning all alerts.
- [x] Fix RLS for Clerk/profile UUID ownership.

**Acceptance criteria:**
- Chat spam protection works even if the client is modified.

**Progress notes:**
- 2026-05-28: Added `send_chat_message` RPC with Clerk/profile ownership checks, membership validation, per-user send buckets, idempotency keys, atomic conversation/chat counters, and `message_read_status` unread increments. Updated `chat.service.ts` to route sends through the RPC while preserving existing alert fanout.

### Task 5.4: Notification Pipeline Hardening

**Files:**
- Modify: `supabase/functions/send-notification/index.ts`
- Modify: `supabase/functions/scheduled-jobs/index.ts`
- Modify: `src/services/notifications/notificationService.ts`

**Steps:**
- [x] Wire cron for `process_scheduled` and `dispatch_pending`.
- [x] Add `notification_dispatch_metrics`.
- [x] Add Expo Push backoff and dead-letter handling.
- [x] Add user/global push rate buckets.

**Acceptance criteria:**
- Pending alerts actually dispatch and failures are visible in admin metrics.

**Progress notes:**
- 2026-05-28: Added `notification_dispatch_metrics`, `notification_dead_letters`, and `notification_rate_buckets`; deployed `send-notification` and `scheduled-jobs`; added scheduled job entry points for `notifications_process_scheduled`, `notifications_dispatch_pending`, and `notifications_all`.
- 2026-05-28: Normalized Connect social notification writers to create `pending` alerts with `channels_requested`, priority, and dedupe context; removed direct `send_push_to_users` calls from group, event, buddy, and activity flows so the dispatcher owns push delivery. Wired event-created alerts for group members.

### Task 5.5: Saved, Preferences, and Interaction Write Batching

**Files:**
- Modify: `src/services/saved.service.ts`
- Modify: `src/hooks/useSaveDestination.ts`
- Modify: `src/services/preferences.service.ts`
- Modify: `src/features/homepage/services/homepageService.ts`

**Steps:**
- [x] Consolidate saved tables or provide one RPC/view.
- [x] Add idempotent save/unsave RPCs.
- [x] Batch `user_interactions` writes.
- [x] Add offline queue support for save toggles and preferences.

**Acceptance criteria:**
- Scroll/save/preference behavior does not create avoidable DB write storms.

**Progress notes:**
- 2026-05-28: Added `saved_content_unified` security-invoker view, unique saved-content indexes, and `toggle_saved_content` RPC that performs save/unsave plus interaction recording in one call. Updated destination and homepage save toggles to use the RPC; homepage interaction tracking already batches high-volume view/share events client-side.
- 2026-05-28: Wired saved toggles and preference updates into the existing AsyncStorage-backed offline sync queue; preference writes now upsert on `user_id` instead of failing when a row has not been created yet.

---

## Phase 6: AR, Voice, Safety, Utility Proxies

**Goal:** Put all device-facing external API calls behind consistent quota controls.

### Task 6.1: Harden Google API Proxy and Places

**Files:**
- Modify: `supabase/functions/google-api-proxy/index.ts`
- Modify: `supabase/functions/places/index.ts`
- Modify: `src/features/ar-navigation/services/*`
- Modify: `src/components/features/search/unified/*`

**Steps:**
- [x] Add action-specific limits: autocomplete, details, vision, maps, translate.
- [x] Cache low-risk repeated requests.
- [x] Add metrics by action and provider.

**Acceptance criteria:**
- Google quota use is centrally visible and rate-limited.

**Progress notes:**
- 2026-05-28: Added shared Phase 6 Edge helpers for action-specific durable rate limits, stable cache keys, payload caps, deferred metrics, and provider/action metric rows. Hardened `google-api-proxy` and `places` with durable quota buckets, low-risk response caching, per-action metrics, safer photo proxy handling, and GET support for proxied place-photo URLs.

### Task 6.2: Harden TTS, Gemini Live Token, AI Vision, Translation

**Files:**
- Modify: `supabase/functions/tts/index.ts`
- Modify: `supabase/functions/gemini-live-token/index.ts`
- Modify: `supabase/functions/ai-vision/index.ts`
- Modify: `supabase/functions/translation/index.ts`

**Steps:**
- [x] Add JWT auth where user-specific.
- [x] Add per-user/device rate buckets.
- [x] Add request size caps.
- [x] Cache repeated TTS/translation responses where practical.

**Acceptance criteria:**
- AR/voice features cannot burn AI/Google quotas from uncontrolled repeated calls.

**Progress notes:**
- 2026-05-28: Hardened TTS, Gemini Live token, AI Vision, and Translation with auth-gated access, shared per-user durable rate buckets, request payload caps, action/provider metrics, cached TTS/translation responses where practical, and removed Gemini Live token prefix logging.

### Task 6.3: Safety External Data Refresh

**Files:**
- Modify: `supabase/functions/safety-alerts/index.ts`
- Modify: safety API services under `src/services/safety/apis/`

**Steps:**
- [x] Prefer scheduled refresh into DB cache over user-triggered external fetches.
- [x] Add stale cache fallback.
- [x] Add provider failure metrics.

**Acceptance criteria:**
- Safety screens remain useful when Riskline/GDACS/State Dept endpoints are slow.

**Progress notes:**
- 2026-05-28: Hardened `safety-alerts` with cache-first reads from `edge_response_cache` (6h TTL), durable `safety_destination` rate buckets, 6s timeouts on Riskline + US State Dept fetches, a stale-cache fallback (`getStaleEdgeCache`) when provider assembly fails, and per-action provider metrics. Added tested pure helpers `resolveSafetyCountryCode`/`chooseSafetyResult`. Deployed and verified live: cold `miss` (~2.3s) → warm cache `hit` (286ms), plus `miss`/`hit`/`error` metric rows and a live cache row in the DB.

---

## Phase 7: Admin Visibility and Load Testing

**Goal:** Prove hardening with dashboards and repeatable load tests.

### Task 7.1: Admin Metrics

**Files:**
- Modify GuideraAdminPanel APIs under `/Users/blackpanther/Desktop/GuideraAdminPanel/src/app/api/`
- Modify GuideraAdminPanel pages under `/Users/blackpanther/Desktop/GuideraAdminPanel/src/app/(dashboard)/dashboard/`

**Metrics to expose:**
- Cache hit rate by namespace.
- Generated/coalesced/rate-limited/error counts.
- p50/p95/p99 latency.
- Provider error rates and circuit state.
- Queue depth and oldest job age.
- AI spend/token estimates by module.
- Push backlog and Expo failures.
- Top destinations/searches/events/provider routes.

**Acceptance criteria:**
- Admin panel can answer: "What is failing, what is expensive, and what is overloaded right now?"

**Progress notes:**
- 2026-05-29: Added `admin_edge_observability(p_minutes)` security-definer RPC (migration `20260529060000`) aggregating cache hit rate + p50/p95/p99 + rate-limited/error counts by edge namespace, provider error rates/cost from `provider_logs`, scheduled + notification queue depth and oldest-pending age, and push backlog/failures/dead letters. Granted to `service_role` only (not `anon`). Wired an `observability` action into the admin `infrastructure` API and a new "Observability" tab with window selector, top-line health cards, an edge-namespace table, and a provider-routes table. Verified live (RPC returns real `phase6_*` namespace metrics) and admin panel typechecks clean.

### Task 7.2: Load Test Harnesses

**Files:**
- Existing: `scripts/load-test-trip-snapshot.mjs`
- Create: `scripts/load-test-provider-manager.mjs`
- Create: `scripts/load-test-event-discovery.mjs`
- Create: `scripts/load-test-homepage.mjs`
- Create: `scripts/load-test-smart-plan.mjs`
- Create: `scripts/load-test-connect.mjs`

**Test stages:**
- 100 requests.
- 500 requests.
- 1,000 requests.
- 10,000 requests with 1,000 local workers or cloud-distributed workers.
- Mixed hot/cold cache ratios.
- Same-key concurrency tests for coalescing.
- Multi-region test when using cloud workers.

**Acceptance criteria:**
- Each hardened domain has a reproducible load report with success rate, cache hit rate, generated count, coalesced count, rate-limited count, p95/p99 latency, and backend metrics comparison.

**Progress notes:**
- 2026-05-29: Extracted a shared `scripts/lib/loadHarness.mjs` runner (configurable requests/concurrency, hot/cold ratio, `--same-key` for coalescing tests, retries with backoff, status + cache-header tallies, p50/p95/p99 latency, JSON report). Refactored `load-test-trip-snapshot.mjs` onto it and added `load-test-provider-manager.mjs`, `load-test-event-discovery.mjs`, `load-test-homepage.mjs`, `load-test-smart-plan.mjs`, and `load-test-connect.mjs`. Auth-scoped domains accept `LOAD_TEST_BEARER`/`LOAD_TEST_TRIP_ID`/`LOAD_TEST_USER_ID` for meaningful authenticated runs. Verified live with small loads: connect feed 10/10 `200`, trip-snapshot 6/6 `200` with `generated`/`hit` cache tallies, homepage reported its `401` auth gate cleanly.

---

## Phase 8: Admin Control Enablement (post-hardening gap closure)

**Goal:** Give the GuideraAdminPanel real operational control over the systems the hardening added, and close the security gap on admin APIs. All new server logic is `security definer` RPCs in the Guidera Supabase project, granted to `service_role` only (revoked from `public`, `anon`, and `authenticated`) so regular app users cannot reach them via PostgREST.

### Task 8.0: Admin API authentication (P0)
- [x] Gate all `/api/*` (except `/api/auth/*`) behind an authenticated admin session in `middleware.ts` (session + `admin_users` whitelist; JSON 401/403 for APIs, redirect for dashboard).
- [x] Add explicit `requireAdmin()` to the destructive mutation routes (community, notifications, infrastructure).

**Acceptance criteria:**
- Admin data/mutation endpoints are not reachable without a valid admin session.

### Task 8.1: Connect official-content management (P1)
**Files:** `supabase/migrations/20260529070000_admin_connect_official_content.sql`, admin `api/community/route.ts`, admin `dashboard/community/page.tsx`
- [x] RPCs to create/edit official groups, events, and pinned posts (auto `is_official`/`origin='official'`, authored by a labeled system profile, tracked in a seed batch).
- [x] `admin_list_connect_authors` for the system-account author dropdown.
- [x] Admin UI: "Create Official Group/Event/Post" + edit group/event + pin/unpin post.

**Acceptance criteria:**
- Official Connect content can be created/edited from the admin panel without hand-written SQL, and stays excluded from real-traveler surfaces.

### Task 8.2: Notification dead-letter control (P2)
**Files:** `supabase/migrations/20260529080000_admin_notification_dead_letters.sql`, admin `api/notifications/route.ts`, admin `dashboard/notifications/page.tsx`
- [x] RPCs: list/stats, retry (re-queue alert to `pending`), resolve, retry-all.
- [x] Admin UI: "Dead Letters" tab with retry/resolve/retry-all + "Run Dispatcher".

**Acceptance criteria:**
- Failed pushes are visible and re-deliverable from the admin panel.

### Task 8.3: Launch guardrails (P3)
**Files:** `supabase/migrations/20260529090000_admin_guardrails.sql`, admin `api/infrastructure/route.ts`, admin `dashboard/infrastructure/page.tsx`
- [x] RPCs: guardrails overview, purge edge response cache by namespace, reset edge/connect rate buckets.
- [x] Admin UI: "Guardrails" tab to inspect/purge cache and reset limiters.

**Acceptance criteria:**
- Operators can flush bad cache or relax a limiter on launch day from the admin panel.

**Progress notes:**
- 2026-05-29: Implemented P0–P3. 17 new `security definer` admin RPCs, all granted to `service_role` only and verified clear of security advisors (`authenticated`/`anon` execute revoked). Admin panel typechecks clean. App (mobile) API side unchanged — admin-created content reuses the existing `origin='official'`/`seed_batch_id` convention the app already understands. Not yet deployed (admin panel) — migrations applied live to the Guidera project and saved as files.

---

## Implementation Order

Use this order unless a production bug forces a different priority.

1. **Phase 0.1 / 0.2 / 0.3:** Auth, cron, identity, RLS/schema safety.
2. **Phase 1.1:** Generic edge scale runtime.
3. **Phase 2.1:** Events hardening.
4. **Phase 2.2:** Destination details hardening.
5. **Phase 3.1:** Provider-manager hardening.
6. **Phase 4.1 / 4.2:** Smart Plan orchestrator and trip module runtime.
7. **Phase 5.4:** Notification dispatch pipeline.
8. **Phase 5.2 / 5.3:** Connect and messaging.
9. **Phase 2.3 / 2.4:** Homepage and search.
10. **Phase 6:** AR/voice/safety utilities.
11. **Phase 7:** Full dashboard and load-test suite.

Reasoning: secure the open/expensive surfaces first, then build shared primitives, then apply them to the highest fan-out and highest-cost launch paths.

---

## Hardening Acceptance Checklist

Before any phase is considered complete:

- [ ] New server code has tests for cache keys, lock behavior, rate-limit decisions, and error paths.
- [ ] Expensive provider calls are never made before checking cache and lock state.
- [ ] Duplicate concurrent requests for the same key coalesce or return a controlled retry response.
- [ ] Server-side auth verifies ownership for user/trip/claim/application scoped resources.
- [ ] Rate limits are durable across Edge Function isolates.
- [ ] Provider timeouts are enforced.
- [ ] Circuit breaker behavior is visible and testable.
- [ ] Admin metrics exist before load testing.
- [ ] Load tests include hot cache, cold cache, and duplicate-key concurrency.
- [ ] Mobile UI handles `429`, `503`, stale cache, and retry-after gracefully.
- [ ] No client-side direct external API call remains for high-cost providers unless explicitly approved.

---

## Files Most Likely to Change

### Shared Backend

- `supabase/functions/_shared/auth.ts`
- `supabase/functions/_shared/rateLimiter.ts`
- `supabase/functions/_shared/tripSnapshot/snapshotRuntime.ts`
- `supabase/functions/_shared/tripSnapshot/snapshotScale.ts`
- New `supabase/functions/_shared/edgeScale/*`
- New `supabase/functions/_shared/cronAuth.ts`
- New migrations under `supabase/migrations/`

### Highest-Risk Edge Functions

- `supabase/functions/provider-manager/index.ts`
- `supabase/functions/event-discovery/index.ts`
- `supabase/functions/destination-details/index.ts`
- `supabase/functions/generate-itinerary/index.ts`
- `supabase/functions/generate-packing/index.ts`
- `supabase/functions/generate-safety/index.ts`
- `supabase/functions/generate-dos-donts/index.ts`
- `supabase/functions/generate-language/index.ts`
- `supabase/functions/generate-documents/index.ts`
- `supabase/functions/generate-compensation/index.ts`
- `supabase/functions/generate-expense-summary/index.ts`
- `supabase/functions/scan-ticket/index.ts`
- `supabase/functions/scan-receipt/index.ts`
- `supabase/functions/transcribe-audio/index.ts`
- `supabase/functions/google-api-proxy/index.ts`
- `supabase/functions/places/index.ts`
- `supabase/functions/send-notification/index.ts`
- `supabase/functions/scheduled-jobs/index.ts`
- `supabase/functions/deal-scanner/index.ts`

### Highest-Risk Client Surfaces

- `src/features/trips/components/TripCard/ComprehensiveTripCard.tsx`
- `src/features/trips/components/SmartPlanBottomSheet.tsx`
- `src/services/planner.service.ts`
- `src/services/packing.service.ts`
- `src/services/safety.service.ts`
- `src/services/language.service.ts`
- `src/services/document.service.ts`
- `src/services/compensation.service.ts`
- `src/services/expenseSummary.service.ts`
- `src/services/provider-manager.service.ts`
- `src/hooks/useProviderSearch.ts`
- `src/services/events.service.ts`
- `src/hooks/useEvents.ts`
- `src/features/homepage/services/homepageService.ts`
- `src/hooks/useSectionDestinations.ts`
- `src/components/features/search/overlay/WhereSection.tsx`
- `src/services/community/chat.service.ts`
- `src/hooks/useCommunity.ts`
- `src/services/notifications/notificationService.ts`
- `src/context/AuthContext.tsx`
- `src/lib/clerk/profileSync.ts`

---

## Notes for Future Implementation

- Keep trip snapshot stable while extracting shared patterns. It is the working reference.
- Prefer DB-first and cache-first paths over more retries.
- Do not add more client-side retries to compensate for missing server controls.
- Treat every LLM, image, OCR, TTS, maps, search, and provider call as billable.
- Use service role only after verifying user ownership in the Edge Function.
- Any endpoint that can spend money must have auth, durable rate limits, metrics, and a load test.
- Any endpoint that can fan out to multiple providers must have coalescing and circuit breakers.
- Any endpoint that writes user data under launch load should be idempotent.

