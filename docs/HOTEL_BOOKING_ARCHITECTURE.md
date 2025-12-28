# Hotel Booking Flow Architecture

> **Based on Flight Booking Flow Pattern**  
> **Status:** Ready for Implementation  
> **Last Updated:** December 6, 2025

---

## Overview

This document outlines the new hotel booking flow architecture, modeled after the successful flight booking implementation. The goal is to create a consistent, modular, and reusable booking experience across all booking types.

---

## Flight Flow Analysis (Reference Model)

### Current Flight Flow Structure

```
src/features/booking/flows/flight/
├── FlightBookingFlow.tsx          # Flow orchestrator (3 screens)
├── index.ts                       # Public exports
├── screens/                       # Main screens
│   ├── FlightSearchScreen.tsx     # Search with bottom sheets
│   ├── FlightSearchLoadingScreen.tsx  # Loading animation
│   ├── FlightResultsScreen.tsx    # Results with filters
│   └── FlightCheckoutScreen.tsx   # Combined checkout
├── sheets/                        # Bottom sheet modals
│   ├── AirportPickerSheet.tsx     # Location selection
│   ├── DatePickerSheet.tsx        # Calendar picker
│   ├── TravelerSheet.tsx          # Passenger count
│   ├── ClassSheet.tsx             # Cabin class
│   ├── ChangeTripSheet.tsx        # Edit search
│   ├── FlightDetailSheet.tsx      # Flight info
│   ├── SeatSelectionSheet.tsx     # Seat map
│   ├── ExtrasSheet.tsx            # Baggage, meals
│   ├── TravelerDetailsSheet.tsx   # Passenger info
│   └── PaymentSheet.tsx           # Card form
└── components/                    # Reusable field components
    ├── TripTypeTabs.tsx           # One-way/Round-trip toggle
    ├── LocationField.tsx          # Airport field (color-coded)
    ├── SwapButton.tsx             # Swap origin/dest
    ├── DateField.tsx              # Date display field
    ├── TravelerField.tsx          # Passenger count field
    ├── ClassField.tsx             # Cabin class field
    └── AdditionalOptions.tsx      # Add hotel/car toggles
```

### Flight Flow Screens

| Screen | Purpose | Key Features |
|--------|---------|--------------|
| **Search** | Single-page search form | All fields visible, bottom sheets for selection |
| **Loading** | Animated transition | Airplane animation, progress messages |
| **Results** | Flight list | Date scroll, filters, flight cards |
| **Checkout** | Combined checkout | All sections as bottom sheets |

### Key Design Patterns from Flight

1. **Single-Page Search** - All fields on one screen, tap to open bottom sheets
2. **Background Image Header** - Branded header with overlay
3. **Color-Coded Fields** - Green for departure, Blue for arrival, Orange for dates
4. **Bottom Sheet Architecture** - All selections happen in modal sheets
5. **Loading Animation** - Smooth transition between search and results
6. **Horizontal Date Scroll** - Quick date selection with prices
7. **Filter Chips** - Dropdown filters for sorting/filtering
8. **Checkout Bottom Sheets** - Each section opens a full sheet

---

## New Hotel Flow Architecture

### Folder Structure

```
src/features/booking/flows/hotel/
├── HotelBookingFlow.tsx           # Flow orchestrator
├── index.ts                       # Public exports
├── screens/
│   ├── HotelSearchScreen.tsx      # Search with bottom sheets
│   ├── HotelSearchLoadingScreen.tsx   # Loading animation
│   ├── HotelResultsScreen.tsx     # Results with filters
│   ├── HotelDetailScreen.tsx      # Hotel info + room selection
│   └── HotelCheckoutScreen.tsx    # Combined checkout
├── sheets/
│   ├── LocationPickerSheet.tsx    # City/destination selection
│   ├── DatePickerSheet.tsx        # Check-in/out calendar (REUSE from flight)
│   ├── GuestSheet.tsx             # Rooms & guests selector
│   ├── ChangeSearchSheet.tsx      # Edit search params
│   ├── HotelDetailSheet.tsx       # Full hotel info
│   ├── RoomDetailSheet.tsx        # Room amenities & photos
│   ├── GuestDetailsSheet.tsx      # Guest information form
│   ├── PaymentSheet.tsx           # Payment form (REUSE from flight)
│   └── FilterSheet.tsx            # Hotel filters
└── components/
    ├── DestinationField.tsx       # City/location field
    ├── DateRangeField.tsx         # Check-in/out display
    ├── GuestField.tsx             # Rooms & guests display
    ├── HotelCard.tsx              # Hotel result card
    ├── RoomCard.tsx               # Room type card
    ├── AmenityBadge.tsx           # Amenity icon + label
    ├── RatingStars.tsx            # Star rating display
    └── PricePerNight.tsx          # Price display
```

