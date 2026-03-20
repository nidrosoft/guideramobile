import { supabase } from '@/lib/supabase/client';
import { invokeEdgeFn } from '@/utils/retry';
import { PackingItem } from '@/features/trips/plugins/packing/types/packing.types';

interface PackingProgress {
  total: number;
  packed: number;
  percentage: number;
}

function toDb(item: Record<string, any>): Record<string, any> {
  const map: Record<string, string> = {
    isPacked: 'is_packed',
    isOptional: 'is_optional',
    isSuggested: 'is_suggested',
    addedBy: 'added_by',
    tripId: 'trip_id',
    userId: 'user_id',
  };
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(item)) {
    result[map[key] ?? key] = value;
  }
  return result;
}

function fromDb(row: any): PackingItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity ?? 1,
    isPacked: row.is_packed ?? false,
    isOptional: row.is_optional ?? false,
    isSuggested: row.is_suggested ?? false,
    addedBy: row.added_by ?? 'user',
    notes: row.notes ?? undefined,
    priority: row.priority ?? 'recommended',
    reason: row.reason ?? undefined,
    actionRequired: row.action_required ?? undefined,
    displayOrder: row.display_order ?? 0,
  };
}

class PackingService {
  async generatePackingList(tripId: string): Promise<{
    success: boolean;
    itemsGenerated?: number;
    error?: string;
  }> {
    const { data, error } = await invokeEdgeFn(supabase, 'generate-packing', { tripId }, 'fast');

    if (error) throw new Error(`Packing generation failed: ${error.message}`);
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async clearGeneratedItems(tripId: string): Promise<void> {
    await supabase
      .from('packing_items')
      .delete()
      .eq('trip_id', tripId)
      .eq('added_by', 'system');
  }

  async getItems(tripId: string, limit = 500): Promise<PackingItem[]> {
    const { data, error } = await supabase
      .from('packing_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('category')
      .order('name')
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []).map(fromDb);
  }

  async addItem(
    tripId: string,
    userId: string,
    item: {
      name: string;
      category: string;
      quantity?: number;
      isOptional?: boolean;
      notes?: string;
    },
  ): Promise<PackingItem> {
    const { data, error } = await supabase
      .from('packing_items')
      .insert({
        trip_id: tripId,
        user_id: userId,
        name: item.name,
        category: item.category,
        quantity: item.quantity ?? 1,
        is_optional: item.isOptional ?? false,
        is_packed: false,
        is_suggested: false,
        added_by: 'user',
        notes: item.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return fromDb(data);
  }

  async updateItem(
    itemId: string,
    updates: Partial<{
      name: string;
      category: string;
      quantity: number;
      is_packed: boolean;
      is_optional: boolean;
      notes: string;
    }>,
  ): Promise<PackingItem> {
    const dbUpdates = toDb(updates);
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('packing_items')
      .update(dbUpdates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return fromDb(data);
  }

  async togglePacked(itemId: string, isPacked: boolean): Promise<void> {
    const { error } = await supabase
      .from('packing_items')
      .update({ is_packed: isPacked, updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (error) throw new Error(error.message);
  }

  async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('packing_items')
      .delete()
      .eq('id', itemId);

    if (error) throw new Error(error.message);
  }

  async bulkAdd(
    tripId: string,
    userId: string,
    items: { name: string; category: string; quantity?: number; isSuggested?: boolean }[],
  ): Promise<PackingItem[]> {
    const rows = items.map((item) => ({
      trip_id: tripId,
      user_id: userId,
      name: item.name,
      category: item.category,
      quantity: item.quantity ?? 1,
      is_packed: false,
      is_optional: false,
      is_suggested: item.isSuggested ?? true,
      added_by: 'system',
    }));

    const { data, error } = await supabase
      .from('packing_items')
      .insert(rows)
      .select();

    if (error) throw new Error(error.message);
    return (data ?? []).map(fromDb);
  }

  async getProgress(tripId: string): Promise<PackingProgress> {
    const { data, error } = await supabase
      .from('packing_items')
      .select('is_packed')
      .eq('trip_id', tripId);

    if (error) throw new Error(error.message);

    const items = data ?? [];
    const total = items.length;
    const packed = items.filter((i) => i.is_packed).length;

    return {
      total,
      packed,
      percentage: total === 0 ? 0 : Math.round((packed / total) * 100),
    };
  }
}

export const packingService = new PackingService();
export default packingService;
