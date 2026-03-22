# Guidera Production Launch Audit

**Date:** March 20, 2026  
**Scope:** Full codebase analysis — Auth, Onboarding, Explore, Trips, Connect, Account, Services, Edge Functions, Design System, Security  
**Goal:** Identify every issue blocking a production launch to 100K+ users

---

## Executive Summary

The app has a massive feature set with real Supabase backend, Clerk auth, AI generation, and live API integrations. However, there are **critical blockers** that must be resolved before launch, along with numerous medium/low-priority items that affect polish and scalability. The findings are organized into **4 phases** by priority.

---

## Phase 1 — CRITICAL (Must fix before launch)

### C-01: Orphaned Onboarding Screens (Dead Code)
- **Files:** `welcome-1.tsx` through `welcome-5.tsx` (5 files), `preferences-1.tsx` through `preferences-4.tsx` (4 files)
- **Issue:** 9 orphaned screens that are never reached in the active onboarding flow. The `(onboarding)/index.tsx` redirects to `intro`, skipping all welcome screens. The preferences screens are marked DEPRECATED with redirects.
- **Risk:** Expo Router includes these in the bundle. Users could deep-link to them accidentally.
- **Fix:** Delete all 9 files. They add ~25KB of dead weight.

### C-02: `detail/[id].tsx` — Entirely Mock Data (381 lines)
- **File:** `src/app/detail/[id].tsx`
- **Issue:** This entire route is powered by a hardcoded `MOCK_DATA` object with fake Paris/Tokyo/Bali data, fake reviews with Unsplash avatar URLs, fake ratings. The real destination detail page is at `destinations/[id].tsx`.
- **Risk:** If any link points to `/detail/[id]`, users see fake content. Currently no imports reference the planning feature.
- **Fix:** Delete this file. Ensure all navigation points to `/destinations/[id]` instead.

### C-03: `features/planning/` — Entire Dead Feature Module (~368 lines of mock AI service)
- **File:** `src/features/planning/services/aiService.ts`
- **Issue:** The `generateMockAIContent()` function and all `MOCK_ACTIVITIES`, `MOCK_MEALS`, `MOCK_SAFETY_TIPS`, `MOCK_PACKING_ITEMS`, `MOCK_CULTURAL_TIPS`, `MOCK_PHRASES` are hardcoded mock data. This entire `features/planning/` module (services, stores, types, config) is **never imported** anywhere in the app — confirmed by grep.
- **Risk:** Dead code bloat. The real AI generation uses edge functions (`generate-itinerary`, `generate-packing`, etc.).
- **Fix:** Delete the entire `src/features/planning/` directory.

### C-04: Console Logs in Production — 463 matches across 175 files
- **Issue:** There are 463 `console.log/error/warn` calls across 175 files. Many are NOT wrapped in `__DEV__` guards, meaning they'll fire in production builds and leak internal state to device logs.
- **High-risk files (unguarded):**
  - `saved.service.ts` (18 calls)
  - `trip-lifecycle.service.ts` (15 calls)
  - `geofencing.service.ts` (11 calls)
  - `SitumService.ts` (9 calls)
  - `useDangerAlerts.ts` (9 calls)
  - `rewards.service.ts` (7 calls)
  - `provider-manager.service.ts` (6 calls)
  - `email-signup.tsx` line 100: bare `console.error` (no `__DEV__` guard)
  - `verify-otp.tsx` line 112: bare `console.error`
- **Fix:** Wrap ALL console calls in `if (__DEV__)` guards or replace with the existing `logger` service.

