/**
 * BUNDLE BUILDER STEP
 * 
 * The main step where users select flights, hotels, cars, and experiences.
 * Features tabbed navigation with persistent cart at bottom.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import {
  Star1,
  Clock,
  Airplane,
  Building,
  Car as CarIcon,
  Map1,
  TickCircle,
  ArrowRight2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { usePackageStore, PackageCategory } from '../../../stores/usePackageStore';
import { Flight } from '../../../types/flight.types';
import { Hotel } from '../../../types/hotel.types';
import { Car } from '../../../types/car.types';
import { Experience } from '../../../types/experience.types';
import CategoryTabs from '../components/CategoryTabs';
import BundleCart from '../components/BundleCart';

// ============================================
// SIMPLE MOCK DATA GENERATORS
// ============================================

const AIRLINES = [
  { code: 'AA', name: 'American Airlines' },
  { code: 'UA', name: 'United Airlines' },
  { code: 'DL', name: 'Delta Air Lines' },
  { code: 'JB', name: 'JetBlue Airways' },
];

const generateSimpleMockFlights = (origin: string, destination: string): Flight[] => {
  const flights: Flight[] = [];
  const times = ['06:15', '08:30', '10:45', '14:30', '16:15', '18:45'];
  const prices = [249, 299, 349, 279, 329, 389];
  
  times.forEach((time, index) => {
    const airline = AIRLINES[index % AIRLINES.length];
    const departureTime = new Date();
    departureTime.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]));
    
    const duration = 180 + Math.floor(Math.random() * 120); // 3-5 hours
    const arrivalTime = new Date(departureTime.getTime() + duration * 60000);
    
    flights.push({
      id: `flight-${index}`,
      segments: [{
        id: `seg-${index}`,
        flightNumber: `${airline.code}${100 + index}`,
        airline: { code: airline.code, name: airline.name, logo: '' },
        aircraft: 'Boeing 737',
        origin: { 
          id: 'origin', name: origin, code: origin.substring(0, 3).toUpperCase(), 
          type: 'airport', country: 'USA', countryCode: 'US', city: origin, timezone: 'America/New_York'
        },
        destination: { 
          id: 'dest', name: destination, code: destination.substring(0, 3).toUpperCase(), 
          type: 'airport', country: 'France', countryCode: 'FR', city: destination, timezone: 'Europe/Paris'
        },
        departureTime,
        arrivalTime,
        duration,
        cabinClass: 'economy',
        status: 'scheduled',
      }],
      layovers: [],
      totalDuration: duration,
      stops: 0,
      price: { amount: prices[index], currency: 'USD', formatted: `$${prices[index]}` },
      fareClass: 'economy',
      seatsAvailable: 5 + Math.floor(Math.random() * 10),
      refundable: index % 2 === 0,
      changeable: true,
      baggageIncluded: { cabin: 1, checked: index % 2 === 0 ? 1 : 0 },
    } as unknown as Flight);
  });
  
  return flights;
};

const HOTEL_NAMES = [
  'Grand Palace Hotel',
  'The Ritz Carlton',
  'Marriott Downtown',
  'Hilton Garden Inn',
  'Four Seasons',
  'Hyatt Regency',
];

const generateSimpleMockHotels = (destination: string): Hotel[] => {
  const hotels: Hotel[] = [];
  const prices = [189, 299, 159, 129, 449, 219];
  const ratings = [4.8, 4.9, 4.5, 4.3, 4.9, 4.6];
  
  HOTEL_NAMES.forEach((name, index) => {
    hotels.push({
      id: `hotel-${index}`,
      name,
      description: `Beautiful hotel in the heart of ${destination}`,
      starRating: 4 + (index % 2),
      userRating: ratings[index],
      reviewCount: 500 + Math.floor(Math.random() * 1000),
      images: [{ 
        id: `img-${index}`, 
        url: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop`,
        caption: 'Hotel exterior'
      }],
      location: {
        address: `${100 + index} Main Street`,
        city: destination,
        country: 'France',
        coordinates: { lat: 48.8566, lng: 2.3522 },
        neighborhood: 'Downtown',
        distanceFromCenter: 0.5 + index * 0.3,
      },
      amenities: [
        { id: 'wifi', name: 'Free WiFi', icon: 'wifi', category: 'general', free: true },
        { id: 'pool', name: 'Pool', icon: 'pool', category: 'recreation', free: true },
      ],
      rooms: [{
        id: `room-${index}`,
        name: 'Deluxe Room',
        description: 'Spacious room with city view',
        images: [`https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800`],
        maxOccupancy: 2,
        size: 30,
        bedConfiguration: [{ type: 'king', count: 1 }],
        amenities: ['wifi', 'tv', 'minibar'],
        price: { amount: prices[index], currency: 'USD', formatted: `$${prices[index]}` },
        available: true,
        refundable: true,
        breakfast: index % 2 === 0 ? 'included' : 'not_included',
      }],
      lowestPrice: { amount: prices[index], currency: 'USD', formatted: `$${prices[index]}` },
      policies: {
        checkIn: { from: '15:00', until: '23:00' },
        checkOut: { from: '06:00', until: '11:00' },
        cancellation: { type: 'free', deadline: 24, description: 'Free cancellation' },
        children: { allowed: true },
        pets: { allowed: false },
        smoking: false,
      },
      featured: index === 0,
      popular: index < 3,
    } as unknown as Hotel);
  });
  
  return hotels;
};

// ============================================
// CAR MOCK DATA
// ============================================

const CAR_TYPES = [
  { type: 'economy', name: 'Economy', example: 'Toyota Corolla' },
  { type: 'compact', name: 'Compact', example: 'Honda Civic' },
  { type: 'midsize', name: 'Midsize', example: 'Toyota Camry' },
  { type: 'suv', name: 'SUV', example: 'Toyota RAV4' },
  { type: 'luxury', name: 'Luxury', example: 'BMW 5 Series' },
];

const generateSimpleMockCars = (destination: string): Car[] => {
  const cars: Car[] = [];
  const prices = [45, 55, 75, 95, 150];
  const companyNames = ['Hertz', 'Enterprise', 'Avis', 'Budget', 'National'];
  
  CAR_TYPES.forEach((carType, index) => {
    cars.push({
      id: `car-${index}`,
      name: carType.example,
      category: carType.type as any,
      make: carType.example.split(' ')[0],
      model: carType.example.split(' ')[1] || '',
      year: 2024,
      images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800'],
      features: [
        { id: 'ac', name: 'Air Conditioning', icon: 'wind', included: true },
        { id: 'bt', name: 'Bluetooth', icon: 'bluetooth', included: true },
      ],
      specs: {
        seats: carType.type === 'suv' ? 7 : 5,
        doors: 4,
        luggage: { large: carType.type === 'economy' ? 1 : 2, small: 1 },
        transmission: index % 2 === 0 ? 'automatic' : 'manual',
        fuelType: 'petrol',
        fuelPolicy: 'full_to_full',
        airConditioning: true,
        mileage: 'unlimited',
      },
      rental: {
        company: {
          id: `company-${index}`,
          name: companyNames[index],
          logo: '',
          rating: 4.2 + (index * 0.1),
          reviewCount: 500 + (index * 100),
          locations: 50,
        },
        pricePerDay: { amount: prices[index], currency: 'USD', formatted: `$${prices[index]}` },
        totalPrice: { amount: prices[index] * 7, currency: 'USD', formatted: `$${prices[index] * 7}` },
        deposit: prices[index] * 2,
        currency: 'USD',
        insurance: [],
        extras: [],
        policies: {
          minimumAge: 21,
          maximumAge: 75,
          licenseRequirements: ['Valid license for 1+ year'],
          fuelPolicy: 'full_to_full',
          mileagePolicy: 'unlimited',
          crossBorder: false,
          additionalDriver: { allowed: true, feePerDay: 15 },
          youngDriver: { ageThreshold: 25, feePerDay: 25 },
          seniorDriver: { ageThreshold: 70, feePerDay: 0 },
        },
      },
      available: true,
      popularChoice: index === 0,
    } as unknown as Car);
  });
  
  return cars;
};

// ============================================
// EXPERIENCE MOCK DATA
// ============================================

const generateSimpleMockExperiences = (destination: string): Experience[] => {
  const experiences: Experience[] = [
    {
      id: 'exp-1',
      title: `${destination} City Walking Tour`,
      description: 'Explore the highlights of the city with a local guide',
      shortDescription: 'Guided walking tour of city highlights',
      images: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'],
      category: 'tours',
      duration: 180,
      location: {
        city: destination,
        country: 'France',
        meetingPoint: { name: 'City Center', address: 'Main Square', instructions: 'Meet at fountain', coordinates: { lat: 48.8566, lng: 2.3522 } },
        coordinates: { lat: 48.8566, lng: 2.3522 },
      },
      host: {
        id: 'host-1', name: 'Marie L.', avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        rating: 4.9, reviewCount: 847, responseRate: 98, responseTime: 'within an hour',
        languages: ['English', 'French'], verified: true, superHost: true,
        memberSince: new Date('2018-03-15'), totalExperiences: 12,
      },
      price: { amount: 45, currency: 'USD', formatted: '$45' },
      rating: 4.8,
      reviewCount: 1234,
      maxParticipants: 15,
      includes: ['Professional guide', 'Headsets'],
      notIncluded: ['Food', 'Tips'],
      requirements: [],
      whatToBring: ['Comfortable shoes', 'Camera'],
      accessibility: { wheelchairAccessible: true, mobilityAid: true, visualAid: false, hearingAid: true, serviceAnimals: true, infantFriendly: true, childFriendly: true, seniorFriendly: true, fitnessLevel: 'easy' },
      languages: ['English', 'French'],
      availability: [],
      cancellationPolicy: 'free_24h',
      instantConfirmation: true,
      mobileTicket: true,
      featured: true,
      bestSeller: true,
      tags: ['walking-tour', 'sightseeing'],
    } as unknown as Experience,
    {
      id: 'exp-2',
      title: `${destination} Food & Wine Tour`,
      description: 'Taste the best local cuisine and wines',
      shortDescription: 'Culinary adventure with tastings',
      images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
      category: 'food_drink',
      duration: 240,
      location: {
        city: destination,
        country: 'France',
        meetingPoint: { name: 'Market Square', address: 'Central Market', instructions: 'Meet at entrance', coordinates: { lat: 48.8566, lng: 2.3522 } },
        coordinates: { lat: 48.8566, lng: 2.3522 },
      },
      host: {
        id: 'host-2', name: 'Pierre D.', avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        rating: 4.7, reviewCount: 523, responseRate: 95, responseTime: 'within 2 hours',
        languages: ['English', 'French'], verified: true, superHost: false,
        memberSince: new Date('2019-06-20'), totalExperiences: 5,
      },
      price: { amount: 89, currency: 'USD', formatted: '$89' },
      rating: 4.7,
      reviewCount: 892,
      maxParticipants: 12,
      includes: ['All tastings', 'Wine pairing', 'Local guide'],
      notIncluded: ['Additional drinks'],
      requirements: [],
      whatToBring: ['Empty stomach'],
      accessibility: { wheelchairAccessible: false, mobilityAid: false, visualAid: false, hearingAid: false, serviceAnimals: true, infantFriendly: false, childFriendly: true, seniorFriendly: true, fitnessLevel: 'moderate' },
      languages: ['English', 'French'],
      availability: [],
      cancellationPolicy: 'free_48h',
      instantConfirmation: true,
      mobileTicket: true,
      featured: false,
      bestSeller: true,
      tags: ['food-tour', 'wine'],
    } as unknown as Experience,
    {
      id: 'exp-3',
      title: `${destination} Museum Skip-the-Line`,
      description: 'Skip the queues and explore the famous museum',
      shortDescription: 'Priority museum access with guide',
      images: ['https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800'],
      category: 'attractions',
      duration: 150,
      location: {
        city: destination,
        country: 'France',
        meetingPoint: { name: 'Museum Entrance', address: 'Museum Plaza', instructions: 'Look for red umbrella', coordinates: { lat: 48.8606, lng: 2.3376 } },
        coordinates: { lat: 48.8606, lng: 2.3376 },
      },
      host: {
        id: 'host-3', name: 'Sophie B.', avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
        rating: 4.9, reviewCount: 2341, responseRate: 99, responseTime: 'within an hour',
        languages: ['English', 'French', 'Spanish'], verified: true, superHost: true,
        memberSince: new Date('2017-01-10'), totalExperiences: 8,
      },
      price: { amount: 65, currency: 'USD', formatted: '$65' },
      rating: 4.9,
      reviewCount: 3456,
      maxParticipants: 8,
      includes: ['Skip-the-line entry', 'Expert guide', 'Headsets'],
      notIncluded: ['Tips'],
      requirements: ['Valid ID'],
      whatToBring: ['Comfortable shoes'],
      accessibility: { wheelchairAccessible: true, mobilityAid: true, visualAid: false, hearingAid: true, serviceAnimals: true, infantFriendly: false, childFriendly: true, seniorFriendly: true, fitnessLevel: 'easy' },
      languages: ['English', 'French', 'Spanish'],
      availability: [],
      cancellationPolicy: 'free_24h',
      instantConfirmation: true,
      mobileTicket: true,
      featured: true,
      bestSeller: true,
      tags: ['museum', 'skip-the-line'],
    } as unknown as Experience,
  ];
  
  return experiences;
};

interface BundleBuilderStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function BundleBuilderStep({
  onNext,
  onBack,
  onClose,
}: BundleBuilderStepProps) {
  const insets = useSafeAreaInsets();
  const {
    tripSetup,
    activeCategory,
    setActiveCategory,
    flightResults,
    hotelResults,
    carResults,
    experienceResults,
    setFlightResults,
    setHotelResults,
    setCarResults,
    setExperienceResults,
    isSearching,
    setSearching,
    selections,
    selectFlight,
    selectHotel,
    selectRoom,
    selectCar,
    addExperience,
    isCategoryComplete,
    getNextRequiredCategory,
  } = usePackageStore();
  
  // Load results when category changes
  useEffect(() => {
    loadCategoryResults(activeCategory);
  }, [activeCategory]);
  
  const loadCategoryResults = async (category: PackageCategory) => {
    if (category === 'flight' && flightResults.length === 0) {
      setSearching('flight', true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Generate simple mock flights for package builder
      const mockFlights = generateSimpleMockFlights(
        tripSetup.origin?.name || 'New York',
        tripSetup.destination?.name || 'Paris'
      );
      setFlightResults(mockFlights);
      setSearching('flight', false);
    } else if (category === 'hotel' && hotelResults.length === 0) {
      setSearching('hotel', true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Generate simple mock hotels for package builder
      const mockHotels = generateSimpleMockHotels(tripSetup.destination?.name || 'Paris');
      setHotelResults(mockHotels);
      setSearching('hotel', false);
    } else if (category === 'car' && carResults.length === 0) {
      setSearching('car', true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockCars = generateSimpleMockCars(tripSetup.destination?.name || 'Paris');
      setCarResults(mockCars);
      setSearching('car', false);
    } else if (category === 'experience' && experienceResults.length === 0) {
      setSearching('experience', true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockExperiences = generateSimpleMockExperiences(tripSetup.destination?.name || 'Paris');
      setExperienceResults(mockExperiences);
      setSearching('experience', false);
    }
  };
  
  const handleSelectFlight = (flight: Flight, type: 'outbound' | 'return') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectFlight(type, flight);
    
    // Auto-advance to return flight or next category
    if (type === 'outbound' && !selections.flight.return) {
      // Stay on flights for return selection
    } else if (isCategoryComplete('flight')) {
      const next = getNextRequiredCategory();
      if (next) setActiveCategory(next);
    }
  };
  
  const handleSelectHotel = (hotel: Hotel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectHotel(hotel);
    // Auto-select first room for simplicity
    if (hotel.rooms.length > 0) {
      selectRoom(hotel.rooms[0]);
    }
    
    // Auto-advance to next category
    if (isCategoryComplete('hotel')) {
      const next = getNextRequiredCategory();
      if (next) setActiveCategory(next);
    }
  };
  
  const handleSelectCar = (car: Car) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectCar(car);
    
    // Auto-advance to next category
    if (isCategoryComplete('car')) {
      const next = getNextRequiredCategory();
      if (next) setActiveCategory(next);
    }
  };
  
  const handleSelectExperience = (experience: Experience) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addExperience(experience);
  };
  
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  const handleCategoryPress = (category: PackageCategory) => {
    setActiveCategory(category);
  };
  
  const renderContent = () => {
    if (isSearching[activeCategory]) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding best options...</Text>
        </View>
      );
    }
    
    switch (activeCategory) {
      case 'flight':
        return renderFlights();
      case 'hotel':
        return renderHotels();
      case 'car':
        return renderCars();
      case 'experience':
        return renderExperiences();
      default:
        return null;
    }
  };
  
  const renderFlights = () => {
    const needsOutbound = !selections.flight.outbound;
    const needsReturn = selections.flight.outbound && !selections.flight.return;
    
    return (
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionTitle}>
            {needsOutbound ? 'Select Outbound Flight' : needsReturn ? 'Select Return Flight' : 'Flights Selected'}
          </Text>
          <Text style={styles.selectionSubtitle}>
            {tripSetup.origin?.name} → {tripSetup.destination?.name}
          </Text>
        </View>
        
        {flightResults.map((flight, index) => (
          <Animated.View
            key={flight.id}
            entering={FadeInDown.duration(300).delay(index * 50)}
          >
            <FlightCard
              flight={flight}
              isSelected={
                selections.flight.outbound?.id === flight.id ||
                selections.flight.return?.id === flight.id
              }
              onSelect={() => handleSelectFlight(flight, needsOutbound ? 'outbound' : 'return')}
              type={needsOutbound ? 'outbound' : 'return'}
            />
          </Animated.View>
        ))}
      </ScrollView>
    );
  };
  
  const renderHotels = () => {
    return (
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionTitle}>Select Your Hotel</Text>
          <Text style={styles.selectionSubtitle}>
            {tripSetup.destination?.name} • {usePackageStore.getState().getNights()} nights
          </Text>
        </View>
        
        {hotelResults.map((hotel, index) => (
          <Animated.View
            key={hotel.id}
            entering={FadeInDown.duration(300).delay(index * 50)}
          >
            <HotelCard
              hotel={hotel}
              isSelected={selections.hotel.hotel?.id === hotel.id}
              onSelect={() => handleSelectHotel(hotel)}
              nights={usePackageStore.getState().getNights()}
            />
          </Animated.View>
        ))}
      </ScrollView>
    );
  };
  
  const renderCars = () => {
    return (
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionTitle}>Select Your Car</Text>
          <Text style={styles.selectionSubtitle}>
            {tripSetup.destination?.name} • {usePackageStore.getState().getNights()} days
          </Text>
        </View>
        
        {carResults.map((car, index) => (
          <Animated.View
            key={car.id}
            entering={FadeInDown.duration(300).delay(index * 50)}
          >
            <CarCard
              car={car}
              isSelected={selections.car?.id === car.id}
              onSelect={() => handleSelectCar(car)}
              days={usePackageStore.getState().getNights()}
            />
          </Animated.View>
        ))}
        
        {carResults.length === 0 && (
          <View style={styles.emptyContainer}>
            <CarIcon size={48} color={colors.gray300} />
            <Text style={styles.emptyTitle}>No Cars Available</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search criteria
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };
  
  const renderExperiences = () => {
    return (
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionTitle}>Add Experiences</Text>
          <Text style={styles.selectionSubtitle}>
            {tripSetup.destination?.name} • Optional activities
          </Text>
        </View>
        
        {experienceResults.map((experience, index) => (
          <Animated.View
            key={experience.id}
            entering={FadeInDown.duration(300).delay(index * 50)}
          >
            <ExperienceCard
              experience={experience}
              isSelected={selections.experiences.some(e => e.id === experience.id)}
              onSelect={() => handleSelectExperience(experience)}
            />
          </Animated.View>
        ))}
        
        {experienceResults.length === 0 && (
          <View style={styles.emptyContainer}>
            <Map1 size={48} color={colors.gray300} />
            <Text style={styles.emptyTitle}>No Experiences Available</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search criteria
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryPress}
      />
      
      {/* Content Area */}
      <View style={styles.contentArea}>
        {renderContent()}
      </View>
      
      {/* Bundle Cart */}
      <View style={[styles.cartContainer, { paddingBottom: insets.bottom }]}>
        <BundleCart
          onContinue={handleContinue}
          onCategoryPress={handleCategoryPress}
        />
      </View>
    </View>
  );
}

