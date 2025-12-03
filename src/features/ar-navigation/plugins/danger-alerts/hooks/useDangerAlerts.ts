/**
 * USE DANGER ALERTS HOOK
 * 
 * Main state management hook for the Danger Alerts plugin.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import {
  DangerZone,
  Incident,
  Coordinates,
  SafetyStatus,
  DangerAlertsState,
  DangerLevel,
} from '../types/dangerAlerts.types';
import {
  generateDangerZones,
  generateIncidents,
  DEFAULT_EMERGENCY_CONTACTS,
} from '../data/mockDangerData';

// Zone alert state
interface ZoneAlert {
  visible: boolean;
  type: 'entering_danger' | 'exiting_danger' | 'safe_zone' | 'warning';
  title: string;
  subtitle: string;
  radius?: string;
  description?: string;
  dangerLevel?: DangerLevel;
}

interface ExtendedDangerAlertsState extends DangerAlertsState {
  zoneAlert: ZoneAlert;
  currentZone: DangerZone | null;
}

const INITIAL_ZONE_ALERT: ZoneAlert = {
  visible: false,
  type: 'safe_zone',
  title: '',
  subtitle: '',
};

const INITIAL_STATE: ExtendedDangerAlertsState = {
  userLocation: null,
  dangerZones: [],
  incidents: [],
  safetyStatus: {
    level: 'low',
    nearestDanger: null,
    activeAlerts: 0,
    message: 'Checking safety status...',
  },
  selectedZone: null,
  selectedIncident: null,
  isLoading: true,
  showReportSheet: false,
  emergencyContacts: DEFAULT_EMERGENCY_CONTACTS,
  zoneAlert: INITIAL_ZONE_ALERT,
  currentZone: null,
};

export function useDangerAlerts() {
  const [state, setState] = useState<ExtendedDangerAlertsState>(INITIAL_STATE);
  const lastAlertRef = useRef<string | null>(null);
  const currentZoneRef = useRef<string | null>(null);
  const dataLoadedRef = useRef(false);

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setState(prev => ({
          ...prev,
          userLocation: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        }));
      } catch (error) {
        console.error('Error getting location:', error);
        // Use mock location if location fails
        setState(prev => ({
          ...prev,
          userLocation: { latitude: 32.7767, longitude: -117.0713 },
        }));
      }
    })();
  }, []);

  // Load danger data when location is available
  useEffect(() => {
    if (state.userLocation) {
      loadDangerData();
    }
  }, [state.userLocation]);

  // Update safety status when zones change
  useEffect(() => {
    if (state.userLocation && state.dangerZones.length > 0) {
      updateSafetyStatus();
      checkZoneEntryExit();
    }
  }, [state.userLocation, state.dangerZones]);

  // Check if user entered or exited a zone
  const checkZoneEntryExit = useCallback(() => {
    if (!state.userLocation || state.dangerZones.length === 0) return;

    let insideZone: DangerZone | null = null;

    // Find if user is inside any zone
    for (const zone of state.dangerZones) {
      const distance = calculateDistance(state.userLocation, zone.coordinates);
      if (distance < zone.radius) {
        insideZone = zone;
        break;
      }
    }

    const previousZoneId = currentZoneRef.current;
    const currentZoneId = insideZone?.id || null;

    // Zone entry
    if (currentZoneId && currentZoneId !== previousZoneId) {
      currentZoneRef.current = currentZoneId;
      setState(prev => ({
        ...prev,
        currentZone: insideZone,
        zoneAlert: {
          visible: true,
          type: 'entering_danger',
          title: 'TIME SENSITIVE',
          subtitle: `You are in ${insideZone!.title}`,
          radius: `${insideZone!.radius}m radius!`,
          description: insideZone!.description,
          dangerLevel: insideZone!.level,
        },
      }));
    }
    // Zone exit
    else if (!currentZoneId && previousZoneId) {
      currentZoneRef.current = null;
      setState(prev => ({
        ...prev,
        currentZone: null,
        zoneAlert: {
          visible: true,
          type: 'safe_zone',
          title: 'You are Safe!',
          subtitle: 'You are around safe zone',
          radius: 'Safe area',
          description: "You're in the safe zone. Relax, you're completely safe, no threats around you",
        },
      }));
    }
  }, [state.userLocation, state.dangerZones]);

  // Load danger zones and incidents
  const loadDangerData = useCallback(() => {
    if (!state.userLocation || dataLoadedRef.current) return;
    
    dataLoadedRef.current = true;
    setState(prev => ({ ...prev, isLoading: true }));

    // Simulate API call
    setTimeout(() => {
      const zones = generateDangerZones(state.userLocation!);
      const incidents = generateIncidents(state.userLocation!);

      setState(prev => ({
        ...prev,
        dangerZones: zones,
        incidents: incidents,
        isLoading: false,
      }));

      console.log('🚨 Loaded', zones.length, 'danger zones and', incidents.length, 'incidents');
    }, 500);
  }, [state.userLocation]);

  // Calculate safety status based on proximity to danger zones
  const updateSafetyStatus = useCallback(() => {
    if (!state.userLocation || state.dangerZones.length === 0) return;

    let nearestDistance = Infinity;
    let highestLevel: DangerLevel = 'low';
    let activeAlerts = 0;

    state.dangerZones.forEach(zone => {
      const distance = calculateDistance(state.userLocation!, zone.coordinates);
      
      // Check if user is within or near the zone
      if (distance < zone.radius * 1.5) {
        activeAlerts++;
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
        }

        // Update highest danger level
        const levels: DangerLevel[] = ['low', 'medium', 'high', 'critical'];
        if (levels.indexOf(zone.level) > levels.indexOf(highestLevel)) {
          highestLevel = zone.level;
        }
      }
    });

    // Determine safety message based on highest level
    let message = 'You are in a safe area';
    if (activeAlerts > 0) {
      const levelMessages: Record<DangerLevel, string> = {
        critical: 'DANGER! Leave this area immediately',
        high: 'High risk area - Stay alert',
        medium: 'Caution advised in this area',
        low: 'Minor safety concerns nearby',
      };
      message = levelMessages[highestLevel];

      // Trigger haptic feedback for new alerts
      if (lastAlertRef.current !== highestLevel && highestLevel !== 'low') {
        Haptics.notificationAsync(
          highestLevel === 'critical' 
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Warning
        );
        lastAlertRef.current = highestLevel;
      }
    } else {
      lastAlertRef.current = null;
    }

    setState(prev => ({
      ...prev,
      safetyStatus: {
        level: activeAlerts > 0 ? highestLevel : 'low',
        nearestDanger: nearestDistance === Infinity ? null : Math.round(nearestDistance),
        activeAlerts,
        message,
      },
    }));
  }, [state.userLocation, state.dangerZones]);

  // Select a danger zone
  const selectZone = useCallback((zone: DangerZone | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(prev => ({ 
      ...prev, 
      selectedZone: zone,
      selectedIncident: null,
    }));
  }, []);

  // Select an incident
  const selectIncident = useCallback((incident: Incident | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(prev => ({ 
      ...prev, 
      selectedIncident: incident,
      selectedZone: null,
    }));
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedZone: null,
      selectedIncident: null,
    }));
  }, []);

  // Toggle report sheet
  const toggleReportSheet = useCallback((show: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState(prev => ({ ...prev, showReportSheet: show }));
  }, []);

  // Dismiss zone alert
  const dismissZoneAlert = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoneAlert: { ...prev.zoneAlert, visible: false },
    }));
  }, []);

  // Manually trigger a zone alert (for testing)
  const triggerZoneAlert = useCallback((type: 'entering_danger' | 'safe_zone', zone?: DangerZone) => {
    if (type === 'entering_danger' && zone) {
      setState(prev => ({
        ...prev,
        zoneAlert: {
          visible: true,
          type: 'entering_danger',
          title: 'TIME SENSITIVE',
          subtitle: `You are in ${zone.title}`,
          radius: `${zone.radius}m radius!`,
          description: zone.description,
          dangerLevel: zone.level,
        },
      }));
    } else {
      setState(prev => ({
        ...prev,
        zoneAlert: {
          visible: true,
          type: 'safe_zone',
          title: 'You are Safe!',
          subtitle: 'You are around safe zone',
          radius: 'Safe area',
          description: "You're in the safe zone. Relax, you're completely safe, no threats around you",
        },
      }));
    }
  }, []);

  // Report new incident
  const reportIncident = useCallback((incident: Partial<Incident>) => {
    if (!state.userLocation) return;

    const newIncident: Incident = {
      id: `incident-${Date.now()}`,
      coordinates: state.userLocation,
      type: incident.type || 'other',
      level: incident.level || 'medium',
      title: incident.title || 'New Report',
      description: incident.description || '',
      reportedAt: new Date(),
      verified: false,
      upvotes: 0,
      downvotes: 0,
    };

    setState(prev => ({
      ...prev,
      incidents: [newIncident, ...prev.incidents],
      showReportSheet: false,
    }));

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('📝 New incident reported:', newIncident.title);
  }, [state.userLocation]);

  return {
    ...state,
    loadDangerData,
    selectZone,
    selectIncident,
    clearSelection,
    toggleReportSheet,
    reportIncident,
    dismissZoneAlert,
    triggerZoneAlert,
  };
}

// Helper: Calculate distance between two coordinates
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3;
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
