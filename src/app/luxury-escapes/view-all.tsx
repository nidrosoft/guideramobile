import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '@/styles';
import { ArrowLeft } from 'iconsax-react-native';
import FilterPills from '@/components/common/FilterPills';
import FilterBottomSheet, { FilterState } from '@/components/common/FilterBottomSheet';
import LuxuryEscapeViewCard from '@/components/features/luxuryEscapes/LuxuryEscapeViewCard';
import { luxuryEscapesViewData, luxuryEscapesFilters } from '@/data/luxuryEscapesView';

export default function ViewAllLuxuryEscapes() {
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

  const handleEscapePress = (escapeId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Luxury escape pressed:', escapeId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Luxury Escapes</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Premium Experiences</Text>
          <FilterPills filters={luxuryEscapesFilters} selectedFilter={selectedFilter} onFilterSelect={handleFilterSelect} onFilterPress={() => setIsFilterSheetVisible(true)} />
          <View style={styles.escapesList}>
            {luxuryEscapesViewData.map((escape) => (
              <LuxuryEscapeViewCard key={escape.id} name={escape.name} location={escape.location} rating={escape.rating} price={escape.price} duration={escape.duration} category={escape.category} imageUrl={escape.imageUrl} onPress={() => handleEscapePress(escape.id)} />
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
  escapesList: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing['2xl'] },
});
