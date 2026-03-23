/**
 * IDENTITY VERIFICATION SCREEN
 * 
 * Trusted Traveler verification — simple identity verification
 * to build trust within the Guidera community.
 * If already verified as a Partner (Local Guide), auto-verified here.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft2, 
  Verify,
  Camera,
  Card,
  User,
  TickCircle,
  CloseCircle,
  Clock,
  ShieldTick,
  People,
  Star1,
  MessageQuestion,
  Global,
  Ranking,
  SecuritySafe,
  Heart,
  TicketDiscount,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase/client';
import { partnerService } from '@/services/community/partner.service';

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
type VerificationStep = 'intro' | 'document-select' | 'verifying' | 'submitted';

interface VerificationData {
  status: VerificationStatus;
  submitted_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  document_type?: string;
  source?: 'traveler' | 'partner';
}

const DOCUMENT_TYPES = [
  { id: 'passport', label: 'Passport', icon: Card, description: 'International travel document' },
  { id: 'drivers_license', label: "Driver's License", icon: Card, description: 'Government-issued ID' },
  { id: 'national_id', label: 'National ID Card', icon: Card, description: 'Country-issued identification' },
];

const VERIFICATION_BENEFITS = [
  { icon: ShieldTick, title: 'Verified Badge', description: 'A trusted badge on your profile visible to all users' },
  { icon: People, title: 'Travel Buddy Matching', description: 'Connect with other verified travelers for group trips' },
  { icon: Global, title: 'Priority Booking Access', description: 'Early access to exclusive deals and flash sales' },
  { icon: Star1, title: 'Enhanced Profile', description: 'Stand out in the community with verified status' },
  { icon: Heart, title: 'Trusted Reviews', description: 'Your reviews get a verified mark — more visibility' },
  { icon: Ranking, title: 'Leaderboard Eligibility', description: 'Compete in community challenges and earn rewards' },
  { icon: TicketDiscount, title: 'Exclusive Discounts', description: 'Up to 15% off partner tours and local experiences' },
  { icon: SecuritySafe, title: 'Safety Network', description: 'Access to the verified traveler safety network' },
];

export default function VerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { user, profile } = useAuth();
  const { showError } = useToast();
  const [verificationData, setVerificationData] = useState<VerificationData>({ status: 'unverified' });
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<VerificationStep>('intro');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  // Didit WebView state
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Load verification status — also check partner verification
  const loadVerificationStatus = useCallback(async () => {
    if (!profile?.id) return;
    const userId = profile.id;
    
    try {
      // 1. Check if already verified via profile flag
      if (profile?.is_verified) {
        setVerificationData({ status: 'verified', reviewed_at: profile.verified_at });
        setIsLoading(false);
        return;
      }

      // 2. Check partner verification (if verified as partner, auto-verified as traveler)
      const partnerData = await partnerService.getApplicationStatus(userId!);
      if (partnerData) {
        if (partnerData.didit_verification_status === 'approved' || partnerData.status === 'approved') {
          setVerificationData({ status: 'verified', source: 'partner', reviewed_at: partnerData.updated_at });
          setIsLoading(false);
          return;
        }
        // Only show pending if Didit verification is actually in progress (user completed WebView)
        // If didit status is still not_started, user may have crashed before completing — let them restart
        if (partnerData.didit_verification_status === 'in_progress') {
          setVerificationData({ status: 'pending', source: 'partner', submitted_at: partnerData.submitted_at });
          setIsLoading(false);
          return;
        }
        if (['submitted', 'under_review'].includes(partnerData.status) && 
            partnerData.didit_verification_status !== 'not_started') {
          setVerificationData({ status: 'pending', source: 'partner', submitted_at: partnerData.submitted_at });
          setIsLoading(false);
          return;
        }
        if (partnerData.didit_verification_status === 'declined' || partnerData.status === 'rejected') {
          setVerificationData({ status: 'rejected', source: 'partner' });
          setIsLoading(false);
          return;
        }
      }

      // 3. Check identity_verifications table for traveler-specific verification
      const { data } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setVerificationData({
          status: data.status as VerificationStatus,
          submitted_at: data.submitted_at,
          reviewed_at: data.reviewed_at,
          rejection_reason: data.rejection_reason,
          document_type: data.document_type,
          source: 'traveler',
        });
      }
    } catch (error) {
      if (__DEV__) console.log('No verification record found');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadVerificationStatus();
  }, [loadVerificationStatus]);

  // Auto-poll when pending — checks every 30s so status updates automatically
  useEffect(() => {
    if (verificationData.status !== 'pending') return;
    const interval = setInterval(() => {
      loadVerificationStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [verificationData.status, loadVerificationStatus]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'document-select') {
      setStep('intro');
    } else if (step === 'verifying') {
      // Don't go back from verifying — let them wait or go to intro
      setStep('intro');
    } else {
      router.back();
    }
  };

  const handleStartVerification = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('document-select');
  };

  const handleSelectDocument = async (docType: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedDocument(docType);
    await handleStartDiditVerification(docType);
  };

  /**
   * Create a partner application (source: traveler) + Didit session, then open WebView
   */
  const handleStartDiditVerification = async (docType: string) => {
    if (!profile?.id) return;
    setIsCreatingSession(true);

    try {
      // Create or reuse a partner application for tracking the Didit session
      const app = await partnerService.getOrCreateApplication(profile.id);
      setApplicationId(app.id);

      // Save document type + mark as identity_verification
      await partnerService.updateApplication(app.id, {
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
      });

      // Create Didit verification session
      const session = await partnerService.createVerificationSession(app.id, {
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
      });

      setVerificationUrl(session.verification_url);
      setWebViewVisible(true);
    } catch (err: any) {
      if (__DEV__) console.warn('Didit session error:', err);
      showError(err.message || 'Failed to start verification. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  /**
   * When the Didit WebView is closed, start polling for verification result
   */
  const handleWebViewClose = useCallback(() => {
    setWebViewVisible(false);
    setVerificationUrl(null);

    if (!applicationId) return;

    // Show verifying step while we poll
    setStep('verifying');

    // Poll every 5 seconds for up to 2 minutes
    let attempts = 0;
    const maxAttempts = 24;

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const statusRes = await partnerService.checkVerificationStatus(applicationId);

        if (statusRes.verification_status === 'approved') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          // Update profile as verified
          if (profile?.id) {
            await supabase
              .from('profiles')
              .update({ is_verified: true, verified_at: new Date().toISOString() })
              .eq('id', profile.id);
          }
          setVerificationData({ status: 'verified', reviewed_at: new Date().toISOString(), source: 'traveler' });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setStep('submitted');
          return;
        }

        if (statusRes.verification_status === 'declined') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setVerificationData({ status: 'rejected', source: 'traveler' });
          setStep('intro');
          return;
        }

        // in_progress — keep polling
        if (statusRes.verification_status === 'in_progress' || statusRes.didit_live_status === 'In Review') {
          setVerificationData({ status: 'pending', submitted_at: new Date().toISOString(), source: 'traveler' });
        }
      } catch (err) {
        if (__DEV__) console.warn('Poll error:', err);
      }

      if (attempts >= maxAttempts) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        // Mark as pending and stop polling — auto-poll in useEffect will continue
        setVerificationData({ status: 'pending', submitted_at: new Date().toISOString(), source: 'traveler' });
        setStep('submitted');
      }
    }, 5000);
  }, [applicationId, profile?.id]);

  // Status helpers using dynamic theme colors
  const STATUS_COLORS: Record<VerificationStatus, string> = {
    verified: tc.success,
    pending: tc.warning,
    rejected: tc.error,
    unverified: tc.textTertiary,
  };

  const getStatusColor = (status: VerificationStatus) => STATUS_COLORS[status];

  const getStatusIcon = (status: VerificationStatus) => {
    const color = getStatusColor(status);
    switch (status) {
      case 'verified': return <TickCircle size={20} color={color} variant="Bold" />;
      case 'pending': return <Clock size={20} color={color} variant="Bold" />;
      case 'rejected': return <CloseCircle size={20} color={color} variant="Bold" />;
      default: return <Verify size={20} color={color} variant="Bold" />;
    }
  };

  const getStatusLabel = (status: VerificationStatus) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'In Review';
      case 'rejected': return 'Declined';
      default: return 'Not Verified';
    }
  };

  // Shared card style
  const cardBg = tc.bgCard;
  const cardBorder = tc.borderSubtle;
  const subtleBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: tc.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }

  const renderIntro = () => (
    <>
      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: cardBg, borderColor: getStatusColor(verificationData.status) + '30' }]}>
        <View style={[styles.statusIconBox, { backgroundColor: getStatusColor(verificationData.status) + '15' }]}>
          {getStatusIcon(verificationData.status)}
        </View>
        <View style={styles.statusContent}>
          <Text style={[styles.statusLabel, { color: tc.textSecondary }]}>Verification Status</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(verificationData.status) }]}>
            {getStatusLabel(verificationData.status)}
          </Text>
        </View>
      </View>

      {/* Verified State — Single Unified Card */}
      {verificationData.status === 'verified' && (
        <View style={[styles.unifiedVerifiedCard, { backgroundColor: isDark ? 'rgba(22,163,74,0.06)' : 'rgba(22,163,74,0.04)', borderColor: 'rgba(22,163,74,0.18)' }]}>
          {/* Hero section */}
          <View style={styles.unifiedHeroSection}>
            <View style={[styles.unifiedBadgeCircle, { backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : 'rgba(22,163,74,0.12)' }]}>
              <TickCircle size={28} color={tc.success} variant="Bold" />
            </View>
            <Text style={[styles.unifiedHeroTitle, { color: tc.success }]}>Trusted Traveler</Text>
            <Text style={[styles.unifiedHeroSubtitle, { color: tc.textSecondary }]}>
              {verificationData.source === 'partner' 
                ? 'Verified through the Local Guide Partner Program' 
                : 'Your identity is verified — you are a trusted member'}
            </Text>
            {verificationData.reviewed_at && (
              <View style={[styles.unifiedDatePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Text style={[styles.unifiedDateText, { color: tc.textTertiary }]}>
                  Verified on {new Date(verificationData.reviewed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.unifiedDivider, { backgroundColor: isDark ? 'rgba(22,163,74,0.12)' : 'rgba(22,163,74,0.10)' }]} />

          {/* Perks section */}
          <Text style={[styles.unifiedPerksTitle, { color: tc.textPrimary }]}>Your Verified Perks</Text>
          {VERIFICATION_BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <View key={index} style={[styles.unifiedPerkRow, index < VERIFICATION_BENEFITS.length - 1 && { marginBottom: 10 }]}>
                <View style={[styles.unifiedPerkIcon, { backgroundColor: tc.primary + '10' }]}>
                  <Icon size={16} color={tc.primary} variant="Bold" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.unifiedPerkTitle, { color: tc.textPrimary }]}>{benefit.title}</Text>
                  <Text style={[styles.unifiedPerkDesc, { color: tc.textSecondary }]}>{benefit.description}</Text>
                </View>
                <TickCircle size={14} color={tc.success} variant="Bold" />
              </View>
            );
          })}
        </View>
      )}

      {/* Pending State */}
      {verificationData.status === 'pending' && (
        <>
          <View style={[styles.pendingHeroCard, { backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.20)' }]}>
            <View style={[styles.verifiedBadgeCircle, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)' }]}>
              <Clock size={40} color={tc.warning} variant="Bold" />
            </View>
            <Text style={[styles.verifiedHeroTitle, { color: '#F59E0B' }]}>Verification In Review</Text>
            <Text style={[styles.verifiedHeroSubtitle, { color: tc.textSecondary }]}>
              {verificationData.source === 'partner'
                ? 'Your partner identity verification is being reviewed. This also verifies your traveler profile.'
                : 'Our team is reviewing your documents. This usually takes up to 1 hour.'}
            </Text>
            {verificationData.submitted_at && (
              <View style={[styles.verifiedDatePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Text style={[styles.verifiedDateText, { color: tc.textTertiary }]}>
                  Submitted on {new Date(verificationData.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            )}
          </View>

          {/* Preview of what they'll unlock */}
          <Text style={[styles.perksSectionTitle, { color: tc.textTertiary }]}>What you'll unlock</Text>
          {VERIFICATION_BENEFITS.slice(0, 4).map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <View key={index} style={[styles.perkRow, { backgroundColor: cardBg, borderColor: cardBorder, opacity: 0.6 }]}>
                <View style={[styles.perkIconBox, { backgroundColor: tc.textTertiary + '10' }]}>
                  <Icon size={20} color={tc.textTertiary} variant="Bold" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.perkTitle, { color: tc.textSecondary }]}>{benefit.title}</Text>
                  <Text style={[styles.perkDesc, { color: tc.textTertiary }]}>{benefit.description}</Text>
                </View>
                <Clock size={14} color={tc.textTertiary} variant="Bold" />
              </View>
            );
          })}
        </>
      )}

      {/* Rejected State */}
      {verificationData.status === 'rejected' && (
        <View style={styles.centeredSection}>
          <View style={{ marginBottom: spacing.md }}>
            <CloseCircle size={48} color={tc.error} variant="Bold" />
          </View>
          <Text style={[styles.sectionTitle, { color: tc.error }]}>Verification Failed</Text>
          <Text style={[styles.sectionText, { color: tc.textSecondary }]}>
            {verificationData.rejection_reason || 'Your verification could not be completed. Please try again with clearer documents.'}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: tc.primary }]}
            onPress={handleStartVerification}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { color: tc.white }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Unverified State */}
      {verificationData.status === 'unverified' && (
        <>
          <View style={styles.centeredSection}>
            <View style={[styles.introIconCircle, { backgroundColor: tc.primary + '15' }]}>
              <Verify size={48} color={tc.primary} variant="Bold" />
            </View>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Become a Trusted Traveler</Text>
            <Text style={[styles.sectionText, { color: tc.textSecondary }]}>
              Verify your identity to build trust and unlock exclusive community features.
            </Text>
          </View>

          {/* Benefits */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={[styles.benefitsSectionTitle, { color: tc.textPrimary }]}>Benefits of Verification</Text>
            {VERIFICATION_BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <View key={index} style={[styles.benefitRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={[styles.benefitIconBox, { backgroundColor: tc.primary + '12' }]}>
                    <Icon size={20} color={tc.primary} variant="Bold" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.benefitItemTitle, { color: tc.textPrimary }]}>{benefit.title}</Text>
                    <Text style={[styles.benefitItemDesc, { color: tc.textSecondary }]}>{benefit.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: tc.primary }]}
            onPress={handleStartVerification}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { color: tc.white }]}>Start Verification</Text>
          </TouchableOpacity>

          <Text style={[styles.timeEstimate, { color: tc.textTertiary }]}>
            Takes about 2 minutes
          </Text>
        </>
      )}
    </>
  );

  const renderDocumentSelect = () => (
    <>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: tc.textPrimary }]}>Select Document Type</Text>
        <Text style={[styles.stepDesc, { color: tc.textSecondary }]}>
          Choose a valid government-issued ID to verify your identity
        </Text>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        {DOCUMENT_TYPES.map((doc) => {
          const Icon = doc.icon;
          return (
            <TouchableOpacity
              key={doc.id}
              style={[styles.documentCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => handleSelectDocument(doc.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.docIconBox, { backgroundColor: tc.primary + '12' }]}>
                <Icon size={24} color={tc.primary} variant="Bold" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.docTitle, { color: tc.textPrimary }]}>{doc.label}</Text>
                <Text style={[styles.docDesc, { color: tc.textSecondary }]}>{doc.description}</Text>
              </View>
              <ArrowLeft2 size={18} color={tc.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.tipsCard, { backgroundColor: subtleBg }]}>
        <Text style={[styles.tipsTitle, { color: tc.textPrimary }]}>Document Requirements</Text>
        <Text style={[styles.tipItem, { color: tc.textSecondary }]}>- Must be a valid, unexpired document</Text>
        <Text style={[styles.tipItem, { color: tc.textSecondary }]}>- All corners must be visible</Text>
        <Text style={[styles.tipItem, { color: tc.textSecondary }]}>- Text must be clearly readable</Text>
        <Text style={[styles.tipItem, { color: tc.textSecondary }]}>- No glare or blur</Text>
      </View>
    </>
  );

  const renderVerifying = () => (
    <View style={styles.centeredSection}>
      <ActivityIndicator size="large" color={tc.primary} style={{ marginBottom: spacing.lg }} />
      <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Verifying Your Identity</Text>
      <Text style={[styles.sectionText, { color: tc.textSecondary, marginBottom: spacing.lg }]}>
        We're processing your verification. This may take a moment...
      </Text>
      <View style={[styles.tipsCard, { backgroundColor: subtleBg }]}>
        <Text style={[styles.tipItem, { color: tc.textSecondary }]}>
          Please don't close the app. We'll update your status automatically.
        </Text>
      </View>
    </View>
  );

  const renderSubmitted = () => (
    <View style={styles.centeredSection}>
      <View style={{ marginBottom: spacing.lg }}>
        <TickCircle size={64} color={tc.success} variant="Bold" />
      </View>
      <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Submitted Successfully!</Text>
      <Text style={[styles.sectionText, { color: tc.textSecondary, marginBottom: spacing.xl }]}>
        Your verification request has been submitted. We'll review your documents and 
        notify you within 1-2 business days.
      </Text>
      
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: tc.primary, width: '100%' }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={[styles.primaryButtonText, { color: tc.white }]}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: isDark ? tc.bgModal : tc.white, borderBottomColor: cardBorder }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Trusted Traveler</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {step === 'intro' && renderIntro()}
        {step === 'document-select' && renderDocumentSelect()}
        {step === 'verifying' && renderVerifying()}
        {step === 'submitted' && renderSubmitted()}
      </ScrollView>

      {/* Loading overlay while creating Didit session */}
      {isCreatingSession && (
        <View style={styles.sessionLoadingOverlay}>
          <View style={[styles.sessionLoadingCard, { backgroundColor: tc.bgCard }]}>
            <ActivityIndicator size="large" color={tc.primary} />
            <Text style={[styles.sessionLoadingText, { color: tc.textPrimary }]}>
              Setting up verification...
            </Text>
          </View>
        </View>
      )}

      {/* Didit Verification WebView Modal */}
      <Modal
        visible={webViewVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleWebViewClose}
      >
        <View style={[styles.webViewContainer, { paddingTop: insets.top, backgroundColor: tc.background }]}>
          <View style={[styles.webViewHeader, { borderBottomColor: tc.borderSubtle }]}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: tc.bgElevated }]}
              onPress={handleWebViewClose}
            >
              <ArrowLeft2 size={20} color={tc.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.webViewTitle, { color: tc.textPrimary }]}>Identity Verification</Text>
            <View style={{ width: 40 }} />
          </View>
          {verificationUrl ? (
            <WebView
              source={{ uri: verificationUrl }}
              style={{ flex: 1 }}
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={tc.primary} />
                  <Text style={[styles.webViewLoadingText, { color: tc.textSecondary }]}>
                    Loading verification...
                  </Text>
                </View>
              )}
              onNavigationStateChange={(navState) => {
                if (navState.url?.includes('/session/complete') || navState.url?.includes('/callback')) {
                  handleWebViewClose();
                }
              }}
            />
          ) : (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={tc.primary} />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
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
  },
  headerSpacer: {
    width: 40,
  },
  // Status card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  statusIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: typography.fontSize.sm,
  },
  statusValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
  },
  // Centered section (verified/pending/rejected/unverified hero)
  centeredSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sectionText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.md,
  },
  introIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  // Benefits
  benefitsSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  benefitIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  benefitItemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  benefitItemDesc: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  // Primary button (reused for all CTAs)
  primaryButton: {
    borderRadius: borderRadius.lg,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  timeEstimate: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  // Step screens
  stepHeader: {
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  stepDesc: {
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  docIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  docTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  docDesc: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  // Tips / requirements card
  tipsCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  tipsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  tipItem: {
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
  },
  // Capture frames
  captureFrame: {
    height: 240,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfieFrame: {
    height: 280,
    width: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  captureHintText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  // Review
  reviewCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  reviewLabel: {
    fontSize: typography.fontSize.sm,
  },
  reviewValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  reviewCheck: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCheckText: {
    fontSize: typography.fontSize.sm,
    marginLeft: 4,
  },
  reviewDivider: {
    height: 1,
  },
  // Verified hero card
  verifiedHeroCard: {
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  pendingHeroCard: {
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  verifiedBadgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  verifiedHeroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  verifiedHeroSubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  verifiedDatePill: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  verifiedDateText: {
    fontSize: typography.fontSize.xs,
  },
  // Perks list
  perksSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  perkIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  perkTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  perkDesc: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  // Unified verified card
  unifiedVerifiedCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  unifiedHeroSection: {
    alignItems: 'center',
  },
  unifiedBadgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  unifiedHeroTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
    textAlign: 'center',
  },
  unifiedHeroSubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  unifiedDatePill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  unifiedDateText: {
    fontSize: typography.fontSize.xs,
  },
  unifiedDivider: {
    height: 1,
    marginVertical: spacing.md,
  },
  unifiedPerksTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  unifiedPerkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unifiedPerkIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  unifiedPerkTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  unifiedPerkDesc: {
    fontSize: typography.fontSize.caption,
    marginTop: 1,
    lineHeight: 14,
  },
  // WebView Modal
  webViewContainer: {
    flex: 1,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  webViewTitle: {
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  webViewLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewLoadingText: {
    fontSize: typography.fontSize.base,
    marginTop: 12,
  },
  // Session loading overlay
  sessionLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionLoadingCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: 200,
  },
  sessionLoadingText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
