/**
 * UNIFIED SEARCH FOOTER
 * 
 * Footer component with Clear all and Search button.
 * Used across all booking service search screens.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchNormal1 } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface UnifiedSearchFooterProps {
  searchLabel: string;
  onClear: () => void;
  onSearch: () => void;
  canSearch?: boolean;
}

export default function UnifiedSearchFooter({
  searchLabel,
  onClear,
  onSearch,
  canSearch = true,
}: UnifiedSearchFooterProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();

  return (
    <View style={[
      styles.footer, 
      { 
        paddingBottom: insets.bottom + spacing.md,
        backgroundColor: themeColors.bgElevated,
        borderTopColor: themeColors.borderSubtle,
      }
    ]}>
      <TouchableOpacity onPress={onClear} activeOpacity={0.7}>
        <Text style={[styles.clearText, { color: themeColors.textSecondary }]}>
          Clear all
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.searchButton, 
          { backgroundColor: canSearch ? themeColors.primary : themeColors.gray300 }
        ]}
        onPress={onSearch}
        activeOpacity={0.8}
        disabled={!canSearch}
      >
        <SearchNormal1 size={18} color={themeColors.white} />
        <Text style={[styles.searchButtonText, { color: themeColors.white }]}>
          {searchLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  clearText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 16,
    gap: spacing.sm,
  },
  searchButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
