/**
 * CAR BOOKING FLOW
 * 
 * Screen-based orchestrator for car rental booking.
 * Follows the same plugin architecture as FlightBookingFlow and HotelBookingFlow.
 * 
 * Screens:
 * 1. search - Car search with pickup/return location, dates, times, driver age
 * 2. loading - Animated loading while searching
 * 3. results - Car list with filters and sorting
 * 4. checkout - Combined: car details, protection, extras, driver, payment
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Modal, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';
import { useCarStore } from '../../stores/useCarStore';
import { useBookingStore } from '../../stores/useBookingStore';
import { Car } from '../../types/car.types';

// Import screens
import CarSearchScreen from './screens/CarSearchScreen';
import CarSearchLoadingScreen from './screens/CarSearchLoadingScreen';
import CarResultsScreen from './screens/CarResultsScreen';
import CarCheckoutScreen from './screens/CarCheckoutScreen';

type CarScreen = 'search' | 'loading' | 'results' | 'checkout';

interface CarBookingFlowProps {
  visible: boolean;
  onClose: () => void;
}

export default function CarBookingFlow({ visible, onClose }: CarBookingFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<CarScreen>('search');
  const [screenHistory, setScreenHistory] = useState<CarScreen[]>(['search']);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  
  const carStore = useCarStore();
  const bookingStore = useBookingStore();

  // Reset stores on mount
  useEffect(() => {
    if (visible) {
      bookingStore.startBookingSession('car');
    }
  }, [visible]);

  // Navigation helpers
  const navigateTo = useCallback((screen: CarScreen) => {
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
      handleClose();
    }
  }, [screenHistory]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    carStore.reset();
    bookingStore.endBookingSession();
    setCurrentScreen('search');
    setScreenHistory(['search']);
    setSelectedCar(null);
    onClose();
  }, [onClose, carStore, bookingStore]);

  // Screen handlers
  const handleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigateTo('loading');
  }, [navigateTo]);

  const handleLoadingComplete = useCallback(() => {
    navigateTo('results');
  }, [navigateTo]);

  const handleSelectCar = useCallback((car: Car) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCar(car);
    carStore.selectCar(car);
    navigateTo('checkout');
  }, [navigateTo, carStore]);

  const handleBackFromResults = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goBack();
  }, [goBack]);

  const handleBackFromCheckout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goBack();
  }, [goBack]);

  const handleConfirmBooking = useCallback(() => {
    // Generate booking reference
    const reference = `CAR${Date.now().toString(36).toUpperCase()}`;
    carStore.setBookingReference(reference);
    carStore.confirmBooking();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
  }, [carStore, handleClose]);

  // Reset screen when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentScreen('search');
      setScreenHistory(['search']);
      setSelectedCar(null);
    }
  }, [visible]);

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
            <CarSearchScreen
              onSearch={handleSearch}
              onBack={handleClose}
              onClose={handleClose}
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
            <CarSearchLoadingScreen
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
            <CarResultsScreen
              onSelectCar={handleSelectCar}
              onBack={handleBackFromResults}
              onClose={handleClose}
            />
          </Animated.View>
        );

      case 'checkout':
        return selectedCar ? (
          <Animated.View 
            key="checkout"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.screen}
          >
            <CarCheckoutScreen
              car={selectedCar}
              onConfirm={handleConfirmBooking}
              onBack={handleBackFromCheckout}
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
      <StatusBar barStyle="dark-content" />
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
