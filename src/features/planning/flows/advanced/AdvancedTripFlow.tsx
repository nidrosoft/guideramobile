/**
 * ADVANCED TRIP FLOW
 * 
 * Detailed, customized trip planning with full control.
 * 10 steps: Trip Type → Destinations → Dates → Travelers → Budget → 
 *           Interests → Accommodation → Transportation → Bookings → Review
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  StatusBar,
  Dimensions,
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
import { useTheme } from '@/context/ThemeContext';
import { FlowHeader } from '@/features/booking/components/shared';
import { useAdvancedPlanningStore } from '../../stores/useAdvancedPlanningStore';
import { ADVANCED_TRIP_STEPS } from '../../config/planning.config';

// Background image for Advanced Trip flow
const ADVANCED_TRIP_BG = require('../../../../../assets/images/advancetripbg.png');

// Import steps
import TripTypeStep from './steps/TripTypeStep';
import DestinationsStep from './steps/DestinationsStep';
import AdvancedDatesStep from './steps/AdvancedDatesStep';
import TravelersStep from './steps/TravelersStep';
import BudgetStep from './steps/BudgetStep';
import InterestsStep from './steps/InterestsStep';
import AccommodationStep from './steps/AccommodationStep';
import TransportationStep from './steps/TransportationStep';
import BookingsStep from './steps/BookingsStep';
import AdvancedReviewStep from './steps/AdvancedReviewStep';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AdvancedTripFlowProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: (planId: string) => void;
}

// Step component mapping
const STEP_COMPONENTS: Record<string, React.ComponentType<any>> = {
  tripType: TripTypeStep,
  destinations: DestinationsStep,
  dates: AdvancedDatesStep,
  travelers: TravelersStep,
  budget: BudgetStep,
  interests: InterestsStep,
  accommodation: AccommodationStep,
  transportation: TransportationStep,
  bookings: BookingsStep,
  review: AdvancedReviewStep,
};

export default function AdvancedTripFlow({
  visible,
  onClose,
  onComplete,
}: AdvancedTripFlowProps) {
  const { colors: tc } = useTheme();
  const {
    currentStepIndex,
    setCurrentStep,
    nextStep,
    prevStep,
    reset,
    isGenerating,
  } = useAdvancedPlanningStore();
  
  // Animation values
  const slideAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  
  // Track previous step for animation direction
  const [previousStepIndex, setPreviousStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Current step info
  const currentStep = ADVANCED_TRIP_STEPS[currentStepIndex];
  const totalSteps = ADVANCED_TRIP_STEPS.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  
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
  
  // Animate step transitions
  const animateStepTransition = useCallback((direction: number) => {
    setIsAnimating(true);
    
    slideAnim.value = withTiming(
      -direction * SCREEN_WIDTH,
      { duration: 250, easing: Easing.bezier(0.4, 0, 0.2, 1) },
      () => {
        slideAnim.value = direction * SCREEN_WIDTH;
        slideAnim.value = withTiming(
          0,
          { duration: 300, easing: Easing.bezier(0.0, 0, 0.2, 1) },
          () => {
            runOnJS(setIsAnimating)(false);
          }
        );
      }
    );
  }, []);
  
  // Handlers
  const handleNext = useCallback(() => {
    if (isLastStep || isAnimating) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const direction = 1;
    animateStepTransition(direction);
    setPreviousStepIndex(currentStepIndex);
    nextStep();
  }, [isAnimating, isLastStep, currentStepIndex, nextStep, animateStepTransition]);
  
  const handleBack = useCallback(() => {
    if (isAnimating || isFirstStep) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const direction = -1;
    animateStepTransition(direction);
    setPreviousStepIndex(currentStepIndex);
    prevStep();
  }, [isAnimating, isFirstStep, currentStepIndex, prevStep, animateStepTransition]);
  
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reset();
    onClose();
  }, [reset, onClose]);
  
  const handleComplete = useCallback((planId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete?.(planId);
    reset();
    onClose();
  }, [onComplete, reset, onClose]);
  
  // Skip optional steps
  const handleSkip = useCallback(() => {
    if (currentStep?.optional) {
      handleNext();
    }
  }, [currentStep, handleNext]);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));
  
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
  }));
  
  // Render current step
  const renderStep = () => {
    const StepComponent = STEP_COMPONENTS[currentStep?.id || 'tripType'];
    
    if (!StepComponent) return null;
    
    return (
      <StepComponent
        onNext={handleNext}
        onBack={handleBack}
        onClose={handleClose}
        onComplete={handleComplete}
        onSkip={handleSkip}
        stepIndex={currentStepIndex}
        totalSteps={totalSteps}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        isOptional={currentStep?.optional}
      />
    );
  };
  
  // Hide header on review step
  const showHeader = currentStep?.id !== 'review';
  
  // Don't show confirmation on review step
  const showConfirmOnClose = currentStep?.id !== 'review';
  
  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.View style={[styles.container, containerStyle, { backgroundColor: tc.background }]}>
        {/* Header with background image */}
        {showHeader && (
          <FlowHeader
            title={currentStep?.title || 'Advanced Trip'}
            subtitle={currentStep?.subtitle}
            currentStep={currentStepIndex + 1}
            totalSteps={totalSteps}
            onBack={handleBack}
            onClose={handleClose}
            showConfirmOnClose={showConfirmOnClose}
            backgroundImage={ADVANCED_TRIP_BG}
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
    // backgroundColor set dynamically via useTheme()
  },
  content: {
    flex: 1,
  },
});