### C-05: Landing Page Uses Static `colors` Import (Not Theme-Aware)
- **File:** `src/app/(auth)/landing.tsx`
- **Issue:** Landing page imports `{ colors }` from `@/styles` directly and uses it in `StyleSheet.create()`. It does NOT use `useTheme()`. While this works because the dark-mode tokens ARE the `colors` export, the pattern is inconsistent with the rest of the auth flow (sign-in, email-signup, phone-signup all use `useTheme()`). 
- **Specific concern:** `colors.white` used for text on video overlay is fine, but the `colors.black` background would show the dark-mode black correctly. However, the SSO icon `colors.textPrimary` references the dark-mode token which will be light text — acceptable on a video bg but inconsistent.
- **Fix:** Convert to `useTheme()` pattern for consistency.

### C-06: Analytics Service is a Mock Shell
- **File:** `src/services/analytics/analytics.ts`
- **Issue:** The analytics provider is hardcoded to `'mock'`. All tracking calls (Mixpanel, Amplitude, Firebase) are TODO stubs. With 100K users, you have zero visibility into user behavior, crashes, or funnel metrics.
- **Fix:** Integrate at least one real analytics provider before launch. Mixpanel or Amplitude recommended.

### C-07: 146 Alert.alert Calls — No Toast Replacement
- **Issue:** 146 `Alert.alert()` calls across 46 files. These are native blocking dialogs that interrupt user flow. Many are for success confirmations, errors, or actions that should use the existing toast system.
- **Worst offenders:** `EntryEditorScreen.tsx` (10), `edit-profile.tsx` (9), `GroupAdminScreen.tsx` (9), `PartnerApplicationScreen.tsx` (9)
- **Fix:** Replace success/info alerts with toast notifications. Keep only destructive-action confirmations as Alert.alert.

### C-08: Forgot Password Success Screen — Wrong Message
- **File:** `src/app/(auth)/forgot-password.tsx` line 182
- **Issue:** After the user successfully resets their password (line 82: `attempt.status === 'complete'`), the success screen still says "Check your email" and "Click the link in the email to reset your password" — but the reset was already completed! The user already entered the code and new password.
- **Fix:** Update success screen copy to "Password reset successfully! You can now sign in with your new password."

### C-09: Forgot Password — Links to Deprecated `email-signin`
- **File:** `src/app/(auth)/forgot-password.tsx` lines 191, 256
- **Issue:** Two "Back to Sign In" links navigate to `/(auth)/email-signin` which is a deprecated redirect stub. Should go directly to `/(auth)/sign-in`.
- **Fix:** Change both `router.push('/(auth)/email-signin')` to `router.push('/(auth)/sign-in')`.

### C-10: Edit Trip Screen — "Coming Soon" Placeholder
- **File:** `src/app/trip/edit.tsx`
- **Issue:** The entire Edit Trip screen is a "Coming Soon" placeholder with no functionality. Users who tap "Edit" on their trip see a dead end.
- **Risk:** Core user flow is broken. Users cannot edit trip dates, destinations, or details after creation.
- **Fix:** Either build minimal edit functionality (dates, destination, title) or hide the edit button entirely until ready.

---

## Phase 2 — HIGH (Fix within first week post-launch)

### H-01: Hardcoded Hex Colors — 1,510 matches across 267 files
- **Issue:** 1,510 hardcoded hex color values across 267 files, outside the design system. While the dark-mode `colors` export maps correctly, many files use raw hex like `#10B981`, `#EF4444`, `#FF6B35`, `#1877F2`, `#000000` in StyleSheet.
- **Most affected:** `deals/[id].tsx` (55), `MenuScanMode.tsx` (30), `PartnerApplicationScreen.tsx` (28), `local-experiences/[id].tsx` (23), `CompensationScreen.tsx` (23), `AIChatSheet.tsx` (22)
- **Fix:** Migrate to design system tokens. Add missing semantic tokens (e.g., `colors.priceUp`, `colors.priceDown`, `colors.facebookBlue`) to `colors.ts`.

