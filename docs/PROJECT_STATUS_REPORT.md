# Guidera — Full Project Status Report

**Last Updated:** March 10, 2026  
**Previous Audit:** March 7, 2026  
**Scope:** Complete audit of all tabs, screens, services, database, edge functions, and UI consistency  

---

## PART 1: CURRENT STATE BY TAB

---

### 1. EXPLORE TAB (Home)

| Component | Status | DB Wired | Notes |
|-----------|--------|----------|-------|
| Header (avatar, welcome, location) | ✅ Done | ✅ Profiles table | Pulls from AuthContext/Clerk sync |
| Notification bell | ✅ UI Done | 🟡 Service ready | `notificationService.ts` (21KB) built with push token, DB CRUD — badge not yet wired to `getUnreadCount()` |
| Bookmark button | ✅ Done | ✅ | Routes to `/deals/saved`, fetches from `saved_deals` |
| Search bar → SearchOverlay | ✅ Done | ✅ | Calls `search` edge function |
| SearchOverlay → Trip Snapshot | ✅ Done | ✅ | Navigates to AI trip intelligence page |
| Category circles (Plan, Flight, Hotel, Package, Car, Experiences) | ✅ Done | — | Opens booking flows/plan sheet |
| Trip Reminder card | ✅ UI Done | ❌ | Hardcoded "Singapore" destination, not reading from trips DB |
| **12 Homepage Sections** | ✅ Done | ✅ | All fetch from `homepage` edge function → `curated_destinations`, `curated_experiences` tables |
| Section detail pages | ✅ Done | ✅ | deals/[id], destinations/[id], events/[id], local-experiences/[id] |
| View-all pages | ✅ Done | ✅ | deals/view-all, local-experiences/view-all fetch from DB |
| Skeleton loaders for sections | ✅ Done | — | All 12 sections have skeleton states |

**What's Left:**
- ❌ Wire notification bell badge count → `notificationService.getUnreadCount()`
- ❌ Trip Reminder: read from `trip.store` upcoming trips instead of hardcoded
- ❌ Search results pagination for large result sets

---

### 2. TRIPS TAB

| Component | Status | DB Wired | Notes |
|-----------|--------|----------|-------|
| Trip list with tabs (Upcoming, Ongoing, Past, Cancelled, Draft) | ✅ Done | ✅ | Fetches from `trips` table via Zustand store (falls back to mock if DB fails) |
| ComprehensiveTripCard | ✅ Done | ✅ | Reads trip data; image skeleton added |
| Trip Detail Screen | ✅ Done | ✅ Partial | Reads from local store (trips synced from DB) |
| Trip Detail Skeleton | ✅ Done | — | Shows while trip loads |
| Smart Plan Bottom Sheet | ✅ UI Done | ❌ | `onGenerate` exists but has TODO comment — not wired to AI generation |
| InviteTravelersBottomSheet | ✅ UI Done | ❌ | No backend invite API (email sending) |
| BookingPassBottomSheet | ✅ UI Done | ✅ Partial | Reads booking data from trip store |

**Trip Hub Plugins — Services NOW wired to screens (upgraded from March 7):**

| Plugin | UI | Service Wired | AI Prompt | Zustand Store | Notes |
|--------|-----|--------------|-----------|---------------|-------|
| Trip Planner | ✅ | ✅ `plannerService.getDays()`, `addActivity()` | ❌ Missing | ❌ | Service connected, needs DB tables verified |
| Packing List | ✅ | ✅ `packingService.getItems()`, `addItem()`, `togglePacked()` | ✅ Ready | ❌ | Service connected, needs DB tables verified |
| Journal | ✅ | ✅ `journalService` calls in screens | N/A | ❌ | Service connected |
| Expense Tracker | ✅ | ✅ `expenseService` calls in screens | N/A | ❌ | Service connected |
| Compensation | ✅ | ✅ `compensationService` calls in screens | N/A | ❌ | Service connected |
| Do's & Don'ts | ✅ | ✅ `safetyService.getCulturalTips()` | ✅ Ready | ❌ | Service connected |
| Safety | ✅ | ✅ `safetyService.getAlerts()`, `getSafetyScore()` | ✅ Ready | ❌ | Service connected |

