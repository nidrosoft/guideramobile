# VIE 2.0 & PipeCat Analysis

## 1. PipeCat Overview

PipeCat is an **open-source Python server-side framework** for voice/multimodal AI pipelines. It orchestrates STT → LLM → TTS in a frame-based pipeline with 60+ AI service integrations.

**Key facts:**
- Requires a persistent Python server (Pipecat Cloud, AWS, etc.)
- Supports Gemini Live via `GeminiMultimodalLiveLLMService`
- Has React Native client SDK
- Architecture: `Mobile ←WebRTC→ PipeCat Server ←WebSocket→ Gemini Live`

## 2. PipeCat vs Direct Gemini Live (Verdict: NOT recommended)

| Factor | Direct Gemini Live (Current) | PipeCat |
|---|---|---|
| Architecture | Client → Gemini direct | Client → Server → Gemini |
| Latency | Lower (1 hop) | Higher (2 hops) |
| Server cost | $0 on device | $$$ per concurrent session |
| Camera frames | Direct to Gemini | Extra hop through server |
| Native audio | Gemini handles natively | Must route through server |
| Tool calling | Direct on device | Server-side (advantage for complex tools) |
| Provider swap | Locked to Gemini | Can swap STT/LLM/TTS providers |
| Complexity | Simple WebSocket | Full server deployment + ops |

**Recommendation: Stay with direct Gemini Live API.** PipeCat adds server cost and latency with no compelling benefit for your use case. Your VIE 2.0 architecture already handles tool calling on-device → Edge Functions, which is cleaner.

PipeCat would only matter if you needed: phone/telephony bots, provider-agnostic switching, or server-side audio processing. None of these apply to Guidera.

## 3. API Keys Audit

### Currently Set in `.env` (client-side):
- ✅ `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — Set
- ✅ `SUPABASE_URL` / `SUPABASE_ANON_KEY` — Set
- ✅ `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — Set
- ✅ `EXPO_PUBLIC_MAPBOX_TOKEN` — Set
- ❌ `OPENAI_API_KEY` — Empty
- ❌ `AMADEUS_API_KEY` / `AMADEUS_API_SECRET` — Empty
- ❌ `BOOKING_API_KEY` — Empty
- ❌ `GETYOURGUIDE_API_KEY` — Empty

