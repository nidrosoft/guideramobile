/**
 * MOCK HOTELS DATA
 * 
 * Generates realistic mock hotel data for development and testing.
 */

import {
  Hotel,
  HotelImage,
  HotelLocation,
  Room,
  Amenity,
  HotelPolicies,
  HotelReview,
  ReviewSummary,
  PropertyType,
  BedType,
  BreakfastOption,
} from '../types/hotel.types';
import { Location } from '../types/booking.types';

// ============================================
// HOTEL IMAGES (Unsplash)
// ============================================

const HOTEL_IMAGES = {
  luxury: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
  ],
  boutique: [
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
  ],
  resort: [
    'https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?w=800',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
  ],
  modern: [
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
  ],
  room: [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
  ],
};

// ============================================
// HOTEL NAMES & CHAINS
// ============================================

const HOTEL_PREFIXES = [
  'Grand', 'Royal', 'The', 'Hotel', 'Park', 'Ocean', 'Mountain', 'City',
  'Sunset', 'Golden', 'Silver', 'Crystal', 'Diamond', 'Emerald', 'Azure',
];

const HOTEL_SUFFIXES = [
  'Hotel', 'Resort', 'Suites', 'Inn', 'Lodge', 'Palace', 'Plaza', 'Tower',
  'Residence', 'Boutique Hotel', 'Grand Hotel', 'Beach Resort',
];

const HOTEL_CHAINS = [
  { name: 'Marriott', stars: 4 },
  { name: 'Hilton', stars: 4 },
  { name: 'Hyatt', stars: 5 },
  { name: 'Four Seasons', stars: 5 },
  { name: 'Ritz-Carlton', stars: 5 },
  { name: 'Holiday Inn', stars: 3 },
  { name: 'Best Western', stars: 3 },
  { name: 'Sheraton', stars: 4 },
  { name: 'Westin', stars: 4 },
  { name: 'W Hotels', stars: 5 },
];

// ============================================
// AMENITIES
// ============================================

const AMENITIES: Amenity[] = [
  { id: 'wifi', name: 'Free WiFi', icon: 'wifi', category: 'general' },
  { id: 'parking', name: 'Free Parking', icon: 'car', category: 'general' },
  { id: 'pool', name: 'Swimming Pool', icon: 'swimming', category: 'outdoor' },
  { id: 'gym', name: 'Fitness Center', icon: 'dumbbell', category: 'wellness' },
  { id: 'spa', name: 'Spa & Wellness', icon: 'spa', category: 'wellness' },
  { id: 'restaurant', name: 'Restaurant', icon: 'restaurant', category: 'food' },
  { id: 'bar', name: 'Bar/Lounge', icon: 'wine', category: 'food' },
  { id: 'room_service', name: '24h Room Service', icon: 'bell', category: 'food' },
  { id: 'ac', name: 'Air Conditioning', icon: 'snowflake', category: 'room' },
  { id: 'tv', name: 'Flat-screen TV', icon: 'tv', category: 'room' },
  { id: 'minibar', name: 'Minibar', icon: 'refrigerator', category: 'room' },
  { id: 'safe', name: 'In-room Safe', icon: 'lock', category: 'room' },
  { id: 'balcony', name: 'Balcony', icon: 'balcony', category: 'room' },
  { id: 'beach', name: 'Beach Access', icon: 'beach', category: 'outdoor' },
  { id: 'shuttle', name: 'Airport Shuttle', icon: 'shuttle', category: 'general' },
  { id: 'concierge', name: 'Concierge', icon: 'concierge', category: 'general' },
  { id: 'business', name: 'Business Center', icon: 'briefcase', category: 'business' },
  { id: 'pet', name: 'Pet Friendly', icon: 'paw', category: 'general' },
  { id: 'kids', name: 'Kids Club', icon: 'kids', category: 'family' },
  { id: 'laundry', name: 'Laundry Service', icon: 'washer', category: 'general' },
];

// ============================================
// DESTINATIONS
// ============================================

