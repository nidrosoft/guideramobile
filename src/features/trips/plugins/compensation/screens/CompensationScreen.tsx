import React, { useState, useMemo } from 'react';
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
import {
  ArrowLeft,
  Add,
  Airplane,
  DollarCircle,
  TickCircle,
  Clock,
  Warning2,
  Bag2,
  PercentageCircle,
  MoneyRecive,
} from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { Claim, ClaimStatus, ClaimType, ClaimStats, ClaimTypeInfo } from '../types/compensation.types';
import { useToast } from '@/contexts/ToastContext';
import AddClaimBottomSheet from '../components/AddClaimBottomSheet';

// Claim type configuration
const CLAIM_TYPES: ClaimTypeInfo[] = [
  { id: ClaimType.FLIGHT_DELAY, name: 'Flight Delay', icon: 'airplane', color: '#F59E0B', emoji: '⏰', description: 'Delayed flight compensation' },
  { id: ClaimType.FLIGHT_CANCELLATION, name: 'Flight Cancellation', icon: 'airplane', color: '#EF4444', emoji: '❌', description: 'Cancelled flight compensation' },
  { id: ClaimType.OVERBOOKING, name: 'Overbooking', icon: 'airplane', color: '#8B5CF6', emoji: '🎫', description: 'Denied boarding compensation' },
  { id: ClaimType.LOST_BAGGAGE, name: 'Lost Baggage', icon: 'bag', color: '#EC4899', emoji: '🧳', description: 'Lost luggage compensation' },
  { id: ClaimType.DAMAGED_BAGGAGE, name: 'Damaged Baggage', icon: 'bag', color: '#F97316', emoji: '💼', description: 'Damaged luggage compensation' },
  { id: ClaimType.HOTEL_ISSUE, name: 'Hotel Issue', icon: 'building', color: '#06B6D4', emoji: '🏨', description: 'Hotel-related compensation' },
  { id: ClaimType.OTHER, name: 'Other', icon: 'more', color: '#6B7280', emoji: '📋', description: 'Other compensation claims' },
];

// Mock claims data
const MOCK_CLAIMS: Claim[] = [
  {
    id: '1',
    tripId: '1',
    type: ClaimType.FLIGHT_DELAY,
    status: ClaimStatus.POTENTIAL,
    provider: 'United Airlines',
    flightNumber: 'UA 1234',
    bookingReference: 'ABC123',
    date: new Date('2024-06-17T10:00:00'),
    estimatedAmount: 600,
    currency: 'USD',
    description: 'Flight delayed by 4 hours',
    reason: 'Technical issues',
    aiConfidence: 85,
    eligibilityNotes: 'EU261 regulation applies - eligible for €600 compensation',
    createdAt: new Date('2024-06-17'),
    updatedAt: new Date('2024-06-17'),
  },
  {
    id: '2',
    tripId: '1',
    type: ClaimType.LOST_BAGGAGE,
    status: ClaimStatus.ACTIVE,
    provider: 'Delta Airlines',
    flightNumber: 'DL 5678',
    bookingReference: 'XYZ789',
    date: new Date('2024-06-18T14:00:00'),
    estimatedAmount: 1500,
    currency: 'USD',
    description: 'Baggage lost during connection',
    reason: 'Mishandled during transfer',
    submittedDate: new Date('2024-06-19'),
    aiConfidence: 95,
    createdAt: new Date('2024-06-18'),
    updatedAt: new Date('2024-06-19'),
  },
  {
    id: '3',
    tripId: '1',
    type: ClaimType.FLIGHT_CANCELLATION,
    status: ClaimStatus.COMPLETED,
    provider: 'American Airlines',
    flightNumber: 'AA 9012',
    bookingReference: 'DEF456',
    date: new Date('2024-05-15T08:00:00'),
    estimatedAmount: 800,
    actualAmount: 800,
    currency: 'USD',
    description: 'Flight cancelled due to weather',
    reason: 'Severe weather conditions',
    submittedDate: new Date('2024-05-16'),
    completedDate: new Date('2024-05-25'),
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-05-25'),
  },
  {
    id: '4',
    tripId: '1',
    type: ClaimType.FLIGHT_DELAY,
    status: ClaimStatus.COMPLETED,
    provider: 'EgyptAir',
    flightNumber: 'MS 777',
    bookingReference: 'GHI789',
    date: new Date('2024-04-10T12:00:00'),
    estimatedAmount: 600,
    actualAmount: 0, // Failed claim
    currency: 'USD',
    description: 'Flight delayed by 3 hours',
    reason: 'Mechanical issues',
    submittedDate: new Date('2024-04-11'),
    completedDate: new Date('2024-04-20'),
    createdAt: new Date('2024-04-10'),
    updatedAt: new Date('2024-04-20'),
  },
  {
    id: '5',
    tripId: '1',
    type: ClaimType.LOST_BAGGAGE,
    status: ClaimStatus.COMPLETED,
    provider: 'Garuda Indonesia',
    flightNumber: 'GA 888',
    bookingReference: 'JKL012',
    date: new Date('2024-03-05T16:00:00'),
    estimatedAmount: 1200,
    actualAmount: 1200,
    currency: 'USD',
    description: 'Baggage lost during international flight',
    reason: 'Mishandled at transit',
    submittedDate: new Date('2024-03-06'),
    completedDate: new Date('2024-03-15'),
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-15'),
  },
];

