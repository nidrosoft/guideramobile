/**
 * HOME SCREEN - REFACTORED
 * 
 * Modular homepage using SectionRenderer for all sections.
 * Reduced from 666 lines to ~150 lines.
 */

import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { Fragment, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { SearchNormal1, Archive, Location } from 'iconsax-react-native';
import NotificationBell from '@/components/features/notifications/NotificationBell';
import TripReminder from '@/components/features/home/TripReminder';
import SectionRenderer from '@/components/features/home/SectionRenderer';
import AnimatedSearchPlaceholder from '@/components/features/home/AnimatedSearchPlaceholder';
import PlanBottomSheet from '@/components/features/home/PlanBottomSheet';
import { SearchOverlay } from '@/components/features/search';
import { FlightBookingFlow, HotelBookingFlow, PackageBookingFlow, CarBookingFlow, ExperienceFlow } from '@/features/booking';
import { categories } from '@/data/categories';
import { SECTIONS_CONFIG } from '@/config/sections.config';
import { useAuth } from '@/context/AuthContext';
import { useHomepageData } from '@/features/homepage';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { TripState } from '@/features/trips/types/trip.types';
import { useSearchOverlayStore } from '@/stores/useSearchOverlayStore';
import { JourneysHomeSection } from '@/modules/journeys';
import { TourAnchor, registerActionHandler, useGuidance, TravelProfileHomeCard } from '@/features/guidance';

export default function Home() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  
  // Modal states
  const [isPlanBottomSheetVisible, setIsPlanBottomSheetVisible] = useState(false);
  const [isFlightBookingVisible, setIsFlightBookingVisible] = useState(false);
  const [isHotelBookingVisible, setIsHotelBookingVisible] = useState(false);
  const [isPackageBookingVisible, setIsPackageBookingVisible] = useState(false);
  const [isCarRentalVisible, setIsCarRentalVisible] = useState(false);
  const [isExperienceVisible, setIsExperienceVisible] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchResetNonce = useSearchOverlayStore((s) => s.resetNonce);

  // Guidance: scroll registry + action handlers for tour preActions
  const guidance = useGuidance();
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});

  useEffect(() => {
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const offScroll = registerActionHandler('scrollHomeToSection', async (sectionId: string) => {
      const y = sectionY.current[sectionId] ?? 0;
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
      await wait(450);
    });
    const offTop = registerActionHandler('scrollHomeToTop', async () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      await wait(350);
    });
    return () => { offScroll(); offTop(); };
  }, []);

  useEffect(() => {
    if (searchResetNonce > 0) {
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  }, [searchResetNonce]);

  // Guidance: start the hero tour on first home landing, then surface
  // home-level tips. maybeStartTour / maybeShowTip self-gate (once + caps).
  useFocusEffect(
    useCallback(() => {
      guidance.maybeStartTour('hero');
      const tid = setTimeout(() => {
        guidance.maybeShowTip('tip.tripReminder');
        guidance.maybeShowTip('tip.categoryPills');
        guidance.maybeShowTip('tip.savedItems');
        guidance.maybeShowTip('tip.inbox');
      }, 1500);
      return () => clearTimeout(tid);
    }, [guidance])
  );

  // Handle openSearch param (from PlanBottomSheet "Explore a Destination")
  const { openSearch } = useLocalSearchParams<{ openSearch?: string }>();
  useEffect(() => {
    if (openSearch === 'true') {
      setTimeout(() => setIsSearchFocused(true), 350);
    }
  }, [openSearch]);
  
  // Homepage data with pull-to-refresh
  const { isRefreshing, refresh } = useHomepageData();
  
  // Get nearest upcoming trip for reminder (use raw trips + useMemo to avoid infinite loop)
  const trips = useTripStore(state => state.trips);
  const fetchTrips = useTripStore(state => state.fetchTrips);

  // Load trips whenever the home screen gains focus so the trip reminder card
  // appears immediately on first launch (not only after visiting the Trips tab).
  useFocusEffect(
    useCallback(() => {
      if (profile?.id) fetchTrips(profile.id);
    }, [profile?.id])
  );

  const nearestTrip = useMemo(() => {
    const midnight = (d: Date | string) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
    const todayMid = midnight(new Date());
    // Prefer a currently-ongoing trip (today within start..end, not cancelled)
    const ongoing = trips.filter(t => t.state !== TripState.CANCELLED && todayMid >= midnight(t.startDate) && todayMid <= midnight(t.endDate));
    if (ongoing.length > 0) {
      return ongoing.sort((a, b) => midnight(a.startDate) - midnight(b.startDate))[0];
    }
    const upcoming = trips.filter(t => t.state === TripState.UPCOMING);
    if (upcoming.length === 0) return null;
    return upcoming.sort((a, b) => {
      const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
      const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
      return dateA.getTime() - dateB.getTime();
    })[0];
  }, [trips]);
  
  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refresh();
  }, [refresh]);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = profile?.first_name || 'Traveler';
    if (hour >= 5 && hour < 12) return `Good morning, ${name}`;
    if (hour >= 12 && hour < 17) return `Good afternoon, ${name}`;
    if (hour >= 17 && hour < 21) return `Good evening, ${name}`;
    return `Hey, ${name}`;
  }, [profile?.first_name]);

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    safeArea: { backgroundColor: colors.background },
    welcomeText: { color: colors.textPrimary },
    locationText: { color: colors.textSecondary },
    notificationBadge: { backgroundColor: colors.error },
    notificationCount: { color: '#FFFFFF' },
    notificationIcon: { backgroundColor: colors.bgCard },
    searchBar: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderSubtle },
    searchInput: { color: colors.textPrimary },
    filterButton: { backgroundColor: colors.bgCard },
    categoryCircle: { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle },
    categoryText: { color: colors.textPrimary },
  }), [colors]);

  const handleCategoryPress = (categoryName: string) => {
    switch (categoryName) {
      case 'Plan':
        setIsPlanBottomSheetVisible(true);
        break;
      case 'Flight':
        setIsFlightBookingVisible(true);
        break;
      case 'Hotel':
        setIsHotelBookingVisible(true);
        break;
      case 'Package':
        setIsPackageBookingVisible(true);
        break;
      case 'Car':
        setIsCarRentalVisible(true);
        break;
      case 'Experiences':
        setIsExperienceVisible(true);
        break;
      default:
        break;
    }
  };

  // Search handlers
  const handleSearchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearchFocused(true);
  };

  const handleSelectSearch = (
    term: string,
    dates?: { start?: Date; end?: Date },
    guests?: { adults: number; children: number; infants: number },
    selectedTopics?: string[],
    country?: string,
  ) => {
    setIsSearchFocused(false);

    const now = new Date();
    const defaultStart = new Date(now.getTime() + 86400000);
    const defaultEnd = new Date(now.getTime() + 8 * 86400000);
    const startDate = (dates?.start || defaultStart).toISOString().split('T')[0];
    const endDate = (dates?.end || defaultEnd).toISOString().split('T')[0];
    const adults = String(guests?.adults || 1);
    const children = String(guests?.children || 0);
    const infants = String(guests?.infants || 0);
    const topics = selectedTopics?.length ? selectedTopics.join(',') : '';

    const originCity = profile?.city || '';
    const nationality = profile?.country || 'US';
    const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
    router.push(
      `/search/snapshot?destination=${encodeURIComponent(term)}${countryParam}&startDate=${startDate}&endDate=${endDate}&adults=${adults}&children=${children}&infants=${infants}&originCity=${encodeURIComponent(originCity)}&nationality=${encodeURIComponent(nationality)}&topics=${encodeURIComponent(topics)}` as any,
    );
  };

  const handleCloseSearchOverlay = () => {
    setIsSearchFocused(false);
  };

  
  return (
    <SafeAreaView style={[styles.safeArea, dynamicStyles.safeArea]}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent={false} backgroundColor={colors.background} />
      <View style={styles.container}>
      
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <TourAnchor id="home.header" style={styles.header}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.profileImage}
              accessibilityLabel="Profile photo"
            />
          ) : (
            <View style={[styles.profileImage, styles.avatarFallback, { backgroundColor: colors.primary }]} accessibilityLabel="Profile avatar">
              <Text style={styles.avatarInitial}>
                {(profile?.first_name?.[0] || 'T').toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeText, dynamicStyles.welcomeText]}>
              {greeting} 👋
            </Text>
            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/account/location-settings' as any); }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Change location settings"
            >
              <Location size={14} color={colors.textSecondary} variant="Bold" />
              <Text style={[styles.locationText, dynamicStyles.locationText]} numberOfLines={1}>
                {profile?.location_name || profile?.city || t('home.setLocation')}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerActions}>
            <TourAnchor id="home.savedButton">
              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: colors.bgCard }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/deals/saved' as any); }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Saved deals"
              >
                <Archive size={20} color={colors.textPrimary} variant="Bold" />
              </TouchableOpacity>
            </TourAnchor>
            <TourAnchor id="home.notifButton">
              <View style={[styles.notificationIcon, dynamicStyles.notificationIcon]}>
                <NotificationBell size={20} />
              </View>
            </TourAnchor>
          </View>
        </TourAnchor>

        {/* Search Bar - Tapping opens full-screen search overlay */}
        <TourAnchor id="home.search">
          <TouchableOpacity
            style={[styles.searchBarFull, dynamicStyles.searchBar]}
            activeOpacity={0.8}
            onPress={handleSearchPress}
            accessibilityRole="search"
            accessibilityLabel="Search destinations"
            accessibilityHint="Opens the search overlay"
          >
            <SearchNormal1 size={20} color={colors.textSecondary} />
            <AnimatedSearchPlaceholder style={[styles.searchPlaceholder, { color: colors.textSecondary }]} userCity={profile?.city} userCountry={profile?.country} />
          </TouchableOpacity>
        </TourAnchor>

        {/* Categories */}
        <TourAnchor id="home.categoryPills">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category.name)}
                accessibilityRole="button"
                accessibilityLabel={`${category.name} category`}
              >
                <View style={[
                  styles.categoryCircle,
                  { backgroundColor: category.bgColor, borderColor: category.color }
                ]}>
                  <Icon size={24} color={category.color} variant="Bold" />
                </View>
                <Text style={[styles.categoryText, dynamicStyles.categoryText]}>{category.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        </TourAnchor>

        {/* Trip card — Live mode during an ongoing trip, countdown for the nearest upcoming trip */}
        {nearestTrip && (() => {
          // Get flight data directly from trip DB fields (bookings array is not populated at list level)
          const dbFields = (nearestTrip as any)._db;
          const flightNumber = dbFields?.flightNumber;
          const route = dbFields?.route; // e.g. "LAX → CDG"
          const departureAirport = route ? route.split('→')[0]?.trim().split('–')[0]?.trim().split(' ')[0] : undefined;
          const startDate = nearestTrip.startDate instanceof Date ? nearestTrip.startDate : new Date(nearestTrip.startDate);
          const endDate = nearestTrip.endDate instanceof Date ? nearestTrip.endDate : new Date(nearestTrip.endDate);
          const midnight = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
          const todayMid = midnight(new Date());
          const isOngoing = todayMid >= midnight(startDate) && todayMid <= midnight(endDate);
          return (
            <TourAnchor id="home.tripReminder">
              <TripReminder
                destination={nearestTrip.destination?.city || nearestTrip.title}
                tripDate={startDate}
                endDate={endDate}
                isOngoing={isOngoing}
                flightNumber={flightNumber}
                departureAirport={departureAirport}
                isInternational={true}
                tripId={nearestTrip.id}
                seatNumber={dbFields?.seatNumber}
                cabinClass={dbFields?.cabinClass}
              />
            </TourAnchor>
          );
        })()}

        {/* No trip yet → keep travel-profile progress visible so the user is
            nudged to complete it every session (until it's essentially done). */}
        {!nearestTrip && guidance.strength > 0 && guidance.strength < 100 && (
          <TourAnchor id="home.tripReminder">
            <TravelProfileHomeCard strength={guidance.strength} />
          </TourAnchor>
        )}

        {/* Sections - Now using modular SectionRenderer.
            The independent Journeys module is rendered as the FIRST section
            (above Deals) so users see purpose-driven travel right after login
            (rendered, not coupled — host only uses the module's public API). */}
        {SECTIONS_CONFIG.map((section) => (
          <Fragment key={section.id}>
            {section.componentType === 'deals' ? (
              <TourAnchor
                id="home.section.journeys"
                onLayout={(e) => { sectionY.current['journeys'] = e.nativeEvent.layout.y; }}
              >
                <JourneysHomeSection />
              </TourAnchor>
            ) : null}
            {section.componentType === 'deals' ? (
              <TourAnchor
                id="home.section.deals"
                onLayout={(e) => { sectionY.current['deals'] = e.nativeEvent.layout.y; }}
              >
                <SectionRenderer section={section} />
              </TourAnchor>
            ) : (
              <SectionRenderer section={section} />
            )}
          </Fragment>
        ))}
      </ScrollView>
      </View>

      {/* Plan Bottom Sheet */}
      <PlanBottomSheet 
        visible={isPlanBottomSheetVisible}
        onClose={() => setIsPlanBottomSheetVisible(false)}
      />

      {/* Flight Booking Flow */}
      <FlightBookingFlow
        visible={isFlightBookingVisible}
        onClose={() => setIsFlightBookingVisible(false)}
      />

      {/* Hotel Booking Flow */}
      <HotelBookingFlow
        visible={isHotelBookingVisible}
        onClose={() => setIsHotelBookingVisible(false)}
      />

      {/* Package Booking Flow */}
      <PackageBookingFlow
        visible={isPackageBookingVisible}
        onClose={() => setIsPackageBookingVisible(false)}
      />

      {/* Car Rental Flow */}
      <CarBookingFlow
        visible={isCarRentalVisible}
        onClose={() => setIsCarRentalVisible(false)}
      />

      {/* Experience Booking Flow */}
      <ExperienceFlow
        visible={isExperienceVisible}
        onClose={() => setIsExperienceVisible(false)}
      />

      {/* Search Overlay */}
      <SearchOverlay
        key={searchResetNonce}
        visible={isSearchFocused}
        query={searchQuery}
        onSelectSearch={handleSelectSearch}
        onClose={handleCloseSearchOverlay}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  notificationCount: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarFull: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    height: 48,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  categoriesScroll: {
    marginBottom: spacing.lg,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  categoryItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
