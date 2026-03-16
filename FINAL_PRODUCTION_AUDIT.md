# GUIDERA — FINAL PRODUCTION READINESS AUDIT

**Date:** March 15, 2026
**Auditor:** Senior Production Readiness Review
**Scope:** Full codebase — 1,033 source files, 50+ Supabase edge functions, all features
**App:** React Native (Expo 54) / Clerk Auth / Supabase Backend / Zustand State

---

## EXECUTIVE SUMMARY

| Severity | Count | Description |
|----------|-------|-------------|
| **CRITICAL** | 31 | Must fix before any user sees the app |
| **HIGH** | 68 | Should fix before launch |
| **MEDIUM** | 85+ | Fix within first sprint post-launch |
| **LOW** | 50+ | Technical debt to address over time |

### Top 5 Systemic Issues

1. **Secrets & API Keys Exposed** — `.env` committed to git, Supabase credentials hardcoded in source, Google API keys shipped client-side
2. **Pervasive Hardcoded Colors (~200+ files)** — Nearly every feature uses `StyleSheet.create` with static color imports instead of `useTheme()`. Dark mode is fundamentally broken across most of the app
3. **Mock Data in Production (~15 data files)** — Community, booking, navigation, and trip features render fake data to real users
4. **35+ Empty Stub Modules** — `src/lib/` contains 33 files that export `{}`. Six services export empty classes. These are dead weight
5. **Zero Rate Limiting on Edge Functions** — All 50+ Supabase functions accept unlimited requests with wildcard CORS

---

## SECTION 1: CRITICAL FINDINGS (Must Fix Before Launch)

### 1.1 — SECRETS & CREDENTIALS

| # | File | Issue |
|---|------|-------|
| C-01 | `.env` | **`.env` is NOT in `.gitignore`** — only `.env*.local` is excluded. The `.env` file containing Clerk keys, Supabase URL + anon key, Google Maps API key, Mapbox token, and Travel Risk API key is committed to git history. Even adding it now requires rotating ALL secrets. |
| C-02 | `src/lib/supabase/client.ts:4-5` | **Supabase URL and anon key are hardcoded directly in source code** — `https://pkydmdygctojtfzbqcud.supabase.co` and the full JWT are baked into the client bundle instead of reading from env vars. |
| C-03 | `src/lib/supabase/client.ts:16` | **Supabase anon key is exported as a named export** — any module can import raw credentials. |
| C-04 | `src/features/ar-navigation/services/vision.service.ts:62` | **Google Cloud Vision API key sent client-side** in query parameter. Should be proxied through backend. |
| C-05 | `src/features/ar-navigation/services/translation.service.ts:47,69,89,113` | **Google Translation API key sent client-side** across 4 endpoints. Same exposed key. |
| C-06 | `src/features/ar-navigation/services/mapbox.service.ts:149-156` | **Google API key logged to console** and sent in client-side URL. |
| C-07 | `src/features/ar-navigation/services/GoogleMapsService.ts:64-68` | **`getApiKey()` method returns raw API key** to any caller. |
| C-08 | `src/features/ar-navigation/config/situm.config.ts:10` | **Hardcoded fallback `'YOUR_SITUM_API_KEY'`** ships in the bundle. |

### 1.2 — AUTHENTICATION & IDENTITY SECURITY

| # | File | Issue |
|---|------|-------|
| C-09 | `src/lib/clerk/profileSync.ts:9-27` | **`clerkIdToUuid` is cryptographically weak and collision-prone.** Uses simple char-code-to-hex mapping, not a real hash. Two Clerk IDs with same char set could collide, causing one user to overwrite another's profile. Use `uuid v5` with proper namespace. |
| C-10 | `src/lib/clerk/profileSync.ts:92-124` | **Account takeover via email-based profile linking.** When a new Clerk user signs in, if their email matches an existing profile, the code silently links them. An attacker who knows a victim's email could sign up via SSO and inherit the victim's profile. |
| C-11 | `src/lib/clerk/profileSync.ts:127-157` | **Same account takeover risk via phone-based profile linking.** |
| C-12 | `supabase/functions/didit-webhook/index.ts:36-63` | **Webhook signature verification is bypassable.** If no signature header is present, the code logs a warning but proceeds anyway. Attacker can forge identity verification payloads. |
| C-13 | `supabase/functions/didit-webhook/index.ts:25-29` | **Webhook accepts GET requests without any signature verification.** Attacker can craft `?session_id=X&status=Approved&vendor_data=Y` to approve any identity verification. |
| C-14 | `src/context/AuthContext.tsx:146-170` | **Direct Supabase writes from client with no RLS verification.** `updateOnboardingStep` and `completeOnboarding` write to `profiles` table using anon key. If RLS is misconfigured, any user could modify another's profile. |

### 1.3 — MOCK DATA SHIPPED TO PRODUCTION

