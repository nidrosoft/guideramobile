import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CloseCircle } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { LayoutType } from '../types/journal.types';
import { useToast } from '@/contexts/ToastContext';

interface CreateEntryBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (title: string, layout: LayoutType) => void;
}

const LAYOUTS = [
  {
    type: LayoutType.MIXED,
    name: 'Mixed Layout',
    description: '1 large + 2 small + 1 wide',
    preview: [
      { width: '48%' as const, height: 80 },
      { width: '48%' as const, height: 38, marginTop: 0 },
      { width: '48%' as const, height: 38, marginTop: 4 },
      { width: '100%' as const, height: 50, marginTop: 4 },
    ],
  },
  {
    type: LayoutType.GRID,
    name: 'Grid Layout',
    description: '2 large + 1 wide',
    preview: [
      { width: '48%' as const, height: 80 },
      { width: '48%' as const, height: 80 },
      { width: '100%' as const, height: 50, marginTop: 4 },
    ],
  },
  {
    type: LayoutType.HERO,
    name: 'Hero Layout',
    description: '1 full-width block',
    preview: [
      { width: '100%' as const, height: 140 },
    ],
  },
];

export default function CreateEntryBottomSheet({
  visible,
  onClose,
  onCreate,
}: CreateEntryBottomSheetProps) {
  const { showSuccess } = useToast();
  const [title, setTitle] = useState('');
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(LayoutType.MIXED);

  const handleCreate = () => {
    if (!title.trim()) {
      return;
    }

    onCreate(title.trim(), selectedLayout);
    showSuccess('Journal entry created!');

    // Reset form
    setTitle('');
    setSelectedLayout(LayoutType.MIXED);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.bottomSheet}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create New Entry</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <CloseCircle size={28} color={colors.gray400} variant="Linear" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Entry Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Entry Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Day 1 in Tokyo"
                placeholderTextColor={colors.gray400}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>

            {/* Layout Selection */}
            <View style={styles.field}>
              <Text style={styles.label}>Choose Layout</Text>
              <View style={styles.layoutGrid}>
                {LAYOUTS.map(layout => (
                  <TouchableOpacity
                    key={layout.type}
                    style={[
                      styles.layoutCard,
                      selectedLayout === layout.type && styles.layoutCardSelected,
                    ]}
                    onPress={() => setSelectedLayout(layout.type)}
                    activeOpacity={0.7}
                  >
                    {/* Layout Preview */}
                    <View style={styles.layoutPreview}>
                      {layout.preview.map((block, index) => (
                        <View
                          key={index}
                          style={[
                            styles.previewBlock,
                            {
                              width: block.width,
                              height: block.height,
                              marginTop: 'marginTop' in block ? block.marginTop : 0,
                            },
                          ]}
                        />
                      ))}
                    </View>

                    {/* Layout Info */}
                    <View style={styles.layoutInfo}>
                      <Text style={[
                        styles.layoutName,
                        selectedLayout === layout.type && styles.layoutNameSelected,
                      ]}>
                        {layout.name}
                      </Text>
                      <Text style={styles.layoutDescription}>
                        {layout.description}
                      </Text>
                    </View>

                    {/* Selected Indicator */}
                    {selectedLayout === layout.type && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              !title.trim() && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!title.trim()}
          >
            <Text style={styles.createButtonText}>Create Entry</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray900,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  layoutGrid: {
    gap: spacing.md,
  },
  layoutCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    position: 'relative',
  },
  layoutCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  layoutPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.md,
    minHeight: 140,
  },
  previewBlock: {
    backgroundColor: colors.gray200,
    borderRadius: 8,
  },
  layoutInfo: {
    marginTop: spacing.sm,
  },
  layoutName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 4,
  },
  layoutNameSelected: {
    color: colors.primary,
  },
  layoutDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  selectedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.white,
  },
  createButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: colors.gray300,
    shadowOpacity: 0,
  },
  createButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
});
