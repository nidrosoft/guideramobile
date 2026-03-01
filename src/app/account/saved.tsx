/**
 * SAVED ITEMS SCREEN
 * 
 * User's saved destinations, hotels, deals, etc.
 * Connected to Supabase with grid layout.
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
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, Location, Building, Airplane, Activity, PercentageSquare, Map1 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { savedService, SavedItem, SavedItemType } from '@/services/saved.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - CARD_GAP) / 2;

const FILTER_TABS = [
  { label: 'All', value: 'all' as const },
  { label: 'Destinations', value: 'destination' as SavedItemType },
  { label: 'Hotels', value: 'hotel' as SavedItemType },
  { label: 'Flights', value: 'flight' as SavedItemType },
  { label: 'Experiences', value: 'experience' as SavedItemType },
  { label: 'Deals', value: 'deal' as SavedItemType },
];

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

export default function SavedScreen() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<SavedItemType | 'all'>('all');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch saved items
  const fetchSavedItems = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const filterType = activeFilter === 'all' ? undefined : activeFilter;
      const { data, error } = await savedService.getSavedItems(user.id, filterType);
      
      if (error) {
        console.error('Error fetching saved items:', error);
        return;
      }
      
      setSavedItems(data || []);
    } catch (error) {
      console.error('Error in fetchSavedItems:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, activeFilter]);

  useEffect(() => {
    fetchSavedItems();
  }, [fetchSavedItems]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSavedItems();
  }, [fetchSavedItems]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleRemove = async (id: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this saved item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const { error } = await savedService.removeSavedItem(id);
            if (!error) {
              setSavedItems(prev => prev.filter(item => item.id !== id));
            }
          },
        },
      ]
    );
  };

  const handleItemPress = (item: SavedItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to detail based on type
    // For now, just log - can be expanded later
    console.log('Item pressed:', item);
  };

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < savedItems.length; i += 2) {
      const item1 = savedItems[i];
      const item2 = savedItems[i + 1];
      
      rows.push(
        <View key={i} style={styles.gridRow}>
          <SavedItemCard 
            item={item1} 
            onPress={() => handleItemPress(item1)}
            onRemove={() => handleRemove(item1.id)}
          />
          {item2 && (
            <SavedItemCard 
              item={item2} 
              onPress={() => handleItemPress(item2)}
              onRemove={() => handleRemove(item2.id)}
            />
          )}
        </View>
      );
    }
    return rows;
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.background }]}>
      <StatusBar style={tc.textPrimary === colors.textPrimary ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: tc.textPrimary }]}>Saved Items</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Filter Tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab.value}
              style={[
                styles.filterTab,
                activeFilter === tab.value && styles.filterTabActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(tab.value);
              }}
            >
              <Text style={[
                styles.filterText,
                activeFilter === tab.value && styles.filterTextActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
        ) : savedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={48} color={colors.gray300} variant="Bold" />
            <Text style={styles.emptyTitle}>No saved items</Text>
            <Text style={styles.emptyText}>
              Items you save will appear here
            </Text>
          </View>
        ) : (
          renderGridItems()
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
      
      {/* Heart Button */}
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
    backgroundColor: colors.bgElevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  filterWrapper: {
    backgroundColor: colors.bgElevated,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  gridRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
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
    backgroundColor: colors.bgElevated,
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
