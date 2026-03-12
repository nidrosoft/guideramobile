# GUIDERA AI ORCHESTRATION MASTER GUIDE
> **This is the single source of truth for how all AI prompts work together.**
> Read this before touching any other AI file. Give this to Cursor first.

---

## WHAT THIS FILE IS

You have 11 AI system prompt files. Each one is a specialist — brilliant at its job but unaware of the others. This document is the **conductor**. It tells you:

- What each prompt does and exactly when it fires
- What data must be assembled before calling it
- What runs in parallel vs. what runs in sequence
- How output from one prompt feeds into the next
- How to implement this in Supabase Edge Functions
- What to build first, second, and third

**The 11 Prompt Files (your complete AI system):**

| # | File | Role | Fires When |
|---|---|---|---|
| 1 | `guidera_general_prompt.md` | Global AI Chat | User opens Chat tab, anywhere in app |
| 2 | `guidera_contextual_prompt.md` | Destination AI | User opens a Destination Detail Page |
| 3 | `guidera_trip_companion_prompt.md` | Trip Hub Chat | User chats inside an active trip |
| 4 | `guidera_gen_itinerary.md` | Itinerary Generator | Trip creation → generate day-by-day plan |
| 5 | `guidera_gen_packing.md` | Packing List Generator | Trip creation → generate packing list |
| 6 | `guidera_gen_dos_donts.md` | Do's & Don'ts Generator | Trip creation → generate cultural guide |
| 7 | `guidera_gen_safety.md` | Safety Intelligence Generator | Trip creation → generate safety profile |
| 8 | `guidera_gen_language.md` | Language Kit Generator | Trip creation → generate phrase guide |
| 9 | `guidera_gen_documents.md` | Documents Intelligence Generator | Trip creation → generate document checklist |
| 10 | `guidera_gen_compensation.md` | Compensation Claim Analyzer | Flight disruption detected → analyze claim |
| 11 | `guidera_gen_expense_tracker.md` | Receipt Parser + Trip Summary | Receipt scanned OR trip ends |

---

## THE MENTAL MODEL: THREE LAYERS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   LAYER 1 — CHAT PROMPTS (always-on, conversational)                        │
│   ─────────────────────────────────────────────────                          │
│   Prompts 1, 2, 3                                                            │
│   Live in memory as long as the user is on that screen.                      │
│   Fire on every user message. Stream responses back.                         │
│   Each has its own system prompt — never mix them.                           │
│                                                                              │
│   LAYER 2 — GENERATION PROMPTS (one-shot, async)                            │
│   ────────────────────────────────────────────────                           │
│   Prompts 4, 5, 6, 7, 8, 9                                                  │
│   Fire ONCE when a trip is created. Run in parallel.                         │
│   Each produces structured JSON stored in the database.                      │
│   The app reads from the database — it never calls these prompts again       │
│   unless the user manually requests a refresh.                               │
│                                                                              │
│   LAYER 3 — REACTIVE PROMPTS (event-triggered, async)                       │
│   ────────────────────────────────────────────────────                       │
│   Prompts 10, 11                                                             │
│   Fire when a specific event occurs (disruption / receipt / trip end).       │
│   Not tied to trip creation. Dormant until triggered.                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## LAYER 1 — CHAT PROMPTS

### How chat works in Guidera

All three chat prompts follow the same pattern. The difference is **which screen the user is on** and **how much context is injected**.

```typescript
// The universal chat handler — one function, three prompt files
async function handleChatMessage(
  userMessage: string,
  screen: 'global' | 'destination' | 'trip_hub',
  context: ChatContext
): Promise<StreamingResponse> {

  const systemPrompt = selectSystemPrompt(screen, context)
  
  return anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    temperature: 0.5,
    system: systemPrompt,           // One of the three chat prompts
    messages: context.conversationHistory  // Full conversation history
  })
}
```

### Prompt 1 — General Travel AI (`guidera_general_prompt.md`)

**Fires when:** User opens the global Chat tab (bottom nav). Not inside a trip. Not on a destination page.

**Screen:** `ChatTab.tsx` (global)

