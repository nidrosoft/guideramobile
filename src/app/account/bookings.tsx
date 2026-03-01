/**
 * MY DEALS SCREEN
 * 
 * User's saved deals and recent deal clicks.
 * Organized by Saved and Recent tabs.
 */

import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Airplane, 
  Building, 
  Car, 
  Activity,
  Calendar,
  TicketStar,
  ArrowRight2,
  Heart,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSavedDeals, useRecentClicks } from '@/hooks/useDeals';
import type { SavedDeal, DealClick, DealType } from '@/services/deal';
import { getProviderDisplayName } from '@/services/deal';

const TABS = [
  { label: 'Saved', value: 'saved' },
  { label: 'Recent', value: 'recent' },
];

const TYPE_ICONS: Record<DealType, any> = {
  flight: Airplane,
  hotel: Building,
  car: Car,
  experience: Activity,
};

const TYPE_COLORS: Record<DealType, string> = {
  flight: colors.info,
  hotel: colors.primary,
  car: colors.warning,
  experience: colors.success,
};

export default function BookingsScreen() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const [activeTab, setActiveTab] = useState<'saved' | 'recent'>('saved');
  const { deals: savedDeals, isLoading: savedLoading, refresh: refreshSaved, remove } = useSavedDeals();
  const { clicks: recentClicks, isLoading: recentLoading, refresh: refreshRecent } = useRecentClicks();
  const [refreshing, setRefreshing] = useState(false);

  const isLoading = activeTab === 'saved' ? savedLoading : recentLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await (activeTab === 'saved' ? refreshSaved() : refreshRecent());
    setRefreshing(false);
  }, [activeTab, refreshSaved, refreshRecent]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.background }]}>
      <StatusBar style={tc.textPrimary === colors.textPrimary ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: tc.textPrimary }]}>My Deals</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.tab,
              activeTab === tab.value && styles.tabActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.value as 'saved' | 'recent');
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.value && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
            {tab.value === 'saved' && savedDeals.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{savedDeals.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : activeTab === 'saved' ? (
          savedDeals.length === 0 ? (
            <View style={styles.emptyState}>
              <Heart size={48} color={colors.gray300} variant="Bold" />
              <Text style={styles.emptyTitle}>No saved deals</Text>
              <Text style={styles.emptyText}>Deals you save will appear here</Text>
            </View>
          ) : (
            savedDeals.map(deal => (
              <DealCard
                key={deal.id}
                deal={deal}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))
          )
        ) : (
          recentClicks.length === 0 ? (
            <View style={styles.emptyState}>
              <TicketStar size={48} color={colors.gray300} variant="Bold" />
              <Text style={styles.emptyTitle}>No recent activity</Text>
              <Text style={styles.emptyText}>Deals you click will appear here</Text>
            </View>
          ) : (
            recentClicks.map(click => (
              <ClickCard
                key={click.id}
                click={click}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Saved Deal Card
interface DealCardProps {
  deal: SavedDeal;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (dateStr: string) => string;
}

function DealCard({ deal, formatCurrency, formatDate }: DealCardProps) {
  const TypeIcon = TYPE_ICONS[deal.deal_type] || TicketStar;
  const typeColor = TYPE_COLORS[deal.deal_type] || colors.primary;
  const snapshot = deal.deal_snapshot as any;
  
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: `${typeColor}15` }]}>
          <TypeIcon size={20} color={typeColor} variant="Bold" />
        </View>
        <Text style={styles.providerBadge}>
          {getProviderDisplayName(deal.provider)}
        </Text>
      </View>
      
      <Text style={styles.cardTitle} numberOfLines={1}>
        {snapshot?.title || `${deal.deal_type} deal`}
      </Text>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Calendar size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>{formatDate(deal.created_at)}</Text>
        </View>
        {deal.price_changed && deal.price_change_pct && (
          <Text style={[styles.priceChange, {
            color: deal.price_change_pct < 0 ? '#10B981' : '#EF4444'
          }]}>
            {deal.price_change_pct > 0 ? '+' : ''}{deal.price_change_pct.toFixed(0)}%
          </Text>
        )}
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.totalAmount}>
          {formatCurrency(deal.current_price || deal.price_at_save, deal.price_currency)}
        </Text>
        <ArrowRight2 size={18} color={colors.gray400} />
      </View>
    </View>
  );
}

// Recent Click Card
interface ClickCardProps {
  click: DealClick;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (dateStr: string) => string;
}

function ClickCard({ click, formatCurrency, formatDate }: ClickCardProps) {
  const TypeIcon = TYPE_ICONS[click.deal_type] || TicketStar;
  const typeColor = TYPE_COLORS[click.deal_type] || colors.primary;
  const snapshot = click.deal_snapshot as any;
  
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: `${typeColor}15` }]}>
          <TypeIcon size={20} color={typeColor} variant="Bold" />
        </View>
        <Text style={styles.providerBadge}>
          {getProviderDisplayName(click.provider)}
        </Text>
      </View>
      
      <Text style={styles.cardTitle} numberOfLines={1}>
        {snapshot?.title || `${click.deal_type} deal`}
      </Text>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Calendar size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>{formatDate(click.clicked_at)}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.totalAmount}>
          {formatCurrency(click.price_amount, click.price_currency)}
        </Text>
        <ArrowRight2 size={18} color={colors.gray400} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgElevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerBadge: {
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  priceChange: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  refNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  totalAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
});
