/**
 * FLIGHT DEAL SCREEN
 *
 * Replaces FlightCheckoutScreen. Shows flight deal summary
 * with price info, deal badges, and "Book on [Provider]" redirect.
 * No payment, no traveler details — user books on external platform.
 */

import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { borderRadius as br, spacing } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { useDealRedirect, useIsDealSaved, usePriceHistory } from '@/hooks/useDeals';
import { useHasAlert } from '@/hooks/usePriceAlerts';
import { saveDeal, buildFlightRouteKey } from '@/services/deal';
import { createPriceAlert } from '@/services/deal';
import type { DealSnapshot } from '@/services/deal';
import type { Flight } from '../../../types/flight.types';
import { useFlightStore } from '../../../stores/useFlightStore';
import {
  BookOnProviderButton,
  PriceAlertButton,
  PriceHistoryChart,
  DealBadge,
} from '../../../components/shared';

interface FlightDealScreenProps {
  flight: Flight;
  onBack: () => void;
  onClose: () => void;
}

export default function FlightDealScreen({
  flight,
  onBack,
  onClose,
}: FlightDealScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { redirect } = useDealRedirect();
  const flightStore = useFlightStore();

  const [isSaved, setIsSaved] = useState(false);

  // Build route key for this flight
  const routeKey = useMemo(() => {
    const origin = flight.segments[0]?.origin?.code || '';
    const dest = flight.segments[flight.segments.length - 1]?.destination?.code || '';
    const date = flight.segments[0]?.departureTime
      ? new Date(flight.segments[0].departureTime).toISOString().split('T')[0]
      : '';
    return buildFlightRouteKey(origin, dest, date);
  }, [flight]);

  const savedCheck = useIsDealSaved(routeKey);
  const hasAlert = useHasAlert(routeKey);
  const { history } = usePriceHistory(routeKey, 'flight');

  // Determine provider from flight ID
  const provider = useMemo(() => {
    const id = flight.id || '';
    if (id.startsWith('kiwi')) return 'kiwi';
    if (id.startsWith('amadeus')) return 'google_flights';
    return 'google_flights';
  }, [flight.id]);

  // Build deal snapshot for tracking
  const dealSnapshot: DealSnapshot = useMemo(() => {
    const firstSeg = flight.segments[0];
    const lastSeg = flight.segments[flight.segments.length - 1];
    return {
      title: `${firstSeg?.origin?.code || ''} → ${lastSeg?.destination?.code || ''}`,
      subtitle: `${firstSeg?.airline?.name || 'Airline'} · ${flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}`,
      provider: { code: provider, name: provider === 'kiwi' ? 'Kiwi.com' : 'Google Flights' },
      price: flight.price,
      flight: {
        outbound: {
          departure: {
            airport: firstSeg?.origin?.code || '',
            time: firstSeg?.departureTime ? new Date(firstSeg.departureTime).toISOString() : '',
          },
          arrival: {
            airport: lastSeg?.destination?.code || '',
            time: lastSeg?.arrivalTime ? new Date(lastSeg.arrivalTime).toISOString() : '',
          },
          duration: flight.totalDuration,
          stops: flight.stops,
          airline: {
            code: firstSeg?.airline?.code || '',
            name: firstSeg?.airline?.name || '',
          },
        },
        tripType: flightStore.searchParams.tripType || 'one-way',
        totalStops: flight.stops,
        totalDuration: flight.totalDuration,
        cabinClass: firstSeg?.cabinClass,
      },
    };
  }, [flight, provider, flightStore.searchParams.tripType]);

  // Extract the booking URL from the raw flight data
  const bookingUrl = useMemo(() => {
    return (flight as any).bookingUrl || (flight as any).deep_link || undefined;
  }, [flight]);

  const handleBookOnProvider = useCallback(async () => {
    const origin = flight.segments[0]?.origin?.code;
    const dest = flight.segments[flight.segments.length - 1]?.destination?.code;
    const date = flight.segments[0]?.departureTime
      ? new Date(flight.segments[0].departureTime).toISOString().split('T')[0]
      : undefined;

    await redirect({
      deal_type: 'flight',
      provider,
      affiliate_url: bookingUrl || '',
      deal_snapshot: dealSnapshot,
      price_amount: flight.price.amount,
      price_currency: flight.price.currency,
      source: 'search',
      deep_link: bookingUrl,
      origin,
      destination: dest,
      date,
    });
  }, [redirect, provider, bookingUrl, dealSnapshot, flight]);

  const handleSave = useCallback(async () => {
    if (!profile?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveDeal(profile.id, {
      deal_type: 'flight',
      provider,
      deal_snapshot: dealSnapshot,
      affiliate_url: bookingUrl,
      price_at_save: flight.price.amount,
      price_currency: flight.price.currency,
      route_key: routeKey,
    });
    setIsSaved(true);
  }, [profile?.id, provider, dealSnapshot, bookingUrl, flight.price, routeKey]);

  const handleToggleAlert = useCallback(async () => {
    if (!profile?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await createPriceAlert(profile.id, {
      deal_type: 'flight',
      route_key: routeKey,
      alert_type: 'price_drop',
      current_price: flight.price.amount,
    });
  }, [profile?.id, routeKey, flight.price.amount]);

  // Format helpers
  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const formatPrice = (amount: number, currency: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
  };

  const firstSeg = flight.segments[0];
  const lastSeg = flight.segments[flight.segments.length - 1];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero Header with Flight Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/flightbg.jpg')}
        style={[styles.heroHeader, { paddingTop: insets.top + spacing.xs }]}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <TouchableOpacity onPress={onBack} style={styles.heroBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroTitle}>
              {firstSeg?.origin?.code || '–'} → {lastSeg?.destination?.code || '–'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {firstSeg?.departureTime
                ? new Date(firstSeg.departureTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                : 'Flight Deal'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.heroBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Flight Summary Card */}
        <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.primaryBorderSubtle }]}>
          {/* Route */}
          <View style={styles.routeRow}>
            <View style={styles.routePoint}>
              <Text style={[styles.airportCode, { color: colors.textPrimary }]}>
                {firstSeg?.origin?.code}
              </Text>
              <Text style={[styles.airportCity, { color: colors.textSecondary }]}>
                {firstSeg?.origin?.city || firstSeg?.origin?.code}
              </Text>
            </View>
            <View style={styles.routeLine}>
              <View style={[styles.line, { backgroundColor: colors.primary }]} />
              <View style={styles.planeIcon}>
                <Ionicons name="airplane" size={16} color={colors.primary} />
              </View>
              <View style={[styles.line, { backgroundColor: colors.primary }]} />
            </View>
            <View style={[styles.routePoint, { alignItems: 'flex-end' }]}>
              <Text style={[styles.airportCode, { color: colors.textPrimary }]}>
                {lastSeg?.destination?.code}
              </Text>
              <Text style={[styles.airportCity, { color: colors.textSecondary }]}>
                {lastSeg?.destination?.city || lastSeg?.destination?.code}
              </Text>
            </View>
          </View>

          {/* Flight details */}
          <View style={[styles.detailsRow, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.detail}>
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Departure</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {firstSeg?.departureTime ? formatTime(firstSeg.departureTime) : '--:--'}
              </Text>
              <Text style={[styles.detailSub, { color: colors.textSecondary }]}>
                {firstSeg?.departureTime ? formatDate(firstSeg.departureTime) : ''}
              </Text>
            </View>
            <View style={styles.detail}>
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Duration</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {formatDuration(flight.totalDuration)}
              </Text>
              <Text style={[styles.detailSub, { color: colors.textSecondary }]}>
                {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </Text>
            </View>
            <View style={[styles.detail, { alignItems: 'flex-end' }]}>
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Arrival</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {lastSeg?.arrivalTime ? formatTime(lastSeg.arrivalTime) : '--:--'}
              </Text>
              <Text style={[styles.detailSub, { color: colors.textSecondary }]}>
                {lastSeg?.arrivalTime ? formatDate(lastSeg.arrivalTime) : ''}
              </Text>
            </View>
          </View>

          {/* Airline & fare info */}
          <View style={[styles.infoRow, { borderTopColor: colors.borderSubtle }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {firstSeg?.airline?.name || 'Airline'} · {firstSeg?.flightNumber || ''}
            </Text>
            <View style={styles.badges}>
              {flight.refundable && <DealBadge badge="editors_pick" size="sm" />}
            </View>
          </View>
        </View>

        {/* Price Section */}
        <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
          <View style={styles.priceRow}>
            <View>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                Total Price
              </Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                {formatPrice(flight.price.amount, flight.price.currency)}
              </Text>
              <Text style={[styles.priceSub, { color: colors.textTertiary }]}>
                per person · all taxes included
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, {
                backgroundColor: isSaved || savedCheck ? '#3FC39E20' : colors.bgCard,
                borderColor: isSaved || savedCheck ? '#3FC39E' : colors.borderSubtle,
              }]}
              onPress={handleSave}
            >
              <Ionicons
                name={(isSaved || savedCheck) ? 'heart' : 'heart-outline'}
                size={20}
                color={(isSaved || savedCheck) ? '#3FC39E' : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Price History */}
        <PriceHistoryChart
          data={history}
          currentPrice={flight.price.amount}
          currency={flight.price.currency}
        />

        {/* Flight Info */}
        <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            What&apos;s Included
          </Text>
          <View style={styles.infoList}>
            <InfoItem
              icon="bag-handle-outline"
              label={flight.baggageIncluded?.cabin?.included ? 'Cabin bag included' : 'No cabin bag'}
              colors={colors}
            />
            <InfoItem
              icon="cube-outline"
              label={flight.baggageIncluded?.checked?.included
                ? `${flight.baggageIncluded.checked.quantity}x checked bag (${flight.baggageIncluded.checked.weight}kg)`
                : 'No checked bag'}
              colors={colors}
            />
            <InfoItem
              icon="swap-horizontal-outline"
              label={flight.changeable ? 'Changes allowed' : 'Non-changeable'}
              colors={colors}
            />
            <InfoItem
              icon="return-down-back-outline"
              label={flight.refundable ? 'Refundable' : 'Non-refundable'}
              colors={colors}
            />
          </View>
        </View>

        {/* Price Alert */}
        <PriceAlertButton hasAlert={hasAlert} onToggle={handleToggleAlert} />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: isDark ? '#1A1A1A' : colors.white, borderTopColor: colors.borderSubtle }]}>
        <BookOnProviderButton
          provider={provider}
          price={formatPrice(flight.price.amount, flight.price.currency)}
          onPress={handleBookOnProvider}
        />
      </View>
    </View>
  );
}

