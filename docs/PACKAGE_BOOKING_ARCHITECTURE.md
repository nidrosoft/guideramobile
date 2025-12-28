# Package Booking Flow Architecture

## Overview

This document defines the new architecture for the Package Booking Flow, following the established plugin architecture pattern used in Flight, Hotel, Car, and Experience booking flows.

A **Package** is a bundled booking that combines multiple travel components (Flight + Hotel, Flight + Hotel + Car, etc.) with bundle discounts.

---

## Current State Analysis

### Existing Package Flow (To Be Replaced)

```
src/features/booking/flows/package/
├── PackageBookingFlow.tsx (223 lines) - Step-based orchestrator
├── components/
│   ├── BundleCart.tsx
│   ├── CategoryTabs.tsx
│   └── index.ts
├── steps/
│   ├── TripSetupStep.tsx (1194 lines) ❌ Too large
│   ├── BundleBuilderStep.tsx (1231 lines) ❌ Too large
│   ├── ReviewStep.tsx (430 lines)
│   ├── TravelerStep.tsx (399 lines)
│   ├── ExtrasStep.tsx
│   ├── PaymentStep.tsx
│   ├── ConfirmationStep.tsx
│   └── index.ts
└── index.ts
```

### Problems with Current Implementation

1. **Files exceed 500 lines** - TripSetupStep (1194 lines), BundleBuilderStep (1231 lines)
2. **Step-based architecture** - Uses old wizard pattern instead of screen-based
3. **Inline modals** - Location picker, date picker, travelers modal all defined inline
4. **No style extraction** - Styles embedded in component files
5. **Inconsistent with other flows** - Different navigation pattern than Flight/Hotel/Car/Experience

---
## New Architecture

### Directory Structure

```
src/features/booking/flows/package/
├── PackageBookingFlow.tsx (~200 lines) - Modal orchestrator
├── index.ts
├── screens/
│   ├── PackageSearchScreen.tsx (~400 lines)
│   ├── PackageSearchScreen.styles.ts (~200 lines)
│   ├── PackageBuildScreen.tsx (~450 lines)
│   ├── PackageBuildScreen.styles.ts (~250 lines)
│   ├── PackageCheckoutScreen.tsx (~450 lines)
│   ├── PackageCheckoutScreen.styles.ts (~250 lines)
│   └── index.ts
├── sheets/
│   ├── LocationPickerSheet.tsx (~200 lines)
│   ├── DateRangePickerSheet.tsx (~250 lines)
│   ├── TravelersSheet.tsx (~200 lines)
│   ├── FlightSelectionSheet.tsx (~350 lines)
│   ├── HotelSelectionSheet.tsx (~350 lines)
│   ├── CarSelectionSheet.tsx (~300 lines)
│   ├── ExperienceSelectionSheet.tsx (~300 lines)
│   ├── TravelerDetailsSheet.tsx (~300 lines)
│   ├── PaymentSheet.tsx (~350 lines)
│   └── index.ts
├── components/
│   ├── CategoryTabs.tsx (193 lines) ✅ KEEP EXISTING
│   ├── BundleCart.tsx (360 lines) ✅ KEEP EXISTING
│   ├── PackageTypeCard.tsx (~100 lines)
│   ├── PricingBreakdown.tsx (~150 lines)
│   └── index.ts
└── data/
    └── mockData.ts (~200 lines) - Mock data generators
```

**Components to KEEP from current implementation:**
- `CategoryTabs.tsx` (193 lines) - Tabs with completion indicators (✓ and red dot)
- `BundleCart.tsx` (360 lines) - Persistent cart with savings, remove, and continue button

---

## Screen Flow

### User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PACKAGE BOOKING FLOW                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐                                               │
│  │  1. SEARCH       │  Select package type, destination, dates,     │
│  │     SCREEN       │  and travelers                                │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │  2. BUILD        │  Select components based on package type:     │
│  │     SCREEN       │  - Flight (outbound + return)                 │
│  │                  │  - Hotel (+ room)                             │
│  │                  │  - Car (optional based on type)               │
│  │                  │  - Experiences (optional based on type)       │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │  3. CHECKOUT     │  Review, traveler details, extras, payment    │
│  │     SCREEN       │                                               │
│  └──────────────────┘                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Screen Specifications

### Screen 1: PackageSearchScreen

**Purpose**: Initial setup - package type, destination, dates, travelers

**Header**: 
- Background image: `packagebg.png`
- Height: 160px with overlapping first card
- Title: "Build Your Package"
- Close button (X) on right

**Content**:
1. **Package Type Selection** (horizontal scroll cards)
   - Flight + Hotel (Popular)
   - Flight + Hotel + Car
   - Flight + Hotel + Experience
   - All-Inclusive

2. **Origin Field** → Opens LocationPickerSheet
3. **Destination Field** → Opens LocationPickerSheet
4. **Date Range Field** → Opens DateRangePickerSheet
5. **Travelers Field** → Opens TravelersSheet

