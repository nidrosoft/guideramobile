/**
 * IDENTITY VERIFICATION SCREEN
 * 
 * Trusted Traveler verification — simple identity verification
 * to build trust within the Guidera community.
 * If already verified as a Partner (Local Guide), auto-verified here.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
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
import { supabase } from '@/lib/supabase/client';
import { partnerService } from '@/services/community/partner.service';

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
type VerificationStep = 'intro' | 'document-select' | 'document-capture' | 'selfie' | 'review' | 'submitted';

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
  const [verificationData, setVerificationData] = useState<VerificationData>({ status: 'unverified' });
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<VerificationStep>('intro');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

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
        if (partnerData.didit_verification_status === 'in_progress' || 
            ['submitted', 'under_review', 'identity_verification'].includes(partnerData.status)) {
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
    if (step !== 'intro' && step !== 'submitted') {
      if (step === 'document-select') setStep('intro');
      else if (step === 'document-capture') setStep('document-select');
      else if (step === 'selfie') setStep('document-capture');
      else if (step === 'review') setStep('selfie');
    } else {
      router.back();
    }
  };

  const handleStartVerification = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('document-select');
  };

  const handleSelectDocument = (docType: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedDocument(docType);
    setStep('document-capture');
  };

  const handleDocumentCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Integrate with Didit for real document capture
    Alert.alert(
      'Document Capture',
      'In production, this would open the camera to capture your ID document.',
      [{ text: 'Continue', onPress: () => setStep('selfie') }]
    );
  };

  const handleSelfieCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Integrate with Didit for real selfie capture
    Alert.alert(
      'Selfie Capture',
      'In production, this would open the camera for a selfie to match with your ID.',
      [{ text: 'Continue', onPress: () => setStep('review') }]
    );
  };

  const handleSubmitVerification = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsLoading(true);
    
    try {
      if (!profile?.id) return;
      const { error } = await supabase
        .from('identity_verifications')
        .upsert({
          user_id: profile.id,
          status: 'pending',
          document_type: selectedDocument,
          submitted_at: new Date().toISOString(),
        });

      if (error) throw error;

      setVerificationData({
        status: 'pending',
        submitted_at: new Date().toISOString(),
        document_type: selectedDocument || undefined,
        source: 'traveler',
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('submitted');
    } catch (error) {
      console.error('Error submitting verification:', error);
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Status helpers using dynamic theme colors
  const STATUS_COLORS: Record<VerificationStatus, string> = {
    verified: '#16A34A',
    pending: '#F59E0B',
    rejected: '#EF4444',
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
              <TickCircle size={28} color="#16A34A" variant="Bold" />
            </View>
            <Text style={[styles.unifiedHeroTitle, { color: '#16A34A' }]}>Trusted Traveler</Text>
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
                <TickCircle size={14} color="#16A34A" variant="Bold" />
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
              <Clock size={40} color="#F59E0B" variant="Bold" />
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
            <CloseCircle size={48} color="#EF4444" variant="Bold" />
          </View>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Verification Failed</Text>
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
              <ArrowLeft size={18} color={tc.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
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

  const renderDocumentCapture = () => (
    <>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: tc.textPrimary }]}>Capture Your Document</Text>
        <Text style={[styles.stepDesc, { color: tc.textSecondary }]}>
          Take a clear photo of your {DOCUMENT_TYPES.find(d => d.id === selectedDocument)?.label}
        </Text>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <View style={[styles.captureFrame, { backgroundColor: subtleBg, borderColor: cardBorder }]}>
          <Camera size={48} color={tc.textTertiary} variant="Bulk" />
          <Text style={[styles.captureHintText, { color: tc.textTertiary }]}>Position your document within the frame</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: tc.primary, flexDirection: 'row', marginBottom: spacing.lg }]}
        onPress={handleDocumentCapture}
        activeOpacity={0.8}
      >
        <Camera size={24} color={tc.white} variant="Bold" />
        <Text style={[styles.primaryButtonText, { color: tc.white, marginLeft: spacing.sm }]}>Take Photo</Text>
      </TouchableOpacity>

      <View style={[styles.tipsCard, { backgroundColor: subtleBg }]}>
        <Text style={[styles.tipsTitle, { color: tc.textPrimary }]}>Tips for a good photo:</Text>
        <Text style={[styles.tipItem, { color: tc.textSecondary }]}>- Use good lighting</Text>
        <Text style={[styles.tipItem, { color: tc.textSecondary }]}>- Hold your phone steady</Text>
        <Text style={[styles.tipItem, { color: tc.textSecondary }]}>- Avoid shadows and glare</Text>
      </View>
    </>
  );

  const renderSelfie = () => (
    <>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: tc.textPrimary }]}>Take a Selfie</Text>
        <Text style={[styles.stepDesc, { color: tc.textSecondary }]}>
          We'll match your selfie with your ID photo to verify it's really you
        </Text>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <View style={[styles.selfieFrame, { backgroundColor: subtleBg, borderColor: cardBorder }]}>
          <User size={48} color={tc.textTertiary} variant="Bulk" />
          <Text style={[styles.captureHintText, { color: tc.textTertiary }]}>Position your face in the circle</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: tc.primary, flexDirection: 'row', marginBottom: spacing.lg }]}
        onPress={handleSelfieCapture}
        activeOpacity={0.8}
      >
        <Camera size={24} color={tc.white} variant="Bold" />
        <Text style={[styles.primaryButtonText, { color: tc.white, marginLeft: spacing.sm }]}>Take Selfie</Text>
      </TouchableOpacity>

      <View style={[styles.tipsCard, { backgroundColor: subtleBg }]}>
        <Text style={[styles.tipsTitle, { color: tc.textPrimary }]}>Selfie tips:</Text>
        <Text style={[styles.tipItem, { color: tc.textSecondary }]}>- Look directly at the camera</Text>
        <Text style={[styles.tipItem, { color: tc.textSecondary }]}>- Remove glasses and hats</Text>
        <Text style={[styles.tipItem, { color: tc.textSecondary }]}>- Ensure your face is well-lit</Text>
      </View>
    </>
  );

  const renderReview = () => (
    <>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: tc.textPrimary }]}>Review & Submit</Text>
        <Text style={[styles.stepDesc, { color: tc.textSecondary }]}>
          Please review your information before submitting
        </Text>
      </View>

      <View style={[styles.reviewCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.reviewItem}>
          <Text style={[styles.reviewLabel, { color: tc.textSecondary }]}>Document Type</Text>
          <Text style={[styles.reviewValue, { color: tc.textPrimary }]}>
            {DOCUMENT_TYPES.find(d => d.id === selectedDocument)?.label}
          </Text>
        </View>
        <View style={[styles.reviewDivider, { backgroundColor: cardBorder }]} />
        <View style={styles.reviewItem}>
          <Text style={[styles.reviewLabel, { color: tc.textSecondary }]}>Document Photo</Text>
          <View style={styles.reviewCheck}>
            <TickCircle size={16} color="#16A34A" variant="Bold" />
            <Text style={[styles.reviewCheckText, { color: '#16A34A' }]}>Captured</Text>
          </View>
        </View>
        <View style={[styles.reviewDivider, { backgroundColor: cardBorder }]} />
        <View style={styles.reviewItem}>
          <Text style={[styles.reviewLabel, { color: tc.textSecondary }]}>Selfie</Text>
          <View style={styles.reviewCheck}>
            <TickCircle size={16} color="#16A34A" variant="Bold" />
            <Text style={[styles.reviewCheckText, { color: '#16A34A' }]}>Captured</Text>
          </View>
        </View>
      </View>

      <View style={[styles.tipsCard, { backgroundColor: subtleBg, marginBottom: spacing.lg }]}>
        <Text style={[styles.tipItem, { color: tc.textSecondary, lineHeight: 18, fontSize: typography.fontSize.xs }]}>
          By submitting, you confirm that the information provided is accurate and you consent 
          to our verification process. Your data will be handled according to our Privacy Policy.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: tc.primary }]}
        onPress={handleSubmitVerification}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={tc.white} />
        ) : (
          <Text style={[styles.primaryButtonText, { color: tc.white }]}>Submit for Verification</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderSubmitted = () => (
    <View style={styles.centeredSection}>
      <View style={{ marginBottom: spacing.lg }}>
        <TickCircle size={64} color="#16A34A" variant="Bold" />
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
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: isDark ? '#1A1A1A' : tc.white, borderBottomColor: cardBorder }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
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
        {step === 'document-capture' && renderDocumentCapture()}
        {step === 'selfie' && renderSelfie()}
        {step === 'review' && renderReview()}
        {step === 'submitted' && renderSubmitted()}
      </ScrollView>
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
    fontSize: 11,
    marginTop: 1,
    lineHeight: 14,
  },
});
