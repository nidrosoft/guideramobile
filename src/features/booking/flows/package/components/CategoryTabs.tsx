/**
 * CATEGORY TABS
 * 
 * Swipeable tabs for selecting flights, hotels, cars, experiences.
 * Shows completion status for each category.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Airplane,
  Building,
  Car,
  Map1,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { usePackageStore, PackageCategory } from '../../../stores/usePackageStore';

interface CategoryTabsProps {
  activeCategory: PackageCategory;
  onCategoryChange: (category: PackageCategory) => void;
}

const CATEGORIES: { id: PackageCategory; label: string; icon: any }[] = [
  { id: 'flight', label: 'Flights', icon: Airplane },
  { id: 'hotel', label: 'Hotels', icon: Building },
  { id: 'car', label: 'Cars', icon: Car },
  { id: 'experience', label: 'Activities', icon: Map1 },
];

export default function CategoryTabs({ 
  activeCategory, 
  onCategoryChange 
}: CategoryTabsProps) {
  const { isCategoryComplete, isCategoryRequired, tripSetup } = usePackageStore();
  const { colors: tc } = useTheme();
  
  const handlePress = (category: PackageCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCategoryChange(category);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          const isComplete = isCategoryComplete(category.id);
          const isRequired = isCategoryRequired(category.id);
          
          // Determine tab state
          const showRequired = isRequired && !isComplete;
          const showComplete = isComplete;
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.tab,
                { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle },
                isActive && { backgroundColor: tc.primary, borderColor: tc.primary },
                isComplete && { backgroundColor: `${tc.success}10`, borderColor: `${tc.success}30` },
              ]}
              onPress={() => handlePress(category.id)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: tc.bgCard },
                  isActive && { backgroundColor: colors.primaryDark },
                  isComplete && { backgroundColor: `${tc.success}20` },
                ]}>
                  <Icon 
                    size={20} 
                    color={isActive ? '#FFFFFF' : isComplete ? tc.success : tc.textSecondary}
                    variant={isComplete ? 'Bold' : 'Linear'}
                  />
                </View>
                
                <Text style={[
                  styles.tabLabel,
                  { color: tc.textSecondary },
                  isActive && { color: tc.white, fontWeight: typography.fontWeight.semibold },
                  isComplete && { color: tc.success },
                ]}>
                  {category.label}
                </Text>
                
                {/* Status indicator */}
                {showComplete && (
                  <View style={styles.completeBadge}>
                    <TickCircle size={14} color={tc.success} variant="Bold" />
                  </View>
                )}
                
                {showRequired && (
                  <View style={[styles.requiredDot, { backgroundColor: tc.error }]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabComplete: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '30',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: colors.primaryDark,
  },
  iconContainerComplete: {
    backgroundColor: colors.success + '20',
  },
  tabLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  tabLabelComplete: {
    color: colors.success,
  },
  completeBadge: {
    marginLeft: spacing.xs,
  },
  requiredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
    marginLeft: spacing.xs,
  },
});
