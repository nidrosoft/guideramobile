# Experience Booking Flow Refactoring Plan

## Current State Analysis

### Existing Architecture (TO BE DELETED)
```
src/features/booking/flows/experience/
├── ExperienceFlow.tsx (124 lines) - Step-based orchestrator
├── index.ts
└── steps/
    ├── SearchStep.tsx (884 lines) ❌ TOO LARGE
    ├── ResultsStep.tsx (1077 lines) ❌ TOO LARGE
    ├── DetailStep.tsx (634 lines) ❌ TOO LARGE
    ├── OptionsStep.tsx (712 lines) ❌ TOO LARGE
    ├── PaymentStep.tsx (577 lines) ❌ TOO LARGE
    ├── ConfirmationStep.tsx (622 lines) ❌ TOO LARGE
    └── index.ts
```

**Total: 6 steps, all files over 500 lines**

### Current Flow Steps:
1. **SearchStep** - Destination, date, participants, category selection
2. **ResultsStep** - Browse experiences with filters/sorting
3. **DetailStep** - Full experience details, images, host info
4. **OptionsStep** - Select date, time slot, adjust participants
5. **PaymentStep** - Lead traveler info, payment details
6. **ConfirmationStep** - Booking confirmed with voucher

---

## New Architecture (Plugin Pattern)

### Target Structure
```
src/features/booking/flows/experience/
├── ExperienceBookingFlow.tsx (~220 lines) - Screen orchestrator
├── index.ts
├── screens/
│   ├── ExperienceSearchScreen.tsx (~350 lines)
│   ├── ExperienceSearchLoadingScreen.tsx (~400 lines)
│   ├── ExperienceResultsScreen.tsx (~450 lines)
│   ├── ExperienceCheckoutScreen.tsx (~450 lines)
│   ├── ExperienceCheckoutScreen.styles.ts (~300 lines)
│   └── index.ts
├── sheets/
│   ├── LocationPickerSheet.tsx (~200 lines) - Reuse from car or create
│   ├── DatePickerSheet.tsx (~250 lines) - Reuse from flight
│   ├── ParticipantsSheet.tsx (~200 lines)
│   ├── ExperienceDetailSheet.tsx (~400 lines)
│   ├── TimeSlotSheet.tsx (~250 lines)
│   ├── TravelerDetailsSheet.tsx (~300 lines)
│   ├── PaymentSheet.tsx (~350 lines) - Reuse from car
│   └── index.ts
└── components/
    ├── DestinationField.tsx (~80 lines) - Reuse from hotel
    ├── DateField.tsx (~80 lines)
    ├── ParticipantsField.tsx (~100 lines)
    ├── CategorySelector.tsx (~120 lines)
    ├── ExperienceCard.tsx (~200 lines)
    └── index.ts
```

---

## Screen Flow (4 Screens)

### 1. ExperienceSearchScreen
**Purpose:** Search for experiences by destination, date, participants, category

**UI Elements:**
- Header with ImageBackground (experiencebg.png)
- Back button, "Find Experiences" title, Close button
- Destination card (overlapping header - like hotel)
- Date field
- Participants field
- Category horizontal scroll chips
- Search button footer

**Bottom Sheets:**
- LocationPickerSheet (destination selection)
- DatePickerSheet (single date selection)
- ParticipantsSheet (adults, children, infants)

**Data Captured:**
- `destination: Location`
- `date: Date`
- `participants: { adults, children, infants }`
- `category?: ExperienceCategory`

---

### 2. ExperienceSearchLoadingScreen
**Purpose:** Animated loading while searching

**UI Elements:**
- Animated experience icons
- Progress indicator
- Search summary text
- Loading messages rotation

**Duration:** 2-3 seconds simulated search

---

### 3. ExperienceResultsScreen
**Purpose:** Browse and filter experiences

**UI Elements:**
- Header with search summary
- Filter/Sort buttons
- Experience cards list (FlatList)
- Each card shows: image, title, rating, duration, price, category badge

**Bottom Sheets:**
- ExperienceDetailSheet (full details when card tapped)
  - Image gallery
  - Title, rating, reviews
  - Duration, max participants, languages
  - Description
  - What's included / not included
  - Host info
  - Meeting point
  - "Check Availability" button

**Actions:**
- Tap card → Open ExperienceDetailSheet
- "Check Availability" → Navigate to Checkout

---

### 4. ExperienceCheckoutScreen
**Purpose:** Combined checkout (options + traveler + payment)

**UI Elements:**
- Header with ImageBackground
- Experience summary card
- Date & Time selection card → Opens TimeSlotSheet
- Participants adjustment card → Opens ParticipantsSheet
- Lead Traveler card → Opens TravelerDetailsSheet
- Payment card → Opens PaymentSheet
- Price breakdown
- Confirm booking button

**Bottom Sheets:**
- TimeSlotSheet (calendar + time slots)
- ParticipantsSheet (adjust count)
- TravelerDetailsSheet (name, email, phone)
- PaymentSheet (card details + billing address)

**Data Captured:**
- `selectedDate: Date`
- `selectedTimeSlot: TimeSlot`
- `participants: ParticipantCount`
- `leadTraveler: { firstName, lastName, email, phone }`
- `paymentData: PaymentData`

---

## Components to Reuse

### From Car Flow:
- `PaymentSheet.tsx` - Payment details with billing address
- `DateTimePickerSheet.tsx` - Can adapt for date + time slot

