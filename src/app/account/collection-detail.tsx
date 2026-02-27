/**
 * COLLECTION DETAIL SCREEN
 * 
 * View items within a specific collection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Heart, Location, Building, Airplane, Activity, PercentageSquare, Map1, More } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { savedService, SavedItem, SavedItemType } from '@/services/saved.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - CARD_GAP) / 2;

const TYPE_ICONS: Record<SavedItemType, any> = {
  destination: Location,
  hotel: Building,
  flight: Airplane,
  experience: Activity,
  deal: PercentageSquare,
  trip: Map1,
};

const TYPE_COLORS: Record<SavedItemType, string> = {
  destination: colors.primary,
  hotel: colors.info,
  flight: colors.warning,
  experience: colors.success,
  deal: colors.error,
  trip: colors.primary,
};

export default function CollectionDetailScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { user } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch items in collection
  const fetchItems = useCallback(async () => {
    if (!user?.id || !id) return;
    
    try {
      const { data, error } = await savedService.getSavedItemsByCollection(user.id, id);
      
      if (error) {
        console.error('Error fetching collection items:', error);
        return;
      }
      
      setItems(data || []);
    } catch (error) {
      console.error('Error in fetchItems:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, [fetchItems]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleRemoveFromCollection = async (itemId: string) => {
    Alert.alert(
      'Remove from Collection',
      'Remove this item from the collection? The item will still be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const { error } = await savedService.moveToCollection(itemId, null);
            if (!error) {
              setItems(prev => prev.filter(item => item.id !== itemId));
            }
          },
        },
      ]
    );
  };

  const handleItemPress = (item: SavedItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Item pressed:', item);
  };

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < items.length; i += 2) {
      const item1 = items[i];
      const item2 = items[i + 1];
      
      rows.push(
        <View key={i} style={styles.gridRow}>
          <SavedItemCard 
            item={item1} 
            onPress={() => handleItemPress(item1)}
            onRemove={() => handleRemoveFromCollection(item1.id)}
          />
          {item2 && (
            <SavedItemCard 
              item={item2} 
              onPress={() => handleItemPress(item2)}
              onRemove={() => handleRemoveFromCollection(item2.id)}
            />
          )}
        </View>
      );
    }
    return rows;
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{name || 'Collection'}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <More size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={48} color={colors.gray300} variant="Bold" />
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptyText}>
              Add items to this collection from your saved items
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.itemCount}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Text>
            {renderGridItems()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Saved Item Card Component
interface SavedItemCardProps {
  item: SavedItem;
  onPress: () => void;
  onRemove: () => void;
}

function SavedItemCard({ item, onPress, onRemove }: SavedItemCardProps) {
  const TypeIcon = TYPE_ICONS[item.type] || Heart;
  const typeColor = TYPE_COLORS[item.type] || colors.primary;
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Image 
        source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400' }} 
        style={styles.cardImage} 
      />
      
      {/* Type Badge */}
      <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
        <TypeIcon size={12} color={colors.white} variant="Bold" />
      </View>
      
      {/* Remove Button */}
      <TouchableOpacity style={styles.heartButton} onPress={onRemove}>
        <Heart size={18} color={colors.error} variant="Bold" />
      </TouchableOpacity>
      
      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        {item.subtitle && (
          <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  itemCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    backgroundColor: colors.gray100,
  },
  typeBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    padding: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
