import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Airplane, Building, Location, DirectRight, Clock, Star1, Car } from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import AddActivityBottomSheet from '../components/AddActivityBottomSheet';

// Mock itinerary data
const MOCK_ITINERARY = [
  {
    dayNumber: 1,
    date: '17 June',
    activities: [
      {
        id: '1',
        type: 'flight',
        title: 'Flight, Soekarno Hatta',
        location: 'Jakarta, Indonesia',
        time: '05:00 AM',
        code: 'CGK',
        icon: 'airplane',
        color: '#10B981',
      },
      {
        id: '2',
        type: 'flight',
        title: 'Arrive, Charles de Gaulle',
        location: 'Paris, France',
        time: '05:00 PM',
        code: 'CDG',
        icon: 'airplane',
        color: '#10B981',
      },
      {
        id: '3',
        type: 'car',
        title: 'Car Pickup',
        location: 'Charles de Gaulle Airport',
        time: '05:30 PM',
        icon: 'car',
        color: '#6B7280',
      },
      {
        id: '4',
        type: 'hotel',
        title: 'Hotel Check In Time',
        location: 'Hotel La Comtesse Tour Eiffel',
        time: '07:00 PM',
        icon: 'hotel',
        color: '#F97316',
        expandable: true,
      },
      {
        id: '5',
        type: 'restaurant',
        title: 'Dinner Reservation',
        location: 'Le Jules Verne Restaurant',
        time: '08:30 PM',
        icon: 'restaurant',
        color: '#EF4444',
        expandable: true,
      },
      {
        id: '6',
        type: 'attraction',
        title: 'Go to Eiffel Tower',
        location: 'Champ de Mars',
        time: '10:00 PM',
        rating: '4.9 (12,2k Review)',
        hours: 'Open 09:00 AM - 11:00 PM',
        icon: 'location',
        color: '#3B82F6',
        expandable: true,
        hasDirection: true,
      },
    ],
  },
  {
    dayNumber: 2,
    date: '18 June',
    activities: [
      {
        id: '7',
        type: 'restaurant',
        title: 'Breakfast at Café de Flore',
        location: 'Saint-Germain-des-Prés',
        time: '9:00 AM',
        icon: 'restaurant',
        color: '#EF4444',
      },
      {
        id: '8',
        type: 'attraction',
        title: 'Visit Louvre Museum',
        location: 'Musée du Louvre',
        time: '11:00 AM',
        rating: '4.8 (95k Review)',
        hours: 'Open 09:00 AM - 06:00 PM',
        icon: 'location',
        color: '#3B82F6',
        expandable: true,
        hasDirection: true,
      },
      {
        id: '9',
        type: 'restaurant',
        title: 'Lunch at Le Comptoir',
        location: 'Latin Quarter',
        time: '2:00 PM',
        icon: 'restaurant',
        color: '#EF4444',
      },
    ],
  },
  {
    dayNumber: 3,
    date: '19 June',
    activities: [
      {
        id: '10',
        type: 'attraction',
        title: 'Arc de Triomphe',
        location: 'Champs-Élysées',
        time: '10:00 AM',
        icon: 'location',
        color: '#3B82F6',
      },
      {
        id: '11',
        type: 'activity',
        title: 'Shopping on Champs-Élysées',
        location: 'Avenue des Champs-Élysées',
        time: '12:00 PM',
        icon: 'location',
        color: '#6366F1',
      },
      {
        id: '12',
        type: 'restaurant',
        title: 'Dinner Cruise on Seine',
        location: 'Port de la Bourdonnais',
        time: '7:00 PM',
        icon: 'restaurant',
        color: '#EF4444',
        expandable: true,
      },
    ],
  },
  {
    dayNumber: 4,
    date: '20 June',
    activities: [
      {
        id: '13',
        type: 'hotel',
        title: 'Hotel Check Out',
        location: 'Hotel La Comtesse Tour Eiffel',
        time: '11:00 AM',
        icon: 'hotel',
        color: '#F97316',
      },
      {
        id: '14',
        type: 'car',
        title: 'Car Drop-off',
        location: 'Charles de Gaulle Airport',
        time: '12:30 PM',
        icon: 'car',
        color: '#6B7280',
      },
      {
        id: '15',
        type: 'flight',
        title: 'Flight Home',
        location: 'Paris, France',
        time: '3:00 PM',
        code: 'CDG',
        icon: 'airplane',
        color: '#10B981',
      },
    ],
  },
];