// ============================================
// FLIGHT CARD
// ============================================

interface FlightCardProps {
  flight: Flight;
  isSelected: boolean;
  onSelect: () => void;
  type: 'outbound' | 'return';
}

function FlightCard({ flight, isSelected, onSelect, type }: FlightCardProps) {
  const segment = flight.segments[0];
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.airlineInfo}>
          <View style={styles.airlineLogo}>
            <Airplane size={20} color={colors.primary} />
          </View>
          <Text style={styles.airlineName}>{segment?.airline?.name || 'Airline'}</Text>
        </View>
        {isSelected && (
          <TickCircle size={24} color={colors.primary} variant="Bold" />
        )}
      </View>
      
      <View style={styles.flightTimes}>
        <View style={styles.timeBlock}>
          <Text style={styles.time}>{formatTime(segment?.departureTime)}</Text>
          <Text style={styles.airport}>{segment?.origin?.code}</Text>
        </View>
        
        <View style={styles.flightLine}>
          <View style={styles.line} />
          <View style={styles.durationBadge}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={styles.duration}>{formatDuration(flight.totalDuration)}</Text>
          </View>
          <Text style={styles.stops}>
            {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </Text>
        </View>
        
        <View style={styles.timeBlock}>
          <Text style={styles.time}>{formatTime(segment?.arrivalTime)}</Text>
          <Text style={styles.airport}>{segment?.destination?.code}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.price}>${flight.price.amount}</Text>
        <Text style={styles.priceLabel}>per person</Text>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// HOTEL CARD
