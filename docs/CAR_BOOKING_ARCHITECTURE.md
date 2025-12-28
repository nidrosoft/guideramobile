# Car Booking Flow Architecture

## Overview

This document defines the architecture for the new Car Booking Flow, following the plugin architecture pattern established by Flight and Hotel booking flows. The goal is to consolidate the current 7-step car rental process into a streamlined 4-screen flow while preserving all essential business logic.

---

## Current State Analysis

### Current Car Flow (7 Steps - TO BE DELETED)
```
steps/
├── SearchStep.tsx        (1023 lines) - Pickup/return location, dates, times, driver age
├── ResultsStep.tsx       (489 lines)  - Car list with filters
├── DetailStep.tsx        (482 lines)  - Car details view
├── ExtrasStep.tsx        (505 lines)  - Protection packages & add-ons
├── DriverStep.tsx        (405 lines)  - Driver license & contact info
├── PaymentStep.tsx       (456 lines)  - Payment form & price breakdown
├── ConfirmationStep.tsx  (600 lines)  - Booking confirmation
└── index.ts
```

**Problems with Current Architecture:**
1. Uses step-based navigation with `useBookingFlow` hook (different from flight/hotel)
2. Uses `FlowHeader` component with progress bar (inconsistent)
3. Files are too large (SearchStep is 1023 lines!)
4. Inline modals/pickers instead of reusable sheets
5. No separation of styles into `.styles.ts` files
6. 7 steps is too many - creates friction in booking process

---

## New Architecture Design

### Target Flow (4 Screens)
Following the Flight and Hotel patterns:

```
CarBookingFlow.tsx                    # Main orchestrator (Modal wrapper)
├── screens/
│   ├── CarSearchScreen.tsx           # Search form with bottom sheets
│   ├── CarSearchLoadingScreen.tsx    # Animated loading transition
│   ├── CarResultsScreen.tsx          # Car list with filters/sorting
│   └── CarCheckoutScreen.tsx         # Combined: car details, protection, driver, payment
├── sheets/
│   ├── LocationPickerSheet.tsx       # Pickup/return location selection
│   ├── DateTimePickerSheet.tsx       # Date + time picker (car-specific)
│   ├── DriverAgeSheet.tsx            # Driver age selector
│   ├── CarDetailSheet.tsx            # Full car details view
│   ├── ProtectionSheet.tsx           # Protection package selection
│   ├── ExtrasSheet.tsx               # Add-ons selection (GPS, child seats, etc.)
│   ├── DriverDetailsSheet.tsx        # Driver info form
│   └── PaymentSheet.tsx              # Payment form (reuse from flight if possible)
├── components/
│   ├── LocationField.tsx             # Pickup/return location display
│   ├── DateTimeField.tsx             # Date + time display
│   ├── DriverAgeField.tsx            # Age display with warning
│   ├── CarCard.tsx                   # Car result card
│   ├── ProtectionCard.tsx            # Protection option card
│   └── ExtraItem.tsx                 # Extra/add-on item
└── index.ts
```

---

## Screen Specifications

### 1. CarSearchScreen
**Purpose:** Single-page search form with all fields visible

**Fields:**
- Pickup Location (opens LocationPickerSheet)
- Return Location toggle + field (same/different location)
- Pickup Date & Time (opens DateTimePickerSheet)
- Return Date & Time (opens DateTimePickerSheet)
- Driver Age (opens DriverAgeSheet or inline stepper)

**Components to Create:**
- `LocationField.tsx` - Displays selected location with icon
- `DateTimeField.tsx` - Displays date + time together
- `DriverAgeField.tsx` - Age display with young driver warning

**Sheets to Create:**
- `LocationPickerSheet.tsx` - Search + list of locations (airport/city)
- `DateTimePickerSheet.tsx` - Calendar + time slot picker combined

**Validation:**
- Pickup location required
- Pickup date required
- Return date required (must be after pickup)
- Driver age 18-99

**Navigation:** Search button → CarSearchLoadingScreen

---

### 2. CarSearchLoadingScreen
**Purpose:** Animated transition while "searching" for cars

**Features:**
- Car animation (similar to flight/hotel loading screens)
- Search summary display (location, dates, driver age)
- Auto-transition after 2-3 seconds

**Navigation:** Auto → CarResultsScreen

---

### 3. CarResultsScreen
**Purpose:** Display available cars with filtering and sorting

**Features:**
- Header with search summary (location, dates)
- Filter chips (vehicle type, transmission, price)
- Sort options (price, recommended, size)
- Car cards with key info
- Date scroll for price comparison (optional)

**Components to Create:**
- `CarCard.tsx` - Displays car image, name, specs, price, company

**Sheets to Create:**
- `CarDetailSheet.tsx` - Full car details (specs, features, policies)

