/**
 * MOCK FLIGHT DATA
 * 
 * Sample flight data for development and testing.
 */

import { Flight, Airport, Airline, FlightSegment, SeatMap, SeatMapRow } from '../types/flight.types';

// ============================================
// AIRLINES
// ============================================

export const AIRLINES: Record<string, Airline> = {
  AA: {
    code: 'AA',
    name: 'American Airlines',
    logo: 'https://logos-world.net/wp-content/uploads/2021/08/American-Airlines-Logo.png',
    alliance: 'oneworld',
  },
  UA: {
    code: 'UA',
    name: 'United Airlines',
    logo: 'https://logos-world.net/wp-content/uploads/2021/08/United-Airlines-Logo.png',
    alliance: 'star',
  },
  DL: {
    code: 'DL',
    name: 'Delta Air Lines',
    logo: 'https://logos-world.net/wp-content/uploads/2021/08/Delta-Air-Lines-Logo.png',
    alliance: 'skyteam',
  },
  SW: {
    code: 'SW',
    name: 'Southwest Airlines',
    logo: 'https://logos-world.net/wp-content/uploads/2021/08/Southwest-Airlines-Logo.png',
  },
  JB: {
    code: 'JB',
    name: 'JetBlue Airways',
    logo: 'https://logos-world.net/wp-content/uploads/2021/08/JetBlue-Logo.png',
  },
  AS: {
    code: 'AS',
    name: 'Alaska Airlines',
    logo: 'https://logos-world.net/wp-content/uploads/2021/08/Alaska-Airlines-Logo.png',
    alliance: 'oneworld',
  },
};

// ============================================
// AIRPORTS
// ============================================

