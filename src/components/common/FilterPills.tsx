import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/styles';
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
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Filter Dropdown Button */}
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={onFilterPress}
      >
        <Text style={styles.filterButtonText}>Filter</Text>
        <View style={styles.separator} />
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
              isSelected && styles.pillSelected,
            ]}
            onPress={() => onFilterSelect(filter.id)}
          >
            <Text style={[
              styles.pillText,
              isSelected && styles.pillTextSelected,
            ]}>
              {filter.label}
            </Text>
            {filter.count !== undefined && (
              <View style={[
                styles.badge,
                isSelected && styles.badgeSelected,
              ]}>
                <Text style={[
                  styles.badgeText,
                  isSelected && styles.badgeTextSelected,
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.md,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  separator: {
    width: 1,
    height: 16,
    backgroundColor: colors.gray300,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.xs,
  },
  pillSelected: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  pillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  pillTextSelected: {
    color: colors.white,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeSelected: {
    backgroundColor: colors.white,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  badgeTextSelected: {
    color: colors.black,
  },
});
