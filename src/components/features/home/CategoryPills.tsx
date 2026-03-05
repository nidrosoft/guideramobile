import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useHomepageDataSafe } from '@/features/homepage';
import { Building, Tree, Map, Ship, Camera, Cup, ShoppingBag, TicketDiscount, People, Lovely, Courthouse, Moon, Health, RouteSquare, Heart, Medal } from 'iconsax-react-native';

const categories = [
  { id: 'all', name: 'All', icon: null },
  { id: 'museum', name: 'Museum', icon: Building },
  { id: 'safari', name: 'Safari', icon: Tree },
  { id: 'mountain', name: 'Mountain', icon: Map },
  { id: 'beach', name: 'Beach', icon: Ship },
  { id: 'adventure', name: 'Adventure', icon: Camera },
  { id: 'food', name: 'Food', icon: Cup },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag },
  { id: 'events', name: 'Events', icon: TicketDiscount },
  { id: 'family', name: 'Family', icon: People },
  { id: 'nature', name: 'Nature', icon: Lovely },
  { id: 'historical', name: 'Historical', icon: Courthouse },
  { id: 'nightlife', name: 'Nightlife', icon: Moon },
  { id: 'wellness', name: 'Wellness', icon: Health },
  { id: 'tours', name: 'Tours', icon: RouteSquare },
  { id: 'romantic', name: 'Romantic', icon: Heart },
  { id: 'sports', name: 'Sports', icon: Medal },
];

export default function CategoryPills() {
  const { colors } = useTheme();
  const homepageData = useHomepageDataSafe();
  const selectedCategory = homepageData?.activeCategory ?? 'all';

  const handleCategoryPress = (categoryId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    homepageData?.setActiveCategory(categoryId);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id;
        const Icon = category.icon;

        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.pill,
              { backgroundColor: isSelected ? colors.primary : colors.bgCard, borderColor: isSelected ? colors.primary : colors.borderSubtle },
            ]}
            onPress={() => handleCategoryPress(category.id)}
          >
            {Icon && (
              <Icon
                size={18}
                color={isSelected ? colors.white : colors.textPrimary}
                variant="Outline"
              />
            )}
            <Text style={[
              styles.pillText,
              { color: isSelected ? colors.white : colors.textPrimary },
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.xs,
  },
  pillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
