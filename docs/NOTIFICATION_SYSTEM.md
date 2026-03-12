# Guidera — Notification System Implementation Plan

> **Total: 38 notification touchpoints across 5 implementation phases**
> **Estimated effort: 2-3 days**

---

## Existing Infrastructure (Already Built)

| Component | Location | Status |
|-----------|----------|--------|
| NotificationService (singleton) | `src/services/notifications/notificationService.ts` | ✅ Built — expo-notifications, permissions, token mgmt, local scheduling, preferences, badge |
| Alert Types Registry (17 types) | `src/services/realtime/types/alert.types.ts` | ✅ Built — flight_delay, gate_change, trip_reminder, price_drop, sos, etc. |
| AlertService | `src/services/realtime/alerts/alert.service.ts` | ✅ Built — template engine, user prefs, CRUD |
| Trip Lifecycle Notifications | `src/services/trip/trip-lifecycle.service.ts` | ✅ Built — schedules jobs for trip confirmed/reminder/started/completed/cancelled |
| Price Alert Service | `src/services/deal/price-alert.service.ts` | ✅ Built — CRUD for price alerts |
| Scheduled Jobs Edge Function | `supabase/functions/scheduled-jobs/index.ts` | ✅ Built — deal scan, price alert check, trip transitions |
| Notification Settings Screen | `src/app/account/notifications.tsx` | ✅ Built — UI for toggling categories |
| Community Notifications Screen | `src/features/community/screens/NotificationsScreen.tsx` | ⚠️ Mock data only |

### Known Gaps in Existing Code

| Gap | Location |
|-----|----------|
| Push token never sent to backend | `notificationService.ts:154` — `// TODO: Send token to backend` |
| Deep link navigation not implemented | `notificationService.ts:366` — `// TODO: Navigate to deep link` |
| `NotificationService.init()` never called | Not invoked in `_layout.tsx` |
| No Supabase Realtime channels | Zero usage of `supabase.channel()` anywhere |
| No `user_devices` table | Token only in AsyncStorage, never persisted to server |
| Community notifications 100% mock | Hardcoded array in `NotificationsScreen.tsx` |
| Chat 100% mock | No Realtime channels |
| Departure Advisor has no scheduled push | No "time to leave" notification |

---

## PHASE 1: Core Infrastructure Wiring

> **Goal:** Make push notifications actually work end-to-end. Initialize the service, persist push tokens to the server, handle deep link navigation on notification tap.

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/20260309_create_notification_infra.sql` | Create `user_devices`, ensure `alerts` table exists with proper schema |
| `supabase/functions/send-notification/index.ts` | Edge function: reads pending alerts, looks up push tokens, sends via Expo Push API, marks delivered |
| `src/hooks/useNotifications.ts` | React hook: subscribe to alerts, manage unread counts, handle notification permissions |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/_layout.tsx` | Call `notificationService.init()` + `requestPermissions()` on app boot |
| `src/services/notifications/notificationService.ts` | Wire `registerForPushNotifications()` to upsert token into `user_devices` table; wire deep link handler to use `router.push()` |

### Notifications Covered

- [x] N/A (infrastructure only — enables all 38 notifications)

### Acceptance Criteria

- [ ] App requests notification permission on first launch
- [ ] Push token saved to `user_devices` table in Supabase
- [ ] `send-notification` edge function can send a push via Expo Push API
- [ ] Tapping a notification navigates to the correct deep link screen

---

## PHASE 2: In-App Notification Center

> **Goal:** Build the notification bell + unread badge on the home screen, and a full notification center screen that reads from the `alerts` table with Realtime subscription for live updates.

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/features/notifications/NotificationBell.tsx` | Bell icon with unread badge count, subscribes to Realtime |
| `src/components/features/notifications/NotificationItem.tsx` | Reusable notification row: icon, title, body, time, read/unread |
| `src/hooks/useRealtimeAlerts.ts` | Supabase Realtime subscription for `alerts` table changes |
| `src/app/notifications/index.tsx` | Full notification center screen (all categories, filterable) |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/(tabs)/index.tsx` | Add `NotificationBell` to home header (replace removed hardcoded badge) |
| `src/features/community/screens/NotificationsScreen.tsx` | Replace mock data with real `alerts` query filtered by `social` category |

### Notifications Covered

| # | Notification | Type |
|---|-------------|------|
| 38 | Account security alert | system |

### Acceptance Criteria

