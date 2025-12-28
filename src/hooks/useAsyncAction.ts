/**
 * useAsyncAction Hook
 * 
 * Manages async action state with loading, success, and error feedback.
 * Integrates with toast notifications and action feedback.
 * 
 * Usage:
 * const { execute, isLoading } = useAsyncAction({
 *   action: async () => await bookFlight(),
 *   onSuccess: () => navigation.goBack(),
 *   successMessage: 'Booking confirmed!',
 * });
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { logger } from '@/services/logging';

interface UseAsyncActionOptions<T> {
  action: () => Promise<T>;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  logError?: boolean;
}

interface UseAsyncActionReturn<T> {
  execute: () => Promise<T | undefined>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useAsyncAction<T = void>({
  action,
  onSuccess,
  onError,
  successMessage = 'Action completed successfully',
  errorMessage = 'Something went wrong. Please try again.',
  showSuccessToast = true,
  showErrorToast = true,
  logError = true,
}: UseAsyncActionOptions<T>): UseAsyncActionReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const execute = useCallback(async (): Promise<T | undefined> => {
    if (isLoading) return undefined;

    setIsLoading(true);
    setError(null);

    try {
      const result = await action();

      if (showSuccessToast && successMessage) {
        toast.showSuccess(successMessage);
      }

      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      if (logError) {
        logger.error('Async action failed', error);
      }

      if (showErrorToast) {
        toast.showError(errorMessage);
      }

      onError?.(error);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [
    action,
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showSuccessToast,
    showErrorToast,
    logError,
    isLoading,
    toast,
  ]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    reset,
  };
}

/**
 * useLoadingState Hook
 * 
 * Simple loading state management for components.
 */
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);
  const toggleLoading = useCallback(() => setIsLoading((prev) => !prev), []);

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    setIsLoading,
  };
}

export default useAsyncAction;
