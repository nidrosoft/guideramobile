/**
 * BASIC INFO SECTION ORGANISM
 * 
 * Displays essential information about the destination
 * Badge, title, location, and 3 horizontal info cards with soft colored backgrounds
 */

import { View, Text, StyleSheet } from 'react-native';
import { Location, People, Calendar, DollarCircle, Star1 } from 'iconsax-react-native';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface BasicInfoSectionProps {
  name: string;
  location: string;
  rating: number;
  category: string;
  visitors: string;
  bestTime?: string;
  budget?: string;
}

export default function BasicInfoSection({
  name,
  location,
  rating,
  category,
  visitors,
  bestTime = 'Year-round',
  budget = 'Varies',
}: BasicInfoSectionProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {/* Badge and Reviews Row */}
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: `${colors.primary}4D` }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{category.toUpperCase()}</Text>
        </View>
        <View style={styles.reviewsContainer}>
          <Star1 size={16} color="#FFC107" variant="Bold" />
          <Text style={[styles.reviewsText, { color: colors.textSecondary }]}>({rating} reviews)</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{name}</Text>
      
      {/* Location with Map Icon */}
      <View style={styles.locationRow}>
        <Location size={18} color={colors.primary} variant="Bold" />
        <Text style={[styles.location, { color: colors.textSecondary }]}>{location}</Text>
      </View>

      {/* Horizontal Icon Items - 3 Items */}
      <View style={[styles.infoCardsRow, { borderColor: colors.borderMedium }]}>
        {/* Visitors */}
        <View style={styles.infoItem}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <People size={20} color={colors.primary} variant="Bold" />
          </View>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Visitors</Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{visitors}</Text>
        </View>

        {/* Best Time */}
        <View style={styles.infoItem}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Calendar size={20} color={colors.primary} variant="Bold" />
          </View>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Best Time</Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{bestTime}</Text>
        </View>

        {/* Budget */}
        <View style={styles.infoItem}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <DollarCircle size={20} color={colors.primary} variant="Bold" />
          </View>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Budget</Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{budget}</Text>
        </View>
      </View>

      {/* Thin Separator Line */}
      <View style={[styles.separator, { backgroundColor: colors.gray200 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  reviewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewsText: {
    fontSize: typography.fontSize.sm,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  location: {
    fontSize: typography.fontSize.base,
  },
  infoCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: 2,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  separator: {
    height: 0.5,
    marginTop: spacing.lg,
  },
});
