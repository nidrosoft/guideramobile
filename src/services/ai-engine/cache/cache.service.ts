/**
 * AI ENGINE CACHE SERVICE
 * 
 * Three-tier caching system for AI-generated content:
 * - Tier 1: Destination Base - shared across ALL trips to destination
 * - Tier 2: Context-Specific - shared across similar trips
 * - Tier 3: Personal - never cached, always generated fresh
 */

import { supabase } from '@/lib/supabase/client';
import {
  ModuleType,
  CacheTier,
  CacheStrategy,
  TripGenerationContext,
} from '../types';

// ============================================
// CACHE CONFIGURATION
// ============================================

const CACHE_STRATEGIES: Record<ModuleType, CacheStrategy> = {
  dos_donts: {
    tier: 'context_specific',
    ttlDays: 14,
    keyComponents: ['destination', 'tripType', 'composition'],
  },
  safety: {
    tier: 'context_specific',
    ttlDays: 7,
    keyComponents: ['destination', 'nationality'],
  },
  language: {
    tier: 'destination_base',
    ttlDays: 90,
    keyComponents: ['destination'],
  },
  cultural: {
    tier: 'destination_base',
    ttlDays: 30,
    keyComponents: ['destination'],
  },
  budget: {
    tier: 'context_specific',
    ttlDays: 7,
    keyComponents: ['destination', 'budgetTier'],
  },
  packing: {
    tier: 'personal',
    ttlDays: 0,
    keyComponents: [],
  },
  itinerary: {
    tier: 'personal',
    ttlDays: 0,
    keyComponents: [],
  },
  compensation: {
    tier: 'personal',
    ttlDays: 0,
    keyComponents: [],
  },
  documents: {
    tier: 'personal',
    ttlDays: 0,
    keyComponents: [],
  },
};

// ============================================
// CACHE KEY GENERATION
// ============================================

function generateCacheKey(
  moduleType: ModuleType,
  context: TripGenerationContext
): string {
  const strategy = CACHE_STRATEGIES[moduleType];
  
  if (strategy.tier === 'personal') {
    return `${moduleType}:${context.trip.id}:${Date.now()}`;
  }

  const components: string[] = [moduleType];

  for (const component of strategy.keyComponents) {
    switch (component) {
      case 'destination':
        components.push(context.destination.basic.code.toLowerCase());
        break;
      case 'tripType':
        components.push(context.trip.tripType);
        break;
      case 'composition':
        components.push(context.trip.composition);
        break;
      case 'nationality':
        components.push(context.primaryTraveler.demographics.nationality.toLowerCase());
        break;
      case 'budgetTier':
        components.push(context.trip.budgetTier);
        break;
      case 'season':
        components.push(determineSeason(context.trip.startDate));
        break;
      case 'durationBucket':
        components.push(getDurationBucket(context.trip.durationDays));
        break;
    }
  }

  return components.join(':');
}

