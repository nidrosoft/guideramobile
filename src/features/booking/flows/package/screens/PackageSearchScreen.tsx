/**
 * PACKAGE SEARCH SCREEN
 * 
 * Initial screen for package booking.
 * User selects package type, origin, destination, dates, and travelers.
 * Follows the same pattern as other booking flows.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  CloseCircle,
  ArrowRight2,
  Location,
  Calendar,
  People,
  Airplane,
  Building,
  Car,
  Map1,
  Star1,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { usePackageStore } from '../../../stores/usePackageStore';
import { PACKAGE_TEMPLATES, PackageTemplate } from '../../../types/package.types';

// Import sheets - reuse from flight flow for consistency
import LocationPickerSheet from '../sheets/LocationPickerSheet';
import DatePickerSheet from '../../flight/sheets/DatePickerSheet';
import TravelerSheet from '../../flight/sheets/TravelerSheet';

// Import styles
import { styles } from './PackageSearchScreen.styles';

interface PackageSearchScreenProps {
  onContinue: () => void;
  onClose: () => void;
}

// Package type icon mapping
const PACKAGE_ICONS: Record<string, React.ComponentType<any>> = {
  package: Airplane,
  car: Car,
  map: Map1,
  star: Star1,
  settings: Building,
};

export default function PackageSearchScreen({
  onContinue,
  onClose,
}: PackageSearchScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const {
    tripSetup,
    setOrigin,
    setDestination,
    setDepartureDate,
    setReturnDate,
    setTravelers,
    setPackageType,
    getTotalTravelers,
  } = usePackageStore();
  
  // Bottom sheet visibility states
  const [showOriginSheet, setShowOriginSheet] = useState(false);
  const [showDestinationSheet, setShowDestinationSheet] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showTravelersSheet, setShowTravelersSheet] = useState(false);
  
  // Set default dates if not set
  useEffect(() => {
    if (!tripSetup.departureDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      setDepartureDate(tomorrow);
    }
    if (!tripSetup.returnDate) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 14);
      setReturnDate(nextWeek);
    }
  }, []);
  
  // Validation - check that all required fields are set
  const canContinue = Boolean(
    tripSetup.origin && 
    tripSetup.destination && 
    tripSetup.departureDate && 
    tripSetup.returnDate
  );
  
  const handleContinue = useCallback(() => {
    if (!canContinue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onContinue();
  }, [canContinue, onContinue]);
  
  const handlePackageTypeSelect = useCallback((type: PackageTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPackageType(type);
  }, [setPackageType]);
  
  // Format helpers
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Select';
    return dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    });
  };
  
  const getNights = (): number => {
    if (!tripSetup.departureDate || !tripSetup.returnDate) return 0;
    const dep = tripSetup.departureDate instanceof Date 
      ? tripSetup.departureDate 
      : new Date(tripSetup.departureDate);
    const ret = tripSetup.returnDate instanceof Date 
      ? tripSetup.returnDate 
      : new Date(tripSetup.returnDate);
    return Math.ceil((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  const handleDateSelect = (departure: Date, returnDate?: Date) => {
    setDepartureDate(departure);
    if (returnDate) {
      setReturnDate(returnDate);
    }
    setShowDateSheet(false);
  };
  
  const renderPackageTypeOption = (template: typeof PACKAGE_TEMPLATES[0]) => {
    const isSelected = tripSetup.packageType === template.type;
    const Icon = PACKAGE_ICONS[template.icon] || Airplane;
    
    return (
      <TouchableOpacity
        key={template.type}
        style={[styles.packageTypeOption, isSelected && styles.packageTypeOptionSelected]}
        onPress={() => handlePackageTypeSelect(template.type)}
        activeOpacity={0.7}
      >
        {template.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>Popular</Text>
          </View>
        )}
        <View style={[styles.packageTypeIcon, isSelected && styles.packageTypeIconSelected]}>
          <Icon 
            size={24} 
            color={isSelected ? colors.white : colors.primary} 
            variant={isSelected ? 'Bold' : 'Linear'}
          />
        </View>
        <Text style={[styles.packageTypeLabel, isSelected && styles.packageTypeLabelSelected]}>
          {template.label}
        </Text>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/packagebg.png')}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <View style={styles.headerSpacer} />
          
          <Text style={styles.title}>Build Your Package</Text>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
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
        {/* Package Type Selection - Overlapping Header */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <View style={styles.packageTypeCard}>
            <Text style={styles.packageTypeTitle}>Choose Package Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.packageTypesContainer}
            >
              {PACKAGE_TEMPLATES.filter(t => t.type !== 'custom').map(renderPackageTypeOption)}
            </ScrollView>
          </View>
        </Animated.View>
        
        {/* Origin Field */}
        <Animated.View entering={FadeInDown.duration(300).delay(150)}>
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => setShowOriginSheet(true)}
            activeOpacity={0.7}
          >
            <View style={styles.fieldIcon}>
              <Location size={20} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>From</Text>
              <Text style={[styles.fieldValue, !tripSetup.origin && styles.fieldPlaceholder]}>
                {tripSetup.origin?.name || 'Select origin city'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Destination Field */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)}>
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => setShowDestinationSheet(true)}
            activeOpacity={0.7}
          >
            <View style={styles.fieldIcon}>
              <Location size={20} color={colors.success} variant="Bold" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>To</Text>
              <Text style={[styles.fieldValue, !tripSetup.destination && styles.fieldPlaceholder]}>
                {tripSetup.destination?.name || 'Select destination'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Date Range Field */}
        <Animated.View entering={FadeInDown.duration(300).delay(250)}>
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => setShowDateSheet(true)}
            activeOpacity={0.7}
          >
            <View style={styles.fieldIcon}>
              <Calendar size={20} color={colors.warning} variant="Bold" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Travel Dates</Text>
              <View style={styles.dateRow}>
                <Text style={styles.fieldValue}>
                  {formatDate(tripSetup.departureDate)} - {formatDate(tripSetup.returnDate)}
                </Text>
                {getNights() > 0 && (
                  <View style={styles.nightsBadge}>
                    <Text style={styles.nightsText}>{getNights()} nights</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Travelers Field */}
        <Animated.View entering={FadeInDown.duration(300).delay(300)}>
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => setShowTravelersSheet(true)}
            activeOpacity={0.7}
          >
            <View style={styles.fieldIcon}>
              <People size={20} color={colors.info} variant="Bold" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Travelers</Text>
              <Text style={styles.fieldValue}>
                {getTotalTravelers()} traveler{getTotalTravelers() !== 1 ? 's' : ''}
                {tripSetup.travelers.children > 0 && ` (${tripSetup.travelers.children} child${tripSetup.travelers.children !== 1 ? 'ren' : ''})`}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Package Summary */}
        <Animated.View entering={FadeInDown.duration(300).delay(350)}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Package Includes</Text>
            <View style={styles.includesRow}>
              {tripSetup.requiredCategories.map((category) => {
                const icons: Record<string, React.ComponentType<any>> = {
                  flight: Airplane,
                  hotel: Building,
                  car: Car,
                  experience: Map1,
                };
                const Icon = icons[category];
                return (
                  <View key={category} style={styles.includeItem}>
                    <Icon size={18} color={colors.primary} variant="Bold" />
                    <Text style={styles.includeText}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Continue Button */}
      <Animated.View 
        entering={FadeInDown.duration(300).delay(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canContinue ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>Build Your Package</Text>
            <ArrowRight2 size={20} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Bottom Sheets */}
      <LocationPickerSheet
        visible={showOriginSheet}
        onClose={() => setShowOriginSheet(false)}
        onSelect={setOrigin}
        selected={tripSetup.origin}
        title="Select Origin"
        type="origin"
      />
      
      <LocationPickerSheet
        visible={showDestinationSheet}
        onClose={() => setShowDestinationSheet(false)}
        onSelect={setDestination}
        selected={tripSetup.destination}
        title="Select Destination"
        type="destination"
      />
      
      <DatePickerSheet
        visible={showDateSheet}
        onClose={() => setShowDateSheet(false)}
        onSelect={handleDateSelect}
        tripType="round-trip"
        departureDate={tripSetup.departureDate}
        returnDate={tripSetup.returnDate}
      />
      
      <TravelerSheet
        visible={showTravelersSheet}
        onClose={() => setShowTravelersSheet(false)}
        passengers={tripSetup.travelers}
        onSave={(passengers) => {
          setTravelers(passengers);
          setShowTravelersSheet(false);
        }}
      />
    </View>
  );
}
