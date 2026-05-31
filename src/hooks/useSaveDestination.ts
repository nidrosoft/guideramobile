/**
 * useSaveDestination Hook
 * 
 * Manages save/unsave state for destinations using user_saved_items table.
 * Provides optimistic UI updates with haptic feedback.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';
import {
  isRetryableSyncError,
  queueSavedToggle,
  registerSavedToggleSyncHandler,
} from '@/services/savedToggleQueue';

registerSavedToggleSyncHandler();

export function useSaveDestination(destinationId: string | null) {
  const { profile } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial saved state
  useEffect(() => {
    if (!profile?.id || !destinationId) return;

    const checkSaved = async () => {
      const { data } = await supabase
        .from('user_saved_items')
        .select('id')
        .eq('user_id', profile.id)
        .eq('destination_id', destinationId)
        .eq('is_archived', false)
        .maybeSingle();

      setIsSaved(!!data);
    };

    checkSaved();
  }, [profile?.id, destinationId]);

  const toggleSave = useCallback(async () => {
    if (!profile?.id || !destinationId || isLoading) return;

    setIsLoading(true);
    const wasSaved = isSaved;

    // Optimistic update
    setIsSaved(!wasSaved);
    Haptics.impactAsync(
      wasSaved ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );

    try {
      const { data, error } = await supabase.rpc('toggle_saved_content', {
        p_user_id: profile.id,
        p_item_type: 'destination',
        p_item_id: destinationId,
        p_should_save: !wasSaved,
        p_source: 'detail_page',
      });

      if (error) throw error;

      const serverSavedState = (data as { is_saved?: boolean } | null)?.is_saved;
      if (typeof serverSavedState === 'boolean') {
        setIsSaved(serverSavedState);
      }
    } catch (error) {
      console.error('Save toggle error:', error);
      if (isRetryableSyncError(error)) {
        await queueSavedToggle({
          userId: profile.id,
          itemType: 'destination',
          itemId: destinationId,
          shouldSave: !wasSaved,
          source: 'detail_page',
        });
        setIsSaved(!wasSaved);
        return;
      }
      setIsSaved(wasSaved);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, destinationId, isSaved, isLoading]);

  return { isSaved, isLoading, toggleSave, wasSavedRef: isSaved };
}