### Screen Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Search    │───▶│   Loading   │───▶│   Results   │───▶│   Detail    │───▶│  Checkout   │
│   Screen    │    │   Screen    │    │   Screen    │    │   Screen    │    │   Screen    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                                      │                  │                  │
      ▼                                      ▼                  ▼                  ▼
┌─────────────┐                       ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Bottom      │                       │ Filter      │    │ Room        │    │ Guest       │
│ Sheets:     │                       │ Sheet       │    │ Detail      │    │ Details     │
│ - Location  │                       │             │    │ Sheet       │    │ Sheet       │
│ - Dates     │                       └─────────────┘    └─────────────┘    │             │
│ - Guests    │                                                             │ Payment     │
└─────────────┘                                                             │ Sheet       │
                                                                            └─────────────┘
```

---

## Screen Specifications

### 1. HotelSearchScreen

**Layout:**
```
┌─────────────────────────────────────────┐
│  [Hotel Background Image]               │
│  ← Find a Hotel                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📍 Where are you going?         │   │  ← LocationPickerSheet
│  │    Paris, France                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📅 Check-in / Check-out         │   │  ← DatePickerSheet
│  │    Dec 20 - Dec 27              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👥 Guests & Rooms               │   │  ← GuestSheet
│  │    2 Adults, 1 Room             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ☐ Add Flight    ☐ Add Car Rental      │  ← Additional options
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        🔍 Search Hotels         │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Components:**
- `DestinationField` - Purple icon theme (Building icon)
- `DateRangeField` - Orange icon theme (Calendar icon)
- `GuestField` - Blue icon theme (People icon)
- `AdditionalOptions` - Add flight/car toggles (reuse from flight)

**Bottom Sheets:**
- `LocationPickerSheet` - Search cities, popular destinations
- `DatePickerSheet` - Calendar with range selection (reuse from flight)
- `GuestSheet` - Rooms, adults, children counters

---

### 2. HotelSearchLoadingScreen

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│         🏨 Finding Hotels               │
│                                         │
│     [Animated building/hotel icon]      │
│                                         │
│     "Searching for the best stays       │
│      in Paris..."                       │
│                                         │
│     ████████████░░░░░░░░  60%          │
│                                         │
│     • Checking availability             │
│     • Comparing prices                  │
│     • Finding deals                     │
│                                         │
└─────────────────────────────────────────┘
```

**Animation:**
- Hotel/building icon with subtle bounce
- Progress bar with percentage
- Rotating status messages

---

### 3. HotelResultsScreen

**Layout:**
```
┌─────────────────────────────────────────┐
│  [Hotel Background Image]               │
│  ← Paris, France              📅        │  ← Calendar icon for date change
│    Dec 20 - Dec 27 • 2 guests           │
├─────────────────────────────────────────┤
│  ┌───────┐ ┌───────┐ ┌───────┐         │
│  │Dec 20 │ │Dec 21 │ │Dec 22 │ ...     │  ← Horizontal date scroll
│  │ $150  │ │ $145  │ │ $160  │         │
│  └───────┘ └───────┘ └───────┘         │
├─────────────────────────────────────────┤
│  [Sort by ▼] [Price ▼] [Stars ▼] [...]  │  ← Filter chips
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ [Photo]  Hotel Name ⭐⭐⭐⭐     │   │
│  │          Location               │   │
│  │          WiFi • Pool • Spa      │   │
│  │                        $150/nt  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [Photo]  Hotel Name ⭐⭐⭐⭐⭐   │   │
│  │          ...                    │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Components:**
- `HotelCard` - Photo, name, rating, amenities, price
- Date scroll with prices per night
- Filter chips with dropdown options

**Filters:**
- Sort by: Price, Rating, Distance, Popularity
- Price range: Slider or preset ranges
- Star rating: 3★, 4★, 5★
- Amenities: WiFi, Pool, Parking, etc.

---

### 4. HotelDetailScreen

