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
  
  const handlePress = (category: PackageCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCategoryChange(category);
  };
  
  return (
    <View style={styles.container}>
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
                isActive && styles.tabActive,
                isComplete && styles.tabComplete,
              ]}
              onPress={() => handlePress(category.id)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <View style={[
                  styles.iconContainer,
                  isActive && styles.iconContainerActive,
                  isComplete && styles.iconContainerComplete,
                ]}>
                  <Icon 
                    size={20} 
                    color={isActive ? colors.white : isComplete ? colors.success : colors.gray500}
                    variant={isComplete ? 'Bold' : 'Linear'}
                  />
                </View>
                
                <Text style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                  isComplete && styles.tabLabelComplete,
                ]}>
                  {category.label}
                </Text>
                
                {/* Status indicator */}
                {showComplete && (
                  <View style={styles.completeBadge}>
                    <TickCircle size={14} color={colors.success} variant="Bold" />
                  </View>
                )}
                
                {showRequired && (
                  <View style={styles.requiredDot} />
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
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
    backgroundColor: colors.gray100,
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
