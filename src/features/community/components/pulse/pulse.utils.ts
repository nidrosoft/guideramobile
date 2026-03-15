/**
 * PULSE UTILITIES
 *
 * Shared helpers for the Pulse (meetup) feature.
 * 10 activity categories modeled after NomadTable:
 * Food & Drink, Nightlife, Sightseeing, Outdoor & Active,
 * Entertainment, Shopping, Rideshare, Wellness, Social, Other
 */

import type { Activity } from '@/services/community/types/community.types';

export interface ActivityCategory {
  id: string;
  label: string;
  emoji: string;
  sublabels: string[];
}

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { id: 'food_drink', label: 'Food & Drink', emoji: String.fromCodePoint(0x1F354), sublabels: ['Restaurant', 'Bar', 'Cafe'] },
  { id: 'nightlife', label: 'Nightlife', emoji: String.fromCodePoint(0x1F319), sublabels: ['Clubs', 'Parties', 'Events'] },
  { id: 'sightseeing', label: 'Sightseeing', emoji: String.fromCodePoint(0x1F4F8), sublabels: ['Tour', 'Landmark', 'Exploring'] },
  { id: 'outdoor', label: 'Outdoor & Active', emoji: String.fromCodePoint(0x1F3D5), sublabels: ['Hiking', 'Sports', 'Fitness'] },
  { id: 'entertainment', label: 'Entertainment', emoji: String.fromCodePoint(0x1F3AC), sublabels: ['Movies', 'Shows', 'Museum'] },
  { id: 'shopping', label: 'Shopping', emoji: String.fromCodePoint(0x1F6D2), sublabels: ['Market', 'Mall', 'Boutique'] },
  { id: 'rideshare', label: 'Rideshare', emoji: String.fromCodePoint(0x1F695), sublabels: ['Split ride', 'Carpool'] },
  { id: 'wellness', label: 'Wellness', emoji: String.fromCodePoint(0x2728), sublabels: ['Yoga', 'Spa', 'Meditation'] },
  { id: 'social', label: 'Social', emoji: String.fromCodePoint(0x1F44B), sublabels: ['Hangout', 'Chat', 'Meetup'] },
  { id: 'other', label: 'Other', emoji: String.fromCodePoint(0x1F4CC), sublabels: ['Something else'] },
];

export const ACTIVITY_FILTER_CHIPS = [
  { id: 'all', label: 'All', emoji: '✨' },
  ...ACTIVITY_CATEGORIES.map(c => ({ id: c.id, label: c.label.split(' ')[0], emoji: c.emoji })),
];

export function getActivityIcon(type: string): string {
  const cat = ACTIVITY_CATEGORIES.find(c => c.id === type);
  if (cat) return cat.emoji;
  // Legacy type fallback
  switch (type) {
    case 'coffee': return '☕';
    case 'food': return '🍽️';
    case 'drinks': return '🍻';
    case 'sightseeing': return '📸';
    case 'walking_tour': return '🚶';
    case 'museum': return '🏛️';
    case 'nightlife': return '🌙';
    case 'sports': return '⚽';
    case 'coworking': return '💻';
    case 'language_exchange': return '🗣️';
    default: return '📍';
  }
}

export function getTimingLabel(activity: Activity): string {
  if (activity.timing === 'now') return 'Happening now';
  if (activity.timing === 'today') return 'Today';
  if (activity.timing === 'tomorrow') return 'Tomorrow';
  if (activity.scheduledFor) {
    return new Date(activity.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return 'Soon';
}
