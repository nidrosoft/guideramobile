/**
 * ORDER BUILDER
 *
 * Selected menu items → Gemini generates natural spoken order →
 * Gemini TTS reads it aloud for the waiter.
 * Also supports manual text input and displays the English translation.
 * Theme-aware: supports light and dark mode via ThemeContext.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Add,
  Minus,
  Trash,
  ArrowLeft2,
  Edit2,
  VolumeHigh,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import AudioPlayerBar from './AudioPlayerBar';
import { useOrderBuilder } from '../hooks/useOrderBuilder';
import { getLanguageName, getLanguageFlag } from '../constants/translatorConfig';
import type { MenuItem } from '../types/aiVision.types';

interface OrderBuilderProps {
  initialItems: MenuItem[];
  localLanguage: string;
  destinationCountry: string;
  onBack: () => void;
}

export default function OrderBuilder({
  initialItems,
  localLanguage,
  destinationCountry,
  onBack,
}: OrderBuilderProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors: tc } = useTheme();
  const {
    items,
    generatedOrder,
    isGenerating,
    isPlaying,
    isLoadingAudio,
    error,
    addItem,
    removeItem,
    updateQuantity,
    generate,
    playOrder,
    stopOrder,
    totalItems,
  } = useOrderBuilder();

  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Seed with initial items on mount
  React.useEffect(() => {
    for (const item of initialItems) {
      if (item.isSelected && item.quantity > 0) {
        addItem({
          id: item.id,
          nameOriginal: item.nameOriginal,
          nameTranslated: item.nameTranslated,
          price: item.price,
          quantity: item.quantity,
        });
      }
    }
  }, []); // Only run once on mount

  const handleGenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // If manual input is provided, add as a custom item
    if (manualInput.trim()) {
      addItem({
        id: `manual-${Date.now()}`,
        nameOriginal: manualInput.trim(),
        nameTranslated: manualInput.trim(),
        price: '',
        quantity: 1,
      });
      setManualInput('');
    }

    generate(localLanguage, destinationCountry);
  };

  // Theme-aware colors
  const bg = isDark ? '#111' : tc.bgPrimary;
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const textMain = tc.textPrimary;
  const textSub = tc.textSecondary;
  const textMuted = tc.textTertiary;
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const btnBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 160 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: btnBg }]} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft2 size={20} color={textMain} variant="Bold" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: textMain }]}>Your Order</Text>
            <Text style={[styles.headerSub, { color: textMuted }]}>
              Will be spoken in {getLanguageFlag(localLanguage)} {getLanguageName(localLanguage)}
            </Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        {/* Order items */}
        {items.length > 0 ? (
          <View style={styles.itemsSection}>
            {items.map(item => (
              <View key={item.id} style={[styles.orderItem, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.orderItemContent}>
                  <Text style={[styles.orderItemName, { color: textMain }]}>{item.nameTranslated}</Text>
                  {item.nameOriginal !== item.nameTranslated && (
                    <Text style={[styles.orderItemOriginal, { color: textMuted }]}>{item.nameOriginal}</Text>
                  )}
                  {item.price ? (
                    <Text style={styles.orderItemPrice}>{item.price}</Text>
                  ) : null}
                </View>

                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: btnBg }]}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={14} color={textMain} variant="Bold" />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: textMain }]}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: btnBg }]}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Add size={14} color={textMain} variant="Bold" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    removeItem(item.id);
                  }}
                >
                  <Trash size={18} color={tc.error} variant="Bold" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <VolumeHigh size={48} color={textMuted} variant="Bold" />
            <Text style={[styles.emptyTitle, { color: textMuted }]}>No items yet</Text>
            <Text style={[styles.emptySubtext, { color: textMuted }]}>
              Add items from the menu or type your order below
            </Text>
          </View>
        )}

        {/* Manual text input */}
        <TouchableOpacity
          style={styles.manualToggle}
          onPress={() => setShowManualInput(!showManualInput)}
          activeOpacity={0.7}
        >
          <Edit2 size={18} color={tc.primary} variant="Bold" />
          <Text style={[styles.manualToggleText, { color: tc.primary }]}>
            {showManualInput ? 'Hide text input' : 'Type your order instead'}
          </Text>
        </TouchableOpacity>

        {showManualInput && (
          <TextInput
            style={[styles.manualInputField, { backgroundColor: inputBg, borderColor: inputBorder, color: textMain }]}
            placeholder="e.g. Two coffees, one croissant, and a glass of water"
            placeholderTextColor={textMuted}
            value={manualInput}
            onChangeText={setManualInput}
            multiline
            numberOfLines={3}
          />
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Generated order result */}
        {generatedOrder && (
          <View style={styles.resultSection}>
            {/* Audio player */}
            <AudioPlayerBar
              isPlaying={isPlaying}
              isLoading={isLoadingAudio}
              onPlay={playOrder}
              onStop={stopOrder}
              localLanguage={generatedOrder.localLanguage}
            />

            {/* Spoken order text */}
            <View style={[styles.orderTextCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.orderTextLabel, { color: textMuted }]}>
                WHAT THE WAITER WILL HEAR ({getLanguageName(generatedOrder.localLanguage).toUpperCase()})
              </Text>
              <Text style={[styles.orderTextContent, { color: textMain }]}>{generatedOrder.spokenOrder}</Text>
            </View>

            {/* English translation */}
            <View style={styles.translationCard}>
              <Text style={styles.translationLabel}>ENGLISH TRANSLATION</Text>
              <Text style={[styles.translationContent, { color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)' }]}>{generatedOrder.englishTranslation}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Generate button (sticky bottom — positioned above tab bar) */}
      {(items.length > 0 || manualInput.trim()) && !generatedOrder && (
        <View style={[styles.bottomBtnContainer, { paddingBottom: insets.bottom + 70 }]}>
          <TouchableOpacity
            style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.generateText}>Generating order...</Text>
              </>
            ) : (
              <>
                <VolumeHigh size={20} color="#FFFFFF" variant="Bold" />
                <Text style={styles.generateText}>
                  Generate Spoken Order ({totalItems} item{totalItems !== 1 ? 's' : ''})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Regenerate button if order already generated */}
      {generatedOrder && (
        <View style={[styles.bottomBtnContainer, { paddingBottom: insets.bottom + 70 }]}>
          <TouchableOpacity
            style={[styles.regenerateBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
            onPress={handleGenerate}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <ActivityIndicator color={textSub} size="small" />
            ) : (
              <Text style={[styles.regenerateText, { color: textSub }]}>Regenerate Order</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 56 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  itemsSection: { gap: 8, marginBottom: 16 },
  orderItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 12,
    borderWidth: 1,
  },
  orderItemContent: { flex: 1 },
  orderItemName: { fontSize: 15, fontWeight: '600' },
  orderItemOriginal: { fontSize: 12, marginTop: 2 },
  orderItemPrice: { fontSize: 13, fontWeight: '600', color: '#EC4899', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyText: { fontSize: 15, fontWeight: '700', minWidth: 18, textAlign: 'center' },
  removeBtn: { padding: 6 },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySubtext: { fontSize: 13, textAlign: 'center' },
  manualToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12,
  },
  manualToggleText: { fontSize: 14, fontWeight: '600' },
  manualInputField: {
    borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 14,
    borderWidth: 1,
    minHeight: 80, textAlignVertical: 'top', marginBottom: 16,
  },
  errorCard: {
    backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { fontSize: 13, color: '#EF4444' },
  resultSection: { gap: 12, marginTop: 8 },
  orderTextCard: {
    borderRadius: 16, padding: 16,
    borderWidth: 1,
  },
  orderTextLabel: {
    fontSize: 11, fontWeight: '700',
    letterSpacing: 0.5, marginBottom: 8,
  },
  orderTextContent: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
  translationCard: {
    backgroundColor: 'rgba(63,195,158,0.06)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(63,195,158,0.15)',
  },
  translationLabel: {
    fontSize: 11, fontWeight: '700', color: '#3FC39E', letterSpacing: 0.5, marginBottom: 8,
  },
  translationContent: { fontSize: 15, lineHeight: 22 },
  bottomBtnContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
  },
  generateBtn: {
    backgroundColor: '#3FC39E', borderRadius: 18, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#3FC39E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 8,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  regenerateBtn: {
    borderRadius: 18, paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  regenerateText: { fontSize: 15, fontWeight: '600' },
});
