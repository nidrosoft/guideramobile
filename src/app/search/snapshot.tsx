/**
 * TRIP SNAPSHOT SCREEN
 * 
 * Premium AI-powered Trip Intelligence page with structured destination
 * intelligence, expandable sections, cost breakdown, flight/hotel/experience
 * previews, events, and rich AI-generated destination guide.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Image, Linking, LayoutAnimation, Platform, UIManager, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AnimatedGradientBackground } from '@/components/common/AnimatedGradientBackground';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft2, Airplane, Building, Building4, Star1, Calendar,
  Clock, Magicpen, MoneyRecive, ArrowDown2, ArrowUp2,
  Sun1, People, Reserve, ShieldTick, Car, Map, Wallet2, LanguageSquare,
  Warning2, DocumentText, Wifi, Timer1, Moneys, MusicPlaylist, CloseCircle, InfoCircle,
} from 'iconsax-react-native';
import { useTheme } from '@/context/ThemeContext';
import { typography, spacing, borderRadius } from '@/styles';
import {
  tripSnapshotService,
  TripSnapshot,
  BriefSection,
} from '@/services/tripSnapshot.service';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Dynamic Loading Messages (25 steps, ~3s each = ~75s coverage) ───

const LOADING_STEPS = [
  'Searching for the best flights...',
  'Finding places to stay...',
  'Discovering top experiences...',
  'Checking local events and happenings...',
  'Searching real-time travel data...',
  'Looking up visa and entry requirements...',
  'Reviewing safety information...',
  'Checking for common scams and risks...',
  'Finding eSIM and connectivity options...',
  'Mapping transport from airport to city...',
  'Exploring best neighborhoods to stay...',
  'Gathering food and dining tips...',
  'Checking currency and tipping customs...',
  'Checking weather for your dates...',
  'Finding best times to visit key spots...',
  'Calculating your trip budget...',
  'AI is writing your destination brief...',
  'Building your packing suggestions...',
  'Putting together money-saving tips...',
  'Learning essential local phrases...',
  'Comparing budget, mid-range and luxury...',
  'Writing personalized travel insights...',
  'Reviewing local transportation options...',
  'Checking travel insurance recommendations...',
  'Looking into cultural etiquette tips...',
  'Scanning for seasonal travel advisories...',
  'Finding the best local markets and shops...',
  'Double-checking all information...',
  'Packaging everything together...',
  'Almost there, polishing your trip brief...',
];

// Patience quotes shown at the bottom during loading
const PATIENCE_QUOTES = [
  { text: '"The world is a book, and those who do not travel read only one page."', author: 'Saint Augustine' },
  { text: '"Travel is the only thing you buy that makes you richer."', author: 'Anonymous' },
  { text: '"Not all those who wander are lost."', author: 'J.R.R. Tolkien' },
  { text: '"Life is short and the world is wide."', author: 'Simon Raven' },
  { text: '"Adventure is worthwhile in itself."', author: 'Amelia Earhart' },
  { text: '"To travel is to live."', author: 'Hans Christian Andersen' },
  { text: '"The journey of a thousand miles begins with a single step."', author: 'Lao Tzu' },
  { text: '"Travel makes one modest. You see what a tiny place you occupy in the world."', author: 'Gustave Flaubert' },
  { text: '"Once a year, go someplace you\'ve never been before."', author: 'Dalai Lama' },
  { text: '"Traveling — it leaves you speechless, then turns you into a storyteller."', author: 'Ibn Battuta' },
  { text: '"The real voyage of discovery consists not in seeking new landscapes, but in having new eyes."', author: 'Marcel Proust' },
  { text: '"We travel not to escape life, but for life not to escape us."', author: 'Anonymous' },
  { text: '"A journey is best measured in friends, rather than miles."', author: 'Tim Cahill' },
  { text: '"The gladdest moment in human life is a departure into unknown lands."', author: 'Sir Richard Burton' },
  { text: '"Travel far enough, you meet yourself."', author: 'David Mitchell' },
  { text: '"Wherever you go, go with all your heart."', author: 'Confucius' },
  { text: '"Take only memories, leave only footprints."', author: 'Chief Seattle' },
  { text: '"Paris is always a good idea."', author: 'Audrey Hepburn' },
  { text: '"I haven\'t been everywhere, but it\'s on my list."', author: 'Susan Sontag' },
  { text: '"Travel is fatal to prejudice, bigotry, and narrow-mindedness."', author: 'Mark Twain' },
  { text: '"A good traveler has no fixed plans, and is not intent on arriving."', author: 'Lao Tzu' },
  { text: '"Man cannot discover new oceans unless he has the courage to lose sight of the shore."', author: 'André Gide' },
  { text: '"The biggest adventure you can take is to live the life of your dreams."', author: 'Oprah Winfrey' },
  { text: '"Two roads diverged in a wood, and I took the one less traveled by."', author: 'Robert Frost' },
  { text: '"Jobs fill your pocket, adventures fill your soul."', author: 'Jaime Lyn Beatty' },
  { text: '"Blessed are the curious for they shall have adventures."', author: 'Lovelle Drachman' },
  { text: '"Live life with no excuses, travel with no regret."', author: 'Oscar Wilde' },
  { text: '"One\'s destination is never a place, but a new way of seeing things."', author: 'Henry Miller' },
];

function LoadingAnimation({ destination, tc }: { destination: string; tc: any }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * PATIENCE_QUOTES.length));
  const [percentText, setPercentText] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const quoteFadeAnim = useRef(new Animated.Value(1)).current;

  // Progress bar — fast start, slows down, stalls at ~92%
  useEffect(() => {
    Animated.sequence([
      Animated.timing(progressAnim, { toValue: 0.4, duration: 8000, useNativeDriver: false }),
      Animated.timing(progressAnim, { toValue: 0.7, duration: 15000, useNativeDriver: false }),
      Animated.timing(progressAnim, { toValue: 0.92, duration: 30000, useNativeDriver: false }),
    ]).start();
  }, [progressAnim]);

  // Track percentage from animated value
  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => {
      setPercentText(Math.round(value * 100));
    });
    return () => progressAnim.removeListener(id);
  }, [progressAnim]);

  // Rotate through steps every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -8, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
        slideAnim.setValue(8);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [fadeAnim, slideAnim]);

  // Rotate quotes every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(quoteFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setQuoteIndex((prev) => (prev + 1) % PATIENCE_QUOTES.length);
        Animated.timing(quoteFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [quoteFadeAnim]);

  const step = LOADING_STEPS[stepIndex];
  const quote = PATIENCE_QUOTES[quoteIndex];

  const TRACK_WIDTH = Dimensions.get('window').width * 0.75;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_WIDTH],
  });

  return (
    <AnimatedGradientBackground style={styles.loadingFullScreen}>
      {/* Center content — title, progress bar, current step */}
      <View style={styles.loadingCenterBlock}>
        <Text style={[styles.loadingTitle, { color: '#FFFFFF' }]}>
          Analyzing {destination}
        </Text>

        {/* Progress Bar */}
        <View style={[styles.progressBarTrack, { width: TRACK_WIDTH, backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Animated.View style={[styles.progressBarFill, { backgroundColor: '#FFFFFF', width: progressWidth }]} />
        </View>

        {/* Percentage */}
        <Text style={styles.percentText}>{percentText}%</Text>

        {/* Current step message */}
        <View style={styles.loadingStepContainer}>
          <Animated.View
            style={[
              styles.loadingStepRow,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={[styles.loadingStepText, { color: 'rgba(255,255,255,0.7)' }]}>{step}</Text>
          </Animated.View>
        </View>
      </View>

      {/* Quote pinned to bottom */}
      <Animated.View style={[styles.quoteContainer, { opacity: quoteFadeAnim }]}>
        <Text style={[styles.quoteText, { color: 'rgba(255,255,255,0.5)' }]}>{quote.text}</Text>
        <Text style={[styles.quoteAuthor, { color: 'rgba(255,255,255,0.4)' }]}>— {quote.author}</Text>
      </Animated.View>
    </AnimatedGradientBackground>
  );
}

// ─── Section Icon Map ───

const SECTION_ICONS: Record<string, (props: { size: number; color: string }) => React.ReactElement> = {
  sun: ({ size, color }) => <Sun1 size={size} color={color} variant="Bold" />,
  weather: ({ size, color }) => <Sun1 size={size} color={color} variant="Bold" />,
  clock: ({ size, color }) => <Timer1 size={size} color={color} variant="Bold" />,
  best_times: ({ size, color }) => <Timer1 size={size} color={color} variant="Bold" />,
  people: ({ size, color }) => <People size={size} color={color} variant="Bold" />,
  culture: ({ size, color }) => <People size={size} color={color} variant="Bold" />,
  food: ({ size, color }) => <Reserve size={size} color={color} variant="Bold" />,
  shield: ({ size, color }) => <ShieldTick size={size} color={color} variant="Bold" />,
  safety: ({ size, color }) => <ShieldTick size={size} color={color} variant="Bold" />,
  warning: ({ size, color }) => <Warning2 size={size} color={color} variant="Bold" />,
  scams: ({ size, color }) => <Warning2 size={size} color={color} variant="Bold" />,
  car: ({ size, color }) => <Car size={size} color={color} variant="Bold" />,
  transport: ({ size, color }) => <Car size={size} color={color} variant="Bold" />,
  map: ({ size, color }) => <Map size={size} color={color} variant="Bold" />,
  neighborhoods: ({ size, color }) => <Map size={size} color={color} variant="Bold" />,
  document: ({ size, color }) => <DocumentText size={size} color={color} variant="Bold" />,
  visa: ({ size, color }) => <DocumentText size={size} color={color} variant="Bold" />,
  wifi: ({ size, color }) => <Wifi size={size} color={color} variant="Bold" />,
  connectivity: ({ size, color }) => <Wifi size={size} color={color} variant="Bold" />,
  wallet: ({ size, color }) => <Wallet2 size={size} color={color} variant="Bold" />,
  budget: ({ size, color }) => <Moneys size={size} color={color} variant="Bold" />,
  saving: ({ size, color }) => <Wallet2 size={size} color={color} variant="Bold" />,
  money: ({ size, color }) => <Wallet2 size={size} color={color} variant="Bold" />,
  language: ({ size, color }) => <LanguageSquare size={size} color={color} variant="Bold" />,
  nightlife: ({ size, color }) => <MusicPlaylist size={size} color={color} variant="Bold" />,
  social: ({ size, color }) => <MusicPlaylist size={size} color={color} variant="Bold" />,
};

function getSectionIcon(iconKey: string, sectionId: string) {
  return SECTION_ICONS[iconKey] || SECTION_ICONS[sectionId] || SECTION_ICONS['map'];
}

// ─── Expandable Intelligence Section ───

function IntelligenceSection({ section, tc }: { section: BriefSection; tc: any }) {
  const [expanded, setExpanded] = useState(false);
  const IconComponent = getSectionIcon(section.icon, section.id);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={toggle}
      style={[styles.intelSection, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}
    >
      <View style={styles.intelHeader}>
        <View style={[styles.intelIconWrap, { backgroundColor: `${tc.primary}12` }]}>
          {IconComponent({ size: 18, color: tc.primary })}
        </View>
        <Text style={[styles.intelTitle, { color: tc.textPrimary }]}>{section.title}</Text>
        <View style={[styles.intelChevron, { backgroundColor: `${tc.primary}12` }]}>
          {expanded
            ? <ArrowUp2 size={14} color={tc.primary} />
            : <ArrowDown2 size={14} color={tc.primary} />
          }
        </View>
      </View>
      {expanded && (
        <View style={styles.intelBody}>
          {section.items.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.intelItem,
                idx < section.items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tc.borderSubtle },
              ]}
            >
              <Text style={[styles.intelLabel, { color: tc.primary }]}>{item.label}</Text>
              <Text style={[styles.intelDetail, { color: tc.textSecondary }]}>{item.detail}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ───

export default function TripSnapshotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const params = useLocalSearchParams<{
    destination: string; country: string;
    startDate: string; endDate: string;
    adults: string; children: string; infants: string;
    originCity: string; nationality: string;
    topics: string;
  }>();

  const [snapshot, setSnapshot] = useState<TripSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const destination = params.destination || '';
  const nights = useMemo(() => {
    if (!params.startDate || !params.endDate) return 0;
    return Math.max(1, Math.round(
      (new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / 86400000
    ));
  }, [params.startDate, params.endDate]);

  const dateLabel = useMemo(() => {
    if (!params.startDate || !params.endDate) return '';
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const s = new Date(params.startDate).toLocaleDateString('en-US', opts);
    const e = new Date(params.endDate).toLocaleDateString('en-US', opts);
    return `${s} – ${e}`;
  }, [params.startDate, params.endDate]);

  const totalGuests = useMemo(() => {
    return (parseInt(params.adults || '1') + parseInt(params.children || '0') + parseInt(params.infants || '0'));
  }, [params.adults, params.children, params.infants]);

  const fetchSnapshot = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSnapshot(null);
      const selectedTopics = params.topics ? params.topics.split(',').filter(Boolean) : undefined;
      const data = await tripSnapshotService.generateSnapshot({
        destination,
        country: params.country,
        startDate: params.startDate!,
        endDate: params.endDate!,
        travelers: {
          adults: parseInt(params.adults || '1'),
          children: parseInt(params.children || '0'),
          infants: parseInt(params.infants || '0'),
        },
        originCity: params.originCity || undefined,
        nationality: params.nationality || 'US citizen',
        currency: 'USD',
        selectedTopics,
      });
      setSnapshot(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e.message || "We couldn't generate your trip snapshot. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [destination, params]);

  useEffect(() => {
    if (!destination || !params.startDate || !params.endDate) return;
    let cancelled = false;
    fetchSnapshot().then(() => { /* done */ });
    return () => { cancelled = true; };
  }, [destination, params.startDate, params.endDate, params.adults, params.children, params.infants, params.country]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.dismiss();
  }, [router]);

  const handleSearchFlights = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.dismiss();
  }, [router]);

  const handleFindHotels = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.dismiss();
  }, [router]);

  // ─── Loading State ───
  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <StatusBar style="light" />
        <TouchableOpacity
          onPress={handleClose}
          style={[styles.loadingCloseBtn, { top: insets.top + spacing.sm }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseCircle size={28} color="rgba(255,255,255,0.6)" variant="Bold" />
        </TouchableOpacity>
        <LoadingAnimation destination={destination} tc={tc} />
      </View>
    );
  }

  // ─── Error State ───
  if (error || !snapshot) {
    return (
      <View style={[styles.center, { backgroundColor: tc.background, paddingTop: insets.top }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Warning2 size={48} color={tc.textSecondary} variant="Bold" style={{ marginBottom: spacing.md }} />
        <Text style={[styles.loadingTitle, { color: tc.textPrimary }]}>Couldn't Load Snapshot</Text>
        <Text style={[{ fontSize: typography.fontSize.sm, marginTop: spacing.sm, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.xl }, { color: tc.textSecondary }]}>
          {error || "Something unexpected happened. Please try again."}
        </Text>
        <TouchableOpacity onPress={fetchSnapshot} style={[styles.retryBtn, { backgroundColor: tc.primary, marginTop: spacing.lg }]}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClose} style={{ marginTop: spacing.md, paddingVertical: spacing.sm }}>
          <Text style={{ color: tc.textSecondary, fontSize: typography.fontSize.sm }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { costEstimate: cost, flights, hotels, experiences, events, aiBrief } = snapshot;

  // ─── Main Content ───
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: tc.borderSubtle }]}>
        <View style={{ width: 44 }} />
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]} numberOfLines={1}>{destination}</Text>
          <Text style={[styles.headerSub, { color: tc.textSecondary }]}>
            {dateLabel} · {nights} nights · {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: tc.bgSunken }]}>
          <CloseCircle size={22} color={tc.textSecondary} variant="Bold" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── AI Overview Banner ─── */}
        {aiBrief?.overview && (
          <View style={[styles.overviewCard, { backgroundColor: `${tc.primary}08`, borderColor: `${tc.primary}20` }]}>
            <View style={styles.overviewHeader}>
              <View style={[styles.overviewBadge, { backgroundColor: `${tc.primary}15` }]}>
                <Magicpen size={14} color={tc.primary} variant="Bold" />
                <Text style={[styles.overviewBadgeText, { color: tc.primary }]}>AI Intelligence</Text>
              </View>
            </View>
            <Text style={[styles.overviewText, { color: tc.textPrimary }]}>{aiBrief.overview}</Text>
          </View>
        )}

        {/* ─── Cost Estimate Hero ─── */}
        <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: `${tc.primary}12` }]}>
              <MoneyRecive size={18} color={tc.primary} variant="Bold" />
            </View>
            <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>Estimated Trip Cost</Text>
          </View>
          <Text style={[styles.costRange, { color: tc.textPrimary }]}>
            ${cost.low.toLocaleString()} – ${cost.high.toLocaleString()}
          </Text>
          {cost.withinBudget !== undefined && (
            <View style={[styles.budgetBadge, { backgroundColor: cost.withinBudget ? `${tc.success}15` : `${tc.error}15` }]}>
              <Text style={{ color: cost.withinBudget ? tc.success : tc.error, fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold }}>
                {cost.withinBudget ? 'Within your budget' : 'Over budget'}
                {cost.budgetAmount ? ` ($${cost.budgetAmount.toLocaleString()})` : ''}
              </Text>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />
          <View style={styles.breakdownGrid}>
            {renderBreakdownRow('✈️  Flights (round trip)', cost.breakdown.flights, tc, true)}
            {renderBreakdownRow('🏨  Hotels', cost.breakdown.hotels, tc, true)}
            {renderBreakdownRow('🍜  Food & Dining', cost.breakdown.food, tc)}
            {renderBreakdownRow('🎯  Experiences', cost.breakdown.experiences, tc)}
            {renderBreakdownRow('🔧  Transport & Misc', cost.breakdown.miscellaneous, tc)}
          </View>
          {cost.perDayBudget && (
            <>
              <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />
              <View style={styles.perDayRow}>
                <Text style={[styles.perDayLabel, { color: tc.textSecondary }]}>Per day (excl. flights)</Text>
                <Text style={[styles.perDayValue, { color: tc.primary }]}>
                  ${cost.perDayBudget.low} – ${cost.perDayBudget.high}/day
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ─── Flights Preview ─── */}
        {flights && (
          <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: `${tc.primary}12` }]}>
                <Airplane size={18} color={tc.primary} variant="Bold" />
              </View>
              <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>Best Flights</Text>
              {flights.avgPrice > 0 && (
                <Text style={[styles.cardSubtitle, { color: tc.textTertiary }]}>avg ${flights.avgPrice}</Text>
              )}
            </View>
            {flights.cheapest && (
              <View style={[styles.flightRow, { borderColor: tc.borderSubtle }]}>
                <View style={[styles.flightTag, { backgroundColor: `${tc.success}12` }]}>
                  <Text style={[styles.flightTagText, { color: tc.success }]}>Cheapest</Text>
                </View>
                <View style={styles.flightContent}>
                  <Text style={[styles.flightPrice, { color: tc.textPrimary }]}>
                    ${flights.cheapest.price.toLocaleString()}
                  </Text>
                  <Text style={[styles.flightMeta, { color: tc.textSecondary }]}>
                    {flights.cheapest.airline} · {flights.cheapest.stops === 0 ? 'Direct' : `${flights.cheapest.stops} stop${flights.cheapest.stops > 1 ? 's' : ''}`} · {flights.cheapest.duration}
                  </Text>
                </View>
              </View>
            )}
            {flights.fastest && (
              <View style={styles.flightRow}>
                <View style={[styles.flightTag, { backgroundColor: `${tc.info}12` }]}>
                  <Text style={[styles.flightTagText, { color: tc.info }]}>Fastest</Text>
                </View>
                <View style={styles.flightContent}>
                  <Text style={[styles.flightPrice, { color: tc.textPrimary }]}>
                    ${flights.fastest.price.toLocaleString()}
                  </Text>
                  <Text style={[styles.flightMeta, { color: tc.textSecondary }]}>
                    {flights.fastest.airline} · {flights.fastest.stops === 0 ? 'Direct' : `${flights.fastest.stops} stop${flights.fastest.stops > 1 ? 's' : ''}`} · {flights.fastest.duration}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ─── Hotels Preview ─── */}
        {hotels && (hotels.budget || hotels.midRange || hotels.luxury) && (
          <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: `${tc.primary}12` }]}>
                <Building4 size={18} color={tc.primary} variant="Bold" />
              </View>
              <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>Where to Stay</Text>
            </View>
            <View style={styles.hotelGrid}>
              {hotels.budget && renderHotelTier('Budget', hotels.budget.avgPrice, 3, hotels.budget.count, tc)}
              {hotels.midRange && renderHotelTier('Mid-Range', hotels.midRange.avgPrice, 4, hotels.midRange.count, tc)}
              {hotels.luxury && renderHotelTier('Luxury', hotels.luxury.avgPrice, 5, hotels.luxury.count, tc)}
            </View>
          </View>
        )}

        {/* ─── Experiences Preview ─── */}
        {experiences.length > 0 && (
          <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: `${tc.primary}12` }]}>
                <Star1 size={18} color={tc.primary} variant="Bold" />
              </View>
              <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>
                Top Experiences
              </Text>
              <Text style={[styles.cardSubtitle, { color: tc.textTertiary }]}>
                {experiences.length} found
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {experiences.map((exp) => (
                <TouchableOpacity
                  key={exp.id}
                  style={[styles.expCard, { backgroundColor: tc.bgSunken, borderColor: tc.borderSubtle }]}
                  activeOpacity={0.8}
                  onPress={() => exp.bookingUrl && Linking.openURL(exp.bookingUrl)}
                >
                  {exp.image ? (
                    <Image source={{ uri: exp.image }} style={styles.expImage} />
                  ) : (
                    <View style={[styles.expImage, { backgroundColor: `${tc.primary}10` }]} />
                  )}
                  <View style={styles.expInfo}>
                    <Text style={[styles.expTitle, { color: tc.textPrimary }]} numberOfLines={2}>{exp.title}</Text>
                    <View style={styles.expMeta}>
                      <Star1 size={12} color="#FFBD2E" variant="Bold" />
                      <Text style={[styles.expMetaText, { color: tc.textSecondary }]}>
                        {exp.rating} ({exp.reviewCount})
                      </Text>
                    </View>
                    <View style={styles.expBottom}>
                      <View style={[styles.chip, { backgroundColor: tc.background }]}>
                        <Clock size={10} color={tc.textSecondary} />
                        <Text style={[styles.chipText, { color: tc.textSecondary }]}>{exp.duration}</Text>
                      </View>
                      <Text style={[styles.expPrice, { color: tc.primary }]}>${exp.price}</Text>
                    </View>
                    {exp.freeCancellation && (
                      <Text style={[styles.expFreeCancel, { color: tc.success }]}>Free cancellation</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── Events Preview ─── */}
        {events.length > 0 && (
          <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: `${tc.primary}12` }]}>
                <Calendar size={18} color={tc.primary} variant="Bold" />
              </View>
              <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>What's Happening</Text>
            </View>
            {events.slice(0, 5).map((evt, i) => (
              <View key={i} style={[styles.eventRow, i < Math.min(events.length, 5) - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tc.borderSubtle }]}>
                <View style={[styles.eventDot, { backgroundColor: tc.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventName, { color: tc.textPrimary }]}>{evt.name}</Text>
                  <Text style={[styles.eventMeta, { color: tc.textSecondary }]}>
                    {evt.category} · {evt.dateRange}{evt.isFree ? ' · Free' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── Destination Intelligence Sections ─── */}
        {aiBrief && aiBrief.sections?.length > 0 && (
          <View style={styles.intelContainer}>
            <View style={styles.intelSectionHeader}>
              <View style={[styles.intelSectionBadge, { backgroundColor: `${tc.primary}12` }]}>
                <Magicpen size={16} color={tc.primary} variant="Bold" />
              </View>
              <View>
                <Text style={[styles.intelSectionTitle, { color: tc.textPrimary }]}>Destination Guide</Text>
                <Text style={[styles.intelSectionSub, { color: tc.textSecondary }]}>
                  Tap any section to expand
                </Text>
              </View>
            </View>
            {aiBrief.sections.map((section) => (
              <IntelligenceSection key={section.id} section={section} tc={tc} />
            ))}
          </View>
        )}

        {/* ─── Trip Import Info Card ─── */}
        <View style={[styles.tripImportCard, { backgroundColor: `${tc.primary}08`, borderColor: `${tc.primary}18` }]}>
          <View style={[styles.tripImportIconWrap, { backgroundColor: `${tc.primary}14` }]}>
            <InfoCircle size={18} color={tc.primary} variant="Bold" />
          </View>
          <View style={styles.tripImportContent}>
            <Text style={[styles.tripImportTitle, { color: tc.textPrimary }]}>Your info is safe</Text>
            <Text style={[styles.tripImportText, { color: tc.textSecondary }]}>
              All of this will be available when you add this trip to your Trips tab. No need to save anything now.
            </Text>
          </View>
        </View>

        {/* ─── Powered By ─── */}
        <View style={styles.poweredBy}>
          <Magicpen size={12} color={tc.textTertiary} variant="Bold" />
          <Text style={[styles.poweredByText, { color: tc.textTertiary }]}>
            Powered by Guidera Engine
          </Text>
        </View>
      </ScrollView>

      {/* ─── Quick Actions ─── */}
      <View style={[styles.quickActions, { backgroundColor: tc.background, borderTopColor: tc.borderSubtle, paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: tc.primary }]}
          activeOpacity={0.8}
          onPress={handleSearchFlights}
        >
          <Airplane size={18} color={tc.white} />
          <Text style={styles.actionBtnText}>Search Flights</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: tc.borderSubtle, backgroundColor: tc.bgCard }]}
          activeOpacity={0.8}
          onPress={handleFindHotels}
        >
          <Building size={18} color={tc.textPrimary} />
          <Text style={[styles.actionBtnText, { color: tc.textPrimary }]}>Find Hotels</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Helper Renderers ───

function renderBreakdownRow(label: string, range: { low: number; high: number }, tc: any, alwaysShow = false) {
  if (!alwaysShow && range.low === 0 && range.high === 0) return null;
  return (
    <View key={label} style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, { color: tc.textSecondary }]}>{label}</Text>
      <Text style={[styles.breakdownValue, { color: tc.textPrimary }]}>
        ${range.low.toLocaleString()} – ${range.high.toLocaleString()}
      </Text>
    </View>
  );
}

function renderHotelTier(label: string, price: number, stars: number, count: number, tc: any) {
  return (
    <View key={label} style={[styles.hotelTier, { backgroundColor: tc.bgSunken, borderColor: tc.borderSubtle }]}>
      <Text style={[styles.hotelStars, { color: '#FFBD2E' }]}>
        {'★'.repeat(stars)}
      </Text>
      <Text style={[styles.hotelTierLabel, { color: tc.textPrimary }]}>{label}</Text>
      <Text style={[styles.hotelPrice, { color: tc.primary }]}>
        from ${price}
      </Text>
      <Text style={[styles.hotelPriceUnit, { color: tc.textTertiary }]}>per night</Text>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingWrapper: { flex: 1 },
  loadingFullScreen: {
    flex: 1, justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingBottom: 40,
  },
  loadingCenterBlock: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.xl, width: '100%',
  },
  loadingContainer: { alignItems: 'center', paddingHorizontal: spacing.xl },
  loadingTitle: {
    fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, textAlign: 'center',
    marginBottom: spacing.lg,
  },
  loadingStepContainer: { height: 40, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  loadingStepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingStepText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  progressBarTrack: {
    width: '75%', height: 6, borderRadius: 3, overflow: 'hidden',
    marginTop: spacing.sm, marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%', borderRadius: 3,
  },
  percentText: {
    fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold,
    color: 'rgba(255,255,255,0.85)', letterSpacing: 1, marginBottom: spacing.xs,
  },
  quoteContainer: {
    paddingHorizontal: spacing['2xl'], alignItems: 'center', paddingBottom: spacing.md,
  },
  quoteText: {
    fontSize: typography.fontSize.sm, fontStyle: 'italic', textAlign: 'center',
    lineHeight: 22, marginBottom: 6,
  },
  quoteAuthor: {
    fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold,
  },
  retryBtn: { marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 14 },
  retryText: { color: '#FFF', fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.base },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  loadingCloseBtn: { position: 'absolute', right: spacing.md, zIndex: 10, padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  headerSub: { fontSize: typography.fontSize.xs, marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: 14 },

  // Overview Banner
  overviewCard: {
    borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1.5,
  },
  overviewHeader: { marginBottom: spacing.sm },
  overviewBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  overviewBadgeText: { fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.bold, letterSpacing: 0.3 },
  overviewText: { fontSize: typography.fontSize.sm, lineHeight: 22, fontWeight: typography.fontWeight.medium },

  // Cards
  card: { borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, flex: 1 },
  cardSubtitle: { fontSize: typography.fontSize.xs },

  // Cost
  costRange: { fontSize: 28, fontWeight: typography.fontWeight.bold, marginBottom: spacing.sm },
  budgetBadge: {
    alignSelf: 'flex-start', paddingHorizontal: spacing.md,
    paddingVertical: 6, borderRadius: 10, marginBottom: spacing.sm,
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
  breakdownGrid: { gap: 8 },
  perDayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  perDayLabel: { fontSize: typography.fontSize.sm },
  perDayValue: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { fontSize: typography.fontSize.sm },
  breakdownValue: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },

  // Flights
  flightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  flightTag: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    minWidth: 70, alignItems: 'center',
  },
  flightTagText: { fontSize: typography.fontSize.captionSm, fontWeight: typography.fontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  flightContent: { flex: 1 },
  flightPrice: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  flightMeta: { fontSize: typography.fontSize.xs, marginTop: 1 },

  // Hotels
  hotelGrid: { flexDirection: 'row', gap: spacing.sm },
  hotelTier: {
    flex: 1, borderRadius: 14, padding: spacing.sm, alignItems: 'center',
    borderWidth: 1,
  },
  hotelStars: { fontSize: typography.fontSize.bodySm, marginBottom: 4 },
  hotelTierLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, marginBottom: 6 },
  hotelPrice: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  hotelPriceUnit: { fontSize: typography.fontSize.captionSm, marginTop: 1 },

  // Experiences
  expCard: { width: 190, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  expImage: { width: '100%', height: 110 },
  expInfo: { padding: spacing.sm },
  expTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, lineHeight: 17, marginBottom: 6 },
  expMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  expMetaText: { fontSize: typography.fontSize.caption },
  expBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  chipText: { fontSize: typography.fontSize.captionSm },
  expPrice: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  expFreeCancel: { fontSize: typography.fontSize.captionSm, fontWeight: typography.fontWeight.semibold, marginTop: 4 },

  // Events
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
  eventDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  eventName: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  eventMeta: { fontSize: typography.fontSize.xs, marginTop: 2 },

  // Intelligence Sections
  intelContainer: { gap: 10 },
  intelSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: 4, paddingHorizontal: 2,
  },
  intelSectionBadge: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  intelSectionTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  intelSectionSub: { fontSize: typography.fontSize.xs, marginTop: 1 },

  intelSection: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  intelHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  intelIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  intelTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, flex: 1 },
  intelChevron: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  intelBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  intelItem: { paddingVertical: 10 },
  intelLabel: { fontSize: typography.fontSize.bodySm, fontWeight: typography.fontWeight.bold, marginBottom: 3, letterSpacing: 0.2 },
  intelDetail: { fontSize: typography.fontSize.sm, lineHeight: 20 },

  // Powered By
  // Trip Import Info Card
  tripImportCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1,
  },
  tripImportIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  tripImportContent: { flex: 1 },
  tripImportTitle: {
    fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, marginBottom: 3,
  },
  tripImportText: {
    fontSize: typography.fontSize.xs, lineHeight: 18,
  },

  poweredBy: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: spacing.md,
  },
  poweredByText: { fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.medium },

  // Quick Actions
  quickActions: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.md, borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: 15, borderRadius: 16,
  },
  actionBtnOutline: { borderWidth: 1 },
  actionBtnText: { color: '#FFF', fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm },
});