// ============================================

interface HotelCardProps {
  hotel: Hotel;
  isSelected: boolean;
  onSelect: () => void;
  nights: number;
}

function HotelCard({ hotel, isSelected, onSelect, nights }: HotelCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: hotel.images[0]?.url }}
        style={styles.hotelImage}
        resizeMode="cover"
      />
      
      <View style={styles.hotelContent}>
        <View style={styles.hotelHeader}>
          <View style={styles.starRating}>
            {Array.from({ length: hotel.starRating }).map((_, i) => (
              <Star1 key={i} size={12} color={colors.warning} variant="Bold" />
            ))}
          </View>
          {isSelected && (
            <TickCircle size={24} color={colors.primary} variant="Bold" />
          )}
        </View>
        
        <Text style={styles.hotelName} numberOfLines={1}>{hotel.name}</Text>
        <Text style={styles.hotelLocation} numberOfLines={1}>
          {hotel.location.address}
        </Text>
        
        <View style={styles.hotelFooter}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{hotel.userRating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({hotel.reviewCount})</Text>
          </View>
          
          <View style={styles.priceBlock}>
            <Text style={styles.price}>${hotel.lowestPrice.amount * nights}</Text>
            <Text style={styles.priceLabel}>{nights} nights</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// CAR CARD
// ============================================

interface CarCardProps {
  car: Car;
  isSelected: boolean;
  onSelect: () => void;
  days: number;
}

function CarCard({ car, isSelected, onSelect, days }: CarCardProps) {
  const luggageCount = typeof car.specs?.luggage === 'object' 
    ? car.specs.luggage.large + car.specs.luggage.small 
    : car.specs?.luggage || 0;
  
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: car.images?.[0] }}
        style={styles.hotelImage}
        resizeMode="cover"
      />
      
      <View style={styles.hotelContent}>
        <View style={styles.hotelHeader}>
          <Text style={styles.categoryBadge}>{car.category?.toUpperCase()}</Text>
          {isSelected && (
            <TickCircle size={24} color={colors.primary} variant="Bold" />
          )}
        </View>
        
        <Text style={styles.hotelName} numberOfLines={1}>{car.name}</Text>
        <Text style={styles.hotelLocation} numberOfLines={1}>
          {car.rental?.company?.name}
        </Text>
        
        <View style={styles.specsRow}>
          <Text style={styles.specBadge}>{car.specs?.seats} seats</Text>
          <Text style={styles.specBadge}>{car.specs?.transmission}</Text>
          <Text style={styles.specBadge}>{luggageCount} bags</Text>
        </View>
        
        <View style={styles.hotelFooter}>
          <View style={styles.ratingBadge}>
            <Star1 size={12} color={colors.warning} variant="Bold" />
            <Text style={styles.ratingText}>{car.rental?.company?.rating?.toFixed(1)}</Text>
          </View>
          
          <View style={styles.priceBlock}>
            <Text style={styles.price}>${car.rental?.pricePerDay?.amount * days}</Text>
            <Text style={styles.priceLabel}>{days} days</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// EXPERIENCE CARD
