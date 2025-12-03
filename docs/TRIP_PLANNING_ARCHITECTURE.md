# Trip Planning Architecture

## Overview

The Trip Planning feature is the **core AI-powered experience** of Guidera. Unlike the booking flows (Flight, Hotel, Car, Experience, Package) which are transactional, the Planning feature is **generative and intelligent** - it uses AI to understand user preferences, destinations, and context to create personalized trip plans.

---

## User Entry Points

Users can access trip planning in **three ways**:

```
┌─────────────────────────────────────────────────────────────┐
│                    PLAN A TRIP                               │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Quick Trip    │  Advanced Trip  │     Import Trip         │
│   (5 min)       │   (10-15 min)   │    (Existing)           │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • Destination   │ • Multi-city    │ • Email import          │
│ • Dates         │ • Detailed prefs│ • Calendar sync         │
│ • Trip style    │ • Budget ranges │ • URL/Booking ref       │
│ • AI generates  │ • Add-ons       │ • Manual entry          │
│                 │ • Companions    │                         │
│                 │ • AI refines    │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

## Quick Trip Flow

**Purpose**: Fast trip planning for users who want AI to do the heavy lifting.

**Target Time**: 2-5 minutes to complete

### Steps:

```
1. DESTINATION
   ├── Single destination input
   ├── "Surprise me" option (AI picks based on preferences)
   └── Recent/saved destinations

2. DATES
   ├── Quick date picker (calendar)
   ├── Flexible dates toggle ("±3 days")
   └── Duration presets (Weekend, 1 Week, 2 Weeks)

3. TRIP STYLE (Pick 1-2)
   ├── 🏖️ Relaxation
   ├── 🎭 Culture & History
   ├── 🍽️ Food & Dining
   ├── 🥾 Adventure
   ├── 🛍️ Shopping
   ├── 👨‍👩‍👧‍👦 Family Fun
   ├── 💑 Romantic
   └── 💼 Business + Leisure

4. TRAVELERS
   ├── Solo / Couple / Family / Group
   └── Quick count (Adults, Children)

5. AI GENERATION
   ├── Loading state with progress
   ├── AI generates complete plan
   └── Preview summary

6. REVIEW & CUSTOMIZE
   ├── View generated itinerary
   ├── Swap/remove activities
   ├── Add bookings (optional)
   └── Save or Confirm
```

### Quick Trip Output:
- Day-by-day itinerary
- Recommended activities
- Safety tips for destination
- Packing suggestions
- Local customs (Do's & Don'ts)
- Budget estimate
- Weather forecast

---

## Advanced Trip Flow

**Purpose**: Detailed trip planning for users who want full control with AI assistance.

**Target Time**: 10-15 minutes to complete

### Steps:

```
1. TRIP TYPE
   ├── One-way
   ├── Round-trip
   ├── Multi-city (add multiple destinations)
   └── Open-jaw (fly into A, out of B)

2. DESTINATIONS
   ├── Primary destination(s)
   ├── Duration per destination
   ├── Order/routing preferences
   └── "Add another destination" option

3. DATES & FLEXIBILITY
   ├── Specific dates per destination
   ├── Flexible date ranges
   ├── Trip duration constraints
   └── Blackout dates (dates to avoid)

4. TRAVELERS & COMPANIONS
   ├── Number of travelers
   ├── Age groups (for activity filtering)
   ├── Accessibility needs
   ├── Dietary restrictions
   └── Travel companion types (family, friends, solo)

5. BUDGET & SPENDING
   ├── Overall trip budget
   ├── Budget breakdown preferences:
   │   ├── Accommodation %
   │   ├── Activities %
   │   ├── Food & Dining %
   │   ├── Transportation %
   │   └── Shopping/Misc %
   ├── Spending style (Budget / Mid-range / Luxury)
   └── Currency preferences

6. INTERESTS & PREFERENCES
   ├── Activity categories (multi-select):
   │   ├── Museums & Art
   │   ├── Historical Sites
   │   ├── Nature & Outdoors
   │   ├── Beaches & Water
   │   ├── Nightlife & Entertainment
   │   ├── Local Experiences
   │   ├── Food Tours
   │   ├── Adventure Sports
   │   ├── Wellness & Spa
   │   ├── Photography Spots
   │   └── Hidden Gems
   ├── Pace preference (Relaxed / Moderate / Packed)
   ├── Morning person vs Night owl
   └── Must-see attractions (optional)

