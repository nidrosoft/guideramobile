# 🏗️ Guidera Booking Feature Architecture

> **Last Updated:** December 1, 2025  
> **Status:** Implementation Ready  
> **Pattern:** Feature-Based Plugin Architecture

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Folder Structure](#folder-structure)
4. [Feature Modules](#feature-modules)
5. [Flow Orchestrator Pattern](#flow-orchestrator-pattern)
6. [Shared Components](#shared-components)
7. [State Management](#state-management)
8. [Type Definitions](#type-definitions)
9. [Feature Details](#feature-details)
   - [Flight Booking](#flight-booking)
   - [Hotel Booking](#hotel-booking)
   - [Car Rental](#car-rental)
   - [Experiences](#experiences)
   - [Package Deals](#package-deals)
10. [Integration Points](#integration-points)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Progress Tracker](#progress-tracker)

---

## Overview

The Booking feature is a comprehensive travel booking system that allows users to:
- Book flights (one-way, round-trip, multi-city)
- Reserve hotels and accommodations
- Rent cars
- Book local experiences and activities
- Purchase bundled travel packages

### Entry Points

Users can access booking flows from:
1. **Homepage Categories** - Flight, Hotel, Package, Car, Experiences icons
2. **Plan Bottom Sheet** - Quick Trip, Advanced Trip options
3. **Trip Detail** - Add flight/hotel to existing trip
4. **Search Bar** - "Where can we take you?"

---

## Architecture Principles

### 1. **Feature Isolation**
Each booking type (flight, hotel, car, etc.) is a self-contained module with its own:
- Types
- Store
- Components
- Flow steps

### 2. **Step-Based Flows**
Every booking process follows a multi-step wizard pattern:
```
Search → Results → Detail → Selection → Extras → Traveler Info → Payment → Confirmation
```

### 3. **Shared Component Library**
Common UI elements are centralized to ensure:
- Consistent UX across all flows
- DRY (Don't Repeat Yourself) principle
- Single source of truth for styling

### 4. **File Size Limits**
- **Maximum 300 lines** per component file
- **Maximum 400 lines** per screen file
- Split larger components into sub-components

### 5. **State Persistence**
- Zustand stores with persistence for draft bookings
- Users can resume incomplete bookings

---

## Folder Structure

```
src/features/booking/
│
├── index.ts                              # Public API exports
│
├── types/
│   ├── index.ts                          # Re-exports all types
│   ├── booking.types.ts                  # Shared booking types
│   ├── flight.types.ts                   # Flight-specific types
│   ├── hotel.types.ts                    # Hotel-specific types
│   ├── car.types.ts                      # Car rental types
│   ├── experience.types.ts               # Experience types
│   └── package.types.ts                  # Package bundle types
│
├── config/
│   ├── booking.config.ts                 # Feature flags, constants
│   ├── steps.config.ts                   # Step definitions per flow
│   └── api.config.ts                     # API endpoints
│
├── stores/
│   ├── index.ts                          # Store exports
│   ├── useBookingStore.ts                # Shared booking state
│   ├── useFlightStore.ts                 # Flight search/booking state
│   ├── useHotelStore.ts                  # Hotel search/booking state
│   ├── useCarStore.ts                    # Car rental state
│   ├── useExperienceStore.ts             # Experience booking state
│   └── useCartStore.ts                   # Multi-item cart state
│
├── hooks/
│   ├── index.ts                          # Hook exports
│   ├── useBookingFlow.ts                 # Flow navigation logic
│   ├── useFlightSearch.ts                # Flight search API
│   ├── useHotelSearch.ts                 # Hotel search API
│   ├── useCarSearch.ts                   # Car search API
│   ├── useExperienceSearch.ts            # Experience search API
│   ├── usePricing.ts                     # Price calculations
│   └── usePayment.ts                     # Payment processing
│
├── components/
│   ├── index.ts                          # Component exports
│   │
│   ├── shared/                           # Reusable across ALL flows
│   │   ├── BookingHeader.tsx             # Header with back/close
│   │   ├── BookingProgress.tsx           # Step progress indicator
│   │   ├── DateRangePicker.tsx           # Date selection modal
│   │   ├── SingleDatePicker.tsx          # Single date selection
│   │   ├── LocationPicker.tsx            # City/Airport autocomplete
│   │   ├── PassengerSelector.tsx         # Adults/Children/Infants
│   │   ├── GuestSelector.tsx             # Rooms/Guests for hotels
│   │   ├── PriceBreakdown.tsx            # Itemized pricing
│   │   ├── PriceSummaryCard.tsx          # Compact price display
│   │   ├── PaymentForm.tsx               # Card/payment input
│   │   ├── PaymentMethods.tsx            # Payment method selector
│   │   ├── PromoCodeInput.tsx            # Discount code input
│   │   ├── TravelerForm.tsx              # Passenger/guest details
│   │   ├── ContactInfoForm.tsx           # Email/phone input
│   │   ├── ConfirmationCard.tsx          # Booking success card
│   │   ├── BookingTimer.tsx              # Session countdown
│   │   ├── FilterSheet.tsx               # Bottom sheet filters
│   │   ├── SortOptions.tsx               # Sort dropdown
│   │   ├── EmptyResults.tsx              # No results state
│   │   ├── LoadingResults.tsx            # Skeleton loaders
│   │   └── ErrorState.tsx                # Error display
│   │
│   ├── flight/                           # Flight-specific components
│   │   ├── FlightSearchForm.tsx          # Search inputs
│   │   ├── TripTypeSelector.tsx          # One-way/Round/Multi
│   │   ├── CabinClassSelector.tsx        # Economy/Business/First
│   │   ├── FlightCard.tsx                # Flight result card
│   │   ├── FlightCardCompact.tsx         # Compact flight display
│   │   ├── FlightTimeline.tsx            # Departure → Arrival visual
│   │   ├── FlightDetails.tsx             # Full flight info
│   │   ├── LayoverInfo.tsx               # Connection details
│   │   ├── AirlineInfo.tsx               # Airline logo/name
│   │   ├── FlightFilters.tsx             # Filter options
│   │   ├── SeatMap.tsx                   # Interactive seat grid
│   │   ├── SeatLegend.tsx                # Seat type legend
│   │   ├── SeatInfo.tsx                  # Selected seat details
│   │   ├── BaggageSelector.tsx           # Baggage options
│   │   ├── MealSelector.tsx              # In-flight meals
│   │   ├── FlightInsurance.tsx           # Travel insurance
│   │   └── BoardingPass.tsx              # E-ticket display
│   │
│   ├── hotel/                            # Hotel-specific components
│   │   ├── HotelSearchForm.tsx           # Search inputs
│   │   ├── HotelCard.tsx                 # Hotel result card
│   │   ├── HotelCardCompact.tsx          # Compact hotel display
│   │   ├── HotelGallery.tsx              # Photo gallery
│   │   ├── HotelDetails.tsx              # Full hotel info
│   │   ├── RoomCard.tsx                  # Room type card
│   │   ├── RoomDetails.tsx               # Room amenities
│   │   ├── AmenitiesList.tsx             # Hotel amenities
│   │   ├── HotelFilters.tsx              # Filter options
│   │   ├── HotelMap.tsx                  # Location map
│   │   ├── ReviewCard.tsx                # Guest review
│   │   ├── ReviewsList.tsx               # Reviews section
│   │   └── HotelConfirmation.tsx         # Booking voucher
│   │
│   ├── car/                              # Car rental components
│   │   ├── CarSearchForm.tsx             # Search inputs
│   │   ├── CarCard.tsx                   # Car result card
│   │   ├── CarDetails.tsx                # Full car info
│   │   ├── CarGallery.tsx                # Car photos
│   │   ├── CarFeatures.tsx               # Car specs
│   │   ├── CarFilters.tsx                # Filter options
│   │   ├── PickupDropoff.tsx             # Location/time selector
│   │   ├── InsuranceOptions.tsx          # Coverage options
│   │   ├── ExtrasSelector.tsx            # GPS, child seat, etc.
│   │   ├── DriverForm.tsx                # Driver details
│   │   └── RentalAgreement.tsx           # Terms display
│   │
│   └── experience/                       # Experience components
│       ├── ExperienceSearchForm.tsx      # Search inputs
│       ├── ExperienceCard.tsx            # Experience card
│       ├── ExperienceDetails.tsx         # Full details
│       ├── ExperienceGallery.tsx         # Photos
│       ├── TimeSlotPicker.tsx            # Available times
│       ├── ExperienceFilters.tsx         # Filter options
│       ├── HostInfo.tsx                  # Host/guide info
│       ├── IncludedItems.tsx             # What's included
│       ├── MeetingPoint.tsx              # Location info
│       └── ExperienceTicket.tsx          # Booking ticket
│
├── flows/                                # Multi-step booking flows
│   │
│   ├── FlightBookingFlow/
│   │   ├── index.ts                      # Exports
│   │   ├── FlightBookingFlow.tsx         # Flow orchestrator (~200 lines)
│   │   ├── FlightBookingFlow.types.ts    # Flow-specific types
│   │   └── steps/
│   │       ├── index.ts                  # Step exports
│   │       ├── SearchStep.tsx            # Step 1: Search form
│   │       ├── ResultsStep.tsx           # Step 2: Flight list
│   │       ├── FlightDetailStep.tsx      # Step 3: Selected flight
│   │       ├── ReturnFlightStep.tsx      # Step 3b: Return flight (round-trip)
│   │       ├── SeatSelectionStep.tsx     # Step 4: Seat map
│   │       ├── ExtrasStep.tsx            # Step 5: Baggage, meals
│   │       ├── TravelerInfoStep.tsx      # Step 6: Passenger details
│   │       ├── PaymentStep.tsx           # Step 7: Payment
│   │       └── ConfirmationStep.tsx      # Step 8: Success
│   │
│   ├── HotelBookingFlow/
│   │   ├── index.ts
│   │   ├── HotelBookingFlow.tsx
│   │   ├── HotelBookingFlow.types.ts
│   │   └── steps/
│   │       ├── index.ts
│   │       ├── SearchStep.tsx            # Step 1: Search form
│   │       ├── ResultsStep.tsx           # Step 2: Hotel list
│   │       ├── HotelDetailStep.tsx       # Step 3: Hotel info
│   │       ├── RoomSelectionStep.tsx     # Step 4: Room choice
│   │       ├── GuestInfoStep.tsx         # Step 5: Guest details
│   │       ├── PaymentStep.tsx           # Step 6: Payment
│   │       └── ConfirmationStep.tsx      # Step 7: Success
│   │
│   ├── CarRentalFlow/
│   │   ├── index.ts
│   │   ├── CarRentalFlow.tsx
│   │   ├── CarRentalFlow.types.ts
│   │   └── steps/
│   │       ├── index.ts
│   │       ├── SearchStep.tsx            # Step 1: Search form
│   │       ├── ResultsStep.tsx           # Step 2: Car list
│   │       ├── CarDetailStep.tsx         # Step 3: Car info
│   │       ├── ExtrasStep.tsx            # Step 4: Insurance, extras
│   │       ├── DriverInfoStep.tsx        # Step 5: Driver details
│   │       ├── PaymentStep.tsx           # Step 6: Payment
│   │       └── ConfirmationStep.tsx      # Step 7: Success
│   │
│   ├── ExperienceFlow/
│   │   ├── index.ts
│   │   ├── ExperienceFlow.tsx
│   │   ├── ExperienceFlow.types.ts
│   │   └── steps/
│   │       ├── index.ts
│   │       ├── BrowseStep.tsx            # Step 1: Browse/search
│   │       ├── DetailStep.tsx            # Step 2: Experience info
│   │       ├── DateTimeStep.tsx          # Step 3: Select date/time
│   │       ├── ParticipantsStep.tsx      # Step 4: Number of people
│   │       ├── PaymentStep.tsx           # Step 5: Payment
│   │       └── ConfirmationStep.tsx      # Step 6: Success
│   │
│   └── PackageFlow/
│       ├── index.ts
│       ├── PackageFlow.tsx
│       ├── PackageFlow.types.ts
│       └── steps/
│           ├── index.ts
│           ├── DestinationStep.tsx       # Step 1: Where to go
│           ├── DatesStep.tsx             # Step 2: Travel dates
│           ├── FlightStep.tsx            # Step 3: Select flight
│           ├── HotelStep.tsx             # Step 4: Select hotel
│           ├── ExtrasStep.tsx            # Step 5: Add experiences
│           ├── ReviewStep.tsx            # Step 6: Review package
│           ├── TravelerInfoStep.tsx      # Step 7: Traveler details
│           ├── PaymentStep.tsx           # Step 8: Payment
│           └── ConfirmationStep.tsx      # Step 9: Success
│
├── screens/                              # Entry point screens (routes)
│   ├── BookingHubScreen.tsx              # Main booking dashboard
│   ├── FlightSearchScreen.tsx            # Flight search entry
│   ├── HotelSearchScreen.tsx             # Hotel search entry
│   ├── CarSearchScreen.tsx               # Car search entry
│   ├── ExperienceSearchScreen.tsx        # Experience search entry
│   └── PackageSearchScreen.tsx           # Package search entry
│
├── data/
│   ├── mockFlights.ts                    # Mock flight data
│   ├── mockHotels.ts                     # Mock hotel data
│   ├── mockCars.ts                       # Mock car data
│   ├── mockExperiences.ts                # Mock experience data
│   ├── airports.ts                       # Airport codes/names
│   ├── airlines.ts                       # Airline data
│   └── cities.ts                         # City data
│
└── utils/
    ├── formatters.ts                     # Price, date, time formatters
    ├── validators.ts                     # Form validation
    ├── calculations.ts                   # Price calculations
    └── helpers.ts                        # Utility functions
```

---

## Flow Orchestrator Pattern

Each booking flow uses a consistent orchestrator pattern:

```typescript
// Example: FlightBookingFlow.tsx

import { useState, useCallback } from 'react';
import { Modal, View } from 'react-native';
import { useFlightStore } from '../../stores';
import { FLIGHT_STEPS } from '../../config/steps.config';
import BookingProgress from '../../components/shared/BookingProgress';

// Step components
import {
  SearchStep,
  ResultsStep,
  FlightDetailStep,
  SeatSelectionStep,
  ExtrasStep,
  TravelerInfoStep,
  PaymentStep,
  ConfirmationStep,
} from './steps';

interface FlightBookingFlowProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (booking: FlightBooking) => void;
  initialData?: Partial<FlightSearchParams>;
}

export default function FlightBookingFlow({
  visible,
  onClose,
  onComplete,
  initialData,
}: FlightBookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const store = useFlightStore();

  const steps = [
    { id: 'search', component: SearchStep, title: 'Search' },
    { id: 'results', component: ResultsStep, title: 'Flights' },
    { id: 'detail', component: FlightDetailStep, title: 'Details' },
    { id: 'seats', component: SeatSelectionStep, title: 'Seats' },
    { id: 'extras', component: ExtrasStep, title: 'Extras' },
    { id: 'travelers', component: TravelerInfoStep, title: 'Travelers' },
    { id: 'payment', component: PaymentStep, title: 'Payment' },
    { id: 'confirmation', component: ConfirmationStep, title: 'Done' },
  ];

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      onClose();
    }
  }, [currentStep, onClose]);

  const goToStep = useCallback((stepId: string) => {
    const index = steps.findIndex(s => s.id === stepId);
    if (index !== -1) setCurrentStep(index);
  }, []);

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1 }}>
        <BookingProgress
          steps={steps}
          currentStep={currentStep}
          onBack={goBack}
          onClose={onClose}
        />
        
        <CurrentStepComponent
          onNext={goNext}
          onBack={goBack}
          onGoToStep={goToStep}
          isLastStep={currentStep === steps.length - 1}
        />
      </View>
    </Modal>
  );
}
```

---

## Shared Components

### Component Communication Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLOW ORCHESTRATOR                        │
│  - Manages step navigation                                       │
│  - Provides onNext, onBack, onGoToStep callbacks                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          STEP COMPONENT                          │
│  - Receives navigation callbacks as props                       │
│  - Reads/writes to Zustand store                                │
│  - Composes shared + feature-specific components                │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Shared Component│ │Feature Component│ │ Zustand Store   │
│ (DatePicker)    │ │ (FlightCard)    │ │ (useFlightStore)│
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Shared Component Props Pattern

```typescript
// All shared components follow this pattern:

interface DateRangePickerProps {
  // Values
  startDate: Date | null;
  endDate: Date | null;
  
  // Callbacks
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  
  // Configuration
  minDate?: Date;
  maxDate?: Date;
  
  // Styling
  style?: ViewStyle;
}

interface LocationPickerProps {
  // Values
  value: Location | null;
  
  // Callbacks
  onChange: (location: Location) => void;
  
  // Configuration
  type: 'airport' | 'city' | 'hotel';
  placeholder?: string;
  
  // Styling
  style?: ViewStyle;
}
```

---

## State Management

### Store Structure

```typescript
// stores/useFlightStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FlightState {
  // Search Parameters
  searchParams: {
    tripType: 'one-way' | 'round-trip' | 'multi-city';
    origin: Airport | null;
    destination: Airport | null;
    departureDate: Date | null;
    returnDate: Date | null;
    passengers: {
      adults: number;
      children: number;
      infants: number;
    };
    cabinClass: 'economy' | 'premium' | 'business' | 'first';
  };
  
  // Search Results
  searchResults: Flight[];
  isSearching: boolean;
  searchError: string | null;
  
  // Selected Items
  selectedOutboundFlight: Flight | null;
  selectedReturnFlight: Flight | null;
  selectedSeats: {
    outbound: Seat[];
    return: Seat[];
  };
  
  // Extras
  extras: {
    baggage: BaggageOption[];
    meals: MealOption[];
    insurance: InsuranceOption | null;
  };
  
  // Travelers
  travelers: Traveler[];
  contactInfo: ContactInfo | null;
  
  // Booking
  bookingReference: string | null;
  totalPrice: number;
  
  // Actions
  setSearchParams: (params: Partial<SearchParams>) => void;
  searchFlights: () => Promise<void>;
  selectOutboundFlight: (flight: Flight) => void;
  selectReturnFlight: (flight: Flight) => void;
  selectSeat: (seat: Seat, leg: 'outbound' | 'return') => void;
  addExtra: (type: 'baggage' | 'meal', option: any) => void;
  setTravelers: (travelers: Traveler[]) => void;
  setContactInfo: (info: ContactInfo) => void;
  calculateTotal: () => number;
  reset: () => void;
}

export const useFlightStore = create<FlightState>()(
  persist(
    (set, get) => ({
      // Initial state
      searchParams: {
        tripType: 'round-trip',
        origin: null,
        destination: null,
        departureDate: null,
        returnDate: null,
        passengers: { adults: 1, children: 0, infants: 0 },
        cabinClass: 'economy',
      },
      searchResults: [],
      isSearching: false,
      // ... rest of state
      
      // Actions
      setSearchParams: (params) => 
        set((state) => ({
          searchParams: { ...state.searchParams, ...params }
        })),
        
      searchFlights: async () => {
        set({ isSearching: true, searchError: null });
        try {
          // API call here
          const results = await flightAPI.search(get().searchParams);
          set({ searchResults: results, isSearching: false });
        } catch (error) {
          set({ searchError: error.message, isSearching: false });
        }
      },
      
      // ... rest of actions
    }),
    {
      name: 'flight-booking-storage',
      partialize: (state) => ({
        searchParams: state.searchParams,
        // Only persist what's needed for draft recovery
      }),
    }
  )
);
```

---

## Type Definitions

### Core Types

```typescript
// types/booking.types.ts

export interface Location {
  id: string;
  name: string;
  code?: string;        // Airport/city code
  type: 'airport' | 'city' | 'hotel' | 'address';
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Traveler {
  id: string;
  type: 'adult' | 'child' | 'infant';
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  nationality: string;
  passport?: {
    number: string;
    expiryDate: Date;
    issuingCountry: string;
  };
}

export interface ContactInfo {
  email: string;
  phone: string;
  countryCode: string;
}

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  card?: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  };
}

export interface PriceBreakdown {
  basePrice: number;
  taxes: number;
  fees: number;
  extras: number;
  discount: number;
  total: number;
  currency: string;
}

export interface Booking {
  id: string;
  type: 'flight' | 'hotel' | 'car' | 'experience' | 'package';
  status: 'pending' | 'confirmed' | 'cancelled';
  reference: string;
  createdAt: Date;
  travelers: Traveler[];
  contactInfo: ContactInfo;
  payment: {
    method: PaymentMethod;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
  };
  priceBreakdown: PriceBreakdown;
}
```

### Flight Types

```typescript
// types/flight.types.ts

export interface Airport extends Location {
  type: 'airport';
  code: string;          // IATA code (LAX, JFK)
  city: string;
  timezone: string;
}

export interface Airline {
  code: string;          // IATA code (AA, UA)
  name: string;
  logo: string;
}

export interface FlightSegment {
  id: string;
  flightNumber: string;
  airline: Airline;
  aircraft: string;
  origin: Airport;
  destination: Airport;
  departureTime: Date;
  arrivalTime: Date;
  duration: number;      // minutes
  cabinClass: CabinClass;
  status: 'scheduled' | 'delayed' | 'cancelled';
}

export interface Flight {
  id: string;
  segments: FlightSegment[];
  totalDuration: number;
  stops: number;
  price: {
    amount: number;
    currency: string;
    perPerson: boolean;
  };
  seatsAvailable: number;
  refundable: boolean;
  baggageIncluded: {
    cabin: string;
    checked: string;
  };
}

export interface Seat {
  id: string;
  row: number;
  column: string;        // A, B, C, etc.
  type: 'standard' | 'extra_legroom' | 'exit_row' | 'premium';
  position: 'window' | 'middle' | 'aisle';
  available: boolean;
  price: number;
}

export interface FlightSearchParams {
  tripType: 'one-way' | 'round-trip' | 'multi-city';
  origin: Airport;
  destination: Airport;
  departureDate: Date;
  returnDate?: Date;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  cabinClass: CabinClass;
  directOnly?: boolean;
  flexibleDates?: boolean;
}

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';
```

### Hotel Types

```typescript
// types/hotel.types.ts

export interface Hotel {
  id: string;
  name: string;
  description: string;
  starRating: number;
  userRating: number;
  reviewCount: number;
  images: string[];
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  amenities: Amenity[];
  rooms: Room[];
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
  };
  pricePerNight: {
    amount: number;
    currency: string;
  };
}

export interface Room {
  id: string;
  name: string;
  description: string;
  images: string[];
  maxOccupancy: number;
  bedType: string;
  size: number;          // sqm
  amenities: string[];
  price: {
    amount: number;
    currency: string;
    perNight: boolean;
  };
  available: number;
  refundable: boolean;
  breakfast: boolean;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: 'general' | 'room' | 'bathroom' | 'outdoor' | 'food' | 'wellness';
}

export interface HotelSearchParams {
  destination: Location;
  checkIn: Date;
  checkOut: Date;
  rooms: number;
  guests: {
    adults: number;
    children: number;
  };
  starRating?: number[];
  priceRange?: { min: number; max: number };
  amenities?: string[];
}
```

### Car Types

```typescript
// types/car.types.ts

export interface Car {
  id: string;
  name: string;
  category: CarCategory;
  make: string;
  model: string;
  year: number;
  images: string[];
  features: CarFeature[];
  specs: {
    seats: number;
    doors: number;
    luggage: number;
    transmission: 'automatic' | 'manual';
    fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    airConditioning: boolean;
  };
  rental: {
    company: RentalCompany;
    pricePerDay: number;
    currency: string;
    mileage: 'unlimited' | number;
    insurance: InsuranceOption[];
  };
  available: boolean;
}

export type CarCategory = 
  | 'economy' 
  | 'compact' 
  | 'midsize' 
  | 'fullsize' 
  | 'suv' 
  | 'luxury' 
  | 'van' 
  | 'convertible';

export interface CarSearchParams {
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupDate: Date;
  pickupTime: string;
  dropoffDate: Date;
  dropoffTime: string;
  driverAge: number;
  category?: CarCategory[];
}
```

### Experience Types

```typescript
// types/experience.types.ts

export interface Experience {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  images: string[];
  category: ExperienceCategory;
  duration: number;        // minutes
  location: Location;
  host: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    reviewCount: number;
    languages: string[];
  };
  price: {
    amount: number;
    currency: string;
    perPerson: boolean;
  };
  rating: number;
  reviewCount: number;
  maxParticipants: number;
  includes: string[];
  notIncluded: string[];
  requirements: string[];
  meetingPoint: {
    address: string;
    instructions: string;
    coordinates: { lat: number; lng: number };
  };
  availability: TimeSlot[];
  cancellationPolicy: string;
}

export type ExperienceCategory = 
  | 'tours' 
  | 'food' 
  | 'adventure' 
  | 'culture' 
  | 'wellness' 
  | 'nature' 
  | 'nightlife' 
  | 'classes';

export interface TimeSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  spotsAvailable: number;
}
```

---

## Feature Details

### Flight Booking

#### Screens & Steps

| Step | Screen | Purpose | Key Components |
|------|--------|---------|----------------|
| 1 | SearchStep | Enter search criteria | TripTypeSelector, LocationPicker, DateRangePicker, PassengerSelector, CabinClassSelector |
| 2 | ResultsStep | View & filter flights | FlightCard, FlightFilters, SortOptions, LoadingResults |
| 3 | FlightDetailStep | Review selected flight | FlightDetails, FlightTimeline, LayoverInfo, PriceBreakdown |
| 3b | ReturnFlightStep | Select return flight (round-trip) | FlightCard, FlightFilters |
| 4 | SeatSelectionStep | Choose seats | SeatMap, SeatLegend, SeatInfo |
| 5 | ExtrasStep | Add baggage, meals | BaggageSelector, MealSelector, FlightInsurance |
| 6 | TravelerInfoStep | Enter passenger details | TravelerForm, ContactInfoForm |
| 7 | PaymentStep | Complete payment | PaymentForm, PromoCodeInput, PriceBreakdown |
| 8 | ConfirmationStep | Booking success | ConfirmationCard, BoardingPass |

#### User Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SEARCH    │────▶│   RESULTS   │────▶│   DETAIL    │
│  One-way/   │     │  Filter &   │     │  Review     │
│  Round-trip │     │  Sort       │     │  Flight     │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
              ┌─────────────┐     ┌─────────────┐
              │   SEATS     │────▶│   EXTRAS    │
              │  Select     │     │  Baggage,   │
              │  Seats      │     │  Meals      │
              └─────────────┘     └─────────────┘
                                        │
              ┌─────────────────────────┘
              ▼
        ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
        │  TRAVELERS  │────▶│   PAYMENT   │────▶│ CONFIRMATION│
        │  Passenger  │     │  Card/Pay   │     │  E-Ticket   │
        │  Details    │     │             │     │             │
        └─────────────┘     └─────────────┘     └─────────────┘
```

---

### Hotel Booking

#### Screens & Steps

| Step | Screen | Purpose | Key Components |
|------|--------|---------|----------------|
| 1 | SearchStep | Enter search criteria | LocationPicker, DateRangePicker, GuestSelector |
| 2 | ResultsStep | View & filter hotels | HotelCard, HotelFilters, HotelMap, SortOptions |
| 3 | HotelDetailStep | Review hotel details | HotelGallery, HotelDetails, AmenitiesList, ReviewsList |
| 4 | RoomSelectionStep | Choose room type | RoomCard, RoomDetails |
| 5 | GuestInfoStep | Enter guest details | TravelerForm, ContactInfoForm |
| 6 | PaymentStep | Complete payment | PaymentForm, PromoCodeInput, PriceBreakdown |
| 7 | ConfirmationStep | Booking success | ConfirmationCard, HotelConfirmation |

---

### Car Rental

#### Screens & Steps

| Step | Screen | Purpose | Key Components |
|------|--------|---------|----------------|
| 1 | SearchStep | Enter rental criteria | LocationPicker, DateRangePicker, PickupDropoff |
| 2 | ResultsStep | View & filter cars | CarCard, CarFilters, SortOptions |
| 3 | CarDetailStep | Review car details | CarGallery, CarDetails, CarFeatures |
| 4 | ExtrasStep | Add insurance, extras | InsuranceOptions, ExtrasSelector |
| 5 | DriverInfoStep | Enter driver details | DriverForm, ContactInfoForm |
| 6 | PaymentStep | Complete payment | PaymentForm, PriceBreakdown |
| 7 | ConfirmationStep | Booking success | ConfirmationCard, RentalAgreement |

---

### Experiences

#### Screens & Steps

| Step | Screen | Purpose | Key Components |
|------|--------|---------|----------------|
| 1 | BrowseStep | Browse experiences | ExperienceCard, ExperienceFilters, CategoryTabs |
| 2 | DetailStep | View experience details | ExperienceGallery, ExperienceDetails, HostInfo, ReviewsList |
| 3 | DateTimeStep | Select date & time | TimeSlotPicker, SingleDatePicker |
| 4 | ParticipantsStep | Number of participants | PassengerSelector, PriceBreakdown |
| 5 | PaymentStep | Complete payment | PaymentForm, PriceBreakdown |
| 6 | ConfirmationStep | Booking success | ConfirmationCard, ExperienceTicket |

---

### Package Deals

#### Screens & Steps

| Step | Screen | Purpose | Key Components |
|------|--------|---------|----------------|
| 1 | DestinationStep | Choose destination | LocationPicker, PopularDestinations |
| 2 | DatesStep | Select travel dates | DateRangePicker, FlexibleDates |
| 3 | FlightStep | Select flight | FlightCard (embedded), FlightFilters |
| 4 | HotelStep | Select hotel | HotelCard (embedded), HotelFilters |
| 5 | ExtrasStep | Add experiences | ExperienceCard (embedded), CarCard (optional) |
| 6 | ReviewStep | Review package | PackageSummary, PriceBreakdown |
| 7 | TravelerInfoStep | Enter details | TravelerForm, ContactInfoForm |
| 8 | PaymentStep | Complete payment | PaymentForm, PriceBreakdown |
| 9 | ConfirmationStep | Booking success | ConfirmationCard, PackageItinerary |

---

## Integration Points

### Homepage Integration

```typescript
// src/data/categories.ts - Already exists
export const categories = [
  { id: 1, name: 'Plan', icon: Location },      // → PlanBottomSheet
  { id: 2, name: 'Flight', icon: Airplane },    // → FlightBookingFlow
  { id: 3, name: 'Hotel', icon: Building },     // → HotelBookingFlow
  { id: 4, name: 'Package', icon: Box },        // → PackageFlow
  { id: 5, name: 'Car', icon: Car },            // → CarRentalFlow
  { id: 6, name: 'Experiences', icon: Map1 },   // → ExperienceFlow
];
```

### Route Structure

```
src/app/booking/
├── index.tsx                    # Booking hub
├── flights/
│   ├── index.tsx               # Flight search entry
│   ├── search.tsx              # Search screen
│   ├── results.tsx             # Results screen
│   ├── [id].tsx                # Flight detail
│   ├── seats.tsx               # Seat selection
│   ├── extras.tsx              # Extras
│   ├── travelers.tsx           # Traveler info
│   ├── payment.tsx             # Payment
│   └── confirmation.tsx        # Confirmation
├── hotels/
│   ├── index.tsx
│   ├── search.tsx
│   ├── results.tsx
│   ├── [id].tsx
│   ├── rooms.tsx
│   ├── guests.tsx
│   ├── payment.tsx
│   └── confirmation.tsx
├── cars/
│   └── ... (similar structure)
├── experiences/
│   └── ... (similar structure)
└── packages/
    └── ... (similar structure)
```

### Trip Integration

Bookings can be added to existing trips:

```typescript
// After booking confirmation
const addToTrip = (booking: Booking, tripId: string) => {
  // Add flight/hotel/car to trip itinerary
  tripStore.addBooking(tripId, booking);
};
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create `/features/booking/` folder structure
- [ ] Define all type definitions
- [ ] Create Zustand stores (empty shells)
- [ ] Build shared components:
  - [ ] BookingHeader
  - [ ] BookingProgress
  - [ ] DateRangePicker
  - [ ] LocationPicker
  - [ ] PassengerSelector
  - [ ] PriceBreakdown
  - [ ] PaymentForm

### Phase 2: Flight Booking (Week 2-3)
- [ ] FlightBookingFlow orchestrator
- [ ] SearchStep with all inputs
- [ ] ResultsStep with mock data
- [ ] FlightDetailStep
- [ ] SeatSelectionStep (interactive map)
- [ ] ExtrasStep (baggage, meals)
- [ ] TravelerInfoStep
- [ ] PaymentStep
- [ ] ConfirmationStep
- [ ] Connect to homepage category

### Phase 3: Hotel Booking (Week 3-4)
- [ ] HotelBookingFlow orchestrator
- [ ] All hotel steps
- [ ] Hotel-specific components
- [ ] Connect to homepage

### Phase 4: Car Rental (Week 4)
- [ ] CarRentalFlow orchestrator
- [ ] All car steps
- [ ] Car-specific components
- [ ] Connect to homepage

### Phase 5: Experiences (Week 5)
- [ ] ExperienceFlow orchestrator
- [ ] All experience steps
- [ ] Experience-specific components
- [ ] Connect to homepage

### Phase 6: Packages (Week 5-6)
- [ ] PackageFlow orchestrator
- [ ] All package steps
- [ ] Bundle pricing logic
- [ ] Connect to homepage

---

## Progress Tracker

### Overall Progress

| Feature | Status | Progress |
|---------|--------|----------|
| Foundation | 🟢 Complete | 100% |
| Flight Booking | � Complete | 100% |
| Hotel Booking | 🔴 Not Started | 0% |
| Car Rental | 🔴 Not Started | 0% |
| Experiences | 🔴 Not Started | 0% |
| Packages | 🔴 Not Started | 0% |

### Detailed Progress

#### Foundation
- [x] Types defined (booking, flight, hotel, car, experience, package)
- [x] Stores created (useBookingStore, useFlightStore)
- [x] Shared components built (BookingHeader, BookingProgress, DateRangePicker, PassengerSelector, PriceBreakdown)
- [x] Hooks implemented (useBookingFlow, usePricing)
- [x] Config files created (booking.config, steps.config)

#### Flight Booking
- [x] Flow orchestrator
- [x] Step 1: Search
- [x] Step 2: Results
- [x] Step 3: Detail
- [x] Step 4: Seats
- [x] Step 5: Extras
- [x] Step 6: Travelers
- [x] Step 7: Payment
- [x] Step 8: Confirmation
- [x] Homepage integration

#### Hotel Booking
- [ ] Flow orchestrator
- [ ] Step 1: Search
- [ ] Step 2: Results
- [ ] Step 3: Detail
- [ ] Step 4: Rooms
- [ ] Step 5: Guests
- [ ] Step 6: Payment
- [ ] Step 7: Confirmation
- [ ] Homepage integration

#### Car Rental
- [ ] Flow orchestrator
- [ ] Step 1: Search
- [ ] Step 2: Results
- [ ] Step 3: Detail
- [ ] Step 4: Extras
- [ ] Step 5: Driver
- [ ] Step 6: Payment
- [ ] Step 7: Confirmation
- [ ] Homepage integration

#### Experiences
- [ ] Flow orchestrator
- [ ] Step 1: Browse
- [ ] Step 2: Detail
- [ ] Step 3: DateTime
- [ ] Step 4: Participants
- [ ] Step 5: Payment
- [ ] Step 6: Confirmation
- [ ] Homepage integration

#### Packages
- [ ] Flow orchestrator
- [ ] Step 1: Destination
- [ ] Step 2: Dates
- [ ] Step 3: Flight
- [ ] Step 4: Hotel
- [ ] Step 5: Extras
- [ ] Step 6: Review
- [ ] Step 7: Travelers
- [ ] Step 8: Payment
- [ ] Step 9: Confirmation
- [ ] Homepage integration

---

## Notes & Decisions

### Design Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Dec 1, 2025 | Use step-based flow pattern | Matches existing trip-import pattern, proven to work |
| Dec 1, 2025 | Zustand for state management | Already used in app, supports persistence |
| Dec 1, 2025 | Max 300 lines per component | Maintainability, readability |
| Dec 1, 2025 | Shared components first | Enables parallel development of flows |

### Open Questions

1. **API Integration**: Which flight/hotel APIs will we use? (Amadeus, Skyscanner, etc.)
2. **Payment Provider**: Stripe? Apple Pay? Google Pay?
3. **Offline Support**: Should draft bookings work offline?
4. **Multi-currency**: Support for currency conversion?

### Future Enhancements

- [ ] Price alerts for flights
- [ ] Saved searches
- [ ] Booking history
- [ ] Loyalty program integration
- [ ] Group bookings
- [ ] Corporate travel features

---

> **Last Updated:** December 1, 2025  
> **Next Review:** After Phase 1 completion
