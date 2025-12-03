/**
 * EXPERIENCE BOOKING FLOW
 * 
 * Main orchestrator for the experience booking process.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors } from '@/styles';
import { useBookingFlow } from '../../hooks/useBookingFlow';
import { EXPERIENCE_BOOKING_STEPS } from '../../config/steps.config';
import { FlowHeader } from '../../components/shared';
import { useExperienceStore } from '../../stores/useExperienceStore';
import {
  SearchStep,
  ResultsStep,
  DetailStep,
  OptionsStep,
  PaymentStep,
  ConfirmationStep,
} from './steps';

interface ExperienceFlowProps {
  visible: boolean;
  onClose: () => void;
}

export default function ExperienceFlow({ visible, onClose }: ExperienceFlowProps) {
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    goNext,
    goBack: goToPreviousStep,
    reset: resetFlow,
    canGoBack,
  } = useBookingFlow({ steps: EXPERIENCE_BOOKING_STEPS });
  
  const { reset: resetStore } = useExperienceStore();
  
  useEffect(() => {
    if (!visible) {
      resetFlow();
    }
  }, [visible]);
  
  const handleClose = () => {
    resetStore();
    resetFlow();
    onClose();
  };
  
  const handleBack = () => {
    if (canGoBack) {
      goToPreviousStep();
    } else {
      handleClose();
    }
  };
  
  const renderStep = () => {
    const stepProps = {
      onNext: goNext,
      onBack: handleBack,
      onClose: handleClose,
    };
    
    switch (currentStep.id) {
      case 'search':
        return <SearchStep {...stepProps} />;
      case 'results':
        return <ResultsStep {...stepProps} />;
      case 'detail':
        return <DetailStep {...stepProps} />;
      case 'options':
        return <OptionsStep {...stepProps} />;
      case 'payment':
        return <PaymentStep {...stepProps} />;
      case 'confirmation':
        return <ConfirmationStep {...stepProps} />;
      default:
        return <SearchStep {...stepProps} />;
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <FlowHeader
          title={currentStep.title}
          subtitle={currentStep.subtitle}
          currentStep={currentStepIndex + 1}
          totalSteps={totalSteps}
          onBack={handleBack}
          onClose={handleClose}
          showConfirmOnClose={currentStep.id !== 'confirmation'}
        />
        
        <View style={styles.content}>
          {renderStep()}
        </View>
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
