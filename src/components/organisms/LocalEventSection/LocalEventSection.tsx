/**
 * LOCAL EVENT SECTION ORGANISM
 * 
 * Displays local events with calendar filter and stacked cards
 * Adapted from StackedEventCards with Add to Calendar CTA
 */

import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, Alert, Linking } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { typography, spacing } from '@/styles';
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
  dbId?: string;
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
  const { colors } = useTheme();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const calendarDays = generateCalendarDays();

  // Filter events by selected calendar date
  const filteredEvents = useMemo(() => {
    if (events.length === 0) return [];
    // "All" tab (index 0) shows everything
    if (selectedDate === 0) return events;
    // Calendar days are offset by 1 (index 0 = "All")
    const selectedFullDate = calendarDays[selectedDate - 1]?.fullDate;
    if (!selectedFullDate) return events;
    // Try to match events whose date string contains the selected date
    // Event dates can be in various formats, so be flexible
    const matched = events.filter(e => {
      if (!e.date) return false;
      // Check if event date contains the calendar date (YYYY-MM-DD)
      if (e.date.includes(selectedFullDate)) return true;
      // Parse common date formats and compare
      try {
        const eventDate = new Date(e.date);
        if (!isNaN(eventDate.getTime())) {
          return eventDate.toISOString().split('T')[0] === selectedFullDate;
        }
      } catch {}
      return false;
    });
    // Return matched or empty — don't silently fall back to all events
    return matched;
  }, [events, selectedDate, calendarDays]);

  const handleDateSelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(index);
    setCurrentIndex(0); // Reset to first card when date changes
  };

  const handleSwipe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentIndex((prev) => (prev + 1) % filteredEvents.length);
  };

  const handleAddToCalendar = async (event: LocalEvent) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      // Build Google Calendar URL — works on all platforms without native module
      const title = encodeURIComponent(event.title);
      const details = encodeURIComponent(event.description);
      const location = encodeURIComponent(event.location);
      // Use a future date placeholder since events have recurring descriptions (e.g. 'Every Saturday')
      const now = new Date();
      const start = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
      const supported = await Linking.canOpenURL(calUrl);
      if (supported) {
        await Linking.openURL(calUrl);
      } else {
        Alert.alert('Add to Calendar', `"${event.title}" — ${event.date} at ${event.time}\n${event.location}`, [
          { text: 'Close', style: 'cancel' },
        ]);
      }
    } catch {
      Alert.alert('Add to Calendar', `"${event.title}" — ${event.date} at ${event.time}`);
    }
  };

  const handleEventDetail = (event: LocalEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to event detail page using the DB id
    const eventId = event.dbId || event.id;
    router.push(`/events/${eventId}`);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Local Event</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Discover upcoming events and activities happening soon</Text>
      </View>
      
      {/* Calendar Filter */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.calendarContent}
        style={styles.calendarScroll}
      >
        {/* "All" pill at index 0 */}
        <TouchableOpacity
          style={[
            styles.dayButton,
            { backgroundColor: colors.bgElevated, borderColor: colors.borderMedium },
            selectedDate === 0 && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => handleDateSelect(0)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.dayNumber,
            { color: colors.textPrimary },
            selectedDate === 0 && { color: '#FFFFFF' }
          ]}>All</Text>
          <Text style={[
            styles.dayName,
            { color: colors.textSecondary },
            selectedDate === 0 && { color: '#FFFFFF' }
          ]}>Events</Text>
        </TouchableOpacity>
        {calendarDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              { backgroundColor: colors.bgElevated, borderColor: colors.borderMedium },
              selectedDate === (index + 1) && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => handleDateSelect(index + 1)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.dayNumber,
              { color: colors.textPrimary },
              selectedDate === (index + 1) && { color: '#FFFFFF' }
            ]}>
              {day.day}
            </Text>
            <Text style={[
              styles.dayName,
              { color: colors.textSecondary },
              selectedDate === (index + 1) && { color: '#FFFFFF' }
            ]}>
              {day.dayName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stacked Event Cards */}
      {filteredEvents.length === 0 && (
        <View style={[styles.cardsContainer, { justifyContent: 'center' }]}>
          <Text style={[{ color: colors.textSecondary, fontSize: 14, textAlign: 'center' }]}>No events found for this date</Text>
        </View>
      )}
      {filteredEvents.length > 0 && (
      <View style={styles.cardsContainer}>
        {filteredEvents.map((event, index) => {
          const position = (index - currentIndex + filteredEvents.length) % filteredEvents.length;
          
          if (position > 2) return <View key={`hidden-${event.id}-${index}`} />; // Show 3 cards max

          const scale = 1 - (position * 0.03);
          const translateY = position * -12;
          const opacity = position === 0 ? 1 : 0.7;
          
          let rotate = '0deg';
          if (position === 1) rotate = '-2deg';
          if (position === 2) rotate = '2deg';

          return (
            <TouchableOpacity
              key={`event-${event.id}-${index}`}
              style={[
                styles.card,
                { backgroundColor: colors.bgElevated },
                position > 0 && { borderWidth: 1, borderColor: colors.borderMedium },
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
                <Text style={[styles.eventTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {event.title}
                </Text>

                {/* Location */}
                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <Location size={16} color={colors.primary} variant="Bold" />
                  </View>
                  <View>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Location</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{event.location}</Text>
                  </View>
                </View>

                {/* Time */}
                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <Clock size={16} color={colors.success} variant="Bold" />
                  </View>
                  <View>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Open Hours</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{event.time}</Text>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.descriptionSection}>
                  <View style={styles.descriptionHeader}>
                    <InfoCircle size={16} color={colors.textSecondary} variant="Bold" />
                    <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>Description</Text>
                  </View>
                  <Text style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {event.description}
                  </Text>
                </View>

                {/* Add to Calendar Button */}
                {position === 0 && (
                  <TouchableOpacity 
                    style={[styles.calendarButton, { borderColor: colors.primary, backgroundColor: colors.bgElevated }]}
                    onPress={() => handleAddToCalendar(event)}
                    activeOpacity={0.8}
                  >
                    <CalendarIcon size={20} color={colors.primary} variant="Bold" />
                    <Text style={[styles.calendarButtonText, { color: colors.primary }]}>Add To Calendar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      )}

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
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.base,
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  dayName: {
    fontSize: typography.fontSize.xs,
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
    borderRadius: 24,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 160,
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
    backgroundColor: 'rgba(63, 195, 158, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
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
  },
  descriptionText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 2,
  },
  calendarButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
});
