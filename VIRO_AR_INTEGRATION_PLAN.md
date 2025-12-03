# 🎮 VIROREACT 3D AR INTEGRATION PLAN

## Phase 2: True 3D AR Experience

---

## 📋 OVERVIEW

Replace 2D SVG overlay with true 3D AR using ViroReact:
- 3D arrows on actual floor
- Ground plane detection
- Depth occlusion
- Spatial tracking
- Camera-relative positioning

---

## 🔧 SETUP STEPS

### **Step 1: Create ViroAR Scene Component**

**File:** `src/features/ar-navigation/components/ViroARScene.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroNode,
  ViroBox,
  Viro3DObject,
  ViroARPlane,
  ViroAmbientLight,
  ViroSpotLight,
  ViroMaterials,
} from '@viro-community/react-viro';

interface ViroARNavigationProps {
  route: NavigationRoute;
  userLocation: SitumLocation;
  onSceneReady: () => void;
}

export default function ViroARNavigation({
  route,
  userLocation,
  onSceneReady,
}: ViroARNavigationProps) {
  const [floorAnchor, setFloorAnchor] = useState(null);
  const [pathNodes, setPathNodes] = useState([]);

  useEffect(() => {
    // Convert route points to 3D positions
    const nodes = route.points.map((point, index) => {
      const position = convertToARPosition(point, userLocation);
      return {
        position,
        rotation: calculateRotation(point, route.points[index + 1]),
      };
    });
    setPathNodes(nodes);
  }, [route, userLocation]);

  return (
    <ViroARSceneNavigator
      autofocus={true}
      initialScene={{
        scene: ARNavigationScene,
      }}
      viroAppProps={{
        pathNodes,
        floorAnchor,
        onFloorDetected: setFloorAnchor,
        onSceneReady,
      }}
    />
  );
}

// AR Scene Component
function ARNavigationScene(props) {
  const { pathNodes, onFloorDetected, onSceneReady } = props.arSceneNavigator.viroAppProps;

  return (
    <ViroARScene onTrackingUpdated={onSceneReady}>
      {/* Lighting */}
      <ViroAmbientLight color="#ffffff" intensity={200} />
      <ViroSpotLight
        innerAngle={5}
        outerAngle={25}
        direction={[0, -1, 0]}
        position={[0, 5, 0]}
        color="#ffffff"
        castsShadow={true}
      />

      {/* Ground Plane Detection */}
      <ViroARPlane
        minHeight={0.5}
        minWidth={0.5}
        alignment="Horizontal"
        onAnchorFound={(anchor) => {
          console.log('✅ Floor detected:', anchor);
          onFloorDetected(anchor);
        }}
      >
        {/* Navigation Path on Floor */}
        {pathNodes.map((node, index) => (
          <ViroNode key={index} position={node.position}>
            {/* Path segment */}
            <ViroBox
              height={0.01}
              width={1.8}
              length={2}
              materials={['pathMaterial']}
              position={[0, 0, 0]}
            />

            {/* 3D Arrow */}
            <Viro3DObject
              source={require('../assets/arrow.obj')}
              resources={[require('../assets/arrow.mtl')]}
              type="OBJ"
              scale={[0.3, 0.3, 0.3]}
              rotation={node.rotation}
              position={[0, 0.2, 0]}
              materials={['arrowMaterial']}
            />
          </ViroNode>
        ))}
      </ViroARPlane>
    </ViroARScene>
  );
}

// Define materials
ViroMaterials.createMaterials({
  pathMaterial: {
    lightingModel: 'Blinn',
    diffuseColor: '#7C3AED',
    opacity: 0.8,
  },
  arrowMaterial: {
    lightingModel: 'Blinn',
    diffuseColor: '#FFFFFF',
  },
});

// Helper functions
function convertToARPosition(
  point: { latitude: number; longitude: number },
  userLocation: SitumLocation
): [number, number, number] {
  // Convert lat/lng to meters relative to user
  const deltaLat = point.latitude - userLocation.latitude;
  const deltaLng = point.longitude - userLocation.longitude;
  
  const x = deltaLng * 111320 * Math.cos(userLocation.latitude * Math.PI / 180);
  const z = -deltaLat * 110540; // Negative Z is forward
  const y = -1; // On floor
  
  return [x, y, z];
}

function calculateRotation(
  current: { latitude: number; longitude: number },
  next: { latitude: number; longitude: number } | undefined
): [number, number, number] {
  if (!next) return [0, 0, 0];
  
  const deltaLat = next.latitude - current.latitude;
  const deltaLng = next.longitude - current.longitude;
  
  const angle = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
  
  return [0, angle, 0]; // Rotate around Y axis
}
```

---

### **Step 2: Create 3D Arrow Model**

**Option A: Use Simple Geometry**
```typescript
// Create arrow from basic shapes
function Arrow3D() {
  return (
    <ViroNode>
      {/* Arrow shaft */}
      <ViroBox
        height={0.1}
        width={0.2}
        length={1}
        position={[0, 0, 0]}
        materials={['arrowMaterial']}
      />
      {/* Arrow head (pyramid) */}
      <ViroPyramid
        height={0.3}
        width={0.4}
        length={0.4}
        position={[0, 0, -0.7]}
        materials={['arrowMaterial']}
      />
    </ViroNode>
  );
}
```

**Option B: Use 3D Model File**
```bash
# Download or create arrow.obj and arrow.mtl
# Place in: src/features/ar-navigation/assets/
```

---

### **Step 3: Integrate with Navigation**

