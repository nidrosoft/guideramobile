import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft2,
  Add,
  Bag2,
  Drop,
  Cpu,
  Health,
  DocumentText,
  Watch,
  Activity,
  TickCircle,
} from 'iconsax-react-native';
import { spacing, typography, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { PackingCategory, PackingItem } from '../types/packing.types';
import AddItemBottomSheet from '../components/AddItemBottomSheet';
import { packingService } from '@/services/packing.service';
import { useAuth } from '@/context/AuthContext';
import PluginEmptyState from '@/features/trips/components/PluginEmptyState';
import PluginErrorState from '@/features/trips/components/PluginErrorState';

const CATEGORY_INFO = [
  { id: PackingCategory.ESSENTIALS, name: 'Essentials', icon: 'bag', color: '#EF4444' },
  { id: PackingCategory.CLOTHING, name: 'Clothing', icon: 'shirt', color: '#3B82F6' },
  { id: PackingCategory.TOILETRIES, name: 'Toiletries', icon: 'drop', color: '#10B981' },
  { id: PackingCategory.ELECTRONICS, name: 'Electronics', icon: 'cpu', color: '#F59E0B' },
  { id: PackingCategory.HEALTH, name: 'Health & Safety', icon: 'health', color: '#EF4444' },
  { id: PackingCategory.DOCUMENTS, name: 'Documents', icon: 'document', color: '#6366F1' },
  { id: PackingCategory.ACCESSORIES, name: 'Accessories', icon: 'watch', color: '#8B5CF6' },
  { id: PackingCategory.ACTIVITIES, name: 'Activities', icon: 'activity', color: '#EC4899' },
];

export default function PackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = params.tripId as string;
  const { colors, isDark } = useTheme();
  const { showError } = useToast();
  const { profile } = useAuth();
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));
  
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<PackingCategory>>(
    new Set([PackingCategory.ESSENTIALS])
  );
  const [addItemVisible, setAddItemVisible] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await packingService.getItems(tripId);
      setItems(data);
    } catch (err: any) {
      console.error('Failed to load packing items:', err);
      setError(err.message || 'Failed to load packing list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [tripId]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Trip not found</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        <PluginErrorState message={error} onRetry={fetchItems} />
      </View>
    );
  }

  const toggleCategory = (category: PackingCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleItemPacked = async (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const scaleValue = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const newPacked = !item.isPacked;
    setItems(items.map(i =>
      i.id === itemId ? { ...i, isPacked: newPacked } : i
    ));
    try {
      await packingService.togglePacked(itemId, newPacked);
    } catch (err) {
      if (__DEV__) console.warn('Failed to toggle packed:', err);
      setItems(items.map(i =>
        i.id === itemId ? { ...i, isPacked: !newPacked } : i
      ));
      showError('Failed to update item. Please try again.');
    }
  };

  const getCategoryItems = (category: PackingCategory) => {
    return items.filter(item => item.category === category);
  };

  const getCategoryProgress = (category: PackingCategory) => {
    const categoryItems = getCategoryItems(category);
    const packed = categoryItems.filter(item => item.isPacked).length;
    return { packed, total: categoryItems.length };
  };

  const handleAddItem = async (itemName: string, category: PackingCategory, quantity: number) => {
    try {
      const newItem = await packingService.addItem(tripId, profile?.id ?? '', {
        name: itemName,
        category,
        quantity,
      });
      setItems(prev => [...prev, newItem]);
      
      const newExpanded = new Set(expandedCategories);
      newExpanded.add(category);
      setExpandedCategories(newExpanded);
    } catch (err) {
      if (__DEV__) console.warn('Failed to add packing item:', err);
      showError('Failed to add item. Please try again.');
    }
  };

  const totalItems = items.length;
  const packedItems = items.filter(item => item.isPacked).length;
  const progressPercentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
  const unpackedCount = totalItems - packedItems;

  const renderCategoryIcon = (iconName: string, color: string) => {
    const iconProps = { size: 24, color, variant: 'Bold' as const };
    switch (iconName) {
      case 'bag': return <Bag2 {...iconProps} />;
      case 'shirt': return <Bag2 {...iconProps} />;
      case 'drop': return <Drop {...iconProps} />;
      case 'cpu': return <Cpu {...iconProps} />;
      case 'health': return <Health {...iconProps} />;
      case 'document': return <DocumentText {...iconProps} />;
      case 'watch': return <Watch {...iconProps} />;
      case 'activity': return <Activity {...iconProps} />;
      default: return <Bag2 {...iconProps} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgPrimary} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft2 size={24} color={colors.textPrimary} variant="Linear" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Packing List</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setAddItemVisible(true)}
          >
            <Add size={24} color={colors.primary} variant="Bold" />
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <PluginEmptyState
            headerTitle="Packing List"
            icon={<Bag2 size={36} color="#F59E0B" variant="Bold" />}
            iconColor="#F59E0B"
            title="Suitcase Looking Empty"
            subtitle={`Your AI-curated packing list for ${trip?.destination?.city || 'your trip'} hasn't been created yet. Tap "Generate Smart Plan" on your trip card and we'll pack your bags with weather-smart essentials.`}
            ctaLabel="Go to Trip Card"
            hideHeader
          />
        ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Card */}
          <View style={[styles.progressCard, { backgroundColor: colors.bgCard }]}>
            <View style={styles.progressHeader}>
              <View style={styles.progressIconContainer}>
                <Bag2 size={24} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.progressTextContainer}>
                <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>Check Your Packing List</Text>
                <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                  You have {unpackedCount} unpacked {unpackedCount === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </View>

            {/* Gradient Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarBackground, { backgroundColor: colors.borderMedium }]}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryGradient, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
                />
              </View>
              <View style={styles.progressStats}>
                <Text style={[styles.progressPercentage, { color: colors.primary }]}>{progressPercentage}%</Text>
                <Text style={[styles.progressCount, { color: colors.textSecondary }]}>
                  {packedItems} of {totalItems} items packed
                </Text>
              </View>
            </View>
          </View>

          {/* Categories */}
          <View style={styles.categoriesSection}>
            {CATEGORY_INFO.map(categoryInfo => {
              const categoryItems = getCategoryItems(categoryInfo.id);
              if (categoryItems.length === 0) return null;

              const { packed, total } = getCategoryProgress(categoryInfo.id);
              const isExpanded = expandedCategories.has(categoryInfo.id);

              return (
                <View key={categoryInfo.id} style={[styles.categoryCard, { backgroundColor: colors.bgCard }]}>
                  {/* Category Header */}
                  <TouchableOpacity
                    style={styles.categoryHeader}
                    onPress={() => toggleCategory(categoryInfo.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryIconContainer, { backgroundColor: `${categoryInfo.color}15` }]}>
                        {renderCategoryIcon(categoryInfo.icon, categoryInfo.color)}
                      </View>
                      <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{categoryInfo.name}</Text>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={[styles.categoryProgress, { color: colors.textSecondary }]}>
                        {packed}/{total}
                      </Text>
                      <Text style={[styles.categoryArrow, { color: colors.textTertiary }]}>{isExpanded ? '▼' : '▶'}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Category Items */}
                  {isExpanded && (
                    <View style={styles.categoryItems}>
                      {categoryItems.map(item => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.itemRow}
                          onPress={() => toggleItemPacked(item.id)}
                          activeOpacity={0.7}
                        >
                          {/* Checkbox */}
                          <View style={[
                            styles.checkbox,
                            { borderColor: colors.borderMedium },
                            item.isPacked && styles.checkboxChecked,
                            item.isOptional && styles.checkboxOptional,
                          ]}>
                            {item.isPacked && (
                              <TickCircle size={20} color={colors.white} variant="Bold" />
                            )}
                          </View>

                          {/* Item Info */}
                          <View style={styles.itemInfo}>
                            <View style={styles.itemHeader}>
                              <Text style={[
                                styles.itemName,
                                { color: colors.textPrimary },
                                item.isPacked && [styles.itemNamePacked, { color: colors.textTertiary }],
                              ]}>
                                {item.name}
                                {item.quantity > 1 && (
                                  <Text style={styles.itemQuantity}> ({item.quantity}x)</Text>
                                )}
                              </Text>
                              {item.isSuggested && (
                                <View style={styles.suggestedBadge}>
                                  <Text style={styles.suggestedText}>Suggested</Text>
                                </View>
                              )}
                            </View>
                            {item.notes && (
                              <Text style={[styles.itemNotes, { color: colors.textTertiary }]}>{item.notes}</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
        )}

        {/* Add Item Bottom Sheet */}
        <AddItemBottomSheet
          visible={addItemVisible}
          onClose={() => setAddItemVisible(false)}
          onAdd={handleAddItem}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(63, 195, 158, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  progressCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(63, 195, 158, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  progressTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  progressBarContainer: {
    marginTop: spacing.sm,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  progressPercentage: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  progressCount: {
    fontSize: typography.fontSize.sm,
  },
  categoriesSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  categoryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryProgress: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  categoryArrow: {
    fontSize: 12,
  },
  categoryItems: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxOptional: {
    borderStyle: 'dashed',
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  itemName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  itemNamePacked: {
    textDecorationLine: 'line-through',
  },
  itemQuantity: {
    fontSize: typography.fontSize.xs,
  },
  suggestedBadge: {
    backgroundColor: 'rgba(63, 195, 158, 0.08)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  suggestedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  itemNotes: {
    fontSize: typography.fontSize.xs,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Empty State
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  emptyCta: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: 20,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
});