### H-02: Static `colors.xxx` in StyleSheet — 239 files (1,140 matches)
- **Issue:** 239 files use `colors.white`, `colors.black`, `colors.gray300`, `colors.background`, etc. in `StyleSheet.create()` instead of dynamic theme values. While these resolve to dark-mode values, they can't respond to theme changes and are inconsistent with the `useTheme()` pattern.
- **Most affected:** `FilterBottomSheet.tsx` (24), `BookingPassBottomSheet.tsx` (24), `referrals.tsx` (21), `membership.tsx` (20), `change-password.tsx` (19)
- **Fix:** Progressively migrate to `useTheme()` + inline styles for color values.

### H-03: `bookings.tsx` — Fully Static Colors (Despite Having useTheme)
- **File:** `src/app/account/bookings.tsx`
- **Issue:** This screen imports `useTheme()` and uses `tc` for some inline styles, but the ENTIRE `StyleSheet.create()` (lines 289-458) uses static `colors.xxx` references. Card backgrounds, text colors, borders, empty states — all hardcoded.
- **Fix:** Convert all StyleSheet color refs to dynamic `tc.xxx` inline overrides.

### H-04: `rewards.tsx` — Same Pattern (Static StyleSheet)
- **File:** `src/app/account/rewards.tsx` (677 lines)
- **Issue:** Same as H-03. Uses `useTheme()` but StyleSheet is fully static colors. The `POINTS_TYPE_CONFIG` uses `colors.success`, `colors.error`, etc.
- **Fix:** Convert to dynamic theme colors.

### H-05: Unsplash Image URLs — 90 matches across 16 files
- **Issue:** 90 Unsplash URLs hardcoded as fallback images. These are free-tier URLs that could be rate-limited under heavy load.
- **Worst offender:** `detail/[id].tsx` (44 — entire mock data file), `destinations.ts` (17), `destinations/[id].tsx` (6), `deals/[id].tsx` (4)
- **Fix:** Host critical images on Supabase Storage. Remove URLs from the deleted `detail/[id].tsx`. For remaining fallbacks, use a CDN-cached default image.

### H-06: `features/navigation/` — Incomplete Map Feature
- **File:** `src/features/navigation/MapScreen.tsx` (390 lines)
- **Issue:** The navigation/map feature module exists with a MapScreen, components, hooks, and services. It references "Coming Soon" for airport indoor wayfinding. Only 1 route file imports it (`app/navigation/index.tsx`).
- **Risk:** Feature is partially functional. City mode works via Mapbox, but airport mode is a stub.
- **Fix:** Ensure the map screen works reliably for city navigation. Remove or hide airport mode tab if Mappedin API isn't configured.

### H-07: `booking.config.ts` — 5 "Coming Soon" Feature Flags
- **File:** `src/features/booking/config/booking.config.ts`
- **Issue:** 5 booking features are flagged as "Coming Soon" — these need to be verified they're properly gated in the UI so users don't see broken flows.
- **Fix:** Audit each flag and ensure the UI hides corresponding buttons/sections.

### H-08: AR Plugin Stubs — Airport Navigator, Landmark Scanner, Menu Translator
- **Files:** `airport-navigator/`, `landmark-scanner/`, `menu-translator/`
- **Issue:** These AR plugins exist with hooks and components but the hooks (`useAirportNavigation`, `useLandmarkRecognition`, `useMenuTranslation`) return mock/stub data. The real AI Vision feature replaced `menu-translator` via `ScanBottomSheet`.
- **Risk:** If users somehow navigate to these plugins, they'll see mock data.
- **Fix:** Remove the old `menu-translator` plugin entirely (replaced by `ai-vision`). For airport-navigator and landmark-scanner, either complete or hide them from the UI.

### H-09: Provider Adapters — Dead/Unused
- **Files:** `providers/getyourguide-adapter.ts`, `providers/cartrawler-adapter.ts`, `providers/expedia-adapter.ts`, `providers/duffel-adapter.ts`
- **Issue:** These adapter files contain mock fallback data and are superseded by the SerpAPI + Viator + Amadeus integrations. `expedia-adapter.ts` was repurposed for Booking.com but the file name is misleading.
- **Fix:** Delete truly unused adapters (GetYourGuide, CarTrawler, Duffel). Rename expedia-adapter to booking-adapter.

