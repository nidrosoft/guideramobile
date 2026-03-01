/**
 * AIRPORT PICKER
 * 
 * Shared component for selecting airports across all flows.
 * Consistent design with:
 * - Search box matching DestinationStep style
 * - Airport code displayed prominently (LAX, JFK, etc.)
 * - City name + Full airport name format
 * - Separator line between items
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  SearchNormal1,
  Location,
  CloseCircle,
  ArrowRight2,
  ArrowLeft,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, shadows, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

// Airport type
export interface Airport {
  code: string;
  city: string;
  name: string;
  country: string;
}

interface AirportPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (airport: Airport) => void;
  title?: string;
  placeholder?: string;
  airports: Airport[];
  excludeCode?: string;
}

export default function AirportPicker({
  visible,
  onClose,
  onSelect,
  title = 'Select Origin',
  placeholder = 'Search city or airport',
  airports,
  excludeCode,
}: AirportPickerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredAirports = useMemo(() => {
    let filtered = airports;
    
    // Exclude specific airport if provided
    if (excludeCode) {
      filtered = filtered.filter((a) => a.code !== excludeCode);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (airport) =>
          airport.code.toLowerCase().includes(query) ||
          airport.city.toLowerCase().includes(query) ||
          airport.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [airports, searchQuery, excludeCode]);
  
  const handleSelect = (airport: Airport) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(airport);
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
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <View style={styles.backButton} />
        </View>
        
        {/* Search Box - Matching DestinationStep style */}
        <View style={[styles.searchContainer, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
          <Location size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <CloseCircle size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Airport List */}
        <FlatList
          data={filteredAirports}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(300).delay(index * 30)}>
              <TouchableOpacity
                style={[styles.airportItem, { borderBottomColor: colors.borderSubtle }]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                {/* Airport Code */}
                <View style={styles.codeContainer}>
                  <Text style={[styles.airportCode, { color: colors.primary }]}>{item.code}</Text>
                </View>
                
                {/* Airport Info */}
                <View style={styles.airportInfo}>
                  <Text style={[styles.airportCity, { color: colors.textPrimary }]}>{item.city}</Text>
                  <Text style={[styles.airportName, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                
                <ArrowRight2 size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No airports found</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
    textAlign: 'center',
  },
  
  // Search Box
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing.xs,
  },
  
  // Airport List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  airportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  
  // Airport Code - Prominent display
  codeContainer: {
    width: 56,
    marginRight: spacing.md,
  },
  airportCode: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  
  // Airport Info
  airportInfo: {
    flex: 1,
  },
  airportCity: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  airportName: {
    fontSize: typography.fontSize.sm,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
  },
});
