/**
 * REFERRALS SCREEN
 * 
 * Refer friends, track referrals, and earn rewards.
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
  Share,
  Alert,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  People,
  Copy,
  Share as ShareIcon,
  Gift,
  TickCircle,
  Clock,
  CloseCircle,
  Sms,
  Add,
  User,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { rewardsService, Referral, ReferralStatus } from '@/services/rewards.service';

// Header animation constants
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const STATUS_CONFIG: Record<ReferralStatus, { color: string; bg: string; label: string; icon: any }> = {
  pending: { color: '#E65100', bg: '#FFF3E0', label: 'Pending', icon: Clock },
  signed_up: { color: '#1565C0', bg: '#E3F2FD', label: 'Signed Up', icon: User },
  completed: { color: '#2E7D32', bg: '#E8F5E9', label: 'Completed', icon: TickCircle },
  expired: { color: '#546E7A', bg: '#ECEFF1', label: 'Expired', icon: CloseCircle },
};

export default function ReferralsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalEarned: 0,
  });
  const [referralCode, setReferralCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [isSending, setIsSending] = useState(false);

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

  const fetchReferrals = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const [referralsRes, statsRes, membership] = await Promise.all([
        rewardsService.getReferrals(user.id),
        rewardsService.getReferralStats(user.id),
        rewardsService.getUserMembership(user.id),
      ]);
      
      if (referralsRes.data) setReferrals(referralsRes.data);
      setStats(statsRes);
      
      // Get or generate referral code
      if (membership.referralCode) {
        setReferralCode(membership.referralCode);
      } else {
        const code = await rewardsService.generateReferralCode(user.id);
        setReferralCode(code);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReferrals();
  }, [fetchReferrals]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Join me on Guidera and get $20 off your first booking! Use my referral code: ${referralCode}\n\nDownload now: https://guidera.app/invite/${referralCode}`,
        title: 'Join Guidera',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSendInvite = async () => {
    if (!user?.id || !inviteEmail.trim()) return;
    
    setIsSending(true);
    try {
      const { error } = await rewardsService.createReferral(
        user.id,
        referralCode,
        inviteEmail.trim(),
        inviteName.trim() || undefined
      );
      
      if (error) {
        Alert.alert('Error', 'Failed to send invite. Please try again.');
        return;
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Invite Sent!', `An invitation has been sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      fetchReferrals();
    } catch (error) {
      console.error('Error sending invite:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
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
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <LinearGradient
          colors={['#10B981', '#059669', '#047857', '#065F46']}
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
              Refer Friends
            </Animated.Text>
            <View style={styles.placeholder} />
          </View>

          {/* Expandable Content - fades out on scroll */}
          <Animated.View 
            style={[styles.referralCard, { opacity: headerContentOpacity }]}
            pointerEvents="none"
          >
            <People size={28} color={colors.white} variant="Bold" />
            <Text style={styles.referralTitle}>Earn $20 for each friend</Text>
            <Text style={styles.referralSubtitle}>
              Share your code and earn rewards when friends book
            </Text>
            
            {/* Referral Code */}
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{referralCode || 'Loading...'}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                <Copy size={20} color={colors.success} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Compact Header - shows only code, fades in on scroll */}
          <Animated.View style={[styles.compactHeader, { opacity: compactHeaderOpacity }]} pointerEvents="none">
            <View style={styles.compactCodeContainer}>
              <Text style={styles.compactCode}>{referralCode}</Text>
              <Copy size={16} color={colors.white} />
            </View>
            <TouchableOpacity onPress={handleShare} style={styles.compactShareButton}>
              <ShareIcon size={16} color={colors.success} />
              <Text style={styles.compactShareText}>Share</Text>
            </TouchableOpacity>
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
            tintColor={colors.success}
            progressViewOffset={HEADER_MAX_HEIGHT + insets.top}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.success} />
          </View>
        ) : (
          <>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalReferrals}</Text>
                <Text style={styles.statLabel}>Total Invites</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.completedReferrals}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {stats.totalEarned.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Points Earned</Text>
              </View>
            </View>

            {/* How It Works */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How It Works</Text>
              <View style={styles.stepsCard}>
                <StepItem 
                  number={1}
                  title="Share your code"
                  description="Send your unique referral code to friends"
                />
                <StepItem 
                  number={2}
                  title="Friend signs up"
                  description="They create an account using your code"
                />
                <StepItem 
                  number={3}
                  title="Friend books"
                  description="They complete their first booking"
                />
                <StepItem 
                  number={4}
                  title="You both earn"
                  description="Get 500 points ($20 value) each!"
                  isLast
                />
              </View>
            </View>

            {/* Invite by Email */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.inviteButton}
                onPress={() => setShowInviteModal(true)}
              >
                <Sms size={20} color={colors.white} />
                <Text style={styles.inviteButtonText}>Invite by Email</Text>
              </TouchableOpacity>
            </View>

            {/* Referrals List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Referrals</Text>
              
              {referrals.length === 0 ? (
                <View style={styles.emptyState}>
                  <People size={48} color={colors.gray300} variant="Bold" />
                  <Text style={styles.emptyTitle}>No referrals yet</Text>
                  <Text style={styles.emptyText}>
                    Share your code to start earning rewards
                  </Text>
                </View>
              ) : (
                referrals.map(referral => (
                  <ReferralCard
                    key={referral.id}
                    referral={referral}
                    formatDate={formatDate}
                  />
                ))
              )}
            </View>
          </>
        )}
      </Animated.ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite a Friend</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <CloseCircle size={24} color={colors.gray400} variant="Bold" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Friend's Name (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={inviteName}
                  onChangeText={setInviteName}
                  placeholder="John Doe"
                  placeholderTextColor={colors.gray400}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="friend@example.com"
                  placeholderTextColor={colors.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowInviteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  (!inviteEmail.trim() || isSending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendInvite}
                disabled={!inviteEmail.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.sendButtonText}>Send Invite</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Step Item Component
interface StepItemProps {
  number: number;
  title: string;
  description: string;
  isLast?: boolean;
}

function StepItem({ number, title, description, isLast }: StepItemProps) {
  return (
    <View style={[styles.stepItem, !isLast && styles.stepItemBorder]}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

// Referral Card Component
interface ReferralCardProps {
  referral: Referral;
  formatDate: (date: string) => string;
}

function ReferralCard({ referral, formatDate }: ReferralCardProps) {
  const config = STATUS_CONFIG[referral.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  
  return (
    <View style={styles.referralItemCard}>
      <View style={styles.referralItemLeft}>
        <View style={styles.referralAvatar}>
          <User size={20} color={colors.gray400} />
        </View>
        <View style={styles.referralItemInfo}>
          <Text style={styles.referralItemName}>
            {referral.referred_name || referral.referred_email || 'Invited Friend'}
          </Text>
          <Text style={styles.referralItemDate}>
            Invited {formatDate(referral.created_at)}
          </Text>
        </View>
      </View>
      
      <View style={styles.referralItemRight}>
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <StatusIcon size={12} color={config.color} variant="Bold" />
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
        {referral.status === 'completed' && (
          <Text style={styles.rewardText}>+{referral.reward_amount} pts</Text>
        )}
      </View>
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
  referralCard: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  referralTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  compactCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  compactCode: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    letterSpacing: 1,
  },
  compactShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  compactShareText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },
  referralSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  codeText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  shareButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
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
  statValue: {
    fontSize: typography.fontSize.xl,
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
  stepsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  stepItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  stepContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  stepTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  stepDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  inviteButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
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
  referralItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  referralItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  referralAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralItemInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  referralItemName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  referralItemDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  referralItemRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  rewardText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalBody: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray100,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  sendButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.success,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  sendButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
