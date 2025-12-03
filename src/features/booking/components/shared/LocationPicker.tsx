/**
 * LOCATION PICKER
 * 
 * Shared component for selecting cities/destinations across all flows.
 * Consistent design with:
 * - Search box matching DestinationStep style
 * - Location items with soft circle icon background
 * - City name + Country format
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  SearchNormal1,
  Location,
  CloseCircle,
  ArrowRight2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { Location as LocationType } from '../../types/booking.types';

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationType) => void;
  title?: string;
  placeholder?: string;
  locations: LocationType[];
  selectedId?: string;
}

export default function LocationPicker({
  visible,
  onClose,
  onSelect,
  title = 'Select Destination',
  placeholder = 'Search cities...',
  locations,
  selectedId,
}: LocationPickerProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const query = searchQuery.toLowerCase();
    return locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query) ||
        loc.country.toLowerCase().includes(query) ||
        loc.code?.toLowerCase().includes(query)
    );
  }, [locations, searchQuery]);
  
  const handleSelect = (location: LocationType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(location);
    setSearchQuery('');
  };
  
  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseCircle size={24} color={colors.gray400} variant="Bold" />
          </TouchableOpacity>
        </View>
        
        {/* Search Box - Matching DestinationStep style */}
        <View style={styles.searchContainer}>
          <SearchNormal1 size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <CloseCircle size={18} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Location List */}
        <FlatList
          data={filteredLocations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(300).delay(index * 30)}>
              <TouchableOpacity
                style={[
                  styles.locationItem,
                  selectedId === item.id && styles.locationItemSelected,
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                {/* Icon with soft circle background */}
                <View style={styles.locationIcon}>
                  <Location size={20} color={colors.primary} />
                </View>
                
                {/* Location Info */}
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{item.name}</Text>
                  <Text style={styles.locationCountry}>{item.country}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No locations found</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

// Trigger component for consistent styling across flows
interface LocationTriggerProps {
  label: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
  icon?: React.ReactNode;
  iconColor?: string;
}

export function LocationTrigger({
  label,
  value,
  placeholder = 'Select location',
  onPress,
  icon,
  iconColor = colors.primary,
}: LocationTriggerProps) {
  return (
    <TouchableOpacity
      style={styles.triggerContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.triggerIcon, { backgroundColor: iconColor + '15' }]}>
        {icon || <Location size={20} color={iconColor} variant="Bold" />}
      </View>
      <View style={styles.triggerContent}>
        <Text style={styles.triggerLabel}>{label}</Text>
        <Text style={[
          styles.triggerValue,
          !value && styles.triggerPlaceholder,
        ]}>
          {value || placeholder}
        </Text>
      </View>
      <ArrowRight2 size={20} color={colors.gray400} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  
  // Search Box - Fully rounded with white background and border
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  
  // Location List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  locationItemSelected: {
    backgroundColor: colors.primary + '08',
  },
  
  // Location Icon - Soft circle background
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  
  // Location Info
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  locationCountry: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  
  // Trigger Styles
  triggerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  triggerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  triggerContent: {
    flex: 1,
  },
  triggerLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  triggerValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  triggerPlaceholder: {
    color: colors.textSecondary,
  },
});
