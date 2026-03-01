/**
 * LOCAL EVENT SECTION ORGANISM
 * 
 * Displays local events with calendar filter and stacked cards
 * Adapted from StackedEventCards with Add to Calendar CTA
 */

import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { colors, typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Clock, Location, Calendar as CalendarIcon, InfoCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;

interface LocalEvent {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  description: string;
  image: string;
}

interface LocalEventSectionProps {
  events: LocalEvent[];
}

// Generate calendar days (7 days from today)
const generateCalendarDays = () => {
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    days.push({
      day: date.getDate(),
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: date.toISOString().split('T')[0],
    });
  }
  
  return days;
};

export default function LocalEventSection({ events }: LocalEventSectionProps) {
  const { colors: tc } = useTheme();
  const [selectedDate, setSelectedDate] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const calendarDays = generateCalendarDays();

  const handleDateSelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(index);
    setCurrentIndex(0); // Reset to first card when date changes
  };

  const handleSwipe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const handleAddToCalendar = (event: LocalEvent) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Add to Calendar', `"${event.title}" will be added to your calendar.`);
    // TODO: Implement actual calendar integration
  };

  const handleEventDetail = (event: LocalEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to event detail page
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Local Event</Text>
        <Text style={styles.sectionSubtitle}>Discover upcoming events and activities happening soon</Text>
      </View>
      
      {/* Calendar Filter */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.calendarContent}
        style={styles.calendarScroll}
      >
        {calendarDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              selectedDate === index && styles.dayButtonActive
            ]}
            onPress={() => handleDateSelect(index)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.dayNumber,
              selectedDate === index && styles.dayNumberActive
            ]}>
              {day.day}
            </Text>
            <Text style={[
              styles.dayName,
              selectedDate === index && styles.dayNameActive
            ]}>
              {day.dayName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stacked Event Cards */}
      <View style={styles.cardsContainer}>
        {events.map((event, index) => {
          const position = (index - currentIndex + events.length) % events.length;
          
          if (position > 2) return null; // Show 3 cards max

          const scale = 1 - (position * 0.03);
          const translateY = position * -12;
          const opacity = position === 0 ? 1 : 0.7;
          
          let rotate = '0deg';
          if (position === 1) rotate = '-2deg';
          if (position === 2) rotate = '2deg';

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
              onPress={position === 0 ? () => handleEventDetail(event) : undefined}
              activeOpacity={0.9}
            >
              {/* Event Image */}
              <View style={styles.imageContainer}>
                <Image source={{ uri: event.image }} style={styles.eventImage} />
              </View>

              {/* Event Info */}
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {event.title}
                </Text>

                {/* Location */}
                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <Location size={16} color={colors.primary} variant="Bold" />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{event.location}</Text>
                  </View>
                </View>

                {/* Time */}
                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <Clock size={16} color={colors.success} variant="Bold" />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Open Hours</Text>
                    <Text style={styles.infoValue}>{event.time}</Text>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.descriptionSection}>
                  <View style={styles.descriptionHeader}>
                    <InfoCircle size={16} color={colors.textSecondary} variant="Bold" />
                    <Text style={styles.descriptionLabel}>Description</Text>
                  </View>
                  <Text style={styles.descriptionText} numberOfLines={2}>
                    {event.description}
                  </Text>
                </View>

                {/* Add to Calendar Button */}
                {position === 0 && (
                  <TouchableOpacity 
                    style={styles.calendarButton}
                    onPress={() => handleAddToCalendar(event)}
                    activeOpacity={0.8}
                  >
                    <CalendarIcon size={20} color={colors.primary} variant="Bold" />
                    <Text style={styles.calendarButtonText}>Add To Calendar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  calendarScroll: {
    marginBottom: spacing.lg,
  },
  calendarContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dayButton: {
    width: 70,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  dayNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dayNumberActive: {
    color: colors.white,
  },
  dayName: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  dayNameActive: {
    color: colors.white,
  },
  cardsContainer: {
    height: 500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardBehind: {
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: colors.gray100,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventInfo: {
    padding: spacing.sm,
  },
  eventTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  descriptionSection: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  descriptionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  descriptionText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.bgElevated,
  },
  calendarButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});
