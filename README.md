# Guidera

<p align="center">
  <img src="assets/images/logo.png" alt="Guidera Logo" width="120" />
</p>

<p align="center">
  <strong>AI-Powered Travel Companion</strong><br/>
  Plan, explore, and navigate the world with intelligent assistance
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-54.0-blue" alt="Expo" />
  <img src="https://img.shields.io/badge/React%20Native-0.81.5-green" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Edge%20Functions-44-orange" alt="Edge Functions" />
  <img src="https://img.shields.io/badge/APIs-32-purple" alt="APIs" />
  <img src="https://img.shields.io/badge/License-Proprietary-red" alt="License" />
</p>

---

## Table of Contents

1. [Authentication Architecture](#authentication-architecture)
2. [Overview](#overview)
3. [App Structure & Navigation](#app-structure--navigation)
4. [Features (Complete List)](#features-complete-list)
5. [Architecture & Data Flow](#architecture--data-flow)
6. [State Management](#state-management)
7. [Plugin Architecture](#plugin-architecture)
8. [AI Engine](#ai-engine)
9. [API Services (All 32)](#api-services-all-32)
10. [Edge Functions (All 44)](#edge-functions-all-44)
11. [Design System](#design-system)
12. [Security Model](#security-model)
13. [Caching & Offline](#caching--offline)
14. [Realtime System](#realtime-system)
15. [Internationalization](#internationalization)
16. [Project Structure](#project-structure)
17. [Getting Started](#getting-started)
18. [Development](#development)
19. [Testing](#testing)

---

## Authentication Architecture

> **Guidera uses [Clerk](https://clerk.com) for authentication, NOT Supabase Auth.**

- Clerk handles sign-in/sign-up UI, session tokens, SSO (Apple, Google, Facebook), and OTP
- Supabase validates Clerk JWTs via JWKS (Third-Party Auth) -- no shared secret needed
- All user data lives in `public.profiles` with a `clerk_id` column linking to Clerk
- Profile ID format: UUID. Clerk ID format: `user_XXXXX` (string in `profiles.clerk_id`)
- `trips.user_id` = `profiles.id` (UUID), never a Clerk ID
- Edge functions extract user identity from the JWT `Authorization` header via `supabase.auth.getUser()`, then look up the profile UUID from `profiles.clerk_id`

**Auth Flow:**
```
Clerk Sign-In -> Session Token -> setClerkTokenGetter(getToken)
  -> Supabase Client uses Clerk token for all requests
  -> syncClerkUserToSupabase() upserts to profiles table
  -> AuthGuard redirects unauthenticated users to landing
```

---

## Overview

Guidera is a comprehensive AI-powered travel companion that helps users discover destinations, plan trips with AI-generated content, navigate unfamiliar places, and connect with fellow travelers. It is NOT a booking platform -- it redirects users to external booking sites and allows them to import their bookings back into the app.

### Key Differentiators

- **AI-First**: Claude (Anthropic), Gemini (Google), and Grok (xAI) power intelligent trip planning, vision analysis, and chat assistance
- **Smart Plan Generation**: One-tap AI generates 6 modules -- itinerary, packing, safety, language, documents, cultural tips
- **AI Vision**: Live camera mode with "What's this?" trigger for landmarks, menu scanning with translation, and order building with TTS
- **AI Chat Assistant**: Claude-powered assistant with 14 real-time tools (flights, hotels, weather, maps, directions, POIs, currency, visa info)
- **Trip Import**: Scan boarding passes/tickets via camera OCR, forward booking emails, or enter manually
- **Safety Intelligence**: 4-API parallel safety queries, SOS system, geofencing, check-in system
- **Community Network**: Groups, buddy matching, events, local guides, activities (Pulse), real-time chat
- **32 External APIs** integrated through 44 Supabase Edge Functions

---

## App Structure & Navigation

### 5 Tab Navigation (Custom Tab Bar)

| Tab | Screen | Description |
|-----|--------|-------------|
| **Explore** | `(tabs)/index.tsx` | Homepage with 12 content sections, search, deals, categories |
| **Trips** | `(tabs)/trips.tsx` | Trip list filtered by state (Upcoming/Ongoing/Past/Cancelled) |
| **[Launcher]** | Center FAB | Floating action button opens ScanBottomSheet with quick actions |
| **Connect** | `(tabs)/community.tsx` | Community hub -- groups, buddies, events, guides, Pulse |
| **Profile** | `(tabs)/account.tsx` | Account settings, rewards, preferences, privacy |

The center tab is a **floating action button** (56px circle, primary color) that opens a bottom sheet with quick actions:
- **Ask AI** -- Opens global AI chat assistant
- **Scan Receipt** -- Receipt OCR for expense tracking
- **Scan Document** -- Ticket/boarding pass scanner for trip import
- **Navigate** -- City navigation with Mapbox
- **AI Vision** -- Camera-based AI analysis (menus, landmarks, text)
- **AR Plugins** -- Danger alerts, city navigator, airport navigator, landmarks

### Hidden Tabs
- **Saved** -- Routes to saved deals/destinations
- **Inbox** -- Messages list (DM and group chat)

---

## Features (Complete List)

### Authentication & Onboarding
| Feature | Description | Backend |
|---------|-------------|---------|
| Email signup/signin | Standard email/password auth | Clerk |
| Phone OTP | Phone number with SMS verification | Clerk |
| Apple/Google/Facebook SSO | Social sign-in | Clerk + OAuth |
| Password reset | Email-based reset flow | Clerk |
| 13-step onboarding | Name, DOB, gender, country, languages, travel preferences, dietary, accessibility, emergency contact | Supabase `profiles` |
| Onboarding persistence | Zustand + AsyncStorage -- survives app crashes | Local |

### Homepage / Explore
| Feature | Description | Backend |
|---------|-------------|---------|
| 12 content sections | Deals, Popular Destinations, Places, Events, Must See, Editor's Choices, Trending, Hidden Gems, Budget Friendly, Luxury Escapes, Local Experiences, Family Friendly | Edge function `homepage`, Supabase `curated_destinations` |
| Trip reminder card | Shows nearest upcoming trip with flight info | Supabase `trips` |
| Search overlay | Full-screen with Where/When/Who sections, autocomplete | Edge function `search`, Google Places |
| Trip Snapshot | AI-powered destination intelligence (costs, flights, hotels, experiences, guide) | Edge function `trip-snapshot` (Amadeus + Brave + Viator) |
| Category quick actions | Plan, Flight, Hotel, Package, Car, Experiences | Routes to booking flows |
| Deal system | Exclusive travel deals with price tracking, alerts, affiliate links | Edge functions `deal-scanner`, `deal-notifier` |

### Trip Management
| Feature | Description | Backend |
|---------|-------------|---------|
| Trip CRUD | Create, view, delete trips with state machine (Draft -> Upcoming -> Ongoing -> Past) | Supabase `trips` |
| Trip collaboration | Invite up to 5 travelers via email, role-based access (owner/collaborator/viewer) | Edge function `send-trip-invite`, Resend email |
| Smart Plan generation | One-tap AI generates 6 modules with inline progress, rate-limited 10/month | 6 edge functions in 2 waves, retry with exponential backoff |
| Trip import -- Camera | OCR scan of boarding passes, hotel vouchers, train tickets | Edge function `scan-ticket` (Claude/Gemini) |
| Trip import -- Email | Forward confirmations to `import+{userId}@guidera.one` | Edge function `trip-import-engine` |
| Trip import -- Manual | Manual entry form | Supabase direct |
| Departure Advisor | AI "When to Leave" calculator (drive time, traffic, security, gate walk) | Edge function `departure-advisor` |
| Booking pass | Bottom sheet showing boarding pass / hotel voucher details | Local rendering |

### Trip Hub Plugins (10 Modules)

Each plugin follows a consistent pattern: dedicated service, edge function, Supabase tables, error/loading/empty states, and dark mode support.

| Plugin | Description | Edge Function | Tables |
|--------|-------------|---------------|--------|
| **Itinerary Planner** | Day-by-day AI itinerary with activity CRUD | `generate-itinerary` | `itinerary_days`, `itinerary_activities` |
| **Packing List** | AI packing suggestions based on destination/weather/trip type | `generate-packing` | `packing_items` |
| **Safety Intelligence** | 4-tab safety profile (overview, intel, emergency, checklist) | `generate-safety` | `safety_profiles`, `safety_alerts` |
| **Language Kit** | 120+ phrases with phonetics, categories, formality levels | `generate-language` | `language_kits`, `language_phrases` |
| **Documents Checklist** | Passport/visa/insurance checklist with status tracking | `generate-documents` | `document_checklists`, `document_items` |
| **Do's & Don'ts** | Cultural etiquette guide | `generate-dos-donts` | `cultural_tips` |
| **Expenses & Budget** | Expense tracking, receipt scanning, budget alerts, charts | `generate-expense-summary`, `scan-receipt` | `expenses` |
| **Travel Journal** | Block-based editor with photos, timeline view | -- (direct Supabase) | `journal_entries`, `journal_blocks` |
| **Compensation Claims** | Flight delay/cancellation claim analysis (EU261, US DOT, APPR, UK261) | `generate-compensation` | `compensation_claims`, `rights_cards` |
| **Departure Advisor** | When-to-leave calculator with transport options and risk levels | `departure-advisor` | -- |

### AI Vision & Translation
| Feature | Description | Backend |
|---------|-------------|---------|
| Live Camera Mode | Passive camera with "What's this?" trigger for landmarks/art/culture | Edge function `ai-vision` (Gemini) |
| Snapshot Mode | Take photo, get AI analysis + OCR + translation | Google Vision + Translation API |
| Menu Scan | Multi-photo (up to 3 pages) menu extraction with translation | Edge function `ai-vision` (Gemini) |
| Order Builder | AI generates natural spoken order in local language | Gemini + TTS |
| Text-to-Speech | OpenAI gpt-4o-mini-tts (primary) + ElevenLabs (fallback) + expo-speech (fallback) | Edge function `tts` |
| Voice settings | Speed control, voice selection, auto-play toggle | Local |

### Navigation & Maps
| Feature | Description | Backend |
|---------|-------------|---------|
| City navigation | Turn-by-turn with Mapbox 3D, voice guidance, auto-reroute | Mapbox Directions API |
| Landmark search | Category-filtered POI search (food, culture, emergency, transport, shopping) | Google Places via `google-api-proxy` |
| AR danger alerts | Safety zone visualization on camera overlay | Safety APIs |
| Voice navigation | TTS-based turn instructions | expo-speech |

### Community / Connect
| Feature | Description | Backend |
|---------|-------------|---------|
| Groups | Create/join groups, admin panel, feeds, member management | Supabase `communities`, `community_members` |
| Buddy matching | AI-based suggestions, proximity matching, connection management | Supabase `buddy_connections` |
| Events | Create/RSVP events, waitlist promotion | Supabase `community_events`, `event_attendees` |
| Local Guides | Application flow, identity verification (Didit KYC), listings, reviews | Supabase + Edge functions `didit-*` |
| Activities (Pulse) | Create/join real-time activities, rate-limited 3/hour | Supabase `community_activities` (with Realtime) |
| Posts | Create, react, comment, threaded replies, media | Supabase `community_posts`, `post_reactions` |
| DM Chat | Real-time 1:1 messaging | Supabase Realtime `chat_messages` |
| Group Chat | Real-time group messaging | Supabase Realtime `chat_messages` |
| Content reporting | 6 reason categories, user blocking | Supabase `content_reports`, `user_blocks` |

### Account & Settings
| Feature | Description | Backend |
|---------|-------------|---------|
| Profile editing | Name, bio, phone, location, avatar upload, travel card preview | Supabase `profiles` + Storage |
| Travel preferences | 37+ fields across 7 categories (style, budget, interests, accommodation, transport, accessibility, lifestyle) | Supabase `travel_preferences` |
| Rewards & points | Points history, tiers (Free/Silver/Gold/Platinum), multipliers | Supabase `reward_points` |
| Referral system | Unique codes, $20/referral, email invites, status tracking | Supabase `referrals` |
| Membership tiers | Display + upgrade UI (payment integration pending) | Supabase |
| Push notifications | Category-level toggles, quiet hours, permission management | expo-notifications + Supabase `user_devices` |
| Privacy settings | Profile visibility (public/buddies/private), activity status, location sharing, search visibility | Supabase `profiles.privacy_settings` |
| Appearance | Light/dark/system theme with preview | AsyncStorage |
| Language | 33 languages, i18next integration | AsyncStorage + i18next |
| Security | Biometric lock (Face ID/Touch ID), active sessions | expo-local-authentication |
| Delete account | Cascade deletion with confirmation flow | Supabase edge function |

### Safety & Emergency
| Feature | Description | Backend |
|---------|-------------|---------|
| Safety Intelligence | Parallel 4-API queries (TravelRisk, GDACS, US State Dept, CrimeoMeter) | `safety-intelligence.service.ts` |
| Geofencing | Background location monitoring, 1-mile safety zones | expo-location + expo-task-manager |
| SOS System | Emergency activation, contact notification (SMS/email/call), location sharing | `sos.service.ts` + edge function |
| Check-in system | Scheduled check-ins, missed check-in escalation (3+ misses -> emergency alert) | Supabase |
| Real-time alerts | Supabase Realtime subscription to `alerts` table | Realtime channel |

### Booking Discovery (Redirect Model)
Guidera does NOT book directly. It finds deals and redirects users to external booking sites. Users can then import their bookings back.

| Category | Providers | Pattern |
|----------|-----------|---------|
| Flights | Amadeus, Kiwi (RapidAPI), SerpAPI (Google Flights) | Search -> Compare -> Redirect to provider -> Import booking |
| Hotels | Amadeus, Booking.com (SerpAPI), Expedia | Same redirect model |
| Cars | Booking Cars (RapidAPI) | Same |
| Experiences | Viator, GetYourGuide | Same |

---

## Architecture & Data Flow

### Provider Chain (Root Layout)

```
GestureHandlerRootView
  ErrorBoundary (level="global", Sentry integration)
    QueryClientProvider (React Query -- 5min stale, 30min GC, 2 retries)
      ThemeProvider (dark/light/system, AsyncStorage-persisted)
        ClerkProvider (authentication)
          AuthProvider (Clerk-to-Supabase bridge, profile sync)
            AuthGuard (redirects unauthenticated to landing)
              HomepageDataProvider (pre-fetches section data)
                ToastProvider (success/error/warning/info toasts)
                  Stack (expo-router file-based navigation)
                  OfflineBanner
```

**Services initialized on mount:** Sentry, i18n, Mixpanel analytics, deep linking, push notifications, health checks (60s interval), Mapbox SDK

### Data Flow Pattern

```
Screen Component
  -> useHook() or Context
    -> Service Layer (business logic)
      -> Edge Function (server-side, rate-limited, auth-verified)
        -> External API (Amadeus, Gemini, Google, etc.)
      -> Supabase Direct (RLS-protected CRUD)
    -> Zustand Store (client state) or React Query Cache (server state)
  -> UI Render (theme-aware, responsive)
```

### Homepage Data Flow (Example)

```
HomepageDataProvider (context, root-level)
  -> useHomepage() hook
    -> homepageService.getSections()
      -> Edge function `homepage` (primary)
      -> Direct Supabase `curated_destinations` query (fallback)
    -> Returns 12 sections with destinations
  -> HomepageDataContext provides to all children
    -> SectionRenderer maps slug -> component
      -> Each section component gets items from context
        -> Cards render with TrackableCard (interaction tracking)
```

---

## State Management

| Pattern | Library | Use Case |
|---------|---------|----------|
| **Server state** | React Query (@tanstack/react-query) | API responses, caching, background refetch |
| **Client state** | Zustand | Trip store, booking flow stores, onboarding store |
| **UI state** | React Context | Theme, auth, location, toast, homepage data |
| **Persistence** | AsyncStorage | Theme preference, language, cache, onboarding progress |
| **Secure storage** | expo-secure-store | Push notification tokens |

### Zustand Store Pattern

```typescript
// Trip Store example -- Zustand with full CRUD
const useTripStore = create<TripStore>((set, get) => ({
  trips: [],
  isLoading: false,
  isCreating: false,   // Per-operation loading states
  isUpdating: false,
  isDeleting: false,
  error: null,

  fetchTrips: async (userId) => { /* Supabase query */ },
  createTrip: async (data) => { /* set isCreating, call service */ },
  updateTrip: async (id, data) => { /* set isUpdating */ },
  deleteTrip: async (id) => { /* soft delete */ },
}));
```

---

## Plugin Architecture

### Trip Plugins

Each trip plugin follows this directory structure:
```
src/features/trips/plugins/[plugin]/
  types/           -- TypeScript interfaces and enums
  screens/         -- Main screen component(s)
  components/      -- Bottom sheets, cards, modals
  index.ts         -- Re-exports
```

**Rendering pattern:** Plugins render as `<Modal presentationStyle="pageSheet">` overlays receiving `{ visible, onClose, trip }` props. Data fetched from dedicated services.

### AR Plugins

5 AR plugins registered in `useARPlugins.ts`:
```
pluginRegistry: Map<string, ARPlugin>
  -> 'landmark-scanner'
  -> 'menu-translator'
  -> 'airport-navigator'
  -> 'danger-alerts'
  -> 'city-navigator'
```

Each implements `onActivate()` and `onDeactivate()` lifecycle hooks.

---

## AI Engine

### AI Models Used

| Model | Provider | Primary Use |
|-------|----------|-------------|
| **Claude Opus 4.5** | Anthropic | Primary AI for all generation modules + chat assistant |
| **Claude Sonnet 4** | Anthropic | Fallback for generation |
| **Claude Haiku 3** | Anthropic | Lightweight fallback for chat |
| **Gemini 1.5 Flash** | Google | AI Vision, event discovery, generation fallback |
| **Grok Beta / Grok 3 Mini** | xAI | Secondary fallback, web search with `search_parameters` |
| **GPT-4o-mini-TTS** | OpenAI | Text-to-speech for AI Vision |
| **Whisper** | OpenAI | Audio transcription |
| **ElevenLabs v2** | ElevenLabs | TTS fallback |

### AI Chat Assistant (14 Tools)

The chat assistant (Claude-powered) has access to 14 real-time tools:

| Tool | External API | Description |
|------|-------------|-------------|
| `web_search` | Brave Search | Real-time web search |
| `get_weather` | Tomorrow.io / wttr.in | Weather forecasts |
| `get_visa_requirements` | Web search | Visa info for nationality/destination |
| `get_travel_advisory` | Web search | Safety advisories |
| `get_exchange_rate` | ExchangeRate-API | Currency conversion |
| `get_flight_status` | AeroDataBox | Live flight tracking |
| `search_flights` | Amadeus | Flight search |
| `search_hotels` | Amadeus | Hotel search |
| `search_experiences` | Viator | Activity/experience search |
| `get_destination_intel` | Google Places | Destination overview |
| `get_map` | Mapbox Static | Static map images |
| `get_directions` | Mapbox Directions | Turn-by-turn directions |
| `get_nearby_places` | Google Places | POI search |
| `get_distance` | Mapbox Matrix | Distance/time calculation |

### Smart Plan Generation Flow

```
User taps "Generate Smart Plan" on trip card
  -> Rate limit check (max 10/month via DB query)
  -> Wave 1 (concurrent): Itinerary + Do's & Don'ts + Documents
  -> Wave 2 (concurrent): Packing + Safety + Language
  -> Failed modules retry up to 3x (3s, 6s, 9s exponential backoff)
  -> Inline progress bar on card shows per-module status
  -> Non-blocking -- user can navigate away and return
```

### AI Generation Architecture

```
Service Layer (client)
  -> ai-engine/generation/generation.service.ts
    -> Context Builder (gathers trip + traveler + destination data)
    -> Edge function `ai-generation` (server-side)
      -> Try Anthropic Claude (primary)
      -> Fallback to Google Gemini
      -> Fallback to xAI Grok
    -> AI Cache Service (3-tier: destination_base, context_specific, personal)
    -> Supabase `ai_module_cache` + `ai_generation_logs` tables
```

---

## API Services (All 32)

### Active -- Client-Side (5)

| # | Service | Env Variable | Used For |
|---|---------|-------------|----------|
| 1 | **Supabase** | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Database, Edge Functions, Storage, Realtime |
| 2 | **Clerk** | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Authentication, SSO, session management |
| 3 | **Google Maps** | `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Native map rendering (iOS/Android), Places autocomplete |
| 4 | **Mapbox** | `EXPO_PUBLIC_MAPBOX_TOKEN` | Outdoor maps (@rnmapbox/maps), geocoding, directions |
| 5 | **Expo Push** | `app.json > extra.eas.projectId` | Push notifications via expo-notifications |

### Active -- Server-Side Edge Functions (24)

| # | Service | Env Variable(s) | Used For |
|---|---------|-----------------|----------|
| 6 | **Anthropic (Claude)** | `ANTHROPIC_API_KEY` | Primary AI for all 9 generation modules + chat assistant |
| 7 | **Google Gemini** | `GOOGLE_AI_API_KEY` | AI Vision, event discovery, generation fallback |
| 8 | **xAI (Grok)** | `XAI_API_KEY` | Secondary AI fallback, web search |
| 9 | **OpenAI** | `OPENAI_API_KEY` | TTS (gpt-4o-mini-tts), Whisper transcription, OCR fallback |
| 10 | **ElevenLabs** | `ELEVENLABS_API_KEY` | TTS fallback (eleven_multilingual_v2) |
| 11 | **Amadeus** | `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET` | Flight search, hotel search, trip snapshot |
| 12 | **RapidAPI (hub)** | `RAPIDAPI_KEY` | Kiwi flights, Booking.com, car rentals, flight tracking, safety alerts |
| 13 | **SerpAPI** | `SERPAPI_KEY` | Google Flights/Hotels scraping, deal scanning, car search |
| 14 | **Viator** | `VIATOR_API_KEY` | Experiences/activities, deal scanning, trip snapshot |
| 15 | **Brave Search** | `BRAVE_SEARCH_API_KEY` | Chat assistant web search, trip snapshot |
| 16 | **Tomorrow.io** | `TOMORROW_IO_API_KEY` | Weather for packing/itinerary, chat tool |
| 17 | **Currencylayer** | `CURRENCYLAYER_API_KEY` | Currency exchange rates |
| 18 | **Resend** | `RESEND_API_KEY` | Trip invitation emails, crash reports, notifications |
| 19 | **Didit** | `DIDIT_API_KEY`, `DIDIT_WORKFLOW_ID`, `DIDIT_WEBHOOK_SECRET` | Identity verification (KYC) for local guides |
| 20 | **TikAPI** | `TIKAPI_API_KEY` | TikTok travel content videos |
| 21 | **AeroDataBox** | `AERODATABOX_API_KEY` | Airport/flight data for departure advisor |
| 22 | **Traxo** | `TRAXO_CLIENT_ID`, `TRAXO_CLIENT_SECRET` | Trip import from email (OAuth2) |
| 23 | **AwardWallet** | `AWARDWALLET_API_KEY` | Loyalty/rewards program import |
| 24 | **Expedia** | `EXPEDIA_API_KEY`, `EXPEDIA_SECRET` | Hotel search fallback |
| 25 | **Google Cloud** | `GOOGLE_PLACES_API_KEY`, `GOOGLE_CLOUD_API_KEY` | Places, Vision OCR, Translation (server-side) |
| 26 | **Mapbox** | `MAPBOX_PUBLIC_TOKEN` | Server-side static maps, directions for chat |

### Free / Open APIs (3)

| # | Service | Used For |
|---|---------|----------|
| 27 | **ExchangeRate-API** | Free currency fallback in chat |
| 28 | **wttr.in** | Free weather fallback |
| 29 | **Inception API** | Referenced but not active |

### Not Yet Active (3)

| # | Service | Env Variable | Status |
|---|---------|-------------|--------|
| 30 | **Sentry** | `EXPO_PUBLIC_SENTRY_DSN` | SDK installed, DSN needs configuration |
| 31 | **Mixpanel** | `EXPO_PUBLIC_MIXPANEL_TOKEN` | SDK installed, defaults to mock provider |
| 32 | **Stripe** | `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Placeholder for future payments |

---

## Edge Functions (All 44)

Deployed at `https://pkydmdygctojtfzbqcud.supabase.co/functions/v1/`

### AI Generation (9)
| Function | AI Models | Purpose |
|----------|-----------|---------|
| `ai-generation` | Claude, Gemini, Grok | General AI content generation orchestrator |
| `generate-itinerary` | Claude/Gemini + Tomorrow.io | Day-by-day trip itinerary |
| `generate-packing` | Claude/Gemini + Tomorrow.io | Smart packing list (weather-aware) |
| `generate-safety` | Claude/Gemini | Safety profile with score + emergency info |
| `generate-language` | Claude/Gemini | 120+ phrases with phonetics |
| `generate-documents` | Claude/Gemini | Passport/visa/insurance checklist |
| `generate-dos-donts` | Claude/Gemini | Cultural etiquette guide |
| `generate-compensation` | Claude/Gemini | Flight compensation analysis |
| `generate-expense-summary` | Claude/Gemini | Post-trip expense analysis |

### AI Chat & Vision (3)
| Function | Purpose |
|----------|---------|
| `chat-assistant` | Claude-powered assistant with 14 tools (flights, hotels, weather, maps, etc.) |
| `ai-vision` | Camera frame analysis for landmarks/menus/text (Gemini) |
| `compute-travel-dna` | User travel profile analysis |

### Search & Booking (5)
| Function | Providers | Purpose |
|----------|-----------|---------|
| `provider-manager` | SerpAPI, multi-provider | Unified search orchestrator |
| `flight-search` | Amadeus, Kiwi | Flight offers |
| `hotel-search` | Amadeus, Expedia | Hotel search |
| `flight-tracking` | AeroDataBox | Live flight status |
| `search` | Supabase + providers | Multi-category search |

### Discovery (5)
| Function | Purpose |
|----------|---------|
| `homepage` | Homepage section data |
| `places` | Google Places proxy |
| `event-discovery` | AI-discovered local events (Gemini) |
| `local-experiences` | Viator experiences |
| `tiktok-content` | TikTok travel videos |

### Trip Services (6)
| Function | Purpose |
|----------|---------|
| `trip-snapshot` | AI destination preview (costs, stays, experiences) |
| `departure-advisor` | When-to-leave calculator |
| `trip-import-engine` | Ticket OCR + email import |
| `scan-receipt` | Receipt OCR for expenses |
| `scan-ticket` | Boarding pass/ticket OCR |
| `send-trip-invite` | Trip invitation emails (Resend) |

### Deals (3)
| Function | Purpose |
|----------|---------|
| `deal-scanner` | Finds deals (SerpAPI + Viator) |
| `deal-notifier` | Price drop notifications |
| `refresh-deal-images` | Image CDN refresh |

### Identity & Communication (7)
| Function | Purpose |
|----------|---------|
| `didit-create-session` | Start KYC verification |
| `didit-check-status` | Check verification status |
| `didit-webhook` | Process verification results |
| `translation` | Google Cloud Translation |
| `transcribe-audio` | OpenAI Whisper transcription |
| `tts` | Text-to-speech (OpenAI + ElevenLabs) |
| `send-notification` | Push notification delivery |

### Utilities (4)
| Function | Purpose |
|----------|---------|
| `weather` | Tomorrow.io weather data |
| `currency` | Currencylayer exchange rates |
| `google-api-proxy` | Google APIs proxy (Places, Vision, Translation) |
| `safety-alerts` | RapidAPI safety data |

### Infrastructure (2)
| Function | Purpose |
|----------|---------|
| `send-crash-report` | Error reports via Resend |
| `scheduled-jobs` | Cron: deal scanning, flight tracking, reminders |

### Shared Modules (`_shared/`)
| Module | Purpose |
|--------|---------|
| `auth.ts` | JWT extraction, Clerk-to-profile mapping |
| `rateLimiter.ts` | Sliding window rate limiter (fail-closed) |
| `cors.ts` | Origin-checked CORS (whitelist: guidera.app, guidera.one) |
| `providers/` | Amadeus, Kiwi, Expedia, SerpAPI, Viator, Cars, Experiences adapters |

---

## Design System

### Color Tokens (Dark-First)

```
Primary:     #3FC39E (mint/teal)
Background:  #121212 (dark) / #F8F9FA (light)
Card:        #1E1E1E (dark) / #FFFFFF (light)
Text:        #F5F5F5 (dark) / #1A1A1A (light)
Success:     #28C840
Warning:     #FFBD2E
Error:       #EF4444
Info:        #3B82F6
```

### Typography
- **Display Font:** Host Grotesk Bold
- **Body Font:** Rubik (Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700)
- **Scale:** captionSm(10), caption(11), bodySm(12), body(13), bodyLg(14), heading3(15), base(16), heading2(18), kpiValue(20), heading1(22), 2xl(24)

### Spacing Scale
```
xs: 4, sm: 8, md: 12, lg: 16, xl: 20, 2xl: 24, 3xl: 28, 4xl: 32
```

### Border Radius Tokens
```
sm: 6, md: 8, lg: 16, xl: 24, 2xl: 28, 3xl: 32, full: 9999
```

### DS Components (`src/components/ds/`)
9 theme-aware primitives: DSButton, DSCard, DSInput, DSBadge, DSToggle, DSAvatar, DSDivider, DSProgressBar, DSIconContainer

---

## Security Model

### Authentication
- Clerk handles all auth (SSO, OTP, session management)
- Supabase validates Clerk JWTs via JWKS (Third-Party Auth)
- Profile sync bridges Clerk user to Supabase profile

### Edge Function Security
- **Auth:** JWT extracted from Authorization header, mapped to profile UUID
- **Rate Limiting:** Sliding window per-user, fail-closed (denies on DB error)
  - AI generation: 30/hour
  - Smart Plan: 10/24 hours
  - Search: 60/hour
  - Google proxy: 100/hour
  - Chat: 50/hour
  - Crash reports: 10/hour
- **CORS:** Origin whitelist (guidera.app, guidera.one). Mobile apps don't send Origin headers.

### Data Security
- Row Level Security (RLS) on all tables with `requesting_user_id()` function
- Push tokens stored in `expo-secure-store` (encrypted on-device)
- Sensitive data never logged in production (`__DEV__` guards)
- Account deletion cascades across all tables

---

## Caching & Offline

### Two-Tier Cache Service
```
Memory Cache (Map, max 500 items)
  -> LRU eviction: batch removes oldest 20% when limit hit
  -> TTL presets: SHORT(1min), MEDIUM(5min), LONG(30min), VERY_LONG(24hr)

AsyncStorage Persistence
  -> Only for items with TTL > 1 minute
  -> Prefix: @guidera_cache_*
  -> Cache-aside pattern via getOrSet()
```

### Offline Sync
```
OfflineSyncService (singleton)
  -> Priority queue persisted to AsyncStorage (@guidera_sync_queue)
  -> Supported: CREATE_BOOKING, UPDATE_BOOKING, CANCEL_BOOKING,
     SAVE_TRIP, UPDATE_TRIP, ADD_EXPENSE, UPDATE_PROFILE, SYNC_PREFERENCES
  -> Auto-processes queue when online status changes
  -> Max 3 retries per action, then drops
  -> Priority levels: high, medium, low
```

---

## Realtime System

### Supabase Realtime Channels
- **Alerts Channel:** `postgres_changes` on `alerts` table filtered by `user_id`
- **Chat Channel:** `postgres_changes` on `chat_messages` filtered by `group_id` + `broadcast` for typing indicators
- **Activity Channel:** `postgres_changes` on `community_activities`

### SOS Emergency System
- Trigger SOS -> notify emergency contacts (SMS + email via edge function)
- Real-time location sharing
- Check-in system with 3+ missed check-in escalation
- Medical info sharing (blood type, allergies, medications)

---

## Internationalization

- **Library:** i18next + react-i18next
- **Languages:** English, French, Spanish, German, Italian, Portuguese (6 languages)
- **242+ translation keys** across auth, account, community, trips, search, sections
- **Onboarding:** 97 countries, 33 languages to choose from
- Language preference persisted to AsyncStorage

---

## Project Structure

```
guidera/
  src/
    app/                        # Expo Router pages (file-based routing)
      (auth)/                   # Auth screens (landing, sign-in, signup, OTP, forgot-password)
      (onboarding)/             # 13-step onboarding flow
      (tabs)/                   # 5 tabs + hidden tabs
      account/                  # 25+ account/settings screens
      booking/                  # Booking entry points (flights, hotels, cars, activities)
      deals/                    # Deal pages (view-all, [id], saved)
      destinations/             # Destination detail
      events/                   # Event pages
      local-experiences/        # Experience pages
      trip/                     # Trip management
      search/                   # Search results, snapshot
      ai-vision/                # AI Vision entry
      navigation/               # Map navigation
      community/                # Community routes
      safety/                   # Safety screens
      ...

    features/                   # Feature modules (8)
      account/                  # Account screens, config, components
      ar-navigation/            # AR system (5 plugins, services, hooks)
      booking/                  # Booking flows (flight, hotel, car, experience, package)
      community/                # Community (screens, services, components, config)
      homepage/                 # Homepage (provider, hooks, service)
      navigation/               # Map navigation (MapScreen, voice, outdoor map)
      trip-import/              # Trip import (camera, email, manual steps)
      trips/                    # Trips (screens, stores, plugins, components)

    components/                 # Reusable components
      ds/                       # Design system primitives (9 components)
      common/                   # Shared UI (buttons, error boundaries, feedback, filters)
      features/                 # Feature-specific (home cards, AI chat, AR scan, notifications)
      organisms/                # Complex composed components
      molecules/                # Toast system
      templates/                # Page templates (DetailPageTemplate)

    services/                   # Business logic layer (35+ services)
      ai-engine/                # AI generation, context builder, cache
      analytics/                # Mixpanel analytics
      cache/                    # Two-tier cache service
      community/                # 7 community services
      deal/                     # Deal, affiliate, price alert services
      deeplink/                 # Deep link handling
      health/                   # Health check service
      logging/                  # Structured logger
      notifications/            # Push notification + community notifications
      offline/                  # Offline sync queue
      performance/              # Performance monitoring
      providers/                # Booking provider adapters
      realtime/                 # Supabase Realtime channels + SOS
      safety/                   # Safety intelligence APIs
      search/                   # Search engine (query processor, result processor)
      sentry/                   # Sentry error tracking
      trip/                     # Trip services (core, collaboration, lifecycle, import)
      updates/                  # OTA update service
      [domain].service.ts       # Individual services (expense, flight, hotel, car, etc.)

    hooks/                      # 36 custom React hooks
    context/                    # React contexts (Auth, Theme, Location, Offline)
    store/                      # Zustand store index
    stores/                     # Domain stores (onboarding)
    styles/                     # Design system (colors, typography, spacing, shadows, theme)
    types/                      # TypeScript type definitions
    config/                     # App configuration (API, sections, Google Maps)
    lib/                        # Core libraries (Supabase client, Clerk sync, i18n)
    locales/                    # Translation files (en, fr, es, de, it, pt)
    i18n/                       # i18n configuration
    utils/                      # Utility functions
    data/                       # Static data (categories)

  supabase/
    functions/                  # 44 Edge Functions
      _shared/                  # Auth, CORS, rate limiter, provider adapters
      [function-name]/          # Individual functions
    migrations/                 # Database migrations

  assets/                       # Images, fonts, animations, videos
  __tests__/                    # Test suites (unit, integration)
  docs/                         # Documentation
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase CLI: `npm install -g supabase`
- iOS: Xcode 15+ (for iOS development)
- Android: Android Studio (for Android development)

### Installation

```bash
git clone <repo-url>
cd guidera
npm install
cp .env.example .env
# Fill in API keys in .env
```

### Environment Variables

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key

# Google Maps (also set in app.json)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Mapbox
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Optional
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
EXPO_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
```

### Server-Side Secrets (Supabase Dashboard)

Set via `npx supabase secrets set KEY=value`:

```
ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY, XAI_API_KEY, OPENAI_API_KEY,
ELEVENLABS_API_KEY, AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET,
RAPIDAPI_KEY, SERPAPI_KEY, VIATOR_API_KEY, BRAVE_SEARCH_API_KEY,
TOMORROW_IO_API_KEY, CURRENCYLAYER_API_KEY, RESEND_API_KEY,
DIDIT_API_KEY, DIDIT_WORKFLOW_ID, DIDIT_WEBHOOK_SECRET,
TIKAPI_API_KEY, AERODATABOX_API_KEY, TRAXO_CLIENT_ID,
TRAXO_CLIENT_SECRET, AWARDWALLET_API_KEY, EXPEDIA_API_KEY,
EXPEDIA_SECRET, MAPBOX_PUBLIC_TOKEN, SUPABASE_SERVICE_ROLE_KEY
```

### Running the App

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS Simulator
npm run android    # Run on Android Emulator
```

### Deploying Edge Functions

```bash
supabase functions deploy --project-ref pkydmdygctojtfzbqcud
```

---

## Development

### Code Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `FlightCard.tsx` |
| Screens | PascalCase | `TripDetailScreen.tsx` |
| Hooks | camelCase with `use` prefix | `useFlightSearch.ts` |
| Services | camelCase with `.service.ts` | `expense.service.ts` |
| Types | camelCase with `.types.ts` | `trip.types.ts` |
| Stores | camelCase with `use` prefix | `useTripStore.ts` |
| Styles | Component name + `.styles.ts` | `ChatScreen.styles.ts` |

### Build Profiles (EAS)

| Profile | Purpose | Distribution |
|---------|---------|-------------|
| `development` | Dev client with debugging | Internal |
| `preview` | Testing builds | Internal |
| `production` | App Store / Play Store | Store |

### Key Config Files
- `app.json` -- Expo config (bundle ID: `one.guidera.app`, scheme: `guidera://`)
- `eas.json` -- EAS Build profiles
- `tsconfig.json` -- TypeScript strict mode, `@/*` path alias
- `babel.config.js` -- `babel-preset-expo` + `module-resolver` (@->./src) + `reanimated/plugin`
- `metro.config.js` -- Default Expo Metro config

---

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
npm run test:ci       # CI mode
```

### Test Structure
```
__tests__/
  unit/
    services/         # rewards.service, saved.service
    components/       # SaveButton
  integration/
```

**Current coverage:** 56 tests across 4 test suites (rewards, saved, trip utils, SaveButton).

---

## App Identity

| Field | Value |
|-------|-------|
| App Name | Guidera |
| Bundle ID | `one.guidera.app` |
| URL Scheme | `guidera://` |
| Version | 0.2.0 |
| EAS Project ID | `8f23bea3-b284-4d6c-996a-755f9979ac13` |
| Owner | cyrizeh |
| Platforms | iOS, Android |
| Min SDK | Expo SDK 54, React Native 0.81.5 |
| New Architecture | Enabled |

---

<p align="center">
  <strong>Guidera</strong> -- AI-Powered Travel Companion<br/>
  Made with care by the Guidera Team
</p>
