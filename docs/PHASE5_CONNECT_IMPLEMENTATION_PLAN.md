# Phase 5 Connect Implementation Plan

> **For agentic workers:** Implement this plan in slices. Do not mix all phases in one change. Each slice must be tested, deployed or applied remotely when it includes backend work, then smoke tested in the simulator.

**Goal:** Make Connect launch-ready with a fast Discover feed, official starter communities, reliable notifications, hardened messaging, and batched saved/preference interactions.

**Architecture:** Treat Connect as two layers: a fast read-optimized discovery surface and a safer write/notification/messaging backend. Use clearly labeled system/official content to avoid an empty launch experience, never undisclosed fake human profiles. Use Supabase RPCs/migrations for shared server-side ownership, pagination, rate limits, idempotency, and metrics.

**Tech Stack:** React Native / Expo, Supabase JS, Supabase Postgres RPC/RLS, Supabase Edge Functions, Expo Push, Clerk profile UUIDs.

---

## Dependency Order

1. **5.2A Connect Feed Hardening**
   - Lazy-load non-active tabs.
   - Add 30-60s cache around Discover feed reads.
   - Stop duplicate group/event/Pulse reads on Connect open.
   - Prepare cursor-friendly service shapes without changing every screen at once.

2. **5.2B Official Launch Seed Foundations**
   - Add metadata for official/system content.
   - Seed Guidera Team / AI Assistant / Community Ambassador profiles.
   - Seed official starter groups, pinned posts, and upcoming official events.
   - Keep synthetic content visibly labeled and exclude it from buddy/live-map deception paths.

3. **5.4 Notification Pipeline Hardening**
   - Normalize social alerts into pending dispatch where possible.
   - Wire scheduled/pending dispatch.
   - Add metrics, backoff, dead-letter rows, and push rate buckets.

4. **5.3 Messaging Hardening**
   - Add server-side message send RPC.
   - Add `client_message_id` idempotency.
   - Replace DM unread alert scans with thread/read-state summaries.
   - Enforce conversation/room membership server-side.

5. **5.5 Saved, Preferences, Interaction Batching**
   - Align `saved_posts` with the broader saved model.
   - Add idempotent save RPCs and batch interaction writes.
   - Keep offline queue behavior scoped and observable.

---

## Slice 1: 5.2A Feed Hardening

**Files:**
- Modify: `src/features/community/screens/CommunityHubScreen.tsx`
- Modify: `src/features/community/components/DiscoverFeed.tsx`
- Modify: `src/hooks/useCommunity.ts`
- Create: `src/features/community/services/connectFeedCache.ts`
- Test: `__tests__/unit/features/community/connectFeedCache.test.ts`

**Implementation:**
- Add a small TTL cache helper with `get`, `set`, `getOrSet`, and `clearPattern`.
- Use cache in `DiscoverFeed.fetchAllData`.
- Remove `DiscoverFeed` full refetch on every focus; refresh only when cache is stale or user pulls to refresh.
- Remove unused `usePendingBuddyRequests` from `CommunityHubScreen`.
- Gate `useGroups` and `useUpcomingEvents` with `enabled` flags so they run only when the relevant tab is selected.
- Remove `useNearbyActivities(userId, null)` from hub because it cannot fetch and still subscribes globally.
- Keep message and notification badges for now; they move in 5.3/5.4.

**Verification:**
- Unit test TTL cache hit/miss/expiry.
- App typecheck.
- Simulator: open Connect, switch tabs, pull-to-refresh, return to Discover.

---

## Slice 2: 5.2B Official Seed Foundations

**Files:**
- Create migration: `supabase/migrations/<timestamp>_connect_official_seed_foundations.sql`
- Create: `supabase/seeds/connect_launch_v1.sql`
- Create: `docs/CONNECT_LAUNCH_SEED.md`
- Modify: `package.json` with a local seed script if safe.

**Implementation:**
- Add `profiles.profile_kind`, `profiles.is_synthetic`, `profiles.synthetic_label`.
- Add `groups.is_official`, `groups.seed_rank`, `groups.origin`.
- Add `community_posts.origin`, `community_posts.seed_rank`.
- Add `community_events.origin`, `community_events.seed_rank`.
- Add `seed_batches` and `seeded_entities` audit tables.
- Seed only labeled official/system actors.
- Seed official starter groups and posts across regions/interests.
- Seed upcoming official events, not fake live Pulse meetups.

**Verification:**
- Remote SQL count queries.
- Simulator: Discover and Groups show starter content.

---

## Slice 3: 5.4 Notifications

**Files:**
- Modify: `supabase/functions/send-notification/index.ts`
- Modify: `supabase/functions/scheduled-jobs/index.ts`
- Modify: `src/services/notifications/notificationService.ts`
- Modify: social notification helpers under `src/services/community/` and `src/services/notifications/community-notifications.ts`
- Create migration for `notification_dispatch_metrics` and dead-letter table.

**Implementation:**
- Wire `process_scheduled` and `dispatch_pending`.
- Record dispatch metrics.
- Add Expo push backoff/dead-letter handling.
- Add user/global push rate buckets.
- Normalize social alert statuses so unread/list behavior is consistent.

---

## Slice 4: 5.3 Messaging

**Files:**
- Modify: `src/services/community/chat.service.ts`
- Modify: chat screens and realtime logic.
- Add migration/RPC for message send, read state, and idempotency.

**Implementation:**
- Add `client_message_id`.
- Add server-side `send_chat_message`.
- Add server-side rate limits.
- Fix unread counts.
- Enforce RLS/membership.

---

## Slice 5: 5.5 Saved And Interaction Batching

**Files:**
- Modify: `src/services/saved.service.ts`
- Modify: `src/services/preferences.service.ts`
- Modify relevant Connect/post save paths.
- Add RPC/migration as needed.

**Implementation:**
- Add idempotent saved item RPC.
- Batch user interaction writes.
- Avoid separate saved models drifting further.
