/**
 * CAR SEARCH LOADING SCREEN
 *
 * Animated loading screen while searching for cars.
 * Integrates with Provider Manager for real search results.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
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
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useCarStore } from '../../../stores/useCarStore';
import { useCarSearch } from '@/hooks/useProviderSearch';
import { CarSearchParams as ProviderCarSearchParams } from '@/types/unified';

interface CarSearchLoadingScreenProps {
  onComplete: () => void;
}

export default function CarSearchLoadingScreen({ onComplete }: CarSearchLoadingScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { searchParams, setResults, getRentalDays } = useCarStore();
  const [searchState, { search }] = useCarSearch();
  const searchInitiated = useRef(false);
  const hasStartedLoading = useRef(false);
  const hasNavigated = useRef(false);
  const minTimeReached = useRef(false);
  const pendingResults = useRef<any[] | null>(null);

  const carPosition = useSharedValue(0);
  const carRotation = useSharedValue(0);
  const pulse1 = useSharedValue(0.8);
  const pulse2 = useSharedValue(0.6);
  const pulse3 = useSharedValue(0.4);

  const navigateOnce = (results: any[]) => {
    if (hasNavigated.current) return;
    if (!minTimeReached.current) {
      pendingResults.current = results;
      return;
    }
    hasNavigated.current = true;
    setResults(results);
    onComplete();
  };

  // Minimum 2s display time so the loading animation doesn't flash
  useEffect(() => {
    const timer = setTimeout(() => {
      minTimeReached.current = true;
      if (pendingResults.current !== null) {
        navigateOnce(pendingResults.current);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
        navigateOnce([]);
      }
    };

    performSearch();
  }, []);

  useEffect(() => {
    if (searchState.isLoading) {
      hasStartedLoading.current = true;
      return;
    }
    if (!hasStartedLoading.current) return;

    if (searchState.results.length > 0) {
      const rentalDays = getRentalDays();
      const mappedResults = searchState.results.map((car: any) => ({
        id: car.id,
        name: `${car.vehicle?.make || ''} ${car.vehicle?.model || ''}`.trim() || car.vehicle?.name || 'Car',
        category: car.vehicle?.category === 'suv' ? 'suv_standard' : (car.vehicle?.category || 'compact'),
        make: car.vehicle?.make || 'Unknown',
        model: car.vehicle?.model || 'Car',
        year: car.vehicle?.modelYear || 2024,
        images: car.vehicle?.imageUrl ? [car.vehicle.imageUrl] : (car.vehicle?.image ? [car.vehicle.image] : []),
        features: (car.features || []).map((f: string) => ({
          id: f.toLowerCase().replace(/\s/g, '_'),
          name: f,
          icon: 'car',
          included: true,
        })),
        specs: {
          seats: car.vehicle?.seats || 5,
          doors: car.vehicle?.doors || 4,
          luggage: car.vehicle?.luggage || { large: 2, small: 1 },
          transmission: car.vehicle?.transmission || 'automatic',
          fuelType: car.vehicle?.fuelType === 'gasoline' ? 'petrol' : (car.vehicle?.fuelType || 'petrol'),
          fuelPolicy: car.policies?.fuelPolicy || 'full_to_full',
          airConditioning: car.vehicle?.airConditioning ?? true,
          mileage: car.vehicle?.mileage || car.policies?.mileagePolicy || 'unlimited',
        },
        rental: {
          company: {
            id: car.rental?.company?.id || 'unknown',
            name: car.rental?.company?.name || car.supplier?.name || 'Rental Company',
            logo: car.rental?.company?.logo || car.supplier?.logo || '',
            rating: car.rental?.company?.rating || car.supplier?.rating?.score || 4.5,
            reviewCount: car.rental?.company?.reviewCount || 1000,
            locations: 50,
          },
          pricePerDay: car.price?.perDay ? {
            amount: car.price.perDay,
            currency: car.price.currency || 'USD',
            formatted: car.price.perDayFormatted || `$${car.price.perDay}`,
          } : { amount: 50, currency: 'USD', formatted: '$50' },
          totalPrice: {
            amount: car.price?.amount || ((car.price?.perDay || 50) * rentalDays),
            currency: car.price?.currency || 'USD',
            formatted: car.price?.formatted || `$${((car.price?.perDay || 50) * rentalDays).toFixed(0)}`,
          },
          deposit: 200,
          currency: car.price?.currency || 'USD',
          insurance: [],
          extras: car.extras || [],
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
        deepLink: car.deepLink || '',
        available: true,
        popularChoice: false,
      })) as any[];

      navigateOnce(mappedResults);
    } else {
      navigateOnce([]);
    }
  }, [searchState.isLoading, searchState.results, searchState.error]);

  useEffect(() => {
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

    const fallbackTimer = setTimeout(() => {
      navigateOnce([]);
    }, 15000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  const carStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: carPosition.value },
      { rotate: `${carRotation.value}deg` },
    ],
  }));

  const pulse1Style = useAnimatedStyle(() => ({ opacity: pulse1.value, transform: [{ scale: pulse1.value }] }));
  const pulse2Style = useAnimatedStyle(() => ({ opacity: pulse2.value, transform: [{ scale: pulse2.value }] }));
  const pulse3Style = useAnimatedStyle(() => ({ opacity: pulse3.value, transform: [{ scale: pulse3.value }] }));

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <ImageBackground
        source={require('../../../../../../assets/images/carbg.jpg')}
        style={[styles.background, { paddingTop: insets.top }]}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.content}>
          <View style={styles.animationContainer}>
            <Animated.View style={[styles.pulseRing, styles.pulseRing3, { borderColor: 'rgba(255,255,255,0.3)' }, pulse3Style]} />
            <Animated.View style={[styles.pulseRing, styles.pulseRing2, { borderColor: 'rgba(255,255,255,0.4)' }, pulse2Style]} />
            <Animated.View style={[styles.pulseRing, styles.pulseRing1, { borderColor: 'rgba(255,255,255,0.5)' }, pulse1Style]} />

            <Animated.View style={[styles.carContainer, { backgroundColor: `${tc.primary}30` }, carStyle]}>
              <Car size={56} color="#FFFFFF" variant="Bold" />
            </Animated.View>
          </View>

          <Animated.View entering={FadeIn.duration(500).delay(300)} style={styles.textContainer}>
            <Text style={styles.loadingTitle}>Finding Available Cars</Text>
            <Text style={styles.loadingSubtitle}>Searching the best deals for you...</Text>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(500).delay(600)} style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIconContainer, { backgroundColor: `${tc.primary}40` }]}>
                <Location size={16} color="#FFFFFF" variant="Bold" />
              </View>
              <Text style={styles.summaryText} numberOfLines={1}>
                {searchParams.pickupLocation?.name || 'Pickup Location'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIconContainer, { backgroundColor: `${tc.primary}40` }]}>
                <Calendar size={16} color="#FFFFFF" variant="Bold" />
              </View>
              <Text style={styles.summaryText}>
                {formatDate(searchParams.pickupDate)} - {formatDate(searchParams.returnDate)}
              </Text>
            </View>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  animationContainer: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', borderRadius: 100, borderWidth: 2 },
  pulseRing1: { width: 120, height: 120 },
  pulseRing2: { width: 160, height: 160 },
  pulseRing3: { width: 200, height: 200 },
  carContainer: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  textContainer: { alignItems: 'center', marginTop: spacing.xl },
  loadingTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },
  loadingSubtitle: { fontSize: typography.fontSize.base, marginTop: spacing.xs, color: 'rgba(255,255,255,0.8)' },
  summaryContainer: {
    marginTop: spacing.xl, width: '100%', alignItems: 'center', gap: spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full, minWidth: 200,
  },
  summaryIconContainer: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  summaryText: { fontSize: typography.fontSize.sm, color: 'rgba(255,255,255,0.9)', flex: 1 },
});
