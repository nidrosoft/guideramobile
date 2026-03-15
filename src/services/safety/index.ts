/**
 * SAFETY SERVICES — Barrel Exports
 *
 * Real-time safety intelligence system for Guidera.
 * Combines TravelRisk API, GDACS, US State Dept, and CrimeoMeter
 * with background geofencing and smart push notifications.
 */

export { safetyIntelligenceService } from './safety-intelligence.service';
export {
  startSafetyMonitoring,
  stopSafetyMonitoring,
  isSafetyMonitoringActive,
  checkCurrentLocationSafety,
} from './geofencing.service';
export { sendSafetyNotification } from './safety-notifications';
export * from './types/safety.types';
