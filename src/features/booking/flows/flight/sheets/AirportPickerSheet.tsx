/**
 * AIRPORT PICKER SHEET
 * 
 * Bottom sheet with search and airport list
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
import { SearchNormal1, Location, CloseCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { Airport } from '../../../types/flight.types';
import { AIRPORTS } from '../../../data/mockFlights';

interface AirportPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (airport: Airport) => void;
  title: string;
  selectedAirport?: Airport | null;
}

export default function AirportPickerSheet({
  visible,
  onClose,
  onSelect,
  title,
  selectedAirport,
}: AirportPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAirports = useMemo(() => {
    if (!searchQuery.trim()) return AIRPORTS.slice(0, 10);
    
    const query = searchQuery.toLowerCase();
    return AIRPORTS.filter(
      (airport) =>
        airport.name.toLowerCase().includes(query) ||
        airport.code.toLowerCase().includes(query) ||
        airport.city.toLowerCase().includes(query) ||
        airport.country.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [searchQuery]);

  const handleSelect = (airport: Airport) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(airport);
    setSearchQuery('');
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const renderAirport = ({ item }: { item: Airport }) => {
    const isSelected = selectedAirport?.code === item.code;
    
    return (
      <TouchableOpacity
        style={[styles.airportItem, isSelected && styles.airportItemSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.airportIcon}>
          <Location size={20} color={colors.gray400} variant="Outline" />
        </View>
        <View style={styles.airportInfo}>
          <Text style={styles.airportName}>
            {item.city} ({item.code} - {item.name})
          </Text>
          <Text style={styles.airportCountry}>{item.country}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <CloseCircle size={28} color={colors.gray400} variant="Bold" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <SearchNormal1 size={20} color={colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search airport or city"
              placeholderTextColor={colors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          {/* Airport List */}
          <FlatList
            data={filteredAirports}
            keyExtractor={(item) => item.code}
            renderItem={renderAirport}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  list: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  airportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  airportItemSelected: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  airportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  airportInfo: {
    flex: 1,
  },
  airportName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  airportCountry: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
