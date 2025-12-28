/**
 * FLIGHT BOOKING FLOW
 * 
 * Streamlined 3-screen flight booking:
 * 1. Search - Single page with bottom sheet modals
 * 2. Results - Flight list with filters and date scroll
 * 3. Checkout - Combined seats, extras, travelers, payment
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';
import { useFlightStore } from '../../stores/useFlightStore';
import { useBookingStore } from '../../stores/useBookingStore';
import { Flight } from '../../types/flight.types';

// Import new screens
import FlightSearchScreen from './screens/FlightSearchScreen';
import FlightSearchLoadingScreen from './screens/FlightSearchLoadingScreen';
import FlightResultsScreen from './screens/FlightResultsScreen';
import FlightCheckoutScreen from './screens/FlightCheckoutScreen';

// Screen types
type FlightScreen = 'search' | 'loading' | 'results' | 'checkout';

interface FlightBookingFlowProps {
  visible: boolean;
  onClose: () => void;
}

export default function FlightBookingFlow({
  visible,
  onClose,
}: FlightBookingFlowProps) {
  const flightStore = useFlightStore();
  const bookingStore = useBookingStore();
  
  const [currentScreen, setCurrentScreen] = useState<FlightScreen>('search');
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  
  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  
  // Animate modal entrance
  useEffect(() => {
    if (visible) {
      bookingStore.startBookingSession('flight');
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.95, { duration: 200 });
    }
  }, [visible]);
  
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fadeAnim.value = withTiming(0, { duration: 200 });
    scaleAnim.value = withTiming(0.95, { duration: 200 }, () => {
      runOnJS(onClose)();
      runOnJS(resetFlow)();
    });
  }, [onClose]);
  
  const resetFlow = () => {
    setCurrentScreen('search');
    setSelectedFlight(null);
    flightStore.reset();
    bookingStore.endBookingSession();
  };
  
  // Navigation handlers
  const handleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Show loading screen
    setCurrentScreen('loading');
  }, []);
  
  const handleLoadingComplete = useCallback(() => {
    // Transition to results after loading animation
    setCurrentScreen('results');
  }, []);
  
  const handleSelectFlight = useCallback((flight: Flight) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedFlight(flight);
    flightStore.selectOutboundFlight(flight);
    setCurrentScreen('checkout');
  }, []);
  
  const handleBackFromResults = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentScreen('search');
  }, []);
  
  const handleBackFromCheckout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentScreen('results');
  }, []);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));
  
  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'search':
        return (
          <FlightSearchScreen
            onSearch={handleSearch}
            onBack={handleClose}
          />
        );
      case 'loading':
        return (
          <FlightSearchLoadingScreen
            origin={flightStore.searchParams.origin?.code}
            destination={flightStore.searchParams.destination?.code}
            onComplete={handleLoadingComplete}
          />
        );
      case 'results':
        return (
          <FlightResultsScreen
            onSelectFlight={handleSelectFlight}
            onBack={handleBackFromResults}
            onClose={handleClose}
          />
        );
      case 'checkout':
        return selectedFlight ? (
          <FlightCheckoutScreen
            flight={selectedFlight}
            onComplete={handleClose}
            onBack={handleBackFromCheckout}
            onClose={handleClose}
          />
        ) : null;
      default:
        return null;
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Animated.View style={[styles.container, containerStyle]}>
        {renderScreen()}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
