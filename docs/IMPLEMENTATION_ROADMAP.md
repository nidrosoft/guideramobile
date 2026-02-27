# Guidera Implementation Roadmap

## Overview

This document outlines the 5-phase implementation plan for connecting Guidera's UI to real data and APIs. The phases are ordered by **dependency** - each phase builds on the previous one, ensuring no feature is blocked waiting for another.

---

## Current State Analysis

### ✅ Completed
- **Authentication**: Supabase auth with email/phone, session management, route protection
- **Onboarding**: 10-step flow saving user preferences to database
- **Database Schema**: 25+ tables with RLS policies in Supabase
- **UI Components**: Full component library, booking flows, planning flows

### ❌ Not Connected
- All services are empty stubs
- Data comes from static files in `/src/data/`
- Stores exist but don't persist to Supabase
- No external API integrations

---

## Phase 1: Foundation Data Layer (Week 1-2)
**Goal**: Seed database with destinations and connect homepage to real data

### Why First?
- Homepage is the first screen users see after onboarding
- Destinations are required by ALL other features (trips, bookings, search)
- No external API dependencies - can use curated data

### Tasks

#### 1.1 Seed Destinations Database
```
Tables: destinations, cultural_tips
Data: Top 50 popular destinations with:
  - Name, city, country, coordinates
  - Images (use Unsplash/Pexels URLs initially)
  - Description, region
```

#### 1.2 Create Destination Service
```typescript
// src/services/destination.service.ts
- getPopularDestinations(limit: number)
- searchDestinations(query: string)
- getDestinationById(id: string)
- getDestinationsByRegion(region: string)
```

#### 1.3 Connect Homepage Sections
```
Replace static data in:
- /src/data/places.ts → Supabase destinations
- /src/data/trendingLocations.ts → Supabase destinations (sorted by search_count)
- /src/data/bestDiscover.ts → Supabase destinations (curated)
```

#### 1.4 Connect User Profile to Homepage
```
- Show real user name from profile
- Show user's location from profile
- Dynamic greeting based on time of day
```

### Deliverables
- [ ] 50+ destinations seeded in database
- [ ] Homepage shows real user data
- [ ] Destination search works with Supabase
- [ ] All homepage sections pull from database

---

## Phase 2: Trip Planning & Management (Week 3-4)
**Goal**: Connect Quick Trip, Advanced Trip, and Trip Management to Supabase

### Why Second?
- Trips are the CORE feature of the app
- Depends on Phase 1 (destinations)
- Independent of external booking APIs
- Users can plan trips without making real bookings

### Tasks

#### 2.1 Create Trip Service
```typescript
// src/services/trip.service.ts
- createTrip(data: CreateTripInput)
- updateTrip(id: string, data: UpdateTripInput)
- deleteTrip(id: string)
- getUserTrips(userId: string)
- getTripById(id: string)
- getTripWithDetails(id: string) // includes itinerary, bookings
```

#### 2.2 Connect Planning Store to Supabase
```
Update: /src/features/planning/stores/usePlanningStore.ts
- saveDraft() → Insert into trips table
- confirmPlan() → Update trip status
- Load user's profile preferences for AI generation
```

#### 2.3 Create Trip Plans Service
```typescript
// src/services/trip-plan.service.ts
- createTripPlan(tripId: string, data: TripPlanInput)
- updateTripPlan(planId: string, data: UpdatePlanInput)
- getItineraryDays(tripId: string)
- addActivity(dayId: string, activity: ActivityInput)
```

#### 2.4 Connect Trips Tab
```
/src/app/(tabs)/trips.tsx
- Show user's actual trips from database
- Filter by status (upcoming, ongoing, completed, draft)
- Trip countdown using real dates
```

#### 2.5 AI Trip Generation (Mock First)
```
GeneratingStep.tsx currently simulates AI
- Keep mock generation for now
- Structure output to match database schema
- Save generated itinerary to itinerary_days + itinerary_activities
```

