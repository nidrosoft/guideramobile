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
import { CloseCircle, Clock, SearchNormal } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useToast } from '@/contexts/ToastContext';

interface AddActivityBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (activity: {
    name: string;
    place?: string;
    startTime: string;
    endTime: string;
    description?: string;
  }) => void;
}

export default function AddActivityBottomSheet({
  visible,
  onClose,
  onAdd,
}: AddActivityBottomSheetProps) {
  const { showSuccess } = useToast();
  const [activityName, setActivityName] = useState('');
  const [place, setPlace] = useState('');
  const [startTime, setStartTime] = useState('8:30 AM');
  const [endTime, setEndTime] = useState('10:30 AM');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!activityName.trim()) {
      return;
    }

    onAdd({
      name: activityName,
      place: place.trim() || undefined,
      startTime,
      endTime,
      description: description.trim() || undefined,
    });

    // Show success toast
    showSuccess('Activity added successfully!');

    // Reset form
    setActivityName('');
    setPlace('');
    setStartTime('8:30 AM');
    setEndTime('10:30 AM');
    setDescription('');
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
            <Text style={styles.headerTitle}>Add New Activity</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <CloseCircle size={28} color={colors.gray400} variant="Linear" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Activity Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Activity</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g hangout with friends"
                placeholderTextColor={colors.gray400}
                value={activityName}
                onChangeText={setActivityName}
              />
            </View>

            {/* Place (Optional) */}
            <View style={styles.field}>
              <Text style={styles.label}>Place</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, styles.inputWithIconPadding]}
                  placeholder="Find place here"
                  placeholderTextColor={colors.gray400}
                  value={place}
                  onChangeText={setPlace}
                />
                <SearchNormal
                  size={20}
                  color={colors.gray400}
                  variant="Linear"
                  style={styles.searchIcon}
                />
              </View>
            </View>

            {/* Time */}
            <View style={styles.field}>
              <Text style={styles.label}>Time</Text>
              <View style={styles.timeRow}>
                {/* Start Time */}
                <View style={styles.timeInput}>
                  <TextInput
                    style={styles.input}
                    value={startTime}
                    onChangeText={setStartTime}
                  />
                  <Clock
                    size={20}
                    color={colors.gray400}
                    variant="Linear"
                    style={styles.clockIcon}
                  />
                </View>

                {/* End Time */}
                <View style={styles.timeInput}>
                  <TextInput
                    style={styles.input}
                    value={endTime}
                    onChangeText={setEndTime}
                  />
                  <Clock
                    size={20}
                    color={colors.gray400}
                    variant="Linear"
                    style={styles.clockIcon}
                  />
                </View>
              </View>
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes about this activity..."
                placeholderTextColor={colors.gray400}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Add Button */}
          <TouchableOpacity
            style={[
              styles.addButton,
              !activityName.trim() && styles.addButtonDisabled,
            ]}
            onPress={handleAdd}
            disabled={!activityName.trim()}
          >
            <Text style={styles.addButtonText}>Add Activity</Text>
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
    maxHeight: '90%',
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
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '400',
    color: colors.gray500,
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
  inputWithIcon: {
    position: 'relative',
  },
  inputWithIconPadding: {
    paddingRight: 48,
  },
  searchIcon: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeInput: {
    flex: 1,
    position: 'relative',
  },
  clockIcon: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  addButton: {
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
  addButtonDisabled: {
    backgroundColor: colors.gray300,
    shadowOpacity: 0,
  },
  addButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
});
