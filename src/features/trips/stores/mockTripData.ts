import { Trip, TripState, BookingType, BookingStatus } from '../types/trip.types';

// Colombia Trip - AI Generated Content (Claude Opus 4.5)
export const colombiaTrip: Trip = {
  id: '2',
  userId: 'user1',
  title: 'Colombia Adventure',
  description: 'Explore the vibrant culture, stunning landscapes, and rich coffee heritage of Colombia',
  destination: {
    id: 'dest2',
    name: 'Colombia',
    city: 'Bogota',
    country: 'Colombia',
    coordinates: { latitude: 4.7110, longitude: -74.0721 }
  },
  startDate: new Date('2025-02-15'),
  endDate: new Date('2025-02-25'),
  state: TripState.UPCOMING,
  coverImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800',
  travelers: [
    { 
      id: '1', 
      userId: 'user1', 
      name: 'Cyriac', 
      email: 'nidrosoft@outlook.com', 
      role: 'owner' 
    }
  ],
  bookings: [
    {
      id: 'col-b1',
      tripId: '2',
      type: BookingType.FLIGHT,
      status: BookingStatus.CONFIRMED,
      provider: 'Avianca',
      confirmation: 'AV2025COL',
      details: {
        airline: 'Avianca',
        flightNumber: 'AV123',
        departure: { 
          airport: 'MIA', 
          time: new Date('2025-02-15T08:00:00') 
        },
        arrival: { 
          airport: 'BOG', 
          time: new Date('2025-02-15T12:30:00') 
        },
        class: 'economy'
      },
      price: { amount: 450, currency: 'USD' },
      bookingDate: new Date('2025-01-15'),
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-02-15'),
      cancellationPolicy: {
        refundable: true,
        terms: 'Cancel up to 24 hours before departure'
      },
      documents: []
    },
    {
      id: 'col-b2',
      tripId: '2',
      type: BookingType.HOTEL,
      status: BookingStatus.CONFIRMED,
      provider: 'Hotel Dann Carlton',
      confirmation: 'HC789BOG',
      details: {
        name: 'Hotel Dann Carlton Bogota',
        address: 'Cra. 15 #103-60, Bogota',
        checkIn: new Date('2025-02-15'),
        checkOut: new Date('2025-02-18'),
        roomType: 'Superior Room',
        numberOfRooms: 1,
        numberOfGuests: 1,
        amenities: ['WiFi', 'Gym', 'Restaurant', 'Room Service']
      },
      price: { amount: 320, currency: 'USD' },
      bookingDate: new Date('2025-01-15'),
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-02-18'),
      cancellationPolicy: {
        refundable: true,
        terms: 'Free cancellation up to 48 hours before check-in'
      },
      documents: []
    },
    {
      id: 'col-b3',
      tripId: '2',
      type: BookingType.ACTIVITY,
      status: BookingStatus.CONFIRMED,
      provider: 'Colombia Coffee Tours',
      confirmation: 'CCT2025',
      details: {
        name: 'Coffee Farm Tour - Zona Cafetera',
        description: 'Full day tour of authentic Colombian coffee farms in the Coffee Triangle',
        location: {
          id: 'loc-coffee',
          name: 'Salento',
          city: 'Salento',
          country: 'Colombia'
        },
        startTime: new Date('2025-02-17T07:00:00'),
        endTime: new Date('2025-02-17T17:00:00'),
        duration: 600,
        category: 'Cultural'
      },
      price: { amount: 85, currency: 'USD' },
      bookingDate: new Date('2025-01-20'),
      startDate: new Date('2025-02-17'),
      cancellationPolicy: {
        refundable: true,
        terms: 'Cancel up to 24 hours before activity'
      },
      documents: []
    },
    {
      id: 'col-b4',
      tripId: '2',
      type: BookingType.ACTIVITY,
      status: BookingStatus.CONFIRMED,
      provider: 'Cocora Valley Expeditions',
      confirmation: 'CVE2025',
      details: {
        name: 'Cocora Valley Hiking Adventure',
        description: 'Hike through the famous wax palm forest - tallest palms in the world',
        location: {
          id: 'loc-cocora',
          name: 'Valle de Cocora',
          city: 'Salento',
          country: 'Colombia'
        },
        startTime: new Date('2025-02-19T06:00:00'),
        endTime: new Date('2025-02-19T14:00:00'),
        duration: 480,
        category: 'Adventure'
      },
      price: { amount: 65, currency: 'USD' },
      bookingDate: new Date('2025-01-20'),
      startDate: new Date('2025-02-19'),
      cancellationPolicy: {
        refundable: true,
        terms: 'Cancel up to 24 hours before activity'
      },
      documents: []
    },
    {
      id: 'col-b5',
      tripId: '2',
      type: BookingType.HOTEL,
      status: BookingStatus.CONFIRMED,
      provider: 'Hotel Santa Clara',
      confirmation: 'HSC2025CTG',
      details: {
        name: 'Sofitel Legend Santa Clara',
        address: 'Calle del Torno #39-29, Cartagena',
        checkIn: new Date('2025-02-21'),
        checkOut: new Date('2025-02-25'),
        roomType: 'Colonial Suite',
        numberOfRooms: 1,
        numberOfGuests: 1,
        amenities: ['Pool', 'Spa', 'Historic Building', 'Beach Access']
      },
      price: { amount: 680, currency: 'USD' },
      bookingDate: new Date('2025-01-15'),
      startDate: new Date('2025-02-21'),
      endDate: new Date('2025-02-25'),
      cancellationPolicy: {
        refundable: true,
        terms: 'Free cancellation up to 7 days before check-in'
      },
      documents: []
    },
    {
      id: 'col-b6',
      tripId: '2',
      type: BookingType.ACTIVITY,
      status: BookingStatus.CONFIRMED,
      provider: 'Cartagena Walking Tours',
      confirmation: 'CWT2025',
      details: {
        name: 'Cartagena Old Town Walking Tour',
        description: 'Explore the UNESCO World Heritage walled city with a local guide',
        location: {
          id: 'loc-cartagena',
          name: 'Ciudad Amurallada',
          city: 'Cartagena',
          country: 'Colombia'
        },
        startTime: new Date('2025-02-22T09:00:00'),
        endTime: new Date('2025-02-22T13:00:00'),
        duration: 240,
        category: 'Cultural'
      },
      price: { amount: 45, currency: 'USD' },
      bookingDate: new Date('2025-01-20'),
      startDate: new Date('2025-02-22'),
      cancellationPolicy: {
        refundable: true,
        terms: 'Cancel up to 24 hours before activity'
      },
      documents: []
    }
  ],
  budget: {
    amount: 2500,
    currency: 'USD'
  },
  metadata: {
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    isShared: false,
    shareCount: 0,
    tags: ['adventure', 'coffee', 'culture', 'hiking', 'beach']
  }
};

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