7. ACCOMMODATION PREFERENCES
   ├── Type: Hotel / Hostel / Airbnb / Resort / Mix
   ├── Star rating preference
   ├── Location priority (Central / Quiet / Near attractions)
   ├── Amenities (Pool, Gym, Kitchen, etc.)
   └── Skip accommodation (already booked / staying with friends)

8. TRANSPORTATION PREFERENCES
   ├── Getting there: Flight / Train / Drive / Bus
   ├── Getting around: Public transit / Rental car / Rideshare / Walking
   ├── Flight preferences (if applicable):
   │   ├── Class (Economy / Business / First)
   │   ├── Direct vs Connections
   │   ├── Airline preferences
   │   └── Time preferences (Morning / Afternoon / Evening)
   └── Skip transportation (already booked)

9. ADD-ONS (Optional Bookings)
   ├── ✈️ Add Flight → Opens Flight Booking Flow
   ├── 🏨 Add Hotel → Opens Hotel Booking Flow
   ├── 🚗 Add Car Rental → Opens Car Rental Flow
   ├── 🎭 Add Experiences → Opens Experience Flow
   └── 📦 Add Package → Opens Package Flow
   
   Note: User can add multiple add-ons or skip entirely

10. SPECIAL REQUIREMENTS
    ├── Travel insurance needs
    ├── Visa requirements check
    ├── Vaccination requirements
    ├── Special occasions (Birthday, Anniversary, Honeymoon)
    └── Notes for AI

11. AI GENERATION & REFINEMENT
    ├── AI generates comprehensive plan
    ├── Interactive refinement:
    │   ├── "Make it more adventurous"
    │   ├── "Add more food experiences"
    │   ├── "Reduce budget"
    │   └── Custom prompts
    └── Regenerate specific days

12. REVIEW & FINALIZE
    ├── Complete itinerary view
    ├── All bookings summary
    ├── Total cost breakdown
    ├── Safety & health info
    ├── Packing list
    ├── Local tips
    └── Save Draft / Confirm Trip
```

### Advanced Trip Output:
Everything from Quick Trip, plus:
- Detailed hour-by-hour itinerary
- Restaurant reservations suggestions
- Alternative activities (Plan B options)
- Transportation between activities
- Cost per day breakdown
- Visa/documentation checklist
- Emergency contacts for destination
- Offline maps integration
- Currency exchange tips

---

## Import Trip Flow

**Purpose**: Import existing bookings/trips from external sources.

### Import Sources:
```
1. EMAIL IMPORT
   ├── Connect email (Gmail, Outlook, etc.)
   ├── AI scans for booking confirmations
   ├── Extracts: Flights, Hotels, Car rentals, Activities
   └── Creates trip from extracted data

2. CALENDAR SYNC
   ├── Connect calendar
   ├── Import travel events
   └── Build trip around calendar blocks

3. BOOKING REFERENCE
   ├── Enter confirmation number
   ├── Select provider (Airline, Hotel chain, etc.)
   └── Fetch booking details via API

4. MANUAL ENTRY
   ├── Add bookings manually
   ├── Upload confirmation PDFs
   └── AI extracts details from documents

5. URL IMPORT
   ├── Paste booking confirmation URL
   └── AI scrapes and extracts details
```

---

## Plan States & Lifecycle

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    DRAFT     │────▶│   PLANNED    │────▶│  CONFIRMED   │
│  (Unsaved)   │     │   (Saved)    │     │  (Booked)    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
   Can edit            Can edit             Limited edits
   Can discard         Can share            Has bookings
   No bookings         Can add bookings     Can cancel
                       Can confirm
```

### Plan States:

1. **Draft**: User is actively creating/editing. Not saved. Can be discarded.
2. **Planned**: Saved but not confirmed. No actual bookings made. Can be shared.
3. **Confirmed**: User has confirmed. May have actual bookings. Becomes a "Trip".

---

## AI System Architecture

### Core AI Capabilities:

