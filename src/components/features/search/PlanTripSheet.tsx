/**
 * PLAN TRIP SHEET
 * 
 * Bottom sheet that appears when user wants to plan a trip.
 * Offers Quick Trip (AI-assisted) or Advanced Trip (full control) options.
 * Pre-fills destination, dates, and guests into the chosen flow.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Flash, Setting2, CloseCircle } from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

export interface TripPlanData {
  destination: string;
  startDate?: Date | null;
  endDate?: Date | null;
  guests?: {
    adults: number;
    children: number;
    infants: number;
  };
}

interface PlanTripSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectQuickTrip: (data: TripPlanData) => void;
  onSelectAdvancedTrip: (data: TripPlanData) => void;
  tripData: TripPlanData;
}

export default function PlanTripSheet({
  visible,
  onClose,
  onSelectQuickTrip,
  onSelectAdvancedTrip,
  tripData,
}: PlanTripSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    sheet: { backgroundColor: themeColors.white },
    handle: { backgroundColor: themeColors.gray300 },
    title: { color: themeColors.textPrimary },
    subtitle: { color: themeColors.textSecondary },
    optionCard: { backgroundColor: themeColors.gray50, borderColor: themeColors.gray200 },
    optionTitle: { color: themeColors.textPrimary },
    optionDescription: { color: themeColors.textSecondary },
    quickIcon: { backgroundColor: themeColors.primary + '15' },
    advancedIcon: { backgroundColor: themeColors.info + '15' },
    destinationBadge: { backgroundColor: themeColors.primary + '10' },
    destinationText: { color: themeColors.primary },
  }), [themeColors]);

  const handleQuickTrip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => onSelectQuickTrip(tripData), 300);
  };

  const handleAdvancedTrip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => onSelectAdvancedTrip(tripData), 300);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.overlay, dynamicStyles.overlay]}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <View style={[
          styles.sheet, 
          dynamicStyles.sheet,
          { paddingBottom: insets.bottom + spacing.lg }
        ]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, dynamicStyles.handle]} />
          </View>

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <CloseCircle size={24} color={themeColors.textSecondary} variant="Outline" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, dynamicStyles.title]}>Plan Your Trip</Text>
            {tripData.destination && (
              <View style={[styles.destinationBadge, dynamicStyles.destinationBadge]}>
                <Text style={[styles.destinationText, dynamicStyles.destinationText]}>
                  📍 {tripData.destination}
                </Text>
              </View>
            )}
            <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
              Choose how you'd like to plan
            </Text>
          </View>

          {/* Options */}
          <View style={styles.options}>
            {/* Quick Trip Option */}
            <TouchableOpacity
              style={[styles.optionCard, dynamicStyles.optionCard]}
              onPress={handleQuickTrip}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, dynamicStyles.quickIcon]}>
                <Flash size={28} color={themeColors.primary} variant="Bold" />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, dynamicStyles.optionTitle]}>
                  Quick Trip
                </Text>
                <Text style={[styles.optionDescription, dynamicStyles.optionDescription]}>
                  Let AI plan your perfect trip in seconds
                </Text>
              </View>
              <Text style={styles.optionArrow}>→</Text>
            </TouchableOpacity>

            {/* Advanced Trip Option */}
            <TouchableOpacity
              style={[styles.optionCard, dynamicStyles.optionCard]}
              onPress={handleAdvancedTrip}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, dynamicStyles.advancedIcon]}>
                <Setting2 size={28} color={themeColors.info} variant="Bold" />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, dynamicStyles.optionTitle]}>
                  Advanced Trip
                </Text>
                <Text style={[styles.optionDescription, dynamicStyles.optionDescription]}>
                  Full control over every detail
                </Text>
              </View>
              <Text style={styles.optionArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  destinationBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  destinationText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
  options: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
  },
  optionArrow: {
    fontSize: 20,
    color: '#999',
  },
});