**Footer**: "Build Your Package" button

**Bottom Sheets**:
- `LocationPickerSheet` - Reuse from hotel/car flows
- `DateRangePickerSheet` - Reuse from hotel flow (check-in/check-out style)
- `TravelersSheet` - Reuse from flight flow (adults, children, infants)

---

### Screen 2: PackageBuildScreen

**Purpose**: Select individual components for the package - **one category at a time, fully confirmed before moving to next**

**Header**:
- Back button (left)
- Title: "Build Package"
- Close button (X) on right

**Content**:
- **CategoryTabs** (REUSE EXISTING - 193 lines)
  - Horizontal scrollable tabs: Flight | Hotel | Car | Experience
  - Only shows tabs for required categories based on package type
  - **Checkmark (✓) indicator** when category is complete
  - **Red dot** when category is required but not yet complete
  - Active tab highlighted with primary color
  - Complete tabs show green success styling
  
- **Category Content Area**:
  - Shows list of options for active category
  - Each item is tappable to select
  - Selected item shows checkmark
  - **User must complete current category before moving to next**

**Footer**: 
- **BundleCart** (REUSE EXISTING - 360 lines)
  - Shows each selected item with name, subtitle, price
  - Remove button (X) to clear selection
  - **Bundle Savings badge** when 2+ categories selected
  - **"Required items" prompt** when not all required categories complete
  - Total price display
  - "Continue" button (disabled until all required categories complete)

**Key UX Flow**:
1. User starts on Flight tab
2. Selects outbound flight → checkmark appears
3. Selects return flight → Flight tab shows complete (✓)
4. Automatically advances to Hotel tab (or user taps it)
5. Selects hotel and room → Hotel tab shows complete (✓)
6. If Car is required, advances to Car tab
7. Once all required categories have ✓, Continue button enables

**Bottom Sheets**:
- `FlightSelectionSheet` - Shows flight options, select outbound + return
- `HotelSelectionSheet` - Shows hotel options with room selection
- `CarSelectionSheet` - Shows car options (if included in package)
- `ExperienceSelectionSheet` - Shows experience options (if included)

---

### Screen 3: PackageCheckoutScreen

**Purpose**: Review, traveler details, extras, and payment

**Header**:
- Background image with package summary
- Back button, Title: "Checkout", Close button

**Content** (ScrollView with sections):

1. **Package Summary Card**
   - Destination, dates, travelers
   - Edit button → goes back to search

2. **Selected Items Summary**
   - Flight summary (tap to view details)
   - Hotel summary (tap to view details)
   - Car summary (if selected)
   - Experiences summary (if selected)

3. **Traveler Details Section**
   - Lead traveler card → Opens TravelerDetailsSheet
   - Additional travelers (expandable)

4. **Extras Section** (Optional add-ons)
   - Travel insurance toggle
   - Airport transfer toggle
   - Priority boarding toggle

5. **Pricing Breakdown**
   - Flight subtotal
   - Hotel subtotal
   - Car subtotal (if applicable)
   - Experiences subtotal (if applicable)
   - Bundle discount (highlighted in green)
   - Taxes & fees
   - **Total**

**Footer**:
- Total price display
- "Pay Now" button → Opens PaymentSheet

**Bottom Sheets**:
- `PackageReviewSheet` - Full package review with edit options
- `TravelerDetailsSheet` - Reuse from experience flow (multi-traveler support)
- `PaymentSheet` - Reuse from other flows

---

## Package Types & Required Categories

| Package Type | Flight | Hotel | Car | Experience |
|--------------|--------|-------|-----|------------|
| Flight + Hotel | ✅ Required | ✅ Required | ❌ | ❌ |
| Flight + Hotel + Car | ✅ Required | ✅ Required | ✅ Required | ❌ |
| Flight + Hotel + Experience | ✅ Required | ✅ Required | ❌ | ✅ Required |
| All-Inclusive | ✅ Required | ✅ Required | ✅ Required | ✅ Required |

---

## Component Specifications

### PackageTypeCard
```typescript
interface PackageTypeCardProps {
  type: PackageTemplate;
  label: string;
  description: string;
  icons: { primary: IconComponent; secondary?: IconComponent };
  isSelected: boolean;
  isPopular?: boolean;
  onSelect: () => void;
}
```

### CategoryProgressBar
```typescript
interface CategoryProgressBarProps {
  categories: PackageCategory[];
  completedCategories: PackageCategory[];
  activeCategory: PackageCategory;
  onCategoryPress: (category: PackageCategory) => void;
}
```

### SelectionSummaryCard
```typescript
interface SelectionSummaryCardProps {
  type: 'flight' | 'hotel' | 'car' | 'experience';
  selection: Flight | Hotel | Car | Experience | null;
  onPress: () => void;
  onClear: () => void;
}
```

