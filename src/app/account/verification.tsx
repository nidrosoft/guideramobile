/**
 * IDENTITY VERIFICATION SCREEN
 * 
 * Verify user identity for community trust and enhanced features.
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
  Image,
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
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
type VerificationStep = 'intro' | 'document-select' | 'document-capture' | 'selfie' | 'review' | 'submitted';

interface VerificationData {
  status: VerificationStatus;
  submitted_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  document_type?: string;
}

const DOCUMENT_TYPES = [
  { id: 'passport', label: 'Passport', icon: Card, description: 'International travel document' },
  { id: 'drivers_license', label: "Driver's License", icon: Card, description: 'Government-issued ID' },
  { id: 'national_id', label: 'National ID Card', icon: Card, description: 'Country-issued identification' },
];

const VERIFICATION_BENEFITS = [
  { icon: ShieldTick, title: 'Verified Badge', description: 'Show others you\'re a trusted traveler' },
  { icon: People, title: 'Community Trust', description: 'Connect with verified travel buddies' },
  { icon: Star1, title: 'Priority Support', description: 'Get faster responses from our team' },
  { icon: MessageQuestion, title: 'Premium Features', description: 'Access exclusive community features' },
];

export default function VerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [verificationData, setVerificationData] = useState<VerificationData>({ status: 'unverified' });
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<VerificationStep>('intro');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  // Load verification status
  const loadVerificationStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Check if user is already verified from profile
      if (profile?.is_verified) {
        setVerificationData({
          status: 'verified',
          reviewed_at: profile.verified_at,
        });
      } else {
        // Check for pending verification
        const { data, error } = await supabase
          .from('identity_verifications')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setVerificationData({
            status: data.status as VerificationStatus,
            submitted_at: data.submitted_at,
            reviewed_at: data.reviewed_at,
            rejection_reason: data.rejection_reason,
            document_type: data.document_type,
          });
        }
      }
    } catch (error) {
      // No verification record found - user is unverified
      console.log('No verification record found');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, profile]);

  useEffect(() => {
    loadVerificationStatus();
  }, [loadVerificationStatus]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step !== 'intro' && step !== 'submitted') {
      // Go back to previous step
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
    // TODO: Implement camera capture for document
    // For now, simulate capture
    Alert.alert(
      'Document Capture',
      'In production, this would open the camera to capture your ID document.',
      [{ text: 'Continue', onPress: () => setStep('selfie') }]
    );
  };

  const handleSelfieCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement camera capture for selfie
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
      // Create verification record
      const { error } = await supabase
        .from('identity_verifications')
        .upsert({
          user_id: user?.id,
          status: 'pending',
          document_type: selectedDocument,
          submitted_at: new Date().toISOString(),
        });

      if (error) throw error;

      setVerificationData({
        status: 'pending',
        submitted_at: new Date().toISOString(),
        document_type: selectedDocument || undefined,
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

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'verified': return colors.success;
      case 'pending': return colors.warning;
      case 'rejected': return colors.error;
      default: return colors.gray400;
    }
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'verified': return <TickCircle size={20} color={colors.success} variant="Bold" />;
      case 'pending': return <Clock size={20} color={colors.warning} variant="Bold" />;
      case 'rejected': return <CloseCircle size={20} color={colors.error} variant="Bold" />;
      default: return <Verify size={20} color={colors.gray400} variant="Bold" />;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderIntro = () => (
    <>
      {/* Status Card */}
      <View style={[styles.statusCard, { borderColor: getStatusColor(verificationData.status) + '30' }]}>
        <View style={[styles.statusIcon, { backgroundColor: getStatusColor(verificationData.status) + '15' }]}>
          {getStatusIcon(verificationData.status)}
        </View>
        <View style={styles.statusContent}>
          <Text style={styles.statusLabel}>Verification Status</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(verificationData.status) }]}>
            {verificationData.status.charAt(0).toUpperCase() + verificationData.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Verified State */}
      {verificationData.status === 'verified' && (
        <View style={styles.verifiedSection}>
          <View style={styles.verifiedBadge}>
            <TickCircle size={48} color={colors.success} variant="Bold" />
          </View>
          <Text style={styles.verifiedTitle}>You're Verified!</Text>
          <Text style={styles.verifiedText}>
            Your identity has been verified. You now have access to all verified member benefits.
          </Text>
          {verificationData.reviewed_at && (
            <Text style={styles.verifiedDate}>
              Verified on {new Date(verificationData.reviewed_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      {/* Pending State */}
      {verificationData.status === 'pending' && (
        <View style={styles.pendingSection}>
          <View style={styles.pendingIcon}>
            <Clock size={48} color={colors.warning} variant="Bold" />
          </View>
          <Text style={styles.pendingTitle}>Verification In Progress</Text>
          <Text style={styles.pendingText}>
            We're reviewing your documents. This usually takes 1-2 business days. 
            We'll notify you once the review is complete.
          </Text>
          {verificationData.submitted_at && (
            <Text style={styles.pendingDate}>
              Submitted on {new Date(verificationData.submitted_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      {/* Rejected State */}
      {verificationData.status === 'rejected' && (
        <View style={styles.rejectedSection}>
          <View style={styles.rejectedIcon}>
            <CloseCircle size={48} color={colors.error} variant="Bold" />
          </View>
          <Text style={styles.rejectedTitle}>Verification Failed</Text>
          <Text style={styles.rejectedText}>
            {verificationData.rejection_reason || 'Your verification could not be completed. Please try again with clearer documents.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleStartVerification}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Unverified State */}
      {verificationData.status === 'unverified' && (
        <>
          <View style={styles.introSection}>
            <View style={styles.introIcon}>
              <Verify size={48} color={colors.primary} variant="Bold" />
            </View>
            <Text style={styles.introTitle}>Verify Your Identity</Text>
            <Text style={styles.introText}>
              Get verified to unlock exclusive features and build trust within the Guidera community.
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Benefits of Verification</Text>
            {VERIFICATION_BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <Icon size={20} color={colors.primary} variant="Bold" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartVerification}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Start Verification</Text>
          </TouchableOpacity>

          {/* Time Estimate */}
          <Text style={styles.timeEstimate}>
            Takes about 2 minutes • Review within 1-2 business days
          </Text>
        </>
      )}
    </>
  );

  const renderDocumentSelect = () => (
    <>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Select Document Type</Text>
        <Text style={styles.stepDescription}>
          Choose a valid government-issued ID to verify your identity
        </Text>
      </View>

      <View style={styles.documentList}>
        {DOCUMENT_TYPES.map((doc) => {
          const Icon = doc.icon;
          return (
            <TouchableOpacity
              key={doc.id}
              style={styles.documentCard}
              onPress={() => handleSelectDocument(doc.id)}
              activeOpacity={0.7}
            >
              <View style={styles.documentIcon}>
                <Icon size={24} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.documentContent}>
                <Text style={styles.documentTitle}>{doc.label}</Text>
                <Text style={styles.documentDescription}>{doc.description}</Text>
              </View>
              <ArrowLeft size={18} color={colors.gray400} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.requirementsCard}>
        <Text style={styles.requirementsTitle}>Document Requirements</Text>
        <Text style={styles.requirementItem}>• Must be a valid, unexpired document</Text>
        <Text style={styles.requirementItem}>• All corners must be visible</Text>
        <Text style={styles.requirementItem}>• Text must be clearly readable</Text>
        <Text style={styles.requirementItem}>• No glare or blur</Text>
      </View>
    </>
  );

  const renderDocumentCapture = () => (
    <>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Capture Your Document</Text>
        <Text style={styles.stepDescription}>
          Take a clear photo of your {DOCUMENT_TYPES.find(d => d.id === selectedDocument)?.label}
        </Text>
      </View>

      <View style={styles.captureArea}>
        <View style={styles.captureFrame}>
          <Camera size={48} color={colors.gray300} variant="Bulk" />
          <Text style={styles.captureText}>Position your document within the frame</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.captureButton}
        onPress={handleDocumentCapture}
        activeOpacity={0.8}
      >
        <Camera size={24} color={colors.white} variant="Bold" />
        <Text style={styles.captureButtonText}>Take Photo</Text>
      </TouchableOpacity>

      <View style={styles.captureTips}>
        <Text style={styles.captureTipsTitle}>Tips for a good photo:</Text>
        <Text style={styles.captureTip}>• Use good lighting</Text>
        <Text style={styles.captureTip}>• Hold your phone steady</Text>
        <Text style={styles.captureTip}>• Avoid shadows and glare</Text>
      </View>
    </>
  );

  const renderSelfie = () => (
    <>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Take a Selfie</Text>
        <Text style={styles.stepDescription}>
          We'll match your selfie with your ID photo to verify it's really you
        </Text>
      </View>

      <View style={styles.captureArea}>
        <View style={styles.selfieFrame}>
          <User size={48} color={colors.gray300} variant="Bulk" />
          <Text style={styles.captureText}>Position your face in the circle</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.captureButton}
        onPress={handleSelfieCapture}
        activeOpacity={0.8}
      >
        <Camera size={24} color={colors.white} variant="Bold" />
        <Text style={styles.captureButtonText}>Take Selfie</Text>
      </TouchableOpacity>

      <View style={styles.captureTips}>
        <Text style={styles.captureTipsTitle}>Selfie tips:</Text>
        <Text style={styles.captureTip}>• Look directly at the camera</Text>
        <Text style={styles.captureTip}>• Remove glasses and hats</Text>
        <Text style={styles.captureTip}>• Ensure your face is well-lit</Text>
      </View>
    </>
  );

  const renderReview = () => (
    <>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Review & Submit</Text>
        <Text style={styles.stepDescription}>
          Please review your information before submitting
        </Text>
      </View>

      <View style={styles.reviewCard}>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Document Type</Text>
          <Text style={styles.reviewValue}>
            {DOCUMENT_TYPES.find(d => d.id === selectedDocument)?.label}
          </Text>
        </View>
        <View style={styles.reviewDivider} />
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Document Photo</Text>
          <View style={styles.reviewCheck}>
            <TickCircle size={16} color={colors.success} variant="Bold" />
            <Text style={styles.reviewCheckText}>Captured</Text>
          </View>
        </View>
        <View style={styles.reviewDivider} />
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Selfie</Text>
          <View style={styles.reviewCheck}>
            <TickCircle size={16} color={colors.success} variant="Bold" />
            <Text style={styles.reviewCheckText}>Captured</Text>
          </View>
        </View>
      </View>

      <View style={styles.consentCard}>
        <Text style={styles.consentText}>
          By submitting, you confirm that the information provided is accurate and you consent 
          to our verification process. Your data will be handled according to our Privacy Policy.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmitVerification}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>Submit for Verification</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderSubmitted = () => (
    <View style={styles.submittedSection}>
      <View style={styles.submittedIcon}>
        <TickCircle size={64} color={colors.success} variant="Bold" />
      </View>
      <Text style={styles.submittedTitle}>Submitted Successfully!</Text>
      <Text style={styles.submittedText}>
        Your verification request has been submitted. We'll review your documents and 
        notify you within 1-2 business days.
      </Text>
      
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  statusIcon: {
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
    color: colors.textSecondary,
  },
  statusValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
  },
  verifiedSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  verifiedBadge: {
    marginBottom: spacing.md,
  },
  verifiedTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  verifiedText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  verifiedDate: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginTop: spacing.md,
  },
  pendingSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  pendingIcon: {
    marginBottom: spacing.md,
  },
  pendingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  pendingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  pendingDate: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginTop: spacing.md,
  },
  rejectedSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  rejectedIcon: {
    marginBottom: spacing.md,
  },
  rejectedTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  rejectedText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  introIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  introTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  introText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsSection: {
    marginBottom: spacing.xl,
  },
  benefitsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  benefitDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  startButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  timeEstimate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stepHeader: {
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  documentList: {
    marginBottom: spacing.lg,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  documentContent: {
    flex: 1,
  },
  documentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  documentDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  requirementsCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  requirementsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  requirementItem: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  captureArea: {
    marginBottom: spacing.lg,
  },
  captureFrame: {
    height: 240,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfieFrame: {
    height: 280,
    backgroundColor: colors.gray100,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: 280,
  },
  captureText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  captureButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  captureButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  captureTips: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  captureTipsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  captureTip: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  reviewLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  reviewValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  reviewCheck: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCheckText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    marginLeft: 4,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: colors.gray100,
  },
  consentCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  consentText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  submittedSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  submittedIcon: {
    marginBottom: spacing.lg,
  },
  submittedTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  submittedText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  doneButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
