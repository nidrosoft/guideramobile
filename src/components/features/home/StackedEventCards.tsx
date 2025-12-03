import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useState } from 'react';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { Clock, Location, People, Ticket, Calendar } from 'iconsax-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

const events = [
  {
    id: 1,
    eventName: 'Rhyme in the Horizon',
    category: 'Music & Nightlife',
    venue: 'Leonor Nightclub',
    city: 'Westbrook',
    date: 'Dec 15, 2024',
    time: '8:00 PM',
    ticketPrice: '$45',
    attendees: '2.5k',
    rating: 4.7,
    image: 'https://picsum.photos/seed/event1/600/600',
  },
  {
    id: 2,
    eventName: 'Summer Music Festival',
    category: 'Festival',
    venue: 'Central Park Arena',
    city: 'Downtown',
    date: 'Dec 17, 2024',
    time: '6:00 PM',
    ticketPrice: '$85',
    attendees: '15k',
    rating: 4.9,
    image: 'https://picsum.photos/seed/event2/600/600',
  },
  {
    id: 3,
    eventName: 'Art & Wine Night',
    category: 'Art & Culture',
    venue: 'Gallery 21',
    city: 'Uptown',
    date: 'Dec 20, 2024',
    time: '7:30 PM',
    ticketPrice: '$35',
    attendees: '500',
    rating: 4.6,
    image: 'https://picsum.photos/seed/event3/600/600',
  },
  {
    id: 4,
    eventName: 'Tech Conference 2024',
    category: 'Conference',
    venue: 'Convention Center',
    city: 'Silicon Valley',
    date: 'Dec 25, 2024',
    time: '9:00 AM',
    ticketPrice: '$150',
    attendees: '5k',
    rating: 4.8,
    image: 'https://picsum.photos/seed/event4/600/600',
  },
  {
    id: 5,
    eventName: 'Food & Culture Fair',
    category: 'Food & Drink',
    venue: 'City Square',
    city: 'Midtown',
    date: 'Dec 18, 2024',
    time: '12:00 PM',
    ticketPrice: 'Free',
    attendees: '8k',
    rating: 4.7,
    image: 'https://picsum.photos/seed/event5/600/600',
  },
];

export default function StackedEventCards() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  return (
    <View style={styles.container}>
      {/* Stacked Cards */}
      {events.map((event, index) => {
        const position = (index - currentIndex + events.length) % events.length;
        
        if (position > 4) return null; // Show 5 cards

        const scale = 1 - (position * 0.03);
        const translateY = position * -12;
        const opacity = position === 0 ? 1 : 0.7;
        
        // Alternating rotation: 0 = straight, 1 = left, 2 = right, 3 = left, 4 = right
        let rotate = '0deg';
        if (position === 1) rotate = '-3deg';
        if (position === 2) rotate = '3deg';
        if (position === 3) rotate = '-3deg';
        if (position === 4) rotate = '3deg';

        return (
          <TouchableOpacity
            key={event.id}
            style={[
              styles.card,
              position > 0 && styles.cardBehind,
              {
                transform: [{ scale }, { translateY }, { rotate }],
                opacity,
                zIndex: events.length - position,
              },
            ]}
            onPress={position === 0 ? handleSwipe : undefined}
            activeOpacity={0.9}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{event.category}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {event.rating}</Text>
              </View>
            </View>

            {/* Separator */}
            <View style={styles.separator} />

            {/* Event Info Section */}
            <View style={styles.eventInfoSection}>
              <Text style={styles.eventName}>{event.eventName}</Text>
              
              {/* Venue & City */}
              <View style={styles.venueRow}>
                <Location size={16} color={colors.textSecondary} variant="Bold" />
                <Text style={styles.venueText}>{event.venue}, {event.city}</Text>
              </View>
              
              {/* Date & Time Row */}
              <View style={styles.dateTimeRow}>
                <View style={styles.dateContainer}>
                  <Calendar size={14} color={colors.primary} variant="Bold" />
                  <Text style={styles.dateText}>{event.date}</Text>
                </View>
                <View style={styles.eventTimeContainer}>
                  <Clock size={14} color={colors.success} variant="Bold" />
                  <Text style={styles.eventTime}>{event.time}</Text>
                </View>
              </View>
              
              {/* Attendees & Price Row */}
              <View style={styles.bottomInfoRow}>
                <View style={styles.attendeesContainer}>
                  <People size={14} color={colors.textSecondary} variant="Bold" />
                  <Text style={styles.attendeesText}>{event.attendees} going</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Ticket size={14} color={colors.primary} variant="Bold" />
                  <Text style={styles.priceText}>{event.ticketPrice}</Text>
                </View>
              </View>
            </View>

            {/* Event Image */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: event.image }} style={styles.eventImage} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 520,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  cardBehind: {
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
    gap: 4,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  eventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  eventTime: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.success,
  },
  bottomInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendeesText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
});