```
┌─────────────────────────────────────────────────────────────┐
│                    GUIDERA AI ENGINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Destination │  │  Activity   │  │   Safety    │         │
│  │ Intelligence│  │ Recommender │  │  Advisor    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Budget    │  │   Packing   │  │  Cultural   │         │
│  │  Optimizer  │  │   Advisor   │  │   Guide     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Itinerary  │  │   Weather   │  │    Visa     │         │
│  │  Generator  │  │  Forecaster │  │   Checker   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### AI System Prompt Components:

```typescript
interface AIContext {
  // User Profile
  userPreferences: UserPreferences;
  travelHistory: Trip[];
  savedPlaces: Place[];
  
  // Trip Parameters
  destination: Destination;
  dates: DateRange;
  travelers: TravelerInfo;
  budget: BudgetInfo;
  interests: string[];
  
  // Destination Intelligence
  destinationData: {
    safety: SafetyInfo;
    weather: WeatherForecast;
    events: LocalEvent[];
    holidays: Holiday[];
    visaRequirements: VisaInfo;
    healthAdvisories: HealthInfo;
    culturalNorms: CulturalInfo;
    currency: CurrencyInfo;
    language: LanguageInfo;
    timezone: TimezoneInfo;
  };
  
  // Real-time Data
  flightPrices: PriceRange;
  hotelAvailability: Availability;
  popularActivities: Activity[];
  localTips: Tip[];
}
```

---

## Data Models

### Trip Plan Model:

```typescript
interface TripPlan {
  id: string;
  userId: string;
  status: 'draft' | 'planned' | 'confirmed' | 'completed' | 'cancelled';
  type: 'quick' | 'advanced' | 'imported';
  
  // Core Info
  name: string;
  description?: string;
  coverImage?: string;
  
  // Destinations
  destinations: Destination[];
  
  // Dates
  startDate: Date;
  endDate: Date;
  isFlexible: boolean;
  flexibilityDays?: number;
  
  // Travelers
  travelers: {
    adults: number;
    children: number;
    infants: number;
    companions: Companion[];
  };
  
  // Preferences
  preferences: {
    tripStyle: TripStyle[];
    pace: 'relaxed' | 'moderate' | 'packed';
    interests: string[];
    dietaryRestrictions: string[];
    accessibilityNeeds: string[];
  };
  
  // Budget
  budget: {
    total: number;
    currency: string;
    breakdown: BudgetBreakdown;
    spendingStyle: 'budget' | 'mid-range' | 'luxury';
  };
  
  // Itinerary
  itinerary: DayPlan[];
  
  // Bookings (Optional Add-ons)
  bookings: {
    flights: FlightBooking[];
    hotels: HotelBooking[];
    cars: CarBooking[];
    experiences: ExperienceBooking[];
  };
  