### H-10: `ScanBottomSheet.tsx` — 2 "Coming Soon" Items
- **File:** `src/components/features/ar/ScanBottomSheet.tsx`
- **Issue:** The quick actions menu has 2 items that route to incomplete features.
- **Fix:** Either wire them or hide them.

### H-11: 354 TODO/FIXME/HACK Comments — 103 files
- **Issue:** 354 TODO/FIXME/HACK/TEMP markers across 103 files. Many indicate incomplete features or known technical debt.
- **Notable TODOs:**
  - `alert.types.ts` (60 TODOs — entire notification type registry)
  - `TimeSlotSheet.tsx` (18), `UnifiedDateSheet.tsx` (14), `DateTimePickerSheet.tsx` (14)
  - `verify-otp.tsx` (12 TODOs)
  - `PackageWhereSection.tsx` (9)
- **Fix:** Triage each TODO. Close resolved ones, create tickets for remaining.

### H-12: `city-navigator/hooks/useCityNavigator.ts` — Mock Data References
- **File:** `src/features/ar-navigation/plugins/city-navigator/hooks/useCityNavigator.ts`
- **Issue:** 8 references to mock/Mock patterns. While `generateDangerZonesAroundLocation` was replaced with empty array, the hook may still have mock POI data paths.
- **Fix:** Verify all data comes from real services (Mapbox, Google Places).

---

## Phase 3 — MEDIUM (Fix within first month)

### M-01: Client-Side API Keys Exposed
- **Files:** 16 files reference `EXPO_PUBLIC_` env vars
- **Issue:** Google Maps, Google Vision, Google Translation, Mapbox, CrimeoMeter, TravelRisk, and analytics keys are exposed client-side via `EXPO_PUBLIC_` prefix. While this is standard for mobile apps, these keys should have:
  - API key restrictions (iOS/Android bundle ID)
  - Usage quotas set in provider dashboards
  - Billing alerts configured
- **Risk:** At 10M users, unrestricted API keys could lead to massive unexpected bills or abuse.
- **Fix:** Set restrictions on ALL `EXPO_PUBLIC_` keys in their respective dashboards. Add billing alerts.

### M-02: `saved.service.ts` — 18 Unguarded Console Logs
- **File:** `src/services/saved.service.ts`
- **Issue:** 18 console log/error calls, most likely unguarded. This is the save/bookmark service — high-frequency user action.
- **Fix:** Wrap all in `__DEV__` guards.

### M-03: Rate Limiting — No Client-Side Throttling
- **Issue:** No visible client-side rate limiting on API calls. Edge functions don't have rate limiting. At scale:
  - Rapid pull-to-refresh could hammer Supabase
  - AI generation buttons can be tapped repeatedly
  - Search debounce exists but deal/homepage APIs don't have request deduplication
- **Fix:** Add request deduplication/debounce to all service calls. Consider edge function rate limiting.

### M-04: Error Boundaries — Only 1 Global ErrorBoundary
- **File:** `src/components/common/error/ErrorBoundary.tsx`
- **Issue:** Only a single global ErrorBoundary. Individual screens don't have granular error boundaries, meaning one crash takes down the entire app view.
- **Fix:** Add screen-level error boundaries for critical flows (booking, trip detail, community).

### M-05: `booking/data/destinations.ts` — Hardcoded Destination List
- **File:** `src/features/booking/data/destinations.ts`
- **Issue:** Contains hardcoded destination data with 17 Unsplash URLs and 6 mock references. This should come from the `curated_destinations` table.
- **Fix:** Replace with Supabase query or remove if unused.

### M-06: `booking/data/airports.ts` — Static Airport Data
- **File:** `src/features/booking/data/airports.ts`
- **Issue:** 3 mock references. Airport data should be dynamic (autocomplete from Amadeus or SerpAPI).
- **Fix:** Verify this file is only used for offline fallback. Add disclaimer comment.

