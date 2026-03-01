/**
 * LOCATION PICKER SHEET
 * 
 * Bottom sheet for selecting pickup/return location.
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
import {
  CloseCircle,
  SearchNormal1,
  Location,
  Airplane,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { Location as LocationType } from '../../../types/booking.types';

// Mock locations
const POPULAR_LOCATIONS: LocationType[] = [
  { id: '1', name: 'Los Angeles Airport (LAX)', code: 'LAX', country: 'USA', countryCode: 'US', type: 'airport' },
  { id: '2', name: 'San Francisco Airport (SFO)', code: 'SFO', country: 'USA', countryCode: 'US', type: 'airport' },
  { id: '3', name: 'New York JFK Airport', code: 'JFK', country: 'USA', countryCode: 'US', type: 'airport' },
  { id: '4', name: 'Miami Airport (MIA)', code: 'MIA', country: 'USA', countryCode: 'US', type: 'airport' },
  { id: '5', name: 'Las Vegas Airport (LAS)', code: 'LAS', country: 'USA', countryCode: 'US', type: 'airport' },
  { id: '6', name: 'Downtown Los Angeles', code: 'DTLA', country: 'USA', countryCode: 'US', type: 'city' },
  { id: '7', name: 'Downtown Miami', code: 'MIA-DT', country: 'USA', countryCode: 'US', type: 'city' },
  { id: '8', name: 'Orlando Airport (MCO)', code: 'MCO', country: 'USA', countryCode: 'US', type: 'airport' },
  { id: '9', name: 'Chicago O\'Hare Airport (ORD)', code: 'ORD', country: 'USA', countryCode: 'US', type: 'airport' },
  { id: '10', name: 'Denver Airport (DEN)', code: 'DEN', country: 'USA', countryCode: 'US', type: 'airport' },
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

  const filteredLocations = POPULAR_LOCATIONS.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.code?.toLowerCase() || '').includes(search.toLowerCase())
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
        <View style={styles.container}>
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
              placeholder="Search airports or cities..."
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
                <View style={[
                  styles.locationIcon,
                  { backgroundColor: item.type === 'airport' ? `${colors.primary}15` : `${colors.success}15` }
                ]}>
                  {item.type === 'airport' ? (
                    <Airplane size={18} color={colors.primary} variant="Bold" />
                  ) : (
                    <Location size={18} color={colors.success} variant="Bold" />
                  )}
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{item.name}</Text>
                  <Text style={styles.locationType}>
                    {item.type === 'airport' ? 'Airport' : 'City Center'} • {item.code}
                  </Text>
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
    backgroundColor: colors.bgModal,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
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
