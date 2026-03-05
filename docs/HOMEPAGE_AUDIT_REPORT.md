# Homepage Deep Audit Report

**Date:** March 5, 2026  
**Scope:** Full top-to-bottom audit of the homepage — header through Family Friendly section  
**Excludes:** Category action circles (Plan, Flight, Hotel, Package, Car, Experiences) — deferred per user request

---

## Summary

| Category | Count |
|---|---|
| 🔴 Critical (Mock Data / Fake Values) | 4 |
| 🟠 Not Implemented / Stub | 4 |
| 🟡 Dead Code / Unused Imports | 8 |
| 🔵 Inconsistencies / Minor Issues | 5 |
| **Total Issues** | **21** |

---

## 🔴 CRITICAL — Mock Data & Fake Values

### C1. StackedDestinationCards — Full Mock Data Fallback
**File:** `src/components/features/home/StackedDestinationCards.tsx:30-97`  
**Issue:** Contains a hardcoded `mockDestinations` array with 5 fake destinations (Christ the Redeemer, Eiffel Tower, etc.) with fake ratings, visitor counts, and Unsplash image URLs. When the API returns no `popular-destinations` section, these mock items are displayed as real content.  
**Impact:** Users see fake data with fake IDs. Tapping navigates to `/destinations/1` which won't resolve to a real destination detail page.  
**Fix:** Remove mock array. Return `[]` when no API data (same as all other sections already do). Show skeleton or empty state instead.

### C2. StackedDestinationCards — Fabricated Data Mapping
**File:** `src/components/features/home/StackedDestinationCards.tsx:110-127`  
**Issue:** Even with real API data, several fields are fabricated from unrelated data:
- `visitors` — computed from `matchScore` as `${(matchScore / 100).toFixed(1)}M/year` — **matchScore is not visitor count**
- `bestTime` — hardcoded heuristic: checks if tags include "spring"/"summer", else "Year-round" — **not real seasonal data**
- `isUNESCO` — set to `true` if rating ≥ 4.8 or has an "Editor" badge — **has nothing to do with UNESCO status**
- `trending` — fabricated percentage from matchScore — **not real trending data**
- `entryFee` — falls back to empty string, often blank  
**Fix:** Only display fields the API actually provides. Remove fabricated UNESCO/trending/visitors/bestTime mappings. If the API doesn't supply these fields, don't show them on the card.

### C3. LocalExperiencesSection — Fake Discount & Original Price
**File:** `src/components/features/home/sections/LocalExperiencesSection.tsx:91-102`  
**Issue:** When the Viator API doesn't return an `originalPrice`, the code fabricates one:
- `originalPrice` = `price.amount * 1.85` (inflates real price by 85%)
- `discountPercent` = hardcoded `46` (fake 46% off)  
This makes every experience appear to have a massive discount when none exists.  
**Impact:** Misleading pricing. Potential legal/trust issue.  
**Fix:** Only show `originalPrice` and `discountPercent` when the API actually provides them. Remove the fake multiplier and hardcoded 46.

### C4. Homepage Header — Fallback Avatar URL
**File:** `src/app/(tabs)/index.tsx:132`  
**Issue:** `source={{ uri: profile?.avatar_url || 'https://i.pravatar.cc/150?img=12' }}` — Falls back to a random avatar generator URL when the user has no avatar. This is a mock/dev placeholder.  
**Fix:** Replace with a local default avatar asset or initials-based avatar component.

---

## 🟠 NOT IMPLEMENTED / STUB

### N1. Notification Bell — Hardcoded Badge Count, No Navigation
**File:** `src/app/(tabs)/index.tsx:151-158`  
**Issue:**
- Notification badge shows hardcoded `3` — not connected to any real notification count
- `TouchableOpacity` has **no `onPress` handler** — tapping does nothing
- `NotificationContext.tsx` is a completely empty stub: `createContext({})`  
**Fix:** Wire up to notification system. Add `onPress` to navigate to notifications screen. Read count from a real notification service or context.

### N2. Location Display — Not Interactive, No "Set Location"
**File:** `src/app/(tabs)/index.tsx:139-141`  
**Issue:** The location text shows `profile?.location_name || profile?.city || t('home.setLocation')` but it's just a `<Text>` — not tappable. There's no way for the user to set or change their location from the header.  
Additionally, `LocationContext.tsx` is a completely empty stub: `createContext({})`.  
**Fix:** Make the location text tappable. Add a location picker sheet/modal. Implement LocationContext with real location state management.

