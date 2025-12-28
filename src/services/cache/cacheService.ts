/**
 * Cache Service
 * 
 * Provides in-memory and persistent caching for:
 * - API responses
 * - Static data (airports, cities)
 * - User preferences
 * - Search results
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/services/logging';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxMemoryItems: number;
  persistToStorage: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxMemoryItems: 100,
  persistToStorage: true,
};

// Cache TTL presets (in milliseconds)
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute - for frequently changing data
  MEDIUM: 5 * 60 * 1000,     // 5 minutes - default
  LONG: 30 * 60 * 1000,      // 30 minutes - for semi-static data
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours - for static data
  PERMANENT: Infinity,        // Never expires (manual invalidation only)
};

// Cache keys for common data types
export const CACHE_KEYS = {
  AIRPORTS: 'cache_airports',
  CITIES: 'cache_cities',
  USER_PREFERENCES: 'cache_user_prefs',
  RECENT_SEARCHES: 'cache_recent_searches',
  FLIGHT_RESULTS: 'cache_flight_results',
  HOTEL_RESULTS: 'cache_hotel_results',
  EXCHANGE_RATES: 'cache_exchange_rates',
};

class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private storagePrefix = '@guidera_cache_';

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      logger.debug(`Cache hit (memory): ${key}`);
      return memoryEntry.data as T;
    }

    // Try persistent storage
    if (this.config.persistToStorage) {
      try {
        const stored = await AsyncStorage.getItem(this.storagePrefix + key);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          if (!this.isExpired(entry)) {
            // Restore to memory cache
            this.memoryCache.set(key, entry);
            logger.debug(`Cache hit (storage): ${key}`);
            return entry.data;
          } else {
            // Clean up expired entry
            await AsyncStorage.removeItem(this.storagePrefix + key);
          }
        }
      } catch (error) {
        logger.error(`Cache read error: ${key}`, error);
      }
    }

    logger.debug(`Cache miss: ${key}`);
    return null;
  }

  /**
   * Set item in cache
   */
  async set<T>(key: string, data: T, ttl: number = this.config.defaultTTL): Promise<void> {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: ttl === Infinity ? Infinity : now + ttl,
    };

    // Store in memory
    this.memoryCache.set(key, entry);
    this.enforceMemoryLimit();

    // Persist to storage
    if (this.config.persistToStorage && ttl > CACHE_TTL.SHORT) {
      try {
        await AsyncStorage.setItem(
          this.storagePrefix + key,
          JSON.stringify(entry)
        );
        logger.debug(`Cache set: ${key}`, { ttl: `${ttl / 1000}s` });
      } catch (error) {
        logger.error(`Cache write error: ${key}`, error);
      }
    }
  }

  /**
   * Remove item from cache
   */
  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    if (this.config.persistToStorage) {
      try {
        await AsyncStorage.removeItem(this.storagePrefix + key);
        logger.debug(`Cache removed: ${key}`);
      } catch (error) {
        logger.error(`Cache remove error: ${key}`, error);
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.config.persistToStorage) {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter((k) => k.startsWith(this.storagePrefix));
        await AsyncStorage.multiRemove(cacheKeys);
        logger.info('Cache cleared');
      } catch (error) {
        logger.error('Cache clear error', error);
      }
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.config.defaultTTL
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // Clear from memory
    const keysToDelete: string[] = [];
    this.memoryCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.memoryCache.delete(key));

    // Clear from storage
    if (this.config.persistToStorage) {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const matchingKeys = keys.filter(
          (k) => k.startsWith(this.storagePrefix) && k.includes(pattern)
        );
        await AsyncStorage.multiRemove(matchingKeys);
        logger.debug(`Cache invalidated pattern: ${pattern}`, { count: matchingKeys.length });
      } catch (error) {
        logger.error('Cache invalidate pattern error', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryItems: number;
    memorySize: number;
    oldestEntry: Date | null;
  } {
    let oldestTimestamp = Infinity;
    let totalSize = 0;

    this.memoryCache.forEach((entry) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
      totalSize += JSON.stringify(entry.data).length;
    });

    return {
      memoryItems: this.memoryCache.size,
      memorySize: totalSize,
      oldestEntry: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
    };
  }

  /**
   * Preload static data into cache
   */
  async preloadStaticData(): Promise<void> {
    logger.info('Preloading static cache data...');
    
    // This would typically fetch from API and cache
    // For now, just log that it's ready for implementation
    logger.debug('Static data preload placeholder - implement with actual data');
  }

  // ==================== Private Methods ====================

  private isExpired(entry: CacheEntry<any>): boolean {
    if (entry.expiresAt === Infinity) return false;
    return Date.now() > entry.expiresAt;
  }

  private enforceMemoryLimit(): void {
    if (this.memoryCache.size <= this.config.maxMemoryItems) return;

    // Remove oldest entries
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, entries.length - this.config.maxMemoryItems);
    toRemove.forEach(([key]) => this.memoryCache.delete(key));

    logger.debug(`Cache memory limit enforced, removed ${toRemove.length} items`);
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Export convenience functions
export const getCache = <T>(key: string) => cacheService.get<T>(key);
export const setCache = <T>(key: string, data: T, ttl?: number) => cacheService.set(key, data, ttl);
export const removeCache = (key: string) => cacheService.remove(key);
export const clearCache = () => cacheService.clear();
export const getOrSetCache = <T>(key: string, fn: () => Promise<T>, ttl?: number) => 
  cacheService.getOrSet(key, fn, ttl);

export default cacheService;
