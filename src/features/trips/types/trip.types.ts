/**
 * TRIP TYPES
 * Core type definitions for the trip management system
 */

// Trip States
export enum TripState {
  DRAFT = 'draft',
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  PAST = 'past',
  CANCELLED = 'cancelled',
}

// Booking Types
export enum BookingType {
  FLIGHT = 'flight',
  HOTEL = 'hotel',
  CAR_RENTAL = 'car_rental',
  ACTIVITY = 'activity',
  RESTAURANT = 'restaurant',
  TRANSPORT = 'transport',
}

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

// Core Interfaces
export interface Traveler {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'member';
}

export interface Money {
  amount: number;
  currency: string;
}

export interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface TripMetadata {
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt?: Date;
  isShared: boolean;
  shareCount: number;
  tags: string[];
}

// Booking Interfaces
export interface FlightDetails {
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    time: Date;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: string;
    time: Date;
    terminal?: string;
    gate?: string;
  };
  seatNumber?: string;
  class: 'economy' | 'premium' | 'business' | 'first';
}

export interface HotelDetails {
  name: string;
  address: string;
  checkIn: Date;
  checkOut: Date;
  roomType: string;
  numberOfRooms: number;
  numberOfGuests: number;
  amenities: string[];
}

export interface CarRentalDetails {
  company: string;
  carModel: string;
  pickupLocation: string;
  pickupTime: Date;
  dropoffLocation: string;
  dropoffTime: Date;
  insurance: boolean;
}

export interface ActivityDetails {
  name: string;
  description: string;
  location: Location;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  category: string;
  meetingPoint?: string;
}

export interface CancellationPolicy {
  refundable: boolean;
  deadline?: Date;
  penalty?: Money;
  terms: string;
}

export interface Document {
  id: string;
  type: 'ticket' | 'voucher' | 'confirmation' | 'invoice' | 'other';
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface Booking {
  id: string;
  tripId: string;
  type: BookingType;
  status: BookingStatus;
  provider: string;
  confirmation: string;
  details: FlightDetails | HotelDetails | CarRentalDetails | ActivityDetails;
  price: Money;
  bookingDate: Date;
  startDate: Date;
  endDate?: Date;
  cancellationPolicy: CancellationPolicy;
  documents: Document[];
}

// Main Trip Interface
export interface Trip {
  id: string;
  userId: string;
  state: TripState;
  destination: Location;
  startDate: Date;
  endDate: Date;
  coverImage: string;
  title: string;
  description?: string;
  budget?: Money;
  travelers: Traveler[];
  bookings: Booking[];
  metadata: TripMetadata;
}

// Plugin-related types
export interface PluginData {
  tripId: string;
  pluginId: string;
  data: any;
  version: string;
  updatedAt: Date;
}

// Sharing types
export interface TripPermissions {
  canView: boolean;
  canEdit: boolean;
  canInvite: boolean;
  canManageBookings: boolean;
  plugins: Record<string, 'none' | 'view' | 'edit'>;
}

export interface TripShare {
  id: string;
  tripId: string;
  sharedBy: string;
  sharedWith: string;
  permissions: TripPermissions;
  createdAt: Date;
}

// API Response types
export interface CreateTripData {
  destination: Location;
  startDate: Date;
  endDate: Date;
  title: string;
  coverImage?: string;
  budget?: Money;
}

export interface UpdateTripData {
  destination?: Location;
  startDate?: Date;
  endDate?: Date;
  title?: string;
  coverImage?: string;
  budget?: Money;
  description?: string;
}
