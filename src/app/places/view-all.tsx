import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '@/styles';
import { ArrowLeft } from 'iconsax-react-native';
import FilterPills from '@/components/common/FilterPills';
import FilterBottomSheet, { FilterState } from '@/components/common/FilterBottomSheet';
import PlaceViewCard from '@/components/features/places/PlaceViewCard';
import { placesViewData, placeFilters } from '@/data/placesView';

export default function ViewAllPlaces() {
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

  const handlePlacePress = (placeId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Place pressed:', placeId);
  };

  const handleApplyFilters = (filters: FilterState) => {
    setAppliedFilters(filters);
    console.log('Filters applied:', filters);
  };

  // Filter places based on selected category
  const filteredPlaces = selectedFilter === 'all' 
    ? placesViewData 
    : placesViewData.filter(place => place.category === selectedFilter);

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
          <Text style={styles.headerTitle}>Popular Places</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Section Title */}
          <Text style={styles.sectionTitle}>Discover Amazing Places</Text>

          {/* Filter Pills */}
          <FilterPills
            filters={placeFilters}
            selectedFilter={selectedFilter}
            onFilterSelect={handleFilterSelect}
            onFilterPress={() => setIsFilterSheetVisible(true)}
          />

          {/* Places Grid - 2 Columns */}
          <View style={styles.placesGrid}>
            {filteredPlaces.map((place, index) => {
              const isLeft = index % 2 === 0;
              return (
                <View 
                  key={place.id} 
                  style={[
                    styles.gridItem,
                    isLeft ? styles.gridItemLeft : styles.gridItemRight
                  ]}
                >
                  <PlaceViewCard
                    name={place.name}
                    country={place.country}
                    visitors={place.visitors}
                    rating={place.rating}
                    imageUrl={place.imageUrl}
                    onPress={() => handlePlacePress(place.id)}
                  />
                </View>
              );
            })}
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
  placesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  gridItem: {
    width: '50%',
    marginBottom: spacing.md,
  },
  gridItemLeft: {
    paddingRight: spacing.xs,
  },
  gridItemRight: {
    paddingLeft: spacing.xs,
  },
});
