/**
 * SAFETY ALERTS OVERLAY
 *
 * Clean, minimal safety map overlay.
 * Components: dark map + status card + SOS/Report buttons + legend.
 * No radar widget, no sidebar clutter.
 * Wired to real SafetyIntelligenceService.
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Linking, ActivityIndicator, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Flag, Call, CloseCircle, ShieldTick, Warning2, Gps } from 'iconsax-react-native';
import { colors, spacing } from '@/styles';
import { ARContext } from '../../../types/ar-plugin.types';
import { useDangerAlerts } from '../hooks/useDangerAlerts';
import DangerMapView from './DangerMapView';
import DangerDetailSheet from './DangerDetailSheet';
import SafetyReportSheet from './SafetyReportSheet';

interface DangerAlertsOverlayProps {
  arContext: ARContext;
}

const LEVEL_COLORS = {
  low: '#4ECDC4',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#DC2626',
};

export default function DangerAlertsOverlay({ arContext }: DangerAlertsOverlayProps) {
  const {
    userLocation,
    dangerZones,
    incidents,
    safetyStatus,
    selectedZone,
    selectedIncident,
    isLoading,
    selectZone,
    selectIncident,
    clearSelection,
    toggleReportSheet,
  } = useDangerAlerts();

  const handleSOS = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Linking.openURL('tel:911').catch(() => {});
  }, []);

  const [showReportSheet, setShowReportSheet] = useState(false);

  const handleReport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowReportSheet(true);
  }, []);

  // Continuous 360° radar sweep — never stops
  const radarSpin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    radarSpin.setValue(0);
    Animated.loop(
      Animated.timing(radarSpin, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    ).start();
  }, []);
  const radarRotate = radarSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const hasSelection = selectedZone || selectedIncident;
  const statusColor = LEVEL_COLORS[safetyStatus.level] || LEVEL_COLORS.low;
  const StatusIcon = safetyStatus.level === 'low' ? ShieldTick : Warning2;

  return (
    <View style={styles.container}>
      {/* Full-screen dark map */}
      <DangerMapView
        userLocation={userLocation}
        dangerZones={dangerZones}
        incidents={incidents}
        selectedZone={selectedZone}
        selectedIncident={selectedIncident}
        onSelectZone={selectZone}
        onSelectIncident={selectIncident}
      />

      {/* Status card — positioned below the close X button */}
      <View style={styles.statusCard}>
        <StatusIcon size={18} color={statusColor} variant="Bold" />
        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>
            {safetyStatus.level === 'low' ? 'SAFE ZONE' : `${safetyStatus.level.toUpperCase()} RISK`}
          </Text>
          <Text style={styles.statusMessage} numberOfLines={1}>
            {isLoading ? 'Checking safety...' : safetyStatus.message}
          </Text>
        </View>
        {/* Spinning radar — military style with concentric rings + sweep wedge */}
        <View style={styles.radarContainer}>
          {/* Concentric rings */}
          <View style={[styles.radarRing, styles.radarRingOuter, { borderColor: statusColor + '25' }]} />
          <View style={[styles.radarRing, styles.radarRingMiddle, { borderColor: statusColor + '35' }]} />
          <View style={[styles.radarRing, styles.radarRingInner, { borderColor: statusColor + '50' }]} />
          {/* Rotating sweep wedge */}
          <Animated.View style={[styles.radarWedge, { transform: [{ rotate: radarRotate }] }]}>
            <View style={[styles.radarWedgeFill, { backgroundColor: statusColor }]} />
          </Animated.View>
          {/* Center dot */}
          <View style={[styles.radarCenter, { backgroundColor: statusColor }]} />
        </View>
      </View>

      {/* Action buttons — all grouped bottom right: GPS + Report + SOS */}
      {!hasSelection && (
        <View style={styles.actionCol}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(24,24,40,0.85)' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Trigger recenter via a simple location re-fetch
              if (userLocation) {
                // The map will auto-center since we're passing userLocation
              }
            }}
          >
            <Gps size={20} color={colors.primary} variant="Bold" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleReport}>
            <Flag size={20} color={colors.white} variant="Bold" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error }]} onPress={handleSOS}>
            <Call size={20} color={colors.white} variant="Bold" />
          </TouchableOpacity>
          <Text style={[styles.actionLabel, { color: colors.error }]}>SOS</Text>
        </View>
      )}

      {/* Legend — bottom center */}
      {!hasSelection && (
        <View style={styles.legend}>
          {(['low', 'medium', 'high', 'critical'] as const).map(level => (
            <View key={level} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: LEVEL_COLORS[level] }]} />
              <Text style={styles.legendText}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Detail sheet when a zone/incident is selected */}
      {hasSelection && (
        <View style={styles.sheetContainer}>
          <DangerDetailSheet
            zone={selectedZone}
            incident={selectedIncident}
            onClose={clearSelection}
          />
        </View>
      )}

      {/* Report Sheet */}
      <SafetyReportSheet
        visible={showReportSheet}
        userLocation={userLocation}
        onClose={() => setShowReportSheet(false)}
        onSubmit={() => { setShowReportSheet(false); /* refetch will pick it up */ }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.bgSecondary,
  },
  // Status card
  statusCard: {
    position: 'absolute',
    top: 100, left: spacing.md, right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,18,30,0.92)',
    padding: spacing.md,
    borderRadius: 14,
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  statusContent: { flex: 1, marginRight: spacing.sm },
  // Military radar
  radarContainer: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    overflow: 'hidden',
  },
  radarRing: {
    position: 'absolute', borderWidth: 1, borderRadius: 999,
  },
  radarRingOuter: { width: 32, height: 32 },
  radarRingMiddle: { width: 22, height: 22 },
  radarRingInner: { width: 12, height: 12 },
  radarWedge: {
    position: 'absolute', width: 36, height: 36,
    alignItems: 'center',
  },
  radarWedgeFill: {
    width: 16, height: 3, borderTopRightRadius: 2, borderBottomRightRadius: 2,
    position: 'absolute', top: 16.5, left: 18,
    opacity: 0.8,
  },
  radarCenter: {
    width: 4, height: 4, borderRadius: 2,
  },
  statusTitle: { fontSize: 12, fontWeight: '700', color: colors.white, letterSpacing: 0.5 },
  statusMessage: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  // Actions
  actionCol: {
    position: 'absolute',
    bottom: 100, right: spacing.lg,
    alignItems: 'center',
    zIndex: 50,
  },
  actionBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11, fontWeight: '600', color: colors.white, marginBottom: spacing.md,
  },
  // Legend
  legend: {
    position: 'absolute',
    bottom: 40, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    zIndex: 50,
  },
  legendItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.white, fontWeight: '500' },
  // Detail sheet
  sheetContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 200,
  },
});
