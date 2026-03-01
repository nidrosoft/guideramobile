/**
 * EVENTS TAB CONTENT
 * 
 * Enhanced events display with date filters and grouped events.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Calendar, Location, Add, Filter } from 'iconsax-react-native';
import { colors, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import EventCard from './EventCard';
import { EventPreview } from '../types/event.types';

type DateFilter = 'today' | 'this_week' | 'this_month' | 'all';

interface EventsTabContentProps {
  events: EventPreview[];
  loading?: boolean;
  onRefresh?: () => void;
  onEventPress: (eventId: string) => void;
  onCreateEvent?: () => void;
  currentLocation?: string;
  onLocationChange?: () => void;
}

// Mock events data
const MOCK_EVENTS: EventPreview[] = [
  {
    id: 'evt-1',
    communityId: 'group-1',
    title: 'Sunset at Sacré-Cœur',
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
    type: 'meetup',
    status: 'upcoming',
    location: { city: 'Paris', country: 'France', isVirtual: false },
    startDate: new Date(new Date().setHours(18, 30)),
    attendeeCount: 23,
    myRSVP: 'none',
  },
  {
    id: 'evt-2',
    communityId: 'group-2',
    title: 'Wine & Cheese Night',
    coverImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
    type: 'food_drink',
    status: 'upcoming',
    location: { city: 'Paris', country: 'France', isVirtual: false },
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    attendeeCount: 15,
    myRSVP: 'going',
  },
  {
    id: 'evt-3',
    communityId: 'group-1',
    title: 'Morning Yoga in the Park',
    coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    type: 'outdoor',
    status: 'upcoming',
    location: { city: 'Paris', country: 'France', isVirtual: false },
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 48),
    attendeeCount: 8,
    myRSVP: 'none',
  },
  {
    id: 'evt-4',
    communityId: 'group-3',
    title: 'Virtual Travel Photography Workshop',
    coverImage: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400',
    type: 'workshop',
    status: 'upcoming',
    location: { city: 'Online', country: '', isVirtual: true },
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 72),
    attendeeCount: 45,
    myRSVP: 'maybe',
  },
  {
    id: 'evt-5',
    communityId: 'group-2',
    title: 'Louvre Museum Tour',
    coverImage: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400',
    type: 'cultural',
    status: 'upcoming',
    location: { city: 'Paris', country: 'France', isVirtual: false },
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 96),
    attendeeCount: 12,
    myRSVP: 'none',
  },
  {
    id: 'evt-6',
    communityId: 'group-1',
    title: 'Montmartre Walking Tour',
    coverImage: 'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=400',
    type: 'sightseeing',
    status: 'upcoming',
    location: { city: 'Paris', country: 'France', isVirtual: false },
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 168),
    attendeeCount: 18,
    myRSVP: 'none',
  },
];

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'all', label: 'All' },
];

export default function EventsTabContent({
  events = MOCK_EVENTS,
  loading = false,
  onRefresh,
  onEventPress,
  onCreateEvent,
  currentLocation = 'Paris',
  onLocationChange,
}: EventsTabContentProps) {
  const { colors: tc } = useTheme();
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };
  
  // Filter events based on date filter
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      switch (dateFilter) {
        case 'today':
          return eventDate >= today && eventDate < endOfToday;
        case 'this_week':
          return eventDate >= today && eventDate < endOfWeek;
        case 'this_month':
          return eventDate >= today && eventDate <= endOfMonth;
        default:
          return true;
      }
    });
  }, [events, dateFilter]);
  
  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: { label: string; events: EventPreview[] } } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    filteredEvents.forEach(event => {
      const eventDate = new Date(event.startDate);
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      
      let key: string;
      let label: string;
      
      if (eventDay.getTime() === today.getTime()) {
        key = 'today';
        label = 'TODAY';
      } else if (eventDay.getTime() === tomorrow.getTime()) {
        key = 'tomorrow';
        label = 'TOMORROW';
      } else {
        key = eventDay.toISOString();
        label = eventDay.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        }).toUpperCase();
      }
      
      if (!groups[key]) {
        groups[key] = { label, events: [] };
      }
      groups[key].events.push(event);
    });
    
    // Sort groups by date
    return Object.entries(groups)
      .sort(([a], [b]) => {
        if (a === 'today') return -1;
        if (b === 'today') return 1;
        if (a === 'tomorrow') return -1;
        if (b === 'tomorrow') return 1;
        return new Date(a).getTime() - new Date(b).getTime();
      })
      .map(([key, value]) => value);
  }, [filteredEvents]);
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: tc.textPrimary }]}>Events</Text>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={onLocationChange}
          activeOpacity={0.7}
        >
          <Location size={16} color={tc.primary} variant="Bold" />
          <Text style={styles.locationText}>{currentLocation}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Date Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {DATE_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                dateFilter === filter.id && styles.filterChipActive,
              ]}
              onPress={() => setDateFilter(filter.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterText,
                dateFilter === filter.id && styles.filterTextActive,
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={tc.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {/* Events List */}
      <ScrollView
        style={styles.eventsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {groupedEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={tc.textSecondary} />
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No events found</Text>
            <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>
              {dateFilter === 'today' 
                ? 'No events scheduled for today'
                : 'Try adjusting your filters'}
            </Text>
          </View>
        ) : (
          groupedEvents.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <View style={styles.dateLine} />
                <Text style={styles.dateLabel}>{group.label}</Text>
                <View style={styles.dateLine} />
              </View>
              
              {group.events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="list"
                  onPress={() => onEventPress(event.id)}
                />
              ))}
            </View>
          ))
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Create Event FAB */}
      {onCreateEvent && (
        <TouchableOpacity
          style={styles.fab}
          onPress={onCreateEvent}
          activeOpacity={0.8}
        >
          <Add size={28} color={'#FFFFFF'} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    marginBottom: spacing.sm,
  },
  filtersScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  filterButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
