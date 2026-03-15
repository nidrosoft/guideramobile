# Guidera

<p align="center">
  <img src="assets/images/logo.png" alt="Guidera Logo" width="120" />
</p>

<p align="center">
  <strong>AI-Powered Travel Companion</strong><br/>
  Plan, book, and explore the world with intelligent assistance
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-54.0-blue" alt="Expo" />
  <img src="https://img.shields.io/badge/React%20Native-0.81-green" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-Proprietary-red" alt="License" />
</p>

---

## ⚠️ CRITICAL: Authentication Architecture

> **Guidera uses [Clerk](https://clerk.com) for authentication — NOT Supabase Auth.**
>
> - The `auth.users` table is **NOT used** for app users.
> - All user data lives in `public.profiles` with a `clerk_id` column linking to Clerk.
> - **All foreign key constraints** for user references must point to `public.profiles(id)`, never `auth.users(id)`.
> - **Edge functions** must NOT use `supabase.auth.getUser()`. Instead, look up profiles directly using the service role key.
> - Edge functions should use `verify_jwt: false` (same pattern as all existing functions).
> - Profile ID format: UUID. Clerk ID format: `user_XXXXX` (string stored in `profiles.clerk_id`).
> - `trips.user_id` = `profiles.id` (UUID), not a Clerk ID.

---

## 📋 Table of Contents

- [Authentication](#%EF%B8%8F-critical-authentication-architecture)
- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [API Keys & Secrets](#-api-keys--secrets)
- [Edge Functions](#-edge-functions)
- [Trip Hub Plugins](#-trip-hub-plugins)
- [Trip Invitation System](#-trip-invitation-system)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Development](#-development)

---

## 🌍 Overview

Guidera is a comprehensive AI-powered travel companion application that revolutionizes how people explore the world. It combines intelligent trip planning, real-time safety monitoring, cultural intelligence, and seamless booking into a single, unified experience.

### Key Differentiators

- **AI-First Approach**: Gemini 3.0 Flash (primary) + Claude Haiku 4.5 (fallback) for intelligent trip planning
- **Smart Plan Generation**: One-tap AI generates 6 modules (itinerary, packing, safety, language, documents, cultural tips)
- **Trip Import**: Scan tickets, upload screenshots, import via email, or enter manually
- **Trip Collaboration**: Invite up to 5 travelers per trip with email invitations via Resend
- **Global Coverage**: Works in Africa, Europe, Asia, Americas, and Middle East
- **Safety-Focused**: Real-time travel advisories, emergency assistance, and cultural guidance
- **Unified Booking**: Flights, hotels, cars, and experiences in one seamless flow

---

## ✨ Features

### Core Features

| Feature | Description |
|---------|-------------|
| **🗺️ Smart Trip Planning** | AI-powered itinerary generation with Quick Trip (2-5 min) and Advanced Trip (10-15 min) modes |
| **✈️ Flight Booking** | Search, compare, and book flights with seat selection and baggage options |
| **🏨 Hotel Booking** | Browse hotels with room selection, amenities, and guest details |
| **🚗 Car Rental** | Rent vehicles with protection packages, extras, and driver info |
| **🎭 Experiences** | Book tours, activities, and local experiences |
| **📦 Package Deals** | Bundle flights + hotels + cars with automatic discounts |
| **🛡️ Safety Alerts** | Real-time travel advisories, crime data, and emergency services |
| **🌍 Cultural Intelligence** | Location-based etiquette guides and Do's & Don'ts |
| **🗣️ AI Translation** | Real-time text, voice, and camera-based translation |
| **📝 Travel Journal** | Photo galleries, timeline view, and AI-generated captions |
| **💰 Expense Tracking** | Receipt scanning, budget tracking, and multi-currency support |
| **🎒 Smart Packing** | AI-generated packing lists based on destination and weather |
| **✈️ Flight Compensation** | Automatic delay/cancellation detection and claim assistance |

### App Sections

| Tab | Purpose |
|-----|---------|
| **Home** | Dashboard with trip reminders, deals, categories, and quick actions |
| **Trips** | View and manage all trips (upcoming, ongoing, past) |
| **AR** | Augmented reality navigation and exploration |
| **Saved** | Bookmarked destinations, hotels, and experiences |
| **Inbox** | Notifications, booking confirmations, and alerts |
| **Connect** | Travel network — groups, events, guides, Pulse meetups, and buddy matching |

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Expo** | 54.0 | React Native framework with managed workflow |
| **React Native** | 0.81.5 | Cross-platform mobile development |
| **TypeScript** | 5.9 | Type-safe JavaScript |
| **Expo Router** | 6.0 | File-based navigation |
| **Zustand** | 5.0 | Lightweight state management for booking flows |
| **React Query** | 5.90 | Server state management and caching |
| **React Native Reanimated** | 4.1 | High-performance animations |
| **Expo Blur** | 15.0 | Frosted glass UI effects |
| **Expo Haptics** | 15.0 | Tactile feedback |

### Backend & Services

| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL database, authentication, storage, realtime |
| **Sentry** | Error tracking and performance monitoring |
| **Firebase Cloud Messaging** | Push notifications |

### UI & Design

| Library | Purpose |
|---------|---------|
| **Iconsax React Native** | Icon library (Iconsax design system) |
| **Expo Linear Gradient** | Gradient backgrounds |
| **React Native SVG** | SVG rendering |
| **React Native Maps** | Map integration |
| **Expo Maps** | Cross-platform maps |

### AR & Navigation

| Library | Purpose |
|---------|---------|
| **@reactvision/react-viro** | AR experiences |
| **@googlemaps/react-native-navigation-sdk** | Turn-by-turn navigation |
| **@shopify/react-native-skia** | High-performance 2D graphics |

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         GUIDERA APP                              │
│                    (React Native / Expo)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Screens   │  │  Features   │  │ Components  │             │
│  │  (Expo      │  │  (Booking,  │  │  (Reusable  │             │
│  │   Router)   │  │   Planning) │  │   UI)       │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Zustand   │  │ React Query │  │   Context   │             │
│  │   Stores    │  │   Cache     │  │  Providers  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Services   │  │    Hooks    │  │    Utils    │             │
│  │  (Business  │  │  (Custom    │  │  (Helpers,  │             │
│  │   Logic)    │  │   Logic)    │  │   Format)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    Auth     │  │  Database   │  │   Storage   │             │
│  │  (Social,   │  │ (PostgreSQL)│  │  (Images,   │             │
│  │   Email)    │  │             │  │   Docs)     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL APIs                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Amadeus │ │ Kiwi.com│ │ Riskline│ │ Claude  │ │ Mapbox  │  │
│  │(Booking)│ │(Flights)│ │(Safety) │ │  (AI)   │ │ (Maps)  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Modular Architecture**: Each feature is self-contained with its own components, services, and state
2. **Type Safety**: Comprehensive TypeScript coverage across the entire codebase
3. **File Size Limits**: Maximum 500 lines per file, styles extracted to `.styles.ts` files
4. **Separation of Concerns**: Clear boundaries between UI, business logic, and data layers
5. **Reusable Components**: Common component library for consistency across the app
6. **Plugin Architecture**: Booking flows follow a consistent, extensible pattern

---

## 📁 Project Structure

```
guidera/
├── src/
│   ├── app/                          # Expo Router pages (file-based routing)
│   │   ├── (auth)/                   # Authentication flows
│   │   │   ├── landing.tsx           # Landing page with video background
│   │   │   ├── phone-signup.tsx      # Phone number signup
│   │   │   ├── sign-in.tsx           # Sign in screen
│   │   │   └── verify-otp.tsx        # OTP verification
│   │   ├── (onboarding)/             # Onboarding experience
│   │   │   ├── welcome-1.tsx         # Welcome screen
│   │   │   ├── welcome-2.tsx         # Book It All in One Place
│   │   │   ├── welcome-3.tsx         # Your Trip Hub
│   │   │   ├── welcome-4.tsx         # Stay Safe Everywhere
│   │   │   ├── welcome-5.tsx         # Understand Every Culture
│   │   │   └── preference-*.tsx      # Preference setup screens
│   │   ├── (tabs)/                   # Main app tabs
│   │   │   ├── index.tsx             # Home tab
│   │   │   ├── trips.tsx             # Trips tab
│   │   │   ├── ar.tsx                # AR tab
│   │   │   ├── saved.tsx             # Saved tab
│   │   │   ├── inbox.tsx             # Inbox tab
│   │   │   └── community.tsx         # Connect tab
│   │   ├── booking/                  # Booking entry points
│   │   ├── trip/                     # Trip management
│   │   ├── safety/                   # Safety features
│   │   ├── cultural/                 # Cultural guides
│   │   └── profile/                  # User profile
│   │
│   ├── features/                     # Feature modules
│   │   ├── booking/                  # Booking feature (see Plugin Architecture)
│   │   │   ├── flows/                # Booking flows (flight, hotel, car, etc.)
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── types/                # TypeScript types
│   │   │   └── shared/               # Shared components
│   │   ├── planning/                 # Trip planning feature
│   │   ├── trips/                    # Trip management
│   │   ├── ar-navigation/            # AR navigation feature
│   │   ├── community/                # Connect feature (groups, events, guides, Pulse)
│   │   └── trip-import/              # Trip import feature
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── common/                   # Base UI elements
│   │   │   ├── buttons/              # Button components
│   │   │   ├── cards/                # Card components
│   │   │   ├── forms/                # Form components
│   │   │   ├── loaders/              # Loading states
│   │   │   ├── modals/               # Modal components
│   │   │   └── navigation/           # Navigation components
│   │   ├── features/                 # Feature-specific components
│   │   │   ├── home/                 # Home screen components
│   │   │   ├── booking/              # Booking components
│   │   │   ├── safety/               # Safety components
│   │   │   └── ...                   # Other feature components
│   │   └── layout/                   # Layout components
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts                # Authentication hook
│   │   ├── useLocation.ts            # Location hook
│   │   ├── useNetworkStatus.ts       # Network status hook
│   │   ├── useOfflineSync.ts         # Offline sync hook
│   │   └── ...                       # Other hooks
│   │
│   ├── services/                     # Business logic layer
│   │   ├── auth/                     # Authentication service
│   │   ├── booking/                  # Booking service
│   │   ├── safety/                   # Safety service
│   │   ├── health.ts                 # Health check service
│   │   ├── logging.ts                # Logging service
│   │   └── sentry.ts                 # Error tracking
│   │
│   ├── stores/                       # Global state (Zustand)
│   │
│   ├── styles/                       # Design system
│   │   ├── colors.ts                 # Color palette
│   │   ├── typography.ts             # Typography scale
│   │   ├── spacing.ts                # Spacing scale
│   │   ├── shadows.ts                # Shadow definitions
│   │   └── theme.ts                  # Theme configuration
│   │
│   ├── types/                        # TypeScript type definitions
│   │
│   ├── config/                       # Configuration files
│   │
│   ├── context/                      # React Context providers
│   │
│   ├── lib/                          # Core libraries
│   │   ├── supabase/                 # Supabase client
│   │   ├── api/                      # API client
│   │   └── storage/                  # Storage utilities
│   │
│   ├── i18n/                         # Internationalization
│   │
│   └── utils/                        # Utility functions
│
├── assets/                           # Static assets
│   ├── images/                       # Image assets
│   ├── fonts/                        # Custom fonts
│   └── animations/                   # Lottie animations
│
├── supabase/                         # Supabase configuration
│   ├── migrations/                   # Database migrations
│   └── functions/                    # Edge functions
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md               # Architecture details
│   ├── API_SERVICES_GUIDE.md         # API integration guide
│   ├── TRIP_PLANNING.md              # Trip planning specs
│   └── ...                           # Other docs
│
└── __tests__/                        # Test suites
```

---

## 🔌 Booking Plugin Architecture

All booking flows follow a consistent **4-screen plugin architecture** that ensures maintainability, consistency, and extensibility.

### Flow Structure

```
src/features/booking/flows/[flow]/
├── [Flow]BookingFlow.tsx              # Modal orchestrator (~200 lines)
├── index.ts                           # Public exports
├── screens/
│   ├── [Flow]SearchScreen.tsx         # Search form with bottom sheets
│   ├── [Flow]SearchLoadingScreen.tsx  # Animated loading transition
│   ├── [Flow]ResultsScreen.tsx        # Results with filters/sorting
│   ├── [Flow]CheckoutScreen.tsx       # Combined checkout
│   └── [Flow]CheckoutScreen.styles.ts # Extracted styles
├── sheets/                            # Bottom sheet modals
│   ├── LocationPickerSheet.tsx
│   ├── DatePickerSheet.tsx
│   ├── [Flow-specific]Sheet.tsx
│   └── PaymentSheet.tsx
└── components/                        # Reusable field components
    └── [Flow-specific]Card.tsx
```

### Available Booking Flows

| Flow | Screens | Key Features |
|------|---------|--------------|
| **Flight** | Search → Loading → Results → Checkout | One-way/round-trip, seat selection, baggage, meals |
| **Hotel** | Search → Loading → Results → Detail → Checkout | Room selection, amenities, guest details |
| **Car** | Search → Loading → Results → Checkout | Protection packages, extras, driver info |
| **Experience** | Search → Loading → Results → Checkout | Time slots, participants, host info |
| **Package** | Search → Build → Checkout | Bundle discounts, multi-category selection |

### Architecture Principles

1. **File Size Limits**: Maximum 500 lines per file
2. **Style Extraction**: Styles in separate `.styles.ts` files
3. **Bottom Sheets**: All selections happen in modal sheets
4. **State Management**: Zustand stores with persistence for draft bookings
5. **Shared Components**: `CancelBookingModal`, `PaymentSheet` reused across flows
6. **Consistent UX**: Same header pattern, navigation, and styling

### User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      BOOKING FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │  Search  │──▶│ Loading  │──▶│ Results  │──▶│ Checkout │     │
│  │  Screen  │   │  Screen  │   │  Screen  │   │  Screen  │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│       │                              │              │           │
│       ▼                              ▼              ▼           │
│  ┌──────────┐                  ┌──────────┐   ┌──────────┐     │
│  │ Location │                  │  Filter  │   │ Payment  │     │
│  │  Sheet   │                  │  Sheet   │   │  Sheet   │     │
│  └──────────┘                  └──────────┘   └──────────┘     │
│  ┌──────────┐                                 ┌──────────┐     │
│  │  Date    │                                 │ Traveler │     │
│  │  Sheet   │                                 │  Sheet   │     │
│  └──────────┘                                 └──────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design System

### Colors

```typescript
// Primary Brand
primary: '#7257FF'        // Main brand color
primaryLight: '#8F7AFF'   // Lighter variant
primaryDark: '#5940CC'    // Darker variant

// Gradients
gradientStart: '#5336E2'
gradientEnd: '#2E1E7C'

// Semantic
success: '#10B981'        // Green
warning: '#F59E0B'        // Orange
error: '#EF4444'          // Red
info: '#3B82F6'           // Blue

// Neutrals
background: '#F4F6F7'     // App background
white: '#FFFFFF'
gray50-gray900            // Gray scale
```

### Border Radius

```typescript
sm: 8      // Small elements
md: 12     // Buttons, inputs
lg: 24     // Cards (universal)
xl: 24     // Same as lg for consistency
'2xl': 28  // Blur panels
full: 9999 // Circular elements
nested: 20 // Inner elements (card radius - 4px)
```

### Typography

- **Font**: System default (SF Pro on iOS, Roboto on Android)
- **Sizes**: xs (12), sm (14), base (16), lg (18), xl (20), 2xl (24), 3xl (30), 4xl (36)
- **Weights**: regular (400), medium (500), semibold (600), bold (700)

### Spacing

```typescript
xs: 4
sm: 8
md: 12
lg: 16
xl: 24
'2xl': 32
```

---

## � API Keys & Secrets

### Supabase Edge Function Secrets

These are set via `npx supabase secrets set KEY=value --project-ref pkydmdygctojtfzbqcud`:

| Secret | Service | Purpose |
|--------|---------|---------|
| `SUPABASE_URL` | Supabase | Auto-set, project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Auto-set, admin access for edge functions |
| `ANTHROPIC_API_KEY` | Anthropic | Claude Haiku 4.5 — fallback AI for all generation |
| `GOOGLE_AI_API_KEY` | Google AI | Gemini 3.0 Flash — primary AI for all generation |
| `INCEPTION_API_KEY` | Inception | Secondary AI provider |
| `TOMORROW_IO_API_KEY` | Tomorrow.io | Weather forecasts for packing/itinerary |
| `RESEND_API_KEY` | Resend | Email delivery for trip invitations |
| `RESEND_WEBHOOK_SECRET` | Resend | Inbound email webhook verification |
| `SERPAPI_KEY` | SerpAPI | Google Flights/Hotels search |
| `RAPIDAPI_KEY` | RapidAPI | Kiwi flights, Booking.com, car rentals |

### Client-Side Environment Variables (`.env`)

| Variable | Service | Purpose |
|----------|---------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase | Database + Edge Functions URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Client-side anonymous key |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | Authentication provider |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps | Maps + AR navigation |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry | Error tracking |

### External Service Accounts

| Service | Domain | Purpose |
|---------|--------|---------|
| **Clerk** | clerk.com | Authentication (social login, OTP) |
| **Supabase** | supabase.com | Database, storage, edge functions |
| **Resend** | resend.com | Transactional email (domain: `guidera.one`) |
| **Sentry** | sentry.io | Error tracking + performance |
| **Firebase** | firebase.google.com | Push notifications (FCM) |

---

## ⚡ Edge Functions

42 Supabase Edge Functions deployed at `https://pkydmdygctojtfzbqcud.supabase.co/functions/v1/`:

### AI Generation (Smart Plan)

| Function | AI Model | Purpose |
|----------|----------|---------|
| `generate-itinerary` | Gemini 2.5 Flash / Haiku | Day-by-day trip itinerary |
| `generate-packing` | Gemini 2.5 Flash / Haiku | Smart packing list based on destination + weather |
| `generate-safety` | Gemini 2.5 Flash / Haiku | Safety profile with score + emergency info |
| `generate-language` | Gemini 2.5 Flash / Haiku | 120+ essential phrases with phonetics |
| `generate-documents` | Gemini 2.5 Flash / Haiku | Passport/visa/insurance document checklist |
| `generate-dos-donts` | Gemini 2.5 Flash / Haiku | Cultural tips and etiquette |
| `generate-compensation` | Gemini 2.5 Flash / Haiku | Flight delay/cancellation claim analysis |
| `generate-expense-summary` | Gemini 2.5 Flash | Post-trip expense analysis |

### Trip Services

| Function | Purpose |
|----------|---------|
| `scan-ticket` | OCR + AI to extract booking data from photos |
| `scan-receipt` | Receipt scanning for expense tracking |
| `process-email-import` | AI-powered email booking parser (Resend inbound → Gemini) |
| `trip-import-engine` | Legacy import pipeline (ticket scanning, manual) |
| `trip-snapshot` | AI destination preview (cost, stays, experiences) |
| `send-trip-invite` | Trip invitation emails via Resend |
| `departure-advisor` | Pre-departure travel advisory briefing |

### Search & Discovery

| Function | Purpose |
|----------|---------|
| `flight-search` | Flight search via SerpAPI/Amadeus |
| `hotel-search` | Hotel search |
| `event-discovery` | Local events at destination |
| `local-experiences` | Local experiences + hidden gems |
| `places` | Place search + details |
| `weather` | Weather forecasts |

### Other

| Function | Purpose |
|----------|---------|
| `send-notification` | Push notifications via FCM |
| `scheduled-jobs` | Cron: deal scanning, flight tracking, reminders |
| `chat-assistant` | AI chat assistant |
| `translation` | Real-time translation |
| `transcribe-audio` | Voice note transcription |
| `currency` | Currency conversion |

---

## 🧩 Trip Hub Plugins

Each trip has a "Trip Hub" with 9 AI-powered plugin screens:

| Plugin | Service File | Edge Function | DB Table |
|--------|-------------|---------------|----------|
| **Trip Planner** | `planner.service.ts` | `generate-itinerary` | `itinerary_days` + `itinerary_activities` |
| **Packing List** | `packing.service.ts` | `generate-packing` | `packing_items` |
| **Safety** | `safety.service.ts` | `generate-safety` | `safety_profiles` + `safety_alerts` |
| **Language Kit** | `language.service.ts` | `generate-language` | `language_kits` + `language_phrases` |
| **Documents** | `document.service.ts` | `generate-documents` | `document_checklists` + `document_items` |
| **Do's & Don'ts** | `safety.service.ts` | `generate-dos-donts` | `cultural_tips` |
| **Expenses** | `expense.service.ts` | `generate-expense-summary` | `expenses` |
| **Journal** | `journal.service.ts` | — | `journal_entries` + `journal_blocks` |
| **Compensation** | `compensation.service.ts` | `generate-compensation` | `compensation_claims` + `compensation_rights_cards` |

All plugins have:
- Error states with retry UI (`PluginErrorState` component)
- Loading states
- Empty states (`PluginEmptyState` component)
- Theme-aware dark/light mode

### Smart Plan Generation Flow

When user taps "Generate Smart Plan" on a trip card:
1. Rate limit check (max 10/month)
2. Wave 1 (concurrent): Itinerary + Do's & Don'ts + Documents
3. Wave 2 (concurrent): Packing + Safety + Language
4. Failed modules retry up to 3x with exponential backoff (3s, 6s, 9s)
5. Inline progress bar on the trip card shows module-by-module status
6. Non-blocking — user can navigate away and return

---

## 📨 Trip Invitation System

### Architecture

- **Email provider**: Resend (`Guidera Team <team@guidera.one>`)
- **Edge function**: `send-trip-invite`
- **DB tables**: `trip_invitations` (invites) + `trip_members` (accepted travelers)
- **Max invitees**: 5 per trip
- **Expiry**: 30 days

### Flow

1. Trip owner enters names + emails in Invite Travelers sheet
2. Edge function creates `trip_invitations` rows + sends personalized HTML emails
3. Each email contains an invite code + accept button
4. Invitee accepts → `trip_members` row created → trip appears in their Trips tab
5. Trip detail screen shows travelers with status badges (Pending/Accepted/Declined)

### Database

```
trip_invitations: id, trip_id, invited_by → profiles(id), invited_email, invited_name, token (unique), status, role
trip_members: id, trip_id, user_id → profiles(id), role (owner/collaborator/viewer), joined_via, invitation_id
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Supabase CLI**: `npm install -g supabase`
- **iOS**: Xcode 15+ (for iOS development)
- **Android**: Android Studio (for Android development)

### Installation

```bash
# Clone the repository
git clone https://github.com/nidrosoft/guidera.git
cd guidera

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your API keys in .env
```

### Environment Variables

Create a `.env` file:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://pkydmdygctojtfzbqcud.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Sentry (Error Tracking)
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### Running the App

```bash
# Start the development server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android
```

---

## 💻 Development

### Code Style

- **ESLint** for linting
- **Prettier** for formatting
- **TypeScript** strict mode enabled

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `FlightCard.tsx` |
| Screens | PascalCase + Screen | `FlightSearchScreen.tsx` |
| Hooks | camelCase with `use` prefix | `useFlightSearch.ts` |
| Stores | camelCase with `use` prefix | `useFlightStore.ts` |
| Styles | Component name + `.styles.ts` | `FlightCard.styles.ts` |
| Types | PascalCase + `.types.ts` | `flight.types.ts` |

### Creating a New Booking Flow

1. Create folder: `src/features/booking/flows/[flow]/`
2. Create orchestrator: `[Flow]BookingFlow.tsx`
3. Create screens in `screens/` folder
4. Create sheets in `sheets/` folder
5. Create Zustand store in `stores/`
6. Export from `index.ts`

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Structure

```
__tests__/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/            # End-to-end tests
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `docs/ARCHITECTURE.md` | Detailed architecture and booking plugin pattern |
| `docs/API_SERVICES_GUIDE.md` | Comprehensive API integration guide (13 categories) |
| `docs/TRIP_PLANNING.md` | Trip planning feature specification |
| `docs/PRODUCTION_READINESS_ROADMAP.md` | Production readiness checklist |
| `docs/LANDING_PAGE_SPECIFICATION.md` | Landing page design specs |
| `QUICK_START.md` | Quick start guide |

---

## 📄 License

Proprietary - All rights reserved

---

<p align="center">
  Made with ❤️ by the Guidera Team
</p>
