/**
 * useSaveExperience Hook
 * 
 * Manages save/unsave state for local experiences using user_saved_items table.
 * Uses item_type='local_experience' and external_id=productCode.
 * Provides optimistic UI updates with haptic feedback.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

export function useSaveExperience(productCode: string | null) {
  const { profile } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial saved state
  useEffect(() => {
    if (!profile?.id || !productCode) return;

    const checkSaved = async () => {
      const { data } = await supabase
        .from('user_saved_items')
        .select('id')
        .eq('user_id', profile.id)
        .eq('item_type', 'local_experience')
        .eq('external_id', productCode)
        .maybeSingle();

      setIsSaved(!!data);
    };

    checkSaved();
  }, [profile?.id, productCode]);

  const toggleSave = useCallback(async () => {
    if (!profile?.id || !productCode || isLoading) return;

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
          .eq('item_type', 'local_experience')
          .eq('external_id', productCode);
      } else {
        await supabase.from('user_saved_items').insert({
          user_id: profile.id,
          item_type: 'local_experience',
          external_id: productCode,
        });
      }
    } catch (error) {
      console.error('Experience save toggle error:', error);
      setIsSaved(wasSaved);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, productCode, isSaved, isLoading]);

  return { isSaved, isLoading, toggleSave };
}
