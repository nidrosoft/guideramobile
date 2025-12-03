# AR Navigation & Discovery System

> **Status**: 🚧 In Development - UI Complete, API Integration Pending

A comprehensive augmented reality navigation and discovery system for travelers. Provides real-time AR overlays, landmark recognition, menu translation, airport navigation, safety alerts, and city navigation.

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [API Keys Required](#api-keys-required)
- [Plugin System](#plugin-system)
- [TODO List](#todo-list)
- [Development Roadmap](#development-roadmap)

---

## ✨ Features

### 1. **Landmark Scanner** 🏛️
- Point camera at landmarks to identify them
- Get historical information, facts, and details
- View photos and ratings
- **Status**: UI Complete ✅ | API Integration Pending ⏳

### 2. **Menu Translator** 🍽️
- Scan restaurant menus in any language
- Real-time translation to your preferred language
- OCR text extraction from photos
- **Status**: UI Pending ⏳ | API Integration Pending ⏳

### 3. **Airport Navigator** ✈️
- Indoor navigation for airports
- Find gates, amenities, and services
- Turn-by-turn directions
- **Status**: UI Pending ⏳ | API Integration Pending ⏳

### 4. **Danger Alerts** ⚠️
- View safety alerts and danger zones
- Real-time location-based warnings
- Safe area recommendations
- **Status**: UI Pending ⏳ | API Integration Pending ⏳

### 5. **City Navigator** 🗺️
- AR-powered city navigation
- Walking directions with AR overlays
- Points of interest discovery
- **Status**: UI Pending ⏳ | API Integration Pending ⏳

---

## 🏗️ Architecture

### Plugin System
Each AR feature is implemented as an independent plugin with:
- **Isolated state management**
- **Modular components**
- **Event-driven communication**
- **Lazy loading support**

### Folder Structure
```
ar-navigation/
├── components/
│   ├── ARContainer.tsx          # Main AR container
│   ├── ARCamera.tsx              # Camera view with overlays
│   ├── ARMapView.tsx             # Map-based view
│   ├── ARPluginSelector.tsx      # Plugin icon sidebar
│   └── shared/
│       ├── AROverlay.tsx         # Base overlay component
│       └── BottomSheetInfo.tsx   # Reusable bottom sheet
│
├── plugins/
│   ├── landmark-scanner/         # 🏛️ Landmark recognition
│   ├── menu-translator/          # 🍽️ Menu translation
│   ├── airport-navigator/        # ✈️ Airport navigation
│   ├── danger-alerts/            # ⚠️ Safety alerts
│   └── city-navigator/           # 🗺️ City navigation
│
├── hooks/
│   ├── useARCamera.ts            # Camera permissions & stream
│   ├── useARLocation.ts          # GPS & location tracking
│   └── useARPlugins.ts           # Plugin registry & switching
│
├── services/
│   ├── vision.service.ts         # 🔑 Google Vision API
│   ├── translation.service.ts    # 🔑 Google Translate API
│   └── mapbox.service.ts         # 🔑 Mapbox API
│
├── types/
│   ├── ar-plugin.types.ts        # Plugin interface
│   └── ar-navigation.types.ts    # Core AR types
│
└── ARNavigationScreen.tsx        # Main entry point
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install expo-camera expo-location --legacy-peer-deps
```

### 2. Configure Permissions

**iOS (app.json)**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "AR Navigation needs camera access for landmark scanning and navigation.",
        "NSLocationWhenInUseUsageDescription": "AR Navigation needs your location for navigation and safety features."
      }
    }
  }
}
```

**Android (app.json)**
```json
{
  "expo": {
    "android": {
      "permissions": [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

### 3. Add API Keys (Coming Soon)
Create a `.env` file in the project root:
```env
# Google Cloud APIs
GOOGLE_VISION_API_KEY=your_vision_api_key_here
GOOGLE_TRANSLATE_API_KEY=your_translate_api_key_here

# Mapbox
MAPBOX_API_KEY=your_mapbox_token_here
```

---

## 🔑 API Keys Required

### Google Cloud Vision API
- **Purpose**: Landmark recognition, OCR for menus
- **Pricing**: https://cloud.google.com/vision/pricing
- **Setup**: https://cloud.google.com/vision/docs/setup
- **TODO**: 
  - [ ] Create Google Cloud project
  - [ ] Enable Vision API
  - [ ] Generate API key
  - [ ] Add to environment variables

### Google Cloud Translation API
- **Purpose**: Menu translation
- **Pricing**: https://cloud.google.com/translate/pricing
- **Setup**: https://cloud.google.com/translate/docs/setup
- **TODO**:
  - [ ] Enable Translation API in Google Cloud
  - [ ] Generate API key
  - [ ] Add to environment variables

### Mapbox
- **Purpose**: Maps, geocoding, directions, navigation
- **Pricing**: https://www.mapbox.com/pricing
- **Setup**: https://docs.mapbox.com/help/getting-started/
- **TODO**:
  - [ ] Sign up for Mapbox account
  - [ ] Create access token
  - [ ] Install `@rnmapbox/maps` package
  - [ ] Configure for iOS and Android
  - [ ] Add to environment variables

---

## 🔌 Plugin System

### Creating a New Plugin

Each plugin must implement the `ARPlugin` interface:

```typescript
export interface ARPlugin {
  id: ARPluginId;
  name: string;
  icon: ReactNode;
  description: string;
  
  // Capabilities
  requiresCamera: boolean;
  requiresLocation: boolean;
  requiresInternet: boolean;
  
  // Render methods
  renderOverlay: (context: ARContext) => ReactNode;
  renderBottomSheet?: (data: any) => ReactNode;
  
  // Lifecycle
  onActivate?: () => void;
  onDeactivate?: () => void;
}
```

### Plugin Template

```typescript
// MyPlugin.tsx
import { ARPlugin, ARContext } from '../../types/ar-plugin.types';

export const myPlugin: ARPlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  icon: <MyIcon />,
  description: 'Plugin description',
  
  requiresCamera: true,
  requiresLocation: false,
  requiresInternet: true,
  
  renderOverlay: (context: ARContext) => {
    return <MyPluginOverlay />;
  },
  
  onActivate: () => {
    console.log('Plugin activated');
  },
};
```

---

## ✅ TODO List

### High Priority
- [ ] **Implement Google Vision API integration**
  - [ ] Landmark detection
  - [ ] OCR for menu scanning
  - [ ] Error handling and retries
  
- [ ] **Implement Google Translate API**
  - [ ] Text translation
  - [ ] Language detection
  - [ ] Batch translation for menus

- [ ] **Implement Mapbox integration**
  - [ ] Geocoding and reverse geocoding
  - [ ] Turn-by-turn directions
  - [ ] POI search
  - [ ] Static map images

### Medium Priority
- [ ] **Complete remaining plugins**
  - [ ] Menu Translator UI
  - [ ] Airport Navigator UI
  - [ ] Danger Alerts UI
  - [ ] City Navigator UI

- [ ] **Add photo capture**
  - [ ] Camera ref for taking photos
  - [ ] Image compression
  - [ ] Local caching

- [ ] **Database integration**
  - [ ] Save scanned landmarks
  - [ ] Translation history
  - [ ] Favorite locations
  - [ ] Offline support

### Low Priority
- [ ] **Performance optimization**
  - [ ] Image compression before API calls
  - [ ] Response caching
  - [ ] Lazy loading for plugins
  
- [ ] **Enhanced features**
  - [ ] Share landmark info
  - [ ] Save to trip itinerary
  - [ ] AR route visualization
  - [ ] Voice navigation

---

## 🗺️ Development Roadmap

### Phase 1: Foundation (Complete ✅)
- [x] Plugin architecture
- [x] Camera integration
- [x] Permission handling
- [x] UI components
- [x] Landmark Scanner UI

### Phase 2: API Integration (Current)
- [ ] Google Vision API
- [ ] Google Translate API
- [ ] Mapbox API
- [ ] Error handling
- [ ] Rate limiting

### Phase 3: Remaining Plugins
- [ ] Menu Translator
- [ ] Airport Navigator
- [ ] Danger Alerts
- [ ] City Navigator

### Phase 4: Database & Offline
- [ ] Database schema
- [ ] Offline caching
- [ ] Sync functionality
- [ ] User preferences

### Phase 5: Polish & Optimization
- [ ] Performance tuning
- [ ] Analytics
- [ ] User testing
- [ ] Bug fixes

---

## 📝 Notes

### Current Status
- ✅ **UI/UX**: Complete and polished
- ✅ **Camera**: Live camera feed working
- ✅ **Permissions**: Proper permission flow
- ✅ **Plugin System**: Fully functional
- ⏳ **API Integration**: Pending (documented with TODOs)
- ⏳ **Database**: Not started (will implement after API integration)

### Mock Data
Currently using mock landmark data for testing:
- Statue of Liberty
- Eiffel Tower
- Big Ben

This will be replaced with real API data once Google Vision API is integrated.

### Performance Considerations
- Image compression before API calls
- Caching API responses
- Rate limiting to avoid excessive API usage
- Lazy loading of plugin components

---

## 🤝 Contributing

When implementing API integrations:
1. Search for `TODO` comments in service files
2. Follow the documented API structure
3. Add proper error handling
4. Test with real API keys
5. Update this README with progress

---

## 📚 Resources

- [Google Cloud Vision API Docs](https://cloud.google.com/vision/docs)
- [Google Translate API Docs](https://cloud.google.com/translate/docs)
- [Mapbox API Docs](https://docs.mapbox.com/api/)
- [Expo Camera Docs](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Expo Location Docs](https://docs.expo.dev/versions/latest/sdk/location/)

---

**Last Updated**: November 2024
**Status**: 🚧 Active Development
