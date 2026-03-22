/**
 * Saved Service Tests
 *
 * Tests for the saved items service covering collections,
 * save/unsave operations, and item counting.
 */

const mockFrom = jest.fn();
const mockSelect = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();
const mockDelete = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockNot = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

// Default chain for most queries
const buildChain = (overrides?: Record<string, any>) => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  eq: mockEq,
  not: mockNot,
  order: mockOrder,
  single: mockSingle,
  ...overrides,
});

import { savedService } from '@/services/saved.service';

describe('savedService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue(buildChain());
  });

  describe('function existence', () => {
    it('should export getSavedItems', () => {
      expect(typeof savedService.getSavedItems).toBe('function');
    });

    it('should export getCollections', () => {
      expect(typeof savedService.getCollections).toBe('function');
    });

    it('should export saveItem', () => {
      expect(typeof savedService.saveItem).toBe('function');
    });

    it('should export removeSavedItem', () => {
      expect(typeof savedService.removeSavedItem).toBe('function');
    });

    it('should export isItemSaved', () => {
      expect(typeof savedService.isItemSaved).toBe('function');
    });

    it('should export moveToCollection', () => {
      expect(typeof savedService.moveToCollection).toBe('function');
    });

    it('should export createCollection', () => {
      expect(typeof savedService.createCollection).toBe('function');
    });

    it('should export deleteCollection', () => {
      expect(typeof savedService.deleteCollection).toBe('function');
    });

    it('should export getSavedItemsCount', () => {
      expect(typeof savedService.getSavedItemsCount).toBe('function');
    });
  });

  describe('getCollections', () => {
    it('should return collections with item counts', async () => {
      const mockCollections = [
        { id: 'col-1', user_id: 'user-1', name: 'Favorites', is_default: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: 'col-2', user_id: 'user-1', name: 'Wishlist', is_default: false, created_at: '2024-01-02', updated_at: '2024-01-02' },
      ];

      const mockCounts = [
        { collection_id: 'col-1' },
        { collection_id: 'col-1' },
        { collection_id: 'col-2' },
      ];

      // First call: fetch collections
      // Second call: fetch item counts
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: mockCollections, error: null }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              not: jest.fn().mockResolvedValue({ data: mockCounts, error: null }),
            }),
          }),
        };
      });

      const result = await savedService.getCollections('user-1');
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].item_count).toBe(2);
      expect(result.data?.[1].item_count).toBe(1);
    });

    it('should return null data on error', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      });

      const result = await savedService.getCollections('user-1');
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('getSavedItemsCount', () => {
    it('should return total count and breakdown by type', async () => {
      const mockItems = [
        { type: 'destination' },
        { type: 'destination' },
        { type: 'hotel' },
        { type: 'flight' },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
        }),
      });

      const result = await savedService.getSavedItemsCount('user-1');
      expect(result.total).toBe(4);
      expect(result.byType.destination).toBe(2);
      expect(result.byType.hotel).toBe(1);
      expect(result.byType.flight).toBe(1);
    });

    it('should return zero counts on error', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
        }),
      });

      const result = await savedService.getSavedItemsCount('user-1');
      expect(result.total).toBe(0);
    });
  });

  describe('isItemSaved', () => {
    it('should return true when item exists', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'item-1' }, error: null }),
              }),
            }),
          }),
        }),
      });

      const result = await savedService.isItemSaved('user-1', 'ext-1', 'destination');
      expect(result).toBe(true);
    });

    it('should return false when item does not exist', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
        }),
      });

      const result = await savedService.isItemSaved('user-1', 'ext-1', 'destination');
      expect(result).toBe(false);
    });
  });
});
