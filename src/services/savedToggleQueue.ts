import { supabase } from '@/lib/supabase/client';
import { offlineSync, queueSyncAction, type SyncAction } from '@/services/offline/offlineSync';

export type SaveToggleItemType = 'destination' | 'experience';

export interface SaveTogglePayload {
  userId: string;
  itemType: SaveToggleItemType;
  itemId: string;
  shouldSave: boolean;
  source: string;
}

let handlerRegistered = false;

export function isRetryableSyncError(error: unknown): boolean {
  const message = String((error as { message?: string } | null)?.message || error || '').toLowerCase();
  return (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    message.includes('abort') ||
    message.includes('offline')
  );
}

export function registerSavedToggleSyncHandler(): void {
  if (handlerRegistered) return;

  offlineSync.registerHandler('TOGGLE_SAVE', async (action: SyncAction) => {
    const payload = action.payload as SaveTogglePayload;
    const { error } = await supabase.rpc('toggle_saved_content', {
      p_user_id: payload.userId,
      p_item_type: payload.itemType,
      p_item_id: payload.itemId,
      p_should_save: payload.shouldSave,
      p_source: payload.source,
    });

    return {
      success: !error,
      actionId: action.id,
      error: error?.message,
    };
  });

  handlerRegistered = true;
}

export async function queueSavedToggle(payload: SaveTogglePayload): Promise<void> {
  registerSavedToggleSyncHandler();
  await queueSyncAction('TOGGLE_SAVE', payload, 'high');
}
