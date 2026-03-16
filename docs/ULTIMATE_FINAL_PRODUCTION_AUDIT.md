# GUIDERA — ULTIMATE PRODUCTION READINESS AUDIT

**Date:** March 15, 2026
**Sources:** Cross-referenced from two independent parallel audits:
- **Audit A** (Anthropic Claude Opus 4.6) — Granular file-level scan, 1,033 source files
- **Audit B** (OpenAI GPT 5.4) — Multi-pass domain review with cross-cutting analysis
**Scope:** Full codebase — React Native (Expo 54) / Clerk Auth / Supabase Backend / 50+ Edge Functions

---

## EXECUTIVE SUMMARY

| Severity | Count | Description |
|----------|-------|-------------|
| **CRITICAL** | 38 | Must fix before any user sees the app |
| **HIGH** | 78 | Should fix before launch |
| **MEDIUM** | 95+ | Fix within first sprint post-launch |
| **LOW** | 55+ | Technical debt to address over time |

### Top 10 Systemic Issues (Combined)

1. **Secrets & API Keys Exposed** — `.env` committed to git, Supabase credentials hardcoded in source, Google API keys shipped client-side
2. **Security Settings Target Wrong Backend** — Account security screens (password, 2FA, sessions) call Supabase Auth while real auth is Clerk
3. **Pervasive Hardcoded Colors (~200+ files)** — Nearly every feature uses static color imports instead of `useTheme()`, breaking dark mode
4. **Mock Data in Production (~15+ data files)** — Community, booking, navigation, trip features render fake data to real users
5. **35+ Empty Stub Modules** — Dead weight in `src/lib/` that creates confusion and import risk
6. **Zero Rate Limiting on Edge Functions** — All 50+ Supabase functions accept unlimited requests with wildcard CORS
7. **Simulated Security Features** — 2FA enrollment is fake, delete-account doesn't delete, active sessions is mock
8. **Account Takeover Vulnerability** — Email/phone-based profile linking without verification enables identity hijacking
9. **SOS Notification Contract Mismatch** — Emergency notifications call a function contract that doesn't match the deployed edge function
10. **Community DM Routing Bug** — Direct messages use user IDs where conversation IDs are expected

---

## SECTION 1: CRITICAL FINDINGS (Must Fix Before Launch)

### 1.1 — SECRETS & CREDENTIALS

| # | File | Issue | Source |
|---|------|-------|--------|
| C-01 | `.env` | **`.env` is NOT in `.gitignore`** — Clerk keys, Supabase URL + anon key, Google Maps API key, Mapbox token, Travel Risk API key are committed to git history. ALL secrets must be rotated. | A |
| C-02 | `src/lib/supabase/client.ts:4-5` | **Supabase URL and anon key hardcoded directly in source code** instead of reading from env vars. | A |
| C-03 | `src/lib/supabase/client.ts:16` | **Supabase anon key exported as a named export** — any module can import raw credentials. | A |
| C-04 | `src/features/ar-navigation/services/vision.service.ts:62` | **Google Cloud Vision API key sent client-side** in query parameter. Should be proxied through backend. | A+B |
| C-05 | `src/features/ar-navigation/services/translation.service.ts:47,69,89,113` | **Google Translation API key sent client-side** across 4 endpoints. | A+B |
| C-06 | `src/features/ar-navigation/services/mapbox.service.ts:149-156` | **Google API key logged to console** and sent in client-side URL. | A |
| C-07 | `src/features/ar-navigation/services/GoogleMapsService.ts:64-68` | **`getApiKey()` method returns raw API key** to any caller. | A |
| C-08 | `src/features/ar-navigation/config/situm.config.ts:10` | **Hardcoded fallback `'YOUR_SITUM_API_KEY'`** ships in the bundle. | A |

### 1.2 — AUTHENTICATION & IDENTITY SECURITY

