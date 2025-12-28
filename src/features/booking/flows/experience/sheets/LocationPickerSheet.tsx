/**
 * LOCATION PICKER SHEET
 * 
 * Bottom sheet for selecting destination city.
 */

import React, { useState } from 'react';
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
import { CloseCircle, SearchNormal1, Location } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { Location as LocationType } from '../../../types/booking.types';

// Popular destinations for experiences
const POPULAR_DESTINATIONS: LocationType[] = [
  { id: '1', name: 'Paris', country: 'France', countryCode: 'FR', code: 'PAR', type: 'city' },
  { id: '2', name: 'Rome', country: 'Italy', countryCode: 'IT', code: 'ROM', type: 'city' },
  { id: '3', name: 'Barcelona', country: 'Spain', countryCode: 'ES', code: 'BCN', type: 'city' },
  { id: '4', name: 'London', country: 'United Kingdom', countryCode: 'GB', code: 'LON', type: 'city' },
  { id: '5', name: 'New York', country: 'USA', countryCode: 'US', code: 'NYC', type: 'city' },
  { id: '6', name: 'Tokyo', country: 'Japan', countryCode: 'JP', code: 'TYO', type: 'city' },
  { id: '7', name: 'Dubai', country: 'UAE', countryCode: 'AE', code: 'DXB', type: 'city' },
  { id: '8', name: 'Sydney', country: 'Australia', countryCode: 'AU', code: 'SYD', type: 'city' },
  { id: '9', name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', code: 'AMS', type: 'city' },
  { id: '10', name: 'Lisbon', country: 'Portugal', countryCode: 'PT', code: 'LIS', type: 'city' },
];

interface LocationPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationType) => void;
  title: string;
}

export default function LocationPickerSheet({
  visible,
  onClose,
  onSelect,
  title,
}: LocationPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filteredLocations = POPULAR_DESTINATIONS.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (location: LocationType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(location);
    setSearch('');
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <CloseCircle size={28} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <SearchNormal1 size={20} color={colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cities..."
              placeholderTextColor={colors.gray400}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>

          {/* Location List */}
          <FlatList
            data={filteredLocations}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.locationItem}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.locationIcon}>
                  <Location size={18} color={colors.primary} variant="Bold" />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{item.name}</Text>
                  <Text style={styles.locationType}>{item.country}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    height: 48,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
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
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  locationType: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