| # | File | Issue |
|---|------|-------|
| C-15 | `src/services/trip/trip-import.service.ts:791-817` | **OAuth token exchange returns hardcoded `'mock_access_token'` and `'mock_refresh_token'`.** `getOAuthAccountInfo()` returns `'user@example.com'`. `fetchProviderBookings()` always returns `[]`. Entire OAuth import pipeline is non-functional. |
| C-16 | `src/features/trips/components/BookingPassBottomSheet.tsx:97-127` | **Boarding pass shows hardcoded fake data:** passenger `"Alex Bajefski"`, gate `'A4'`, seat `'B2'`, terminal `'4'`. Real users will see someone else's name. |
| C-17 | `src/features/trips/stores/trip.store.ts:75` | **`travelers` and `bookings` always hardcoded to empty arrays `[]`** — real data from DB never loaded into store. |
| C-18 | `supabase/functions/flight-search/index.ts:524,660-662` | **Fallback mock flight data generated in production** when APIs don't return results. Users see fake flights. |
| C-19 | `src/features/community/data/mockData.ts` | **Entire file (440+ lines) of fake communities, messages, events, buddy matches** exported and used in production via `index.ts` line 71. |
| C-20 | `src/features/community/data/guideMockData.ts` | **Entire file of fake guide profiles, listings, reviews, vouches** exported via `index.ts` line 72. |
| C-21 | `src/features/community/data/feedMockData.ts` | **Fake feed posts, comments, traveler profiles** used in production. |
| C-22 | `src/features/community/components/DiscoverTabContent.tsx:52-201` | **5 hardcoded mock arrays** (`MOCK_TRENDING_GROUPS`, `MOCK_TRIP_GROUPS`, `MOCK_TRAVELERS`, `MOCK_EVENTS`, `MOCK_DESTINATIONS`) rendered directly to users. |
| C-23 | `src/features/community/components/feed/MembersTab.tsx:51-69` | **`MOCK_MEMBERS` hardcoded array** used instead of real member data. |
| C-24 | `src/features/ar-navigation/plugins/city-navigator/data/mockPOIs.ts` | **231 lines of fake POI data** with fake names and hardcoded Paris coordinates. |
| C-25 | `src/features/ar-navigation/plugins/danger-alerts/data/mockDangerData.ts` | **247 lines of fake danger zones and incidents** with hardcoded US-only `911` numbers. |

### 1.4 — SECURITY INFRASTRUCTURE

| # | File | Issue |
|---|------|-------|
| C-26 | `supabase/functions/_shared/cors.ts` + all 33 functions | **All edge functions use `Access-Control-Allow-Origin: '*'`**. Any website can call your backend. Identity verification, AI generation, payment-related endpoints are all wide open. |
| C-27 | `supabase/functions/send-crash-report/index.ts:6-59` | **No authentication on crash report endpoint + HTML injection.** Anyone can send arbitrary emails. Error fields interpolated into HTML without escaping. |
| C-28 | `src/services/trip/trip-import.service.ts:852-859` | **`encryptToken`/`decryptToken` use plain Base64 encoding.** Comment says "use proper encryption in production." Tokens in DB are trivially reversible. |
| C-29 | `supabase/functions/test-ai-generation/index.ts` | **Test endpoint deployed to production** with hardcoded test profile data and service role key access. |
| C-30 | `supabase/functions/test-trip-services/index.ts` | **Test endpoint deployed to production** using `SUPABASE_SERVICE_ROLE_KEY` — grants full DB access to anyone who calls it. |
| C-31 | No rate limiting anywhere | **Zero rate limiting on all 50+ edge functions.** AI generation (Gemini calls), flight search, hotel search, deal scanning — all can be called unlimited times. A single bad actor could run up massive API bills. |

---

## SECTION 2: HIGH SEVERITY (Should Fix Before Launch)

### 2.1 — Dead Code & Empty Stubs

| # | File | Issue |
|---|------|-------|
| H-01 | `src/hooks/useAuth.ts` | Returns empty object `{}`. Real auth is in `AuthContext.tsx`. Any code importing this gets no auth state. |
| H-02 | `src/services/auth.service.ts` | Empty class `AuthService {}`. |
| H-03 | `src/services/user.service.ts` | Empty class `UserService {}`. |
| H-04 | `src/services/navigation.service.ts` | Empty class `NavigationService {}`. |
| H-05 | `src/services/translation.service.ts` | Empty class `TranslationService {}`. |
| H-06 | `src/services/cultural.service.ts` | Empty class `CulturalService {}`. |
| H-07 | `src/services/activity.service.ts` | Empty class `ActivityService {}`. |
| H-08 | `src/config/supabase.config.ts` | Empty object. Actual config is hardcoded in `lib/supabase/client.ts`. |
| H-09 | `src/lib/supabase/database.ts`, `realtime.ts`, `storage.ts` | Three empty module stubs. |
| H-10 | `src/lib/supabase/auth.ts` | **201 lines of dead legacy Supabase Auth code** (pre-Clerk migration). If accidentally imported, calls Supabase Auth instead of Clerk. |
| H-11 | 33 files in `src/lib/` | **33 modules that export `{}`**: `api/client.ts`, `api/endpoints.ts`, `api/interceptors.ts`, `utils/formatters.ts`, `utils/date.ts`, `utils/permissions.ts`, `utils/currency.ts`, `utils/linking.ts`, `utils/validators.ts`, `notifications/notificationCenter.ts`, `notifications/localNotifications.ts`, `notifications/pushNotifications.ts`, `notifications/handlers.ts`, `storage/asyncStorage.ts`, `storage/secureStore.ts`, `storage/cache.ts`, `ai/openai.ts`, `ai/translation.ts`, `ai/culturalContext.ts`, `ai/safetyAnalysis.ts`, `ai/recommendations.ts`, `booking/availability.ts`, `booking/confirmation.ts`, `booking/calculators/fees.ts`, `booking/calculators/pricing.ts`, `booking/providers/amadeus.ts`, `booking/providers/bookingcom.ts`, `booking/providers/getyourguide.ts`, `geolocation/locationTracker.ts`, `geolocation/mapUtils.ts`, `geolocation/geofencing.ts`. |
| H-12 | `src/contexts/ThemeContext.tsx` | **Duplicate ThemeContext** — legacy copy in `contexts/` folder while canonical is in `context/`. Creates confusion about which to import. |

