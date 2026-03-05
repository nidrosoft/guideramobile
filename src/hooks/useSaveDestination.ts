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

export function useSaveDestination(destinationId: string | null) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial saved state
  useEffect(() => {
    if (!user?.id || !destinationId) return;

    const checkSaved = async () => {
      const { data } = await supabase
        .from('user_saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('destination_id', destinationId)
        .maybeSingle();

      setIsSaved(!!data);
    };

    checkSaved();
  }, [user?.id, destinationId]);

  const toggleSave = useCallback(async () => {
    if (!user?.id || !destinationId || isLoading) return;

    setIsLoading(true);
    const wasSaved = isSaved;

    // Optimistic update
    setIsSaved(!wasSaved);
    Haptics.impactAsync(
      wasSaved ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );

    try {
      if (wasSaved) {
        // Remove from saved
        await supabase
          .from('user_saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('destination_id', destinationId);

        // Track unsave interaction (fire and forget)
        try {
          await supabase.from('user_interactions').insert({
            user_id: user.id,
            destination_id: destinationId,
            interaction_type: 'unsave',
            source: 'detail_page',
          });
        } catch (_) {}
      } else {
        // Add to saved
        await supabase.from('user_saved_items').insert({
          user_id: user.id,
          destination_id: destinationId,
        });

        // Track save interaction (fire and forget)
        try {
          await supabase.from('user_interactions').insert({
            user_id: user.id,
            destination_id: destinationId,
            interaction_type: 'save',
            source: 'detail_page',
          });
        } catch (_) {}
      }
    } catch (error) {
      // Revert on error
      console.error('Save toggle error:', error);
      setIsSaved(wasSaved);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, destinationId, isSaved, isLoading]);

  return { isSaved, isLoading, toggleSave };
}
