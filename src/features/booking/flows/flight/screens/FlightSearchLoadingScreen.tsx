/**
 * FLIGHT SEARCH LOADING SCREEN
 * 
 * Animated loading screen shown while searching for flights.
 * This screen performs the actual search and syncs progress with real search state.
 * Only transitions to results when flights are found.
 */

import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native-reanimated';
import { Airplane } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useFlightSearch } from '@/hooks/useProviderSearch';
import { useFlightStore } from '../../../stores/useFlightStore';
import { useFlightSearchState } from '../../../stores/flightSearchState';

interface FlightSearchLoadingScreenProps {
  origin?: string;
  destination?: string;
  onComplete: () => void;
}

const LOADING_MESSAGES = [
  'Searching for flights...',
  'Contacting airlines...',
  'Finding the best deals...',
  'Comparing prices...',
  'Checking availability...',
  'Almost there...',
];

export default function FlightSearchLoadingScreen({
  origin = 'JFK',
  destination = 'ATL',
  onComplete,
}: FlightSearchLoadingScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const hasCompletedRef = useRef(false);
  
  // Get search params from store
  const { searchParams } = useFlightStore();
  
  // Use the provider manager for real flight search
  const [searchState, searchActions] = useFlightSearch();
  
  // Airplane position synced with progress
  // The airplane moves from the first dot to the second dot based on progress percentage
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    // Very subtle rotation animation for gentle bobbing effect
    rotation.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 1200 }),
        withTiming(-3, { duration: 1200 }),
        withTiming(0, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);
  
  // Start the actual flight search when component mounts
  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const originCode = searchParams.origin?.code || origin;
        const destCode = searchParams.destination?.code || destination;
        
        // Handle date - ensure it's a valid string format YYYY-MM-DD
        let depDate: string;
        const rawDate = searchParams.departureDate as Date | string | null;
        if (rawDate instanceof Date) {
          depDate = rawDate.toISOString().split('T')[0];
        } else if (rawDate && typeof rawDate === 'string') {
          depDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
        } else {
          // Default to 7 days from now
          depDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
        
        // Handle return date - ensure YYYY-MM-DD format
        let returnDateStr: string | undefined;
        const rawReturnDate = searchParams.returnDate as Date | string | null;
        if (rawReturnDate instanceof Date) {
          returnDateStr = rawReturnDate.toISOString().split('T')[0];
        } else if (rawReturnDate && typeof rawReturnDate === 'string') {
          returnDateStr = rawReturnDate.includes('T') ? rawReturnDate.split('T')[0] : rawReturnDate;
        }
        
        // Validate return date is after departure date
        if (returnDateStr && returnDateStr < depDate) {
          console.warn('Return date is before departure date, ignoring return date');
          returnDateStr = undefined;
        }
        
        console.log('Loading screen - Flight search params:', { originCode, destCode, depDate, returnDateStr });
        
        // Build segments array as required by FlightSearchParams
        const segments = [
          { origin: originCode, destination: destCode, departureDate: depDate }
        ];
        
        // Add return segment for round trips
        if (returnDateStr && searchParams.tripType === 'round-trip') {
          segments.push({ origin: destCode, destination: originCode, departureDate: returnDateStr });
        }
        
        await searchActions.search({
          tripType: searchParams.tripType === 'round-trip' ? 'round_trip' : 'one_way',
          segments,
          travelers: {
            adults: searchParams.passengers?.adults || 1,
            children: searchParams.passengers?.children || 0,
            infants: searchParams.passengers?.infants || 0,
          },
          cabinClass: 'economy',
        } as any);
      } catch (error) {
        console.error('Flight search error in loading screen:', error);
      }
    };
    
    fetchFlights();
  }, []);
  
  // Get shared state actions to save results for the results screen
  const { setResults, setLoading, setError } = useFlightSearchState();
  
  // Sync progress with actual search state
  // Progress goes up to 90% during search, then jumps to 100% when complete
  useEffect(() => {
    let progressInterval: ReturnType<typeof setInterval> | undefined;
    
    // Update shared state with loading state
    setLoading(searchState.isLoading);
    
    if (searchState.isLoading) {
      // Slowly increment progress while loading (max 90%)
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90; // Cap at 90% until search completes
          // Slow increment - takes about 15 seconds to reach 90%
          return prev + 1;
        });
      }, 166); // ~6 per second
    } else if (searchState.results.length > 0 && !hasCompletedRef.current) {
      // Search complete with results - save to shared state and transition
      setResults(searchState.results, searchState.totalCount, searchState.source || 'live');
      setProgress(100);
      hasCompletedRef.current = true;
      
      // Small delay to show 100% before transitioning
      setTimeout(() => {
        onComplete();
      }, 500);
    } else if (searchState.error && !hasCompletedRef.current) {
      // Search failed - save error to shared state and transition
      setError(searchState.error);
      setProgress(100);
      hasCompletedRef.current = true;
      
      setTimeout(() => {
        onComplete();
      }, 500);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [searchState.isLoading, searchState.results.length, searchState.error, onComplete, setLoading, setResults, setError]);
  
  // Rotate through loading messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000); // Slower message rotation
    
    return () => clearInterval(messageInterval);
  }, []);
  
  // Calculate airplane position based on progress
  // The path is approximately 280px wide (screen width minus padding and dots)
  // Airplane starts at the first dot (left) and moves to second dot (right)
  const airplanePosition = (progress / 100) * 280; // 0% = 0px, 100% = 280px
  
  const airplaneStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${90 + rotation.value}deg` }, // 90deg to point right, plus subtle bobbing
    ],
  }));
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <ImageBackground
        source={require('../../../../../../assets/images/flightbg.png')}
        style={[styles.background, { paddingTop: insets.top }]}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <View style={styles.content}>
          {/* Route */}
          <Animated.View entering={FadeInUp.duration(400)}>
            <Text style={styles.route}>{origin} → {destination}</Text>
          </Animated.View>
          
          {/* Airplane Animation - Airplane IS the progress indicator */}
          <View style={styles.animationContainer}>
            <View style={styles.flightPath}>
              <View style={styles.pathDot} />
              <View style={styles.pathLine} />
              <View style={[styles.pathDot, progress >= 100 && styles.pathDotComplete]} />
            </View>
            {/* Airplane positioned based on progress percentage */}
            <Animated.View style={[
              styles.airplane, 
              airplaneStyle,
              { left: spacing.lg + 6 + airplanePosition } // Start at first dot center
            ]}>
              <Airplane size={32} color={colors.white} variant="Bold" />
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
          
          {/* Progress Percentage Only - No filling bar, airplane is the indicator */}
          <View style={styles.progressContainer}>
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
  animationContainer: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  flightPath: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  pathDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  pathDotComplete: {
    backgroundColor: colors.primary,
  },
  pathLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: spacing.sm,
  },
  airplane: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
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
  progressContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  progressText: {
    fontSize: typography.fontSize.lg,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: typography.fontWeight.medium as any,
  },
});
