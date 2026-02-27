/**
 * HELP CENTER SCREEN
 * 
 * FAQ and searchable help articles for common questions.
 */

import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  SearchNormal1,
  MessageQuestion,
  Airplane,
  Card,
  Profile2User,
  ShieldTick,
  Notification,
  Setting2,
  ArrowDown2,
  ArrowUp2,
  Message,
  Call,
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

interface FAQCategory {
  id: string;
  title: string;
  icon: any;
  color: string;
}

const FAQ_CATEGORIES: FAQCategory[] = [
  { id: 'getting-started', title: 'Getting Started', icon: Airplane, color: colors.primary },
  { id: 'trips', title: 'Trips & Bookings', icon: Card, color: colors.success },
  { id: 'community', title: 'Community', icon: Profile2User, color: colors.info },
  { id: 'account', title: 'Account & Security', icon: ShieldTick, color: colors.warning },
  { id: 'notifications', title: 'Notifications', icon: Notification, color: colors.error },
  { id: 'settings', title: 'App Settings', icon: Setting2, color: colors.gray500 },
];

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

export default function HelpCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCategoryPress = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to separate page for this topic
    router.push(`/account/help-topic?category=${categoryId}` as any);
  };

  const handleFAQPress = (faqId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleContactSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/account/contact-support' as any);
  };

  // Filter FAQs based on search
  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return FAQ_ITEMS.filter(
      faq => 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const showCategories = !searchQuery.trim();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchNormal1 size={20} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories Grid */}
        {showCategories && (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Browse by Topic</Text>
            <View style={styles.categoriesGrid}>
              {FAQ_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryCard}
                    onPress={() => handleCategoryPress(category.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                      <Icon size={24} color={category.color} variant="Bold" />
                    </View>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* FAQ List - Search Results */}
        {searchQuery.trim() && (
          <View style={styles.faqSection}>
            <Text style={styles.searchResultsText}>
              {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} found
            </Text>
            
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => (
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
              ))
            ) : (
              <View style={styles.noResults}>
                <MessageQuestion size={48} color={colors.gray300} variant="Bulk" />
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsText}>
                  Try different keywords or browse by topic
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Popular Questions */}
        {showCategories && (
          <View style={styles.popularSection}>
            <Text style={styles.sectionTitle}>Popular Questions</Text>
            {FAQ_ITEMS.slice(0, 5).map((faq) => (
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
        )}

        {/* Contact Support Card */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            Our support team is here to assist you with any questions or issues.
          </Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactSupport}
              activeOpacity={0.8}
            >
              <Message size={20} color={colors.white} variant="Bold" />
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  categoriesSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  categoryCard: {
    width: '50%',
    padding: spacing.xs,
  },
  categoryIcon: {
    width: '100%',
    aspectRatio: 2,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  faqSection: {
    marginBottom: spacing.lg,
  },
  searchResultsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
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
  noResults: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noResultsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  noResultsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  popularSection: {
    marginBottom: spacing.lg,
  },
  contactSection: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  contactText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  contactButtons: {
    flexDirection: 'row',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  contactButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
});
