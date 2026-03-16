/**
 * LANGUAGE PICKER
 *
 * Compact language selector for the top-right corner of the camera view.
 * Tapping opens a scrollable list of supported languages.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { LanguageSquare, CloseCircle, SearchNormal } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { SUPPORTED_LANGUAGES } from '../constants/translatorConfig';
import type { LanguageOption } from '../types/aiVision.types';

interface LanguagePickerProps {
  selectedLanguage: string;
  onSelect: (code: string) => void;
}

export default function LanguagePicker({ selectedLanguage, onSelect }: LanguagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);

  const filtered = search.trim()
    ? SUPPORTED_LANGUAGES.filter(
        l =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.nativeName.toLowerCase().includes(search.toLowerCase()),
      )
    : SUPPORTED_LANGUAGES;

  const handleSelect = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(code);
    setIsOpen(false);
    setSearch('');
  };

  const renderItem = ({ item }: { item: LanguageOption }) => {
    const isActive = item.code === selectedLanguage;
    return (
      <TouchableOpacity
        style={[styles.langItem, isActive && styles.langItemActive]}
        onPress={() => handleSelect(item.code)}
        activeOpacity={0.7}
      >
        <Text style={styles.langFlag}>{item.flag}</Text>
        <View style={styles.langTextContainer}>
          <Text style={[styles.langName, isActive && styles.langNameActive]}>
            {item.name}
          </Text>
          <Text style={styles.langNative}>{item.nativeName}</Text>
        </View>
        {isActive && <View style={styles.checkDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Compact pill button */}
      <TouchableOpacity
        style={styles.pill}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsOpen(true);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.pillFlag}>{selected?.flag || '🌐'}</Text>
        <Text style={styles.pillText}>{selected?.code?.toUpperCase() || 'EN'}</Text>
      </TouchableOpacity>

      {/* Full language picker modal */}
      <Modal visible={isOpen} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={() => setIsOpen(false)} activeOpacity={1} />
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handleBar}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Translate To</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <CloseCircle size={28} color="rgba(255,255,255,0.5)" variant="Bold" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <SearchNormal size={18} color="rgba(255,255,255,0.4)" variant="Linear" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search languages..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
            </View>

            {/* List */}
            <FlatList
              data={filtered}
              renderItem={renderItem}
              keyExtractor={item => item.code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  pillFlag: {
    fontSize: 14,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  langItemActive: {
    backgroundColor: 'rgba(63,195,158,0.12)',
  },
  langFlag: {
    fontSize: 22,
  },
  langTextContainer: {
    flex: 1,
  },
  langName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  langNameActive: {
    color: '#3FC39E',
  },
  langNative: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3FC39E',
  },
});