  // AI-Generated Content
  aiContent: {
    safetyTips: SafetyTip[];
    packingList: PackingItem[];
    culturalTips: CulturalTip[];
    localPhrases: Phrase[];
    emergencyContacts: Contact[];
    weatherForecast: WeatherDay[];
    budgetTips: string[];
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  sharedWith: string[];
  isPublic: boolean;
}

interface DayPlan {
  date: Date;
  dayNumber: number;
  destination: Destination;
  activities: PlannedActivity[];
  meals: MealSuggestion[];
  transportation: TransportSegment[];
  notes: string;
  weather: WeatherInfo;
  estimatedCost: number;
}

interface PlannedActivity {
  id: string;
  name: string;
  type: ActivityType;
  startTime: string;
  endTime: string;
  duration: number;
  location: Location;
  description: string;
  cost: PriceInfo;
  bookingRequired: boolean;
  bookingUrl?: string;
  linkedBooking?: string; // ID of actual booking if made
  alternatives: PlannedActivity[]; // Plan B options
  tips: string[];
  photos: string[];
}
```

---

## Component Architecture

### File Structure:

```
src/features/planning/
├── index.ts                      # Public exports
├── types/
│   ├── planning.types.ts         # Core types
│   ├── itinerary.types.ts        # Itinerary types
│   └── ai.types.ts               # AI-related types
├── config/
│   ├── planning.config.ts        # Feature config
│   ├── steps.config.ts           # Flow step definitions
│   └── prompts.config.ts         # AI prompt templates
├── stores/
│   ├── usePlanningStore.ts       # Main planning state
│   ├── useItineraryStore.ts      # Itinerary editing state
│   └── useAIStore.ts             # AI generation state
├── hooks/
│   ├── usePlanningFlow.ts        # Flow navigation
│   ├── useAIGeneration.ts        # AI generation logic
│   ├── useItineraryEditor.ts     # Itinerary manipulation
│   └── useDestinationData.ts     # Destination intelligence
├── services/
│   ├── aiService.ts              # AI API calls
│   ├── destinationService.ts     # Destination data fetching
│   └── importService.ts          # Trip import logic
├── components/
│   ├── shared/
│   │   ├── PlanningHeader.tsx
│   │   ├── DestinationPicker.tsx
│   │   ├── DateRangePicker.tsx
│   │   ├── TravelerSelector.tsx
│   │   ├── InterestPicker.tsx
│   │   ├── BudgetSlider.tsx
│   │   └── AILoadingState.tsx
│   ├── itinerary/
│   │   ├── DayCard.tsx
│   │   ├── ActivityCard.tsx
│   │   ├── TimelineView.tsx
│   │   ├── MapView.tsx
│   │   └── ItineraryEditor.tsx
│   └── ai/
│       ├── AIChat.tsx
│       ├── SuggestionChips.tsx
│       └── RegenerateButton.tsx
├── flows/
│   ├── quick/
│   │   ├── QuickTripFlow.tsx
│   │   └── steps/
│   │       ├── DestinationStep.tsx
│   │       ├── DatesStep.tsx
│   │       ├── StyleStep.tsx
│   │       ├── TravelersStep.tsx
│   │       ├── GeneratingStep.tsx
│   │       └── ReviewStep.tsx
│   ├── advanced/
│   │   ├── AdvancedTripFlow.tsx
│   │   └── steps/
│   │       ├── TripTypeStep.tsx
│   │       ├── DestinationsStep.tsx
│   │       ├── DatesStep.tsx
│   │       ├── TravelersStep.tsx
│   │       ├── BudgetStep.tsx
│   │       ├── InterestsStep.tsx
│   │       ├── AccommodationStep.tsx
│   │       ├── TransportationStep.tsx
│   │       ├── AddOnsStep.tsx
│   │       ├── SpecialStep.tsx
│   │       ├── GeneratingStep.tsx
│   │       └── ReviewStep.tsx
│   └── import/
│       ├── ImportTripFlow.tsx
│       └── steps/
│           ├── SourceStep.tsx
│           ├── ConnectStep.tsx
│           ├── ExtractStep.tsx
│           └── ReviewStep.tsx
└── screens/
    ├── PlanningHomeScreen.tsx    # Entry point with 3 options
    ├── ItineraryScreen.tsx       # Full itinerary view
    └── PlanSummaryScreen.tsx     # Plan overview
```

---

## User Flows Diagram

### Quick Trip Flow:
```
[Start] → [Destination] → [Dates] → [Style] → [Travelers] → [AI Generating...] → [Review] → [Save/Confirm]
                                                                                      ↓
                                                                              [Add Bookings?]
                                                                                      ↓
                                                                              [Flight/Hotel/Car/Experience Flows]
```

### Advanced Trip Flow:
```
[Start] → [Trip Type] → [Destinations] → [Dates] → [Travelers] → [Budget] → [Interests] 
                                                                                  ↓
    [Review] ← [AI Generating...] ← [Special Reqs] ← [Add-Ons] ← [Transport] ← [Accommodation]
       ↓
  [Refine with AI]
       ↓
  [Save/Confirm]
```

### Import Trip Flow:
```
[Start] → [Select Source] → [Connect/Upload] → [AI Extracts] → [Review & Edit] → [Save]
                                                      ↓
                                              [Fill Missing Info]
```

---

## Integration Points

### With Existing Booking Flows:

The Planning feature integrates with existing booking flows as **optional add-ons**:

```typescript
// From AddOnsStep in Advanced Trip
const handleAddFlight = () => {
  // Open FlightBookingFlow as a modal
  // On completion, link booking to plan
  setShowFlightFlow(true);
};

const handleFlightBooked = (booking: FlightBooking) => {
  // Add to plan's bookings
  planningStore.addBooking('flight', booking);
  setShowFlightFlow(false);
};
```

### With Trip Detail Screen:

When a plan is confirmed, it becomes a Trip and appears in the Trips tab:

```typescript
// On plan confirmation
const confirmPlan = async (plan: TripPlan) => {
  const trip = await tripService.createFromPlan(plan);
  // Trip now appears in Trips tab
  // All AI content (safety, packing, etc.) is attached
  navigation.navigate('TripDetail', { tripId: trip.id });
};
```

### With Plugins:

The plan generates content that feeds into trip plugins:

- **Packing Plugin**: Receives AI-generated packing list
- **Safety Plugin**: Receives destination safety info
- **Do's & Don'ts Plugin**: Receives cultural tips
- **Budget Plugin**: Receives budget breakdown
- **Planner Plugin**: Receives day-by-day itinerary

---

## AI Prompt Strategy

### System Prompt Structure:

```
You are Guidera, an expert travel planning AI. You create personalized, 
practical, and inspiring travel itineraries.

CONTEXT:
- User Profile: {userPreferences}
- Destination: {destination}
- Dates: {dateRange}
- Travelers: {travelerInfo}
- Budget: {budgetInfo}
- Interests: {interests}

DESTINATION INTELLIGENCE:
- Current Safety Level: {safetyLevel}
- Weather Forecast: {weather}
- Local Events: {events}
- Visa Requirements: {visa}
- Health Advisories: {health}
- Cultural Norms: {culture}

INSTRUCTIONS:
1. Create a day-by-day itinerary that matches the user's pace preference
2. Balance activities with rest time
3. Consider travel time between locations
4. Include meal suggestions that match dietary restrictions
5. Provide alternatives for each major activity
6. Include practical tips for each day
7. Stay within budget constraints
8. Highlight safety considerations
9. Suggest optimal times for popular attractions
10. Include hidden gems alongside popular spots

OUTPUT FORMAT:
{structuredItineraryFormat}
```

---

## State Management

### Planning Store:

```typescript
interface PlanningState {
  // Current Plan
  currentPlan: TripPlan | null;
  
