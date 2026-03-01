/**
 * CATEGORY TABS
 * 
 * Reusable horizontal scrollable tabs component.
 * Used for filtering content by category.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

export interface TabItem {
  id: string;
  label: string;
}

interface CategoryTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
  containerStyle?: object;
}

export default function CategoryTabs({
  tabs,
  activeTab,
  onTabPress,
  containerStyle,
}: CategoryTabsProps) {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: colors.bgElevated, borderBottomColor: colors.gray100 },
    tab: { backgroundColor: colors.gray100 },
    tabActive: { backgroundColor: colors.primary },
    tabText: { color: colors.textSecondary },
    tabTextActive: { color: colors.white },
  }), [colors]);

  const handleTabPress = (tabId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabPress(tabId);
  };

  return (
    <View style={[styles.container, dynamicStyles.container, containerStyle]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                dynamicStyles.tab,
                isActive && dynamicStyles.tabActive,
              ]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  dynamicStyles.tabText,
                  isActive && dynamicStyles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
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
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
