/**
 * CAR RENTAL BOOKING FLOW
 * 
 * Main orchestrator for the 7-step car rental booking process.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { colors } from '@/styles';
import { useBookingFlow } from '../../hooks/useBookingFlow';
import { CAR_RENTAL_STEPS } from '../../config/steps.config';
import { FlowHeader } from '../../components/shared';
import { useCarStore } from '../../stores/useCarStore';

// Steps
import {
  SearchStep,
  ResultsStep,
  DetailStep,
  ExtrasStep,
  DriverStep,
  PaymentStep,
  ConfirmationStep,
} from './steps';

interface CarRentalFlowProps {
  visible: boolean;
  onClose: () => void;
}

const STEP_COMPONENTS: Record<string, React.ComponentType<any>> = {
  search: SearchStep,
  results: ResultsStep,
  detail: DetailStep,
  extras: ExtrasStep,
  driver: DriverStep,
  payment: PaymentStep,
  confirmation: ConfirmationStep,
};

const STEP_TITLES: Record<string, string> = {
  search: 'Find Your Car',
  results: 'Available Cars',
  detail: 'Car Details',
  extras: 'Protection & Extras',
  driver: 'Driver Details',
  payment: 'Payment',
  confirmation: 'Confirmed',
};

export default function CarRentalFlow({ visible, onClose }: CarRentalFlowProps) {
  const insets = useSafeAreaInsets();
  const { reset } = useCarStore();
  
  const {
    currentStep,
    currentStepIndex,
    goNext,
    goBack: goToPreviousStep,
    canGoBack,
    isLastStep,
    reset: resetFlow,
  } = useBookingFlow({ steps: CAR_RENTAL_STEPS });
  
  // Animation values
  const slideAnim = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      slideAnim.value = withTiming(1, { duration: 300 });
    } else {
      slideAnim.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);
  
  const handleClose = () => {
    resetFlow();
    reset();
    onClose();
  };
  
  const handleBack = () => {
    if (canGoBack) {
      goToPreviousStep();
    } else {
      handleClose();
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: slideAnim.value,
    transform: [{ translateY: (1 - slideAnim.value) * 50 }],
  }));
  
  // Get current step component
  const StepComponent = STEP_COMPONENTS[currentStep.id] || SearchStep;
  const stepTitle = STEP_TITLES[currentStep.id] || currentStep.title;
  
  // Calculate progress
  const progress = (currentStepIndex + 1) / CAR_RENTAL_STEPS.length;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <FlowHeader
          title={stepTitle}
          currentStep={currentStepIndex + 1}
          totalSteps={CAR_RENTAL_STEPS.length}
          onBack={handleBack}
          onClose={handleClose}
          showConfirmOnClose={currentStep.id !== 'confirmation'}
        />
        
        {/* Step Content */}
        <Animated.View style={[styles.content, animatedStyle]}>
          <StepComponent
            onNext={goNext}
            onBack={handleBack}
            onClose={handleClose}
          />
        </Animated.View>
      </View>
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