  // Flow State
  flowType: 'quick' | 'advanced' | 'import' | null;
  currentStep: number;
  totalSteps: number;
  
  // Form Data (accumulated through steps)
  formData: Partial<TripPlanInput>;
  
  // AI State
  isGenerating: boolean;
  generationProgress: number;
  aiSuggestions: Suggestion[];
  
  // Actions
  startQuickTrip: () => void;
  startAdvancedTrip: () => void;
  startImport: () => void;
  updateFormData: (data: Partial<TripPlanInput>) => void;
  generatePlan: () => Promise<void>;
  regenerateDay: (dayNumber: number) => Promise<void>;
  saveDraft: () => Promise<void>;
  confirmPlan: () => Promise<Trip>;
  reset: () => void;
}
```

---

## Next Steps

### Phase 1: Foundation (Week 1)
1. Create planning types and interfaces
2. Set up planning store
3. Create PlanningHomeScreen with 3 options
4. Implement basic flow navigation

### Phase 2: Quick Trip (Week 2)
1. Build Quick Trip flow steps
2. Implement AI generation (mock first, then real)
3. Create itinerary review UI
4. Add save/confirm functionality

### Phase 3: Advanced Trip (Week 3-4)
1. Build all Advanced Trip steps
2. Implement add-on integration with booking flows
3. Create AI refinement interface
4. Build comprehensive review screen

### Phase 4: Import (Week 5)
1. Implement email import
2. Add booking reference lookup
3. Create manual entry flow
4. Build extraction review UI

### Phase 5: Polish & Integration (Week 6)
1. Connect to Trip Detail screen
2. Feed data to plugins
3. Add sharing functionality
4. Performance optimization

---

## Open Questions

1. **Offline Support**: Should plans be fully available offline?
2. **Collaboration**: Can multiple users edit the same plan?
3. **Templates**: Should we offer pre-made trip templates?
4. **Social**: Can users share/publish their plans publicly?
5. **Versioning**: Should we keep history of plan changes?

---

## Success Metrics

- **Quick Trip Completion Rate**: % of users who complete quick trip flow
- **Advanced Trip Completion Rate**: % of users who complete advanced flow
- **Add-on Conversion**: % of plans that include bookings
- **Plan Confirmation Rate**: % of saved plans that get confirmed
- **AI Satisfaction**: User ratings of AI-generated itineraries
- **Time to Plan**: Average time to complete each flow type

---

*Document Version: 1.0*
*Last Updated: December 2, 2024*
*Author: Guidera Development Team*
