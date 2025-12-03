/**
 * ACCOUNT TYPES
 * 
 * Type definitions for the Account feature.
 * Scalable structure for growing account sections.
 */

import { ComponentType } from 'react';
import { IconProps } from 'iconsax-react-native';

// Menu item that can have sub-items (recursive structure)
export interface AccountMenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: ComponentType<IconProps>;
  iconVariant?: 'Bold' | 'Outline' | 'Linear' | 'Broken' | 'Bulk' | 'TwoTone';
  iconColor?: string;
  route?: string;           // Navigation route
  action?: () => void;      // Custom action instead of navigation
  badge?: string | number;  // Badge count or text
  badgeColor?: string;
  showChevron?: boolean;
  disabled?: boolean;
  destructive?: boolean;    // Red styling for dangerous actions
  premium?: boolean;        // Premium feature indicator
  children?: AccountMenuItem[]; // Sub-menu items
}

// Section containing multiple menu items
export interface AccountSection {
  id: string;
  title?: string;           // Optional section header
  items: AccountMenuItem[];
  collapsible?: boolean;    // Can section be collapsed
  defaultCollapsed?: boolean;
}

// User profile data
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  location?: string;
  country?: string;
  language: string;
  currency: string;
  timezone?: string;
  dateOfBirth?: Date;
  gender?: string;
  ethnicity?: string;
  
  // Travel preferences
  travelPreferences?: {
    style?: string[];
    interests?: string[];
    dietaryRestrictions?: string[];
    accessibilityNeeds?: string[];
  };
  
  // Emergency contact
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Stats
  stats?: {
    tripsCompleted: number;
    countriesVisited: number;
    citiesExplored: number;
    reviewsWritten: number;
    photosShared: number;
    communitiesJoined: number;
  };
  
  // Membership
  membership?: {
    type: 'free' | 'premium' | 'pro';
    since: Date;
    expiresAt?: Date;
  };
  
  // Verification
  verified?: {
    email: boolean;
    phone: boolean;
    identity: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Settings categories
export type SettingsCategory = 
  | 'profile'
  | 'preferences'
  | 'privacy'
  | 'notifications'
  | 'security'
  | 'payment'
  | 'support'
  | 'legal'
  | 'about';

// Notification settings
export interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  
  // Granular settings
  tripReminders: boolean;
  dealAlerts: boolean;
  communityUpdates: boolean;
  safetyAlerts: boolean;
  bookingUpdates: boolean;
  promotions: boolean;
}

// Privacy settings
export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showLocation: boolean;
  showTrips: boolean;
  showStats: boolean;
  allowMessages: 'everyone' | 'friends' | 'none';
  dataSharing: boolean;
  analytics: boolean;
}

// Security settings
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  loginAlerts: boolean;
  trustedDevices: TrustedDevice[];
  activeSessions: ActiveSession[];
}

export interface TrustedDevice {
  id: string;
  name: string;
  type: 'phone' | 'tablet' | 'desktop';
  lastUsed: Date;
  location?: string;
}

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  startedAt: Date;
  current: boolean;
}

// Payment methods
export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'bank';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// Saved items
export interface SavedItem {
  id: string;
  type: 'destination' | 'hotel' | 'flight' | 'activity' | 'deal' | 'trip';
  title: string;
  subtitle?: string;
  image?: string;
  savedAt: Date;
  data: any; // Original item data
}

export interface SavedCollection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  items: SavedItem[];
  isDefault: boolean;
  createdAt: Date;
}
