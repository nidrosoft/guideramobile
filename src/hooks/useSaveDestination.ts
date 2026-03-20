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
      if (wasSaved) {
        await supabase
          .from('user_saved_items')
          .delete()
          .eq('user_id', profile.id)
          .eq('destination_id', destinationId);

        try {
          await supabase.from('user_interactions').insert({
            user_id: profile.id,
            destination_id: destinationId,
            interaction_type: 'unsave',
            source: 'detail_page',
          });
        } catch (_) {}
      } else {
        await supabase.from('user_saved_items').insert({
          user_id: profile.id,
          destination_id: destinationId,
        });

        try {
          await supabase.from('user_interactions').insert({
            user_id: profile.id,
            destination_id: destinationId,
            interaction_type: 'save',
            source: 'detail_page',
          });
        } catch (_) {}
      }
    } catch (error) {
      console.error('Save toggle error:', error);
      setIsSaved(wasSaved);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, destinationId, isSaved, isLoading]);

  return { isSaved, isLoading, toggleSave, wasSavedRef: isSaved };
}
