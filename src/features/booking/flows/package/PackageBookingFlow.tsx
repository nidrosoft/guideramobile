/**
 * PACKAGE BOOKING FLOW
 *
 * Screen-based orchestrator for package deal search + redirect.
 * Users build a package (flight + hotel + car + experiences),
 * then redirect to a provider (Expedia, Kayak, Kiwi Nomad) to book.
 *
 * Screens:
 * 1. search - Package type, destination, dates, travelers
 * 2. build - Browse & select flights, hotels, cars, experiences + "Book on [Provider]" redirect
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Modal, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { usePackageStore } from '../../stores/usePackageStore';

// Import screens
import PackageSearchScreen from './screens/PackageSearchScreen';
import PackageBuildScreen from './screens/PackageBuildScreen';

// Screen types
type PackageScreen = 'search' | 'build';

interface PackageBookingFlowProps {
  visible: boolean;
  onClose: () => void;
}

export default function PackageBookingFlow({
  visible,
  onClose,
}: PackageBookingFlowProps) {
  const { colors: tc, isDark } = useTheme();
  const packageStore = usePackageStore();

  const [currentScreen, setCurrentScreen] = useState<PackageScreen>('search');
  const [screenHistory, setScreenHistory] = useState<PackageScreen[]>(['search']);

  // Reset on mount
  useEffect(() => {
    if (visible) {
      packageStore.reset();
      setCurrentScreen('search');
      setScreenHistory(['search']);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    packageStore.reset();
    setCurrentScreen('search');
    setScreenHistory(['search']);
    onClose();
  }, [onClose, packageStore]);

  // Navigation helpers
  const navigateTo = useCallback((screen: PackageScreen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScreenHistory(prev => [...prev, screen]);
    setCurrentScreen(screen);
  }, []);

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (screenHistory.length > 1) {
      const newHistory = [...screenHistory];
      newHistory.pop();
      setScreenHistory(newHistory);
      setCurrentScreen(newHistory[newHistory.length - 1]);
    } else {
      handleClose();
    }
  }, [screenHistory, handleClose]);

  // Screen handlers
  const handleSearchComplete = useCallback(() => {
    navigateTo('build');
  }, [navigateTo]);

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
            <PackageSearchScreen
              onContinue={handleSearchComplete}
              onClose={handleClose}
            />
          </Animated.View>
        );
      case 'build':
        return (
          <Animated.View
            key="build"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.screen}
          >
            <PackageBuildScreen
              onContinue={handleClose}
              onBack={goBack}
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
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: tc.background }]}>
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
