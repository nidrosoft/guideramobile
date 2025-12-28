/**
 * PACKAGE MOCK DATA
 * 
 * Mock data generators for package booking flow.
 * Returns any[] to avoid complex type matching with store types.
 */

import { TripSetup } from '../../../stores/usePackageStore';

// Mock Airlines
const AIRLINES = [
  { code: 'AA', name: 'American Airlines', logo: 'aa-logo' },
  { code: 'UA', name: 'United Airlines', logo: 'ua-logo' },
  { code: 'DL', name: 'Delta Air Lines', logo: 'dl-logo' },
  { code: 'BA', name: 'British Airways', logo: 'ba-logo' },
  { code: 'LH', name: 'Lufthansa', logo: 'lh-logo' },
];

// Generate mock flights
export function generateMockFlights(tripSetup: TripSetup): any[] {
  const flights: any[] = [];
  const times = ['06:00', '09:30', '12:00', '15:30', '18:00', '21:00'];
  
  for (let i = 0; i < 6; i++) {
    const airline = AIRLINES[i % AIRLINES.length];
    const departureTime = times[i];
    const durationMinutes = 180 + Math.floor(Math.random() * 120);
    const price = 250 + Math.floor(Math.random() * 400);
    
    flights.push({
      id: `flight-${i}`,
      segments: [{
        id: `seg-${i}`,
        flightNumber: `${airline.code}${100 + i}`,
        airline,
        aircraft: 'Boeing 737-800',
        origin: {
          code: tripSetup.origin?.code || 'JFK',
          name: tripSetup.origin?.name || 'New York',
        },
        destination: {
          code: tripSetup.destination?.code || 'LAX',
          name: tripSetup.destination?.name || 'Los Angeles',
        },
        departureTime: `${departureTime}`,
        arrivalTime: `${parseInt(departureTime) + 3}:00`,
        duration: durationMinutes,
      }],
      layovers: [],
      totalDuration: durationMinutes,
      stops: 0,
      price: { amount: price, currency: 'USD' },
      seatsAvailable: 5 + Math.floor(Math.random() * 20),
      refundable: i % 2 === 0,
    });
  }
  
  return flights;
}

// Generate mock hotels
export function generateMockHotels(tripSetup: TripSetup): any[] {
  const hotelNames = [
    'Grand Plaza Hotel',
    'Oceanview Resort & Spa',
    'City Center Suites',
    'The Royal Palm',
    'Sunset Beach Hotel',
    'Metropolitan Inn',
  ];
  
  const hotels: any[] = [];
  
  for (let i = 0; i < 6; i++) {
    const pricePerNight = 120 + Math.floor(Math.random() * 200);
    const starRating = 3 + Math.floor(Math.random() * 3);
    
    hotels.push({
      id: `hotel-${i}`,
      name: hotelNames[i],
      description: 'A wonderful hotel in the heart of the city.',
      starRating,
      userRating: 7 + Math.random() * 2.5,
      reviewCount: 100 + Math.floor(Math.random() * 500),
      images: [],
      location: {
        address: `${100 + i} Main Street`,
        city: tripSetup.destination?.name || 'Los Angeles',
        country: 'United States',
      },
      rooms: [{
        id: `room-${i}`,
        name: 'Standard Room',
        price: { amount: pricePerNight, currency: 'USD' },
      }],
      pricePerNight: { amount: pricePerNight, currency: 'USD' },
      lowestPrice: { amount: pricePerNight, currency: 'USD' },
    });
  }
  
  return hotels;
}

// Generate mock cars
export function generateMockCars(tripSetup: TripSetup): any[] {
  const carModels = [
    { make: 'Toyota', model: 'Corolla', category: 'Compact' },
    { make: 'Honda', model: 'Civic', category: 'Compact' },
    { make: 'Ford', model: 'Escape', category: 'SUV' },
    { make: 'Chevrolet', model: 'Malibu', category: 'Midsize' },
    { make: 'BMW', model: '3 Series', category: 'Premium' },
    { make: 'Mercedes', model: 'C-Class', category: 'Luxury' },
  ];
  
  const rentalCompanies = [
    { id: 'hertz', name: 'Hertz' },
    { id: 'avis', name: 'Avis' },
    { id: 'enterprise', name: 'Enterprise' },
  ];
  
  const cars: any[] = [];
  
  for (let i = 0; i < 6; i++) {
    const carModel = carModels[i];
    const pricePerDay = 40 + Math.floor(Math.random() * 80);
    const company = rentalCompanies[i % rentalCompanies.length];
    
    cars.push({
      id: `car-${i}`,
      name: `${carModel.make} ${carModel.model}`,
      category: carModel.category,
      make: carModel.make,
      model: carModel.model,
      year: 2023,
      images: [],
      specs: {
        seats: 5,
        doors: 4,
        transmission: 'Automatic',
        fuelType: 'Petrol',
      },
      rental: {
        company,
        pricePerDay,
        totalPrice: pricePerDay * 7,
      },
      available: true,
    });
  }
  
  return cars;
}

// Generate mock experiences
export function generateMockExperiences(tripSetup: TripSetup): any[] {
  const experienceData = [
    { title: 'City Walking Tour', category: 'Tours', duration: '3 hours', price: 45 },
    { title: 'Food & Wine Tasting', category: 'Food', duration: '4 hours', price: 85 },
    { title: 'Museum Pass', category: 'Culture', duration: 'Full day', price: 35 },
    { title: 'Sunset Boat Cruise', category: 'Adventure', duration: '2 hours', price: 65 },
    { title: 'Cooking Class', category: 'Food', duration: '3 hours', price: 95 },
    { title: 'Bike Tour', category: 'Adventure', duration: '4 hours', price: 55 },
  ];
  
  const experiences: any[] = [];
  
  for (let i = 0; i < 6; i++) {
    const exp = experienceData[i];
    
    experiences.push({
      id: `exp-${i}`,
      title: exp.title,
      description: `Enjoy an amazing ${exp.title.toLowerCase()} experience.`,
      category: exp.category,
      duration: exp.duration,
      price: { amount: exp.price, currency: 'USD' },
      rating: 4 + Math.random(),
      reviewCount: 50 + Math.floor(Math.random() * 200),
      location: {
        name: tripSetup.destination?.name || 'City Center',
      },
    });
  }
  
  return experiences;
}
