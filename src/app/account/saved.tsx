/**
 * SAVED ITEMS SCREEN
 * 
 * User's saved destinations, hotels, deals, etc.
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Mock saved items
const MOCK_SAVED_ITEMS = [
  {
    id: '1',
    type: 'destination',
    title: 'Bali, Indonesia',
    subtitle: 'Island Paradise',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
    savedAt: new Date('2024-11-15'),
  },
  {
    id: '2',
    type: 'hotel',
    title: 'Four Seasons Resort',
    subtitle: 'Bali • $450/night',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    savedAt: new Date('2024-11-10'),
  },
  {
    id: '3',
    type: 'deal',
    title: '30% Off Tokyo Flights',
    subtitle: 'Expires in 5 days',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    savedAt: new Date('2024-11-08'),
  },
  {
    id: '4',
    type: 'destination',
    title: 'Santorini, Greece',
    subtitle: 'Romantic Getaway',
    image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400',
    savedAt: new Date('2024-11-01'),
  },
];

const FILTER_TABS = ['All', 'Destinations', 'Hotels', 'Deals', 'Activities'];

export default function SavedScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const [savedItems, setSavedItems] = useState(MOCK_SAVED_ITEMS);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleRemove = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSavedItems(prev => prev.filter(item => item.id !== id));
  };
  
  const filteredItems = activeFilter === 'All' 
    ? savedItems 
    : savedItems.filter(item => 
        item.type.toLowerCase() === activeFilter.toLowerCase().slice(0, -1)
      );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Items</Text>
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
              key={tab}
              style={[
                styles.filterTab,
                activeFilter === tab && styles.filterTabActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(tab);
              }}
            >
              <Text style={[
                styles.filterText,
                activeFilter === tab && styles.filterTextActive,
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Saved Items List */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={48} color={colors.gray300} variant="Bold" />
            <Text style={styles.emptyTitle}>No saved items</Text>
            <Text style={styles.emptyText}>
              Items you save will appear here
            </Text>
          </View>
        ) : (
          filteredItems.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemContent}>
                <Text style={styles.itemType}>{item.type.toUpperCase()}</Text>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemove(item.id)}
              >
                <Heart size={20} color={colors.error} variant="Bold" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: colors.white,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
    gap: spacing.md,
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
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: 100,
    height: 100,
  },
  itemContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  itemType: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: spacing.md,
    justifyContent: 'center',
  },
});
