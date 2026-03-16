/**
 * ORDER BUILDER
 *
 * Selected menu items → Gemini generates natural spoken order →
 * expo-speech reads it aloud for the waiter.
 * Also supports manual text input and displays the English translation.
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
import {
  Add,
  Minus,
  Trash,
  ArrowLeft2,
  Edit2,
  VolumeHigh,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
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
  const {
    items,
    generatedOrder,
    isGenerating,
    isPlaying,
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft2 size={20} color="#FFFFFF" variant="Bold" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Your Order</Text>
            <Text style={styles.headerSub}>
              Will be spoken in {getLanguageFlag(localLanguage)} {getLanguageName(localLanguage)}
            </Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        {/* Order items */}
        {items.length > 0 ? (
          <View style={styles.itemsSection}>
            {items.map(item => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.orderItemContent}>
                  <Text style={styles.orderItemName}>{item.nameTranslated}</Text>
                  {item.nameOriginal !== item.nameTranslated && (
                    <Text style={styles.orderItemOriginal}>{item.nameOriginal}</Text>
                  )}
                  {item.price ? (
                    <Text style={styles.orderItemPrice}>{item.price}</Text>
                  ) : null}
                </View>

                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={14} color="#FFFFFF" variant="Bold" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Add size={14} color="#FFFFFF" variant="Bold" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    removeItem(item.id);
                  }}
                >
                  <Trash size={18} color="#EF4444" variant="Bold" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <VolumeHigh size={48} color="rgba(255,255,255,0.15)" variant="Bold" />
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptySubtext}>
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
          <Edit2 size={18} color="#3FC39E" variant="Bold" />
          <Text style={styles.manualToggleText}>
            {showManualInput ? 'Hide text input' : 'Type your order instead'}
          </Text>
        </TouchableOpacity>

        {showManualInput && (
          <TextInput
            style={styles.manualInputField}
            placeholder="e.g. Two coffees, one croissant, and a glass of water"
            placeholderTextColor="rgba(255,255,255,0.3)"
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
              onPlay={playOrder}
              onStop={stopOrder}
              localLanguage={generatedOrder.localLanguage}
            />

            {/* Spoken order text */}
            <View style={styles.orderTextCard}>
              <Text style={styles.orderTextLabel}>
                WHAT THE WAITER WILL HEAR ({getLanguageName(generatedOrder.localLanguage).toUpperCase()})
              </Text>
              <Text style={styles.orderTextContent}>{generatedOrder.spokenOrder}</Text>
            </View>

            {/* English translation */}
            <View style={styles.translationCard}>
              <Text style={styles.translationLabel}>ENGLISH TRANSLATION</Text>
              <Text style={styles.translationContent}>{generatedOrder.englishTranslation}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Generate button (sticky bottom) */}
      {(items.length > 0 || manualInput.trim()) && !generatedOrder && (
        <TouchableOpacity
          style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <VolumeHigh size={20} color="#FFFFFF" variant="Bold" />
              <Text style={styles.generateText}>
                Generate Spoken Order ({totalItems} item{totalItems !== 1 ? 's' : ''})
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Regenerate button if order already generated */}
      {generatedOrder && (
        <TouchableOpacity
          style={styles.regenerateBtn}
          onPress={handleGenerate}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          <Text style={styles.regenerateText}>Regenerate Order</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 56, paddingBottom: 120 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  itemsSection: { gap: 8, marginBottom: 16 },
  orderItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  orderItemContent: { flex: 1 },
  orderItemName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  orderItemOriginal: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  orderItemPrice: { fontSize: 13, fontWeight: '600', color: '#EC4899', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  qtyText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', minWidth: 18, textAlign: 'center' },
  removeBtn: { padding: 6 },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  emptySubtext: { fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
  manualToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12,
  },
  manualToggleText: { fontSize: 14, fontWeight: '600', color: '#3FC39E' },
  manualInputField: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#FFFFFF',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 80, textAlignVertical: 'top', marginBottom: 16,
  },
  errorCard: {
    backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { fontSize: 13, color: '#EF4444' },
  resultSection: { gap: 12, marginTop: 8 },
  orderTextCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  orderTextLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5, marginBottom: 8,
  },
  orderTextContent: { fontSize: 16, fontWeight: '500', color: '#FFFFFF', lineHeight: 24 },
  translationCard: {
    backgroundColor: 'rgba(63,195,158,0.06)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(63,195,158,0.15)',
  },
  translationLabel: {
    fontSize: 11, fontWeight: '700', color: '#3FC39E', letterSpacing: 0.5, marginBottom: 8,
  },
  translationContent: { fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },
  generateBtn: {
    position: 'absolute', bottom: 100, left: 16, right: 16,
    backgroundColor: '#3FC39E', borderRadius: 18, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#3FC39E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 8,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  regenerateBtn: {
    position: 'absolute', bottom: 100, left: 16, right: 16,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  regenerateText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
});