| # | File | Issue | Source |
|---|------|-------|--------|
| C-09 | `src/lib/clerk/profileSync.ts:9-27` | **`clerkIdToUuid` is cryptographically weak and collision-prone.** Uses simple char-code-to-hex mapping, not a real hash. Two Clerk IDs with same char set could collide, causing one user to overwrite another's profile. Use `uuid v5` with proper namespace. | A |
| C-10 | `src/lib/clerk/profileSync.ts:92-124` | **Account takeover via email-based profile linking.** When a new Clerk user signs in, if their email matches an existing profile, the code silently links them. An attacker who knows a victim's email could sign up via SSO and inherit the victim's profile. | A |
| C-11 | `src/lib/clerk/profileSync.ts:127-157` | **Same account takeover risk via phone-based profile linking.** | A |
| C-12 | `supabase/functions/didit-webhook/index.ts:36-63` | **Webhook signature verification is bypassable.** If no signature header is present, the code logs a warning but proceeds anyway. | A |
| C-13 | `supabase/functions/didit-webhook/index.ts:25-29` | **Webhook accepts GET requests without signature verification.** Attacker can craft query params to approve any identity verification. | A |
| C-14 | `src/context/AuthContext.tsx:146-170` | **Direct Supabase writes from client with no RLS verification.** `updateOnboardingStep` and `completeOnboarding` write to `profiles` table using anon key. | A |

### 1.3 — SIMULATED SECURITY FEATURES (UNIQUE TO AUDIT B)

| # | File | Issue | Source |
|---|------|-------|--------|
| C-15 | `src/app/account/security.tsx`, `change-password.tsx`, `active-sessions.tsx` | **Security settings target Supabase Auth while real auth is Clerk.** Users believe their password, session revocation, and security settings are enforced when nothing actually happens. | B |
| C-16 | `src/app/account/two-factor-auth.tsx` | **Two-factor authentication is a simulated UI flow.** SMS send is `setTimeout` mock. Verification is `setTimeout` mock. Writes `security_settings.two_factor_enabled` without real factor enrollment. Creates false sense of security — worse than not offering 2FA. | B |
| C-17 | `src/app/account/delete-account.tsx` | **Delete-account does not actually delete the account.** Only soft-marks `profiles.deleted_at` and signs out. No Clerk user deletion, no data purge, no cascade cleanup for trips, community content, or linked records. Privacy/compliance risk. | B |
| C-18 | `src/app/account/active-sessions.tsx` | **Active sessions screen shows mock session counts.** Not wired to real Clerk session management. | B |

### 1.4 — MOCK DATA SHIPPED TO PRODUCTION

| # | File | Issue | Source |
|---|------|-------|--------|
| C-19 | `src/services/trip/trip-import.service.ts:791-817` | **OAuth token exchange returns hardcoded `'mock_access_token'`.** `getOAuthAccountInfo()` returns `'user@example.com'`. `fetchProviderBookings()` returns `[]`. Entire OAuth import pipeline is non-functional. | A+B |
| C-20 | `src/features/trips/components/BookingPassBottomSheet.tsx:97-127` | **Boarding pass shows hardcoded fake data:** passenger `"Alex Bajefski"`, gate `'A4'`, seat `'B2'`. Real users will see someone else's name. | A |
| C-21 | `src/features/trips/stores/trip.store.ts:75` | **`travelers` and `bookings` always hardcoded to empty arrays `[]`** — real data from DB never loaded into store. | A |
| C-22 | `supabase/functions/flight-search/index.ts:524,660-662` | **Fallback mock flight data generated in production** when APIs don't return results. | A |
| C-23 | `src/features/community/data/mockData.ts` | **440+ lines of fake communities, messages, events, buddy matches** exported and used in production. | A+B |
| C-24 | `src/features/community/data/guideMockData.ts` | **Fake guide profiles, listings, reviews, vouches** used in production. | A+B |
| C-25 | `src/features/community/data/feedMockData.ts` | **Fake feed posts, comments, traveler profiles** used in production. | A+B |
| C-26 | `src/features/community/components/DiscoverTabContent.tsx:52-201` | **5 hardcoded mock arrays** rendered directly to users. | A |
| C-27 | `src/features/community/components/feed/MembersTab.tsx:51-69` | **`MOCK_MEMBERS` hardcoded array** used instead of real member data. | A+B |
| C-28 | `src/features/ar-navigation/plugins/city-navigator/data/mockPOIs.ts` | **231 lines of fake POI data** with hardcoded Paris coordinates. | A |
| C-29 | `src/features/ar-navigation/plugins/danger-alerts/data/mockDangerData.ts` | **247 lines of fake danger zones** with hardcoded US-only `911` numbers. | A+B |

### 1.5 — SECURITY INFRASTRUCTURE

