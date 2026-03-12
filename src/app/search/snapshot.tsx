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
  Animated, Image, Linking, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft, Airplane, Building, Building4, Star1, Calendar,
  Clock, Magicpen, MoneyRecive, ArrowDown2, ArrowUp2,
  Sun1, People, Reserve, ShieldTick, Car, Map, Wallet2, LanguageSquare,
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

// ─── Dynamic Loading Messages ───

const LOADING_STEPS = [
  { icon: '✈️', text: 'Searching for the best flights...' },
  { icon: '🏨', text: 'Finding places to stay...' },
  { icon: '🎯', text: 'Discovering top experiences...' },
  { icon: '📅', text: 'Checking local events & happenings...' },
  { icon: '💰', text: 'Calculating your trip budget...' },
  { icon: '🤖', text: 'Asking AI for destination insights...' },
  { icon: '🍜', text: 'Gathering food & dining tips...' },
  { icon: '🛡️', text: 'Reviewing safety information...' },
  { icon: '🗺️', text: 'Mapping out best neighborhoods...' },
  { icon: '🌤️', text: 'Checking weather conditions...' },
  { icon: '💡', text: 'Putting together money-saving tips...' },
  { icon: '📦', text: 'Packaging everything together...' },
  { icon: '✨', text: 'Almost there, polishing your trip brief...' },
];

