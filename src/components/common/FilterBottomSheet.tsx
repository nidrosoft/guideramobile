import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '@/styles';
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
        
        <View style={styles.bottomSheet}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
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
              <Text style={styles.sectionTitle}>Arrange</Text>
            </View>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  filters.arrange === 'aToZ' && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectOption('arrange', 'aToZ')}
              >
                <Text style={[
                  styles.optionText,
                  filters.arrange === 'aToZ' && styles.optionTextSelected,
                ]}>
                  A to Z
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  filters.arrange === 'zToA' && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectOption('arrange', 'zToA')}
              >
                <Text style={[
                  styles.optionText,
                  filters.arrange === 'zToA' && styles.optionTextSelected,
                ]}>
                  Z to A
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Timeline</Text>
            </View>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  filters.timeline === 'newest' && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectOption('timeline', 'newest')}
              >
                <Text style={[
                  styles.optionText,
                  filters.timeline === 'newest' && styles.optionTextSelected,
                ]}>
                  Newest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  filters.timeline === 'oldest' && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectOption('timeline', 'oldest')}
              >
                <Text style={[
                  styles.optionText,
                  filters.timeline === 'oldest' && styles.optionTextSelected,
                ]}>
                  Oldest
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Package */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <People size={20} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Package</Text>
            </View>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  filters.package === 'adultOnly' && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectOption('package', 'adultOnly')}
              >
                <Text style={[
                  styles.optionText,
                  filters.package === 'adultOnly' && styles.optionTextSelected,
                ]}>
                  Adult Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  filters.package === 'includeChildren' && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectOption('package', 'includeChildren')}
              >
                <Text style={[
                  styles.optionText,
                  filters.package === 'includeChildren' && styles.optionTextSelected,
                ]}>
                  Include Children
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  filters.package === 'adultAndChild' && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectOption('package', 'adultAndChild')}
              >
                <Text style={[
                  styles.optionText,
                  filters.package === 'adultAndChild' && styles.optionTextSelected,
                ]}>
                  Adult & Child
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Button */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: colors.white,
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
    backgroundColor: colors.gray300,
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
    color: colors.textPrimary,
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  optionButtonSelected: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  optionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.white,
  },
  saveButton: {
    width: '100%',
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