- [ ] Bell icon shows accurate unread count from DB
- [ ] Unread count updates in real-time when new alert arrives
- [ ] Notification center shows all alerts grouped by date
- [ ] Tapping a notification marks it as read and navigates to action URL
- [ ] Community notifications screen shows real data

---

## PHASE 3: Trip Notification Scheduling

> **Goal:** Schedule all trip-related notifications — from trip confirmation through post-trip feedback. This covers the largest batch (20 notifications) including packing reminders, departure advisor, check-in, and hotel reminders.

### Files to Create

| File | Purpose |
|------|---------|
| `src/services/notifications/trip-notification-scheduler.ts` | Centralized scheduler: creates all trip notification schedules on trip confirm/update |

### Files to Modify

| File | Change |
|------|--------|
| `src/services/trip/trip-lifecycle.service.ts` | Wire existing scheduled_jobs to trigger `send-notification` edge function |
| `src/features/trips/components/DepartureAdvisor/DepartureAdvisorSheet.tsx` | Add "Set Reminder" button that schedules local push at `leaveByTime` and 30 min before |
| `src/features/trips/plugins/packing/screens/PackingScreen.tsx` | Schedule packing reminder 3 days before trip |
| `src/features/trips/plugins/dos-donts/screens/DosDontsScreen.tsx` | Schedule dos/donts review reminder 2 days before |

### Notifications Covered

| # | Notification | Trigger | Channel |
|---|-------------|---------|---------|
| 1 | Trip confirmed | On confirm | Push + In-app |
| 2 | 7 days before trip | Scheduled | Push + In-app |
| 3 | 1 day before trip | Scheduled | Push + In-app |
| 4 | Trip started (day of) | Automatic | Push + In-app |
| 5 | Trip completed | Automatic | Push + In-app |
| 6 | Trip cancelled | Immediate | Push + In-app |
| 7 | Trip invite received | Immediate | Push + In-app + Email |
| 8 | Review request (2 days after) | Scheduled | Push + In-app |
| 9 | Traveler joined your trip | Immediate | Push + In-app |
| 10 | Itinerary changed by co-traveler | Immediate | Push + In-app |
| 14 | Check-in open (24h before flight) | Scheduled | Push |
| 15 | Hotel check-in today | Scheduled | Push |
| 16 | Booking confirmed | Immediate | Push + In-app + Email |
| 17 | Booking cancelled | Immediate | Push + In-app + Email |
| 18 | "Time to leave for airport" | Scheduled (departure advisor) | Push (high priority) |
| 19 | "30 min until you should leave" | Scheduled | Push |
| 20 | "How was our prediction?" | Scheduled (after flight departs) | Push + In-app |
| 21 | "Start packing! Trip in 3 days" | Scheduled | Push |
| 22 | "Packing incomplete — X items left" (1 day) | Scheduled | Push |
| 23 | "Review Do's & Don'ts for [destination]" | Scheduled | Push |
| 24 | "Check travel documents" (3 days before) | Scheduled | Push |

### Acceptance Criteria

- [ ] Confirming a trip schedules all pre-trip notifications (7d, 3d, 2d, 1d)
- [ ] Departure advisor "Set Reminder" schedules push at leave-by time
- [ ] Packing reminder fires 3 days before trip with incomplete item count
- [ ] Check-in reminder fires 24h before each flight in the trip
- [ ] Post-trip feedback request fires 2 days after trip ends
- [ ] All notifications have correct deep links to relevant screens

---

## PHASE 4: Real-Time Channels & External Alerts

> **Goal:** Wire real-time flight tracking to push, dispatch price drop alerts as push notifications, and implement Supabase Realtime for community chat.

### Files to Create

