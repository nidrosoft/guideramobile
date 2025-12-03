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
import { colors, spacing, typography, borderRadius } from '@/styles';
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
        return colors.warning;
      case ClaimStatus.ACTIVE:
        return colors.primary;
      case ClaimStatus.COMPLETED:
        return colors.success;
      default:
        return colors.gray500;
    }
  };

  const getStatusIcon = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.POTENTIAL:
        return <Warning2 size={20} color={colors.warning} variant="Bold" />;
      case ClaimStatus.ACTIVE:
        return <Clock size={20} color={colors.primary} variant="Bold" />;
      case ClaimStatus.COMPLETED:
        return <TickCircle size={20} color={colors.success} variant="Bold" />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compensation Tracker</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddClaimVisible(true)}
          >
            <Add size={24} color={colors.primary} variant="Bold" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Total Potential Card */}
          <View style={styles.totalPotentialCard}>
            <View style={styles.totalPotentialRow}>
              <View style={styles.totalPotentialLeft}>
                <View style={styles.totalPotentialIconContainer}>
                  <DollarCircle size={24} color={colors.primary} variant="Bold" />
                </View>
                <View style={styles.totalPotentialTextContainer}>
                  <Text style={styles.totalPotentialTitle}>Total Potential</Text>
                  <Text style={styles.totalPotentialSubtitle}>
                    {stats.potentialClaims} potential {stats.potentialClaims === 1 ? 'claim' : 'claims'}
                  </Text>
                </View>
              </View>
              <Text style={styles.totalPotentialValue}>{formatCurrency(stats.totalPotentialAmount)}</Text>
            </View>
          </View>

          {/* Tabs - Fully Rounded */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === ClaimStatus.POTENTIAL && styles.tabActive]}
              onPress={() => setActiveTab(ClaimStatus.POTENTIAL)}
            >
              <Text style={[styles.tabText, activeTab === ClaimStatus.POTENTIAL && styles.tabTextActive]}>
                Potential
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === ClaimStatus.ACTIVE && styles.tabActive]}
              onPress={() => setActiveTab(ClaimStatus.ACTIVE)}
            >
              <Text style={[styles.tabText, activeTab === ClaimStatus.ACTIVE && styles.tabTextActive]}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === ClaimStatus.COMPLETED && styles.tabActive]}
              onPress={() => setActiveTab(ClaimStatus.COMPLETED)}
            >
              <Text style={[styles.tabText, activeTab === ClaimStatus.COMPLETED && styles.tabTextActive]}>
                Completed
              </Text>
            </TouchableOpacity>
          </View>

          {/* Total Claim & Potential Card - Side by Side */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#8B5CF615' }]}>
                <DollarCircle size={24} color="#8B5CF6" variant="Bold" />
              </View>
              <Text style={styles.statCardLabel}>Total to Claim</Text>
              <Text style={styles.statCardValue}>{formatCurrency(stats.totalPotentialAmount)}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#3B82F615' }]}>
                <MoneyRecive size={24} color="#3B82F6" variant="Bold" />
              </View>
              <Text style={styles.statCardLabel}>Potential Card</Text>
              <Text style={styles.statCardValue}>{stats.potentialClaims} Card</Text>
            </View>
          </View>

          {/* Average to Claim */}
          <View style={styles.averageCard}>
            <View style={styles.averageLeft}>
              <View style={[styles.averageIconCircle, { backgroundColor: '#10B98115' }]}>
                <PercentageCircle size={24} color="#10B981" variant="Bold" />
              </View>
              <Text style={styles.averageLabel}>Average to Claim</Text>
            </View>
            <View style={styles.averageBadge}>
              <Text style={styles.averageValue}>{Math.round(stats.successRate)} %</Text>
            </View>
          </View>

          {/* Section Title */}
          <Text style={styles.sectionTitle}>Potential Claim</Text>

          {/* Claims List */}
          <View style={styles.claimsSection}>
            {filteredClaims.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No {activeTab} claims</Text>
                <Text style={styles.emptyStateSubtext}>
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
                    <TouchableOpacity key={claim.id} style={styles.activeClaimCard} activeOpacity={0.7}>
                      {/* Progress Header */}
                      <View style={styles.activeClaimHeader}>
                        <Text style={styles.activeClaimTitle}>Checked Progress</Text>
                        <View style={styles.activeProgressRow}>
                          <Text style={styles.activeProgressText}>68%</Text>
                          <View style={styles.activeProgressBar}>
                            <View style={[styles.activeProgressFill, { width: '68%' }]} />
                          </View>
                          <Text style={styles.activeProgressTotal}>100%</Text>
                        </View>
                      </View>

                      {/* Amount Section */}
                      <View style={styles.activeAmountSection}>
                        <View>
                          <Text style={styles.activeAmountLabel}>Estimated Claim</Text>
                          <Text style={styles.activeAmountValue}>{formatCurrency(claim.estimatedAmount)}</Text>
                        </View>
                        <View style={styles.activeClaimTypeIcon}>
                          <Airplane size={20} color={colors.gray600} />
                        </View>
                      </View>

                      {/* Date & Provider */}
                      <View style={styles.activeMetaRow}>
                        <View style={styles.activeMetaItem}>
                          <Text style={styles.activeMetaLabel}>📅 Date</Text>
                          <Text style={styles.activeMetaValue}>{formatDate(claim.date)}</Text>
                        </View>
                        <View style={styles.activeMetaItem}>
                          <Text style={styles.activeMetaLabel}>Provider 🏷️</Text>
                          <Text style={styles.activeMetaValue}>{claim.provider}</Text>
                        </View>
                      </View>

                      {/* Circular Chart */}
                      <View style={styles.chartContainer}>
                        <View style={styles.chartCircle}>
                          <View style={[styles.chartProgress, { 
                            backgroundColor: colors.primary,
                            transform: [{ rotate: `${(claim.aiConfidence || 0) * 3.6}deg` }]
                          }]} />
                          <View style={styles.chartInner}>
                            <Text style={styles.chartPercentage}>{claim.aiConfidence}%</Text>
                            <Text style={styles.chartLabel}>Claim Percentage 👍</Text>
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
                    <TouchableOpacity key={claim.id} style={styles.completedClaimCard} activeOpacity={0.7}>
                      {/* Status Banner */}
                      <View style={[styles.completedBanner, { backgroundColor: isSuccess ? colors.success : '#EF4444' }]}>
                        <Text style={styles.completedBannerText}>
                          {isSuccess ? 'Successfully Claimed' : 'Failed to Claim'}
                        </Text>
                      </View>

                      {/* Amount Section */}
                      <View style={styles.completedContent}>
                        <View style={styles.completedAmountSection}>
                          <View>
                            <Text style={styles.completedAmountLabel}>Estimated Claim</Text>
                            <Text style={styles.completedAmountValue}>{formatCurrency(claim.estimatedAmount)}</Text>
                          </View>
                          <View style={styles.completedClaimTypeIcon}>
                            <Airplane size={20} color={colors.gray600} />
                          </View>
                        </View>

                        {/* Date & Provider */}
                        <View style={styles.completedMetaRow}>
                          <View style={styles.completedMetaItem}>
                            <Text style={styles.completedMetaLabel}>📅 Date</Text>
                            <Text style={styles.completedMetaValue}>{formatDate(claim.date)}</Text>
                          </View>
                          <View style={styles.completedMetaItem}>
                            <Text style={styles.completedMetaLabel}>Provider 🏷️</Text>
                            <Text style={styles.completedMetaValue}>{claim.provider}</Text>
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
                    <View style={[styles.stackedCard, styles.stackedCard3]} />
                    <View style={[styles.stackedCard, styles.stackedCard2]} />
                    <View style={[styles.stackedCard, styles.stackedCard1]} />
                    
                    {/* Main Card */}
                    <TouchableOpacity style={styles.claimCard} activeOpacity={0.7}>
                    {/* Top Section */}
                    <View style={styles.claimTopSection}>
                      <View style={styles.claimLabelRow}>
                        <Text style={styles.claimLabel}>Estimated Claim</Text>
                        <View style={styles.claimTypeIcon}>
                          <Airplane size={20} color={colors.gray600} />
                        </View>
                      </View>
                      <Text style={styles.claimAmountLarge}>
                        {formatCurrency(claim.estimatedAmount)}
                      </Text>
                    </View>

                    {/* Date & Provider Row */}
                    <View style={styles.claimMetaRow}>
                      <View style={styles.claimMetaItem}>
                        <Text style={styles.claimMetaLabel}>📅 Date</Text>
                        <Text style={styles.claimMetaValue}>{formatDate(claim.date)}</Text>
                      </View>
                      <View style={styles.claimMetaItem}>
                        <Text style={styles.claimMetaLabel}>✈️ Provider</Text>
                        <Text style={styles.claimMetaValue}>{claim.provider}</Text>
                      </View>
                    </View>

                    {/* Circular Progress Chart */}
                    <View style={styles.chartContainer}>
                      <View style={styles.chartCircle}>
                        <View style={[styles.chartProgress, { 
                          backgroundColor: colors.primary,
                          transform: [{ rotate: `${(claim.aiConfidence || 0) * 3.6}deg` }]
                        }]} />
                        <View style={styles.chartInner}>
                          <Text style={styles.chartPercentage}>{claim.aiConfidence}%</Text>
                          <Text style={styles.chartLabel}>Claim Percentage 👍</Text>
                        </View>
                      </View>
                    </View>

                    {/* Status Footer */}
                    <View style={styles.claimFooter}>
                      <Text style={styles.claimFooterLabel}>Status</Text>
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
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  totalPotentialCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
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
    backgroundColor: `${colors.primary}15`,
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
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  totalPotentialSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  totalPotentialValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.gray900,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
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
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  statValueSmall: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  statSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
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
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  statCardValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
  },
  averageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
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
    color: colors.gray900,
  },
  averageBadge: {
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  averageValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.success,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    shadowColor: colors.black,
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
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray600,
  },
  tabTextActive: {
    color: colors.white,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray900,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
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
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
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
    color: colors.gray600,
  },
  claimTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimAmountLarge: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.gray900,
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
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  claimMetaValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray900,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  chartCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.gray100,
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
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  chartPercentage: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  chartLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    textAlign: 'center',
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  claimFooterLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  claimFooterValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray900,
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
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
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
    color: colors.gray600,
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
    color: colors.gray900,
  },
  activeProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray100,
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
    color: colors.gray400,
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
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  activeAmountValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.gray900,
  },
  activeClaimTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray100,
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
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  activeMetaValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray900,
  },
  // Completed Claim Card Styles
  completedClaimCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  completedBanner: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  completedBannerText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
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
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  completedAmountValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.gray900,
  },
  completedClaimTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray100,
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
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  completedMetaValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray900,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
  },
});
