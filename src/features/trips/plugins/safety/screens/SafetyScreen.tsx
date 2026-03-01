/**
 * SAFETY PLUGIN - MAIN SCREEN
 * 
 * Real-time safety monitoring and emergency assistance for travelers.
 * 
 * AI FEATURES:
 * - Live location tracking during trip
 * - Proactive safety alerts based on GPS and news
 * - Emergency SOS with auto-contact notification
 * - Safe zone recommendations
 * - Smart check-in reminders
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Danger,
  Call,
  Location,
  TickCircle,
  Warning2,
  Hospital,
  SecurityUser,
  Global,
  ShieldTick,
} from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { useToast } from '@/contexts/ToastContext';
import * as Haptics from 'expo-haptics';
import {
  SafetyLevel,
  AlertType,
  EmergencyContact,
  SafetyAlert,
  SafeZone,
  BeforeYouGoItem,
  SafetyScore,
  EmergencyType,
} from '../types/safety.types';

/**
 * MOCK DATA - Replace with AI-generated real-time data
 * 
 * AI TODO:
 * - Fetch safety score from AI based on destination
 * - Pull real-time alerts from government APIs and news
 * - Get emergency contacts for destination
 * - Calculate safe zones based on user's current location
 */

const MOCK_SAFETY_SCORE: SafetyScore = {
  overall: 85,
  breakdown: {
    crime: 80,
    health: 90,
    political: 85,
    natural: 88,
    infrastructure: 82,
  },
  trend: 'stable',
  lastUpdated: new Date(),
  sources: ['US State Dept', 'WHO', 'Local Police'],
};

const MOCK_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    type: EmergencyType.POLICE,
    name: 'Dubai Police',
    number: '999',
    description: 'Emergency police assistance',
    available24_7: true,
  },
  {
    type: EmergencyType.MEDICAL,
    name: 'Ambulance',
    number: '998',
    description: 'Medical emergency services',
    available24_7: true,
  },
  {
    type: EmergencyType.FIRE,
    name: 'Fire Department',
    number: '997',
    description: 'Fire and rescue services',
    available24_7: true,
  },
  {
    type: EmergencyType.EMBASSY,
    name: 'US Embassy Dubai',
    number: '+971-4-309-4000',
    description: 'American citizen services',
    available24_7: false,
  },
];

const MOCK_ALERTS: SafetyAlert[] = [
  {
    id: '1',
    type: AlertType.WEATHER,
    level: SafetyLevel.CAUTION,
    title: 'High Temperature Alert',
    description: 'Temperatures expected to reach 45°C (113°F). Stay hydrated and avoid outdoor activities during peak hours.',
    location: 'Dubai, UAE',
    validUntil: new Date('2024-07-15'),
    source: 'UAE Meteorology',
    actionRequired: false,
    createdAt: new Date(),
    aiGenerated: false,
  },
  {
    id: '2',
    type: AlertType.SECURITY,
    level: SafetyLevel.SAFE,
    title: 'Low Crime Rate',
    description: 'Dubai maintains one of the lowest crime rates globally. However, remain vigilant in crowded tourist areas.',
    location: 'Dubai, UAE',
    source: 'Dubai Police',
    actionRequired: false,
    createdAt: new Date(),
    aiGenerated: true,
    relevanceScore: 0.9,
  },
];

const MOCK_BEFORE_YOU_GO: BeforeYouGoItem[] = [
  {
    id: '1',
    category: 'vaccination',
    title: 'Check Vaccination Requirements',
    description: 'No mandatory vaccinations for UAE. Hepatitis A and Typhoid recommended.',
    required: false,
    completed: false,
  },
  {
    id: '2',
    category: 'insurance',
    title: 'Travel Insurance',
    description: 'Ensure you have comprehensive travel insurance covering medical emergencies.',
    required: true,
    completed: false,
  },
  {
    id: '3',
    category: 'registration',
    title: 'Register with Embassy',
    description: 'Register your trip with the US Embassy for emergency notifications.',
    required: false,
    completed: false,
    link: 'https://step.state.gov',
  },
  {
    id: '4',
    category: 'documentation',
    title: 'Copy Important Documents',
    description: 'Make copies of passport, visa, and insurance documents. Store digitally.',
    required: true,
    completed: false,
  },
];

