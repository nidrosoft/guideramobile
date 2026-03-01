/**
 * PARTICIPANTS SHEET
 * 
 * Bottom sheet for selecting number of participants (adults, children, infants).
 * Follows the same pattern as TravelerSheet in flight flow.
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
import { CloseCircle, Add, Minus } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { ParticipantCount } from '../../../types/experience.types';

interface ParticipantsSheetProps {
  visible: boolean;
  onClose: () => void;
  participants: ParticipantCount;
  onUpdate: (participants: ParticipantCount) => void;
}

interface ParticipantType {
  key: keyof ParticipantCount;
  label: string;
  subtitle: string;
  min: number;
  max: number;
}

const PARTICIPANT_TYPES: ParticipantType[] = [
  { key: 'adults', label: 'Adults', subtitle: '13+ years', min: 1, max: 10 },
  { key: 'children', label: 'Children', subtitle: '2-12 years', min: 0, max: 6 },
  { key: 'infants', label: 'Infants', subtitle: 'Under 2 years', min: 0, max: 4 },
];

export default function ParticipantsSheet({
  visible,
  onClose,
  participants,
  onUpdate,
}: ParticipantsSheetProps) {
  const insets = useSafeAreaInsets();
  const [localParticipants, setLocalParticipants] = useState<ParticipantCount>(participants);

  const handleIncrement = (key: keyof ParticipantCount, max: number) => {
    if (localParticipants[key] < max) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLocalParticipants({ ...localParticipants, [key]: localParticipants[key] + 1 });
    }
  };

  const handleDecrement = (key: keyof ParticipantCount, min: number) => {
    if (localParticipants[key] > min) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLocalParticipants({ ...localParticipants, [key]: localParticipants[key] - 1 });
    }
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdate(localParticipants);
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
            <Text style={styles.title}>Add Guests</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray400} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Participant Counters */}
            {PARTICIPANT_TYPES.map((type) => (
              <View key={type.key as string} style={styles.participantRow}>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantLabel}>{type.label}</Text>
                  <Text style={styles.participantSubtitle}>{type.subtitle}</Text>
                </View>
                
                <View style={styles.counter}>
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      localParticipants[type.key] <= type.min && styles.counterButtonDisabled,
                    ]}
                    onPress={() => handleDecrement(type.key, type.min)}
                    disabled={localParticipants[type.key] <= type.min}
                  >
                    <Minus size={18} color={localParticipants[type.key] <= type.min ? colors.gray300 : colors.textPrimary} />
                  </TouchableOpacity>
                  
                  <Text style={styles.counterValue}>{localParticipants[type.key]}</Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      localParticipants[type.key] >= type.max && styles.counterButtonDisabled,
                    ]}
                    onPress={() => handleIncrement(type.key, type.max)}
                    disabled={localParticipants[type.key] >= type.max}
                  >
                    <Add size={18} color={localParticipants[type.key] >= type.max ? colors.gray300 : colors.textPrimary} />
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
    backgroundColor: colors.bgModal,
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
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  participantInfo: {
    flex: 1,
  },
  participantLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  participantSubtitle: {
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
