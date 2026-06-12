/**
 * Tooltip card for a tour step. Auto-positions above or below the cutout
 * (whichever has more room), clamped to the screen. Brand DS styling.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import type { AnchorFrame } from './anchorRegistry';

const CARD_WIDTH_MAX = 340;
const CARD_MARGIN = 16;
const ESTIMATED_CARD_HEIGHT = 168;

interface Props {
  frame: AnchorFrame | null;
  titleKey: string;
  bodyKey: string;
  stepIndex: number;
  stepCount: number;
  isFirst: boolean;
  isLast: boolean;
  ctaLabelKey?: string;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function TourTooltip({
  frame,
  titleKey,
  bodyKey,
  stepIndex,
  stepCount,
  isFirst,
  isLast,
  ctaLabelKey,
  onNext,
  onBack,
  onSkip,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const cardWidth = Math.min(CARD_WIDTH_MAX, width - CARD_MARGIN * 2);

  // Decide above/below the cutout based on available room.
  let top: number;
  if (!frame) {
    top = height / 2 - ESTIMATED_CARD_HEIGHT / 2;
  } else {
    const roomBelow = height - (frame.y + frame.height) - insets.bottom;
    const roomAbove = frame.y - insets.top;
    if (roomBelow >= ESTIMATED_CARD_HEIGHT + 24) {
      top = frame.y + frame.height + 16;
    } else if (roomAbove >= ESTIMATED_CARD_HEIGHT + 24) {
      top = frame.y - ESTIMATED_CARD_HEIGHT - 16;
    } else {
      // not enough room either side — pin near the bottom
      top = height - ESTIMATED_CARD_HEIGHT - insets.bottom - 24;
    }
  }

  // Horizontal: center on the cutout, clamped.
  let left = CARD_MARGIN;
  if (frame) {
    const centered = frame.x + frame.width / 2 - cardWidth / 2;
    left = Math.max(CARD_MARGIN, Math.min(centered, width - cardWidth - CARD_MARGIN));
  }

  const ctaLabel = ctaLabelKey
    ? t(ctaLabelKey)
    : isLast
      ? t('guidance.common.finish')
      : t('guidance.common.next');

  return (
    <View
      style={[
        styles.card,
        {
          width: cardWidth,
          top,
          left,
          backgroundColor: colors.bgModal,
          borderColor: colors.borderMedium,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${t('guidance.common.stepOf', { current: stepIndex + 1, total: stepCount })}. ${t(titleKey)}. ${t(bodyKey)}`}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t(titleKey)}</Text>
        <TouchableOpacity
          onPress={onSkip}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('guidance.common.skip')}
        >
          <Text style={[styles.skip, { color: colors.textTertiary }]}>
            {t('guidance.common.skip')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.body, { color: colors.textSecondary }]}>{t(bodyKey)}</Text>

      <View style={styles.footerRow}>
        <View style={styles.dots}>
          {Array.from({ length: stepCount }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === stepIndex ? colors.primary : colors.gray300 },
                i === stepIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          {!isFirst && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button">
              <Text style={[styles.backText, { color: colors.textSecondary }]}>
                {t('guidance.common.back')}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onNext}
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
          >
            <Text style={[styles.nextText, { color: colors.primaryText }]}>{ctaLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: { flex: 1, fontFamily: 'HostGrotesk-Bold', fontSize: 17, marginRight: 12 },
  skip: { fontSize: 13, fontFamily: 'Rubik-Medium' },
  body: { fontSize: 14, lineHeight: 20, fontFamily: 'Rubik-Regular' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 16 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  backText: { fontSize: 14, fontFamily: 'Rubik-Medium' },
  nextBtn: { paddingVertical: 9, paddingHorizontal: 20, borderRadius: 12 },
  nextText: { fontSize: 14, fontFamily: 'Rubik-SemiBold' },
});

export default TourTooltip;
