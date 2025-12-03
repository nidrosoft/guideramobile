/**
 * MOCK DANGER DATA
 * 
 * Sample danger zones and incidents for the Danger Alerts plugin.
 * Generated relative to user's location for demo purposes.
 */

import { 
  DangerZone, 
  Incident, 
  EmergencyContact, 
  Coordinates,
  DangerLevel,
  IncidentType,
} from '../types/dangerAlerts.types';

// Danger zone templates - will be offset from user location
const ZONE_TEMPLATES = [
  {
    id: 'zone-1',
    radius: 200,
    level: 'high' as DangerLevel,
    type: 'theft' as IncidentType,
    title: 'Pickpocket Hotspot',
    description: 'Multiple pickpocket incidents reported in this area. Keep valuables secure and stay alert.',
    reportCount: 47,
    offset: { lat: 0.004, lng: -0.002 },
  },
  {
    id: 'zone-2',
    radius: 150,
    level: 'medium' as DangerLevel,
    type: 'scam' as IncidentType,
    title: 'Tourist Scam Area',
    description: 'Beware of petition scammers and fake charity collectors in this area.',
    reportCount: 28,
    offset: { lat: -0.003, lng: 0.003 },
  },
  {
    id: 'zone-3',
    radius: 100,
    level: 'low' as DangerLevel,
    type: 'unsafe_area' as IncidentType,
    title: 'Poorly Lit Area',
    description: 'This area has limited street lighting. Use caution after dark.',
    reportCount: 12,
    offset: { lat: 0.002, lng: 0.004 },
  },
  {
    id: 'zone-4',
    radius: 180,
    level: 'critical' as DangerLevel,
    type: 'crime' as IncidentType,
    title: 'High Crime Zone',
    description: 'Avoid this area, especially at night. Multiple violent incidents reported.',
    reportCount: 89,
    offset: { lat: -0.005, lng: -0.001 },
  },
  {
    id: 'zone-5',
    radius: 120,
    level: 'medium' as DangerLevel,
    type: 'traffic' as IncidentType,
    title: 'Dangerous Intersection',
    description: 'High accident rate at this intersection. Cross with extreme caution.',
    reportCount: 34,
    offset: { lat: 0.001, lng: -0.004 },
  },
];

// Incident templates
const INCIDENT_TEMPLATES = [
  {
    id: 'incident-1',
    type: 'theft' as IncidentType,
    level: 'high' as DangerLevel,
    title: 'Phone Snatching',
    description: 'Someone on a scooter snatched a phone from a pedestrian.',
    verified: true,
    upvotes: 23,
    downvotes: 2,
    offset: { lat: 0.003, lng: -0.001 },
    hoursAgo: 2,
  },
  {
    id: 'incident-2',
    type: 'scam' as IncidentType,
    level: 'medium' as DangerLevel,
    title: 'Fake Taxi Scam',
    description: 'Unlicensed taxis overcharging tourists. Use official taxi stands only.',
    verified: true,
    upvotes: 45,
    downvotes: 3,
    offset: { lat: -0.002, lng: 0.002 },
    hoursAgo: 5,
  },
  {
    id: 'incident-3',
    type: 'unsafe_area' as IncidentType,
    level: 'low' as DangerLevel,
    title: 'Aggressive Panhandling',
    description: 'Aggressive panhandlers reported near the subway entrance.',
    verified: false,
    upvotes: 12,
    downvotes: 4,
    offset: { lat: 0.001, lng: 0.003 },
    hoursAgo: 8,
  },
  {
    id: 'incident-4',
    type: 'crime' as IncidentType,
    level: 'critical' as DangerLevel,
    title: 'Armed Robbery',
    description: 'Armed robbery reported. Police are investigating.',
    verified: true,
    upvotes: 67,
    downvotes: 1,
    offset: { lat: -0.004, lng: -0.002 },
    hoursAgo: 1,
  },
  {
    id: 'incident-5',
    type: 'assault' as IncidentType,
    level: 'high' as DangerLevel,
    title: 'Street Harassment',
    description: 'Multiple reports of harassment near the nightclub area.',
    verified: true,
    upvotes: 34,
    downvotes: 5,
    offset: { lat: 0.002, lng: -0.003 },
    hoursAgo: 3,
  },
];

/**
 * Generate danger zones around user location
 */
export function generateDangerZones(userLocation: Coordinates): DangerZone[] {
  return ZONE_TEMPLATES.map(template => ({
    id: template.id,
    coordinates: {
      latitude: userLocation.latitude + template.offset.lat,
      longitude: userLocation.longitude + template.offset.lng,
    },
    radius: template.radius,
    level: template.level,
    type: template.type,
    title: template.title,
    description: template.description,
    reportCount: template.reportCount,
    lastReported: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
    isActive: true,
  }));
}

/**
 * Generate incidents around user location
 */
export function generateIncidents(userLocation: Coordinates): Incident[] {
  return INCIDENT_TEMPLATES.map(template => ({
    id: template.id,
    coordinates: {
      latitude: userLocation.latitude + template.offset.lat,
      longitude: userLocation.longitude + template.offset.lng,
    },
    type: template.type,
    level: template.level,
    title: template.title,
    description: template.description,
    reportedAt: new Date(Date.now() - template.hoursAgo * 3600000),
    verified: template.verified,
    upvotes: template.upvotes,
    downvotes: template.downvotes,
  }));
}

/**
 * Default emergency contacts
 */
export const DEFAULT_EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: 'e1', name: 'Police', number: '911', type: 'police' },
  { id: 'e2', name: 'Ambulance', number: '911', type: 'ambulance' },
  { id: 'e3', name: 'Fire Department', number: '911', type: 'fire' },
];

/**
 * Get danger level color
 */
export function getDangerColor(level: DangerLevel): string {
  const colors: Record<DangerLevel, string> = {
    low: '#F59E0B',      // Amber
    medium: '#F97316',   // Orange
    high: '#EF4444',     // Red
    critical: '#DC2626', // Dark Red
  };
  return colors[level];
}

/**
 * Get danger level gradient
 */
export function getDangerGradient(level: DangerLevel): [string, string] {
  const gradients: Record<DangerLevel, [string, string]> = {
    low: ['#FCD34D', '#F59E0B'],
    medium: ['#FB923C', '#EA580C'],
    high: ['#F87171', '#DC2626'],
    critical: ['#EF4444', '#991B1B'],
  };
  return gradients[level];
}

/**
 * Get incident type icon name
 */
export function getIncidentIcon(type: IncidentType): string {
  const icons: Record<IncidentType, string> = {
    crime: 'shield-cross',
    theft: 'bag-cross',
    scam: 'message-question',
    assault: 'danger',
    unsafe_area: 'warning-2',
    traffic: 'car',
    natural: 'cloud-lightning',
    health: 'health',
    other: 'info-circle',
  };
  return icons[type];
}

/**
 * Get incident type label
 */
export function getIncidentLabel(type: IncidentType): string {
  const labels: Record<IncidentType, string> = {
    crime: 'Crime',
    theft: 'Theft',
    scam: 'Scam',
    assault: 'Assault',
    unsafe_area: 'Unsafe Area',
    traffic: 'Traffic',
    natural: 'Natural Hazard',
    health: 'Health Risk',
    other: 'Other',
  };
  return labels[type];
}