### 2.2 — Incomplete Features (User-Facing)

| # | File | Issue |
|---|------|-------|
| H-13 | `src/app/trip/edit.tsx` | **Edit trip screen is a completely empty stub** — renders blank `View`. Users navigating here see a white screen. |
| H-14 | `src/features/trips/components/BookingPassBottomSheet.tsx:27-29` | Only flight bookings handled; hotel, car, activity types return `null`. |
| H-15 | `src/features/trips/components/BookingPassBottomSheet.tsx:154-163` | "Download Ticket" and "Add to Wallet" buttons have no `onPress` handlers. |
| H-16 | `src/features/ar-navigation/hooks/useARCamera.ts:14-25` | **Entire hook is stub.** `requestPermission()` sets `hasPermission = true` without actually requesting. `startCamera()`/`stopCamera()` are empty. |
| H-17 | `src/features/ar-navigation/hooks/useARLocation.ts:15-28` | **Entire hook is stub.** Same issue — no real permission request or location tracking. |
| H-18 | `src/features/ar-navigation/components/ARMapView.tsx:22-48` | **Entire component is placeholder.** Renders `<Text>Map View (Mapbox)</Text>`. |
| H-19 | `src/features/ar-navigation/plugins/danger-alerts/` | **Entire plugin is stubs.** `useDangerZones.ts` returns `[]`, `DangerOverlay.tsx` and `AlertSheet.tsx` render empty `<View />`. |
| H-20 | `src/features/ar-navigation/plugins/city-navigator/hooks/useCityNavigation.ts` | Returns `{ isNavigating: false }`. Non-functional. |
| H-21 | `src/features/navigation/hooks/useOutdoorNavigation.ts:95-137` | Auto-rerouting declared (`REROUTE_THRESHOLD_METERS = 50`) but never implemented. |
| H-22 | `src/app/(auth)/landing.tsx:239-241` | **Terms of Service and Privacy Policy links are non-functional** — styled as links but have no `onPress` handler. |
| H-23 | `src/features/account/screens/AccountScreen.tsx:228` | `TODO: Implement avatar options modal`. |
| H-24 | `supabase/functions/provider-manager/index.ts:263,1189` | Search execution flagged as "mock for now" and offer retrieval is "Placeholder". |
| H-25 | `supabase/functions/safety-alerts/index.ts:400,412` | `transformRisklineResponse` and `getEntryRequirements` are documented placeholders. |

### 2.3 — Production Logging & PII Exposure

| # | File | Issue |
|---|------|-------|
| H-26 | Entire codebase | **800+ `console.log/warn/error` calls across 140+ files** not guarded by `__DEV__`. In production, this leaks auth state, user IDs, API responses, navigation decisions, and profile data to device logs. |
| H-27 | `src/context/AuthContext.tsx:42-54` | Logs `clerkUserId`, `profileId`, `isSignedIn`, `onboardingCompleted` on every render. |
| H-28 | `src/app/(auth)/landing.tsx:62-89` | Logs SSO session IDs, sign-up state, `missingFields`, `phoneNumber`. |
| H-29 | `src/components/auth/AuthGuard.tsx:19-48` | Logs auth state, route segments, redirect decisions. |
| H-30 | `src/lib/clerk/profileSync.ts:70-183` | 8 log calls exposing Clerk user IDs, profile IDs, sync operations. |
| H-31 | `src/features/ar-navigation/services/mapbox.service.ts:150,156` | Logs Google API key length and URL pattern. |

### 2.4 — State Management & Data Integrity