// ============================================

interface ExperienceCardProps {
  experience: Experience;
  isSelected: boolean;
  onSelect: () => void;
}

function ExperienceCard({ experience, isSelected, onSelect }: ExperienceCardProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  };
  
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: experience.images[0] }}
        style={styles.hotelImage}
        resizeMode="cover"
      />
      
      <View style={styles.hotelContent}>
        <View style={styles.hotelHeader}>
          <View style={styles.ratingBadge}>
            <Star1 size={12} color={colors.warning} variant="Bold" />
            <Text style={styles.ratingText}>{experience.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({experience.reviewCount})</Text>
          </View>
          {isSelected && (
            <TickCircle size={24} color={colors.primary} variant="Bold" />
          )}
        </View>
        
        <Text style={styles.hotelName} numberOfLines={2}>{experience.title}</Text>
        
        <View style={styles.specsRow}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={styles.hotelLocation}>{formatDuration(experience.duration)}</Text>
          {experience.instantConfirmation && (
            <View style={styles.instantTag}>
              <TickCircle size={12} color={colors.success} variant="Bold" />
              <Text style={styles.instantTagText}>Instant</Text>
            </View>
          )}
        </View>
        
        <View style={styles.hotelFooter}>
          <Text style={styles.price}>{experience.price.formatted}</Text>
          <Text style={styles.priceLabel}>per person</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentArea: {
    flex: 1,
  },
  cartContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  
  // Results
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    padding: spacing.md,
    paddingBottom: 280, // Space for cart
  },
  selectionHeader: {
    marginBottom: spacing.md,
  },
  selectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  selectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  airlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  airlineLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  airlineName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  
  // Flight Times
  flightTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  timeBlock: {
    alignItems: 'center',
  },
  time: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  airport: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  flightLine: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  line: {
    width: '100%',
    height: 2,
    backgroundColor: colors.gray200,
    borderRadius: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  duration: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  stops: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    marginTop: 2,
  },
  
  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    padding: spacing.md,
    paddingTop: 0,
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  
  // Hotel Card
  hotelImage: {
    width: '100%',
    height: 140,
  },
  hotelContent: {
    padding: spacing.md,
  },
  hotelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  starRating: {
    flexDirection: 'row',
    gap: 2,
  },
  hotelName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  hotelLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  hotelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  reviewCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  
  // Car & Experience Card Styles
  categoryBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  specBadge: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  instantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  instantTagText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
});
