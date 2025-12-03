/**
 * GUEST INFO STEP
 * 
 * Collect guest details and special requests.
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
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  User,
  Sms,
  Call,
  Clock,
  Note,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';

interface GuestInfoStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
}

const ARRIVAL_TIMES = [
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
  '20:00 - 22:00',
  '22:00 - 00:00',
  'I don\'t know',
];

export default function GuestInfoStep({
  onNext,
  onBack,
  onClose,
  stepIndex,
  totalSteps,
}: GuestInfoStepProps) {
  const insets = useSafeAreaInsets();
  const {
    setContactInfo,
    setPrimaryGuest,
    setSpecialRequests,
    setArrivalTime,
    specialRequests,
    arrivalTime,
  } = useHotelStore();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requests, setRequests] = useState(specialRequests);
  const [selectedArrival, setSelectedArrival] = useState(arrivalTime);
  
  const isFormValid = () => {
    return (
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      email.includes('@') &&
      phone.length >= 7
    );
  };
  
  const handleContinue = () => {
    if (!isFormValid()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setPrimaryGuest({
      id: 'guest-1',
      type: 'adult',
      firstName,
      lastName,
      dateOfBirth: new Date(1990, 0, 1),
      gender: 'other',
      nationality: 'US',
    });
    
    setContactInfo({
      email,
      phone,
      countryCode: '+1',
    });
    
    setSpecialRequests(requests);
    setArrivalTime(selectedArrival);
    
    onNext();
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
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Primary Guest */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
                <User size={24} color={colors.primary} variant="Bold" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Primary Guest</Text>
                <Text style={styles.sectionSubtitle}>As shown on ID</Text>
              </View>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor={colors.gray400}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor={colors.gray400}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </Animated.View>
          
          {/* Contact Info */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(150)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.success + '15' }]}>
                <Sms size={24} color={colors.success} variant="Bold" />
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
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.phoneInput}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+1</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.phoneNumber]}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={colors.gray400}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </Animated.View>
          
          {/* Arrival Time */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(200)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.warning + '15' }]}>
                <Clock size={24} color={colors.warning} variant="Bold" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Estimated Arrival</Text>
                <Text style={styles.sectionSubtitle}>Optional</Text>
              </View>
            </View>
            
            <View style={styles.arrivalGrid}>
              {ARRIVAL_TIMES.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.arrivalChip,
                    selectedArrival === time && styles.arrivalChipSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedArrival(time);
                  }}
                >
                  <Text
                    style={[
                      styles.arrivalChipText,
                      selectedArrival === time && styles.arrivalChipTextSelected,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
          
          {/* Special Requests */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(250)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.info + '15' }]}>
                <Note size={24} color={colors.info} variant="Bold" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Special Requests</Text>
                <Text style={styles.sectionSubtitle}>Optional - subject to availability</Text>
              </View>
            </View>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="E.g., high floor, quiet room, extra pillows..."
              placeholderTextColor={colors.gray400}
              value={requests}
              onChangeText={setRequests}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
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
          disabled={!isFormValid()}
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
  phoneInput: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
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
  phoneNumber: {
    flex: 1,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },
  
  // Arrival Time
  arrivalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  arrivalChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  arrivalChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  arrivalChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  arrivalChipTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
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
