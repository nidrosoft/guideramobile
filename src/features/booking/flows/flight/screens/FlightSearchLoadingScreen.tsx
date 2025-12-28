/**
 * FLIGHT SEARCH LOADING SCREEN
 * 
 * Animated loading screen shown while searching for flights
 * Displays progress messages and airplane animation
 */

import React, { useState, useEffect } from 'react';
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

interface FlightSearchLoadingScreenProps {
  origin?: string;
  destination?: string;
  onComplete: () => void;
}

const LOADING_MESSAGES = [
  'Searching for flights...',
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
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Airplane animation
  const translateX = useSharedValue(-50);
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    // Animate airplane across screen
    translateX.value = withRepeat(
      withTiming(350, { duration: 2000 }),
      -1,
      false
    );
    
    // Slight rotation animation
    rotation.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 500 }),
        withTiming(-5, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);
  
  // Progress and message updates
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 80);
    
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1000);
    
    // Complete after ~4 seconds
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 4000);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);
  
  const airplaneStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));
  
  return (
    <View style={styles.container}>
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
          
          {/* Airplane Animation */}
          <View style={styles.animationContainer}>
            <View style={styles.flightPath}>
              <View style={styles.pathDot} />
              <View style={styles.pathLine} />
              <View style={styles.pathDot} />
            </View>
            <Animated.View style={[styles.airplane, airplaneStyle]}>
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
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
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
    width: '100%',
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  progressTrack: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.sm,
  },
});
