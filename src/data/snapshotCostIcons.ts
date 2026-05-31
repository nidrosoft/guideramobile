import { Cup } from 'iconsax-react-native';
import type { ComponentType } from 'react';
import { categories } from '@/data/categories';

export interface SnapshotCostIcon {
  icon: ComponentType<{ size: number; color: string; variant?: 'Linear' | 'Outline' | 'Bold' | 'Broken' | 'Bulk' | 'TwoTone' }>;
  color: string;
  bgColor: string;
}

function cat(name: string) {
  const match = categories.find((c) => c.name === name);
  if (!match) throw new Error(`Missing category: ${name}`);
  return match;
}

/** Matches home page category slider styling */
export const SNAPSHOT_COST_ICONS = {
  flights: cat('Flight'),
  hotels: cat('Hotel'),
  food: { icon: Cup, color: '#10B981', bgColor: '#10B98115' },
  experiences: cat('Experiences'),
  miscellaneous: cat('Car'),
} satisfies Record<string, SnapshotCostIcon>;
