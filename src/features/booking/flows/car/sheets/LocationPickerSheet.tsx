/**
 * LOCATION PICKER SHEET
 *
 * Bottom sheet for selecting pickup/return location.
 * Theme-aware for dark/light mode.
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
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Location as LocationType } from '../../../types/booking.types';

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
  { id: '11', name: 'London Heathrow Airport (LHR)', code: 'LHR', country: 'UK', countryCode: 'GB', type: 'airport' },
  { id: '12', name: 'Paris CDG Airport', code: 'CDG', country: 'France', countryCode: 'FR', type: 'airport' },
  { id: '13', name: 'Dubai Airport (DXB)', code: 'DXB', country: 'UAE', countryCode: 'AE', type: 'airport' },
  { id: '14', name: 'Tokyo Narita Airport (NRT)', code: 'NRT', country: 'Japan', countryCode: 'JP', type: 'airport' },
  { id: '15', name: 'Sydney Airport (SYD)', code: 'SYD', country: 'Australia', countryCode: 'AU', type: 'airport' },
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
  const { colors: tc } = useTheme();
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
        <View style={[styles.container, { backgroundColor: tc.bgElevated }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: tc.borderSubtle }]}>
            <Text style={[styles.title, { color: tc.textPrimary }]}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <CloseCircle size={28} color={tc.textSecondary} variant="Bold" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
            <SearchNormal1 size={20} color={tc.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: tc.textPrimary }]}
              placeholder="Search airports or cities..."
              placeholderTextColor={tc.textTertiary}
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
                style={[styles.locationItem, { borderBottomColor: tc.borderSubtle }]}
                onPress={() => handleSelect(item)}
              >
                <View style={[
                  styles.locationIcon,
                  { backgroundColor: item.type === 'airport' ? `${tc.primary}15` : `${tc.success}15` }
                ]}>
                  {item.type === 'airport' ? (
                    <Airplane size={18} color={tc.primary} variant="Bold" />
                  ) : (
                    <Location size={18} color={tc.success} variant="Bold" />
                  )}
                </View>
                <View style={styles.locationInfo}>
                  <Text style={[styles.locationName, { color: tc.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.locationType, { color: tc.textSecondary }]}>
                    {item.type === 'airport' ? 'Airport' : 'City Center'} • {item.code}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xl }]}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '85%' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.lg, marginVertical: spacing.md,
    paddingHorizontal: spacing.md, borderRadius: borderRadius.lg,
    height: 48, gap: spacing.sm, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: typography.fontSize.base },
  listContent: { paddingHorizontal: spacing.lg },
  locationItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  locationIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  locationInfo: { flex: 1 },
  locationName: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium },
  locationType: { fontSize: typography.fontSize.sm, marginTop: 2 },
});
