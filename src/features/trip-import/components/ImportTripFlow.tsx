/**
 * IMPORT TRIP FLOW
 * 
 * Main orchestrator for the trip import flow.
 * Manages step navigation, state, and animations.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { ArrowLeft } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import * as Haptics from 'expo-haptics';
import {
  ImportFlowProps,
  ImportFlowState,
  ImportStep,
  ImportMethod,
  ImportFlowData,
} from '../types/import-flow.types';
import StepIndicator from './StepIndicator';
import MethodSelectionStep from '../steps/MethodSelectionStep';
import EmailLinkStep from '../steps/email/EmailLinkStep';
import EmailProviderStep from '../steps/email/EmailProviderStep';
import EmailInputStep from '../steps/email/EmailInputStep';
import EmailConnectingStep from '../steps/email/EmailConnectingStep';
import EmailScanningStep from '../steps/email/EmailScanningStep';
import EmailBookingsStep from '../steps/email/EmailBookingsStep';
import EmailSuccessStep from '../steps/email/EmailSuccessStep';
import LinkProviderStep from '../steps/link/LinkProviderStep';
import LinkAuthStep from '../steps/link/LinkAuthStep';
import LinkConnectingStep from '../steps/link/LinkConnectingStep';
import LinkFetchingStep from '../steps/link/LinkFetchingStep';
import LinkTripsStep from '../steps/link/LinkTripsStep';
import LinkSuccessStep from '../steps/link/LinkSuccessStep';
import ManualTypeStep from '../steps/manual/ManualTypeStep';
import ManualFlightStep from '../steps/manual/ManualFlightStep';
import ManualHotelStep from '../steps/manual/ManualHotelStep';
import ManualCarStep from '../steps/manual/ManualCarStep';
import ManualFetchingStep from '../steps/manual/ManualFetchingStep';
import ManualResultStep from '../steps/manual/ManualResultStep';
import ManualSuccessStep from '../steps/manual/ManualSuccessStep';
import ScanCameraStep from '../steps/scan/ScanCameraStep';
import ScanScanningStep from '../steps/scan/ScanScanningStep';
import ScanResultStep from '../steps/scan/ScanResultStep';
import ScanSuccessStep from '../steps/scan/ScanSuccessStep';

export default function ImportTripFlow({ visible, onClose, onComplete }: ImportFlowProps) {
  const [flowState, setFlowState] = useState<ImportFlowState>({
    currentStep: 'method-selection',
    stepHistory: [],
    method: null,
    data: {},
  });

  const handleNext = (data?: Partial<ImportFlowData>, method?: ImportMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Update method if provided
    if (method) {
      setFlowState(prev => ({ ...prev, method }));
    }

    // Update data
    if (data) {
      setFlowState(prev => ({
        ...prev,
        data: { ...prev.data, ...data },
      }));
    }

    // Determine next step based on current step and method
    let nextStep: ImportStep = 'method-selection';
    
    const currentStep = flowState.currentStep;
    
    // Email flow navigation
    if (currentStep === 'method-selection' && method === 'email') {
      nextStep = 'email-link';
    } else if (currentStep === 'email-link') {
      nextStep = 'email-provider';
    } else if (currentStep === 'email-provider') {
      // If "Other Provider" selected, go to manual input
      if (data?.emailProvider === 'other') {
        nextStep = 'email-input';
      } else {
        // For Gmail/Outlook/Yahoo, skip to connecting
        nextStep = 'email-connecting';
      }
    } else if (currentStep === 'email-input') {
      nextStep = 'email-connecting';
    } else if (currentStep === 'email-connecting') {
      nextStep = 'email-scanning';
    } else if (currentStep === 'email-scanning') {
      nextStep = 'email-bookings';
    } else if (currentStep === 'email-bookings') {
      nextStep = 'email-success';
    } else if (currentStep === 'email-success') {
      // Complete the flow
      onComplete(flowState.data);
      return;
    }
    // Link flow navigation
    else if (currentStep === 'method-selection' && method === 'link') {
      nextStep = 'link-provider';
    } else if (currentStep === 'link-provider') {
      nextStep = 'link-auth';
    } else if (currentStep === 'link-auth') {
      nextStep = 'link-connecting';
    } else if (currentStep === 'link-connecting') {
      nextStep = 'link-fetching';
    } else if (currentStep === 'link-fetching') {
      nextStep = 'link-trips';
    } else if (currentStep === 'link-trips') {
      nextStep = 'link-success';
    } else if (currentStep === 'link-success') {
      // Complete the flow
      onComplete(flowState.data);
      return;
    }
    // Manual flow navigation
    else if (currentStep === 'method-selection' && method === 'manual') {
      nextStep = 'manual-type';
    } else if (currentStep === 'manual-type') {
      // Route to specific input step based on type
      if (data?.manualType === 'flight') {
        nextStep = 'manual-flight';
      } else if (data?.manualType === 'hotel') {
        nextStep = 'manual-hotel';
      } else if (data?.manualType === 'car') {
        nextStep = 'manual-car';
      } else {
        // Activity or other - go to flight for now
        nextStep = 'manual-flight';
      }
    } else if (currentStep === 'manual-flight' || currentStep === 'manual-hotel' || currentStep === 'manual-car') {
      nextStep = 'manual-fetching';
    } else if (currentStep === 'manual-fetching') {
      nextStep = 'manual-result';
    } else if (currentStep === 'manual-result') {
      nextStep = 'manual-success';
    } else if (currentStep === 'manual-success') {
      // Complete the flow
      onComplete(flowState.data);
      return;
    }
    // Scan flow navigation
    else if (currentStep === 'method-selection' && method === 'scan') {
      nextStep = 'scan-camera';
    } else if (currentStep === 'scan-camera') {
      nextStep = 'scan-scanning';
    } else if (currentStep === 'scan-scanning') {
      nextStep = 'scan-result';
    } else if (currentStep === 'scan-result') {
      nextStep = 'scan-success';
    } else if (currentStep === 'scan-success') {
      // Complete the flow
      onComplete(flowState.data);
      return;
    }

    // Update step immediately (no animation for now)
    setFlowState(prev => ({
      ...prev,
      currentStep: nextStep,
      stepHistory: [...prev.stepHistory, prev.currentStep],
    }));
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (flowState.stepHistory.length === 0) {
      onClose();
      return;
    }

    const previousStep = flowState.stepHistory[flowState.stepHistory.length - 1];
    const newHistory = flowState.stepHistory.slice(0, -1);

    // Update step immediately (no animation for now)
    setFlowState(prev => ({
      ...prev,
      currentStep: previousStep,
      stepHistory: newHistory,
    }));
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    // Reset state after close animation
    setTimeout(() => {
      setFlowState({
        currentStep: 'method-selection',
        stepHistory: [],
        method: null,
        data: {},
      });
    }, 300);
  };

  const renderStep = () => {
    const stepProps = {
      onNext: handleNext,
      onBack: handleBack,
      data: flowState.data,
    };

    switch (flowState.currentStep) {
      case 'method-selection':
        return <MethodSelectionStep {...stepProps} />;
      
      // Email flow steps
      case 'email-link':
        return <EmailLinkStep {...stepProps} />;
      case 'email-provider':
        return <EmailProviderStep {...stepProps} />;
      case 'email-input':
        return <EmailInputStep {...stepProps} />;
      case 'email-connecting':
        return <EmailConnectingStep {...stepProps} />;
      case 'email-scanning':
        return <EmailScanningStep {...stepProps} />;
      case 'email-bookings':
        return <EmailBookingsStep {...stepProps} />;
      case 'email-success':
        return <EmailSuccessStep {...stepProps} />;
      
      // Link flow steps
      case 'link-provider':
        return <LinkProviderStep {...stepProps} />;
      case 'link-auth':
        return <LinkAuthStep {...stepProps} />;
      case 'link-connecting':
        return <LinkConnectingStep {...stepProps} />;
      case 'link-fetching':
        return <LinkFetchingStep {...stepProps} />;
      case 'link-trips':
        return <LinkTripsStep {...stepProps} />;
      case 'link-success':
        return <LinkSuccessStep {...stepProps} />;
      
      // Manual flow steps
      case 'manual-type':
        return <ManualTypeStep {...stepProps} />;
      case 'manual-flight':
        return <ManualFlightStep {...stepProps} />;
      case 'manual-hotel':
        return <ManualHotelStep {...stepProps} />;
      case 'manual-car':
        return <ManualCarStep {...stepProps} />;
      case 'manual-fetching':
        return <ManualFetchingStep {...stepProps} />;
      case 'manual-result':
        return <ManualResultStep {...stepProps} />;
      case 'manual-success':
        return <ManualSuccessStep {...stepProps} />;
      
      // Scan flow
      case 'scan-camera':
        return <ScanCameraStep {...stepProps} />;
      case 'scan-scanning':
        return <ScanScanningStep {...stepProps} />;
      case 'scan-result':
        return <ScanResultStep {...stepProps} />;
      case 'scan-success':
        return <ScanSuccessStep {...stepProps} />;
      
      default:
        return <MethodSelectionStep {...stepProps} />;
    }
  };

  const getStepNumber = () => {
    const stepMap: Record<ImportStep, number> = {
      'method-selection': 1,
      // Email flow
      'email-link': 2,
      'email-provider': 3,
      'email-input': 4,
      'email-connecting': 5,
      'email-scanning': 6,
      'email-bookings': 7,
      'email-success': 8,
      // Link flow
      'link-provider': 2,
      'link-auth': 3,
      'link-connecting': 4,
      'link-fetching': 5,
      'link-trips': 6,
      'link-success': 7,
      // Manual flow
      'manual-type': 2,
      'manual-flight': 3,
      'manual-hotel': 3,
      'manual-car': 3,
      'manual-fetching': 4,
      'manual-result': 5,
      'manual-success': 6,
      // Scan flow
      'scan-camera': 2,
      'scan-scanning': 3,
      'scan-result': 4,
      'scan-success': 5,
    };
    return stepMap[flowState.currentStep] || 1;
  };

  const getTotalSteps = () => {
    if (flowState.method === 'email') return 8;
    if (flowState.method === 'link') return 7;
    if (flowState.method === 'manual') return 6;
    if (flowState.method === 'scan') return 5;
    return 1;
  };

  const getTitle = () => {
    if (flowState.currentStep === 'method-selection') {
      return 'Import Trip';
    }
    if (flowState.method === 'email') {
      return 'Import via Email';
    }
    if (flowState.method === 'link') {
      return 'Link Travel Account';
    }
    if (flowState.method === 'manual') {
      return 'Add Manually';
    }
    if (flowState.method === 'scan') {
      return 'Scan Ticket';
    }
    return 'Import Trip';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={handleClose}
      >
        <View style={[
          styles.bottomSheet,
          flowState.currentStep === 'method-selection' && styles.bottomSheetShort
        ]} onStartShouldSetResponder={() => true}>
          {/* Handle Bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            {/* Back Button (Left) */}
            <View style={styles.headerLeft}>
              {flowState.stepHistory.length > 0 ? (
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.backButtonPlaceholder} />
              )}
            </View>
            
            {/* Title (Center) */}
            <Text style={styles.title}>{getTitle()}</Text>
            
            {/* Close Button (Right) */}
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Step Indicator */}
          {flowState.method && (
            <StepIndicator 
              currentStep={getStepNumber()} 
              totalSteps={getTotalSteps()} 
            />
          )}

          {/* Step Content */}
          <View style={styles.stepContent}>
            {renderStep()}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing['2xl'],
    height: '85%',
  },
  bottomSheetShort: {
    height: '75%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  placeholder: {
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
