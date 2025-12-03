/**
 * CAR RENTAL RESULTS STEP
 * 
 * Browse and filter available vehicles.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Car as CarIcon,
  People,
  Bag2,
  Setting4,
  TickCircle,
  Star1,
  Filter,
  Sort,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useCarStore } from '../../../stores/useCarStore';
import { Car, CAR_CATEGORY_LABELS } from '../../../types/car.types';

interface ResultsStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

// Mock car data generator
const generateMockCars = (): Car[] => {
  const cars: Car[] = [];
  const categories = ['economy', 'compact', 'midsize', 'fullsize', 'suv_standard', 'luxury'] as const;
  const makes = [
    { make: 'Toyota', models: ['Corolla', 'Camry', 'RAV4'] },
    { make: 'Honda', models: ['Civic', 'Accord', 'CR-V'] },
    { make: 'Ford', models: ['Focus', 'Fusion', 'Explorer'] },
    { make: 'Chevrolet', models: ['Cruze', 'Malibu', 'Equinox'] },
    { make: 'BMW', models: ['3 Series', '5 Series', 'X3'] },
    { make: 'Mercedes', models: ['C-Class', 'E-Class', 'GLC'] },
  ];
  const companies = [
    { id: 'enterprise', name: 'Enterprise', rating: 4.5 },
    { id: 'hertz', name: 'Hertz', rating: 4.3 },
    { id: 'avis', name: 'Avis', rating: 4.2 },
    { id: 'budget', name: 'Budget', rating: 4.0 },
    { id: 'national', name: 'National', rating: 4.4 },
  ];
  
  categories.forEach((category, catIndex) => {
    const makeData = makes[catIndex % makes.length];
    const model = makeData.models[catIndex % makeData.models.length];
    const company = companies[catIndex % companies.length];
    const basePrice = 35 + catIndex * 15;
    
    cars.push({
      id: `car-${catIndex}`,
      name: `${makeData.make} ${model} or similar`,
      category,
      make: makeData.make,
      model,
      year: 2023,
      images: [`https://via.placeholder.com/300x200?text=${makeData.make}+${model}`],
      features: [
        { id: 'ac', name: 'Air Conditioning', icon: 'wind', included: true },
        { id: 'bluetooth', name: 'Bluetooth', icon: 'bluetooth', included: true },
        { id: 'usb', name: 'USB Port', icon: 'usb', included: true },
      ],
      specs: {
        seats: category === 'suv_standard' ? 7 : category === 'economy' ? 4 : 5,
        doors: category === 'economy' ? 2 : 4,
        luggage: {
          large: category === 'economy' ? 1 : category === 'suv_standard' ? 4 : 2,
          small: category === 'economy' ? 1 : 2,
        },
        transmission: catIndex % 3 === 0 ? 'manual' : 'automatic',
        fuelType: 'petrol',
        fuelPolicy: 'full_to_full',
        airConditioning: true,
        mileage: 'unlimited',
      },
      rental: {
        company: {
          id: company.id,
          name: company.name,
          logo: '',
          rating: company.rating,
          reviewCount: 500 + catIndex * 100,
          locations: 50,
        },
        pricePerDay: { amount: basePrice, currency: 'USD', formatted: `$${basePrice}` },
        totalPrice: { amount: basePrice * 4, currency: 'USD', formatted: `$${basePrice * 4}` },
        deposit: 200 + catIndex * 50,
        currency: 'USD',
        insurance: [],
        extras: [],
        policies: {
          minAge: 21,
          maxAge: 75,
          youngDriverFee: { age: 25, fee: 15 },
          licenseRequirements: 'Valid driver\'s license required',
          internationalLicense: false,
          crossBorder: false,
          oneWayAllowed: true,
          oneWayFee: 50,
          cancellation: { freeBefore: 48, penalty: 100 },
          noShow: 100,
          lateReturn: { gracePeriod: 30, hourlyFee: 15 },
        },
      },
      available: true,
      popularChoice: catIndex === 1 || catIndex === 2,
    });
  });
  
  return cars;
};

export default function ResultsStep({ onNext, onBack, onClose }: ResultsStepProps) {
  const insets = useSafeAreaInsets();
  const {
    searchParams,
    results,
    isSearching,
    setResults,
    setIsSearching,
    selectCar,
    selectedCar,
    getFilteredResults,
    getRentalDays,
    sortBy,
    setSortBy,
  } = useCarStore();
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Load results on mount
  useEffect(() => {
    if (results.length === 0) {
      loadResults();
    }
  }, []);
  
  const loadResults = async () => {
    setIsSearching(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockCars = generateMockCars();
    setResults(mockCars);
    setIsSearching(false);
  };
  
  const handleSelectCar = (car: Car) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectCar(car);
    onNext();
  };
  
  const rentalDays = getRentalDays();
  const filteredResults = getFilteredResults();
  
  const formatLocation = () => {
    return searchParams.pickupLocation?.name || 'Location';
  };
  
  if (isSearching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding available cars...</Text>
        <Text style={styles.loadingSubtext}>{formatLocation()}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header Info */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{filteredResults.length} cars available</Text>
          <Text style={styles.headerSubtitle}>
            {formatLocation()} • {rentalDays} day{rentalDays > 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const sorts: ('price' | 'recommended' | 'size')[] = ['recommended', 'price', 'size'];
              const currentIndex = sorts.indexOf(sortBy);
              setSortBy(sorts[(currentIndex + 1) % sorts.length]);
            }}
          >
            <Sort size={18} color={colors.primary} />
            <Text style={styles.headerButtonText}>
              {sortBy === 'price' ? 'Price' : sortBy === 'size' ? 'Size' : 'Best'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {/* Results List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredResults.map((car, index) => (
          <Animated.View
            key={car.id}
            entering={FadeInDown.duration(300).delay(index * 50)}
          >
            <CarCard
              car={car}
              rentalDays={rentalDays}
              onSelect={() => handleSelectCar(car)}
              isSelected={selectedCar?.id === car.id}
            />
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================
// CAR CARD
// ============================================

interface CarCardProps {
  car: Car;
  rentalDays: number;
  onSelect: () => void;
  isSelected: boolean;
}

function CarCard({ car, rentalDays, onSelect, isSelected }: CarCardProps) {
  const totalPrice = car.rental.pricePerDay.amount * rentalDays;
  
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {/* Popular Badge */}
      {car.popularChoice && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>Popular</Text>
        </View>
      )}
      
      {/* Car Image */}
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <CarIcon size={48} color={colors.gray300} />
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {CAR_CATEGORY_LABELS[car.category] || car.category}
          </Text>
        </View>
      </View>
      
      {/* Car Info */}
      <View style={styles.cardContent}>
        <Text style={styles.carName} numberOfLines={1}>{car.name}</Text>
        
        {/* Specs Row */}
        <View style={styles.specsRow}>
          <View style={styles.specItem}>
            <People size={14} color={colors.textSecondary} />
            <Text style={styles.specText}>{car.specs.seats}</Text>
          </View>
          <View style={styles.specItem}>
            <Bag2 size={14} color={colors.textSecondary} />
            <Text style={styles.specText}>{car.specs.luggage.large + car.specs.luggage.small}</Text>
          </View>
          <View style={styles.specItem}>
            <Setting4 size={14} color={colors.textSecondary} />
            <Text style={styles.specText}>
              {car.specs.transmission === 'automatic' ? 'Auto' : 'Manual'}
            </Text>
          </View>
          {car.specs.airConditioning && (
            <View style={styles.specItem}>
              <Text style={styles.specText}>A/C</Text>
            </View>
          )}
        </View>
        
        {/* Company & Rating */}
        <View style={styles.companyRow}>
          <Text style={styles.companyName}>{car.rental.company.name}</Text>
          <View style={styles.ratingBadge}>
            <Star1 size={12} color={colors.warning} variant="Bold" />
            <Text style={styles.ratingText}>{car.rental.company.rating}</Text>
          </View>
        </View>
        
        {/* Features */}
        <View style={styles.featuresRow}>
          {car.specs.mileage === 'unlimited' && (
            <View style={styles.featureBadge}>
              <TickCircle size={12} color={colors.success} variant="Bold" />
              <Text style={styles.featureText}>Unlimited miles</Text>
            </View>
          )}
          <View style={styles.featureBadge}>
            <TickCircle size={12} color={colors.success} variant="Bold" />
            <Text style={styles.featureText}>Free cancellation</Text>
          </View>
        </View>
        
        {/* Price */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.pricePerDay}>${car.rental.pricePerDay.amount}/day</Text>
          </View>
          <View style={styles.totalPrice}>
            <Text style={styles.totalAmount}>${totalPrice}</Text>
            <Text style={styles.totalLabel}>total</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  loadingSubtext: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerInfo: {},
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
  },
  headerButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md },
  
  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  
  popularBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  popularText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textTransform: 'uppercase',
  },
  
  imageContainer: {
    height: 120,
    backgroundColor: colors.gray50,
    position: 'relative',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textTransform: 'uppercase',
  },
  
  cardContent: { padding: spacing.md },
  carName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  specsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  
  featuresRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
  },
  
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  pricePerDay: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  totalPrice: { alignItems: 'flex-end' },
  totalAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  totalLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});
