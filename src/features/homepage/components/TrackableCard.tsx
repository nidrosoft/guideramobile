/**
 * TRACKABLE CARD WRAPPER
 * 
 * Wraps any card component to add interaction tracking.
 * Tracks views and taps without modifying the original card UI.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useHomepageDataSafe } from '../context/HomepageDataContext';
import { homepageService } from '../services/homepageService';
import { useAuth } from '@/context/AuthContext';

interface TrackableCardProps {
  children: React.ReactNode;
  itemId: string;
  itemType?: 'destination' | 'experience';
  sectionSlug?: string;
  position?: number;
  navigateTo?: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export function TrackableCard({
  children,
  itemId,
  itemType = 'destination',
  sectionSlug,
  position,
  navigateTo,
  onPress,
  style,
  disabled = false,
}: TrackableCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const hasTrackedView = useRef(false);

  // Track view when card becomes visible
  useEffect(() => {
    if (!hasTrackedView.current && user?.id && itemId) {
      hasTrackedView.current = true;
      
      // Track view (fire and forget)
      homepageService.trackInteraction({
        userId: user.id,
        itemId,
        itemType,
        action: 'view',
        sectionSlug,
        position,
      }).catch(() => {});
    }
  }, [user?.id, itemId, itemType, sectionSlug, position]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Track detail view
    if (user?.id && itemId) {
      homepageService.trackInteraction({
        userId: user.id,
        itemId,
        itemType,
        action: 'detail_view',
        sectionSlug,
        position,
      }).catch(() => {});
    }
    
    // Execute custom onPress or navigate
    if (onPress) {
      onPress();
    } else if (navigateTo) {
      router.push(navigateTo as any);
    }
  }, [disabled, user?.id, itemId, itemType, sectionSlug, position, onPress, navigateTo, router]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      disabled={disabled}
      style={style}
    >
      {children}
    </TouchableOpacity>
  );
}

/**
 * Hook for tracking interactions manually
 */
export function useInteractionTracking() {
  const { user } = useAuth();

  const trackView = useCallback((
    itemId: string,
    itemType: 'destination' | 'experience' = 'destination',
    sectionSlug?: string,
    position?: number
  ) => {
    if (!user?.id) return;
    
    homepageService.trackInteraction({
      userId: user.id,
      itemId,
      itemType,
      action: 'view',
      sectionSlug,
      position,
    }).catch(() => {});
  }, [user?.id]);

  const trackDetailView = useCallback((
    itemId: string,
    itemType: 'destination' | 'experience' = 'destination',
    sectionSlug?: string,
    position?: number
  ) => {
    if (!user?.id) return;
    
    homepageService.trackInteraction({
      userId: user.id,
      itemId,
      itemType,
      action: 'detail_view',
      sectionSlug,
      position,
    }).catch(() => {});
  }, [user?.id]);

  const trackSave = useCallback((
    itemId: string,
    itemType: 'destination' | 'experience' = 'destination'
  ) => {
    if (!user?.id) return;
    
    homepageService.trackInteraction({
      userId: user.id,
      itemId,
      itemType,
      action: 'save',
    }).catch(() => {});
  }, [user?.id]);

  const trackShare = useCallback((
    itemId: string,
    itemType: 'destination' | 'experience' = 'destination'
  ) => {
    if (!user?.id) return;
    
    homepageService.trackInteraction({
      userId: user.id,
      itemId,
      itemType,
      action: 'share',
    }).catch(() => {});
  }, [user?.id]);

  return {
    trackView,
    trackDetailView,
    trackSave,
    trackShare,
  };
}

export default TrackableCard;