export const POPULAR_DESTINATIONS: Location[] = [
  { id: 'nyc', name: 'New York City', code: 'NYC', type: 'city', country: 'United States', countryCode: 'US' },
  { id: 'lax', name: 'Los Angeles', code: 'LAX', type: 'city', country: 'United States', countryCode: 'US' },
  { id: 'mia', name: 'Miami', code: 'MIA', type: 'city', country: 'United States', countryCode: 'US' },
  { id: 'sfo', name: 'San Francisco', code: 'SFO', type: 'city', country: 'United States', countryCode: 'US' },
  { id: 'chi', name: 'Chicago', code: 'CHI', type: 'city', country: 'United States', countryCode: 'US' },
  { id: 'las', name: 'Las Vegas', code: 'LAS', type: 'city', country: 'United States', countryCode: 'US' },
  { id: 'lon', name: 'London', code: 'LON', type: 'city', country: 'United Kingdom', countryCode: 'GB' },
  { id: 'par', name: 'Paris', code: 'PAR', type: 'city', country: 'France', countryCode: 'FR' },
  { id: 'tok', name: 'Tokyo', code: 'TYO', type: 'city', country: 'Japan', countryCode: 'JP' },
  { id: 'dxb', name: 'Dubai', code: 'DXB', type: 'city', country: 'UAE', countryCode: 'AE' },
  { id: 'bkk', name: 'Bangkok', code: 'BKK', type: 'city', country: 'Thailand', countryCode: 'TH' },
  { id: 'sin', name: 'Singapore', code: 'SIN', type: 'city', country: 'Singapore', countryCode: 'SG' },
  { id: 'rom', name: 'Rome', code: 'ROM', type: 'city', country: 'Italy', countryCode: 'IT' },
  { id: 'bcn', name: 'Barcelona', code: 'BCN', type: 'city', country: 'Spain', countryCode: 'ES' },
  { id: 'ams', name: 'Amsterdam', code: 'AMS', type: 'city', country: 'Netherlands', countryCode: 'NL' },
];

// ============================================
// GENERATORS
// ============================================

function generateHotelName(): string {
  const useChain = Math.random() > 0.5;
  
  if (useChain) {
    const chain = HOTEL_CHAINS[Math.floor(Math.random() * HOTEL_CHAINS.length)];
    return chain.name;
  }
  
  const prefix = HOTEL_PREFIXES[Math.floor(Math.random() * HOTEL_PREFIXES.length)];
  const suffix = HOTEL_SUFFIXES[Math.floor(Math.random() * HOTEL_SUFFIXES.length)];
  return `${prefix} ${suffix}`;
}

function generateHotelImages(propertyType: PropertyType): HotelImage[] {
  const imageSet = propertyType === 'resort' 
    ? HOTEL_IMAGES.resort 
    : propertyType === 'boutique' 
      ? HOTEL_IMAGES.boutique 
      : Math.random() > 0.5 
        ? HOTEL_IMAGES.luxury 
        : HOTEL_IMAGES.modern;
  
  return imageSet.map((url, index) => ({
    id: `img-${index}`,
    url,
    caption: index === 0 ? 'Hotel Exterior' : `View ${index + 1}`,
    category: index === 0 ? 'exterior' as const : 'lobby' as const,
  }));
}

function generateRooms(starRating: number, basePrice: number): Room[] {
  const roomTypes = [
    { name: 'Standard Room', multiplier: 1, size: 25, maxOccupancy: 2 },
    { name: 'Deluxe Room', multiplier: 1.3, size: 32, maxOccupancy: 2 },
    { name: 'Superior Room', multiplier: 1.5, size: 38, maxOccupancy: 3 },
    { name: 'Junior Suite', multiplier: 1.8, size: 45, maxOccupancy: 3 },
    { name: 'Executive Suite', multiplier: 2.2, size: 55, maxOccupancy: 4 },
    { name: 'Presidential Suite', multiplier: 3.5, size: 85, maxOccupancy: 4 },
  ];
  
  // Higher star = more room types
  const numRooms = Math.min(starRating + 1, roomTypes.length);
  
  return roomTypes.slice(0, numRooms).map((type, index) => {
    const price = Math.round(basePrice * type.multiplier);
    const refundable = Math.random() > 0.3;
    const breakfastOptions: BreakfastOption[] = ['included', 'available', 'not_available'];
    const breakfast = breakfastOptions[Math.floor(Math.random() * 3)];
    
    return {
      id: `room-${index}`,
      name: type.name,
      description: `Spacious ${type.name.toLowerCase()} with modern amenities and ${starRating >= 4 ? 'premium' : 'comfortable'} furnishings.`,
      images: HOTEL_IMAGES.room.slice(0, 3),
      maxOccupancy: type.maxOccupancy,
      maxAdults: type.maxOccupancy,
      maxChildren: Math.min(type.maxOccupancy - 1, 2),
      bedConfiguration: [
        { type: type.maxOccupancy > 2 ? 'king' as BedType : 'queen' as BedType, count: 1 },
      ],
      size: type.size,
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Minibar', 'Safe'],
      view: Math.random() > 0.5 ? 'City View' : 'Garden View',
      price: {
        amount: price,
        currency: 'USD',
        formatted: `$${price}`,
        perNight: true,
      },
      originalPrice: Math.random() > 0.7 ? {
        amount: Math.round(price * 1.2),
        currency: 'USD',
        formatted: `$${Math.round(price * 1.2)}`,
        perNight: true,
      } : undefined,
      available: Math.floor(Math.random() * 5) + 1,
      refundable,
      refundDeadline: refundable ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
      breakfast,
      cancellationPolicy: refundable 
        ? 'Free cancellation until 24 hours before check-in' 
        : 'Non-refundable',
    };
  });
};

