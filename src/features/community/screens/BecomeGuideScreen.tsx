/**
 * BECOME A GUIDE SCREEN
 * 
 * Multi-step guide application form:
 * Step 1: City & Languages
 * Step 2: Expertise & Bio
 * Step 3: Credentials & Photo
 * Step 4: Identity Verification (mock)
 * Step 5: Confirmation
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight2,
  Location,
  LanguageSquare,
  Camera,
  ShieldTick,
  TickCircle,
  DocumentUpload,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import {
  ExpertiseArea,
  EXPERTISE_OPTIONS,
  GuideApplicationInput,
} from '../types/guide.types';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'Portuguese', 'German',
  'Italian', 'Japanese', 'Korean', 'Mandarin', 'Arabic',
  'Hindi', 'Russian', 'Dutch', 'Swedish', 'Turkish',
];

const TOTAL_STEPS = 5;

export default function BecomeGuideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();

  const [step, setStep] = useState(1);

  // Form state
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<ExpertiseArea[]>([]);
  const [bio, setBio] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationDone, setVerificationDone] = useState(false);

  const toggleLanguage = (lang: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleExpertise = (area: ExpertiseArea) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedExpertise(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1: return city.trim().length > 0 && country.trim().length > 0 && selectedLanguages.length > 0;
      case 2: return selectedExpertise.length > 0 && bio.trim().length >= 20;
      case 3: return true;
      case 4: return verificationDone;
      default: return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleStartVerification = () => {
    setIsVerifying(true);
    // Simulate verification process
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3000);
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Application Submitted!',
      'You\'re now a Verified Local Guide! Travelers can find you in the Community section.',
      [{ text: 'View My Guide Profile', onPress: () => router.replace('/community/guide/guide-new') }]
    );
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            i + 1 <= step && styles.progressDotActive,
            i + 1 === step && styles.progressDotCurrent,
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Where are you based?</Text>
      <Text style={styles.stepSubtitle}>Tell travelers which city you call home</Text>

      <Text style={styles.inputLabel}>City *</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., Medellín"
        placeholderTextColor={colors.textTertiary}
        value={city}
        onChangeText={setCity}
      />

      <Text style={styles.inputLabel}>Region (optional)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., Antioquia"
        placeholderTextColor={colors.textTertiary}
        value={region}
        onChangeText={setRegion}
      />

      <Text style={styles.inputLabel}>Country *</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., Colombia"
        placeholderTextColor={colors.textTertiary}
        value={country}
        onChangeText={setCountry}
      />

      <Text style={styles.inputLabel}>Languages Spoken *</Text>
      <Text style={styles.inputHint}>Select all languages you speak</Text>
      <View style={styles.chipGrid}>
        {LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang}
            style={[styles.chip, selectedLanguages.includes(lang) && styles.chipSelected]}
            onPress={() => toggleLanguage(lang)}
          >
            <Text style={[styles.chipText, selectedLanguages.includes(lang) && styles.chipTextSelected]}>
              {lang}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What's your expertise?</Text>
      <Text style={styles.stepSubtitle}>Select areas where you can help travelers</Text>

      <View style={styles.expertiseGrid}>
        {EXPERTISE_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.expertiseCard, selectedExpertise.includes(opt.id) && styles.expertiseCardSelected]}
            onPress={() => toggleExpertise(opt.id)}
          >
            <Text style={styles.expertiseEmoji}>{opt.emoji}</Text>
            <Text style={[styles.expertiseLabel, selectedExpertise.includes(opt.id) && styles.expertiseLabelSelected]}>
              {opt.label}
            </Text>
            {selectedExpertise.includes(opt.id) && (
              <View style={styles.expertiseCheck}>
                <TickCircle size={18} color={colors.primary} variant="Bold" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.inputLabel, { marginTop: 20 }]}>Short Bio *</Text>
      <Text style={styles.inputHint}>Tell travelers who you are and how you help (min 20 chars)</Text>
      <TextInput
        style={[styles.textInput, styles.textArea]}
        placeholder="Born and raised in Medellín. I've been showing visitors the real side of the city for 5 years..."
        placeholderTextColor={colors.textTertiary}
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{bio.length}/500</Text>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Optional Credentials</Text>
      <Text style={styles.stepSubtitle}>Upload any certifications, licenses, or credentials that build trust</Text>

      <TouchableOpacity style={styles.uploadArea}>
        <DocumentUpload size={32} color={colors.primary} />
        <Text style={styles.uploadText}>Tap to upload credentials</Text>
        <Text style={styles.uploadHint}>Tourism certificates, business licenses, etc.</Text>
      </TouchableOpacity>

      <Text style={[styles.inputLabel, { marginTop: 24 }]}>Profile Photo</Text>
      <Text style={styles.inputHint}>A clear, friendly photo helps travelers trust you</Text>

      <TouchableOpacity style={styles.photoUpload}>
        <Camera size={32} color={colors.primary} />
        <Text style={styles.uploadText}>Upload Profile Photo</Text>
      </TouchableOpacity>

      <View style={styles.skipNote}>
        <Text style={styles.skipNoteText}>
          You can skip this step and add credentials later from your guide profile settings.
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Verify Your Identity</Text>
      <Text style={styles.stepSubtitle}>
        This protects both you and the travelers you'll help. We use secure identity verification.
      </Text>

      <View style={styles.verificationCard}>
        <View style={styles.verificationIcon}>
          <ShieldTick size={40} color={verificationDone ? '#22C55E' : colors.primary} variant="Bold" />
        </View>

        {!isVerifying && !verificationDone && (
          <>
            <Text style={styles.verificationTitle}>Government ID Verification</Text>
            <View style={styles.verificationSteps}>
              <Text style={styles.verificationStep}>1. Select your ID type (passport, national ID, etc.)</Text>
              <Text style={styles.verificationStep}>2. Photograph front (and back) of your ID</Text>
              <Text style={styles.verificationStep}>3. Take a live selfie for face matching</Text>
              <Text style={styles.verificationStep}>4. AI verifies document authenticity</Text>
            </View>
            <TouchableOpacity style={styles.verifyButton} onPress={handleStartVerification}>
              <Text style={styles.verifyButtonText}>Start Verification</Text>
            </TouchableOpacity>
            <Text style={styles.verificationNote}>
              This usually takes less than a minute. Your data is encrypted and secure.
            </Text>
          </>
        )}

        {isVerifying && (
          <View style={styles.verifyingState}>
            <Text style={styles.verifyingText}>Verifying your identity...</Text>
            <Text style={styles.verifyingSubtext}>This usually takes less than a minute</Text>
            <View style={styles.loadingDots}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.loadingDot, { opacity: 0.3 + (i * 0.3) }]} />
              ))}
            </View>
          </View>
        )}

        {verificationDone && (
          <View style={styles.verifiedState}>
            <Text style={styles.verifiedTitle}>Identity Verified!</Text>
            <Text style={styles.verifiedSubtext}>
              Your face matches your ID. You're ready to become a verified guide.
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <View style={styles.completionCard}>
        <LinearGradient
          colors={['#22C55E15', '#22C55E05']}
          style={styles.completionGradient}
        >
          <View style={styles.completionIcon}>
            <ShieldTick size={48} color="#22C55E" variant="Bold" />
          </View>
          <Text style={styles.completionTitle}>You're Ready!</Text>
          <Text style={styles.completionSubtitle}>
            You're about to become a Verified Local Guide in {city || 'your city'}!
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>City</Text>
              <Text style={styles.summaryValue}>{city}, {country}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Languages</Text>
              <Text style={styles.summaryValue}>{selectedLanguages.join(', ')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Expertise</Text>
              <Text style={styles.summaryValue}>
                {selectedExpertise.map(a => EXPERTISE_OPTIONS.find(o => o.id === a)?.label).join(', ')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Verification</Text>
              <Text style={[styles.summaryValue, { color: '#22C55E' }]}>✓ Identity Verified</Text>
            </View>
          </View>

          <Text style={styles.completionNote}>
            Travelers will be able to find you in the Community section. Build your reputation by helping travelers and earning vouches!
          </Text>

          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Text style={styles.completeButtonText}>Complete Registration</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Local Guide</Text>
        <Text style={styles.stepIndicator}>Step {step}/{TOTAL_STEPS}</Text>
      </View>

      {renderProgressBar()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </ScrollView>

      {/* Bottom Button */}
      {step < TOTAL_STEPS && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={[styles.nextButtonText, !canProceed() && styles.nextButtonTextDisabled]}>
              {step === 3 ? 'Skip & Continue' : 'Continue'}
            </Text>
            <ArrowRight2 size={18} color={canProceed() ? colors.white : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stepIndicator: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray200,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressDotCurrent: {
    width: 24,
    borderRadius: 4,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  chipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Expertise
  expertiseGrid: {
    gap: 10,
  },
  expertiseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  expertiseCardSelected: {
    backgroundColor: colors.primary + '08',
    borderColor: colors.primary,
  },
  expertiseEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  expertiseLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  expertiseLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  expertiseCheck: {
    marginLeft: 8,
  },

  // Upload
  uploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: 30,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 10,
  },
  uploadHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  photoUpload: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  skipNote: {
    marginTop: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
  },
  skipNoteText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },

  // Verification
  verificationCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  verificationIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  verificationSteps: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  verificationStep: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 24,
    paddingLeft: 4,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  verificationNote: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  verifyingState: {
    alignItems: 'center',
  },
  verifyingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  verifyingSubtext: {
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 16,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  verifiedState: {
    alignItems: 'center',
  },
  verifiedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 6,
  },
  verifiedSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Completion
  completionCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  completionGradient: {
    padding: 24,
    alignItems: 'center',
  },
  completionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  completionSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  completionNote: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  completeButton: {
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray100,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  nextButtonTextDisabled: {
    color: colors.textTertiary,
  },
});
