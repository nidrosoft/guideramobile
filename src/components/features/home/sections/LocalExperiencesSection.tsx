/**
 * LOCAL EXPERIENCES SECTION
 * 
 * Displays real local experiences from Viator based on user's detected city.
 * Uses useLocalExperiences hook for location-aware data fetching.
 */

import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import LocalExperienceCard from '@/components/features/home/LocalExperienceCard';
import { useLocalExperiences } from '@/hooks/useLocalExperiences';
import { useHomepageDataSafe, matchesCategory, useSectionVisibility } from '@/features/homepage';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { spacing, typography } from '@/styles';
import { SkeletonLocalExperienceCards } from '@/components/common/SkeletonLoader';

export default function LocalExperiencesSection() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const homepageCtx = useHomepageDataSafe();
  const { experiences, city, usedFallback, isLoading, error, refresh } = useLocalExperiences({
    limit: 8,
    cityOverride: profile?.city || undefined,
  });

  // Re-fetch when homepage pull-to-refresh triggers
  const lastRefreshKey = useRef(homepageCtx?.refreshKey ?? 0);
  useEffect(() => {
    const currentKey = homepageCtx?.refreshKey ?? 0;
    if (currentKey > lastRefreshKey.current) {
      lastRefreshKey.current = currentKey;
      refresh();
    }
  }, [homepageCtx?.refreshKey, refresh]);

  const handleCardPress = useCallback((productCode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/local-experiences/[id]' as any, params: { id: productCode } });
  }, [router]);

  const activeCategory = homepageCtx?.activeCategory ?? 'all';
  const filteredExperiences = useMemo(() => {
    if (activeCategory === 'all') return experiences;
    return experiences.filter(exp =>
      matchesCategory({ title: exp.title, category: exp.category, tags: [exp.category] }, activeCategory)
    );
  }, [experiences, activeCategory]);
  useSectionVisibility('localExperiences', filteredExperiences.length);

  // Loading state
  if (isLoading) {
    return <SkeletonLocalExperienceCards />;
  }

  // Error or no raw data at all
  if (error || experiences.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {error || (city ? `No experiences found in ${city}` : 'Enable location to see nearby experiences')}
        </Text>
      </View>
    );
  }

  // Category filter produced no matches — hide entire section
  if (filteredExperiences.length === 0) return null;

  return (
    <View>
      {usedFallback && city ? (
        <Text style={[styles.nearbyLabel, { color: colors.textSecondary }]}>
          Near {city}
        </Text>
      ) : null}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.localContainer}
      >
        {filteredExperiences.map((exp, index) => (
          <TouchableOpacity key={`${exp.id}-${index}`} activeOpacity={0.8} onPress={() => handleCardPress(exp.productCode)}>
            <LocalExperienceCard
              id={exp.id}
              title={exp.title}
              imageUrl={exp.heroImage}
              category={exp.category}
              duration={exp.duration.formatted}
              rating={exp.rating.score}
              reviewCount={exp.rating.reviewCount}
              price={exp.price.formatted}
              originalPrice={
                exp.price.originalPrice && exp.price.originalPrice > exp.price.amount
                  ? `$${Math.round(exp.price.originalPrice)}`
                  : undefined
              }
              discountPercent={
                exp.price.discountPercent && exp.price.discountPercent > 0
                  ? exp.price.discountPercent
                  : undefined
              }
              freeCancellation={exp.freeCancellation}
              instantConfirmation={exp.instantConfirmation}
              city={exp.location.city}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  localContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  nearbyLabel: {
    fontSize: typography.fontSize.xs,
    paddingHorizontal: spacing.lg,
    marginBottom: 6,
  },
  emptyContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});
