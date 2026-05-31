/**
 * COMPREHENSIVE TRIP CARD
 * Rich trip card showing all bookings and details at a glance
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Skeleton } from '@/components/common/SkeletonLoader';
import SmartPlanBottomSheet from '../SmartPlanBottomSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { Trip, BookingType } from '../../types/trip.types';
import { TRIP_STATE_CONFIG } from '../../config/trip-states.config';
import { spacing, typography, borderRadius, colors as staticColors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { plannerService } from '@/services/planner.service';
import { smartPlanService } from '@/services/smartPlan.service';
import { supabase } from '@/lib/supabase/client';
import { fetchDestinationCoverImage } from '@/utils/destinationImage';
import {
  getTripCardCoverImage,
  shouldFetchTripCardCoverImage,
} from '../../utils/tripCardImage';
import {
  getInitialSmartPlanUiState,
  getSmartPlanProgress,
  modulesFromGenerationStatus,
  normalizeSmartPlanUiStatus,
  SMART_PLAN_MODULES,
  TOTAL_SMART_PLAN_MODULES,
  type SmartPlanModuleEntry,
  type SmartPlanModuleStatus,
  type SmartPlanUiStatus,
} from '../../utils/smartPlanProgress';
import * as Haptics from 'expo-haptics';
import {
  Calendar,
  User,
  Airplane,
  Building,
  Location,
  Clock,
  MagicStar,
  ArrowRight2,
  TickCircle,
  CloseCircle,
} from 'iconsax-react-native';

interface ComprehensiveTripCardProps {
  trip: Trip;
  onPress: () => void;
}

const MODULE_MESSAGES: Record<string, string> = {
  itinerary: 'Crafting your day-by-day itinerary…',
  dosDonts: 'Learning local customs to keep you safe…',
  documents: 'Checking your passport, visa & documents…',
  packing: 'Building a smart packing list for you…',
  safety: 'Analyzing safety guidelines for your trip…',
  language: "Preparing essential phrases you'll need…",
};

export default function ComprehensiveTripCard({ trip, onPress }: ComprehensiveTripCardProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const stateConfig = TRIP_STATE_CONFIG[trip.state];
  const [fallbackTimestamp] = useState(() => Date.now());

  // Safely convert dates (handle both Date objects and strings from DB)
  const startDate =
    trip.startDate instanceof Date ? trip.startDate : new Date(trip.startDate || fallbackTimestamp);
  const endDate =
    trip.endDate instanceof Date
      ? trip.endDate
      : new Date(trip.endDate || trip.startDate || fallbackTimestamp);

  const duration = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // A single-day trip carrying flight details is a one-way boarding pass (no return
  // segment to derive a duration from), so label it explicitly rather than blank.
  const isOneWayFlight = duration <= 1 && Boolean(trip._db?.route || trip._db?.airlineName);

  // Use _db counts for real trips, fall back to bookings array for mock trips
  const flightCount =
    trip._db?.flightCount ?? trip.bookings.filter((b) => b.type === BookingType.FLIGHT).length;
  const hotelCount =
    trip._db?.hotelCount ?? trip.bookings.filter((b) => b.type === BookingType.HOTEL).length;
  const activityCount =
    trip._db?.experienceCount ??
    trip.bookings.filter((b) => b.type === BookingType.ACTIVITY).length;
  const travelerCount = trip._db?.travelerCount ?? (trip.travelers.length || 1);

  // Calculate days until trip
  const daysUntil = Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Cover image — lazy-fetch from Google Places if missing
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fetchedCoverImage, setFetchedCoverImage] = useState<string>('');
  const [failedCoverImageUris, setFailedCoverImageUris] = useState<string[]>([]);
  const [isFetchingImage, setIsFetchingImage] = useState(false);
  const coverImageUri = getTripCardCoverImage({
    storedCoverImage: trip.coverImage,
    fetchedCoverImage,
    failedCoverImageUris,
  });

  useEffect(() => {
    const cityName = trip.destination?.city || trip.destination?.name || trip.title || '';
    if (!shouldFetchTripCardCoverImage({ cityName, activeCoverImageUri: coverImageUri })) return;
    let cancelled = false;
    setTimeout(() => {
      if (!cancelled) setIsFetchingImage(true);
    }, 0);
    fetchDestinationCoverImage(cityName, {
      countryName: trip.destination?.country,
      rejectedImageUrls: failedCoverImageUris,
    })
      .then((url) => {
        if (cancelled) return;
        setIsFetchingImage(false);
        if (url) {
          setFetchedCoverImage(url);
          // Persist to DB so we don't re-fetch next time
          supabase
            .from('trips')
            .update({ cover_image_url: url, cover_image_source: 'google_places' })
            .eq('id', trip.id)
            .then();
        }
      })
      .catch(() => {
        if (!cancelled) setIsFetchingImage(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    trip.id,
    coverImageUri,
    failedCoverImageUris,
    trip.destination?.city,
    trip.destination?.country,
    trip.destination?.name,
    trip.title,
  ]);
  useEffect(() => {
    setImageLoaded(false);
    setFailedCoverImageUris([]);
    setFetchedCoverImage('');
  }, [trip.id, trip.coverImage]);
  const [smartPlanSheetVisible, setSmartPlanSheetVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const initialSmartPlanState = getInitialSmartPlanUiState({
    modulesGenerated: trip._db?.modulesGenerated,
    generationStatus: trip._db?.generationStatus,
  });
  const [planStatus, setPlanStatus] = useState<SmartPlanUiStatus>(
    initialSmartPlanState.planStatus
  );
  const [generated, setGenerated] = useState(initialSmartPlanState.generated);

  // ── Inline generation progress ──────────────────────────
  const [modules, setModules] = useState<SmartPlanModuleEntry[]>(() =>
    initialSmartPlanState.planStatus === 'idle'
      ? []
      : modulesFromGenerationStatus(trip._db?.generationStatus)
  );
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);
  const modulesRef = useRef<SmartPlanModuleEntry[]>(modules);
  const abortRef = useRef(false);

  const { doneCount, progress } = getSmartPlanProgress(modules);
  const currentModule = modules.find((m) => m.status === 'generating');
  // The live progress UI only shows while THIS card is actively driving generation.
  const isActivelyGenerating = generating;
  // A plan persisted as in-progress but with no active client worker can be resumed in one tap.
  const isResumable = !generated && !generating && planStatus === 'generating';

  useEffect(() => {
    const nextState = getInitialSmartPlanUiState({
      modulesGenerated: trip._db?.modulesGenerated,
      generationStatus: trip._db?.generationStatus,
    });
    setPlanStatus(nextState.planStatus);
    setGenerated(nextState.generated);
    const nextModules =
      nextState.planStatus === 'idle'
        ? []
        : modulesFromGenerationStatus(trip._db?.generationStatus);
    modulesRef.current = nextModules;
    setModules(nextModules);
  }, [trip.id, trip._db?.modulesGenerated, trip._db?.generationStatus]);

  const syncModulesFromGenerationStatus = useCallback((status: Record<string, any>) => {
    const next = modulesFromGenerationStatus(status);
    const nextPlanStatus = normalizeSmartPlanUiStatus(status.smart_plan);
    modulesRef.current = next;
    setModules(next);
    setPlanStatus(nextPlanStatus);
    if (nextPlanStatus === 'ready') setGenerated(true);
    if (nextPlanStatus === 'generating' || nextPlanStatus === 'partial') setGenerated(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (generating || generated) return;
    setSmartPlanSheetVisible(false);
    setGenerating(true);
    abortRef.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const currentUserId = trip.userId;
      if (!currentUserId) {
        showError('Please sign in to generate a Smart Plan.');
        setGenerating(false);
        return;
      }

      const started = await smartPlanService.startGeneration(trip.id, currentUserId);
      const fresh = SMART_PLAN_MODULES.map((module) => ({
        ...module,
        status: 'waiting' as SmartPlanModuleStatus,
      }));
      modulesRef.current = fresh;
      setModules(fresh);
      setPlanStatus('generating');
      if (started.generationStatus) syncModulesFromGenerationStatus(started.generationStatus);

      const deadline = Date.now() + 4 * 60 * 1000;
      let latestStatus = (started.generationStatus || {}) as Record<string, any>;
      while (!abortRef.current && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await plannerService.getGenerationStatus(trip.id);
        latestStatus = status as Record<string, any>;
        syncModulesFromGenerationStatus(status as Record<string, any>);

        const smartPlanStatus = (status as Record<string, any>).smart_plan;
        if (smartPlanStatus === 'ready' || smartPlanStatus === 'failed') break;
      }

      if (abortRef.current) return;

      const finalDone = modulesRef.current.filter((m) => m.status === 'done').length;
      const finalStatus = normalizeSmartPlanUiStatus(latestStatus.smart_plan);

      if (finalStatus === 'ready') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setGenerated(true);
        setPlanStatus('ready');

        const summary = modulesRef.current
          .filter((m) => m.status === 'done' && m.detail)
          .map((m) => m.detail)
          .join(' + ');
        showSuccess(`Trip plan ready! ${summary}`);

        router.push({ pathname: '/planner/[tripId]', params: { tripId: trip.id } });
      } else if (finalStatus === 'generating') {
        setPlanStatus('generating');
        showSuccess(
          `Still building your Smart Plan in the background (${finalDone}/${TOTAL_SMART_PLAN_MODULES} ready).`
        );
      } else {
        throw new Error('All modules failed to generate');
      }
    } catch (err: any) {
      if (abortRef.current) return;
      if (__DEV__) console.warn('Smart plan generation failed:', err?.message || err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(err.message || 'Failed to generate trip plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [
    trip.id,
    trip.userId,
    trip.title,
    trip.destination,
    generated,
    generating,
    router,
    showSuccess,
    showError,
    syncModulesFromGenerationStatus,
  ]);

  const handleCancelGeneration = () => {
    abortRef.current = true;
    setCancelSheetVisible(false);
    setGenerating(false);
    setPlanStatus('idle');
    setModules([]);
    modulesRef.current = [];
  };

  return (
    <View
      style={[styles.wrapper, { backgroundColor: colors.bgCard, borderColor: colors.borderMedium }]}
    >
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.bgCard }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Cover Image with Gradient Overlay */}
        <View style={styles.imageContainer}>
          {coverImageUri ? (
            <>
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
                onError={() => {
                  setImageLoaded(false);
                  setFailedCoverImageUris((previous) =>
                    previous.includes(coverImageUri) ? previous : [...previous, coverImageUri]
                  );
                  setFetchedCoverImage('');
                  setIsFetchingImage(false);
                }}
              />
            </>
          ) : isFetchingImage ? (
            <View style={styles.imageSkeleton}>
              <Skeleton width="100%" height={200} borderRadius={0} />
            </View>
          ) : (
            <LinearGradient
              colors={['#2C3E50', '#3498DB', '#2980B9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coverImage}
            >
              <View style={styles.placeholderIcon}>
                <Location size={36} color="rgba(255,255,255,0.25)" variant="Bold" />
              </View>
            </LinearGradient>
          )}
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
              <Text style={styles.countdownText}>
                In {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
              </Text>
            </View>
          )}

          {/* Title & Destination Overlay */}
          <View style={styles.titleOverlay}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {trip.title}
              </Text>
              {trip.budget && (
                <Text style={styles.priceOverlay}>${trip.budget.amount.toLocaleString()}</Text>
              )}
            </View>
            <View style={styles.destinationRow}>
              <Location size={16} color={colors.white} variant="Bold" />
              <Text style={styles.destination} numberOfLines={1}>
                {[trip.destination.city, trip.destination.country].filter(Boolean).join(', ')}
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
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
                {duration > 1 &&
                  ` → ${endDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}`}
              </Text>
            </View>
            {duration > 1 ? (
              <View style={[styles.durationBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.durationText}>{duration} days</Text>
              </View>
            ) : isOneWayFlight ? (
              <View style={[styles.durationBadge, { backgroundColor: colors.textTertiary }]}>
                <Text style={styles.durationText}>One-way</Text>
              </View>
            ) : null}
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
                      <Text style={[styles.classBadgeText, { color: colors.primary }]}>
                        {trip._db.cabinClass}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {trip._db?.route && (
                <View style={styles.flightDetailRow}>
                  <Location size={16} color={colors.textTertiary} variant="Bold" />
                  <Text style={[styles.flightDetailText, { color: colors.textSecondary }]}>
                    {trip._db.route}
                  </Text>
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
                    <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>
                      {flightCount}
                    </Text>
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
                    <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>
                      {hotelCount}
                    </Text>
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
                    <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>
                      {activityCount}
                    </Text>
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
                    <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>
                      {travelerCount}
                    </Text>
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
              isActivelyGenerating
                ? { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }
                : generated
                  ? { backgroundColor: colors.success + '10', borderColor: colors.success + '25' }
                  : { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' },
            ]}
            activeOpacity={isActivelyGenerating ? 0.9 : generated ? 1 : 0.7}
            onPress={() => {
              if (isActivelyGenerating) {
                setCancelSheetVisible(true);
              } else if (isResumable) {
                handleGenerate();
              } else if (!generated) {
                setSmartPlanSheetVisible(true);
              }
            }}
            disabled={generated}
          >
            {isActivelyGenerating ? (
              <View style={{ flex: 1 }}>
                {/* Row: icon + text */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.smartPlanTitle, { color: colors.primary }]}>
                      Building your trip plan… ({doneCount}/{TOTAL_SMART_PLAN_MODULES})
                    </Text>
                    <Text
                      style={[styles.smartPlanDesc, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {currentModule
                        ? MODULE_MESSAGES[currentModule.key] || 'Generating…'
                        : 'Still working in the background…'}
                    </Text>
                  </View>
                </View>
                {/* Progress bar */}
                <View
                  style={[
                    styles.progressBarBg,
                    { backgroundColor: colors.primary + '15', marginTop: 10 },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      { backgroundColor: colors.primary, width: `${Math.round(progress * 100)}%` },
                    ]}
                  />
                </View>
              </View>
            ) : generated ? (
              <>
                <TickCircle size={20} color={colors.success} variant="Bold" />
                <View style={styles.smartPlanContent}>
                  <Text style={[styles.smartPlanTitle, { color: colors.success }]}>
                    Smart Plan Ready
                  </Text>
                  <Text style={[styles.smartPlanDesc, { color: colors.textSecondary }]}>
                    Your AI-powered trip plan has been generated
                  </Text>
                </View>
              </>
            ) : isResumable ? (
              <>
                <MagicStar size={20} color={colors.primary} variant="Bold" />
                <View style={styles.smartPlanContent}>
                  <Text style={[styles.smartPlanTitle, { color: colors.primary }]}>
                    Resume Smart Plan
                  </Text>
                  <Text style={[styles.smartPlanDesc, { color: colors.textSecondary }]}>
                    Tap to finish generating all 6 modules
                  </Text>
                </View>
                <ArrowRight2 size={18} color={colors.primary} />
              </>
            ) : (
              <>
                <MagicStar size={20} color={colors.primary} variant="Bold" />
                <View style={styles.smartPlanContent}>
                  <Text style={[styles.smartPlanTitle, { color: colors.primary }]}>
                    Generate Smart Plan
                  </Text>
                  <Text style={[styles.smartPlanDesc, { color: colors.textSecondary }]}>
                    Day-by-day itinerary based on your profile
                  </Text>
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

      {/* Cancel Generation Confirmation Sheet */}
      <Modal
        visible={cancelSheetVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCancelSheetVisible(false)}
      >
        <View style={cancelStyles.overlay}>
          <TouchableWithoutFeedback onPress={() => setCancelSheetVisible(false)}>
            <View style={cancelStyles.backdrop} />
          </TouchableWithoutFeedback>
          <View
            style={[
              cancelStyles.sheet,
              { backgroundColor: colors.bgPrimary, paddingBottom: insets.bottom + 12 },
            ]}
          >
            <View style={cancelStyles.handleRow}>
              <View style={[cancelStyles.handle, { backgroundColor: colors.borderSubtle }]} />
            </View>
            <View style={cancelStyles.content}>
              <View style={[cancelStyles.iconCircle, { backgroundColor: `${colors.error}15` }]}>
                <CloseCircle size={32} color={colors.error} variant="Bold" />
              </View>
              <Text style={[cancelStyles.title, { color: colors.textPrimary }]}>
                Cancel Generation?
              </Text>
              <Text style={[cancelStyles.desc, { color: colors.textSecondary }]}>
                Your trip plan is still being generated on the server ({doneCount}/
                {TOTAL_SMART_PLAN_MODULES} modules done). You can close this card and come back
                later.
              </Text>
              <TouchableOpacity
                style={[cancelStyles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={() => setCancelSheetVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={cancelStyles.confirmText}>Keep Generating</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={cancelStyles.keepBtn}
                onPress={handleCancelGeneration}
                activeOpacity={0.6}
              >
                <Text style={[cancelStyles.keepText, { color: colors.error }]}>Stop Watching</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: staticColors.borderSubtle,
    shadowColor: staticColors.black,
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
  placeholderIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowColor: staticColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stateText: {
    fontSize: typography.fontSize.xs,
    color: staticColors.white,
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
    color: staticColors.white,
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
    color: staticColors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    flex: 1,
  },
  priceOverlay: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: staticColors.white,
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
    color: staticColors.white,
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
    color: staticColors.white,
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
    color: staticColors.white,
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
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%' as any,
    borderRadius: 3,
  },
});

const cancelStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: staticColors.white,
  },
  keepBtn: {
    paddingVertical: 10,
  },
  keepText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
