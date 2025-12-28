/**
 * CLASS SHEET
 * 
 * Bottom sheet for selecting cabin class
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
import { CloseCircle, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { CabinClass } from '../../../types/flight.types';

interface ClassSheetProps {
  visible: boolean;
  onClose: () => void;
  selected: CabinClass;
  onSelect: (cabinClass: CabinClass) => void;
}

interface ClassOption {
  value: CabinClass;
  label: string;
}

const CLASS_OPTIONS: ClassOption[] = [
  { value: 'economy', label: 'Economy Class' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business Class' },
  { value: 'first', label: 'First Class' },
];

export default function ClassSheet({
  visible,
  onClose,
  selected,
  onSelect,
}: ClassSheetProps) {
  const insets = useSafeAreaInsets();
  const [localSelected, setLocalSelected] = useState<CabinClass>(selected);

  const handleSelect = (value: CabinClass) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalSelected(value);
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(localSelected);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Flight Class</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray400} variant="Bold" />
            </TouchableOpacity>
          </View>

          {/* Class Options */}
          <View style={styles.options}>
            {CLASS_OPTIONS.map((option) => {
              const isSelected = localSelected === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => handleSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && (
                      <TickCircle size={20} color={colors.white} variant="Bold" />
                    )}
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Choose</Text>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  options: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.md,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    height: 52,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
