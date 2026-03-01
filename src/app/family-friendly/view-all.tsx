import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '@/styles';
import { ArrowLeft } from 'iconsax-react-native';
import FilterPills from '@/components/common/FilterPills';
import FilterBottomSheet, { FilterState } from '@/components/common/FilterBottomSheet';
import FamilyFriendlyViewCard from '@/components/features/familyFriendly/FamilyFriendlyViewCard';
import { familyFriendlyViewData, familyFriendlyFilters } from '@/data/familyFriendlyView';

export default function ViewAllFamilyFriendly() {
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

  const handlePlacePress = (placeId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Family place pressed:', placeId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Family Friendly</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Perfect for Families</Text>
          <FilterPills filters={familyFriendlyFilters} selectedFilter={selectedFilter} onFilterSelect={handleFilterSelect} onFilterPress={() => setIsFilterSheetVisible(true)} />
          <View style={styles.placesList}>
            {familyFriendlyViewData.map((place) => (
              <FamilyFriendlyViewCard key={place.id} name={place.name} location={place.location} rating={place.rating} reviews={place.reviews} distance={place.distance} ageRange={place.ageRange} activities={place.activities} safetyRating={place.safetyRating} imageUrl={place.imageUrl} onPress={() => handlePlacePress(place.id)} />
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
  placesList: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing['2xl'] },
});