**File:** `src/features/ar-navigation/plugins/airport-navigator/AirportNavigatorPlugin.tsx`

```typescript
import ViroARNavigation from '../../components/ViroARNavigation';

function AirportNavigatorOverlay({ arContext }: { arContext: ARContext }) {
  const [useViroAR, setUseViroAR] = useState(true); // Toggle 2D/3D
  
  return (
    <>
      {isNavigating && route && (
        <>
          {useViroAR ? (
            // 3D AR View
            <ViroARNavigation
              route={route}
              userLocation={userLocation}
              onSceneReady={() => console.log('AR scene ready')}
            />
          ) : (
            // 2D SVG Overlay (fallback)
            <NavigationOverlay route={route} progress={progress} />
          )}
          
          {/* UI overlays (banner, card) */}
          <InstructionBanner step={currentStep} />
          <NavigationInfoCard {...props} />
        </>
      )}
    </>
  );
}
```

---

### **Step 4: Add AR Camera Permissions**

**File:** `src/features/ar-navigation/ARNavigationScreen.tsx`

```typescript
import { ViroARSceneNavigator } from '@viro-community/react-viro';

// Check AR support
const checkARSupport = async () => {
  try {
    const isSupported = await ViroARSceneNavigator.isARSupportedOnDevice();
    if (!isSupported) {
      Alert.alert('AR Not Supported', 'Your device does not support AR');
    }
  } catch (error) {
    console.error('AR support check failed:', error);
  }
};
```

---

## 🎨 FEATURES TO IMPLEMENT

### **1. Ground Plane Detection**
```typescript
<ViroARPlane
  minHeight={0.5}
  minWidth={0.5}
  alignment="Horizontal"
  onAnchorFound={(anchor) => {
    // Floor detected, place path
    setFloorAnchor(anchor);
  }}
/>
```

### **2. Path Rendering**
```typescript
// Render path as 3D ribbon on floor
{pathNodes.map((node, index) => (
  <ViroBox
    key={index}
    height={0.01}      // Thin (on floor)
    width={1.8}        // Wide (path width)
    length={2}         // Segment length
    position={node.position}
    materials={['pathMaterial']}
  />
))}
```

### **3. 3D Arrows**
```typescript
// Place arrows along path
<Viro3DObject
  source={require('./arrow.obj')}
  type="OBJ"
  scale={[0.3, 0.3, 0.3]}
  rotation={[0, angle, 0]}
  position={[x, 0.2, z]}
  materials={['arrowMaterial']}
/>
```

### **4. Depth Occlusion**
```typescript
// Hide path behind real objects
<ViroARScene
  physicsWorld={{ gravity: [0, -9.81, 0] }}
>
  {/* Path respects real-world depth */}
</ViroARScene>
```

### **5. Distance Markers**
```typescript
// 3D text for distances
<ViroText
  text={`${distance}m`}
  position={[0, 0.5, -2]}
  scale={[0.5, 0.5, 0.5]}
  style={{ color: '#FFFFFF' }}
/>
```

---

## 📊 COMPARISON

### **2D SVG (Current):**
```
✅ Simple to implement
✅ Works on all devices
✅ Low performance cost
❌ No depth perception
❌ No real-world anchoring
❌ Flat overlay
```

### **3D AR (ViroReact):**
```
✅ True 3D depth
✅ Ground-anchored
✅ Realistic perspective
✅ Depth occlusion
✅ Spatial tracking
❌ Requires AR support
❌ Higher performance cost
❌ More complex
```

---

## 🧪 TESTING PLAN

### **1. AR Support Test**
```typescript
const testARSupport = async () => {
  const supported = await ViroARSceneNavigator.isARSupportedOnDevice();
  console.log('AR Supported:', supported);
};
```

### **2. Ground Detection Test**
```typescript
const testGroundDetection = () => {
  // Point camera at floor
  // Check if plane is detected
  // Verify anchor position
};
```

### **3. Path Rendering Test**
```typescript
const testPathRendering = () => {
  // Load route
  // Verify path appears on floor
  // Check path follows route
};
```

---

## 📱 IMPLEMENTATION TIMELINE

### **Week 1: Setup**
- [ ] Create ViroAR components
- [ ] Add 3D arrow models
- [ ] Test ground detection

### **Week 2: Integration**
- [ ] Integrate with navigation
- [ ] Connect to Situm routes
- [ ] Test path rendering

### **Week 3: Polish**
- [ ] Add animations
- [ ] Optimize performance
- [ ] Add fallback to 2D

### **Week 4: Testing**
- [ ] On-device testing
- [ ] Performance optimization
- [ ] Production deployment

---

## ⚠️ REQUIREMENTS

### **Device Requirements:**
- **iOS:** ARKit support (iPhone 6S+)
- **Android:** ARCore support (varies)
- **Camera:** Required
- **Sensors:** Gyroscope, accelerometer

### **Performance:**
- **Minimum:** 60 FPS for smooth AR
- **Memory:** ~100MB for AR session
- **Battery:** Higher consumption

---

## 🚀 NEXT STEPS

1. **Create ViroAR components** ✅ (template ready)
2. **Add 3D models** → Arrow OBJ files
3. **Test ground detection** → Point at floor
4. **Integrate with Situm** → Real routes in 3D
5. **Polish & optimize** → Smooth 60 FPS
6. **Deploy** → Production ready!

---

**Ready for true 3D AR navigation!** 🎮✨🗺️

The ViroAR templates are ready. Just need to:
1. Add 3D arrow models
2. Test ground detection
3. Integrate with Situm routes
4. Deploy!
