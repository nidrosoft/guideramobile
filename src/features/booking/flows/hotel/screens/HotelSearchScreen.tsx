/**
 * HOTEL SEARCH SCREEN
 * 
 * Single-page hotel search with all fields visible.
 * Tapping fields opens bottom sheet modals for selection.
 * Follows the same pattern as FlightSearchScreen.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { CloseCircle, SearchNormal1, Airplane, Car, TickSquare } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';

// Import components
import DestinationField from '../components/DestinationField';
import DateRangeField from '../components/DateRangeField';
import GuestField from '../components/GuestField';

// Import bottom sheets
import LocationPickerSheet from '../sheets/LocationPickerSheet';
import DatePickerSheet from '../../flight/sheets/DatePickerSheet';
import GuestSheet from '../sheets/GuestSheet';

interface HotelSearchScreenProps {
  onSearch: () => void;
  onBack: () => void;
}

export default function HotelSearchScreen({
  onSearch,
  onBack,
}: HotelSearchScreenProps) {
  const insets = useSafeAreaInsets();
  const { 
    searchParams, 
    setDestination, 
    setCheckInDate, 
    setCheckOutDate, 
    setGuests,
    getNights,
  } = useHotelStore();
  
  // Bottom sheet visibility states
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showGuestSheet, setShowGuestSheet] = useState(false);
  
  // Additional options state
  const [addFlight, setAddFlight] = useState(false);
  const [addCar, setAddCar] = useState(false);
  
  // Set default dates if not set
  useEffect(() => {
    if (!searchParams.checkIn) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCheckInDate(tomorrow);
    }
    if (!searchParams.checkOut) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 4);
      setCheckOutDate(nextWeek);
    }
  }, []);
  
  // Validation
  const canSearch = searchParams.destination && searchParams.checkIn && searchParams.checkOut;
  
  const handleSearch = useCallback(() => {
    if (!canSearch) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSearch();
  }, [canSearch, onSearch]);
  
  // Format helpers - handle both Date objects and string dates (from persistence)
  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'Select date';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Select date';
    return dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  const handleDateSelect = (checkIn: Date, checkOut: Date) => {
    setCheckInDate(checkIn);
    setCheckOutDate(checkOut);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/bookingbg.png')}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <View style={styles.headerSpacer} />
          
          <Text style={styles.title}>Find a Hotel</Text>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <CloseCircle size={24} color={colors.white} variant="Bold" />
          </TouchableOpacity>
        </View>
      </ImageBackground>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Destination Field */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <DestinationField
            value={searchParams.destination?.name}
            onPress={() => setShowLocationSheet(true)}
          />
        </Animated.View>
        
        {/* Date Range Field */}
        <Animated.View entering={FadeInDown.duration(300).delay(150)}>
          <DateRangeField
            checkInDate={formatDate(searchParams.checkIn)}
            checkOutDate={formatDate(searchParams.checkOut)}
            nights={getNights()}
            onPress={() => setShowDateSheet(true)}
          />
        </Animated.View>
        
        {/* Guest Field */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)}>
          <GuestField
            rooms={searchParams.guests.rooms}
            adults={searchParams.guests.adults}
            children={searchParams.guests.children}
            onPress={() => setShowGuestSheet(true)}
          />
        </Animated.View>
        
        {/* Additional Options */}
        <Animated.View entering={FadeInDown.duration(300).delay(250)}>
          <Text style={styles.additionalTitle}>Additional</Text>
          
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAddFlight(!addFlight);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.checkbox}>
              {addFlight ? (
                <TickSquare size={24} color={colors.primary} variant="Bold" />
              ) : (
                <View style={styles.emptyCheckbox} />
              )}
            </View>
            <Text style={styles.optionCardText}>Add Flight</Text>
            <Airplane size={20} color="#3B82F6" variant="Bold" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAddCar(!addCar);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.checkbox}>
              {addCar ? (
                <TickSquare size={24} color={colors.primary} variant="Bold" />
              ) : (
                <View style={styles.emptyCheckbox} />
              )}
            </View>
            <Text style={styles.optionCardText}>Add Car Rent</Text>
            <Car size={20} color="#F97316" variant="Bold" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      
      {/* Search Button */}
      <Animated.View 
        entering={FadeInDown.duration(300).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={[styles.searchButton, !canSearch && styles.searchButtonDisabled]}
          onPress={handleSearch}
          activeOpacity={0.8}
          disabled={!canSearch}
        >
          <LinearGradient
            colors={canSearch ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchButtonGradient}
          >
            <SearchNormal1 size={20} color={colors.white} />
            <Text style={styles.searchButtonText}>Search Hotels</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Bottom Sheets */}
      <LocationPickerSheet
        visible={showLocationSheet}
        onClose={() => setShowLocationSheet(false)}
        onSelect={setDestination}
        selected={searchParams.destination}
      />
      
      <DatePickerSheet
        visible={showDateSheet}
        onClose={() => setShowDateSheet(false)}
        onSelect={(checkIn: Date, checkOut?: Date) => {
          if (checkIn && checkOut) {
            handleDateSelect(checkIn, checkOut);
          }
          setShowDateSheet(false);
        }}
        tripType="round-trip"
        departureDate={searchParams.checkIn}
        returnDate={searchParams.checkOut}
      />
      
      <GuestSheet
        visible={showGuestSheet}
        onClose={() => setShowGuestSheet(false)}
        guests={searchParams.guests}
        onUpdate={setGuests}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  headerSpacer: {
    width: 40,
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
  additionalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  checkbox: {
    marginRight: spacing.md,
  },
  emptyCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray300,
  },
  optionCardText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
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
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
  },
  searchButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
