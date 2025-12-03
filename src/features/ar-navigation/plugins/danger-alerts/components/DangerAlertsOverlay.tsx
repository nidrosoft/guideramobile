/**
 * DANGER ALERTS OVERLAY
 * 
 * Main overlay component for the Danger Alerts plugin.
 * Premium dark-themed safety map with animated radar.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { 
  Add,
  Call,
} from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { ARContext } from '../../../types/ar-plugin.types';
import { useDangerAlerts } from '../hooks/useDangerAlerts';

// Components
import DangerMapView from './DangerMapView';
import SafetyRadar from './SafetyRadar';
import SafetyStatusBar from './SafetyStatusBar';
import DangerDetailSheet from './DangerDetailSheet';
import ZoneAlertPopup from './ZoneAlertPopup';

interface DangerAlertsOverlayProps {
  arContext: ARContext;
}

export default function DangerAlertsOverlay({ arContext }: DangerAlertsOverlayProps) {
  const {
    userLocation,
    dangerZones,
    incidents,
    safetyStatus,
    selectedZone,
    selectedIncident,
    isLoading,
    emergencyContacts,
    zoneAlert,
    selectZone,
    selectIncident,
    clearSelection,
    toggleReportSheet,
    dismissZoneAlert,
    triggerZoneAlert,
  } = useDangerAlerts();

  // Handle emergency call
  const handleEmergencyCall = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // In production, this would open the phone dialer
    console.log('🚨 Emergency call initiated');
  }, []);

  // Handle new report
  const handleNewReport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleReportSheet(true);
  }, [toggleReportSheet]);

  // Handle zone selection - show popup first, then detail sheet
  const handleSelectZone = useCallback((zone: any) => {
    // Show the zone alert popup
    triggerZoneAlert('entering_danger', zone);
    // Also select the zone to show detail sheet
    selectZone(zone);
  }, [triggerZoneAlert, selectZone]);

  const hasSelection = selectedZone || selectedIncident;

  return (
    <View style={styles.container}>
      {/* Dark themed map */}
      <DangerMapView
        userLocation={userLocation}
        dangerZones={dangerZones}
        incidents={incidents}
        selectedZone={selectedZone}
        selectedIncident={selectedIncident}
        onSelectZone={handleSelectZone}
        onSelectIncident={selectIncident}
      />

      {/* Safety Status Bar */}
      <SafetyStatusBar safetyStatus={safetyStatus} />

      {/* Safety Radar - Bottom left */}
      {!hasSelection && (
        <View style={styles.radarContainer}>
          <SafetyRadar safetyStatus={safetyStatus} size={100} />
        </View>
      )}

      {/* Action buttons - Bottom right */}
      {!hasSelection && (
        <View style={styles.actionButtons}>
          {/* Report button */}
          <TouchableOpacity
            style={styles.reportButton}
            onPress={handleNewReport}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.reportGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Add size={24} color={colors.white} variant="Bold" />
            </LinearGradient>
            <Text style={styles.reportText}>Report</Text>
          </TouchableOpacity>

          {/* Emergency button */}
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergencyCall}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.emergencyGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Call size={24} color={colors.white} variant="Bold" />
            </LinearGradient>
            <Text style={styles.emergencyText}>SOS</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Legend */}
      {!hasSelection && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Low</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
            <Text style={styles.legendText}>Medium</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>High</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.legendText}>Critical</Text>
          </View>
        </View>
      )}

      {/* Detail Sheet - Higher z-index to appear above buttons */}
      {hasSelection && (
        <View style={styles.sheetContainer}>
          <DangerDetailSheet
            zone={selectedZone}
            incident={selectedIncident}
            onClose={clearSelection}
          />
        </View>
      )}

      {/* Zone Alert Popup - Highest z-index */}
      <ZoneAlertPopup
        visible={zoneAlert.visible}
        type={zoneAlert.type}
        title={zoneAlert.title}
        subtitle={zoneAlert.subtitle}
        radius={zoneAlert.radius}
        description={zoneAlert.description}
        dangerLevel={zoneAlert.dangerLevel}
        onDismiss={dismissZoneAlert}
        autoDismissMs={6000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a2e',
  },
  sheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  radarContainer: {
    position: 'absolute',
    bottom: 120,
    left: spacing.lg,
    zIndex: 50,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 120,
    right: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 50,
  },
  reportButton: {
    alignItems: 'center',
  },
  reportGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  reportText: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  emergencyButton: {
    alignItems: 'center',
  },
  emergencyGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyText: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#EF4444',
  },
  legend: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    zIndex: 50,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
});
