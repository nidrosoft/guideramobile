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
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
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
  TripSnapshotLiveData,
  EventPreview,
  BriefSection,
  DestinationIntelligence,
  formatGuideFreshness,
  normalizeCostEstimate,
} from '@/services/tripSnapshot.service';
import { SNAPSHOT_COST_ICONS } from '@/data/snapshotCostIcons';
import { useSearchOverlayStore } from '@/stores/useSearchOverlayStore';
import { captureTripSnapshot, TourAnchor, useGuidance, registerActionHandler } from '@/features/guidance';

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

function LoadingAnimation({
  destination,
  tc,
  progressTarget = 0.92,
}: {
  destination: string;
  tc: any;
  progressTarget?: number;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * PATIENCE_QUOTES.length));
  const [percentText, setPercentText] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const quoteFadeAnim = useRef(new Animated.Value(1)).current;

  // Progress bar — milestone-driven from parent, with gentle animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressTarget,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [progressTarget, progressAnim]);

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
  calendar: ({ size, color }) => <Calendar size={size} color={color} variant="Bold" />,
};

function getSectionIcon(iconKey: string, sectionId: string) {
  return SECTION_ICONS[iconKey] || SECTION_ICONS[sectionId] || SECTION_ICONS['map'];
}

function sanitizeOverviewText(text: string): string {
  return text
    .replace(/^#+\s.*(?:\n+|$)/, '')
    .replace(/\*\*/g, '')
    .trim();
}

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+["']?/g);
  return (matches && matches.length > 0 ? matches : [text])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function formatOverviewSections(text?: string) {
  const clean = sanitizeOverviewText(text || '');
  if (!clean) return null;

  const sentences = splitSentences(clean);
  if (sentences.length <= 3) {
    return { intro: clean, sections: [] as { title: string; body: string }[] };
  }

  const intro = sentences[0];
  const bodySentences = sentences.slice(1);
  const titles = ['Trip feel', 'Local highlights', 'Practical notes'];
  const chunkSize = Math.ceil(bodySentences.length / Math.min(3, bodySentences.length));
  const sections = titles
    .map((title, index) => {
      const chunk = bodySentences.slice(index * chunkSize, (index + 1) * chunkSize);
      return chunk.length ? { title, body: chunk.join(' ') } : null;
    })
    .filter(Boolean) as { title: string; body: string }[];

  return { intro, sections };
}

function buildWhatsHappeningSection(events: EventPreview[], cachedAt?: string): BriefSection | null {
  if (!events.length) return null;

  return {
    id: 'whats_happening',
    icon: 'calendar',
    title: "What's Happening",
    cachedAt,
    items: events.slice(0, 5).map((event) => ({
      label: event.name,
      detail: [
        `${event.category} · ${event.dateRange}${event.isFree ? ' · Free' : ''}${event.venue ? ` · ${event.venue}` : ''}.`,
        event.description,
      ].filter(Boolean).join(' '),
    })),
  };
}

function orderGuideSections(sections: BriefSection[], selectedTopics: string[]): BriefSection[] {
  const byId = new globalThis.Map(sections.map((section) => [section.id, section]));
  const ordered = selectedTopics
    .map((topicId) => byId.get(topicId))
    .filter(Boolean) as BriefSection[];
  const extras = sections.filter((section) => !selectedTopics.includes(section.id));
  return [...ordered, ...extras];
}

// ─── Expandable Intelligence Section ───

function IntelligenceSection({ section, tc }: { section: BriefSection; tc: any }) {
  const [expanded, setExpanded] = useState(false);
  const IconComponent = getSectionIcon(section.icon, section.id);
  const freshness = formatGuideFreshness(section.cachedAt);

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
        <View style={{ flex: 1 }}>
          <Text style={[styles.intelTitle, { color: tc.textPrimary }]}>{section.title}</Text>
          {freshness && (
            <Text style={[styles.intelFreshness, { color: tc.textTertiary }]} numberOfLines={1}>
              {freshness}
            </Text>
          )}
        </View>
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

function GuideSectionPlaceholder({ tc, remainingCount }: { tc: any; remainingCount: number }) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={[styles.guidePlaceholder, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
      <View style={styles.guidePlaceholderHeader}>
        <View style={[styles.guidePlaceholderIcon, { backgroundColor: `${tc.primary}12` }]}>
          <Magicpen size={16} color={tc.primary} variant="Bold" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.guidePlaceholderTitle, { color: tc.textPrimary }]}>
            {remainingCount === 1 ? 'Next section is loading' : `${remainingCount} more sections are loading`}
          </Text>
          <Text style={[styles.guidePlaceholderSub, { color: tc.textTertiary }]}>
            Fresh guide content will appear here as soon as it is ready.
          </Text>
        </View>
      </View>
      <Animated.View style={{ opacity: pulse }}>
        <View style={[styles.shimmerLine, { width: '86%', backgroundColor: `${tc.primary}12` }]} />
        <View style={[styles.shimmerLine, { width: '68%', backgroundColor: `${tc.primary}10` }]} />
      </Animated.View>
    </View>
  );
}

// ─── Main Screen ───

export default function TripSnapshotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const guidance = useGuidance();

  // Snapshot tour: scroll the page to a section anchor before it's spotlighted.
  const scrollViewRef = useRef<ScrollView>(null);
  const contentCardY = useRef(0);
  const sectionY = useRef<Record<string, number>>({});

  useEffect(() => {
    const off = registerActionHandler('scrollToAnchor', async (anchorId: string) => {
      const rel = sectionY.current[anchorId];
      if (rel === undefined) return; // above the fold (overview) — no scroll
      const y = Math.max(0, contentCardY.current + rel - 90);
      scrollViewRef.current?.scrollTo({ y, animated: true });
      await new Promise<void>((r) => setTimeout(r, 450));
    });
    return () => { off(); };
  }, []);

  const onSectionLayout = (anchorId: string) => (e: any) => {
    sectionY.current[anchorId] = e.nativeEvent.layout.y;
  };

  useFocusEffect(
    useCallback(() => {
      guidance.maybeStartTour('snapshot');
    }, [guidance])
  );
  const params = useLocalSearchParams<{
    destination: string; country: string;
    startDate: string; endDate: string;
    adults: string; children: string; infants: string;
    originCity: string; nationality: string;
    topics: string;
  }>();

  const [liveData, setLiveData] = useState<TripSnapshotLiveData | null>(null);
  const [aiBrief, setAiBrief] = useState<DestinationIntelligence | null>(null);
  const [loadingLive, setLoadingLive] = useState(true);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0.15);
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

  const destinationLabel = useMemo(() => {
    if (params.country) return `${destination}, ${params.country}`;
    return destination;
  }, [destination, params.country]);

  const selectedTopics = useMemo(() => (
    params.topics
      ? params.topics.split(',').filter(Boolean)
      : ['safety', 'visa_entry', 'food', 'arrival']
  ), [params.topics]);

  const aiSelectedTopics = useMemo(
    () => selectedTopics.filter((topicId) => topicId !== 'whats_happening'),
    [selectedTopics],
  );

  const fetchSnapshot = useCallback(async () => {
    captureTripSnapshot({
      originCity: params.originCity || undefined,
      passportCountry: params.nationality || undefined,
      interests: selectedTopics.length ? selectedTopics : undefined,
    });
    let receivedLiveData = false;
    try {
      setLoadingLive(true);
      setLoadingBrief(false);
      setError(null);
      setLiveData(null);
      setAiBrief(null);
      setLoadProgress(0.18);

      const requestBase = {
        destination,
        country: params.country || undefined,
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
      };

      const data = await tripSnapshotService.fetchLiveData(requestBase);
      receivedLiveData = true;
      setLiveData(data);
      setLoadingLive(false);
      setLoadProgress(0.55);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (aiSelectedTopics.length > 0) {
        setLoadingBrief(true);
        setLoadProgress(0.62);

        await tripSnapshotService.streamBrief(
          { ...requestBase, selectedTopics: aiSelectedTopics, costEstimate: data.costEstimate },
          {
            onOverview: (overview, cachedAt) => {
              setAiBrief((prev) => ({
                overview,
                overviewCachedAt: cachedAt,
                sections: prev?.sections || [],
              }));
              setLoadProgress((p) => Math.max(p, 0.7));
            },
            onOverviewDelta: (delta) => {
              setAiBrief((prev) => ({
                overview: (prev?.overview || '') + delta,
                overviewCachedAt: prev?.overviewCachedAt,
                sections: prev?.sections || [],
              }));
              setLoadProgress((p) => Math.max(p, 0.65));
            },
            onSection: (section) => {
              setAiBrief((prev) => {
                const existing = prev?.sections || [];
                if (existing.some((s) => s.id === section.id)) return prev!;
                return {
                  overview: prev?.overview || '',
                  overviewCachedAt: prev?.overviewCachedAt,
                  sections: [...existing, section],
                };
              });
              setLoadProgress((p) => Math.min(0.95, p + 0.06));
            },
            onError: (e) => {
              if (__DEV__) console.warn('[TripSnapshot] Brief stream error:', e.message);
            },
            onDone: () => {
              setLoadingBrief(false);
              setLoadProgress(1);
            },
          },
        );
      } else {
        setLoadingBrief(false);
        setLoadProgress(1);
      }
    } catch (e: any) {
      if (!receivedLiveData) {
        setError(e.message || "We couldn't generate your trip snapshot. Please try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (__DEV__) {
        console.warn('[TripSnapshot] Live data loaded but brief failed:', e.message);
      }
      setLoadingLive(false);
      setLoadingBrief(false);
    }
  }, [destination, params, selectedTopics, aiSelectedTopics]);

  useEffect(() => {
    if (!destination || !params.startDate || !params.endDate) return;
    let cancelled = false;
    fetchSnapshot().then(() => { /* done */ });
    return () => { cancelled = true; };
  }, [destination, params.startDate, params.endDate, params.adults, params.children, params.infants, params.country, params.topics, params.originCity, params.nationality]);

  useEffect(() => {
    if (!loadingLive || liveData) return;
    const interval = setInterval(() => {
      setLoadProgress((p) => Math.min(0.5, p + 0.04));
    }, 1200);
    return () => clearInterval(interval);
  }, [loadingLive, liveData]);

  const requestSearchReset = useSearchOverlayStore((s) => s.requestReset);

  const dismissSnapshot = useCallback(() => {
    requestSearchReset();
    router.dismiss();
  }, [router, requestSearchReset]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismissSnapshot();
  }, [dismissSnapshot]);

  const handleSearchFlights = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dismissSnapshot();
  }, [dismissSnapshot]);

  const handleFindHotels = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dismissSnapshot();
  }, [dismissSnapshot]);

  const cost = useMemo(
    () => normalizeCostEstimate(liveData?.costEstimate),
    [liveData?.costEstimate],
  );
  const overviewFreshness = formatGuideFreshness(aiBrief?.overviewCachedAt);

  // ─── Loading State (Phase A only) ───
  if (loadingLive && !liveData) {
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
        <LoadingAnimation destination={destinationLabel} tc={tc} progressTarget={loadProgress} />
      </View>
    );
  }

  // ─── Error State ───
  if (error || !liveData) {
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

  const { flights, hotels, experiences, events } = liveData;
  const whatsHappeningSection = selectedTopics.includes('whats_happening')
    ? buildWhatsHappeningSection(events, liveData.generatedAt)
    : null;
  const guideSections = orderGuideSections(
    [
      ...(aiBrief?.sections || []),
      ...(whatsHappeningSection ? [whatsHappeningSection] : []),
    ],
    selectedTopics,
  );
  const streamedAiSectionCount = (aiBrief?.sections || [])
    .filter((section) => aiSelectedTopics.includes(section.id)).length;
  const showGuidePlaceholder = loadingBrief && streamedAiSectionCount < aiSelectedTopics.length;
  const overviewSections = formatOverviewSections(aiBrief?.overview);

  // ─── Main Content ───
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: tc.borderSubtle }]}>
        <View style={{ width: 44 }} />
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]} numberOfLines={1}>{destinationLabel}</Text>
          <Text style={[styles.headerSub, { color: tc.textSecondary }]}>
            {dateLabel} · {nights} nights · {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: tc.bgSunken }]}>
          <CloseCircle size={22} color={tc.textSecondary} variant="Bold" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── AI Overview Banner ─── */}
        {(aiBrief?.overview || loadingBrief) && (
          <TourAnchor id="snapshot.overview">
          <View style={[styles.overviewCard, { backgroundColor: `${tc.primary}08`, borderColor: `${tc.primary}20` }]}>
            <View style={styles.overviewHeader}>
              <View style={[styles.overviewBadge, { backgroundColor: `${tc.primary}15` }]}>
                <Magicpen size={14} color={tc.primary} variant="Bold" />
                <Text style={[styles.overviewBadgeText, { color: tc.primary }]}>AI Intelligence</Text>
              </View>
              {overviewFreshness && (
                <Text style={[styles.overviewFreshness, { color: tc.textTertiary }]}>{overviewFreshness}</Text>
              )}
            </View>
            {overviewSections ? (
              <View style={styles.overviewContent}>
                <Text style={[styles.overviewText, { color: tc.textPrimary }]}>
                  {overviewSections.intro}
                </Text>
                {overviewSections.sections.map((section) => (
                  <View key={section.title} style={[styles.overviewMiniSection, { backgroundColor: `${tc.primary}06`, borderColor: `${tc.primary}14` }]}>
                    <Text style={[styles.overviewMiniTitle, { color: tc.primary }]}>{section.title}</Text>
                    <Text style={[styles.overviewMiniText, { color: tc.textSecondary }]}>{section.body}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.overviewText, { color: tc.textPrimary }]}>
                Analyzing your destination…
              </Text>
            )}
            {loadingBrief && !aiBrief?.overviewCachedAt && (
              <Text style={[styles.overviewStreamingHint, { color: tc.textTertiary }]}>
                Writing your guide…
              </Text>
            )}
          </View>
          </TourAnchor>
        )}

        {loadingBrief && (!aiBrief?.sections || aiBrief.sections.length === 0) && (
          <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
            <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>Building your destination guide…</Text>
            <Text style={[{ color: tc.textSecondary, marginTop: spacing.xs, fontSize: typography.fontSize.sm }]}>
              Cached sections appear instantly; new topics may take a moment.
            </Text>
          </View>
        )}

        {/* ─── Cost Estimate Hero ─── */}
        <TourAnchor id="snapshot.cost" onLayout={onSectionLayout('snapshot.cost')} style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: `${tc.primary}12` }]}>
              <MoneyRecive size={18} color={tc.primary} variant="Bold" />
            </View>
            <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>Estimated Trip Cost</Text>
          </View>
          <Text style={[styles.costRange, { color: tc.textPrimary }]}>
            ${(cost.low ?? 0).toLocaleString()} – ${(cost.high ?? 0).toLocaleString()}
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
            {renderBreakdownRow('flights', 'Flights (round trip)', cost.breakdown.flights, tc, true)}
            {renderBreakdownRow('hotels', `Hotels (${nights} nights)`, cost.breakdown.hotels, tc, true, nights, 'night')}
            {renderBreakdownRow('food', `Food & Dining (${nights} days)`, cost.breakdown.food, tc, false, nights, 'day')}
            {renderBreakdownRow('experiences', 'Experiences', cost.breakdown.experiences, tc)}
            {renderBreakdownRow('miscellaneous', `Transport & Misc (${nights} days)`, cost.breakdown.miscellaneous, tc, false, nights, 'day')}
          </View>
          {cost.perDayBudget && (
            <>
              <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />
              <View style={styles.perDayRow}>
                <Text style={[styles.perDayLabel, { color: tc.textSecondary }]}>Per day (excl. flights)</Text>
                <Text style={[styles.perDayValue, { color: tc.primary }]}>
                  ${(cost.perDayBudget?.low ?? 0).toLocaleString()} – ${(cost.perDayBudget?.high ?? 0).toLocaleString()}/day
                </Text>
              </View>
            </>
          )}
        </TourAnchor>

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
            {([
              { key: 'cheapest', label: 'Cheapest', color: tc.success, flight: flights.cheapest },
              { key: 'fastest', label: 'Fastest', color: tc.info, flight: flights.fastest },
              { key: 'premium', label: 'Premium', color: '#8B5CF6', flight: flights.premium },
            ] as const).map((row, index) => (
              row.flight ? (
                <React.Fragment key={row.key}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />}
                  <View style={styles.flightRow}>
                    <View style={[styles.flightTag, { backgroundColor: `${row.color}12` }]}>
                      <Text style={[styles.flightTagText, { color: row.color }]}>{row.label}</Text>
                    </View>
                    <View style={styles.flightContent}>
                      <Text style={[styles.flightPrice, { color: tc.textPrimary }]}>
                        ${(row.flight?.price ?? 0).toLocaleString()}
                      </Text>
                      <Text style={[styles.flightMeta, { color: tc.textSecondary }]}>
                        {row.flight.airline} · {row.flight.stops === 0 ? 'Direct' : `${row.flight.stops} stop${row.flight.stops > 1 ? 's' : ''}`} · {row.flight.duration}
                        {row.flight.cabin ? ` · ${row.flight.cabin}` : ''}
                      </Text>
                    </View>
                  </View>
                </React.Fragment>
              ) : null
            ))}
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

        {/* ─── Destination Intelligence Sections ─── */}
        {(guideSections.length > 0 || showGuidePlaceholder) && (
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
            {guideSections.map((section) => (
              <IntelligenceSection key={section.id} section={section} tc={tc} />
            ))}
            {showGuidePlaceholder && (
              <GuideSectionPlaceholder tc={tc} remainingCount={Math.max(1, aiSelectedTopics.length - streamedAiSectionCount)} />
            )}
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
        <TourAnchor id="snapshot.cta" style={{ flex: 1 }}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: tc.primary }]}
            activeOpacity={0.8}
            onPress={handleSearchFlights}
          >
            <Airplane size={18} color={tc.white} />
            <Text style={styles.actionBtnText}>Search Flights</Text>
          </TouchableOpacity>
        </TourAnchor>
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

