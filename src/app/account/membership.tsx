/**
 * MEMBERSHIP SCREEN
 * 
 * Beautiful display of user's membership tier with upgrade options.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Crown,
  Star1,
  Diamonds,
  Global,
  TickCircle,
  ArrowRight2,
  Gift,
  Medal,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { rewardsService, MembershipTier, MembershipTierInfo, MEMBERSHIP_TIERS } from '@/services/rewards.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Header animation constants
const HEADER_MAX_HEIGHT = 260;
const HEADER_MIN_HEIGHT = 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const TIER_ICONS: Record<MembershipTier, any> = {
  free: Global,
  silver: Star1,
  gold: Crown,
  platinum: Diamonds,
};

export default function MembershipScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentTier, setCurrentTier] = useState<MembershipTier>('free');
  const [expiresAt, setExpiresAt] = useState<string | undefined>();
  const [pointsBalance, setPointsBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const fetchMembership = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const membership = await rewardsService.getUserMembership(user.id);
      setCurrentTier(membership.tier);
      setExpiresAt(membership.expiresAt);
      setPointsBalance(membership.pointsBalance);
    } catch (error) {
      console.error('Error fetching membership:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleUpgrade = (tier: MembershipTierInfo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In production, this would open Stripe checkout
    console.log('Upgrade to:', tier.name);
  };

  const currentTierInfo = rewardsService.getTierInfo(currentTier);
  const TierIcon = TIER_ICONS[currentTier];

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

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.background }]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style="light" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <LinearGradient
          colors={currentTierInfo.gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top }]}
        >
          {/* Fixed Navigation Row - always visible and touchable */}
          <View style={[styles.header, { backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ArrowLeft size={24} color={colors.white} />
            </TouchableOpacity>
            <Animated.Text style={[styles.headerTitle, { opacity: compactHeaderOpacity }]}>
              Membership
            </Animated.Text>
            <View style={styles.placeholder} />
          </View>

          {/* Expandable Content - fades out on scroll */}
          <Animated.View 
            style={[styles.tierCard, { opacity: headerContentOpacity }]}
            pointerEvents="none"
          >
            <View style={styles.tierIconContainer}>
              <TierIcon size={40} color={colors.white} variant="Bold" />
            </View>
            <Text style={styles.tierName}>{currentTierInfo.name}</Text>
            <Text style={styles.tierLabel}>
              {currentTier === 'free' ? 'Free Member' : 'Premium Member'}
            </Text>

            <View style={styles.pointsDisplay}>
              <Gift size={16} color={colors.white} />
              <Text style={styles.pointsText}>
                {pointsBalance.toLocaleString()} points
              </Text>
            </View>
          </Animated.View>

          {/* Compact Header - shows only tier and points, fades in on scroll */}
          <Animated.View style={[styles.compactHeader, { opacity: compactHeaderOpacity }]} pointerEvents="none">
            <TierIcon size={20} color={colors.white} variant="Bold" />
            <Text style={styles.compactTierName}>{currentTierInfo.name}</Text>
            <View style={styles.compactDivider} />
            <Gift size={16} color={colors.white} />
            <Text style={styles.compactPoints}>{pointsBalance.toLocaleString()} pts</Text>
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
      >
        {/* Current Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Benefits</Text>
          <View style={styles.benefitsCard}>
            {currentTierInfo.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <TickCircle size={18} color={colors.success} variant="Bold" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upgrade Options */}
        {currentTier !== 'platinum' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upgrade Your Experience</Text>
            
            {/* Plan Toggle */}
            <View style={styles.planToggle}>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === 'monthly' && styles.planOptionActive,
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <Text style={[
                  styles.planOptionText,
                  selectedPlan === 'monthly' && styles.planOptionTextActive,
                ]}>
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === 'yearly' && styles.planOptionActive,
                ]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <Text style={[
                  styles.planOptionText,
                  selectedPlan === 'yearly' && styles.planOptionTextActive,
                ]}>
                  Yearly
                </Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>Save 17%</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Tier Cards */}
            {MEMBERSHIP_TIERS.filter(t => 
              MEMBERSHIP_TIERS.indexOf(t) > MEMBERSHIP_TIERS.findIndex(ct => ct.id === currentTier)
            ).map(tier => (
              <TierUpgradeCard
                key={tier.id}
                tier={tier}
                selectedPlan={selectedPlan}
                onUpgrade={() => handleUpgrade(tier)}
              />
            ))}
          </View>
        )}

        {/* Points Multiplier Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points Multiplier</Text>
          <View style={styles.multiplierCard}>
            <View style={styles.multiplierRow}>
              {MEMBERSHIP_TIERS.map(tier => {
                const Icon = TIER_ICONS[tier.id];
                const isCurrentTier = tier.id === currentTier;
                return (
                  <View 
                    key={tier.id} 
                    style={[
                      styles.multiplierItem,
                      isCurrentTier && styles.multiplierItemActive,
                    ]}
                  >
                    <View style={[
                      styles.multiplierIcon,
                      { backgroundColor: `${tier.color}20` },
                    ]}>
                      <Icon size={20} color={tier.color} variant="Bold" />
                    </View>
                    <Text style={styles.multiplierValue}>{tier.pointsMultiplier}x</Text>
                    <Text style={styles.multiplierLabel}>{tier.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// Tier Upgrade Card Component
interface TierUpgradeCardProps {
  tier: MembershipTierInfo;
  selectedPlan: 'monthly' | 'yearly';
  onUpgrade: () => void;
}

function TierUpgradeCard({ tier, selectedPlan, onUpgrade }: TierUpgradeCardProps) {
  const TierIcon = TIER_ICONS[tier.id as MembershipTier];
  const price = selectedPlan === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
  const period = selectedPlan === 'monthly' ? '/month' : '/year';
  
  return (
    <View style={styles.upgradeCard}>
      <LinearGradient
        colors={tier.gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.upgradeCardHeader}
      >
        <View style={styles.upgradeCardHeaderContent}>
          <TierIcon size={24} color={colors.white} variant="Bold" />
          <Text style={styles.upgradeCardTitle}>{tier.name}</Text>
        </View>
        <View style={styles.upgradeCardPrice}>
          <Text style={styles.priceAmount}>${price}</Text>
          <Text style={styles.pricePeriod}>{period}</Text>
        </View>
      </LinearGradient>
      
      <View style={styles.upgradeCardBody}>
        <Text style={styles.upgradeCardSubtitle}>
          {tier.pointsMultiplier}x points on all bookings
        </Text>
        
        <View style={styles.upgradeCardBenefits}>
          {tier.benefits.slice(0, 4).map((benefit, index) => (
            <View key={index} style={styles.upgradeBenefitRow}>
              <TickCircle size={14} color={tier.color} variant="Bold" />
              <Text style={styles.upgradeBenefitText} numberOfLines={1}>
                {benefit}
              </Text>
            </View>
          ))}
          {tier.benefits.length > 4 && (
            <Text style={styles.moreBenefits}>
              +{tier.benefits.length - 4} more benefits
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.upgradeButton, { backgroundColor: tier.color }]}
          onPress={onUpgrade}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to {tier.name}</Text>
          <ArrowRight2 size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgElevated,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  tierCard: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tierIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tierName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: 2,
  },
  tierLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  compactTierName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  compactDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  compactPoints: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.9)',
  },
  expiryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  expiryText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  pointsText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    minHeight: '100%',
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
  benefitsCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  planToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.lg,
  },
  planOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  planOptionActive: {
    backgroundColor: colors.bgElevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  planOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  planOptionTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  saveBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  upgradeCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  upgradeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  upgradeCardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  upgradeCardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  upgradeCardPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  pricePeriod: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  upgradeCardBody: {
    padding: spacing.lg,
  },
  upgradeCardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  upgradeCardBenefits: {
    marginBottom: spacing.lg,
  },
  upgradeBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  upgradeBenefitText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  moreBenefits: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  upgradeButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  multiplierCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  multiplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  multiplierItem: {
    alignItems: 'center',
    flex: 1,
    opacity: 0.5,
  },
  multiplierItemActive: {
    opacity: 1,
  },
  multiplierIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  multiplierValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  multiplierLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});
