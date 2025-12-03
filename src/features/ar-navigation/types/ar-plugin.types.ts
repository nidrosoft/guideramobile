/**
 * AR PLUGIN TYPES
 * 
 * Type definitions for the AR plugin system.
 * Each AR feature (landmark scanner, menu translator, etc.) implements this interface.
 */

import { ReactNode } from 'react';

export type ARPluginId = 
  | 'landmark-scanner'
  | 'menu-translator'
  | 'airport-navigator'
  | 'danger-alerts'
  | 'city-navigator';

export type ARViewMode = 'camera' | 'map';

export interface ARContext {
  viewMode: ARViewMode;
  location: Location | null;
  cameraStream: any; // MediaStream or camera ref
  selectedPlugin: ARPluginId | null;
  userLocation: {
    latitude: number;
    longitude: number;
    heading?: number;
  } | null;
  setHideSearch?: (hide: boolean) => void; // Callback to hide/show search bar
  sidePanelVisible?: boolean; // Side panel visibility state
  toggleSidePanel?: () => void; // Callback to toggle side panel
}

export interface ARPlugin {
  id: ARPluginId;
  name: string;
  icon: ReactNode;
  description: string;
  
  // Plugin capabilities
  requiresCamera: boolean;
  requiresLocation: boolean;
  requiresInternet: boolean;
  
  // Render methods
  renderOverlay: (context: ARContext) => ReactNode;
  renderBottomSheet?: (data: any) => ReactNode;
  
  // Event handlers
  onActivate?: () => void;
  onDeactivate?: () => void;
  onCameraFrame?: (frame: any) => void;
  onLocationUpdate?: (location: any) => void;
}

export interface ARPluginConfig {
  id: ARPluginId;
  enabled: boolean;
  settings?: Record<string, any>;
}
