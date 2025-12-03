/**
 * CITY NAVIGATOR PLUGIN
 * 
 * AR plugin for navigating cities with map and camera views.
 * Shows POIs, routes, and danger zones.
 */

import React from 'react';
import { ARPlugin, ARContext } from '../../types/ar-plugin.types';
import { Map1 } from 'iconsax-react-native';
import { colors } from '@/styles';
import CityNavigatorOverlay from './components/CityNavigatorOverlay';

export const cityNavigatorPlugin: ARPlugin = {
  id: 'city-navigator',
  name: 'City Navigator',
  icon: <Map1 size={24} color={colors.primary} variant="Bold" />,
  description: 'Navigate the city with AR directions',
  
  requiresCamera: true,
  requiresLocation: true,
  requiresInternet: true,
  
  renderOverlay: (context: ARContext) => {
    return <CityNavigatorOverlay arContext={context} />;
  },
  
  onActivate: () => {
    console.log('City Navigator activated');
  },
  
  onDeactivate: () => {
    console.log('City Navigator deactivated');
  },
};

export default cityNavigatorPlugin;