**Backend Services (built and available):**
- `ai-generation` edge function — 6 module prompts ready (packing, dos_donts, safety, language, budget, cultural, documents)
- `generation.service.ts` — Full orchestrator with cache, logging, multi-model fallback
- `context-builder.service.ts` (26KB) — Builds comprehensive trip context from DB
- `cache.service.ts` (10KB) — Module cache for destination-specific content

**What's Left:**
- ❌ Wire Smart Plan button → `generationService.generateAllModules(tripId)`
- ❌ Create per-plugin Zustand stores (only `trip.store.ts` exists)
- ❌ Verify all plugin DB tables exist in Supabase (services call them but tables may need creation)
- ❌ Add `trip_planner` AI prompt to `ai-generation` edge function
- ❌ InviteTravelers backend (email sending)

---

### 3. COMMUNITY TAB

| Component | Status | DB Wired | Notes |
|-----------|--------|----------|-------|
| CommunityHubScreen (4 tabs) | ✅ Done | 🟡 Mixed | Tab structure works; individual screens wired, tab-level lists still mock |
| **Discover Tab** | ✅ UI Done | ❌ Still mock | 5 MOCK_ arrays in `DiscoverTabContent.tsx` — no service imports |
| **Guides Tab** | ✅ UI Done | ❌ Partial | BecomeGuideCard works; guide profiles still MOCK |
| **Groups Tab** | ✅ UI Done | ❌ Tab mock | `GroupsTabContent.tsx` uses MOCK — BUT detail screens are wired |
| **Events Tab** | ✅ UI Done | ❌ Tab mock | `EventsTabContent.tsx` uses MOCK — BUT detail/create screens are wired |
| Community Detail Screen | ✅ Done | ✅ **Wired** | Calls `groupService.getGroup()`, `postService.getPosts()`, `eventService.getUpcomingEvents()`, `groupService.getMembers()` |
| Post Detail Screen | ✅ Done | ✅ **Wired** | `postService.getPost()`, `getComments()`, `toggleReaction()`, `addComment()` |
| Event Detail Screen | ✅ Done | ✅ **Wired** | `eventService` integrated |
| Create Post | ✅ Done | ✅ **Wired** | `postService.createPost()` |
| Create Event | ✅ Done | ✅ **Wired** | `eventService.createEvent()` |
| Create Group | ✅ Done | ✅ **Wired** | `groupService` integrated |
| Group Admin Screen | ✅ Done | ✅ **Wired** | `groupService.getMembers()`, `approveRequest()`, `rejectRequest()`, `removeMember()`, `updateMemberRole()` |
| My Groups Screen | ✅ Done | ✅ **Wired** | `groupService.getUserGroups()` |
| Search Screen | ✅ Done | ✅ **Wired** | `groupService.discoverGroups()`, `eventService` |
| Traveler Profile Screen | ✅ Done | ✅ **Wired** | `buddyService`, `groupService` imported and used |
| Buddy Profile Screen | ✅ Done | ✅ **Wired** | `buddyService` integrated |
| Chat Screen | ✅ UI Done | ❌ | `chat.service.ts` (8KB) exists but screens not wired; no Realtime |
| Messages List Screen | ✅ UI Done | ❌ | Not wired to chat service |
| Guide Profile Screen | ✅ UI Done | ❌ | Still MOCK data |
| Listing Detail Screen | ✅ UI Done | ❌ | Still MOCK data |
| BecomeGuideScreen | ✅ Done | ✅ | `partner.service.ts` → Supabase |

