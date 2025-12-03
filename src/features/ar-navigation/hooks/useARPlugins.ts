/**
 * USE AR PLUGINS HOOK
 * 
 * Hook for plugin registry and switching.
 */

import { useState } from 'react';
import { ARPlugin, ARPluginId } from '../types/ar-plugin.types';
import landmarkScannerPlugin from '../plugins/landmark-scanner/LandmarkScannerPlugin';
import menuTranslatorPlugin from '../plugins/menu-translator/MenuTranslatorPlugin';
import airportNavigatorPlugin from '../plugins/airport-navigator/AirportNavigatorPlugin';
import dangerAlertsPlugin from '../plugins/danger-alerts/DangerAlertsPlugin';
import cityNavigatorPlugin from '../plugins/city-navigator/CityNavigatorPlugin';

// Plugin registry
const pluginRegistry: Record<ARPluginId, ARPlugin> = {
  'landmark-scanner': landmarkScannerPlugin,
  'menu-translator': menuTranslatorPlugin,
  'airport-navigator': airportNavigatorPlugin,
  'danger-alerts': dangerAlertsPlugin,
  'city-navigator': cityNavigatorPlugin,
};

export function useARPlugins() {
  const [activePluginId, setActivePluginId] = useState<ARPluginId | null>(null);

  const activatePlugin = (pluginId: ARPluginId) => {
    // Deactivate current plugin
    if (activePluginId && pluginRegistry[activePluginId]?.onDeactivate) {
      pluginRegistry[activePluginId].onDeactivate?.();
    }

    // Activate new plugin
    setActivePluginId(pluginId);
    if (pluginRegistry[pluginId]?.onActivate) {
      pluginRegistry[pluginId].onActivate?.();
    }
  };

  const deactivatePlugin = () => {
    if (activePluginId && pluginRegistry[activePluginId]?.onDeactivate) {
      pluginRegistry[activePluginId].onDeactivate?.();
    }
    setActivePluginId(null);
  };

  const getActivePlugin = (): ARPlugin | null => {
    return activePluginId ? pluginRegistry[activePluginId] : null;
  };

  return {
    activePluginId,
    activePlugin: getActivePlugin(),
    activatePlugin,
    deactivatePlugin,
    pluginRegistry,
  };
}
