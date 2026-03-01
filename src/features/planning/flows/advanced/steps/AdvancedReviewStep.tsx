/**
 * ADVANCED REVIEW STEP
 * 
 * Step 10: Review your trip plan
 * Summary of all selections before AI generation.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import {
  Location,
  Calendar,
  People,
  Wallet2,
  Heart,
  Building,
  Car,
  TickCircle,
  ArrowLeft,
  CloseCircle,
  Edit2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAdvancedPlanningStore } from '../../../stores/useAdvancedPlanningStore';
import { 
  TRIP_TYPE_OPTIONS,
  INTEREST_OPTIONS,
  ACCOMMODATION_TYPE_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
  SPENDING_STYLE_OPTIONS,
  TRIP_PACE_OPTIONS,
} from '../../../config/planning.config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.6;

// Destination images mapping
const DESTINATION_IMAGES: Record<string, string> = {
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
  'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
  'Sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
  'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
};

interface AdvancedReviewStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onComplete?: (planId: string) => void;
}

export default function AdvancedReviewStep({
  onNext,
  onBack,
  onClose,
  onComplete,
}: AdvancedReviewStepProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const {
    advancedTripData,
    saveDraft,
    confirmPlan,
    getTotalNights,
    getTotalTravelers,
    isReadyToGenerate,
  } = useAdvancedPlanningStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const scrollOffset = useSharedValue(0);
  
  // Get destination image
  const getDestinationImage = () => {
    const name = advancedTripData.destinations[0]?.location?.name || '';
    return DESTINATION_IMAGES[name] || DESTINATION_IMAGES.default;
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const getTripTypeLabel = () => {
    const type = TRIP_TYPE_OPTIONS.find(t => t.id === advancedTripData.tripType);
    return type?.label || 'Round Trip';
  };
  
  const getSpendingStyleLabel = () => {
    const style = SPENDING_STYLE_OPTIONS.find(s => s.id === advancedTripData.spendingStyle);
    return style?.label || 'Mid-Range';
  };
  
  const getPaceLabel = () => {
    const pace = TRIP_PACE_OPTIONS.find(p => p.id === advancedTripData.pace);
    return pace?.label || 'Moderate';
  };
  
  const getAccommodationLabel = () => {
    if (advancedTripData.skipAccommodation) return 'Skipped';
    const type = ACCOMMODATION_TYPE_OPTIONS.find(t => t.id === advancedTripData.accommodation.type);
    return type?.label || 'Hotel';
  };
  
  const getTransportLabel = () => {
    if (advancedTripData.skipTransportation) return 'Skipped';
    const mode = TRANSPORT_MODE_OPTIONS.find(m => m.id === advancedTripData.transportation.gettingThere);
    return mode?.label || 'Flight';
  };
  
  const getSelectedInterests = () => {
    return advancedTripData.interests.map(id => {
      const interest = INTEREST_OPTIONS.find(i => i.id === id);
      return interest?.emoji + ' ' + interest?.label;
    }).join(', ');
  };
  
  const getDestinationsList = () => {
    return advancedTripData.destinations
      .filter(d => d.location)
      .map(d => `${d.location?.name} (${d.nights} nights)`)
      .join(' → ');
  };
  
  const handleSaveDraft = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCreating(true);
    
    try {
      const plan = await saveDraft();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete?.(plan.id);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsCreating(false);
    }
  }, [saveDraft, onComplete]);
  
  const handleCreateTrip = useCallback(async () => {
    if (!isReadyToGenerate()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsCreating(true);
    
    try {
      const plan = await confirmPlan();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete?.(plan.id);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsCreating(false);
    }
  }, [confirmPlan, onComplete, isReadyToGenerate]);
  
  // Scroll handler for parallax
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });
  
  // Animated styles for hero image
  const imageAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollOffset.value,
      [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
      [-IMAGE_HEIGHT / 2, 0, IMAGE_HEIGHT * 0.25],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity: interpolate(scrollOffset.value, [0, IMAGE_HEIGHT / 2], [1, 0.5], Extrapolate.CLAMP),
    };
  });
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Hero Image with Parallax */}
      <Animated.View style={[styles.heroContainer, imageAnimatedStyle]}>
        <Image 
          source={{ uri: getDestinationImage() }} 
          style={styles.heroImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
          style={styles.heroGradient}
        />
        
        {/* Hero Overlay Content */}
        <View style={styles.heroOverlay}>
          <View style={styles.tripTypeBadge}>
            <Text style={styles.tripTypeBadgeText}>{getTripTypeLabel().toUpperCase()}</Text>
          </View>
          <Text style={styles.heroTitle}>
            {advancedTripData.destinations[0]?.location?.name || 'Your Trip'}
          </Text>
          <View style={styles.heroLocationRow}>
            <Location size={16} color={colors.white} variant="Bold" />
            <Text style={styles.heroLocation}>
              {advancedTripData.destinations[0]?.location?.country || 'Destination'}
            </Text>
          </View>
        </View>
      </Animated.View>
      
      {/* Fixed Header Buttons */}
      <View style={[styles.headerButtons, { top: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <ArrowLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
          <CloseCircle size={24} color={colors.white} variant="Bold" />
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
      >
        {/* Spacer for hero image */}
        <View style={{ height: IMAGE_HEIGHT - 40 }} />
        
        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Calendar size={18} color={colors.primary} variant="Bold" />
              <Text style={styles.statValue}>{getTotalNights()} nights</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <People size={18} color={colors.primary} variant="Bold" />
              <Text style={styles.statValue}>{getTotalTravelers()} travelers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Wallet2 size={18} color={colors.primary} variant="Bold" />
              <Text style={styles.statValue}>${advancedTripData.budget.amount}</Text>
            </View>
          </View>
          
          {/* Dates */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📅 Dates</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                {formatDate(advancedTripData.departureDate)} → {formatDate(advancedTripData.returnDate)}
              </Text>
              <Text style={styles.infoSubtext}>
                Flexibility: {advancedTripData.flexibility === 'exact' ? 'Exact dates' : `±${advancedTripData.flexibility}`}
              </Text>
            </View>
          </Animated.View>
          
          {/* Destinations */}
          <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📍 Route</Text>
            </View>
            <View style={styles.infoCard}>
              {advancedTripData.origin && (
                <Text style={styles.infoSubtext}>From: {advancedTripData.origin.name}</Text>
              )}
              <Text style={styles.infoText}>{getDestinationsList()}</Text>
            </View>
          </Animated.View>
          
          {/* Interests */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>❤️ Interests</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{getSelectedInterests()}</Text>
              <Text style={styles.infoSubtext}>
                Pace: {getPaceLabel()} • Style: {getSpendingStyleLabel()}
              </Text>
            </View>
          </Animated.View>
          
          {/* Accommodation */}
          <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏨 Accommodation</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{getAccommodationLabel()}</Text>
              {!advancedTripData.skipAccommodation && (
                <Text style={styles.infoSubtext}>
                  {advancedTripData.accommodation.starRating.join(', ')}-star • {advancedTripData.accommodation.amenities.length} amenities
                </Text>
              )}
            </View>
          </Animated.View>
          
          {/* Transportation */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✈️ Transportation</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>Getting there: {getTransportLabel()}</Text>
              <Text style={styles.infoSubtext}>
                Getting around: {advancedTripData.transportation.gettingAround}
              </Text>
            </View>
          </Animated.View>
          
          {/* Special Requirements */}
          {(advancedTripData.specialRequirements.wheelchairAccessible || 
            advancedTripData.specialRequirements.travelingWithPet ||
            advancedTripData.specialRequirements.dietaryRestrictions.length > 0) && (
            <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>⚡ Special Requirements</Text>
              </View>
              <View style={styles.infoCard}>
                {advancedTripData.specialRequirements.wheelchairAccessible && (
                  <Text style={styles.infoText}>♿ Wheelchair accessible</Text>
                )}
                {advancedTripData.specialRequirements.travelingWithPet && (
                  <Text style={styles.infoText}>🐾 Traveling with pet</Text>
                )}
                {advancedTripData.specialRequirements.dietaryRestrictions.length > 0 && (
                  <Text style={styles.infoText}>
                    🍽️ {advancedTripData.specialRequirements.dietaryRestrictions.join(', ')}
                  </Text>
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </Animated.ScrollView>
      
      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={styles.saveDraftButton}
          onPress={handleSaveDraft}
          disabled={isCreating}
          activeOpacity={0.7}
        >
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.createButton,
            !isReadyToGenerate() && styles.createButtonDisabled,
          ]}
          onPress={handleCreateTrip}
          disabled={!isReadyToGenerate() || isCreating}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isReadyToGenerate() 
              ? [colors.primary, colors.gradientEnd]
              : [colors.gray300, colors.gray400]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createGradient}
          >
            <TickCircle size={20} color={colors.white} variant="Bold" />
            <Text style={styles.createText}>
              {isCreating ? 'Creating...' : 'Create Trip'}
            </Text>
          </LinearGradient>
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
  
  // Hero Section
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: IMAGE_HEIGHT,
    zIndex: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: IMAGE_HEIGHT * 0.7,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 50,
    left: spacing.lg,
    right: spacing.lg,
  },
  tripTypeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  tripTypeBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  heroTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  heroLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  
  // Header Buttons
  headerButtons: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Scroll Content
  scrollContent: {
    paddingTop: 0,
  },
  
  // Content Card
  contentCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    minHeight: 500,
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.gray200,
  },
  
  // Section
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  infoText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    ...shadows.lg,
  },
  saveDraftButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  createButton: {
    flex: 2,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  createText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
