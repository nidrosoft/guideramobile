/**
 * SEARCH HEADER
 * 
 * Reusable header component for search screens.
 * Includes back button, search input, and filter button.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, SearchNormal1, Setting4 } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchSubmit: () => void;
  onBackPress: () => void;
  onFilterPress: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  paddingTop?: number;
}

export default function SearchHeader({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onBackPress,
  onFilterPress,
  placeholder = 'Search destinations, hotels...',
  autoFocus = false,
  paddingTop = 0,
}: SearchHeaderProps) {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    header: { backgroundColor: colors.bgElevated },
    searchBar: { backgroundColor: colors.gray100 },
    searchInput: { color: colors.textPrimary },
    filterButton: { backgroundColor: colors.gray100 },
  }), [colors]);

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBackPress();
  };

  const handleFilterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFilterPress();
  };

  return (
    <View style={[styles.header, dynamicStyles.header, { paddingTop: paddingTop + spacing.sm }]}>
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
        <ArrowLeft size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={[styles.searchBar, dynamicStyles.searchBar]}>
        <SearchNormal1 size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, dynamicStyles.searchInput]}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          onSubmitEditing={onSearchSubmit}
          autoFocus={autoFocus}
        />
      </View>

      <TouchableOpacity
        onPress={handleFilterPress}
        style={[styles.filterButton, dynamicStyles.filterButton]}
      >
        <Setting4 size={20} color={colors.textPrimary} variant="Outline" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
