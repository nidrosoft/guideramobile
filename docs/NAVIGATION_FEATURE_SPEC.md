# Navigation Feature — Full Architecture Plan

## Analysis: What We Have vs What's Needed

### What EXISTS (reusable)
| Component | Status | Can Reuse? |
|-----------|--------|-----------|
| `@rnmapbox/maps` installed + token configured | ✅ | Yes — outdoor maps |
| `mapbox.service.ts` — directions, geocoding, POIs | ✅ | Yes — city navigation |
| `CityMapView.tsx` — Mapbox dark map with POI markers | ✅ | Yes — base for outdoor map |
| `useCityNavigator.ts` — POI loading, route creation | ✅ | Yes — refactor into useOutdoorNavigation |
| `useAirportNavigation.ts` — gate search + walking dirs | ✅ | Yes — refactor for Mappedin |
| `useLandmarkRecognition.ts` — Vision API wired | ✅ | Yes — landmark scanning |
| Safety services (TravelRisk, GDACS, geofencing) | ✅ | Yes — safety heatmap |
| `expo-location` + `expo-task-manager` | ✅ | Yes — GPS tracking |
| Trip import scan flow (ticket scanning) | ✅ | Yes — boarding pass data |

### What's NEW (must build)
| Component | Effort | Dependency |
|-----------|--------|-----------|
| `@mappedin/react-native-sdk` — indoor airport maps | High | Needs Mappedin API key + secret |
| `MapScreen.tsx` — unified map screen with 4 modes | Medium | Mode switcher UI |
| `OutdoorMap.tsx` — 3D Mapbox nav with voice + reroute | Medium | Mapbox (have token) |
| `IndoorMap.tsx` — Mappedin airport wayfinding | High | Mappedin key needed |
| `NavigationHUD.tsx` — ETA, distance, instructions | Medium | - |
| `TurnInstructionBanner.tsx` — turn-by-turn banner | Low | - |
| `SafetyHeatmap.tsx` — Mapbox heatmap layer | Medium | Safety service (done) |
| Voice guidance (`expo-speech`) | Low | Built-in |
| Auto indoor/outdoor switching | Medium | Mappedin + geofencing |

## API Keys Status

| Key | Status | Action Needed |
|-----|--------|--------------|
| `MAPBOX_ACCESS_TOKEN` | ✅ Have it | Already in .env |
| `MAPPEDIN_API_KEY` | ❌ Missing | User needs to sign up at mappedin.com |
| `MAPPEDIN_SECRET_KEY` | ❌ Missing | Same — get from Mappedin Maker |
| `GOOGLE_MAPS_API_KEY` | ✅ Have it | Already in .env |
| `TRAVEL_RISK_API_KEY` | ✅ Have it | Already in .env |
| `CRIMEOMETER_API_KEY` | ⏸️ Skipped | $250/mo — deferred |
| `OFFENDERS_IO_API_KEY` | ❌ Missing | US-only, sign up at offenders.io |

## Build Order (Phased)

### Phase 1: Core Map Screen + Outdoor Navigation (Can build NOW)
Everything needed is already available — Mapbox token, directions service, POI search.

**Files to create:**
```
src/features/navigation/
├── MapScreen.tsx              — Main screen with mode tabs
├── components/
│   ├── OutdoorMap.tsx         — Mapbox 3D city navigation
│   ├── LandmarkMode.tsx       — POI search + markers + navigate-to
│   ├── NavigationHUD.tsx      — Bottom panel: ETA, distance, next turn
│   ├── TurnBanner.tsx         — Top banner for turn instructions
│   └── ModeSelector.tsx       — Bottom tabs: City / Airport / Landmarks
├── hooks/
│   ├── useOutdoorNavigation.ts — Mapbox directions + rerouting + voice
│   └── useLandmarkSearch.ts    — POI search + category filtering
└── services/
    └── voice.service.ts        — expo-speech wrapper for voice guidance
```

### Phase 2: Indoor Airport Navigation (Needs Mappedin key)
Cannot build until user provides Mappedin API key + secret.

**Files to create when key available:**
```
src/features/navigation/
├── components/
│   ├── IndoorMap.tsx          — Mappedin airport wayfinding
│   └── AirportBottomSheet.tsx — Gate info + walking steps
├── hooks/
│   └── useAirportNavigation.ts — Mappedin venue lookup + routing
└── services/
    └── mappedin.service.ts     — Mappedin API calls
```

### Phase 3: Safety Heatmap (Can build NOW)
Use existing safety intelligence service + Mapbox heatmap layer.

**Files to create:**
```
src/features/navigation/
├── components/
│   └── SafetyHeatmap.tsx      — Mapbox heatmap overlay (toggleable)
```

### Phase 4: Auto Indoor/Outdoor Switching
Requires both Mapbox and Mappedin working. Geofence around airports.

---

## Important Notes

1. **Mappedin requires Pro/Solutions plan for custom maps** — the demo key only works for demo maps (shopping malls), NOT real airports. Airport maps require a paid Mappedin account OR partnership.

2. **Mapbox is fully available NOW** — we can build the entire outdoor navigation (City mode + Landmarks mode) immediately with the existing token.

3. **The spec mentions `@googlemaps/react-native-navigation-sdk` as fallback** — this requires React Native New Architecture (Fabric) and conflicts with react-native-maps. Recommend skipping this and using Mapbox as the sole outdoor provider.

4. **`expo-speech` for voice guidance** — built into Expo, no install needed.

5. **The file structure in the spec puts files under `/screens` and `/components/map`** — I'll adapt this to our existing `src/features/navigation/` pattern for consistency.
