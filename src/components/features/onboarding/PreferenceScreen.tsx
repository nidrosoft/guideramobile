import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '@/styles';
import ProgressStepper from '@/components/common/ProgressStepper';
import { ArrowLeft } from 'iconsax-react-native';

interface PreferenceScreenProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  placeholder?: string;
  inputType?: 'text' | 'select' | 'date';
  options?: string[];
  currentStep: number;
  totalSteps: number;
  nextRoute?: string;
  isLast?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  showBackButton?: boolean;
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
}: PreferenceScreenProps) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSelectOption = (option: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOption(option);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleContinue = () => {
    let hasValue = false;
    if (inputType === 'text') {
      hasValue = value.trim().length > 0;
    } else if (inputType === 'date') {
      hasValue = true; // Date always has a value
    } else {
      hasValue = selectedOption.length > 0;
    }
    
    if (!hasValue) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // TODO: Save preference data
    
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
    : selectedOption.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        {/* Back Button - First Line */}
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={colors.textPrimary} variant="Outline" />
          </TouchableOpacity>
        )}

        {/* Stepper and Icon - Second Line */}
        <View style={styles.stepperIconRow}>
          {/* Icon on Left */}
          <View style={styles.iconContainer}>
            <Icon size={32} color={colors.textPrimary} variant="Outline" />
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
        <Text style={styles.title}>{title}</Text>

        {/* Description */}
        <Text style={styles.description}>{description}</Text>

        {/* Input, Date Picker, or Options */}
        {inputType === 'text' ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor={colors.textTertiary}
              value={value}
              onChangeText={setValue}
              keyboardType={keyboardType}
              autoFocus
            />
          </View>
        ) : inputType === 'date' ? (
          <View style={styles.dateContainer}>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
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
        ) : (
          <View style={styles.radioContainer}>
            {options.map((option, index) => (
              <View key={option}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleSelectOption(option)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.radioText}>{option}</Text>
                  <View style={styles.radioCircle}>
                    {selectedOption === option && <View style={styles.radioSelected} />}
                  </View>
                </TouchableOpacity>
                {index < options.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Continue Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueIcon, !isValid && styles.continueIconDisabled]}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingTop: 60,
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
    borderColor: colors.textPrimary,
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
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    marginBottom: spacing['2xl'],
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    paddingBottom: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    padding: 0,
  },
  dateContainer: {
    marginBottom: spacing.xl,
  },
  dateButton: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    paddingBottom: spacing.md,
  },
  dateText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray200,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: spacing['2xl'],
    right: spacing.xl,
  },
  continueButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  continueIcon: {
    fontSize: 28,
    color: colors.white,
  },
  continueIconDisabled: {
    color: colors.gray400,
  },
});
