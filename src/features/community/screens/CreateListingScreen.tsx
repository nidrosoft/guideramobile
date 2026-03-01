/**
 * CREATE LISTING SCREEN
 * 
 * Form for guides to create a new listing (tour, rental, service, recommendation).
 * Step 1: Category selection
 * Step 2: Title, description, location
 * Step 3: Pricing, duration, included items
 * Step 4: Review & publish
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight2,
  Camera,
  TickCircle,
  Home2,
  Map,
  Setting2,
  DocumentText,
  Add,
  CloseCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { ListingCategory, LISTING_CATEGORIES, CreateListingInput } from '../types/guide.types';

const CATEGORY_ICONS: Record<ListingCategory, any> = {
  property_rental: Home2,
  tour_experience: Map,
  service: Setting2,
  recommendation: DocumentText,
};

const CATEGORY_COLORS: Record<ListingCategory, string> = {
  property_rental: '#8B5CF6',
  tour_experience: '#F59E0B',
  service: '#3B82F6',
  recommendation: '#22C55E',
};

const TOTAL_STEPS = 4;

export default function CreateListingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<ListingCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [duration, setDuration] = useState('');
  const [availability, setAvailability] = useState('');
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');

  const canProceed = () => {
    switch (step) {
      case 1: return category !== null;
      case 2: return title.trim().length > 5 && description.trim().length > 20 && city.trim().length > 0;
      case 3: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      setIncludedItems([...includedItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setIncludedItems(includedItems.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Listing Published!',
      'Your listing is now visible to travelers. You can edit or pause it anytime from your guide profile.',
      [{ text: 'Done', onPress: () => router.back() }]
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What type of listing?</Text>
      <Text style={styles.stepSubtitle}>Choose the category that best fits what you're offering</Text>

      {LISTING_CATEGORIES.map(cat => {
        const Icon = CATEGORY_ICONS[cat.id];
        const color = CATEGORY_COLORS[cat.id];
        const isSelected = category === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryCard, isSelected && { borderColor: color, backgroundColor: color + '08' }]}
            onPress={() => { setCategory(cat.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <View style={[styles.categoryIcon, { backgroundColor: color + '15' }]}>
              <Icon size={24} color={color} variant="Bold" />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryLabel, isSelected && { color }]}>{cat.label}</Text>
              <Text style={styles.categoryDesc}>{cat.description}</Text>
            </View>
            {isSelected && <TickCircle size={22} color={color} variant="Bold" />}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Listing Details</Text>
      <Text style={styles.stepSubtitle}>Tell travelers what you're offering</Text>

      <Text style={styles.inputLabel}>Title *</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., Private Medellín Night Tour — Safe spots & salsa clubs"
        placeholderTextColor={colors.textTertiary}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.inputLabel}>Description *</Text>
      <TextInput
        style={[styles.textInput, styles.textArea]}
        placeholder="Describe your listing in detail. What makes it special? What will travelers experience?"
        placeholderTextColor={colors.textTertiary}
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{description.length}/1000</Text>

      <Text style={styles.inputLabel}>Photos</Text>
      <TouchableOpacity style={styles.photoUpload}>
        <Camera size={24} color={colors.primary} />
        <Text style={styles.photoUploadText}>Add Photos</Text>
      </TouchableOpacity>

      <Text style={styles.inputLabel}>Neighborhood (optional)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., El Poblado"
        placeholderTextColor={colors.textTertiary}
        value={neighborhood}
        onChangeText={setNeighborhood}
      />

      <Text style={styles.inputLabel}>City *</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., Medellín"
        placeholderTextColor={colors.textTertiary}
        value={city}
        onChangeText={setCity}
      />

      <Text style={styles.inputLabel}>Country</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., Colombia"
        placeholderTextColor={colors.textTertiary}
        value={country}
        onChangeText={setCountry}
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Pricing & Details</Text>
      <Text style={styles.stepSubtitle}>Help travelers understand what to expect</Text>

      <Text style={styles.inputLabel}>Price Range (approximate)</Text>
      <Text style={styles.inputHint}>This is for visibility only — no transactions happen on the app</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., $50-70 per person"
        placeholderTextColor={colors.textTertiary}
        value={priceRange}
        onChangeText={setPriceRange}
      />

      {category !== 'recommendation' && (
        <>
          <Text style={styles.inputLabel}>Duration</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 4 hours"
            placeholderTextColor={colors.textTertiary}
            value={duration}
            onChangeText={setDuration}
          />
        </>
      )}

      <Text style={styles.inputLabel}>Availability</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., Friday & Saturday nights"
        placeholderTextColor={colors.textTertiary}
        value={availability}
        onChangeText={setAvailability}
      />

      <Text style={styles.inputLabel}>What's Included</Text>
      <View style={styles.addItemRow}>
        <TextInput
          style={[styles.textInput, styles.addItemInput]}
          placeholder="e.g., Local guide, VIP entry"
          placeholderTextColor={colors.textTertiary}
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
          <Add size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
      {includedItems.map((item, i) => (
        <View key={i} style={styles.includedItem}>
          <Text style={styles.includedItemText}>✓ {item}</Text>
          <TouchableOpacity onPress={() => handleRemoveItem(i)}>
            <CloseCircle size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderStep4 = () => {
    const catInfo = LISTING_CATEGORIES.find(c => c.id === category);
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Review Your Listing</Text>
        <Text style={styles.stepSubtitle}>Make sure everything looks good before publishing</Text>

        <View style={styles.reviewCard}>
          <View style={[styles.reviewCatBadge, { backgroundColor: CATEGORY_COLORS[category!] + '15' }]}>
            <Text style={[styles.reviewCatText, { color: CATEGORY_COLORS[category!] }]}>
              {catInfo?.label}
            </Text>
          </View>

          <Text style={styles.reviewTitle}>{title}</Text>
          <Text style={styles.reviewDesc}>{description}</Text>

          {(neighborhood || city) && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Location</Text>
              <Text style={styles.reviewValue}>
                {neighborhood ? `${neighborhood}, ` : ''}{city}{country ? `, ${country}` : ''}
              </Text>
            </View>
          )}

          {priceRange && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Price</Text>
              <Text style={styles.reviewValue}>{priceRange}</Text>
            </View>
          )}

          {duration && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Duration</Text>
              <Text style={styles.reviewValue}>{duration}</Text>
            </View>
          )}

          {availability && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Availability</Text>
              <Text style={styles.reviewValue}>{availability}</Text>
            </View>
          )}

          {includedItems.length > 0 && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Included</Text>
              <Text style={styles.reviewValue}>{includedItems.join(', ')}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
          <Text style={styles.publishButtonText}>Publish Listing</Text>
        </TouchableOpacity>

        <Text style={styles.publishNote}>
          You can edit or pause this listing anytime from your guide profile.
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <Text style={styles.stepIndicator}>Step {step}/{TOTAL_STEPS}</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i + 1 <= step && styles.progressDotActive,
              i + 1 === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      {/* Bottom Button */}
      {step < TOTAL_STEPS && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={[styles.nextButtonText, !canProceed() && styles.nextButtonTextDisabled]}>Continue</Text>
            <ArrowRight2 size={18} color={canProceed() ? colors.white : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 17, fontWeight: '700',
    color: colors.textPrimary, textAlign: 'center',
  },
  stepIndicator: {
    fontSize: 13, color: colors.textTertiary, fontWeight: '500',
    minWidth: 40, textAlign: 'right',
  },
  progressContainer: {
    flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12,
  },
  progressDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderSubtle,
  },
  progressDotActive: { backgroundColor: colors.primary },
  progressDotCurrent: { width: 24, borderRadius: 4 },
  scrollContent: { paddingBottom: 100 },
  stepContent: { padding: 20 },
  stepTitle: {
    fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 6,
  },
  inputHint: {
    fontSize: 12, color: colors.textTertiary, marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.bgElevated, borderRadius: 12, padding: 14,
    fontSize: 15, color: colors.textPrimary, borderWidth: 1,
    borderColor: colors.borderSubtle, marginBottom: 16,
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  charCount: {
    fontSize: 11, color: colors.textTertiary, textAlign: 'right', marginTop: -12, marginBottom: 16,
  },

  // Category Cards
  categoryCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16,
    backgroundColor: colors.bgElevated, borderWidth: 2, borderColor: colors.borderSubtle, marginBottom: 12,
  },
  categoryIcon: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  categoryInfo: { flex: 1 },
  categoryLabel: {
    fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2,
  },
  categoryDesc: {
    fontSize: 12, color: colors.textSecondary,
  },

  // Photo
  photoUpload: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.bgElevated, borderRadius: 12, padding: 16,
    borderWidth: 2, borderColor: colors.borderSubtle, borderStyle: 'dashed', marginBottom: 16,
  },
  photoUploadText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  // Included items
  addItemRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addItemInput: { flex: 1, marginBottom: 0 },
  addItemBtn: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  includedItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#22C55E10', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6,
  },
  includedItemText: { fontSize: 13, color: '#22C55E', fontWeight: '500' },

  // Review
  reviewCard: {
    backgroundColor: colors.bgElevated, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: colors.borderSubtle,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, marginBottom: 20,
  },
  reviewCatBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, marginBottom: 10,
  },
  reviewCatText: { fontSize: 12, fontWeight: '600' },
  reviewTitle: {
    fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8, lineHeight: 24,
  },
  reviewDesc: {
    fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 14,
  },
  reviewRow: {
    flexDirection: 'row', paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: colors.borderSubtle,
  },
  reviewLabel: {
    fontSize: 13, color: colors.textTertiary, fontWeight: '500', width: 90,
  },
  reviewValue: {
    flex: 1, fontSize: 13, color: colors.textPrimary, fontWeight: '500',
  },
  publishButton: {
    backgroundColor: '#22C55E', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  publishButtonText: { fontSize: 16, fontWeight: '700', color: colors.white },
  publishNote: {
    fontSize: 12, color: colors.textTertiary, textAlign: 'center', marginTop: 10,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.bgElevated, paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.borderSubtle,
  },
  nextButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
  },
  nextButtonDisabled: { backgroundColor: colors.borderSubtle },
  nextButtonText: { fontSize: 16, fontWeight: '700', color: colors.white },
  nextButtonTextDisabled: { color: colors.textTertiary },
});
