import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '@/styles';
import { ArrowLeft } from 'iconsax-react-native';
import FilterPills from '@/components/common/FilterPills';
import FilterBottomSheet, { FilterState } from '@/components/common/FilterBottomSheet';
import LocalExperienceViewCard from '@/components/features/localExperiences/LocalExperienceViewCard';
import { localExperiencesViewData, localExperiencesFilters } from '@/data/localExperiencesView';

export default function ViewAllLocalExperiences() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleFilterSelect = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(filterId);
  };

  const handleExperiencePress = (expId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Experience pressed:', expId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Local Experiences</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Unique Local Activities</Text>
          <FilterPills filters={localExperiencesFilters} selectedFilter={selectedFilter} onFilterSelect={handleFilterSelect} onFilterPress={() => setIsFilterSheetVisible(true)} />
          <View style={styles.experiencesList}>
            {localExperiencesViewData.map((exp) => (
              <LocalExperienceViewCard key={exp.id} title={exp.title} hostName={exp.hostName} hostImage={exp.hostImage} category={exp.category} duration={exp.duration} groupSize={exp.groupSize} price={exp.price} rating={exp.rating} distance={exp.distance} imageUrl={exp.imageUrl} isNearby={exp.isNearby} onPress={() => handleExperiencePress(exp.id)} />
            ))}
          </View>
        </ScrollView>
        <FilterBottomSheet visible={isFilterSheetVisible} onClose={() => setIsFilterSheetVisible(false)} onApply={() => {}} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  sectionTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.textPrimary, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  experiencesList: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing['2xl'] },
});
