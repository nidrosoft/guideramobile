/**
 * Offline Sync Service
 * 
 * Manages offline data synchronization:
 * - Queues actions when offline
 * - Syncs when connection restored
 * - Handles conflict resolution
 * - Persists pending actions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/services/logging';

// Action types that can be queued
export type SyncActionType = 
  | 'CREATE_BOOKING'
  | 'UPDATE_BOOKING'
  | 'CANCEL_BOOKING'
  | 'SAVE_TRIP'
  | 'UPDATE_TRIP'
  | 'ADD_EXPENSE'
  | 'UPDATE_PROFILE'
  | 'SYNC_PREFERENCES';

export interface SyncAction {
  id: string;
  type: SyncActionType;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SyncResult {
  success: boolean;
  actionId: string;
  error?: string;
}

type SyncHandler = (action: SyncAction) => Promise<SyncResult>;

const STORAGE_KEY = '@guidera_sync_queue';
const MAX_RETRIES = 3;

class OfflineSyncService {
  private static instance: OfflineSyncService;
  private queue: SyncAction[] = [];
  private handlers: Map<SyncActionType, SyncHandler> = new Map();
  private isSyncing: boolean = false;
  private isOnline: boolean = true;
  private listeners: Set<(queue: SyncAction[]) => void> = new Set();

  private constructor() {
    this.loadQueue();
  }

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  /**
   * Register a handler for a specific action type
   */
  registerHandler(type: SyncActionType, handler: SyncHandler): void {
    this.handlers.set(type, handler);
    logger.debug(`Sync handler registered: ${type}`);
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline: boolean): void {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;

    if (wasOffline && isOnline) {
      logger.info('Connection restored, starting sync...');
      this.processQueue();
    }
  }

  /**
   * Add an action to the sync queue
   */
  async queueAction(
    type: SyncActionType,
    payload: any,
    priority: SyncAction['priority'] = 'medium'
  ): Promise<string> {
    const action: SyncAction = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      priority,
    };

    this.queue.push(action);
    this.sortQueue();
    await this.persistQueue();
    this.notifyListeners();

    logger.info(`Action queued: ${type}`, { actionId: action.id, priority });

    // Try to process immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.processQueue();
    }

    return action.id;
  }

  /**
   * Process the sync queue
   */
  async processQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isSyncing = true;
    logger.info(`Processing sync queue: ${this.queue.length} actions`);

    const results: SyncResult[] = [];

    while (this.queue.length > 0 && this.isOnline) {
      const action = this.queue[0];
      const handler = this.handlers.get(action.type);

      if (!handler) {
        logger.warn(`No handler for action type: ${action.type}`);
        this.queue.shift();
        continue;
      }

      try {
        const result = await handler(action);
        results.push(result);

        if (result.success) {
          // Remove successful action
          this.queue.shift();
          logger.debug(`Sync success: ${action.type}`, { actionId: action.id });
        } else {
          // Handle failure
          action.retryCount++;
          
          if (action.retryCount >= action.maxRetries) {
            // Max retries reached, move to failed
            this.queue.shift();
            logger.error(`Sync failed (max retries): ${action.type}`, { 
              actionId: action.id, 
              error: result.error 
            });
          } else {
            // Move to end of queue for retry
            this.queue.shift();
            this.queue.push(action);
            logger.warn(`Sync retry scheduled: ${action.type}`, { 
              actionId: action.id, 
              retryCount: action.retryCount 
            });
          }
        }
      } catch (error: any) {
        action.retryCount++;
        
        if (action.retryCount >= action.maxRetries) {
          this.queue.shift();
          logger.error(`Sync exception (max retries): ${action.type}`, error);
        } else {
          this.queue.shift();
          this.queue.push(action);
        }

        results.push({
          success: false,
          actionId: action.id,
          error: error.message,
        });
      }

      await this.persistQueue();
      this.notifyListeners();
    }

    this.isSyncing = false;
    logger.info('Sync queue processing complete', { 
      processed: results.length,
      remaining: this.queue.length 
    });
  }

  /**
   * Get pending actions count
   */
  getPendingCount(): number {
    return this.queue.length;
  }

  /**
   * Get all pending actions
   */
  getPendingActions(): SyncAction[] {
    return [...this.queue];
  }

  /**
   * Remove a specific action from queue
   */
  async removeAction(actionId: string): Promise<boolean> {
    const index = this.queue.findIndex((a) => a.id === actionId);
    if (index === -1) return false;

    this.queue.splice(index, 1);
    await this.persistQueue();
    this.notifyListeners();
    
    logger.debug(`Action removed from queue: ${actionId}`);
    return true;
  }

  /**
   * Clear all pending actions
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.persistQueue();
    this.notifyListeners();
    logger.info('Sync queue cleared');
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: SyncAction[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  // ==================== Private Methods ====================

  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        this.sortQueue();
        logger.debug(`Loaded ${this.queue.length} pending sync actions`);
      }
    } catch (error) {
      logger.error('Failed to load sync queue', error);
      this.queue = [];
    }
  }

  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Failed to persist sync queue', error);
    }
  }

  private sortQueue(): void {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    this.queue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.queue]));
  }
}

// Export singleton instance
export const offlineSync = OfflineSyncService.getInstance();

// Export convenience functions
export const queueSyncAction = (
  type: SyncActionType,
  payload: any,
  priority?: SyncAction['priority']
) => offlineSync.queueAction(type, payload, priority);

export const processSyncQueue = () => offlineSync.processQueue();
export const getPendingSyncCount = () => offlineSync.getPendingCount();
export const subscribeSyncQueue = (listener: (queue: SyncAction[]) => void) => 
  offlineSync.subscribe(listener);

export default offlineSync;
