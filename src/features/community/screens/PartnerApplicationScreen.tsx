/**
 * PARTNER APPLICATION SCREEN
 *
 * 6-step multi-step form for joining the Guidera Partner Program.
 * Step 1: Personal Information
 * Step 2: Location & Address
 * Step 3: Partner Type & Services
 * Step 4: Profile & Media
 * Step 5: Identity Verification
 * Step 6: Review & Submit
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight2,
  Camera,
  DocumentUpload,
  ShieldTick,
  TickCircle,
  Gallery,
  Trash,
  CloseCircle,
  Home2,
  Car,
  Map1,
  Coffee,
  Briefcase,
  Brush2,
  Bag2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { partnerService } from '@/services/community/partner.service';
import { supabase } from '@/lib/supabase/client';
import {
  SERVICE_CATEGORIES,
  RESIDENCY_OPTIONS,
  EXPERIENCE_OPTIONS,
  ID_TYPE_OPTIONS,
  GENDER_OPTIONS,
  LANGUAGES,
  type PartnerServiceCategory,
  type ResidencyDuration,
  type ExperienceYears,
  type IDType,
  type Gender,
} from '../types/partner.types';

const TOTAL_STEPS = 6;

// Icon map for service categories
const SERVICE_ICON_MAP: Record<string, React.ComponentType<any>> = {
  Home2,
  Car,
  Map1,
  Coffee,
  Briefcase,
  Brush2,
  Bag2,
  ShieldTick,
};

export default function PartnerApplicationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Didit WebView state
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize application on mount
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const app = await partnerService.getOrCreateApplication(user.id);
        setApplicationId(app.id);

        // Restore verification state if already done
        if (app.didit_verification_status === 'approved') {
          setVerificationDone(true);
        }
      } catch (err) {
        console.warn('Failed to init partner application:', err);
      }
    })();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Step 1: Personal Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [nationality, setNationality] = useState('');

  // Step 2: Location & Address
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [residencyDuration, setResidencyDuration] = useState<ResidencyDuration | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Step 3: Partner Type & Services
  const [serviceCategories, setServiceCategories] = useState<PartnerServiceCategory[]>([]);
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState<ExperienceYears | null>(null);
  const [certifications, setCertifications] = useState('');
  const [websiteOrSocial, setWebsiteOrSocial] = useState('');

  // Step 4: Profile & Media
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [bannerPhotoUri, setBannerPhotoUri] = useState<string | null>(null);
  const [portfolioPhotoUris, setPortfolioPhotoUris] = useState<string[]>([]);
  const [tagline, setTagline] = useState('');

  // Step 5: Identity Verification
  const [idType, setIdType] = useState<IDType | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationDone, setVerificationDone] = useState(false);
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Step 6: Review
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Helpers
  const toggleLanguage = (lang: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleService = (cat: PartnerServiceCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setServiceCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handlePhotoUploadMock = (setter: (uri: string) => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Mock: set a placeholder image
    setter('https://i.pravatar.cc/300?img=' + Math.floor(Math.random() * 70));
  };

  const handlePortfolioAdd = () => {
    if (portfolioPhotoUris.length >= 6) {
      Alert.alert('Maximum reached', 'You can upload up to 6 portfolio photos.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newUri = 'https://picsum.photos/400/300?random=' + Date.now();
    setPortfolioPhotoUris(prev => [...prev, newUri]);
  };

  const handlePortfolioRemove = (index: number) => {
    setPortfolioPhotoUris(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return (
          firstName.trim().length > 0 &&
          lastName.trim().length > 0 &&
          phoneNumber.trim().length >= 6 &&
          email.trim().includes('@') &&
          dateOfBirth.trim().length > 0 &&
          nationality.trim().length > 0
        );
      case 2:
        return (
          streetAddress.trim().length > 0 &&
          city.trim().length > 0 &&
          stateRegion.trim().length > 0 &&
          country.trim().length > 0 &&
          postalCode.trim().length > 0 &&
          residencyDuration !== null &&
          selectedLanguages.length > 0
        );
      case 3:
        return serviceCategories.length > 0 && bio.trim().length >= 30;
      case 4:
        return true; // Optional media step
      case 5:
        return (
          verificationDone &&
          emergencyContactName.trim().length > 0 &&
          emergencyContactPhone.trim().length >= 6
        );
      case 6:
        return agreedToTerms;
      default:
        return true;
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

  const handleStartVerification = async () => {
    if (!idType) {
      Alert.alert('Select ID Type', 'Please select your ID type before verifying.');
      return;
    }
    if (!applicationId) {
      Alert.alert('Error', 'Application not initialized. Please try again.');
      return;
    }

    setIsVerifying(true);

    try {
      // Save current form data first
      await partnerService.updateApplication(applicationId, {
        first_name: firstName,
        last_name: lastName,
        phone_country_code: phoneCountryCode,
        phone_number: phoneNumber,
        email,
        date_of_birth: dateOfBirth || undefined,
        gender: gender || undefined,
        nationality,
        street_address: streetAddress,
        city,
        state_region: stateRegion,
        country,
        postal_code: postalCode,
        residency_duration: residencyDuration || undefined,
        languages: selectedLanguages,
        service_categories: serviceCategories,
        bio,
        experience_years: experienceYears || undefined,
        certifications,
        website_or_social: websiteOrSocial,
        tagline,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
      });

      // Create Didit verification session
      const session = await partnerService.createVerificationSession(
        applicationId,
        {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth || undefined,
          email: email || undefined,
          phone: phoneNumber ? `${phoneCountryCode}${phoneNumber}` : undefined,
        },
      );

      setVerificationUrl(session.verification_url);
      setWebViewVisible(true);
      setIsVerifying(false);
    } catch (err: any) {
      setIsVerifying(false);
      console.error('Verification session error:', err);
      Alert.alert(
        'Verification Error',
        err.message || 'Failed to start identity verification. Please try again.',
      );
    }
  };

  const handleWebViewClose = useCallback(() => {
    setWebViewVisible(false);
    setVerificationUrl(null);

    // Start polling for verification result
    if (!applicationId) return;

    const pollStatus = async () => {
      try {
        const result = await partnerService.checkVerificationStatus(applicationId);
        if (result.verification_status === 'approved') {
          setVerificationDone(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } else if (result.verification_status === 'declined') {
          Alert.alert(
            'Verification Declined',
            'Your identity verification was not successful. You can try again.',
          );
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.warn('Poll error:', err);
      }
    };

    // Poll immediately, then every 5 seconds for up to 2 minutes
    pollStatus();
    let pollCount = 0;
    pollIntervalRef.current = setInterval(() => {
      pollCount++;
      if (pollCount > 24) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        return;
      }
      pollStatus();
    }, 5000);
  }, [applicationId]);

  const handleSubmit = async () => {
    if (!applicationId) return;
    setIsSubmitting(true);
    try {
      // Final save of all form data
      await partnerService.updateApplication(applicationId, {
        first_name: firstName,
        last_name: lastName,
        phone_country_code: phoneCountryCode,
        phone_number: phoneNumber,
        email,
        date_of_birth: dateOfBirth || undefined,
        gender: gender || undefined,
        nationality,
        street_address: streetAddress,
        city,
        state_region: stateRegion,
        country,
        postal_code: postalCode,
        residency_duration: residencyDuration || undefined,
        languages: selectedLanguages,
        service_categories: serviceCategories,
        bio,
        experience_years: experienceYears || undefined,
        certifications,
        website_or_social: websiteOrSocial,
        profile_photo_url: profilePhotoUri || undefined,
        banner_photo_url: bannerPhotoUri || undefined,
        portfolio_photo_urls: portfolioPhotoUris.length > 0 ? portfolioPhotoUris : undefined,
        tagline,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
      });

      // Submit the application
      await partnerService.submitApplication(applicationId);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Application Submitted!',
        'Welcome to the Guidera Partner Program! We\'ll review your profile and notify you within 24-48 hours.',
        [{ text: 'Back to Community', onPress: () => router.replace('/community' as any) }]
      );
    } catch (err: any) {
      console.error('Submit error:', err);
      Alert.alert('Submission Error', err.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabel = () => {
    switch (step) {
      case 1: return 'Personal Info';
      case 2: return 'Location';
      case 3: return 'Services';
      case 4: return 'Profile';
      case 5: return 'Verification';
      case 6: return 'Review';
      default: return '';
    }
  };

  // ===============================
  // RENDER HELPERS
  // ===============================

  const renderInput = (
    label: string,
    value: string,
    setter: (v: string) => void,
    placeholder: string,
    options?: { required?: boolean; keyboardType?: any; multiline?: boolean; maxLength?: number },
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>
        {label}{options?.required !== false ? ' *' : ''}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary },
          options?.multiline && styles.textArea,
        ]}
        placeholder={placeholder}
        placeholderTextColor={tc.textTertiary}
        value={value}
        onChangeText={setter}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
        maxLength={options?.maxLength}
        textAlignVertical={options?.multiline ? 'top' : 'center'}
      />
    </View>
  );

  const renderDropdown = (
    label: string,
    options: { id: string; label: string }[],
    selected: string | null,
    onSelect: (id: any) => void,
    required = true,
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>
        {label}{required ? ' *' : ''}
      </Text>
      <View style={styles.dropdownGrid}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.dropdownChip,
              { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
              selected === opt.id && { backgroundColor: tc.primary + '15', borderColor: tc.primary },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(opt.id);
            }}
          >
            <Text
              style={[
                styles.dropdownChipText,
                { color: tc.textSecondary },
                selected === opt.id && { color: tc.primary, fontWeight: '600' },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            { backgroundColor: tc.borderSubtle },
            i + 1 <= step && { backgroundColor: tc.primary },
          ]}
        />
      ))}
    </View>
  );

  // ===============================
  // STEP RENDERS
  // ===============================

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: tc.textPrimary }]}>Personal Information</Text>
      <Text style={[styles.stepSubtitle, { color: tc.textSecondary }]}>
        We need this to verify your identity and keep travelers safe.
      </Text>

      {renderInput('First Name', firstName, setFirstName, 'e.g., Carlos')}
      {renderInput('Last Name', lastName, setLastName, 'e.g., Medina')}

      <View style={styles.phoneRow}>
        <View style={styles.phoneCodeWrap}>
          <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Code *</Text>
          <TextInput
            style={[styles.textInput, styles.phoneCodeInput, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
            placeholder="+1"
            placeholderTextColor={tc.textTertiary}
            value={phoneCountryCode}
            onChangeText={setPhoneCountryCode}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.phoneNumberWrap}>
          {renderInput('Phone Number', phoneNumber, setPhoneNumber, '555 123 4567', { keyboardType: 'phone-pad' })}
        </View>
      </View>

      {renderInput('Email Address', email, setEmail, 'carlos@email.com', { keyboardType: 'email-address' })}
      {renderInput('Date of Birth', dateOfBirth, setDateOfBirth, 'MM/DD/YYYY')}
      {renderDropdown('Gender', GENDER_OPTIONS, gender, setGender, false)}
      {renderInput('Nationality', nationality, setNationality, 'e.g., Colombian')}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: tc.textPrimary }]}>Location & Address</Text>
      <Text style={[styles.stepSubtitle, { color: tc.textSecondary }]}>
        Your physical address helps us verify your location and match you with nearby travelers.
      </Text>

      {renderInput('Street Address', streetAddress, setStreetAddress, 'e.g., Calle 10 #43A-35')}
      {renderInput('City', city, setCity, 'e.g., Medellín')}
      {renderInput('State / Region', stateRegion, setStateRegion, 'e.g., Antioquia')}
      {renderInput('Country', country, setCountry, 'e.g., Colombia')}
      {renderInput('Postal / ZIP Code', postalCode, setPostalCode, 'e.g., 050021')}
      {renderDropdown('How long have you lived here?', RESIDENCY_OPTIONS, residencyDuration, setResidencyDuration)}

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Languages Spoken *</Text>
        <Text style={[styles.inputHint, { color: tc.textTertiary }]}>Select all that apply</Text>
        <View style={styles.chipGrid}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.chip,
                { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                selectedLanguages.includes(lang) && { backgroundColor: tc.primary + '15', borderColor: tc.primary },
              ]}
              onPress={() => toggleLanguage(lang)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: tc.textSecondary },
                  selectedLanguages.includes(lang) && { color: tc.primary, fontWeight: '600' },
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: tc.textPrimary }]}>Partner Type & Services</Text>
      <Text style={[styles.stepSubtitle, { color: tc.textSecondary }]}>
        What services will you offer to travelers? Select all that apply.
      </Text>

      <View style={styles.serviceGrid}>
        {SERVICE_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.serviceCard,
              { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
              serviceCategories.includes(cat.id) && { backgroundColor: tc.primary + '08', borderColor: tc.primary },
            ]}
            onPress={() => toggleService(cat.id)}
          >
            <View style={[styles.serviceIconWrap, { backgroundColor: serviceCategories.includes(cat.id) ? tc.primary + '15' : tc.borderSubtle + '60' }]}>
              {(() => {
                const Icon = SERVICE_ICON_MAP[cat.iconName];
                return Icon ? <Icon size={20} color={serviceCategories.includes(cat.id) ? tc.primary : tc.textSecondary} variant="Bold" /> : null;
              })()}
            </View>
            <Text
              style={[
                styles.serviceLabel,
                { color: tc.textPrimary },
                serviceCategories.includes(cat.id) && { color: tc.primary, fontWeight: '600' },
              ]}
            >
              {cat.label}
            </Text>
            <Text style={[styles.serviceDesc, { color: tc.textTertiary }]} numberOfLines={2}>
              {cat.description}
            </Text>
            {serviceCategories.includes(cat.id) && (
              <View style={styles.serviceCheck}>
                <TickCircle size={18} color={tc.primary} variant="Bold" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {renderInput(
        'Describe your services',
        bio,
        setBio,
        'Tell travelers what you offer and why they should choose you (min 30 characters)...',
        { multiline: true, maxLength: 500 },
      )}
      <Text style={[styles.charCount, { color: tc.textTertiary }]}>{bio.length}/500</Text>

      {renderDropdown('Years of experience', EXPERIENCE_OPTIONS, experienceYears, setExperienceYears, false)}
      {renderInput('Certifications / Licenses', certifications, setCertifications, 'e.g., Licensed tour guide #12345', { required: false })}
      {renderInput('Website or Social Media', websiteOrSocial, setWebsiteOrSocial, 'e.g., instagram.com/yourprofile', { required: false })}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: tc.textPrimary }]}>Profile & Media</Text>
      <Text style={[styles.stepSubtitle, { color: tc.textSecondary }]}>
        A great profile helps travelers trust you. Upload photos to showcase your work.
      </Text>

      {/* Profile Photo */}
      <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Profile Photo</Text>
      <TouchableOpacity
        style={[styles.photoUpload, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
        onPress={() => handlePhotoUploadMock(setProfilePhotoUri)}
      >
        {profilePhotoUri ? (
          <Image source={{ uri: profilePhotoUri }} style={styles.uploadedPhoto} />
        ) : (
          <>
            <Camera size={32} color={tc.primary} />
            <Text style={[styles.uploadText, { color: tc.primary }]}>Upload Profile Photo</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Banner Photo */}
      <Text style={[styles.inputLabel, { color: tc.textSecondary, marginTop: spacing.lg }]}>Banner / Cover Photo</Text>
      <TouchableOpacity
        style={[styles.bannerUpload, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
        onPress={() => handlePhotoUploadMock(setBannerPhotoUri)}
      >
        {bannerPhotoUri ? (
          <Image source={{ uri: bannerPhotoUri }} style={styles.uploadedBanner} />
        ) : (
          <>
            <Gallery size={32} color={tc.primary} />
            <Text style={[styles.uploadText, { color: tc.primary }]}>Upload Cover Photo</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Portfolio Photos */}
      <Text style={[styles.inputLabel, { color: tc.textSecondary, marginTop: spacing.lg }]}>
        Portfolio Photos ({portfolioPhotoUris.length}/6)
      </Text>
      <Text style={[styles.inputHint, { color: tc.textTertiary }]}>
        Showcase your property, vehicle, past tours, or any relevant work
      </Text>
      <View style={styles.portfolioGrid}>
        {portfolioPhotoUris.map((uri, index) => (
          <View key={index} style={styles.portfolioItem}>
            <Image source={{ uri }} style={styles.portfolioImage} />
            <TouchableOpacity
              style={styles.portfolioRemove}
              onPress={() => handlePortfolioRemove(index)}
            >
              <CloseCircle size={20} color="#FFFFFF" variant="Bold" />
            </TouchableOpacity>
          </View>
        ))}
        {portfolioPhotoUris.length < 6 && (
          <TouchableOpacity
            style={[styles.portfolioAdd, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
            onPress={handlePortfolioAdd}
          >
            <Camera size={24} color={tc.primary} />
            <Text style={[styles.portfolioAddText, { color: tc.primary }]}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tagline */}
      {renderInput(
        'Tagline',
        tagline,
        setTagline,
        'e.g., Your friendly Medellín guide since 2018',
        { required: false, maxLength: 80 },
      )}

      <View style={[styles.skipNote, { backgroundColor: isDark ? tc.primary + '10' : '#FEF3C7' }]}>
        <Text style={[styles.skipNoteText, { color: isDark ? tc.textSecondary : '#92400E' }]}>
          You can skip this step and add photos later from your partner profile settings.
        </Text>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: tc.textPrimary }]}>Identity Verification</Text>
      <Text style={[styles.stepSubtitle, { color: tc.textSecondary }]}>
        This protects both you and the travelers you'll serve. We use Didit's secure identity verification.
      </Text>

      {/* ID Type Selection */}
      {renderDropdown('Select ID Type', ID_TYPE_OPTIONS, idType, setIdType)}

      {/* Verification Card */}
      <View style={[styles.verificationCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
        <View style={[styles.verificationIcon, { backgroundColor: tc.primary + '10' }]}>
          <ShieldTick size={40} color={verificationDone ? '#22C55E' : tc.primary} variant="Bold" />
        </View>

        {!isVerifying && !verificationDone && (
          <>
            <Text style={[styles.verificationTitle, { color: tc.textPrimary }]}>Government ID Verification</Text>
            <View style={styles.verificationSteps}>
              <Text style={[styles.verificationStep, { color: tc.textSecondary }]}>1. Photograph front of your ID</Text>
              <Text style={[styles.verificationStep, { color: tc.textSecondary }]}>2. Photograph back of your ID (if applicable)</Text>
              <Text style={[styles.verificationStep, { color: tc.textSecondary }]}>3. Take a live selfie for face matching</Text>
              <Text style={[styles.verificationStep, { color: tc.textSecondary }]}>4. AI verifies document authenticity</Text>
            </View>
            <TouchableOpacity
              style={[styles.verifyButton, { backgroundColor: tc.primary }]}
              onPress={handleStartVerification}
            >
              <Text style={styles.verifyButtonText}>Start Verification</Text>
            </TouchableOpacity>
            <Text style={[styles.verificationNote, { color: tc.textTertiary }]}>
              Takes less than a minute. Your data is encrypted and secure.
            </Text>
          </>
        )}

        {isVerifying && (
          <View style={styles.verifyingState}>
            <Text style={[styles.verifyingText, { color: tc.textPrimary }]}>Verifying your identity...</Text>
            <Text style={[styles.verifyingSubtext, { color: tc.textTertiary }]}>This usually takes less than a minute</Text>
            <View style={styles.loadingDots}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.loadingDot, { backgroundColor: tc.primary, opacity: 0.3 + (i * 0.3) }]} />
              ))}
            </View>
          </View>
        )}

        {verificationDone && (
          <View style={styles.verifiedState}>
            <Text style={styles.verifiedTitle}>Identity Verified! ✅</Text>
            <Text style={[styles.verifiedSubtext, { color: tc.textSecondary }]}>
              Your face matches your ID. You're ready to proceed.
            </Text>
          </View>
        )}
      </View>

      {/* Emergency Contact */}
      <Text style={[styles.sectionLabel, { color: tc.textPrimary, marginTop: spacing.xl }]}>
        Emergency Contact
      </Text>
      <Text style={[styles.inputHint, { color: tc.textTertiary }]}>
        In case of an emergency, we need a way to reach someone who knows you.
      </Text>
      {renderInput('Contact Full Name', emergencyContactName, setEmergencyContactName, 'e.g., Maria Medina')}
      {renderInput('Contact Phone Number', emergencyContactPhone, setEmergencyContactPhone, '+57 300 123 4567', { keyboardType: 'phone-pad' })}
    </View>
  );

  const renderStep6 = () => {
    const selectedServiceLabels = serviceCategories
      .map(id => SERVICE_CATEGORIES.find(c => c.id === id)?.label)
      .filter(Boolean)
      .join(', ');

    return (
      <View style={styles.stepContent}>
        <View style={styles.completionCard}>
          <LinearGradient
            colors={['#22C55E15', '#22C55E05']}
            style={styles.completionGradient}
          >
            <View style={styles.completionIcon}>
              <ShieldTick size={48} color="#22C55E" variant="Bold" />
            </View>
            <Text style={[styles.completionTitle, { color: tc.textPrimary }]}>Review Your Application</Text>
            <Text style={[styles.completionSubtitle, { color: tc.textSecondary }]}>
              Please review your details before submitting.
            </Text>

            <View style={[styles.summaryCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <SummaryRow label="Name" value={`${firstName} ${lastName}`} tc={tc} />
              <SummaryRow label="Phone" value={`${phoneCountryCode} ${phoneNumber}`} tc={tc} />
              <SummaryRow label="Email" value={email} tc={tc} />
              <SummaryRow label="DOB" value={dateOfBirth} tc={tc} />
              <SummaryRow label="Nationality" value={nationality} tc={tc} />
              <SummaryRow label="Address" value={`${streetAddress}, ${city}`} tc={tc} />
              <SummaryRow label="Country" value={`${stateRegion}, ${country} ${postalCode}`} tc={tc} />
              <SummaryRow label="Languages" value={selectedLanguages.join(', ')} tc={tc} />
              <SummaryRow label="Services" value={selectedServiceLabels} tc={tc} />
              <SummaryRow label="Experience" value={EXPERIENCE_OPTIONS.find(o => o.id === experienceYears)?.label || 'Not specified'} tc={tc} />
              <SummaryRow label="Verification" value="✓ Identity Verified" tc={tc} highlight />
              <SummaryRow label="Emergency" value={`${emergencyContactName} (${emergencyContactPhone})`} tc={tc} isLast />
            </View>

            {/* Terms */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAgreedToTerms(!agreedToTerms);
              }}
            >
              <View style={[styles.checkbox, { borderColor: tc.borderSubtle }, agreedToTerms && { backgroundColor: tc.primary, borderColor: tc.primary }]}>
                {agreedToTerms && <TickCircle size={16} color="#FFFFFF" variant="Bold" />}
              </View>
              <Text style={[styles.termsText, { color: tc.textSecondary }]}>
                I agree to the Guidera Partner Program Terms & Conditions and Privacy Policy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, (!agreedToTerms || isSubmitting) && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={!agreedToTerms || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Application</Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.reviewNote, { color: tc.textTertiary }]}>
              We'll review your profile and notify you within 24–48 hours.
            </Text>
          </LinearGradient>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: tc.bgElevated }]} onPress={handleBack}>
          <ArrowLeft size={20} color={tc.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Partner Application</Text>
          <Text style={[styles.stepLabel, { color: tc.textTertiary }]}>{stepLabel()}</Text>
        </View>
        <Text style={[styles.stepIndicator, { color: tc.textTertiary }]}>{step}/{TOTAL_STEPS}</Text>
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
        {step === 6 && renderStep6()}
      </ScrollView>

      {/* Bottom Button */}
      {step < TOTAL_STEPS && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: tc.bgElevated, borderTopColor: tc.borderSubtle }]}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: tc.primary },
              !canProceed() && { backgroundColor: tc.borderSubtle },
            ]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text
              style={[
                styles.nextButtonText,
                !canProceed() && { color: tc.textTertiary },
              ]}
            >
              {step === 4 ? 'Skip & Continue' : 'Continue'}
            </Text>
            <ArrowRight2 size={18} color={canProceed() ? '#FFFFFF' : tc.textTertiary} />
          </TouchableOpacity>
        </View>
      )}
      {/* Didit Verification WebView Modal */}
      <Modal
        visible={webViewVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleWebViewClose}
      >
        <View style={[styles.webViewContainer, { paddingTop: insets.top, backgroundColor: tc.background }]}>
          <View style={[styles.webViewHeader, { borderBottomColor: tc.borderSubtle }]}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: tc.bgElevated }]}
              onPress={handleWebViewClose}
            >
              <ArrowLeft size={20} color={tc.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.webViewTitle, { color: tc.textPrimary }]}>Identity Verification</Text>
            <View style={{ width: 40 }} />
          </View>
          {verificationUrl ? (
            <WebView
              source={{ uri: verificationUrl }}
              style={{ flex: 1 }}
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={tc.primary} />
                  <Text style={[styles.webViewLoadingText, { color: tc.textSecondary }]}>
                    Loading verification...
                  </Text>
                </View>
              )}
              onNavigationStateChange={(navState) => {
                // Detect when Didit redirects back after completion
                if (navState.url?.includes('/session/complete') || navState.url?.includes('/callback')) {
                  handleWebViewClose();
                }
              }}
            />
          ) : (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={tc.primary} />
            </View>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ===============================
// HELPER COMPONENTS
// ===============================

function SummaryRow({
  label,
  value,
  tc,
  highlight = false,
  isLast = false,
}: {
  label: string;
  value: string;
  tc: any;
  highlight?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[summaryStyles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: tc.borderSubtle }]}>
      <Text style={[summaryStyles.label, { color: tc.textTertiary }]}>{label}</Text>
      <Text
        style={[
          summaryStyles.value,
          { color: highlight ? '#22C55E' : tc.textPrimary },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 80,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
});

// ===============================
// STYLES
// ===============================

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
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },

  // Inputs
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 8,
  },

  // Phone
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneCodeWrap: {
    width: 80,
  },
  phoneCodeInput: {
    textAlign: 'center',
  },
  phoneNumberWrap: {
    flex: 1,
  },

  // Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Dropdowns
  dropdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dropdownChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dropdownChipText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Services
  serviceGrid: {
    gap: 10,
    marginBottom: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    flexWrap: 'wrap',
  },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  serviceDesc: {
    fontSize: 12,
    width: '100%',
    marginTop: 4,
    paddingLeft: 36,
  },
  serviceCheck: {
    position: 'absolute',
    top: 14,
    right: 14,
  },

  // Photo uploads
  photoUpload: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    height: 120,
    overflow: 'hidden',
  },
  bannerUpload: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    height: 140,
    overflow: 'hidden',
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  uploadedBanner: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },

  // Portfolio
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  portfolioItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  portfolioRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  portfolioAdd: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  portfolioAddText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Skip note
  skipNote: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  skipNoteText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Section label
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },

  // Verification
  verificationCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  verificationSteps: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  verificationStep: {
    fontSize: 13,
    lineHeight: 24,
    paddingLeft: 4,
  },
  verifyButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verificationNote: {
    fontSize: 12,
    textAlign: 'center',
  },
  verifyingState: {
    alignItems: 'center',
  },
  verifyingText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  verifyingSubtext: {
    fontSize: 13,
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
    textAlign: 'center',
  },

  // Completion / Review
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
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  completionSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryCard: {
    alignSelf: 'stretch',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewNote: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // WebView Modal
  webViewContainer: {
    flex: 1,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  webViewTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  webViewLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewLoadingText: {
    fontSize: 14,
    marginTop: 12,
  },
});
