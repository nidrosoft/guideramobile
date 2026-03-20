/**
 * ACCOMMODATION PREFERENCES SCREEN
 * 
 * Edit accommodation type, star rating, location priority, and amenities.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft2, TickCircle, Star1 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { 
  preferencesService, 
  TravelPreferences,
  PREFERENCE_OPTIONS,
  AccommodationType,
  LocationPriority,
  Amenity,
} from '@/services/preferences.service';

export default function AccommodationPreferencesScreen() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editing
  const [accommodationType, setAccommodationType] = useState<AccommodationType>('hotel');
  const [starRating, setStarRating] = useState(4);
  const [locationPriority, setLocationPriority] = useState<LocationPriority>('near_attractions');
  const [amenities, setAmenities] = useState<Amenity[]>(['wifi']);

  const fetchPreferences = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data } = await preferencesService.getPreferences(profile.id);
      if (data) {
        setPreferences(data);
        setAccommodationType(data.accommodationType);
        setStarRating(data.minStarRating);
        setLocationPriority(data.locationPriority);
        setAmenities(data.preferredAmenities || ['wifi']);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await preferencesService.updateAccommodationPreferences(
        profile.id,
        accommodationType,
        starRating,
        locationPriority,
        amenities
      );
      router.back();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAmenity = (amenity: Amenity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmenities(prev => {
      if (prev.includes(amenity)) {
        return prev.filter(a => a !== amenity);
      }
      return [...prev, amenity];
    });
  };

  const hasChanges = () => {
    if (!preferences) return false;
    return (
      accommodationType !== preferences.accommodationType ||
      starRating !== preferences.minStarRating ||
      locationPriority !== preferences.locationPriority ||
      JSON.stringify(amenities.sort()) !== JSON.stringify((preferences.preferredAmenities || []).sort())
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: tc.bgPrimary }]}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: tc.bgPrimary }]}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Accommodation</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, { backgroundColor: hasChanges() ? tc.primary : tc.borderSubtle }]}
          disabled={!hasChanges() || isSaving}
        >
          <Text style={[styles.saveButtonText, { color: hasChanges() ? '#FFFFFF' : tc.textTertiary }]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Accommodation Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Where do you like to stay?</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Select your preferred accommodation type</Text>
          <View style={styles.typeGrid}>
            {PREFERENCE_OPTIONS.accommodationTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  accommodationType === type.id && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAccommodationType(type.id as AccommodationType);
                }}
              >
                <Text style={styles.typeEmoji}>{type.emoji}</Text>
                <Text style={[
                  styles.typeLabel,
                  { color: tc.textPrimary },
                  accommodationType === type.id && { color: tc.primary },
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Minimum star rating</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Your quality standard for accommodations</Text>
          <View style={styles.starsContainer}>
            {[3, 4, 5].map(rating => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.starCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  starRating === rating && { backgroundColor: `${tc.warning}15`, borderColor: tc.warning },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStarRating(rating);
                }}
              >
                <View style={styles.starsRow}>
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star1 
                      key={i} 
                      size={18} 
                      color={starRating === rating ? tc.warning : tc.textTertiary} 
                      variant="Bold" 
                    />
                  ))}
                </View>
                <Text style={[
                  styles.starLabel,
                  { color: tc.textPrimary },
                  starRating === rating && { color: tc.warning },
                ]}>
                  {rating}+ Stars
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location Priority */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Location preference</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Where should your accommodation be located?</Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.locationPriorities.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  locationPriority === option.id && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLocationPriority(option.id as LocationPriority);
                }}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    { color: tc.textPrimary },
                    locationPriority === option.id && { color: tc.primary },
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>{option.description}</Text>
                </View>
                {locationPriority === option.id && (
                  <TickCircle size={20} color={tc.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Must-have amenities</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Select all that apply</Text>
          <View style={styles.amenitiesGrid}>
            {PREFERENCE_OPTIONS.amenities.map(amenity => (
              <TouchableOpacity
                key={amenity.id}
                style={[
                  styles.amenityChip,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  amenities.includes(amenity.id as Amenity) && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => toggleAmenity(amenity.id as Amenity)}
              >
                <Text style={styles.amenityIcon}>{amenity.icon}</Text>
                <Text style={[
                  styles.amenityLabel,
                  { color: tc.textPrimary },
                  amenities.includes(amenity.id as Amenity) && { color: tc.primary },
                ]}>
                  {amenity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  saveButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  saveButtonTextDisabled: {
    color: colors.gray400,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  typeCard: {
    width: '31%',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  typeCardSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  typeEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  typeLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: colors.primary,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  starCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  starCardSelected: {
    backgroundColor: colors.warning + '15',
    borderColor: colors.warning,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  starLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  starLabelSelected: {
    color: colors.warning,
  },
  optionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  optionCardSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  amenityChipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  amenityIcon: {
    fontSize: 16,
  },
  amenityLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  amenityLabelSelected: {
    color: colors.primary,
  },
});
