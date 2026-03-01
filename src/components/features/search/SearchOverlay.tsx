/**
 * SEARCH OVERLAY
 * 
 * Full-screen Airbnb-style search overlay with accordion sections.
 * Each section (Where, When, Who) expands/collapses with smooth animations.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CloseCircle, SearchNormal1 } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { searchService } from '@/services/search.service';
import { SearchSectionCard, WhereSection, WhenSection, WhoSection } from './overlay';

type ActiveSection = 'where' | 'when' | 'who' | null;

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

interface SearchOverlayProps {
  visible: boolean;
  query: string;
  onSelectSearch: (term: string, dates?: { start?: Date; end?: Date }) => void;
  onClose: () => void;
}

export default function SearchOverlay({
  visible,
  query: initialQuery,
  onSelectSearch,
  onClose,
}: SearchOverlayProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();
  
  // State
  const [activeSection, setActiveSection] = useState<ActiveSection>('where');
  const [destination, setDestination] = useState(initialQuery || '');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState<GuestCounts>({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
  });

  // Dynamic styles
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: themeColors.background },
    header: { backgroundColor: 'transparent' },
    closeButton: { backgroundColor: themeColors.bgElevated, borderWidth: 1, borderColor: themeColors.borderSubtle },
    footer: { backgroundColor: themeColors.bgModal, borderTopColor: themeColors.borderSubtle },
    clearText: { color: themeColors.textSecondary },
    searchButton: { backgroundColor: themeColors.primary },
    searchButtonText: { color: '#FFFFFF' },
  }), [themeColors]);

  // Reset state when overlay opens
  useEffect(() => {
    if (visible) {
      setDestination(initialQuery || '');
      setActiveSection('where');
    }
  }, [visible, initialQuery]);

  // Computed values for collapsed states
  const dateDisplayText = useMemo(() => {
    if (startDate && endDate) {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
    }
    if (startDate) {
      return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return 'Add dates';
  }, [startDate, endDate]);

  const guestDisplayText = useMemo(() => {
    const total = guests.adults + guests.children;
    if (total === 0) return 'Add guests';
    let text = `${total} guest${total > 1 ? 's' : ''}`;
    if (guests.infants > 0) text += `, ${guests.infants} infant${guests.infants > 1 ? 's' : ''}`;
    if (guests.pets > 0) text += `, ${guests.pets} pet${guests.pets > 1 ? 's' : ''}`;
    return text;
  }, [guests]);

  // Handlers
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleSectionPress = (section: ActiveSection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSection(section);
  };

  const handleDestinationSelect = (dest: string) => {
    setDestination(dest);
    // Auto-advance to When section
    setTimeout(() => setActiveSection('when'), 300);
  };

  const handleDatesSelect = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleGuestsUpdate = (newGuests: GuestCounts) => {
    setGuests(newGuests);
  };

  const handleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (destination) {
      searchService.addRecentSearch(destination);
      onSelectSearch(destination, { start: startDate || undefined, end: endDate || undefined });
    }
  };

  const handleClearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDestination('');
    setStartDate(null);
    setEndDate(null);
    setGuests({ adults: 0, children: 0, infants: 0, pets: 0 });
    setActiveSection('where');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, dynamicStyles.container]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header with close button on RIGHT */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.headerSpacer} />
          <TouchableOpacity 
            style={[styles.closeButton, dynamicStyles.closeButton]} 
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <CloseCircle size={24} color={themeColors.textPrimary} variant="Outline" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* WHERE Section */}
          <SearchSectionCard
            title="Where"
            collapsedValue={destination || "I'm flexible"}
            isExpanded={activeSection === 'where'}
            onPress={() => handleSectionPress('where')}
          >
            <WhereSection
              value={destination}
              onSelect={handleDestinationSelect}
              autoFocus={activeSection === 'where'}
            />
          </SearchSectionCard>

          {/* WHEN Section */}
          <SearchSectionCard
            title="When"
            collapsedValue={dateDisplayText}
            isExpanded={activeSection === 'when'}
            onPress={() => handleSectionPress('when')}
          >
            <WhenSection
              startDate={startDate}
              endDate={endDate}
              onSelectDates={handleDatesSelect}
            />
          </SearchSectionCard>

          {/* WHO Section */}
          <SearchSectionCard
            title="Who"
            collapsedValue={guestDisplayText}
            isExpanded={activeSection === 'who'}
            onPress={() => handleSectionPress('who')}
          >
            <WhoSection
              guests={guests}
              onUpdateGuests={handleGuestsUpdate}
            />
          </SearchSectionCard>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, dynamicStyles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
            <Text style={[styles.clearText, dynamicStyles.clearText]}>Clear all</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.searchButton, dynamicStyles.searchButton]}
            onPress={handleSearch}
            activeOpacity={0.8}
          >
            <SearchNormal1 size={18} color={themeColors.white} />
            <Text style={[styles.searchButtonText, dynamicStyles.searchButtonText]}>Search</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerSpacer: {
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  clearText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 16,
    gap: spacing.sm,
  },
  searchButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
