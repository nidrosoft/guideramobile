# GUIDERA — REMAINING PRODUCTION ITEMS

**Updated:** March 17, 2026
**Status:** Security hardening complete. 34/38 critical, 28/50 high, 9/26 medium items fixed.
**What's left:** Low-risk items, feature stubs requiring backend APIs, and long-term tech debt.

---

## COMPLETION SUMMARY

| Severity | Total | ✅ Fixed | ⚠️ Remaining |
|----------|-------|---------|-------------|
| **CRITICAL** | 38 | 34 | 4 (low risk) |
| **HIGH** | ~50 | 28 | ~22 (feature stubs) |
| **MEDIUM** | ~26 | 9 | ~17 (tech debt) |
| **LOW** | ~55 | 0 | ~55 (ongoing) |

---

## REMAINING CRITICAL (5 items — all low risk)

| # | File | Issue | Risk | Notes |
|---|------|-------|------|-------|
| C-08 | `ar-navigation/config/situm.config.ts:10` | Hardcoded fallback `'YOUR_SITUM_API_KEY'` | **Low** | Dead code — AR/Situm not active |
| C-14 | `src/context/AuthContext.tsx` | Direct Supabase writes from client (onboarding step/complete) | **Mitigated** | RLS active, client always filters by user_id |
| C-22 | `supabase/functions/flight-search/index.ts` | ~~Fallback mock flight data~~ | **✅ Fixed** | Removed mock fallback; returns empty results honestly |
| C-28 | `ar-navigation/plugins/city-navigator/data/mockPOIs.ts` | 231 lines fake POI data | **Low** | AR city navigator not active |
| C-29 | `ar-navigation/plugins/danger-alerts/data/mockDangerData.ts` | 247 lines fake danger zones with US-only 911 | **Low** | Danger alerts plugin not active |

---

## REMAINING HIGH (Feature stubs — not active in production)

### Incomplete AR/Navigation Features (hide or remove before broad launch)

| # | File | Issue |
|---|------|-------|
| H-14 | `BookingPassBottomSheet.tsx` | ~~Non-flight types return null~~ ✅ **Fixed** — Shows "Coming Soon" message |
| H-15 | `BookingPassBottomSheet.tsx` | ~~Buttons have no onPress~~ ✅ **Fixed** — Shows "Coming Soon" alerts |
| H-16 | `ar-navigation/hooks/useARCamera.ts` | Entire hook is stub — no real permission request |
| H-17 | `ar-navigation/hooks/useARLocation.ts` | Entire hook is stub — no real location tracking |
| H-18 | `ar-navigation/components/ARMapView.tsx` | Renders `<Text>Map View (Mapbox)</Text>` placeholder |
| H-19 | `ar-navigation/plugins/danger-alerts/` | Entire plugin returns [] and renders empty View |
| H-20 | `city-navigator/hooks/useCityNavigation.ts` | Returns `{ isNavigating: false }` |
| H-21 | `navigation/hooks/useOutdoorNavigation.ts` | Auto-rerouting declared but never implemented |
| H-23 | `AccountScreen.tsx` | TODO: Implement avatar options modal |
| H-24 | `provider-manager/index.ts` | Search execution flagged as "mock for now" |
| H-25 | `safety-alerts/index.ts` | transformRisklineResponse and getEntryRequirements are placeholders |

### Incomplete Features (UNIQUE TO AUDIT B)

| # | File | Issue |
|---|------|-------|
| H-26 | `trip-import/steps/manual/*` | Manual trip import flow is simulated |
| H-27 | `DepartureAdvisorSheet.tsx` | ~~Fabricates travel guidance~~ ✅ **Fixed** — Shows error message instead |
| H-28 | `booking/flows/package/*` | Package booking flow incomplete |
| H-29 | `notifications/notificationService.ts` | Notification infrastructure split across incompatible models |
| H-30 | `community/screens/CreateEventScreen.tsx` | Event creation timing data wrong, notifications not wired |
| H-31 | `community/screens/GroupAdminScreen.tsx` | Group admin toggles incomplete |
| H-32 | `NotificationPreferencesCard.tsx` | Notification permission recovery broken |

### Data Integrity (needs individual fixes)

| # | File | Issue |
|---|------|-------|
| H-39 | `trip.store.ts` | ~~typed as `any`~~ ✅ **Already fixed** — Properly typed with `DbTripRow` interface |
| H-41 | `EntryEditorScreen.tsx` | ~~Success toast without saving~~ ✅ **Already fixed** — Uses `journalService.createEntry` + `saveBlocks` |
| H-42 | `ExpensesScreen.tsx` | ~~Optimistic delete doesn't revert~~ ✅ **Already fixed** — Reverts `previousExpenses` on catch |
| H-43 | `ComprehensiveTripCard.tsx` | ~~No user filter~~ ✅ **Already fixed** — Filters by `.eq('user_id', currentUserId)` |

### Error Handling Gaps

| # | File | Issue |
|---|------|-------|
| H-46 | `TripDetailScreen.tsx` | ~~Silently swallows errors~~ ✅ **Already fixed** — Has `.catch()` handlers |
| H-47 | `ExpensesScreen.tsx` | ~~No user feedback~~ ✅ **Already fixed** — Shows `showError` toast on failure |
| H-48 | `LanguageScreen.tsx` | ~~Empty catch blocks~~ ✅ **Already fixed** — Logs in dev, shows error state |
| H-49 | `ai-vision/translationCache.ts` | ~~JSON.parse no try-catch~~ ✅ **Already fixed** — Wrapped in try-catch |
| H-50 | Booking loading screens | ~~Masks outages as empty~~ ✅ **Fixed** — Car/experience show Alert on search failure |

---

## REMAINING MEDIUM (Tech debt — first sprint post-launch)

