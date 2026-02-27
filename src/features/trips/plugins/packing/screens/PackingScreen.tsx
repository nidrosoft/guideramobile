import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
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
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { PackingCategory, PackingItem } from '../types/packing.types';
import AddItemBottomSheet from '../components/AddItemBottomSheet';

// AI-Generated Packing Lists by Trip (Claude Opus 4.5)
const COLOMBIA_PACKING_ITEMS: PackingItem[] = [
  // Documents & Essentials - Critical for Colombia
  { id: 'col-1', name: 'Passport (valid 6+ months)', category: PackingCategory.ESSENTIALS, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'US citizens get 90-day visa-free entry' },
  { id: 'col-2', name: 'Flight Confirmation (Avianca)', category: PackingCategory.ESSENTIALS, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: 'col-3', name: 'Hotel Reservations Printed', category: PackingCategory.ESSENTIALS, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Immigration may ask for proof' },
  { id: 'col-4', name: 'Travel Insurance Documents', category: PackingCategory.ESSENTIALS, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: 'col-5', name: 'Credit Cards (Visa/Mastercard)', category: PackingCategory.ESSENTIALS, quantity: 2, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Notify bank of travel dates' },
  { id: 'col-6', name: 'Colombian Pesos (Cash)', category: PackingCategory.ESSENTIALS, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Withdraw from ATMs - better rates' },
  { id: 'col-7', name: 'Copy of Passport', category: PackingCategory.ESSENTIALS, quantity: 2, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Keep separate from original' },
  
  // Clothing - Layered for altitude changes
  { id: 'col-8', name: 'Lightweight T-shirts', category: PackingCategory.CLOTHING, quantity: 6, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Quick-dry for Cartagena heat' },
  { id: 'col-9', name: 'Long Pants (Hiking)', category: PackingCategory.CLOTHING, quantity: 2, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'For Cocora Valley hike' },
  { id: 'col-10', name: 'Shorts', category: PackingCategory.CLOTHING, quantity: 3, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Cartagena is hot & humid' },
  { id: 'col-11', name: 'Warm Fleece/Jacket', category: PackingCategory.CLOTHING, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Bogota is cool (8-18°C)' },
  { id: 'col-12', name: 'Rain Jacket (Packable)', category: PackingCategory.CLOTHING, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'February can have rain in Coffee Region' },
  { id: 'col-13', name: 'Comfortable Walking Shoes', category: PackingCategory.CLOTHING, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Cobblestone streets in Cartagena' },
  { id: 'col-14', name: 'Hiking Boots', category: PackingCategory.CLOTHING, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Essential for Cocora Valley - muddy trails' },
  { id: 'col-15', name: 'Sandals', category: PackingCategory.CLOTHING, quantity: 1, isPacked: false, isOptional: true, isSuggested: true, addedBy: 'system' },
  { id: 'col-16', name: 'Swimsuit', category: PackingCategory.CLOTHING, quantity: 2, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Hotel pools & Caribbean beaches' },
  { id: 'col-17', name: 'Underwear', category: PackingCategory.CLOTHING, quantity: 8, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: 'col-18', name: 'Socks (Hiking & Regular)', category: PackingCategory.CLOTHING, quantity: 8, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  
  // Toiletries
  { id: 'col-19', name: 'Sunscreen SPF 50+', category: PackingCategory.TOILETRIES, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'High altitude = stronger UV' },
  { id: 'col-20', name: 'Insect Repellent (DEET)', category: PackingCategory.TOILETRIES, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Mosquitoes in Cartagena & Coffee Region' },
  { id: 'col-21', name: 'Toothbrush & Toothpaste', category: PackingCategory.TOILETRIES, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: 'col-22', name: 'Deodorant', category: PackingCategory.TOILETRIES, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: 'col-23', name: 'Lip Balm with SPF', category: PackingCategory.TOILETRIES, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Altitude dries lips' },
  { id: 'col-24', name: 'Hand Sanitizer', category: PackingCategory.TOILETRIES, quantity: 2, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  
  // Electronics
  { id: 'col-25', name: 'Smartphone', category: PackingCategory.ELECTRONICS, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Download offline maps & Spanish translator' },
  { id: 'col-26', name: 'Phone Charger & Cable', category: PackingCategory.ELECTRONICS, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Colombia uses Type A/B plugs (same as US)' },
  { id: 'col-27', name: 'Power Bank (10000+ mAh)', category: PackingCategory.ELECTRONICS, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Long hiking days' },
  { id: 'col-28', name: 'Camera', category: PackingCategory.ELECTRONICS, quantity: 1, isPacked: false, isOptional: true, isSuggested: true, addedBy: 'system', notes: 'Wax palms are incredible!' },
  { id: 'col-29', name: 'Headphones', category: PackingCategory.ELECTRONICS, quantity: 1, isPacked: false, isOptional: true, isSuggested: true, addedBy: 'system' },
  
  // Health & Safety
  { id: 'col-30', name: 'Altitude Sickness Pills', category: PackingCategory.HEALTH, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Bogota is 2,640m - take it easy day 1' },
  { id: 'col-31', name: 'Anti-Diarrhea Medicine', category: PackingCategory.HEALTH, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Just in case - avoid tap water' },
  { id: 'col-32', name: 'Pain Relievers (Ibuprofen)', category: PackingCategory.HEALTH, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: 'col-33', name: 'Band-Aids & Blister Pads', category: PackingCategory.HEALTH, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'For hiking' },
  { id: 'col-34', name: 'Rehydration Salts', category: PackingCategory.HEALTH, quantity: 3, isPacked: false, isOptional: true, isSuggested: true, addedBy: 'system', notes: 'Hot weather in Cartagena' },
  
  // Activities - Specific to Colombia Trip
  { id: 'col-35', name: 'Daypack (20-30L)', category: PackingCategory.ACTIVITIES, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'For Cocora Valley & day trips' },
  { id: 'col-36', name: 'Reusable Water Bottle', category: PackingCategory.ACTIVITIES, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Stay hydrated at altitude' },
  { id: 'col-37', name: 'Sunglasses (UV Protection)', category: PackingCategory.ACTIVITIES, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: 'col-38', name: 'Wide-Brim Hat', category: PackingCategory.ACTIVITIES, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system', notes: 'Sun protection for hiking & beach' },
  { id: 'col-39', name: 'Trekking Poles (Optional)', category: PackingCategory.ACTIVITIES, quantity: 1, isPacked: false, isOptional: true, isSuggested: true, addedBy: 'system', notes: 'Helpful for Cocora Valley descent' },
];

// Default packing items for other trips
const DEFAULT_PACKING_ITEMS: PackingItem[] = [
  // Essentials
  { id: '1', name: 'Passport', category: PackingCategory.ESSENTIALS, quantity: 1, isPacked: true, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: '2', name: 'Flight Tickets', category: PackingCategory.ESSENTIALS, quantity: 1, isPacked: true, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: '3', name: 'Wallet & Cards', category: PackingCategory.ESSENTIALS, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: '4', name: 'Phone Charger', category: PackingCategory.ESSENTIALS, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  
  // Clothing
  { id: '5', name: 'T-shirts', category: PackingCategory.CLOTHING, quantity: 5, isPacked: true, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: '6', name: 'Jeans', category: PackingCategory.CLOTHING, quantity: 2, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: '7', name: 'Underwear', category: PackingCategory.CLOTHING, quantity: 6, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: '8', name: 'Socks', category: PackingCategory.CLOTHING, quantity: 6, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: '9', name: 'Light Jacket', category: PackingCategory.CLOTHING, quantity: 1, isPacked: false, isOptional: true, isSuggested: true, addedBy: 'system' },
  { id: '10', name: 'Pajamas', category: PackingCategory.CLOTHING, quantity: 2, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  
  // Toiletries
  { id: '11', name: 'Toothbrush & Toothpaste', category: PackingCategory.TOILETRIES, quantity: 1, isPacked: true, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: '12', name: 'Shampoo & Conditioner', category: PackingCategory.TOILETRIES, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: '13', name: 'Deodorant', category: PackingCategory.TOILETRIES, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: '14', name: 'Sunscreen SPF 50', category: PackingCategory.TOILETRIES, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  
  // Electronics
  { id: '15', name: 'Laptop', category: PackingCategory.ELECTRONICS, quantity: 1, isPacked: false, isOptional: true, isSuggested: false, addedBy: 'user' },
  { id: '16', name: 'Camera', category: PackingCategory.ELECTRONICS, quantity: 1, isPacked: false, isOptional: true, isSuggested: true, addedBy: 'system' },
  { id: '17', name: 'Power Bank', category: PackingCategory.ELECTRONICS, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: '18', name: 'Travel Adapter', category: PackingCategory.ELECTRONICS, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  
  // Health
  { id: '19', name: 'Medications', category: PackingCategory.HEALTH, quantity: 1, isPacked: false, isOptional: false, isSuggested: true, addedBy: 'system' },
  { id: '20', name: 'First Aid Kit', category: PackingCategory.HEALTH, quantity: 1, isPacked: false, isOptional: true, isSuggested: true, addedBy: 'system' },
];

// Get packing items based on trip destination
const getPackingItemsForTrip = (tripId: string, destination?: string): PackingItem[] => {
  if (tripId === '2' || destination?.toLowerCase().includes('colombia')) {
    return COLOMBIA_PACKING_ITEMS;
  }
  return DEFAULT_PACKING_ITEMS;
};

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
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));
  
  const [items, setItems] = useState<PackingItem[]>(getPackingItemsForTrip(tripId, trip?.destination?.country));
  const [expandedCategories, setExpandedCategories] = useState<Set<PackingCategory>>(
    new Set([PackingCategory.ESSENTIALS])
  );
  const [addItemVisible, setAddItemVisible] = useState(false);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Trip not found</Text>
      </SafeAreaView>
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

  const toggleItemPacked = (itemId: string) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Visual feedback - scale animation
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
    
    setItems(items.map(item =>
      item.id === itemId ? { ...item, isPacked: !item.isPacked } : item
    ));
  };

  const getCategoryItems = (category: PackingCategory) => {
    return items.filter(item => item.category === category);
  };

  const getCategoryProgress = (category: PackingCategory) => {
    const categoryItems = getCategoryItems(category);
    const packed = categoryItems.filter(item => item.isPacked).length;
    return { packed, total: categoryItems.length };
  };

  const handleAddItem = (itemName: string, category: PackingCategory, quantity: number) => {
    const newItem: PackingItem = {
      id: Date.now().toString(),
      name: itemName,
      category,
      quantity,
      isPacked: false,
      isOptional: false,
      isSuggested: false,
      addedBy: 'user',
    };
    setItems([...items, newItem]);
    
    // Auto-expand the category
    const newExpanded = new Set(expandedCategories);
    newExpanded.add(category);
    setExpandedCategories(newExpanded);
  };

  const totalItems = items.length;
  const packedItems = items.filter(item => item.isPacked).length;
  const progressPercentage = Math.round((packedItems / totalItems) * 100);
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.gray900} variant="Linear" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Packing List</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setAddItemVisible(true)}
          >
            <Add size={24} color={colors.primary} variant="Bold" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.progressIconContainer}>
                <Bag2 size={24} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressTitle}>Check Your Packing List</Text>
                <Text style={styles.progressSubtitle}>
                  You have {unpackedCount} unpacked {unpackedCount === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </View>

            {/* Gradient Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={[colors.primary, '#8B5CF6', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
                />
              </View>
              <View style={styles.progressStats}>
                <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
                <Text style={styles.progressCount}>
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
                <View key={categoryInfo.id} style={styles.categoryCard}>
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
                      <Text style={styles.categoryName}>{categoryInfo.name}</Text>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryProgress}>
                        {packed}/{total}
                      </Text>
                      <Text style={styles.categoryArrow}>{isExpanded ? '▼' : '▶'}</Text>
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
                                item.isPacked && styles.itemNamePacked,
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
                              <Text style={styles.itemNotes}>{item.notes}</Text>
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
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
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
    color: colors.gray900,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  progressCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: `${colors.primary}15`,
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
    color: colors.gray900,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  progressBarContainer: {
    marginTop: spacing.sm,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.gray200,
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
    color: colors.primary,
  },
  progressCount: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  categoriesSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  categoryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
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
    color: colors.gray900,
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
    color: colors.gray600,
  },
  categoryArrow: {
    fontSize: 12,
    color: colors.gray400,
  },
  categoryItems: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
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
    color: colors.gray900,
  },
  itemNamePacked: {
    textDecorationLine: 'line-through',
    color: colors.gray500,
  },
  itemQuantity: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  suggestedBadge: {
    backgroundColor: `${colors.primary}15`,
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
    color: colors.gray500,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
