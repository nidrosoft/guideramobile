/**
 * COMPREHENSIVE TRIP CARD
 * Rich trip card showing all bookings and details at a glance
 */

import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Modal, TouchableWithoutFeedback } from 'react-native';
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
  CalendarEdit,
  InfoCircle,
  Bag2,
  SecuritySafe,
  LanguageSquare,
  DocumentText,
  CloseCircle,
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

  // ── Inline generation progress ──────────────────────────
  type ModuleStatus = 'waiting' | 'generating' | 'done' | 'failed';
  interface ModuleEntry { key: string; status: ModuleStatus; detail?: string }

  const TOTAL_MODULES = 6;
  const MODULE_MESSAGES: Record<string, string> = {
    itinerary: 'Crafting your day-by-day itinerary…',
    dosDonts:  'Learning local customs to keep you safe…',
    documents: 'Checking your passport, visa & documents…',
    packing:   'Building a smart packing list for you…',
    safety:    'Analyzing safety guidelines for your trip…',
    language:  'Preparing essential phrases you\'ll need…',
  };

  const [modules, setModules] = useState<ModuleEntry[]>([]);
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);
  const modulesRef = useRef<ModuleEntry[]>([]);
  const abortRef = useRef(false);

  const updateModule = (key: string, status: ModuleStatus, detail?: string) => {
    modulesRef.current = modulesRef.current.map(m =>
      m.key === key ? { ...m, status, detail } : m
    );
    setModules([...modulesRef.current]);
  };

  const doneCount = modules.filter(m => m.status === 'done').length;
  const currentModule = modules.find(m => m.status === 'generating');
  const progress = TOTAL_MODULES > 0 ? (doneCount + modules.filter(m => m.status === 'failed').length) / TOTAL_MODULES : 0;

  const runModule = async (
    key: string,
    fn: () => Promise<any>,
  ): Promise<{ success: boolean; value?: any }> => {
    updateModule(key, 'generating');
    try {
      const result = await fn();
      if (result?.success) {
        const detail = getModuleDetail(key, result);
        updateModule(key, 'done', detail);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return { success: true, value: result };
      }
      updateModule(key, 'failed');
      return { success: false };
    } catch (err) {
      console.warn(`[SmartPlan] ${key} failed:`, err);
      updateModule(key, 'failed');
      return { success: false };
    }
  };

  const getModuleDetail = (key: string, result: any): string => {
    switch (key) {
      case 'itinerary': return `${result.daysGenerated || 0} day plan`;
      case 'packing':   return `${result.itemsGenerated || 0} items`;
      case 'dosDonts':  return `${result.tipsGenerated || 0} tips`;
      case 'safety':    return `Score ${result.safetyScore || 0}`;
      case 'language':  return `${result.totalPhrases || 0} phrases`;
      case 'documents': return `${result.totalDocuments || 0} docs`;
      default: return 'Done';
    }
  };

  const handleGenerate = useCallback(async () => {
    if (generating || generated) return;
    setSmartPlanSheetVisible(false);
    setGenerating(true);
    abortRef.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Reset progress
    const fresh: ModuleEntry[] = [
      { key: 'itinerary', status: 'waiting' },
      { key: 'dosDonts',  status: 'waiting' },
      { key: 'documents', status: 'waiting' },
      { key: 'packing',   status: 'waiting' },
      { key: 'safety',    status: 'waiting' },
      { key: 'language',  status: 'waiting' },
    ];
    modulesRef.current = fresh;
    setModules(fresh);

    try {
      // Rate limit: max 10 generations per month PER USER
      // trip.userId is the Clerk-synced profile.id that matches trips.user_id in DB
      const currentUserId = trip.userId;
      if (!currentUserId) {
        showError('Please sign in to generate a Smart Plan.');
        setGenerating(false);
        return;
      }

      const { count } = await supabase
        .from('trips')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('modules_generated', true)
        .gte('modules_generated_at', new Date(Date.now() - 30 * 86400000).toISOString());

      if ((count ?? 0) >= 10) {
        showError('You\'ve reached the limit of 10 Smart Plans per month. Please try again next month.');
        setGenerating(false);
        return;
      }

      if (abortRef.current) return;

      // Wave 1: lighter/faster modules (concurrent, status updates as each resolves)
      await Promise.all([
        runModule('itinerary', () => plannerService.generateItinerary(trip.id)),
        runModule('dosDonts',  () => safetyService.generateDosDonts(trip.id)),
        runModule('documents', () => documentService.generateDocuments(trip.id)),
      ]);

      if (abortRef.current) return;

      // Small delay to let AI API rate limits breathe
      await new Promise(r => setTimeout(r, 1500));

      if (abortRef.current) return;

      // Wave 2: heavier modules
      await Promise.all([
        runModule('packing',  () => packingService.generatePackingList(trip.id)),
        runModule('safety',   () => safetyService.generateSafetyProfile(trip.id)),
        runModule('language',  () => languageService.generateLanguageKit(trip.id)),
      ]);

      if (abortRef.current) return;

      // Retry failed modules up to 3 times with exponential backoff
      const retryFns: Record<string, () => Promise<any>> = {
        itinerary: () => plannerService.generateItinerary(trip.id),
        dosDonts:  () => safetyService.generateDosDonts(trip.id),
        documents: () => documentService.generateDocuments(trip.id),
        packing:   () => packingService.generatePackingList(trip.id),
        safety:    () => safetyService.generateSafetyProfile(trip.id),
        language:  () => languageService.generateLanguageKit(trip.id),
      };

      for (let attempt = 1; attempt <= 3; attempt++) {
        const failedKeys = modulesRef.current
          .filter(m => m.status === 'failed')
          .map(m => m.key);

        if (failedKeys.length === 0 || abortRef.current) break;

        const backoffMs = attempt * 3000; // 3s, 6s, 9s
        console.log(`[SmartPlan] Retry attempt ${attempt}/3 for ${failedKeys.length} modules (backoff ${backoffMs}ms): ${failedKeys.join(', ')}`);
        await new Promise(r => setTimeout(r, backoffMs));

        for (const key of failedKeys) {
          if (abortRef.current) break;
          if (retryFns[key]) await runModule(key, retryFns[key]);
        }
      }

      if (abortRef.current) return;

      const finalDone = modulesRef.current.filter(m => m.status === 'done').length;

      if (finalDone > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Mark trip as generated
        await supabase.from('trips').update({
          modules_generated: true,
          modules_generated_at: new Date().toISOString(),
        }).eq('id', trip.id);
        setGenerated(true);

        const summary = modulesRef.current
          .filter(m => m.status === 'done' && m.detail)
          .map(m => m.detail)
          .join(' + ');
        showSuccess(`Trip plan ready! ${summary}`);
        router.push({ pathname: '/planner/[tripId]', params: { tripId: trip.id } } as any);
      } else {
        throw new Error('All modules failed to generate');
      }
    } catch (err: any) {
      if (abortRef.current) return;
      console.error('Smart plan generation failed:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(err.message || 'Failed to generate trip plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [trip.id, generated, generating, router, showSuccess, showError]);

  const handleCancelGeneration = () => {
    abortRef.current = true;
    setCancelSheetVisible(false);
    setGenerating(false);
    setModules([]);
    modulesRef.current = [];
  };

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
            generating
              ? { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }
              : generated
              ? { backgroundColor: colors.success + '10', borderColor: colors.success + '25' }
              : { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' },
          ]}
          activeOpacity={generating ? 0.9 : generated ? 1 : 0.7}
          onPress={() => {
            if (generating) { setCancelSheetVisible(true); }
            else if (!generated) { setSmartPlanSheetVisible(true); }
          }}
          disabled={generated}
        >
          {generating ? (
            <View style={{ flex: 1 }}>
              {/* Row: icon + text */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.smartPlanTitle, { color: colors.primary }]}>
                    Building your trip plan… ({doneCount}/{TOTAL_MODULES})
                  </Text>
                  <Text style={[styles.smartPlanDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                    {currentModule ? MODULE_MESSAGES[currentModule.key] || 'Generating…' : 'Finishing up…'}
                  </Text>
                </View>
              </View>
              {/* Progress bar */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.primary + '15', marginTop: 10 }]}>
                <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${Math.round(progress * 100)}%` }]} />
              </View>
            </View>
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

      {/* Cancel Generation Confirmation Sheet */}
      <Modal visible={cancelSheetVisible} animationType="slide" transparent onRequestClose={() => setCancelSheetVisible(false)}>
        <View style={cancelStyles.overlay}>
          <TouchableWithoutFeedback onPress={() => setCancelSheetVisible(false)}>
            <View style={cancelStyles.backdrop} />
          </TouchableWithoutFeedback>
          <View style={[cancelStyles.sheet, { backgroundColor: colors.bgPrimary }]}>
            <View style={cancelStyles.handleRow}>
              <View style={[cancelStyles.handle, { backgroundColor: colors.borderSubtle }]} />
            </View>
            <View style={cancelStyles.content}>
              <View style={[cancelStyles.iconCircle, { backgroundColor: '#EF444415' }]}>
                <CloseCircle size={32} color="#EF4444" variant="Bold" />
              </View>
              <Text style={[cancelStyles.title, { color: colors.textPrimary }]}>Cancel Generation?</Text>
              <Text style={[cancelStyles.desc, { color: colors.textSecondary }]}>
                Your trip plan is still being generated ({doneCount}/{TOTAL_MODULES} modules done). Are you sure you want to stop?
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
                <Text style={[cancelStyles.keepText, { color: '#EF4444' }]}>Yes, Cancel</Text>
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
    color: '#FFFFFF',
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
