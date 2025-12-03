import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, CloseCircle } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { Trip } from '@/features/trips/types/trip.types';
import ActivityCard from './components/ActivityCard';
import { DayItinerary, Activity, ActivityType } from './types/planner.types';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface PlannerPluginProps {
  visible: boolean;
  onClose: () => void;
  trip: Trip;
}

// Mock data for demonstration
const MOCK_ITINERARY: DayItinerary[] = [
  {
    dayNumber: 1,
    date: 'Mon, Dec 15',
    activities: [
      {
        id: '1',
        type: ActivityType.FLIGHT,
        title: 'Flight to Bali',
        subtitle: 'LAX → DPS',
        time: '10:00 AM',
        duration: '14h 30m',
      },
      {
        id: '2',
        type: ActivityType.HOTEL,
        title: 'Check-in',
        subtitle: 'Seminyak Beach Resort',
        time: '2:30 PM',
        location: 'Seminyak, Bali',
      },
      {
        id: '3',
        type: ActivityType.RESTAURANT,
        title: 'Dinner',
        subtitle: 'La Lucciola',
        time: '7:00 PM',
        duration: '2h',
        location: 'Seminyak Beach',
      },
    ],
  },
  {
    dayNumber: 2,
    date: 'Tue, Dec 16',
    activities: [
      {
        id: '4',
        type: ActivityType.COFFEE,
        title: 'Breakfast',
        subtitle: 'Revolver Espresso',
        time: '8:00 AM',
        duration: '1h',
        location: 'Seminyak',
      },
      {
        id: '5',
        type: ActivityType.ATTRACTION,
        title: 'Tanah Lot Temple',
        subtitle: 'Sunset Temple Visit',
        time: '3:00 PM',
        duration: '3h',
        location: 'Tabanan',
      },
      {
        id: '6',
        type: ActivityType.RESTAURANT,
        title: 'Seafood Dinner',
        subtitle: 'Jimbaran Bay',
        time: '7:30 PM',
        duration: '2h',
        location: 'Jimbaran',
      },
    ],
  },
  {
    dayNumber: 3,
    date: 'Wed, Dec 17',
    activities: [
      {
        id: '7',
        type: ActivityType.ACTIVITY,
        title: 'Surfing Lesson',
        subtitle: 'Beginner Class',
        time: '9:00 AM',
        duration: '2h',
        location: 'Kuta Beach',
      },
      {
        id: '8',
        type: ActivityType.SHOPPING,
        title: 'Shopping',
        subtitle: 'Seminyak Village',
        time: '2:00 PM',
        duration: '2h',
        location: 'Seminyak',
      },
    ],
  },
  {
    dayNumber: 4,
    date: 'Thu, Dec 18',
    activities: [
      {
        id: '9',
        type: ActivityType.HOTEL,
        title: 'Check-out',
        subtitle: 'Seminyak Beach Resort',
        time: '11:00 AM',
        location: 'Seminyak',
      },
      {
        id: '10',
        type: ActivityType.FLIGHT,
        title: 'Flight Home',
        subtitle: 'DPS → LAX',
        time: '3:00 PM',
        duration: '16h',
      },
    ],
  },
];

export default function PlannerPlugin({ visible, onClose, trip }: PlannerPluginProps) {
  const [selectedDay, setSelectedDay] = useState(0);

  const currentDay = MOCK_ITINERARY[selectedDay];

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
            <ArrowLeft size={24} color={colors.gray900} variant="Linear" />
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
          {MOCK_ITINERARY.map((day, index) => (
            <TouchableOpacity
              key={day.dayNumber}
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
          <Text style={styles.dayTitle}>Day {currentDay.dayNumber} Itinerary</Text>
          
          {currentDay.activities.map((activity, index) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              showAddButton={index < currentDay.activities.length - 1}
              onAddPress={() => {
                // TODO: Open add activity modal
                console.log('Add activity between', activity.id);
              }}
            />
          ))}
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
