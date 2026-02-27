/**
 * SEARCH SECTION CARD
 * 
 * Collapsible/expandable card component for search sections.
 * Used by Where, When, and Who sections.
 * Animates between collapsed (compact) and expanded states.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SearchSectionCardProps {
  title: string;
  collapsedValue?: string;
  isExpanded: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

export default function SearchSectionCard({
  title,
  collapsedValue,
  isExpanded,
  onPress,
  children,
}: SearchSectionCardProps) {
  const { colors: themeColors } = useTheme();
  const animatedHeight = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [isExpanded]);

  // Collapsed state - shows title and value in a row
  if (!isExpanded) {
    return (
      <TouchableOpacity
        style={[styles.collapsedCard, { backgroundColor: themeColors.white }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.collapsedTitle, { color: themeColors.textSecondary }]}>
          {title}
        </Text>
        <Text style={[styles.collapsedValue, { color: themeColors.textPrimary }]}>
          {collapsedValue || `Add ${title.toLowerCase()}`}
        </Text>
      </TouchableOpacity>
    );
  }

  // Expanded state - shows full content
  return (
    <View style={[styles.expandedCard, { backgroundColor: themeColors.white }]}>
      <Text style={[styles.expandedTitle, { color: themeColors.textPrimary }]}>
        {title}?
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  collapsedTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  collapsedValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  expandedCard: {
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  expandedTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
});
