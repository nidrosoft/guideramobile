export enum PackingCategory {
  ESSENTIALS = 'essentials',
  CLOTHING = 'clothing',
  TOILETRIES = 'toiletries',
  ELECTRONICS = 'electronics',
  HEALTH = 'health',
  DOCUMENTS = 'documents',
  ACCESSORIES = 'accessories',
  ACTIVITIES = 'activities',
  CUSTOM = 'custom',
}

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
