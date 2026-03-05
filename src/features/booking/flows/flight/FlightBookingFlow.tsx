/**
 * FLIGHT BOOKING FLOW
 * 
 * Streamlined 3-screen flight search + deal redirect:
 * 1. Search - Single page with bottom sheet modals
 * 2. Results - Flight list with filters and date scroll
 * 3. Deal - Flight summary + "Book on [Provider]" redirect
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Modal, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';
import { useFlightStore } from '../../stores/useFlightStore';
import { Flight } from '../../types/flight.types';

// Import screens
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

  // Reset screen when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentScreen('search');
      setSelectedFlight(null);
    }
  }, [visible]);
  
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    flightStore.reset();
    setCurrentScreen('search');
    setSelectedFlight(null);
    onClose();
  }, [onClose, flightStore]);
  
  // Navigation handlers
  const handleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentScreen('loading');
  }, []);
  
  const handleLoadingComplete = useCallback(() => {
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
  
  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'search':
        return (
          <Animated.View
            key="search"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.screen}
          >
            <FlightSearchScreen
              onSearch={handleSearch}
              onBack={handleClose}
            />
          </Animated.View>
        );
      case 'loading':
        return (
          <Animated.View
            key="loading"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.screen}
          >
            <FlightSearchLoadingScreen
              origin={flightStore.searchParams.origin?.code}
              destination={flightStore.searchParams.destination?.code}
              onComplete={handleLoadingComplete}
            />
          </Animated.View>
        );
      case 'results':
        return (
          <Animated.View
            key="results"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.screen}
          >
            <FlightResultsScreen
              onSelectFlight={handleSelectFlight}
              onBack={handleBackFromResults}
              onClose={handleClose}
            />
          </Animated.View>
        );
      case 'deal':
        return selectedFlight ? (
          <Animated.View
            key="deal"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.screen}
          >
            <FlightDealScreen
              flight={selectedFlight}
              onBack={handleBackFromDeal}
              onClose={handleClose}
            />
          </Animated.View>
        ) : null;
      default:
        return null;
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {renderScreen()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
  },
});
