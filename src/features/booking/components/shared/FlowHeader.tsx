/**
 * FLOW HEADER
 * 
 * Gradient header with segmented progress bar for booking flows.
 * Responsive design that adapts to different screen sizes.
 * 
 * Features:
 * - Back button (only shown on step 2+)
 * - Close button (always shown, triggers confirmation)
 * - Segmented progress bar
 * - Step counter
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  ImageBackground,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CloseCircle, Warning2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius, shadows } from '@/styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive sizing
const isSmallScreen = SCREEN_WIDTH < 375;
const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;

interface FlowHeaderProps {
  title: string;
  subtitle?: string;
  currentStep: number;  // 1-indexed (Step 1, Step 2, etc.)
  totalSteps: number;
  onBack?: () => void;
  onClose: () => void;  // Required - always need a way to close
  showConfirmOnClose?: boolean;  // Show confirmation modal before closing
  backgroundImage?: ImageSourcePropType;  // Optional background image instead of gradient
}

interface SegmentedProgressProps {
  currentStep: number;
  totalSteps: number;
}

function SegmentedProgress({ currentStep, totalSteps }: SegmentedProgressProps) {
  // Calculate segment width based on screen size
  const segmentGap = isSmallScreen ? 4 : 6;
  const horizontalPadding = spacing.lg * 2;
  const totalGaps = (totalSteps - 1) * segmentGap;
  const availableWidth = SCREEN_WIDTH - horizontalPadding;
  const segmentWidth = (availableWidth - totalGaps) / totalSteps;
  
  // currentStep is 1-indexed (Step 1, Step 2, etc.)
  // Convert to 0-indexed for array mapping
  const currentStepIndex = currentStep - 1;
  
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        // Active = current step or any completed step (fully filled)
        const isActive = index <= currentStepIndex;
        
        return (
          <Animated.View
            key={index}
            entering={FadeIn.duration(300).delay(index * 50)}
            style={[
              styles.progressSegment,
              {
                width: segmentWidth,
                marginRight: index < totalSteps - 1 ? segmentGap : 0,
              },
              isActive && styles.progressSegmentCompleted,
            ]}
          />
        );
      })}
    </View>
  );
}

export default function FlowHeader({
  title,
  subtitle,
  currentStep,
  totalSteps,
  onBack,
  onClose,
  showConfirmOnClose = true,
  backgroundImage,
}: FlowHeaderProps) {
  const insets = useSafeAreaInsets();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Show back button only on step 2 and beyond
  const showBackButton = currentStep > 1 && onBack;
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };
  
  const handleClosePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (showConfirmOnClose) {
      setShowConfirmModal(true);
    } else {
      onClose();
    }
  };
  
  const handleConfirmClose = () => {
    // First close the confirmation modal, then close the flow
    setShowConfirmModal(false);
    // Small delay to ensure modal animation completes before closing flow
    setTimeout(() => {
      onClose();
    }, 100);
  };
  
  const handleCancelClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowConfirmModal(false);
  };
  
  // Responsive font sizes
  const titleSize = isSmallScreen 
    ? typography.fontSize.base 
    : typography.fontSize.lg;
  const subtitleSize = isSmallScreen 
    ? typography.fontSize.xs 
    : typography.fontSize.sm;
  
  // Header content component to avoid duplication
  const HeaderContent = () => (
    <>
      {/* Header Row */}
      <View style={styles.headerRow}>
        {/* Back Button - only show on step 2+ */}
        {showBackButton ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={isSmallScreen ? 20 : 24} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
        
        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text 
            style={[styles.title, { fontSize: titleSize }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text 
              style={[styles.subtitle, { fontSize: subtitleSize }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        
        {/* Close Button - always visible */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleClosePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <CloseCircle size={isSmallScreen ? 20 : 24} color={colors.white} variant="Bold" />
        </TouchableOpacity>
      </View>
      
      {/* Step Counter */}
      <View style={styles.stepCounterContainer}>
        <Text style={styles.stepCounter}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>
      
      {/* Segmented Progress Bar */}
      <SegmentedProgress currentStep={currentStep} totalSteps={totalSteps} />
    </>
  );
  
  return (
    <>
      {backgroundImage ? (
        // Image background with overlay
        <ImageBackground
          source={backgroundImage}
          style={[
            styles.container,
            { paddingTop: insets.top + spacing.sm },
          ]}
          resizeMode="cover"
        >
          {/* Dark overlay for better text readability */}
          <View style={styles.imageOverlay} />
          <HeaderContent />
        </ImageBackground>
      ) : (
        // Default gradient background
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.container,
            { paddingTop: insets.top + spacing.sm },
          ]}
        >
          <HeaderContent />
        </LinearGradient>
      )}
      
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelClose}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={FadeInDown.duration(300).springify()}
            style={styles.modalContent}
          >
            <View style={styles.modalIconContainer}>
              <Warning2 size={48} color={colors.warning} variant="Bold" />
            </View>
            
            <Text style={styles.modalTitle}>Cancel Booking?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel? All your progress will be lost and won't be saved.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={handleCancelClose}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonSecondaryText}>Keep Editing</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleConfirmClose}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonPrimaryText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    minHeight: isSmallScreen ? 44 : 48,
  },
  iconButton: {
    width: isSmallScreen ? 36 : 40,
    height: isSmallScreen ? 36 : 40,
    borderRadius: isSmallScreen ? 18 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: isSmallScreen ? 36 : 40,
    height: isSmallScreen ? 36 : 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    textAlign: 'center',
  },
  stepCounterContainer: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  stepCounter: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: typography.fontWeight.medium,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  progressSegment: {
    height: isSmallScreen ? 4 : 5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
  },
  progressSegmentCompleted: {
    backgroundColor: colors.white,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadows.lg,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray100,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
