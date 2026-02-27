# Trip Planning Architecture

> **Last Updated**: December 2025  
> **Status**: Implementation Ready

---

## Overview

The Trip Planning feature is the **core AI-powered experience** of Guidera. It uses AI to understand user preferences, destinations, and context to create personalized trip plans.

---

## Entry Points

Users can access trip planning in **three ways** from `PlanBottomSheet.tsx`:

| Mode | Time | Steps | Description |
|------|------|-------|-------------|
| **Quick Trip** | 2-5 min | 5 | Fast AI-assisted planning |
| **Advanced Trip** | 10-15 min | 10 | Detailed customization |
| **Import Trip** | Varies | 4 | Import existing bookings |

---

## Quick Trip Flow (5 Steps)

### Step 1: Destination
- Search destination or "Surprise Me" (AI picks)
- Popular destinations grid
- Recent searches

### Step 2: Dates
- Quick select: Weekend, 1 Week, 2 Weeks
- Date picker with flexible dates toggle (±3 days)

### Step 3: Travelers & Style
- Companion type: Solo, Couple, Family, Friends, Group
- Trip styles (pick up to 2): Relaxation, Culture, Foodie, Adventure, Shopping, Business

### Step 4: AI Generation
- Loading animation with progress
- AI generates: itinerary, activities, safety tips, packing list, budget estimate

### Step 5: Review & Save
- Preview generated plan
- Add bookings (optional): Flight, Hotel, Car, Experience
- Save as draft or confirm trip

---

## Advanced Trip Flow (10 Steps)

### Step 1: Trip Type
- Round-trip, One-way, Multi-city

### Step 2: Destinations
- Origin + destinations with nights per location
- Add multiple destinations for multi-city

### Step 3: Dates & Duration
- Departure/return dates
- Flexibility options: Exact, ±3 days, ±1 week
- Blackout dates

### Step 4: Travelers
- Adults, children (with ages), infants
- Accessibility needs, dietary restrictions

### Step 5: Budget
- Total budget with currency
- Spending style: Budget, Mid-range, Luxury
- Budget priority: Accommodation, Experiences, Food, Balanced

### Step 6: Interests & Activities
- Interest categories (3-5): Museums, Nature, Food, Nightlife, etc.
- Pace: Relaxed, Moderate, Packed
- Time preference: Early bird, Flexible, Night owl

### Step 7: Accommodation
- Type: Hotel, Airbnb, Resort, Hostel, Mix
- Star rating, location priority, amenities
- Skip option if already booked

### Step 8: Transportation
- Getting there: Flight, Train, Drive
- Flight preferences: Class, stops, time
- Getting around: Public, Rental, Rideshare, Walking

### Step 9: Add Bookings (Optional)
- Opens respective booking flows as modals
- Bookings are completed and linked to plan

### Step 10: AI Generation & Review
- Complete itinerary with all bookings
- AI refinement prompts
- Save draft or confirm

---

## Plan States

```
DRAFT → PLANNED → CONFIRMED
```

| State | Description |
|-------|-------------|
| **Draft** | Actively editing, not saved, can discard |
| **Planned** | Saved, no bookings, can share |
| **Confirmed** | Has bookings, becomes a Trip |

---

## Data Models

### Quick Trip Data
```typescript
interface QuickTripData {
  destination: Location;
  startDate: Date;
  endDate: Date;
  isFlexible: boolean;
  companionType: 'solo' | 'couple' | 'family' | 'friends' | 'group';
  tripStyles: TripStyle[]; // max 2
}
```

### Advanced Trip Data
```typescript
interface AdvancedTripData {
  tripType: 'roundtrip' | 'oneway' | 'multicity';
  origin: Location;
  destinations: Array<{ location: Location; nights: number }>;
  departureDate: Date;
  returnDate: Date;
  flexibility: 'exact' | '3days' | '1week';
  travelers: { adults: number; children: number[]; infants: number };
  budget: { amount: number; currency: string };
  spendingStyle: 'budget' | 'midrange' | 'luxury';
  interests: string[];
  pace: 'relaxed' | 'moderate' | 'packed';
  accommodationType: string;
  gettingThere: 'flight' | 'train' | 'drive';
  gettingAround: string;
  bookings: { flights: [], hotels: [], cars: [], experiences: [] };
}
```

---

## File Structure

```
src/features/planning/
├── index.ts
├── types/
│   └── planning.types.ts
├── config/
│   └── planning.config.ts
├── stores/
│   ├── usePlanningStore.ts
│   └── useAdvancedPlanningStore.ts
├── flows/
│   ├── quick/
│   │   ├── QuickTripFlow.tsx
│   │   └── steps/
│   │       ├── DestinationStep.tsx
│   │       ├── DatesStep.tsx
│   │       ├── StyleStep.tsx
│   │       └── ReviewStep.tsx
│   └── advanced/
│       ├── AdvancedTripFlow.tsx
│       └── steps/
│           ├── TripTypeStep.tsx
│           ├── DestinationsStep.tsx
│           ├── DatesStep.tsx
│           ├── TravelersStep.tsx
│           ├── BudgetStep.tsx
│           ├── InterestsStep.tsx
│           ├── AccommodationStep.tsx
│           ├── TransportationStep.tsx
│           ├── BookingsStep.tsx
│           └── ReviewStep.tsx
└── components/
    ├── TripReminder.tsx
    └── DealCard.tsx
```

---

## AI Generation

The AI generates:
- Day-by-day itinerary
- Activity recommendations with alternatives
- Safety tips for destination
- Packing suggestions
- Budget estimate and breakdown
- Weather forecast
- Local customs (Do's & Don'ts)
- Emergency contacts

---

## Integration with Booking Flows

From the Add Bookings step, users can:
1. Tap "+ Add Flight" → Opens FlightBookingFlow
2. Complete booking → Returns to planning
3. Booking is linked to the plan
4. Repeat for Hotel, Car, Experience

**Key**: Booking happens during the booking flow (payment included). "Confirm Trip" just finalizes the plan.

---

## Homepage Components

### TripReminder
- Live countdown timer to upcoming trip
- Updates every second
- White card with time boxes

### DealCard
- Colorful promotional cards (Blue, Orange, Pink, Green)
- Discount display with decorative elements
- Horizontal scroll in "See Our Deals" section

---

*Document consolidates: TRIP_PLANNING_ARCHITECTURE.md, TRIP_PLANNING_FLOWS.md, TRIP_REMINDER_AND_DEALS.md*
