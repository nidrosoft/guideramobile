/**
 * ALL EVENTS ROUTE
 *
 * Route for viewing all community events.
 * Fetches real events from Supabase and passes to EventsTabContent.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { eventService } from '@/services/community';
import { EventPreview } from '@/features/community/types/event.types';
import EventsTabContent from '@/features/community/components/EventsTabContent';

function mapEventToPreview(e: any): EventPreview {
  return {
    id: e.id,
    communityId: e.groupId || '',
    title: e.title,
    coverImage: e.coverImageUrl,
    type: (e.type === 'other' ? 'meetup' : e.type) as any,
    status: e.status as any,
    location: {
      city: e.locationName || 'Online',
      country: '',
      isVirtual: e.locationType === 'virtual',
    },
    startDate: e.startDate instanceof Date ? e.startDate : new Date(e.startDate),
    attendeeCount: e.attendeeCount || 0,
    myRSVP: 'none',
  };
}

export default function AllEvents() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventService.getUpcomingEvents({ limit: 50 });
      setEvents(data.map(mapEventToPreview));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleEventPress = (eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/event/${eventId}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>All Events</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Events Content */}
      <EventsTabContent
        events={events}
        loading={loading}
        onRefresh={fetchEvents}
        onEventPress={handleEventPress}
        onCreateEvent={() => router.push('/community/create-event' as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
});