| # | File | Issue |
|---|------|-------|
| H-32 | `src/features/trips/stores/trip.store.ts:14,51` | `computeTripState()` and `dbTripToTrip()` typed as `any` — zero type safety on DB-to-model mapping. |
| H-33 | `src/features/trips/stores/trip.store.ts:380-403` | `publishTrip`, `startTrip`, `completeTrip`, `cancelTrip` write state directly to DB without calling imported `canTransitionTo()` guard. Any trip can be moved to any state. |
| H-34 | `src/features/trips/plugins/journal/screens/EntryEditorScreen.tsx:412-417` | When `entryId` is falsy, `handleSave` shows success toast and navigates back **without actually saving** — data loss for new entries. |
| H-35 | `src/features/trips/plugins/expenses/screens/ExpensesScreen.tsx:229-233` | `handleDeleteExpense` performs optimistic delete but doesn't revert on API failure — permanent data loss. |
| H-36 | `src/features/trips/components/TripCard/ComprehensiveTripCard.tsx:167-172` | Rate limit check queries ALL trips with `modules_generated=true` without filtering by user — counts other users' generations. |
| H-37 | `src/context/AuthContext.tsx:119-126` | `signOut` does not clear AsyncStorage, Supabase session, or cached data. Stale tokens persist. |

### 2.5 — Error Handling Gaps

| # | File | Issue |
|---|------|-------|
| H-38 | `src/features/trips/screens/TripDetailScreen.tsx:161-165` | `loadTripData` silently swallows all errors with `.catch(() => {})`. |
| H-39 | `src/features/trips/plugins/expenses/screens/ExpensesScreen.tsx:210-233` | Add/delete expense catch blocks only log — no user feedback on failure. |
| H-40 | `src/features/trips/plugins/language/screens/LanguageScreen.tsx:200,208` | `toggleFavorite` and `handleSwitchKit` have empty `catch {}` blocks. |
| H-41 | `src/features/trips/plugins/planner/screens/PlannerScreen.tsx:175-177` | `handleAddActivity` catch only logs. |
| H-42 | `src/features/trips/plugins/packing/screens/PackingScreen.tsx:142-174` | Toggle/add item errors logged but no user toast. |
| H-43 | `supabase/functions/ai-vision/index.ts:133` | `handleExtractMenu` calls `JSON.parse(cleanJson(raw))` without try-catch. Malformed Gemini response crashes the function. |
| H-44 | `src/app/(onboarding)/setup.tsx:33-94` | Profile save sets `hasSavedProfile = true` before async completes. If save fails, flag prevents retry. User proceeds with unsaved data. |
| H-45 | `src/app/(onboarding)/setup.tsx:96-122` | If `saveProfileData` fails, confetti still fires and user is redirected regardless. |

---

## SECTION 3: MEDIUM SEVERITY (Fix Within First Sprint)

### 3.1 — Hardcoded Colors (Dark Mode Broken)

**This is the single largest issue by volume.** Nearly every feature module uses `StyleSheet.create` with static `colors` import from `@/styles` instead of using `useTheme()` in component body. This means dark mode is broken across most of the app.

**Affected Areas (200+ files with hardcoded hex colors):**

| Area | Files Affected | Sample Violations |
|------|---------------|-------------------|
| **Trip Plugins** | ~25 files | Planner, Packing, Journal, Expenses, Compensation, Dos-Donts, Documents, Language — all use static `colors` import in `StyleSheet.create` |
| **AR/Navigation** | ~20 files | LiveCameraMode (30+ hex), SnapshotMode (50+ hex), MenuScanMode (40+ hex), OrderBuilder (30+ hex), TranslationOverlay, AudioPlayerBar, LanguagePicker, ModeSelector, all AR components |
| **Community/Connect** | ~55 files | CommunityCard (20 hex), GuideCard (11), ListingCard (10), ActivityCard (12), PostCard (9), BuddyRequestCard (9), GroupHeader (24), LiveMapScreen (12), BecomeGuideScreen (19), PartnerApplicationScreen (31), CreateListingScreen (9), and many more |
| **Booking** | ~35 files | All booking flow screens, search results, provider cards |
| **Homepage Components** | ~30 files | DealCard, EditorChoiceCard, TrendingLocationCard, LuxuryEscapeCard, FamilyFriendlyCard, BudgetFriendlyCard, StackedDestinationCards, LocalExperienceCard, CreatorsContentSection, VideoPlayer |
| **Account** | ~25 files | AccountScreen, edit-profile, privacy, security, delete-account, referrals, rewards, membership, appearance, all preference screens |
| **Common Components** | ~15 files | Toast (13 hex), AIChatSheet (30 hex), ActionButton (14), SafetyInfoSection (5), PracticalInfoSection (12), DestinationListCard (7) |
| **Auth/Onboarding** | ~6 files | Landing gradient, SSO icons, intro feature cards, setup steps |

**Pattern to fix:** Replace `import { colors } from '@/styles'` in `StyleSheet.create` blocks with dynamic `useTheme()` colors inside component body, using inline styles or `useMemo`-based style objects.

### 3.2 — Specific Hardcoded Color Violations (Sampling)

