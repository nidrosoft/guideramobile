# Guidera Architecture

## Overview
Guidera is built with a scalable, modular architecture designed to support a comprehensive AI-powered travel companion application.

## Directory Structure

### `/src/app` - Expo Router Pages
- **(auth)/** - Authentication flows (sign-in, sign-up, forgot-password)
- **(onboarding)/** - Welcome screens and preference setup (4 welcome + 4 preference screens)
- **(tabs)/** - Main app tabs (home, trips, ar, saved, inbox, community)
- **booking/** - Flight, hotel, activity, and car rental booking flows
- **trip/** - Trip management (view, create, edit)
- **safety/** - Safety features (alerts, emergency, map)
- **cultural/** - Cultural guides by location
- **profile/** - User profile and settings

### `/src/components` - Reusable UI Components
- **common/** - Base UI elements (buttons, cards, forms, loaders, modals, navigation)
- **layout/** - Layout components (Container, Screen, SafeArea, KeyboardAware)
- **features/** - Feature-specific components organized by domain

### `/src/hooks` - Custom React Hooks
Custom hooks for auth, location, translation, offline mode, notifications, search, camera, permissions, etc.

### `/src/lib` - Core Libraries & Utilities
- **supabase/** - Database, auth, storage, realtime
- **api/** - API client and interceptors
- **storage/** - AsyncStorage, SecureStore, cache
- **notifications/** - Push and local notifications
- **booking/** - Booking providers (Amadeus, Booking.com, GetYourGuide)
- **ai/** - OpenAI integration for recommendations, safety, cultural context, translation
- **geolocation/** - Location tracking, geofencing, map utilities
- **utils/** - Date, currency, validators, formatters, permissions, linking

### `/src/services` - Business Logic Layer
Service classes for each domain: auth, user, trip, safety, cultural, translation, navigation, packing, journal, expense, compensation, booking, flight, hotel, activity, car.

### `/src/store` - State Management
Redux store with slices for each domain, middleware, and persist configuration.

### `/src/types` - TypeScript Type Definitions
Type definitions for all domains, API responses, and common types.

### `/src/styles` - Design System
Theme, colors, typography, spacing, and shadows.

### `/src/config` - Configuration Files
Constants, navigation config, API config, Supabase config, feature flags.

### `/src/context` - React Context Providers
Context providers for Auth, Theme, Notifications, Location, and Offline mode.

### `/src/utils` - Utility Functions
Analytics, error handling, logging, and testing utilities.

### `/assets` - Static Assets
Fonts, images, icons, animations, and localization files.

### `/supabase` - Backend
Database migrations, edge functions, and seed data.

### `/scripts` - Build & Setup Scripts
Icon generation and environment setup scripts.

### `/__tests__` - Test Suites
Unit, integration, and end-to-end tests.

## Key Features Architecture

### 1. Authentication Flow
- Social login (Google, Apple, Facebook)
- Email/password authentication
- Password recovery
- Supabase Auth integration

### 2. Onboarding Experience
- 4 welcome screens introducing key features
- 4 preference screens for personalization
- Progressive disclosure of app capabilities

### 3. Travel Hub
- AI-powered trip planning
- Itinerary management
- Document storage (passports, tickets, etc.)

### 4. Safety Features
- Real-time safety alerts
- Emergency contacts and services
- Safe zone mapping
- AI-powered risk analysis

### 5. Cultural Intelligence
- Location-based cultural tips
- Etiquette guides
- Custom recommendations
- AI-generated cultural context

### 6. Translation Services
- Real-time text translation
- Camera-based translation
- Phrasebook with common expressions
- Voice translation

### 7. Booking Integration
- Flight search and booking (Amadeus)
- Hotel search and booking (Booking.com)
- Activity booking (GetYourGuide)
- Car rental services

### 8. Travel Journal
- Photo and video galleries
- Timeline view
- AI-generated captions and summaries

### 9. Expense Tracking
- Receipt scanning
- Budget tracking
- Multi-currency support
- Expense categorization

### 10. Flight Compensation
- Automatic flight tracking
- Delay/cancellation detection
- Compensation claim assistance

## Technology Stack

- **Framework**: Expo 54 + React Native
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management**: Redux Toolkit
- **AI**: OpenAI API
- **Icons**: Iconsax React Native
- **Maps**: Expo Maps
- **Styling**: StyleSheet with design system

## Scalability Considerations

1. **Modular Architecture**: Each feature is self-contained with its own components, services, and state
2. **Type Safety**: Comprehensive TypeScript coverage
3. **Code Organization**: Clear separation of concerns (UI, business logic, data)
4. **Reusable Components**: Common components library for consistency
5. **Service Layer**: Business logic abstracted from UI components
6. **State Management**: Centralized state with Redux for predictable data flow
7. **API Integration**: Abstracted API clients for easy provider switching
8. **Testing Structure**: Organized test suites for unit, integration, and e2e tests

---

## Booking Architecture

### Plugin Architecture Pattern

All booking flows follow a consistent 4-screen plugin architecture:

```
[Flow]BookingFlow.tsx              # Modal orchestrator (~200 lines)
├── screens/
│   ├── [Flow]SearchScreen.tsx     # Search form with bottom sheets
│   ├── [Flow]SearchLoadingScreen.tsx  # Animated loading transition
│   ├── [Flow]ResultsScreen.tsx    # Results with filters/sorting
│   └── [Flow]CheckoutScreen.tsx   # Combined checkout
├── sheets/                        # Bottom sheet modals
│   ├── LocationPickerSheet.tsx
│   ├── DatePickerSheet.tsx
│   ├── [Flow-specific]Sheet.tsx
│   └── PaymentSheet.tsx
├── components/                    # Reusable field components
│   └── [Flow-specific]Card.tsx
└── *.styles.ts                    # Extracted styles
```

### Booking Flows

| Flow | Screens | Key Features |
|------|---------|--------------|
| **Flight** | Search → Loading → Results → Checkout | One-way/round-trip, seat selection, baggage |
| **Hotel** | Search → Loading → Results → Detail → Checkout | Room selection, amenities, guest details |
| **Car** | Search → Loading → Results → Checkout | Protection packages, extras, driver info |
| **Experience** | Search → Loading → Results → Checkout | Time slots, participants, host info |
| **Package** | Search → Build → Checkout | Bundle discounts, multi-category selection |

### Architecture Principles

1. **File Size Limits**: Max 500 lines per file, styles extracted to `.styles.ts`
2. **Bottom Sheets**: All selections happen in modal sheets
3. **State Management**: Zustand stores with persistence for draft bookings
4. **Shared Components**: `CancelBookingModal`, `PaymentSheet` reused across flows
5. **Consistent UX**: Same header pattern, navigation, and styling

### Shared Components

```
src/features/booking/
├── flows/shared/
│   └── CancelBookingModal.tsx     # Reusable cancellation modal
├── shared/
│   └── components/
│       ├── FlightCard.tsx
│       ├── HotelCard.tsx
│       ├── CarCard.tsx
│       ├── ExperienceCard.tsx
│       └── FilterChips.tsx
└── stores/
    ├── useFlightStore.ts
    ├── useHotelStore.ts
    ├── useCarStore.ts
    ├── useExperienceStore.ts
    └── usePackageStore.ts
```

---

## Next Steps

1. Implement splash screen and app loading
2. Build onboarding flow
3. Create authentication screens
4. Develop main homepage
5. Integrate AI services
6. Connect booking APIs
7. Implement offline functionality
8. Add comprehensive testing