| # | File | Issue | Source |
|---|------|-------|--------|
| C-30 | `supabase/functions/_shared/cors.ts` + all functions | **All edge functions use `Access-Control-Allow-Origin: '*'`**. Any website can call your backend. | A+B |
| C-31 | `supabase/functions/send-crash-report/index.ts` | **No authentication on crash report endpoint + HTML injection.** Anyone can send arbitrary emails. Error fields interpolated into HTML without escaping. | A+B |
| C-32 | `src/services/trip/trip-import.service.ts:852-859` | **`encryptToken`/`decryptToken` use plain Base64 encoding.** Comment says "use proper encryption in production." | A+B |
| C-33 | `supabase/functions/test-ai-generation/index.ts` | **Test endpoint deployed to production** with hardcoded test profile data and service role key access. | A |
| C-34 | `supabase/functions/test-trip-services/index.ts` | **Test endpoint deployed to production** using `SUPABASE_SERVICE_ROLE_KEY` — grants full DB access. | A |
| C-35 | No rate limiting anywhere | **Zero rate limiting on all 50+ edge functions.** AI generation, flight search, hotel search, deal scanning — all unlimited. | A+B |

### 1.6 — CRITICAL FLOW BUGS (UNIQUE TO AUDIT B)

| # | File | Issue | Source |
|---|------|-------|--------|
| C-36 | `src/services/realtime/sos/sos.service.ts` + `supabase/functions/send-notification/index.ts` | **SOS notification contract mismatch.** `sos.service.ts` invokes `send-notification` with `{ type: 'sms'|'email', to, subject, body }` but the function expects `dispatch_pending`, `send_single`, `send_to_user` actions. Emergency contact notifications may silently fail during a real incident. | B |
| C-37 | `src/features/community/screens/BuddyProfileScreen.tsx`, `TravelerProfileScreen.tsx`, `GuideProfileScreen.tsx`, `ChatScreen.tsx` | **Community DM routing uses user IDs where conversation IDs expected.** Profile screens route to `/community/chat/${userId}` but chat handling expects a conversation/chat-room identifier. Messages can write against wrong record type. | B |
| C-38 | `src/services/notifications/community-notifications.ts` | **Community notification deep links point to dead or mismatched routes.** Tapping community notifications dumps users into broken navigation paths. | B |

---

## SECTION 2: HIGH SEVERITY (Should Fix Before Launch)

### 2.1 — Dead Code & Empty Stubs