| File | Line(s) | Colors |
|------|---------|--------|
| `trips/plugins/packing/screens/PackingScreen.tsx` | 39-47 | `'#EF4444'`, `'#3B82F6'`, `'#10B981'`, `'#F59E0B'`, `'#6366F1'`, `'#8B5CF6'`, `'#EC4899'` |
| `trips/plugins/compensation/screens/CompensationScreen.tsx` | 169-174 | `'#10B98115'`, `'#3B82F615'`, `'#F59E0B15'`, `'#EF444415'`, `'#6B728015'` |
| `trips/plugins/expenses/screens/ExpensesScreen.tsx` | 56-59, 991, 1162 | `'#E17055'`, `'#0984E3'`, `'#FDCB6E'`, `'#FFFFFF'` |
| `ar-navigation/plugins/ai-vision/components/ModeSelector.tsx` | 43-44 | `ACTIVE_COLOR = '#3FC39E'`, `INACTIVE_COLOR = 'rgba(255,255,255,0.5)'` |
| `navigation/components/OutdoorMap.tsx` | 149, 155 | `'#1a1a2e'`, `'#666'` |
| `navigation/components/NavigationHUD.tsx` | 132 | `'#EF4444'` |
| `navigation/MapScreen.tsx` | 134 | `'#0a0a0a'` |
| `trips/config/trip-states.config.ts` | 21-48 | `'#9CA3AF'`, `'#3B82F6'`, `'#10B981'`, `'#6B7280'`, `'#EF4444'` |
| `trips/plugins/documents/types/document.types.ts` | 166-179 | 7 hardcoded hex colors for status/priority |
| `trips/plugins/language/screens/LanguageScreen.tsx` | 124, 328, 467 | `'#1A1A1A'`, `'#F9FAFB'`, `'#1A2332'`, `'#EFF6FF'`, `'#FFFFFF'` |
| `auth/landing.tsx` | 132, 294, 322, 355 | `rgba(0,0,0,...)`, `'transparent'`, `rgba(255,255,255,0.3)` |
| `auth/sign-in.tsx` | 258, 266, 274 | `'#000000'` (Apple), `'#DB4437'` (Google), `'#1877F2'` (Facebook) |
| `onboarding/intro.tsx` | 197-228 | `'#FF6B6B'`, `'#38BDF8'`, `'#FB923C'`, `'#4ADE80'` |
| `onboarding/setup.tsx` | 15-19 | `'#818CF8'`, `'#F472B6'`, `'#F87171'`, `'#34D399'`, `'#FBBF24'` |

### 3.3 — TODO Comments (Unfinished Work)

| File | Line | TODO |
|------|------|------|
| `src/services/analytics/analytics.ts` | 139, 143, 147 | `TODO: Initialize Mixpanel`, `TODO: Initialize Amplitude`, `TODO: Initialize Firebase Analytics` |
| `src/services/health/healthCheck.ts` | 117, 129 | `TODO: Implement actual auth health check`, `TODO: Replace with actual Supabase health check` |
| `src/services/community/group.service.ts` | 343 | `TODO: Calculate from message_read_status` |
| `src/services/logging/logger.ts` | 103, 199 | `TODO: Send to Sentry in production`, `TODO: Implement remote logging endpoint` |
| `supabase/functions/compute-travel-dna/index.ts` | 469 | `TODO: populate visa_free_countries from passport_country lookup` |
| `src/features/trips/plugins/dos-donts/screens/DosDontsScreen.tsx` | 156-160 | Two `AI TODO` comments: trip phase filtering and location-based sorting |
| `src/features/trips/plugins/dos-donts/screens/DosDontsScreen.tsx` | 232-255 | `AI TODO: Send feedback to backend` — feedback stored locally only |
| `src/features/trips/plugins/language/screens/LanguageScreen.tsx` | 143 | `TODO: [PREMIUM] Empty state will show upgrade CTA once paywall is implemented` |
| `src/features/ar-navigation/components/ARContainer.tsx` | 64-65 | `TODO: Add view mode toggle button`, `TODO: Add search bar at top` |
| `src/features/ar-navigation/plugins/menu-translator/MenuTranslatorPlugin.tsx` | 43 | `TODO: Implement save to database` |
| `src/features/account/screens/AccountScreen.tsx` | 228 | `TODO: Implement avatar options modal` |

### 3.4 — Validation & Data Issues

| # | File | Issue |
|---|------|-------|
| M-01 | `src/app/(auth)/email-signup.tsx:43-57` | Weak email validation — only checks for `@` and `.`. Accepts `@.`, `a@b.`. |
| M-02 | `src/app/(auth)/forgot-password.tsx:64-88` | No password length validation on reset — user can set 1-char password. |
| M-03 | `src/app/(auth)/email-signup.tsx:52-55` | Password validation only checks `>= 8` length. No complexity requirements. |
| M-04 | `src/features/trips/plugins/expenses/screens/ExpensesScreen.tsx:112` | Divides by `budget` without zero check — produces `NaN`/`Infinity`. |
| M-05 | `src/features/trips/plugins/expenses/screens/ExpensesScreen.tsx:287-289` | `formatCurrency` always uses `$` regardless of `budgetCurrency` state. |
| M-06 | `src/features/trips/stores/trip.store.ts:68-69` | Null `start_date`/`end_date` falls back to `new Date()` — silently hides missing data. |
| M-07 | `src/features/navigation/components/OutdoorMap.tsx:49-50,155-156` | Hardcoded fallback coordinates `[-117.0713, 32.7767]` (San Diego) when location is null. |
| M-08 | `src/features/ar-navigation/plugins/ai-vision/services/translationCache.ts:24-28` | Cache key uses first 100 chars + length — texts with same prefix and length will collide. |