### M-07: `FlightResultsScreen.tsx` — 3 Mock References
- **File:** `src/features/booking/flows/flight/screens/FlightResultsScreen.tsx`
- **Issue:** Contains mock data fallback patterns that could show fake flight results.
- **Fix:** Ensure only real API data is displayed. Show empty state instead of mock.

### M-08: Memory Leaks — No Cleanup in Realtime Subscriptions
- **Issue:** Multiple Realtime subscriptions in hooks (`useNotifications`, `useNearbyActivities`, `useActivityComments`) need to be verified for proper cleanup on unmount.
- **Fix:** Audit all `supabase.channel()` subscriptions for proper `unsubscribe()` in cleanup.

### M-09: Offline Support — No Visible Implementation
- **Issue:** `src/services/offline/` exists but offline support for core features (trip viewing, itinerary access) isn't visibly implemented. Users with poor connectivity (travelers!) will see loading spinners.
- **Fix:** Implement offline caching for trip data, itineraries, and emergency contacts at minimum.

### M-10: `PackageBuildScreen.tsx` — Mock Experiences/Options
- **File:** `src/features/booking/flows/package/screens/PackageBuildScreen.tsx`
- **Issue:** 3 TODO/mock references. Package booking flow may show placeholder data.
- **Fix:** Wire to real provider data or hide package flow until ready.

### M-11: `ListingDetailScreen.tsx` — 5 TODO Items
- **File:** `src/features/community/screens/ListingDetailScreen.tsx`
- **Issue:** 5 TODOs indicating incomplete features in the guide listing detail view.
- **Fix:** Complete or add "coming soon" guards.

### M-12: App Version Check — Update Service Exists but May Not Be Wired
- **File:** `src/services/updates/updateService.ts`
- **Issue:** Contains Alert.alert calls (2), suggesting it shows native dialogs for updates. Verify this is properly wired in `_layout.tsx`.
- **Fix:** Ensure force-update capability works for critical bug fixes post-launch.

---

## Phase 4 — LOW (Post-launch improvements)

### L-01: i18n — Only 6 Languages, Many Screens Not Translated
- **Issue:** Translation files exist for EN, FR, ES, DE, IT, PT but most screens still use hardcoded English strings. The `t()` function is only used in a handful of screens.
- **Fix:** Progressive translation of all user-facing strings.

### L-02: Accessibility — No Visible `accessibilityLabel` Props
- **Issue:** Touch targets and interactive elements across the app don't have `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` props. Screen readers won't work.
- **Fix:** Add accessibility props to all interactive elements.

### L-03: Deep Linking — Incomplete Configuration
- **Issue:** Deep link handling exists in notification service but the app's linking configuration needs verification for all routes.
- **Fix:** Test all deep link paths (trip, community, deals, notifications).

### L-04: Image Optimization — Mixed `Image` and `expo-image`
- **Issue:** Some screens use RN `Image`, others use `expo-image`. The inconsistency means some images don't get caching/progressive loading benefits.
- **Fix:** Standardize on `expo-image` throughout.

### L-05: Performance — Large List Rendering
- **Issue:** Some screens use `ScrollView` with `.map()` instead of `FlatList` for lists that could grow large (notifications, trip list, deal list, community feed).
- **Fix:** Convert to `FlatList` with `keyExtractor` and `getItemLayout` where applicable.

### L-06: Bundle Size — Unused Dependencies
- **Issue:** `@reactvision/react-viro` was removed from imports but may still be in `package.json`. Same for `@googlemaps/react-native-navigation-sdk` (confirmed removed).
- **Fix:** Run `npx depcheck` and remove unused packages.

### L-07: Test Coverage — Minimal
- **Issue:** The `__tests__/` directory structure exists but test files are sparse. No visible integration or E2E tests.
- **Fix:** Add critical path tests for auth flow, booking flow, and trip creation.

