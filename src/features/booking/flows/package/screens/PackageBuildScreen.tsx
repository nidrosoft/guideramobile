/**
 * PACKAGE BUILD SCREEN
 * 
 * Main screen for building the package - selecting flights, hotels, cars, experiences.
 * Uses CategoryTabs for navigation and BundleCart for summary.
 * User must complete each required category before moving to the next.
 * 
 * HYBRID APPROACH: Shows preview cards with "View All" to open full selection sheet.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  CloseCircle,
  Airplane,
  Building,
  Car,
  Map1,
  TickCircle,
  ArrowRight2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { usePackageStore, PackageCategory } from '../../../stores/usePackageStore';

// Import existing components
import CategoryTabs from '../components/CategoryTabs';
import BundleCart from '../components/BundleCart';

// Import shared components
import { 
  FlightCard, FlightCardData,
  HotelCard, HotelCardData,
  CarCard, CarCardData,
  ExperienceCard, ExperienceCardData,
  FilterChips,
  FLIGHT_FILTERS,
  HOTEL_FILTERS,
  CAR_FILTERS,
  EXPERIENCE_FILTERS,
} from '../../../shared/components';

// Import selection sheets
import FlightSelectionSheet from '../sheets/FlightSelectionSheet';

// Import styles
import { styles } from './PackageBuildScreen.styles';

// Import mock data
import { generateMockFlights, generateMockHotels, generateMockCars, generateMockExperiences } from '../data/mockData';

interface PackageBuildScreenProps {
  onContinue: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function PackageBuildScreen({
  onContinue,
  onBack,
  onClose,
}: PackageBuildScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    tripSetup,
    activeCategory,
    setActiveCategory,
    selections,
    flightResults,
    hotelResults,
    carResults,
    experienceResults,
    setFlightResults,
    setHotelResults,
    setCarResults,
    setExperienceResults,
    selectFlight,
    selectHotel,
    selectRoom,
    selectCar,
    addExperience,
    removeExperience,
    isCategoryComplete,
    isSelectionComplete,
    getNextRequiredCategory,
    isSearching,
    setSearching,
  } = usePackageStore();

  // Sheet visibility states
  const [showFlightSheet, setShowFlightSheet] = useState(false);
  const [flightSelectionType, setFlightSelectionType] = useState<'outbound' | 'return'>('outbound');

  // Filter states for each category - dropdown filters with selected values
  const [flightActiveFilter, setFlightActiveFilter] = useState<string | null>(null);
  const [flightSelectedFilters, setFlightSelectedFilters] = useState<Record<string, string>>({});
  
  const [hotelActiveFilter, setHotelActiveFilter] = useState<string | null>(null);
  const [hotelSelectedFilters, setHotelSelectedFilters] = useState<Record<string, string>>({});
  
  const [carActiveFilter, setCarActiveFilter] = useState<string | null>(null);
  const [carSelectedFilters, setCarSelectedFilters] = useState<Record<string, string>>({});
  const [carToggleFilters, setCarToggleFilters] = useState<string[]>([]); // For toggle-style filters
  
  const [experienceActiveFilter, setExperienceActiveFilter] = useState<string | null>(null);
  const [experienceSelectedFilters, setExperienceSelectedFilters] = useState<Record<string, string>>({});

  // Filter handlers
  const handleFlightFilterPress = (filterId: string) => {
    setFlightActiveFilter(flightActiveFilter === filterId ? null : filterId);
  };
  const handleFlightFilterSelect = (filterId: string, value: string) => {
    setFlightSelectedFilters(prev => ({ ...prev, [filterId]: value }));
    setFlightActiveFilter(null);
  };

  const handleHotelFilterPress = (filterId: string) => {
    setHotelActiveFilter(hotelActiveFilter === filterId ? null : filterId);
  };
  const handleHotelFilterSelect = (filterId: string, value: string) => {
    setHotelSelectedFilters(prev => ({ ...prev, [filterId]: value }));
    setHotelActiveFilter(null);
  };

  const handleCarFilterPress = (filterId: string) => {
    setCarActiveFilter(carActiveFilter === filterId ? null : filterId);
  };
  const handleCarFilterSelect = (filterId: string, value: string) => {
    setCarSelectedFilters(prev => ({ ...prev, [filterId]: value }));
    setCarActiveFilter(null);
  };
  const handleCarToggleFilter = (filterId: string) => {
    setCarToggleFilters(prev => 
      prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId]
    );
  };

  const handleExperienceFilterPress = (filterId: string) => {
    setExperienceActiveFilter(experienceActiveFilter === filterId ? null : filterId);
  };
  const handleExperienceFilterSelect = (filterId: string, value: string) => {
    setExperienceSelectedFilters(prev => ({ ...prev, [filterId]: value }));
    setExperienceActiveFilter(null);
  };

  // Load results when category changes
  useEffect(() => {
    loadCategoryResults(activeCategory);
  }, [activeCategory]);

  // Auto-advance to next category when current is complete
  useEffect(() => {
    if (isCategoryComplete(activeCategory)) {
      const nextCategory = getNextRequiredCategory();
      if (nextCategory && nextCategory !== activeCategory) {
        // Small delay for UX
        setTimeout(() => {
          setActiveCategory(nextCategory);
        }, 500);
      }
    }
  }, [selections]);

  const loadCategoryResults = async (category: PackageCategory) => {
    // Skip if already loaded
    if (category === 'flight' && flightResults.length > 0) return;
    if (category === 'hotel' && hotelResults.length > 0) return;
    if (category === 'car' && carResults.length > 0) return;
    if (category === 'experience' && experienceResults.length > 0) return;

    setSearching(category, true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    switch (category) {
      case 'flight':
        setFlightResults(generateMockFlights(tripSetup));
        break;
      case 'hotel':
        setHotelResults(generateMockHotels(tripSetup));
        break;
      case 'car':
        setCarResults(generateMockCars(tripSetup));
        break;
      case 'experience':
        setExperienceResults(generateMockExperiences(tripSetup));
        break;
    }
    
    setSearching(category, false);
  };

  const handleCategoryChange = (category: PackageCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(category);
  };

  const handleFlightSelect = (flight: any, type: 'outbound' | 'return') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectFlight(type, flight);
  };

  const handleViewAllFlights = (type: 'outbound' | 'return') => {
    setFlightSelectionType(type);
    setShowFlightSheet(true);
  };

  const handleFlightSheetSelect = (flight: FlightCardData) => {
    selectFlight(flightSelectionType, flight as any);
  };

  // Convert mock flights to FlightCardData format
  const flightCardData: FlightCardData[] = useMemo(() => {
    return flightResults.map((flight: any) => ({
      id: flight.id,
      airlineName: flight.segments?.[0]?.airline?.name || 'Airline',
      airlineCode: flight.segments?.[0]?.airline?.code || 'XX',
      flightNumber: flight.segments?.[0]?.flightNumber || 'XX000',
      originCode: flight.segments?.[0]?.origin?.code || tripSetup.origin?.code || 'DEP',
      destCode: flight.segments?.[0]?.destination?.code || tripSetup.destination?.code || 'ARR',
      departureTime: flight.segments?.[0]?.departureTime || new Date(),
      arrivalTime: flight.segments?.[0]?.arrivalTime || new Date(),
      duration: flight.totalDuration || 180,
      stops: flight.stops || 0,
      price: flight.price?.amount || 0,
      seatsAvailable: flight.seatsAvailable,
    }));
  }, [flightResults, tripSetup]);

  const handleHotelSelect = (hotel: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectHotel(hotel);
    // Auto-select first room
    if (hotel.rooms && hotel.rooms.length > 0) {
      selectRoom(hotel.rooms[0]);
    }
  };

  const handleCarSelect = (car: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectCar(car);
  };

  const handleExperienceToggle = (experience: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isSelected = selections.experiences.some(e => e.id === experience.id);
    if (isSelected) {
      removeExperience(experience.id);
    } else {
      addExperience(experience);
    }
  };

  const handleContinue = () => {
    if (isSelectionComplete()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onContinue();
    }
  };

  // Render flight results with FlightCard components
  const renderFlightResults = () => {
    if (isSearching.flight) {
      return <LoadingState message="Finding best flights..." />;
    }

    const needsOutbound = !selections.flight.outbound;
    const needsReturn = selections.flight.outbound && !selections.flight.return;
    const currentType = needsOutbound ? 'outbound' : 'return';
    const selectedId = currentType === 'outbound' 
      ? selections.flight.outbound?.id 
      : selections.flight.return?.id;

    // Show top 3 flights as preview
    const previewFlights = flightCardData.slice(0, 3);

    return (
      <View style={styles.resultsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.resultsTitle}>
            {needsOutbound ? 'Select Outbound Flight' : needsReturn ? 'Select Return Flight' : 'Flights Selected'}
          </Text>
          <Text style={styles.resultsSubtitle}>
            {tripSetup.origin?.code} → {tripSetup.destination?.code}
          </Text>
        </View>
        
        {/* Preview Flight Cards */}
        {previewFlights.map((flight, index) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            index={index}
            isSelected={flight.id === selectedId}
            isRecommended={index === 0}
            isBestDeal={index === 1}
            compact
            onPress={() => handleFlightSelect(flight, currentType)}
          />
        ))}

        {/* View All Button */}
        {flightCardData.length > 3 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => handleViewAllFlights(currentType)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>
              View All {flightCardData.length} Flights
            </Text>
            <ArrowRight2 size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Convert hotel results to HotelCardData format
  const hotelCardData: HotelCardData[] = useMemo(() => {
    return hotelResults.map((hotel: any) => ({
      id: hotel.id,
      name: hotel.name,
      starRating: hotel.starRating || 4,
      userRating: hotel.userRating || 4.5,
      reviewCount: hotel.reviewCount,
      location: {
        city: hotel.location?.city,
        neighborhood: hotel.location?.neighborhood,
        address: hotel.location?.address || 'City Center',
      },
      pricePerNight: hotel.pricePerNight?.amount || 0,
      images: hotel.images?.map((img: any) => img.url || img) || [],
      amenities: hotel.amenities?.map((a: any) => a.name || a) || ['WiFi', 'Pool'],
    }));
  }, [hotelResults]);

  // Render hotel results with HotelCard components
  const renderHotelResults = () => {
    if (isSearching.hotel) {
      return <LoadingState message="Finding best hotels..." />;
    }

    // Calculate nights
    const nights = tripSetup.departureDate && tripSetup.returnDate
      ? Math.ceil((tripSetup.returnDate.getTime() - tripSetup.departureDate.getTime()) / (1000 * 60 * 60 * 24))
      : 1;

    return (
      <View style={styles.resultsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.resultsTitle}>Select Hotel</Text>
          <Text style={styles.resultsSubtitle}>{hotelCardData.length} hotels available</Text>
        </View>
        
        {/* Hotel Cards */}
        {hotelCardData.slice(0, 3).map((hotel, index) => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            nights={nights}
            index={index}
            isSelected={selections.hotel.hotel?.id === hotel.id}
            compact
            onPress={() => handleHotelSelect(hotelResults[index])}
          />
        ))}

        {/* View All Button */}
        {hotelCardData.length > 3 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => {/* TODO: Open hotel selection sheet */}}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>
              View All {hotelCardData.length} Hotels
            </Text>
            <ArrowRight2 size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Convert car results to CarCardData format
  const carCardData: CarCardData[] = useMemo(() => {
    return carResults.map((car: any) => ({
      id: car.id,
      name: car.name || `${car.make} ${car.model}`,
      make: car.make,
      model: car.model,
      category: car.category,
      pricePerDay: car.rental?.pricePerDay?.amount || car.rental?.pricePerDay || 0,
      images: car.images || [],
      specs: {
        seats: car.specs?.seats || 5,
        luggage: car.specs?.luggage || { large: 2, small: 1 },
        transmission: car.specs?.transmission || 'automatic',
        airConditioning: car.specs?.airConditioning ?? true,
        mileage: car.specs?.mileage || 'unlimited',
      },
      company: {
        name: car.rental?.company?.name || 'Rental Co',
        rating: car.rental?.company?.rating || 4.5,
      },
      popularChoice: car.popularChoice,
    }));
  }, [carResults]);

  // Render car results with CarCard components
  const renderCarResults = () => {
    if (isSearching.car) {
      return <LoadingState message="Finding best cars..." />;
    }

    // Calculate days
    const days = tripSetup.departureDate && tripSetup.returnDate
      ? Math.ceil((tripSetup.returnDate.getTime() - tripSetup.departureDate.getTime()) / (1000 * 60 * 60 * 24))
      : 1;

    return (
      <View style={styles.resultsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.resultsTitle}>Select Car</Text>
          <Text style={styles.resultsSubtitle}>{carCardData.length} cars available</Text>
        </View>
        
        {/* Car Cards */}
        {carCardData.slice(0, 3).map((car, index) => (
          <CarCard
            key={car.id}
            car={car}
            days={days}
            index={index}
            isSelected={selections.car?.id === car.id}
            compact
            onPress={() => handleCarSelect(carResults[index])}
          />
        ))}

        {/* View All Button */}
        {carCardData.length > 3 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => {/* TODO: Open car selection sheet */}}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>
              View All {carCardData.length} Cars
            </Text>
            <ArrowRight2 size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Convert experience results to ExperienceCardData format
  const experienceCardData: ExperienceCardData[] = useMemo(() => {
    return experienceResults.map((exp: any) => ({
      id: exp.id,
      title: exp.title,
      shortDescription: exp.shortDescription,
      images: exp.images || ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400'],
      category: exp.category,
      duration: exp.duration || 180,
      price: exp.price?.amount || 0,
      rating: exp.rating || 4.5,
      reviewCount: exp.reviewCount || 100,
      bestSeller: exp.bestSeller,
      featured: exp.featured,
    }));
  }, [experienceResults]);

  // Render experience results with ExperienceCard components
  const renderExperienceResults = () => {
    if (isSearching.experience) {
      return <LoadingState message="Finding activities..." />;
    }

    return (
      <View style={styles.resultsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.resultsTitle}>Select Experiences</Text>
          <Text style={styles.resultsSubtitle}>Add activities to your package</Text>
        </View>
        
        {/* Experience Cards */}
        {experienceCardData.slice(0, 3).map((experience, index) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            index={index}
            isSelected={selections.experiences.some(e => e.id === experience.id)}
            compact
            onPress={() => handleExperienceToggle(experienceResults[index])}
          />
        ))}

        {/* View All Button */}
        {experienceCardData.length > 3 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => {/* TODO: Open experience selection sheet */}}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>
              View All {experienceCardData.length} Experiences
            </Text>
            <ArrowRight2 size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render content based on active category
  const renderContent = () => {
    switch (activeCategory) {
      case 'flight':
        return renderFlightResults();
      case 'hotel':
        return renderHotelResults();
      case 'car':
        return renderCarResults();
      case 'experience':
        return renderExperienceResults();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Build Package</Text>
          <Text style={styles.headerSubtitle}>
            {tripSetup.destination?.name || 'Your Trip'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
          <CloseCircle size={24} color={colors.textSecondary} variant="Bold" />
        </TouchableOpacity>
      </View>
      
      {/* Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />
      
      {/* Sticky Filters Section */}
      <View style={styles.stickyFiltersContainer}>
        {activeCategory === 'flight' && !isSearching.flight && (
          <FilterChips
            filters={FLIGHT_FILTERS}
            activeFilter={flightActiveFilter}
            selectedFilters={flightSelectedFilters}
            onFilterPress={handleFlightFilterPress}
            onFilterSelect={handleFlightFilterSelect}
          />
        )}
        {activeCategory === 'hotel' && !isSearching.hotel && (
          <FilterChips
            filters={HOTEL_FILTERS}
            activeFilter={hotelActiveFilter}
            selectedFilters={hotelSelectedFilters}
            onFilterPress={handleHotelFilterPress}
            onFilterSelect={handleHotelFilterSelect}
          />
        )}
        {activeCategory === 'car' && !isSearching.car && (
          <FilterChips
            filters={CAR_FILTERS}
            activeFilter={carActiveFilter}
            selectedFilters={carSelectedFilters}
            toggleFilters={carToggleFilters}
            onFilterPress={handleCarFilterPress}
            onFilterSelect={handleCarFilterSelect}
            onToggleFilter={handleCarToggleFilter}
          />
        )}
        {activeCategory === 'experience' && !isSearching.experience && (
          <FilterChips
            filters={EXPERIENCE_FILTERS}
            activeFilter={experienceActiveFilter}
            selectedFilters={experienceSelectedFilters}
            onFilterPress={handleExperienceFilterPress}
            onFilterSelect={handleExperienceFilterSelect}
          />
        )}
      </View>
      
      {/* Content - Cards scroll under the sticky filters */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
      
      {/* Bundle Cart - Fixed at bottom */}
      <View style={styles.cartWrapper}>
        <BundleCart
          onContinue={handleContinue}
          onCategoryPress={handleCategoryChange}
          bottomInset={insets.bottom}
        />
      </View>

      {/* Flight Selection Sheet */}
      <FlightSelectionSheet
        visible={showFlightSheet}
        onClose={() => setShowFlightSheet(false)}
        onSelect={handleFlightSheetSelect}
        tripSetup={tripSetup}
        flights={flightCardData}
        selectedId={
          flightSelectionType === 'outbound'
            ? selections.flight.outbound?.id
            : selections.flight.return?.id
        }
        title={flightSelectionType === 'outbound' ? 'Select Outbound Flight' : 'Select Return Flight'}
      />
    </View>
  );
}

// Loading State Component
function LoadingState({ message }: { message: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}
