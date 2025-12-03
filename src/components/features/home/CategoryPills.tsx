import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { Building, Tree, Map, Ship, Camera, Cup, ShoppingBag, TicketDiscount } from 'iconsax-react-native';

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
];

export default function CategoryPills() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleCategoryPress = (categoryId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(categoryId);
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
              isSelected && styles.pillSelected,
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
              isSelected && styles.pillTextSelected,
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.xs,
  },
  pillSelected: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  pillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  pillTextSelected: {
    color: colors.white,
  },
});
