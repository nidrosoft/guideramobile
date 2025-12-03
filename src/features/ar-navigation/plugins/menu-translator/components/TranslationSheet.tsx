/**
 * TRANSLATION SHEET
 * 
 * Bottom sheet for displaying translated text.
 * Shows original and translated content.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { DocumentCopy, Heart, LanguageSquare } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import * as Clipboard from 'expo-clipboard';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  detectedLanguage?: string;
  confidence?: number;
}

interface TranslationSheetProps {
  translation: TranslationResult;
  onSave?: () => void;
}

export default function TranslationSheet({ translation, onSave }: TranslationSheetProps) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(translation.translatedText);
    // TODO: Show toast notification
  };

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese',
      ar: 'Arabic',
      hi: 'Hindi',
      ru: 'Russian',
      th: 'Thai',
      vi: 'Vietnamese',
    };
    return languages[code] || code.toUpperCase();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Language Indicator */}
      <View style={styles.languageBar}>
        <View style={styles.languageTag}>
          <LanguageSquare size={16} color={colors.primary} variant="Bold" />
          <Text style={styles.languageText}>
            {getLanguageName(translation.sourceLanguage)}
          </Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.languageTag}>
          <LanguageSquare size={16} color={colors.success} variant="Bold" />
          <Text style={styles.languageText}>
            {getLanguageName(translation.targetLanguage)}
          </Text>
        </View>
      </View>

      {/* Original Text */}
      <View style={styles.textSection}>
        <Text style={styles.sectionLabel}>Original</Text>
        <View style={styles.textBox}>
          <Text style={styles.originalText}>{translation.originalText}</Text>
        </View>
      </View>

      {/* Translated Text */}
      <View style={styles.textSection}>
        <Text style={styles.sectionLabel}>Translation</Text>
        <View style={[styles.textBox, styles.translatedBox]}>
          <Text style={styles.translatedText}>{translation.translatedText}</Text>
        </View>
      </View>

      {/* Confidence Score (if available) */}
      {translation.confidence && (
        <View style={styles.confidenceBar}>
          <Text style={styles.confidenceLabel}>Confidence</Text>
          <View style={styles.confidenceTrack}>
            <View
              style={[
                styles.confidenceFill,
                { width: `${translation.confidence * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.confidenceValue}>
            {Math.round(translation.confidence * 100)}%
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
          <DocumentCopy size={20} color={colors.primary} variant="Bold" />
          <Text style={styles.actionText}>Copy</Text>
        </TouchableOpacity>

        {onSave && (
          <TouchableOpacity style={styles.actionButton} onPress={onSave}>
            <Heart size={20} color={colors.primary} variant="Bold" />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  languageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  languageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  languageText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  arrow: {
    fontSize: typography.fontSize.lg,
    color: colors.gray400,
    fontWeight: typography.fontWeight.bold,
  },
  textSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray600,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textBox: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  translatedBox: {
    backgroundColor: `${colors.primary}10`,
    borderColor: `${colors.primary}30`,
  },
  originalText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.gray700,
  },
  translatedText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  confidenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  confidenceLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray600,
  },
  confidenceTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    minWidth: 40,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.primary}15`,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  actionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});