### L-08: Sentry — Needs Configuration
- **Issue:** `src/services/sentry/sentry.ts` exists with `EXPO_PUBLIC_SENTRY_DSN` reference. Verify Sentry is properly initialized for crash reporting before launch.
- **Fix:** Configure Sentry DSN, source maps, and release tracking.

### L-09: Health Check Service — May Not Be Active
- **File:** `src/services/health/healthCheck.ts`
- **Issue:** Health check exists but verify it's being called on app startup and monitors critical services.
- **Fix:** Wire health check to app boot and display degraded-service banners when APIs are down.

### L-10: Push Notification Token Refresh
- **Issue:** Device token registration exists but token refresh strategy for expired tokens needs verification.
- **Fix:** Ensure token refresh happens on each app launch, not just first install.

---

## Design System Inconsistencies

### DS-01: `useTheme()` Adoption — 317/418+ files use it, but inconsistently
- 317 files import `useTheme`, but many still have static `colors.xxx` in their StyleSheet
- Pattern should be: `useTheme()` for ALL color references, no static colors in StyleSheet

### DS-02: Two ThemeContext Files
- `src/context/ThemeContext.tsx` (primary)
- `src/contexts/ThemeContext.tsx` (legacy)
- Both exist and are aligned, but the dual-file creates confusion

### DS-03: Font Usage
- `fontFamily.display` (Host Grotesk Bold) and `fontFamily.regular` (Rubik) defined but many screens use raw `fontWeight` strings instead of the typography system presets

### DS-04: Border Radius Inconsistency
- Theme defines tokens (`sm:6` through `3xl:32`) but many files use hardcoded values like `borderRadius: 20`, `borderRadius: 28`, `borderRadius: 18`

### DS-05: Button Styles — No Standard
- Buttons vary wildly: some use `tc.primary`, others `isDark ? tc.white : tc.black`, others hardcoded hex. No shared button component used consistently.
- `DSButton` design system component exists but most screens use raw `TouchableOpacity`

---

## Security Review

### SEC-01: ✅ Clerk Auth — Properly Implemented
- Third-party auth with Supabase via JWKS validation
- `requesting_user_id()` DB function for RLS
- Profile sync uses `supabaseNoAuth` correctly

### SEC-02: ✅ Environment Variables — No Hardcoded Secrets
- Supabase URL/key from env vars
- Situm, Google Maps keys from `EXPO_PUBLIC_` env vars
- Edge function secrets stored in Supabase secrets

### SEC-03: ⚠️ 295 Permissive RLS Policies
- Per prior audit: 295 `USING (true)` permissive policies remain
- These allow any authenticated user to read any other user's data
- **Fix:** Tighten RLS policies to scope data access per user

### SEC-04: ⚠️ Edge Functions — `verify_jwt: false` on Many Functions
- Multiple edge functions disable JWT verification for convenience
- While some (scheduled-jobs, webhooks) legitimately need this, others (chat-assistant, generate-*) should verify tokens
- **Fix:** Audit each function and enable JWT verification where possible

### SEC-05: ⚠️ No Rate Limiting on Edge Functions
- No visible rate limiting on any edge function
- AI generation functions could be abused to rack up LLM costs
- **Fix:** Implement per-user rate limiting, especially on AI generation endpoints

### SEC-06: ✅ Password Complexity — Enforced
- Email signup requires uppercase, lowercase, number, 8+ chars

### SEC-07: ⚠️ No Biometric Auth Lock
- `expo-local-authentication` is installed but biometric lock on app open isn't implemented
- **Fix:** Add optional biometric lock in security settings

---

## Scalability Concerns (10M Users)

### SCALE-01: Supabase Connection Pooling
- Ensure Supabase project is on a plan that supports high concurrent connections
- Consider PgBouncer or Supavisor configuration