function safeCostRange(range?: { low?: number; high?: number } | null) {
  const low = typeof range?.low === 'number' && Number.isFinite(range.low) ? range.low : 0;
  const high = typeof range?.high === 'number' && Number.isFinite(range.high) ? range.high : 0;
  return { low, high };
}

function renderBreakdownRow(
  iconKey: keyof typeof SNAPSHOT_COST_ICONS,
  label: string,
  range: { low?: number; high?: number } | null | undefined,
  tc: any,
  alwaysShow = false,
  nightsForPerDay?: number,
  unit: 'day' | 'night' = 'day',
) {
  const safeRange = safeCostRange(range);
  if (!alwaysShow && safeRange.low === 0 && safeRange.high === 0) return null;
  const iconDef = SNAPSHOT_COST_ICONS[iconKey];
  if (!iconDef?.icon) return null;
  const Icon = iconDef.icon;
  const perDayHint = nightsForPerDay && nightsForPerDay > 0
    ? `~$${Math.round(safeRange.low / nightsForPerDay)}–$${Math.round(safeRange.high / nightsForPerDay)}/${unit}`
    : '';
  return (
    <View key={iconKey} style={styles.breakdownRow}>
      <View style={styles.breakdownLabelWrap}>
        <View style={[styles.breakdownIconWrap, { backgroundColor: iconDef.bgColor }]}>
          <Icon size={16} color={iconDef.color} variant="Bold" />
        </View>
        <Text style={[styles.breakdownLabel, { color: tc.textSecondary }]}>{label}</Text>
      </View>
      <View style={styles.breakdownValueCol}>
        <Text style={[styles.breakdownValue, { color: tc.textPrimary }]}>
          ${safeRange.low.toLocaleString()} – ${safeRange.high.toLocaleString()}
        </Text>
        {!!perDayHint && (
          <Text style={[styles.breakdownPerDayHint, { color: tc.textTertiary }]}>{perDayHint}</Text>
        )}
      </View>
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
  overviewHeader: { marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  overviewFreshness: { fontSize: typography.fontSize.caption, flexShrink: 1 },
  overviewBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  overviewBadgeText: { fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.bold, letterSpacing: 0.3 },
  overviewContent: { gap: spacing.sm },
  overviewText: { fontSize: typography.fontSize.sm, lineHeight: 22, fontWeight: typography.fontWeight.medium, flexShrink: 1, width: '100%' },
  overviewMiniSection: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  overviewMiniTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  overviewMiniText: { fontSize: typography.fontSize.sm, lineHeight: 21 },
  overviewStreamingHint: { fontSize: typography.fontSize.caption, marginTop: spacing.xs, fontStyle: 'italic' },

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
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  breakdownLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, paddingRight: spacing.sm },
  breakdownIconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  breakdownLabel: { fontSize: typography.fontSize.sm, flexShrink: 1 },
  breakdownValueCol: { alignItems: 'flex-end', flexShrink: 0 },
  breakdownValue: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, textAlign: 'right' },
  breakdownPerDayHint: { fontSize: typography.fontSize.caption, marginTop: 2, textAlign: 'right' },

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
  intelTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  intelFreshness: { fontSize: typography.fontSize.caption, marginTop: 2 },
  intelChevron: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  intelBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  intelItem: { paddingVertical: 10 },
  intelLabel: { fontSize: typography.fontSize.bodySm, fontWeight: typography.fontWeight.bold, marginBottom: 3, letterSpacing: 0.2 },
  intelDetail: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  guidePlaceholder: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  guidePlaceholderHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  guidePlaceholderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidePlaceholderTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  guidePlaceholderSub: { fontSize: typography.fontSize.caption, marginTop: 2 },
  shimmerLine: { height: 9, borderRadius: 999, marginTop: 8 },

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
