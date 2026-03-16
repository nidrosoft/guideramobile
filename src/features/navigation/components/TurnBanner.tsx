/**
 * TURN BANNER
 *
 * Top banner showing the next turn-by-turn instruction during navigation.
 * Slides in when navigating, hidden otherwise.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUp, ArrowLeft2, ArrowRight2 } from 'iconsax-react-native';
import { spacing } from '@/styles';

interface TurnBannerProps {
  instruction: string;
  distanceToNext?: number; // meters
  visible: boolean;
}

export default function TurnBanner({ instruction, distanceToNext, visible }: TurnBannerProps) {
  const insets = useSafeAreaInsets();
  if (!visible || !instruction) return null;

  const formatDist = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  const icon = instruction.toLowerCase().includes('left')
    ? <ArrowLeft2 size={24} color="#FFFFFF" variant="Bold" />
    : instruction.toLowerCase().includes('right')
    ? <ArrowRight2 size={24} color="#FFFFFF" variant="Bold" />
    : <ArrowUp size={24} color="#FFFFFF" variant="Bold" />;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]}>
      <View style={styles.iconBox}>{icon}</View>
      <View style={styles.content}>
        <Text style={styles.instruction} numberOfLines={2}>{instruction}</Text>
        {distanceToNext !== undefined && distanceToNext > 0 && (
          <Text style={styles.distance}>{formatDist(distanceToNext)}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    backgroundColor: 'rgba(18,18,30,0.92)',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    gap: spacing.md,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(78,205,196,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1 },
  instruction: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', lineHeight: 20 },
  distance: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
});
