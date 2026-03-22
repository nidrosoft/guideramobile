/**
 * SECTION RENDERER
 * 
 * Dynamically renders homepage sections based on configuration.
 * This component acts as a router for all section components.
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useHomepageDataSafe } from '@/features/homepage';
import { SectionConfig } from '@/config/sections.config';

// Import all section components
import DealsSection from './sections/DealsSection';
import DestinationsSection from './sections/DestinationsSection';
import PlacesSection from './sections/PlacesSection';
import EventsSection from './sections/EventsSection';
import MustSeeSection from './sections/MustSeeSection';
import EditorChoicesSection from './sections/EditorChoicesSection';
import TrendingSection from './sections/TrendingSection';
import BestDiscoverSection from './sections/BestDiscoverSection';
import BudgetFriendlySection from './sections/BudgetFriendlySection';
import LuxuryEscapesSection from './sections/LuxuryEscapesSection';
import LocalExperiencesSection from './sections/LocalExperiencesSection';
import FamilyFriendlySection from './sections/FamilyFriendlySection';

interface SectionRendererProps {
  section: SectionConfig;
}

export default function SectionRenderer({ section }: SectionRendererProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const homepageData = useHomepageDataSafe();
  const activeCategory = homepageData?.activeCategory ?? 'all';

  const handleViewAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(section.viewAllRoute);
  };

  // Render the appropriate section component based on type
  const renderSectionContent = () => {
    switch (section.componentType) {
      case 'deals':
        return <DealsSection />;
      case 'destinations':
        return <DestinationsSection />;
      case 'places':
        return <PlacesSection />;
      case 'events':
        return <EventsSection />;
      case 'mustSee':
        return <MustSeeSection />;
      case 'editorChoices':
        return <EditorChoicesSection />;
      case 'trending':
        return <TrendingSection />;
      case 'bestDiscover':
        return <BestDiscoverSection />;
      case 'budgetFriendly':
        return <BudgetFriendlySection />;
      case 'luxuryEscapes':
        return <LuxuryEscapesSection />;
      case 'localExperiences':
        return <LocalExperiencesSection />;
      case 'familyFriendly':
        return <FamilyFriendlySection />;
      default:
        return null;
    }
  };

  // Hide entire section (header + content) when category filter empties it
  // Deals section always shows because it contains the CategoryPills
  const isDealsSection = section.componentType === 'deals';
  const isHidden = !isDealsSection 
    && activeCategory !== 'all' 
    && homepageData?.hiddenSections?.has(section.componentType);

  if (isHidden) return null;

  // Conditionally show View All only when section has enough items
  const MIN_ITEMS_FOR_VIEW_ALL = 3;
  const sectionSlugMap: Record<string, string> = {
    deals: 'deals', destinations: 'popular-destinations', places: 'places',
    events: 'events', mustSee: 'must-see', editorChoices: 'editors-choice',
    trending: 'trending', bestDiscover: 'best-discover', budgetFriendly: 'budget-friendly',
    luxuryEscapes: 'luxury-escapes', localExperiences: 'local-experiences', familyFriendly: 'family-friendly',
  };
  const slug = sectionSlugMap[section.componentType];
  const sectionData = slug ? homepageData?.sections?.find(s => s.slug === slug) : null;
  const showViewAll = isDealsSection || !sectionData || (sectionData.items?.length ?? 0) > MIN_ITEMS_FOR_VIEW_ALL;

  return (
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t(section.titleKey, section.title)}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>{t(section.descriptionKey, section.description)}</Text>
        </View>
        {showViewAll ? (
          <TouchableOpacity 
            onPress={handleViewAll}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Section Content */}
      {renderSectionContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
  },
  viewAllText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