### 3.5 — Performance Issues

| # | File | Issue |
|---|------|-------|
| M-09 | `src/hooks/useTrips.ts:99` | `JSON.stringify(filters)` as `useEffect` dependency — creates new string every render if filters object is recreated, causing infinite re-fetches. |
| M-10 | `src/features/trips/plugins/expenses/screens/ExpensesScreen.tsx:493` | Expenses list renders up to 10 items with `map()` inside `ScrollView` instead of `FlatList`. |
| M-11 | `src/features/ar-navigation/components/ARCamera.tsx:57-60` | Camera opened but never explicitly released on unmount. Resource leak on some devices. |
| M-12 | `src/features/ar-navigation/plugins/ai-vision/components/LiveCameraMode.tsx:38-46` | `setTimeout(300ms)` not cleared on unmount — race condition on language change. |
| M-13 | `src/features/navigation/MapScreen.tsx:81` | `landmarks` object reference changes every render in `useEffect` dependency — potential infinite re-renders. |
| M-14 | `src/features/trips/components/TripCard/ComprehensiveTripCard.tsx:190` | `await new Promise(r => setTimeout(r, 1500))` — hardcoded 1.5s delay between generation waves. |

### 3.6 — Race Conditions

| # | File | Issue |
|---|------|-------|
| M-15 | `src/app/(auth)/sign-in.tsx:67` | Hardcoded 500ms delay before navigation — race condition workaround. |
| M-16 | `src/app/(auth)/verify-otp.tsx:66-70` | Auto-submit on OTP completion has no debounce — could fire multiple verification requests. |
| M-17 | `src/context/AuthContext.tsx:108` | `useEffect` depends on `clerkUser?.id` but accesses `emailAddresses`, `phoneNumbers`, `imageUrl`. Changes to those fields won't trigger re-sync. |

### 3.7 — Community/Connect Specific Issues

| # | File | Issue |
|---|------|-------|
| M-18 | `src/features/community/index.ts:71-72` | **Mock data modules explicitly exported** from feature barrel file: `export * from './data/mockData'` and `export * from './data/guideMockData'`. |
| M-19 | `src/features/community/components/ChatInput.tsx:144-152` | Location sharing creates a `mockLocation` object with hardcoded data instead of real GPS. |
| M-20 | `src/features/community/components/GroupsTabContent.tsx:150` | Fallback image URL `'https://via.placeholder.com/56'` — external dependency for placeholder. |
| M-21 | `src/features/community/screens/BecomeGuideScreen.tsx:8` | Step 4 (Identity Verification) documented as "mock". |
| M-22 | `src/features/community/` (55+ files) | **Pervasive hardcoded colors** — see Section 3.1 table. Community is one of the worst offenders with 55+ files containing hex color violations. |

### 3.8 — Supabase Edge Function Issues

| # | File | Issue |
|---|------|-------|
| M-23 | `supabase/functions/translation/index.ts:177` | Comment: "This is a placeholder - in production, always use the API". |
| M-24 | `supabase/functions/_shared/providers/experiences.ts:5` | "Falls back to comprehensive mock data when API key is not configured." |
| M-25 | `supabase/functions/deal-scanner/index.ts` | Only rate limiting found in entire backend: `await delay(500)` for Viator and `max 3 per day` throttle for deal scanning. All other functions have zero limits. |
| M-26 | All edge functions | No request body validation on most functions. Missing type checking on incoming JSON. |

---

## SECTION 4: LOW SEVERITY (Technical Debt)

### 4.1 — Dead Code & Unused Styles

| File | Issue |
|------|-------|
| `src/features/trips/screens/TripDetailScreen.tsx:2` | `LayoutAnimation` and `UIManager` imported but never used. |
| `src/features/trips/screens/TripDetailScreen.tsx:685-688` | 4 unused style definitions. |
| `src/features/trips/screens/TripListScreen.tsx:37` | `animatedValue` created and animated but never applied to any component. |
| `src/features/trips/stores/trip.store.ts:8` | `canTransitionTo` imported but never called. |
| `src/features/trips/plugins/packing/screens/PackingScreen.tsx:120-132` | `scaleValue` animation runs with no visual effect. |
| `src/features/trips/plugins/packing/screens/PackingScreen.tsx:576-605` | Unused empty state styles (replaced by `PluginEmptyState`). |
| `src/features/trips/plugins/planner/screens/PlannerScreen.tsx:714-743` | Same unused empty state styles. |
| `src/features/trips/plugins/dos-donts/screens/DosDontsScreen.tsx:790-823` | Same unused empty state styles. |
| `src/features/trips/plugins/compensation/screens/CompensationScreen.tsx:61-71` | `CLAIM_TYPES` duplicated — also in `compensation.types.ts` and `AddClaimBottomSheet.tsx`. |
| `src/app/(auth)/verify-otp.tsx:8`, `forgot-password.tsx:8` | Static `colors` imported but unused (already using `useTheme()`). |
| `src/app/(auth)/sign-up.tsx` | Deprecated redirect screen — should be removed. |
| `src/app/(auth)/email-signin.tsx` | Deprecated redirect screen — should be removed. |
| `src/app/(onboarding)/index.tsx` | Redirect-only screen — could be handled by router config. |
| `src/features/trips/components/TripCard/ComprehensiveTripCard.tsx:627-642` | Unused `daysUntilBadge` and `daysUntilText` styles. |

