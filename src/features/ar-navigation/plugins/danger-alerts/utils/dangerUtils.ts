/**
 * DANGER ALERTS UTILITIES
 * 
 * Color, icon, and label mappings for danger levels and incident types.
 * Extracted from mock data file for production use.
 */

import { DangerLevel, IncidentType, EmergencyContact } from '../types/dangerAlerts.types';

/**
 * Default emergency contacts — placeholder until real contacts are loaded
 * from the safety profile for the user's destination.
 */
export const DEFAULT_EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: 'e1', name: 'Emergency', number: '112', type: 'police' },
  { id: 'e2', name: 'Ambulance', number: '112', type: 'ambulance' },
  { id: 'e3', name: 'Fire', number: '112', type: 'fire' },
];

/**
 * Get danger level color
 */
export function getDangerColor(level: DangerLevel): string {
  const colors: Record<DangerLevel, string> = {
    low: '#F59E0B',
    medium: '#F97316',
    high: '#EF4444',
    critical: '#DC2626',
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
 * Get incident type icon name (iconsax)
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
