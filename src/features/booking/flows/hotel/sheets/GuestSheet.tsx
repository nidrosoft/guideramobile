/**
 * GUEST SHEET
 * 
 * Bottom sheet for selecting rooms and guests count
 * Matches the TravelerSheet style from flight flow
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, Add, Minus } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { GuestCount } from '../../../types/booking.types';

interface GuestSheetProps {
  visible: boolean;
  onClose: () => void;
  guests: GuestCount;
  onUpdate: (guests: Partial<GuestCount>) => void;
}

interface GuestType {
  key: keyof GuestCount;
  label: string;
  subtitle: string;
  min: number;
  max: number;
}

const GUEST_TYPES: GuestType[] = [
  { key: 'rooms', label: 'Rooms', subtitle: 'Number of rooms', min: 1, max: 10 },
  { key: 'adults', label: 'Adults', subtitle: '18+ years', min: 1, max: 10 },
  { key: 'children', label: 'Children', subtitle: '0-17 years', min: 0, max: 6 },
];

export default function GuestSheet({
  visible,
  onClose,
  guests,
  onUpdate,
}: GuestSheetProps) {
  const insets = useSafeAreaInsets();
  const [localGuests, setLocalGuests] = useState<GuestCount>(guests);

  // Reset local state when sheet opens
  useEffect(() => {
    if (visible) {
      setLocalGuests(guests);
    }
  }, [visible, guests]);

  const handleIncrement = (key: keyof GuestCount, max: number) => {
    if (localGuests[key] < max) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLocalGuests({ ...localGuests, [key]: localGuests[key] + 1 });
    }
  };

  const handleDecrement = (key: keyof GuestCount, min: number) => {
    if (localGuests[key] > min) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLocalGuests({ ...localGuests, [key]: localGuests[key] - 1 });
    }
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdate(localGuests);
    onClose();
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
            <Text style={styles.title}>Guests & Rooms</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray400} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Guest Counters */}
            {GUEST_TYPES.map((type) => (
              <View key={type.key} style={styles.guestRow}>
                <View style={styles.guestInfo}>
                  <Text style={styles.guestLabel}>{type.label}</Text>
                  <Text style={styles.guestSubtitle}>{type.subtitle}</Text>
                </View>
                
                <View style={styles.counter}>
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      localGuests[type.key] <= type.min && styles.counterButtonDisabled,
                    ]}
                    onPress={() => handleDecrement(type.key, type.min)}
                    disabled={localGuests[type.key] <= type.min}
                  >
                    <Minus size={18} color={localGuests[type.key] <= type.min ? colors.gray300 : colors.textPrimary} />
                  </TouchableOpacity>
                  
                  <Text style={styles.counterValue}>{localGuests[type.key]}</Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      localGuests[type.key] >= type.max && styles.counterButtonDisabled,
                    ]}
                    onPress={() => handleIncrement(type.key, type.max)}
                    disabled={localGuests[type.key] >= type.max}
                  >
                    <Add size={18} color={localGuests[type.key] >= type.max ? colors.gray300 : colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  guestInfo: {
    flex: 1,
  },
  guestLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  guestSubtitle: {
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
