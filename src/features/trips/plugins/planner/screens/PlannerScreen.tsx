import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Airplane, Building, Location, DirectRight, Clock, Star1, Car } from 'iconsax-react-native';
import { spacing, typography, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import AddActivityBottomSheet from '../components/AddActivityBottomSheet';
import { plannerService, ItineraryDay } from '@/services/planner.service';
import PluginEmptyState from '@/features/trips/components/PluginEmptyState';
import { CalendarEdit } from 'iconsax-react-native';

const TYPE_COLORS: Record<string, string> = {
  flight: colors.success,
  hotel: colors.orange,
  car: colors.gray500,
  restaurant: colors.error,
  attraction: colors.info,
  activity: colors.purple,
};

function formatTimeForDisplay(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

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
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadItinerary = async () => {
      try {
        setLoading(true);
        const result = await plannerService.getDays(tripId);
        if (mounted) setDays(result);
      } catch (err) {
        console.error('Failed to load itinerary:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (tripId) loadItinerary();
    return () => { mounted = false; };
  }, [tripId]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Trip not found</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const currentDay = days[selectedDay];

  const getColor = (activity: any) => activity.color || TYPE_COLORS[activity.type] || colors.info;

  const renderActivityIcon = (activity: any) => {
    const iconProps = { size: 16, color: getColor(activity), variant: 'Bold' as const };
    
    switch (activity.icon || activity.type) {
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
    if (!activityTime) return false;
    try {
      if (activityTime.includes(' ')) {
        const currentMinutes = getCurrentTimeInMinutes();
        const activityMinutes = parseTimeToMinutes(activityTime);
        return currentMinutes >= activityMinutes;
      }
      const [h, m] = activityTime.split(':').map(Number);
      const currentMinutes = getCurrentTimeInMinutes();
      return currentMinutes >= h * 60 + m;
    } catch {
      return false;
    }
  };

  const handleAddActivity = async (activity: {
    name: string;
    place?: string;
    startTime: string;
    endTime: string;
    description?: string;
  }) => {
    if (!currentDay) return;
    try {
      const insertIdx = insertAfterActivityId
        ? currentDay.activities.findIndex(a => a.id === insertAfterActivityId) + 1
        : currentDay.activities.length;
      const newActivity = await plannerService.addActivity(currentDay.id, {
        title: activity.name,
        startTime: activity.startTime,
        endTime: activity.endTime,
        description: activity.description,
        location: activity.place ? { name: activity.place } : undefined,
        position: insertIdx,
      });
      setDays(prev => prev.map(d =>
        d.id === currentDay.id
          ? { ...d, activities: [...d.activities.slice(0, insertIdx), newActivity, ...d.activities.slice(insertIdx)] }
          : d
      ));
    } catch (err) {
      console.error('Failed to add activity:', err);
    }
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

      {days.length === 0 ? (
        <PluginEmptyState
          headerTitle="Trip Plan"
          icon={<CalendarEdit size={36} color={colors.primary} variant="Bold" />}
          iconColor={colors.primary}
          title="No Itinerary Yet — But Soon!"
          subtitle={`Your day-by-day itinerary for ${trip?.destination?.city || 'your trip'} is waiting to be crafted. Tap "Generate Smart Plan" on your trip card and we'll build a personalized schedule.`}
          ctaLabel="Go to Trip Card"
          hideHeader
        />
      ) : (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dynamic Next Activity Card */}
        {(() => {
          if (!currentDay || currentDay.activities.length === 0) return null;
          // Find the next upcoming activity for today
          const nowMinutes = getCurrentTimeInMinutes();
          const nextActivity = currentDay.activities.find(a => {
            if (!a.startTime) return false;
            try {
              const [h, m] = a.startTime.split(':').map(Number);
              return (h * 60 + m) > nowMinutes;
            } catch { return false; }
          }) || currentDay.activities[0];

          if (!nextActivity) return null;

          const displayTime = nextActivity.startTime ? formatTimeForDisplay(nextActivity.startTime) : '';
          const locationName = typeof nextActivity.location === 'object' ? nextActivity.location?.name : nextActivity.location;

          // Calculate time until
          let timeUntilText = '';
          if (nextActivity.startTime) {
            try {
              const [h, m] = nextActivity.startTime.split(':').map(Number);
              const diffMin = (h * 60 + m) - nowMinutes;
              if (diffMin > 0) {
                const hours = Math.floor(diffMin / 60);
                const mins = diffMin % 60;
                timeUntilText = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
              }
            } catch { /* ignore */ }
          }

          // Build a nice description based on the day theme or activity
          const theme = currentDay.title || currentDay.theme;
          const dayLabel = currentDay.dayType === 'arrival' ? '🛬 Arrival Day'
            : currentDay.dayType === 'departure' ? '🛫 Departure Day'
            : theme ? `✨ ${theme}` : `📍 Day ${currentDay.dayNumber}`;

          return (
            <View style={[styles.notificationCard, { backgroundColor: colors.bgCard }]}>
              <View style={styles.notificationIcon}>
                <Location size={24} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {nextActivity.title}{displayTime ? ` at ${displayTime}` : ''}
                </Text>
                <Text style={[styles.notificationSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {timeUntilText
                    ? <>You have <Text style={styles.notificationTime}>{timeUntilText}</Text> to get ready</>
                    : locationName || dayLabel
                  }
                </Text>
              </View>
              <TouchableOpacity style={styles.notificationAction}>
                <DirectRight size={20} color={colors.white} variant="Bold" />
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* Day Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {days.map((day, index) => (
            <TouchableOpacity
              key={day.id}
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

          {(!currentDay || currentDay.activities.length === 0) && (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: typography.fontSize.base }}>
                No activities for this day
              </Text>
            </View>
          )}

          {currentDay && currentDay.activities.length > 0 && (
          <View style={styles.timeline}>
            {currentDay.activities.map((activity, index) => {
              const actColor = getColor(activity);
              const locationName = typeof activity.location === 'object' ? activity.location?.name : activity.location;
              const displayTime = activity.startTime ? formatTimeForDisplay(activity.startTime) : '';
              const hasDetails = activity.description || activity.bookingUrl || activity.endTime;

              return (
                <React.Fragment key={activity.id}>
                  <View style={styles.activityRow}>
                    <View style={styles.timelineColumn}>
                      <View style={[styles.timelineDot, { backgroundColor: `${actColor}15` }]}>
                        {renderActivityIcon(activity)}
                      </View>
                      {index < currentDay.activities.length - 1 && (
                        <View style={[
                          styles.timelineLine,
                          { backgroundColor: isActivityCompleted(activity.startTime) ? colors.primary : colors.borderMedium }
                        ]} />
                      )}
                    </View>

                    <View style={styles.activityContent}>
                      <View style={[styles.activityCard, { backgroundColor: colors.bgCard }]}>
                        <View style={styles.activityHeader}>
                          <View style={styles.activityInfo}>
                            <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>{activity.title}</Text>
                            {locationName ? (
                              <Text style={[styles.activityLocation, { color: colors.textSecondary }]}>{locationName}</Text>
                            ) : null}
                            {displayTime ? (
                              <Text style={[styles.activityTime, { color: colors.textTertiary }]}>{displayTime}</Text>
                            ) : null}
                          </View>
                          {activity.subtitle ? (
                            <Text style={[styles.activityCode, { color: colors.textPrimary }]}>{activity.subtitle}</Text>
                          ) : null}
                        </View>

                        {hasDetails && expandedActivity === activity.id && (
                          <View style={[styles.expandedContent, { borderTopColor: colors.borderSubtle }]}>
                            {activity.description ? (
                              <Text style={[styles.ratingText, { color: colors.textSecondary, marginBottom: spacing.sm }]}>{activity.description}</Text>
                            ) : null}
                            {activity.endTime ? (
                              <View style={styles.hoursRow}>
                                <Clock size={16} color={colors.primary} variant="Bold" />
                                <Text style={[styles.hoursText, { color: colors.textSecondary }]}>
                                  {formatTimeForDisplay(activity.startTime)} - {formatTimeForDisplay(activity.endTime)}
                                </Text>
                              </View>
                            ) : null}
                            {activity.bookingUrl ? (
                              <TouchableOpacity style={styles.directionButton}>
                                <DirectRight size={16} color={colors.primary} variant="Bold" />
                                <Text style={styles.directionText}>Direction</Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        )}

                        {hasDetails && (
                          <TouchableOpacity
                            style={[styles.expandButton, { backgroundColor: colors.bgElevated }]}
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
              );
            })}
          </View>
          )}
        </View>
      </ScrollView>
      )}

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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
    color: colors.orange,
    fontWeight: '600',
  },
  notificationAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
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
    backgroundColor: colors.borderMedium,
  },
  tabIndicatorActive: {
    backgroundColor: colors.primary,
  },
  tabTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: 2,
    color: colors.textPrimary,
  },
  tabTitleActive: {
    color: colors.primary,
  },
  tabDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  tabDateActive: {
    color: colors.primary,
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
    color: colors.textPrimary,
  },
  activitiesButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
  },
  activitiesButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
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
    backgroundColor: colors.borderMedium,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: spacing.xs,
    minHeight: 60,
    backgroundColor: colors.borderMedium,
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
    backgroundColor: colors.bgCard,
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
    color: colors.textPrimary,
  },
  activityLocation: {
    fontSize: typography.fontSize.sm,
    marginBottom: 4,
    color: colors.textSecondary,
  },
  activityTime: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  activityCode: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
    color: colors.textSecondary,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hoursText: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
    color: colors.textSecondary,
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  directionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
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
    color: colors.primary,
    fontWeight: '600',
  },
  separator: {
    width: 2,
    height: 24,
  },
  // Empty State
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  emptyCta: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: 20,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
});
