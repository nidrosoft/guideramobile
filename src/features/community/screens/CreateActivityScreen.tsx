/**
 * CREATE ACTIVITY SCREEN
 *
 * Multi-step stepper flow for creating a Pulse meetup.
 * Steps: Type → Details → Location → When → Who → Create
 * Each step is a modular component in components/pulse/steps/
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft2, ArrowRight2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as ExpoLocation from 'expo-location';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useActivityActions } from '@/hooks/useCommunity';
import { activityService } from '@/services/community/activity.service';
import { supabase } from '@/lib/supabase/client';
import { StepType, StepDetails, StepLocation, StepWhen, StepWho } from '../components/pulse/steps';
import type { ActivityType, ActivityTiming } from '@/services/community/types/community.types';

const TOTAL_STEPS = 5;


export default function CreateActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const { showError } = useToast();
  const userId = profile?.id;
  const { createActivity, updateActivity, loading } = useActivityActions(userId);
  const params = useLocalSearchParams<{
    editId?: string; editTitle?: string; editType?: string;
    editDescription?: string; editLocationName?: string;
    editLatitude?: string; editLongitude?: string;
  }>();
  const isEditing = !!params.editId;

  // Stepper state
  const [step, setStep] = useState(isEditing ? 2 : 1);

  // Form data — prefilled when editing
  const [activityType, setActivityType] = useState<string>(params.editType || 'food_drink');
  const [title, setTitle] = useState(params.editTitle || '');
  const [description, setDescription] = useState(params.editDescription || '');
  const [locationName, setLocationName] = useState(params.editLocationName || '');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(
    params.editLatitude && params.editLongitude
      ? { latitude: parseFloat(params.editLatitude), longitude: parseFloat(params.editLongitude) }
      : null
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isFlexibleTime, setIsFlexibleTime] = useState(true);
  const [visibility, setVisibility] = useState<'everyone' | 'selected'>('everyone');
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [cityName, setCityName] = useState<string>('');
  const [countryName, setCountryName] = useState<string>('');
  const [coverImageUri, setCoverImageUri] = useState<string | undefined>(undefined);
  const [coverImageBase64, setCoverImageBase64] = useState<string | undefined>(undefined);

  // Auto-detect location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
        setLocationCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        const [geo] = await ExpoLocation.reverseGeocodeAsync(loc.coords);
        if (geo) {
          const parts = [geo.name, geo.city].filter(Boolean);
          if (parts.length > 0) setLocationName(parts.join(', '));
          if (geo.city) setCityName(geo.city);
          if (geo.country) setCountryName(geo.country);
        }
      } catch { /* non-critical */ }
    })();
  }, []);

  const STEP_LABELS = ['Type', 'Details', 'Location', 'When', 'Who'];

  const canAdvance = () => {
    switch (step) {
      case 1: return !!activityType;
      case 2: return title.trim().length > 0;
      case 3: return !!locationCoords;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step + 1);
    } else {
      handleCreate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleCreate = async () => {
    try {
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      const tmrw = new Date(now); tmrw.setDate(tmrw.getDate() + 1);
      const isTomorrow = selectedDate.toDateString() === tmrw.toDateString();
      let timing: ActivityTiming = 'specific';
      if (isToday && isFlexibleTime) timing = 'today';
      else if (isTomorrow && isFlexibleTime) timing = 'tomorrow';

      const scheduledFor = new Date(selectedDate);
      if (!isFlexibleTime) {
        scheduledFor.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      }

      // Upload cover image if selected
      let coverImageUrl: string | undefined;
      if (coverImageBase64) {
        try {
          const ext = coverImageUri?.split('.').pop()?.toLowerCase() || 'jpg';
          const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
          const path = `activity-covers/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

          const binaryString = atob(coverImageBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          if (__DEV__) console.log(`[CreateActivity] uploading ${path}: ${bytes.length} bytes`);
          const { error: uploadErr } = await supabase.storage
            .from('community')
            .upload(path, bytes, { contentType: mimeType, upsert: true });
          if (!uploadErr) {
            const { data: publicUrl } = supabase.storage.from('community').getPublicUrl(path);
            coverImageUrl = publicUrl.publicUrl;
          }
        } catch { /* non-critical — activity still creates without image */ }
      }

      if (isEditing && params.editId) {
        // Update existing activity
        await updateActivity(params.editId, {
          ...( coverImageUrl ? { coverImageUrl } : {}),
          title: title.trim(),
          description: description.trim() || undefined,
          locationName: locationName.trim(),
          city: cityName || undefined,
          country: countryName || undefined,
          latitude: locationCoords?.latitude,
          longitude: locationCoords?.longitude,
          timing,
          scheduledFor: timing === 'specific' ? scheduledFor : undefined,
          maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : undefined,
          visibility,
        });
      } else {
        await createActivity({
          type: activityType as ActivityType,
          title: title.trim(),
          description: description.trim() || undefined,
          coverImageUrl,
          city: cityName || undefined,
          country: countryName || undefined,
          location: {
            name: locationName.trim(),
            latitude: locationCoords?.latitude || 0,
            longitude: locationCoords?.longitude || 0,
          },
          timing,
          scheduledFor: timing === 'specific' ? scheduledFor : undefined,
          maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : undefined,
          visibility,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      showError(error.message || 'Failed to create activity');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepType selected={activityType} onSelect={setActivityType} />;
      case 2:
        return (
          <StepDetails
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            coverImageUri={coverImageUri}
            onCoverImageChange={(uri, b64) => { setCoverImageUri(uri); setCoverImageBase64(b64); }}
          />
        );
      case 3:
        return (
          <StepLocation
            coords={locationCoords}
            locationName={locationName}
            onLocationChange={(coords, name) => {
              setLocationCoords(coords);
              setLocationName(name);
            }}
          />
        );
      case 4:
        return (
          <StepWhen
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            isFlexibleTime={isFlexibleTime}
            onFlexibleToggle={setIsFlexibleTime}
            selectedTime={selectedTime}
            onTimeChange={setSelectedTime}
          />
        );
      case 5:
        return (
          <StepWho
            visibility={visibility}
            onVisibilityChange={setVisibility}
            maxParticipants={maxParticipants}
            onMaxParticipantsChange={setMaxParticipants}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: tc.bgElevated }]} onPress={handleBack}>
          <ArrowLeft2 size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>
          {isEditing ? 'Edit Activity' : step === TOTAL_STEPS ? 'Almost Done' : `Step ${step} of ${TOTAL_STEPS}`}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: tc.borderSubtle }]}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%`, backgroundColor: tc.primary }]} />
      </View>

      {/* Step Content */}
      <View style={styles.stepContent}>
        {renderStep()}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, backgroundColor: tc.background, borderTopColor: tc.borderSubtle }]}>
        <TouchableOpacity
          style={[
            styles.nextBtn,
            { backgroundColor: canAdvance() ? tc.primary : tc.borderSubtle },
          ]}
          onPress={handleNext}
          disabled={!canAdvance() || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.nextBtnText, { color: canAdvance() ? '#FFFFFF' : tc.textTertiary }]}>
              {step === TOTAL_STEPS ? (isEditing ? 'Update Activity' : 'Add to Map!') : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    height: 3,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  stepContent: {
    flex: 1,
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  nextBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Step 3: Location
  locationStep: {
    padding: spacing.lg,
  },
  stepHeading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  stepSubheading: {
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  locationEmoji: {
    fontSize: 28,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationCoords: {
    fontSize: 12,
    marginTop: 2,
  },
});
