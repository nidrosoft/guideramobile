/**
 * REVIEW STEP
 * 
 * Step 5: Your trip is ready!
 * Preview itinerary, add bookings, save or confirm.
 * Design matches Trip Detail Screen with hero image, stats, and day tabs.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  SlideInRight,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withTiming,
} from 'react-native-reanimated';
import {
  Location,
  Calendar,
  People,
  Sun1,
  Shield,
  Bag2,
  MessageText,
  Wallet2,
  ArrowRight2,
  Add,
  Airplane,
  Building,
  Car,
  Map1,
  TickCircle,
  Clock,
  Star1,
  More,
  ArrowLeft,
  CloseCircle,
  DirectRight,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { usePlanningStore } from '../../../stores/usePlanningStore';
import { TRIP_STYLES, COMPANION_OPTIONS } from '../../../config/planning.config';
import { DayPlan, PlannedActivity } from '../../../types/planning.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.85;

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

interface ReviewStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onComplete?: (planId: string) => void;
}

export default function ReviewStep({
  onNext,
  onBack,
  onClose,
  onComplete,
}: ReviewStepProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const {
    quickTripData,
    aiContent,
    saveDraft,
    confirmPlan,
  } = usePlanningStore();
  
  const [selectedDay, setSelectedDay] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const scrollOffset = useSharedValue(0);
  const lastScrollY = useSharedValue(0);
  const headerButtonsOpacity = useSharedValue(1);
  const dayTabsRef = useRef<ScrollView>(null);
  
  // Get destination image
  const getDestinationImage = () => {
    const name = quickTripData.destination?.name || '';
    return DESTINATION_IMAGES[name] || DESTINATION_IMAGES.default;
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const formatDayDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };
  
  const getTripDays = () => {
    if (!quickTripData.startDate || !quickTripData.endDate) return 0;
    const start = new Date(quickTripData.startDate);
    const end = new Date(quickTripData.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };
  
  const getTotalActivities = () => {
    return aiContent?.itinerary.reduce((acc, day) => acc + day.activities.length, 0) || 0;
  };
  
  const getEstBudgetPerDay = () => {
    return aiContent?.budgetEstimate.perDay || 150;
  };
  
  const getCompanionLabel = () => {
    const companion = COMPANION_OPTIONS.find(c => c.id === quickTripData.companionType);
    return companion?.label || '';
  };
  
  const getStyleLabels = () => {
    return quickTripData.tripStyles.map(styleId => {
      const style = TRIP_STYLES.find(s => s.id === styleId);
      return style?.emoji + ' ' + style?.label;
    }).join(' • ');
  };
  
  const handleSelectDay = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDay(index);
  };
  
  const handleSaveDraft = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    
    try {
      const plan = await saveDraft();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete?.(plan.id);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  }, [saveDraft, onComplete]);
  
  const handleConfirmTrip = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSaving(true);
    
    try {
      const plan = await confirmPlan();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete?.(plan.id);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  }, [confirmPlan, onComplete]);
  
  const handleAddBooking = (type: 'flight' | 'hotel' | 'car' | 'experience') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Open respective booking flow
    console.log('Add booking:', type);
  };
  
  // Scroll handler for parallax effect and header button animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - lastScrollY.value;
      
      scrollOffset.value = currentY;
      
      // Hide buttons when scrolling up (reading content), show when scrolling down
      if (currentY > 100) {
        if (diff > 5) {
          // Scrolling up - hide buttons
          headerButtonsOpacity.value = withTiming(0, { duration: 200 });
        } else if (diff < -5) {
          // Scrolling down - show buttons
          headerButtonsOpacity.value = withTiming(1, { duration: 200 });
        }
      } else {
        // Always show buttons at top
        headerButtonsOpacity.value = withTiming(1, { duration: 200 });
      }
      
      lastScrollY.value = currentY;
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
  
  // Animated styles for header buttons
  const headerButtonsStyle = useAnimatedStyle(() => ({
    opacity: headerButtonsOpacity.value,
    transform: [{ translateY: interpolate(headerButtonsOpacity.value, [0, 1], [-20, 0]) }],
  }));
  
  // Get current day's activities
  const currentDay = aiContent?.itinerary[selectedDay];
  
  // Render activity icon based on type
  const renderActivityIcon = (activity: PlannedActivity) => {
    const iconProps = { size: 16, variant: 'Bold' as const };
    switch (activity.type) {
      case 'flight':
        return <Airplane {...iconProps} color="#10B981" />;
      case 'hotel':
        return <Building {...iconProps} color="#F97316" />;
      case 'transport':
      case 'car':
        return <Car {...iconProps} color="#6B7280" />;
      case 'restaurant':
        return <Location {...iconProps} color="#EF4444" />;
      case 'tour':
        return <Map1 {...iconProps} color="#8B5CF6" />;
      case 'attraction':
      case 'activity':
      default:
        return <Location {...iconProps} color="#3B82F6" />;
    }
  };
  
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
          <View style={styles.stateBadge}>
            <Text style={styles.stateBadgeText}>PLANNED</Text>
          </View>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>{quickTripData.destination?.name}</Text>
          </View>
          <View style={styles.heroLocationRow}>
            <Location size={16} color={colors.white} variant="Bold" />
            <Text style={styles.heroLocation}>
              {quickTripData.destination?.country || 'USA'}
            </Text>
          </View>
        </View>
      </Animated.View>
      
      {/* Fixed Header Buttons - Animated on scroll */}
      <Animated.View style={[styles.headerButtons, { top: insets.top + spacing.sm }, headerButtonsStyle]}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <ArrowLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
          <CloseCircle size={24} color={colors.white} variant="Bold" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Main Content */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* Spacer for hero image */}
        <View style={{ height: IMAGE_HEIGHT - 60 }} />
        
        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Date Card */}
          <View style={styles.dateCard}>
            <View style={styles.dateRow}>
              <Calendar size={20} color={colors.primary} variant="Bold" />
              <Text style={styles.dateText}>
                {formatDate(quickTripData.startDate)} → {formatDate(quickTripData.endDate)}
              </Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{getTripDays()} days</Text>
            </View>
          </View>
          
          {/* Stats Section - Like Trip Detail Screen */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.info}15` }]}>
                <Calendar size={18} color={colors.info} variant="Bold" />
              </View>
              <Text style={styles.statLabel}>Trip Plan</Text>
              <Text style={styles.statValue}>{getTripDays()} Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Star1 size={18} color={colors.primary} variant="Bold" />
              </View>
              <Text style={styles.statLabel}>Activities</Text>
              <Text style={styles.statValue}>{getTotalActivities()}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
                <Wallet2 size={18} color={colors.warning} variant="Bold" />
              </View>
              <Text style={styles.statLabel}>Est. Budget</Text>
              <Text style={styles.statValue}>${getEstBudgetPerDay()}/day</Text>
            </View>
          </View>
          
          {/* Day Tabs - Horizontal Scroll */}
          <ScrollView
            ref={dayTabsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayTabsContainer}
            contentContainerStyle={styles.dayTabsContent}
          >
            {aiContent?.itinerary.map((day, index) => (
              <TouchableOpacity
                key={day.dayNumber}
                style={[
                  styles.dayTab,
                  selectedDay === index && styles.dayTabSelected
                ]}
                onPress={() => handleSelectDay(index)}
              >
                <View style={[
                  styles.dayTabIndicator,
                  selectedDay === index && styles.dayTabIndicatorActive
                ]} />
                <Text style={[
                  styles.dayTabTitle,
                  selectedDay === index && styles.dayTabTitleActive
                ]}>
                  Day {day.dayNumber}
                </Text>
                <Text style={[
                  styles.dayTabDate,
                  selectedDay === index && styles.dayTabDateActive
                ]}>
                  {formatDayDate(day.date)}
                </Text>
                {/* Underline for selected tab */}
                {selectedDay === index && (
                  <View style={styles.dayTabUnderline} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Itinerary Section */}
          <View style={styles.itinerarySection}>
            <Text style={styles.itineraryTitle}>Itinerary</Text>
            
            {/* Activities Timeline */}
            <View style={styles.timeline}>
              {currentDay?.activities.map((activity, index) => (
                <View key={activity.id} style={styles.activityRow}>
                  {/* Timeline Column */}
                  <View style={styles.timelineColumn}>
                    <View style={[styles.timelineDot, { backgroundColor: `${colors.primary}15` }]}>
                      {renderActivityIcon(activity)}
                    </View>
                    {index < (currentDay?.activities.length || 0) - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>
                  
                  {/* Activity Card */}
                  <View style={styles.activityCard}>
                    <View style={styles.activityHeader}>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityTitle}>{activity.name}</Text>
                        <Text style={styles.activityLocation}>{activity.location.name}</Text>
                        <Text style={styles.activityTime}>{activity.startTime}</Text>
                      </View>
                      {activity.type === 'flight' && (
                        <Text style={styles.activityCode}>
                          {activity.location.address?.substring(0, 3).toUpperCase() || 'FLT'}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
          
          {/* Add Bookings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Enhance Your Trip</Text>
            <Text style={styles.sectionSubtitle}>Add bookings to complete your plan</Text>
            
            <View style={styles.bookingsGrid}>
              <TouchableOpacity 
                style={styles.bookingCard}
                onPress={() => handleAddBooking('flight')}
                activeOpacity={0.7}
              >
                <View style={[styles.bookingIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Airplane size={24} color={colors.primary} variant="Bold" />
                </View>
                <Text style={styles.bookingLabel}>Flight</Text>
                <Add size={16} color={colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.bookingCard}
                onPress={() => handleAddBooking('hotel')}
                activeOpacity={0.7}
              >
                <View style={[styles.bookingIcon, { backgroundColor: colors.info + '15' }]}>
                  <Building size={24} color={colors.info} variant="Bold" />
                </View>
                <Text style={styles.bookingLabel}>Hotel</Text>
                <Add size={16} color={colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.bookingCard}
                onPress={() => handleAddBooking('car')}
                activeOpacity={0.7}
              >
                <View style={[styles.bookingIcon, { backgroundColor: colors.warning + '15' }]}>
                  <Car size={24} color={colors.warning} variant="Bold" />
                </View>
                <Text style={styles.bookingLabel}>Car</Text>
                <Add size={16} color={colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.bookingCard}
                onPress={() => handleAddBooking('experience')}
                activeOpacity={0.7}
              >
                <View style={[styles.bookingIcon, { backgroundColor: colors.success + '15' }]}>
                  <Map1 size={24} color={colors.success} variant="Bold" />
                </View>
                <Text style={styles.bookingLabel}>Experience</Text>
                <Add size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* AI Insights */}
          <View style={[styles.section, { marginBottom: 120 }]}>
            <Text style={styles.sectionTitle}>🤖 AI Insights</Text>
            
            <View style={styles.insightsGrid}>
              <TouchableOpacity style={styles.insightCard} activeOpacity={0.7}>
                <View style={[styles.insightIcon, { backgroundColor: colors.error + '15' }]}>
                  <Shield size={24} color={colors.error} />
                </View>
                <Text style={styles.insightLabel}>Safety Tips</Text>
                <Text style={styles.insightCount}>{aiContent?.safetyTips.length || 0}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.insightCard} activeOpacity={0.7}>
                <View style={[styles.insightIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Bag2 size={24} color={colors.primary} />
                </View>
                <Text style={styles.insightLabel}>Packing List</Text>
                <Text style={styles.insightCount}>{aiContent?.packingList.length || 0}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.insightCard} activeOpacity={0.7}>
                <View style={[styles.insightIcon, { backgroundColor: colors.success + '15' }]}>
                  <MessageText size={24} color={colors.success} />
                </View>
                <Text style={styles.insightLabel}>Local Phrases</Text>
                <Text style={styles.insightCount}>{aiContent?.localPhrases.length || 0}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.insightCard} activeOpacity={0.7}>
                <View style={[styles.insightIcon, { backgroundColor: colors.warning + '15' }]}>
                  <Sun1 size={24} color={colors.warning} />
                </View>
                <Text style={styles.insightLabel}>Weather</Text>
                <Text style={styles.insightCount}>{getTripDays()} days</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
      
      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={styles.saveDraftButton}
          onPress={handleSaveDraft}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmTrip}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.confirmGradient}
          >
            <TickCircle size={20} color={colors.white} variant="Bold" />
            <Text style={styles.confirmText}>Confirm Trip</Text>
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
    bottom: 70,
    left: spacing.lg,
    right: spacing.lg,
  },
  stateBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  stateBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  heroTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
  
  // Content Card - Use background color for elevation
  contentCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    minHeight: SCREEN_HEIGHT,
  },
  
  // Date Card - White card on background (matching TripDetailScreen)
  dateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg, // More rounded like TripDetailScreen
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  durationBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  durationText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  
  // Stats Section (matching TripDetailScreen)
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg, // More rounded like TripDetailScreen
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray200,
  },
  
  // Day Tabs
  dayTabsContainer: {
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.lg,
  },
  dayTabsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dayTab: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 70,
    borderRadius: borderRadius.md, // Less rounded - consistent with other components
  },
  dayTabSelected: {
    backgroundColor: colors.primary + '10',
  },
  dayTabIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray300,
    marginBottom: spacing.xs,
  },
  dayTabIndicatorActive: {
    backgroundColor: colors.primary,
  },
  dayTabTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  dayTabTitleActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  dayTabDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  dayTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: spacing.sm,
    right: spacing.sm,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  dayTabDateActive: {
    color: colors.primary,
  },
  
  // Itinerary Section
  itinerarySection: {
    marginBottom: spacing.xl,
  },
  itineraryTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  
  // Timeline
  timeline: {
    paddingLeft: spacing.xs,
  },
  activityRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timelineColumn: {
    width: 40,
    alignItems: 'center',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.xs,
  },
  
  // Activity Card
  activityCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginLeft: spacing.sm,
    ...shadows.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  activityLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  activityCode: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  
  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  
  // Bookings Grid
  bookingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bookingCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  
  // Insights Grid
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  insightCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  insightCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Footer - Fixed at bottom with proper padding
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
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
  confirmButton: {
    flex: 2,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  confirmText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
