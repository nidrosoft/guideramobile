/**
 * DANGER ALERTS PLUGIN
 * 
 * Premium safety plugin showing danger zones, incidents,
 * and real-time safety status with animated radar.
 */

import React from 'react';
import { ARPlugin, ARContext } from '../../types/ar-plugin.types';
import { ShieldCross } from 'iconsax-react-native';
import { colors } from '@/styles';
import DangerAlertsOverlay from './components/DangerAlertsOverlay';

export const dangerAlertsPlugin: ARPlugin = {
  id: 'danger-alerts',
  name: 'Safety',
  icon: <ShieldCross size={24} color={colors.error} variant="Bold" />,
  description: 'View safety alerts and danger zones',
  
  requiresCamera: false,
  requiresLocation: true,
  requiresInternet: true,
  
  renderOverlay: (context: ARContext) => {
    return <DangerAlertsOverlay arContext={context} />;
  },
  
  onActivate: () => {
    console.log('🚨 Danger Alerts activated');
  },
  
  onDeactivate: () => {
    console.log('🚨 Danger Alerts deactivated');
  },
};

export default dangerAlertsPlugin;