| File | Purpose |
|------|---------|
| `src/services/realtime/channels/chat.channel.ts` | Supabase Realtime subscription for group chat messages |
| `src/services/realtime/channels/alerts.channel.ts` | Supabase Realtime subscription for user's alerts table |

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/flight-tracking/index.ts` | After detecting delay/cancel/gate change → insert into `alerts` table → trigger `send-notification` |
| `supabase/functions/scheduled-jobs/index.ts` | Wire `checkPriceAlerts()` to trigger `send-notification` after inserting alert; add `process_flight_alerts` job |
| `src/features/community/screens/ChatScreen.tsx` | Subscribe to Realtime channel for messages |
| `src/features/community/screens/CommunityHubScreen.tsx` | Subscribe for group event notifications |
| `src/features/community/screens/LiveMapScreen.tsx` | Subscribe for buddy proximity alerts |

### Notifications Covered

| # | Notification | Trigger | Channel |
|---|-------------|---------|---------|
| 11 | Flight delay detected | Real-time (AeroDataBox) | Push + SMS |
| 12 | Flight cancelled | Real-time | Push + SMS + Email |
| 13 | Gate change | Real-time | Push |
| 25 | Price drop on watched route | Background check | Push + In-app |
| 26 | Flash deal for destination | Background (GIL) | Push |
| 27 | Target price reached | Background | Push |
| 28 | Saved deal price changed | Background | In-app |
| 29 | New message in group chat | Real-time | Push + In-app |
| 30 | Join request to your group | Immediate | Push + In-app |
| 31 | Join request approved/denied | Immediate | Push + In-app |
| 32 | Event created in your group | Immediate | Push + In-app |
| 33 | Travel buddy nearby | Real-time (location) | Push |
| 34 | New follower / connection request | Immediate | Push + In-app |
| 35 | Travel advisory for destination | Immediate | Push + Email |
| 36 | Weather alert at destination | Real-time | Push |
| 37 | SOS activated by co-traveler | Immediate | Push + SMS |

### Acceptance Criteria

- [ ] Flight delay triggers push within 60 seconds of detection
- [ ] Price drop alert fires as push when price drops below threshold
- [ ] Chat messages appear in real-time without refresh
- [ ] Community notifications (join requests, events) show in-app immediately
- [ ] SOS alert is highest priority and bypasses quiet hours

---

## PHASE 5: Preferences & Polish

> **Goal:** Expand notification preferences to cover all new categories, add granular controls, implement quiet hours.

### Files to Modify

| File | Change |
|------|--------|
| `src/services/notifications/notificationService.ts` | Expand `NotificationPreferences` interface with: `departureAdvisor`, `packingReminders`, `communityMessages`, `communityEvents`, `flightTracking`, `weatherAlerts` |
| `src/app/account/notifications.tsx` | Add new toggle sections for all expanded categories |
| `src/services/realtime/alerts/alert.service.ts` | Wire quiet hours logic — defer notifications during user's quiet period |

### Notifications Covered

- All 38 — this phase adds preference controls and quiet hours enforcement

### Acceptance Criteria

- [ ] Each notification category can be individually toggled
- [ ] Quiet hours prevent push during configured time window (still delivered as in-app)
- [ ] Disabling a category prevents both push and in-app for that type
- [ ] Settings sync to `user_notification_preferences` table in Supabase

---

## Implementation Tracking

| Phase | Status | Notifications | Files |
|-------|--------|--------------|-------|
| Phase 1: Core Infrastructure | ✅ Done | Enables all | 3 new, 2 modified |
| Phase 2: Notification Center | ✅ Done | 1 | 3 new, 1 modified |
| Phase 3: Trip Scheduling | ✅ Done | 21 | 1 new, 2 modified |
| Phase 4: Real-Time & External | ✅ Done | 16 | 2 new, 5 modified |
| Phase 5: Preferences & Polish | ✅ Done | All 38 | 0 new, 1 modified |
| **Wiring & Cron** | ✅ Done | — | 3 cron jobs, 4 files modified |
| **TOTAL** | | **38** | **~12 new, ~20 modified** |

### Cron Jobs Active (Supabase)

| Job | Schedule | Purpose |
|-----|----------|---------|
| `process-scheduled-notifications` | Every 5 min | Processes scheduled_notification_jobs → creates alerts |
| `dispatch-pending-alerts` | Every 5 min | Sends pending alerts as push via Expo Push API |
| `monitor-flights` | Every 30 min | Checks upcoming flights for delays/cancellations/gate changes |

### Wired Triggers

| Trigger | Where | Status |
|---------|-------|--------|
| Trip confirmed → schedule 7d/3d/2d/1d reminders, packing, docs, dos/donts | `trip-lifecycle.service.ts` | ✅ Wired |
| Trip cancelled → cancel all scheduled notifications | `trip-lifecycle.service.ts` | ✅ Wired |
| Departure advisor "Set Reminder" → local push | `DepartureAdvisorSheet.tsx` | ✅ Wired |
| Join request approved/denied → alert to user | `GroupAdminScreen.tsx` | ✅ Wired |
| Event created → alert to group members | `CreateEventScreen.tsx` | ✅ Ready (TODO when real API) |
| Flight delay/cancel/gate change → alert | `scheduled-jobs` `monitorFlights()` | ✅ Wired via cron |
| Price drop detected → alert | `scheduled-jobs` `checkPriceAlerts()` | ✅ Already inserts alerts |
| Community message/buddy/follower | `community-notifications.ts` | ✅ Functions ready |