### SCALE-02: Edge Function Cold Starts
- AI generation functions (itinerary, safety, language) take 30-50 seconds
- At scale, cold starts could cause timeouts
- **Fix:** Consider warm-up strategies or background job queues

### SCALE-03: Image CDN
- Event images generated by Imagen stored in Supabase Storage
- At scale, Supabase Storage may not be the most cost-effective CDN
- **Fix:** Consider Cloudflare Images or similar CDN

### SCALE-04: Realtime Subscriptions
- Multiple Realtime channels per user (notifications, chat, activities)
- At 100K concurrent users, this could strain Supabase Realtime
- **Fix:** Monitor Realtime connection limits on your Supabase plan

### SCALE-05: Cron Job Frequency
- 10 cron jobs running at various frequencies
- Deal scanner runs every 6 hours — at scale this may need horizontal scaling
- **Fix:** Monitor execution times and adjust frequencies

---

## Files to Delete (Dead Code)

| File | Lines | Reason |
|------|-------|--------|
| `src/app/(onboarding)/welcome-1.tsx` | 172 | Orphaned, never reached |
| `src/app/(onboarding)/welcome-2.tsx` | ~170 | Orphaned, never reached |
| `src/app/(onboarding)/welcome-3.tsx` | ~170 | Orphaned, never reached |
| `src/app/(onboarding)/welcome-4.tsx` | ~170 | Orphaned, never reached |
| `src/app/(onboarding)/welcome-5.tsx` | ~170 | Orphaned, never reached |
| `src/app/(onboarding)/preferences-1.tsx` | 11 | Deprecated redirect stub |
| `src/app/(onboarding)/preferences-2.tsx` | 10 | Deprecated redirect stub |
| `src/app/(onboarding)/preferences-3.tsx` | 10 | Deprecated redirect stub |
| `src/app/(onboarding)/preferences-4.tsx` | 10 | Deprecated redirect stub |
| `src/app/(auth)/email-signin.tsx` | 11 | Deprecated redirect stub |
| `src/app/(auth)/sign-up.tsx` | 11 | Deprecated redirect stub |
| `src/app/detail/[id].tsx` | 381 | Entirely mock data, replaced by destinations/[id] |
| `src/features/planning/` (entire dir) | ~500+ | Never imported, mock AI service |
| `src/features/ar-navigation/plugins/menu-translator/` | ~200+ | Replaced by ai-vision |
| `src/services/providers/getyourguide-adapter.ts` | ~100 | Unused, mock fallback |
| `src/services/providers/cartrawler-adapter.ts` | ~100 | Unused, mock fallback |
| `src/services/providers/duffel-adapter.ts` | ~100 | Unused |
| **Total estimated deletable** | **~2,500+** lines | |

---

## Quick Wins (< 1 hour each)

1. Delete 9 orphaned onboarding screens
2. Delete 2 deprecated auth redirect stubs
3. Fix forgot-password success screen copy
4. Fix forgot-password navigation to sign-in (not email-signin)
5. Delete `detail/[id].tsx` mock data route
6. Delete `features/planning/` directory
7. Delete old `menu-translator` plugin
8. Wrap top-20 worst console.log offenders in `__DEV__` guards

---

## Priority Summary

| Priority | Count | Effort Estimate |
|----------|-------|-----------------|
| **Phase 1 — CRITICAL** | 10 items | 2-3 days |
| **Phase 2 — HIGH** | 12 items | 1-2 weeks |
| **Phase 3 — MEDIUM** | 12 items | 2-4 weeks |
| **Phase 4 — LOW** | 10 items | Ongoing |
| **Design System** | 5 items | 2-3 weeks |
| **Security** | 7 items | 1 week |
| **Scalability** | 5 items | Ongoing |
| **Dead Code Deletion** | 17+ files | 1 day |

---

*This audit was performed by analyzing the full source tree, searching for patterns across 400+ files, and cross-referencing with the application architecture. Findings are based on static analysis and code reading — runtime testing should verify each item.*