### Deliverables
- [ ] Quick Trip flow saves to database
- [ ] Advanced Trip flow saves to database
- [ ] Import Trip flow saves to database
- [ ] Trips tab shows real user trips
- [ ] Trip detail screen shows real data
- [ ] Itinerary persists across sessions

---

## Phase 3: Booking Infrastructure (Week 5-6)
**Goal**: Connect booking flows to Supabase (without external APIs)

### Why Third?
- Depends on Phase 2 (trips to attach bookings to)
- Can work with mock search results initially
- Establishes booking data structure for Phase 5

### Tasks

#### 3.1 Create Booking Service
```typescript
// src/services/booking.service.ts
- createBooking(data: CreateBookingInput)
- updateBooking(id: string, data: UpdateBookingInput)
- cancelBooking(id: string, reason: string)
- getUserBookings(userId: string)
- getBookingsByTrip(tripId: string)
- getBookingById(id: string)
```

#### 3.2 Connect Flight Booking Store
```
Update: /src/features/booking/stores/useFlightStore.ts
- On checkout complete → Create booking + flight_booking records
- Link to trip if applicable
- Save traveler details
```

#### 3.3 Connect Hotel Booking Store
```
Update: /src/features/booking/stores/useHotelStore.ts
- On checkout complete → Create booking + hotel_booking records
- Save guest details, room preferences
```

#### 3.4 Connect Car & Experience Stores
```
Same pattern for:
- useCarStore.ts → car_bookings
- useExperienceStore.ts → experience_bookings
```

#### 3.5 Booking Confirmation & History
```
- Booking confirmation screen shows real booking ID
- Bookings appear in trip detail
- Booking history accessible from profile
```

### Deliverables
- [ ] All booking flows save to database
- [ ] Bookings linked to trips
- [ ] Booking history works
- [ ] Booking details screen shows real data
- [ ] Cancel booking updates database

---

## Phase 4: User Features & Saved Content (Week 7-8)
**Goal**: Connect saved items, expenses, packing, journal

### Why Fourth?
- These are user-generated content features
- Depend on trips existing (Phase 2)
- Independent of external APIs
- Enhance user experience without blocking core flow

### Tasks

#### 4.1 Saved Items Service
```typescript
// src/services/saved.service.ts
- saveItem(data: SaveItemInput)
- unsaveItem(id: string)
- getUserSavedItems(userId: string)
- getSavedItemsByCollection(collectionId: string)
- createCollection(data: CollectionInput)
```

#### 4.2 Expenses Service
```typescript
// src/services/expense.service.ts
- addExpense(tripId: string, data: ExpenseInput)
- updateExpense(id: string, data: UpdateExpenseInput)
- deleteExpense(id: string)
- getTripExpenses(tripId: string)
- getExpenseSummary(tripId: string)
```

#### 4.3 Packing List Service
```typescript
// src/services/packing.service.ts
- getPackingList(tripId: string)
- addPackingItem(tripId: string, item: PackingItemInput)
- togglePackedStatus(itemId: string)
- generateSuggestedItems(tripId: string) // based on destination
```

#### 4.4 Journal Service
```typescript
// src/services/journal.service.ts
- createJournalEntry(tripId: string, data: JournalEntryInput)
- updateJournalEntry(id: string, data: UpdateJournalInput)
- getJournalEntries(tripId: string)
- addJournalBlock(entryId: string, block: BlockInput)
```

### Deliverables
- [ ] Save/unsave destinations and experiences
- [ ] Expense tracking per trip
- [ ] Packing list per trip
- [ ] Journal entries with blocks
- [ ] All data persists to Supabase

---

## Phase 5: External API Integration (Week 9-12)
**Goal**: Connect to real flight, hotel, and places APIs

### Why Last?
- Most complex phase
- Requires API keys and potentially costs
- App is fully functional with mock data before this
- Can be done incrementally

### Tasks

#### 5.1 Places API Integration
```
Provider: Google Places API
Features:
- Real destination search with autocomplete
- Place photos
- Place details (ratings, reviews, hours)
- Nearby attractions
```

