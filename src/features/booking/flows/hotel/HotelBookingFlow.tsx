/**
 * HOTEL BOOKING FLOW
 * 
 * Main orchestrator for the hotel booking process.
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
import { useHotelStore } from '../../stores/useHotelStore';
import { useBookingStore } from '../../stores/useBookingStore';
import { useBookingFlow } from '../../hooks/useBookingFlow';
import { HOTEL_BOOKING_STEPS } from '../../config/steps.config';
import { FlowHeader } from '../../components/shared';

// Import steps
import SearchStep from './steps/SearchStep';
import ResultsStep from './steps/ResultsStep';
import HotelDetailStep from './steps/HotelDetailStep';
import RoomSelectionStep from './steps/RoomSelectionStep';
import GuestInfoStep from './steps/GuestInfoStep';
import PaymentStep from './steps/PaymentStep';
import ConfirmationStep from './steps/ConfirmationStep';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HotelBookingFlowProps {
  visible: boolean;
  onClose: () => void;
  initialStep?: string;
}

// Step component mapping
const STEP_COMPONENTS: Record<string, React.ComponentType<any>> = {
  search: SearchStep,
  results: ResultsStep,
  detail: HotelDetailStep,
  rooms: RoomSelectionStep,
  guests: GuestInfoStep,
  payment: PaymentStep,
  confirmation: ConfirmationStep,
};

// Step titles for the header
const STEP_TITLES: Record<string, { title: string; subtitle?: string }> = {
  search: { title: 'Find Hotels', subtitle: 'Search your perfect stay' },
  results: { title: 'Available Hotels', subtitle: 'Browse options' },
  detail: { title: 'Hotel Details', subtitle: 'Explore the property' },
  rooms: { title: 'Select Room', subtitle: 'Choose your room type' },
  guests: { title: 'Guest Details', subtitle: 'Enter guest information' },
  payment: { title: 'Payment', subtitle: 'Secure checkout' },
  confirmation: { title: 'Confirmed!', subtitle: 'Booking complete' },
};

export default function HotelBookingFlow({
  visible,
  onClose,
  initialStep = 'search',
}: HotelBookingFlowProps) {
  const hotelStore = useHotelStore();
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
    steps: HOTEL_BOOKING_STEPS,
    initialStep,
    onStepChange: (stepId, index) => {
      // Animate step transition
      const direction = index > previousStepIndex ? 1 : -1;
      animateStepTransition(direction);
      setPreviousStepIndex(index);
      hotelStore.setCurrentStep(stepId);
    },
    onComplete: () => {
      // Booking completed
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onCancel: () => {
      handleClose();
    },
  });
  
  // Animate modal entrance
  useEffect(() => {
    if (visible) {
      bookingStore.startBookingSession('hotel');
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.95, { duration: 200 });
    }
  }, [visible]);
  
  const animateStepTransition = (direction: number) => {
    setIsAnimating(true);
    
    // Slide out current step
    slideAnim.value = withTiming(
      -direction * SCREEN_WIDTH,
      { duration: 250, easing: Easing.bezier(0.4, 0, 0.2, 1) },
      () => {
        // Reset position instantly
        slideAnim.value = direction * SCREEN_WIDTH;
        // Slide in new step
        slideAnim.value = withTiming(
          0,
          { duration: 300, easing: Easing.bezier(0.0, 0, 0.2, 1) },
          () => {
            runOnJS(setIsAnimating)(false);
          }
        );
      }
    );
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fadeAnim.value = withTiming(0, { duration: 200 });
    scaleAnim.value = withTiming(0.95, { duration: 200 }, () => {
      runOnJS(onClose)();
      runOnJS(reset)();
      runOnJS(hotelStore.reset)();
      runOnJS(bookingStore.endBookingSession)();
    });
  }, [onClose, reset, hotelStore, bookingStore]);
  
  const handleNext = useCallback(() => {
    if (isAnimating) return;
    goNext();
  }, [goNext, isAnimating]);
  
  const handleBack = useCallback(() => {
    if (isAnimating) return;
    if (isFirstStep) {
      handleClose();
    } else {
      goBack();
    }
  }, [goBack, isFirstStep, handleClose, isAnimating]);
  
  const handleSkip = useCallback(() => {
    if (isAnimating) return;
    // Skip optional steps
    if (currentStep?.optional) {
      goNext();
    }
  }, [currentStep, goNext, isAnimating]);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));
  
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
  }));
  
  // Get current step info for header
  const stepInfo = STEP_TITLES[currentStep?.id || 'search'];
  
  // Render current step
  const renderStep = () => {
    const StepComponent = STEP_COMPONENTS[currentStep?.id || 'search'];
    
    if (!StepComponent) return null;
    
    return (
      <StepComponent
        onNext={handleNext}
        onBack={handleBack}
        onClose={handleClose}
        onSkip={currentStep?.optional ? handleSkip : undefined}
        stepIndex={currentStepIndex}
        totalSteps={totalSteps}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
      />
    );
  };
  
  // Don't show header on confirmation step
  const showHeader = currentStep?.id !== 'confirmation';
  
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
        {/* Gradient Header with Segmented Progress */}
        {showHeader && (
          <FlowHeader
            title={stepInfo.title}
            subtitle={stepInfo.subtitle}
            currentStep={currentStepIndex + 1}
            totalSteps={totalSteps}
            onBack={handleBack}
            onClose={handleClose}
            showConfirmOnClose={currentStep?.id !== 'confirmation'}
          />
        )}
        
        {/* Step Content */}
        <Animated.View style={[styles.content, contentStyle]}>
          {renderStep()}
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
  content: {
    flex: 1,
  },
});