**Context injected:**
```typescript
const globalChatContext = `
USER: ${user.firstName}, ${user.nationality}, ${user.profession || 'traveler'}
TRAVEL PREFERENCES: ${formatPreferences(user.preferences)}
LOCATION: ${userCurrentLocation || 'unknown'}
DATE: ${today}
`
// This is lightweight — no trip, no destination. Pure conversational AI.
```

**What it knows:** User profile + their travel history + current location (if granted). Nothing trip-specific.

**What it does NOT know:** Any active trip details. Any destination specifics. Use prompt 3 inside a trip.

---

### Prompt 2 — Contextual Destination AI (`guidera_contextual_prompt.md`)

**Fires when:** User opens a Destination Detail Page — e.g., taps on "Tokyo" in Explore or Search.

**Screen:** `DestinationDetailPage.tsx`

**Context injected (8 runtime variables):**
```typescript
const destinationContext = `
DESTINATION: ${destination.name} (${destination.country})
USER_NATIONALITY: ${user.nationality}
USER_TRAVEL_STYLE: ${user.travelStyle}
CURRENT_SEASON: ${getCurrentSeason(destination.hemisphere)}
DESTINATION_CURRENCY: ${destination.currency}
LANGUAGES: ${destination.languages.join(', ')}
SAFETY_LEVEL: ${destination.safetyScore}/100
LOCAL_DATE: ${getLocalDate(destination.timezone)}
`
```

**What it knows:** Everything about the destination + basic user profile. Anchored to that destination — it redirects off-topic questions.

**Switching behavior:** When user leaves the Destination page, this prompt is released. When they enter a trip using that destination, prompt 3 takes over.

---

### Prompt 3 — Trip Companion Chat (`guidera_trip_companion_prompt.md`)

**Fires when:** User opens the Chat interface inside any active trip (Trip Hub).

**Screen:** `TripHubChat.tsx`

**Context injected (38 runtime variables — the heaviest context in the system):**
```typescript
// Build the full trip context object before every session
const tripCompanionContext = buildTripCompanionContext({
  // Trip fundamentals
  trip,
  destinations,
  travelers,
  
  // All bookings
  flights,
  hotels,
  cars,
  activities,
  
  // Generated module data (from Layer 2)
  itinerary,      // Already generated at trip creation
  packingList,    // Already generated at trip creation
  dosAndDonts,    // Already generated at trip creation
  safetyProfile,  // Already generated at trip creation
  languageKit,    // Already generated at trip creation
  documents,      // Already generated at trip creation
  
  // Live data
  currentExpenses,
  activeClaims,
  
  // Temporal context
  currentDate,
  daysUntilDeparture,
  tripPhase    // 'pre_departure' | 'in_trip' | 'post_trip'
})
```

**Critical:** This prompt is the most context-rich because the AI needs to know everything about the trip to answer questions like "Which day should I do the temple?" or "Did I pack my adapter?" It reads from the already-generated module data — it does NOT regenerate them.

**Prompt caching:** Because the system prompt is very long (38 variables), use Anthropic's prompt caching. The system prompt is cached; only the conversation messages are not. This reduces cost by ~85%.

```typescript
// Use prompt caching for the trip companion
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1200,
  system: [
    {
      type: 'text',
      text: tripCompanionSystemPrompt,
      cache_control: { type: 'ephemeral' }  // Cache this — it's long
    }
  ],
  messages: conversationHistory
})
```

---

## LAYER 2 — GENERATION PROMPTS

### The generation pipeline — how trip creation works

When a user creates a trip (imports bookings OR manually enters trip details), six generation prompts fire in parallel. This is the most important sequence in the entire system.

