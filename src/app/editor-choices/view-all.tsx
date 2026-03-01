import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '@/styles';
import { ArrowLeft } from 'iconsax-react-native';
import FilterPills from '@/components/common/FilterPills';
import FilterBottomSheet, { FilterState } from '@/components/common/FilterBottomSheet';
import EditorChoiceViewCard from '@/components/features/editorChoices/EditorChoiceViewCard';
import { editorChoicesViewData, editorChoicesFilters } from '@/data/editorChoicesView';

export default function ViewAllEditorChoices() {
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

  const handleChoicePress = (choiceId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Editor choice pressed:', choiceId);
  };

  const handleApplyFilters = (filters: FilterState) => {
    setAppliedFilters(filters);
    console.log('Filters applied:', filters);
  };

  // Filter choices based on selected category
  const filteredChoices = selectedFilter === 'all' 
    ? editorChoicesViewData 
    : editorChoicesViewData;

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
          <Text style={styles.headerTitle}>Editor's Choices</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Section Title */}
          <Text style={styles.sectionTitle}>Handpicked by Our Experts</Text>

          {/* Filter Pills */}
          <FilterPills
            filters={editorChoicesFilters}
            selectedFilter={selectedFilter}
            onFilterSelect={handleFilterSelect}
            onFilterPress={() => setIsFilterSheetVisible(true)}
          />

          {/* Choices List */}
          <View style={styles.choicesList}>
            {filteredChoices.map((choice) => (
              <EditorChoiceViewCard
                key={choice.id}
                name={choice.name}
                location={choice.location}
                reason={choice.reason}
                rating={choice.rating}
                imageUrl={choice.imageUrl}
                onPress={() => handleChoicePress(choice.id)}
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
  choicesList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
  },
});
