/**
 * PACKAGE BOOKING FLOW
 * 
 * Main orchestrator for the package booking process.
 * Manages step navigation with smooth animations.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';
import { usePackageStore } from '../../stores/usePackageStore';
import { useBookingStore } from '../../stores/useBookingStore';
import { useBookingFlow } from '../../hooks/useBookingFlow';
import { PACKAGE_BOOKING_STEPS } from '../../config/steps.config';
import { FlowHeader } from '../../components/shared';

// Import steps
import TripSetupStep from './steps/TripSetupStep';
import BundleBuilderStep from './steps/BundleBuilderStep';
import ReviewStep from './steps/ReviewStep';
import TravelerStep from './steps/TravelerStep';
import ExtrasStep from './steps/ExtrasStep';
import PaymentStep from './steps/PaymentStep';
import ConfirmationStep from './steps/ConfirmationStep';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PackageBookingFlowProps {
  visible: boolean;
  onClose: () => void;
  initialStep?: string;
}

// Step component mapping
const STEP_COMPONENTS: Record<string, React.ComponentType<any>> = {
  setup: TripSetupStep,
  builder: BundleBuilderStep,
  review: ReviewStep,
  travelers: TravelerStep,
  extras: ExtrasStep,
  payment: PaymentStep,
  confirmation: ConfirmationStep,
};

// Step titles for the header
const STEP_TITLES: Record<string, { title: string; subtitle?: string }> = {
  setup: { title: 'Plan Your Trip', subtitle: 'Where & when' },
  builder: { title: 'Build Package', subtitle: 'Select your bundle' },
  review: { title: 'Review', subtitle: 'Check your selections' },
  travelers: { title: 'Travelers', subtitle: 'Enter details' },
  extras: { title: 'Extras', subtitle: 'Add-ons & insurance' },
  payment: { title: 'Payment', subtitle: 'Secure checkout' },
  confirmation: { title: 'Confirmed!', subtitle: 'Booking complete' },
};

export default function PackageBookingFlow({
  visible,
  onClose,
  initialStep = 'setup',
}: PackageBookingFlowProps) {
  const packageStore = usePackageStore();
  const bookingStore = useBookingStore();
  
  // Animation values
  const slideAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  
  // Track previous step for animation direction
  const [previousStepIndex, setPreviousStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Flow management
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    goToStep,
    reset,
  } = useBookingFlow({
    steps: PACKAGE_BOOKING_STEPS,
    initialStep,
    onStepChange: (step, index) => {
      // Animate step transition
      const direction = index > previousStepIndex ? 1 : -1;
      animateStepTransition(direction);
      setPreviousStepIndex(index);
    },
  });
  
  // Animate modal entrance
  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.95, { duration: 200 });
    }
  }, [visible]);
  
  // Step transition animation
  const animateStepTransition = useCallback((direction: number) => {
    setIsAnimating(true);
    slideAnim.value = direction * SCREEN_WIDTH;
    slideAnim.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    }, () => {
      runOnJS(setIsAnimating)(false);
    });
  }, []);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));
  
  const stepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
  }));
  
  // Handlers
  const handleNext = useCallback(() => {
    if (isAnimating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goNext();
  }, [isAnimating, goNext]);
  
  const handleBack = useCallback(() => {
    if (isAnimating || isFirstStep) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goBack();
  }, [isAnimating, isFirstStep, goBack]);
  
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Reset state if not confirmed
    if (!packageStore.isBookingConfirmed) {
      packageStore.reset();
    }
    
    reset();
    onClose();
  }, [packageStore, reset, onClose]);
  
  // Get current step component
  const stepId = currentStep?.id || 'setup';
  const StepComponent = STEP_COMPONENTS[stepId] || TripSetupStep;
  const stepInfo = STEP_TITLES[stepId] || { title: 'Package', subtitle: '' };
  
  // Hide header on confirmation step
  const showHeader = stepId !== 'confirmation';
  
  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Header */}
        {showHeader && (
          <FlowHeader
            title={stepInfo.title}
            subtitle={stepInfo.subtitle}
            currentStep={currentStepIndex + 1}
            totalSteps={totalSteps}
            onBack={handleBack}
            onClose={handleClose}
            showConfirmOnClose={!packageStore.isBookingConfirmed}
          />
        )}
        
        {/* Step Content */}
        <Animated.View style={[styles.stepContainer, stepStyle]}>
          <StepComponent
            onNext={handleNext}
            onBack={handleBack}
            onClose={handleClose}
            stepIndex={currentStepIndex}
            totalSteps={totalSteps}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepContainer: {
    flex: 1,
  },
});
