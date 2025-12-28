/**
 * EXPERIENCE BOOKING FLOW
 * 
 * Screen-based orchestrator for experience/activity booking.
 * Follows the same plugin architecture as FlightBookingFlow, HotelBookingFlow, and CarBookingFlow.
 * 
 * Screens:
 * 1. search - Experience search with destination, date, participants, category
 * 2. loading - Animated loading while searching
 * 3. results - Experience list with filters and detail sheet
 * 4. checkout - Combined: time slot, traveler details, payment
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Modal, StatusBar } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';
import { useExperienceStore } from '../../stores/useExperienceStore';
import { useBookingStore } from '../../stores/useBookingStore';
import { Experience } from '../../types/experience.types';

// Import screens
import ExperienceSearchScreen from './screens/ExperienceSearchScreen';
import ExperienceSearchLoadingScreen from './screens/ExperienceSearchLoadingScreen';
import ExperienceResultsScreen from './screens/ExperienceResultsScreen';
import ExperienceCheckoutScreen from './screens/ExperienceCheckoutScreen';

type ExperienceScreen = 'search' | 'loading' | 'results' | 'checkout';

interface ExperienceBookingFlowProps {
  visible: boolean;
  onClose: () => void;
}

export default function ExperienceBookingFlow({ visible, onClose }: ExperienceBookingFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<ExperienceScreen>('search');
  const [screenHistory, setScreenHistory] = useState<ExperienceScreen[]>(['search']);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  
  const experienceStore = useExperienceStore();
  const bookingStore = useBookingStore();

  // Reset stores on mount
  useEffect(() => {
    if (visible) {
      bookingStore.startBookingSession('experience');
    }
  }, [visible]);

  // Navigation helpers
  const navigateTo = useCallback((screen: ExperienceScreen) => {
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
    experienceStore.reset();
    bookingStore.endBookingSession();
    setCurrentScreen('search');
    setScreenHistory(['search']);
    setSelectedExperience(null);
    onClose();
  }, [onClose, experienceStore, bookingStore]);

  // Screen handlers
  const handleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigateTo('loading');
  }, [navigateTo]);

  const handleLoadingComplete = useCallback(() => {
    navigateTo('results');
  }, [navigateTo]);

  const handleSelectExperience = useCallback((experience: Experience) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedExperience(experience);
    experienceStore.selectExperience(experience);
    navigateTo('checkout');
  }, [navigateTo, experienceStore]);

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
    const reference = `EXP${Date.now().toString(36).toUpperCase()}`;
    experienceStore.setBookingReference(reference);
    experienceStore.confirmBooking();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
  }, [experienceStore, handleClose]);

  // Reset screen when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentScreen('search');
      setScreenHistory(['search']);
      setSelectedExperience(null);
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
            style={styles.screen}
          >
            <ExperienceSearchScreen
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
            style={styles.screen}
          >
            <ExperienceSearchLoadingScreen
              onComplete={handleLoadingComplete}
            />
          </Animated.View>
        );

      case 'results':
        return (
          <Animated.View 
            key="results"
            entering={FadeIn.duration(300)}
            style={styles.screen}
          >
            <ExperienceResultsScreen
              onSelectExperience={handleSelectExperience}
              onBack={handleBackFromResults}
              onClose={handleClose}
            />
          </Animated.View>
        );

      case 'checkout':
        return selectedExperience ? (
          <Animated.View 
            key="checkout"
            entering={FadeIn.duration(300)}
            style={styles.screen}
          >
            <ExperienceCheckoutScreen
              experience={selectedExperience}
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
