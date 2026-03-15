# Safety Alerts — Complete Redesign Plan

## Overview

Real-time, location-aware safety intelligence system that:
1. Tracks user location in background via geofencing
2. Queries multiple safety APIs when zone changes occur
3. Fires smart push notifications based on threat thresholds
4. Shows risk zones on a dark Mapbox map with SOS + Report features

---

## Architecture

```
User moves → expo-location tracks GPS continuously
        ↓
expo-task-manager detects zone entry (background geofencing)
        ↓
SafetyIntelligenceService queries APIs in parallel:
  ├── TravelRisk API (country risk + disaster alerts)
  ├── GDACS (real-time natural disasters, free, unlimited)
  ├── US State Dept (baseline country advisory level)
  └── CrimeoMeter (neighborhood crime data, free tier)
        ↓
Combine scores → apply threshold logic
        ↓
If risk ≥ threshold → expo-notifications fires push alert
        ↓
Store alert in Supabase safety_alerts table
        ↓
User sees alert on map + notification
```

---

## API Stack (All Free Tier Available)

| API | Purpose | Cost | Auth | Response Time |
|-----|---------|------|------|--------------|
| **TravelRisk API** | Country risk scores (1-5) + disaster alerts | Free 100 req/day | API key | <100ms |
| **GDACS** | Real-time earthquakes, floods, cyclones, volcanoes | Free unlimited | None | Minutes after event |
| **US State Dept** | Country-level advisory (Level 1-4) | Free unlimited | None | Daily updates |
| **CrimeoMeter** | Neighborhood crime data by GPS coords | Free tier on RapidAPI | API key | <200ms |

### Fallback Chain
```
1. Try TravelRisk API first (fastest, most structured)
2. If fails/limit → query GDACS directly (free, unlimited)
3. Always overlay US State Dept advisory (free baseline)
4. If in supported area → add CrimeoMeter crime data
5. Combine all scores → single risk level
```

---

## Threshold Logic (Don't Scare Users)

| Level | Combined Score | Example | Notification |
|-------|---------------|---------|-------------|
| 🟢 Safe | Risk < 2, Crime < 30 | Normal neighborhood | Silent — green badge on map |
| 🟡 Caution | Risk 2-3, Crime 30-60 | Above-average area | Subtle in-app tip |
| 🔴 High | Risk > 3 OR Crime > 60 | Known danger zone, Level 3 advisory | Push notification with details |
| 🚨 Critical | Active disaster OR Level 4 | Earthquake, active conflict | Loud urgent alert + haptics |

---

## Implementation Phases

### Phase 1: Safety Intelligence Service (~200 lines)
**File: `src/services/safety/safety-intelligence.service.ts`**

- `getRiskForLocation(lat, lng)` → queries all APIs in parallel
- `getTravelRiskScore(countryCode)` → TravelRisk API
- `getActiveDisasters(lat, lng, radius)` → GDACS RSS/API
- `getCountryAdvisory(countryCode)` → US State Dept JSON
- `getCrimeData(lat, lng, radius)` → CrimeoMeter API
- `combineScores(travelRisk, disasters, advisory, crime)` → single SafetyLevel
- Returns: `{ level, score, alerts[], summary, zones[] }`

### Phase 2: Background Geofencing (~150 lines)
**File: `src/services/safety/geofencing.service.ts`**

Uses `expo-location` + `expo-task-manager` (already in project):
```typescript
TaskManager.defineTask('SAFETY_GEOFENCE_TASK', async ({ data }) => {
  const { eventType, region } = data;
  if (eventType === Location.GeofencingEventType.Enter) {
    const risk = await safetyIntelligence.getRiskForLocation(region.latitude, region.longitude);
    if (risk.level >= NOTIFICATION_THRESHOLD) {
      await sendSafetyNotification(risk);
    }
    await saveSafetyAlert(risk); // Store in Supabase
  }
});
```

- Auto-create geofence zones around user's trip destinations
- Dynamic zone creation as user moves (rolling geofence)
- Toggle on/off from settings

### Phase 3: Database Schema
**Supabase migration: `safety_zone_alerts` table**