function InfoItem({ icon, label, colors }: { icon: string; label: string; colors: any }) {
  return (
    <View style={infoStyles.row}>
      <View style={[infoStyles.iconWrap, { backgroundColor: colors.primarySubtle || 'rgba(63, 195, 158, 0.08)' }]}>
        <Ionicons name={icon as any} size={16} color={colors.primary} />
      </View>
      <Text style={[infoStyles.label, { color: colors.textPrimary }]}>{label}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: 'Rubik-Regular', fontSize: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroHeader: {
    paddingBottom: 20,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleBlock: { flex: 1, alignItems: 'center' },
  heroTitle: {
    fontFamily: 'HostGrotesk-Bold',
    fontSize: 19,
    color: '#fff',
  },
  heroSubtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  card: {
    borderRadius: br['2xl'],
    padding: 20,
    borderWidth: 1.5,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  routePoint: {},
  airportCode: { fontFamily: 'HostGrotesk-Bold', fontSize: 28 },
  airportCity: { fontFamily: 'Rubik-Regular', fontSize: 13, marginTop: 2 },
  routeLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    gap: 8,
  },
  line: { flex: 1, height: 1.5, opacity: 0.5 },
  planeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(63, 195, 158, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  detail: {},
  detailLabel: { fontFamily: 'Rubik-Regular', fontSize: 11 },
  detailValue: { fontFamily: 'Rubik-SemiBold', fontSize: 16, marginTop: 2 },
  detailSub: { fontFamily: 'Rubik-Regular', fontSize: 12, marginTop: 1 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  infoText: { fontFamily: 'Rubik-Regular', fontSize: 13 },
  badges: { flexDirection: 'row', gap: 6 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: { fontFamily: 'Rubik-Regular', fontSize: 13 },
  priceValue: { fontFamily: 'HostGrotesk-Bold', fontSize: 32, marginTop: 2 },
  priceSub: { fontFamily: 'Rubik-Regular', fontSize: 12, marginTop: 2 },
  saveBtn: {
    width: 48,
    height: 48,
    borderRadius: br.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontFamily: 'Rubik-SemiBold', fontSize: 15, marginBottom: 8 },
  infoList: { gap: 2 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
});
