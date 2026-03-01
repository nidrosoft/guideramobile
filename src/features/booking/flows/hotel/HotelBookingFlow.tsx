/**
 * HOTEL BOOKING FLOW
 * 
 * Screen-based orchestrator for hotel search + deal redirect.
 * 
 * Screens:
 * 1. search - Hotel search with destination, dates, guests
 * 2. loading - Animated loading while searching
 * 3. results - Hotel list with filters
 * 4. detail - Hotel details + "Book on [Provider]" redirect
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Modal, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useHotelStore } from '../../stores/useHotelStore';
import { Hotel } from '../../types/hotel.types';

// Import screens
import HotelSearchScreen from './screens/HotelSearchScreen';
import HotelSearchLoadingScreen from './screens/HotelSearchLoadingScreen';
import HotelResultsScreen from './screens/HotelResultsScreen';
import HotelDetailScreen from './screens/HotelDetailScreen';
type HotelScreen = 'search' | 'loading' | 'results' | 'detail';

interface HotelBookingFlowProps {
  visible: boolean;
  onClose: () => void;
}

export default function HotelBookingFlow({ visible, onClose }: HotelBookingFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<HotelScreen>('search');
  const [screenHistory, setScreenHistory] = useState<HotelScreen[]>(['search']);
  
  const hotelStore = useHotelStore();

  // Reset stores on mount
  useEffect(() => {
    hotelStore.reset();
    
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

  const handleDetailClose = useCallback(() => {
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
              onContinue={handleDetailClose}
              onBack={goBack}
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
