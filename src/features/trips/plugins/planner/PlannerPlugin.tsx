import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft2, CloseCircle } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Trip } from '@/features/trips/types/trip.types';
import ActivityCard from './components/ActivityCard';
import { DayItinerary, Activity, ActivityType } from './types/planner.types';
import { plannerService, ItineraryDay } from '@/services/planner.service';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface PlannerPluginProps {
  visible: boolean;
  onClose: () => void;
  trip: Trip;
}

function mapToPluginActivity(act: any): Activity {
  const typeMap: Record<string, ActivityType> = {
    flight: ActivityType.FLIGHT,
    hotel: ActivityType.HOTEL,
    restaurant: ActivityType.RESTAURANT,
    attraction: ActivityType.ATTRACTION,
    activity: ActivityType.ACTIVITY,
    shopping: ActivityType.SHOPPING,
    coffee: ActivityType.COFFEE,
    car: ActivityType.ACTIVITY,
  };
  const locName = typeof act.location === 'object' ? act.location?.name : act.location;
  const t = act.startTime || '';
  const [h = 0, m = 0] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return {
    id: act.id,
    type: typeMap[act.type] || ActivityType.ACTIVITY,
    title: act.title,
    subtitle: act.subtitle || locName,
    time: t ? `${h12}:${String(m).padStart(2, '0')} ${period}` : '',
    duration: act.durationMinutes ? `${act.durationMinutes}m` : undefined,
    location: locName,
  };
}

export default function PlannerPlugin({ visible, onClose, trip }: PlannerPluginProps) {
  const { colors: tc } = useTheme();
  const [selectedDay, setSelectedDay] = useState(0);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !trip?.id) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const result = await plannerService.getDays(trip.id);
        if (mounted) setDays(result);
      } catch (err) {
        console.error('Failed to load itinerary:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [visible, trip?.id]);

  const currentDay = days[selectedDay];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <ArrowLeft2 size={24} color={colors.gray900} variant="Linear" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Planner</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseCircle size={24} color={colors.gray400} variant="Linear" />
          </TouchableOpacity>
        </View>

        {/* Trip Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {trip.destination.city}, {trip.destination.country}
          </Text>
          <Text style={styles.infoSubtitle}>
            {new Date(trip.startDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })} - {new Date(trip.endDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </Text>
        </View>

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
              style={[
                styles.tab,
                selectedDay === index && styles.tabActive,
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[
                styles.tabText,
                selectedDay === index && styles.tabTextActive,
              ]}>
                Day {day.dayNumber}
              </Text>
              <Text style={[
                styles.tabDate,
                selectedDay === index && styles.tabDateActive,
              ]}>
                {day.date}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Itinerary */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : !currentDay ? (
            <Text style={[styles.dayTitle, { color: colors.gray600 }]}>No itinerary days yet</Text>
          ) : (
            <>
              <Text style={styles.dayTitle}>Day {currentDay.dayNumber} Itinerary</Text>
              {currentDay.activities.map((act, index) => (
                <ActivityCard
                  key={act.id}
                  activity={mapToPluginActivity(act)}
                  showAddButton={index < currentDay.activities.length - 1}
                  onAddPress={() => {
                    if (__DEV__) console.log('Add activity between', act.id);
                  }}
                />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray900,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: colors.bgElevated,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  infoSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  tabsContainer: {
    marginTop: spacing.lg,
    maxHeight: 80,
  },
  tabsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    marginRight: spacing.sm,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    elevation: 3,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray600,
    marginBottom: 2,
  },
  tabTextActive: {
    color: colors.white,
  },
  tabDate: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  tabDateActive: {
    color: colors.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    marginTop: spacing.lg,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  dayTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.lg,
  },
});
