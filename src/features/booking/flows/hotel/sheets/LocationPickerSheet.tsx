/**
 * LOCATION PICKER SHEET
 * 
 * Bottom sheet for selecting hotel destination/city
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { SearchNormal1, Location, CloseCircle, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { Location as LocationType } from '../../../types/booking.types';
import { POPULAR_DESTINATIONS } from '../../../data/mockHotels';

interface LocationPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationType) => void;
  selected: LocationType | null;
}

export default function LocationPickerSheet({
  visible,
  onClose,
  onSelect,
  selected,
}: LocationPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_DESTINATIONS;
    const query = searchQuery.toLowerCase();
    return POPULAR_DESTINATIONS.filter(
      dest => dest.name.toLowerCase().includes(query) ||
              dest.country?.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelect = (location: LocationType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(location);
    onClose();
  };

  const renderDestination = ({ item }: { item: LocationType }) => {
    const isSelected = selected?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.destinationItem, isSelected && styles.destinationItemSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.destinationIcon}>
          <Location size={20} color={isSelected ? colors.primary : colors.textSecondary} />
        </View>
        <View style={styles.destinationInfo}>
          <Text style={[styles.destinationName, isSelected && styles.destinationNameSelected]}>
            {item.name}
          </Text>
          {item.country && (
            <Text style={styles.destinationCountry}>{item.country}</Text>
          )}
        </View>
        {isSelected && (
          <TickCircle size={24} color={colors.primary} variant="Bold" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Destination</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseCircle size={28} color={colors.textSecondary} variant="Bold" />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <SearchNormal1 size={20} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city or destination..."
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <CloseCircle size={20} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>

        {/* Popular Destinations Label */}
        {!searchQuery && (
          <Text style={styles.sectionLabel}>Popular Destinations</Text>
        )}

        {/* Destinations List */}
        <FlatList
          data={filteredDestinations}
          renderItem={renderDestination}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No destinations found</Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgModal,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  destinationItemSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  destinationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  destinationNameSelected: {
    color: colors.primary,
  },
  destinationCountry: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
});