function generateAmenities(starRating: number): Amenity[] {
  // Base amenities for all hotels
  const base = AMENITIES.filter(a => ['wifi', 'ac', 'tv'].includes(a.id));
  
  // Additional amenities based on star rating
  const additional = AMENITIES.filter(a => !['wifi', 'ac', 'tv'].includes(a.id));
  const numAdditional = Math.min(starRating * 2 + 2, additional.length);
  
  const shuffled = additional.sort(() => Math.random() - 0.5);
  return [...base, ...shuffled.slice(0, numAdditional)];
}

function generatePolicies(starRating: number): HotelPolicies {
  return {
    checkIn: {
      from: starRating >= 4 ? '14:00' : '15:00',
      until: '23:00',
    },
    checkOut: {
      from: '06:00',
      until: starRating >= 4 ? '12:00' : '11:00',
    },
    cancellation: {
      type: 'free',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      description: 'Free cancellation until 24 hours before check-in',
    },
    children: 'Children of all ages are welcome',
    pets: starRating >= 4 ? 'allowed_with_fee' : 'not_allowed',
    smoking: 'not_allowed',
    parties: false,
    paymentMethods: ['Visa', 'Mastercard', 'American Express', 'Apple Pay'],
  };
}

function generateReviewSummary(userRating: number): ReviewSummary {
  return {
    overall: userRating,
    categories: {
      cleanliness: userRating + (Math.random() * 0.5 - 0.25),
      comfort: userRating + (Math.random() * 0.5 - 0.25),
      location: userRating + (Math.random() * 0.8 - 0.4),
      facilities: userRating + (Math.random() * 0.5 - 0.25),
      staff: userRating + (Math.random() * 0.6 - 0.3),
      value: userRating + (Math.random() * 0.4 - 0.2),
    },
    totalReviews: Math.floor(Math.random() * 2000) + 100,
    ratingDistribution: {
      excellent: Math.floor(userRating * 8),
      veryGood: Math.floor(userRating * 5),
      average: Math.floor((10 - userRating) * 3),
      poor: Math.floor((10 - userRating) * 1.5),
      terrible: Math.floor((10 - userRating) * 0.5),
    },
  };
}

// ============================================
// MAIN GENERATOR
// ============================================

