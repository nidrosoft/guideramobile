/**
 * DEAL DETAIL SCREEN
 *
 * Shows full details of a saved deal with:
 * - Deal snapshot (flight/hotel/car/experience info)
 * - Price with change indicator
 * - Price history chart
 * - Save/unsave toggle
 * - Price alert toggle
 * - "Book on [Provider]" redirect button
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Airplane,
  Building,
  Car,
  Activity,
  Calendar,
  Clock,
  Routing2,
  Trash,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useDealRedirect, usePriceHistory } from '@/hooks/useDeals';
import { useHasAlert } from '@/hooks/usePriceAlerts';
import { createPriceAlert, unsaveDeal, getProviderDisplayName } from '@/services/deal';
import type { SavedDeal, DealType } from '@/services/deal';
import {
  BookOnProviderButton,
  PriceAlertButton,
  PriceHistoryChart,
} from '@/features/booking/components/shared';

const TYPE_ICONS: Record<DealType, any> = {
  flight: Airplane,
  hotel: Building,
  car: Car,
  experience: Activity,
};

const TYPE_COLORS: Record<DealType, string> = {
  flight: '#3B82F6',
  hotel: '#3FC39E',
  car: '#F59E0B',
  experience: '#10B981',
};

export default function DealDetailScreen() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const { redirect } = useDealRedirect();

  const [deal, setDeal] = useState<SavedDeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hasAlert = useHasAlert(deal?.route_key || null);
  const { history } = usePriceHistory(
    deal?.route_key || null,
    deal?.deal_type || 'flight'
  );

  // Load deal
  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('saved_deals')
        .select('*')
        .eq('id', id as string)
        .single();
      setDeal(data);
      setIsLoading(false);
    })();
  }, [id]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleDelete = useCallback(async () => {
    if (!deal) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await unsaveDeal(deal.id);
    router.back();
  }, [deal, router]);

  const handleToggleAlert = useCallback(async () => {
    if (!user?.id || !deal) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await createPriceAlert(user.id, {
      deal_type: deal.deal_type,
      route_key: deal.route_key || '',
      alert_type: 'price_drop',
      current_price: deal.current_price || deal.price_at_save,
    });
  }, [user?.id, deal]);

  const handleBookOnProvider = useCallback(async () => {
    if (!deal) return;
    const snapshot = deal.deal_snapshot as any;
    await redirect({
      deal_type: deal.deal_type,
      provider: deal.provider,
      affiliate_url: deal.affiliate_url || '',
      deal_snapshot: snapshot,
      price_amount: deal.current_price || deal.price_at_save,
      price_currency: deal.price_currency,
      source: 'saved_deals',
      deep_link: deal.affiliate_url || undefined,
      destination: snapshot?.title,
    });
  }, [deal, redirect]);

  const formatPrice = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3FC39E" />
        </View>
      </SafeAreaView>
    );
  }

  if (!deal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
        <StatusBar style="light" />
        <View style={[styles.header, { borderBottomColor: tc.borderSubtle }]}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
            <ArrowLeft size={24} color={tc.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Deal Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loading}>
          <Text style={{ color: tc.textSecondary }}>Deal not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const snapshot = deal.deal_snapshot as any;
  const TypeIcon = TYPE_ICONS[deal.deal_type] || Activity;
  const typeColor = TYPE_COLORS[deal.deal_type] || '#3FC39E';
  const currentPrice = deal.current_price || deal.price_at_save;
  const providerName = getProviderDisplayName(deal.provider);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Deal Detail</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
          <Trash size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Type & Provider Badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
            <TypeIcon size={16} color={typeColor} variant="Bold" />
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>
              {deal.deal_type.charAt(0).toUpperCase() + deal.deal_type.slice(1)}
            </Text>
          </View>
          <Text style={[styles.providerText, { color: tc.textSecondary }]}>
            via {providerName}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.dealTitle, { color: tc.textPrimary }]}>
          {snapshot?.title || `${deal.deal_type} deal`}
        </Text>
        {snapshot?.subtitle && (
          <Text style={[styles.dealSubtitle, { color: tc.textSecondary }]}>
            {snapshot.subtitle}
          </Text>
        )}

        {/* Price Card */}
        <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <View style={styles.priceRow}>
            <View>
              <Text style={[styles.priceLabel, { color: tc.textSecondary }]}>Current Price</Text>
              <Text style={[styles.priceValue, { color: tc.textPrimary }]}>
                {formatPrice(currentPrice, deal.price_currency)}
              </Text>
            </View>
            {deal.price_changed && deal.price_change_pct != null && (
              <View style={[styles.changeBadge, {
                backgroundColor: deal.price_change_pct < 0 ? '#10B98115' : '#EF444415',
              }]}>
                <Text style={[styles.changeText, {
                  color: deal.price_change_pct < 0 ? '#10B981' : '#EF4444',
                }]}>
                  {deal.price_change_pct > 0 ? '+' : ''}{deal.price_change_pct.toFixed(1)}%
                </Text>
                <Text style={[styles.changeLabel, { color: tc.textTertiary }]}>
                  vs when saved
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.savedRow, { borderTopColor: tc.borderSubtle }]}>
            <Text style={[styles.savedLabel, { color: tc.textTertiary }]}>
              Saved at {formatPrice(deal.price_at_save, deal.price_currency)}
            </Text>
            <Text style={[styles.savedDate, { color: tc.textTertiary }]}>
              {formatDate(deal.created_at)}
            </Text>
          </View>
        </View>

        {/* Price History */}
        <PriceHistoryChart
          data={history}
          currentPrice={currentPrice}
          currency={deal.price_currency}
        />

        {/* Deal Details Card */}
        {snapshot?.flight && (
          <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Flight Details</Text>
            <DetailRow icon={Airplane} label="Route" value={snapshot.title} colors={tc} />
            <DetailRow
              icon={Clock}
              label="Duration"
              value={snapshot.flight.totalDuration ? `${Math.floor(snapshot.flight.totalDuration / 60)}h ${snapshot.flight.totalDuration % 60}m` : '--'}
              colors={tc}
            />
            <DetailRow
              icon={Routing2}
              label="Stops"
              value={snapshot.flight.totalStops === 0 ? 'Direct' : `${snapshot.flight.totalStops} stop${snapshot.flight.totalStops > 1 ? 's' : ''}`}
              colors={tc}
            />
          </View>
        )}

        {snapshot?.hotel && (
          <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Hotel Details</Text>
            <DetailRow icon={Building} label="Hotel" value={snapshot.hotel.name} colors={tc} />
            {snapshot.hotel.starRating && (
              <DetailRow icon={Activity} label="Stars" value={`${snapshot.hotel.starRating} Star`} colors={tc} />
            )}
            <DetailRow icon={Calendar} label="Nights" value={`${snapshot.hotel.nights || '--'} nights`} colors={tc} />
          </View>
        )}

        {snapshot?.car && (
          <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Car Details</Text>
            <DetailRow icon={Car} label="Vehicle" value={snapshot.car.name} colors={tc} />
            <DetailRow icon={Building} label="Company" value={snapshot.car.company} colors={tc} />
          </View>
        )}

        {snapshot?.experience && (
          <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Experience Details</Text>
            <DetailRow icon={Activity} label="Experience" value={snapshot.experience.name} colors={tc} />
            {snapshot.experience.duration && (
              <DetailRow icon={Clock} label="Duration" value={snapshot.experience.duration} colors={tc} />
            )}
          </View>
        )}

        {/* Price Alert */}
        <PriceAlertButton hasAlert={hasAlert} onToggle={handleToggleAlert} />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: tc.background, borderTopColor: tc.borderSubtle }]}>
        <BookOnProviderButton
          provider={deal.provider}
          price={formatPrice(currentPrice, deal.price_currency)}
          onPress={handleBookOnProvider}
        />
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ icon: Icon, label, value, colors: tc }: {
  icon: any; label: string; value: string; colors: any;
}) {
  return (
    <View style={detailStyles.row}>
      <Icon size={16} color={tc.textTertiary} />
      <Text style={[detailStyles.label, { color: tc.textSecondary }]}>{label}</Text>
      <Text style={[detailStyles.value, { color: tc.textPrimary }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  label: { fontFamily: 'Rubik-Regular', fontSize: 13, width: 70 },
  value: { fontFamily: 'Rubik-Medium', fontSize: 14, flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Rubik-SemiBold', fontSize: 17 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeBadgeText: { fontFamily: 'Rubik-Medium', fontSize: 13 },
  providerText: { fontFamily: 'Rubik-Regular', fontSize: 13 },
  dealTitle: { fontFamily: 'HostGrotesk-Bold', fontSize: 24, marginTop: 4 },
  dealSubtitle: { fontFamily: 'Rubik-Regular', fontSize: 14, marginTop: 2 },
  card: { borderRadius: 14, padding: 16, borderWidth: 1 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontFamily: 'Rubik-Regular', fontSize: 13 },
  priceValue: { fontFamily: 'HostGrotesk-Bold', fontSize: 30, marginTop: 2 },
  changeBadge: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  changeText: { fontFamily: 'Rubik-Bold', fontSize: 16 },
  changeLabel: { fontFamily: 'Rubik-Regular', fontSize: 10, marginTop: 1 },
  savedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 12,
  },
  savedLabel: { fontFamily: 'Rubik-Regular', fontSize: 12 },
  savedDate: { fontFamily: 'Rubik-Regular', fontSize: 12 },
  sectionTitle: { fontFamily: 'Rubik-SemiBold', fontSize: 15, marginBottom: 4 },
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
