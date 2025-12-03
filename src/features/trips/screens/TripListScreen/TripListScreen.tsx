/**
 * TRIP LIST SCREEN
 * Main screen showing all trips organized by state tabs
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Animated, SafeAreaView } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTripStore } from '../../stores/trip.store';
import { TripState } from '../../types/trip.types';
import ComprehensiveTripCard from '../../components/TripCard/ComprehensiveTripCard';
import { colors, spacing, typography } from '@/styles';
import { Add, Airplane } from 'iconsax-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const TABS = [
  { id: TripState.UPCOMING, label: 'Upcoming' },
  { id: TripState.ONGOING, label: 'Ongoing' },
  { id: TripState.PAST, label: 'Past' },
  { id: TripState.CANCELLED, label: 'Cancelled' },
  { id: TripState.DRAFT, label: 'Draft' },
];

export default function TripListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TripState>(TripState.UPCOMING);
  const animatedValue = useState(new Animated.Value(0))[0];
  
  const { trips, fetchTrips, filterByState, isLoading } = useTripStore();
  
  // Fetch trips on mount
  useEffect(() => {
    fetchTrips();
  }, []);
  
  // Get trips for active tab
  const filteredTrips = filterByState(activeTab);
  
  // Handle trip card press
  const handleTripPress = (tripId: string) => {
    router.push(`/trip/${tripId}`);
  };
  
  // Handle create trip
  const handleCreateTrip = () => {
    router.push('/trip/create');
  };
  
  // Handle tab change with haptic feedback and animation
  const handleTabChange = (tabId: TripState) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate tab transition
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setActiveTab(tabId);
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" translucent={false} backgroundColor={colors.gray50} />
      <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateTrip}
          activeOpacity={0.7}
        >
          <Add size={20} color={colors.primary} variant="Bold" />
        </TouchableOpacity>
      </View>
      
      {/* Inline Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const count = filterByState(tab.id).length;
          const isActive = activeTab === tab.id;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => handleTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Trip List */}
      <FlatList
        data={filteredTrips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ComprehensiveTripCard
            trip={item}
            onPress={() => handleTripPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Airplane size={64} color={colors.gray300} variant="Bulk" />
            </View>
            <Text style={styles.emptyTitle}>No {activeTab} trips</Text>
            <Text style={styles.emptyText}>
              {activeTab === TripState.DRAFT
                ? 'Start planning your next adventure'
                : activeTab === TripState.UPCOMING
                ? 'Create a trip to get started'
                : 'No trips in this category yet'}
            </Text>
            {(activeTab === TripState.DRAFT || activeTab === TripState.UPCOMING) && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleCreateTrip}
                activeOpacity={0.7}
              >
                <Add size={20} color={colors.white} variant="Bold" />
                <Text style={styles.emptyButtonText}>Create Trip</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.gray50,
  },
  headerTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.gray900,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.gray50,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray500,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  listContent: {
    padding: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    paddingBottom: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 100,
    backgroundColor: colors.primary,
  },
  emptyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.white,
  },
});
