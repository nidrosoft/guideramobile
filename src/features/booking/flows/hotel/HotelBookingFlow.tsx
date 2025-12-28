/**
 * HOTEL BOOKING FLOW
 * 
 * Screen-based orchestrator for hotel booking.
 * Follows the same pattern as FlightBookingFlow.
 * 
 * Screens:
 * 1. search - Hotel search with destination, dates, guests
 * 2. loading - Animated loading while searching
 * 3. results - Hotel list with filters
 * 4. detail - Hotel details with room selection
 * 5. checkout - Guest info, extras, payment
 * 6. confirmation - Booking success
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Modal, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useHotelStore } from '../../stores/useHotelStore';
import { useBookingStore } from '../../stores/useBookingStore';
import { Hotel } from '../../types/hotel.types';

// Import screens
import HotelSearchScreen from './screens/HotelSearchScreen';
import HotelSearchLoadingScreen from './screens/HotelSearchLoadingScreen';
import HotelResultsScreen from './screens/HotelResultsScreen';
import HotelDetailScreen from './screens/HotelDetailScreen';
import HotelCheckoutScreen from './screens/HotelCheckoutScreen';
import HotelConfirmationScreen from './screens/HotelConfirmationScreen';

type HotelScreen = 'search' | 'loading' | 'results' | 'detail' | 'checkout' | 'confirmation';

interface HotelBookingFlowProps {
  visible: boolean;
  onClose: () => void;
}

export default function HotelBookingFlow({ visible, onClose }: HotelBookingFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<HotelScreen>('search');
  const [screenHistory, setScreenHistory] = useState<HotelScreen[]>(['search']);
  
  const hotelStore = useHotelStore();
  const bookingStore = useBookingStore();

  // Reset stores on mount
  useEffect(() => {
    hotelStore.reset();
    bookingStore.reset();
    
    return () => {
      // Cleanup on unmount
    };
  }, []);

  // Navigation helpers
  const navigateTo = useCallback((screen: HotelScreen) => {
    setScreenHistory(prev => [...prev, screen]);
    setCurrentScreen(screen);
  }, []);

  const goBack = useCallback(() => {
    if (screenHistory.length > 1) {
      const newHistory = [...screenHistory];
      newHistory.pop();
      setScreenHistory(newHistory);
      setCurrentScreen(newHistory[newHistory.length - 1]);
    } else {
      onClose();
    }
  }, [screenHistory, onClose]);

  // Screen handlers
  const handleSearch = useCallback(() => {
    navigateTo('loading');
  }, [navigateTo]);

  const handleLoadingComplete = useCallback(() => {
    navigateTo('results');
  }, [navigateTo]);

  const handleSelectHotel = useCallback((hotel: Hotel) => {
    hotelStore.selectHotel(hotel);
    navigateTo('detail');
  }, [navigateTo, hotelStore]);

  const handleContinueToCheckout = useCallback(() => {
    navigateTo('checkout');
  }, [navigateTo]);

  const handleConfirmBooking = useCallback(() => {
    // Generate booking reference
    const reference = `HTL${Date.now().toString(36).toUpperCase()}`;
    hotelStore.setBookingReference(reference);
    hotelStore.setBookingConfirmed(true);
    navigateTo('confirmation');
  }, [navigateTo, hotelStore]);

  const handleConfirmationDone = useCallback(() => {
    onClose();
  }, [onClose]);

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
            <HotelSearchScreen
              onSearch={handleSearch}
              onBack={onClose}
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
            <HotelSearchLoadingScreen
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
            <HotelResultsScreen
              onSelectHotel={handleSelectHotel}
              onBack={goBack}
              onClose={onClose}
            />
          </Animated.View>
        );

      case 'detail':
        return (
          <Animated.View 
            key="detail"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.screen}
          >
            <HotelDetailScreen
              onContinue={handleContinueToCheckout}
              onBack={goBack}
            />
          </Animated.View>
        );

      case 'checkout':
        return (
          <Animated.View 
            key="checkout"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.screen}
          >
            <HotelCheckoutScreen
              onConfirm={handleConfirmBooking}
              onBack={goBack}
              onClose={onClose}
            />
          </Animated.View>
        );

      case 'confirmation':
        return (
          <Animated.View 
            key="confirmation"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.screen}
          >
            <HotelConfirmationScreen
              onDone={handleConfirmationDone}
            />
          </Animated.View>
        );

      default:
        return null;
    }
  };

  // Reset screen when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentScreen('search');
      setScreenHistory(['search']);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
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
  },
  screen: {
    flex: 1,
  },
});
