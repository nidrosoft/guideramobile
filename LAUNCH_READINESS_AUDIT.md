# Guidera Launch Readiness Audit

**Date:** March 20, 2026
**Scope:** Full codebase analysis — every screen, service, component, and config
**Purpose:** Identify everything that must be fixed before going live to 100K+ waitlist users

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase 1 — CRITICAL: Must Fix Before Launch](#phase-1--critical-must-fix-before-launch)
3. [Phase 2 — HIGH: Fix Within First Week](#phase-2--high-fix-within-first-week)
4. [Phase 3 — MEDIUM: Fix Within First Month](#phase-3--medium-fix-within-first-month)
5. [Phase 4 — LOW: Fix Before Scale (10M Users)](#phase-4--low-fix-before-scale-10m-users)
6. [Feature Completion Matrix](#feature-completion-matrix)
7. [Detailed Findings by Area](#detailed-findings-by-area)
   - [A. Security](#a-security)
   - [B. Authentication & Onboarding](#b-authentication--onboarding)
   - [C. Explore / Home Page](#c-explore--home-page)
   - [D. Trips](#d-trips)
   - [E. Community & Inbox](#e-community--inbox)
   - [F. Account & Settings](#f-account--settings)
   - [G. AI Vision, Search & AR](#g-ai-vision-search--ar)
   - [H. Design System & Theme](#h-design-system--theme)
   - [I. Infrastructure & Scalability](#i-infrastructure--scalability)

---

## Executive Summary

Guidera is a **substantially built travel app** with real Supabase integrations, Clerk auth, AI-powered features (Gemini/OpenAI), and a comprehensive feature set. The majority of services are wired to real backends — this is not a prototype.

However, the audit uncovered **147 distinct issues** across 9 categories. The most critical blockers for launch are:

- **Security:** Google API key leaked in server responses, edge functions missing auth, wildcard CORS
- **Deceptive Data:** Fabricated discounts (fake "46% OFF"), fake visitor counts, fake flight numbers shown as real
- **Empty Shells:** Inbox tab, Saved tab, 8 booking screens, Edit Trip page — all blank white screens
- **Dark Mode:** ~246 files use static colors that won't respond to theme changes; 17 stub screens hardcode `#ffffff`
- **Design System:** 0% adoption of DS components; 1,501 hardcoded color values across 312 files
- **Scalability:** ScrollView used 652 times vs FlatList 94 times; no pagination on view-all pages

### What's Working Well
- Auth flow (Clerk + Supabase) is solid
- Trip CRUD, planning, and Smart Plan generation are fully wired
- All trip plugins (packing, safety, language, documents, journal, compensation) work
- Community features (groups, events, buddy matching, chat) are wired to real data
- AI Vision (4 modes), search, notifications, expenses, rewards — all functional
- Error boundaries, offline sync, and OTA update service exist
- Push notifications fully implemented

---

## Phase 1 — CRITICAL: Must Fix Before Launch

> These issues can cause security breaches, legal problems, user trust damage, or crashes.

### SEC-01: Google API Key Leaked in Server Responses
- **File:** `supabase/functions/google-api-proxy/index.ts:239`
- **Issue:** The `place_photo` action returns `https://maps.googleapis.com/maps/api/place/photo?...&key=${GOOGLE_API_KEY}` to the client, exposing the server-side Google API key in HTTP responses
- **Fix:** Proxy the photo server-side and return the image data or a signed URL

### SEC-02: Edge Functions Missing User Authentication
- **Files:** `supabase/functions/chat-assistant/index.ts:13`, `supabase/functions/ai-vision/index.ts`, `supabase/functions/google-api-proxy/index.ts`
- **Issue:** These accept `userId` from the request body without verifying it against the JWT. Any caller with the anon key can invoke these as any user
- **Fix:** Extract user ID from the JWT (`Authorization` header), not the request body

### SEC-03: Wildcard CORS on All Edge Functions
- **File:** `supabase/functions/_shared/cors.ts`
- **Issue:** `Access-Control-Allow-Origin: *` means any website can call your edge functions
- **Fix:** Restrict to your app's domains or remove CORS (mobile apps don't need it)

### SEC-04: Google Maps API Key Hardcoded in app.json
- **File:** `app.json:26,48`
- **Issue:** `AIzaSyAQ88Ge0rJ9W0SpmBKoOQ9o_6wAUwpO_ns` committed to git
- **Fix:** Restrict this key in Google Cloud Console to your bundle IDs and Maps SDK only

### SEC-05: Community `isPremium` Hardcoded to `true`
- **File:** `src/features/community/screens/CommunityHubScreen.tsx:84`
- **Issue:** Every user is treated as premium, bypassing all feature gating (group creation, messaging, events, buddy requests)
- **Fix:** Wire to actual subscription/membership status from Supabase

### SEC-06: Account Deletion is Soft-Delete Only (GDPR/CCPA Risk)
- **File:** `src/app/account/delete-account.tsx:70-72`
- **Issue:** Only sets `deleted_at` on profile. User's trips, expenses, posts, messages, saved items all remain. Violates GDPR right to erasure
- **Fix:** Implement server-side cascade deletion via edge function

### SEC-07: Post/Comment Delete Has No Author Verification
- **Files:** `src/services/community/post.service.ts` — `deletePost()`, `deleteComment()`
- **Issue:** Any user can delete any post or comment by ID — no ownership check
- **Fix:** Add `.eq('user_id', currentUserId)` to delete queries

### DATA-01: Fabricated Discounts on Local Experiences
- **File:** `src/app/local-experiences/view-all.tsx:179-181, 224-226`
- **Issue:** When real discount is missing, shows fake `46% OFF` badge and fabricates an 85% markup strikethrough price. This is **deceptive and potentially illegal**
- **Fix:** Only show discount badge when real discount data exists

### DATA-02: Fake Flight Data in Trip Reminder
- **File:** `src/components/features/home/TripReminder.tsx:132`
- **Issue:** When no flight data exists, passes `flightNumber='AV123'` and `departureAirport='LAX'` to the departure advisor — fake data presented as real
- **Fix:** Show "No flight booked" state instead

### SHELL-01: Inbox Tab is Completely Empty
- **File:** `src/app/(tabs)/inbox.tsx`
- **Issue:** Renders an empty white `<View>`. No messages, no routing to existing MessagesListScreen
- **Fix:** Either route to MessagesListScreen or remove from tab bar

### SHELL-02: Saved Tab is Completely Empty
- **File:** `src/app/(tabs)/saved.tsx`
- **Issue:** Same — empty white `<View>`. The actual saved flow exists at `/account/saved.tsx`
- **Fix:** Route to the existing saved items UI or remove from tab bar

### SHELL-03: 8 Booking Screens Are Empty Placeholders
- **Files:** `src/app/booking/flights/search.tsx`, `flights/results.tsx`, `hotels/search.tsx`, `hotels/results.tsx`, `cars/search.tsx`, `cars/results.tsx`, `activities/search.tsx`, `activities/results.tsx`
- **Issue:** All render empty white views. Users navigating to booking get blank screens
- **Fix:** Implement or gate these routes (hide navigation to them)

---

## Phase 2 — HIGH: Fix Within First Week

> These cause broken UX, data integrity issues, or dark mode failures.

### AUTH-01: Google SSO Creates Session but Doesn't Navigate
- **Files:** `src/app/(auth)/email-signup.tsx:121`, `phone-signup.tsx:173-185`
- **Issue:** Google SSO on these screens creates an active session but has NO navigation after success. User stays on the signup screen while authenticated
- **Fix:** Add navigation to `/(onboarding)/intro` or `/(tabs)` after SSO success

### AUTH-02: Forgot Password Has Weaker Validation Than Signup
- **File:** `src/app/(auth)/forgot-password.tsx:65-68`
- **Issue:** Password reset only checks `length < 8`. Signup requires uppercase + lowercase + number. Users can set weak passwords through reset flow
- **Fix:** Use the same password validation everywhere

### AUTH-03: Onboarding Store Has No Persistence
- **File:** `src/stores/useOnboardingStore.ts`
- **Issue:** Zustand store with no persist middleware. App crash or kill during onboarding = all data lost, user restarts from step 1
- **Fix:** Add `persist` middleware with AsyncStorage

### AUTH-04: Setup Screen Silently Redirects on Save Failure
- **File:** `src/app/(onboarding)/setup.tsx:114-126`
- **Issue:** If profile save fails, user is redirected to `/(tabs)` with no error message. Profile data is silently lost
- **Fix:** Show error state and retry option

### AUTH-05: No Back Button on Any Onboarding Screen
- **File:** `src/components/features/onboarding/PreferenceScreen.tsx:57`
- **Issue:** `showBackButton` defaults to `false` and no screen overrides it. Users can't go back to correct mistakes
- **Fix:** Pass `showBackButton={true}` from all onboarding screens

### TRIP-01: Bookings Never Loaded on Trip Detail
- **File:** `src/features/trips/stores/trip.store.ts:123`
- **Issue:** `bookings: [] as any[]` for every trip. `TripRepository.getBookings()` exists but is never called. The entire bookings section of TripDetailScreen is dead UI
- **Fix:** Call `getBookings(tripId)` when loading trip detail

### TRIP-02: Edit Trip Page is a Stub
- **File:** `src/app/trip/edit.tsx`
- **Issue:** Shows "Trip editing is coming soon" with a Go Back button. No form, no fields
- **Fix:** Implement or remove the edit button from trip detail

### TRIP-03: Share Token Uses `Math.random()` (Not Cryptographically Secure)
- **File:** `src/features/trips/utils/trip.utils.ts:24`
- **Issue:** Trip invitation tokens generated with `Math.random()` are predictable
- **Fix:** Use `crypto.getRandomValues()` or UUID v4

### COMM-01: DM Badge Counts ALL Messages Globally
- **File:** `src/features/community/screens/CommunityHubScreen.tsx:127-144`
- **Issue:** Realtime subscription to `chat_messages` has no filter — any message by anyone increments the badge
- **Fix:** Filter subscription to conversations where current user is a participant

### COMM-02: Chat Attachment/Emoji/Voice Buttons Are Non-Functional
- **File:** `src/features/community/screens/ChatScreen.tsx:364-412`
- **Issue:** Camera, Gallery, Location, Emoji, Microphone buttons render but have no `onPress` handlers
- **Fix:** Implement or hide these buttons

### COMM-03: Message Reactions Not Persisted
- **File:** `src/features/community/screens/ChatScreen.tsx:219-253`
- **Issue:** Reactions are toggled in local state only — no API call to save them. They disappear on screen remount
- **Fix:** Wire to a backend persist call

### COMM-04: User Search Ignores Privacy Settings
- **File:** `src/features/community/screens/SearchScreen.tsx:153-169`
- **Issue:** Profile search returns all matching users regardless of `profileVisibility` setting (public/buddies_only/private)
- **Fix:** Add `.eq('privacy_settings->profileVisibility', 'public')` filter

### ACCT-01: Membership Upgrade Has No Payment Integration
- **File:** `src/app/account/membership.tsx:93`
- **Issue:** `handleUpgrade` only does `console.log('Upgrade to:', tier.name)`. No Stripe, no in-app purchase
- **Fix:** Implement payment flow or hide upgrade buttons

### ACCT-02: "Download My Data" is a Fake Success
- **File:** `src/app/account/privacy.tsx:156-161`
- **Issue:** Shows a success alert but never actually exports any data
- **Fix:** Implement data export or remove the option

### ACCT-03: Hardcoded Stale Subtitles in Account Config
- **File:** `src/features/account/config/accountSections.config.ts`
- **Issue:** `'2,450 points available'` (line 108), `'English, USD'` (line 166), `'Light mode'` (line 175), `'Version 1.0.0'` (line 279) — never dynamically updated
- **Fix:** Make these computed from actual user data

### NAV-01: Deep Linking Service Never Initialized
- **File:** `src/services/deeplink/deeplinkService.ts`
- **Issue:** Full implementation exists but `initDeepLinks()` is never called in root layout. Deep links won't work
- **Fix:** Call `initDeepLinks()` in `_layout.tsx`

### THEME-01: 17 Stub Screens Have Hardcoded White Background
- **Files:** All booking screens, safety/emergency, safety/alerts, safety/map, inbox, saved, cultural/[location], profile/edit, profile/index, profile/settings
- **Issue:** `backgroundColor: '#ffffff'` — broken in dark mode
- **Fix:** Use `colors.background` from theme

---

## Phase 3 — MEDIUM: Fix Within First Month

> These affect quality, consistency, and edge cases.

### AUTH-06: 9 Deprecated Stub Files Should Be Deleted
- **Files:** `(auth)/sign-up.tsx`, `(auth)/email-signin.tsx`, `(onboarding)/preferences-1.tsx` through `preferences-4.tsx`, `(onboarding)/welcome-1.tsx` through `welcome-5.tsx`
- **Issue:** All marked DEPRECATED or orphaned. Dead weight in the bundle

### AUTH-07: Non-Null Assertion Crash Risk on `setActive!()`
- **File:** `src/app/(auth)/landing.tsx:73`
- **Issue:** `setActive!({ session })` — if undefined, this crashes. Should use optional chaining

### AUTH-08: No Rate Limiting on OTP Resend
- **File:** `src/app/(auth)/verify-otp.tsx:147`
- **Issue:** Client-side timer only. Server accepts unlimited resend requests

### AUTH-09: `useWarmUpBrowser` Hook Duplicated in 4 Files
- **Files:** `landing.tsx`, `sign-in.tsx`, `email-signup.tsx`, `phone-signup.tsx`
- **Fix:** Extract to a shared utility

### AUTH-10: Inconsistent Email Validation Across Auth Screens
- **Issue:** `email-signup.tsx` uses proper regex, `forgot-password.tsx` only checks for `@` and `.`

### AUTH-11: Console.error Calls Without `__DEV__` Guard in Auth
- **Files:** `verify-otp.tsx:112,127`, `email-signup.tsx:100`
- **Issue:** Leaks auth attempt details in production logs

### EXPLORE-01: Events "View All" Shows Destinations, Not Events
- **File:** `src/app/events/view-all.tsx`
- **Issue:** Uses `useSectionDestinations("events")` which fetches curated destinations — completely different from the AI-discovered events shown on homepage

### EXPLORE-02: "Verified" Badge Shown on All Budget Cards Unconditionally
- **File:** `src/components/features/home/BudgetFriendlyCard.tsx:52-55`
- **Issue:** Green "Verified" badge with checkmark on every card with no verification system

### EXPLORE-03: Fabricated Visitor Counts, Trends, Savings Across 6+ Sections
- **Issue:** `matchScore / 10` = visitor count, `matchScore / 50` = trend %, `(5 - budgetLevel) * 15` = savings %, etc.
- **Files:** `PlacesSection.tsx:32`, `MustSeeSection.tsx:38`, `TrendingSection.tsx:38`, `BudgetFriendlySection.tsx:39`

### EXPLORE-04: Fabricated Places When API Returns Nothing
- **File:** `src/app/destinations/[id].tsx:106-136`
- **Issue:** Creates 3 fake POIs ("City Center", "Historic Quarter", "Local Market") with made-up distances

### EXPLORE-05: Non-Functional Arrow/Heart Buttons on Cards
- **Files:** `EditorChoiceCard.tsx:59`, `TrendingLocationCard.tsx:71`, `FamilyFriendlyCard.tsx:99`, `BudgetFriendlyCard.tsx:38`
- **Issue:** Interactive elements with no `onPress` handlers

### EXPLORE-06: No Error State on Homepage
- **File:** `src/app/(tabs)/index.tsx`
- **Issue:** If `useHomepageData()` fails, no error banner or retry button — content silently disappears

### EXPLORE-07: SaveButton Invisible in Dark Mode
- **File:** `src/components/features/home/SaveButton.tsx:29`
- **Issue:** Unsaved bookmark color hardcoded as `#1a1a1a` — invisible on dark backgrounds

### TRIP-04: Two Incompatible Trip Type Systems
- **Files:** `src/features/trips/types/trip.types.ts` (camelCase), `src/services/trip/trip.types.ts` (snake_case)
- **Issue:** Dual type systems create mapping overhead and confusion

### TRIP-05: Planning Stores Never Persist (`userId: 'current_user'`)
- **Files:** `src/features/planning/stores/usePlanningStore.ts:225`, `useAdvancedPlanningStore.ts:517`
- **Issue:** Both deprecated but still present. Never write to Supabase

### TRIP-06: Dead Animation Code in TripListScreen
- **File:** `src/features/trips/screens/TripListScreen/TripListScreen.tsx:37`
- **Issue:** `animatedValue` created and animated but never consumed by any style

### TRIP-07: TripCard Component Entirely Unused
- **File:** `src/features/trips/components/TripCard/TripCard.tsx`
- **Issue:** Dead file — `ComprehensiveTripCard` is used instead

### COMM-05: SearchScreen SQL Filter Injection Risk
- **File:** `src/features/community/screens/SearchScreen.tsx:156,179`
- **Issue:** User search query is directly interpolated into `.or()` and `.ilike()` filter strings
- **Fix:** Sanitize/escape user input before building filter strings

### COMM-06: Message Rate Limits Defined but Not Enforced
- **Issue:** Config says `maxMessagesPerMinute: 30` but `chat.service.ts` never checks it
- Posts have no rate limiting (activities have 3/hour but posts don't)

### COMM-07: Unread Count Always Zero for Group Chats
- **Files:** `MessagesListScreen.tsx:89,99`, `group.service.ts:343`
- **Issue:** `unreadCount: 0` hardcoded with TODO comment

### COMM-08: No Content Filtering or Profanity Detection
- **Issue:** Messages, posts, and comments go directly to DB with no moderation pipeline

### ACCT-04: Rewards `addPoints` Fallback is Broken
- **File:** `src/services/rewards.service.ts:312-328`
- **Issue:** `supabase.rpc('coalesce', ...)` is not a valid RPC call — this code path will fail

### ACCT-05: Referral Code Uses `Math.random()` (Collision Risk)
- **File:** `src/services/rewards.service.ts:190`
- **Fix:** Use UUID v4 or crypto-safe random

### ACCT-06: N+1 Query in `getCollections`
- **File:** `src/services/saved.service.ts:214-226`
- **Issue:** One count query per collection instead of a single aggregate

### ACCT-07: Expenses Hardcode `$` Currency Symbol
- **File:** `src/app/account/my-expenses.tsx:88,116,144,293`
- **Issue:** Always shows `$` regardless of user's actual currency setting

### ACCT-08: NotificationContext.tsx is Dead Code
- **File:** `src/context/NotificationContext.tsx`
- **Issue:** Empty context `{}`, never used. Real notification logic is in the singleton `notificationService`

### ACCT-09: Safety Score Returns Hardcoded Baselines
- **File:** `src/services/safety.service.ts:287-299`
- **Issue:** Returns `85` overall safety score when no alerts exist — not based on real data

### VISION-01: AR Map View is a Complete Placeholder
- **File:** `src/features/ar-navigation/components/ARMapView.tsx:23-25`
- **Issue:** Shows text "Map View (Mapbox)" with no actual map

### VISION-02: Situm Import Will Crash Without Native Module
- **File:** `src/features/ar-navigation/services/SitumService.ts:8`
- **Issue:** `import Situm from '@situm/react-native'` has no try/catch guard

### VISION-03: Airport Navigation is a Placeholder
- **File:** `src/features/navigation/MapScreen.tsx:213-223`
- **Issue:** Shows "Indoor airport wayfinding with Mappedin is coming soon"

### VISION-04: Order Builder Uses Placeholder Destination
- **File:** `src/features/ar-navigation/plugins/ai-vision/components/TranslatorScreen.tsx:48-49`
- **Issue:** `localLanguage` defaults to `'en'`, `destinationCountry` defaults to `''` — never populated from active trip

### INFRA-01: Rate Limiter Fails Open
- **File:** `supabase/functions/_shared/rateLimiter.ts:47-48`
- **Issue:** If DB query fails, request is allowed through

### INFRA-02: Sentry DSN Not in .env
- **Issue:** `EXPO_PUBLIC_SENTRY_DSN` not configured — Sentry may not be active in production

### INFRA-03: Analytics Service is Mock-Only
- **File:** `src/services/analytics/analytics.ts:113`
- **Issue:** Defaults to `'mock'` provider. No real analytics being collected

### INFRA-04: Remote Logging Not Implemented
- **File:** `src/services/logging/logger.ts:199-209`
- **Issue:** `flushLogs()` is a TODO. Log entries accumulate in memory and are never sent

### INFRA-05: Health Check Returns Hardcoded Values
- **File:** `src/services/health/healthCheck.ts:119,135`
- **Issue:** Auth check returns `'unknown'`, DB check returns `'healthy'` always

### INFRA-06: Performance Metrics Never Reported to Backend
- **File:** `src/services/performance/performanceMonitor.ts`
- **Issue:** Metrics stored in memory (max 100), lost on app restart

### INFRA-07: Overly Permissive RLS on deal_clicks
- **File:** `supabase/migrations/20260309_create_deal_tables.sql:152`
- **Issue:** `FOR INSERT WITH CHECK (true)` — any caller can insert unlimited rows

---

## Phase 4 — LOW: Fix Before Scale (10M Users)

> These affect performance at scale, code quality, and maintainability.

### SCALE-01: ScrollView vs FlatList Ratio (652:94)
- **Issue:** 185 files use ScrollView to render lists. No virtualization = all items rendered at once
- **Key areas:** Deal lists, community feeds, search results, view-all pages, message lists

### SCALE-02: No Pagination on Any View-All Page
- **Files:** `deals/view-all.tsx`, `local-experiences/view-all.tsx`, `SectionViewAll.tsx`
- **Issue:** All use `ScrollView`, load all items at once

### SCALE-03: Profile Sync on Every App Launch
- **File:** `src/context/AuthContext.tsx:95`
- **Issue:** `syncClerkUserToSupabase()` runs on every auth state change. At 10M DAU = 10M+ syncs/day
- **Fix:** Cache locally, sync only when Clerk data changes

### SCALE-04: AsyncStorage `getAllKeys()` on Sign-Out
- **File:** `src/context/AuthContext.tsx:151-156`
- **Issue:** O(n) on stored keys. Could be thousands of keys from cached data

### SCALE-05: Single `isLoading` Boolean in Trip Store
- **File:** `src/features/trips/stores/trip.store.ts`
- **Issue:** Shared across all operations. Creating a trip shows skeleton on the entire list

### SCALE-06: Realtime Subscriptions Too Broad
- **Files:** `CommunityHubScreen.tsx:127-144`, `MessagesListScreen.tsx:118-132`, `activity.service.ts:481-508`
- **Issue:** Subscribe to entire tables without filters. All global changes trigger re-renders

### SCALE-07: No Real-Time Sync for Shared Trips
- **Issue:** No Supabase realtime subscriptions for trip data. Shared trip changes require manual refresh

### SCALE-08: Country List Only 38 Countries
- **File:** `src/app/(onboarding)/country.tsx`
- **Issue:** Excludes majority of world's countries. Need ISO 3166 complete list

### SCALE-09: `expo-secure-store` Installed But Never Used
- **Issue:** All sensitive data uses AsyncStorage (unencrypted on-device)
- **Fix:** Migrate push tokens, user preferences to SecureStore

### SCALE-10: 236 Console Logs Not Gated Behind `__DEV__`
- **Issue:** Production builds may leak info if Babel console strip is not configured

### DESIGN-01: Design System Components Have 0% Adoption
- **Files:** All 9 components in `src/components/ds/`
- **Issue:** DSButton, DSCard, DSInput, etc. are never imported outside their directory. Every screen builds its own

### DESIGN-02: DS Components Don't Support Theming
- **Issue:** All 9 DS components import static `colors` from `@/styles/colors` (dark mode only). None use `useTheme()`

### DESIGN-03: 1,501 Hardcoded Color Values Across 312 Files
- **Worst offenders:** `deals/[id].tsx` (50), `MenuScanMode.tsx` (23), `local-experiences/[id].tsx` (22), `AIChatSheet.tsx` (21), `CityMapView.tsx` (21)

### DESIGN-04: 1,184 Hardcoded fontSize Values Across 198 Files
- **Worst offenders:** `PartnerApplicationScreen.tsx` (51), `deals/[id].tsx` (48), `BecomeGuideScreen.tsx` (34)

### DESIGN-05: 909 Hardcoded fontWeight Values Across 151 Files

### DESIGN-06: 190 Hardcoded fontFamily Strings Across 18 Files
- **Issue:** Raw `'Rubik-Bold'` strings instead of `fontFamily.bold` tokens

### DESIGN-07: ~246 Files Use Static Colors Import (Dark Mode Broken)
- **Issue:** Import `colors` from `@/styles` which always returns dark-mode values. Won't respond to theme changes

### DESIGN-08: Inconsistent Button Styles (17+ Patterns)
- **Issue:** No two screens use the same button design. Heights vary (44, 48, 52, 56), border radius varies (12, 14, 16, 18, 999)

### DESIGN-09: Inconsistent Card Border Radius (8 Different Values)
- **Issue:** Cards use 8, 10, 12, 14, 16, 20, 22, 24, 28 border radius with no consistency

### DESIGN-10: 8+ Different "Success Green" Colors Used
- **Issue:** `#059669`, `#16A34A`, `#22C55E`, `#28C840`, `#2E7D32`, `#34A076`, `#34D399`, `#10B981`

### DESIGN-11: Image Component Split (expo-image vs RN Image)
- **Issue:** 10 homepage cards use React Native `Image` (no caching), 3 use `expo-image` (with caching). No fallback images on any homepage card

### DESIGN-12: Hardcoded Safe Area Insets (`top: 60`)
- **Files:** `sign-in.tsx`, `email-signup.tsx`, `phone-signup.tsx`, `forgot-password.tsx`, `verify-otp.tsx`, all welcome screens
- **Fix:** Use `useSafeAreaInsets()` from `react-native-safe-area-context`

### DESIGN-13: Section Titles Not Internationalized
- **File:** `src/config/sections.config.ts`
- **Issue:** All section titles and descriptions are hardcoded English

### DEAD-01: Dead Style Definitions Across 15+ Card Components
- **Issue:** `bookmarkButton`, `heartButton`, `loadingContainer`, `loadingText`, `visitorsContainer` styles defined but never used

### DEAD-02: `useSectionData.ts` Hooks Never Used
- **File:** `src/features/homepage/hooks/useSectionData.ts`
- **Issue:** Exports `usePopularDestinations`, `useTrendingDestinations`, etc. — all unused (components use context directly)

### DEAD-03: 3 Empty Config Files
- **Files:** `src/config/features.ts`, `src/config/constants.ts`, `src/config/navigation.ts`
- **Issue:** All export empty objects `{}`

### DEAD-04: Provider Adapters May Be Client-Side Dead Code
- **Files:** `src/services/providers/` (amadeus, kiwi, duffel, expedia, cartrawler, getyourguide)
- **Issue:** All provider calls go through edge functions. Client-side adapters may be unused

### DEAD-05: Unused Auth Types
- **File:** `src/types/auth.types.ts:133-148`
- **Issue:** `SignUpWithEmailParams`, `SignInWithEmailParams`, `SignUpWithPhoneParams` never used

### DEAD-06: Stub AR Hooks Never Used
- **Files:** `src/features/ar-navigation/hooks/useARCamera.ts`, `useARLocation.ts`
- **Issue:** All methods are TODO stubs. Never imported

### DEAD-07: Deprecated Trip Import Methods
- **File:** `src/services/trip/trip-import.service.ts:406-424`
- **Issue:** `getLinkedAccounts` and `syncLinkedAccount` are no-ops

### DEAD-08: `INTEREST_ICONS` Config Never Consumed
- **File:** `src/features/community/config/community.config.ts:136-149`

---

## Feature Completion Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| **Authentication** | | |
| Email signup/signin | WIRED | Works via Clerk |
| Phone signup | WIRED | Works via Clerk |
| Google SSO | PARTIAL | Works on sign-in, broken navigation on signup screens |
| Apple SSO | WIRED | Works via Clerk |
| Facebook SSO | WIRED | Works via Clerk |
| Forgot password | WIRED | Weaker validation than signup |
| OTP verification | WIRED | Auto-submit, no rate limit on resend |
| **Onboarding** | | |
| Profile collection (name, DOB, etc.) | WIRED | Saves to Supabase |
| Travel preferences | WIRED | Full preference system |
| Profile setup completion | WIRED | But silently fails without notification |
| **Explore / Home** | | |
| Homepage sections | WIRED | 12 sections, real Supabase data |
| Deals | WIRED | Real deal service |
| Destinations | WIRED | Real destination intelligence |
| Events | PARTIAL | Homepage uses AI discovery; View All shows destinations |
| Local Experiences | WIRED | Viator integration |
| Search | WIRED | Basic search works; advanced search engine not wired to UI |
| Trip Snapshot | WIRED | AI-powered cost estimates |
| **Trips** | | |
| Trip CRUD (create/read/delete) | WIRED | Full Supabase integration |
| Trip editing | STUB | "Coming soon" placeholder |
| Trip detail | WIRED | But bookings section always empty |
| Smart Plan generation | WIRED | Rate-limited, real AI generation |
| Trip sharing/collaboration | WIRED | But uses Math.random() for tokens |
| Packing lists | WIRED | AI-generated, CRUD |
| Journal | WIRED | Block-based, RPC saves |
| Expenses | WIRED | Full CRUD, receipt scanning |
| Safety profiles | WIRED | AI-generated, alerts |
| Language kits | WIRED | AI-generated phrase management |
| Documents | WIRED | AI-generated checklists |
| Compensation claims | WIRED | Full lifecycle |
| Do's & Don'ts | WIRED | AI cultural tips |
| Flight/Hotel/Car booking | WIRED | Edge function → Amadeus/Kiwi/etc. |
| **Community** | | |
| Groups | WIRED | Full CRUD, join/leave/admin |
| Events | WIRED | Create, RSVP, waitlist |
| Buddy matching | WIRED | Algorithm + proximity |
| Posts & reactions | WIRED | Create, react, comment |
| Activities (Pulse) | WIRED | Rate-limited, realtime |
| DM chat | WIRED | Realtime messages |
| Group chat | WIRED | Realtime messages |
| Partner verification | WIRED | Didit identity verification |
| Content reporting | WIRED | 6 reason categories |
| Chat attachments | SHELL | Buttons render, no functionality |
| Chat reactions | SHELL | Local state only, not persisted |
| Online presence | SHELL | Always shows offline |
| Unread counts | SHELL | Always zero |
| **Account** | | |
| Profile editing | WIRED | Supabase + avatar upload |
| Notifications preferences | WIRED | Push + Supabase |
| Privacy settings | WIRED | Reads/writes Supabase |
| Language setting | WIRED | i18next |
| Appearance/theme | WIRED | Light/dark/system |
| Travel preferences | WIRED | 37+ fields |
| Rewards points | WIRED | History, tiers (addPoints fallback broken) |
| Referrals | WIRED | Code generation, sharing, email invite |
| Membership display | WIRED | Reads from Supabase |
| Membership upgrade | SHELL | Console.log only, no payment |
| Delete account | PARTIAL | Soft delete only |
| Data download | SHELL | Fake success alert |
| Security (2FA) | DISABLED | "Coming soon" |
| Connected Apps | SHELL | Route may not exist |
| **AI Vision** | | |
| Live mode (camera + Gemini) | WIRED | 1fps capture, real AI |
| Snapshot mode (OCR + translate) | WIRED | Google Vision + Translation |
| Menu scan | WIRED | Gemini structured extraction |
| Order Builder | WIRED | Gemini + TTS |
| **Navigation** | | |
| City navigation | WIRED | Mapbox directions, voice guidance |
| Airport navigation | STUB | "Coming soon" placeholder |
| AR map view | STUB | Text placeholder only |
| **Infrastructure** | | |
| Error boundaries | WIRED | 3 levels + Sentry |
| Offline sync | WIRED | Priority queue |
| OTA updates | WIRED | expo-updates |
| Push notifications | WIRED | expo-notifications + Supabase |
| Deep linking | BUILT | Never initialized |
| Sentry | PARTIAL | DSN may not be configured |
| Analytics | MOCK | All providers are TODOs |
| Remote logging | MOCK | flushLogs() is a TODO |
| Health checks | MOCK | Returns hardcoded values |
| Performance monitoring | PARTIAL | Collects but never reports |
| Inbox tab | EMPTY | Blank screen |
| Saved tab | EMPTY | Blank screen |

---

## Detailed Findings by Area

### A. Security

| ID | Severity | Issue | File | Line |
|----|----------|-------|------|------|
| SEC-01 | CRITICAL | Google API key leaked in place_photo response | `supabase/functions/google-api-proxy/index.ts` | 239 |
| SEC-02 | CRITICAL | Edge functions accept userId from body without JWT verification | `chat-assistant`, `ai-vision`, `google-api-proxy` | — |
| SEC-03 | CRITICAL | Wildcard CORS `*` on all edge functions | `supabase/functions/_shared/cors.ts` | — |
| SEC-04 | CRITICAL | Google Maps API key in app.json committed to git | `app.json` | 26, 48 |
| SEC-05 | HIGH | `isPremium = true` hardcoded, bypassing all premium gating | `CommunityHubScreen.tsx` | 84 |
| SEC-06 | HIGH | Account deletion is soft-delete only (GDPR/CCPA risk) | `delete-account.tsx` | 70-72 |
| SEC-07 | HIGH | Post/comment delete has no author verification | `post.service.ts` | — |
| SEC-08 | HIGH | User search ignores privacy settings | `SearchScreen.tsx` | 153-169 |
| SEC-09 | HIGH | expo-secure-store installed but never used (0 imports) | Entire codebase | — |
| SEC-10 | HIGH | 7 source files hardcode Supabase URL | Multiple AR/trip services | — |
| SEC-11 | MEDIUM | Rate limiter fails open on DB errors | `rateLimiter.ts` | 47-48 |
| SEC-12 | MEDIUM | No certificate pinning | Entire codebase | — |
| SEC-13 | MEDIUM | Overly permissive RLS on deal_clicks (INSERT allows anyone) | Migration SQL | 152 |
| SEC-14 | MEDIUM | Search query interpolated into Supabase filter strings | `SearchScreen.tsx` | 156, 179 |
| SEC-15 | MEDIUM | Message rate limits defined but not enforced | `chat.service.ts` | — |
| SEC-16 | MEDIUM | SSO redirect URI not validated against allowlist | `landing.tsx` | 59 |
| SEC-17 | MEDIUM | Share token uses Math.random() | `trip.utils.ts` | 24 |
| SEC-18 | MEDIUM | Referral code uses Math.random() | `rewards.service.ts` | 190 |
| SEC-19 | LOW | DM content duplicated in alerts table (notification logs) | `chat.service.ts` | 312-324 |
| SEC-20 | LOW | Emergency contact phone stored as raw text with no validation | `useOnboardingStore.ts` | 168-170 |

### B. Authentication & Onboarding

| ID | Severity | Issue | File | Line |
|----|----------|-------|------|------|
| AUTH-01 | HIGH | Google SSO creates session but doesn't navigate (email-signup, phone-signup) | `email-signup.tsx`, `phone-signup.tsx` | 121, 173-185 |
| AUTH-02 | HIGH | Forgot password has weaker validation than signup | `forgot-password.tsx` | 65-68 |
| AUTH-03 | HIGH | Onboarding store has no persistence middleware | `useOnboardingStore.ts` | — |
| AUTH-04 | HIGH | Setup screen silently redirects on profile save failure | `setup.tsx` | 114-126 |
| AUTH-05 | HIGH | No back button on any onboarding screen | `PreferenceScreen.tsx` | 57 |
| AUTH-06 | MEDIUM | 9 deprecated stub files (sign-up, email-signin, preferences-1-4, welcome-1-5) | `(auth)/`, `(onboarding)/` | — |
| AUTH-07 | MEDIUM | Non-null assertion `setActive!()` crash risk | `landing.tsx` | 73 |
| AUTH-08 | MEDIUM | No rate limiting on OTP resend (client timer only) | `verify-otp.tsx` | 147 |
| AUTH-09 | MEDIUM | `useWarmUpBrowser` duplicated in 4 files | Multiple auth screens | — |
| AUTH-10 | MEDIUM | Inconsistent email validation across screens | `forgot-password.tsx` vs `email-signup.tsx` | — |
| AUTH-11 | MEDIUM | console.error without `__DEV__` guard in auth screens | `verify-otp.tsx`, `email-signup.tsx` | 112, 127, 100 |
| AUTH-12 | MEDIUM | Landing page SSO navigates to `/` instead of checking onboarding status | `landing.tsx` | 73-76 |
| AUTH-13 | MEDIUM | "Edit" text on verify-otp is non-functional (not a button) | `verify-otp.tsx` | 197 |
| AUTH-14 | LOW | `forgot-password.tsx` "Back to Sign In" navigates to deprecated route | `forgot-password.tsx` | — |
| AUTH-15 | LOW | Unused imports: `useCallback`, `PrimaryButton`, `syncClerkUserToSupabase`, `clerkUser` in landing.tsx | `landing.tsx` | 6, 9, 12, 34 |
| AUTH-16 | LOW | Country list only 38 countries | `country.tsx` | — |
| AUTH-17 | LOW | Language list only 14 languages | `language.tsx` | — |
| AUTH-18 | LOW | Onboarding defaults: currency hardcoded `USD`, distance `km`, temp `celsius` | `useOnboardingStore.ts` | 140-142 |

### C. Explore / Home Page

| ID | Severity | Issue | File | Line |
|----|----------|-------|------|------|
| EXPL-01 | CRITICAL | Fake 46% OFF discount and 85% markup strikethrough price | `local-experiences/view-all.tsx` | 179-181, 224-226 |
| EXPL-02 | CRITICAL | Fake flight data passed to departure advisor | `TripReminder.tsx` | 132 |
| EXPL-03 | MEDIUM | Events "View All" shows destinations instead of events | `events/view-all.tsx` | — |
| EXPL-04 | MEDIUM | "Verified" badge shown unconditionally on all budget cards | `BudgetFriendlyCard.tsx` | 52-55 |
| EXPL-05 | MEDIUM | Fabricated visitor counts from matchScore | `PlacesSection.tsx:32`, `MustSeeSection.tsx:38` | — |
| EXPL-06 | MEDIUM | Fabricated trend percentages from matchScore | `TrendingSection.tsx` | 38 |
| EXPL-07 | MEDIUM | Fabricated savings percentages from budgetLevel | `BudgetFriendlySection.tsx` | 39 |
| EXPL-08 | MEDIUM | Fabricated places when API returns nothing | `destinations/[id].tsx` | 106-136 |
| EXPL-09 | MEDIUM | No error state on homepage (silent failure) | `(tabs)/index.tsx` | — |
| EXPL-10 | MEDIUM | SaveButton invisible in dark mode (hardcoded `#1a1a1a`) | `SaveButton.tsx` | 29 |
| EXPL-11 | MEDIUM | Non-functional arrow buttons on 3 cards | `EditorChoiceCard`, `TrendingLocationCard`, `FamilyFriendlyCard` | — |
| EXPL-12 | MEDIUM | Non-functional heart button on BudgetFriendlyCard | `BudgetFriendlyCard.tsx` | 38-40 |
| EXPL-13 | MEDIUM | No image fallbacks on any homepage card | Multiple | — |
| EXPL-14 | LOW | Default city hardcoded as San Diego for events | `EventsSection.tsx` | 17-18 |
| EXPL-15 | LOW | `METRO_AREA_MAP` only covers US cities | `EventsSection.tsx` | 22-56 |
| EXPL-16 | LOW | Inconsistent image component (expo-image vs RN Image) | Multiple cards | — |
| EXPL-17 | LOW | No pagination on view-all pages | `deals/view-all.tsx`, `SectionViewAll.tsx` | — |
| EXPL-18 | LOW | Card widths vary 180-380px with no screen-size awareness | Multiple cards | — |
| EXPL-19 | LOW | Dead styles in 15+ card components | Multiple | — |
| EXPL-20 | LOW | `useSectionData.ts` hooks entirely unused | `useSectionData.ts` | — |
| EXPL-21 | LOW | Dead styles in `(tabs)/index.tsx` (notification styles) | `(tabs)/index.tsx` | 379-396 |

### D. Trips

| ID | Severity | Issue | File | Line |
|----|----------|-------|------|------|
| TRIP-01 | HIGH | Bookings section always empty (never fetched) | `trip.store.ts` | 123 |
| TRIP-02 | HIGH | Edit Trip is "coming soon" stub | `trip/edit.tsx` | — |
| TRIP-03 | HIGH | Share token uses Math.random() | `trip.utils.ts` | 24 |
| TRIP-04 | MEDIUM | Two incompatible Trip type systems (camelCase vs snake_case) | `trip.types.ts` (×2) | — |
| TRIP-05 | MEDIUM | Planning stores never persist to DB | `usePlanningStore.ts`, `useAdvancedPlanningStore.ts` | — |
| TRIP-06 | MEDIUM | Synthetic traveler objects from count | `trip.store.ts` | 115-121 |
| TRIP-07 | MEDIUM | Single `isLoading` boolean shared across all operations | `trip.store.ts` | — |
| TRIP-08 | MEDIUM | Shared trips limited to 50, not paginated | `trip.store.ts` | 226 |
| TRIP-09 | MEDIUM | No offline support despite DB fields for it | — | — |
| TRIP-10 | MEDIUM | No realtime sync for shared trips | — | — |
| TRIP-11 | MEDIUM | Hard delete in TripRepository bypasses soft-delete pattern | `trip-repository.ts` | 121-128 |
| TRIP-12 | LOW | Dead `TripCard.tsx` component (ComprehensiveTripCard used instead) | `TripCard.tsx` | — |
| TRIP-13 | LOW | Dead animation code (`animatedValue` never consumed) | `TripListScreen.tsx` | 37 |
| TRIP-14 | LOW | Dead styles (`daysUntilBadge`, `daysUntilText`) | `ComprehensiveTripCard.tsx` | 641-657 |
| TRIP-15 | LOW | Deprecated trip import methods (no-ops) | `trip-import.service.ts` | 406-424 |
| TRIP-16 | LOW | `trip.destination` treated as string but is Location object | `ComprehensiveTripCard.tsx` | 263 |

### E. Community & Inbox

| ID | Severity | Issue | File | Line |
|----|----------|-------|------|------|
| COMM-01 | CRITICAL | Inbox tab is completely empty | `(tabs)/inbox.tsx` | — |
| COMM-02 | HIGH | DM badge counts ALL messages globally | `CommunityHubScreen.tsx` | 127-144 |
| COMM-03 | HIGH | Chat attachment/emoji/voice buttons non-functional | `ChatScreen.tsx` | 364-412 |
| COMM-04 | HIGH | Message reactions not persisted to backend | `ChatScreen.tsx` | 219-253 |
| COMM-05 | HIGH | User search ignores privacy settings | `SearchScreen.tsx` | 153-169 |
| COMM-06 | MEDIUM | SQL filter injection risk in search | `SearchScreen.tsx` | 156, 179 |
| COMM-07 | MEDIUM | Rate limits defined but not enforced for messages/posts | Config vs service | — |
| COMM-08 | MEDIUM | Unread count always zero for groups | `MessagesListScreen.tsx`, `group.service.ts` | — |
| COMM-09 | MEDIUM | No content filtering/profanity detection | — | — |
| COMM-10 | MEDIUM | SearchScreen stylesheet uses static colors (dark mode broken) | `SearchScreen.tsx` | 520-795 |
| COMM-11 | MEDIUM | "New Message" button has no navigation | `MessagesListScreen.tsx` | 159-162 |
| COMM-12 | MEDIUM | Buddy online status always false | `ChatScreen.tsx` | 64-71 |
| COMM-13 | MEDIUM | Race conditions in counter updates (read-then-write) | `event.service.ts:299`, `post.service.ts:414`, `chat.service.ts:247` | — |
| COMM-14 | LOW | `pendingRequests` fetched but never used | `CommunityHubScreen.tsx` | 74 |
| COMM-15 | LOW | `isTyping` state never changes from false | `ChatScreen.tsx` | 57 |
| COMM-16 | LOW | `sortBy` state in SearchScreen never applied | `SearchScreen.tsx` | 41, 62 |
| COMM-17 | LOW | `INTEREST_ICONS` config never consumed | `community.config.ts` | 136-149 |
| COMM-18 | LOW | `COMMUNITY_CATEGORIES` communityCount always 0 | `community.config.ts` | 162-191 |

### F. Account & Settings

| ID | Severity | Issue | File | Line |
|----|----------|-------|------|------|
| ACCT-01 | HIGH | Membership upgrade has no payment integration | `membership.tsx` | 93 |
| ACCT-02 | HIGH | "Download My Data" shows fake success | `privacy.tsx` | 156-161 |
| ACCT-03 | HIGH | Hardcoded stale subtitles (points, language, theme, version) | `accountSections.config.ts` | 108, 166, 175, 279 |
| ACCT-04 | MEDIUM | `addPoints` fallback uses invalid RPC call | `rewards.service.ts` | 312-328 |
| ACCT-05 | MEDIUM | Referral code uses Math.random() | `rewards.service.ts` | 190 |
| ACCT-06 | MEDIUM | N+1 query in getCollections | `saved.service.ts` | 214-226 |
| ACCT-07 | MEDIUM | Expenses hardcode `$` currency symbol | `my-expenses.tsx` | 88, 116, 144, 293 |
| ACCT-08 | MEDIUM | No pagination in My Expenses (loads 200 at once) | `my-expenses.tsx` | 170 |
| ACCT-09 | MEDIUM | Avatar press handler is a TODO | `AccountScreen.tsx` | 228 |
| ACCT-10 | MEDIUM | Safety score returns hardcoded baseline (85) | `safety.service.ts` | 287-299 |
| ACCT-11 | MEDIUM | Profile share action is console.log only | `accountSections.config.ts` | 331 |
| ACCT-12 | MEDIUM | Connected Apps route may not exist | `privacy.tsx` | 167 |
| ACCT-13 | MEDIUM | No form validation in edit-profile (phone accepts any text) | `edit-profile.tsx` | — |
| ACCT-14 | MEDIUM | No unsaved changes warning in edit-profile | `edit-profile.tsx` | — |
| ACCT-15 | LOW | NotificationContext.tsx is dead code (empty context) | `NotificationContext.tsx` | — |
| ACCT-16 | LOW | Dead preference options (hairTypes, skinTones) | `preferences.service.ts` | 521-536 |
| ACCT-17 | LOW | Unused import: `Platform` in rewards.tsx | `rewards.tsx` | 18 |
| ACCT-18 | LOW | Unused styles in notifications.tsx, delete-account.tsx, referrals.tsx, language.tsx | Multiple | — |
| ACCT-19 | LOW | Expense budget notification failures silently ignored | `expense.service.ts` | 115 |

### G. AI Vision, Search & AR

| ID | Severity | Issue | File | Line |
|----|----------|-------|------|------|
| AI-01 | MEDIUM | AR Map View is text placeholder | `ARMapView.tsx` | 23-25 |
| AI-02 | MEDIUM | Situm import will crash without native module | `SitumService.ts` | 8 |
| AI-03 | MEDIUM | Airport navigation is "coming soon" placeholder | `MapScreen.tsx` | 213-223 |
| AI-04 | MEDIUM | Order Builder uses default language/country from trip context | `TranslatorScreen.tsx` | 48-49 |
| AI-05 | MEDIUM | Advanced search engine not wired to any UI | `search-engine.ts` | — |
| AI-06 | MEDIUM | Deep linking service never initialized | `deeplinkService.ts` | — |
| AI-07 | MEDIUM | "Connect" tab label not internationalized | `(tabs)/_layout.tsx` | 150 |
| AI-08 | LOW | 100+ hardcoded colors in AI Vision components | Multiple | — |
| AI-09 | LOW | Dead code: `useARCamera`, `useARLocation` (stub hooks) | `hooks/` | — |
| AI-10 | LOW | Dead code: `GEMINI_API_BASE`, `getGeminiEndpoint` | `translatorConfig.ts` | 21-24 |
| AI-11 | LOW | Unused imports: `Animated`/reanimated in ModeSelector | `ModeSelector.tsx` | 12 |
| AI-12 | LOW | Unused `onClose` prop in SnapshotMode, MenuScanMode | Multiple | 55 |
| AI-13 | LOW | `onFavoritePress` is no-op in search results | `results.tsx` | 196 |
| AI-14 | LOW | `getReleaseNotes()` returns placeholder strings | `updateService.ts` | 226 |
| AI-15 | LOW | viewMode toggle impossible (no UI button) | `ARContainer.tsx` | — |
| AI-16 | LOW | 3 empty config files (features, constants, navigation) | `src/config/` | — |

### H. Design System & Theme

| ID | Severity | Issue | File | Line |
|----|----------|-------|------|------|
| DS-01 | HIGH | 9 DS components have 0% external adoption | `src/components/ds/` | — |
| DS-02 | HIGH | DS components use static colors, don't support theming | `src/components/ds/` | — |
| DS-03 | HIGH | 17 stub screens with hardcoded `#ffffff` background | Multiple | — |
| DS-04 | HIGH | ~246 files import static `colors` (dark mode broken) | Multiple | — |
| DS-05 | MEDIUM | 1,501 hardcoded hex color values across 312 files | Multiple | — |
| DS-06 | MEDIUM | 1,184 hardcoded fontSize values across 198 files | Multiple | — |
| DS-07 | MEDIUM | 909 hardcoded fontWeight values across 151 files | Multiple | — |
| DS-08 | MEDIUM | 190 hardcoded fontFamily strings across 18 files | Multiple | — |
| DS-09 | MEDIUM | 8+ different greens used for "success" | Multiple | — |
| DS-10 | MEDIUM | 6+ different reds used for "error" | Multiple | — |
| DS-11 | MEDIUM | 17+ different custom button style patterns | Multiple | — |
| DS-12 | MEDIUM | 8 white-background common component stubs | `src/components/common/` | — |
| DS-13 | LOW | 335 inline style violations across 94 files | Multiple | — |
| DS-14 | LOW | 30+ files define custom shadows instead of tokens | Multiple | — |
| DS-15 | LOW | Inconsistent card widths (180px to 380px) | Multiple | — |
| DS-16 | LOW | Hardcoded safe area insets (`top: 60`) across 6+ files | Multiple | — |

### I. Infrastructure & Scalability

| ID | Severity | Issue | File | Line |
|----|----------|-------|------|------|
| INF-01 | HIGH | ScrollView:FlatList ratio 652:94 (performance at scale) | 185 files | — |
| INF-02 | HIGH | No pagination on view-all pages | Multiple | — |
| INF-03 | MEDIUM | Profile sync on every app launch (10M DAU = 10M syncs/day) | `AuthContext.tsx` | 95 |
| INF-04 | MEDIUM | Sentry DSN not configured (may not be active) | `.env` | — |
| INF-05 | MEDIUM | Analytics service is mock-only (no real provider) | `analytics.ts` | 113 |
| INF-06 | MEDIUM | Remote logging not implemented (flushLogs is TODO) | `logger.ts` | 199-209 |
| INF-07 | MEDIUM | Health check returns hardcoded values | `healthCheck.ts` | 119, 135 |
| INF-08 | MEDIUM | Performance metrics never reported to backend | `performanceMonitor.ts` | — |
| INF-09 | MEDIUM | 236 console.log calls not gated behind `__DEV__` | 176 files | — |
| INF-10 | MEDIUM | 6 empty catch blocks silently swallow errors | Multiple | — |
| INF-11 | MEDIUM | Realtime subscriptions too broad (subscribe to entire tables) | Multiple | — |
| INF-12 | LOW | AsyncStorage `getAllKeys()` O(n) on sign-out | `AuthContext.tsx` | 151-156 |
| INF-13 | LOW | Cache service 100-item limit with O(n log n) eviction | `cacheService.ts` | 29 |
| INF-14 | LOW | beforeSend filter drops ALL "Network request failed" errors | `sentry.ts` | 79 |

---

## Issue Count Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Security | 4 | 6 | 9 | 2 | 21 |
| Auth & Onboarding | 0 | 5 | 8 | 5 | 18 |
| Explore / Home | 2 | 0 | 11 | 8 | 21 |
| Trips | 0 | 3 | 8 | 5 | 16 |
| Community & Inbox | 1 | 4 | 9 | 5 | 19 |
| Account & Settings | 0 | 3 | 11 | 5 | 19 |
| AI Vision, Search & AR | 0 | 0 | 7 | 9 | 16 |
| Design System | 0 | 4 | 8 | 4 | 16 |
| Infrastructure | 0 | 2 | 9 | 3 | 14 |
| **Total** | **7** | **27** | **80** | **46** | **160** |

---

## Recommended Launch Strategy

### Before Go-Live (Phase 1 — 1-2 weeks)
- Fix all 7 CRITICAL issues
- Fix SEC-05 through SEC-08 (community security)
- Fix SHELL-01 through SHELL-03 (empty screens)
- Fix AUTH-01 (SSO navigation)
- Fix DATA-01, DATA-02 (deceptive data)

### Week 1 Post-Launch (Phase 2)
- Fix remaining HIGH issues (27 items)
- Focus on: auth flow polish, trip bookings, community security, payment stub

### Month 1 Post-Launch (Phase 3)
- Fix all MEDIUM issues (80 items)
- Focus on: design system adoption, dark mode, error handling, analytics

### Before 10M Scale (Phase 4)
- Replace ScrollView with FlatList across all list views
- Add pagination to all data-heavy screens
- Implement real analytics, logging, health checks
- Full design system rollout
- Complete i18n coverage

---

*This audit was generated by analyzing every source file in the Guidera codebase. No files were modified.*
