/**
 * SIMILAR ITEMS SECTION ORGANISM
 * 
 * Displays similar/related items based on current item
 * Universal component used across all detail types
 */

import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Location, Star1 } from 'iconsax-react-native';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';
import CachedImage from '@/components/common/CachedImage';

interface SimilarItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  image: string;
  category: string;
}

interface SimilarItemsSectionProps {
  title?: string;
  items: SimilarItem[];
  type: string;
}

export default function SimilarItemsSection({ 
  title = 'You Might Also Like',
  items,
  type 
}: SimilarItemsSectionProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const handleItemPress = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/destinations/[id]' as any, params: { id: itemId } });
  };

  const renderItem = ({ item }: { item: SimilarItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.borderMedium }]}
      onPress={() => handleItemPress(item.id)}
      activeOpacity={0.8}
    >
      <CachedImage uri={item.image} style={[styles.image, { backgroundColor: colors.gray200 }]} />
      
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
        
        <View style={styles.locationRow}>
          <Location size={14} color={colors.textSecondary} variant="Bold" />
          <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>{item.location}</Text>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.ratingRow}>
            <Star1 size={14} color="#F59E0B" variant="Bold" />
            <Text style={[styles.rating, { color: colors.textPrimary }]}>{item.rating}</Text>
          </View>
          <Text style={[styles.category, { color: colors.textSecondary, backgroundColor: colors.gray100 }]}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={200}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 140,
  },
  content: {
    padding: spacing.md,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  location: {
    fontSize: typography.fontSize.xs,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  category: {
    fontSize: typography.fontSize.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