### 4.2 — Code Quality & Type Safety

| File | Issue |
|------|-------|
| `src/features/trips/stores/trip.store.ts:82` | `shareCount` always hardcoded to `0`. |
| `src/features/trips/plugins/planner/PlannerPlugin.tsx:29` | `mapToPluginActivity` parameter typed as `any`. |
| `src/features/trips/plugins/planner/screens/PlannerScreen.tsx:99,101` | `getColor` and `renderActivityIcon` parameters typed as `any`. |
| `src/features/trips/plugins/compensation/components/AddClaimBottomSheet.tsx:43` | `onSubmit` typed as `(claimData: any) => void`. |
| `src/features/ar-navigation/types/ar-plugin.types.ts:21-22` | `location: Location` references browser type, `cameraStream: any`. |
| `src/features/ar-navigation/plugins/airport-navigator/hooks/useAirportNavigation.ts:134` | `mapManeuverToDirection` return type is `any`. |
| `src/services/trip/trip.utils.ts:24-29` | `generateShareToken` uses `Math.random()` — not cryptographically secure. |
| `src/services/trip/trip-repository.ts:121-128` | `deleteTrip` performs hard delete — inconsistent with soft-delete pattern elsewhere. |
| `src/features/trips/components/BookingPassBottomSheet.tsx:105` | Label says "SET" instead of "SEAT" — typo. |
| `src/features/trips/components/BookingPassBottomSheet.tsx:140-145` | Barcode is 40 identical bars — visual placeholder, not real barcode. |
| `src/app/(auth)/landing.tsx:28` | `Dimensions.get('window')` at module load — doesn't respond to orientation changes. |
| `src/app/(auth)/verify-otp.tsx:196` | "Edit" phone number text is non-functional — no `onPress`. |
| `src/app/(auth)/forgot-password.tsx:77-78,164-193` | Password reset success screen shows stale "click the link in email" message after code-based reset. |
| Multiple `router.push` calls | `as any` casts on route strings — indicates type mismatches with router. |
| `src/features/navigation/services/voice.service.ts:29-35` | Voice language hardcoded to `'en-US'`. |
| `src/features/ar-navigation/services/vision.service.ts:12-13` | Uses `require()` instead of ES import. |
| `src/features/trips/plugins/expenses/components/AddExpenseBottomSheet.tsx:51-58` | `useState` initializers use `editingExpense?.amount` — won't update when prop changes. |
| `src/features/trips/plugins/dos-donts/screens/DosDontsScreen.tsx:138` | `currentTripPhase` hardcoded to `TripPhase.PRE_TRIP`. |
| `src/features/ar-navigation/plugins/danger-alerts/data/mockDangerData.ts:181-184` | Emergency contacts hardcode US-only `911`. |
| `src/features/navigation/hooks/useOutdoorNavigation.ts:57-63` | Location permissions requested with no user prompt or explanation. |
| `src/features/ar-navigation/components/ARCamera.tsx:38-47` | `ARContext` created inline every render with `null` values — never populated. |

### 4.3 — Miscellaneous

| File | Issue |
|------|-------|
| `src/services/trip/trip-import-engine.service.ts:113-169` | `DESTINATION_PHOTOS` is a large hardcoded lookup table — doesn't scale. |
| `src/features/trips/components/TripCard/ComprehensiveTripCard.tsx:272-274` | Hardcoded fallback Unsplash URL for missing cover images. |
| `src/features/trips/components/DepartureAdvisor/DepartureAdvisorSheet.tsx:124-156` | When edge function fails, fabricated mock advisory shown as real data. |
| `src/app/(auth)/verify-otp.tsx:20` | OTP resend timer hardcoded to 59 seconds — should use exponential backoff. |
| `src/features/trips/plugins/planner/PlannerPlugin.tsx:168-170` | "Add activity between" button logs to console only — no functionality. |
| `src/lib/clerk/profileSync.ts:54,96,130,197` | All profile queries use `select('*')` — over-fetches sensitive fields. |
| `supabase/functions/didit-webhook/index.ts:127-135` | Stores raw webhook payload including ID document images and face match data. Ensure encryption at rest. |
| `supabase/functions/didit-create-session/index.ts:76` | Logs `application_id` and full session body in production. |

