# 🗺️ SITUM INTEGRATION PLAN

## Phase 1: Real Indoor Positioning & Routing

---

## 📋 SETUP CHECKLIST

### **1. Situm Account Setup**
- [ ] Create account at [https://dashboard.situm.com](https://dashboard.situm.com)
- [ ] Get API Key from dashboard
- [ ] Create building profile for airport
- [ ] Upload floor plans
- [ ] Calibrate positioning (WiFi/BLE mapping)
- [ ] Add POIs (gates, restrooms, food courts, etc.)

### **2. Environment Configuration**
```bash
# Add to .env
SITUM_API_KEY=your_api_key_here
SITUM_BUILDING_ID=your_building_id_here
```

### **3. Update Config**
```typescript
// src/features/ar-navigation/config/situm.config.ts
export const SITUM_CONFIG = {
  API_KEY: process.env.SITUM_API_KEY,
  BUILDINGS: {
    AIRPORT_TERMINAL_1: 'your-building-id',
  },
};
```

---

## 🔧 INTEGRATION STEPS

### **Step 1: Initialize Situm Service**

**File:** `src/features/ar-navigation/hooks/useAirportNavigation.ts`

```typescript
import { situmService } from '../services/SitumService';
import { SITUM_CONFIG } from '../config/situm.config';

export function useAirportNavigation() {
  const [userLocation, setUserLocation] = useState<SitumLocation | null>(null);
  
  useEffect(() => {
    // Initialize Situm on mount
    const initSitum = async () => {
      try {
        await situmService.initialize(SITUM_CONFIG.API_KEY);
        
        // Start positioning
        await situmService.startPositioning(
          SITUM_CONFIG.BUILDINGS.AIRPORT_TERMINAL_1,
          (location) => {
            setUserLocation(location);
            console.log('📍 User location:', location);
          }
        );
      } catch (error) {
        console.error('Failed to initialize Situm:', error);
      }
    };
    
    initSitum();
    
    return () => {
      situmService.stopPositioning();
    };
  }, []);
  
  // ... rest of hook
}
```

---

### **Step 2: Replace Mock Routes with Real Routes**

**Before (Mock):**
```typescript
const startNavigation = (destination: string) => {
  const mockRoute = MOCK_ROUTES[destination];
  setRoute(mockRoute);
};
```

**After (Real):**
```typescript
const startNavigation = async (destination: string) => {
  if (!userLocation) {
    console.error('User location not available');
    return;
  }
  
  try {
    // Find destination POI
    const destPOI = await situmService.findPOI(
      SITUM_CONFIG.BUILDINGS.AIRPORT_TERMINAL_1,
      destination
    );
    
    if (!destPOI) {
      console.error('Destination not found');
      return;
    }
    
    // Calculate real route
    const situmRoute = await situmService.calculateRoute(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        floorIdentifier: userLocation.floorIdentifier,
      },
      destPOI.position,
      false // accessible routes
    );
    
    // Convert to app format
    const route: NavigationRoute = {
      destination: destPOI.name,
      destinationType: 'gate',
      totalDistance: Math.round(situmRoute.distance),
      estimatedTime: Math.round(situmRoute.time / 60), // seconds to minutes
      currentStep: 0,
      totalSteps: situmRoute.segments.length,
      steps: situmRoute.segments.map((segment, index) => ({
        id: `${index}`,
        instruction: segment.instruction,
        distance: Math.round(segment.distance),
        direction: segment.direction as NavigationDirection,
        floor: situmRoute.points[index]?.floorIdentifier || userLocation.floorIdentifier,
      })),
    };
    
    setRoute(route);
    setIsNavigating(true);
  } catch (error) {
    console.error('Failed to calculate route:', error);
  }
};
```

---

### **Step 3: Real-Time Position Updates**

```typescript
useEffect(() => {
  if (!isNavigating || !route || !userLocation) return;
  
  // Check if user is off route
  const offRoute = situmService.isOffRoute(
    userLocation,
    situmRoute,
    SITUM_CONFIG.ROUTING.OFF_ROUTE_THRESHOLD
  );
  
  if (offRoute) {
    console.log('⚠️ User off route, recalculating...');
    // Recalculate route
    startNavigation(route.destination);
  }
  
  // Update remaining distance based on actual position
  const distanceToDestination = situmService.calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    route.destination.latitude,
    route.destination.longitude
  );
  
  setRemainingDistance(Math.round(distanceToDestination));
}, [userLocation, isNavigating]);
```

---

### **Step 4: Update Navigation Overlay with Real Coordinates**

**File:** `src/features/ar-navigation/plugins/airport-navigator/components/NavigationOverlay.tsx`

```typescript
import { situmService } from '../../services/SitumService';

export default function NavigationOverlay({ route, progress, userLocation }) {
  // Convert route points to screen coordinates
  const pathPoints = route.points.map((point, index) => {
    // Convert lat/lng to screen position
    const screenPos = convertToScreenCoordinates(
      point.latitude,
      point.longitude,
      userLocation,
      cameraTransform
    );
    
    return screenPos;
  });
  
  // Generate SVG path from real coordinates
  const pathData = generatePathFromPoints(pathPoints);
  
  return (
    <Svg>
      <Path d={pathData} fill="url(#pathGradient)" />
      {/* Chevrons at route points */}
    </Svg>
  );
}

function convertToScreenCoordinates(
  lat: number,
  lng: number,
  userLocation: SitumLocation,
  cameraTransform: any
): { x: number; y: number } {
  // Calculate relative position
  const deltaLat = lat - userLocation.latitude;
  const deltaLng = lng - userLocation.longitude;
  
  // Convert to meters
  const x = deltaLng * 111320 * Math.cos(userLocation.latitude * Math.PI / 180);
  const y = deltaLat * 110540;
  
  // Apply camera transform and project to screen
  // This will depend on your AR camera setup
  const screenX = 200 + (x * 10); // Scale factor
  const screenY = 500 - (y * 10); // Invert Y, scale
  
  return { x: screenX, y: screenY };
}
```

---

## 📊 DATA FLOW

### **Current (Mock):**
```
User Input → Mock Data → Display
```

### **With Situm:**
```
Situm SDK
    ↓
Real Position (WiFi/BLE)
    ↓
Calculate Route (Dijkstra)
    ↓
Turn-by-Turn Directions
    ↓
Real-Time Updates
    ↓
AR Overlay Display
```

---

## 🎯 FEATURES ENABLED

### **Real Positioning:**
- ✅ WiFi-based positioning (1-3m accuracy)
- ✅ Bluetooth beacon positioning
- ✅ GPS fusion for outdoor/indoor
- ✅ Floor detection
- ✅ Real-time updates (1 second interval)

### **Real Routing:**
- ✅ Actual route calculation
- ✅ Turn-by-turn directions
- ✅ Multi-floor routing
- ✅ Accessible routes option
- ✅ Off-route detection
- ✅ Automatic recalculation

### **POI Management:**
- ✅ Get all gates, restrooms, shops
- ✅ Search by name
- ✅ Filter by category
- ✅ Real-time POI data

---

## 🔄 MIGRATION STRATEGY

### **Phase 1: Parallel Testing**
- Keep mock data as fallback
- Add Situm alongside
- Test with real building
- Compare accuracy

### **Phase 2: Gradual Rollout**
- Use Situm for specific buildings
- Keep mock for others
- Monitor performance
- Collect feedback

### **Phase 3: Full Migration**
- Remove mock data
- Use Situm everywhere
- Production ready

---

## 🧪 TESTING PLAN

### **1. Indoor Positioning Test**
```typescript
// Test location accuracy
const testPositioning = async () => {
  await situmService.startPositioning(
    BUILDING_ID,
    (location) => {
      console.log('Accuracy:', location.accuracy, 'm');
      console.log('Floor:', location.floorIdentifier);
    }
  );
};
```

### **2. Route Calculation Test**
```typescript
// Test route from A to B
const testRouting = async () => {
  const route = await situmService.calculateRoute(
    { lat: 40.7128, lng: -74.0060, floor: '1' },
    { lat: 40.7130, lng: -74.0062, floor: '2' }
  );
  
  console.log('Distance:', route.distance, 'm');
  console.log('Time:', route.time, 's');
  console.log('Steps:', route.segments.length);
};
```

### **3. POI Search Test**
```typescript
// Test POI search
const testPOI = async () => {
  const gate = await situmService.findPOI(BUILDING_ID, '23D');
  console.log('Found:', gate?.name);
  
  const restrooms = await situmService.getPOIsByCategory(
    BUILDING_ID,
    'restroom'
  );
  console.log('Restrooms:', restrooms.length);
};
```

---

## 📱 IMPLEMENTATION TIMELINE

### **Week 1: Setup**
- [ ] Create Situm account
- [ ] Get API keys
- [ ] Upload building floor plans
- [ ] Calibrate positioning
- [ ] Add POIs

### **Week 2: Integration**
- [ ] Implement SitumService
- [ ] Update useAirportNavigation hook
- [ ] Test positioning accuracy
- [ ] Test route calculation

### **Week 3: Testing**
- [ ] On-site testing at airport
- [ ] Accuracy validation
- [ ] Performance optimization
- [ ] Bug fixes

### **Week 4: Polish**
- [ ] UI refinements
- [ ] Error handling
- [ ] Offline fallback
- [ ] Production deployment

---

## ⚠️ IMPORTANT NOTES

### **Situm Account Required:**
- Free tier available for testing
- Paid plans for production
- Building calibration required
- POI setup needed

### **Building Preparation:**
- Floor plans must be uploaded
- WiFi/BLE mapping required (walk around building)
- POIs must be manually added
- Takes 1-2 days for initial setup

### **API Limitations:**
- Rate limits apply
- Internet required
- Building-specific data
- Accuracy depends on calibration

---

## 🚀 NEXT STEPS

1. **Create Situm Account** → Get API key
2. **Upload Floor Plans** → Add building
3. **Calibrate Positioning** → Walk around with app
4. **Add POIs** → Gates, restrooms, etc.
5. **Update Config** → Add API key and building ID
6. **Test Integration** → Verify positioning works
7. **Deploy** → Production ready!

---

## 📚 RESOURCES

- **Situm Dashboard:** https://dashboard.situm.com
- **Documentation:** https://situm.com/docs
- **React Native SDK:** https://github.com/situmtech/react-native
- **Support:** support@situm.com

---

**Ready to integrate real indoor positioning!** 🗺️✨📍

The SitumService is created and ready. Just need to:
1. Get Situm API key
2. Set up building
3. Update config
4. Test!
