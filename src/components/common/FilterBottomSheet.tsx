import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { ArrowSwapHorizontal, Clock, People, CloseCircle } from 'iconsax-react-native';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

export interface FilterState {
  arrange: 'aToZ' | 'zToA';
  timeline: 'newest' | 'oldest';
  package: 'adultOnly' | 'includeChildren' | 'adultAndChild';
}

export default function FilterBottomSheet({ visible, onClose, onApply }: FilterBottomSheetProps) {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<FilterState>({
    arrange: 'aToZ',
    timeline: 'newest',
    package: 'adultOnly',
  });

  const handleSelectOption = (category: keyof FilterState, value: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters(prev => ({ ...prev, [category]: value }));
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply(filters);
    onClose();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const renderOption = (
    category: keyof FilterState,
    value: string,
    label: string
  ) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        { backgroundColor: colors.background, borderColor: colors.gray200 },
        filters[category] === value && { backgroundColor: colors.black, borderColor: colors.black },
      ]}
      onPress={() => handleSelectOption(category, value)}
    >
      <Text style={[
        styles.optionText,
        { color: colors.textPrimary },
        filters[category] === value && { color: colors.white },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: colors.bgOverlay }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.bottomSheet, { backgroundColor: colors.bgModal }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.gray300 }]} />
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <CloseCircle size={28} color={colors.textSecondary} variant="Bold" />
          </TouchableOpacity>

          {/* Arrange */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ArrowSwapHorizontal size={20} color={colors.textPrimary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Arrange</Text>
            </View>
            <View style={styles.optionsRow}>
              {renderOption('arrange', 'aToZ', 'A to Z')}
              {renderOption('arrange', 'zToA', 'Z to A')}
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={colors.textPrimary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Timeline</Text>
            </View>
            <View style={styles.optionsRow}>
              {renderOption('timeline', 'newest', 'Newest')}
              {renderOption('timeline', 'oldest', 'Oldest')}
            </View>
          </View>

          {/* Package */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <People size={20} color={colors.textPrimary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Package</Text>
            </View>
            <View style={styles.optionsRow}>
              {renderOption('package', 'adultOnly', 'Adult Only')}
              {renderOption('package', 'includeChildren', 'Include Children')}
              {renderOption('package', 'adultAndChild', 'Adult & Child')}
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveButtonText, { color: colors.white }]}>Save</Text>
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
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    borderWidth: 1,
  },
  optionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  saveButton: {
    width: '100%',
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
