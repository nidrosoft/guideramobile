/**
 * DANGER ALERTS TYPES
 * 
 * Type definitions for the Danger Alerts plugin.
 */

export type DangerLevel = 'low' | 'medium' | 'high' | 'critical';

export type IncidentType = 
  | 'crime'
  | 'theft'
  | 'scam'
  | 'assault'
  | 'unsafe_area'
  | 'traffic'
  | 'natural'
  | 'health'
  | 'other';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DangerZone {
  id: string;
  coordinates: Coordinates;
  radius: number; // in meters
  level: DangerLevel;
  type: IncidentType;
  title: string;
  description: string;
  reportCount: number;
  lastReported: Date;
  isActive: boolean;
}

export interface Incident {
  id: string;
  coordinates: Coordinates;
  type: IncidentType;
  level: DangerLevel;
  title: string;
  description: string;
  reportedAt: Date;
  reportedBy?: string;
  verified: boolean;
  upvotes: number;
  downvotes: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  type: 'police' | 'ambulance' | 'fire' | 'embassy' | 'custom';
  country?: string;
}

export interface SafetyStatus {
  level: DangerLevel;
  nearestDanger: number | null; // distance in meters
  activeAlerts: number;
  message: string;
}

export interface DangerAlertsState {
  userLocation: Coordinates | null;
  dangerZones: DangerZone[];
  incidents: Incident[];
  safetyStatus: SafetyStatus;
  selectedZone: DangerZone | null;
  selectedIncident: Incident | null;
  isLoading: boolean;
  showReportSheet: boolean;
  emergencyContacts: EmergencyContact[];
}
