/**
 * HOTEL SEARCH LOADING SCREEN
 * 
 * Animated loading screen shown while searching for hotels.
 * Features rotating travel icons that cycle through vacation themes.
 * Integrates with Provider Manager for real search results.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';
import { 
  Building, 
  House, 
  Airplane, 
  Car, 
  Ship, 
  Tree, 
  Sun1, 
  Coffee, 
  Camera,
  Map1,
} from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';
import { useHotelSearch } from '@/hooks/useProviderSearch';
import { HotelSearchParams as ProviderHotelSearchParams } from '@/types/unified';

// Travel icons for rotation
const TRAVEL_ICONS = [
  { Icon: Building, label: 'Hotels' },
  { Icon: House, label: 'Stays' },
  { Icon: Airplane, label: 'Travel' },
  { Icon: Car, label: 'Explore' },
  { Icon: Ship, label: 'Cruise' },
  { Icon: Tree, label: 'Nature' },
  { Icon: Sun1, label: 'Vacation' },
  { Icon: Coffee, label: 'Relax' },
  { Icon: Camera, label: 'Memories' },
  { Icon: Map1, label: 'Adventure' },
];

interface HotelSearchLoadingScreenProps {
  onComplete: () => void;
}

const LOADING_MESSAGES = [
  'Searching for hotels...',
  'Checking availability...',
  'Comparing prices...',
  'Finding the best deals...',
  'Almost there...',
];

export default function HotelSearchLoadingScreen({
  onComplete,
}: HotelSearchLoadingScreenProps) {
  const insets = useSafeAreaInsets();
  const { searchParams, setSearchResults, setSearchError } = useHotelStore();
  const [messageIndex, setMessageIndex] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [searchState, { search }] = useHotelSearch();
  const searchInitiated = useRef(false);
  const hasCompletedRef = useRef(false);
  
  // Animation values
  const iconScale = useSharedValue(1);
  const iconOpacity = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  
  // Icon pulse animation
  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Rotate through icons - use simple interval without runOnJS
  useEffect(() => {
    const iconInterval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % TRAVEL_ICONS.length);
    }, 1500);
    
    return () => clearInterval(iconInterval);
  }, []);

  // Perform actual search via Provider Manager
  useEffect(() => {
    if (searchInitiated.current) return;
    searchInitiated.current = true;

    const performSearch = async () => {
      try {
        // Convert store params to provider params
        const checkIn = searchParams.checkIn instanceof Date 
          ? searchParams.checkIn.toISOString().split('T')[0]
          : typeof searchParams.checkIn === 'string' 
            ? new Date(searchParams.checkIn).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
        
        const checkOut = searchParams.checkOut instanceof Date
          ? searchParams.checkOut.toISOString().split('T')[0]
          : typeof searchParams.checkOut === 'string'
            ? new Date(searchParams.checkOut).toISOString().split('T')[0]
            : new Date(Date.now() + 86400000).toISOString().split('T')[0];

        const providerParams: ProviderHotelSearchParams = {
          destination: {
            type: 'city',
            value: searchParams.destination?.name || (searchParams.destination as any)?.code || 'New York',
          },
          checkInDate: checkIn,
          checkOutDate: checkOut,
          rooms: [{
            adults: searchParams.guests?.adults || 2,
            children: searchParams.guests?.children || 0,
            childrenAges: [],
          }],
        };

        await search(providerParams);
      } catch (error) {
        console.error('Hotel search error:', error);
        setSearchError(error instanceof Error ? error.message : 'Search failed');
      }
    };

    performSearch();
  }, []);

  // Sync progress with actual search state
  useEffect(() => {
    let progressInterval: ReturnType<typeof setInterval> | undefined;
    
    if (searchState.isLoading) {
      // Slowly increment progress while loading (max 90%)
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + 1;
        });
      }, 166);
    } else if (searchState.results.length > 0 && !hasCompletedRef.current) {
      // Map provider results to store format (Hotel type)
      const mappedResults = searchState.results.map((hotel: any) => {
        const priceAmount = hotel.lowestPrice?.amount || hotel.rooms?.[0]?.price?.amount || 150;
        const currency = hotel.lowestPrice?.currency || 'USD';
        
        // Map images to HotelImage[] format
        const images = (hotel.images || []).map((img: any, idx: number) => ({
          id: `img-${idx}`,
          url: typeof img === 'string' ? img : (img.url || ''),
          caption: img.caption || '',
          category: img.category || 'other',
        }));
        
        // Map amenities to Amenity[] format (with name property)
        const amenities = (hotel.keyAmenities || hotel.amenities || []).map((a: any, idx: number) => ({
          id: `amenity-${idx}`,
          name: typeof a === 'string' ? a : (a.name || a),
          icon: typeof a === 'string' ? a.toLowerCase().replace(/\s+/g, '_') : (a.icon || ''),
        }));
        
        return {
          id: hotel.id,
          name: hotel.name,
          description: hotel.description || '',
          shortDescription: hotel.shortDescription || hotel.description?.substring(0, 100) || '',
          starRating: hotel.starRating || 4,
          userRating: hotel.guestRating?.score || 8.5,
          reviewCount: hotel.guestRating?.reviewCount || 100,
          images,
          location: {
            address: hotel.location?.address?.formatted || hotel.location?.address?.line1 || '',
            city: hotel.location?.address?.city || hotel.location?.city || '',
            state: hotel.location?.address?.state || '',
            country: hotel.location?.address?.country || hotel.location?.country || '',
            postalCode: hotel.location?.address?.postalCode || '',
            coordinates: hotel.location?.coordinates || { lat: 0, lng: 0 },
            neighborhood: hotel.location?.neighborhood || '',
          },
          amenities,
          rooms: hotel.rooms || [],
          policies: hotel.policies || {
            checkIn: { time: hotel.checkInTime || '15:00' },
            checkOut: { time: hotel.checkOutTime || '11:00' },
          },
          pricePerNight: {
            amount: priceAmount,
            currency,
            formatted: hotel.lowestPrice?.formatted || `$${priceAmount}`,
          },
          lowestPrice: {
            amount: priceAmount,
            currency,
            formatted: hotel.lowestPrice?.formatted || `$${priceAmount}`,
          },
          featured: false,
          verified: true,
          propertyType: hotel.propertyType || 'hotel',
        };
      }) as any[];
      
      setSearchResults(mappedResults);
      setProgress(100);
      hasCompletedRef.current = true;
      
      setTimeout(() => {
        onComplete();
      }, 500);
    } else if (searchState.error && !hasCompletedRef.current) {
      setSearchError(searchState.error);
      setProgress(100);
      hasCompletedRef.current = true;
      
      setTimeout(() => {
        onComplete();
      }, 500);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [searchState.isLoading, searchState.results.length, searchState.error, onComplete, setSearchResults, setSearchError]);
  
  // Rotate through loading messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    
    return () => clearInterval(messageInterval);
  }, []);
  
  // Animated styles for icon
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));

  // Get current icon
  const CurrentIcon = TRAVEL_ICONS[iconIndex].Icon;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../../../../assets/images/bookingbg.png')}
        style={[styles.background, { paddingTop: insets.top }]}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <View style={styles.content}>
          {/* Destination */}
          <Animated.View entering={FadeInUp.duration(400)}>
            <Text style={styles.route}>{searchParams.destination?.name || 'Hotels'}</Text>
          </Animated.View>
          
          {/* Rotating Travel Icons - No circle container */}
          <View style={styles.iconContainer}>
            <Animated.View style={iconAnimatedStyle}>
              <CurrentIcon size={64} color={colors.primaryLight} variant="Bold" />
            </Animated.View>
          </View>
          
          {/* Loading Message */}
          <Animated.View 
            entering={FadeIn.duration(300)}
            key={messageIndex}
            style={styles.messageContainer}
          >
            <Text style={styles.message}>{LOADING_MESSAGES[messageIndex]}</Text>
          </Animated.View>
          
          {/* Progress Percentage */}
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  route: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  messageContainer: {
    height: 30,
    justifyContent: 'center',
  },
  message: {
    fontSize: typography.fontSize.lg,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  progressTextContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  progressText: {
    fontSize: typography.fontSize.lg,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: typography.fontWeight.medium as any,
  },
});
