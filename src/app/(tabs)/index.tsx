/**
 * HOME SCREEN - REFACTORED
 * 
 * Modular homepage using SectionRenderer for all sections.
 * Reduced from 666 lines to ~150 lines.
 */

import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { SearchNormal1, Archive, Location } from 'iconsax-react-native';
import NotificationBell from '@/components/features/notifications/NotificationBell';
import TripReminder from '@/components/features/home/TripReminder';
import SectionRenderer from '@/components/features/home/SectionRenderer';
import PlanBottomSheet from '@/components/features/home/PlanBottomSheet';
import { SearchOverlay } from '@/components/features/search';
import { FlightBookingFlow, HotelBookingFlow, PackageBookingFlow, CarBookingFlow, ExperienceFlow } from '@/features/booking';
import { categories } from '@/data/categories';
import { SECTIONS_CONFIG } from '@/config/sections.config';
import { useAuth } from '@/context/AuthContext';
import { useHomepageData } from '@/features/homepage';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { TripState } from '@/features/trips/types/trip.types';

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
  
  // Homepage data with pull-to-refresh
  const { isRefreshing, refresh } = useHomepageData();
  
  // Get nearest upcoming trip for reminder (use raw trips + useMemo to avoid infinite loop)
  const trips = useTripStore(state => state.trips);
  const nearestTrip = useMemo(() => {
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

  const handleSelectSearch = (term: string, dates?: { start?: Date; end?: Date }, guests?: { adults: number; children: number; infants: number }) => {
    setSearchQuery(term);
    setIsSearchFocused(false);

    // Default dates: tomorrow + 7 days if not provided
    const now = new Date();
    const defaultStart = new Date(now.getTime() + 86400000);
    const defaultEnd = new Date(now.getTime() + 8 * 86400000);
    const startDate = (dates?.start || defaultStart).toISOString().split('T')[0];
    const endDate = (dates?.end || defaultEnd).toISOString().split('T')[0];
    const adults = String(guests?.adults || 1);
    const children = String(guests?.children || 0);
    const infants = String(guests?.infants || 0);

    router.push(`/search/snapshot?destination=${encodeURIComponent(term)}&startDate=${startDate}&endDate=${endDate}&adults=${adults}&children=${children}&infants=${infants}` as any);
  };

  const handleCloseSearchOverlay = () => {
    setIsSearchFocused(false);
  };

  
  return (
    <SafeAreaView style={[styles.safeArea, dynamicStyles.safeArea]}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent={false} backgroundColor={colors.background} />
      <View style={styles.container}>
      
      <ScrollView 
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
        <View style={styles.header}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, styles.avatarFallback, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitial}>
                {(profile?.first_name?.[0] || 'T').toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeText, dynamicStyles.welcomeText]}>
              {t('home.welcomeUser', { name: profile?.first_name || 'Traveler' })}
            </Text>
            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/account/location-settings' as any); }}
              activeOpacity={0.7}
            >
              <Location size={14} color={colors.textSecondary} variant="Bold" />
              <Text style={[styles.locationText, dynamicStyles.locationText]} numberOfLines={1}>
                {profile?.location_name || profile?.city || t('home.setLocation')}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: colors.bgCard }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/deals/saved' as any); }}
              activeOpacity={0.7}
            >
              <Archive size={20} color={colors.textPrimary} variant="Bold" />
            </TouchableOpacity>
            <View style={[styles.notificationIcon, dynamicStyles.notificationIcon]}>
              <NotificationBell size={20} />
            </View>
          </View>
        </View>

        {/* Search Bar - Tapping opens full-screen search overlay */}
        <TouchableOpacity 
          style={[styles.searchBarFull, dynamicStyles.searchBar]}
          activeOpacity={0.8}
          onPress={handleSearchPress}
        >
          <SearchNormal1 size={20} color={colors.textSecondary} />
          <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>
            {t('home.searchPlaceholder')}
          </Text>
        </TouchableOpacity>

        {/* Categories */}
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

        {/* Trip Reminder — only shows if user has an upcoming trip */}
        {nearestTrip && (() => {
          const firstFlight = nearestTrip.bookings?.find(b => b.type === 'flight');
          const flightDetails = firstFlight?.details as any;
          return (
            <TripReminder 
              destination={nearestTrip.destination?.city || nearestTrip.title} 
              tripDate={nearestTrip.startDate instanceof Date ? nearestTrip.startDate : new Date(nearestTrip.startDate)}
              flightNumber={flightDetails?.flightNumber}
              departureAirport={flightDetails?.departure?.airport}
              isInternational={true}
              tripId={nearestTrip.id}
            />
          );
        })()}

        {/* Sections - Now using modular SectionRenderer */}
        {SECTIONS_CONFIG.map((section) => (
          <SectionRenderer key={section.id} section={section} />
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
