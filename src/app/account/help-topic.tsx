/**
 * HELP TOPIC SCREEN
 * 
 * Shows FAQs for a specific category/topic.
 * Navigated to from Help Center when user selects a topic.
 */

import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  MessageQuestion,
  ArrowDown2,
  ArrowUp2,
  Airplane,
  Card,
  Profile2User,
  ShieldTick,
  Notification,
  Setting2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const CATEGORY_CONFIG: Record<string, { title: string; icon: any; color: string }> = {
  'getting-started': { title: 'Getting Started', icon: Airplane, color: colors.primary },
  'trips': { title: 'Trips & Bookings', icon: Card, color: colors.success },
  'community': { title: 'Community', icon: Profile2User, color: colors.info },
  'account': { title: 'Account & Security', icon: ShieldTick, color: colors.warning },
  'notifications': { title: 'Notifications', icon: Notification, color: colors.error },
  'settings': { title: 'App Settings', icon: Setting2, color: colors.gray500 },
};

const FAQ_ITEMS: FAQItem[] = [
  // Getting Started
  {
    id: '1',
    category: 'getting-started',
    question: 'How do I create a Guidera account?',
    answer: 'You can create a Guidera account by downloading the app and signing up with your email address or phone number. You can also sign up using your Apple, Google, or social media accounts for a faster registration process. After signing up, complete your profile to personalize your travel experience.',
  },
  {
    id: '2',
    category: 'getting-started',
    question: 'What is Guidera and how does it work?',
    answer: 'Guidera is your intelligent travel companion that helps you discover, plan, and experience travel like never before. Our app uses AI-powered recommendations to suggest destinations, activities, and experiences tailored to your preferences. You can plan trips, connect with fellow travelers, access cultural insights, and get real-time travel assistance.',
  },
  {
    id: '3',
    category: 'getting-started',
    question: 'Is Guidera free to use?',
    answer: 'Yes! Guidera offers a free tier with essential features including trip planning, destination discovery, and community access. Premium features like AI travel assistant, offline maps, and priority support are available through our subscription plans. You can upgrade anytime from your account settings.',
  },
  // Trips & Bookings
  {
    id: '4',
    category: 'trips',
    question: 'How do I create a new trip?',
    answer: 'To create a new trip, tap the "+" button on the Trips tab or select "Plan a Trip" from the home screen. Enter your destination, travel dates, and preferences. Guidera will help you build an itinerary with personalized recommendations for activities, restaurants, and experiences.',
  },
  {
    id: '5',
    category: 'trips',
    question: 'Can I share my trip with others?',
    answer: 'Absolutely! You can invite friends and family to collaborate on trip planning. Go to your trip details, tap "Share Trip," and send an invite link. Collaborators can view the itinerary, suggest activities, and add their own ideas. You control who can view or edit your trip.',
  },
  {
    id: '6',
    category: 'trips',
    question: 'How do I cancel or modify a booking?',
    answer: 'To modify or cancel a booking, go to your Trips tab, select the trip, and find the booking you want to change. Tap on it to view details and cancellation options. Cancellation policies vary by provider, so check the terms before confirming. Refunds are processed according to each provider\'s policy.',
  },
  // Community
  {
    id: '7',
    category: 'community',
    question: 'How do I find travel buddies?',
    answer: 'Guidera\'s community feature helps you connect with like-minded travelers. Browse the Community tab to find travelers heading to similar destinations or with matching interests. You can send connection requests, join travel groups, and participate in discussions. Verified profiles help ensure authentic connections.',
  },
  {
    id: '8',
    category: 'community',
    question: 'How do I report inappropriate content or users?',
    answer: 'If you encounter inappropriate content or behavior, tap the three-dot menu on any post or profile and select "Report." Choose the reason for reporting and provide any additional details. Our moderation team reviews all reports within 24 hours and takes appropriate action to maintain a safe community.',
  },
  // Account & Security
  {
    id: '9',
    category: 'account',
    question: 'How do I reset my password?',
    answer: 'To reset your password, go to the login screen and tap "Forgot Password." Enter your email address, and we\'ll send you a password reset link. Click the link in the email to create a new password. For security, the link expires after 1 hour.',
  },
  {
    id: '10',
    category: 'account',
    question: 'How do I enable two-factor authentication?',
    answer: 'Two-factor authentication adds an extra layer of security to your account. Go to Settings > Security > Two-Factor Authentication and follow the setup process. You can use an authenticator app like Google Authenticator or Authy. Once enabled, you\'ll need to enter a code when signing in on new devices.',
  },
  {
    id: '11',
    category: 'account',
    question: 'How do I delete my account?',
    answer: 'We\'re sorry to see you go. To delete your account, go to Settings > Account > Delete Account. You\'ll be asked to confirm your decision. Please note that account deletion is permanent and cannot be undone. Your data will be removed in accordance with our Privacy Policy and applicable data protection laws.',
  },
  // Notifications
  {
    id: '12',
    category: 'notifications',
    question: 'How do I manage my notification preferences?',
    answer: 'You can customize your notifications in Settings > Notifications. Choose which types of notifications you want to receive (trip reminders, booking updates, community activity, deals) and how you want to receive them (push, email, SMS). You can also set quiet hours to pause notifications during specific times.',
  },
  // Settings
  {
    id: '13',
    category: 'settings',
    question: 'How do I change the app language?',
    answer: 'Guidera supports multiple languages. Go to Settings > Language and select your preferred language from the list. The app will immediately update to display content in your chosen language. Some user-generated content may remain in its original language.',
  },
  {
    id: '14',
    category: 'settings',
    question: 'How do I enable dark mode?',
    answer: 'You can switch to dark mode in Settings > Appearance. Choose between Light, Dark, or System (follows your device settings). Dark mode reduces eye strain in low-light conditions and can help save battery on OLED screens.',
  },
];

export default function HelpTopicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categoryConfig = CATEGORY_CONFIG[category || ''] || CATEGORY_CONFIG['getting-started'];
  const Icon = categoryConfig.icon;

  const filteredFAQs = useMemo(() => {
    return FAQ_ITEMS.filter(faq => faq.category === category);
  }, [category]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleFAQPress = (faqId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryConfig.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Header */}
        <View style={[styles.categoryHeader, { backgroundColor: categoryConfig.color + '10' }]}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryConfig.color + '20' }]}>
            <Icon size={28} color={categoryConfig.color} variant="Bold" />
          </View>
          <Text style={styles.categoryTitle}>{categoryConfig.title}</Text>
          <Text style={styles.categoryCount}>{filteredFAQs.length} articles</Text>
        </View>

        {/* FAQ List */}
        <View style={styles.faqSection}>
          {filteredFAQs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqCard}
              onPress={() => handleFAQPress(faq.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <MessageQuestion size={20} color={colors.primary} variant="Bold" />
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                {expandedFAQ === faq.id ? (
                  <ArrowUp2 size={18} color={colors.gray400} />
                ) : (
                  <ArrowDown2 size={18} color={colors.gray400} />
                )}
              </View>
              {expandedFAQ === faq.id && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State */}
        {filteredFAQs.length === 0 && (
          <View style={styles.emptyState}>
            <MessageQuestion size={48} color={colors.gray300} variant="Bulk" />
            <Text style={styles.emptyTitle}>No articles yet</Text>
            <Text style={styles.emptyText}>
              We're working on adding more help articles for this topic.
            </Text>
          </View>
        )}
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
  categoryHeader: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  categoryCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  faqSection: {
    gap: spacing.sm,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginHorizontal: spacing.sm,
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
