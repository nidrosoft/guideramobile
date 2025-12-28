/**
 * LOCATION PICKER SHEET
 * 
 * Bottom sheet for selecting origin/destination for package booking.
 * Supports both origin and destination selection modes.
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
import { SearchNormal1, Location, CloseCircle, TickCircle, Airplane } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { Location as LocationType } from '../../../types/booking.types';

// Popular cities for package booking
const POPULAR_LOCATIONS: LocationType[] = [
  { id: 'nyc', name: 'New York', code: 'JFK', type: 'city', country: 'United States', countryCode: 'US' },
  { id: 'lax', name: 'Los Angeles', code: 'LAX', type: 'city', country: 'United States', countryCode: 'US' },
  { id: 'mia', name: 'Miami', code: 'MIA', type: 'city', country: 'United States', countryCode: 'US' },
  { id: 'ldn', name: 'London', code: 'LHR', type: 'city', country: 'United Kingdom', countryCode: 'GB' },
  { id: 'par', name: 'Paris', code: 'CDG', type: 'city', country: 'France', countryCode: 'FR' },
  { id: 'tok', name: 'Tokyo', code: 'NRT', type: 'city', country: 'Japan', countryCode: 'JP' },
  { id: 'dxb', name: 'Dubai', code: 'DXB', type: 'city', country: 'UAE', countryCode: 'AE' },
  { id: 'sgp', name: 'Singapore', code: 'SIN', type: 'city', country: 'Singapore', countryCode: 'SG' },
  { id: 'syd', name: 'Sydney', code: 'SYD', type: 'city', country: 'Australia', countryCode: 'AU' },
  { id: 'bcn', name: 'Barcelona', code: 'BCN', type: 'city', country: 'Spain', countryCode: 'ES' },
  { id: 'rom', name: 'Rome', code: 'FCO', type: 'city', country: 'Italy', countryCode: 'IT' },
  { id: 'ams', name: 'Amsterdam', code: 'AMS', type: 'city', country: 'Netherlands', countryCode: 'NL' },
];

interface LocationPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationType) => void;
  selected: LocationType | null;
  title?: string;
  type?: 'origin' | 'destination';
}

export default function LocationPickerSheet({
  visible,
  onClose,
  onSelect,
  selected,
  title = 'Select Location',
  type = 'destination',
}: LocationPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_LOCATIONS;
    const query = searchQuery.toLowerCase();
    return POPULAR_LOCATIONS.filter(
      loc => loc.name.toLowerCase().includes(query) ||
             loc.country?.toLowerCase().includes(query) ||
             loc.code?.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelect = (location: LocationType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(location);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const renderLocation = ({ item }: { item: LocationType }) => {
    const isSelected = selected?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.locationItem, isSelected && styles.locationItemSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.locationIcon, isSelected && styles.locationIconSelected]}>
          {type === 'origin' ? (
            <Airplane size={20} color={isSelected ? colors.white : colors.primary} variant="Bold" />
          ) : (
            <Location size={20} color={isSelected ? colors.white : colors.success} variant="Bold" />
          )}
        </View>
        <View style={styles.locationInfo}>
          <Text style={[styles.locationName, isSelected && styles.locationNameSelected]}>
            {item.name}
          </Text>
          <Text style={styles.locationDetails}>
            {item.code} • {item.country}
          </Text>
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
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <CloseCircle size={28} color={colors.textSecondary} variant="Bold" />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <SearchNormal1 size={20} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city or airport..."
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

        {/* Section Label */}
        {!searchQuery && (
          <Text style={styles.sectionLabel}>Popular Cities</Text>
        )}

        {/* Locations List */}
        <FlatList
          data={filteredLocations}
          renderItem={renderLocation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No locations found</Text>
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
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  locationItemSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  locationIconSelected: {
    backgroundColor: colors.primary,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  locationNameSelected: {
    color: colors.primary,
  },
  locationDetails: {
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