**Layout:**
```
┌─────────────────────────────────────────┐
│  [Hotel Photo Gallery - Swipeable]      │
│  ←                              ♡       │
├─────────────────────────────────────────┤
│  Hotel Grand Paris                      │
│  ⭐⭐⭐⭐ 4.5 (2,345 reviews)            │
│  📍 Champs-Élysées, Paris               │
├─────────────────────────────────────────┤
│  Amenities                              │
│  [WiFi] [Pool] [Spa] [Gym] [Restaurant] │
├─────────────────────────────────────────┤
│  Select Room                            │
│  ┌─────────────────────────────────┐   │
│  │ Standard Room                   │   │
│  │ 2 Guests • 1 King Bed          │   │
│  │ WiFi • AC • TV        $150/nt  │   │
│  │                    [Select →]   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Deluxe Room                     │   │
│  │ ...                             │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │  Total: $1,050 (7 nights)       │   │
│  │  [Continue to Checkout]         │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Components:**
- Photo gallery (swipeable)
- Rating and reviews summary
- Amenities badges
- Room cards with selection
- Price summary footer

**Bottom Sheets:**
- `RoomDetailSheet` - Full room info, photos, amenities
- `HotelDetailSheet` - Full hotel description, policies

---

### 5. HotelCheckoutScreen

**Layout:**
```
┌─────────────────────────────────────────┐
│  [Hotel Background Image]               │
│  ← Checkout                             │
│    Hotel Grand Paris • Dec 20-27        │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🏨 Booking Details         [→] │   │  ← HotelDetailSheet
│  │    Standard Room • 7 nights     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 Guest Details           [→] │   │  ← GuestDetailsSheet
│  │    Add guest information        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 💳 Payment Details         [→] │   │  ← PaymentSheet
│  │    Enter card information       │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │  Total: $1,050                  │   │
│  │  [Complete Booking]             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Bottom Sheets:**
- `HotelDetailSheet` - Booking summary, room details
- `GuestDetailsSheet` - Guest name, email, phone, special requests
- `PaymentSheet` - Card form (reuse from flight)

---

## Reusable Components from Flight

### Components to Reuse Directly

| Component | Flight Location | Hotel Usage |
|-----------|-----------------|-------------|
| `DatePickerSheet` | `/flight/sheets/` | Check-in/out selection |
| `PaymentSheet` | `/flight/sheets/` | Payment form |
| `AdditionalOptions` | `/flight/components/` | Add flight/car toggles |

### Components to Adapt

| Flight Component | Hotel Equivalent | Changes Needed |
|------------------|------------------|----------------|
| `LocationField` | `DestinationField` | Change icon to Building, color to purple |
| `DateField` | `DateRangeField` | Show check-in/out range |
| `TravelerField` | `GuestField` | Add rooms counter |
| `TravelerSheet` | `GuestSheet` | Add rooms, adjust labels |
| `AirportPickerSheet` | `LocationPickerSheet` | Cities instead of airports |
| `FlightCard` | `HotelCard` | Photo, rating, amenities |
| `FlightDetailSheet` | `HotelDetailSheet` | Hotel info layout |
| `TravelerDetailsSheet` | `GuestDetailsSheet` | Guest info fields |
| `FlightSearchLoadingScreen` | `HotelSearchLoadingScreen` | Hotel animation |

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `RoomCard` | Display room type with price |
| `RoomDetailSheet` | Full room information |
| `AmenityBadge` | Icon + label for amenities |
| `RatingStars` | Star rating display |
| `PhotoGallery` | Swipeable hotel photos |
| `FilterSheet` | Hotel-specific filters |

---

## Color Theme for Hotel

Following the flight pattern of color-coded fields:

| Field | Icon | Background | Hex Values |
|-------|------|------------|------------|
| Destination | Building | Purple | Icon: #8B5CF6, BG: #F3E8FF |
| Dates | Calendar | Orange | Icon: #F97316, BG: #FFF7ED |
| Guests | People | Blue | Icon: #3B82F6, BG: #DBEAFE |

---

## State Management

### useHotelStore Updates

```typescript
interface HotelState {
  // Search params
  searchParams: {
    destination: Location | null;
    checkIn: Date | null;
    checkOut: Date | null;
    guests: {
      rooms: number;
      adults: number;
      children: number;
    };
  };
  
  // Results
  searchResults: Hotel[];
  filteredResults: Hotel[];
  isSearching: boolean;
  
  // Filters
  filters: {
    priceRange: [number, number];
    starRating: number[];
    amenities: string[];
    sortBy: 'price' | 'rating' | 'distance' | 'popularity';
  };
  
  // Selection
  selectedHotel: Hotel | null;
  selectedRoom: Room | null;
  
  // Guest info
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialRequests: string;
  };
  
  // Payment
  paymentInfo: PaymentInfo;
  
  // Booking
  bookingReference: string | null;
  bookingConfirmed: boolean;
}
```

---

## Implementation Roadmap

### Phase 1: Core Structure
1. Create new folder structure
2. Create `HotelBookingFlow.tsx` orchestrator
3. Create `HotelSearchScreen.tsx` with fields

### Phase 2: Bottom Sheets
4. Create `LocationPickerSheet.tsx`
5. Adapt `DatePickerSheet.tsx` for hotel (or reuse)
6. Create `GuestSheet.tsx`