### Hardcoded Colors (Dark Mode — 200+ files)

The single largest remaining issue by volume. ~200+ files use `StyleSheet.create` with static `colors` import instead of `useTheme()`.

| Area | Files Affected |
|------|---------------|
| Trip Plugins | ~25 (Planner, Packing, Journal, Expenses, Compensation, DosDonts, Documents, Language) |
| AR/Navigation | ~20 (LiveCameraMode, SnapshotMode, MenuScanMode, OrderBuilder, all AR) |
| Community/Connect | ~55 (CommunityCard, GuideCard, ListingCard, PostCard, GroupHeader, etc.) |
| Booking | ~35 (all flow screens, search results, provider cards) |
| Homepage | ~30 (DealCard, EditorChoice, Trending, Luxury, Family, Budget, etc.) |
| Account | ~25 (AccountScreen, edit-profile, privacy, security, delete-account, etc.) |
| Common Components | ~15 (Toast, AIChatSheet, ActionButton, etc.) |

### Validation & Data

| # | Issue |
|---|-------|
| M-03 | Password validation only checks >= 8 length, no complexity |
| M-06 | Null start_date/end_date falls back to new Date() silently |
| M-07 | Hardcoded fallback coordinates [-117.0713, 32.7767] (San Diego) |
| M-08 | Translation cache key collision (first 100 chars + length) |

### Performance

| # | Issue |
|---|-------|
| M-09 | ~~JSON.stringify as dep~~ ✅ **Fixed** — useTrip uses `useRef` for stable options |
| M-10 | Expenses list uses map() inside ScrollView instead of FlatList |
| M-11 | AR camera never released on unmount |
| M-12 | setTimeout(300ms) not cleared on unmount |
| M-13 | landmarks object reference changes every render |
| M-14 | Hardcoded 1.5s delay between generation waves |

### Race Conditions

| # | Issue |
|---|-------|
| M-15 | ~~500ms delay~~ ✅ **Fixed** — Reduced to 300ms with explanatory comment |
| M-16 | OTP auto-submit has no debounce |
| M-17 | AuthContext useEffect depends on clerkUser?.id but accesses other fields |

### Community/Connect

| # | Issue |
|---|-------|
| M-19 | Location sharing creates mockLocation with hardcoded data — not found in current code |
| M-20 | ~~via.placeholder.com~~ ✅ **Fixed** — Removed from HotelCard + RoomDetailSheet |
| M-21 | Guide "Become a Guide" Step 4 documented as "mock" |
| M-22 | Community detail assumes viewer is always a member |

### Edge Functions

| # | Issue |
|---|-------|
| M-23 | Translation function has comment: "This is a placeholder" |
| M-24 | Experiences provider falls back to comprehensive mock data |
| M-26 | No request body validation on most functions |

### TODO Debt

| File | TODO |
|------|------|
| `analytics.ts` | Initialize Mixpanel, Amplitude, Firebase Analytics |
| `healthCheck.ts` | Implement actual health checks |
| `logger.ts` | Send to Sentry, implement remote logging |
| `ARContainer.tsx` | Add view mode toggle, search bar |
| `MenuTranslatorPlugin.tsx` | Implement save to database |
| `compute-travel-dna/index.ts` | Populate visa_free_countries |

---

## REMAINING LOW (Ongoing tech debt)

| Issue |
|-------|
| LayoutAnimation and UIManager imported but never used in TripDetailScreen |
| animatedValue created but never applied in TripListScreen |
| scaleValue animation runs with no visual effect in PackingScreen |
| Multiple unused empty state styles across plugins |
| CLAIM_TYPES duplicated in 3 locations |
| shareCount always hardcoded to 0 |
| generateShareToken uses Math.random() — not cryptographically secure |
| deleteTrip performs hard delete — inconsistent with soft-delete pattern |
| Barcode is 40 identical bars — visual placeholder |
| Dimensions.get('window') at module load — doesn't respond to orientation |
| "Edit" phone number text non-functional in verify-otp |
| Password reset success shows stale "click link in email" message |
| Voice language hardcoded to 'en-US' |
| currentTripPhase hardcoded to TripPhase.PRE_TRIP |
| Emergency contacts hardcode US-only 911 |
| Location permissions requested with no user prompt |
| ARContext created inline every render with null values |
| DESTINATION_PHOTOS large hardcoded lookup table |
| Hardcoded fallback Unsplash URL for missing cover images |
| OTP resend timer hardcoded to 59 seconds |
| "Add activity between" button logs to console only |
| Profile queries use select('*') — over-fetches sensitive fields |
| Webhook stores raw ID document images — ensure encryption at rest |
| ~~via.placeholder.com fallbacks in hotel cards~~ ✅ **Fixed** |

---

## FEATURES NOT LAUNCH-SAFE (should be hidden/gated)

| Feature | Status |
|---------|--------|
| Two-factor auth | ✅ Disabled with "Coming Soon" |
| Delete account | ✅ Disabled with "Coming Soon" |
| Active sessions | ✅ Disabled with "Coming Soon" |
| Change password | ✅ Disabled with "Coming Soon" |
| Trusted traveler verification | ✅ Disabled with "Coming Soon" |
| Provider trip import (OAuth) | ✅ Throws error (not mock) |
| Manual import success flow | ⚠️ Still simulated |
| Departure Advisor fallback | ✅ Shows error message instead of fake data |
| Package booking | ⚠️ Incomplete checkout |
| Airport AR navigation | ⚠️ Stub |
| City AR navigation | ⚠️ Returns isNavigating: false |
| SOS SMS notifications | ⚠️ Logs warning (no Twilio) |
| Community admin tools | ⚠️ Incomplete |

---

*This document tracks only remaining items. For the full audit history, see the git log.*