```
USER CREATES TRIP
      │
      ▼
┌─────────────────────────────────────────┐
│  STEP 1: Build the TripGenerationContext │
│  (Assemble all data — ~500ms)            │
│                                          │
│  • Fetch user full profile               │
│  • Fetch all trip bookings               │
│  • Fetch destination intelligence        │
│  • Fetch weather forecast                │
│  • Fetch safety advisories               │
│  • Fetch visa/entry requirements         │
│  • Calculate route distances             │
│  • Fetch current exchange rates          │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Fire all 6 generation prompts IN PARALLEL                           │
│  (Each is an independent Edge Function call — ~8-15 seconds each)           │
│                                                                              │
│  Promise.all([                                                               │
│    generateItinerary(context),      → stores in trip_itineraries table      │
│    generatePackingList(context),    → stores in packing_lists table         │
│    generateDosAndDonts(context),    → stores in dos_and_donts table         │
│    generateSafetyProfile(context),  → stores in safety_profiles table       │
│    generateLanguageKit(context),    → stores in language_kits table         │
│    generateDocuments(context),      → stores in document_checklists table   │
│  ])                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│  STEP 3: Pre-calculate compensation     │
│  rights cards (synchronous — fast)      │
│  No AI needed — pure logic              │
│  Stores in compensation_rights_cards    │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│  STEP 4: Initialize reactive modules    │
│  (No AI — database records only)        │
│                                         │
│  • Create expense_tracker record        │
│  • Create compensation_tracker record   │
│  • Create journal record                │
│  • Set all modules to 'ready' status    │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│  TRIP HUB IS READY                      │
│  User sees all 8 modules populated      │
└─────────────────────────────────────────┘
```

**Total time from trip creation to ready: ~15-20 seconds.**
Show a loading screen with module-by-module progress indicators. Each module updates its `status` column as it completes — the UI polls this and shows green checkmarks as they appear.

---

### Building the TripGenerationContext

This is the single most important function in the entire AI system. Every generation prompt receives the same context object. Build it once, share it with all six prompts.

```typescript
// supabase/functions/generate-trip/context-builder.ts

export async function buildTripGenerationContext(
  tripId: string
): Promise<TripGenerationContext> {

  // All fetches run in parallel for speed
  const [
    trip,
    travelers,
    bookings,
    userProfile,
    destinationIntelligence,
    weatherForecast,
    safetyData,
    regulations,
    exchangeRates,
  ] = await Promise.all([
    TripRepository.findById(tripId),
    TravelerRepository.findByTripId(tripId),
    BookingRepository.findByTripId(tripId),
    UserRepository.getFullProfile(trip.owner_id),
    DestinationService.getIntelligence(trip.primary_destination_code),
    WeatherService.getForecast(trip.primary_destination_code, trip.start_date, trip.end_date),
    SafetyService.getData(trip.primary_destination_code),
    RegulationService.getEntryRequirements(trip.primary_destination_code, travelers),
    CurrencyService.getExchangeRates(trip.budget_currency),
  ])

  return {
    travelers,
    primaryTraveler: travelers.find(t => t.isOwner),
    travelerCount: travelers.length,
    trip: buildTripContext(trip),
    bookings: buildBookingsContext(bookings),
    destination: destinationIntelligence,
    realtime: {
      weather: weatherForecast,
      safety: safetyData,
      regulations,
      financial: buildFinancialContext(exchangeRates, destinationIntelligence),
    },
    generation: {
      requestedModules: ['itinerary', 'packing', 'dos_donts', 'safety', 'language', 'documents'],
      generatedAt: new Date().toISOString(),
      contextVersion: '1.0',
    }
  }
}
```

---

### Serializing context into prompt variables

Each generation prompt has its own set of runtime variables (e.g., `{{TRAVELER_NAME}}`, `{{DESTINATION}}`). These are just template variables in the prompt text — replace them with real values before sending.

