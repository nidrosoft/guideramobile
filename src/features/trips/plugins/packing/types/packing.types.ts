export enum PackingCategory {
  ESSENTIALS = 'essentials',
  DOCUMENTS = 'documents',
  CLOTHING = 'clothing',
  TOILETRIES = 'toiletries',
  ELECTRONICS = 'electronics',
  HEALTH = 'health',
  ACCESSORIES = 'accessories',
  WORK = 'work',
  ACTIVITIES = 'activities',
  BABY_KIDS = 'baby_kids',
  FAITH = 'faith',
  FOOD_SNACKS = 'food_snacks',
  CUSTOM = 'custom',
}

export type PackingPriority = 'critical' | 'essential' | 'recommended' | 'optional';

export interface PackingItem {
  id: string;
  name: string;
  category: PackingCategory;
  quantity: number;
  isPacked: boolean;
  isOptional: boolean;
  isSuggested: boolean;
  addedBy: 'system' | 'user';
  notes?: string;
  priority?: PackingPriority;
  reason?: string;
  actionRequired?: string;
  displayOrder?: number;
}

export interface CategoryInfo {
  id: PackingCategory;
  name: string;
  icon: string;
  color: string;
}

export interface PackingList {
  tripId: string;
  items: PackingItem[];
  totalItems: number;
  packedItems: number;
  progressPercentage: number;
  lastUpdated: Date;
}
