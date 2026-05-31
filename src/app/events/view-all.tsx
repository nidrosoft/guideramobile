/**
 * VIEW ALL EVENTS
 *
 * Displays real AI-discovered events for the user's city (same data source
 * as the homepage EventsSection). Supports category filter pills and
 * pull-to-refresh.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { ArrowLeft2, Location as LocationIcon, Calendar, Clock, Ticket } from 'iconsax-react-native';
import { typography, spacing, fontFamily } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { eventsService, DiscoveredEvent } from '@/services/events.service';
import CachedImage from '@/components/common/CachedImage';

// Same metro area map used by EventsSection
const METRO_AREA_MAP: Record<string, string> = {
  'La Mesa': 'San Diego', 'El Cajon': 'San Diego', 'Chula Vista': 'San Diego',
  'National City': 'San Diego', 'Santee': 'San Diego', 'Lemon Grove': 'San Diego',
  'Santa Monica': 'Los Angeles', 'Burbank': 'Los Angeles', 'Glendale': 'Los Angeles',
  'Pasadena': 'Los Angeles', 'Long Beach': 'Los Angeles', 'Beverly Hills': 'Los Angeles',
  'Oakland': 'San Francisco', 'Berkeley': 'San Francisco', 'Palo Alto': 'San Francisco',
  'Brooklyn': 'New York', 'Queens': 'New York', 'Bronx': 'New York',
  'Jersey City': 'New York', 'Hoboken': 'New York',
  'Evanston': 'Chicago', 'Naperville': 'Chicago',
  'Bellevue': 'Seattle', 'Tacoma': 'Seattle',
  'Fort Lauderdale': 'Miami', 'Miami Beach': 'Miami',
  'Cambridge': 'Boston', 'Somerville': 'Boston',
};

export default function ViewAllEvents() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  // Resolve user location (same logic as EventsSection)
  useEffect(() => {
    if (profile?.city) {
      setCity(profile.city);
      if (profile?.country) setCountry(profile.country);
      return;
    }
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geo?.city) setCity(geo.city);
        if (geo?.country) setCountry(geo.country);
      } catch {
        // silent
      }
    })();
  }, [profile?.city, profile?.country]);

  const metroArea = METRO_AREA_MAP[city];
  const resolvedCity = metroArea || city || 'New York';
  const resolvedCountry = country || 'United States';

  const { events, loading, error, refresh, categories } = useEvents({
    city: resolvedCity,
    country: resolvedCountry,
    enabled: city.length > 0 || !profile?.city,
  });

  // Category filter pills
  const filterPills = useMemo(() => {
    const pills: { id: string; label: string; count: number }[] = [
      { id: 'all', label: 'All', count: events.length },
    ];
    const catCounts: Record<string, number> = {};
    events.forEach(e => {
      catCounts[e.category] = (catCounts[e.category] || 0) + 1;
    });
    Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        pills.push({ id: cat, label: cat, count });
      });
    return pills;
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!selectedCategory) return events;
    return events.filter(e => e.category === selectedCategory);
  }, [events, selectedCategory]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleFilterPress = useCallback((catId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(catId === 'all' ? undefined : catId);
  }, []);

  const handleEventPress = useCallback((event: DiscoveredEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/events/${event.id}`);
  }, [router]);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderEvent = useCallback(({ item }: { item: DiscoveredEvent }) => (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: isDark ? colors.bgSecondary : colors.white, borderColor: colors.borderSubtle }]}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.7}
    >
      {item.image_url ? (
        <View style={styles.eventImageWrap}>
          <CachedImage uri={item.image_url} style={styles.eventImage} />
        </View>
      ) : null}
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <View style={[styles.categoryPill, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.categoryPillText, { color: colors.primary }]} numberOfLines={1}>{item.category}</Text>
          </View>
          {item.is_free && (
            <View style={[styles.freeBadge, { backgroundColor: colors.success + '15' }]}>
              <Text style={[styles.freeText, { color: colors.success }]}>Free</Text>
            </View>
          )}
        </View>
        <Text style={[styles.eventName, { color: colors.textPrimary }]} numberOfLines={2}>{item.event_name}</Text>
        {item.description ? (
          <Text style={[styles.eventDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <LocationIcon size={14} color={colors.textSecondary} variant="Bold" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.venue ? `${item.venue}, ${item.city}` : item.city}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={colors.primary} variant="Bold" />
            <Text style={[styles.metaText, { color: colors.primary }]}>{eventsService.formatEventDate(item.date_start)}</Text>
          </View>
          {item.time_info ? (
            <View style={styles.metaItem}>
              <Clock size={14} color={colors.success} variant="Bold" />
              <Text style={[styles.metaText, { color: colors.success }]}>{item.time_info}</Text>
            </View>
          ) : null}
          {item.ticket_price && !item.is_free ? (
            <View style={styles.metaItem}>
              <Ticket size={14} color={colors.primary} variant="Bold" />
              <Text style={[styles.metaText, { color: colors.primary }]}>{item.ticket_price}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  ), [colors, isDark, handleEventPress]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { backgroundColor: colors.bgCard }]} activeOpacity={0.7}>
          <ArrowLeft2 size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Events You May Like</Text>
        <View style={styles.headerRight} />
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {city ? `Upcoming events in ${metroArea || city}` : 'Upcoming events near you'}
      </Text>

      {/* Category Filter Pills */}
      {filterPills.length > 2 && (
        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
            {filterPills.map(pill => {
              const isActive = pill.id === 'all' ? !selectedCategory : selectedCategory === pill.id;
              return (
                <TouchableOpacity
                  key={pill.id}
                  style={[styles.tab, {
                    backgroundColor: isActive ? colors.primary : (isDark ? colors.bgCard : '#F1F5F9'),
                    borderColor: isActive ? colors.primary : colors.borderSubtle,
                  }]}
                  onPress={() => handleFilterPress(pill.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, { color: isActive ? '#FFFFFF' : colors.textPrimary }]}>{pill.label}</Text>
                  <View style={[styles.countBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : colors.borderSubtle }]}>
                    <Text style={[styles.countText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>{pill.count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {loading && events.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Discovering events...</Text>
        </View>
      ) : error && events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Something went wrong</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No events found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {selectedCategory ? 'Try a different category' : 'Check back soon for new events'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: fontFamily.bold, fontSize: typography.fontSize.kpiValue },
  headerRight: { width: 40 },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: typography.fontSize.bodyLg,
    paddingHorizontal: spacing.lg,
    marginBottom: 4,
  },
  tabsWrapper: { height: 52, marginBottom: 4 },
  tabsContainer: { paddingHorizontal: spacing.lg, gap: 8, alignItems: 'center', height: 52 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: { fontFamily: fontFamily.semibold, fontSize: typography.fontSize.body },
  countBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, minWidth: 22, alignItems: 'center' },
  countText: { fontFamily: fontFamily.medium, fontSize: typography.fontSize.caption },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 40, gap: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: fontFamily.regular, fontSize: typography.fontSize.bodyLg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingBottom: 60, paddingTop: 60 },
  emptyTitle: { fontFamily: fontFamily.semibold, fontSize: typography.fontSize.heading2 },
  emptySubtitle: { fontFamily: fontFamily.regular, fontSize: typography.fontSize.bodyLg },

  // Event card
  eventCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  eventImageWrap: {
    width: '100%',
    height: 160,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventContent: {
    padding: spacing.md,
    gap: 6,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryPillText: {
    fontFamily: fontFamily.semibold,
    fontSize: typography.fontSize.caption,
  },
  freeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  freeText: {
    fontFamily: fontFamily.semibold,
    fontSize: typography.fontSize.caption,
  },
  eventName: {
    fontFamily: fontFamily.bold,
    fontSize: typography.fontSize.bodyLg,
  },
  eventDesc: {
    fontFamily: fontFamily.regular,
    fontSize: typography.fontSize.body,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: fontFamily.medium,
    fontSize: typography.fontSize.caption,
  },
});
