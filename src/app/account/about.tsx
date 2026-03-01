/**
 * ABOUT GUIDERA SCREEN
 * 
 * The story behind Guidera - from idea to product.
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Global,
  Heart,
  People,
  Map1,
  Star1,
  Airplane,
  Instagram,
  Link21,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

const CORE_VALUES = [
  { icon: Heart, title: 'Authentic Experiences', description: 'We believe travel should be about genuine connections and cultural immersion, not tourist traps.' },
  { icon: People, title: 'Community First', description: 'Our community of verified travelers helps each other discover hidden gems and stay safe.' },
  { icon: Map1, title: 'Smart Planning', description: 'AI-powered recommendations that learn your preferences and adapt to your travel style.' },
  { icon: Global, title: 'Global Perspective', description: 'Built for travelers worldwide, with cultural sensitivity and local insights at our core.' },
];

const MILESTONES = [
  { year: '2016', title: 'The Spark', description: 'Moved to the U.S. and experienced the challenges of adapting to new cultures firsthand.' },
  { year: '2019', title: 'Digital Nomad Life', description: 'Years of traveling revealed a gap: no app truly understood the modern traveler\'s needs.' },
  { year: '2023', title: 'Guidera Born', description: 'Combined product engineering expertise with travel passion to build the app we wished existed.' },
  { year: '2024', title: 'Community Launch', description: 'Launched with a focus on verified travelers and authentic cultural experiences.' },
];

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleOpenLink = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={tc.textPrimary === colors.textPrimary ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Guidera</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Airplane size={48} color={colors.primary} variant="Bold" />
          </View>
          <Text style={styles.appName}>Guidera</Text>
          <Text style={styles.tagline}>Your Intelligent Travel Companion</Text>
          <Text style={styles.version}>Version {APP_VERSION} ({BUILD_NUMBER})</Text>
        </View>

        {/* The Story */}
        <View style={styles.storySection}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          
          <Text style={styles.storyText}>
            Eight years ago, I packed my bags and moved from West Africa to the United States. 
            What I thought would be a simple transition turned into a profound lesson in cultural 
            adaptation. Every city had its unwritten rules, every neighborhood its hidden gems 
            that no guidebook mentioned.
          </Text>
          
          <Text style={styles.storyText}>
            As a product engineer who became a digital nomad, I traveled extensively—experiencing 
            the same challenges in Tokyo, Barcelona, Cape Town, and beyond. I'd arrive in a new 
            city and spend hours researching: What's the local etiquette? Where do locals actually 
            eat? Is this neighborhood safe at night? How do I navigate public transit?
          </Text>
          
          <Text style={styles.storyText}>
            Existing travel apps felt like digital brochures—great for booking flights and hotels, 
            but missing the soul of travel. They couldn't tell me that in Japan, you don't tip. 
            They couldn't warn me about the pickpocket hotspots in Barcelona. They couldn't 
            connect me with a local who'd show me the real city.
          </Text>
          
          <Text style={styles.storyHighlight}>
            That's when Guidera was born.
          </Text>
          
          <Text style={styles.storyText}>
            We built Guidera to be the travel companion we wished we had—one that combines 
            AI-powered personalization with authentic local knowledge. An app that doesn't just 
            help you book a trip, but helps you truly experience a destination.
          </Text>
          
          <Text style={styles.storyText}>
            Our community of verified travelers shares real insights, warns about scams, 
            recommends hidden gems, and sometimes even meets up for coffee. Because the best 
            travel experiences come from human connections, not algorithms alone.
          </Text>
          
          <Text style={styles.storySignature}>
            — The Guidera Team
          </Text>
        </View>

        {/* Core Values */}
        <View style={styles.valuesSection}>
          <Text style={styles.sectionTitle}>What We Believe</Text>
          
          {CORE_VALUES.map((value, index) => {
            const Icon = value.icon;
            return (
              <View key={index} style={styles.valueCard}>
                <View style={styles.valueIcon}>
                  <Icon size={24} color={colors.primary} variant="Bold" />
                </View>
                <View style={styles.valueContent}>
                  <Text style={styles.valueTitle}>{value.title}</Text>
                  <Text style={styles.valueDescription}>{value.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Our Journey</Text>
          
          <View style={styles.timeline}>
            {MILESTONES.map((milestone, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                {index < MILESTONES.length - 1 && <View style={styles.timelineLine} />}
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineYear}>{milestone.year}</Text>
                  <Text style={styles.timelineTitle}>{milestone.title}</Text>
                  <Text style={styles.timelineDescription}>{milestone.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Mission Statement */}
        <View style={styles.missionSection}>
          <Star1 size={32} color={colors.primary} variant="Bold" />
          <Text style={styles.missionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            To empower every traveler to explore the world with confidence, cultural awareness, 
            and authentic connections—making travel more accessible, safe, and meaningful for everyone.
          </Text>
        </View>

        {/* Connect Section */}
        <View style={styles.connectSection}>
          <Text style={styles.connectTitle}>Connect With Us</Text>
          
          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleOpenLink('https://guidera.app')}
              activeOpacity={0.7}
            >
              <Global size={20} color={colors.primary} variant="Bold" />
              <Text style={styles.socialText}>guidera.app</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleOpenLink('https://instagram.com/guideraapp')}
              activeOpacity={0.7}
            >
              <Instagram size={20} color={colors.primary} variant="Bold" />
              <Text style={styles.socialText}>@guideraapp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for travelers worldwide</Text>
          <Text style={styles.copyright}>© {new Date().getFullYear()} Guidera. All rights reserved.</Text>
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  version: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginTop: spacing.sm,
  },
  storySection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  storyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 26,
    marginBottom: spacing.md,
  },
  storyHighlight: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    fontStyle: 'italic',
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  storySignature: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'right',
  },
  valuesSection: {
    marginBottom: spacing.xl,
  },
  valueCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  valueIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  valueDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  timelineSection: {
    marginBottom: spacing.xl,
  },
  timeline: {
    paddingLeft: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: spacing.lg,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
    marginTop: 4,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    bottom: 0,
    width: 2,
    backgroundColor: colors.gray200,
  },
  timelineContent: {
    flex: 1,
  },
  timelineYear: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  missionSection: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  missionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  missionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  connectSection: {
    marginBottom: spacing.xl,
  },
  connectTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  socialText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  copyright: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
  },
});
