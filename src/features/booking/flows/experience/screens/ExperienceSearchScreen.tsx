/**
 * EXPERIENCE SEARCH SCREEN
 * 
 * Search for experiences by destination, date, participants, and category.
 * Follows the same pattern as CarSearchScreen and HotelSearchScreen.
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  CloseCircle,
  SearchNormal1,
  Location,
  Calendar,
  People,
  Map1,
  Ticket,
  Coffee,
  Activity,
  Tree,
  Brush,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useExperienceStore } from '../../../stores/useExperienceStore';
import { ExperienceCategory } from '../../../types/experience.types';
import { Location as LocationType } from '../../../types/booking.types';

// Import sheets
import LocationPickerSheet from '../sheets/LocationPickerSheet';
import DatePickerSheet from '../sheets/DatePickerSheet';
import ParticipantsSheet from '../sheets/ParticipantsSheet';

interface ExperienceSearchScreenProps {
  onSearch: () => void;
  onBack: () => void;
  onClose: () => void;
}

// Category options
const CATEGORIES: { id: ExperienceCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'tours', label: 'Tours', icon: <Map1 size={18} color={colors.primary} variant="Bold" /> },
  { id: 'attractions', label: 'Attractions', icon: <Ticket size={18} color={colors.primary} variant="Bold" /> },
  { id: 'food_drink', label: 'Food & Drink', icon: <Coffee size={18} color={colors.primary} variant="Bold" /> },
  { id: 'adventure', label: 'Adventure', icon: <Activity size={18} color={colors.primary} variant="Bold" /> },
  { id: 'nature_wildlife', label: 'Nature', icon: <Tree size={18} color={colors.primary} variant="Bold" /> },
  { id: 'classes_workshops', label: 'Classes', icon: <Brush size={18} color={colors.primary} variant="Bold" /> },
];

export default function ExperienceSearchScreen({
  onSearch,
  onBack,
  onClose,
}: ExperienceSearchScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    searchParams,
    setDestination,
    setDate,
    setParticipants,
    setCategory,
  } = useExperienceStore();

  // Sheet visibility states
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showParticipantsSheet, setShowParticipantsSheet] = useState(false);

  // Set default date if not set
  useEffect(() => {
    if (!searchParams.date) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow);
    }
  }, []);

  // Validation
  const canSearch = searchParams.destination && searchParams.date;

  const handleSearch = useCallback(() => {
    if (!canSearch) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSearch();
  }, [canSearch, onSearch]);

  // Format helpers
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select date';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Select date';
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalParticipants = (): number => {
    const { adults, children, infants } = searchParams.participants;
    return adults + children + infants;
  };

  const handleCategoryToggle = (category: ExperienceCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (searchParams.category === category) {
      setCategory(undefined);
    } else {
      setCategory(category);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/experiencebg.png')}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Find Experiences</Text>
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
        {/* Destination Card - Overlapping Header */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <TouchableOpacity
            style={styles.destinationCard}
            onPress={() => setShowLocationSheet(true)}
            activeOpacity={0.7}
          >
            <View style={styles.destinationIconContainer}>
              <Location size={20} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.destinationContent}>
              <Text style={styles.destinationLabel}>Destination</Text>
              <Text style={[styles.destinationValue, !searchParams.destination && styles.destinationPlaceholder]}>
                {searchParams.destination?.name || 'Where are you going?'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Date Field */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => setShowDateSheet(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.fieldIcon, { backgroundColor: `${colors.success}15` }]}>
              <Calendar size={20} color={colors.success} variant="Bold" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>When</Text>
              <Text style={[styles.fieldValue, !searchParams.date && styles.fieldPlaceholder]}>
                {formatDate(searchParams.date)}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Participants Field */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => setShowParticipantsSheet(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.fieldIcon, { backgroundColor: `${colors.warning}15` }]}>
              <People size={20} color={colors.warning} variant="Bold" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Guests</Text>
              <Text style={styles.fieldValue}>
                {getTotalParticipants()} {getTotalParticipants() === 1 ? 'Guest' : 'Guests'}
              </Text>
              <Text style={styles.fieldSubtext}>
                {searchParams.participants.adults} Adults
                {searchParams.participants.children > 0 && `, ${searchParams.participants.children} Children`}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Categories */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)}>
          <Text style={styles.sectionLabel}>Category (Optional)</Text>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryToggle(cat.id)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryCheckbox}>
                  {searchParams.category === cat.id ? (
                    <TickCircle size={24} color={colors.primary} variant="Bold" />
                  ) : (
                    <View style={styles.emptyCheckbox} />
                  )}
                </View>
                <Text style={styles.categoryCardText}>{cat.label}</Text>
                {cat.icon}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
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
            style={styles.searchGradient}
          >
            <SearchNormal1 size={20} color={colors.white} />
            <Text style={styles.searchText}>Search Experiences</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Sheets */}
      <LocationPickerSheet
        visible={showLocationSheet}
        onClose={() => setShowLocationSheet(false)}
        onSelect={(location: LocationType) => {
          setDestination(location);
          setShowLocationSheet(false);
        }}
        title="Select Destination"
      />

      <DatePickerSheet
        visible={showDateSheet}
        onClose={() => setShowDateSheet(false)}
        onSelect={(date: Date) => {
          setDate(date);
          setShowDateSheet(false);
        }}
        selectedDate={searchParams.date}
        title="Select Date"
      />

      <ParticipantsSheet
        visible={showParticipantsSheet}
        onClose={() => setShowParticipantsSheet(false)}
        participants={searchParams.participants}
        onUpdate={setParticipants}
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
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  destinationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  destinationContent: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  destinationValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  destinationPlaceholder: {
    color: colors.gray400,
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  fieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  fieldPlaceholder: {
    color: colors.gray400,
  },
  fieldSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  categoriesContainer: {
    gap: spacing.sm,
  },
  categoryCard: {
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
  categoryCheckbox: {
    marginRight: spacing.md,
  },
  emptyCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray300,
  },
  categoryCardText: {
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
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
  },
  searchText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