```typescript
// Generic variable injection — works for all 6 generation prompts
function injectVariables(
  promptTemplate: string,
  context: TripGenerationContext
): string {
  
  const variables = buildVariableMap(context)
  
  return promptTemplate.replace(
    /\{\{(\w+)\}\}/g,
    (match, key) => variables[key] ?? match
  )
}

function buildVariableMap(ctx: TripGenerationContext): Record<string, string> {
  const p = ctx.primaryTraveler

  return {
    // Traveler basics
    TRAVELER_NAME: p.firstName,
    TRAVELER_NATIONALITY: p.demographics.nationality,
    TRAVELER_GENDER: p.demographics.gender,
    TRAVELER_AGE: String(p.demographics.age),
    TRAVELER_PROFESSION: p.professional.profession ?? 'Not specified',
    TRAVELER_RELIGION: p.cultural.religion ?? 'Not specified',
    TRAVEL_STYLE: p.preferences.travelStyle,
    DIETARY_RESTRICTIONS: p.health.dietaryRestrictions.join(', ') || 'None',
    MEDICAL_CONDITIONS: formatMedicalConditions(p.health.medicalConditions),
    
    // Trip
    TRIP_NAME: ctx.trip.name,
    DESTINATION: ctx.destination.basic.name,
    DESTINATION_COUNTRY: ctx.destination.basic.country,
    TRIP_START_DATE: ctx.trip.startDate,
    TRIP_END_DATE: ctx.trip.endDate,
    TRIP_DURATION_DAYS: String(ctx.trip.durationDays),
    TRIP_PURPOSE: ctx.trip.purpose,
    BUDGET_TIER: ctx.trip.budgetTier,
    BUDGET_TOTAL: String(ctx.trip.budgetTotal),
    BUDGET_CURRENCY: ctx.trip.budgetCurrency,
    TRAVELER_COUNT: String(ctx.travelerCount),
    GROUP_COMPOSITION: ctx.trip.composition,
    
    // Destination
    DESTINATION_LANGUAGE: ctx.destination.language.officialLanguages.join(', '),
    DESTINATION_CURRENCY: ctx.destination.practical.money.currency,
    DESTINATION_TIMEZONE: ctx.destination.basic.timezone,
    SAFETY_LEVEL: String(ctx.destination.safety.overallScore),
    PLUG_TYPES: ctx.destination.practical.electricity.plugTypes.join(', '),
    VOLTAGE: String(ctx.destination.practical.electricity.voltage),
    TAP_WATER_SAFE: ctx.destination.practical.water.tapWaterSafe ? 'Yes' : 'No',
    VPN_NEEDED: ctx.destination.practical.internet.vpnNeeded ? 'Yes' : 'No',
    
    // Weather
    WEATHER_SUMMARY: ctx.realtime.weather.summary.overallCondition,
    WEATHER_TEMP_MIN: String(ctx.realtime.weather.summary.temperatureRange.min),
    WEATHER_TEMP_MAX: String(ctx.realtime.weather.summary.temperatureRange.max),
    RAIN_DAYS: String(ctx.realtime.weather.summary.rainDays),
    
    // Flights
    HAS_FLIGHTS: ctx.bookings.hasFlights ? 'Yes' : 'No',
    AIRLINES: ctx.bookings.airlines.join(', '),
    ARRIVAL_TIME: ctx.bookings.arrivalTime,
    DEPARTURE_TIME: ctx.bookings.departureTime,
    HAS_RED_EYE: ctx.bookings.hasRedEyeFlight ? 'Yes' : 'No',
    HAS_LONG_LAYOVER: ctx.bookings.hasLongLayover ? 'Yes' : 'No',
    LAYOVER_LOCATIONS: ctx.bookings.layoverLocations.join(', ') || 'None',
    
    // Regulations
    PASSPORT_COUNTRY: p.documents.passport.passportCountry,
    PASSPORT_EXPIRY: p.documents.passport.expirationDate ?? 'Unknown',
    VISA_REQUIRED: ctx.realtime.regulations.visaRequired ? 'Yes' : 'No',
    VISA_TYPE: ctx.realtime.regulations.visaType ?? 'Not required',
    VACCINATIONS_REQUIRED: ctx.realtime.regulations.vaccinationsRequired.join(', ') || 'None',
    
    // Financial
    EXCHANGE_RATE: String(ctx.realtime.financial.exchangeRate),
    TIPPING_CUSTOMARY: ctx.destination.practical.money.tipping.customary ? 'Yes' : 'No',
    RESTAURANT_TIP: ctx.destination.practical.money.tipping.restaurantTip,
    
    // Multi-city
    IS_MULTI_CITY: ctx.trip.isMultiCity ? 'Yes' : 'No',
    ADDITIONAL_DESTINATIONS: ctx.trip.additionalDestinations.map(d => d.name).join(', ') || 'None',
  }
}
```

---

### The six generation Edge Functions

Each generation module lives in its own Supabase Edge Function. They all follow the same structure:

