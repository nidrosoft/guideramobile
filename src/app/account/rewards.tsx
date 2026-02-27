/**
 * REWARDS POINTS SCREEN
 * 
 * User's points balance, history, and ways to earn/redeem.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Gift,
  ArrowUp,
  ArrowDown,
  Clock,
  Airplane,
  Building,
  Car,
  Activity,
  People,
  Star1,
  Warning2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { rewardsService, RewardPoints, PointsType } from '@/services/rewards.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Header animation constants
const HEADER_MAX_HEIGHT = 240;
const HEADER_MIN_HEIGHT = 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const POINTS_TYPE_CONFIG: Record<PointsType, { icon: any; color: string; label: string }> = {
  earned: { icon: ArrowUp, color: colors.success, label: 'Earned' },
  redeemed: { icon: ArrowDown, color: colors.error, label: 'Redeemed' },
  expired: { icon: Clock, color: colors.gray400, label: 'Expired' },
  bonus: { icon: Star1, color: colors.warning, label: 'Bonus' },
  referral: { icon: People, color: colors.info, label: 'Referral' },
};

const SOURCE_ICONS: Record<string, any> = {
  flight: Airplane,
  hotel: Building,
  car: Car,
  experience: Activity,
  referral: People,
  bonus: Star1,
};

export default function RewardsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [pointsHistory, setPointsHistory] = useState<RewardPoints[]>([]);
  const [summary, setSummary] = useState({
    balance: 0,
    totalEarned: 0,
    totalRedeemed: 0,
    expiringThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animated values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT + insets.top, HEADER_MIN_HEIGHT + insets.top],
    extrapolate: 'clamp',
  });

  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const fetchRewards = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const [historyRes, summaryRes] = await Promise.all([
        rewardsService.getPointsHistory(user.id),
        rewardsService.getPointsSummary(user.id),
      ]);
      
      if (historyRes.data) setPointsHistory(historyRes.data);
      setSummary(summaryRes);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRewards();
  }, [fetchRewards]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Group points by date
  const groupedHistory = pointsHistory.reduce((groups, points) => {
    const date = new Date(points.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(points);
    return groups;
  }, {} as Record<string, RewardPoints[]>);

  const sortedDates = Object.keys(groupedHistory).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <LinearGradient
          colors={['#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95']}
          locations={[0, 0.35, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top }]}
        >
          {/* Fixed Navigation Row - always visible and touchable */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ArrowLeft size={24} color={colors.white} />
            </TouchableOpacity>
            <Animated.Text style={[styles.headerTitle, { opacity: compactHeaderOpacity }]}>
              Rewards Points
            </Animated.Text>
            <View style={styles.placeholder} />
          </View>

          {/* Expandable Content - fades out on scroll */}
          <Animated.View 
            style={[styles.balanceCard, { opacity: headerContentOpacity }]}
            pointerEvents="none"
          >
            <Gift size={32} color={colors.white} variant="Bold" />
            <Text style={styles.balanceLabel}>Available Points</Text>
            <Text style={styles.balanceAmount}>
              {summary.balance.toLocaleString()}
            </Text>
            <Text style={styles.balanceValue}>
              ≈ ${(summary.balance * 0.01).toFixed(2)} value
            </Text>
          </Animated.View>

          {/* Compact Header - shows only points, fades in on scroll */}
          <Animated.View style={[styles.compactHeader, { opacity: compactHeaderOpacity }]} pointerEvents="none">
            <Gift size={20} color={colors.white} variant="Bold" />
            <Text style={styles.compactBalance}>
              {summary.balance.toLocaleString()} pts
            </Text>
            <View style={styles.compactDivider} />
            <Text style={styles.compactValue}>
              ${(summary.balance * 0.01).toFixed(2)}
            </Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
      
      <Animated.ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingTop: HEADER_MAX_HEIGHT + insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            progressViewOffset={HEADER_MAX_HEIGHT + insets.top}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
                  <ArrowUp size={18} color={colors.success} />
                </View>
                <Text style={styles.statValue}>{summary.totalEarned.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${colors.error}15` }]}>
                  <ArrowDown size={18} color={colors.error} />
                </View>
                <Text style={styles.statValue}>{summary.totalRedeemed.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Redeemed</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
                  <Warning2 size={18} color={colors.warning} />
                </View>
                <Text style={styles.statValue}>{summary.expiringThisMonth.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Expiring Soon</Text>
              </View>
            </View>

            {/* Ways to Earn */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ways to Earn</Text>
              <View style={styles.earnCard}>
                <EarnOption 
                  icon={Airplane}
                  title="Book Flights"
                  description="Earn 1 point per $1 spent"
                  color={colors.info}
                />
                <EarnOption 
                  icon={Building}
                  title="Book Hotels"
                  description="Earn 2 points per $1 spent"
                  color={colors.primary}
                />
                <EarnOption 
                  icon={People}
                  title="Refer Friends"
                  description="Earn 500 points per referral"
                  color={colors.success}
                />
                <EarnOption 
                  icon={Star1}
                  title="Write Reviews"
                  description="Earn 50 points per review"
                  color={colors.warning}
                  isLast
                />
              </View>
            </View>

            {/* Points History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Points History</Text>
              
              {pointsHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Gift size={48} color={colors.gray300} variant="Bold" />
                  <Text style={styles.emptyTitle}>No points yet</Text>
                  <Text style={styles.emptyText}>
                    Start earning points by making bookings
                  </Text>
                </View>
              ) : (
                sortedDates.map(date => (
                  <View key={date} style={styles.dateGroup}>
                    <Text style={styles.dateHeader}>
                      {formatDateHeader(date)}
                    </Text>
                    {groupedHistory[date].map(points => (
                      <PointsHistoryCard
                        key={points.id}
                        points={points}
                        formatDate={formatDate}
                      />
                    ))}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
    });
  }
}

// Earn Option Component
interface EarnOptionProps {
  icon: any;
  title: string;
  description: string;
  color: string;
  isLast?: boolean;
}

function EarnOption({ icon: Icon, title, description, color, isLast }: EarnOptionProps) {
  return (
    <View style={[styles.earnOption, !isLast && styles.earnOptionBorder]}>
      <View style={[styles.earnIcon, { backgroundColor: `${color}15` }]}>
        <Icon size={20} color={color} variant="Bold" />
      </View>
      <View style={styles.earnContent}>
        <Text style={styles.earnTitle}>{title}</Text>
        <Text style={styles.earnDescription}>{description}</Text>
      </View>
    </View>
  );
}

// Points History Card Component
interface PointsHistoryCardProps {
  points: RewardPoints;
  formatDate: (date: string) => string;
}

function PointsHistoryCard({ points, formatDate }: PointsHistoryCardProps) {
  const config = POINTS_TYPE_CONFIG[points.type] || POINTS_TYPE_CONFIG.earned;
  const SourceIcon = SOURCE_ICONS[points.source] || Gift;
  const isPositive = ['earned', 'bonus', 'referral'].includes(points.type);
  
  return (
    <View style={styles.historyCard}>
      <View style={[styles.historyIcon, { backgroundColor: `${config.color}15` }]}>
        <SourceIcon size={20} color={config.color} variant="Bold" />
      </View>
      
      <View style={styles.historyContent}>
        <Text style={styles.historyTitle}>
          {points.description || `${config.label} from ${points.source}`}
        </Text>
        <Text style={styles.historyDate}>
          {formatDate(points.created_at)}
        </Text>
      </View>
      
      <Text style={[
        styles.historyAmount,
        isPositive ? styles.positiveAmount : styles.negativeAmount,
      ]}>
        {isPositive ? '+' : '-'}{Math.abs(points.amount).toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
  },
  headerGradient: {
    flex: 1,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: HEADER_MIN_HEIGHT,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  balanceCard: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  compactBalance: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  compactDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  compactValue: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: typography.fontWeight.medium,
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.sm,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginVertical: spacing.xs,
  },
  balanceValue: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  earnCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  earnOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  earnOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  earnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earnContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  earnTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  earnDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: spacing.md,
  },
  dateHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  historyTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  historyDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  positiveAmount: {
    color: colors.success,
  },
  negativeAmount: {
    color: colors.error,
  },
});