| # | File | Issue | Source |
|---|------|-------|--------|
| H-01 | `src/hooks/useAuth.ts` | Returns empty object `{}`. Real auth is in `AuthContext.tsx`. | A+B |
| H-02 | `src/services/auth.service.ts` | Empty class `AuthService {}`. | A |
| H-03 | `src/services/user.service.ts` | Empty class `UserService {}`. | A |
| H-04 | `src/services/navigation.service.ts` | Empty class `NavigationService {}`. | A |
| H-05 | `src/services/translation.service.ts` | Empty class `TranslationService {}`. | A |
| H-06 | `src/services/cultural.service.ts` | Empty class `CulturalService {}`. | A |
| H-07 | `src/services/activity.service.ts` | Empty class `ActivityService {}`. | A |
| H-08 | `src/config/supabase.config.ts` | Empty object. | A |
| H-09 | `src/lib/supabase/database.ts`, `realtime.ts`, `storage.ts` | Three empty module stubs. | A |
| H-10 | `src/lib/supabase/auth.ts` | **201 lines of dead legacy Supabase Auth code** (pre-Clerk migration). If imported, calls Supabase Auth instead of Clerk. | A |
| H-11 | 33 files in `src/lib/` | **33 modules that export `{}`**: api/client, api/endpoints, api/interceptors, utils/formatters, utils/date, utils/permissions, utils/currency, utils/linking, utils/validators, notifications/*, storage/*, ai/*, booking/*, geolocation/*. | A |
| H-12 | `src/contexts/ThemeContext.tsx` | **Duplicate ThemeContext** — legacy copy forces `isDark = true`. Canonical is in `context/`. | A+B |

### 2.2 — Incomplete Features (User-Facing)

| # | File | Issue | Source |
|---|------|-------|--------|
| H-13 | `src/app/trip/edit.tsx` | **Edit trip screen is completely empty stub** — renders blank View. | A |
| H-14 | `src/features/trips/components/BookingPassBottomSheet.tsx:27-29` | Only flight bookings handled; hotel, car, activity return `null`. | A |
| H-15 | `src/features/trips/components/BookingPassBottomSheet.tsx:154-163` | "Download Ticket" and "Add to Wallet" buttons have no `onPress` handlers. | A |
| H-16 | `src/features/ar-navigation/hooks/useARCamera.ts:14-25` | **Entire hook is stub.** `requestPermission()` sets `hasPermission = true` without actually requesting. | A+B |
| H-17 | `src/features/ar-navigation/hooks/useARLocation.ts:15-28` | **Entire hook is stub.** No real location tracking. | A+B |
| H-18 | `src/features/ar-navigation/components/ARMapView.tsx:22-48` | **Entire component is placeholder.** Renders `<Text>Map View (Mapbox)</Text>`. | A |
| H-19 | `src/features/ar-navigation/plugins/danger-alerts/` | **Entire plugin is stubs.** Returns `[]`, renders empty `<View />`. | A+B |
| H-20 | `src/features/ar-navigation/plugins/city-navigator/hooks/useCityNavigation.ts` | Returns `{ isNavigating: false }`. Non-functional. | A |
| H-21 | `src/features/navigation/hooks/useOutdoorNavigation.ts:95-137` | Auto-rerouting declared but never implemented. | A+B |
| H-22 | `src/app/(auth)/landing.tsx:239-241` | **Terms of Service and Privacy Policy links are non-functional** — no `onPress` handler. | A |
| H-23 | `src/features/account/screens/AccountScreen.tsx:228` | `TODO: Implement avatar options modal`. | A |
| H-24 | `supabase/functions/provider-manager/index.ts:263,1189` | Search execution flagged as "mock for now". | A |
| H-25 | `supabase/functions/safety-alerts/index.ts:400,412` | `transformRisklineResponse` and `getEntryRequirements` are documented placeholders. | A |

### 2.3 — Incomplete Features (UNIQUE TO AUDIT B)

| # | File | Issue | Source |
|---|------|-------|--------|
| H-26 | `src/features/trip-import/steps/manual/*` | **Manual trip import flow is effectively simulated.** ManualFetchingStep, ManualResultStep, ManualSuccessStep simulate lookup/success without real provider lookup. | B |
| H-27 | `src/features/trips/components/DepartureAdvisor/DepartureAdvisorSheet.tsx` | **Departure Advisor fabricates travel guidance when backend fails.** Shows synthetic timing estimates that could cause missed flights. Should show unavailable state instead. | A+B |
| H-28 | `src/features/booking/flows/package/screens/PackageBuildScreen.tsx` | **Package booking flow is not real.** Still contains TODO actions and hard-coded provider assumptions. Should be hidden until checkout path is complete. | B |
| H-29 | `src/services/notifications/notificationService.ts`, `src/hooks/useNotifications.ts`, `supabase/functions/send-notification/index.ts` | **Notification infrastructure split across multiple incompatible models.** Delivery state, unread counts, and notification-center rendering disagree. | B |
| H-30 | `src/features/community/screens/CreateEventScreen.tsx` | **Event creation has wrong timing data and notification triggers not wired.** RSVP reminders may never send. | B |
| H-31 | `src/features/community/screens/GroupAdminScreen.tsx` | **Group admin toggles/settings are incomplete.** Moderation tools not functional. | B |
| H-32 | `src/components/settings/NotificationPreferencesCard.tsx` | **Notification permission recovery is broken.** Users who denied once can't recover from within the app. Needs open-settings flow. | B |

### 2.4 — Production Logging & PII Exposure

| # | File | Issue | Source |
|---|------|-------|--------|
| H-33 | Entire codebase | **800+ `console.log/warn/error` calls across 140+ files** not guarded by `__DEV__`. Leaks auth state, user IDs, API responses to device logs. | A+B |
| H-34 | `src/context/AuthContext.tsx:42-54` | Logs `clerkUserId`, `profileId`, `isSignedIn` on every render. | A |
| H-35 | `src/app/(auth)/landing.tsx:62-89` | Logs SSO session IDs, sign-up state, `missingFields`, `phoneNumber`. | A |
| H-36 | `src/components/auth/AuthGuard.tsx:19-48` | Logs auth state, route segments, redirect decisions. | A |
| H-37 | `src/lib/clerk/profileSync.ts:70-183` | 8 log calls exposing Clerk user IDs, profile IDs, sync operations. | A |
| H-38 | `src/features/ar-navigation/services/mapbox.service.ts:150,156` | Logs Google API key length and URL pattern. | A |

### 2.5 — State Management & Data Integrity

| # | File | Issue | Source |
|---|------|-------|--------|
| H-39 | `src/features/trips/stores/trip.store.ts:14,51` | `computeTripState()` and `dbTripToTrip()` typed as `any`. | A |
| H-40 | `src/features/trips/stores/trip.store.ts:380-403` | `publishTrip`, `startTrip`, `completeTrip`, `cancelTrip` don't call `canTransitionTo()` guard. Any trip can move to any state. | A |
| H-41 | `src/features/trips/plugins/journal/screens/EntryEditorScreen.tsx:412-417` | When `entryId` is falsy, `handleSave` shows success toast without saving — data loss for new entries. | A |
| H-42 | `src/features/trips/plugins/expenses/screens/ExpensesScreen.tsx:229-233` | `handleDeleteExpense` performs optimistic delete but doesn't revert on failure — permanent data loss. | A |
| H-43 | `src/features/trips/components/TripCard/ComprehensiveTripCard.tsx:167-172` | Rate limit check queries ALL trips without filtering by user. | A |
| H-44 | `src/context/AuthContext.tsx:119-126` | `signOut` does not clear AsyncStorage, Supabase session, or cached data. Stale tokens persist. | A |
| H-45 | `src/app/(onboarding)/setup.tsx:33-94` | Profile save sets `hasSavedProfile = true` before async completes. If save fails, flag prevents retry. | A |

### 2.6 — Error Handling Gaps

| # | File | Issue | Source |
|---|------|-------|--------|
| H-46 | `src/features/trips/screens/TripDetailScreen.tsx:161-165` | `loadTripData` silently swallows all errors. | A |
| H-47 | `src/features/trips/plugins/expenses/screens/ExpensesScreen.tsx:210-233` | Add/delete expense catch blocks only log — no user feedback. | A |
| H-48 | `src/features/trips/plugins/language/screens/LanguageScreen.tsx:200,208` | Empty `catch {}` blocks. | A |
| H-49 | `supabase/functions/ai-vision/index.ts:133` | `handleExtractMenu` calls `JSON.parse(cleanJson(raw))` without try-catch. Malformed Gemini response crashes function. | A |
| H-50 | Booking loading screens | **Search/booking flows mask provider outages as empty results.** Provider failures look like "no inventory" — hard to detect incidents. | B |

---

## SECTION 3: MEDIUM SEVERITY (Fix Within First Sprint)

### 3.1 — Hardcoded Colors (Dark Mode Broken)

**This is the single largest issue by volume.** ~200+ files use `StyleSheet.create` with static `colors` import instead of `useTheme()`.

| Area | Files Affected |
|------|---------------|
| **Trip Plugins** | ~25 files (Planner, Packing, Journal, Expenses, Compensation, DosDonts, Documents, Language) |
| **AR/Navigation** | ~20 files (LiveCameraMode, SnapshotMode, MenuScanMode, OrderBuilder, all AR components) |
| **Community/Connect** | ~55 files (CommunityCard, GuideCard, ListingCard, ActivityCard, PostCard, GroupHeader, etc.) |
| **Booking** | ~35 files (all flow screens, search results, provider cards) |
| **Homepage** | ~30 files (DealCard, EditorChoice, Trending, Luxury, Family, Budget, StackedCards, etc.) |
| **Account** | ~25 files (AccountScreen, edit-profile, privacy, security, delete-account, rewards, etc.) |
| **Common Components** | ~15 files (Toast, AIChatSheet, ActionButton, SafetyInfoSection, etc.) |

### 3.2 — Validation & Data Issues

| # | Issue | Source |
|---|-------|--------|
| M-01 | Weak email validation — only checks for `@` and `.`. Accepts `@.`, `a@b.` | A |
| M-02 | No password length validation on reset — user can set 1-char password | A |
| M-03 | Password validation only checks `>= 8` length, no complexity | A |
| M-04 | Expense screen divides by `budget` without zero check — `NaN`/`Infinity` | A |
| M-05 | `formatCurrency` always uses `$` regardless of `budgetCurrency` | A |
| M-06 | Null `start_date`/`end_date` falls back to `new Date()` silently | A |
| M-07 | Hardcoded fallback coordinates `[-117.0713, 32.7767]` (San Diego) | A |
| M-08 | Cache key uses first 100 chars + length — prefix+length collisions possible | A |

### 3.3 — Performance Issues

| # | Issue | Source |
|---|-------|--------|
| M-09 | `JSON.stringify(filters)` as useEffect dependency — infinite re-fetches | A |
| M-10 | Expenses list uses `map()` inside `ScrollView` instead of `FlatList` | A |
| M-11 | AR camera opened but never explicitly released on unmount | A |
| M-12 | `setTimeout(300ms)` not cleared on unmount — race condition | A |
| M-13 | `landmarks` object reference changes every render — potential infinite loop | A |
| M-14 | Hardcoded 1.5s delay between generation waves | A |

### 3.4 — Race Conditions

| # | Issue | Source |
|---|-------|--------|
| M-15 | Hardcoded 500ms delay before navigation in sign-in | A |
| M-16 | OTP auto-submit has no debounce — could fire multiple verification requests | A |
| M-17 | AuthContext useEffect depends on `clerkUser?.id` but accesses other fields that don't trigger re-sync | A |

### 3.5 — Community/Connect Specific

| # | Issue | Source |
|---|-------|--------|
| M-18 | Mock data modules explicitly exported from community barrel file | A+B |
| M-19 | Location sharing creates `mockLocation` with hardcoded data instead of real GPS | A |
| M-20 | Fallback image URL `'https://via.placeholder.com/56'` — external dependency | A+B |
| M-21 | Guide "Become a Guide" Step 4 (Identity Verification) documented as "mock" | A+B |
| M-22 | Community detail assumes viewer is always a member | B |

### 3.6 — Edge Function Issues

| # | Issue | Source |
|---|-------|--------|
| M-23 | Translation function has comment: "This is a placeholder" | A |
| M-24 | Experiences provider falls back to comprehensive mock data | A |
| M-25 | Only rate limiting found: `delay(500)` for Viator, `max 3/day` for deal scanning | A |
| M-26 | No request body validation on most functions | A+B |

### 3.7 — TODO Debt (Sampling)

| File | TODO | Source |
|------|------|--------|
| `src/services/analytics/analytics.ts:139-147` | Initialize Mixpanel, Amplitude, Firebase Analytics | A |
| `src/services/health/healthCheck.ts:117-129` | Implement actual health checks | A |
| `src/services/logging/logger.ts:103-199` | Send to Sentry, implement remote logging | A |
| `src/features/ar-navigation/components/ARContainer.tsx:64-65` | Add view mode toggle, search bar | A |
| `src/features/ar-navigation/plugins/menu-translator/MenuTranslatorPlugin.tsx:43` | Implement save to database | A |
| `supabase/functions/compute-travel-dna/index.ts:469` | Populate visa_free_countries | A |

---

## SECTION 4: LOW SEVERITY (Technical Debt)

### 4.1 — Dead Code

| Issue | Source |
|-------|--------|
| `LayoutAnimation` and `UIManager` imported but never used in TripDetailScreen | A |
| `animatedValue` created and animated but never applied in TripListScreen | A |
| `canTransitionTo` imported but never called in trip store | A |
| `scaleValue` animation runs with no visual effect in PackingScreen | A |
| Multiple unused empty state styles across plugins | A |
| `CLAIM_TYPES` duplicated in 3 locations | A |
| Static `colors` imported but unused in verify-otp, forgot-password (already using useTheme) | A |
| Deprecated redirect screens (sign-up.tsx, email-signin.tsx) should be removed | A |

### 4.2 — Code Quality

| Issue | Source |
|-------|--------|
| `shareCount` always hardcoded to `0` | A |
| Multiple `any` types on parameters and return values across plugins | A |
| `generateShareToken` uses `Math.random()` — not cryptographically secure | A |
| `deleteTrip` performs hard delete — inconsistent with soft-delete pattern | A |
| Label says "SET" instead of "SEAT" — typo in boarding pass | A |
| Barcode is 40 identical bars — visual placeholder | A |
| `Dimensions.get('window')` at module load — doesn't respond to orientation | A |
| "Edit" phone number text non-functional in verify-otp | A |
| Password reset success shows stale "click link in email" message after code-based reset | A |
| Voice language hardcoded to `'en-US'` | A |
| `currentTripPhase` hardcoded to `TripPhase.PRE_TRIP` | A |
| Emergency contacts hardcode US-only `911` | A+B |
| Location permissions requested with no user prompt | A |
| `ARContext` created inline every render with `null` values | A |
| `DESTINATION_PHOTOS` large hardcoded lookup table — doesn't scale | A |
| Hardcoded fallback Unsplash URL for missing cover images | A |
| OTP resend timer hardcoded to 59 seconds | A |
| "Add activity between" button logs to console only | A |
| All profile queries use `select('*')` — over-fetches sensitive fields | A |
| Webhook stores raw ID document images and face match data — ensure encryption at rest | A |
| `via.placeholder.com` fallbacks in hotel cards | B |

---

## SECTION 5: FEATURES NOT LAUNCH-SAFE

These features should be hidden, disabled, or gated before a broad launch:

| Feature | Issue | Source |
|---------|-------|--------|
| **Two-factor authentication** | Simulated UI, no real enrollment | B |
| **Delete account** | Doesn't actually delete data | B |
| **Active sessions / logout-all** | Mock session counts | B |
| **Trusted traveler verification** | Identity verification webhook bypassable | A+B |
| **Provider trip import (OAuth)** | Returns mock tokens, non-functional | A+B |
| **Manual import success flow** | Simulated lookup/success | B |
| **Departure Advisor fallback** | Fabricates timing data on failure | A+B |
| **Package booking** | Incomplete checkout path | B |
| **Community DM routing** | Uses wrong IDs for conversations | B |
| **Community member/admin tooling** | Admin toggles incomplete | B |
| **Event creation reminders** | Notification wiring incomplete | B |
| **Airport navigation** | AR stubs, non-functional | A |
| **City AR navigation** | Returns `isNavigating: false` | A |
| **SOS notification pipeline** | Contract mismatch with edge function | B |
| **Change password** | Calls Supabase Auth, not Clerk | B |

---

## SECTION 6: FILES TO DELETE OR ARCHIVE

**Total: ~52 files**

```
# Empty service classes
src/services/auth.service.ts
src/services/user.service.ts
src/services/navigation.service.ts
src/services/translation.service.ts
src/services/cultural.service.ts
src/services/activity.service.ts

# Empty configs
src/config/supabase.config.ts

# Dead hooks
src/hooks/useAuth.ts

# Legacy/dead Supabase modules
src/lib/supabase/auth.ts
src/lib/supabase/database.ts
src/lib/supabase/realtime.ts
src/lib/supabase/storage.ts

# Duplicate theme
src/contexts/ThemeContext.tsx

# Deprecated auth redirects
src/app/(auth)/sign-up.tsx
src/app/(auth)/email-signin.tsx
src/app/(onboarding)/index.tsx

# Test endpoints in production
supabase/functions/test-ai-generation/
supabase/functions/test-trip-services/
src/features/ar-navigation/utils/testGoogleMapsAPI.ts

# 33 empty modules in src/lib/
api/client.ts, api/endpoints.ts, api/interceptors.ts,
utils/formatters.ts, utils/date.ts, utils/permissions.ts,
utils/currency.ts, utils/linking.ts, utils/validators.ts,
notifications/notificationCenter.ts, notifications/localNotifications.ts,
notifications/pushNotifications.ts, notifications/handlers.ts,
storage/asyncStorage.ts, storage/secureStore.ts, storage/cache.ts,
ai/openai.ts, ai/translation.ts, ai/culturalContext.ts,
ai/safetyAnalysis.ts, ai/recommendations.ts,
booking/availability.ts, booking/confirmation.ts,
booking/calculators/fees.ts, booking/calculators/pricing.ts,
booking/providers/amadeus.ts, booking/providers/bookingcom.ts,
booking/providers/getyourguide.ts,
geolocation/locationTracker.ts, geolocation/mapUtils.ts,
geolocation/geofencing.ts
```

---

## SECTION 7: RECOMMENDED FIX PRIORITY ORDER

### Week 1 — Pre-Launch Blockers (Security + Safety)

1. **Rotate ALL secrets** — Add `.env` to `.gitignore`, rotate Clerk keys, Supabase keys, Google API keys, Mapbox token
2. **Move Supabase credentials to env vars** in `client.ts`
3. **Remove test endpoints** (`test-ai-generation`, `test-trip-services`) from production
4. **Fix webhook signature bypass** in `didit-webhook` — reject unsigned requests
5. **Restrict CORS** on all edge functions to your app's domain
6. **Fix account takeover** in `profileSync.ts` — require verification before linking
7. **Fix `clerkIdToUuid`** — use `uuid v5` with proper namespace
8. **Hide/disable simulated security features** — 2FA, active sessions, change password
9. **Fix delete-account** — implement real data purge or hide feature
10. **Fix SOS notification contract** — test full emergency path end-to-end
11. **Add rate limiting** to AI generation, search, and booking edge functions
12. **Proxy Google API calls** through edge functions (Vision, Translation, Places)

### Week 2 — User-Facing Fixes

13. **Remove/gate mock data** — community, flight fallbacks, boarding pass hardcoded data
14. **Fix empty screens** — `trip/edit.tsx`, AR stubs, danger alerts plugin
15. **Fix data loss bugs** — journal save, expense delete, onboarding save
16. **Fix community DM routing** — ensure conversation exists before routing
17. **Fix community notification deep links** — align URLs with real routes
18. **Fix trip state transitions** — call `canTransitionTo()` guard
19. **Add error feedback** — replace all `console.error`-only catches with user toasts
20. **Fix Terms/Privacy links** on landing page
21. **Clear auth state on signOut** — AsyncStorage, Supabase session, cached data
22. **Fix notification infrastructure** — standardize on one schema/lifecycle

### Week 3-4 — Dark Mode & Theme Compliance

23. **Systematic theme migration** — Convert `StyleSheet.create` with static `colors` to `useTheme()`:
    - Tab screens (home, trips, community, saved, account)
    - Trip detail and all plugins
    - Community hub and all sub-screens
    - Booking flows
    - AR/Navigation
    - Account/security screens

### Ongoing — Technical Debt

24. Remove 33 empty stub modules in `src/lib/`
25. Remove 6 empty service classes
26. Remove legacy `supabase/auth.ts`
27. Remove duplicate `contexts/ThemeContext.tsx`
28. Strip `console.log` calls or wrap in `__DEV__` guards
29. Add input validation to all edge functions
30. Replace `Math.random()` share tokens with crypto-secure generation
31. Replace Base64 "encryption" with real encryption for tokens
32. Implement analytics (Mixpanel, Amplitude, Firebase)
33. Implement health check with real connectivity test
34. Distinguish "no results" from "search failed" in booking UIs
35. Fix notification permission recovery

---

## SECTION 8: RELEASE STRATEGY

For a **waitlist/soft launch**, the safest path is:

1. **Gate off** every feature listed in "Features Not Launch-Safe" until implementation is real
2. **Fix auth/security/account-deletion** set first (Week 1 items 1-12)
3. **Fix notification model consistency** and community deep links second
4. **Lock down edge functions** and remove client-side billable AI calls third
5. **Run focused theme/token cleanup** on user-facing launch surfaces fourth
6. **Re-test all hidden-vs-enabled feature gates** before sending the waitlist email

### Feature Gate Recommendations

| Feature | Action | Reason |
|---------|--------|--------|
| Two-factor auth | **Hide** | Simulated, creates false security |
| Delete account | **Hide** | Doesn't actually delete |
| Active sessions | **Hide** | Mock data |
| Change password | **Hide** | Wrong backend |
| Package booking | **Hide** | Incomplete |
| Provider trip import | **Hide** | Mock OAuth |
| Airport AR navigation | **Hide** | Stub |
| SOS notifications | **Fix or hide** | Contract mismatch |
| Community admin tools | **Hide** | Incomplete |

---

## SECTION 9: AUDIT METHODOLOGY

This ultimate audit was produced by cross-referencing two independent parallel audits:

**Audit A (Anthropic Claude Opus 4.6):**
- 4 specialized agents scanned Auth/Security, Trips/Plugins, Navigation/AR, and Booking/Homepage
- Grep-based scans for TODO/FIXME, mock data, hardcoded colors, empty stubs, console.log, CORS wildcards
- Manual cross-reference of Community, Account, Notifications, Services, Supabase functions
- Coverage: All 1,033 source files, all 50+ edge functions

**Audit B (OpenAI GPT 5.4):**
- Repo-wide scan for TODOs, mock/fallback code, placeholder flows, hard-coded visual values
- Parallel domain reviews for auth/account, trips/booking, community/connect, navigation/AI/infrastructure
- Spot-check verification of highest-risk findings
- Cross-cutting pass for theme-system duplication, notification consistency, edge-function exposure

**Cross-Reference (This Document):**
- Items found by both audits marked `A+B`
- Items unique to one audit marked `A` or `B`
- 7 critical findings unique to Audit B added (simulated 2FA, delete-account, SOS mismatch, DM routing, etc.)
- 10 high findings unique to Audit B added (package booking, notification infra, event creation, etc.)
- Merged fix priority timeline and release strategy from both

---

## TRACKING

Use these labels when converting to tickets:

- `launch-blocker` — Section 1 items
- `security` — C-01 through C-18, C-30 through C-35
- `privacy` — C-17 (delete account), H-33 through H-38 (PII logging)
- `data-integrity` — H-39 through H-45
- `mock-data` — C-19 through C-29, M-18 through M-22
- `theme-system` — Section 3.1
- `dead-code` — H-01 through H-12, Section 4.1
- `infra` — C-30 through C-35, M-23 through M-26
- `notifications` — C-36, H-29, H-32
- `community` — C-37, C-38, M-18 through M-22
- `booking` — H-28, H-50
- `navigation` — H-16 through H-21
- `auth` — C-09 through C-18

---

*This document is the single source of truth for all production readiness fixes. Mark items as ✅ DONE as they are addressed.*
