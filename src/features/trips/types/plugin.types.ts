/**
 * PLUGIN TYPES
 * Type definitions for the plugin system
 */

import { ComponentType } from 'react';
import { Trip, TripState } from './trip.types';

// Plugin Configuration
export interface PluginConfig {
  maxInstances?: number;
  persistData?: boolean;
  requiresInternet?: boolean;
  [key: string]: any;
}

// Plugin Permissions
export type Permission = 'location' | 'notifications' | 'camera' | 'storage';

// Plugin Props
export interface PluginProps {
  trip: Trip;
  canEdit: boolean;
  onUpdate?: (data: any) => void;
  onClose?: () => void;
}

// Plugin Interface
export interface TripPlugin {
  id: string;
  name: string;
  icon: string;
  description: string;
  version: string;
  
  // Plugin component
  Component: ComponentType<PluginProps>;
  
  // Availability
  availableInStates: TripState[];
  
  // Configuration
  config: PluginConfig;
  permissions?: Permission[];
  dependencies?: string[];
  
  // Lifecycle hooks (optional)
  onInitialize?: (trip: Trip) => Promise<void>;
  onActivate?: () => Promise<void>;
  onDeactivate?: () => Promise<void>;
  onCleanup?: () => Promise<void>;
  
  // Event handlers (optional)
  onTripStateChange?: (oldState: TripState, newState: TripState) => void;
  onBookingAdded?: (bookingId: string) => void;
  onBookingRemoved?: (bookingId: string) => void;
}

// Plugin Instance (runtime)
export interface PluginInstance {
  pluginId: string;
  tripId: string;
  isActive: boolean;
  data: any;
  lastAccessed: Date;
}

// Plugin Registry
export type PluginRegistry = Record<string, TripPlugin>;

// Plugin Events
export type PluginEvent =
  | { type: 'plugin:initialized'; pluginId: string; tripId: string }
  | { type: 'plugin:activated'; pluginId: string }
  | { type: 'plugin:deactivated'; pluginId: string }
  | { type: 'plugin:data:updated'; pluginId: string; data: any }
  | { type: 'trip:state:changed'; oldState: TripState; newState: TripState }
  | { type: 'booking:added'; bookingId: string }
  | { type: 'booking:removed'; bookingId: string }
  | { type: 'expense:added'; amount: number; category: string }
  | { type: 'activity:added'; activityId: string; date: Date };
