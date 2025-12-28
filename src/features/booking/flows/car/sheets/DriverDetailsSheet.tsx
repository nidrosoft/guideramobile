/**
 * DRIVER DETAILS SHEET
 * 
 * Driver information form for car rental.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CloseCircle,
  User,
  Card,
  Call,
  Sms,
  Calendar,
  Global,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useCarStore, DriverInfo } from '../../../stores/useCarStore';

interface DriverDetailsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function DriverDetailsSheet({ visible, onClose }: DriverDetailsSheetProps) {
  const insets = useSafeAreaInsets();
  const { primaryDriver, setPrimaryDriver } = useCarStore();

  const [form, setForm] = useState<DriverInfo>({
    firstName: primaryDriver?.firstName || '',
    lastName: primaryDriver?.lastName || '',
    email: primaryDriver?.email || '',
    phone: primaryDriver?.phone || '',
    dateOfBirth: primaryDriver?.dateOfBirth || '',
    licenseNumber: primaryDriver?.licenseNumber || '',
    licenseCountry: primaryDriver?.licenseCountry || 'United States',
    licenseExpiry: primaryDriver?.licenseExpiry || '',
  });

  const updateField = (field: keyof DriverInfo, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      form.firstName.length >= 2 &&
      form.lastName.length >= 2 &&
      form.email.includes('@') &&
      form.phone.length >= 7 &&
      form.dateOfBirth.length >= 8 &&
      form.licenseNumber.length >= 5 &&
      form.licenseExpiry.length >= 8
    );
  };

  const handleSave = () => {
    if (!isFormValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPrimaryDriver(form);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <User size={24} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Driver Details</Text>
              <Text style={styles.subtitle}>Enter the main driver's information</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Personal Info Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Personal Information</Text>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John"
                    placeholderTextColor={colors.gray400}
                    value={form.firstName}
                    onChangeText={(text) => updateField('firstName', text)}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Last Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
                    placeholderTextColor={colors.gray400}
                    value={form.lastName}
                    onChangeText={(text) => updateField('lastName', text)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Birth *</Text>
                <View style={styles.inputWithIcon}>
                  <Calendar size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.inputIconText}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={colors.gray400}
                    value={form.dateOfBirth}
                    onChangeText={(text) => updateField('dateOfBirth', text)}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            {/* Contact Info Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sms size={20} color={colors.success} />
                <Text style={styles.sectionTitle}>Contact Information</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <View style={styles.inputWithIcon}>
                  <Sms size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.inputIconText}
                    placeholder="john@example.com"
                    placeholderTextColor={colors.gray400}
                    value={form.email}
                    onChangeText={(text) => updateField('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone *</Text>
                <View style={styles.inputWithIcon}>
                  <Call size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.inputIconText}
                    placeholder="+1 (555) 123-4567"
                    placeholderTextColor={colors.gray400}
                    value={form.phone}
                    onChangeText={(text) => updateField('phone', text)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* License Info Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Card size={20} color={colors.warning} />
                <Text style={styles.sectionTitle}>Driver's License</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>License Number *</Text>
                <View style={styles.inputWithIcon}>
                  <Card size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.inputIconText}
                    placeholder="DL12345678"
                    placeholderTextColor={colors.gray400}
                    value={form.licenseNumber}
                    onChangeText={(text) => updateField('licenseNumber', text)}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Issuing Country</Text>
                <View style={styles.inputWithIcon}>
                  <Global size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.inputIconText}
                    placeholder="United States"
                    placeholderTextColor={colors.gray400}
                    value={form.licenseCountry}
                    onChangeText={(text) => updateField('licenseCountry', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expiry Date *</Text>
                <View style={styles.inputWithIcon}>
                  <Calendar size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.inputIconText}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={colors.gray400}
                    value={form.licenseExpiry}
                    onChangeText={(text) => updateField('licenseExpiry', text)}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, !isFormValid() && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isFormValid()}
          >
            <Text style={styles.saveButtonText}>
              {isFormValid() ? 'Save Driver Details' : 'Complete Required Fields'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 60,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
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
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputHalf: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
    height: 48,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    height: 48,
    gap: spacing.sm,
  },
  inputIconText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