export default function PlannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = params.tripId as string;
  const { colors, isDark } = useTheme();
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));
  
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [addActivityVisible, setAddActivityVisible] = useState(false);
  const [insertAfterActivityId, setInsertAfterActivityId] = useState<string | null>(null);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Trip not found</Text>
      </SafeAreaView>
    );
  }

  const currentDay = MOCK_ITINERARY[selectedDay];

  const renderActivityIcon = (activity: any) => {
    const iconProps = { size: 16, color: activity.color, variant: 'Bold' as const };
    
    switch (activity.icon) {
      case 'airplane':
        return <Airplane {...iconProps} />;
      case 'hotel':
        return <Building {...iconProps} />;
      case 'car':
        return <Car {...iconProps} />;
      case 'restaurant':
        return <Location {...iconProps} />;
      case 'location':
        return <Location {...iconProps} />;
      default:
        return <Location {...iconProps} />;
    }
  };

  // Get current time to determine progress
  const getCurrentTimeInMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const parseTimeToMinutes = (timeString: string) => {
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const isActivityCompleted = (activityTime: string) => {
    const currentMinutes = getCurrentTimeInMinutes();
    const activityMinutes = parseTimeToMinutes(activityTime);
    return currentMinutes >= activityMinutes;
  };

  const handleAddActivity = (activity: {
    name: string;
    place?: string;
    startTime: string;
    endTime: string;
    description?: string;
  }) => {
    // TODO: Add activity to the list after insertAfterActivityId
    console.log('Adding activity:', activity, 'after', insertAfterActivityId);
    // This will be implemented when we add state management
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgPrimary} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} variant="Linear" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Trip Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Card */}
        <View style={[styles.notificationCard, { backgroundColor: isDark ? '#1A1A1A' : colors.white }]}>
          <View style={styles.notificationIcon}>
            <Location size={24} color={colors.primary} variant="Bold" />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, { color: colors.textPrimary }]}>
              Your tour at the Eiffel tower is at 5PM
            </Text>
            <Text style={[styles.notificationSubtitle, { color: colors.textSecondary }]}>
              You have <Text style={styles.notificationTime}>1h. 32 Mins</Text> to get ready
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationAction}>
            <DirectRight size={20} color={colors.white} variant="Bold" />
          </TouchableOpacity>
        </View>

        {/* Day Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {MOCK_ITINERARY.map((day, index) => (
            <TouchableOpacity
              key={day.dayNumber}
              style={styles.tab}
              onPress={() => setSelectedDay(index)}
            >
              <View style={[
                styles.tabIndicator,
                { backgroundColor: colors.gray300 },
                selectedDay === index && styles.tabIndicatorActive
              ]} />
              <Text style={[
                styles.tabTitle,
                { color: colors.textTertiary },
                selectedDay === index && styles.tabTitleActive
              ]}>
                Day {day.dayNumber}
              </Text>
              <Text style={[
                styles.tabDate,
                { color: colors.textTertiary },
                selectedDay === index && styles.tabDateActive
              ]}>
                {day.date}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Itinerary Section */}
        <View style={styles.itinerarySection}>
          <View style={styles.itineraryHeader}>
            <Text style={[styles.itineraryTitle, { color: colors.textPrimary }]}>Itinerary</Text>
          </View>

          {/* Activities Timeline */}
          <View style={styles.timeline}>
            {currentDay.activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <View style={styles.activityRow}>
                  {/* Timeline Column with Icon */}
                  <View style={styles.timelineColumn}>
                    <View style={[styles.timelineDot, { backgroundColor: `${activity.color}15` }]}>
                      {renderActivityIcon(activity)}
                    </View>
                    {index < currentDay.activities.length - 1 && (
                      <View style={[
                        styles.timelineLine,
                        { backgroundColor: isActivityCompleted(activity.time) ? colors.primary : colors.borderMedium }
                      ]} />
                    )}
                  </View>

                  {/* Activity Content */}
                  <View style={styles.activityContent}>
                    <View style={[styles.activityCard, { backgroundColor: isDark ? '#1A1A1A' : colors.white }]}>
                      <View style={styles.activityHeader}>
                        <View style={styles.activityInfo}>
                          <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>{activity.title}</Text>
                          {activity.location && (
                            <Text style={[styles.activityLocation, { color: colors.textSecondary }]}>{activity.location}</Text>
                          )}
                          <Text style={[styles.activityTime, { color: colors.textTertiary }]}>{activity.time}</Text>
                        </View>
                        {activity.code && (
                          <Text style={[styles.activityCode, { color: colors.textPrimary }]}>{activity.code}</Text>
                        )}
                      </View>

                      {/* Expandable Content */}
                      {activity.expandable && expandedActivity === activity.id && (
                        <View style={[styles.expandedContent, { borderTopColor: colors.borderSubtle }]}>
                          {activity.rating && (
                            <View style={styles.ratingRow}>
                              <Star1 size={16} color="#F59E0B" variant="Bold" />
                              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{activity.rating}</Text>
                            </View>
                          )}
                          {activity.hours && (
                            <View style={styles.hoursRow}>
                              <Clock size={16} color={colors.primary} variant="Bold" />
                              <Text style={[styles.hoursText, { color: colors.textSecondary }]}>{activity.hours}</Text>
                            </View>
                          )}
                          {activity.hasDirection && (
                            <TouchableOpacity style={styles.directionButton}>
                              <DirectRight size={16} color={colors.primary} variant="Bold" />
                              <Text style={styles.directionText}>Direction</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {/* Expand Button */}
                      {activity.expandable && (
                        <TouchableOpacity
                          style={[styles.expandButton, { backgroundColor: isDark ? colors.bgElevated : colors.gray100 }]}
                          onPress={() => setExpandedActivity(
                            expandedActivity === activity.id ? null : activity.id
                          )}
                        >
                          <Text style={[styles.expandButtonText, { color: colors.textSecondary }]}>
                            {expandedActivity === activity.id ? '−' : '∨'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                {/* Add Activity Button - Between Activities */}
                {index < currentDay.activities.length - 1 && (
                  <View style={styles.addActivityRow}>
                    <View style={styles.timelineColumn}>
                      <View style={[styles.separator, { backgroundColor: colors.borderMedium }]} />
                      <TouchableOpacity 
                        style={styles.addActivityButton}
                        onPress={() => {
                          setInsertAfterActivityId(activity.id);
                          setAddActivityVisible(true);
                        }}
                      >
                        <Text style={styles.addActivityText}>+</Text>
                      </TouchableOpacity>
                      <View style={[styles.separator, { backgroundColor: colors.borderMedium }]} />
                    </View>
                  </View>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add Activity Bottom Sheet */}
      <AddActivityBottomSheet
        visible={addActivityVisible}
        onClose={() => {
          setAddActivityVisible(false);
          setInsertAfterActivityId(null);
        }}
        onAdd={handleAddActivity}
      />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(63, 195, 158, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  notificationTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: typography.fontSize.xs,
  },
  notificationTime: {
    color: '#F97316',
    fontWeight: '600',
  },
  notificationAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3FC39E',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  tabsContainer: {
    marginTop: spacing.xl,
    maxHeight: 80,
  },
  tabsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  tab: {
    alignItems: 'flex-start',
    minWidth: 80,
  },
  tabIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  tabIndicatorActive: {
    backgroundColor: '#3FC39E',
  },
  tabTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  tabTitleActive: {
    color: '#3FC39E',
  },
  tabDate: {
    fontSize: typography.fontSize.xs,
  },
  tabDateActive: {
  },
  itinerarySection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  itineraryHeader: {
    marginBottom: spacing.lg,
  },
  itineraryTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  activitiesButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  activitiesButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  timeline: {
    marginTop: spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
  },
  timelineColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: spacing.xs,
    minHeight: 60,
  },
  activityContent: {
    flex: 1,
  },
  activityCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityLocation: {
    fontSize: typography.fontSize.sm,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: typography.fontSize.sm,
  },
  activityCode: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hoursText: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(63, 195, 158, 0.06)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  directionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: '#3FC39E',
    marginLeft: spacing.xs,
  },
  expandButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addActivityRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  addActivityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(63, 195, 158, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addActivityText: {
    fontSize: 20,
    color: '#3FC39E',
    fontWeight: '600',
  },
  separator: {
    width: 2,
    height: 24,
  },
});
