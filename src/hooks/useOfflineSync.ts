/**
 * useOfflineSync Hook
 * 
 * Provides offline sync status and queue management in components.
 * 
 * Usage:
 * const { pendingCount, isSyncing, queueAction } = useOfflineSync();
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  offlineSync, 
  subscribeSyncQueue, 
  queueSyncAction,
  SyncAction, 
  SyncActionType 
} from '@/services/offline';
import { useNetworkStatus } from './useNetworkStatus';

interface UseOfflineSyncReturn {
  pendingCount: number;
  pendingActions: SyncAction[];
  isSyncing: boolean;
  isOnline: boolean;
  queueAction: (type: SyncActionType, payload: any, priority?: SyncAction['priority']) => Promise<string>;
  processQueue: () => Promise<void>;
  removeAction: (actionId: string) => Promise<boolean>;
  clearQueue: () => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [pendingActions, setPendingActions] = useState<SyncAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    // Subscribe to queue changes
    const unsubscribe = subscribeSyncQueue((queue) => {
      setPendingActions(queue);
    });

    // Set initial state
    setPendingActions(offlineSync.getPendingActions());

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Update online status in sync service
    offlineSync.setOnlineStatus(!isOffline);
  }, [isOffline]);

  useEffect(() => {
    // Track syncing state
    const checkSyncing = () => {
      setIsSyncing(offlineSync.isSyncInProgress());
    };

    const interval = setInterval(checkSyncing, 500);
    return () => clearInterval(interval);
  }, []);

  const queueActionCallback = useCallback(
    async (type: SyncActionType, payload: any, priority?: SyncAction['priority']) => {
      return queueSyncAction(type, payload, priority);
    },
    []
  );

  const processQueue = useCallback(async () => {
    await offlineSync.processQueue();
  }, []);

  const removeAction = useCallback(async (actionId: string) => {
    return offlineSync.removeAction(actionId);
  }, []);

  const clearQueue = useCallback(async () => {
    await offlineSync.clearQueue();
  }, []);

  return {
    pendingCount: pendingActions.length,
    pendingActions,
    isSyncing,
    isOnline: !isOffline,
    queueAction: queueActionCallback,
    processQueue,
    removeAction,
    clearQueue,
  };
}

export default useOfflineSync;
