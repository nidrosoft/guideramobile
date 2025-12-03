/**
 * FLIGHT TYPES
 * 
 * Types specific to flight booking flow.
 */

import { Location, PassengerCount, PriceDisplay, Booking } from './booking.types';

// ============================================
// AIRPORT & AIRLINE
// ============================================

export interface Airport extends Omit<Location, 'type'> {
  type: 'airport';
  code: string;          // IATA code (LAX, JFK)
  city: string;
  timezone: string;
  terminal?: string;
}

export interface Airline {
  code: string;          // IATA code (AA, UA, DL)
  name: string;
  logo: string;
  alliance?: 'star' | 'oneworld' | 'skyteam';
}

// ============================================
// FLIGHT SEGMENT & FLIGHT
// ============================================

export interface FlightSegment {
  id: string;
  flightNumber: string;
  airline: Airline;
  operatingAirline?: Airline;  // If codeshare
  aircraft: string;
  origin: Airport;
  destination: Airport;
  departureTime: Date;
  arrivalTime: Date;
  duration: number;            // minutes
  cabinClass: CabinClass;
  status: FlightStatus;
}

export interface Layover {
  airport: Airport;
  duration: number;            // minutes
  changeTerminal: boolean;
  changeAirport: boolean;
}

export interface Flight {
  id: string;
  segments: FlightSegment[];
  layovers: Layover[];
  totalDuration: number;       // minutes
  stops: number;
  price: PriceDisplay;
  seatsAvailable: number;
  refundable: boolean;
  changeable: boolean;
  changeFee?: number;
  baggageIncluded: BaggageAllowance;
  fareClass: string;
  fareFamily?: string;
}

export type FlightStatus = 
  | 'scheduled' 
  | 'on_time' 
  | 'delayed' 
  | 'boarding' 
  | 'departed' 
  | 'landed' 
  | 'cancelled';

// ============================================
// CABIN CLASS & FARE
// ============================================

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

export interface CabinClassOption {
  class: CabinClass;
  label: string;
  description: string;
  icon: string;
}

export const CABIN_CLASS_OPTIONS: CabinClassOption[] = [
  { class: 'economy', label: 'Economy', description: 'Standard seating', icon: 'airplane' },
  { class: 'premium_economy', label: 'Premium Economy', description: 'Extra legroom', icon: 'airplane' },
  { class: 'business', label: 'Business', description: 'Lie-flat seats', icon: 'briefcase' },
  { class: 'first', label: 'First Class', description: 'Luxury experience', icon: 'crown' },
];

// ============================================
// TRIP TYPE
// ============================================

export type TripType = 'one-way' | 'round-trip' | 'multi-city';

export interface TripTypeOption {
  type: TripType;
  label: string;
  icon: string;
}

export const TRIP_TYPE_OPTIONS: TripTypeOption[] = [
  { type: 'one-way', label: 'One Way', icon: 'arrow-right' },
  { type: 'round-trip', label: 'Round Trip', icon: 'repeat' },
  { type: 'multi-city', label: 'Multi-City', icon: 'route' },
];

// ============================================
// SEAT SELECTION
// ============================================

export type SeatType = 'standard' | 'extra_legroom' | 'exit_row' | 'premium' | 'bulkhead';
export type SeatPosition = 'window' | 'middle' | 'aisle';
export type SeatStatus = 'available' | 'occupied' | 'blocked' | 'selected';

export interface Seat {
  id: string;
  row: number;
  column: string;          // A, B, C, etc.
  type: SeatType;
  position: SeatPosition;
  status: SeatStatus;
  price: number;
  features?: string[];     // e.g., ['extra_legroom', 'power_outlet']
}

export interface SeatMapRow {
  rowNumber: number;
  seats: Seat[];
  isExitRow: boolean;
  isOverWing: boolean;
}

export interface SeatMap {
  flightId: string;
  cabinClass: CabinClass;
  rows: SeatMapRow[];
  legend: SeatLegendItem[];
}

export interface SeatLegendItem {
  type: SeatType | SeatStatus;
  label: string;
  color: string;
  price?: number;
}

// ============================================
// BAGGAGE
// ============================================

export interface BaggageAllowance {
  cabin: BaggageItem;
  checked: BaggageItem;
}

export interface BaggageItem {
  included: boolean;
  quantity: number;
  weight: number;          // kg
  dimensions?: string;     // e.g., "55x40x23 cm"
}

export interface BaggageOption {
  id: string;
  type: 'cabin' | 'checked';
  weight: number;
  quantity: number;
  price: number;
  description: string;
}

// ============================================
// MEALS
// ============================================

export type MealType = 
  | 'standard' 
  | 'vegetarian' 
  | 'vegan' 
  | 'halal' 
  | 'kosher' 
  | 'gluten_free' 
  | 'child' 
  | 'diabetic';

export interface MealOption {
  id: string;
  type: MealType;
  name: string;
  description: string;
  price: number;
  image?: string;
}

// ============================================
// INSURANCE
// ============================================

export interface FlightInsuranceOption {
  id: string;
  name: string;
  description: string;
  coverage: string[];
  price: number;
  pricePerPerson: boolean;
}

// ============================================
// SEARCH PARAMS
// ============================================

export interface FlightSearchParams {
  tripType: TripType;
  origin: Airport | null;
  destination: Airport | null;
  departureDate: Date | null;
  returnDate: Date | null;
  passengers: PassengerCount;
  cabinClass: CabinClass;
  directOnly: boolean;
  flexibleDates: boolean;
}

export interface FlightFilters {
  stops: number[];                    // [0, 1, 2+]
  airlines: string[];                 // Airline codes
  departureTime: { start: string; end: string } | null;
  arrivalTime: { start: string; end: string } | null;
  priceRange: { min: number; max: number } | null;
  duration: number | null;            // Max duration in minutes
  airports: string[];                 // Specific airports
}

// ============================================
// FLIGHT EXTRAS
// ============================================

export interface FlightExtras {
  baggage: BaggageOption[];
  meals: { passengerId: string; meal: MealOption }[];
  seats: { passengerId: string; seat: Seat; leg: 'outbound' | 'return' }[];
  insurance: FlightInsuranceOption | null;
  priorityBoarding: boolean;
  loungeAccess: boolean;
}

// ============================================
// FLIGHT BOOKING
// ============================================

export interface FlightBooking extends Booking {
  type: 'flight';
  searchParams: FlightSearchParams;
  outboundFlight: Flight;
  returnFlight?: Flight;
  extras: FlightExtras;
  eTickets: ETicket[];
}

export interface ETicket {
  id: string;
  passengerId: string;
  passengerName: string;
  ticketNumber: string;
  pnr: string;              // Passenger Name Record
  flights: {
    flightNumber: string;
    departure: string;
    arrival: string;
    date: Date;
    seat?: string;
    boardingGroup?: string;
  }[];
  qrCode: string;
  barcode: string;
}
