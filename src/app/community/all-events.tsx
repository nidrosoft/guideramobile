/**
 * ALL EVENTS ROUTE
 *
 * Route for viewing all community events.
 * Reuses EventsTabContent in a standalone screen wrapper.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import EventsTabContent from '@/features/community/components/EventsTabContent';

export default function AllEvents() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();

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
        events={[]}
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
