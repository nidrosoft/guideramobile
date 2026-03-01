import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '@/styles';
import { ArrowLeft } from 'iconsax-react-native';
import FilterPills from '@/components/common/FilterPills';
import FilterBottomSheet, { FilterState } from '@/components/common/FilterBottomSheet';
import MustSeeViewCard from '@/components/features/mustSee/MustSeeViewCard';
import { mustSeeViewData, mustSeeFilters } from '@/data/mustSeeView';

export default function ViewAllMustSee() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    arrange: 'aToZ',
    timeline: 'newest',
    package: 'adultOnly',
  });

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleFilterSelect = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(filterId);
  };

  const handleAttractionPress = (attractionId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Attraction pressed:', attractionId);
  };

  const handleApplyFilters = (filters: FilterState) => {
    setAppliedFilters(filters);
    console.log('Filters applied:', filters);
  };

  // Filter attractions based on selected category
  const filteredAttractions = selectedFilter === 'all' 
    ? mustSeeViewData 
    : mustSeeViewData.filter(attraction => {
        if (selectedFilter === 'landmark') return attraction.category === 'Landmark';
        if (selectedFilter === 'historical') return attraction.category.includes('Historical');
        if (selectedFilter === 'unesco') return attraction.badge === 'UNESCO';
        return true;
      });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Must See</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Section Title */}
          <Text style={styles.sectionTitle}>World's Top Attractions</Text>

          {/* Filter Pills */}
          <FilterPills
            filters={mustSeeFilters}
            selectedFilter={selectedFilter}
            onFilterSelect={handleFilterSelect}
            onFilterPress={() => setIsFilterSheetVisible(true)}
          />

          {/* Attractions List */}
          <View style={styles.attractionsList}>
            {filteredAttractions.map((attraction) => (
              <MustSeeViewCard
                key={attraction.id}
                name={attraction.name}
                location={attraction.location}
                rating={attraction.rating}
                visitors={attraction.visitors}
                category={attraction.category}
                imageUrl={attraction.imageUrl}
                badge={attraction.badge}
                onPress={() => handleAttractionPress(attraction.id)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Filter Bottom Sheet */}
        <FilterBottomSheet
          visible={isFilterSheetVisible}
          onClose={() => setIsFilterSheetVisible(false)}
          onApply={handleApplyFilters}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  attractionsList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
  },
});
