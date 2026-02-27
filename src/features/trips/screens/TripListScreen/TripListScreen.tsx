/**
 * TRIP LIST SCREEN
 * Main screen showing all trips organized by state tabs
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Animated, SafeAreaView } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTripStore } from '../../stores/trip.store';
import { TripState } from '../../types/trip.types';
import ComprehensiveTripCard from '../../components/TripCard/ComprehensiveTripCard';
import PlanBottomSheet from '@/components/features/home/PlanBottomSheet';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Add, Airplane } from 'iconsax-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

// Tab labels will be translated in the component
const TAB_IDS = [
  TripState.UPCOMING,
  TripState.ONGOING,
  TripState.PAST,
  TripState.CANCELLED,
  TripState.DRAFT,
];

export default function TripListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TripState>(TripState.UPCOMING);
  const [showPlanSheet, setShowPlanSheet] = useState(false);
  const animatedValue = useState(new Animated.Value(0))[0];
  
  const { trips, fetchTrips, filterByState, isLoading } = useTripStore();
  
  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    safeArea: { backgroundColor: colors.gray50 },
    container: { backgroundColor: colors.gray50 },
    header: { backgroundColor: colors.gray50 },
    headerTitle: { color: colors.gray900 },
    createButton: { backgroundColor: `${colors.primary}1A` },
    tabsContainer: { borderBottomColor: colors.gray100, backgroundColor: colors.gray50 },
    tabText: { color: colors.gray500 },
    tabTextActive: { color: colors.primary },
    tabIndicator: { backgroundColor: colors.primary },
    emptyIconContainer: { backgroundColor: colors.gray100 },
    emptyTitle: { color: colors.gray900 },
    emptyText: { color: colors.gray600 },
    emptyButton: { backgroundColor: colors.primary },
    emptyButtonText: { color: colors.white },
  }), [colors]);
  
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
  
  // Handle create trip - opens the plan bottom sheet
  const handleCreateTrip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPlanSheet(true);
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
    <SafeAreaView style={[styles.safeArea, dynamicStyles.safeArea]}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent={false} backgroundColor={colors.gray50} />
      <View style={[styles.container, dynamicStyles.container]}>
      
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>{t('trips.title')}</Text>
        <TouchableOpacity
          style={[styles.createButton, dynamicStyles.createButton]}
          onPress={handleCreateTrip}
          activeOpacity={0.7}
        >
          <Add size={20} color={colors.primary} variant="Bold" />
        </TouchableOpacity>
      </View>
      
      {/* Inline Tabs */}
      <View style={[styles.tabsContainer, dynamicStyles.tabsContainer]}>
        {TAB_IDS.map((tabId) => {
          const count = filterByState(tabId).length;
          const isActive = activeTab === tabId;
          const tabLabel = t(`trips.tabs.${tabId}`);
          
          return (
            <TouchableOpacity
              key={tabId}
              style={styles.tab}
              onPress={() => handleTabChange(tabId)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, dynamicStyles.tabText, isActive && dynamicStyles.tabTextActive]}>
                {tabLabel}
              </Text>
              {isActive && <View style={[styles.tabIndicator, dynamicStyles.tabIndicator]} />}
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
            <View style={[styles.emptyIconContainer, dynamicStyles.emptyIconContainer]}>
              <Airplane size={64} color={colors.gray300} variant="Bulk" />
            </View>
            <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>
              {t('trips.empty.noTrips', { type: t(`trips.tabs.${activeTab}`).toLowerCase() })}
            </Text>
            <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
              {activeTab === TripState.DRAFT
                ? t('trips.empty.startPlanning')
                : activeTab === TripState.UPCOMING
                ? t('trips.empty.createTrip')
                : t('trips.empty.noTrips', { type: '' })}
            </Text>
            {(activeTab === TripState.DRAFT || activeTab === TripState.UPCOMING) && (
              <TouchableOpacity
                style={[styles.emptyButton, dynamicStyles.emptyButton]}
                onPress={handleCreateTrip}
                activeOpacity={0.7}
              >
                <Add size={20} color={colors.white} variant="Bold" />
                <Text style={[styles.emptyButtonText, dynamicStyles.emptyButtonText]}>{t('trips.createTrip')}</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      </View>
      
      {/* Plan Bottom Sheet */}
      <PlanBottomSheet
        visible={showPlanSheet}
        onClose={() => setShowPlanSheet(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
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
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
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
  },
  emptyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
});
