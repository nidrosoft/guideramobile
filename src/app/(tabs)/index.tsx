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
import { SearchNormal1 } from 'iconsax-react-native';
import TripReminder from '@/components/features/home/TripReminder';
import SectionRenderer from '@/components/features/home/SectionRenderer';
import PlanBottomSheet from '@/components/features/home/PlanBottomSheet';
import { SearchOverlay } from '@/components/features/search';
import { FlightBookingFlow, HotelBookingFlow, PackageBookingFlow, CarBookingFlow, ExperienceFlow } from '@/features/booking';
import { categories } from '@/data/categories';
import { SECTIONS_CONFIG } from '@/config/sections.config';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profile.service';
import { useHomepageData } from '@/features/homepage';

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

  const handleSelectSearch = (term: string) => {
    setSearchQuery(term);
    setIsSearchFocused(false);
    router.push(`/search/results?q=${encodeURIComponent(term)}` as any);
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
          <Image
            source={{ uri: profile?.avatar_url || 'https://i.pravatar.cc/150?img=12' }}
            style={styles.profileImage}
          />
          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeText, dynamicStyles.welcomeText]}>
              {t('home.welcomeUser', { name: profile?.first_name || 'Traveler' })}
            </Text>
            <Text style={[styles.locationText, dynamicStyles.locationText]}>
              {profile?.location_name || profile?.city || t('home.setLocation')}
            </Text>
          </View>
          <View style={styles.notificationContainer}>
            <View style={[styles.notificationBadge, dynamicStyles.notificationBadge]}>
              <Text style={[styles.notificationCount, dynamicStyles.notificationCount]}>3</Text>
            </View>
            <View style={[styles.notificationIcon, dynamicStyles.notificationIcon]}>
              <Text style={styles.bellIcon}>🔔</Text>
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

        {/* Trip Reminder */}
        <TripReminder 
          destination="Singapore" 
          tripDate={new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000)} 
        />

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
  locationText: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
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
  bellIcon: {
    fontSize: 20,
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