**Data from Store:**
- `results` - Array of Car objects
- `filters` - Current filter state
- `sortBy` - Current sort option
- `getFilteredResults()` - Filtered/sorted results

**Navigation:**
- Back → CarSearchScreen
- Select Car → CarCheckoutScreen

---

### 4. CarCheckoutScreen
**Purpose:** Combined checkout with all booking details

**Sections (Collapsible/Expandable):**
1. **Car Summary** - Selected car with image, name, company
2. **Rental Details** - Pickup/return location, dates, times
3. **Protection Package** - Tap to open ProtectionSheet
4. **Extras & Add-ons** - Tap to open ExtrasSheet
5. **Driver Details** - Tap to open DriverDetailsSheet
6. **Price Breakdown** - Dynamic total with all selections
7. **Payment** - Card form or tap to open PaymentSheet

**Sheets to Create:**
- `ProtectionSheet.tsx` - Protection package selection (Basic/Standard/Premium)
- `ExtrasSheet.tsx` - Add-ons with quantity selectors
- `DriverDetailsSheet.tsx` - Driver info form (name, license, contact)
- `PaymentSheet.tsx` - Payment card form (can reuse from flight)

**Modals:**
- `CancelBookingModal` - Reuse from shared components

**Validation:**
- Protection selected (default: Basic)
- Driver details complete
- Payment info valid

**Navigation:**
- Back → CarResultsScreen
- Confirm → Close flow (booking complete)

---

## Data Model (Preserve from useCarStore)

### Search Parameters
```typescript
interface CarSearchState {
  pickupLocation: Location | null;
  returnLocation: Location | null;
  sameReturnLocation: boolean;
  pickupDate: Date | null;
  pickupTime: string;          // "HH:MM" format
  returnDate: Date | null;
  returnTime: string;          // "HH:MM" format
  driverAge: number;           // 18-99
}
```

### Protection Packages (Keep existing)
```typescript
interface ProtectionPackage {
  id: string;                  // 'basic' | 'standard' | 'premium'
  name: string;
  description: string;
  coverage: string[];
  excessAmount: number;
  pricePerDay: number;
  recommended?: boolean;
}
```

### Extras (Keep existing)
```typescript
interface CarExtra {
  id: string;
  name: string;
  description: string;
  pricePerDay: number;
  maxQuantity: number;
  icon: string;
}
```

### Driver Info (Keep existing)
```typescript
interface DriverInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  licenseNumber: string;
  licenseCountry: string;
  licenseExpiry: string;
}
```

### Pricing (Keep existing)
```typescript
interface CarPricing {
  baseRate: number;
  protectionCost: number;
  extrasCost: number;
  airportFee: number;
  taxes: number;
  total: number;
  perDay: number;
  rentalDays: number;
}
```

---

## File Size Guidelines

Following the <500 lines rule:

| File | Target Lines | Notes |
|------|--------------|-------|
| CarBookingFlow.tsx | ~150 | Orchestrator only |
| CarSearchScreen.tsx | ~350 | Search form + sheet triggers |
| CarSearchLoadingScreen.tsx | ~200 | Animation + auto-transition |
| CarResultsScreen.tsx | ~400 | List + filters (styles extracted) |
| CarCheckoutScreen.tsx | ~450 | Combined checkout (styles extracted) |
| Each Sheet | ~200-350 | Single responsibility |
| Each Component | ~100-200 | Reusable UI pieces |

**Style Extraction:**
- `CarResultsScreen.styles.ts`
- `CarCheckoutScreen.styles.ts`
- Other files if they exceed 400 lines

---

## Component Reuse

### From Shared
- `CancelBookingModal` - Cancellation confirmation

### From Flight Flow (Consider Reuse)
- `DatePickerSheet` - Calendar picker (may need time extension)
- `PaymentSheet` - Payment form structure

### From Hotel Flow (Consider Reuse)
- `LocationPickerSheet` - Location search pattern

---

## Store Actions to Preserve

All existing `useCarStore` actions should be preserved:

### Search Actions
- `setPickupLocation(location)`
- `setReturnLocation(location)`
- `setSameReturnLocation(boolean)`
- `setPickupDate(date)`
- `setPickupTime(time)`
- `setReturnDate(date)`
- `setReturnTime(time)`
- `setDriverAge(age)`

### Selection Actions
- `selectCar(car)`
- `selectProtection(protection)`
- `toggleExtra(extra)`
- `setExtraQuantity(extraId, quantity)`

### Driver Actions
- `setPrimaryDriver(driver)`
- `addAdditionalDriver(driver)`
- `removeAdditionalDriver(index)`

### Booking Actions
- `calculatePricing()`
- `confirmBooking()`
- `setBookingReference(ref)`

### Helpers
- `getRentalDays()`
- `getFilteredResults()`
- `isSearchValid()`
- `reset()`