**Backend Services (all built, most now connected):**
- `group.service.ts` (12KB) — CRUD for groups, members, join requests → Supabase ✅ **Connected**
- `event.service.ts` (11KB) — CRUD for events, RSVPs → Supabase ✅ **Connected**
- `post.service.ts` (14KB) — CRUD for posts, comments, reactions → Supabase ✅ **Connected**
- `buddy.service.ts` (15KB) — Connections, blocking → Supabase ✅ **Connected**
- `activity.service.ts` (10KB) — CRUD for activities → Supabase ✅ **Connected**
- `partner.service.ts` (7KB) — Guide application → Supabase ✅ **Connected**
- `chat.service.ts` (8KB) — Messaging service → Supabase 🟡 **Built, not connected to UI**

**What's Left:**
- ❌ Connect Discover tab sections → replace MOCK_ arrays with service calls
- ❌ Connect Groups tab list → `groupService.discoverGroups()`
- ❌ Connect Events tab list → `eventService.getUpcomingEvents()`
- ❌ Wire Chat/Messages screens to `chat.service.ts` + Supabase Realtime
- ❌ Connect Guide Profile & Listing Detail to real data
- ❌ Wire community notifications screen

---

### 4. PROFILE / ACCOUNT TAB

| Component | Status | DB Wired | Notes |
|-----------|--------|----------|-------|
| Account main screen | ✅ Done | ✅ | Reads from AuthContext |
| Edit Profile | ✅ Done | ✅ | Updates `profiles` table via Clerk sync |
| Appearance (dark/light/system) | ✅ Done | ✅ Local | AsyncStorage, works perfectly |
| Language selector | ✅ Done | ✅ Local | i18n with AsyncStorage |
| Location Settings | ✅ Done | ✅ | Updates profile location |
| Travel Preferences (6 sub-screens) | ✅ Done | ✅ **Now wired** | `preferences.service.ts` (27KB) — full Supabase CRUD for `travel_preferences` table |
| Saved items | ✅ Done | ✅ | `saved_deals` table + `savedService` |
| Collections | ✅ Done | ✅ **Now wired** | `savedService.getCollections()`, `createCollection()`, `deleteCollection()` |
| Bookings list | ✅ UI Done | 🟡 Partial | Uses `useSavedDeals`, `useRecentClicks` hooks from deal service |
| Booking detail | ✅ UI Done | 🟡 Partial | Reads deal data |
| Rewards | ✅ Done | ✅ **Now wired** | `rewardsService.getPointsHistory()`, `getPointsSummary()` (11KB service) |
| Membership | ✅ UI Done | ❌ | No subscription/premium system |
| Referrals | ✅ UI Done | ❌ | No referral tracking backend |
| Security | ✅ Done | ✅ | Clerk handles auth |
| Change Password | ✅ Done | ✅ | Via Clerk |
| Two-Factor Auth | ✅ Done | ✅ | Via Clerk |
| Active Sessions | ✅ Done | ✅ | Clerk session data |
| Verification | ✅ Done | ✅ | Didit identity verification (3 edge functions) |
| Notifications preferences | ✅ Done | ✅ **Now wired** | `notificationService.syncPreferencesToDB()`, `loadPreferencesFromDB()` → `user_notification_preferences` table |
| Privacy settings | ✅ UI Done | ❌ | UI only, no backend |
| Delete Account | ✅ Done | ✅ | Calls Supabase + Clerk |
| Help Center | ✅ Done | — | Static content |
| Contact Support | ✅ Done | ✅ | Inserts into `support_tickets` table |
| Report Issue | ✅ Done | ✅ | Inserts into `issue_reports` table |
| About / Terms / Privacy Policy | ✅ Done | — | Static content |

**What's Left:**
- ❌ Membership/Premium subscription system
- ❌ Referral code generation + tracking
- ❌ Privacy settings backend (profile visibility, data sharing)
- ❌ Full booking history from real booking data

---

### 5. BOOKING FLOWS

