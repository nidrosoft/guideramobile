/**
 * TRAVELER STEP
 * 
 * Unified traveler details form for all package components.
 */

import React, { useState, useEffect } from 'react';
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
import { User, Sms, Call, ArrowRight2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { usePackageStore } from '../../../stores/usePackageStore';
import { Traveler } from '../../../types/booking.types';

interface TravelerStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function TravelerStep({ onNext, onBack, onClose }: TravelerStepProps) {
  const insets = useSafeAreaInsets();
  const { tripSetup, setTravelersList, setContactInfo, travelers, contactInfo } = usePackageStore();
  
  const totalTravelers = tripSetup.travelers.adults + tripSetup.travelers.children;
  
  // Initialize traveler forms with all required fields
  interface TravelerForm {
    id: string;
    type: 'adult' | 'child' | 'infant';
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone: string;
    email: string;
  }
  
  const [travelerForms, setTravelerForms] = useState<TravelerForm[]>(() => {
    if (travelers.length > 0) {
      return travelers.map((t, i) => ({
        id: t.id || `traveler-${i}`,
        type: t.type || 'adult',
        firstName: t.firstName || '',
        lastName: t.lastName || '',
        dateOfBirth: '',
        phone: '',
        email: '',
      }));
    }
    return Array.from({ length: totalTravelers }, (_, i) => ({
      id: `traveler-${i}`,
      type: (i < tripSetup.travelers.adults ? 'adult' : 'child') as 'adult' | 'child',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      email: '',
    }));
  });
  
  // Primary contact info
  const [primaryEmail, setPrimaryEmail] = useState(contactInfo?.email || '');
  const [primaryPhone, setPrimaryPhone] = useState(contactInfo?.phone || '');
  
  const updateTraveler = (index: number, field: string, value: string) => {
    const updated = [...travelerForms];
    updated[index] = { ...updated[index], [field]: value };
    setTravelerForms(updated);
  };
  
  const isFormValid = () => {
    const allTravelersValid = travelerForms.every(
      t => t.firstName && t.firstName.length >= 2 && t.lastName && t.lastName.length >= 2 && t.dateOfBirth.length >= 8
    );
    const contactValid = primaryEmail.includes('@') && primaryPhone.length >= 7;
    return allTravelersValid && contactValid;
  };
  
  const handleContinue = () => {
    if (!isFormValid()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Save travelers
    const completeTravelers: Traveler[] = travelerForms.map((t, i) => ({
      id: t.id || `traveler-${i}`,
      type: t.type || 'adult',
      firstName: t.firstName || '',
      lastName: t.lastName || '',
      dateOfBirth: new Date(1990, 0, 1),
      gender: 'other',
      nationality: 'US',
    }));
    
    setTravelersList(completeTravelers);
    setContactInfo({ email: primaryEmail, phone: primaryPhone, countryCode: '+1' });
    
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
            <Text style={styles.title}>Traveler Details</Text>
            <Text style={styles.subtitle}>
              Enter details for all {totalTravelers} traveler{totalTravelers > 1 ? 's' : ''}
            </Text>
          </Animated.View>
          
          {/* Traveler Forms */}
          {travelerForms.map((traveler, index) => (
            <Animated.View
              key={traveler.id}
              entering={FadeInDown.duration(400).delay(100 + index * 50)}
              style={styles.section}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
                  <User size={24} color={colors.primary} variant="Bold" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>
                    Traveler {index + 1} ({traveler.type === 'adult' ? 'Adult' : 'Child'})
                  </Text>
                  <Text style={styles.sectionSubtitle}>As shown on ID/passport</Text>
                </View>
              </View>
              
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John"
                    placeholderTextColor={colors.gray400}
                    value={traveler.firstName}
                    onChangeText={(text) => updateTraveler(index, 'firstName', text)}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
                    placeholderTextColor={colors.gray400}
                    value={traveler.lastName}
                    onChangeText={(text) => updateTraveler(index, 'lastName', text)}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Date of Birth</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={colors.gray400}
                    value={traveler.dateOfBirth}
                    onChangeText={(text) => updateTraveler(index, 'dateOfBirth', text)}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="(555) 123-4567"
                    placeholderTextColor={colors.gray400}
                    value={traveler.phone}
                    onChangeText={(text) => updateTraveler(index, 'phone', text)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  placeholderTextColor={colors.gray400}
                  value={traveler.email}
                  onChangeText={(text) => updateTraveler(index, 'email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </Animated.View>
          ))}
          
          {/* Primary Contact Info */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100 + totalTravelers * 50)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.success + '15' }]}>
                <Sms size={24} color={colors.success} variant="Bold" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Primary Contact</Text>
                <Text style={styles.sectionSubtitle}>For booking confirmation</Text>
              </View>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  placeholderTextColor={colors.gray400}
                  value={primaryEmail}
                  onChangeText={setPrimaryEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={colors.gray400}
                  value={primaryPhone}
                  onChangeText={setPrimaryPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Footer */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
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
            <Text style={styles.continueText}>Continue to Extras</Text>
            <ArrowRight2 size={20} color={colors.white} />
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
  inputRow: { flexDirection: 'row', gap: spacing.md },
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
  phoneInput: { flexDirection: 'row', gap: spacing.sm },
  countryCode: {
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  phoneNumber: { flex: 1 },
  
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
  },
  continueButton: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  continueButtonDisabled: { opacity: 0.7 },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  continueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
