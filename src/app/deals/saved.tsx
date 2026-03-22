/**
 * SAVED DEALS SCREEN
 *
 * Displays all deals the user has bookmarked/saved, organized by category
 * (All, Flights, Hotels, Experiences) with filter tabs similar to view-all.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeft2, Airplane, Building, Activity, Archive, Trash, Location, Map1 } from 'iconsax-react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, fontFamily, colors as staticColors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRIMARY = staticColors.primary;

type FilterTab = 'all' | 'flight' | 'hotel' | 'experience' | 'destination' | 'trip';

const TABS: { key: FilterTab; label: string; icon: any }[] = [
  { key: 'all', label: 'All Saved', icon: Archive },
  { key: 'flight', label: 'Flights', icon: Airplane },
  { key: 'hotel', label: 'Hotels', icon: Building },
  { key: 'experience', label: 'Experiences', icon: Activity },
  { key: 'destination', label: 'Destinations', icon: Location },
  { key: 'trip', label: 'Trips', icon: Map1 },
];

export default function SavedDealsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const loadAll = useCallback(async () => {
    if (!profile?.id) return;
    try {
      // Load saved deals (flights, hotels, experiences)
      const { data: deals } = await supabase
        .from('saved_deals')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      setSavedDeals(deals || []);

      // Load saved items (destinations, trips, etc.)
      const { data: items } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', profile.id)
        .order('saved_at', { ascending: false });
      setSavedItems(items || []);
    } catch (err) {
      console.warn('Failed to load saved data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadAll();
  }, [loadAll]);

  const handleRemoveDeal = async (deal: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSavedDeals((prev) => prev.filter((d) => d.id !== deal.id));
    try { await supabase.from('saved_deals').delete().eq('id', deal.id); } catch {}
  };

  const handleRemoveItem = async (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSavedItems((prev) => prev.filter((i) => i.id !== item.id));
    try { await supabase.from('saved_items').delete().eq('id', item.id); } catch {}
  };

  const handleDealPress = (deal: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dealId = deal.deal_cache_id || deal.id;
    router.push({ pathname: '/deals/[id]', params: { id: dealId, title: deal.deal_snapshot?.title || '', type: deal.deal_type } } as any);
  };

  const handleItemPress = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate based on type — can be expanded
  };

  // Merge both sources into a unified list
  const normalizedDeals = savedDeals.map((d) => ({
    ...d, _source: 'deal' as const, _type: d.deal_type,
  }));
  const normalizedItems = savedItems.map((i) => ({
    ...i, _source: 'item' as const, _type: i.type,
  }));
  const allSaved = [...normalizedDeals, ...normalizedItems];

  const dealTypes = ['flight', 'hotel', 'experience'];
  const filteredList = activeTab === 'all'
    ? allSaved
    : dealTypes.includes(activeTab)
      ? normalizedDeals.filter((d) => d.deal_type === activeTab)
      : normalizedItems.filter((i) => i.type === activeTab);

  const tabCounts: Record<FilterTab, number> = {
    all: allSaved.length,
    flight: savedDeals.filter((d) => d.deal_type === 'flight').length,
    hotel: savedDeals.filter((d) => d.deal_type === 'hotel').length,
    experience: savedDeals.filter((d) => d.deal_type === 'experience').length,
    destination: savedItems.filter((i) => i.type === 'destination').length,
    trip: savedItems.filter((i) => i.type === 'trip').length,
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'flight': return '#3B82F6';
      case 'hotel': return '#8B5CF6';
      case 'experience': return '#F59E0B';
      case 'destination': return '#10B981';
      case 'trip': return '#6366F1';
      default: return PRIMARY;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'flight': return 'Flight';
      case 'hotel': return 'Hotel';
      case 'experience': return 'Experience';
      case 'destination': return 'Destination';
      case 'trip': return 'Trip';
      default: return 'Deal';
    }
  };

  return (
    <View style={[styles.safe, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={[styles.backBtn, { backgroundColor: colors.bgCard }]}>
          <ArrowLeft2 size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Saved Items</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  { backgroundColor: isActive ? PRIMARY : isDark ? colors.bgCard : colors.gray100, borderColor: isActive ? PRIMARY : colors.borderSubtle },
                ]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.key); }}
                activeOpacity={0.7}
              >
                <Icon size={16} color={isActive ? colors.white : colors.textSecondary} variant={isActive ? 'Bold' : 'Linear'} />
                <Text style={[styles.tabText, { color: isActive ? colors.white : colors.textPrimary }]}>
                  {tab.label}
                </Text>
                <View style={[styles.tabCount, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                  <Text style={[styles.tabCountText, { color: isActive ? colors.white : colors.textSecondary }]}>
                    {tabCounts[tab.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.center}>
          <Archive size={48} color={colors.textSecondary} variant="Bulk" />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {activeTab === 'all' ? 'No saved items yet' : `No saved ${getTypeLabel(activeTab).toLowerCase()}s`}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Tap the heart icon on any item to save it here
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />
          }
        >
          {filteredList.map((entry) => {
            const isDeal = entry._source === 'deal';
            const snap = isDeal ? (entry.deal_snapshot || {}) : (entry.data || {});
            const heroImage = isDeal
              ? (snap.heroImage || snap.imageUrl || (snap.images && snap.images[0]))
              : (entry.image_url || snap.image_url);
            const title = isDeal
              ? (snap.title || entry.route_key?.replace('-', ' → ') || 'Saved Deal')
              : (entry.title || 'Saved Item');
            const subtitle = isDeal
              ? (snap.city ? `${snap.city}${snap.country ? `, ${snap.country}` : ''}` : null)
              : (entry.subtitle || null);
            const price = isDeal ? Number(entry.price_at_save) || 0 : 0;
            const typeColor = getTypeColor(entry._type);

            return (
              <TouchableOpacity
                key={entry.id}
                style={[styles.card, { backgroundColor: isDark ? colors.bgCard : colors.white, borderColor: colors.borderSubtle }]}
                onPress={() => isDeal ? handleDealPress(entry) : handleItemPress(entry)}
                activeOpacity={0.85}
              >
                {heroImage ? (
                  <Image source={heroImage} style={styles.cardImage} contentFit="cover" />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder, { backgroundColor: isDark ? colors.gray800 : colors.gray100 }]}>
                    <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                  </View>
                )}

                <View style={styles.cardContent}>
                  <View style={[styles.typePill, { backgroundColor: typeColor + '18' }]}>
                    <Text style={[styles.typePillText, { color: typeColor }]}>{getTypeLabel(entry._type)}</Text>
                  </View>

                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>{title}</Text>

                  {subtitle && (
                    <Text style={[styles.cardLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}

                  <View style={styles.cardBottom}>
                    {price > 0 ? (
                      <Text style={[styles.cardPrice, { color: colors.textPrimary }]}>
                        ${Math.round(price)}
                        <Text style={[styles.cardPriceLabel, { color: colors.textSecondary }]}>
                          {entry._type === 'hotel' ? '/night' : entry._type === 'experience' ? '/person' : ''}
                        </Text>
                      </Text>
                    ) : (
                      <View />
                    )}

                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation?.(); isDeal ? handleRemoveDeal(entry) : handleRemoveItem(entry); }}
                      style={[styles.removeBtn, { backgroundColor: isDark ? colors.gray800 : colors.errorBg }]}
                      activeOpacity={0.7}
                    >
                      <Trash size={16} color="#EF4444" variant="Bold" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: fontFamily.bold, fontSize: 18 },

  tabsWrapper: { height: 48, marginBottom: 8 },
  tabsContainer: { paddingHorizontal: spacing.lg, gap: 8, alignItems: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabText: { fontFamily: fontFamily.medium, fontSize: 13 },
  tabCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  tabCountText: { fontFamily: fontFamily.bold, fontSize: 11 },

  emptyTitle: { fontFamily: fontFamily.bold, fontSize: 18, textAlign: 'center' },
  emptySubtitle: { fontFamily: fontFamily.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 40, gap: 14 },

  card: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardImage: { width: 110, height: 120 },
  cardImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  typePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 4 },
  typePillText: { fontFamily: fontFamily.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 20, marginBottom: 2 },
  cardLocation: { fontFamily: fontFamily.regular, fontSize: 12, marginBottom: 6 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice: { fontFamily: fontFamily.display, fontSize: 20 },
  cardPriceLabel: { fontFamily: fontFamily.regular, fontSize: 12 },
  removeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
});
