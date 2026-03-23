/**
 * EDIT PROFILE SCREEN
 * 
 * Edit user profile with Travel Card preview flip.
 * Front: Edit fields (photo, name, bio, location, phone, languages, travel style, visibility toggles)
 * Back: Travel Card — public preview showing how others see your profile
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/contexts/ToastContext';
import {
  ArrowLeft2,
  Camera,
  Location,
  Verify,
  ShieldTick,
  TickCircle,
  Repeat,
  Global,
  Call,
  Calendar,
  People,
  Routing2,
  Map1,
  MessageText,
  Flag,
  Eye,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as ExpoLocation from 'expo-location';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { profileService, UpdateProfileInput } from '@/services/profile.service';
import { partnerService } from '@/services/community/partner.service';
import { ProfileVisibility } from '@/types/auth.types';

const TRAVEL_STYLES = [
  'Backpacker', 'Luxury', 'Solo', 'Family', 'Adventure',
  'Cultural', 'Digital Nomad', 'Eco', 'Foodie', 'Road Trip',
];

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'Portuguese', 'German',
  'Italian', 'Japanese', 'Korean', 'Mandarin', 'Arabic',
  'Hindi', 'Russian', 'Dutch', 'Swedish', 'Turkish',
  'Swahili', 'Thai', 'Vietnamese', 'Indonesian', 'Greek',
];

const DEFAULT_VISIBILITY: ProfileVisibility = {
  show_bio: true,
  show_location: true,
  show_phone: false,
  show_dob: false,
  show_languages: true,
  show_travel_style: true,
  show_stats: true,
  show_member_since: true,
};

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { t } = useTranslation();
  const { profile, refreshProfile, user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [locationName, setLocationName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [travelStyle, setTravelStyle] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<ProfileVisibility>(DEFAULT_VISIBILITY);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [partnerVerified, setPartnerVerified] = useState(false);
  
  // Flip animation
  const flipProgress = useSharedValue(0);
  const isFlipped = useSharedValue(false);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
      opacity: flipProgress.value > 0.5 ? 0 : 1,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      opacity: flipProgress.value > 0.5 ? 1 : 0,
    };
  });

  const handleFlip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toValue = isFlipped.value ? 0 : 1;
    flipProgress.value = withTiming(toValue, { duration: 600, easing: Easing.inOut(Easing.ease) });
    isFlipped.value = !isFlipped.value;
  }, []);
  
  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setBio(profile.bio || '');
      setLocationName(profile.location_name || (profile.city && profile.country ? `${profile.city}, ${profile.country}` : profile.city || ''));
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatar_url || null);
      setTravelStyle((profile as any).travel_style || '');
      setSelectedLanguages((profile as any).languages || []);
      setVisibility({ ...DEFAULT_VISIBILITY, ...((profile as any).visibility_settings || {}) });
      if (profile.latitude && profile.longitude) {
        setCoordinates({ lat: profile.latitude, lng: profile.longitude });
      }
    }
  }, [profile]);

  // Fetch partner status
  useEffect(() => {
    if (!profile?.id) return;
    partnerService.getApplicationStatus(profile.id).then((data) => {
      if (data && (data.status === 'approved' || data.didit_verification_status === 'approved')) {
        setPartnerVerified(true);
      }
    }).catch(() => {});
  }, [profile?.id]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleSave = async () => {
    if (!profile?.id) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Validate phone number if provided
    if (phone.trim() && !/^[\d\s\-+()]{7,20}$/.test(phone.trim())) {
      showError('Please enter a valid phone number (7-20 characters, digits and +/-/() only).');
      return;
    }

    setIsSaving(true);

    try {
      const updates: UpdateProfileInput = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim(),
        location_name: locationName.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl || undefined,
        travel_style: travelStyle || undefined,
        languages: selectedLanguages,
        visibility_settings: visibility,
      };
      
      if (coordinates) {
        updates.latitude = coordinates.lat;
        updates.longitude = coordinates.lng;
      }
      
      const { error } = await profileService.updateProfile(profile.id, updates);
      
      if (error) {
        showError('Failed to update profile. Please try again.');
        return;
      }
      
      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error saving profile:', error);
      showError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleChangePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Alert.alert('Change Photo', 'Choose an option', [
      { 
        text: 'Take Photo', 
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            showError('Camera permission is required. Please enable it in Settings.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true,
          });
          if (!result.canceled && result.assets[0]?.base64) {
            const ext = result.assets[0].uri.split('.').pop()?.toLowerCase() || 'jpg';
            await uploadPhoto(result.assets[0].base64, ext);
          }
        }
      },
      { 
        text: 'Choose from Library', 
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            showError('Photo library permission is required. Please enable it in Settings.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true,
          });
          if (!result.canceled && result.assets[0]?.base64) {
            const ext = result.assets[0].uri.split('.').pop()?.toLowerCase() || 'jpg';
            await uploadPhoto(result.assets[0].base64, ext);
          }
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  
  const uploadPhoto = async (base64Data: string, fileExt: string) => {
    if (!profile?.id) return;
    setIsSaving(true);
    try {
      const { url, error } = await profileService.uploadAvatar(profile.id, base64Data, fileExt);
      if (error || !url) {
        showError('Failed to upload photo. Please try again.');
        return;
      }
      setAvatarUrl(url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error uploading photo:', error);
      showError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDetectLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoadingLocation(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('Location permission is required. Please enable it in Settings.');
        return;
      }
      const location = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
      const [address] = await ExpoLocation.reverseGeocodeAsync({
        latitude: location.coords.latitude, longitude: location.coords.longitude,
      });
      if (address) {
        const locationString = [address.city, address.region, address.country].filter(Boolean).join(', ');
        setLocationName(locationString);
        setCoordinates({ lat: location.coords.latitude, lng: location.coords.longitude });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      showError('Could not detect your location. Please enter manually.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleVisibility = (key: keyof ProfileVisibility) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ===== SECTION HEADER =====
  const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
    <View style={[styles.sectionHeader]}>
      <Icon size={18} color={tc.primary} variant="Bold" />
      <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>{title}</Text>
    </View>
  );

  // ===== VISIBILITY TOGGLE ROW =====
  const VisibilityRow = ({ label, field }: { label: string; field: keyof ProfileVisibility }) => (
    <View style={[styles.toggleRow, { borderBottomColor: tc.borderSubtle }]}>
      <View style={styles.toggleLabelRow}>
        <Eye size={16} color={tc.textTertiary} variant="TwoTone" />
        <Text style={[styles.toggleLabel, { color: tc.textSecondary }]}>{label}</Text>
      </View>
      <Switch
        value={visibility[field]}
        onValueChange={() => toggleVisibility(field)}
        trackColor={{ false: isDark ? '#39393D' : '#E9E9EA', true: tc.primary }}
        thumbColor={'#FFFFFF'}
        accessibilityRole="switch"
        accessibilityLabel={`Show ${label}`}
      />
    </View>
  );

  // ===== TRAVEL CARD (BACK SIDE) =====
  const renderTravelCard = () => {
    const fullName = `${firstName} ${lastName}`.trim() || 'Your Name';
    const memberSince = profile?.created_at 
      ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Just joined';
    const stats = {
      trips: profile?.stats?.trips_completed || 0,
      countries: profile?.stats?.countries_visited || 0,
      reviews: profile?.stats?.reviews_written || 0,
      groups: (profile?.stats as any)?.communities_joined || 0,
    };
    const isVerified = profile?.identity_verified || profile?.is_verified || partnerVerified;

    return (
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 100 }}
      >
        <View style={[styles.travelCard, { 
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }]}>
          {/* Card Header Gradient */}
          <View style={[styles.cardHeaderBg, { backgroundColor: isDark ? '#252525' : '#F0FBF7' }]}>
            <View style={styles.cardHeaderContent}>
              <Image
                source={{ uri: avatarUrl || undefined }}
                style={styles.cardAvatar}
              />
              {isVerified && (
                <View style={styles.cardVerifiedBadge}>
                  <Verify size={18} color={tc.white} variant="Bold" />
                </View>
              )}
            </View>
            <Text style={[styles.cardName, { color: tc.textPrimary }]}>{fullName}</Text>
            
            {/* Role Badge */}
            <View style={[styles.roleBadge, { 
              backgroundColor: partnerVerified 
                ? (isDark ? 'rgba(63,195,158,0.15)' : 'rgba(63,195,158,0.10)')
                : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
            }]}>
              {partnerVerified ? (
                <ShieldTick size={14} color={tc.primary} variant="Bold" />
              ) : (
                <Global size={14} color={tc.textSecondary} variant="TwoTone" />
              )}
              <Text style={[styles.roleText, { 
                color: partnerVerified ? tc.primary : tc.textSecondary 
              }]}>
                {partnerVerified ? 'Local Guide' : 'Traveler'}
              </Text>
            </View>
          </View>

          {/* Bio */}
          {visibility.show_bio && bio ? (
            <View style={styles.cardSection}>
              <Text style={[styles.cardBio, { color: tc.textSecondary }]}>{bio}</Text>
            </View>
          ) : null}

          {/* Info Rows */}
          <View style={[styles.cardInfoBlock, { borderTopColor: tc.borderSubtle }]}>
            {visibility.show_location && locationName ? (
              <View style={styles.cardInfoRow}>
                <Location size={15} color={tc.primary} variant="Bold" />
                <Text style={[styles.cardInfoText, { color: tc.textPrimary }]}>{locationName}</Text>
              </View>
            ) : null}
            {visibility.show_phone && phone ? (
              <View style={styles.cardInfoRow}>
                <Call size={15} color={tc.primary} variant="Bold" />
                <Text style={[styles.cardInfoText, { color: tc.textPrimary }]}>{phone}</Text>
              </View>
            ) : null}
            {visibility.show_member_since && (
              <View style={styles.cardInfoRow}>
                <Calendar size={15} color={tc.primary} variant="Bold" />
                <Text style={[styles.cardInfoText, { color: tc.textPrimary }]}>Member since {memberSince}</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          {visibility.show_stats && (
            <View style={[styles.cardStatsContainer, { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              borderTopColor: tc.borderSubtle,
            }]}>
              <View style={styles.cardStatItem}>
                <Routing2 size={18} color={tc.primary} variant="Bold" />
                <Text style={[styles.cardStatValue, { color: tc.textPrimary }]}>{stats.trips}</Text>
                <Text style={[styles.cardStatLabel, { color: tc.textTertiary }]}>Trips</Text>
              </View>
              <View style={[styles.cardStatDivider, { backgroundColor: tc.borderSubtle }]} />
              <View style={styles.cardStatItem}>
                <Flag size={18} color={tc.primary} variant="Bold" />
                <Text style={[styles.cardStatValue, { color: tc.textPrimary }]}>{stats.countries}</Text>
                <Text style={[styles.cardStatLabel, { color: tc.textTertiary }]}>Countries</Text>
              </View>
              <View style={[styles.cardStatDivider, { backgroundColor: tc.borderSubtle }]} />
              <View style={styles.cardStatItem}>
                <MessageText size={18} color={tc.primary} variant="Bold" />
                <Text style={[styles.cardStatValue, { color: tc.textPrimary }]}>{stats.reviews}</Text>
                <Text style={[styles.cardStatLabel, { color: tc.textTertiary }]}>Reviews</Text>
              </View>
              <View style={[styles.cardStatDivider, { backgroundColor: tc.borderSubtle }]} />
              <View style={styles.cardStatItem}>
                <People size={18} color={tc.primary} variant="Bold" />
                <Text style={[styles.cardStatValue, { color: tc.textPrimary }]}>{stats.groups}</Text>
                <Text style={[styles.cardStatLabel, { color: tc.textTertiary }]}>Groups</Text>
              </View>
            </View>
          )}

          {/* Languages */}
          {visibility.show_languages && selectedLanguages.length > 0 && (
            <View style={[styles.cardTagSection, { borderTopColor: tc.borderSubtle }]}>
              <Text style={[styles.cardTagTitle, { color: tc.textTertiary }]}>Languages</Text>
              <View style={styles.cardTagRow}>
                {selectedLanguages.map(lang => (
                  <View key={lang} style={[styles.cardTag, { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  }]}>
                    <Text style={[styles.cardTagText, { color: tc.textSecondary }]}>{lang}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Travel Style */}
          {visibility.show_travel_style && travelStyle ? (
            <View style={[styles.cardTagSection, { borderTopColor: tc.borderSubtle }]}>
              <Text style={[styles.cardTagTitle, { color: tc.textTertiary }]}>Travel Style</Text>
              <View style={[styles.cardStylePill, { backgroundColor: tc.primary + '12' }]}>
                <Map1 size={14} color={tc.primary} variant="Bold" />
                <Text style={[styles.cardStyleText, { color: tc.primary }]}>{travelStyle}</Text>
              </View>
            </View>
          ) : null}

          {/* Verification badges */}
          {isVerified && (
            <View style={[styles.cardVerifiedSection, { borderTopColor: tc.borderSubtle }]}>
              <View style={[styles.cardVerifiedPill, { backgroundColor: 'rgba(22,163,74,0.08)' }]}>
                <TickCircle size={14} color={tc.success} variant="Bold" />
                <Text style={[styles.cardVerifiedText, { color: tc.success }]}>Identity Verified</Text>
              </View>
              {partnerVerified && (
                <View style={[styles.cardVerifiedPill, { backgroundColor: tc.primary + '12' }]}>
                  <ShieldTick size={14} color={tc.primary} variant="Bold" />
                  <Text style={[styles.cardVerifiedText, { color: tc.primary }]}>Local Guide</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <Text style={[styles.previewHint, { color: tc.textTertiary }]}>
          This is how other travelers and guides see your profile
        </Text>
      </ScrollView>
    );
  };

  // ===== EDIT FORM (FRONT SIDE) =====
  const renderEditForm = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 100 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleChangePhoto} disabled={isSaving}>
          <Image
            source={{ uri: avatarUrl || undefined }}
            style={[styles.avatar, { borderColor: tc.primary }]}
          />
          <View style={[styles.cameraButton, { backgroundColor: tc.primary }]}>
            <Camera size={16} color={tc.white} variant="Bold" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleChangePhoto} disabled={isSaving}>
          <Text style={[styles.changePhotoText, { color: tc.primary }]}>{t('account.editProfile.changePhoto')}</Text>
        </TouchableOpacity>
      </View>
      
      {/* === PERSONAL INFO === */}
      <SectionHeader title={t('account.editProfile.personalInfo')} icon={People} />
      
      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: tc.textSecondary }]}>{t('account.editProfile.firstName')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={tc.textTertiary}
            accessibilityLabel="First name"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: tc.textSecondary }]}>{t('account.editProfile.lastName')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor={tc.textTertiary}
            accessibilityLabel="Last name"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: tc.textSecondary }]}>{t('account.editProfile.bio')}</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
          value={bio}
          onChangeText={setBio}
          placeholder="Adventure seeker | Coffee lover | 12 countries..."
          placeholderTextColor={tc.textTertiary}
          accessibilityLabel="Bio"
          multiline
          maxLength={150}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: tc.textTertiary }]}>{bio.length}/150</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: tc.textSecondary }]}>{t('account.editProfile.phone')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 123-4567"
          placeholderTextColor={tc.textTertiary}
          keyboardType="phone-pad"
          accessibilityLabel="Phone number"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: tc.textSecondary }]}>{t('account.editProfile.location')}</Text>
        <View style={styles.locationInputContainer}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="San Diego, CA, United States"
            placeholderTextColor={tc.textTertiary}
          />
          <TouchableOpacity 
            style={[styles.detectLocationButton, { backgroundColor: tc.primary + '15', borderColor: tc.primary + '30' }]}
            onPress={handleDetectLocation}
            disabled={isLoadingLocation}
            accessibilityRole="button"
            accessibilityLabel="Detect my location"
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={tc.primary} />
            ) : (
              <Location size={20} color={tc.primary} variant="Bold" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* === TRAVEL STYLE === */}
      <SectionHeader title={t('account.editProfile.travelStyle')} icon={Map1} />
      <View style={styles.chipContainer}>
        {TRAVEL_STYLES.map(style => (
          <TouchableOpacity
            key={style}
            style={[
              styles.chip,
              { borderColor: tc.borderSubtle, backgroundColor: tc.bgElevated },
              travelStyle === style && { borderColor: tc.primary, backgroundColor: tc.primary + '12' },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTravelStyle(travelStyle === style ? '' : style);
            }}
          >
            <Text style={[
              styles.chipText,
              { color: tc.textSecondary },
              travelStyle === style && { color: tc.primary, fontWeight: '600' as any },
            ]}>{style}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* === LANGUAGES === */}
      <SectionHeader title={t('account.editProfile.languages')} icon={Global} />
      {selectedLanguages.length > 0 && (
        <View style={styles.selectedLangsRow}>
          {selectedLanguages.map(lang => (
            <TouchableOpacity
              key={lang}
              style={[styles.selectedLangChip, { backgroundColor: tc.primary + '12' }]}
              onPress={() => toggleLanguage(lang)}
            >
              <Text style={[styles.selectedLangText, { color: tc.primary }]}>{lang}</Text>
              <Text style={[styles.selectedLangX, { color: tc.primary }]}>×</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={[styles.addLanguageBtn, { borderColor: tc.borderSubtle, backgroundColor: tc.bgElevated }]}
        onPress={() => setShowLanguagePicker(!showLanguagePicker)}
      >
        <Text style={[styles.addLanguageBtnText, { color: tc.primary }]}>
          {showLanguagePicker ? 'Hide Languages' : '+ Add Languages'}
        </Text>
      </TouchableOpacity>
      {showLanguagePicker && (
        <View style={styles.chipContainer}>
          {LANGUAGE_OPTIONS.filter(l => !selectedLanguages.includes(l)).map(lang => (
            <TouchableOpacity
              key={lang}
              style={[styles.chip, { borderColor: tc.borderSubtle, backgroundColor: tc.bgElevated }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleLanguage(lang);
              }}
            >
              <Text style={[styles.chipText, { color: tc.textSecondary }]}>{lang}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* === VISIBILITY SETTINGS === */}
      <SectionHeader title={t('account.editProfile.visibilitySettings')} icon={Eye} />
      <View style={[styles.visibilityCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
        <Text style={[styles.visibilityHint, { color: tc.textTertiary }]}>
          Control what others can see on your Travel Card
        </Text>
        <VisibilityRow label="Bio" field="show_bio" />
        <VisibilityRow label="Location" field="show_location" />
        <VisibilityRow label="Phone Number" field="show_phone" />
        <VisibilityRow label="Date of Birth" field="show_dob" />
        <VisibilityRow label="Languages" field="show_languages" />
        <VisibilityRow label="Travel Style" field="show_travel_style" />
        <VisibilityRow label="Stats (trips, countries, etc.)" field="show_stats" />
        <VisibilityRow label="Member Since" field="show_member_since" />
      </View>
    </ScrollView>
  );
  
  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, {
        paddingTop: insets.top + 8,
        backgroundColor: isDark ? tc.bgModal : tc.white,
        borderBottomColor: tc.borderSubtle,
      }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft2 size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>{t('account.editProfile.title')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveButton} accessibilityRole="button" accessibilityLabel="Save profile">
          {isSaving ? (
            <ActivityIndicator size="small" color={tc.primary} />
          ) : (
            <Text style={[styles.saveText, { color: tc.primary }]}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Flip Toggle */}
      <View style={[styles.flipToggleContainer, { backgroundColor: isDark ? tc.bgModal : tc.white, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.flipToggle, { backgroundColor: tc.primary + '10', borderColor: tc.primary + '25' }]}
          onPress={handleFlip}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Flip to preview travel card"
        >
          <Repeat size={18} color={tc.primary} variant="Bold" />
          <Text style={[styles.flipToggleText, { color: tc.primary }]}>Flip to Preview</Text>
        </TouchableOpacity>
      </View>

      {/* Flippable Content */}
      <View style={styles.flipContainer}>
        <Animated.View style={[styles.flipSide, frontAnimatedStyle]}>
          {renderEditForm()}
        </Animated.View>
        <Animated.View style={[styles.flipSide, backAnimatedStyle]}>
          {renderTravelCard()}
        </Animated.View>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  flipToggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  flipToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  flipToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  flipContainer: {
    flex: 1,
  },
  flipSide: {
    flex: 1,
  },
  // === Avatar ===
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  // === Section Header ===
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  // === Inputs ===
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detectLocationButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  // === Chips ===
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  // === Languages ===
  selectedLangsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  selectedLangChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectedLangText: {
    fontSize: 13,
    fontWeight: '500',
  },
  selectedLangX: {
    fontSize: 16,
    fontWeight: '700',
  },
  addLanguageBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  addLanguageBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // === Visibility ===
  visibilityCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  visibilityHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  toggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 14,
  },
  // === TRAVEL CARD ===
  travelCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  cardHeaderBg: {
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
  },
  cardHeaderContent: {
    position: 'relative',
    marginBottom: 12,
  },
  cardAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cardVerifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3FC39E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cardName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cardBio: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  cardInfoBlock: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    gap: 10,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardInfoText: {
    fontSize: 14,
  },
  cardStatsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: 0.5,
  },
  cardStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  cardStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardStatLabel: {
    fontSize: 11,
  },
  cardStatDivider: {
    width: 1,
    height: '60%',
    alignSelf: 'center',
  },
  cardTagSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 0.5,
  },
  cardTagTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cardTagText: {
    fontSize: 12,
  },
  cardStylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cardStyleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardVerifiedSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 0.5,
  },
  cardVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cardVerifiedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