export function generateMockHotels(
  destination: Location,
  checkIn: Date,
  checkOut: Date,
  count: number = 15
): Hotel[] {
  const hotels: Hotel[] = [];
  
  for (let i = 0; i < count; i++) {
    const starRating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
    const userRating = 6 + Math.random() * 3.5; // 6.0 - 9.5
    const basePrice = starRating * 50 + Math.floor(Math.random() * 100); // $150-$350+
    
    const propertyTypes: PropertyType[] = ['hotel', 'resort', 'boutique', 'apartment'];
    const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    
    const rooms = generateRooms(starRating, basePrice);
    const lowestPrice = Math.min(...rooms.map(r => r.price.amount));
    
    const hotel: Hotel = {
      id: `hotel-${destination.code}-${i}`,
      name: generateHotelName(),
      description: `Experience ${starRating >= 4 ? 'luxury' : 'comfort'} at its finest in the heart of ${destination.name}. Our ${propertyType} offers exceptional service, modern amenities, and an unforgettable stay.`,
      shortDescription: `${starRating}-star ${propertyType} in ${destination.name}`,
      starRating,
      userRating: Math.round(userRating * 10) / 10,
      reviewCount: Math.floor(Math.random() * 2000) + 100,
      images: generateHotelImages(propertyType),
      location: {
        address: `${Math.floor(Math.random() * 999) + 1} ${['Main', 'Park', 'Ocean', 'Central', 'Grand'][Math.floor(Math.random() * 5)]} Street`,
        city: destination.name,
        country: destination.country,
        postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
        coordinates: {
          lat: 40.7128 + (Math.random() - 0.5) * 0.1,
          lng: -74.0060 + (Math.random() - 0.5) * 0.1,
        },
        neighborhood: ['Downtown', 'Midtown', 'Beach District', 'Arts Quarter', 'Historic Center'][Math.floor(Math.random() * 5)],
        distanceFromCenter: Math.round(Math.random() * 5 * 10) / 10,
        nearbyAttractions: [
          { name: 'City Center', distance: 0.5, type: 'landmark' },
          { name: 'Metro Station', distance: 0.2, type: 'transport' },
          { name: 'Shopping Mall', distance: 0.8, type: 'shopping' },
        ],
      },
      amenities: generateAmenities(starRating),
      rooms,
      policies: generatePolicies(starRating),
      pricePerNight: {
        amount: basePrice,
        currency: 'USD',
        formatted: `$${basePrice}`,
        perNight: true,
      },
      lowestPrice: {
        amount: lowestPrice,
        currency: 'USD',
        formatted: `$${lowestPrice}`,
        perNight: true,
      },
      featured: Math.random() > 0.8,
      verified: Math.random() > 0.2,
      propertyType,
    };
    
    hotels.push(hotel);
  }
  
  // Sort by recommended (rating + reviews)
  return hotels.sort((a, b) => {
    const scoreA = a.userRating * 0.7 + Math.min(a.reviewCount / 500, 3) * 0.3;
    const scoreB = b.userRating * 0.7 + Math.min(b.reviewCount / 500, 3) * 0.3;
    return scoreB - scoreA;
  });
}

// ============================================
// MOCK REVIEWS
// ============================================

const REVIEW_TITLES = [
  'Amazing stay!',
  'Perfect location',
  'Great value for money',
  'Would definitely return',
  'Exceeded expectations',
  'Lovely hotel',
  'Good but could be better',
  'Fantastic experience',
  'Highly recommended',
  'Beautiful property',
];

const REVIEW_CONTENT = [
  'The staff was incredibly friendly and helpful. The room was clean and spacious.',
  'Perfect location for exploring the city. Walking distance to major attractions.',
  'The breakfast was delicious with lots of options. Pool area was beautiful.',
  'Modern amenities and comfortable beds. Slept like a baby!',
  'Great value for the price. Would definitely book again.',
  'The spa was amazing and the restaurant had excellent food.',
  'Check-in was smooth and the concierge gave great recommendations.',
  'Beautiful views from our room. The hotel exceeded our expectations.',
];

export function generateMockReviews(hotelId: string, count: number = 10): HotelReview[] {
  const reviews: HotelReview[] = [];
  const travelTypes: ('business' | 'couple' | 'family' | 'friends' | 'solo')[] = 
    ['business', 'couple', 'family', 'friends', 'solo'];
  
  for (let i = 0; i < count; i++) {
    const rating = 6 + Math.random() * 4; // 6-10
    const daysAgo = Math.floor(Math.random() * 180);
    
    reviews.push({
      id: `review-${hotelId}-${i}`,
      hotelId,
      author: {
        name: ['John D.', 'Sarah M.', 'Mike R.', 'Emma L.', 'David K.', 'Lisa P.'][Math.floor(Math.random() * 6)],
        country: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'][Math.floor(Math.random() * 5)],
      },
      rating: Math.round(rating * 10) / 10,
      title: REVIEW_TITLES[Math.floor(Math.random() * REVIEW_TITLES.length)],
      content: REVIEW_CONTENT[Math.floor(Math.random() * REVIEW_CONTENT.length)],
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      stayDate: new Date(Date.now() - (daysAgo + 7) * 24 * 60 * 60 * 1000),
      travelType: travelTypes[Math.floor(Math.random() * travelTypes.length)],
      helpful: Math.floor(Math.random() * 50),
    });
  }
  
  return reviews.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export default generateMockHotels;