export const AIRPORTS: Airport[] = [
  {
    id: 'LAX',
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States',
    countryCode: 'US',
    timezone: 'America/Los_Angeles',
    type: 'airport',
    coordinates: { lat: 33.9425, lng: -118.4081 },
  },
  {
    id: 'JFK',
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    countryCode: 'US',
    timezone: 'America/New_York',
    type: 'airport',
    coordinates: { lat: 40.6413, lng: -73.7781 },
  },
  {
    id: 'SFO',
    code: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'United States',
    countryCode: 'US',
    timezone: 'America/Los_Angeles',
    type: 'airport',
    coordinates: { lat: 37.6213, lng: -122.3790 },
  },
  {
    id: 'ORD',
    code: 'ORD',
    name: "O'Hare International Airport",
    city: 'Chicago',
    country: 'United States',
    countryCode: 'US',
    timezone: 'America/Chicago',
    type: 'airport',
    coordinates: { lat: 41.9742, lng: -87.9073 },
  },
  {
    id: 'MIA',
    code: 'MIA',
    name: 'Miami International Airport',
    city: 'Miami',
    country: 'United States',
    countryCode: 'US',
    timezone: 'America/New_York',
    type: 'airport',
    coordinates: { lat: 25.7959, lng: -80.2870 },
  },
  {
    id: 'SEA',
    code: 'SEA',
    name: 'Seattle-Tacoma International Airport',
    city: 'Seattle',
    country: 'United States',
    countryCode: 'US',
    timezone: 'America/Los_Angeles',
    type: 'airport',
    coordinates: { lat: 47.4502, lng: -122.3088 },
  },
  {
    id: 'DFW',
    code: 'DFW',
    name: 'Dallas/Fort Worth International Airport',
    city: 'Dallas',
    country: 'United States',
    countryCode: 'US',
    timezone: 'America/Chicago',
    type: 'airport',
    coordinates: { lat: 32.8998, lng: -97.0403 },
  },
  {
    id: 'BOS',
    code: 'BOS',
    name: 'Boston Logan International Airport',
    city: 'Boston',
    country: 'United States',
    countryCode: 'US',
    timezone: 'America/New_York',
    type: 'airport',
    coordinates: { lat: 42.3656, lng: -71.0096 },
  },
  {
    id: 'ATL',
    code: 'ATL',
    name: 'Hartsfield-Jackson Atlanta International Airport',
    city: 'Atlanta',
    country: 'United States',
    countryCode: 'US',
    timezone: 'America/New_York',
    type: 'airport',
    coordinates: { lat: 33.6407, lng: -84.4277 },
  },
  {
    id: 'DEN',
    code: 'DEN',
    name: 'Denver International Airport',
    city: 'Denver',
    country: 'United States',
    countryCode: 'US',
    timezone: 'America/Denver',
    type: 'airport',
    coordinates: { lat: 39.8561, lng: -104.6737 },
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const createFlightSegment = (
  id: string,
  flightNumber: string,
  airline: Airline,
  origin: Airport,
  destination: Airport,
  departureTime: Date,
  arrivalTime: Date,
): FlightSegment => ({
  id,
  flightNumber,
  airline,
  aircraft: 'Boeing 737-800',
  origin,
  destination,
  departureTime,
  arrivalTime,
  duration: Math.round((arrivalTime.getTime() - departureTime.getTime()) / 60000),
  cabinClass: 'economy',
  status: 'scheduled',
});

// ============================================
// MOCK FLIGHTS
// ============================================

export const generateMockFlights = (
  origin: Airport,
  destination: Airport,
  date: Date,
): Flight[] => {
  const flights: Flight[] = [];
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);
  
  // Generate 8-12 flights for the day
  const flightTimes = [
    { hour: 6, minute: 15 },
    { hour: 8, minute: 30 },
    { hour: 10, minute: 45 },
    { hour: 12, minute: 0 },
    { hour: 14, minute: 30 },
    { hour: 16, minute: 15 },
    { hour: 18, minute: 45 },
    { hour: 20, minute: 30 },
  ];
  
  const airlines = [AIRLINES.AA, AIRLINES.UA, AIRLINES.DL, AIRLINES.JB, AIRLINES.AS];
  
  flightTimes.forEach((time, index) => {
    const airline = airlines[index % airlines.length];
    const departureTime = new Date(baseDate);
    departureTime.setHours(time.hour, time.minute);
    
    // Calculate flight duration based on distance (simplified)
    const baseDuration = 180 + Math.random() * 120; // 3-5 hours
    const arrivalTime = new Date(departureTime.getTime() + baseDuration * 60000);
    
    const isNonstop = Math.random() > 0.4;
    const basePrice = 150 + Math.random() * 350;
    
    if (isNonstop) {
      // Direct flight
      const segment = createFlightSegment(
        `seg-${index}-1`,
        `${airline.code}${1000 + index * 100}`,
        airline,
        origin,
        destination,
        departureTime,
        arrivalTime,
      );
      
      flights.push({
        id: `flight-${index}`,
        segments: [segment],
        layovers: [],
        totalDuration: segment.duration,
        stops: 0,
        price: {
          amount: Math.round(basePrice),
          currency: 'USD',
          formatted: `$${Math.round(basePrice)}`,
        },
        seatsAvailable: Math.floor(Math.random() * 15) + 1,
        refundable: Math.random() > 0.7,
        changeable: true,
        changeFee: 75,
        baggageIncluded: {
          cabin: { included: true, quantity: 1, weight: 10, dimensions: '22x14x9 in' },
          checked: { included: Math.random() > 0.5, quantity: 1, weight: 23 },
        },
        fareClass: 'Main Cabin',
      });
    } else {
      // Flight with 1 stop
      const layoverAirport = AIRPORTS.find(a => 
        a.code !== origin.code && a.code !== destination.code
      ) || AIRPORTS[3];
      
      const firstLegDuration = 90 + Math.random() * 60;
      const layoverDuration = 60 + Math.random() * 90;
      const secondLegDuration = 90 + Math.random() * 60;
      
      const firstArrival = new Date(departureTime.getTime() + firstLegDuration * 60000);
      const secondDeparture = new Date(firstArrival.getTime() + layoverDuration * 60000);
      const finalArrival = new Date(secondDeparture.getTime() + secondLegDuration * 60000);
      
      const segment1 = createFlightSegment(
        `seg-${index}-1`,
        `${airline.code}${1000 + index * 100}`,
        airline,
        origin,
        layoverAirport,
        departureTime,
        firstArrival,
      );
      
      const segment2 = createFlightSegment(
        `seg-${index}-2`,
        `${airline.code}${1001 + index * 100}`,
        airline,
        layoverAirport,
        destination,
        secondDeparture,
        finalArrival,
      );
      
      const totalDuration = Math.round(
        (finalArrival.getTime() - departureTime.getTime()) / 60000
      );
      
      flights.push({
        id: `flight-${index}`,
        segments: [segment1, segment2],
        layovers: [{
          airport: layoverAirport,
          duration: Math.round(layoverDuration),
          changeTerminal: false,
          changeAirport: false,
        }],
        totalDuration,
        stops: 1,
        price: {
          amount: Math.round(basePrice * 0.85), // Connecting flights are cheaper
          currency: 'USD',
          formatted: `$${Math.round(basePrice * 0.85)}`,
        },
        seatsAvailable: Math.floor(Math.random() * 20) + 3,
        refundable: Math.random() > 0.8,
        changeable: true,
        changeFee: 75,
        baggageIncluded: {
          cabin: { included: true, quantity: 1, weight: 10, dimensions: '22x14x9 in' },
          checked: { included: Math.random() > 0.6, quantity: 1, weight: 23 },
        },
        fareClass: 'Main Cabin',
      });
    }
  });
  
  // Sort by price
  return flights.sort((a, b) => a.price.amount - b.price.amount);
};

// ============================================
// SEAT MAP
// ============================================

export const generateSeatMap = (flightId: string): SeatMap => {
  const rows: SeatMapRow[] = [];
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  for (let rowNum = 1; rowNum <= 30; rowNum++) {
    const isExitRow = rowNum === 10 || rowNum === 20;
    const isOverWing = rowNum >= 12 && rowNum <= 18;
    
    const seats = columns.map((col, colIndex) => {
      const position = colIndex === 0 || colIndex === 5 
        ? 'window' 
        : colIndex === 2 || colIndex === 3 
          ? 'aisle' 
          : 'middle';
      
      const isOccupied = Math.random() > 0.6;
      const isBlocked = rowNum === 1 && (col === 'A' || col === 'F');
      
      let seatType: 'standard' | 'extra_legroom' | 'exit_row' | 'premium' = 'standard';
      let price = 0;
      
      if (rowNum <= 3) {
        seatType = 'premium';
        price = 75;
      } else if (isExitRow) {
        seatType = 'exit_row';
        price = 45;
      } else if (position === 'window' || position === 'aisle') {
        price = 15;
      }
      
      return {
        id: `${rowNum}${col}`,
        row: rowNum,
        column: col,
        type: seatType,
        position,
        status: isBlocked ? 'blocked' : isOccupied ? 'occupied' : 'available',
        price,
        features: isExitRow ? ['extra_legroom'] : undefined,
      };
    });
    
    rows.push({
      rowNumber: rowNum,
      seats: seats as any,
      isExitRow,
      isOverWing,
    });
  }
  
  return {
    flightId,
    cabinClass: 'economy',
    rows,
    legend: [
      { type: 'available', label: 'Available', color: '#E5E7EB' },
      { type: 'selected', label: 'Selected', color: '#7257FF' },
      { type: 'occupied', label: 'Occupied', color: '#374151' },
      { type: 'premium', label: 'Premium ($75)', color: '#F59E0B' },
      { type: 'exit_row', label: 'Exit Row ($45)', color: '#10B981' },
    ],
  };
};

// ============================================
// POPULAR ROUTES
// ============================================

export const POPULAR_ROUTES = [
  { origin: AIRPORTS[0], destination: AIRPORTS[1], price: 199 }, // LAX -> JFK
  { origin: AIRPORTS[1], destination: AIRPORTS[4], price: 149 }, // JFK -> MIA
  { origin: AIRPORTS[2], destination: AIRPORTS[5], price: 129 }, // SFO -> SEA
  { origin: AIRPORTS[3], destination: AIRPORTS[0], price: 179 }, // ORD -> LAX
  { origin: AIRPORTS[8], destination: AIRPORTS[1], price: 159 }, // ATL -> JFK
];
