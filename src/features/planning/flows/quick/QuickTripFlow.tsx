/**
 * QUICK TRIP FLOW
 * 
 * Fast, AI-assisted trip planning flow.
 * 5 steps: Destination → Dates → Style → Generating → Review
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
import { FlowHeader } from '@/features/booking/components/shared';
import { usePlanningStore } from '../../stores/usePlanningStore';
import { QUICK_TRIP_STEPS } from '../../config/planning.config';

// Background image for Quick Trip flow
const QUICK_TRIP_BG = require('../../../../../assets/images/quicktripbg.png');

// Import steps
import DestinationStep from './steps/DestinationStep';
import DatesStep from './steps/DatesStep';
import StyleStep from './steps/StyleStep';
import GeneratingStep from './steps/GeneratingStep';
import ReviewStep from './steps/ReviewStep';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface QuickTripFlowProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: (planId: string) => void;
}

// Step component mapping
const STEP_COMPONENTS: Record<string, React.ComponentType<any>> = {
  destination: DestinationStep,
  dates: DatesStep,
  style: StyleStep,
  generating: GeneratingStep,
  review: ReviewStep,
};

export default function QuickTripFlow({
  visible,
  onClose,
  onComplete,
}: QuickTripFlowProps) {
  const {
    currentStepIndex,
    setCurrentStep,
    nextStep,
    prevStep,
    reset,
    isGenerating,
  } = usePlanningStore();
  
  // Animation values
  const slideAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  
  // Track previous step for animation direction
  const [previousStepIndex, setPreviousStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Current step info
  const currentStep = QUICK_TRIP_STEPS[currentStepIndex];
  const totalSteps = QUICK_TRIP_STEPS.length;
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
    console.log('QuickTripFlow handleNext called:', { currentStepIndex, isAnimating, isLastStep });
    
    if (isLastStep) {
      console.log('Already on last step, not advancing');
      return;
    }
    
    // Don't block on animation for generating step auto-advance
    if (isAnimating && currentStep?.id !== 'generating') {
      console.log('Animation in progress, blocking');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const direction = 1;
    animateStepTransition(direction);
    setPreviousStepIndex(currentStepIndex);
    nextStep();
  }, [isAnimating, isLastStep, currentStepIndex, currentStep, nextStep, animateStepTransition]);
  
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
    const StepComponent = STEP_COMPONENTS[currentStep?.id || 'destination'];
    
    if (!StepComponent) return null;
    
    return (
      <StepComponent
        onNext={handleNext}
        onBack={handleBack}
        onClose={handleClose}
        onComplete={handleComplete}
        stepIndex={currentStepIndex}
        totalSteps={totalSteps}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
      />
    );
  };
  
  // Hide header on generating and review steps
  const showHeader = currentStep?.id !== 'generating' && currentStep?.id !== 'review';
  
  // Don't show confirmation on generating step (can't cancel mid-generation)
  const showConfirmOnClose = currentStep?.id !== 'generating' && currentStep?.id !== 'review';
  
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
        {/* Header with background image */}
        {showHeader && (
          <FlowHeader
            title={currentStep?.title || 'Quick Trip'}
            subtitle={currentStep?.subtitle}
            currentStep={currentStepIndex + 1}
            totalSteps={totalSteps}
            onBack={handleBack}
            onClose={handleClose}
            showConfirmOnClose={showConfirmOnClose}
            backgroundImage={QUICK_TRIP_BG}
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
