/**
 * Profile-strength milestone celebration. A centered card with confetti,
 * shown when the user crosses 50% / 80% / 100%.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { ProfileStrengthRing } from './ProfileStrengthRing';

const { width } = Dimensions.get('window');

interface Props {
  milestone: number;
  strength: number;
  onDismiss: () => void;
  reduceMotion?: boolean;
}

export function CelebrationCard({ milestone, strength, onDismiss, reduceMotion }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const firedHaptic = useRef(false);

  useEffect(() => {
    if (!firedHaptic.current) {
      firedHaptic.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    opacity.value = withTiming(1, { duration: 220 });
    scale.value = reduceMotion ? 1 : withSpring(1, { damping: 14, stiffness: 160 });
  }, [reduceMotion]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const key = milestone >= 100 ? 'm100' : milestone >= 80 ? 'm80' : 'm50';

  return (
    <View style={styles.backdrop}>
      {!reduceMotion && (
        <ConfettiCannon
          count={120}
          origin={{ x: width / 2, y: -20 }}
          fadeOut
          autoStart
          explosionSpeed={350}
          fallSpeed={2800}
        />
      )}
      <Animated.View style={[styles.card, { backgroundColor: colors.bgModal, borderColor: colors.borderMedium }, cardStyle]}>
        <ProfileStrengthRing value={strength} size={88} strokeWidth={8} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t(`guidance.celebrate.${key}.title`)}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{t(`guidance.celebrate.${key}.body`)}</Text>
        <TouchableOpacity
          onPress={onDismiss}
          style={[styles.btn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
        >
          <Text style={[styles.btnText, { color: colors.primaryText }]}>{t('guidance.celebrate.cta')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  title: { fontFamily: 'HostGrotesk-Bold', fontSize: 21, marginTop: 18, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 20, fontFamily: 'Rubik-Regular', marginTop: 8, textAlign: 'center' },
  btn: { marginTop: 22, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 14 },
  btnText: { fontSize: 15, fontFamily: 'Rubik-SemiBold' },
});

export default CelebrationCard;
