import { Trip, TripState, BookingType, BookingStatus } from '../types/trip.types';

export const mockTrip: Trip = {
  id: '1',
  userId: 'user1',
  title: 'Summer in Bali',
  description: 'Amazing tropical getaway',
  destination: {
    id: 'dest1',
    name: 'Bali',
    city: 'Bali',
    country: 'Indonesia',
    coordinates: { latitude: -8.3405, longitude: 115.0920 }
  },
  startDate: new Date('2025-12-15'),
  endDate: new Date('2025-12-22'),
  state: TripState.UPCOMING,
  coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
  travelers: [
    { 
      id: '1', 
      userId: 'user1', 
      name: 'Daniel', 
      email: 'daniel@example.com', 
      role: 'owner' 
    }
  ],
  bookings: [
    {
      id: 'b1',
      tripId: '1',
      type: BookingType.FLIGHT,
      status: BookingStatus.CONFIRMED,
      provider: 'Singapore Airlines',
      confirmation: 'FL123',
      details: {
        airline: 'Singapore Airlines',
        flightNumber: 'SQ123',
        departure: { 
          airport: 'LAX', 
          time: new Date('2025-12-15T10:00:00') 
        },
        arrival: { 
          airport: 'DPS', 
          time: new Date('2025-12-16T18:00:00') 
        },
        class: 'economy'
      },
      price: { amount: 850, currency: 'USD' },
      bookingDate: new Date('2025-11-01'),
      startDate: new Date('2025-12-15'),
      endDate: new Date('2025-12-16'),
      cancellationPolicy: {
        refundable: true,
        terms: 'Cancel up to 24 hours before departure'
      },
      documents: []
    },
    {
      id: 'b2',
      tripId: '1',
      type: BookingType.HOTEL,
      status: BookingStatus.CONFIRMED,
      provider: 'The Mulia Resort',
      confirmation: 'HT456',
      details: {
        name: 'The Mulia Resort',
        address: 'Jl. Raya Nusa Dua Selatan, Bali',
        checkIn: new Date('2025-12-16'),
        checkOut: new Date('2025-12-22'),
        roomType: 'Ocean View Suite',
        numberOfRooms: 1,
        numberOfGuests: 2,
        amenities: ['Pool', 'Spa', 'Beach Access']
      },
      price: { amount: 1200, currency: 'USD' },
      bookingDate: new Date('2025-11-01'),
      startDate: new Date('2025-12-16'),
      endDate: new Date('2025-12-22'),
      cancellationPolicy: {
        refundable: true,
        terms: 'Free cancellation up to 7 days before check-in'
      },
      documents: []
    },
    {
      id: 'b3',
      tripId: '1',
      type: BookingType.CAR_RENTAL,
      status: BookingStatus.CONFIRMED,
      provider: 'Hertz',
      confirmation: 'CR789',
      details: {
        company: 'Hertz',
        carModel: 'Toyota Avanza',
        pickupLocation: 'DPS Airport',
        pickupTime: new Date('2025-12-16T09:00:00'),
        dropoffLocation: 'DPS Airport',
        dropoffTime: new Date('2025-12-22T10:00:00'),
        insurance: true
      },
      price: { amount: 350, currency: 'USD' },
      bookingDate: new Date('2025-11-01'),
      startDate: new Date('2025-12-16'),
      endDate: new Date('2025-12-22'),
      cancellationPolicy: {
        refundable: true,
        terms: 'Cancel up to 48 hours before pickup'
      },
      documents: []
    },
    {
      id: 'b4',
      tripId: '1',
      type: BookingType.ACTIVITY,
      status: BookingStatus.CONFIRMED,
      provider: 'Bali Adventures',
      confirmation: 'AC101',
      details: {
        name: 'Ubud Rice Terrace Tour',
        description: 'Guided tour through stunning rice terraces',
        location: {
          id: 'loc1',
          name: 'Tegalalang Rice Terrace',
          city: 'Ubud',
          country: 'Indonesia'
        },
        startTime: new Date('2025-12-18T08:00:00'),
        endTime: new Date('2025-12-18T12:00:00'),
        duration: 240,
        category: 'Sightseeing'
      },
      price: { amount: 75, currency: 'USD' },
      bookingDate: new Date('2025-11-01'),
      startDate: new Date('2025-12-18'),
      cancellationPolicy: {
        refundable: true,
        terms: 'Cancel up to 24 hours before activity'
      },
      documents: []
    },
    {
      id: 'b5',
      tripId: '1',
      type: BookingType.ACTIVITY,
      status: BookingStatus.CONFIRMED,
      provider: 'Dive Bali',
      confirmation: 'AC102',
      details: {
        name: 'Scuba Diving Experience',
        description: 'Explore underwater coral reefs',
        location: {
          id: 'loc2',
          name: 'Tulamben Beach',
          city: 'Tulamben',
          country: 'Indonesia'
        },
        startTime: new Date('2025-12-20T07:00:00'),
        endTime: new Date('2025-12-20T10:00:00'),
        duration: 180,
        category: 'Water Sports'
      },
      price: { amount: 125, currency: 'USD' },
      bookingDate: new Date('2025-11-01'),
      startDate: new Date('2025-12-20'),
      cancellationPolicy: {
        refundable: false,
        terms: 'Non-refundable'
      },
      documents: []
    }
  ],
  budget: {
    amount: 3500,
    currency: 'USD'
  },
  metadata: {
    createdAt: new Date('2025-11-01'),
    updatedAt: new Date('2025-11-01'),
    isShared: false,
    shareCount: 0,
    tags: ['beach', 'adventure', 'relaxation']
  }
};
