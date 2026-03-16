/**
 * NAVIGATION HUD
 *
 * Bottom panel showing ETA, distance remaining, profile toggle, and stop button.
 * Displayed during active navigation.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car, Personalcard, Routing, CloseCircle, VolumeHigh, VolumeCross } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import type { NavigationProfile } from '../hooks/useOutdoorNavigation';

interface NavigationHUDProps {
  distanceRemaining: number;
  durationRemaining: number;
  destinationName: string;
  profile: NavigationProfile;
  voiceEnabled: boolean;
  onChangeProfile: (p: NavigationProfile) => void;
  onToggleVoice: () => void;
  onStop: () => void;
}

export default function NavigationHUD({
  distanceRemaining,
  durationRemaining,
  destinationName,
  profile,
  voiceEnabled,
  onChangeProfile,
  onToggleVoice,
  onStop,
}: NavigationHUDProps) {
  const { colors: tc } = useTheme();
  const insets = useSafeAreaInsets();

  const formatDist = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  const formatTime = (s: number) => {
    const mins = Math.round(s / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const profiles: { id: NavigationProfile; icon: any; label: string }[] = [
    { id: 'walking', icon: Personalcard, label: 'Walk' },
    { id: 'driving', icon: Car, label: 'Drive' },
    { id: 'cycling', icon: Routing, label: 'Bike' },
  ];

  return (
    <View style={[styles.hud, { paddingBottom: insets.bottom + spacing.sm, backgroundColor: tc.bgElevated }]}>
      {/* Destination + ETA row */}
      <View style={styles.topRow}>
        <View style={styles.etaBlock}>
          <Text style={[styles.etaValue, { color: tc.primary }]}>{formatTime(durationRemaining)}</Text>
          <Text style={[styles.etaLabel, { color: tc.textTertiary }]}>ETA</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.etaBlock}>
          <Text style={[styles.etaValue, { color: tc.textPrimary }]}>{formatDist(distanceRemaining)}</Text>
          <Text style={[styles.etaLabel, { color: tc.textTertiary }]}>Distance</Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onToggleVoice} style={styles.voiceBtn}>
          {voiceEnabled
            ? <VolumeHigh size={20} color={tc.primary} variant="Bold" />
            : <VolumeCross size={20} color={tc.textTertiary} variant="Bold" />}
        </TouchableOpacity>
      </View>

      {/* Destination name */}
      <Text style={[styles.destName, { color: tc.textSecondary }]} numberOfLines={1}>
        Navigating to {destinationName}
      </Text>

      {/* Profile toggle + Stop */}
      <View style={styles.bottomRow}>
        <View style={styles.profileRow}>
          {profiles.map(p => {
            const isActive = profile === p.id;
            const Icon = p.icon;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.profileChip, { backgroundColor: isActive ? tc.primary + '20' : 'transparent', borderColor: isActive ? tc.primary : tc.borderSubtle }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChangeProfile(p.id); }}
              >
                <Icon size={16} color={isActive ? tc.primary : tc.textTertiary} variant="Bold" />
                <Text style={[styles.profileLabel, { color: isActive ? tc.primary : tc.textTertiary }]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.stopBtn} onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); onStop(); }}>
          <CloseCircle size={18} color="#FFFFFF" variant="Bold" />
          <Text style={styles.stopText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 90,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  etaBlock: { alignItems: 'center' },
  etaValue: { fontSize: 20, fontWeight: '700' },
  etaLabel: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: spacing.lg },
  voiceBtn: { padding: 8 },
  destName: { fontSize: 13, marginBottom: spacing.md },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileRow: { flexDirection: 'row', gap: 8 },
  profileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
  },
  profileLabel: { fontSize: 12, fontWeight: '600' },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EF4444', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  stopText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