function LoadingAnimation({ destination, tc }: { destination: string; tc: any }) {
  const [stepIndex, setStepIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Rotate through steps every 2.2 seconds with fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out + slide up
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -8, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
        slideAnim.setValue(8);
        // Fade in + slide down
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [fadeAnim, slideAnim]);

  // Pulse animation on icon
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const step = LOADING_STEPS[stepIndex];

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[styles.loadingPulseWrap, { backgroundColor: `${tc.primary}12`, transform: [{ scale: pulseAnim }] }]}
      >
        <Magicpen size={32} color={tc.primary} variant="Bold" />
      </Animated.View>

      <Text style={[styles.loadingTitle, { color: tc.textPrimary }]}>
        Analyzing {destination}
      </Text>

      <View style={styles.loadingStepContainer}>
        <Animated.View
          style={[
            styles.loadingStepRow,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.loadingStepIcon}>{step.icon}</Text>
          <Text style={[styles.loadingStepText, { color: tc.textSecondary }]}>{step.text}</Text>
        </Animated.View>
      </View>

      {/* Progress dots */}
      <View style={styles.loadingDots}>
        {LOADING_STEPS.slice(0, 6).map((_, i) => (
          <View
            key={i}
            style={[
              styles.loadingDot,
              { backgroundColor: i <= stepIndex % 6 ? tc.primary : `${tc.textTertiary}30` },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Section Icon Map ───

const SECTION_ICONS: Record<string, (props: { size: number; color: string }) => React.ReactElement> = {
  sun: ({ size, color }) => <Sun1 size={size} color={color} variant="Bold" />,
  weather: ({ size, color }) => <Sun1 size={size} color={color} variant="Bold" />,
  people: ({ size, color }) => <People size={size} color={color} variant="Bold" />,
  culture: ({ size, color }) => <People size={size} color={color} variant="Bold" />,
  food: ({ size, color }) => <Reserve size={size} color={color} variant="Bold" />,
  shield: ({ size, color }) => <ShieldTick size={size} color={color} variant="Bold" />,
  safety: ({ size, color }) => <ShieldTick size={size} color={color} variant="Bold" />,
  car: ({ size, color }) => <Car size={size} color={color} variant="Bold" />,
  transport: ({ size, color }) => <Car size={size} color={color} variant="Bold" />,
  map: ({ size, color }) => <Map size={size} color={color} variant="Bold" />,
  neighborhoods: ({ size, color }) => <Map size={size} color={color} variant="Bold" />,
  wallet: ({ size, color }) => <Wallet2 size={size} color={color} variant="Bold" />,
  money: ({ size, color }) => <Wallet2 size={size} color={color} variant="Bold" />,
  language: ({ size, color }) => <LanguageSquare size={size} color={color} variant="Bold" />,
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

  useEffect(() => {
    if (!destination || !params.startDate || !params.endDate) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
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
          currency: 'USD',
        });
        if (!cancelled) setSnapshot(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load snapshot');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [destination, params.startDate, params.endDate, params.adults, params.children, params.infants, params.country]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
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
      <View style={[styles.center, { backgroundColor: tc.background, paddingTop: insets.top }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LoadingAnimation destination={destination} tc={tc} />
      </View>
    );
  }

  // ─── Error State ───
  if (error || !snapshot) {
    return (
      <View style={[styles.center, { backgroundColor: tc.background, paddingTop: insets.top }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Text style={[styles.loadingTitle, { color: tc.textPrimary }]}>Something went wrong</Text>
        <Text style={[{ fontSize: typography.fontSize.sm, marginTop: spacing.sm, textAlign: 'center', lineHeight: 20 }, { color: tc.textSecondary }]}>{error}</Text>
        <TouchableOpacity onPress={handleBack} style={[styles.retryBtn, { backgroundColor: tc.primary }]}>
          <Text style={styles.retryText}>Go Back</Text>
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
        <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { backgroundColor: tc.bgSunken }]}>
          <ArrowLeft size={20} color={tc.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]} numberOfLines={1}>{destination}</Text>
          <Text style={[styles.headerSub, { color: tc.textSecondary }]}>
            {dateLabel} · {nights} nights · {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={{ width: 36 }} />
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
              <Text style={{ color: cost.withinBudget ? tc.success : tc.error, fontSize: 13, fontWeight: '600' }}>
                {cost.withinBudget ? 'Within your budget' : 'Over budget'}
                {cost.budgetAmount ? ` ($${cost.budgetAmount.toLocaleString()})` : ''}
              </Text>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />
          <View style={styles.breakdownGrid}>
            {renderBreakdownRow('Flights', cost.breakdown.flights, tc)}
            {renderBreakdownRow('Hotels', cost.breakdown.hotels, tc)}
            {renderBreakdownRow('Experiences', cost.breakdown.experiences, tc)}
            {renderBreakdownRow('Food & Daily', cost.breakdown.food, tc)}
          </View>
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

        {/* ─── Powered By ─── */}
        <View style={styles.poweredBy}>
          <Magicpen size={12} color={tc.textTertiary} variant="Bold" />
          <Text style={[styles.poweredByText, { color: tc.textTertiary }]}>
            Powered by Guidera AI
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
          <Airplane size={18} color="#FFF" />
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

function renderBreakdownRow(label: string, range: { low: number; high: number }, tc: any) {
  if (range.low === 0 && range.high === 0) return null;
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
  loadingContainer: { alignItems: 'center', paddingHorizontal: spacing.xl },
  loadingPulseWrap: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
  },
  loadingTitle: { fontSize: typography.fontSize.xl, fontWeight: '700', textAlign: 'center', marginBottom: spacing.xl },
  loadingStepContainer: { height: 40, justifyContent: 'center', alignItems: 'center' },
  loadingStepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingStepIcon: { fontSize: 22 },
  loadingStepText: { fontSize: typography.fontSize.sm, fontWeight: '500' },
  loadingDots: {
    flexDirection: 'row', gap: 6, marginTop: spacing.xl,
  },
  loadingDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  retryBtn: { marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 14 },
  retryText: { color: '#FFF', fontWeight: '600', fontSize: typography.fontSize.base },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' },
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
  overviewBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  overviewText: { fontSize: typography.fontSize.sm, lineHeight: 22, fontWeight: '500' },

  // Cards
  card: { borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: typography.fontSize.base, fontWeight: '700', flex: 1 },
  cardSubtitle: { fontSize: typography.fontSize.xs },

  // Cost
  costRange: { fontSize: 28, fontWeight: '800', marginBottom: spacing.sm },
  budgetBadge: {
    alignSelf: 'flex-start', paddingHorizontal: spacing.md,
    paddingVertical: 6, borderRadius: 10, marginBottom: spacing.sm,
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
  breakdownGrid: { gap: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { fontSize: typography.fontSize.sm },
  breakdownValue: { fontSize: typography.fontSize.sm, fontWeight: '600' },

  // Flights
  flightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  flightTag: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    minWidth: 70, alignItems: 'center',
  },
  flightTagText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  flightContent: { flex: 1 },
  flightPrice: { fontSize: typography.fontSize.base, fontWeight: '700' },
  flightMeta: { fontSize: typography.fontSize.xs, marginTop: 1 },

  // Hotels
  hotelGrid: { flexDirection: 'row', gap: spacing.sm },
  hotelTier: {
    flex: 1, borderRadius: 14, padding: spacing.sm, alignItems: 'center',
    borderWidth: 1,
  },
  hotelStars: { fontSize: 12, marginBottom: 4 },
  hotelTierLabel: { fontSize: typography.fontSize.xs, fontWeight: '700', marginBottom: 6 },
  hotelPrice: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  hotelPriceUnit: { fontSize: 10, marginTop: 1 },

  // Experiences
  expCard: { width: 190, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  expImage: { width: '100%', height: 110 },
  expInfo: { padding: spacing.sm },
  expTitle: { fontSize: typography.fontSize.xs, fontWeight: '600', lineHeight: 17, marginBottom: 6 },
  expMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  expMetaText: { fontSize: 11 },
  expBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  chipText: { fontSize: 10 },
  expPrice: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  expFreeCancel: { fontSize: 10, fontWeight: '600', marginTop: 4 },

  // Events
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
  eventDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  eventName: { fontSize: typography.fontSize.sm, fontWeight: '600' },
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
  intelSectionTitle: { fontSize: typography.fontSize.base, fontWeight: '700' },
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
  intelTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', flex: 1 },
  intelChevron: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  intelBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  intelItem: { paddingVertical: 10 },
  intelLabel: { fontSize: 12, fontWeight: '700', marginBottom: 3, letterSpacing: 0.2 },
  intelDetail: { fontSize: typography.fontSize.sm, lineHeight: 20 },

  // Powered By
  poweredBy: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: spacing.md,
  },
  poweredByText: { fontSize: 11, fontWeight: '500' },

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
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: typography.fontSize.sm },
});