### N3. TripReminder — Fully Hardcoded Mock
**File:** `src/app/(tabs)/index.tsx:202-205`  
**Issue:** The TripReminder is rendered with hardcoded props:
- `destination="Singapore"` — not from any real trip data
- `tripDate={new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000)}` — always "12 days from now"  
The component itself works perfectly (live countdown timer), but it's fed fake data. There's no logic to fetch the user's next upcoming trip.  
**Fix:** Connect to real trip/booking data. Show only if user has an upcoming trip. Hide if no trips exist.

### N4. Search Results — Not Verified End-to-End
**File:** `src/app/search/results.tsx`  
**Issue:** The search overlay navigates to `/search/results?q=...` and calls `searchService.performSearch()`. The search service exists but the actual search implementation against real data sources (Supabase destinations, Viator experiences, deals) needs verification that it returns meaningful results and isn't just returning empty arrays.  
**Fix:** Verify search service actually queries real data. Test end-to-end search flow.

---

## 🟡 DEAD CODE / UNUSED IMPORTS

### D1. `profileService` — Unused Import
**File:** `src/app/(tabs)/index.tsx:25`  
`import { profileService } from '@/services/profile.service'` — imported but never used anywhere in the file.

### D2. `Bookmark` — Unused Import  
**File:** `src/components/features/home/StackedDestinationCards.tsx:18`  
`Bookmark` is imported from `iconsax-react-native` but never used in JSX. The component uses `SaveButton` instead. The `styles.bookmarkButton` style definition (line 382-390) is also dead code.

### D3. `isDark` — Unused Variable
**File:** `src/components/features/home/StackedDestinationCards.tsx:101`  
`const { colors, isDark } = useTheme()` — `isDark` is destructured but never referenced.

### D4. `styles.skeletonCard` — Dead Style
**File:** `src/components/features/home/sections/DealsSection.tsx:192-198`  
`skeletonCard` style is defined but never referenced. The component now uses the `SkeletonDealCards` component instead.

### D5. `styles.centeredContent` + `styles.loadingText` — Dead Styles
**File:** `src/components/features/home/StackedEventCards.tsx:272-279`  
Both styles are defined in StyleSheet but never referenced in JSX. Loading is now handled by `SkeletonStackedEvents`.

### D6. `styles.skeleton*` — Dead Skeleton Styles (4 styles)
**File:** `src/components/features/home/sections/LocalExperiencesSection.tsx:133-151`  
Four dead styles: `skeleton`, `skeletonImage`, `skeletonInfo`, `skeletonLine`. Loading is now handled by `SkeletonLocalExperienceCards` component. These old inline skeleton styles are orphaned.

### D7. `useHomepageData` — Could Use `useHomepageDataSafe`
**File:** `src/app/(tabs)/index.tsx:26,47`  
`useHomepageData` is used (not dead), but note: it throws if called outside provider context. Since the homepage is always inside the provider this is safe, but it's inconsistent with every other component that uses `useHomepageDataSafe`.

### D8. Stale Doc Comments
**Files:** All 8 GIL-connected sections (Places, MustSee, EditorChoices, Trending, BestDiscover, BudgetFriendly, LuxuryEscapes, FamilyFriendly)  
All still say "Now uses real data from database with mock data fallback" in their doc comments, but none actually have mock data fallback anymore (they return `[]`). The comments are misleading.

---

## 🔵 INCONSISTENCIES / MINOR ISSUES

### I1. StackedDestinationCards — city/country Swapped in Mock Data
**File:** `src/components/features/home/StackedDestinationCards.tsx:34-35`  
Mock data has `city: 'Brazil', country: 'Rio de Janeiro'` — Brazil is the country, Rio is the city. This is reversed. (Will be removed with C1 fix, but noting for completeness.)

### I2. PlacesSection — Falls Back to `popular-destinations` Slug
**File:** `src/components/features/home/sections/PlacesSection.tsx:24-25`  
`homepageData?.sections?.find(s => s.slug === 'places') || homepageData?.sections?.find(s => s.slug === 'popular-destinations')` — This means PlacesSection and DestinationsSection can show the **same data** if there's no dedicated `places` slug. They should show different content.

### I3. MustSeeSection — Falls Back to `editors-choice` Slug
**File:** `src/components/features/home/sections/MustSeeSection.tsx:29-30`  
`homepageData?.sections?.find(s => s.slug === 'must-see') || homepageData?.sections?.find(s => s.slug === 'editors-choice')` — Same issue: MustSee and EditorChoices can show identical data.

