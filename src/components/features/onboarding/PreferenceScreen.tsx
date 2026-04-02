import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import ProgressStepper from '@/components/common/ProgressStepper';
import { ArrowLeft2, TickCircle } from 'iconsax-react-native';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useAuth } from '@/context/AuthContext';

type OnboardingField = 
  | 'firstName' 
  | 'dateOfBirth' 
  | 'gender' 
  | 'ethnicity' 
  | 'country' 
  | 'language' 
  | 'languages'
  | 'emergencyContactPhone' 
  | 'travelStyles'
  | 'dietaryRestrictions'
  | 'accessibilityNeeds';

interface PreferenceScreenProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  placeholder?: string;
  inputType?: 'text' | 'select' | 'date' | 'multiselect';
  options?: string[];
  currentStep: number;
  totalSteps: number;
  nextRoute?: string;
  isLast?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  showBackButton?: boolean;
  fieldName?: OnboardingField;
  minSelections?: number;
  maxSelections?: number;
  /** Option that is mutually exclusive with all others (e.g. 'None') */
  exclusiveOption?: string;
}

export default function PreferenceScreen({
  icon: Icon,
  title,
  description,
  placeholder = '',
  inputType = 'text',
  options = [],
  currentStep,
  totalSteps,
  nextRoute,
  isLast = false,
  keyboardType = 'default',
  showBackButton = false,
  fieldName,
  minSelections = 1,
  maxSelections,
  exclusiveOption,
}: PreferenceScreenProps) {
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const { updateOnboardingStep } = useAuth();
  const onboardingStore = useOnboardingStore();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSelectOption = (option: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (inputType === 'multiselect') {
      setSelectedOptions(prev => {
        // Handle exclusive option logic (e.g. "None")
        if (exclusiveOption) {
          // If tapping the exclusive option
          if (option === exclusiveOption) {
            // If already selected, deselect it
            if (prev.includes(exclusiveOption)) return [];
            // Otherwise select ONLY the exclusive option
            return [exclusiveOption];
          }
          // If tapping a non-exclusive option, remove the exclusive option
          const withoutExclusive = prev.filter(o => o !== exclusiveOption);
          if (withoutExclusive.includes(option)) {
            return withoutExclusive.filter(o => o !== option);
          }
          if (maxSelections && withoutExclusive.length >= maxSelections) return withoutExclusive;
          return [...withoutExclusive, option];
        }

        // Standard multiselect logic (no exclusive option)
        if (prev.includes(option)) {
          return prev.filter(o => o !== option);
        }
        if (maxSelections && prev.length >= maxSelections) return prev;
        return [...prev, option];
      });
    } else {
      setSelectedOption(option);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const saveToStore = () => {
    if (!fieldName) return;
    
    switch (fieldName) {
      case 'firstName':
        onboardingStore.setFirstName(value);
        break;
      case 'dateOfBirth':
        onboardingStore.setDateOfBirth(date);
        break;
      case 'gender':
        onboardingStore.setGender(selectedOption);
        break;
      case 'ethnicity':
        onboardingStore.setEthnicity(selectedOption);
        break;
      case 'country':
        onboardingStore.setCountry(inputType === 'select' ? selectedOption : value);
        break;
      case 'language':
        onboardingStore.setLanguage(selectedOption);
        break;
      case 'emergencyContactPhone':
        onboardingStore.setEmergencyContactPhone(value);
        break;
      case 'languages':
        onboardingStore.setLanguages(selectedOptions);
        break;
      case 'travelStyles':
        onboardingStore.setTravelStyles(selectedOptions);
        break;
      case 'dietaryRestrictions':
        onboardingStore.setDietaryRestrictionsList(selectedOptions);
        break;
      case 'accessibilityNeeds':
        onboardingStore.setAccessibilityNeedsList(selectedOptions);
        break;
    }
  };

  const handleContinue = async () => {
    let hasValue = false;
    if (inputType === 'text') {
      hasValue = value.trim().length > 0;
    } else if (inputType === 'date') {
      hasValue = true;
    } else if (inputType === 'multiselect') {
      hasValue = selectedOptions.length >= minSelections;
    } else {
      hasValue = selectedOption.length > 0;
    }
    
    if (!hasValue) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    saveToStore();
    onboardingStore.setCurrentStep(currentStep);
    await updateOnboardingStep(currentStep);
    
    if (isLast) {
      router.push('/(onboarding)/setup' as any);
    } else if (nextRoute) {
      router.push(nextRoute as any);
    }
  };

  const isValid = inputType === 'text' 
    ? value.trim().length > 0 
    : inputType === 'date'
    ? true
    : inputType === 'multiselect'
    ? selectedOptions.length >= minSelections
    : selectedOption.length > 0;

  const selectionHint = inputType === 'multiselect' && minSelections > 1
    ? `Select at least ${minSelections} (${selectedOptions.length}/${minSelections})`
    : undefined;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        {/* Back Button - First Line */}
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft2 size={24} color={tc.textPrimary} variant="Outline" />
          </TouchableOpacity>
        )}

        {/* Stepper and Icon - Second Line */}
        <View style={styles.stepperIconRow}>
          {/* Icon on Left */}
          <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
            <Icon size={32} color={tc.textPrimary} variant="Outline" />
          </View>

          {/* Progress Stepper on Right */}
          <View style={styles.stepperContainer}>
            <ProgressStepper totalSteps={totalSteps} currentStep={currentStep - 1} />
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* Title */}
        <Text style={[styles.title, { color: tc.textPrimary }]}>{title}</Text>

        {/* Description */}
        <Text style={[styles.description, { color: tc.textSecondary }]}>{description}</Text>

        {/* Selection hint for multiselect */}
        {selectionHint && (
          <Text style={[styles.selectionHint, { color: tc.textTertiary }, isValid && { color: tc.success }]}>
            {isValid ? `${selectedOptions.length} selected ✓` : selectionHint}
          </Text>
        )}

        {/* Input, Date Picker, or Options */}
        {inputType === 'text' ? (
          <View style={[styles.inputContainer, { borderBottomColor: tc.borderMedium }]}>
            <TextInput
              style={[styles.input, { color: tc.textPrimary }]}
              placeholder={placeholder}
              placeholderTextColor={tc.textTertiary}
              value={value}
              onChangeText={setValue}
              keyboardType={keyboardType}
              autoFocus
            />
          </View>
        ) : inputType === 'date' ? (
          <View style={styles.dateContainer}>
            <TouchableOpacity 
              style={[styles.dateButton, { borderBottomColor: tc.borderMedium }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: tc.textPrimary }]}>
                {date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
        ) : inputType === 'multiselect' ? (
          <View style={styles.chipContainer}>
            {options.map((option) => {
              const isSelected = selectedOptions.includes(option);
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, { borderColor: tc.borderMedium, backgroundColor: tc.bgCard }, isSelected && { backgroundColor: tc.primary, borderColor: tc.primary }]}
                  onPress={() => handleSelectOption(option)}
                  activeOpacity={0.7}
                >
                  {isSelected && <TickCircle size={14} color={tc.white} variant="Bold" style={{ marginRight: 4 }} />}
                  <Text style={[styles.chipText, { color: tc.textPrimary }, isSelected && { color: tc.white, fontWeight: typography.fontWeight.semibold }]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.radioContainer}>
            {options.map((option, index) => (
              <View key={option}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleSelectOption(option)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.radioText, { color: tc.textPrimary }]}>{option}</Text>
                  <View style={[styles.radioCircle, { borderColor: tc.textTertiary }]}>
                    {selectedOption === option && <View style={[styles.radioSelected, { backgroundColor: tc.primary }]} />}
                  </View>
                </TouchableOpacity>
                {index < options.length - 1 && <View style={[styles.separator, { backgroundColor: tc.borderSubtle }]} />}
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Continue Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: isDark ? tc.white : tc.black },
            !isValid && { backgroundColor: tc.bgElevated, borderWidth: 1, borderColor: tc.borderMedium },
          ]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueIcon, { color: isDark ? tc.black : tc.white }, !isValid && { color: tc.textTertiary }]}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepperIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    marginBottom: spacing['2xl'],
  },
  inputContainer: {
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    padding: 0,
  },
  dateContainer: {
    marginBottom: spacing.xl,
  },
  dateButton: {
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
  },
  dateText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
  },
  radioContainer: {
    marginBottom: spacing.xl,
  },
  radioOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  radioText: {
    fontSize: typography.fontSize.lg,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  separator: {
    height: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: spacing['2xl'],
    right: spacing.xl,
  },
  continueButton: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueIcon: {
    fontSize: 28,
  },
  selectionHint: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
    fontWeight: typography.fontWeight.medium,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
});