function determineSeason(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

function getDurationBucket(days: number): string {
  if (days <= 3) return 'weekend';
  if (days <= 7) return 'short';
  if (days <= 14) return 'medium';
  if (days <= 30) return 'long';
  return 'extended';
}

function generateContextHash(
  moduleType: ModuleType,
  context: TripGenerationContext
): string {
  const strategy = CACHE_STRATEGIES[moduleType];
  const hashInput: Record<string, unknown> = {};

  for (const component of strategy.keyComponents) {
    switch (component) {
      case 'destination':
        hashInput.destination = context.destination.basic.code;
        break;
      case 'tripType':
        hashInput.tripType = context.trip.tripType;
        break;
      case 'composition':
        hashInput.composition = context.trip.composition;
        break;
      case 'nationality':
        hashInput.nationality = context.primaryTraveler.demographics.nationality;
        break;
      case 'budgetTier':
        hashInput.budgetTier = context.trip.budgetTier;
        break;
    }
  }

  return btoa(JSON.stringify(hashInput));
}

// ============================================
// CACHE SERVICE
// ============================================

interface CacheEntry {
  id: string;
  cache_key: string;
  module_type: string;
  cache_tier: string;
  context_hash: string;
  content: unknown;
  ttl_days: number;
  created_at: string;
  expires_at: string;
  access_count: number;
}

interface CacheResult<T> {
  hit: boolean;
  data: T | null;
  cacheKey: string;
  fromCache: boolean;
}

class CacheService {
  /**
   * Check if module type is cacheable
   */
  isCacheable(moduleType: ModuleType): boolean {
    const strategy = CACHE_STRATEGIES[moduleType];
    return strategy.tier !== 'personal';
  }

  /**
   * Get cache strategy for module type
   */
  getStrategy(moduleType: ModuleType): CacheStrategy {
    return CACHE_STRATEGIES[moduleType];
  }

  /**
   * Try to get cached content
   */
  async get<T>(
    moduleType: ModuleType,
    context: TripGenerationContext
  ): Promise<CacheResult<T>> {
    const strategy = CACHE_STRATEGIES[moduleType];
    
    if (strategy.tier === 'personal') {
      return {
        hit: false,
        data: null,
        cacheKey: generateCacheKey(moduleType, context),
        fromCache: false,
      };
    }

    const cacheKey = generateCacheKey(moduleType, context);
    const contextHash = generateContextHash(moduleType, context);

    try {
      const { data, error } = await supabase
        .from('ai_module_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .eq('context_hash', contextHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return {
          hit: false,
          data: null,
          cacheKey,
          fromCache: false,
        };
      }

      // Update access count
      await supabase
        .from('ai_module_cache')
        .update({
          last_accessed_at: new Date().toISOString(),
          access_count: (data.access_count || 0) + 1,
        })
        .eq('id', data.id);

      return {
        hit: true,
        data: data.content as T,
        cacheKey,
        fromCache: true,
      };
    } catch (error) {
      console.error('Cache get error:', error);
      return {
        hit: false,
        data: null,
        cacheKey,
        fromCache: false,
      };
    }
  }

  /**
   * Store content in cache
   */
  async set<T>(
    moduleType: ModuleType,
    context: TripGenerationContext,
    content: T
  ): Promise<void> {
    const strategy = CACHE_STRATEGIES[moduleType];
    
    if (strategy.tier === 'personal') {
      return;
    }

    const cacheKey = generateCacheKey(moduleType, context);
    const contextHash = generateContextHash(moduleType, context);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + strategy.ttlDays * 24 * 60 * 60 * 1000);

    try {
      await supabase
        .from('ai_module_cache')
        .upsert({
          cache_key: cacheKey,
          module_type: moduleType,
          cache_tier: strategy.tier,
          context_hash: contextHash,
          content,
          destination_code: context.destination.basic.code,
          trip_type: context.trip.tripType,
          composition: context.trip.composition,
          nationality: context.primaryTraveler.demographics.nationality,
          season: determineSeason(context.trip.startDate),
          duration_bucket: getDurationBucket(context.trip.durationDays),
          ttl_days: strategy.ttlDays,
          expires_at: expiresAt.toISOString(),
          last_accessed_at: now.toISOString(),
          access_count: 1,
        }, {
          onConflict: 'cache_key',
        });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Invalidate cache for a specific key
   */
  async invalidate(cacheKey: string): Promise<void> {
    try {
      await supabase
        .from('ai_module_cache')
        .delete()
        .eq('cache_key', cacheKey);
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  /**
   * Invalidate all cache for a destination
   */
  async invalidateDestination(destinationCode: string): Promise<void> {
    try {
      await supabase
        .from('ai_module_cache')
        .delete()
        .eq('destination_code', destinationCode);
    } catch (error) {
      console.error('Cache invalidate destination error:', error);
    }
  }

  /**
   * Invalidate all cache for a module type
   */
  async invalidateModuleType(moduleType: ModuleType): Promise<void> {
    try {
      await supabase
        .from('ai_module_cache')
        .delete()
        .eq('module_type', moduleType);
    } catch (error) {
      console.error('Cache invalidate module type error:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpired(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('ai_module_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        console.error('Cache cleanup error:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    byTier: Record<CacheTier, number>;
    byModule: Record<string, number>;
    avgAccessCount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('ai_module_cache')
        .select('cache_tier, module_type, access_count');

      if (error || !data) {
        return {
          totalEntries: 0,
          byTier: { destination_base: 0, context_specific: 0, personal: 0 },
          byModule: {},
          avgAccessCount: 0,
        };
      }

      const byTier: Record<string, number> = {};
      const byModule: Record<string, number> = {};
      let totalAccess = 0;

      for (const entry of data) {
        byTier[entry.cache_tier] = (byTier[entry.cache_tier] || 0) + 1;
        byModule[entry.module_type] = (byModule[entry.module_type] || 0) + 1;
        totalAccess += entry.access_count || 0;
      }

      return {
        totalEntries: data.length,
        byTier: byTier as Record<CacheTier, number>,
        byModule,
        avgAccessCount: data.length > 0 ? totalAccess / data.length : 0,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        totalEntries: 0,
        byTier: { destination_base: 0, context_specific: 0, personal: 0 },
        byModule: {},
        avgAccessCount: 0,
      };
    }
  }
}

export const cacheService = new CacheService();