### PricingBreakdown
```typescript
interface PricingBreakdownProps {
  pricing: PackagePricing;
  showDiscount?: boolean;
  compact?: boolean;
}
```

---

## State Management

### usePackageStore (Existing - Minor Updates)

The existing `usePackageStore` is well-designed and will be reused with minor updates:

**Keep**:
- `tripSetup` - Origin, destination, dates, travelers, package type
- `selections` - Flight, hotel, car, experiences selections
- `activeCategory` - Current category in build screen
- `pricing` - Calculated pricing with bundle discount
- `extras` - Add-on selections
- `travelers` - Traveler details list
- All existing actions and helpers

**Add**:
- `currentScreen: 'search' | 'build' | 'checkout'` - For flow navigation

---

## Reusable Components from Other Flows

### From Flight Flow
- `TravelerSheet` - Adults/children/infants counter
- `DatePickerSheet` - Calendar date selection

### From Hotel Flow
- `LocationPickerSheet` - City/destination search
- `DatePickerSheet` - Check-in/check-out range

### From Car Flow
- `CarDetailSheet` - Car details display pattern

### From Experience Flow
- `TravelerDetailsSheet` - Multi-traveler form with add/remove
- `PaymentSheet` - Payment form

### Shared Components
- `CancelBookingModal` - Confirmation before closing

---

## UI Consistency Requirements

### Header Pattern
- Height: 160px
- Background image with overlay
- Close button (X) on right for initial screen
- Back + Close buttons for subsequent screens
- Title centered
- First content card overlaps header by 40px

### Status Bar
- `barStyle="light-content"` for white icons

### Cards
- White background
- `borderRadius.lg` (16px)
- Light gray border (`colors.gray200`)
- Subtle shadow

### Buttons
- Primary: Gradient background (primary → primaryDark)
- Disabled: Gray background
- Full width in footer

### Bottom Sheets
- `presentationStyle="pageSheet"` for iOS
- Header with title and close button
- Scrollable content
- Fixed footer with action button

---

## Implementation Plan

### Phase 1: Setup & Search Screen
1. Create new directory structure
2. Create `PackageBookingFlow.tsx` orchestrator
3. Create `PackageSearchScreen.tsx` with overlapping header
4. Create `PackageSearchScreen.styles.ts`
5. Create/reuse bottom sheets (LocationPicker, DateRangePicker, Travelers)
6. Create `PackageTypeCard` component

### Phase 2: Build Screen
1. Create `PackageBuildScreen.tsx`
2. Create `PackageBuildScreen.styles.ts`
3. **REUSE existing `CategoryTabs.tsx`** (193 lines) - Already well-designed with completion indicators
4. **REUSE existing `BundleCart.tsx`** (360 lines) - Persistent cart with savings, remove, and continue
5. Create selection sheets (Flight, Hotel, Car, Experience)
6. Implement category switching and selection logic

### Phase 3: Checkout Screen
1. Create `PackageCheckoutScreen.tsx`
2. Create `PackageCheckoutScreen.styles.ts`
3. Create `PricingBreakdown` component
4. Integrate `TravelerDetailsSheet` from experience flow
5. Integrate `PaymentSheet`
6. Implement booking confirmation

### Phase 4: Cleanup
1. Delete old `steps/` folder
2. Update exports in `index.ts`
3. Update imports in home screen
4. Test complete flow

---

## File Size Targets

| File | Target Lines |
|------|-------------|
| PackageBookingFlow.tsx | ~200 |
| PackageSearchScreen.tsx | ~400 |
| PackageSearchScreen.styles.ts | ~200 |
| PackageBuildScreen.tsx | ~450 |
| PackageBuildScreen.styles.ts | ~250 |
| PackageCheckoutScreen.tsx | ~450 |
| PackageCheckoutScreen.styles.ts | ~250 |
| Each sheet | ~200-350 |
| Each component | ~100-150 |

**Total**: All files under 500 lines ✅

---

## Mock Data Strategy

Move mock data generators to separate file:
- `data/mockData.ts` - Contains all mock generators for flights, hotels, cars, experiences
- Keeps screen files clean and focused on UI logic

---

## Success Criteria

1. ✅ All files under 500 lines
2. ✅ Styles extracted to separate `.styles.ts` files
3. ✅ Follows plugin architecture (screens + sheets + components)
4. ✅ Reuses existing components where possible
5. ✅ Consistent header design with overlapping cards
6. ✅ White status bar icons
7. ✅ Close button on right for initial screen
8. ✅ Back + Close buttons for subsequent screens
9. ✅ Uses shared `CancelBookingModal`
10. ✅ Preserves all business logic (bundle discount, pricing, etc.)

---

## Notes

- The package flow is more complex than single-item flows because it combines multiple booking types
- The "Build" screen is the key differentiator - it's where users select all their package components
- Bundle discount is calculated automatically when 2+ categories are selected
- The existing `usePackageStore` is well-designed and mostly reusable
- Mock data should be moved to a separate file to keep screens clean
