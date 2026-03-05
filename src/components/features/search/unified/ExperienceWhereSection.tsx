/**
 * EXPERIENCE WHERE SECTION
 * 
 * Experience-specific location and category selection for the unified search overlay.
 * Handles destination selection via location picker sheet and optional category filter.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Location,
  Map1,
  Ticket,
  Coffee,
  Activity,
  Tree,
  Brush,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Location as LocationType } from '@/features/booking/types/booking.types';
import { ExperienceCategory } from '@/features/booking/types/experience.types';

// Re-use the experience flow's LocationPickerSheet
import LocationPickerSheet from '@/features/booking/flows/experience/sheets/LocationPickerSheet';

// Category options with theme-aware icon rendering
const CATEGORIES: { id: ExperienceCategory; label: string; iconName: string }[] = [
  { id: 'tours', label: 'Tours', iconName: 'map' },
  { id: 'attractions', label: 'Attractions', iconName: 'ticket' },
  { id: 'food_drink', label: 'Food & Drink', iconName: 'coffee' },
  { id: 'adventure', label: 'Adventure', iconName: 'activity' },
  { id: 'nature_wildlife', label: 'Nature', iconName: 'tree' },
  { id: 'classes_workshops', label: 'Classes', iconName: 'brush' },
];

interface ExperienceWhereSectionProps {
  destination: LocationType | null;
  category: ExperienceCategory | undefined;
  onDestinationSelect: (location: LocationType) => void;
  onCategoryChange: (category: ExperienceCategory | undefined) => void;
}

export default function ExperienceWhereSection({
  destination,
  category,
  onDestinationSelect,
  onCategoryChange,
}: ExperienceWhereSectionProps) {
  const { colors: themeColors } = useTheme();
  const [showLocationSheet, setShowLocationSheet] = useState(false);

  const handleDestinationSelect = useCallback((location: LocationType) => {
    onDestinationSelect(location);
    setShowLocationSheet(false);
  }, [onDestinationSelect]);

  const handleCategoryToggle = useCallback((cat: ExperienceCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCategoryChange(category === cat ? undefined : cat);
  }, [category, onCategoryChange]);

  const renderCategoryIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'map': return <Map1 size={18} color={color} variant="Bold" />;
      case 'ticket': return <Ticket size={18} color={color} variant="Bold" />;
      case 'coffee': return <Coffee size={18} color={color} variant="Bold" />;
      case 'activity': return <Activity size={18} color={color} variant="Bold" />;
      case 'tree': return <Tree size={18} color={color} variant="Bold" />;
      case 'brush': return <Brush size={18} color={color} variant="Bold" />;
      default: return <Map1 size={18} color={color} variant="Bold" />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Destination */}
      <TouchableOpacity
        style={[
          styles.locationField,
          {
            backgroundColor: themeColors.bgCard,
            borderColor: themeColors.borderSubtle,
            borderWidth: 1,
          },
        ]}
        onPress={() => setShowLocationSheet(true)}
        activeOpacity={0.8}
      >
        <View style={[styles.locationIcon, { backgroundColor: `${themeColors.primary}15` }]}>
          <Location size={16} color={themeColors.primary} variant="Bold" />
        </View>
        <View style={styles.locationContent}>
          <Text style={[styles.locationLabel, { color: themeColors.textSecondary }]}>
            Destination
          </Text>
          <Text
            style={[
              styles.locationValue,
              { color: destination ? themeColors.textPrimary : themeColors.gray400 },
            ]}
            numberOfLines={1}
          >
            {destination ? destination.name : 'Where are you going?'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Category Selection (optional) */}
      <Text style={[styles.categoryTitle, { color: themeColors.textSecondary }]}>
        Category (Optional)
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = category === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected ? `${themeColors.primary}15` : themeColors.bgCard,
                  borderColor: isSelected ? themeColors.primary : themeColors.borderSubtle,
                  borderWidth: 1,
                },
              ]}
              onPress={() => handleCategoryToggle(cat.id)}
              activeOpacity={0.7}
            >
              {renderCategoryIcon(cat.iconName, isSelected ? themeColors.primary : themeColors.textSecondary)}
              <Text
                style={[
                  styles.categoryChipText,
                  { color: isSelected ? themeColors.primary : themeColors.textPrimary },
                ]}
              >
                {cat.label}
              </Text>
              {isSelected && (
                <TickCircle size={14} color={themeColors.primary} variant="Bold" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Location Picker Sheet */}
      <LocationPickerSheet
        visible={showLocationSheet}
        onClose={() => setShowLocationSheet(false)}
        onSelect={handleDestinationSelect}
        title="Select Destination"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.sm,
  },
  locationField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: 1,
  },
  locationValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  categoryTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: 6,
  },
  categoryChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
