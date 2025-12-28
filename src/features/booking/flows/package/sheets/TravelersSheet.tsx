/**
 * TRAVELERS SHEET
 * 
 * Bottom sheet for selecting number of travelers for package booking.
 * Supports adults, children, and infants.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, Add, Minus, People, Profile2User } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface TravelersSheetProps {
  visible: boolean;
  onClose: () => void;
  travelers: {
    adults: number;
    children: number;
    infants: number;
  };
  onUpdate: (travelers: { adults: number; children: number; infants: number }) => void;
}

export default function TravelersSheet({
  visible,
  onClose,
  travelers,
  onUpdate,
}: TravelersSheetProps) {
  const insets = useSafeAreaInsets();
  
  const [localTravelers, setLocalTravelers] = useState(travelers);

  const handleIncrement = (type: 'adults' | 'children' | 'infants') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const maxValues = { adults: 9, children: 6, infants: 2 };
    if (localTravelers[type] < maxValues[type]) {
      setLocalTravelers(prev => ({ ...prev, [type]: prev[type] + 1 }));
    }
  };

  const handleDecrement = (type: 'adults' | 'children' | 'infants') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const minValues = { adults: 1, children: 0, infants: 0 };
    if (localTravelers[type] > minValues[type]) {
      setLocalTravelers(prev => ({ ...prev, [type]: prev[type] - 1 }));
    }
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdate(localTravelers);
    onClose();
  };

  const getTotalTravelers = () => {
    return localTravelers.adults + localTravelers.children + localTravelers.infants;
  };

  const renderCounter = (
    type: 'adults' | 'children' | 'infants',
    label: string,
    description: string,
    min: number,
    max: number
  ) => {
    const value = localTravelers[type];
    const canDecrement = value > min;
    const canIncrement = value < max;

    return (
      <View style={styles.counterRow}>
        <View style={styles.counterInfo}>
          <Text style={styles.counterLabel}>{label}</Text>
          <Text style={styles.counterDescription}>{description}</Text>
        </View>
        <View style={styles.counterControls}>
          <TouchableOpacity
            style={[styles.counterButton, !canDecrement && styles.counterButtonDisabled]}
            onPress={() => handleDecrement(type)}
            disabled={!canDecrement}
            activeOpacity={0.7}
          >
            <Minus size={20} color={canDecrement ? colors.primary : colors.gray300} />
          </TouchableOpacity>
          <Text style={styles.counterValue}>{value}</Text>
          <TouchableOpacity
            style={[styles.counterButton, !canIncrement && styles.counterButtonDisabled]}
            onPress={() => handleIncrement(type)}
            disabled={!canIncrement}
            activeOpacity={0.7}
          >
            <Add size={20} color={canIncrement ? colors.primary : colors.gray300} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Travelers</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseCircle size={28} color={colors.textSecondary} variant="Bold" />
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Profile2User size={24} color={colors.primary} variant="Bold" />
          </View>
          <Text style={styles.summaryText}>
            {getTotalTravelers()} traveler{getTotalTravelers() !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Counters */}
        <View style={styles.countersContainer}>
          {renderCounter('adults', 'Adults', 'Ages 12+', 1, 9)}
          <View style={styles.divider} />
          {renderCounter('children', 'Children', 'Ages 2-11', 0, 6)}
          <View style={styles.divider} />
          {renderCounter('infants', 'Infants', 'Under 2, on lap', 0, 2)}
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteText}>
            Infants must travel with an adult. Maximum 1 infant per adult.
          </Text>
        </View>

        {/* Confirm Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.confirmButtonGradient}
            >
              <People size={20} color={colors.white} />
              <Text style={styles.confirmButtonText}>
                Confirm {getTotalTravelers()} Traveler{getTotalTravelers() !== 1 ? 's' : ''}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.primary + '08',
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  countersContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  counterInfo: {
    flex: 1,
  },
  counterLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  counterDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  counterButtonDisabled: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray100,
  },
  counterValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginHorizontal: spacing.lg,
  },
  infoNote: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.lg,
  },
  infoNoteText: {
    fontSize: typography.fontSize.sm,
    color: colors.info,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  confirmButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