export default function CompensationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const { showSuccess } = useToast();
  const tripId = params.tripId as string;
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));

  const [claims, setClaims] = useState<Claim[]>(MOCK_CLAIMS);
  const [activeTab, setActiveTab] = useState<ClaimStatus>(ClaimStatus.POTENTIAL);
  const [addClaimVisible, setAddClaimVisible] = useState(false);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Trip not found</Text>
      </SafeAreaView>
    );
  }

  // Calculate statistics
  const stats: ClaimStats = useMemo(() => {
    const potentialClaims = claims.filter(c => c.status === ClaimStatus.POTENTIAL);
    const activeClaims = claims.filter(c => c.status === ClaimStatus.ACTIVE);
    const completedClaims = claims.filter(c => c.status === ClaimStatus.COMPLETED);

    const totalPotentialAmount = potentialClaims.reduce((sum, c) => sum + c.estimatedAmount, 0);
    const totalCompletedAmount = completedClaims.reduce((sum, c) => sum + (c.actualAmount || 0), 0);
    const averageClaimAmount = completedClaims.length > 0
      ? totalCompletedAmount / completedClaims.length
      : 0;
    const successRate = claims.length > 0
      ? (completedClaims.length / claims.length) * 100
      : 0;

    return {
      totalClaims: claims.length,
      potentialClaims: potentialClaims.length,
      activeClaims: activeClaims.length,
      completedClaims: completedClaims.length,
      totalPotentialAmount,
      totalCompletedAmount,
      averageClaimAmount,
      successRate,
    };
  }, [claims]);

  // Filter claims by active tab
  const filteredClaims = claims.filter(claim => claim.status === activeTab);

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getClaimTypeInfo = (type: ClaimType) => {
    return CLAIM_TYPES.find(t => t.id === type) || CLAIM_TYPES[CLAIM_TYPES.length - 1];
  };

  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.POTENTIAL:
        return '#F59E0B';
      case ClaimStatus.ACTIVE:
        return colors.primary;
      case ClaimStatus.COMPLETED:
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.POTENTIAL:
        return <Warning2 size={20} color="#F59E0B" variant="Bold" />;
      case ClaimStatus.ACTIVE:
        return <Clock size={20} color={colors.primary} variant="Bold" />;
      case ClaimStatus.COMPLETED:
        return <TickCircle size={20} color="#10B981" variant="Bold" />;
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Compensation Tracker</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddClaimVisible(true)}
          >
            <Add size={24} color={colors.primary} variant="Bold" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Total Potential Card */}
          <View style={[styles.totalPotentialCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <View style={styles.totalPotentialRow}>
              <View style={styles.totalPotentialLeft}>
                <View style={styles.totalPotentialIconContainer}>
                  <DollarCircle size={24} color={colors.primary} variant="Bold" />
                </View>
                <View style={styles.totalPotentialTextContainer}>
                  <Text style={[styles.totalPotentialTitle, { color: colors.textPrimary }]}>Total Potential</Text>
                  <Text style={[styles.totalPotentialSubtitle, { color: colors.textSecondary }]}>
                    {stats.potentialClaims} potential {stats.potentialClaims === 1 ? 'claim' : 'claims'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.totalPotentialValue, { color: colors.textPrimary }]}>{formatCurrency(stats.totalPotentialAmount)}</Text>
            </View>
          </View>

          {/* Tabs - Fully Rounded */}
          <View style={[styles.tabsContainer, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === ClaimStatus.POTENTIAL && styles.tabActive]}
              onPress={() => setActiveTab(ClaimStatus.POTENTIAL)}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === ClaimStatus.POTENTIAL && styles.tabTextActive]}>
                Potential
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === ClaimStatus.ACTIVE && styles.tabActive]}
              onPress={() => setActiveTab(ClaimStatus.ACTIVE)}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === ClaimStatus.ACTIVE && styles.tabTextActive]}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === ClaimStatus.COMPLETED && styles.tabActive]}
              onPress={() => setActiveTab(ClaimStatus.COMPLETED)}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === ClaimStatus.COMPLETED && styles.tabTextActive]}>
                Completed
              </Text>
            </TouchableOpacity>
          </View>

          {/* Total Claim & Potential Card - Side by Side */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
              <View style={[styles.statIconCircle, { backgroundColor: '#8B5CF615' }]}>
                <DollarCircle size={24} color="#8B5CF6" variant="Bold" />
              </View>
              <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Total to Claim</Text>
              <Text style={[styles.statCardValue, { color: colors.textPrimary }]}>{formatCurrency(stats.totalPotentialAmount)}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
              <View style={[styles.statIconCircle, { backgroundColor: '#3B82F615' }]}>
                <MoneyRecive size={24} color="#3B82F6" variant="Bold" />
              </View>
              <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Potential Card</Text>
              <Text style={[styles.statCardValue, { color: colors.textPrimary }]}>{stats.potentialClaims} Card</Text>
            </View>
          </View>

          {/* Average to Claim */}
          <View style={[styles.averageCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <View style={styles.averageLeft}>
              <View style={[styles.averageIconCircle, { backgroundColor: '#10B98115' }]}>
                <PercentageCircle size={24} color="#10B981" variant="Bold" />
              </View>
              <Text style={[styles.averageLabel, { color: colors.textPrimary }]}>Average to Claim</Text>
            </View>
            <View style={styles.averageBadge}>
              <Text style={styles.averageValue}>{Math.round(stats.successRate)} %</Text>
            </View>
          </View>

          {/* Section Title */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Potential Claim</Text>

          {/* Claims List */}
          <View style={styles.claimsSection}>
            {filteredClaims.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.textPrimary }]}>No {activeTab} claims</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                  {activeTab === ClaimStatus.POTENTIAL && 'Add a claim to track potential compensation'}
                  {activeTab === ClaimStatus.ACTIVE && 'No active claims in progress'}
                  {activeTab === ClaimStatus.COMPLETED && 'No completed claims yet'}
                </Text>
              </View>
            ) : (
              filteredClaims.map(claim => {
                const typeInfo = getClaimTypeInfo(claim.type);
                
                // Active Claim Card (with progress bar)
                if (claim.status === ClaimStatus.ACTIVE) {
                  return (
                    <TouchableOpacity key={claim.id} style={[styles.activeClaimCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]} activeOpacity={0.7}>
                      {/* Progress Header */}
                      <View style={styles.activeClaimHeader}>
                        <Text style={[styles.activeClaimTitle, { color: colors.textSecondary }]}>Checked Progress</Text>
                        <View style={styles.activeProgressRow}>
                          <Text style={[styles.activeProgressText, { color: colors.textPrimary }]}>68%</Text>
                          <View style={styles.activeProgressBar}>
                            <View style={[styles.activeProgressFill, { width: '68%' }]} />
                          </View>
                          <Text style={[styles.activeProgressTotal, { color: colors.textTertiary }]}>100%</Text>
                        </View>
                      </View>

                      {/* Amount Section */}
                      <View style={styles.activeAmountSection}>
                        <View>
                          <Text style={[styles.activeAmountLabel, { color: colors.textSecondary }]}>Estimated Claim</Text>
                          <Text style={[styles.activeAmountValue, { color: colors.textPrimary }]}>{formatCurrency(claim.estimatedAmount)}</Text>
                        </View>
                        <View style={[styles.activeClaimTypeIcon, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}>
                          <Airplane size={20} color={colors.textSecondary} />
                        </View>
                      </View>

                      {/* Date & Provider */}
                      <View style={styles.activeMetaRow}>
                        <View style={styles.activeMetaItem}>
                          <Text style={[styles.activeMetaLabel, { color: colors.textTertiary }]}>📅 Date</Text>
                          <Text style={[styles.activeMetaValue, { color: colors.textPrimary }]}>{formatDate(claim.date)}</Text>
                        </View>
                        <View style={styles.activeMetaItem}>
                          <Text style={[styles.activeMetaLabel, { color: colors.textTertiary }]}>Provider 🏷️</Text>
                          <Text style={[styles.activeMetaValue, { color: colors.textPrimary }]}>{claim.provider}</Text>
                        </View>
                      </View>

                      {/* Circular Chart */}
                      <View style={styles.chartContainer}>
                        <View style={[styles.chartCircle, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}>
                          <View style={[styles.chartProgress, { 
                            backgroundColor: colors.primary,
                            transform: [{ rotate: `${(claim.aiConfidence || 0) * 3.6}deg` }]
                          }]} />
                          <View style={[styles.chartInner, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
                            <Text style={[styles.chartPercentage, { color: colors.textPrimary }]}>{claim.aiConfidence}%</Text>
                            <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>Claim Percentage 👍</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }
                
                // Completed Claim Card (green success or red failed)
                if (claim.status === ClaimStatus.COMPLETED) {
                  const isSuccess = claim.actualAmount && claim.actualAmount > 0;
                  return (
                    <TouchableOpacity key={claim.id} style={[styles.completedClaimCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderColor: colors.borderSubtle }]} activeOpacity={0.7}>
                      {/* Status Banner */}
                      <View style={[styles.completedBanner, { backgroundColor: isSuccess ? '#10B981' : '#EF4444' }]}>
                        <Text style={styles.completedBannerText}>
                          {isSuccess ? 'Successfully Claimed' : 'Failed to Claim'}
                        </Text>
                      </View>

                      {/* Amount Section */}
                      <View style={styles.completedContent}>
                        <View style={styles.completedAmountSection}>
                          <View>
                            <Text style={[styles.completedAmountLabel, { color: colors.textSecondary }]}>Estimated Claim</Text>
                            <Text style={[styles.completedAmountValue, { color: colors.textPrimary }]}>{formatCurrency(claim.estimatedAmount)}</Text>
                          </View>
                          <View style={[styles.completedClaimTypeIcon, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}>
                            <Airplane size={20} color={colors.textSecondary} />
                          </View>
                        </View>

                        {/* Date & Provider */}
                        <View style={styles.completedMetaRow}>
                          <View style={styles.completedMetaItem}>
                            <Text style={[styles.completedMetaLabel, { color: colors.textTertiary }]}>📅 Date</Text>
                            <Text style={[styles.completedMetaValue, { color: colors.textPrimary }]}>{formatDate(claim.date)}</Text>
                          </View>
                          <View style={styles.completedMetaItem}>
                            <Text style={[styles.completedMetaLabel, { color: colors.textTertiary }]}>Provider 🏷️</Text>
                            <Text style={[styles.completedMetaValue, { color: colors.textPrimary }]}>{claim.provider}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }
                
                // Potential Claim Card (with stacked effect)
                return (
                  <View key={claim.id} style={styles.claimCardStack}>
                    {/* Stacked Card Effect - Background Cards */}
                    <View style={[styles.stackedCard, styles.stackedCard3, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]} />
                    <View style={[styles.stackedCard, styles.stackedCard2, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]} />
                    <View style={[styles.stackedCard, styles.stackedCard1, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]} />
                    
                    {/* Main Card */}
                    <TouchableOpacity style={[styles.claimCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]} activeOpacity={0.7}>
                    {/* Top Section */}
                    <View style={styles.claimTopSection}>
                      <View style={styles.claimLabelRow}>
                        <Text style={[styles.claimLabel, { color: colors.textSecondary }]}>Estimated Claim</Text>
                        <View style={[styles.claimTypeIcon, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}>
                          <Airplane size={20} color={colors.textSecondary} />
                        </View>
                      </View>
                      <Text style={[styles.claimAmountLarge, { color: colors.textPrimary }]}>
                        {formatCurrency(claim.estimatedAmount)}
                      </Text>
                    </View>

                    {/* Date & Provider Row */}
                    <View style={styles.claimMetaRow}>
                      <View style={styles.claimMetaItem}>
                        <Text style={[styles.claimMetaLabel, { color: colors.textTertiary }]}>📅 Date</Text>
                        <Text style={[styles.claimMetaValue, { color: colors.textPrimary }]}>{formatDate(claim.date)}</Text>
                      </View>
                      <View style={styles.claimMetaItem}>
                        <Text style={[styles.claimMetaLabel, { color: colors.textTertiary }]}>✈️ Provider</Text>
                        <Text style={[styles.claimMetaValue, { color: colors.textPrimary }]}>{claim.provider}</Text>
                      </View>
                    </View>

                    {/* Circular Progress Chart */}
                    <View style={styles.chartContainer}>
                      <View style={[styles.chartCircle, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}>
                        <View style={[styles.chartProgress, { 
                          backgroundColor: colors.primary,
                          transform: [{ rotate: `${(claim.aiConfidence || 0) * 3.6}deg` }]
                        }]} />
                        <View style={[styles.chartInner, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
                          <Text style={[styles.chartPercentage, { color: colors.textPrimary }]}>{claim.aiConfidence}%</Text>
                          <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>Claim Percentage 👍</Text>
                        </View>
                      </View>
                    </View>

                    {/* Status Footer */}
                    <View style={[styles.claimFooter, { borderTopColor: colors.borderSubtle }]}>
                      <Text style={[styles.claimFooterLabel, { color: colors.textTertiary }]}>Status</Text>
                      <View style={styles.waitingBadge}>
                        <Text style={styles.waitingText}>Waiting to Active</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Add Claim Bottom Sheet */}
        <AddClaimBottomSheet
          visible={addClaimVisible}
          onClose={() => setAddClaimVisible(false)}
          onSubmit={(claimData) => {
            console.log('New claim submitted:', claimData);
            showSuccess('Claim submitted successfully!');
            setAddClaimVisible(false);
          }}
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
    fontWeight: '700',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  totalPotentialCard: {
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
  totalPotentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalPotentialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  totalPotentialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  totalPotentialTextContainer: {
    flex: 1,
  },
  totalPotentialTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  totalPotentialSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  totalPotentialValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statValueSmall: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statSubtext: {
    fontSize: typography.fontSize.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statCardLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  statCardValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  averageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  averageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  averageIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  averageLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  averageBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  averageValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: '#10B981',
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
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  tabActive: {
    backgroundColor: '#7C3AED',
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  claimsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  claimCardStack: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  stackedCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  stackedCard3: {
    top: -12,
    height: 12,
    opacity: 0.3,
  },
  stackedCard2: {
    top: -8,
    height: 12,
    opacity: 0.5,
  },
  stackedCard1: {
    top: -4,
    height: 12,
    opacity: 0.7,
  },
  claimCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  claimTopSection: {
    marginBottom: spacing.md,
  },
  claimLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  claimLabel: {
    fontSize: typography.fontSize.sm,
  },
  claimTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimAmountLarge: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
  },
  claimMetaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  claimMetaItem: {
    flex: 1,
  },
  claimMetaLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  claimMetaValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  chartCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  chartProgress: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  chartInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  chartPercentage: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  chartLabel: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  claimFooterLabel: {
    fontSize: typography.fontSize.sm,
  },
  claimFooterValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  waitingBadge: {
    backgroundColor: '#F9731615',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  waitingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: '#F97316',
    fontStyle: 'italic',
  },
  // Active Claim Card Styles
  activeClaimCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  activeClaimHeader: {
    marginBottom: spacing.lg,
  },
  activeClaimTitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  activeProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activeProgressText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  activeProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  activeProgressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: borderRadius.full,
  },
  activeProgressTotal: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
  activeAmountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  activeAmountLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  activeAmountValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
  },
  activeClaimTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeMetaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  activeMetaItem: {
    flex: 1,
  },
  activeMetaLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  activeMetaValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  // Completed Claim Card Styles
  completedClaimCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
  },
  completedBanner: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  completedBannerText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completedContent: {
    padding: spacing.lg,
  },
  completedAmountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  completedAmountLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  completedAmountValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
  },
  completedClaimTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedMetaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  completedMetaItem: {
    flex: 1,
  },
  completedMetaLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  completedMetaValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});
