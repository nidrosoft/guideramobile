import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@/styles';
import { Clock, Location, People, Ticket, Calendar } from 'iconsax-react-native';

interface EventViewCardProps {
  eventName: string;
  category: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  ticketPrice: string;
  attendees: string;
  rating: number;
  image: string;
  onPress: () => void;
}

export default function EventViewCard({
  eventName,
  category,
  venue,
  city,
  date,
  time,
  ticketPrice,
  attendees,
  rating,
  image,
  onPress,
}: EventViewCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {rating}</Text>
        </View>
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Event Info Section */}
      <View style={styles.eventInfoSection}>
        <Text style={styles.eventName}>{eventName}</Text>
        
        {/* Venue & City */}
        <View style={styles.venueRow}>
          <Location size={16} color={colors.textSecondary} variant="Bold" />
          <Text style={styles.venueText}>{venue}, {city}</Text>
        </View>
        
        {/* Date & Time Row */}
        <View style={styles.dateTimeRow}>
          <View style={styles.dateContainer}>
            <Calendar size={14} color={colors.primary} variant="Bold" />
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <View style={styles.eventTimeContainer}>
            <Clock size={14} color={colors.success} variant="Bold" />
            <Text style={styles.eventTime}>{time}</Text>
          </View>
        </View>
        
        {/* Attendees & Price Row */}
        <View style={styles.bottomInfoRow}>
          <View style={styles.attendeesContainer}>
            <People size={14} color={colors.textSecondary} variant="Bold" />
            <Text style={styles.attendeesText}>{attendees} going</Text>
          </View>
          <View style={styles.priceContainer}>
            <Ticket size={14} color={colors.primary} variant="Bold" />
            <Text style={styles.priceText}>{ticketPrice}</Text>
          </View>
        </View>
      </View>

      {/* Event Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.eventImage} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  ratingBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray200,
    marginBottom: spacing.md,
  },
  eventInfoSection: {
    marginBottom: spacing.md,
  },
  eventName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  venueText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  eventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eventTime: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  bottomInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  attendeesText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  priceText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
});