### I4. EventsSection — Duplicate Location Permission Request
**File:** `src/components/features/home/sections/EventsSection.tsx:66-84`  
EventsSection independently requests location permission and does reverse geocoding. But the `useHomepage` hook in HomepageDataContext already requests location permission. This causes two permission prompts and two GPS lookups.  
**Fix:** Share location data from HomepageDataContext or a shared LocationContext.

### I5. SectionRenderer — "View All" Always Visible
**File:** `src/components/features/home/SectionRenderer.tsx:94-99`  
Every section always shows a "View All" button, even when the section has only 1-2 items. Could conditionally hide "View All" when there aren't enough items to justify a separate page.

---

## ✅ WHAT'S WORKING WELL

- **Deals Section** — Fully connected to GIL engine (`useGilDeals`), real personalized data, proper navigation to detail page
- **Events Section** — Real AI-discovered events via Gemini + Google Search grounding, proper location-based fetching
- **Local Experiences** — Real Viator API data, proper location detection with metro area fallback
- **Category Filter System** — 16+1 pills, context-based, all sections wired, visibility tracking works
- **Pull-to-Refresh** — Works across all sections including local experiences (refreshKey system)
- **Skeleton Loaders** — All sections have proper skeleton loading states
- **Dark Mode** — All homepage components use dynamic theme colors
- **Section Architecture** — Clean modular pattern with SectionRenderer + config-driven sections
- **Detail Pages** — All 4 detail page types (destinations, events, local-experiences, deals) have proper skeleton loading
- **View All Pages** — All 12 section types have working view-all routes

---

## 📋 IMPLEMENTATION PLAN

Ordered by priority and dependency. Each item is a discrete task.

### Phase 1: Remove Mock Data & Fake Values (Critical)
| # | Task | File(s) | Effort |
|---|---|---|---|
| 1.1 | Remove `mockDestinations` array, return `[]` when no API data | `StackedDestinationCards.tsx` | Small |
| 1.2 | Remove fabricated fields (UNESCO, trending%, visitors, bestTime) from destination card mapping — only show what API provides | `StackedDestinationCards.tsx` | Medium |
| 1.3 | Remove fake discount calculation (×1.85 multiplier, hardcoded 46%) from local experiences | `LocalExperiencesSection.tsx` | Small |
| 1.4 | Replace pravatar.cc fallback with local default avatar or initials component | `(tabs)/index.tsx` | Small |

### Phase 2: Wire Up Stubs (Not Implemented)
| # | Task | File(s) | Effort |
|---|---|---|---|
| 2.1 | Add `onPress` to notification bell → navigate to notifications screen | `(tabs)/index.tsx` | Small |
| 2.2 | Connect notification badge count to real data (or hide badge when 0) | `(tabs)/index.tsx` + NotificationContext | Medium |
| 2.3 | Make location text tappable → open location picker/settings | `(tabs)/index.tsx` | Medium |
| 2.4 | Connect TripReminder to real upcoming trip data, hide when no trips | `(tabs)/index.tsx` + trip service | Medium |
| 2.5 | Verify search end-to-end flow returns real results | `search/results.tsx` + search.service | Medium |

### Phase 3: Clean Up Dead Code
| # | Task | File(s) | Effort |
|---|---|---|---|
| 3.1 | Remove unused `profileService` import | `(tabs)/index.tsx` | Trivial |
| 3.2 | Remove unused `Bookmark` import + `bookmarkButton` dead style | `StackedDestinationCards.tsx` | Trivial |
| 3.3 | Remove unused `isDark` destructure | `StackedDestinationCards.tsx` | Trivial |
| 3.4 | Remove dead `skeletonCard` style | `DealsSection.tsx` | Trivial |
| 3.5 | Remove dead `centeredContent` + `loadingText` styles | `StackedEventCards.tsx` | Trivial |
| 3.6 | Remove 4 dead `skeleton*` styles | `LocalExperiencesSection.tsx` | Trivial |
| 3.7 | Update stale doc comments in 8 section files | Multiple | Trivial |

### Phase 4: Fix Inconsistencies
| # | Task | File(s) | Effort |
|---|---|---|---|
| 4.1 | Remove PlacesSection fallback to `popular-destinations` slug (prevent duplicate data with DestinationsSection) | `PlacesSection.tsx` | Small |
| 4.2 | Remove MustSeeSection fallback to `editors-choice` slug (prevent duplicate data with EditorChoicesSection) | `MustSeeSection.tsx` | Small |
| 4.3 | Consolidate location permission — share from HomepageDataContext to EventsSection instead of double GPS lookup | `EventsSection.tsx` + context | Medium |
| 4.4 | Conditionally hide "View All" when section has ≤ threshold items | `SectionRenderer.tsx` | Small |
