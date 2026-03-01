import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '@/styles';
import { ArrowLeft } from 'iconsax-react-native';
import FilterPills from '@/components/common/FilterPills';
import FilterBottomSheet, { FilterState } from '@/components/common/FilterBottomSheet';
import EventViewCard from '@/components/features/events/EventViewCard';
import { eventsViewData, eventFilters } from '@/data/eventsView';

export default function ViewAllEvents() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    arrange: 'aToZ',
    timeline: 'newest',
    package: 'adultOnly',
  });

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleFilterSelect = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(filterId);
  };

  const handleEventPress = (eventId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Event pressed:', eventId);
  };

  const handleApplyFilters = (filters: FilterState) => {
    setAppliedFilters(filters);
    console.log('Filters applied:', filters);
  };

  // Filter events based on selected category
  const filteredEvents = selectedFilter === 'all' 
    ? eventsViewData 
    : eventsViewData.filter(event => 
        event.category.toLowerCase().includes(selectedFilter.toLowerCase())
      );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Events You May Like</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Section Title */}
          <Text style={styles.sectionTitle}>Upcoming Events</Text>

          {/* Filter Pills */}
          <FilterPills
            filters={eventFilters}
            selectedFilter={selectedFilter}
            onFilterSelect={handleFilterSelect}
            onFilterPress={() => setIsFilterSheetVisible(true)}
          />

          {/* Events List */}
          <View style={styles.eventsList}>
            {filteredEvents.map((event) => (
              <EventViewCard
                key={event.id}
                eventName={event.eventName}
                category={event.category}
                venue={event.venue}
                city={event.city}
                date={event.date}
                time={event.time}
                ticketPrice={event.ticketPrice}
                attendees={event.attendees}
                rating={event.rating}
                image={event.image}
                onPress={() => handleEventPress(event.id)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Filter Bottom Sheet */}
        <FilterBottomSheet
          visible={isFilterSheetVisible}
          onClose={() => setIsFilterSheetVisible(false)}
          onApply={handleApplyFilters}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  eventsList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
  },
});
