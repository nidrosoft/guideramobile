/**
 * PRIVACY POLICY SCREEN
 * 
 * Comprehensive privacy policy for GDPR, CCPA, and Apple App Store compliance.
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

const LAST_UPDATED = 'December 30, 2024';
const EFFECTIVE_DATE = 'January 1, 2025';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleEmailLink = () => {
    Linking.openURL('mailto:privacy@guidera.app');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>Last Updated: {LAST_UPDATED}</Text>
          <Text style={styles.dateText}>Effective Date: {EFFECTIVE_DATE}</Text>
        </View>

        <Text style={styles.intro}>
          At Guidera ("Company", "we", "us", or "our"), we are committed to protecting your privacy 
          and ensuring the security of your personal information. This Privacy Policy explains how we 
          collect, use, disclose, and safeguard your information when you use our mobile application 
          and related services (collectively, the "Service").
        </Text>

        <Text style={styles.intro}>
          This policy complies with the General Data Protection Regulation (GDPR), California Consumer 
          Privacy Act (CCPA), and other applicable privacy laws worldwide.
        </Text>

        {/* Section 1 */}
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        
        <Text style={styles.subTitle}>1.1 Information You Provide</Text>
        <Text style={styles.paragraph}>
          We collect information you voluntarily provide when using our Service:
        </Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Account Information:</Text> Name, email address, phone number, password, date of birth, profile photo</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Profile Data:</Text> Travel preferences, interests, dietary restrictions, accessibility needs</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Booking Information:</Text> Travel dates, destinations, passenger details, payment information</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>User Content:</Text> Reviews, photos, comments, trip itineraries you create or share</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Communications:</Text> Messages with other users, support requests, feedback</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Identity Verification:</Text> Government ID documents (if you choose to verify your account)</Text>

        <Text style={styles.subTitle}>1.2 Information Collected Automatically</Text>
        <Text style={styles.paragraph}>
          When you use our Service, we automatically collect:
        </Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Device Information:</Text> Device type, operating system, unique device identifiers, app version</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Usage Data:</Text> Features used, pages viewed, search queries, interaction patterns</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Location Data:</Text> Precise or approximate location (with your permission) for travel recommendations</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Log Data:</Text> IP address, access times, error logs, referring URLs</Text>

        <Text style={styles.subTitle}>1.3 Information from Third Parties</Text>
        <Text style={styles.paragraph}>
          We may receive information from:
        </Text>
        <Text style={styles.bulletPoint}>• Social media platforms (if you sign in with Google, Apple, or Facebook)</Text>
        <Text style={styles.bulletPoint}>• Travel providers (booking confirmations, loyalty program data)</Text>
        <Text style={styles.bulletPoint}>• Analytics providers (aggregated usage statistics)</Text>

        {/* Section 2 */}
        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information for the following purposes:
        </Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Provide Services:</Text> Process bookings, manage your account, deliver personalized recommendations</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Improve Experience:</Text> Analyze usage patterns, develop new features, optimize performance</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Communications:</Text> Send booking confirmations, travel alerts, safety notifications, and (with consent) marketing messages</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Safety & Security:</Text> Detect fraud, verify identities, enforce our terms, protect users</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Legal Compliance:</Text> Comply with applicable laws, respond to legal requests</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>AI Personalization:</Text> Train and improve our recommendation algorithms (using anonymized data)</Text>

        {/* Section 3 */}
        <Text style={styles.sectionTitle}>3. Legal Basis for Processing (GDPR)</Text>
        <Text style={styles.paragraph}>
          Under GDPR, we process your data based on:
        </Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Contract Performance:</Text> Processing necessary to provide our services to you</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Legitimate Interests:</Text> Improving our services, preventing fraud, marketing (where appropriate)</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Consent:</Text> Where you have given explicit consent (e.g., marketing emails, location tracking)</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Legal Obligation:</Text> Compliance with applicable laws and regulations</Text>

        {/* Section 4 */}
        <Text style={styles.sectionTitle}>4. How We Share Your Information</Text>
        <Text style={styles.paragraph}>
          We do not sell your personal information. We may share your data with:
        </Text>
        <Text style={styles.subTitle}>4.1 Service Providers</Text>
        <Text style={styles.paragraph}>
          Third parties who help us operate our Service, including:
        </Text>
        <Text style={styles.bulletPoint}>• Cloud hosting providers (data storage)</Text>
        <Text style={styles.bulletPoint}>• Payment processors (transaction processing)</Text>
        <Text style={styles.bulletPoint}>• Analytics providers (usage analysis)</Text>
        <Text style={styles.bulletPoint}>• Customer support tools (help desk services)</Text>
        <Text style={styles.bulletPoint}>• Email service providers (communications)</Text>

        <Text style={styles.subTitle}>4.2 Travel Partners</Text>
        <Text style={styles.paragraph}>
          When you make a booking, we share necessary information with airlines, hotels, car rental 
          companies, and experience providers to fulfill your reservation.
        </Text>

        <Text style={styles.subTitle}>4.3 Other Users</Text>
        <Text style={styles.paragraph}>
          Information you choose to share publicly (profile, reviews, trip posts) may be visible to 
          other users based on your privacy settings.
        </Text>

        <Text style={styles.subTitle}>4.4 Legal Requirements</Text>
        <Text style={styles.paragraph}>
          We may disclose information when required by law, court order, or to protect our rights, 
          safety, or property.
        </Text>

        <Text style={styles.subTitle}>4.5 Business Transfers</Text>
        <Text style={styles.paragraph}>
          In the event of a merger, acquisition, or sale of assets, your information may be transferred 
          as part of that transaction.
        </Text>

        {/* Section 5 */}
        <Text style={styles.sectionTitle}>5. Your Rights and Choices</Text>
        
        <Text style={styles.subTitle}>5.1 All Users</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Access:</Text> Request a copy of your personal data</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Correction:</Text> Update or correct inaccurate information</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Deletion:</Text> Request deletion of your account and data</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Opt-Out:</Text> Unsubscribe from marketing communications</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Location:</Text> Disable location services in your device settings</Text>

        <Text style={styles.subTitle}>5.2 European Users (GDPR)</Text>
        <Text style={styles.paragraph}>
          If you are in the European Economic Area, you have additional rights:
        </Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Data Portability:</Text> Receive your data in a structured, machine-readable format</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Restriction:</Text> Request restriction of processing in certain circumstances</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Objection:</Text> Object to processing based on legitimate interests</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Withdraw Consent:</Text> Withdraw consent at any time (without affecting prior processing)</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Complaint:</Text> Lodge a complaint with your local data protection authority</Text>

        <Text style={styles.subTitle}>5.3 California Users (CCPA)</Text>
        <Text style={styles.paragraph}>
          California residents have the right to:
        </Text>
        <Text style={styles.bulletPoint}>• Know what personal information we collect and how it's used</Text>
        <Text style={styles.bulletPoint}>• Request deletion of personal information</Text>
        <Text style={styles.bulletPoint}>• Opt-out of the sale of personal information (we do not sell your data)</Text>
        <Text style={styles.bulletPoint}>• Non-discrimination for exercising privacy rights</Text>

        <Text style={styles.paragraph}>
          To exercise any of these rights, contact us at{' '}
          <Text style={styles.link} onPress={handleEmailLink}>privacy@guidera.app</Text>
        </Text>

        {/* Section 6 */}
        <Text style={styles.sectionTitle}>6. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your personal information for as long as necessary to:
        </Text>
        <Text style={styles.bulletPoint}>• Provide our services to you</Text>
        <Text style={styles.bulletPoint}>• Comply with legal obligations (e.g., tax records, booking history)</Text>
        <Text style={styles.bulletPoint}>• Resolve disputes and enforce our agreements</Text>
        <Text style={styles.paragraph}>
          When you delete your account, we will delete or anonymize your personal data within 30 days, 
          except where retention is required by law or for legitimate business purposes.
        </Text>

        {/* Section 7 */}
        <Text style={styles.sectionTitle}>7. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement industry-standard security measures to protect your data:
        </Text>
        <Text style={styles.bulletPoint}>• Encryption of data in transit (TLS/SSL) and at rest</Text>
        <Text style={styles.bulletPoint}>• Secure authentication and access controls</Text>
        <Text style={styles.bulletPoint}>• Regular security audits and vulnerability assessments</Text>
        <Text style={styles.bulletPoint}>• Employee training on data protection</Text>
        <Text style={styles.bulletPoint}>• Incident response procedures</Text>
        <Text style={styles.paragraph}>
          While we strive to protect your information, no method of transmission over the internet 
          is 100% secure. We cannot guarantee absolute security.
        </Text>

        {/* Section 8 */}
        <Text style={styles.sectionTitle}>8. International Data Transfers</Text>
        <Text style={styles.paragraph}>
          Your information may be transferred to and processed in countries other than your own. 
          We ensure appropriate safeguards are in place, including:
        </Text>
        <Text style={styles.bulletPoint}>• Standard Contractual Clauses approved by the European Commission</Text>
        <Text style={styles.bulletPoint}>• Data processing agreements with all service providers</Text>
        <Text style={styles.bulletPoint}>• Compliance with applicable data transfer regulations</Text>

        {/* Section 9 */}
        <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our Service is not intended for children under 18 years of age. We do not knowingly collect 
          personal information from children. If you believe we have collected information from a child, 
          please contact us immediately, and we will take steps to delete such information.
        </Text>

        {/* Section 10 */}
        <Text style={styles.sectionTitle}>10. Cookies and Tracking</Text>
        <Text style={styles.paragraph}>
          Our mobile app uses:
        </Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Essential Storage:</Text> To maintain your session and preferences</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Analytics:</Text> To understand how you use our app (can be disabled)</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Advertising Identifiers:</Text> For personalized ads (can be disabled in device settings)</Text>
        <Text style={styles.paragraph}>
          You can control tracking through your device's privacy settings (Settings → Privacy → Tracking on iOS).
        </Text>

        {/* Section 11 */}
        <Text style={styles.sectionTitle}>11. Third-Party Links</Text>
        <Text style={styles.paragraph}>
          Our Service may contain links to third-party websites or services. We are not responsible 
          for the privacy practices of these third parties. We encourage you to review their privacy 
          policies before providing any personal information.
        </Text>

        {/* Section 12 */}
        <Text style={styles.sectionTitle}>12. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of material changes 
          by posting the updated policy in the app and updating the "Last Updated" date. For significant 
          changes, we may also send you a notification via email or in-app message.
        </Text>

        {/* Section 13 */}
        <Text style={styles.sectionTitle}>13. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this Privacy Policy or our data practices, please contact us:
        </Text>
        <Text style={styles.contactInfo}>Guidera Inc.</Text>
        <Text style={styles.contactInfo}>Data Protection Officer</Text>
        <Text style={styles.contactInfo}>Email: privacy@guidera.app</Text>
        <Text style={styles.contactInfo}>Website: https://guidera.app/privacy</Text>
        
        <Text style={styles.paragraph}>
          For GDPR-related inquiries, you may also contact your local data protection authority.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Guidera, you acknowledge that you have read and understood this Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  dateInfo: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  intro: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 24,
    paddingLeft: spacing.md,
    marginBottom: 4,
  },
  bold: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  contactInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
});
