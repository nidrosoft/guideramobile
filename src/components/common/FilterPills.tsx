import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { ArrowDown2 } from 'iconsax-react-native';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  filters: FilterOption[];
  selectedFilter: string;
  onFilterSelect: (filterId: string) => void;
  onFilterPress: () => void;
}

export default function FilterPills({
  filters,
  selectedFilter,
  onFilterSelect,
  onFilterPress
}: FilterPillsProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Filter Dropdown Button */}
      <TouchableOpacity
        style={[styles.filterButton, { backgroundColor: colors.bgElevated, borderColor: colors.gray200 }]}
        onPress={onFilterPress}
      >
        <Text style={[styles.filterButtonText, { color: colors.textSecondary }]}>Filter</Text>
        <View style={[styles.separator, { backgroundColor: colors.gray300 }]} />
        <ArrowDown2 size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Filter Pills */}
      {filters.map((filter) => {
        const isSelected = selectedFilter === filter.id;
        return (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.pill,
              { backgroundColor: colors.bgElevated, borderColor: colors.gray200 },
              isSelected && { backgroundColor: colors.black, borderColor: colors.black },
            ]}
            onPress={() => onFilterSelect(filter.id)}
          >
            <Text style={[
              styles.pillText,
              { color: colors.textPrimary },
              isSelected && { color: colors.white },
            ]}>
              {filter.label}
            </Text>
            {filter.count !== undefined && (
              <View style={[
                styles.badge,
                { backgroundColor: colors.error },
                isSelected && { backgroundColor: colors.bgElevated },
              ]}>
                <Text style={[
                  styles.badgeText,
                  { color: colors.white },
                  isSelected && { color: colors.black },
                ]}>
                  {filter.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  separator: {
    width: 1,
    height: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.xs,
  },
  pillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
});
