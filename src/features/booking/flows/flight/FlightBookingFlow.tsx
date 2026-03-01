/**
 * FLIGHT BOOKING FLOW
 * 
 * Streamlined 3-screen flight search + deal redirect:
 * 1. Search - Single page with bottom sheet modals
 * 2. Results - Flight list with filters and date scroll
 * 3. Deal - Flight summary + "Book on [Provider]" redirect
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
import { Flight } from '../../types/flight.types';

// Import new screens
import FlightSearchScreen from './screens/FlightSearchScreen';
import FlightSearchLoadingScreen from './screens/FlightSearchLoadingScreen';
import FlightResultsScreen from './screens/FlightResultsScreen';
import FlightDealScreen from './screens/FlightDealScreen';

// Screen types
type FlightScreen = 'search' | 'loading' | 'results' | 'deal';

interface FlightBookingFlowProps {
  visible: boolean;
  onClose: () => void;
}

export default function FlightBookingFlow({
  visible,
  onClose,
}: FlightBookingFlowProps) {
  const flightStore = useFlightStore();
  
  const [currentScreen, setCurrentScreen] = useState<FlightScreen>('search');
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  
  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  
  // Animate modal entrance
  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 250 });
      scaleAnim.value = withTiming(1, { duration: 250 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.95, { duration: 200 });
    }
  }, [visible]);
  
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Close immediately - let Modal handle the animation
    onClose();
    resetFlow();
  }, [onClose]);
  
  const resetFlow = () => {
    setCurrentScreen('search');
    setSelectedFlight(null);
    flightStore.reset();
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
    setCurrentScreen('deal');
  }, []);
  
  const handleBackFromResults = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentScreen('search');
  }, []);
  
  const handleBackFromDeal = useCallback(() => {
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
      case 'deal':
        return selectedFlight ? (
          <FlightDealScreen
            flight={selectedFlight}
            onBack={handleBackFromDeal}
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
      animationType="fade"
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
