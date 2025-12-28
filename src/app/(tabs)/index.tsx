/**
 * HOME SCREEN - REFACTORED
 * 
 * Modular homepage using SectionRenderer for all sections.
 * Reduced from 666 lines to ~150 lines.
 */

import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { SearchNormal1, Setting4 } from 'iconsax-react-native';
import TripReminder from '@/components/features/home/TripReminder';
import SectionRenderer from '@/components/features/home/SectionRenderer';
import PlanBottomSheet from '@/components/features/home/PlanBottomSheet';
import { FlightBookingFlow, HotelBookingFlow, PackageBookingFlow, CarBookingFlow, ExperienceFlow } from '@/features/booking';
import { categories } from '@/data/categories';
import { SECTIONS_CONFIG } from '@/config/sections.config';

export default function Home() {
  const [isPlanBottomSheetVisible, setIsPlanBottomSheetVisible] = useState(false);
  const [isFlightBookingVisible, setIsFlightBookingVisible] = useState(false);
  const [isHotelBookingVisible, setIsHotelBookingVisible] = useState(false);
  const [isPackageBookingVisible, setIsPackageBookingVisible] = useState(false);
  const [isCarRentalVisible, setIsCarRentalVisible] = useState(false);
  const [isExperienceVisible, setIsExperienceVisible] = useState(false);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" translucent={false} backgroundColor={colors.background} />
      <View style={styles.container}>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
            style={styles.profileImage}
          />
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome, Daniel 👋</Text>
            <Text style={styles.locationText}>San Diego, USA</Text>
          </View>
          <View style={styles.notificationContainer}>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
            <View style={styles.notificationIcon}>
              <Text style={styles.bellIcon}>🔔</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <SearchNormal1 size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Where can we take you ?"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Setting4 size={20} color={colors.textPrimary} variant="Outline" />
          </TouchableOpacity>
        </View>

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
                <Text style={styles.categoryText}>{category.name}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
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
    color: colors.white,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
});
