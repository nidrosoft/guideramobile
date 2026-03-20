/**
 * USE ACTION TOAST
 * 
 * Wraps async actions with automatic toast feedback.
 * Shows success toast on completion, error toast on failure.
 * Includes haptic feedback.
 */

import { useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import * as Haptics from 'expo-haptics';

interface ActionToastOptions {
  successMessage?: string;
  errorMessage?: string;
  haptic?: boolean;
}

export function useActionToast() {
  const { showSuccess, showError } = useToast();

  const withToast = useCallback(
    async <T>(
      action: () => Promise<T>,
      options: ActionToastOptions = {},
    ): Promise<T | null> => {
      try {
        const result = await action();
        if (options.successMessage) {
          showSuccess(options.successMessage);
        }
        if (options.haptic !== false) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return result;
      } catch (err: any) {
        const msg = options.errorMessage || err?.message || 'Something went wrong';
        showError(msg);
        if (options.haptic !== false) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return null;
      }
    },
    [showSuccess, showError],
  );

  return { withToast, showSuccess, showError };
}