### From Hotel Flow:
- `DestinationField.tsx` - Destination input card
- `LocationPickerSheet.tsx` - City/destination picker

### From Flight Flow:
- `DatePickerSheet.tsx` - Single date picker
- Loading screen animation pattern

### From Shared:
- `CancelBookingModal.tsx` - Confirmation on close

---

## Data Flow

### useExperienceStore (Keep existing, minor updates)
```typescript
interface ExperienceState {
  // Search
  searchParams: {
    destination: Location | null;
    date: Date | null;
    participants: ParticipantCount;
    category?: ExperienceCategory;
  };
  
  // Results
  results: Experience[];
  filters: ExperienceFilters;
  sortBy: SortOption;
  
  // Selection
  selectedExperience: Experience | null;
  selectedDate: Date | null;
  selectedTimeSlot: TimeSlot | null;
  
  // Booking
  leadTraveler: LeadTraveler;
  paymentData: PaymentData | null;
  
  // Pricing
  pricing: ExperiencePricing;
  
  // Confirmation
  bookingReference: string | null;
  bookingConfirmed: boolean;
}
```

---

## Implementation Order

### Phase 1: Setup Structure
1. Create new folder structure
2. Create `ExperienceBookingFlow.tsx` orchestrator
3. Create screen index exports

### Phase 2: Search Screen
1. Create `ExperienceSearchScreen.tsx`
2. Create/adapt `LocationPickerSheet.tsx`
3. Adapt `DatePickerSheet.tsx` from flight
4. Create `ParticipantsSheet.tsx`
5. Create `CategorySelector.tsx` component

### Phase 3: Loading Screen
1. Create `ExperienceSearchLoadingScreen.tsx`
2. Add experience-themed animations

### Phase 4: Results Screen
1. Create `ExperienceResultsScreen.tsx`
2. Create `ExperienceCard.tsx` component
3. Create `ExperienceDetailSheet.tsx`

### Phase 5: Checkout Screen
1. Create `ExperienceCheckoutScreen.tsx`
2. Create `ExperienceCheckoutScreen.styles.ts`
3. Create `TimeSlotSheet.tsx`
4. Create `TravelerDetailsSheet.tsx`
5. Reuse `PaymentSheet.tsx` from car

### Phase 6: Cleanup
1. Delete old `steps/` folder
2. Update exports in `index.ts`
3. Update flow imports in booking index

---

## UI Consistency Requirements

### Headers
- ImageBackground with overlay
- Back button (semi-transparent circle)
- Title (white text)
- Close button (semi-transparent circle)
- First card overlaps header (marginTop: -30)

### Cards
- White background
- borderRadius: lg (16px)
- Border: 1px gray200
- Shadow for elevation
- Icon in colored circle on left

### Bottom Sheets
- Gray background (gray50)
- White header with rounded corners
- White content cards
- Gradient button at bottom

### Date Picker
- Perfect circle for selected date (40x40, borderRadius: 100)
- Consistent with car/hotel/flight

### Status Bar
- light-content for screens with dark headers
- dark-content for light backgrounds

---

## Files to Create

### Screens (5 files)
1. `ExperienceBookingFlow.tsx`
2. `ExperienceSearchScreen.tsx`
3. `ExperienceSearchLoadingScreen.tsx`
4. `ExperienceResultsScreen.tsx`
5. `ExperienceCheckoutScreen.tsx`
6. `ExperienceCheckoutScreen.styles.ts`

### Sheets (7 files)
1. `LocationPickerSheet.tsx` (adapt from car)
2. `DatePickerSheet.tsx` (reuse from flight)
3. `ParticipantsSheet.tsx`
4. `ExperienceDetailSheet.tsx`
5. `TimeSlotSheet.tsx`
6. `TravelerDetailsSheet.tsx`
7. `PaymentSheet.tsx` (reuse from car)

### Components (5 files)
1. `DestinationField.tsx`
2. `DateField.tsx`
3. `ParticipantsField.tsx`
4. `CategorySelector.tsx`
5. `ExperienceCard.tsx`

### Index Files (3 files)
1. `screens/index.ts`
2. `sheets/index.ts`
3. `components/index.ts`

**Total: ~20 new files, all under 500 lines**

---

## Key Differences from Current Flow

| Aspect | Old (6 Steps) | New (4 Screens) |
|--------|---------------|-----------------|
| Navigation | Step wizard | Screen-based |
| Detail view | Separate step | Bottom sheet |
| Options | Separate step | In checkout |
| Payment | Separate step | Bottom sheet |
| Confirmation | Separate step | Close on success |
| File sizes | 500-1000+ lines | <500 lines each |
| Modals | Inline in steps | Separate sheet files |
| Styles | Inline | Extracted to .styles.ts |

---

## Success Criteria

1. ✅ All files under 500 lines
2. ✅ 4 main screens (search, loading, results, checkout)
3. ✅ Bottom sheets for all selections
4. ✅ Consistent UI with car/hotel/flight flows
5. ✅ Reuse existing components where possible
6. ✅ Plugin architecture pattern
7. ✅ Zustand store for state management
8. ✅ Proper haptic feedback
9. ✅ Smooth animations
10. ✅ Status bar handling

---

## Ready to Implement

This document captures all requirements for the Experience booking flow refactoring.
The implementation will follow the exact patterns established in Car, Flight, and Hotel flows.