### Missing from `.env` (in `.env.example` but not `.env`):
- `RAPIDAPI_KEY`, `SERPAPI_KEY`, `VIATOR_API_KEY`
- `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_MIXPANEL_TOKEN`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`

### Edge Function Secrets (Deno.env.get references across all functions):

**AI/LLM Keys:**
- `GOOGLE_AI_API_KEY` — Used by 15+ functions (event-discovery, ai-vision, gemini-live-token, trip-snapshot, etc.)
- `ANTHROPIC_API_KEY` — Used by scan-ticket, generate-compensation, ai-generation, scan-receipt, etc.
- `OPENAI_API_KEY` — Used by chat-assistant, tts
- `XAI_API_KEY` — Used by trip-snapshot (Grok fallback)

**Travel APIs:**
- `SERPAPI_KEY` — Flight/hotel search, explore
- `RAPIDAPI_KEY` — Kiwi flights, Booking.com, cars
- `AMADEUS_CLIENT_ID` / `AMADEUS_CLIENT_SECRET` — Flight search
- `VIATOR_API_KEY` — Experiences
- `AERODATABOX_API_KEY` — Flight tracking
- `TOMORROW_IO_API_KEY` — Weather
- `CURRENCYLAYER_API_KEY` — Currency conversion

**Google APIs:**
- `GOOGLE_PLACES_API_KEY` — Places search
- `GOOGLE_CLOUD_API_KEY` — Translation, vision
- `GOOGLE_MAPS_API_KEY` — Directions

**Other:**
- `RESEND_API_KEY` — Email
- `DIDIT_API_KEY` / `DIDIT_WORKFLOW_ID` / `DIDIT_WEBHOOK_SECRET` — Identity verification
- `TRAXO_CLIENT_ID` / `TRAXO_CLIENT_SECRET` — Trip import
- `MAPBOX_PUBLIC_TOKEN` — Directions
- `BRAVE_SEARCH_API_KEY` — Web search
- `INCEPTION_API_KEY` — Unknown usage
- `AWARDWALLET_API_KEY` — Loyalty tracking
- `EXPEDIA_API_KEY` / `EXPEDIA_SECRET` — Hotel search
- `TIKAPI_API_KEY` — Social media

**Note:** Supabase Vault is EMPTY — all secrets are stored as Edge Function environment variables (set via Dashboard or CLI). This is fine but means no programmatic secret rotation.

## 4. VIE 2.0 Gap Analysis

### What Already Exists (Implemented):
- ✅ Gemini Live WebSocket session (`useGeminiLive.ts`)
- ✅ Camera frame streaming to Gemini
- ✅ Audio recording/playback pipeline
- ✅ LiveCameraMode UI with mode tabs (Live/Translate/Menu/Order)
- ✅ `gemini-live-token` edge function (ephemeral token generation)
- ✅ `ai-vision` edge function
- ✅ `flight-tracking` edge function (AeroDataBox)
- ✅ `currency` edge function
- ✅ `weather` edge function
- ✅ `safety-alerts` edge function
- ✅ `scan-receipt` edge function (Claude Vision OCR)
- ✅ `generate-compensation` edge function
- ✅ `places` edge function (Google Places)
- ✅ `translation` edge function
- ✅ `tts` edge function
- ✅ `chat-assistant` with tool definitions
- ✅ `scheduled-jobs` edge function (cron runner)
- ✅ Trip system with bookings, activities, destinations

### What VIE 2.0 Needs That's NOT Built Yet:

**Critical (Concierge Foundation):**
1. `ConciergeSessionManager` class — Replaces raw `useGeminiLive` hook with proper session lifecycle, reconnection, inactivity timeout
2. `ToolRegistry` — Mode-aware tool catalog that maps tool calls → Edge Functions
3. `SystemPromptBuilder` — Dynamic prompt assembly from user DNA, trip context, location, memories, mode instructions
4. Tool calling integration in Gemini Live session — Current hook doesn't handle `toolCall` messages from Gemini

**New Domain Edge Functions:**
5. `vie-trip-intelligence` — Unified trip domain (flight status, schedule, conflicts, travel time)
6. `vie-safety-location` — Area safety, cultural briefing, emergency info, geofence context
7. `vie-financial` — Receipt processing, currency, budget tracking, price fairness
8. `vie-communication` — Compensation claims, check-in reminders, visa deadlines
9. `vie-event-processor` — Event Bus consumer that routes events → notifications

**New Database Tables:**
10. `vie_flight_watches` — Flight monitoring state
11. `vie_memories` — Persistent user preferences from conversations
12. `vie_compensation_claims` — Claim lifecycle tracking
13. `vie_sessions` — Session analytics
14. `vie_events` — Event Bus queue table

**New Cron Jobs:**
15. Flight status checks (every 30 min)
16. Check-in reminders (hourly)
17. Event processor (every minute)
18. Visa deadline checker (daily)
19. Cleanup jobs (daily)

**Device-Side:**
20. Geofence manager (expo-location, 20-region rotation)
21. Push notification handler for VIE events
22. Mode-specific UI enhancements (Safety, Document, Packing tabs)
23. Tool call indicator overlay on camera

**Missing API Keys for VIE 2.0:**
- `RISKLINE_API_KEY` — Area safety data (referenced in architecture but no existing function)
- No existing `AERODATABOX_API_KEY` verification needed — already used in `flight-tracking`

## 5. Recommendations

### Priority 1: Concierge Foundation (Week 1-2)
Build the three core client-side classes: `ConciergeSessionManager`, `ToolRegistry`, `SystemPromptBuilder`. Wire tool calling into the Gemini Live WebSocket flow. Start with 5 tools that map to existing edge functions (places, currency, flight-tracking, weather, translation).

### Priority 2: Consolidate Domain Functions (Week 3-4)
Create the 4 VIE domain edge functions. Many capabilities already exist as separate functions — consolidate them under the domain pattern with handler routing.

### Priority 3: Event Bus + Background Monitoring (Week 5-6)
Add `vie_events` table, event processor, cron jobs for flight monitoring and reminders. This is the "server-side intelligence" layer.

### Priority 4: Memory + Safety + Polish (Week 7-8)
`vie_memories` table, geofencing, safety mode, document scanner mode.

### Skip PipeCat entirely.
Your direct Gemini Live integration is the correct architecture. PipeCat adds infrastructure overhead with no benefit for a mobile-first app that already talks to Gemini directly.
