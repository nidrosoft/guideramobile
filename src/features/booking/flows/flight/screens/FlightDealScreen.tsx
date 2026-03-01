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
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
  const { user } = useAuth();
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
    if (!user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveDeal(user.id, {
      deal_type: 'flight',
      provider,
      deal_snapshot: dealSnapshot,
      affiliate_url: bookingUrl,
      price_at_save: flight.price.amount,
      price_currency: flight.price.currency,
      route_key: routeKey,
    });
    setIsSaved(true);
  }, [user?.id, provider, dealSnapshot, bookingUrl, flight.price, routeKey]);

  const handleToggleAlert = useCallback(async () => {
    if (!user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await createPriceAlert(user.id, {
      deal_type: 'flight',
      route_key: routeKey,
      alert_type: 'price_drop',
      current_price: flight.price.amount,
    });
  }, [user?.id, routeKey, flight.price.amount]);

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

  const firstSeg = flight.segments[0];
  const lastSeg = flight.segments[flight.segments.length - 1];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Flight Deal
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Flight Summary Card */}
        <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
          {/* Route */}
          <View style={styles.routeRow}>
            <View style={styles.routePoint}>
              <Text style={[styles.airportCode, { color: colors.textPrimary }]}>
                {firstSeg?.origin?.code}
              </Text>
              <Text style={[styles.airportCity, { color: colors.textSecondary }]}>
                {firstSeg?.origin?.city}
              </Text>
            </View>
            <View style={styles.routeLine}>
              <View style={[styles.line, { backgroundColor: colors.borderSubtle }]} />
              <Ionicons name="airplane" size={16} color="#3FC39E" />
              <View style={[styles.line, { backgroundColor: colors.borderSubtle }]} />
            </View>
            <View style={[styles.routePoint, { alignItems: 'flex-end' }]}>
              <Text style={[styles.airportCode, { color: colors.textPrimary }]}>
                {lastSeg?.destination?.code}
              </Text>
              <Text style={[styles.airportCity, { color: colors.textSecondary }]}>
                {lastSeg?.destination?.city}
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
              <Text style={[styles.priceValue, { color: colors.textPrimary }]}>
                {flight.price.formatted || `$${flight.price.amount}`}
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
            What's Included
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
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle }]}>
        <BookOnProviderButton
          provider={provider}
          price={flight.price.formatted || `$${flight.price.amount}`}
          onPress={handleBookOnProvider}
        />
      </View>
    </SafeAreaView>
  );
}

function InfoItem({ icon, label, colors }: { icon: string; label: string; colors: any }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
      <Text style={[infoStyles.label, { color: colors.textPrimary }]}>{label}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  label: { fontFamily: 'Rubik-Regular', fontSize: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Rubik-SemiBold', fontSize: 17 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
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
    marginHorizontal: 12,
    gap: 6,
  },
  line: { flex: 1, height: 1 },
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
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
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