#### 5.2 Flight Search API
```
Provider: Amadeus or Kiwi.com
Features:
- Real flight search
- Price comparison
- Flight status tracking
```

#### 5.3 Hotel Search API
```
Provider: Amadeus or Expedia Rapid API
Features:
- Real hotel search
- Room availability
- Price comparison
```

#### 5.4 AI Integration
```
Provider: OpenAI GPT-4 or Claude
Features:
- Real trip itinerary generation
- Personalized recommendations
- Cultural tips generation
```

#### 5.5 Weather & Safety APIs
```
Providers: Tomorrow.io, Riskline
Features:
- Weather forecasts for trip dates
- Safety alerts for destinations
```

### Deliverables
- [ ] Real flight search results
- [ ] Real hotel search results
- [ ] AI-generated itineraries
- [ ] Weather integration
- [ ] Safety alerts

---

## Implementation Order Summary

```
Phase 1: Foundation Data Layer
    ↓
Phase 2: Trip Planning & Management
    ↓
Phase 3: Booking Infrastructure
    ↓
Phase 4: User Features & Saved Content
    ↓
Phase 5: External API Integration
```

---

## Quick Reference: What Depends on What

| Feature | Depends On |
|---------|------------|
| Homepage sections | Destinations (Phase 1) |
| Quick/Advanced Trip | Destinations (Phase 1) |
| Trip Detail | Trips (Phase 2) |
| Booking flows | Trips (Phase 2) |
| Trip countdown | Trips (Phase 2) |
| Saved items | Destinations (Phase 1) |
| Expenses | Trips (Phase 2) |
| Packing list | Trips (Phase 2) |
| Journal | Trips (Phase 2) |
| Real search | External APIs (Phase 5) |
| AI generation | External APIs (Phase 5) |

---

## Files to Create/Update Per Phase

### Phase 1
```
CREATE:
- src/services/destination.service.ts
- src/stores/useDestinationStore.ts

UPDATE:
- src/app/(tabs)/index.tsx (use real user data)
- src/data/* (replace with Supabase queries)
- src/features/planning/config/planning.config.ts (POPULAR_DESTINATIONS)

SEED:
- Supabase destinations table (50+ records)
- Supabase cultural_tips table
```

### Phase 2
```
CREATE:
- src/services/trip.service.ts
- src/services/itinerary.service.ts
- src/stores/useTripStore.ts

UPDATE:
- src/features/planning/stores/usePlanningStore.ts
- src/features/trips/screens/*
- src/app/(tabs)/trips.tsx
```

### Phase 3
```
CREATE:
- src/services/booking.service.ts
- src/services/flight-booking.service.ts
- src/services/hotel-booking.service.ts

UPDATE:
- src/features/booking/stores/useFlightStore.ts
- src/features/booking/stores/useHotelStore.ts
- src/features/booking/stores/useCarStore.ts
- src/features/booking/stores/useExperienceStore.ts
```

### Phase 4
```
CREATE:
- src/services/saved.service.ts
- src/services/expense.service.ts
- src/services/packing.service.ts
- src/services/journal.service.ts
- src/stores/useSavedStore.ts

UPDATE:
- Relevant feature screens
```

### Phase 5
```
CREATE:
- src/services/api/amadeus.service.ts
- src/services/api/google-places.service.ts
- src/services/api/openai.service.ts
- src/services/api/weather.service.ts
- Edge Functions for API proxying

UPDATE:
- All search flows to use real APIs
- GeneratingStep to use real AI
```

---

## Estimated Timeline

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1 | 1-2 weeks | Medium |
| Phase 2 | 2 weeks | High |
| Phase 3 | 2 weeks | High |
| Phase 4 | 1-2 weeks | Medium |
| Phase 5 | 3-4 weeks | Very High |

**Total: 9-12 weeks for full implementation**

---

## Next Steps

**Start with Phase 1, Task 1.1**: Seed the destinations database with 50+ popular destinations. This unblocks everything else.

Would you like me to begin implementation?
