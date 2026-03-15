/**
 * SAFETY TYPES
 *
 * Shared type definitions for the safety intelligence system.
 */

export type SafetyLevel = 'safe' | 'caution' | 'high' | 'critical';

export interface SafetyAlert {
  id: string;
  type: 'disaster' | 'crime' | 'advisory' | 'incident' | 'health' | 'unrest';
  level: SafetyLevel;
  title: string;
  description: string;
  source: string;
  coordinates?: { latitude: number; longitude: number };
  radius?: number;
  timestamp: Date;
  expiresAt?: Date;
  countryCode?: string;
  metadata?: Record<string, any>;
}

export interface SafetyZoneResult {
  level: SafetyLevel;
  score: number; // 0-100 combined score
  countryAdvisoryLevel?: number; // 1-4 from State Dept
  travelRiskScore?: number; // 1-5 from TravelRisk API
  crimeScore?: number; // 0-100 from CrimeoMeter
  alerts: SafetyAlert[];
  summary: string;
  countryCode?: string;
  countryName?: string;
}

export interface TravelRiskResponse {
  country: string;
  riskLevel: number; // 1-5
  advisories: {
    type: string;
    severity: string;
    description: string;
    location?: string;
    coordinates?: { lat: number; lng: number };
  }[];
}

export interface GDACSDisaster {
  id: string;
  type: 'earthquake' | 'flood' | 'cyclone' | 'volcano' | 'tsunami' | 'wildfire';
  severity: string;
  title: string;
  description: string;
  coordinates: { latitude: number; longitude: number };
  magnitude?: number;
  date: Date;
}

export interface StateDeptAdvisory {
  countryCode: string;
  countryName: string;
  level: number; // 1-4
  levelDescription: string;
  lastUpdated: string;
}

export interface CrimeData {
  totalIncidents: number;
  crimeScore: number; // 0-100
  incidents: {
    type: string;
    description: string;
    coordinates?: { latitude: number; longitude: number };
    date?: string;
  }[];
}

// Notification threshold config
export const SAFETY_THRESHOLDS = {
  safe: { maxScore: 25 },
  caution: { maxScore: 50 },
  high: { maxScore: 75 },
  critical: { maxScore: 100 },
} as const;

export function scoreToLevel(score: number): SafetyLevel {
  if (score <= SAFETY_THRESHOLDS.safe.maxScore) return 'safe';
  if (score <= SAFETY_THRESHOLDS.caution.maxScore) return 'caution';
  if (score <= SAFETY_THRESHOLDS.high.maxScore) return 'high';
  return 'critical';
}
