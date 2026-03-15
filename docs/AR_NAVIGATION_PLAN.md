# AR Navigation — Audit Findings & Implementation Plan

## Current State Audit

### What's Working
| Feature | Status | Notes |
|---------|--------|-------|
| **Ask AI** | ✅ Working | AI chat via existing AIChatSheet |
| **Scan Document** | ✅ Working | Camera + OCR pipeline |
| **Scan Receipt** | ✅ Working | Receipt → expense tracking |
| **Plugin System** | ✅ Working | Plugin architecture, sidebar selector, lifecycle hooks |
| **Camera** | ✅ Working | expo-camera with permissions flow |
| **Location** | ✅ Working | expo-location with GPS tracking |

### What Needs Work (5 Features)

#### 1. City Navigation 🗺️
**Current state:** UI built (map view, POI cards, transport mode selector, directions sheet, search). Uses **mock POIs** generated around user location and **mock polyline routes**. No real directions API.

**What's missing:**
- Real POI data (currently `generatePOIsAroundLocation()` creates fake restaurants/cafes)
- Real turn-by-turn directions (currently `generateMockPolyline()` creates straight lines)
- Real route distance/duration calculations
- POI search with real places data

**Files:** `CityNavigatorPlugin.tsx`, `useCityNavigator.ts`, `CityMapView.tsx`, `CityNavigatorOverlay.tsx`, `DirectionsSheet.tsx`, `POICard.tsx`, `mockPOIs.ts`

---

#### 2. Safety Alerts ⚠️
**Current state:** UI built (danger zones overlay, alert sheet, detail sheet, animated radar). Uses **mock danger zones** generated around user location.

**What's missing:**
- Real safety/crime data for the user's location
- Real-time incident reporting
- Integration with existing `safety_alerts` table in Supabase
- Push notifications for nearby danger zones

**Files:** `DangerAlertsPlugin.tsx`, `DangerAlertsOverlay.tsx`, `AlertSheet.tsx`, `DangerDetailSheet.tsx`

---

#### 3. Airport Navigation ✈️
**Current state:** UI built (destination input sheet, navigation overlay, instruction banner, navigation card, floor change indicator). Uses **mock route data** with simulated steps/floors.

**What's missing:**
- Real indoor map data for airports (floor plans, gate locations)
- Real indoor positioning (BLE beacons, Wi-Fi fingerprinting)
- Real route calculation between gates/amenities
- Airport database (IATA codes → floor plans)

**Files:** `AirportNavigatorPlugin.tsx`, `useAirportNavigation.ts`, `DestinationInputSheet.tsx`, `NavigationOverlay.tsx`, `NavigationCard.tsx`, `NavigationInfoCard.tsx`

---

#### 4. Translate Text (Menu Translator) 🍽️
**Current state:** Service file exists with **all methods returning null**. UI components exist but translation pipeline is not connected.

**What's missing:**
- Google Translate API integration (all methods are TODO stubs)
- OCR → Translation pipeline (camera capture → extract text → translate)
- Language detection
- Translation caching

**Files:** `translation.service.ts` (all methods return null), menu-translator plugin components

---

#### 5. Landmark Scanner (AR Mode) 🏛️
**Current state:** UI complete. Uses **3 hardcoded mock landmarks** (Statue of Liberty, Eiffel Tower, Big Ben). Camera viewfinder works but recognition is fake.

**What's missing:**
- Google Vision API integration (landmark detection returns null)
- Real image capture → API → landmark identification pipeline
- Dynamic landmark data fetching
- Image compression before API calls

**Files:** `vision.service.ts` (all methods return null), `useLandmarkRecognition.ts` (mock data)

---

## API Recommendations

### Tier 1: Use What We Already Have (Free/Cheap)

