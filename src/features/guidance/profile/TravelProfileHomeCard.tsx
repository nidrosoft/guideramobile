/**
 * Home-screen Travel Profile card. Shown in place of the trip reminder when the
 * user has no upcoming/ongoing trip yet, so profile completion stays visible
 * every session until it's essentially complete.
 */
import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { ArrowRight2 } from 'iconsax-react-native';
import { colors as staticColors } from '@/styles';
import { ProfileStrengthRing } from './ProfileStrengthRing';

interface Props {
  strength: number;
}

export function TravelProfileHomeCard({ strength }: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  const onPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/account/profile-strength' as any);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} accessibilityRole="button">
      <LinearGradient
        colors={[staticColors.gradientStart, staticColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ProfileStrengthRing
          value={strength}
          size={56}
          strokeWidth={5}
          trackColor="rgba(255,255,255,0.28)"
          progressColor="#FFFFFF"
          textColor="#FFFFFF"
        />
        <Text style={styles.content}>
          <Text style={styles.title}>{t('guidance.hub.title')}{'\n'}</Text>
          <Text style={styles.subtitle}>{t('guidance.hub.homeNudgeBody')}</Text>
        </Text>
        <ArrowRight2 size={20} color="rgba(255,255,255,0.9)" variant="Linear" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: staticColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  content: { flex: 1 },
  title: { fontSize: 16, fontFamily: 'Rubik-SemiBold', color: '#FFFFFF', lineHeight: 22 },
  subtitle: { fontSize: 13, fontFamily: 'Rubik-Regular', color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
});

export default TravelProfileHomeCard;
