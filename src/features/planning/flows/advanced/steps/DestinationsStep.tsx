/**
 * DESTINATIONS STEP
 * 
 * Step 2: Where are you going?
 * Origin and destination(s) selection with multi-city support.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import {
  ArrowRight2,
  Location,
  Add,
  Trash,
  SearchNormal1,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAdvancedPlanningStore } from '../../../stores/useAdvancedPlanningStore';
import { POPULAR_DESTINATIONS } from '../../../config/planning.config';
import { Location as LocationType } from '@/features/booking/types/booking.types';

interface DestinationsStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function DestinationsStep({
  onNext,
  onBack,
  onClose,
}: DestinationsStepProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const {
    advancedTripData,
    setOrigin,
    addDestination,
    removeDestination,
    updateDestination,
    updateDestinationNights,
    isDestinationsValid,
  } = useAdvancedPlanningStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingOrigin, setEditingOrigin] = useState(false);
  
  const isMultiCity = advancedTripData.tripType === 'multicity';
  const isOneWay = advancedTripData.tripType === 'oneway';
  
  // Filter destinations based on search
  const filteredDestinations = searchQuery
    ? POPULAR_DESTINATIONS.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.country.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : POPULAR_DESTINATIONS;
  
  const handleSelectLocation = useCallback((destination: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const location: LocationType = {
      id: destination.id,
      name: destination.name,
      code: destination.code,
      country: destination.country,
      countryCode: destination.countryCode,
      type: destination.type,
    };
    
    if (editingOrigin) {
      setOrigin(location);
      setEditingOrigin(false);
    } else if (editingIndex !== null) {
      updateDestination(editingIndex, location);
      setEditingIndex(null);
    }
    
    setSearchQuery('');
  }, [editingOrigin, editingIndex, setOrigin, updateDestination]);
  
  const handleEditOrigin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingOrigin(true);
    setEditingIndex(null);
  };
  
  const handleEditDestination = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingIndex(index);
    setEditingOrigin(false);
  };
  
  const handleAddDestination = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addDestination();
  };
  
  const handleRemoveDestination = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeDestination(index);
  };
  
  const handleNightsChange = (index: number, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentNights = advancedTripData.destinations[index].nights;
    const newNights = Math.max(1, Math.min(30, currentNights + delta));
    updateDestinationNights(index, newNights);
  };
  
  const handleContinue = useCallback(() => {
    if (!isDestinationsValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [isDestinationsValid, onNext]);
  
  const isSearching = editingOrigin || editingIndex !== null;
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Where are you going?</Text>
          <Text style={styles.subtitle}>
            {isMultiCity 
              ? 'Add your destinations in order of visit'
              : 'Set your starting point and destination'}
          </Text>
        </Animated.View>
        
        {/* Origin (for round trip and multi-city) */}
        {!isOneWay && (
          <Animated.View 
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Starting From</Text>
            <TouchableOpacity
              style={[
                styles.locationCard,
                editingOrigin && styles.locationCardEditing,
              ]}
              onPress={handleEditOrigin}
              activeOpacity={0.7}
            >
              <View style={styles.locationIcon}>
                <Location size={20} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.locationContent}>
                {advancedTripData.origin ? (
                  <>
                    <Text style={styles.locationName}>{advancedTripData.origin.name}</Text>
                    <Text style={styles.locationCountry}>{advancedTripData.origin.country}</Text>
                  </>
                ) : (
                  <Text style={styles.locationPlaceholder}>Select your origin</Text>
                )}
              </View>
              {advancedTripData.origin && (
                <TickCircle size={20} color={colors.primary} variant="Bold" />
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {/* Destinations */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(150)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>
            {isMultiCity ? 'Destinations' : 'Destination'}
          </Text>
          
          {advancedTripData.destinations.map((dest, index) => (
            <Animated.View
              key={index}
              entering={FadeIn.duration(300).delay(index * 50)}
              style={styles.destinationRow}
            >
              <TouchableOpacity
                style={[
                  styles.locationCard,
                  styles.destinationCard,
                  editingIndex === index && styles.locationCardEditing,
                ]}
                onPress={() => handleEditDestination(index)}
                activeOpacity={0.7}
              >
                <View style={styles.locationIcon}>
                  <Location size={20} color={colors.info} variant="Bold" />
                </View>
                <View style={styles.locationContent}>
                  {dest.location ? (
                    <>
                      <Text style={styles.locationName}>{dest.location.name}</Text>
                      <Text style={styles.locationCountry}>{dest.location.country}</Text>
                    </>
                  ) : (
                    <Text style={styles.locationPlaceholder}>
                      Select destination {isMultiCity ? index + 1 : ''}
                    </Text>
                  )}
                </View>
                {dest.location && (
                  <TickCircle size={20} color={colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
              
              {/* Nights selector */}
              {dest.location && (
                <View style={styles.nightsContainer}>
                  <TouchableOpacity
                    style={styles.nightsButton}
                    onPress={() => handleNightsChange(index, -1)}
                  >
                    <Text style={styles.nightsButtonText}>−</Text>
                  </TouchableOpacity>
                  <View style={styles.nightsValue}>
                    <Text style={styles.nightsNumber}>{dest.nights}</Text>
                    <Text style={styles.nightsLabel}>nights</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.nightsButton}
                    onPress={() => handleNightsChange(index, 1)}
                  >
                    <Text style={styles.nightsButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Remove button for multi-city */}
              {isMultiCity && advancedTripData.destinations.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveDestination(index)}
                >
                  <Trash size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </Animated.View>
          ))}
          
          {/* Add destination button for multi-city */}
          {isMultiCity && advancedTripData.destinations.length < 5 && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddDestination}
              activeOpacity={0.7}
            >
              <Add size={20} color={colors.primary} />
              <Text style={styles.addButtonText}>Add Another Destination</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
        
        {/* Search Section (when editing) */}
        {isSearching && (
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={styles.searchSection}
          >
            <View style={styles.searchContainer}>
              <SearchNormal1 size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search destinations..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
            
            <View style={styles.searchResults}>
              {filteredDestinations.slice(0, 6).map((destination) => (
                <TouchableOpacity
                  key={destination.id}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectLocation(destination)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.searchResultEmoji}>{destination.emoji}</Text>
                  <View style={styles.searchResultContent}>
                    <Text style={styles.searchResultName}>{destination.name}</Text>
                    <Text style={styles.searchResultCountry}>{destination.country}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
      
      {/* Continue Button */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isDestinationsValid() && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isDestinationsValid()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isDestinationsValid() 
              ? [colors.primary, colors.gradientEnd]
              : [colors.gray300, colors.gray400]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>Continue</Text>
            <ArrowRight2 size={20} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  
  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  // Location Card - Matches Flight SearchStep location cards
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  locationCardEditing: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  destinationCard: {
    flex: 1,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  locationContent: {
    flex: 1,
  },
  locationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  locationCountry: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  locationPlaceholder: {
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
  },
  
  // Destination Row
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  
  // Nights - Compact counter
  nightsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  nightsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nightsButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  nightsValue: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  nightsNumber: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  nightsLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  
  // Remove Button
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  addButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  
  // Search
  searchSection: {
    marginTop: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  searchResults: {
    gap: spacing.xs,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  searchResultEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  searchResultCountry: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Footer
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
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  continueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
