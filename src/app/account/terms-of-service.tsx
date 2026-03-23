/**
 * TERMS OF SERVICE SCREEN
 * 
 * Comprehensive terms of service for Apple App Store compliance.
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

const LAST_UPDATED = 'December 30, 2024';
const EFFECTIVE_DATE = 'January 1, 2025';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: isDark ? '#1A1A1A' : tc.white, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.dateInfo, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : tc.gray50 }]}>
          <Text style={[styles.dateText, { color: tc.textSecondary }]}>Last Updated: {LAST_UPDATED}</Text>
          <Text style={[styles.dateText, { color: tc.textSecondary }]}>Effective Date: {EFFECTIVE_DATE}</Text>
        </View>

        <Text style={[styles.intro, { color: tc.textSecondary }]}>
          Welcome to Guidera. These Terms of Service ("Terms") govern your access to and use of the 
          Guidera mobile application ("App"), website, and related services (collectively, the "Service") 
          operated by Guidera Inc. ("Company", "we", "us", or "our").
        </Text>

        <Text style={[styles.intro, { color: tc.textSecondary }]}>
          By downloading, installing, or using our Service, you agree to be bound by these Terms. 
          If you do not agree to these Terms, please do not use our Service.
        </Text>

        {/* Section 1 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          By creating an account or using the Service, you confirm that you are at least 18 years old 
          (or the age of majority in your jurisdiction) and have the legal capacity to enter into these Terms. 
          If you are using the Service on behalf of an organization, you represent that you have the authority 
          to bind that organization to these Terms.
        </Text>

        {/* Section 2 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>2. Description of Service</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          Guidera is a travel companion application that provides:
        </Text>
        <Text style={[styles.bulletPoint, { color: tc.textSecondary }]}>• Trip planning and itinerary management</Text>
        <Text style={[styles.bulletPoint, { color: tc.textSecondary }]}>• Destination discovery and recommendations</Text>
        <Text style={[styles.bulletPoint, { color: tc.textSecondary }]}>• Booking services for flights, hotels, car rentals, and experiences</Text>
        <Text style={[styles.bulletPoint, { color: tc.textSecondary }]}>• Community features connecting travelers</Text>
        <Text style={[styles.bulletPoint, { color: tc.textSecondary }]}>• Cultural insights and travel safety information</Text>
        <Text style={[styles.bulletPoint, { color: tc.textSecondary }]}>• AI-powered personalized recommendations</Text>

        {/* Section 3 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>3. User Accounts</Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>3.1 Account Creation</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          To access certain features, you must create an account. You agree to provide accurate, current, 
          and complete information during registration and to update such information to keep it accurate.
        </Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>3.2 Account Security</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          You are responsible for maintaining the confidentiality of your account credentials and for all 
          activities that occur under your account. You must immediately notify us of any unauthorized use 
          of your account or any other security breach.
        </Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>3.3 Account Termination</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          We reserve the right to suspend or terminate your account at any time for violations of these Terms, 
          fraudulent activity, or any other reason at our sole discretion. You may delete your account at any 
          time through the App settings.
        </Text>

        {/* Section 4 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>4. Booking and Transactions</Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>4.1 Third-Party Services</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          Guidera facilitates bookings with third-party travel providers (airlines, hotels, car rental companies, 
          experience providers). Your transactions with these providers are subject to their respective terms and 
          conditions. We are not a party to these transactions and are not responsible for the acts or omissions 
          of third-party providers.
        </Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>4.2 Pricing and Payments</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          All prices displayed are in the currency indicated and may be subject to taxes, fees, and other charges. 
          Prices are subject to change without notice until a booking is confirmed. Payment processing is handled 
          by secure third-party payment processors.
        </Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>4.3 Cancellations and Refunds</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          Cancellation and refund policies vary by provider and booking type. Please review the specific terms 
          before completing any booking. Guidera is not responsible for refunds from third-party providers.
        </Text>

        {/* Section 5 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>5. User Content and Conduct</Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>5.1 User-Generated Content</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          You may post reviews, photos, comments, and other content ("User Content") through the Service. 
          You retain ownership of your User Content but grant us a worldwide, non-exclusive, royalty-free 
          license to use, reproduce, modify, and display such content in connection with the Service.
        </Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>5.2 Prohibited Content</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          You agree not to post content that:
        </Text>
        <Text style={[styles.bulletPoint, { color: tc.textSecondary }]}>• Is false, misleading, or fraudulent</Text>
        <Text style={[styles.bulletPoint, { color: tc.textSecondary }]}>• Infringes on intellectual property rights</Text>
        <Text style={[styles.bulletPoint, { color: tc.textSecondary }]}>• Contains hate speech, harassment, or discrimination</Text>
        <Text style={[styles.bulletPoint, { color: tc.textSecondary }]}>• Is sexually explicit or promotes violence</Text>
        <Text style={[styles.bulletPoint, { color: tc.textSecondary }]}>• Violates any applicable laws or regulations</Text>
        <Text style={[styles.bulletPoint, { color: tc.textSecondary }]}>• Contains malware, spam, or phishing attempts</Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>5.3 Community Guidelines</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          When interacting with other users, you agree to treat others with respect, not engage in harassment 
          or stalking, and report any concerning behavior to our support team.
        </Text>

        {/* Section 6 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>6. Intellectual Property</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          The Service, including its design, features, content, and underlying technology, is owned by Guidera 
          and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, 
          distribute, sell, or lease any part of our Service without our written permission.
        </Text>

        {/* Section 7 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>7. Privacy</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          Your privacy is important to us. Our collection and use of personal information is governed by our 
          Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent 
          to our data practices as described in the Privacy Policy.
        </Text>

        {/* Section 8 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>8. Disclaimers</Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>8.1 Service Availability</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS 
          OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
        </Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>8.2 Travel Information</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          While we strive to provide accurate travel information, we do not guarantee the accuracy, completeness, 
          or reliability of any information provided through the Service. Travel conditions can change rapidly, 
          and you should verify important information independently.
        </Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>8.3 Third-Party Content</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          We are not responsible for content, products, or services offered by third parties, including 
          travel providers, advertisers, or other users.
        </Text>

        {/* Section 9 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>9. Limitation of Liability</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, GUIDERA AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS 
          SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
          INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
        </Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE 
          AMOUNT YOU PAID TO US, IF ANY, IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
        </Text>

        {/* Section 10 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>10. Indemnification</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          You agree to indemnify, defend, and hold harmless Guidera and its affiliates from any claims, damages, 
          losses, and expenses (including reasonable attorneys' fees) arising from your use of the Service, 
          violation of these Terms, or infringement of any rights of another party.
        </Text>

        {/* Section 11 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>11. Dispute Resolution</Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>11.1 Governing Law</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, 
          United States, without regard to its conflict of law provisions.
        </Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>11.2 Arbitration</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          Any dispute arising from these Terms or the Service shall be resolved through binding arbitration 
          in accordance with the rules of the American Arbitration Association. The arbitration shall take 
          place in Delaware, and the arbitrator's decision shall be final and binding.
        </Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>11.3 Class Action Waiver</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          You agree to resolve disputes with us on an individual basis and waive any right to participate 
          in a class action lawsuit or class-wide arbitration.
        </Text>

        {/* Section 12 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>12. Changes to Terms</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          We may update these Terms from time to time. We will notify you of material changes by posting 
          the updated Terms in the App and updating the "Last Updated" date. Your continued use of the 
          Service after such changes constitutes acceptance of the updated Terms.
        </Text>

        {/* Section 13 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>13. General Provisions</Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>13.1 Entire Agreement</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          These Terms, together with our Privacy Policy, constitute the entire agreement between you and 
          Guidera regarding the Service.
        </Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>13.2 Severability</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          If any provision of these Terms is found to be unenforceable, the remaining provisions shall 
          continue in full force and effect.
        </Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>13.3 Waiver</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          Our failure to enforce any right or provision of these Terms shall not constitute a waiver of 
          such right or provision.
        </Text>
        <Text style={[styles.subTitle, { color: tc.textPrimary }]}>13.4 Assignment</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          You may not assign or transfer these Terms without our prior written consent. We may assign 
          these Terms without restriction.
        </Text>

        {/* Section 14 */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>14. Contact Information</Text>
        <Text style={[styles.paragraph, { color: tc.textSecondary }]}>
          If you have any questions about these Terms, please contact us at:
        </Text>
        <Text style={[styles.contactInfo, { color: tc.textPrimary }]}>Guidera Inc.</Text>
        <Text style={[styles.contactInfo, { color: tc.textPrimary }]}>Email: legal@guidera.one</Text>
        <Text style={[styles.contactInfo, { color: tc.textPrimary }]}>Website: https://guidera.one/terms</Text>

        <View style={[styles.footer, { borderTopColor: tc.borderSubtle }]}>
          <Text style={[styles.footerText, { color: tc.textSecondary }]}>
            By using Guidera, you acknowledge that you have read, understood, and agree to be bound by 
            these Terms of Service.
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
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
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
    borderTopColor: colors.borderSubtle,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
});