```typescript
// supabase/functions/generate-[module]/index.ts
// Replace [module] with: itinerary, packing, dos-donts, safety, language, documents

import { serve } from 'https://deno.land/std/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

serve(async (req) => {
  const { tripId, context } = await req.json()
  
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )
  
  // Mark module as generating
  await supabase.from('trip_modules')
    .update({ status: 'generating' })
    .eq('trip_id', tripId)
    .eq('module_type', MODULE_TYPE)  // e.g., 'packing_list'
  
  try {
    // Load the system prompt for this module
    // (In practice: import as a string constant from a separate .ts file)
    const systemPrompt = injectVariables(MODULE_SYSTEM_PROMPT, context)
    
    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,   // Generation prompts need more tokens than chat
      temperature: 0.5,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate now.' }]
    })
    
    // Parse the JSON output
    const raw = response.content[0].text
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    
    // Store in database
    await storeModuleOutput(supabase, tripId, MODULE_TYPE, parsed)
    
    // Mark module as ready
    await supabase.from('trip_modules')
      .update({ status: 'ready', generated_at: new Date() })
      .eq('trip_id', tripId)
      .eq('module_type', MODULE_TYPE)
    
    return new Response(JSON.stringify({ success: true }), { status: 200 })
    
  } catch (error) {
    // Mark module as failed — app shows retry button
    await supabase.from('trip_modules')
      .update({ status: 'failed', error_message: error.message })
      .eq('trip_id', tripId)
      .eq('module_type', MODULE_TYPE)
    
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
```

**The orchestrator that calls all six:**

```typescript
// supabase/functions/generate-trip/index.ts
// This is the single entry point called when a trip is created

serve(async (req) => {
  const { tripId } = await req.json()
  
  // Step 1: Build the shared context
  const context = await buildTripGenerationContext(tripId)
  
  // Step 2: Fire all 6 generation functions in parallel
  // (These are internal supabase function calls, not HTTP)
  await Promise.allSettled([
    invokeEdgeFunction('generate-itinerary', { tripId, context }),
    invokeEdgeFunction('generate-packing', { tripId, context }),
    invokeEdgeFunction('generate-dos-donts', { tripId, context }),
    invokeEdgeFunction('generate-safety', { tripId, context }),
    invokeEdgeFunction('generate-language', { tripId, context }),
    invokeEdgeFunction('generate-documents', { tripId, context }),
  ])
  
  // Step 3: Pre-calculate compensation rights cards (no AI — synchronous)
  await CompensationService.preCalculateRightsCards(tripId, context)
  
  // Step 4: Initialize reactive module records
  await ExpenseTrackerService.initializeTracker(tripId)
  await CompensationTrackerService.initializeTracker(tripId)
  
  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
```

**Using `Promise.allSettled` (not `Promise.all`) is intentional.** If packing list generation fails, the other five modules should still complete. Each module fails independently — the user sees a retry button on the failed module only.

---

### Module generation — prompt file → database table mapping

| Prompt File | Edge Function | Stores Output In | Key Column |
|---|---|---|---|
| `guidera_gen_itinerary.md` | `generate-itinerary` | `trip_itineraries` | `itinerary_data JSONB` |
| `guidera_gen_packing.md` | `generate-packing` | `packing_lists` | `items JSONB` |
| `guidera_gen_dos_donts.md` | `generate-dos-donts` | `dos_and_donts` | `items JSONB` |
| `guidera_gen_safety.md` | `generate-safety` | `safety_profiles` | `profile_data JSONB` |
| `guidera_gen_language.md` | `generate-language` | `language_kits` | `phrases JSONB` |
| `guidera_gen_documents.md` | `generate-documents` | `document_checklists` | `items JSONB` |

The app **never calls these prompts directly**. It reads from the database tables. The prompts only fire during generation.

---

## LAYER 3 — REACTIVE PROMPTS

These two prompts are different from everything else — they're not called on a schedule and not called at trip creation. They fire when something happens.

---

### Prompt 10 — Compensation Claim Analyzer (`guidera_gen_compensation.md`)

**Fires when:** The flight monitoring cron job detects a delay ≥ 180 minutes or a cancellation.

**Who triggers it:** `supabase/functions/monitor-flights` (scheduled cron, runs every 30 minutes).

**Data flow:**

