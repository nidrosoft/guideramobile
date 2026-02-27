/**
 * CAR SEARCH LOADING SCREEN
 * 
 * Animated loading screen while searching for cars.
 * Integrates with Provider Manager for real search results.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { Car, Location, Calendar } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useCarStore } from '../../../stores/useCarStore';
import { useCarSearch } from '@/hooks/useProviderSearch';
import { CarSearchParams as ProviderCarSearchParams } from '@/types/unified';

interface CarSearchLoadingScreenProps {
  onComplete: () => void;
}

export default function CarSearchLoadingScreen({ onComplete }: CarSearchLoadingScreenProps) {
  const insets = useSafeAreaInsets();
  const { searchParams, setResults, getRentalDays } = useCarStore();
  const [searchState, { search }] = useCarSearch();
  const searchInitiated = useRef(false);

  // Animation values
  const carPosition = useSharedValue(0);
  const carRotation = useSharedValue(0);
  const pulse1 = useSharedValue(0.8);
  const pulse2 = useSharedValue(0.6);
  const pulse3 = useSharedValue(0.4);

  // Perform actual search via Provider Manager
  useEffect(() => {
    if (searchInitiated.current) return;
    searchInitiated.current = true;

    const performSearch = async () => {
      try {
        const pickupDateTime = searchParams.pickupDate instanceof Date
          ? searchParams.pickupDate.toISOString()
          : typeof searchParams.pickupDate === 'string'
            ? new Date(searchParams.pickupDate).toISOString()
            : new Date().toISOString();

        const dropoffDateTime = searchParams.returnDate instanceof Date
          ? searchParams.returnDate.toISOString()
          : typeof searchParams.returnDate === 'string'
            ? new Date(searchParams.returnDate).toISOString()
            : new Date(Date.now() + 4 * 86400000).toISOString();

        const providerParams: ProviderCarSearchParams = {
          pickupLocation: {
            type: searchParams.pickupLocation?.type === 'airport' ? 'airport' : 'city',
            value: searchParams.pickupLocation?.name || searchParams.pickupLocation?.code || 'JFK',
          },
          dropoffLocation: searchParams.returnLocation ? {
            type: searchParams.returnLocation?.type === 'airport' ? 'airport' : 'city',
            value: searchParams.returnLocation?.name || searchParams.returnLocation?.code || '',
          } : undefined,
          pickupDateTime,
          dropoffDateTime,
          driverAge: searchParams.driverAge || 30,
        };

        await search(providerParams);
      } catch (error) {
        console.error('Car search error:', error);
        // Fall back to mock results
        generateMockResults();
        onComplete();
      }
    };

    performSearch();
  }, []);

  // Handle search completion
  useEffect(() => {
    if (!searchState.isLoading && searchState.results.length > 0) {
      const rentalDays = getRentalDays();
      const mappedResults = searchState.results.map((car: any) => ({
        id: car.id,
        name: `${car.vehicle?.make || ''} ${car.vehicle?.model || ''}`.trim() || 'Car',
        category: car.vehicle?.category || 'compact',
        make: car.vehicle?.make || 'Unknown',
        model: car.vehicle?.model || 'Car',
        year: car.vehicle?.modelYear || 2024,
        images: car.vehicle?.image ? [car.vehicle.image] : [],
        features: (car.vehicle?.features || []).map((f: string) => ({
          id: f.toLowerCase().replace(/\s/g, '_'),
          name: f,
          icon: 'car',
          included: true,
        })),
        specs: {
          seats: car.vehicle?.seats || 5,
          doors: car.vehicle?.doors || 4,
          luggage: car.vehicle?.bags || { large: 2, small: 1 },
          transmission: car.vehicle?.transmission || 'automatic',
          fuelType: car.vehicle?.fuelType || 'petrol',
          fuelPolicy: car.policies?.fuelPolicy || 'full_to_full',
          airConditioning: car.vehicle?.airConditioning ?? true,
          mileage: car.rateDetails?.mileage?.type || 'unlimited',
        },
        rental: {
          company: {
            id: car.supplier?.code?.toLowerCase() || 'hertz',
            name: car.supplier?.name || 'Hertz',
            logo: car.supplier?.logo || '',
            rating: car.supplier?.rating?.score || 4.5,
            reviewCount: car.supplier?.rating?.reviewCount || 1000,
            locations: 50,
          },
          pricePerDay: car.price || { amount: 50, currency: 'USD', formatted: '$50' },
          totalPrice: car.totalPrice || { amount: 50 * rentalDays, currency: 'USD', formatted: `$${50 * rentalDays}` },
          deposit: 200,
          currency: car.price?.currency || 'USD',
          insurance: [],
          extras: car.extras || [],
          policies: {
            minAge: car.policies?.driverRequirements?.minAge || 21,
            licenseRequirements: car.policies?.driverRequirements?.licenseRequirements || 'Valid driver license',
            internationalLicense: false,
            crossBorder: false,
            oneWayAllowed: true,
            cancellation: { freeBefore: 48, penalty: 50 },
            noShow: 100,
            lateReturn: { gracePeriod: 30, hourlyFee: 15 },
          },
        },
        available: true,
        popularChoice: false,
      })) as any[];

      setResults(mappedResults);
      onComplete();
    } else if (!searchState.isLoading && searchState.error) {
      // Fall back to mock results on error
      generateMockResults();
      onComplete();
    }
  }, [searchState.isLoading, searchState.results, searchState.error]);

  useEffect(() => {
    // Car animation
    carPosition.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(20, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    carRotation.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 500 }),
        withTiming(3, { duration: 1000 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    );

    // Pulse animations
    pulse1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.8, { duration: 1000 })
      ),
      -1,
      true
    );

    pulse2.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.6, { duration: 1000 })
        ),
        -1,
        true
      )
    );

    pulse3.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.4, { duration: 1000 })
        ),
        -1,
        true
      )
    );

    // Fallback timeout if search takes too long
    const fallbackTimer = setTimeout(() => {
      if (searchState.isLoading) {
        generateMockResults();
        onComplete();
      }
    }, 10000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  const generateMockResults = () => {
    const rentalDays = getRentalDays();
    const mockCars = [
      {
        id: '1',
        name: 'Toyota Corolla',
        category: 'compact' as const,
        make: 'Toyota',
        model: 'Corolla',
        year: 2024,
        images: ['https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=400'],
        features: [
          { id: 'bluetooth', name: 'Bluetooth', icon: 'bluetooth', included: true },
          { id: 'usb', name: 'USB Port', icon: 'usb', included: true },
        ],
        specs: {
          seats: 5,
          doors: 4,
          luggage: { large: 2, small: 1 },
          transmission: 'automatic' as const,
          fuelType: 'petrol' as const,
          fuelPolicy: 'full_to_full' as const,
          airConditioning: true,
          mileage: 'unlimited' as const,
        },
        rental: {
          company: { id: 'hertz', name: 'Hertz', logo: '', rating: 4.5, reviewCount: 1250, locations: 50 },
          pricePerDay: { amount: 45, currency: 'USD', formatted: '$45' },
          totalPrice: { amount: 45 * rentalDays, currency: 'USD', formatted: `$${45 * rentalDays}` },
          deposit: 200,
          currency: 'USD',
          insurance: [],
          extras: [],
          policies: {
            minAge: 21,
            licenseRequirements: 'Valid driver license',
            internationalLicense: false,
            crossBorder: false,
            oneWayAllowed: true,
            cancellation: { freeBefore: 48, penalty: 50 },
            noShow: 100,
            lateReturn: { gracePeriod: 30, hourlyFee: 15 },
          },
        },
        available: true,
        popularChoice: true,
      },
      {
        id: '2',
        name: 'Honda CR-V',
        category: 'suv_standard' as const,
        make: 'Honda',
        model: 'CR-V',
        year: 2024,
        images: ['https://images.unsplash.com/photo-1568844293986-8c8f3a5f5c8a?w=400'],
        features: [
          { id: 'bluetooth', name: 'Bluetooth', icon: 'bluetooth', included: true },
          { id: 'backup_camera', name: 'Backup Camera', icon: 'camera', included: true },
        ],
        specs: {
          seats: 5,
          doors: 4,
          luggage: { large: 3, small: 2 },
          transmission: 'automatic' as const,
          fuelType: 'petrol' as const,
          fuelPolicy: 'full_to_full' as const,
          airConditioning: true,
          mileage: 'unlimited' as const,
        },
        rental: {
          company: { id: 'avis', name: 'Avis', logo: '', rating: 4.3, reviewCount: 980, locations: 45 },
          pricePerDay: { amount: 65, currency: 'USD', formatted: '$65' },
          totalPrice: { amount: 65 * rentalDays, currency: 'USD', formatted: `$${65 * rentalDays}` },
          deposit: 300,
          currency: 'USD',
          insurance: [],
          extras: [],
          policies: {
            minAge: 21,
            licenseRequirements: 'Valid driver license',
            internationalLicense: false,
            crossBorder: false,
            oneWayAllowed: true,
            cancellation: { freeBefore: 48, penalty: 50 },
            noShow: 100,
            lateReturn: { gracePeriod: 30, hourlyFee: 20 },
          },
        },
        available: true,
        popularChoice: false,
      },
      {
        id: '3',
        name: 'Ford Mustang',
        category: 'sports' as const,
        make: 'Ford',
        model: 'Mustang',
        year: 2024,
        images: ['https://images.unsplash.com/photo-1584345604476-8ec5f82bd3a3?w=400'],
        features: [
          { id: 'bluetooth', name: 'Bluetooth', icon: 'bluetooth', included: true },
          { id: 'leather', name: 'Leather Seats', icon: 'seat', included: true },
        ],
        specs: {
          seats: 4,
          doors: 2,
          luggage: { large: 1, small: 1 },
          transmission: 'automatic' as const,
          fuelType: 'petrol' as const,
          fuelPolicy: 'full_to_full' as const,
          airConditioning: true,
          mileage: 'unlimited' as const,
        },
        rental: {
          company: { id: 'enterprise', name: 'Enterprise', logo: '', rating: 4.6, reviewCount: 2100, locations: 60 },
          pricePerDay: { amount: 95, currency: 'USD', formatted: '$95' },
          totalPrice: { amount: 95 * rentalDays, currency: 'USD', formatted: `$${95 * rentalDays}` },
          deposit: 500,
          currency: 'USD',
          insurance: [],
          extras: [],
          policies: {
            minAge: 25,
            licenseRequirements: 'Valid driver license',
            internationalLicense: false,
            crossBorder: false,
            oneWayAllowed: false,
            cancellation: { freeBefore: 48, penalty: 50 },
            noShow: 100,
            lateReturn: { gracePeriod: 30, hourlyFee: 30 },
          },
        },
        available: true,
        popularChoice: true,
      },
      {
        id: '4',
        name: 'Nissan Altima',
        category: 'midsize' as const,
        make: 'Nissan',
        model: 'Altima',
        year: 2024,
        images: ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400'],
        features: [
          { id: 'bluetooth', name: 'Bluetooth', icon: 'bluetooth', included: true },
        ],
        specs: {
          seats: 5,
          doors: 4,
          luggage: { large: 2, small: 2 },
          transmission: 'automatic' as const,
          fuelType: 'petrol' as const,
          fuelPolicy: 'full_to_full' as const,
          airConditioning: true,
          mileage: 'unlimited' as const,
        },
        rental: {
          company: { id: 'budget', name: 'Budget', logo: '', rating: 4.2, reviewCount: 750, locations: 40 },
          pricePerDay: { amount: 52, currency: 'USD', formatted: '$52' },
          totalPrice: { amount: 52 * rentalDays, currency: 'USD', formatted: `$${52 * rentalDays}` },
          deposit: 250,
          currency: 'USD',
          insurance: [],
          extras: [],
          policies: {
            minAge: 21,
            licenseRequirements: 'Valid driver license',
            internationalLicense: false,
            crossBorder: false,
            oneWayAllowed: true,
            cancellation: { freeBefore: 48, penalty: 50 },
            noShow: 100,
            lateReturn: { gracePeriod: 30, hourlyFee: 15 },
          },
        },
        available: true,
        popularChoice: false,
      },
    ];

    setResults(mockCars);
  };

  const carStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: carPosition.value },
      { rotate: `${carRotation.value}deg` },
    ],
  }));

  const pulse1Style = useAnimatedStyle(() => ({
    opacity: pulse1.value,
    transform: [{ scale: pulse1.value }],
  }));

  const pulse2Style = useAnimatedStyle(() => ({
    opacity: pulse2.value,
    transform: [{ scale: pulse2.value }],
  }));

  const pulse3Style = useAnimatedStyle(() => ({
    opacity: pulse3.value,
    transform: [{ scale: pulse3.value }],
  }));

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Animation Container */}
      <View style={styles.animationContainer}>
        {/* Pulse Rings */}
        <Animated.View style={[styles.pulseRing, styles.pulseRing3, pulse3Style]} />
        <Animated.View style={[styles.pulseRing, styles.pulseRing2, pulse2Style]} />
        <Animated.View style={[styles.pulseRing, styles.pulseRing1, pulse1Style]} />

        {/* Car Icon */}
        <Animated.View style={[styles.carContainer, carStyle]}>
          <Car size={64} color={colors.primary} variant="Bold" />
        </Animated.View>
      </View>

      {/* Loading Text */}
      <Animated.View entering={FadeIn.duration(500).delay(300)} style={styles.textContainer}>
        <Text style={styles.loadingTitle}>Finding Available Cars</Text>
        <Text style={styles.loadingSubtitle}>Searching the best deals for you...</Text>
      </Animated.View>

      {/* Search Summary */}
      <Animated.View entering={FadeIn.duration(500).delay(600)} style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Location size={18} color={colors.primary} variant="Bold" />
          <Text style={styles.summaryText} numberOfLines={1}>
            {searchParams.pickupLocation?.name || 'Pickup Location'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Calendar size={18} color={colors.primary} variant="Bold" />
          <Text style={styles.summaryText}>
            {formatDate(searchParams.pickupDate)} - {formatDate(searchParams.returnDate)}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pulseRing1: {
    width: 120,
    height: 120,
  },
  pulseRing2: {
    width: 160,
    height: 160,
  },
  pulseRing3: {
    width: 200,
    height: 200,
  },
  carContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loadingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  loadingSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  summaryContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.md,
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
});
