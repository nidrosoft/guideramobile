/**
 * CAR DRIVER STEP
 * 
 * Collect driver license and contact information.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  User,
  Card,
  Call,
  Sms,
  Calendar,
  Global,
  ArrowRight2,
  InfoCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useCarStore, DriverInfo } from '../../../stores/useCarStore';

interface DriverStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function DriverStep({ onNext, onBack, onClose }: DriverStepProps) {
  const insets = useSafeAreaInsets();
  const { primaryDriver, setPrimaryDriver, pricing, searchParams } = useCarStore();
  
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
  
  const handleContinue = () => {
    if (!isFormValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPrimaryDriver(form);
    onNext();
  };
  
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.title}>Driver Details</Text>
            <Text style={styles.subtitle}>Enter the main driver's information</Text>
          </Animated.View>
          
          {/* Personal Info */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
                <User size={24} color={colors.primary} variant="Bold" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <Text style={styles.sectionSubtitle}>As shown on driver's license</Text>
              </View>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>First Name</Text>
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
                <Text style={styles.inputLabel}>Last Name</Text>
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
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={colors.gray400}
                value={form.dateOfBirth}
                onChangeText={(text) => updateField('dateOfBirth', text)}
                keyboardType="number-pad"
              />
            </View>
          </Animated.View>
          
          {/* License Info */}
          <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.success + '15' }]}>
                <Card size={24} color={colors.success} variant="Bold" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Driver's License</Text>
                <Text style={styles.sectionSubtitle}>Valid license required at pickup</Text>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>License Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter license number"
                placeholderTextColor={colors.gray400}
                value={form.licenseNumber}
                onChangeText={(text) => updateField('licenseNumber', text)}
                autoCapitalize="characters"
              />
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Country of Issue</Text>
                <TextInput
                  style={styles.input}
                  placeholder="United States"
                  placeholderTextColor={colors.gray400}
                  value={form.licenseCountry}
                  onChangeText={(text) => updateField('licenseCountry', text)}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={colors.gray400}
                  value={form.licenseExpiry}
                  onChangeText={(text) => updateField('licenseExpiry', text)}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </Animated.View>
          
          {/* Contact Info */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.info + '15' }]}>
                <Sms size={24} color={colors.info} variant="Bold" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Contact Details</Text>
                <Text style={styles.sectionSubtitle}>For booking confirmation</Text>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor={colors.gray400}
                value={form.email}
                onChangeText={(text) => updateField('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor={colors.gray400}
                value={form.phone}
                onChangeText={(text) => updateField('phone', text)}
                keyboardType="phone-pad"
              />
            </View>
          </Animated.View>
          
          {/* Important Notice */}
          <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.noticeCard}>
            <InfoCircle size={20} color={colors.warning} />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>Important</Text>
              <Text style={styles.noticeText}>
                The driver must present a valid driver's license and a credit card in their name at pickup. 
                The credit card will be used for the security deposit.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Footer */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Total</Text>
          <Text style={styles.footerPriceAmount}>${pricing.total.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.continueButton, !isFormValid() && styles.continueButtonDisabled]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!isFormValid()}
        >
          <LinearGradient
            colors={isFormValid() ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>Continue to Payment</Text>
            <ArrowRight2 size={18} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  
  // Section
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Inputs
  inputRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  inputHalf: { flex: 1 },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  
  // Notice
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  noticeContent: { flex: 1 },
  noticeTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerPrice: { flex: 1 },
  footerPriceLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  footerPriceAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  continueButton: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  continueButtonDisabled: { opacity: 0.7 },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  continueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