```
Flight Status API detects disruption
        │
        ▼
compensation_claims record created (status: 'analyzing')
        │
        ▼
Push notification sent to user IMMEDIATELY
(Don't wait for AI — user needs to know now)
        │
        ▼ (async, ~10-15 seconds)
Compensation Claim Analyzer prompt fires
        │
        ▼
AI analysis stored in compensation_claims.ai_analysis JSONB
claim_status updated to 'ready_to_file' or 'not_eligible'
        │
        ▼
Second push notification (optional):
"Your claim analysis is ready — you may be owed €400"
```

**Context injected (pulled fresh at analysis time):**
```typescript
const compensationContext = {
  flightDetails: rightsCard,           // Pre-calculated at trip creation
  disruption: flightStatusEvent,       // From the monitoring cron
  userProfile: { name, nationality },  // Minimal — only what claim letter needs
  airlineHistory: airlineDatabase,     // Guidera's internal compliance data
}
```

**Does NOT depend on any other prompt's output.** Completely self-contained.

---

### Prompt 11 — Expense AI (`guidera_gen_expense_tracker.md`)

This file contains TWO separate prompts, not one:

**Prompt 11a — Receipt Scanner**

**Fires when:** User taps "Scan Receipt" and submits a photo.

**Trigger:** User action in `ExpenseEntryScreen.tsx` → image → `supabase/functions/parse-receipt`.

**Data flow:**
```
User photographs receipt
        │
        ▼
Image converted to base64
        │
        ▼
parse-receipt Edge Function fires
        │
        ▼
Claude Vision parses → returns pre-filled form data JSON
        │
        ▼
Form in app pre-populates with extracted data
        │
        ▼
User reviews, edits if needed, taps "Save"
        │
        ▼
Expense saved to expenses table (receipt image saved too)
```

**Context injected:** Destination currency + today's date + trip day number.

**Prompt 11b — Post-Trip Summary Generator**

**Fires when:** User opens the Summary tab after trip ends. Or manually taps "Generate Summary."

**Trigger:** Lazy — fires on first Summary tab open after `trip.status === 'completed'`. Cached until new expenses added.

**Data flow:**
```
User opens Summary tab
        │
        ▼
Check: does cached summary exist AND no new expenses since generation?
  → Yes: show cached summary (no AI call)
  → No: fire generate-expense-summary Edge Function
        │
        ▼
All expenses aggregated from database
        │
        ▼
Post-Trip Summary prompt fires
        │
        ▼
Summary JSON stored in expense_trackers.summary_data JSONB
        │
        ▼
User sees narrative summary, charts, insights
```

---

## COMPLETE TRIGGER MAP

This is the definitive reference for when every AI call happens:

```
USER ACTION / EVENT                            PROMPT(S) FIRED
─────────────────────────────────────────────  ──────────────────────────────────
Opens Chat tab (global)                        Prompt 1 (on every message)
Opens Destination Detail Page                  Prompt 2 (on every message)
Opens Trip Hub chat inside trip                Prompt 3 (on every message)

Creates a new trip (imports or manual)         Prompts 4+5+6+7+8+9 (all at once)

Flight monitoring cron detects delay ≥ 3h     Prompt 10
Flight monitoring cron detects cancellation   Prompt 10

User scans a receipt                           Prompt 11a (Receipt Scanner)
User opens Summary tab after trip ends         Prompt 11b (Post-Trip Summary)
User taps "Refresh Summary"                    Prompt 11b (regenerate)
```

**Everything else in the app uses NO AI prompt:**
- Adding an expense manually → CRUD
- Toggling a packing list item → database update
- Viewing itinerary → read from database
- Viewing safety profile → read from database
- Currency conversion → CurrencyService
- Budget calculations → math
- Flight status display → FlightStatusService
- Push notifications for non-disruption events → rule-based

---

## PROMPT SELECTION LOGIC (for the app)

