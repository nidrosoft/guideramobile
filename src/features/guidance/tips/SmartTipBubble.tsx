/**
 * Single-anchor one-off hint. A small bubble near the anchor with a short
 * message and a single "Got it" dismiss.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import type { AnchorFrame } from '../tour/anchorRegistry';

const CARD_WIDTH_MAX = 300;
const MARGIN = 16;
const EST_HEIGHT = 120;

interface Props {
  frame: AnchorFrame | null;
  titleKey: string;
  bodyKey: string;
  onDismiss: () => void;
}

export function SmartTipBubble({ frame, titleKey, bodyKey, onDismiss }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 220 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardWidth = Math.min(CARD_WIDTH_MAX, width - MARGIN * 2);

  let top = height / 2;
  let left = MARGIN;
  if (frame) {
    const roomBelow = height - (frame.y + frame.height) - insets.bottom;
    top =
      roomBelow >= EST_HEIGHT + 16
        ? frame.y + frame.height + 12
        : Math.max(insets.top + 8, frame.y - EST_HEIGHT - 12);
    const centered = frame.x + frame.width / 2 - cardWidth / 2;
    left = Math.max(MARGIN, Math.min(centered, width - cardWidth - MARGIN));
  }

  return (
    <Animated.View
      style={[
        styles.card,
        { width: cardWidth, top, left, backgroundColor: colors.primary },
        animStyle,
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${t(titleKey)}. ${t(bodyKey)}`}
    >
      <Text style={[styles.title, { color: colors.primaryText }]}>{t(titleKey)}</Text>
      <Text style={[styles.body, { color: colors.primaryText }]}>{t(bodyKey)}</Text>
      <TouchableOpacity onPress={onDismiss} style={styles.btn} accessibilityRole="button">
        <Text style={[styles.btnText, { color: colors.primaryText }]}>
          {t('guidance.common.gotIt')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  title: { fontSize: 14, fontFamily: 'Rubik-SemiBold', marginBottom: 3, opacity: 0.95 },
  body: { fontSize: 13, lineHeight: 18, fontFamily: 'Rubik-Regular', opacity: 0.9 },
  btn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  btnText: { fontSize: 13, fontFamily: 'Rubik-SemiBold' },
});

export default SmartTipBubble;
