/**
 * Inline profile-capture confirm card. Slides up above the tab bar, auto-hides
 * after 8s (counts as a soft dismiss — no decline cooldown). One tap to save;
 * never opens a form.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';

const AUTO_HIDE_MS = 8000;

interface Props {
  fact: string;
  benefit: string;
  onSave: () => void;
  onDismiss: () => void; // "Not now" — sets decline cooldown
  onSoftDismiss: () => void; // auto-hide / backdrop — no cooldown
  onSuppress: () => void; // "Don't suggest this"
}

export function PromptCard({ fact, benefit, onSave, onDismiss, onSoftDismiss, onSuppress }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 220 });
    timer.current = setTimeout(() => onSoftDismiss(), AUTO_HIDE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  const save = () => {
    clearTimer();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onSave();
  };
  const dismiss = () => {
    clearTimer();
    onDismiss();
  };
  const suppress = () => {
    clearTimer();
    onSuppress();
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          bottom: insets.bottom + 72,
          backgroundColor: colors.bgModal,
          borderColor: colors.borderMedium,
        },
        animStyle,
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${fact}. ${benefit}`}
    >
      <View style={styles.body}>
        <Text style={[styles.fact, { color: colors.textPrimary }]}>{fact}</Text>
        <Text style={[styles.benefit, { color: colors.textSecondary }]}>{benefit}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={dismiss} style={styles.ghostBtn} accessibilityRole="button">
          <Text style={[styles.ghostText, { color: colors.textSecondary }]}>
            {t('guidance.common.notNow')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={save}
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
        >
          <Text style={[styles.saveText, { color: colors.primaryText }]}>
            {t('guidance.common.save')}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={suppress}
        hitSlop={8}
        style={styles.suppress}
        accessibilityRole="button"
      >
        <Text style={[styles.suppressText, { color: colors.textTertiary }]}>
          {t('guidance.common.dontSuggest')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  body: { marginBottom: 12 },
  fact: { fontSize: 15, fontFamily: 'Rubik-SemiBold', marginBottom: 3 },
  benefit: { fontSize: 13, lineHeight: 18, fontFamily: 'Rubik-Regular' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  ghostBtn: { paddingVertical: 9, paddingHorizontal: 16 },
  ghostText: { fontSize: 14, fontFamily: 'Rubik-Medium' },
  saveBtn: { paddingVertical: 9, paddingHorizontal: 22, borderRadius: 12 },
  saveText: { fontSize: 14, fontFamily: 'Rubik-SemiBold' },
  suppress: { alignSelf: 'center', marginTop: 8, paddingVertical: 2 },
  suppressText: { fontSize: 11, fontFamily: 'Rubik-Regular' },
});

export default PromptCard;