```typescript
// The single routing function every screen uses
function getSystemPrompt(
  screen: AppScreen,
  context: AppContext
): SystemPromptConfig {

  switch (screen) {
    
    // CHAT SCREENS
    case 'global_chat':
      return {
        promptFile: 'guidera_general_prompt',
        context: buildGlobalChatContext(context),
        streaming: true,
        temperature: 0.5,
        maxTokens: 1200
      }
    
    case 'destination_detail':
      return {
        promptFile: 'guidera_contextual_prompt',
        context: buildDestinationContext(context),
        streaming: true,
        temperature: 0.5,
        maxTokens: 1200
      }
    
    case 'trip_hub_chat':
      return {
        promptFile: 'guidera_trip_companion_prompt',
        context: buildTripCompanionContext(context),
        streaming: true,
        temperature: 0.5,
        maxTokens: 1200,
        cacheSystemPrompt: true    // Important — this prompt is large
      }
    
    // GENERATION (called by Edge Functions, not directly by app)
    case 'generate_itinerary':
      return {
        promptFile: 'guidera_gen_itinerary',
        context: buildTripGenerationContext(context),
        streaming: false,
        temperature: 0.5,
        maxTokens: 4000
      }
    
    // ... (same pattern for prompts 5-9)
    
    // REACTIVE
    case 'compensation_analysis':
      return {
        promptFile: 'guidera_gen_compensation',
        context: buildCompensationContext(context),
        streaming: false,
        temperature: 0.1,    // Precision — legal accuracy matters
        maxTokens: 2000
      }
    
    case 'receipt_scan':
      return {
        promptFile: 'guidera_gen_expense_tracker',   // Receipt scanner section
        context: buildReceiptContext(context),
        streaming: false,
        temperature: 0.1,    // Precision — extraction task
        maxTokens: 400
      }
    
    case 'expense_summary':
      return {
        promptFile: 'guidera_gen_expense_tracker',   // Summary section
        context: buildExpenseSummaryContext(context),
        streaming: false,
        temperature: 0.5,
        maxTokens: 800
      }
  }
}
```

---

## COST OPTIMIZATION

Run these two strategies from day one — they dramatically change the economics.

### 1. Prompt Caching (for Trip Companion Chat)

The trip companion system prompt is large — it contains 38 variables, all the trip data, all module summaries. Without caching, every chat message re-processes this entire system prompt.

With caching, the system prompt is processed once and stored for up to 5 minutes (Anthropic ephemeral cache). Cost reduction: **~85% on the system prompt tokens**.

```typescript
// Always cache the system prompt for trip companion chat
system: [
  {
    type: 'text',
    text: tripCompanionSystemPrompt,
    cache_control: { type: 'ephemeral' }
  }
]
```

### 2. Batch API (for the 6 generation prompts)

The 6 generation prompts at trip creation don't need to be real-time — the user expects to wait 15-20 seconds. Use the Anthropic Batch API for 50% cost reduction.

```typescript
// Instead of 6 individual messages.create() calls:
const batch = await anthropic.messages.batches.create({
  requests: [
    { custom_id: 'itinerary', params: itineraryRequest },
    { custom_id: 'packing',   params: packingRequest },
    { custom_id: 'dos_donts', params: dosDontsRequest },
    { custom_id: 'safety',    params: safetyRequest },
    { custom_id: 'language',  params: languageRequest },
    { custom_id: 'documents', params: documentsRequest },
  ]
})

// Poll for completion (or use webhook)
const results = await pollBatchUntilComplete(batch.id)
```

**Note:** Batch API processes within 24 hours but typically in minutes. If you need faster (the loading screen experience), use individual calls. Consider: offer "instant" (streaming, higher cost) and "background" (batch, lower cost, ready when they check back) options.

### 3. Caching generated module data

Once generated, never regenerate unless something changes. Store a `generated_at` timestamp on each module. Only regenerate when:
- User explicitly requests refresh
- A booking changes that would affect the module
- Trip dates change
- New travelers added

| Module | Regenerate when... |
|---|---|
| Itinerary | Bookings change, dates change, activities added |
| Packing List | Travelers change, dates change, destination changes |
| Do's & Don'ts | Destination changes (almost never) |
| Safety Profile | New advisory issued (via realtime monitoring) |
| Language Kit | Destination changes (almost never) |
| Documents | Passport data changes, visa status changes |

---

## IMPLEMENTATION ORDER FOR CURSOR

Build in this exact order. Each stage is testable before the next begins.

### Stage 1 — Context Builder (foundation for everything)
```
supabase/functions/generate-trip/context-builder.ts
  → buildTripGenerationContext()
  → buildVariableMap()
  → injectVariables()
Test: Log the full context object for a real trip. Verify all 38+ variables populate correctly.
```

