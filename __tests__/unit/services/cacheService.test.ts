/**
 * Cache Service Tests
 */

import { cacheService, CACHE_TTL } from '@/services/cache';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

describe('CacheService', () => {
  beforeEach(async () => {
    await cacheService.clear();
    jest.clearAllMocks();
  });

  describe('basic operations', () => {
    it('should set and get a value', async () => {
      const testData = { name: 'Test', value: 123 };
      
      await cacheService.set('test-key', testData);
      const result = await cacheService.get('test-key');
      
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should remove a value', async () => {
      await cacheService.set('test-key', 'test-value');
      await cacheService.remove('test-key');
      
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    it('should clear all values', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.clear();
      
      const result1 = await cacheService.get('key1');
      const result2 = await cacheService.get('key2');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect TTL and expire entries', async () => {
      jest.useFakeTimers();
      
      await cacheService.set('expiring-key', 'value', 1000); // 1 second TTL
      
      // Should exist immediately
      let result = await cacheService.get('expiring-key');
      expect(result).toBe('value');
      
      // Advance time past TTL
      jest.advanceTimersByTime(1500);
      
      // Should be expired now
      result = await cacheService.get('expiring-key');
      expect(result).toBeNull();
      
      jest.useRealTimers();
    });

    it('should not expire entries with PERMANENT TTL', async () => {
      jest.useFakeTimers();
      
      await cacheService.set('permanent-key', 'value', CACHE_TTL.PERMANENT);
      
      // Advance time significantly
      jest.advanceTimersByTime(24 * 60 * 60 * 1000); // 24 hours
      
      const result = await cacheService.get('permanent-key');
      expect(result).toBe('value');
      
      jest.useRealTimers();
    });
  });

  describe('getOrSet pattern', () => {
    it('should return cached value if exists', async () => {
      await cacheService.set('existing-key', 'cached-value');
      
      const fetchFn = jest.fn(() => Promise.resolve('fresh-value'));
      const result = await cacheService.getOrSet('existing-key', fetchFn);
      
      expect(result).toBe('cached-value');
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not exists', async () => {
      const fetchFn = jest.fn(() => Promise.resolve('fresh-value'));
      const result = await cacheService.getOrSet('new-key', fetchFn);
      
      expect(result).toBe('fresh-value');
      expect(fetchFn).toHaveBeenCalledTimes(1);
      
      // Should be cached now
      const cachedResult = await cacheService.get('new-key');
      expect(cachedResult).toBe('fresh-value');
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate keys matching pattern', async () => {
      await cacheService.set('flight_search_1', 'data1');
      await cacheService.set('flight_search_2', 'data2');
      await cacheService.set('hotel_search_1', 'data3');
      
      await cacheService.invalidatePattern('flight');
      
      const flight1 = await cacheService.get('flight_search_1');
      const flight2 = await cacheService.get('flight_search_2');
      const hotel1 = await cacheService.get('hotel_search_1');
      
      expect(flight1).toBeNull();
      expect(flight2).toBeNull();
      expect(hotel1).toBe('data3');
    });
  });

  describe('stats', () => {
    it('should return correct stats', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', { nested: 'data' });
      
      const stats = cacheService.getStats();
      
      expect(stats.memoryItems).toBe(2);
      expect(stats.memorySize).toBeGreaterThan(0);
      expect(stats.oldestEntry).toBeInstanceOf(Date);
    });

    it('should return null oldestEntry when empty', async () => {
      await cacheService.clear();
      const stats = cacheService.getStats();
      
      expect(stats.memoryItems).toBe(0);
      expect(stats.oldestEntry).toBeNull();
    });
  });

  describe('data types', () => {
    it('should handle string values', async () => {
      await cacheService.set('string-key', 'hello world');
      const result = await cacheService.get<string>('string-key');
      expect(result).toBe('hello world');
    });

    it('should handle number values', async () => {
      await cacheService.set('number-key', 42);
      const result = await cacheService.get<number>('number-key');
      expect(result).toBe(42);
    });

    it('should handle object values', async () => {
      const obj = { name: 'Test', items: [1, 2, 3] };
      await cacheService.set('object-key', obj);
      const result = await cacheService.get<typeof obj>('object-key');
      expect(result).toEqual(obj);
    });

    it('should handle array values', async () => {
      const arr = [1, 2, 3, 'four', { five: 5 }];
      await cacheService.set('array-key', arr);
      const result = await cacheService.get<typeof arr>('array-key');
      expect(result).toEqual(arr);
    });
  });
});