---

## Navigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     CarBookingFlow                          │
│                    (Modal Container)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Search     │───▶│   Loading    │───▶│   Results    │  │
│  │   Screen     │    │   Screen     │    │   Screen     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                       │           │
│         │                                       ▼           │
│         │                              ┌──────────────┐     │
│         │                              │   Checkout   │     │
│         │                              │   Screen     │     │
│         │                              └──────────────┘     │
│         │                                       │           │
│         ▼                                       ▼           │
│    [Close Flow]                          [Confirm Booking]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

### Phase 1: Core Structure
1. Create `CarBookingFlow.tsx` (orchestrator)
2. Create `screens/` directory with index.ts
3. Create `sheets/` directory with index.ts
4. Create `components/` directory with index.ts

### Phase 2: Search Screen
1. `CarSearchScreen.tsx` - Main search form
2. `LocationPickerSheet.tsx` - Location selection
3. `DateTimePickerSheet.tsx` - Date + time picker
4. `LocationField.tsx`, `DateTimeField.tsx`, `DriverAgeField.tsx`

### Phase 3: Loading & Results
1. `CarSearchLoadingScreen.tsx` - Loading animation
2. `CarResultsScreen.tsx` - Car list
3. `CarResultsScreen.styles.ts` - Extracted styles
4. `CarCard.tsx` - Car display component
5. `CarDetailSheet.tsx` - Car details view

### Phase 4: Checkout
1. `CarCheckoutScreen.tsx` - Combined checkout
2. `CarCheckoutScreen.styles.ts` - Extracted styles
3. `ProtectionSheet.tsx` - Protection selection
4. `ExtrasSheet.tsx` - Add-ons selection
5. `DriverDetailsSheet.tsx` - Driver form
6. Integrate `CancelBookingModal` from shared

### Phase 5: Polish
1. Test all navigation paths
2. Verify store integration
3. Ensure animations are smooth
4. Validate all business logic preserved

---

## Business Logic to Preserve

### Young Driver Fee
```typescript
if (searchParams.driverAge < 25) {
  youngDriverFee = 15 * rentalDays;
}
```

### Airport Surcharge
```typescript
const airportFee = searchParams.pickupLocation?.type === 'airport' ? 25 : 0;
```

### Rental Days Calculation
```typescript
const getRentalDays = () => {
  if (!pickupDate || !returnDate) return 1;
  const diff = returnDate.getTime() - pickupDate.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};
```

### Pricing Calculation
```typescript
const total = baseRate + protectionCost + extrasCost + youngDriverFee + airportFee + taxes;
const taxes = (subtotal + airportFee) * 0.12;
```

### Validation Rules
- Pickup location required
- Pickup date required
- Return date required and after pickup date
- Driver age 18-99
- Driver details complete for booking
- Payment info valid for booking

---

## Mock Data Requirements

### Locations (Preserve from SearchStep)
```typescript
const POPULAR_LOCATIONS = [
  { id: '1', name: 'Los Angeles Airport (LAX)', code: 'LAX', type: 'airport' },
  { id: '2', name: 'San Francisco Airport (SFO)', code: 'SFO', type: 'airport' },
  // ... more locations
];
```

### Time Slots (Preserve from SearchStep)
```typescript
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', // ... etc
];
```

### Protection Packages (From useCarStore)
- Basic (included, $1500 excess)
- Standard ($12/day, $500 excess, recommended)
- Premium ($22/day, $0 excess)

### Available Extras (From useCarStore)
- GPS Navigation ($8/day)
- Child seats ($8-10/day)
- Additional driver ($12/day)
- WiFi Hotspot ($10/day)
- Prepaid fuel (one-time)

---

## Files to Delete (After New Implementation)

```
src/features/booking/flows/car/
├── CarRentalFlow.tsx          # DELETE - Replace with new
├── index.ts                   # DELETE - Replace with new
└── steps/                     # DELETE ENTIRE FOLDER
    ├── SearchStep.tsx
    ├── ResultsStep.tsx
    ├── DetailStep.tsx
    ├── ExtrasStep.tsx
    ├── DriverStep.tsx
    ├── PaymentStep.tsx
    ├── ConfirmationStep.tsx
    └── index.ts
```

---

## Summary

The new Car Booking Flow will:
1. **Reduce screens from 7 to 4** - Search, Loading, Results, Checkout
2. **Follow plugin architecture** - Minimal props (visible, onClose)
3. **Use screen orchestrator pattern** - State machine in CarBookingFlow
4. **Leverage bottom sheets** - For all selections and forms
5. **Keep files under 500 lines** - With style extraction
6. **Preserve all business logic** - Driver age, pricing, validation
7. **Reuse shared components** - CancelBookingModal, potentially PaymentSheet
8. **Match Flight/Hotel UX** - Consistent user experience across flows