| Feature | Recommended API | Why | Cost |
|---------|----------------|-----|------|
| **City Navigation** | **Google Maps Platform** (Directions + Places) | Already have `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in the project. Directions API gives real routes, Places API gives real POIs. No new account needed. | $5/1000 directions, $17/1000 place details |
| **Translate Text** | **Google Cloud Translation API v2** | Simple REST API, pay-per-character. 500K chars/month free tier. Already documented in service file. | Free tier: 500K chars/mo, then $20/1M chars |
| **Landmark Scanner** | **Google Cloud Vision API** | Landmark detection is a single API call with base64 image. Already documented in service file. 1000 free/month. | Free tier: 1000 units/mo, then $1.50/1000 |

### Tier 2: Requires New Integration

| Feature | Recommended API | Why | Cost |
|---------|----------------|-----|------|
| **Safety Alerts** | **Supabase (existing DB)** + **OpenAI** | We already have `safety_alerts` table with 23 records + `safety_profiles` with AI-generated data. Use existing safety data + enrich with OpenAI for real-time summaries. No new API needed. | Existing infra |
| **Airport Navigation** | **No good free API exists** — use Supabase + manual data | Indoor navigation APIs (Situm, IndoorAtlas) are expensive enterprise products. Better approach: store airport floor plan images + gate coordinates in Supabase, do client-side pathfinding. | Free (manual data entry) |

### Tier 3: Alternative Approaches

| Feature | Alternative | Why |
|---------|------------|-----|
| **City Navigation** | **Apple MapKit** (iOS) / **Google Maps SDK** (Android) | Already using `react-native-maps`. Can use built-in directions without extra API calls on iOS. |
| **Translate Text** | **DeepL API** | Better quality translations than Google for European languages. Free tier: 500K chars/month. |
| **Landmark Scanner** | **OpenAI Vision (GPT-4o)** | More conversational — can describe what it sees, tell stories about landmarks. We already have OpenAI integrated. |

---

## Implementation Plan

### Phase 1: Quick Wins (Use Existing APIs)

#### 1A. City Navigation — Wire Google Directions API
- Replace `generateMockPolyline()` with real Google Directions API call
- Replace `generatePOIsAroundLocation()` with Google Places Nearby Search
- Wire real distance/duration from API response
- **Effort:** 2-3 hours | **Files to change:** `useCityNavigator.ts`, new `places.service.ts`

#### 1B. Translate Text — Wire Google Translate API
- Implement `translate()`, `detectLanguage()`, `translateBatch()` in `translation.service.ts`
- Wire camera capture → `vision.service.ts` OCR → `translation.service.ts` translate pipeline
- **Effort:** 2-3 hours | **Files to change:** `translation.service.ts`, menu-translator hook

#### 1C. Landmark Scanner — Wire Google Vision API
- Implement `detectLandmarks()` and `detectText()` in `vision.service.ts`
- Replace mock landmarks with real API results
- Add image capture from camera → base64 → API call flow
- **Effort:** 2-3 hours | **Files to change:** `vision.service.ts`, `useLandmarkRecognition.ts`

### Phase 2: Safety & Data (Use Existing DB)

#### 2A. Safety Alerts — Wire to Supabase
- Query `safety_alerts` table filtered by user's current location/country
- Query `safety_profiles` for AI-generated safety intelligence
- Replace mock danger zones with real data from `alerts` table (23 records exist)
- Add incident radius calculation based on lat/lng
- **Effort:** 2-3 hours | **Files to change:** danger-alerts hook, new `safety-data.service.ts`

### Phase 3: Airport Navigation (Longer Term)

#### 3A. Airport Navigation — MVP Approach
- Create `airport_maps` table in Supabase (airport code, gate list, amenity list, floor plan image URLs)
- Seed with top 50 airports manually or via aviation data API
- Client-side pathfinding between points on a 2D floor plan
- No real indoor positioning — use GPS + manual "I'm at gate X" input
- **Effort:** 1-2 days | Requires DB migration + data seeding

---

## Priority Order

1. **City Navigation** (highest user value, easiest to implement with Google Maps)
2. **Translate Text** (high travel utility, simple API integration)
3. **Landmark Scanner** (fun feature, simple API call)
4. **Safety Alerts** (data already exists in DB, just needs wiring)
5. **Airport Navigation** (most complex, requires floor plan data)

---

## API Keys Needed

| API | Key Name | Already Have? |
|-----|----------|--------------|
| Google Maps (Directions + Places) | `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | ✅ Yes (check if Directions + Places APIs are enabled) |
| Google Cloud Vision | `GOOGLE_VISION_API_KEY` | ❌ Need to enable in Google Cloud Console |
| Google Cloud Translation | `GOOGLE_TRANSLATE_API_KEY` | ❌ Need to enable in Google Cloud Console |

**Note:** All 3 Google APIs can use the SAME Google Cloud project. Just enable each API in the console and the existing key may work for all of them (check API restrictions on the key).
