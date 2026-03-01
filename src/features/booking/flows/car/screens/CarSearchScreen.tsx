/**
 * CAR SEARCH SCREEN
 * 
 * Single-page car search with all fields visible.
 * Tapping fields opens bottom sheet modals for selection.
 * Follows the same pattern as FlightSearchScreen and HotelSearchScreen.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CloseCircle, SearchNormal1, Location } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useCarStore } from '../../../stores/useCarStore';
import { Location as LocationType } from '../../../types/booking.types';

// Import components
import LocationField from '../components/LocationField';
import DateTimeField from '../components/DateTimeField';
import DriverAgeField from '../components/DriverAgeField';

// Import sheets
import LocationPickerSheet from '../sheets/LocationPickerSheet';
import DateTimePickerSheet from '../sheets/DateTimePickerSheet';

interface CarSearchScreenProps {
  onSearch: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function CarSearchScreen({ onSearch, onBack, onClose }: CarSearchScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();
  const {
    searchParams,
    setPickupLocation,
    setReturnLocation,
    setSameReturnLocation,
    setPickupDate,
    setPickupTime,
    setReturnDate,
    setReturnTime,
    setDriverAge,
    isSearchValid,
  } = useCarStore();

  // Sheet visibility states
  const [showPickupLocationSheet, setShowPickupLocationSheet] = useState(false);
  const [showReturnLocationSheet, setShowReturnLocationSheet] = useState(false);
  const [showPickupDateSheet, setShowPickupDateSheet] = useState(false);
  const [showReturnDateSheet, setShowReturnDateSheet] = useState(false);

  const handleSearch = useCallback(() => {
    if (!isSearchValid()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSearch();
  }, [isSearchValid, onSearch]);

  const handlePickupLocationSelect = (location: LocationType) => {
    setPickupLocation(location);
    setShowPickupLocationSheet(false);
  };

  const handleReturnLocationSelect = (location: LocationType) => {
    setReturnLocation(location);
    setShowReturnLocationSheet(false);
  };

  const handlePickupDateTimeSelect = (date: Date, time: string) => {
    setPickupDate(date);
    setPickupTime(time);
    setShowPickupDateSheet(false);
  };

  const handleReturnDateTimeSelect = (date: Date, time: string) => {
    setReturnDate(date);
    setReturnTime(time);
    setShowReturnDateSheet(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/carbg.png')}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Find Your Car</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onBack}>
            <CloseCircle size={24} color={colors.white} variant="Bold" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pickup Location - Overlapping Header */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <TouchableOpacity 
            style={styles.pickupCard}
            onPress={() => setShowPickupLocationSheet(true)}
            activeOpacity={0.7}
          >
            <View style={styles.pickupIconContainer}>
              <Location size={20} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.pickupContent}>
              <Text style={styles.pickupLabel}>Pickup Location</Text>
              <Text style={[styles.pickupValue, !searchParams.pickupLocation && styles.pickupPlaceholder]}>
                {searchParams.pickupLocation?.name || 'Where are you picking up?'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Same Return Location Toggle */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Return to same location</Text>
          <Switch
            value={searchParams.sameReturnLocation}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSameReturnLocation(value);
            }}
            trackColor={{ false: colors.gray300, true: `${colors.primary}50` }}
            thumbColor={searchParams.sameReturnLocation ? colors.primary : colors.gray400}
          />
        </Animated.View>

        {/* Return Location (if different) */}
        {!searchParams.sameReturnLocation && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <LocationField
              label="Return Location"
              value={searchParams.returnLocation?.name || null}
              placeholder="Select return location"
              onPress={() => setShowReturnLocationSheet(true)}
              variant="return"
            />
          </Animated.View>
        )}

        {/* Pickup Date & Time */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <DateTimeField
            label="Pickup"
            date={searchParams.pickupDate}
            time={searchParams.pickupTime}
            onDatePress={() => setShowPickupDateSheet(true)}
            onTimePress={() => setShowPickupDateSheet(true)}
            variant="pickup"
          />
        </Animated.View>

        {/* Return Date & Time */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)}>
          <DateTimeField
            label="Return"
            date={searchParams.returnDate}
            time={searchParams.returnTime}
            onDatePress={() => setShowReturnDateSheet(true)}
            onTimePress={() => setShowReturnDateSheet(true)}
            variant="return"
          />
        </Animated.View>

        {/* Driver Age */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <DriverAgeField
            age={searchParams.driverAge}
            onAgeChange={setDriverAge}
          />
        </Animated.View>
      </ScrollView>

      {/* Search Button */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isSearchValid() ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchGradient}
          >
            <SearchNormal1 size={20} color={colors.white} />
            <Text style={styles.searchText}>Search Cars</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Sheets */}
      <LocationPickerSheet
        visible={showPickupLocationSheet}
        onClose={() => setShowPickupLocationSheet(false)}
        onSelect={handlePickupLocationSelect}
        title="Pickup Location"
      />

      <LocationPickerSheet
        visible={showReturnLocationSheet}
        onClose={() => setShowReturnLocationSheet(false)}
        onSelect={handleReturnLocationSelect}
        title="Return Location"
      />

      <DateTimePickerSheet
        visible={showPickupDateSheet}
        onClose={() => setShowPickupDateSheet(false)}
        onSelect={handlePickupDateTimeSelect}
        selectedDate={searchParams.pickupDate}
        selectedTime={searchParams.pickupTime}
        minDate={new Date()}
        title="Pickup Date & Time"
      />

      <DateTimePickerSheet
        visible={showReturnDateSheet}
        onClose={() => setShowReturnDateSheet(false)}
        onSelect={handleReturnDateTimeSelect}
        selectedDate={searchParams.returnDate}
        selectedTime={searchParams.returnTime}
        minDate={searchParams.pickupDate}
        title="Return Date & Time"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 160,
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
    zIndex: 2,
  },
  headerSpacer: {
    width: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
    marginTop: -40,
    zIndex: 20,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  // Pickup Card (overlapping header)
  pickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pickupIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pickupContent: {
    flex: 1,
  },
  pickupLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  pickupValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  pickupPlaceholder: {
    color: colors.gray400,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  toggleLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    // Ensure button is above scroll content
    zIndex: 100,
    elevation: 10,
    // Add shadow for visual separation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  searchButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  searchText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