```sql
CREATE TABLE safety_zone_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  trip_id UUID REFERENCES trips(id),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  radius_meters INTEGER DEFAULT 5000,
  risk_level TEXT NOT NULL, -- 'safe', 'caution', 'high', 'critical'
  risk_score NUMERIC,
  country_code TEXT,
  country_advisory_level INTEGER, -- 1-4 from State Dept
  travel_risk_score NUMERIC, -- 1-5 from TravelRisk API
  crime_score NUMERIC, -- from CrimeoMeter
  active_disasters JSONB DEFAULT '[]',
  alerts JSONB DEFAULT '[]', -- array of alert objects
  summary TEXT,
  source TEXT, -- which API provided the data
  triggered_at TIMESTAMPTZ DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Phase 4: Notification System (~100 lines)
**File: `src/services/safety/safety-notifications.ts`**

- Uses existing `expo-notifications` setup
- Different notification styles per level:
  - 🟢 Safe: No notification
  - 🟡 Caution: Silent notification (badge only)
  - 🔴 High: Standard push with sound
  - 🚨 Critical: Urgent push + haptic vibration + persistent alert
- Deep links to safety map screen

### Phase 5: Redesigned Safety Map UI
**Rewrite: `DangerAlertsOverlay.tsx` + `DangerMapView.tsx`**

Clean up the current cluttered UI. New design:
- **Full-screen Mapbox dark map** (like the screenshot)
- **Risk zone circles** on map (green/yellow/red/critical colors)
- **Status bar at top**: "🟢 SAFE ZONE — No alerts" or "🔴 HIGH RISK — 3 active alerts"
- **SOS button** (bottom-right, red) — opens emergency dialer
- **Report button** (bottom-right, green) — user-submitted incident report
- **Safety radar** animation on user location (pulsing circle)
- **Legend at bottom**: Low / Medium / High / Critical color dots
- Remove: excessive sidebar widgets, scanning animation clutter

### Phase 6: Settings & Trip Integration
- Toggle safety alerts on/off in profile settings
- Auto-activate when user has an active trip
- Pre-load safety data for trip destinations before departure
- Show safety summary on trip detail screen

---

## File Structure

```
src/services/safety/
├── safety-intelligence.service.ts  — API queries + score combination
├── geofencing.service.ts           — Background zone tracking
├── safety-notifications.ts         — Push notification logic
├── apis/
│   ├── travel-risk.api.ts          — TravelRisk API client
│   ├── gdacs.api.ts                — GDACS disaster feed client
│   ├── state-dept.api.ts           — US State Dept advisory client
│   └── crimeometer.api.ts          — CrimeoMeter crime data client
└── types/
    └── safety.types.ts             — Shared types
```

---

## API Keys Needed

| API | Key Location | Status |
|-----|-------------|--------|
| TravelRisk API | `.env` → `EXPO_PUBLIC_TRAVEL_RISK_API_KEY` | Need to sign up at travelriskapi.com |
| GDACS | No key needed | ✅ Ready |
| US State Dept | No key needed | ✅ Ready |
| CrimeoMeter | `.env` → `EXPO_PUBLIC_CRIMEOMETER_API_KEY` | Need to sign up at RapidAPI |

---

## Build Order

1. **Safety types** — define shared interfaces
2. **API clients** — TravelRisk, GDACS, State Dept, CrimeoMeter (each <100 lines)
3. **Safety Intelligence Service** — orchestrates API calls + combines scores
4. **DB migration** — safety_zone_alerts table
5. **Geofencing service** — background zone tracking with expo-location
6. **Notification wiring** — threshold-based push alerts
7. **UI redesign** — clean Mapbox dark map with risk zones + SOS
8. **Settings integration** — toggle, trip auto-activation

---

## What This Replaces

The current safety alerts plugin has:
- ❌ Mock danger zones generated around user location
- ❌ Fake incident data
- ❌ No real API calls
- ❌ No background geofencing
- ❌ No push notifications
- ❌ Cluttered UI with too many sidebar widgets

The new system will have:
- ✅ Real-time risk data from 4 APIs
- ✅ Background geofencing that works even when app is killed
- ✅ Smart push notifications with threshold logic
- ✅ Risk zones displayed on Mapbox dark map
- ✅ SOS emergency button
- ✅ User incident reporting
- ✅ Trip-aware (pre-loads safety data for destinations)
- ✅ Stored in Supabase for history and analytics
