/**
 * BASIC INFO SECTION ORGANISM
 * 
 * Displays essential information about the destination
 * Badge, title, location, and 3 horizontal info cards with soft colored backgrounds
 */

import { View, Text, StyleSheet } from 'react-native';
import { Location, People, Calendar, DollarCircle, Star1 } from 'iconsax-react-native';
import { colors, typography, spacing } from '@/styles';

interface BasicInfoSectionProps {
  name: string;
  location: string;
  rating: number;
  category: string;
  visitors: string;
}

// Color palette for icon containers
const iconStyles = {
  visitors: {
    iconBg: 'rgba(34, 197, 94, 0.2)', // Soft green background
    iconColor: '#22C55E', // Strong green icon
  },
  time: {
    iconBg: 'rgba(249, 115, 22, 0.2)', // Soft orange background
    iconColor: '#F97316', // Strong orange icon
  },
  budget: {
    iconBg: 'rgba(59, 130, 246, 0.2)', // Soft blue background
    iconColor: '#3B82F6', // Strong blue icon
  },
};

export default function BasicInfoSection({
  name,
  location,
  rating,
  category,
  visitors,
}: BasicInfoSectionProps) {
  return (
    <View style={styles.container}>
      {/* Badge and Reviews Row */}
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{category.toUpperCase()}</Text>
        </View>
        <View style={styles.reviewsContainer}>
          <Star1 size={16} color="#FFC107" variant="Bold" />
          <Text style={styles.reviewsText}>({rating} reviews)</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{name}</Text>
      
      {/* Location with Map Icon */}
      <View style={styles.locationRow}>
        <Location size={18} color={colors.primary} variant="Bold" />
        <Text style={styles.location}>{location}</Text>
      </View>

      {/* Horizontal Icon Items - 3 Items (Stacked layout) */}
      <View style={styles.infoCardsRow}>
        {/* Visitors */}
        <View style={styles.infoItem}>
          <View style={[styles.iconContainer, { backgroundColor: iconStyles.visitors.iconBg }]}>
            <People size={20} color={iconStyles.visitors.iconColor} variant="Bold" />
          </View>
          <Text style={styles.infoLabel}>Visitors</Text>
          <Text style={styles.infoValue}>{visitors}</Text>
        </View>

        {/* Best Time */}
        <View style={styles.infoItem}>
          <View style={[styles.iconContainer, { backgroundColor: iconStyles.time.iconBg }]}>
            <Calendar size={20} color={iconStyles.time.iconColor} variant="Bold" />
          </View>
          <Text style={styles.infoLabel}>Best Time</Text>
          <Text style={styles.infoValue}>Apr - Oct</Text>
        </View>

        {/* Budget */}
        <View style={styles.infoItem}>
          <View style={[styles.iconContainer, { backgroundColor: iconStyles.budget.iconBg }]}>
            <DollarCircle size={20} color={iconStyles.budget.iconColor} variant="Bold" />
          </View>
          <Text style={styles.infoLabel}>Budget</Text>
          <Text style={styles.infoValue}>$150-300</Text>
        </View>
      </View>

      {/* Thin Separator Line */}
      <View style={styles.separator} />
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
    backgroundColor: `${colors.primary}4D`, // 30% opacity (4D in hex)
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  badgeText: {
    color: colors.primary, // 100% strong color
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
    color: colors.textSecondary,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
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
    color: colors.textSecondary,
  },
  infoCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    color: colors.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  separator: {
    height: 0.5,
    backgroundColor: colors.gray200,
    marginTop: spacing.lg,
  },
});