### Phase 3: Results & Detail
7. Create `HotelSearchLoadingScreen.tsx`
8. Create `HotelResultsScreen.tsx`
9. Create `HotelCard.tsx` component
10. Create `HotelDetailScreen.tsx`
11. Create `RoomCard.tsx` component

### Phase 4: Checkout
12. Create `HotelCheckoutScreen.tsx`
13. Create `GuestDetailsSheet.tsx`
14. Reuse `PaymentSheet.tsx`
15. Create `HotelDetailSheet.tsx` (booking summary)

### Phase 5: Polish
16. Add animations and transitions
17. Add loading states
18. Test full flow
19. Add error handling

---

## Assets Required

- **Hotel background image** (`hotelbg.png`) - Similar style to flight background
- **Hotel/building icon** - For loading animation
- **Amenity icons** - WiFi, Pool, Spa, Gym, Restaurant, Parking, etc.

---

## Current Hotel Flow Features (Must Preserve)

### SearchStep.tsx Features
- **Destination picker** with search and popular destinations grid
- **Date picker** with check-in/check-out range selection
- **Guest picker** with rooms, adults, children counters
- **Popular destinations** quick-select chips
- **Validation** - requires destination and dates
- **Default dates** - auto-sets tomorrow + 3 days

### ResultsStep.tsx Features
- **Hotel cards** with image, name, rating, location, amenities, price
- **Sort options** - Recommended, Price Low/High, Rating
- **Filter button** (placeholder)
- **Search summary** - destination, dates, nights count
- **Results count** display
- **Loading state** with ActivityIndicator

### HotelDetailStep.tsx Features
- **Image gallery** - horizontal swipeable with indicators
- **Favorite/Share buttons**
- **Star rating** display
- **User rating** with review count
- **Location** with address
- **Amenities** list with icons
- **Hotel description**
- **Check-in/Check-out times**
- **Select Room CTA**

### RoomSelectionStep.tsx Features
- **Room cards** with image, name, occupancy, size, amenities
- **Bed configuration** display
- **Price per night** and total price
- **Breakfast included** indicator
- **Refundable/Non-refundable** badge
- **Room selection** state
- **Continue button** with price summary

### GuestInfoStep.tsx Features
- **Primary guest form** - first name, last name, email, phone
- **Arrival time selector** - time slot options
- **Special requests** text area
- **Form validation**

### PaymentStep.tsx Features
- **Extras selection** - Breakfast, Parking, Airport Transfer, Early Check-in, Late Check-out
- **Price breakdown** - room, extras, taxes, total
- **Card form** - number, expiry, CVV, name
- **Processing state** with spinner
- **Secure payment** indicator

### ConfirmationStep.tsx Features
- **Success animation** - checkmark with spring animation
- **Booking reference** display
- **Hotel summary** - name, dates, room type
- **Guest info** summary
- **Price breakdown** summary
- **Download voucher** button
- **Share booking** button
- **Done button** to close flow

---

## Files to Delete (Old Hotel Flow)

```
src/features/booking/flows/hotel/steps/
├── SearchStep.tsx          # Replace with HotelSearchScreen
├── ResultsStep.tsx         # Replace with HotelResultsScreen
├── HotelDetailStep.tsx     # Replace with HotelDetailScreen
├── RoomSelectionStep.tsx   # Merge into HotelDetailScreen
├── GuestInfoStep.tsx       # Replace with GuestDetailsSheet
├── PaymentStep.tsx         # Replace with PaymentSheet
├── ConfirmationStep.tsx    # Keep or update
└── index.ts
```

---

## Recommended Implementation Approach

### Option A: Build First, Then Replace (RECOMMENDED)

**Why this approach:**
1. **Zero downtime** - Hotel flow remains functional during development
2. **Safe rollback** - If issues arise, old flow still works
3. **Incremental testing** - Test new screens one at a time
4. **Reference available** - Can compare old vs new side-by-side

**Steps:**
1. Create new `screens/` folder alongside existing `steps/`
2. Build new screens one by one
3. Create new `sheets/` folder for bottom sheets
4. Update `HotelBookingFlow.tsx` to use new screens
5. Test complete flow
6. Delete old `steps/` folder

### Option B: Delete and Rebuild

**Risks:**
- Hotel booking completely broken during development
- No reference for existing logic
- Higher pressure to complete quickly

---

## Summary

The new hotel flow will follow the exact same pattern as the flight flow:

1. **Single-page search** with bottom sheet selections
2. **Loading animation** between search and results
3. **Results screen** with date scroll and filters
4. **Detail screen** with room selection
5. **Checkout screen** with all sections as bottom sheets

This ensures:
- **Consistency** across booking types
- **Reusability** of components
- **Maintainability** with modular architecture
- **Great UX** with familiar patterns
