/**
 * TRAVELER SHEET
 * 
 * Bottom sheet for selecting number of passengers
 * Adult, Teenager, Children, Baby with counters
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, Minus, Add } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { PassengerCount } from '../../../types/booking.types';

interface TravelerSheetProps {
  visible: boolean;
  onClose: () => void;
  passengers: PassengerCount;
  onSave: (passengers: PassengerCount) => void;
}

interface PassengerType {
  key: keyof PassengerCount;
  label: string;
  subtitle: string;
  min: number;
  max: number;
}

const PASSENGER_TYPES: PassengerType[] = [
  { key: 'adults', label: 'Adult', subtitle: '12+ years', min: 1, max: 9 },
  { key: 'children', label: 'Children', subtitle: '2-11 years', min: 0, max: 6 },
  { key: 'infants', label: 'Baby', subtitle: 'Under 2 years', min: 0, max: 2 },
];

export default function TravelerSheet({
  visible,
  onClose,
  passengers,
  onSave,
}: TravelerSheetProps) {
  const insets = useSafeAreaInsets();
  const [localPassengers, setLocalPassengers] = useState<PassengerCount>(passengers);
  const [infantSeating, setInfantSeating] = useState<'lap' | 'seat'>('lap');

  const handleIncrement = (key: keyof PassengerCount, max: number) => {
    if (localPassengers[key] < max) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLocalPassengers({ ...localPassengers, [key]: localPassengers[key] + 1 });
    }
  };

  const handleDecrement = (key: keyof PassengerCount, min: number) => {
    if (localPassengers[key] > min) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLocalPassengers({ ...localPassengers, [key]: localPassengers[key] - 1 });
    }
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(localPassengers);
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
            <Text style={styles.title}>Add Traveler</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray400} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Passenger Counters */}
            {PASSENGER_TYPES.map((type) => (
              <View key={type.key as string} style={styles.passengerRow}>
                <View style={styles.passengerInfo}>
                  <Text style={styles.passengerLabel}>{type.label}</Text>
                  <Text style={styles.passengerSubtitle}>{type.subtitle}</Text>
                </View>
                
                <View style={styles.counter}>
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      localPassengers[type.key] <= type.min && styles.counterButtonDisabled,
                    ]}
                    onPress={() => handleDecrement(type.key, type.min)}
                    disabled={localPassengers[type.key] <= type.min}
                  >
                    <Minus size={18} color={localPassengers[type.key] <= type.min ? colors.gray300 : colors.textPrimary} />
                  </TouchableOpacity>
                  
                  <Text style={styles.counterValue}>{localPassengers[type.key]}</Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      localPassengers[type.key] >= type.max && styles.counterButtonDisabled,
                    ]}
                    onPress={() => handleIncrement(type.key, type.max)}
                    disabled={localPassengers[type.key] >= type.max}
                  >
                    <Add size={18} color={localPassengers[type.key] >= type.max ? colors.gray300 : colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Infant Seating Option */}
            {localPassengers.infants > 0 && (
              <View style={styles.infantSeating}>
                <Text style={styles.infantNote}>All baby under 2 years old</Text>
                <View style={styles.seatingOptions}>
                  <TouchableOpacity
                    style={[styles.seatingOption, infantSeating === 'lap' && styles.seatingOptionSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setInfantSeating('lap');
                    }}
                  >
                    <View style={[styles.radio, infantSeating === 'lap' && styles.radioSelected]} />
                    <Text style={styles.seatingText}>On the lap</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.seatingOption, infantSeating === 'seat' && styles.seatingOptionSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setInfantSeating('seat');
                    }}
                  >
                    <View style={[styles.radio, infantSeating === 'seat' && styles.radioSelected]} />
                    <Text style={styles.seatingText}>Seated in a chair</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save</Text>
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
    maxHeight: '70%',
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
  content: {
    paddingHorizontal: spacing.lg,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  passengerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    backgroundColor: colors.gray50,
  },
  counterValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  infantSeating: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  infantNote: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  seatingOptions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  seatingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  seatingOptionSelected: {},
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray300,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  seatingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    height: 52,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