| Flow | Status | DB Wired | API Connected | Notes |
|------|--------|----------|---------------|-------|
| Flight Booking | ✅ Done | 🟡 | ✅ **Now wired** | `useFlightSearch` hook → Provider Manager → `flight-search` edge function (Amadeus + Kiwi) |
| Hotel Booking | ✅ Done | 🟡 | ✅ **Now wired** | `useHotelSearch` hook → Provider Manager → `hotel-search` edge function (Amadeus) |
| Package Booking | ✅ UI Done | ❌ | ❌ | Builder UI, MOCK data |
| Car Rental | ✅ UI Done | ❌ | 🟡 Partial | References provider manager but no real car API |
| Experience Booking | ✅ UI Done | ❌ | 🟡 Partial | References provider manager infrastructure |
| Scan Ticket | ✅ Done | ✅ | ✅ | GPT/Claude vision → trip creation |
| Trip Import (email) | ✅ Done | ✅ | ✅ | `trip-import-engine` + `trip-import.service.ts` (24KB) |
| **Trip Snapshot (NEW)** | ✅ Done | ✅ | ✅ | AI trip intelligence — Haiku 4.5 + Gemini 2.5 Flash, structured destination guide |

**Edge Functions (32 total deployed):**
- `flight-search` — ✅ Amadeus (test) + Kiwi.com
- `hotel-search` — ✅ Amadeus (test)
- `trip-snapshot` — ✅ AI-powered trip intelligence (Haiku 4.5 + Gemini 2.5 Flash)
- `provider-manager` — ✅ Central dispatch for travel providers
- `scan-ticket` — ✅ GPT/Claude vision
- `trip-import-engine` — ✅ Provider adapters
- `ai-generation` — ✅ 6 module prompts
- `chat-assistant` — ✅ AI chat with tool execution
- `event-discovery` — ✅ Local events
- `homepage` — ✅ Curated content
- `search` — ✅ Search engine
- `flight-tracking` — ✅ Flight alerts
- `safety-alerts` — ✅ Safety data
- `weather` — ✅ Weather data
- `deal-scanner` / `deal-notifier` / `refresh-deal-images` — ✅ Deals pipeline
- `currency` / `translation` — ✅ Utilities
- `didit-create-session` / `didit-check-status` / `didit-webhook` — ✅ Identity verification
- `send-notification` — ✅ Push notifications
- `local-experiences` / `places` — ✅ Discovery
- `compute-travel-dna` / `departure-advisor` — ✅ AI features
- `scheduled-jobs` / `tiktok-content` — ✅ Background tasks
- `test-ai-generation` / `test-trip-services` — Testing utilities

> **⚠️ IMPORTANT: Amadeus Flight API — Currently using TEST environment**
> 
> The Amadeus flight and hotel search APIs (`flight-search`, `hotel-search`, `trip-snapshot`) are currently configured to use the **test/sandbox environment** (`test.api.amadeus.com`). This means:
> - Flight and hotel results are **test/mock data** from Amadeus, not real-time availability
> - Prices and availability may not reflect actual market conditions
> - The `AMADEUS_ENV` environment variable controls this (`test` by default, set to `production` for live data)
> - **Action Required:** Before launch, switch `AMADEUS_ENV` to `production` in Supabase Edge Function secrets and ensure Amadeus production API keys are configured
> - Amadeus production access requires approval from Amadeus for Developers portal

**What's Left:**
- ❌ Car rental API provider integration
- ❌ Experience booking API integration
- ❌ Package builder (combine flight + hotel + experience)
- ❌ Payment integration (Stripe)
- ❌ Switch Amadeus to production

---

### 6. OTHER FEATURES

| Feature | Status | DB Wired | Notes |
|---------|--------|----------|-------|
| AR Navigation (airport + city) | ✅ UI Done | ❌ | 75 items in `ar-navigation/`; needs Situm/Google AR SDK |
| Planning flows (Quick + Advanced) | ✅ UI Done | ❌ | 23 items in `planning/`; forms not saving to DB |
| Onboarding (22 screens) | ✅ Done | ✅ | Saves to profiles table |
| Auth (sign in/up) | ✅ Done | ✅ | Clerk + Supabase sync |
| Inbox/Saved tabs | ✅ UI Done | ❌ | Placeholder screens (235 bytes each) |