### Stage 2 — One generation prompt end-to-end (prove the pipeline)
```
supabase/functions/generate-packing/index.ts
  → Import guidera_gen_packing system prompt as a string constant
  → Inject variables from context
  → Call Claude
  → Parse JSON response
  → Store in packing_lists table
  → Update trip_modules status
Test: Create a test trip, call this function, verify data in database and module status = 'ready'.
```

### Stage 3 — All 6 generation prompts
```
Duplicate the Stage 2 pattern for all remaining 5 modules.
supabase/functions/generate-itinerary/index.ts
supabase/functions/generate-dos-donts/index.ts
supabase/functions/generate-safety/index.ts
supabase/functions/generate-language/index.ts
supabase/functions/generate-documents/index.ts
```

### Stage 4 — The orchestrator
```
supabase/functions/generate-trip/index.ts
  → Wire up Promise.allSettled() calling all 6
  → Call CompensationService.preCalculateRightsCards()
  → Initialize expense_tracker and compensation_tracker records
Test: Full trip creation flow. All 6 modules populate in ~15 seconds.
```

### Stage 5 — Chat prompts
```
src/services/ai/chat.service.ts
  → selectSystemPrompt() routing function
  → buildGlobalChatContext()
  → buildDestinationContext()
  → buildTripCompanionContext()  ← heaviest — build last
  → Streaming handler
Test: Each chat screen in isolation. Verify correct prompt is selected per screen.
```

### Stage 6 — Reactive prompts
```
supabase/functions/monitor-flights/index.ts  (compensation trigger)
supabase/functions/parse-receipt/index.ts    (receipt scanner)
supabase/functions/generate-expense-summary/index.ts (post-trip summary)
```

### Stage 7 — Prompt caching + cost optimization
```
Add cache_control to trip companion chat system prompt.
Evaluate Batch API for generation prompts.
Add retry logic for failed modules.
Add regeneration triggers.
```

---

## SECURITY RULES (apply to all prompts)

1. **System prompts are server-side only.** Never expose them in the client bundle. Load from environment or database on the Edge Function — never send to the app.
2. **All user input is sanitized** before being injected into any prompt variable. Treat every user-provided field as potentially hostile.
3. **Rate limits:**
   - Chat (prompts 1, 2, 3): 30 messages/minute per user
   - Generation (prompts 4-9): max 1 active generation per trip at a time
   - Receipt scanner (11a): 10 scans/minute per user
4. **Output validation:** Validate that Claude's JSON output matches the expected schema before storing. If parsing fails, mark the module as failed and log — never store malformed data.
5. **Topic enforcement:** The contextual destination prompt (2) and trip companion prompt (3) include instructions to redirect off-topic queries. These are security features, not just UX — they prevent prompt injection via user messages that try to repurpose the AI.

---

## QUICK REFERENCE CARD

```
QUESTION                                    ANSWER
──────────────────────────────────────────  ─────────────────────────────────────────
Which prompt fires in the global chat?      guidera_general_prompt.md (Prompt 1)
Which prompt fires on a destination page?   guidera_contextual_prompt.md (Prompt 2)
Which prompt fires inside a trip chat?      guidera_trip_companion_prompt.md (Prompt 3)
When do prompts 4-9 fire?                   Once, when a trip is created. Parallel.
How does the app display module data?       It reads from the database, not from AI
Can prompts 4-9 be called from the app?     No. Edge Functions only.
When does prompt 10 fire?                   Flight delay ≥ 3h or cancellation detected
When does prompt 11a fire?                  User scans a receipt
When does prompt 11b fire?                  User opens Summary tab after trip ends
What if a generation module fails?          It retries once. Shows retry button if still failed.
Do chat prompts know about module data?     Prompt 3 (trip companion) does. Prompts 1 & 2 don't.
What temperature for generation prompts?    0.5 (balanced creativity/accuracy)
What temperature for receipt/compensation?  0.1 (precision tasks — minimal creativity)
What temperature for chat prompts?          0.5 (conversational)
Which prompt needs caching most urgently?   Prompt 3 (trip companion) — largest system prompt
Which modules never need regeneration?      Do's & Donts, Language Kit (destination-static)
```
