/**
 * SAVED SERVICE
 * 
 * Service for managing saved items and collections in Supabase.
 */

import { supabase } from '@/lib/supabase/client';

export type SavedItemType = 'destination' | 'hotel' | 'flight' | 'experience' | 'deal' | 'trip';

export interface SavedItem {
  id: string;
  user_id: string;
  collection_id?: string;
  type: SavedItemType;
  title: string;
  subtitle?: string;
  image_url?: string;
  data: Record<string, any>;
  external_id?: string;
  saved_at: string;
}

export interface SavedCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface CreateSavedItemInput {
  type: SavedItemType;
  title: string;
  subtitle?: string;
  image_url?: string;
  data: Record<string, any>;
  external_id?: string;
  collection_id?: string;
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
  cover_image_url?: string;
}

export const savedService = {
  /**
   * Get all saved items for the current user
   */
  async getSavedItems(userId: string, type?: SavedItemType): Promise<{ data: SavedItem[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching saved items:', error);
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getSavedItems:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get saved items by collection
   */
  async getSavedItemsByCollection(userId: string, collectionId: string): Promise<{ data: SavedItem[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .eq('collection_id', collectionId)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved items by collection:', error);
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getSavedItemsByCollection:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Save an item
   */
  async saveItem(userId: string, item: CreateSavedItemInput): Promise<{ data: SavedItem | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('saved_items')
        .insert({
          user_id: userId,
          ...item,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving item:', error);
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in saveItem:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Remove a saved item
   */
  async removeSavedItem(itemId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error removing saved item:', error);
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in removeSavedItem:', error);
      return { error: error as Error };
    }
  },

  /**
   * Check if an item is saved
   */
  async isItemSaved(userId: string, externalId: string, type: SavedItemType): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', userId)
        .eq('external_id', externalId)
        .eq('type', type)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  },

  /**
   * Move item to a collection
   */
  async moveToCollection(itemId: string, collectionId: string | null): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('saved_items')
        .update({ collection_id: collectionId })
        .eq('id', itemId);

      if (error) {
        console.error('Error moving item to collection:', error);
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in moveToCollection:', error);
      return { error: error as Error };
    }
  },

  // ============ COLLECTIONS ============

  /**
   * Get all collections for the current user
   */
  async getCollections(userId: string): Promise<{ data: SavedCollection[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('saved_collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching collections:', error);
        return { data: null, error: error as Error };
      }

      // Get item counts for each collection
      if (data) {
        const collectionsWithCounts = await Promise.all(
          data.map(async (collection) => {
            const { count } = await supabase
              .from('saved_items')
              .select('*', { count: 'exact', head: true })
              .eq('collection_id', collection.id);
            
            return {
              ...collection,
              item_count: count || 0,
            };
          })
        );
        return { data: collectionsWithCounts, error: null };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getCollections:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Create a new collection
   */
  async createCollection(userId: string, collection: CreateCollectionInput): Promise<{ data: SavedCollection | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('saved_collections')
        .insert({
          user_id: userId,
          ...collection,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating collection:', error);
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in createCollection:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Update a collection
   */
  async updateCollection(collectionId: string, updates: Partial<CreateCollectionInput>): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('saved_collections')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collectionId);

      if (error) {
        console.error('Error updating collection:', error);
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in updateCollection:', error);
      return { error: error as Error };
    }
  },

  /**
   * Delete a collection (items will have collection_id set to null)
   */
  async deleteCollection(collectionId: string): Promise<{ error: Error | null }> {
    try {
      // First, unlink all items from this collection
      await supabase
        .from('saved_items')
        .update({ collection_id: null })
        .eq('collection_id', collectionId);

      // Then delete the collection
      const { error } = await supabase
        .from('saved_collections')
        .delete()
        .eq('id', collectionId);

      if (error) {
        console.error('Error deleting collection:', error);
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in deleteCollection:', error);
      return { error: error as Error };
    }
  },

  /**
   * Get saved items count by type
   */
  async getSavedItemsCount(userId: string): Promise<{ total: number; byType: Record<SavedItemType, number> }> {
    try {
      const { data, error } = await supabase
        .from('saved_items')
        .select('type')
        .eq('user_id', userId);

      if (error || !data) {
        return { total: 0, byType: {} as Record<SavedItemType, number> };
      }

      const byType = data.reduce((acc, item) => {
        acc[item.type as SavedItemType] = (acc[item.type as SavedItemType] || 0) + 1;
        return acc;
      }, {} as Record<SavedItemType, number>);

      return { total: data.length, byType };
    } catch {
      return { total: 0, byType: {} as Record<SavedItemType, number> };
    }
  },
};
