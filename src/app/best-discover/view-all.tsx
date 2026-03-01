import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '@/styles';
import { ArrowLeft } from 'iconsax-react-native';
import FilterPills from '@/components/common/FilterPills';
import FilterBottomSheet, { FilterState } from '@/components/common/FilterBottomSheet';
import BestDiscoverViewCard from '@/components/features/bestDiscover/BestDiscoverViewCard';
import { bestDiscoverViewData, bestDiscoverFilters } from '@/data/bestDiscoverView';

export default function ViewAllBestDiscover() {
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

  const handleDiscoverPress = (discoverId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Discovery pressed:', discoverId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Best Discover</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Hidden Gems & Discoveries</Text>
          <FilterPills filters={bestDiscoverFilters} selectedFilter={selectedFilter} onFilterSelect={handleFilterSelect} onFilterPress={() => setIsFilterSheetVisible(true)} />
          <View style={styles.discoverList}>
            {bestDiscoverViewData.map((discover) => (
              <BestDiscoverViewCard key={discover.id} name={discover.name} category={discover.category} rating={discover.rating} location={discover.location} price={discover.price} duration={discover.duration} bestFor={discover.bestFor} imageUrl={discover.imageUrl} onPress={() => handleDiscoverPress(discover.id)} />
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
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  sectionTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.textPrimary, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  discoverList: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing['2xl'] },
});