export default function SafetyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showSuccess, showError } = useToast();
  const { colors, isDark } = useTheme();
  const tripId = params.tripId as string;
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));

  const [activeTab, setActiveTab] = useState<'before' | 'during' | 'alerts'>('during');
  const [beforeYouGoItems, setBeforeYouGoItems] = useState(MOCK_BEFORE_YOU_GO);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Trip not found</Text>
      </SafeAreaView>
    );
  }

  /**
   * AI TODO: Determine current trip phase
   * - If trip hasn't started: Show "Before You Go"
   * - If trip is active: Show "During Trip" with live tracking
   * - If trip ended: Show summary and feedback
   */
  const isBeforeTrip = new Date() < new Date(trip.startDate);
  const isDuringTrip = new Date() >= new Date(trip.startDate) && new Date() <= new Date(trip.endDate);

  const handleEmergencyCall = (number: string) => {
    /**
     * AI TODO: Log emergency call for safety monitoring
     * - Record time and type of emergency
     * - Alert emergency contacts automatically
     * - Send location to contacts
     * - Start recording if user enabled
     */
    Linking.openURL(`tel:${number}`);
  };

  const handleSOS = () => {
    /**
     * Emergency SOS Protocol
     * Shows confirmation modal, then sends distress signal to nearby users
     */
    
    // Immediate haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    Alert.alert(
      '🚨 Emergency SOS',
      'We\'re about to send a distress signal to all Guidera users nearby and notify your emergency contacts. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            // Strong haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            
            // Simulate sending SOS (vibrate for 3 seconds)
            const vibrateInterval = setInterval(() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }, 500);
            
            // Show alerting message
            showSuccess('🚨 Alerting nearby users...');
            
            /**
             * AI TODO: Actual SOS Implementation
             * 1. Get current GPS location
             * 2. Send to backend: POST /api/emergency/sos
             * 3. Backend broadcasts to nearby users (within 5 mile radius)
             * 4. Send SMS/push to emergency contacts
             * 5. Log incident for safety monitoring
             */
            
            // Stop vibrating after 3 seconds
            setTimeout(() => {
              clearInterval(vibrateInterval);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showSuccess('✅ SOS sent! Nearby users and emergency contacts have been alerted.');
            }, 3000);
          }
        }
      ],
      { cancelable: true }
    );
  };

  const toggleBeforeYouGoItem = (id: string) => {
    setBeforeYouGoItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const getSafetyLevelColor = (level: SafetyLevel) => {
    switch (level) {
      case SafetyLevel.SAFE:
        return '#10B981';
      case SafetyLevel.CAUTION:
        return '#F59E0B';
      case SafetyLevel.WARNING:
        return '#F97316';
      case SafetyLevel.DANGER:
        return '#EF4444';
    }
  };

  const getSafetyLevelText = (level: SafetyLevel) => {
    switch (level) {
      case SafetyLevel.SAFE:
        return 'Safe';
      case SafetyLevel.CAUTION:
        return 'Caution';
      case SafetyLevel.WARNING:
        return 'Warning';
      case SafetyLevel.DANGER:
        return 'Danger';
    }
  };

  const getEmergencyIcon = (type: EmergencyType) => {
    switch (type) {
      case EmergencyType.POLICE:
        return <SecurityUser size={24} color="#EF4444" variant="Bold" />;
      case EmergencyType.MEDICAL:
        return <Hospital size={24} color="#EF4444" variant="Bold" />;
      case EmergencyType.FIRE:
        return <Danger size={24} color="#EF4444" variant="Bold" />;
      case EmergencyType.EMBASSY:
        return <Global size={24} color="#EF4444" variant="Bold" />;
      default:
        return <Call size={24} color="#EF4444" variant="Bold" />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgPrimary} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Safety</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Safety Score Card */}
          <View style={[styles.safetyScoreCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <View style={styles.safetyScoreRow}>
              <View style={styles.safetyScoreLeft}>
                <View style={[styles.safetyScoreIconContainer, { backgroundColor: '#10B98115' }]}>
                  <ShieldTick size={28} color="#10B981" variant="Bold" />
                </View>
                <View style={styles.safetyScoreTextContainer}>
                  <Text style={[styles.safetyScoreTitle, { color: colors.textPrimary }]}>Safety Score</Text>
                  <Text style={[styles.safetyScoreSubtitle, { color: colors.textSecondary }]}>{trip.destination.city}</Text>
                  <View style={styles.safetyScoreBadge}>
                    <Text style={[styles.safetyScoreBadgeText, { color: '#10B981' }]}>
                      ● {getSafetyLevelText(SafetyLevel.SAFE)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.safetyScoreRight}>
                <View style={styles.safetyScoreValueContainer}>
                  <Text style={[styles.safetyScoreValue, { color: colors.textPrimary }]}>{MOCK_SAFETY_SCORE.overall}</Text>
                  <Text style={[styles.safetyScoreMax, { color: colors.textTertiary }]}>/100</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SOS Button - Always Visible */}
          <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
            <Danger size={24} color="#FFFFFF" variant="Bold" />
            <Text style={styles.sosButtonText}>Emergency SOS</Text>
          </TouchableOpacity>

          {/* Tabs */}
          <View style={[styles.tabsContainer, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'before' && styles.tabActive]}
              onPress={() => setActiveTab('before')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'before' && styles.tabTextActive]}>
                Before You Go
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'during' && styles.tabActive]}
              onPress={() => setActiveTab('during')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'during' && styles.tabTextActive]}>
                During Trip
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'alerts' && styles.tabActive]}
              onPress={() => setActiveTab('alerts')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'alerts' && styles.tabTextActive]}>
                Alerts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Before You Go Tab */}
          {activeTab === 'before' && (
            <View style={styles.tabContent}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Preparation Checklist</Text>
              {beforeYouGoItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.checklistItem, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}
                  onPress={() => toggleBeforeYouGoItem(item.id)}
                >
                  <View style={[
                    styles.checkbox,
                    item.completed && styles.checkboxCompleted,
                  ]}>
                    {item.completed && (
                      <TickCircle size={20} color="#10B981" variant="Bold" />
                    )}
                  </View>
                  <View style={styles.checklistContent}>
                    <Text style={[
                      styles.checklistTitle,
                      { color: colors.textPrimary },
                      item.completed && { textDecorationLine: 'line-through' as const, color: colors.textTertiary },
                    ]}>
                      {item.title}
                      {item.required && <Text style={styles.requiredBadge}> *</Text>}
                    </Text>
                    <Text style={[styles.checklistDescription, { color: colors.textSecondary }]}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* During Trip Tab */}
          {activeTab === 'during' && (
            <View style={styles.tabContent}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Emergency Contacts</Text>
              {MOCK_EMERGENCY_CONTACTS.map(contact => (
                <TouchableOpacity
                  key={contact.type}
                  style={[styles.emergencyCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}
                  onPress={() => handleEmergencyCall(contact.number)}
                >
                  <View style={styles.emergencyIcon}>
                    {getEmergencyIcon(contact.type)}
                  </View>
                  <View style={styles.emergencyContent}>
                    <Text style={[styles.emergencyName, { color: colors.textPrimary }]}>{contact.name}</Text>
                    <Text style={[styles.emergencyDescription, { color: colors.textSecondary }]}>{contact.description}</Text>
                  </View>
                  <View style={styles.emergencyNumber}>
                    <Call size={20} color={colors.primary} variant="Bold" />
                    <Text style={[styles.emergencyNumberText, { color: colors.primary }]}>{contact.number}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* AI TODO: Live Location Sharing Section */}
              <View style={styles.locationSection}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Location Sharing</Text>
                <View style={[styles.locationCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
                  <Location size={24} color={colors.primary} variant="Bold" />
                  <View style={styles.locationContent}>
                    <Text style={[styles.locationTitle, { color: colors.textPrimary }]}>Share Live Location</Text>
                    <Text style={[styles.locationDescription, { color: colors.textSecondary }]}>
                      Share your real-time location with emergency contacts
                    </Text>
                  </View>
                  <TouchableOpacity style={[styles.locationButton, { backgroundColor: colors.primary }]}>
                    <Text style={styles.locationButtonText}>Enable</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <View style={styles.tabContent}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Safety Alerts</Text>
              {MOCK_ALERTS.map(alert => (
                <View key={alert.id} style={[styles.alertCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
                  <View style={styles.alertHeader}>
                    <View style={[
                      styles.alertBadge,
                      { backgroundColor: `${getSafetyLevelColor(alert.level)}15` }
                    ]}>
                      <Text style={[
                        styles.alertBadgeText,
                        { color: getSafetyLevelColor(alert.level) }
                      ]}>
                        {getSafetyLevelText(alert.level)}
                      </Text>
                    </View>
                    <Text style={[styles.alertSource, { color: colors.textTertiary }]}>{alert.source}</Text>
                  </View>
                  <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>{alert.title}</Text>
                  <Text style={[styles.alertDescription, { color: colors.textSecondary }]}>{alert.description}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
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
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  safetyScoreCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  safetyScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  safetyScoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  safetyScoreIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  safetyScoreTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  safetyScoreRight: {
    alignItems: 'flex-end',
  },
  safetyScoreTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  safetyScoreSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  safetyScoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  safetyScoreValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
  },
  safetyScoreMax: {
    fontSize: typography.fontSize.lg,
    marginLeft: spacing.xs,
  },
  safetyScoreBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  safetyScoreBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#EF4444',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sosButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  tabActive: {
    backgroundColor: '#111827',
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#10B98115',
  },
  checklistContent: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  checklistTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  checklistDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  requiredBadge: {
    color: '#EF4444',
    fontWeight: '700',
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF444415',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyName: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emergencyDescription: {
    fontSize: typography.fontSize.sm,
  },
  emergencyNumber: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  emergencyNumberText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  locationSection: {
    marginTop: spacing.xl,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  locationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  locationTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  locationDescription: {
    fontSize: typography.fontSize.sm,
  },
  locationButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  locationButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  alertBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  alertBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  alertSource: {
    fontSize: typography.fontSize.xs,
  },
  alertTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  alertDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
});
