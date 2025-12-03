/**
 * TRAVELER INFO STEP
 * 
 * Collect passenger details and contact information.
 */

import React, { useState, useCallback } from 'react';
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
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  User,
  Sms,
  Call,
  Calendar,
  Global,
  ArrowDown2,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';
import { Traveler, TravelerType, Gender } from '../../../types/booking.types';

interface TravelerInfoStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
}

interface TravelerFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender | '';
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
}

const initialFormData: TravelerFormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  passportNumber: '',
  passportExpiry: '',
};

export default function TravelerInfoStep({
  onNext,
  onBack,
  onClose,
  stepIndex,
  totalSteps,
}: TravelerInfoStepProps) {
  const insets = useSafeAreaInsets();
  const { searchParams, setTravelers, setContactInfo } = useFlightStore();
  
  const totalPassengers = searchParams.passengers.adults + searchParams.passengers.children;
  
  // Form state for each passenger
  const [travelerForms, setTravelerForms] = useState<TravelerFormData[]>(
    Array(totalPassengers).fill(null).map(() => ({ ...initialFormData }))
  );
  
  // Contact info
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Active passenger tab
  const [activePassenger, setActivePassenger] = useState(0);
  
  const updateTravelerForm = (index: number, field: keyof TravelerFormData, value: string) => {
    setTravelerForms(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  
  const isFormValid = (): boolean => {
    // Check all travelers have required fields
    const travelersValid = travelerForms.every(form => 
      form.firstName.trim() && 
      form.lastName.trim() && 
      form.dateOfBirth.trim()
    );
    
    // Check contact info
    const contactValid = email.trim().length > 0 && phone.trim().length > 0;
    
    return travelersValid && contactValid;
  };
  
  const handleContinue = () => {
    if (!isFormValid()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Convert form data to Traveler objects
    const travelers: Traveler[] = travelerForms.map((form, index) => ({
      id: `traveler-${index}`,
      type: index < searchParams.passengers.adults ? 'adult' : 'child' as TravelerType,
      firstName: form.firstName,
      lastName: form.lastName,
      dateOfBirth: new Date(form.dateOfBirth),
      gender: (form.gender || 'other') as Gender,
      nationality: form.nationality || 'US',
      passport: form.passportNumber ? {
        number: form.passportNumber,
        expiryDate: new Date(form.passportExpiry),
        issuingCountry: form.nationality || 'US',
      } : undefined,
    }));
    
    setTravelers(travelers);
    setContactInfo({
      email,
      phone,
      countryCode: '+1',
    });
    
    onNext();
  };
  
  const getPassengerLabel = (index: number): string => {
    if (index < searchParams.passengers.adults) {
      return `Adult ${index + 1}`;
    }
    return `Child ${index - searchParams.passengers.adults + 1}`;
  };
  
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Passenger Tabs */}
          {totalPassengers > 1 && (
            <Animated.View 
              entering={FadeInDown.duration(400).delay(100)}
              style={styles.passengerTabs}
            >
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContent}
              >
                {travelerForms.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.passengerTab,
                      activePassenger === index && styles.passengerTabActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActivePassenger(index);
                    }}
                  >
                    <Text style={[
                      styles.passengerTabText,
                      activePassenger === index && styles.passengerTabTextActive,
                    ]}>
                      {getPassengerLabel(index)}
                    </Text>
                    {travelerForms[index].firstName && travelerForms[index].lastName && (
                      <TickCircle size={16} color={colors.success} variant="Bold" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}
          
          {/* Traveler Form */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(150)}
            style={styles.formCard}
          >
            <View style={styles.formHeader}>
              <View style={styles.formIconContainer}>
                <User size={24} color={colors.primary} variant="Bold" />
              </View>
              <Text style={styles.formTitle}>{getPassengerLabel(activePassenger)}</Text>
            </View>
            
            {/* Name Row */}
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>First Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="John"
                  placeholderTextColor={colors.gray400}
                  value={travelerForms[activePassenger].firstName}
                  onChangeText={(value) => updateTravelerForm(activePassenger, 'firstName', value)}
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Last Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Doe"
                  placeholderTextColor={colors.gray400}
                  value={travelerForms[activePassenger].lastName}
                  onChangeText={(value) => updateTravelerForm(activePassenger, 'lastName', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>
            
            {/* Date of Birth */}
            <View style={styles.formFieldFull}>
              <Text style={styles.fieldLabel}>Date of Birth *</Text>
              <View style={styles.inputWithIcon}>
                <Calendar size={20} color={colors.gray400} />
                <TextInput
                  style={styles.textInputWithIcon}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={colors.gray400}
                  value={travelerForms[activePassenger].dateOfBirth}
                  onChangeText={(value) => updateTravelerForm(activePassenger, 'dateOfBirth', value)}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            
            {/* Gender */}
            <View style={styles.formFieldFull}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderOptions}>
                {(['male', 'female', 'other'] as Gender[]).map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderOption,
                      travelerForms[activePassenger].gender === gender && styles.genderOptionSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateTravelerForm(activePassenger, 'gender', gender);
                    }}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      travelerForms[activePassenger].gender === gender && styles.genderOptionTextSelected,
                    ]}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Nationality */}
            <View style={styles.formFieldFull}>
              <Text style={styles.fieldLabel}>Nationality</Text>
              <View style={styles.inputWithIcon}>
                <Global size={20} color={colors.gray400} />
                <TextInput
                  style={styles.textInputWithIcon}
                  placeholder="United States"
                  placeholderTextColor={colors.gray400}
                  value={travelerForms[activePassenger].nationality}
                  onChangeText={(value) => updateTravelerForm(activePassenger, 'nationality', value)}
                />
              </View>
            </View>
            
            {/* Passport Section */}
            <View style={styles.passportSection}>
              <Text style={styles.passportTitle}>Passport Details (Optional)</Text>
              <Text style={styles.passportSubtitle}>
                Required for international flights
              </Text>
              
              <View style={styles.formFieldFull}>
                <Text style={styles.fieldLabel}>Passport Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter passport number"
                  placeholderTextColor={colors.gray400}
                  value={travelerForms[activePassenger].passportNumber}
                  onChangeText={(value) => updateTravelerForm(activePassenger, 'passportNumber', value)}
                  autoCapitalize="characters"
                />
              </View>
              
              <View style={styles.formFieldFull}>
                <Text style={styles.fieldLabel}>Expiry Date</Text>
                <View style={styles.inputWithIcon}>
                  <Calendar size={20} color={colors.gray400} />
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={colors.gray400}
                    value={travelerForms[activePassenger].passportExpiry}
                    onChangeText={(value) => updateTravelerForm(activePassenger, 'passportExpiry', value)}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>
            </View>
          </Animated.View>
          
          {/* Contact Information */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(200)}
            style={styles.formCard}
          >
            <View style={styles.formHeader}>
              <View style={[styles.formIconContainer, { backgroundColor: colors.info + '15' }]}>
                <Sms size={24} color={colors.info} variant="Bold" />
              </View>
              <View>
                <Text style={styles.formTitle}>Contact Information</Text>
                <Text style={styles.formSubtitle}>For booking confirmation</Text>
              </View>
            </View>
            
            <View style={styles.formFieldFull}>
              <Text style={styles.fieldLabel}>Email Address *</Text>
              <View style={styles.inputWithIcon}>
                <Sms size={20} color={colors.gray400} />
                <TextInput
                  style={styles.textInputWithIcon}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.gray400}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            
            <View style={styles.formFieldFull}>
              <Text style={styles.fieldLabel}>Phone Number *</Text>
              <View style={styles.inputWithIcon}>
                <Call size={20} color={colors.gray400} />
                <TextInput
                  style={styles.textInputWithIcon}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor={colors.gray400}
                  value={phone}
                  onChangeText={setPhone}
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
          style={[
            styles.continueButton,
            !isFormValid() && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isFormValid() ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>Continue to Payment</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  
  // Passenger Tabs
  passengerTabs: {
    marginBottom: spacing.lg,
  },
  tabsContent: {
    gap: spacing.sm,
  },
  passengerTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  passengerTabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  passengerTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  passengerTabTextActive: {
    color: colors.primary,
  },
  
  // Form Card
  formCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  formIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  formTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  formSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  formField: {
    flex: 1,
  },
  formFieldFull: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  textInputWithIcon: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  
  // Gender Options
  genderOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  genderOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  genderOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  genderOptionTextSelected: {
    color: colors.primary,
  },
  
  // Passport Section
  passportSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  passportTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  passportSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
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
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
