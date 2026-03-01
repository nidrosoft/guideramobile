/**
 * CHANGE TRIP SHEET
 * 
 * Bottom sheet to modify search parameters from results screen
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
import {
  CloseCircle,
  Airplane,
  Calendar,
  People,
  ArrowDown2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';

interface ChangeTripSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function ChangeTripSheet({
  visible,
  onClose,
  onSave,
}: ChangeTripSheetProps) {
  const insets = useSafeAreaInsets();
  const { searchParams } = useFlightStore();

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Select date';
    // Handle both Date objects and string dates
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Select date';
    return dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPassengers = () => {
    const { adults, children, infants } = searchParams.passengers;
    const total = adults + children + infants;
    return `${total} Traveler${total > 1 ? 's' : ''}`;
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave();
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
            <Text style={styles.title}>Change Trip</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray400} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Origin */}
            <TouchableOpacity style={styles.field}>
              <View style={styles.fieldIcon}>
                <Airplane size={20} color={colors.gray400} style={{ transform: [{ rotate: '-45deg' }] }} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldValue}>
                  {searchParams.origin?.name || 'Select origin'}
                </Text>
              </View>
              <ArrowDown2 size={20} color={colors.gray400} />
            </TouchableOpacity>

            {/* Destination */}
            <TouchableOpacity style={styles.field}>
              <View style={styles.fieldIcon}>
                <Airplane size={20} color={colors.gray400} style={{ transform: [{ rotate: '45deg' }] }} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldValue}>
                  {searchParams.destination?.name || 'Select destination'}
                </Text>
              </View>
              <ArrowDown2 size={20} color={colors.gray400} />
            </TouchableOpacity>

            {/* Date */}
            <TouchableOpacity style={styles.field}>
              <View style={styles.fieldIcon}>
                <Calendar size={20} color={colors.gray400} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldValue}>
                  {formatDate(searchParams.departureDate)}
                </Text>
              </View>
              <ArrowDown2 size={20} color={colors.gray400} />
            </TouchableOpacity>

            {/* Travelers */}
            <TouchableOpacity style={styles.field}>
              <View style={styles.fieldIcon}>
                <People size={20} color={colors.gray400} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldValue}>{formatPassengers()}</Text>
              </View>
              <ArrowDown2 size={20} color={colors.gray400} />
            </TouchableOpacity>

            {/* Class */}
            <TouchableOpacity style={styles.field}>
              <View style={styles.fieldIcon}>
                <Airplane size={20} color={colors.gray400} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldValue}>
                  {searchParams.cabinClass === 'economy' ? 'Economy Class' :
                   searchParams.cabinClass === 'business' ? 'Business Class' :
                   searchParams.cabinClass === 'first' ? 'First Class' : 'Premium Economy'}
                </Text>
              </View>
              <ArrowDown2 size={20} color={colors.gray400} />
            </TouchableOpacity>
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
    maxHeight: '80%',
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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgModal,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.md,
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldContent: {
    flex: 1,
  },
  fieldValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
