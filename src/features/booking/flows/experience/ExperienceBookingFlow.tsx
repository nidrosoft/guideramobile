/**
 * EXPERIENCE BOOKING FLOW
 * 
 * Screen-based orchestrator for experience/activity search + deal redirect.
 * 
 * Screens:
 * 1. search - Experience search with destination, date, participants, category
 * 2. loading - Animated loading while searching
 * 3. results - Experience list with filters, detail sheet, and "Book on [Provider]" redirect
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Modal, StatusBar } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';
import { useExperienceStore } from '../../stores/useExperienceStore';
import { Experience } from '../../types/experience.types';

// Import screens
import ExperienceSearchScreen from './screens/ExperienceSearchScreen';
import ExperienceSearchLoadingScreen from './screens/ExperienceSearchLoadingScreen';
import ExperienceResultsScreen from './screens/ExperienceResultsScreen';
type ExperienceScreen = 'search' | 'loading' | 'results';

interface ExperienceBookingFlowProps {
  visible: boolean;
  onClose: () => void;
}

export default function ExperienceBookingFlow({ visible, onClose }: ExperienceBookingFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<ExperienceScreen>('search');
  const [screenHistory, setScreenHistory] = useState<ExperienceScreen[]>(['search']);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  
  const experienceStore = useExperienceStore();

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
    setCurrentScreen('search');
    setScreenHistory(['search']);
    setSelectedExperience(null);
    onClose();
  }, [onClose, experienceStore]);

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
    // Detail sheet opens from results screen with "Book on Provider" button
  }, [experienceStore]);

  const handleBackFromResults = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goBack();
  }, [goBack]);

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
