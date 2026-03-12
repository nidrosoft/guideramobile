/**
 * COMPREHENSIVE TRIP CARD
 * Rich trip card showing all bookings and details at a glance
 */

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Skeleton } from '@/components/common/SkeletonLoader';
import SmartPlanBottomSheet from '../SmartPlanBottomSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { Trip, BookingType } from '../../types/trip.types';
import { TRIP_STATE_CONFIG } from '../../config/trip-states.config';
import { spacing, typography, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { plannerService } from '@/services/planner.service';
import { packingService } from '@/services/packing.service';
import { safetyService } from '@/services/safety.service';
import { languageService } from '@/services/language.service';
import { documentService } from '@/services/document.service';
import { supabase } from '@/lib/supabase/client';
import * as Haptics from 'expo-haptics';
import { 
  Calendar, 
  User, 
  Airplane, 
  Building, 
  Car, 
  Location,
  Clock,
  MagicStar,
  ArrowRight2,
  TickCircle,
} from 'iconsax-react-native';

interface ComprehensiveTripCardProps {
  trip: Trip;
  onPress: () => void;
}

export default function ComprehensiveTripCard({ trip, onPress }: ComprehensiveTripCardProps) {
  const { colors } = useTheme();
  const stateConfig = TRIP_STATE_CONFIG[trip.state];

  // Safely convert dates (handle both Date objects and strings from DB)
  const startDate = trip.startDate instanceof Date ? trip.startDate : new Date(trip.startDate || Date.now());
  const endDate = trip.endDate instanceof Date ? trip.endDate : new Date(trip.endDate || trip.startDate || Date.now());

  const duration = Math.max(1, Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ));

  // Use _db counts for real trips, fall back to bookings array for mock trips
  const flightCount = trip._db?.flightCount ?? trip.bookings.filter(b => b.type === BookingType.FLIGHT).length;
  const hotelCount = trip._db?.hotelCount ?? trip.bookings.filter(b => b.type === BookingType.HOTEL).length;
  const carCount = trip._db?.carCount ?? trip.bookings.filter(b => b.type === BookingType.CAR_RENTAL).length;
  const activityCount = trip._db?.experienceCount ?? trip.bookings.filter(b => b.type === BookingType.ACTIVITY).length;
  const travelerCount = trip._db?.travelerCount ?? (trip.travelers.length || 1);

  // Calculate days until trip
  const daysUntil = Math.ceil(
    (startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Default cover image if none provided (empty string check needed)
  // Use direct images.unsplash.com URLs — source.unsplash.com redirects don't work in RN Image
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [smartPlanSheetVisible, setSmartPlanSheetVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(trip._db?.modulesGenerated || false);

  const handleGenerate = useCallback(async () => {
    if (generated) return;
    setSmartPlanSheetVisible(false);
    setGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Fire all 6 modules in parallel — each is independent
      const [itineraryResult, packingResult, dosDontsResult, safetyResult, languageResult, documentsResult] = await Promise.allSettled([
        plannerService.generateItinerary(trip.id),
        packingService.generatePackingList(trip.id),
        safetyService.generateDosDonts(trip.id),
        safetyService.generateSafetyProfile(trip.id),
        languageService.generateLanguageKit(trip.id),
        documentService.generateDocuments(trip.id),
      ]);

      const itineraryOk = itineraryResult.status === 'fulfilled' && itineraryResult.value?.success;
      const packingOk = packingResult.status === 'fulfilled' && packingResult.value?.success;
      const dosDontsOk = dosDontsResult.status === 'fulfilled' && dosDontsResult.value?.success;
      const safetyOk = safetyResult.status === 'fulfilled' && safetyResult.value?.success;
      const languageOk = languageResult.status === 'fulfilled' && languageResult.value?.success;
      const documentsOk = documentsResult.status === 'fulfilled' && documentsResult.value?.success;

      if (itineraryOk || packingOk || dosDontsOk || safetyOk || languageOk || documentsOk) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const parts = [];
        if (itineraryOk) parts.push(`${itineraryResult.value.daysGenerated} day itinerary`);
        if (packingOk) parts.push(`${packingResult.value.itemsGenerated} packing items`);
        if (dosDontsOk) parts.push(`${dosDontsResult.value.tipsGenerated} tips`);
        if (safetyOk) parts.push(`safety score ${safetyResult.value.safetyScore}`);
        if (languageOk) parts.push(`${languageResult.value.totalPhrases} phrases`);
        if (documentsOk) parts.push(`${documentsResult.value.totalDocuments} documents`);

        // Mark trip as generated — enforce one-time generation
        await supabase.from('trips').update({
          modules_generated: true,
          modules_generated_at: new Date().toISOString(),
        }).eq('id', trip.id);
        setGenerated(true);

        showSuccess(`Trip plan ready! ${parts.join(' + ')}`);
        router.push({ pathname: '/planner/[tripId]', params: { tripId: trip.id } } as any);
      } else {
        const itErr = itineraryResult.status === 'rejected' ? itineraryResult.reason?.message : (itineraryResult as any).value?.error;
        throw new Error(itErr || 'Generation failed');
      }
    } catch (err: any) {
      console.error('Smart plan generation failed:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(err.message || 'Failed to generate trip plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [trip.id, generated, router, showSuccess, showError]);

  const coverImageUri = trip.coverImage && trip.coverImage.length > 0 && !trip.coverImage.includes('source.unsplash.com')
    ? trip.coverImage
    : `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop`;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderSubtle }]}>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.bgCard }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Cover Image with Gradient Overlay */}
        <View style={styles.imageContainer}>
        {!imageLoaded && (
          <View style={styles.imageSkeleton}>
            <Skeleton width="100%" height={200} borderRadius={0} />
          </View>
        )}
        <Image
          source={{ uri: coverImageUri }}
          style={styles.coverImage}
          resizeMode="cover"
          onLoad={() => setImageLoaded(true)}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.75)']}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.gradientOverlay}
        />
        
        {/* State Badge */}
        <View style={[styles.stateBadge, { backgroundColor: stateConfig.color }]}>
          <Text style={styles.stateText}>{stateConfig.label}</Text>
        </View>

        {/* Countdown Badge (top-left for all upcoming trips) */}
        {daysUntil > 0 && (
          <View style={[styles.countdownBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Clock size={12} color={colors.white} variant="Bold" />
            <Text style={styles.countdownText}>In {daysUntil} {daysUntil === 1 ? 'day' : 'days'}</Text>
          </View>
        )}
        
        {/* Title & Destination Overlay */}
        <View style={styles.titleOverlay}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {trip.title}
            </Text>
            {trip.budget && (
              <Text style={styles.priceOverlay}>
                ${trip.budget.amount.toLocaleString()}
              </Text>
            )}
          </View>
          <View style={styles.destinationRow}>
            <Location size={16} color={colors.white} variant="Bold" />
            <Text style={styles.destination} numberOfLines={1}>
              {trip.destination.city}, {trip.destination.country}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Content */}
      <View>
        {/* Date Range */}
        <View style={[styles.dateSection, { borderBottomColor: colors.borderSubtle }]}>
          <View style={styles.dateRow}>
            <Calendar size={18} color={colors.primary} variant="Bold" />
            <Text style={[styles.dateText, { color: colors.textPrimary }]}>
              {startDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
              {duration > 1 && (
                ` → ${endDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}`
              )}
            </Text>
          </View>
          {duration > 1 && (
            <View style={[styles.durationBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.durationText}>{duration} days</Text>
            </View>
          )}
        </View>

        {/* Flight Details (airline, class, route) */}
        {(trip._db?.airlineName || trip._db?.route) && (
          <View style={[styles.flightDetailsSection, { borderBottomColor: colors.borderSubtle }]}>
            {trip._db?.airlineName && (
              <View style={styles.flightDetailRow}>
                <Airplane size={16} color={colors.primary} variant="Bold" />
                <Text style={[styles.flightDetailText, { color: colors.textPrimary }]}>
                  {trip._db.airlineName}
                  {trip._db?.flightNumber ? ` • ${trip._db.flightNumber}` : ''}
                </Text>
                {trip._db?.cabinClass && (
                  <View style={[styles.classBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.classBadgeText, { color: colors.primary }]}>{trip._db.cabinClass}</Text>
                  </View>
                )}
              </View>
            )}
            {trip._db?.route && (
              <View style={styles.flightDetailRow}>
                <Location size={16} color={colors.textTertiary} variant="Bold" />
                <Text style={[styles.flightDetailText, { color: colors.textSecondary }]}>{trip._db.route}</Text>
              </View>
            )}
          </View>
        )}

        {/* Bookings Summary */}
          <View style={styles.bookingsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Bookings</Text>
            <View style={styles.bookingsGrid}>
              {/* Top Row: Flight, Hotel */}
              <View style={styles.bookingsRow}>
                {/* Flights */}
                  <View style={styles.bookingItem}>
                    <View style={[styles.bookingIcon, { backgroundColor: `${colors.primary}15` }]}>
                      <Airplane size={18} color={colors.primary} variant="Bold" />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>{flightCount}</Text>
                      <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>
                        {flightCount === 1 ? 'Flight' : 'Flights'}
                      </Text>
                    </View>
                  </View>

                {/* Hotels */}
                  <View style={styles.bookingItem}>
                    <View style={[styles.bookingIcon, { backgroundColor: `${colors.success}15` }]}>
                      <Building size={18} color={colors.success} variant="Bold" />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>{hotelCount}</Text>
                      <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>
                        {hotelCount === 1 ? 'Hotel' : 'Hotels'}
                      </Text>
                    </View>
                  </View>
              </View>

              {/* Bottom Row: Activities, Travelers */}
              <View style={styles.bookingsRow}>
                {/* Activities */}
                  <View style={styles.bookingItem}>
                    <View style={[styles.bookingIcon, { backgroundColor: `${colors.info}15` }]}>
                      <Location size={18} color={colors.info} variant="Bold" />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>{activityCount}</Text>
                      <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>
                        {activityCount === 1 ? 'Activity' : 'Activities'}
                      </Text>
                    </View>
                  </View>

                {/* Travelers */}
                <View style={styles.bookingItem}>
                  <View style={[styles.bookingIcon, { backgroundColor: `${colors.purple}15` }]}>
                    <User size={18} color={colors.purple} variant="Bold" />
                  </View>
                  <View style={styles.bookingInfo}>
                    <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>{travelerCount}</Text>
                    <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>
                      {travelerCount === 1 ? 'Traveler' : 'Travelers'}
                    </Text>
                  </View>
                </View>

                {/* Empty spacer for alignment */}
                <View style={styles.bookingItem} />
              </View>
            </View>
          </View>

        {/* Generate Smart Plan Button */}
        <TouchableOpacity
          style={[
            styles.smartPlanButton,
            generated
              ? { backgroundColor: colors.success + '10', borderColor: colors.success + '25' }
              : { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' },
          ]}
          activeOpacity={generated ? 1 : 0.7}
          onPress={() => !generating && !generated && setSmartPlanSheetVisible(true)}
          disabled={generating || generated}
        >
          {generating ? (
            <>
              <ActivityIndicator size="small" color={colors.primary} />
              <View style={styles.smartPlanContent}>
                <Text style={[styles.smartPlanTitle, { color: colors.primary }]}>Generating Your Plan...</Text>
                <Text style={[styles.smartPlanDesc, { color: colors.textSecondary }]}>AI is crafting your personalized itinerary</Text>
              </View>
            </>
          ) : generated ? (
            <>
              <TickCircle size={20} color={colors.success} variant="Bold" />
              <View style={styles.smartPlanContent}>
                <Text style={[styles.smartPlanTitle, { color: colors.success }]}>Smart Plan Ready</Text>
                <Text style={[styles.smartPlanDesc, { color: colors.textSecondary }]}>Your AI-powered trip plan has been generated</Text>
              </View>
            </>
          ) : (
            <>
              <MagicStar size={20} color={colors.primary} variant="Bold" />
              <View style={styles.smartPlanContent}>
                <Text style={[styles.smartPlanTitle, { color: colors.primary }]}>Generate Smart Plan</Text>
                <Text style={[styles.smartPlanDesc, { color: colors.textSecondary }]}>Day-by-day itinerary based on your profile</Text>
              </View>
              <ArrowRight2 size={18} color={colors.primary} />
            </>
          )}
        </TouchableOpacity>
      </View>
      </TouchableOpacity>

      {/* Smart Plan Bottom Sheet */}
      <SmartPlanBottomSheet
        visible={smartPlanSheetVisible}
        onClose={() => setSmartPlanSheetVisible(false)}
        onGenerate={handleGenerate}
        destinationName={trip.destination?.city}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageSkeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  stateBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stateText: {
    fontSize: typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysUntilBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  daysUntilText: {
    fontSize: typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    flex: 1,
  },
  priceOverlay: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginLeft: spacing.sm,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  destination: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  durationBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  flightDetailsSection: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    gap: 6,
  },
  flightDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flightDetailText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    flex: 1,
  },
  classBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  classBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  bookingsSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  bookingsGrid: {
    gap: spacing.lg,
  },
  bookingsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: spacing.xs,
    width: '31%',
  },
  bookingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingInfo: {
    gap: 2,
  },
  bookingCount: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  bookingLabel: {
    fontSize: typography.fontSize.xs,
  },
  countdownBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countdownText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  smartPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  smartPlanContent: {
    flex: 1,
  },
  smartPlanTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  smartPlanDesc: {
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
});