**What's Left:**
- ❌ AR SDK integration (Situm for airport, Google Maps AR for city)
- ❌ Planning flows saving to DB
- ❌ Wire or remove Inbox/Saved tab placeholders

---

## PART 2: WHAT'S LEFT — PRIORITIZED PHASES

---

### PHASE 1: Quick Wins — Wire existing services (1-2 days)

These items have **services already built** but just need the UI connected:

1. ✅ → ❌ **Wire notification bell badge** → `notificationService.getUnreadCount()` — service exists
2. ✅ → ❌ **Wire Smart Plan button** → `generationService.generateAllModules(tripId)` — pipeline exists
3. ✅ → ❌ **Trip Reminder** → read from `trip.store` upcoming trips instead of hardcoded "Singapore"
4. ✅ → ❌ **Connect Community Discover tab** → replace MOCK_ arrays with `groupService`, `eventService`, `buddyService`
5. ✅ → ❌ **Connect Community Groups/Events tab lists** → services already have the query methods
6. ✅ → ❌ **Wire Chat/Messages** → `chat.service.ts` exists (8KB), connect screens

---

### PHASE 2: Database Verification + Plugin Stores (2-3 days)

1. **Verify all DB tables exist** — Trip plugin services call tables that may not be created yet. Run migrations for: `trip_packing_items`, `trip_itinerary_days`, `trip_itinerary_items`, `trip_journal_entries`, `trip_expenses`, `trip_compensation_claims`
2. **Create Zustand stores** for each plugin (only `trip.store.ts` + `useOnboardingStore.ts` exist in `stores/`)
3. **Add `trip_planner` AI prompt** to `ai-generation` edge function
4. **Verify community DB tables** — `community_posts`, `post_likes`, `post_comments` (services call them)

---

### PHASE 3: Remaining Account Features (2-3 days)

1. ❌ **Membership/Premium** — subscription system
2. ❌ **Referrals** — code generation + tracking
3. ❌ **Privacy settings** — backend for profile visibility, data sharing
4. ❌ **Full booking history** — consolidated from trip bookings

---

### PHASE 4: Remaining Booking APIs (3-5 days)

1. ❌ **Car rental API** — integrate provider
2. ❌ **Experience booking API** — connect to experience providers
3. ❌ **Package builder** — combine flight + hotel + experience
4. ❌ **Payment integration** — Stripe for real bookings
5. ❌ **Amadeus production** — switch from test to production API

---

### PHASE 5: Real-Time & Notifications (2-3 days)

1. ❌ **Supabase Realtime** for community chat messaging
2. ❌ **Flight tracking alerts** — wire `flight-tracking` edge function to push notifications
3. ❌ **Trip collaboration invites** — email/push invite system

---

### PHASE 6: Polish & Advanced (3-5 days)

1. ❌ **AR Navigation** — Situm SDK for airport, Google Maps AR for city
2. ❌ **Offline support** — cache critical trip data locally
3. ❌ **Deep linking** — trip sharing, invitation links
4. ❌ **Analytics** — track user behavior, feature usage
5. ❌ **Performance** — lazy loading, image caching, memory optimization
6. ❌ **Planning flows** — save to DB

---

## PART 3: UI CONSISTENCY ISSUES

| Issue | Location | Severity |
|-------|----------|----------|
| Static `colors` import in `StyleSheet.create` causes dark-mode-only values in light mode | Multiple bottom sheets (fixed for main ones, may exist in others) | Medium |
| Notification badge count hardcoded to "3" | Explore tab header | Low |
| Trip Reminder hardcoded to "Singapore" | Explore tab | Low |
| `BookingType` type mismatch lint error | `TripDetailScreen.tsx:537` | Low |
| Some community screens use `colors.gray*` (static) instead of `tc.text*` (theme-aware) | Community screens | Medium |
| Traveler icon in ComprehensiveTripCard uses hardcoded `#9333EA` | `ComprehensiveTripCard.tsx:218` | Low |

