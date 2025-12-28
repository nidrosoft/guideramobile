/**
 * PACKAGE BOOKING FLOW
 * 
 * Screen-based orchestrator for package booking.
 * Follows the same pattern as Flight/Hotel/Car/Experience flows.
 * 
 * Screens:
 * 1. search - Package type, destination, dates, travelers
 * 2. build - Select flights, hotels, cars, experiences with category tabs
 * 3. checkout - Review, traveler details, extras, payment
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Modal, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';
import { usePackageStore } from '../../stores/usePackageStore';
import { useBookingStore } from '../../stores/useBookingStore';

// Import screens
import PackageSearchScreen from './screens/PackageSearchScreen';
import PackageBuildScreen from './screens/PackageBuildScreen';
import PackageCheckoutScreen from './screens/PackageCheckoutScreen';

// Screen types
type PackageScreen = 'search' | 'build' | 'checkout';

interface PackageBookingFlowProps {
  visible: boolean;
  onClose: () => void;
}

export default function PackageBookingFlow({
  visible,
  onClose,
}: PackageBookingFlowProps) {
  const packageStore = usePackageStore();
  const bookingStore = useBookingStore();
  
  const [currentScreen, setCurrentScreen] = useState<PackageScreen>('search');
  const [screenHistory, setScreenHistory] = useState<PackageScreen[]>(['search']);
  
  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  
  // Animate modal entrance
  useEffect(() => {
    if (visible) {
      bookingStore.startBookingSession('package');
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.95, { duration: 200 });
    }
  }, [visible]);
  
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
    fadeAnim.value = withTiming(0, { duration: 200 });
    scaleAnim.value = withTiming(0.95, { duration: 200 }, () => {
      runOnJS(onClose)();
      runOnJS(resetFlow)();
    });
  }, [onClose]);
  
  const resetFlow = () => {
    setCurrentScreen('search');
    setScreenHistory(['search']);
    packageStore.reset();
    bookingStore.endBookingSession();
  };
  
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
  
  const handleBuildComplete = useCallback(() => {
    navigateTo('checkout');
  }, [navigateTo]);
  
  const handleCheckoutComplete = useCallback(() => {
    // Generate booking reference and confirm
    const reference = `PKG${Date.now().toString(36).toUpperCase()}`;
    packageStore.setBookingReference(reference);
    packageStore.confirmBooking();
    // Close flow on success
    handleClose();
  }, [handleClose, packageStore]);
  
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
          <PackageSearchScreen
            onContinue={handleSearchComplete}
            onClose={handleClose}
          />
        );
      case 'build':
        return (
          <PackageBuildScreen
            onContinue={handleBuildComplete}
            onBack={goBack}
            onClose={handleClose}
          />
        );
      case 'checkout':
        return (
          <PackageCheckoutScreen
            onComplete={handleCheckoutComplete}
            onBack={goBack}
            onClose={handleClose}
          />
        );
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
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
