import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, useWindowDimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft2, More, Calendar, User, Airplane, Building, Car, Location, CalendarEdit, Bag2, Book, ShieldTick, InfoCircle, SecuritySafe, DollarCircle, LanguageSquare, DocumentText } from 'iconsax-react-native';
import { spacing, typography, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { BookingType, FlightDetails, HotelDetails, CarRentalDetails, ActivityDetails, TripState } from '@/features/trips/types/trip.types';
import { TRIP_STATE_CONFIG } from '@/features/trips/config/trip-states.config';
import InviteTravelersBottomSheet from '@/features/trips/components/InviteTravelersBottomSheet';
import CircleButton from '@/components/atoms/CircleButton/CircleButton';
import { useToast } from '@/contexts/ToastContext';
import { Skeleton } from '@/components/common/SkeletonLoader';
import { useTranslation } from 'react-i18next';
import { packingService } from '@/services/packing.service';
import { invitationService, TripInvitation } from '@/services/invitation.service';
import { fetchDestinationCoverImage } from '@/utils/destinationImage';
import { supabase } from '@/lib/supabase/client';
import Svg, { Circle } from 'react-native-svg';
import { expenseService } from '@/services/expense.service';
import { safetyService } from '@/services/safety.service';
import { journalService } from '@/services/journal.service';
import { compensationService } from '@/services/compensation.service';
import { languageService } from '@/services/language.service';
import { documentService } from '@/services/document.service';
import { plannerService } from '@/services/planner.service';
import { useAuth } from '@/context/AuthContext';
import { TourAnchor, useGuidance } from '@/features/guidance';

// IMAGE_HEIGHT computed inside components using useWindowDimensions

interface TripDetailScreenProps {
  tripId: string;
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Normalize a date to midnight so comparisons are day-based, not time-based.
function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Live trip status derived from the current date (cancelled/draft are kept as-is).
// Recomputed on every render so it advances day by day as the user reopens the trip.
// Upcoming → before start; Ongoing → start through end (+2-day grace); Past → after.
// The 2-day grace MATCHES computeTripState() in trip.store.ts so the badge here can
// never contradict which tab (Ongoing vs Past) the trip is filed under in the list.
function getDisplayState(trip: { state: TripState; startDate: Date; endDate: Date }): TripState {
  if (trip.state === TripState.CANCELLED || trip.state === TripState.DRAFT) return trip.state;
  const today = stripTime(new Date());
  const start = stripTime(trip.startDate);
  if (today < start) return TripState.UPCOMING;
  const graceEnd = stripTime(trip.endDate);
  graceEnd.setDate(graceEnd.getDate() + 2);
  if (today > graceEnd) return TripState.PAST;
  return TripState.ONGOING;
}

// Progress bar fill (0-1) + a human label for the date card.
function computeTripProgress(start: Date, end: Date, state: TripState, duration: number): { progress: number; label: string } {
  const today = stripTime(new Date());
  const s = stripTime(start);
  if (state === TripState.UPCOMING) {
    const daysUntil = Math.max(0, Math.round((s.getTime() - today.getTime()) / 86400000));
    return { progress: 0, label: daysUntil === 0 ? 'Starts today' : `Starts in ${daysUntil} day${daysUntil > 1 ? 's' : ''}` };
  }
  if (state === TripState.PAST) return { progress: 1, label: 'Trip complete' };
  if (state === TripState.CANCELLED) return { progress: 0, label: 'Cancelled' };
  if (state === TripState.DRAFT) return { progress: 0, label: 'Draft' };
  // ONGOING
  const totalDays = Math.max(1, duration);
  const dayNumber = Math.min(totalDays, Math.max(1, Math.floor((today.getTime() - s.getTime()) / 86400000) + 1));
  return { progress: Math.min(1, dayNumber / totalDays), label: `Day ${dayNumber} of ${totalDays}` };
}

// Currency symbol for a given ISO code (Trip Hub previews).
function currencySymbolFor(cur?: string): string {
  switch (cur) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    default: return '$';
  }
}

// Format a "HH:MM" time string to a 12-hour clock label (e.g. "12:30 PM").
function formatClock(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h)) return '';
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m || 0).padStart(2, '0')} ${period}`;
}

// Build a short, human headline for the compensation card from the top open claim.
function buildCompHeadline(c: any): string {
  const flight = c?.flightNumber ? `Flight ${c.flightNumber}` : (c?.provider || 'Your booking');
  const mins = typeof c?.delayMinutes === 'number' ? c.delayMinutes : 0;
  let detail = '';
  if (c?.disruptionType === 'cancellation') detail = ' was cancelled';
  else if (mins > 0) detail = ` delayed ${Math.max(1, Math.round(mins / 60))}h`;
  else if (c?.disruptionType === 'denied_boarding') detail = ' — denied boarding';
  else if (c?.disruptionType === 'missed_connection') detail = ' — missed connection';
  return `${flight}${detail} — you may be owed`;
}

// Compact circular progress ring (SVG) for the Trip Hub stat cards.
function ProgressRing({
  percent,
  color,
  track,
  size = 54,
  stroke = 5,
  children,
}: {
  percent: number;
  color: string;
  track: string;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
}

function TripDetailSkeleton({ isDark, colors: c, insets, onBack }: { isDark: boolean; colors: any; insets: any; onBack: () => void }) {
  const { width } = useWindowDimensions();
  const IMAGE_HEIGHT = width * 1.2;
  return (
    <View style={[styles.container, { backgroundColor: c.bgPrimary }]}>
      {/* Hero Image Skeleton */}
      <View style={[styles.heroContainer, { backgroundColor: c.bgSecondary, height: IMAGE_HEIGHT }]}>
        <Skeleton width="100%" height={IMAGE_HEIGHT} borderRadius={0} />
      </View>

      {/* Back Button */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <CircleButton onPress={onBack} icon={<ArrowLeft2 size={20} color={c.textPrimary} />} />
        <View style={styles.spacer} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: IMAGE_HEIGHT - 60 }]}
      >
        <View style={[styles.content, { backgroundColor: c.bgPrimary }]}>
          {/* Date Card Skeleton */}
          <View style={[styles.dateCard, { backgroundColor: c.bgCard, borderColor: c.borderSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
              <Skeleton width={20} height={20} borderRadius={6} />
              <Skeleton width="60%" height={14} />
            </View>
            <Skeleton width={70} height={28} borderRadius={12} />
          </View>

          {/* Stats Section Skeleton */}
          <View style={[styles.statsSection, { backgroundColor: c.bgCard, borderColor: c.borderSubtle }]}>
            {[0, 1, 2].map(i => (
              <React.Fragment key={i}>
                <View style={styles.statItem}>
                  <Skeleton width={32} height={32} borderRadius={16} style={{ marginBottom: spacing.xs }} />
                  <Skeleton width={50} height={10} style={{ marginBottom: spacing.xs }} />
                  <Skeleton width={40} height={14} />
                </View>
                {i < 2 && <View style={[styles.statDivider, { backgroundColor: c.borderSubtle }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Trip Hub Skeleton */}
          <View style={[styles.section, { backgroundColor: c.bgCard, borderColor: c.borderSubtle }]}>
            <Skeleton width={80} height={20} borderRadius={6} style={{ marginBottom: spacing.md }} />
            
            {/* Wide card skeleton */}
            <View style={[styles.hubListCard, { borderColor: c.borderSubtle }]}>
              <Skeleton width={44} height={44} borderRadius={16} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="50%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="70%" height={12} />
              </View>
            </View>

            {/* Grid skeleton */}
            <View style={[styles.hubGridContainer, { marginTop: spacing.md }]}>
              <View style={[styles.hubSquareCard, { borderColor: c.borderSubtle }]}>
                <Skeleton width={44} height={44} borderRadius={16} style={{ marginBottom: spacing.sm }} />
                <Skeleton width="60%" height={12} />
              </View>
              <View style={[styles.hubSquareCard, { borderColor: c.borderSubtle }]}>
                <Skeleton width={44} height={44} borderRadius={16} style={{ marginBottom: spacing.sm }} />
                <Skeleton width="60%" height={12} />
              </View>
            </View>

            {/* Wide card skeleton */}
            <View style={[styles.hubListCard, { borderColor: c.borderSubtle, marginTop: spacing.md }]}>
              <Skeleton width={44} height={44} borderRadius={16} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="55%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="65%" height={12} />
              </View>
            </View>

            {/* Grid skeleton */}
            <View style={[styles.hubGridContainer, { marginTop: spacing.md }]}>
              <View style={[styles.hubSquareCard, { borderColor: c.borderSubtle }]}>
                <Skeleton width={44} height={44} borderRadius={16} style={{ marginBottom: spacing.sm }} />
                <Skeleton width="70%" height={12} />
              </View>
              <View style={[styles.hubSquareCard, { borderColor: c.borderSubtle }]}>
                <Skeleton width={44} height={44} borderRadius={16} style={{ marginBottom: spacing.sm }} />
                <Skeleton width="60%" height={12} />
              </View>
            </View>

            {/* Wide card skeleton */}
            <View style={[styles.hubListCard, { borderColor: c.borderSubtle, marginTop: spacing.md }]}>
              <Skeleton width={44} height={44} borderRadius={16} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="40%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="60%" height={12} />
              </View>
            </View>
          </View>

          {/* Travelers Section Skeleton */}
          <View style={[styles.section, { backgroundColor: c.bgCard, borderColor: c.borderSubtle }]}>
            <Skeleton width={100} height={20} borderRadius={6} style={{ marginBottom: spacing.md }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md }}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="40%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="55%" height={12} />
              </View>
            </View>
          </View>

          <View style={{ height: spacing.xl * 2 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

export default function TripDetailScreen({ tripId }: TripDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const IMAGE_HEIGHT = width * 1.2;
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { showSuccess } = useToast();
  const { profile } = useAuth();
  const guidance = useGuidance();
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));
  const isLoading = useTripStore(state => state.isLoading);
  const [inviteSheetVisible, setInviteSheetVisible] = useState(false);
  const [packingProgress, setPackingProgress] = useState({ total: 0, packed: 0, percentage: 0 });
  const [expenseStats, setExpenseStats] = useState({ totalSpent: 0, budget: 0, currency: 'USD' });
  const [hubData, setHubData] = useState({
    dos: 0,
    donts: 0,
    journalEntries: 0,
    safetyScore: null as number | null,
    safetyLabel: '',
    compEligible: 0,
    compClaimable: 0,
    compCurrency: 'EUR',
    compHeadline: '',
    langName: '',
    langPhrases: 0,
    docTotal: 0,
    docChecked: 0,
    docAction: 0,
    plannerHasItinerary: false,
    plannerNextTitle: '',
    plannerNextTime: '',
    plannerNextSub: '',
  });
  const [invitations, setInvitations] = useState<TripInvitation[]>([]);
  const scrollOffset = useSharedValue(0);

  const [fetchedCoverImage, setFetchedCoverImage] = useState('');
  const [isFetchingImage, setIsFetchingImage] = useState(false);

  const loadTripData = () => {
    if (!tripId) return;
    packingService.getProgress(tripId).then(setPackingProgress).catch((err) => { if (__DEV__) console.warn('Failed to load packing progress:', err); });
    invitationService.getTripInvitations(tripId).then(setInvitations).catch((err) => { if (__DEV__) console.warn('Failed to load invitations:', err); });
    Promise.all([expenseService.getExpenses(tripId), expenseService.getTripBudget(tripId)])
      .then(([expenses, budgetData]) => {
        const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        setExpenseStats({ totalSpent, budget: budgetData?.total || 0, currency: budgetData?.currency || 'USD' });
      })
      .catch((err) => { if (__DEV__) console.warn('Failed to load expense stats:', err); });
    safetyService.getTripCulturalTips(tripId)
      .then((tips) => setHubData((prev) => ({ ...prev, dos: tips.filter((t) => t.isDo).length, donts: tips.filter((t) => !t.isDo).length })))
      .catch((err) => { if (__DEV__) console.warn('Failed to load cultural tips:', err); });
    journalService.getEntries(tripId)
      .then((e) => setHubData((prev) => ({ ...prev, journalEntries: e.length })))
      .catch((err) => { if (__DEV__) console.warn('Failed to load journal entries:', err); });
    safetyService.getSafetyProfile(tripId)
      .then((sp: any) => {
        if (!sp) return;
        const label = sp.safetyDisplayLabel || (sp.safetyLabel ? String(sp.safetyLabel).replace(/_/g, ' ').replace(/\b\w/g, (ch: string) => ch.toUpperCase()) : '');
        setHubData((prev) => ({ ...prev, safetyScore: typeof sp.safetyScore === 'number' ? sp.safetyScore : null, safetyLabel: label }));
      })
      .catch((err) => { if (__DEV__) console.warn('Failed to load safety profile:', err); });
    Promise.all([compensationService.getStats(tripId), compensationService.getClaims(tripId)])
      .then(([stats, claims]) => {
        const eligible = stats.potentialClaims + stats.analyzingClaims + stats.readyToFileClaims + stats.activeClaims;
        const open = claims.find((c) => ['potential', 'analyzing', 'ready_to_file', 'active', 'submitted'].includes(c.status)) || claims[0];
        setHubData((prev) => ({
          ...prev,
          compEligible: eligible,
          compClaimable: stats.totalPotentialAmount,
          compCurrency: open?.currency || 'EUR',
          compHeadline: open ? buildCompHeadline(open) : '',
        }));
      })
      .catch((err) => { if (__DEV__) console.warn('Failed to load compensation:', err); });
    languageService.getKits(tripId)
      .then((kits) => { const k = kits[0]; if (k) setHubData((prev) => ({ ...prev, langName: k.language, langPhrases: k.totalPhrases })); })
      .catch((err) => { if (__DEV__) console.warn('Failed to load language kit:', err); });
    documentService.getChecklist(tripId)
      .then((c) => { if (c) setHubData((prev) => ({ ...prev, docTotal: c.totalDocuments, docChecked: c.checkedCount, docAction: c.actionRequiredCount })); })
      .catch((err) => { if (__DEV__) console.warn('Failed to load documents:', err); });
    plannerService.getDays(tripId)
      .then((days) => {
        if (!days || days.length === 0) {
          setHubData((prev) => ({ ...prev, plannerHasItinerary: false, plannerNextTitle: '', plannerNextTime: '', plannerNextSub: '' }));
          return;
        }
        const todayStr = new Date().toLocaleDateString('en-CA');
        const day = days.find((d) => d.date === todayStr) || days.find((d) => (d.date || '') >= todayStr) || days[0];
        const acts = day?.activities || [];
        if (!day || acts.length === 0) {
          setHubData((prev) => ({ ...prev, plannerHasItinerary: true, plannerNextTitle: '', plannerNextTime: '', plannerNextSub: '' }));
          return;
        }
        const isToday = day.date === todayStr;
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const upcoming = isToday
          ? acts.find((a) => { const [h, m] = (a.startTime || '').split(':').map(Number); return Number.isFinite(h) && (h * 60 + m) > nowMin; })
          : null;
        const next = upcoming || acts[0];
        const time = formatClock(next.startTime);
        let sub = '';
        if (isToday && next.startTime) {
          const [h, m] = next.startTime.split(':').map(Number);
          const diff = (h * 60 + m) - nowMin;
          if (diff > 0) { const hh = Math.floor(diff / 60); const mm = diff % 60; sub = `${hh > 0 ? `${hh}h ${mm}m` : `${mm} min`} to get ready`; }
        }
        if (!sub) {
          const loc = typeof next.location === 'object' ? next.location?.name : next.location;
          sub = (loc as string) || day.title || day.theme || `Day ${day.dayNumber}`;
        }
        setHubData((prev) => ({ ...prev, plannerHasItinerary: true, plannerNextTitle: next.title, plannerNextTime: time, plannerNextSub: sub }));
      })
      .catch((err) => { if (__DEV__) console.warn('Failed to load itinerary:', err); });
  };

  // Reload on focus so packing/expense progress stays in sync after returning
  // from the packing or expenses screens (not just on first mount).
  useFocusEffect(
    useCallback(() => {
      loadTripData();
    }, [tripId])
  );

  // Offer the Trip Detail tour once (self-gates: fires once, only after the hero tour is seen)
  useFocusEffect(
    useCallback(() => {
      guidance.maybeStartTour('tripDetail');
    }, [guidance])
  );

  // Lazy-fetch cover image from Google Places if missing
  useEffect(() => {
    if (trip?.coverImage && trip.coverImage.length > 0) return;
    const cityName = trip?.destination?.city || trip?.destination?.name || trip?.title || '';
    if (!cityName.trim()) return;
    let cancelled = false;
    setIsFetchingImage(true);
    fetchDestinationCoverImage(cityName, { countryName: trip?.destination?.country }).then(url => {
      if (cancelled) return;
      setIsFetchingImage(false);
      if (url) {
        setFetchedCoverImage(url);
        if (trip?.id) supabase.from('trips').update({ cover_image_url: url, cover_image_source: 'google_places' }).eq('id', trip.id).then();
      }
    }).catch(() => { if (!cancelled) setIsFetchingImage(false); });
    return () => { cancelled = true; };
  }, [trip?.id, trip?.coverImage]);

  if (!trip && !isLoading) {
    // TRIP-02: Show error state instead of infinite skeleton when trip is not found
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🗺️</Text>
        <Text style={{ fontSize: typography.fontSize.kpiValue, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>{t('trips.detail.notFound')}</Text>
        <Text style={{ fontSize: typography.fontSize.bodyLg, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>{t('trips.detail.notFoundDesc')}</Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: colors.white, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.base }}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!trip) {
    return <TripDetailSkeleton isDark={isDark} colors={colors} insets={insets} onBack={() => router.back()} />;
  }

  // Use _db metadata for counts (bookings array is not populated at list level — app is a deal aggregator, not a booking platform)
  const dbFields = (trip as any)._db || {};
  const totalBookings = (dbFields.flightCount || 0) + (dbFields.hotelCount || 0) + (dbFields.carCount || 0) + (dbFields.experienceCount || 0);

  const duration = Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Dynamic, date-derived status for the badge + progress bar.
  const displayState = getDisplayState(trip);
  const stateConfig = TRIP_STATE_CONFIG[displayState];
  const tripProgress = computeTripProgress(trip.startDate, trip.endDate, displayState, duration);

  // Trip Hub stat-card data (Packing + Expenses).
  const packItemsLeft = Math.max(0, packingProgress.total - packingProgress.packed);
  const expensePct = expenseStats.budget > 0 ? Math.round((expenseStats.totalSpent / expenseStats.budget) * 100) : 0;
  const expenseColor = expensePct < 70 ? colors.success : expensePct < 90 ? colors.warning : colors.error;
  const currencySymbol = expenseStats.currency === 'EUR' ? '€' : expenseStats.currency === 'GBP' ? '£' : expenseStats.currency === 'JPY' ? '¥' : '$';
  const fmtMoney = (n: number) => `${currencySymbol}${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  const { dos, donts, journalEntries, safetyScore, safetyLabel, compEligible, compClaimable, compCurrency, compHeadline, langName, langPhrases, docTotal, docChecked, docAction, plannerHasItinerary, plannerNextTitle, plannerNextTime, plannerNextSub } = hubData;
  const totalTips = dos + donts;
  const fmtAmount = (n: number, cur?: string) => `${currencySymbolFor(cur)}${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  // Safety score (0-100) -> ring color + /10 display, mirroring the Safety screen thresholds.
  const hasSafety = safetyScore != null && safetyScore > 0;
  const safetyColor = !hasSafety
    ? colors.textTertiary
    : (safetyScore as number) >= 85 ? colors.success
    : (safetyScore as number) >= 70 ? colors.warning
    : (safetyScore as number) >= 50 ? (colors.orange || '#F97316')
    : colors.error;
  const safetyOutOf10 = hasSafety ? Math.floor((safetyScore as number) / 10) : null;
  const safetyVerdict = safetyLabel || (hasSafety
    ? ((safetyScore as number) >= 85 ? 'Very safe' : (safetyScore as number) >= 70 ? 'Be alert' : (safetyScore as number) >= 50 ? 'Use caution' : 'High risk')
    : 'Not scored');
  // Documents checklist readiness.
  const docPct = docTotal > 0 ? Math.round((docChecked / docTotal) * 100) : 0;
  const docComplete = docTotal > 0 && docChecked >= docTotal;
  const docColor = docComplete ? colors.success : docAction > 0 ? colors.warning : colors.orange;
  // Trip Planner — day pills (windowed around today) + current day highlight.
  const tripDayCount = Math.max(1, duration);
  const _startMid = new Date(trip.startDate); _startMid.setHours(0, 0, 0, 0);
  const _todayMid = new Date(); _todayMid.setHours(0, 0, 0, 0);
  const _dayIdx = Math.floor((_todayMid.getTime() - _startMid.getTime()) / 86400000) + 1;
  const currentTripDay = _dayIdx >= 1 && _dayIdx <= tripDayCount ? _dayIdx : 0;
  const pillCount = Math.min(tripDayCount, 5);
  const pillStart = currentTripDay > pillCount ? Math.min(currentTripDay - pillCount + 1, tripDayCount - pillCount + 1) : 1;
  const plannerPills = Array.from({ length: pillCount }, (_, i) => pillStart + i);
  const plannerBadge = plannerNextTitle ? 'Up next' : currentTripDay > 0 ? `Day ${currentTripDay}` : t('trips.detail.tripPlanner');


  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event: any) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollOffset.value,
      [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
      [-IMAGE_HEIGHT / 2, 0, IMAGE_HEIGHT * 0.25],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ translateY }],
      opacity: interpolate(scrollOffset.value, [0, IMAGE_HEIGHT / 2, IMAGE_HEIGHT], [1, 0.8, 0.3], Extrapolate.CLAMP)
    };
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollOffset.value,
      [0, 100, 200],
      [0, 0.5, 1],
      Extrapolate.CLAMP
    );
    return {
      backgroundColor: isDark
        ? `rgba(32, 32, 32, ${opacity})`
        : `rgba(255, 255, 255, ${opacity})`,
    };
  });

  return (
    <View style={styles.container}>
      {/* Hero Image with Overlay - Both move together */}
      <Animated.View style={[styles.heroContainer, { height: IMAGE_HEIGHT }, imageAnimatedStyle]}>
        {(trip.coverImage || fetchedCoverImage) ? (
          <Animated.Image source={{ uri: trip.coverImage || fetchedCoverImage }} style={styles.heroImage} />
        ) : isFetchingImage ? (
          <Skeleton width="100%" height={IMAGE_HEIGHT} borderRadius={0} />
        ) : (
          <LinearGradient colors={['#2C3E50', '#3498DB', '#2980B9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroImage} />
        )}

        {/* Gradient Overlay for Text Visibility */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        />

        {/* Badge - Positioned independently. Color + label reflect the live status. */}
        <View style={[styles.stateBadge, { backgroundColor: stateConfig.color }]}>
          <Text style={styles.stateBadgeText}>{stateConfig.label.toUpperCase()}</Text>
        </View>

        {/* Hero Overlay - Moves with Image */}
        <View style={styles.heroOverlay}>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle} numberOfLines={2}>{trip.title}</Text>
            {trip.budget && <Text style={styles.heroBudget}>${trip.budget.amount.toLocaleString()}</Text>}
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: IMAGE_HEIGHT - 60 }]}
      >
        <View style={[styles.content, { backgroundColor: colors.bgPrimary }]}>
          <View style={[styles.dateCard, { backgroundColor: isDark ? colors.bgSecondary : colors.bgCard }]}>
            <View style={styles.dateTopRow}>
              <View style={styles.dateRow}>
                <Location size={20} color={colors.primary} variant="Bold" />
                <Text style={[styles.dateText, { color: colors.textPrimary }]} numberOfLines={1}>
                  {trip.destination.city}, {trip.destination.country}
                </Text>
              </View>
              <View style={[styles.durationBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.durationText}>{duration} days</Text>
              </View>
            </View>

            {/* Trip progress bar — fills day by day while the trip is ongoing. */}
            <View style={[styles.progressTrack, { backgroundColor: isDark ? colors.bgElevated : colors.borderSubtle }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(tripProgress.progress * 100)}%`, backgroundColor: stateConfig.color },
                ]}
              />
            </View>

            <View style={styles.progressLabelsRow}>
              <Text style={[styles.progressDate, { color: colors.textSecondary }]}>
                {trip.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={[styles.progressDayLabel, { color: stateConfig.color }]}>{tripProgress.label}</Text>
              <Text style={[styles.progressDate, { color: colors.textSecondary }]}>
                {trip.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>

          <TourAnchor id="trip.snapshot" style={[styles.statsSection, { backgroundColor: isDark ? colors.bgSecondary : colors.bgCard }]}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.info}15` }]}>
                <Calendar size={18} color={colors.info} variant="Bold" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('trips.detail.tripPlan')}</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{duration} Days</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Building size={18} color={colors.primary} variant="Bold" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('trips.detail.bookings')}</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalBookings}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
                <Bag2 size={18} color={colors.warning} variant="Bold" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('trips.detail.packingList')}</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{packingProgress.total > 0 ? `${packingProgress.percentage}%` : t('trips.detail.noItems')}</Text>
            </View>
          </TourAnchor>

          {/* Trip Summary — Flighty-style navy gradient hero */}
          {totalBookings > 0 && (
            <LinearGradient
              colors={['#110543', '#2F426B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>{t('trips.detail.tripSummary')}</Text>

              {dbFields.flightNumber && (
                <View style={[styles.bookingCard, { borderBottomColor: 'rgba(255,255,255,0.15)' }]}>
                  <View style={[styles.bookingIcon, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
                    <Airplane size={24} color="#FFFFFF" variant="Bold" />
                  </View>
                  <View style={styles.bookingInfo}>
                    <Text style={[styles.bookingTitle, { color: '#FFFFFF' }]}>
                      {dbFields.airlineName ? `${dbFields.airlineName} ${dbFields.flightNumber}` : dbFields.flightNumber}
                    </Text>
                    {dbFields.route ? (
                      <Text style={[styles.bookingSubtitle, { color: 'rgba(255,255,255,0.85)' }]}>{dbFields.route}</Text>
                    ) : null}
                    {dbFields.cabinClass ? (
                      <Text style={[styles.bookingDate, { color: 'rgba(255,255,255,0.6)' }]}>{dbFields.cabinClass}</Text>
                    ) : null}
                  </View>
                </View>
              )}

              {(dbFields.flightCount > 0 || dbFields.hotelCount > 0 || dbFields.carCount > 0 || dbFields.experienceCount > 0) && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: spacing.md }}>
                  {dbFields.flightCount > 0 && (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={[styles.statusText, { color: '#FFFFFF' }]}>{dbFields.flightCount} Flight{dbFields.flightCount > 1 ? 's' : ''}</Text>
                    </View>
                  )}
                  {dbFields.hotelCount > 0 && (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={[styles.statusText, { color: '#FFFFFF' }]}>{dbFields.hotelCount} Hotel{dbFields.hotelCount > 1 ? 's' : ''}</Text>
                    </View>
                  )}
                  {dbFields.carCount > 0 && (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={[styles.statusText, { color: '#FFFFFF' }]}>{dbFields.carCount} Car{dbFields.carCount > 1 ? 's' : ''}</Text>
                    </View>
                  )}
                  {dbFields.experienceCount > 0 && (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={[styles.statusText, { color: '#FFFFFF' }]}>{dbFields.experienceCount} Experience{dbFields.experienceCount > 1 ? 's' : ''}</Text>
                    </View>
                  )}
                </View>
              )}
            </LinearGradient>
          )}

          {/* Trip Hub */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.bgSecondary : colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('trips.detail.tripHub')}</Text>
            
            {/* 1. Trip Planner - Gradient hero with Up-next glance + day pills */}
            <TourAnchor id="trip.smartPlan" style={styles.hubListContainer}>
              <TouchableOpacity
                style={styles.hubCompCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/planner/${tripId}`)}
                accessibilityRole="button"
                accessibilityLabel="Trip Planner"
              >
                <LinearGradient
                  colors={[`${colors.primary}26`, `${colors.primary}0D`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.hubPlannerGradient, { borderColor: `${colors.primary}26` }]}
                >
                  <View style={styles.hubPlannerHeader}>
                    <View style={styles.hubPlannerHeaderLeft}>
                      <View style={[styles.hubCompIcon, { backgroundColor: isDark ? colors.bgElevated : colors.bgCard, marginRight: 0 }]}>
                        <CalendarEdit size={24} color={colors.primary} variant="Bold" />
                      </View>
                      <Text style={[styles.hubCompTitle, { color: colors.textPrimary }]}>{t('trips.detail.tripPlanner')}</Text>
                    </View>
                    <View style={[styles.hubPlannerBadge, { backgroundColor: `${colors.primary}1A` }]}>
                      <Text style={[styles.hubPlannerBadgeText, { color: colors.primary }]}>{plannerBadge}</Text>
                    </View>
                  </View>

                  <View style={styles.hubPlannerNextRow}>
                    <Location size={20} color={colors.primary} variant="Bold" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.hubPlannerNextTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {plannerNextTitle
                          ? `${plannerNextTitle}${plannerNextTime ? ` · ${plannerNextTime}` : ''}`
                          : plannerHasItinerary ? 'Your itinerary is ready' : 'Build your day-by-day plan'}
                      </Text>
                      <Text style={[styles.hubPlannerNextSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        {plannerNextTitle ? plannerNextSub : plannerHasItinerary ? 'Tap to view your schedule' : 'Tap to generate a smart plan'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.hubPlannerPills}>
                    {plannerPills.map((d) => {
                      const isCurrent = d === currentTripDay;
                      return (
                        <View
                          key={d}
                          style={[styles.hubPlannerPill, isCurrent ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.borderSubtle }]}
                        >
                          <Text style={[styles.hubPlannerPillText, { color: isCurrent ? '#FFFFFF' : colors.textSecondary }]}>
                            {isCurrent ? 'Today' : `D${d}`}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </TourAnchor>

            {/* 2. Packing + Expenses - Stat Cards (live data + progress ring) */}
            <TourAnchor id="trip.moduleGrid" style={styles.hubGridContainer}>
              <TouchableOpacity
                style={[styles.hubStatCard, { borderColor: colors.borderSubtle, backgroundColor: isDark ? colors.bgElevated : colors.bgCard }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/packing/${tripId}`)}
                accessibilityRole="button"
                accessibilityLabel="Packing list"
              >
                <View style={styles.hubStatTop}>
                  <View style={[styles.hubStatIcon, { backgroundColor: `${colors.warning}15` }]}>
                    <Bag2 size={22} color={colors.warning} variant="Bold" />
                  </View>
                  <ProgressRing percent={packingProgress.percentage} color={colors.warning} track={isDark ? colors.bgElevated : colors.borderSubtle}>
                    <Text style={[styles.ringText, { color: colors.textPrimary }]}>{packingProgress.percentage}%</Text>
                  </ProgressRing>
                </View>
                <Text style={[styles.hubStatValue, { color: colors.textPrimary }]}>
                  {packingProgress.total > 0 ? `${packingProgress.packed} / ${packingProgress.total}` : '0 / 0'}
                </Text>
                <Text style={[styles.hubStatSub, { color: colors.textSecondary }]}>
                  {packingProgress.total > 0 ? `${packItemsLeft} item${packItemsLeft === 1 ? '' : 's'} left` : 'No items yet'}
                </Text>
                <Text style={[styles.hubStatLabel, { color: colors.textPrimary }]}>{t('trips.detail.packing')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.hubStatCard, { borderColor: colors.borderSubtle, backgroundColor: isDark ? colors.bgElevated : colors.bgCard }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/expenses/${tripId}`)}
                accessibilityRole="button"
                accessibilityLabel="Expense tracker"
              >
                <View style={styles.hubStatTop}>
                  <View style={[styles.hubStatIcon, { backgroundColor: `${colors.success}15` }]}>
                    <DollarCircle size={22} color={colors.success} variant="Bold" />
                  </View>
                  <ProgressRing percent={expensePct} color={expenseColor} track={isDark ? colors.bgElevated : colors.borderSubtle}>
                    <Text style={[styles.ringText, { color: colors.textPrimary }]}>{expensePct}%</Text>
                  </ProgressRing>
                </View>
                <Text style={[styles.hubStatValue, { color: colors.textPrimary }]}>{fmtMoney(expenseStats.totalSpent)}</Text>
                <Text style={[styles.hubStatSub, { color: colors.textSecondary }]}>
                  {expenseStats.budget > 0 ? `of ${fmtMoney(expenseStats.budget)} spent` : 'No budget set'}
                </Text>
                <Text style={[styles.hubStatLabel, { color: colors.textPrimary }]}>{t('trips.detail.expenses', 'Expenses')}</Text>
              </TouchableOpacity>
            </TourAnchor>

            {/* 3. Travel Journal - Blue gradient hero with entry-count ring */}
            <View style={styles.hubListContainer}>
              <TouchableOpacity
                style={styles.hubCompCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/journal/${tripId}`)}
                accessibilityRole="button"
                accessibilityLabel="Travel journal"
              >
                <LinearGradient
                  colors={[`${colors.info}26`, `${colors.info}0D`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.hubCompGradient, { borderColor: `${colors.info}26` }]}
                >
                  <View style={[styles.hubCompIcon, { backgroundColor: isDark ? colors.bgElevated : colors.bgCard }]}>
                    <Book size={26} color={colors.info} variant="Bold" />
                  </View>
                  <View style={styles.hubCompContent}>
                    <View style={styles.hubCompTitleRow}>
                      <Text style={[styles.hubCompTitle, { color: colors.textPrimary }]}>{t('trips.detail.journal')}</Text>
                      {journalEntries > 0 && (
                        <View style={[styles.hubCompBadge, { backgroundColor: colors.info }]}>
                          <Text style={styles.hubCompBadgeText}>{journalEntries} {journalEntries === 1 ? 'entry' : 'entries'}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.hubCompHeadline, { color: colors.textSecondary }]} numberOfLines={2}>
                      {journalEntries > 0 ? 'Photos, audio & notes from your trip' : t('trips.detail.journalDesc', 'Capture moments & memories')}
                    </Text>
                  </View>
                  <ProgressRing percent={journalEntries > 0 ? 100 : 0} color={colors.info} track={isDark ? colors.bgElevated : colors.borderSubtle} size={48} stroke={5}>
                    <Text style={[styles.ringText, { color: colors.textPrimary }]}>{journalEntries}</Text>
                  </ProgressRing>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {/* 4. Do's & Don'ts + Safety - Stat Cards (live counts) */}
            <View style={styles.hubGridContainer}>
              <TouchableOpacity
                style={[styles.hubStatCard, { borderColor: colors.borderSubtle, backgroundColor: isDark ? colors.bgElevated : colors.bgCard }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/dos-donts/${tripId}`)}
                accessibilityRole="button"
                accessibilityLabel="Do's and Don'ts"
              >
                <View style={styles.hubStatTop}>
                  <View style={[styles.hubStatIcon, { backgroundColor: colors.successBg }]}>
                    <InfoCircle size={22} color={colors.success} variant="Bold" />
                  </View>
                </View>
                <Text style={[styles.hubStatValue, { color: colors.textPrimary }]}>{totalTips > 0 ? totalTips : '—'}</Text>
                <Text style={[styles.hubStatSub, { color: colors.textSecondary }]}>
                  {totalTips > 0 ? `${dos} Do's · ${donts} Don'ts` : 'Cultural tips & etiquette'}
                </Text>
                <Text style={[styles.hubStatLabel, { color: colors.textPrimary }]}>{t('trips.detail.dosDonts')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.hubStatCard, { borderColor: colors.borderSubtle, backgroundColor: isDark ? colors.bgElevated : colors.bgCard }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/safety/${tripId}`)}
                accessibilityRole="button"
                accessibilityLabel="Safety"
              >
                <View style={styles.hubStatTop}>
                  <View style={[styles.hubStatIcon, { backgroundColor: hasSafety ? `${safetyColor}1A` : colors.errorBg }]}>
                    <SecuritySafe size={22} color={hasSafety ? safetyColor : colors.error} variant="Bold" />
                  </View>
                  <ProgressRing percent={hasSafety ? (safetyScore as number) : 0} color={safetyColor} track={isDark ? colors.bgElevated : colors.borderSubtle}>
                    <Text style={[styles.ringText, { color: colors.textPrimary }]}>{safetyOutOf10 != null ? `${safetyOutOf10}/10` : '—'}</Text>
                  </ProgressRing>
                </View>
                <Text style={[styles.hubStatValue, { color: colors.textPrimary }]} numberOfLines={1}>{safetyVerdict}</Text>
                <Text style={[styles.hubStatSub, { color: colors.textSecondary }]}>
                  {hasSafety ? `Safety score ${safetyScore}/100` : 'Tap to generate'}
                </Text>
                <Text style={[styles.hubStatLabel, { color: colors.textPrimary }]}>{t('trips.detail.safety')}</Text>
              </TouchableOpacity>
            </View>
            
            {/* 5. Language + Documents - Stat Cards (live counts + readiness) */}
            <View style={styles.hubGridContainer}>
              <TouchableOpacity
                style={[styles.hubStatCard, { borderColor: colors.borderSubtle, backgroundColor: isDark ? colors.bgElevated : colors.bgCard }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/language/${tripId}`)}
                accessibilityRole="button"
                accessibilityLabel="Language survival kit"
              >
                <View style={styles.hubStatTop}>
                  <View style={[styles.hubStatIcon, { backgroundColor: `${colors.info}15` }]}>
                    <LanguageSquare size={22} color={colors.info} variant="Bold" />
                  </View>
                  <ProgressRing percent={langPhrases > 0 ? 100 : 0} color={colors.info} track={isDark ? colors.bgElevated : colors.borderSubtle}>
                    <Text style={[styles.ringText, { color: colors.textPrimary }]}>{langPhrases}</Text>
                  </ProgressRing>
                </View>
                <Text style={[styles.hubStatValue, { color: colors.textPrimary }]} numberOfLines={1}>{langName || '—'}</Text>
                <Text style={[styles.hubStatSub, { color: colors.textSecondary }]}>
                  {langPhrases > 0 ? `${langPhrases} key phrases` : 'Tap to generate'}
                </Text>
                <Text style={[styles.hubStatLabel, { color: colors.textPrimary }]}>{t('trips.detail.language')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.hubStatCard, { borderColor: colors.borderSubtle, backgroundColor: isDark ? colors.bgElevated : colors.bgCard }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/documents/${tripId}`)}
                accessibilityRole="button"
                accessibilityLabel="Travel documents"
              >
                <View style={styles.hubStatTop}>
                  <View style={[styles.hubStatIcon, { backgroundColor: `${colors.orange}15` }]}>
                    <DocumentText size={22} color={colors.orange} variant="Bold" />
                  </View>
                  <ProgressRing percent={docPct} color={docColor} track={isDark ? colors.bgElevated : colors.borderSubtle}>
                    <Text style={[styles.ringText, { color: colors.textPrimary }]}>{docTotal > 0 ? `${docPct}%` : '—'}</Text>
                  </ProgressRing>
                </View>
                <Text style={[styles.hubStatValue, { color: colors.textPrimary }]}>
                  {docTotal > 0 ? `${docChecked} / ${docTotal}` : '—'}
                </Text>
                <Text style={[styles.hubStatSub, { color: colors.textSecondary }]}>
                  {docTotal > 0 ? (docComplete ? 'All ready' : `${docTotal - docChecked} to prep`) : 'Tap to generate'}
                </Text>
                <Text style={[styles.hubStatLabel, { color: colors.textPrimary }]}>{t('trips.detail.documents')}</Text>
              </TouchableOpacity>
            </View>

            {/* 6. Compensation - Wide gradient hero card */}
            <View style={styles.hubListContainer}>
              <TouchableOpacity
                style={styles.hubCompCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/compensation/${tripId}`)}
                accessibilityRole="button"
                accessibilityLabel="Flight compensation"
              >
                <LinearGradient
                  colors={[`${colors.purple}26`, `${colors.purple}0D`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.hubCompGradient, { borderColor: `${colors.purple}26` }]}
                >
                  <View style={[styles.hubCompIcon, { backgroundColor: isDark ? colors.bgElevated : colors.bgCard }]}>
                    <ShieldTick size={26} color={colors.purple} variant="Bold" />
                  </View>
                  <View style={styles.hubCompContent}>
                    <View style={styles.hubCompTitleRow}>
                      <Text style={[styles.hubCompTitle, { color: colors.textPrimary }]}>{t('trips.detail.compensation')}</Text>
                      {compEligible > 0 && (
                        <View style={[styles.hubCompBadge, { backgroundColor: colors.purple }]}>
                          <Text style={styles.hubCompBadgeText}>{compEligible} eligible</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.hubCompHeadline, { color: colors.textSecondary }]} numberOfLines={2}>
                      {compClaimable > 0
                        ? (compHeadline || 'You may be owed compensation')
                        : 'We’ll watch your flights for delays & cancellations'}
                    </Text>
                  </View>
                  <View style={styles.hubCompRight}>
                    {compClaimable > 0 ? (
                      <>
                        <Text style={[styles.hubCompAmount, { color: colors.purple }]} numberOfLines={1}>
                          {fmtAmount(compClaimable, compCurrency)}
                        </Text>
                        <Text style={[styles.hubCompClaimable, { color: colors.textTertiary }]}>claimable</Text>
                      </>
                    ) : (
                      <>
                        <ProgressRing percent={100} color={`${colors.purple}66`} track={isDark ? colors.bgElevated : colors.borderSubtle} size={44} stroke={4}>
                          <ShieldTick size={16} color={colors.purple} variant="Bold" />
                        </ProgressRing>
                        <Text style={[styles.hubCompClaimable, { color: colors.textTertiary }]}>monitoring</Text>
                      </>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: isDark ? colors.bgSecondary : colors.bgCard }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Travelers ({trip.travelers.length + invitations.length})
              </Text>
              <TourAnchor id="trip.invite">
                <TouchableOpacity
                  style={[styles.inviteButtonContainer, { backgroundColor: `${colors.primary}15` }]}
                  onPress={() => setInviteSheetVisible(true)}
                >
                  <Text style={[styles.inviteButton, { color: colors.primary }]}>{t('trips.detail.invite')}</Text>
                </TouchableOpacity>
              </TourAnchor>
            </View>

            {/* Trip owner / existing travelers */}
            {trip.travelers.map(traveler => (
              <View key={traveler.id} style={[styles.travelerCard, { borderBottomColor: colors.borderSubtle }]}>
                {traveler.id === trip.userId && profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.travelerAvatarImg} />
                ) : (
                  <View style={[styles.travelerAvatar, { backgroundColor: `${colors.primary}15` }]}>
                    <User size={20} color={colors.primary} variant="Bold" />
                  </View>
                )}
                <View style={styles.travelerInfo}>
                  <Text style={[styles.travelerName, { color: colors.textPrimary }]}>{traveler.name}</Text>
                  <Text style={[styles.travelerEmail, { color: colors.textSecondary }]}>{traveler.email}</Text>
                </View>
                {traveler.id === trip.userId && (
                  <View style={[styles.ownerBadge, { backgroundColor: `${colors.primary}15` }]}>
                    <Text style={[styles.ownerText, { color: colors.primary }]}>{t('trips.detail.owner')}</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Invited travelers with status */}
            {invitations.map(invite => {
              const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                pending:  { bg: `${colors.warning}15`, text: colors.warning, label: 'Pending' },
                accepted: { bg: `${colors.success}15`, text: colors.success, label: 'Accepted' },
                declined: { bg: `${colors.error}15`, text: colors.error, label: 'Declined' },
                expired:  { bg: `${colors.textTertiary}15`, text: colors.textTertiary, label: 'Expired' },
              };
              const sc = statusColors[invite.status] || statusColors.pending;

              return (
                <View key={invite.id} style={[styles.travelerCard, { borderBottomColor: colors.borderSubtle }]}>
                  <View style={[styles.travelerAvatar, {
                    backgroundColor: invite.status === 'accepted' ? `${colors.success}15` : `${colors.warning}15`,
                  }]}>
                    <User size={20} color={invite.status === 'accepted' ? colors.success : colors.warning} variant="Bold" />
                  </View>
                  <View style={styles.travelerInfo}>
                    <Text style={[styles.travelerName, { color: colors.textPrimary }]}>
                      {invite.invitedName || invite.invitedEmail.split('@')[0]}
                    </Text>
                    <Text style={[styles.travelerEmail, { color: colors.textSecondary }]}>
                      {invite.invitedEmail}
                    </Text>
                  </View>
                  <View style={[styles.ownerBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.ownerText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                </View>
              );
            })}

            {trip.travelers.length === 0 && invitations.length === 0 && (
              <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                <Text style={[styles.travelerEmail, { color: colors.textTertiary }]}>
                  {t('trips.detail.noTravelers')}
                </Text>
              </View>
            )}
          </View>
          <View style={{ height: spacing.xl }} />
        </View>
      </Animated.ScrollView>

      <Animated.View style={[styles.header, { paddingTop: insets.top + 8 }, headerAnimatedStyle]}>
        <CircleButton icon={<ArrowLeft2 size={24} color={colors.textPrimary} />} onPress={() => router.back()} />
        <View style={styles.spacer} />
        {/* Menu removed — trip status managed automatically by the system */}
        <View style={{ width: 40 }} />
      </Animated.View>


      {/* Invite Travelers Bottom Sheet */}
      <InviteTravelersBottomSheet
        visible={inviteSheetVisible}
        onClose={() => {
          setInviteSheetVisible(false);
          loadTripData();
        }}
        tripId={tripId}
        tripName={trip.title || `${trip.destination.city} Trip`}
        tripDestination={trip.destination.city}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 },
  heroImage: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 250 },
  heroOverlay: { position: 'absolute', bottom: spacing.xl * 4 + spacing.sm, left: 0, right: 0, padding: spacing.lg },
  stateBadge: { position: 'absolute', bottom: spacing.xl * 4 + spacing.sm + spacing.xl * 1.5 + spacing.lg + spacing.md, left: spacing.lg, backgroundColor: '#F24B6D', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 8 },
  stateBadgeText: { fontSize: typography.fontSize.captionSm, fontWeight: typography.fontWeight.bold, color: '#FFFFFF', letterSpacing: 0.5 },
  heroTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  heroTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: '#FFFFFF', flex: 1 },
  heroBudget: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: '#FFFFFF', marginLeft: spacing.sm },
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, zIndex: 10, gap: spacing.md },
  spacer: { flex: 1 },
  scrollContent: { /* paddingTop overridden inline with IMAGE_HEIGHT - 60 */ },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: spacing.lg },
  dateCard: { marginHorizontal: spacing.md, marginTop: -spacing.xl * 2, padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSubtle, gap: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  dateTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  dateText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, flex: 1 },
  durationBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 12 },
  durationText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', width: '100%', marginTop: spacing.xs },
  progressFill: { height: '100%', borderRadius: 3, minWidth: 4 },
  progressLabelsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressDate: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  progressDayLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  statsSection: { flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.lg, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSubtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, marginBottom: spacing.xs },
  statValue: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  statDivider: { width: 1 },
  section: { marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.lg, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSubtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  summaryCard: { marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.lg, borderRadius: 16, shadowColor: '#110543', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, marginBottom: spacing.md },
  bookingCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  bookingIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  bookingInfo: { flex: 1, justifyContent: 'center' },
  bookingTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, marginBottom: spacing.xs },
  bookingSubtitle: { fontSize: typography.fontSize.sm, marginBottom: spacing.xs },
  bookingDate: { fontSize: typography.fontSize.xs },
  bookingPrice: { alignItems: 'flex-end', justifyContent: 'center', marginRight: spacing.sm },
  priceAmount: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, marginBottom: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  statusText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
  expandedDetails: { padding: spacing.md, marginTop: -1, marginBottom: spacing.sm, borderRadius: 12 },
  detailRow: { marginBottom: spacing.sm },
  detailLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.xs, textTransform: 'uppercase' },
  detailValue: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  // Trip Hub Styles
  hubListContainer: { gap: spacing.md, marginTop: spacing.md },
  hubListCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSubtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  hubGridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, gap: spacing.md },
  hubSquareCard: { flex: 1, padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSubtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  hubStatCard: { flex: 1, padding: spacing.md, borderRadius: 20, borderWidth: 1, borderColor: colors.borderSubtle, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  hubStatTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  hubStatIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ringText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  hubStatValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  hubStatSub: { fontSize: typography.fontSize.xs, marginTop: 2 },
  hubStatLabel: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, marginTop: spacing.sm },
  // Compensation hero card
  hubCompCard: { borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  hubCompGradient: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 20, borderWidth: 1 },
  hubCompIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  hubCompContent: { flex: 1, marginRight: spacing.sm },
  hubCompTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  hubCompTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  hubCompBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  hubCompBadgeText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },
  hubCompHeadline: { fontSize: typography.fontSize.sm, lineHeight: 18 },
  hubCompRight: { alignItems: 'flex-end' },
  hubCompAmount: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  hubCompClaimable: { fontSize: typography.fontSize.xs, marginTop: 2 },
  // Trip Planner hero
  hubPlannerGradient: { padding: spacing.md, borderRadius: 20, borderWidth: 1 },
  hubPlannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  hubPlannerHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hubPlannerBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  hubPlannerBadgeText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  hubPlannerNextRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  hubPlannerNextTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  hubPlannerNextSub: { fontSize: typography.fontSize.xs, marginTop: 1 },
  hubPlannerPills: { flexDirection: 'row', gap: spacing.sm },
  hubPlannerPill: { flex: 1, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, alignItems: 'center' },
  hubPlannerPillText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
  travelerAvatarImg: { width: 44, height: 44, borderRadius: 22, marginRight: spacing.md },
  inviteButtonContainer: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  inviteButton: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  travelerCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  travelerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  travelerInfo: { flex: 1 },
  travelerName: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.xs },
  travelerEmail: { fontSize: typography.fontSize.sm },
  ownerBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  ownerText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
});