---

## PART 4: DEAD CODE & CLEANUP CANDIDATES

| Item | Location | Action |
|------|----------|--------|
| AR Navigation feature (75 items) | `src/features/ar-navigation/` | Keep but mark as future — not connected |
| Unused `useSafeAreaInsets` import | `DosDontsScreen.tsx` | Remove if unused |
| Legacy `background`/`backgroundSecondary` color aliases | `src/styles/colors.ts` | Consider removing |
| `Moneys` icon imported but unused | `ComprehensiveTripCard.tsx` | Remove |
| Multiple duplicate `Warning2` imports | `DosDontsScreen.tsx` | Deduplicate |
| `saved.tsx` and `inbox.tsx` tabs | `src/app/(tabs)/` | Placeholder screens (235 bytes) — wire or remove |
| Mock data files in community | `src/features/community/data/` | Remove once tabs wired to services |

---

## SUMMARY SCORECARD

| Area | UI Complete | Backend Ready | DB Wired | Fully Functional | Change from Mar 7 |
|------|-----------|--------------|----------|------------------|--------------------|
| **Auth & Onboarding** | ✅ 100% | ✅ 100% | ✅ 100% | ✅ **100%** | — |
| **Explore/Home** | ✅ 100% | ✅ 100% | ✅ 95% | ✅ **92%** | +2% (Trip Snapshot) |
| **Trips (list + detail)** | ✅ 100% | ✅ 85% | ✅ 75% | 🟡 **65%** | +5% |
| **Trip Hub Plugins** | ✅ 100% | ✅ 80% | 🟡 35% | 🟡 **35%** | **+30%** (services wired) |
| **Community** | ✅ 95% | ✅ 85% | 🟡 40% | 🟡 **35%** | **+25%** (screens wired) |
| **Account/Profile** | ✅ 100% | ✅ 70% | ✅ 60% | 🟡 **55%** | **+20%** (prefs, rewards, collections) |
| **Booking Flows** | ✅ 95% | 🟡 50% | 🟡 30% | 🟡 **30%** | **+25%** (flights + hotels + snapshot) |
| **Notifications** | ✅ 20% | ✅ 80% | 🟡 40% | 🟡 **40%** | **+40%** (full service built) |
| **AR Navigation** | ✅ 80% | ❌ 0% | ❌ 0% | ❌ **0%** | — |

---

## OVERALL STATUS

**Overall Project Completion: ~50% functional** (up from ~40% on March 7)  
**UI: ~95% complete** | **Backend Services: ~65% built** | **DB Wiring: ~45%**

### Key progress since March 7:
- ✅ **Trip Snapshot** — Full AI trip intelligence feature (Haiku 4.5 + Gemini 2.5 Flash)
- ✅ **Flight & Hotel booking** — Wired to real APIs via Provider Manager (Amadeus test + Kiwi)
- ✅ **All 7 trip plugins** — Services now connected to screens (were all mock before)
- ✅ **Community screens** — Detail, create, admin, search screens wired to services
- ✅ **Travel Preferences** — Full Supabase CRUD (27KB service)
- ✅ **Collections** — Wired to `savedService`
- ✅ **Rewards** — Wired to `rewardsService`
- ✅ **Notification service** — Full push token + DB CRUD + preferences sync built
- ✅ **Post/Feed system** — `postService` (14KB) with full CRUD, reactions, comments
- ✅ **32 edge functions** deployed (was only ~10 documented)

### Biggest remaining gaps:
1. **Community tab-level lists** still render MOCK data (Discover, Groups, Events tabs)
2. **Smart Plan button** not wired to AI generation pipeline
3. **DB table verification** — plugin services call tables that may not exist yet
4. **No per-plugin Zustand stores** — only `trip.store.ts` exists
5. **Amadeus in test mode** — needs production upgrade before launch
6. **No payment integration** — cannot process real bookings
7. **AR Navigation** — 75 files of UI waiting for SDK integration