---

## SECTION 5: RECOMMENDED FIX PRIORITY ORDER

### Week 1 — Pre-Launch Blockers

1. **Rotate ALL secrets** — Add `.env` to `.gitignore`, rotate Clerk keys, Supabase keys, Google API keys, Mapbox token
2. **Move Supabase credentials to env vars** in `client.ts`
3. **Remove test endpoints** (`test-ai-generation`, `test-trip-services`) from production
4. **Fix webhook signature bypass** in `didit-webhook` — reject unsigned requests
5. **Restrict CORS** on all edge functions to your app's domain
6. **Remove/gate mock data** — especially community mock data, flight fallback mocks, boarding pass hardcoded data
7. **Fix account takeover** in `profileSync.ts` — require email/phone verification before linking
8. **Fix `clerkIdToUuid`** — use `uuid v5` with proper namespace
9. **Add rate limiting** to AI generation, search, and booking edge functions
10. **Proxy Google API calls** through Supabase edge functions (Vision, Translation, Places)

### Week 2 — User-Facing Fixes

11. **Fix empty screens** — `trip/edit.tsx`, AR stubs, danger alerts plugin
12. **Fix data loss bugs** — journal save, expense delete, onboarding save
13. **Fix trip state transitions** — actually call `canTransitionTo()` guard
14. **Add error feedback** — replace all `console.error`-only catches with user-facing toasts
15. **Fix boarding pass** — pull real passenger name, gate, seat from booking data
16. **Fix Terms/Privacy links** on landing page
17. **Clear auth state on signOut** — AsyncStorage, Supabase session, cached data

### Week 3-4 — Dark Mode & Theme Compliance

18. **Systematic theme migration** — Convert all `StyleSheet.create` with static `colors` to `useTheme()` pattern. Start with most-used screens:
    - Tab screens (home, trips, community, saved, account)
    - Trip detail and all plugins
    - Community hub and all sub-screens
    - Booking flows
    - AR/Navigation

### Ongoing — Technical Debt

19. **Remove 33 empty stub modules** in `src/lib/`
20. **Remove 6 empty service classes**
21. **Remove legacy `supabase/auth.ts`**
22. **Remove duplicate `contexts/ThemeContext.tsx`**
23. **Remove deprecated auth redirect screens**
24. **Strip `console.log` calls** or wrap in `__DEV__` guards
25. **Add input validation** to all edge functions
26. **Replace `Math.random()` share tokens** with crypto-secure generation
27. **Replace Base64 "encryption"** with real encryption for tokens
28. **Implement analytics initialization** (Mixpanel, Amplitude, Firebase)
29. **Implement health check** with real Supabase connectivity test
30. **Add proper barcode rendering** to boarding pass

---

## SECTION 6: FILES TO DELETE OR ARCHIVE

These files serve no purpose and should be removed:

```
src/services/auth.service.ts          (empty class)
src/services/user.service.ts          (empty class)
src/services/navigation.service.ts    (empty class)
src/services/translation.service.ts   (empty class)
src/services/cultural.service.ts      (empty class)
src/services/activity.service.ts      (empty class)
src/config/supabase.config.ts         (empty object)
src/hooks/useAuth.ts                  (returns {})
src/lib/supabase/auth.ts              (dead legacy code)
src/lib/supabase/database.ts          (empty)
src/lib/supabase/realtime.ts          (empty)
src/lib/supabase/storage.ts           (empty)
src/contexts/ThemeContext.tsx          (duplicate)
src/app/(auth)/sign-up.tsx            (deprecated redirect)
src/app/(auth)/email-signin.tsx       (deprecated redirect)
src/app/(onboarding)/index.tsx        (redirect only)
supabase/functions/test-ai-generation/ (test endpoint)
supabase/functions/test-trip-services/ (test endpoint)
src/features/ar-navigation/utils/testGoogleMapsAPI.ts (test utility)

Plus 33 empty modules in src/lib/:
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

**Total files to remove: ~52 files**

---

## SECTION 7: AUDIT METHODOLOGY

This audit was conducted in multiple passes:

1. **Pass 1 (Agent-Driven):** 4 specialized agents scanned Auth/Security, Trips/Plugins, Navigation/AR, and Booking/Homepage — reading every file in those directories
2. **Pass 2 (Targeted Scans):** Grep-based scans for TODO/FIXME comments, mock data patterns, hardcoded colors, empty stubs, console.log calls, CORS wildcards, and rate limiting across the entire codebase
3. **Pass 3 (Cross-Reference):** Manual review of Community, Account, Notifications, Services, and Supabase functions for patterns identified in earlier passes
4. **Verification:** Key findings verified by reading actual file contents

**Coverage:** All 1,033 source files were scanned. All 50+ Supabase edge functions were reviewed. Every feature directory was examined.

---

*This document should be used as the tracking file for all production readiness fixes. Mark items as DONE as they are addressed.*
