/**
 * AI GENERATION SERVICE
 * 
 * Main orchestrator for AI-powered content generation.
 * Coordinates context building, caching, and AI generation.
 */

import { supabase } from '@/lib/supabase/client';
import { contextBuilderService } from '../context';
import { cacheService } from '../cache';
import {
  ModuleType,
  ModuleGenerationRequest,
  ModuleGenerationResult,
  TripGenerationContext,
} from '../types';

// ============================================
// GENERATION SERVICE
// ============================================

interface GenerationLogEntry {
  tripId: string | null;
  userId: string | null;
  moduleType: ModuleType;
  cacheHit: boolean;
  cacheKey?: string;
  startedAt: Date;
  provider?: string;
  model?: string;
}

class GenerationService {
  private readonly EDGE_FUNCTION_URL = 'ai-generation';

  /**
   * Generate content for a specific module
   */
  async generateModule<T>(
    request: ModuleGenerationRequest
  ): Promise<ModuleGenerationResult<T>> {
    const { tripId, moduleType, forceRefresh = false } = request;
    const startedAt = new Date();

    try {
      // Step 1: Build context
      const context = await contextBuilderService.buildContext(tripId);

      // Step 2: Check cache (unless force refresh)
      if (!forceRefresh && cacheService.isCacheable(moduleType)) {
        const cached = await cacheService.get<T>(moduleType, context);
        if (cached.hit && cached.data) {
          await this.logGeneration({
            tripId,
            userId: context.primaryTraveler.userId,
            moduleType,
            cacheHit: true,
            cacheKey: cached.cacheKey,
            startedAt,
          });

          return {
            success: true,
            moduleType,
            data: cached.data,
            cached: true,
            cacheKey: cached.cacheKey,
            generatedAt: new Date().toISOString(),
          };
        }
      }

      // Step 3: Generate via Edge Function
      const result = await this.callGenerationEdgeFunction<T>(moduleType, context);

      // Step 4: Cache result if cacheable
      if (result.success && result.data && cacheService.isCacheable(moduleType)) {
        await cacheService.set(moduleType, context, result.data);
      }

      // Step 5: Log generation
      await this.logGeneration({
        tripId,
        userId: context.primaryTraveler.userId,
        moduleType,
        cacheHit: false,
        startedAt,
        provider: 'anthropic',
        model: 'claude-3-5-sonnet',
      });

      return {
        success: result.success,
        moduleType,
        data: result.data,
        cached: false,
        generatedAt: new Date().toISOString(),
        error: result.error,
      };
    } catch (error) {
      console.error(`Generation error for ${moduleType}:`, error);
      
      return {
        success: false,
        moduleType,
        data: null,
        cached: false,
        generatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate multiple modules at once
   */
  async generateModules<T extends Record<ModuleType, unknown>>(
    tripId: string,
    moduleTypes: ModuleType[],
    forceRefresh = false
  ): Promise<Record<ModuleType, ModuleGenerationResult<T[ModuleType]>>> {
    const results: Record<string, ModuleGenerationResult<unknown>> = {};

    // Generate in parallel for efficiency
    const promises = moduleTypes.map(async (moduleType) => {
      const result = await this.generateModule({
        tripId,
        moduleType,
        forceRefresh,
      });
      results[moduleType] = result;
    });

    await Promise.all(promises);

    return results as Record<ModuleType, ModuleGenerationResult<T[ModuleType]>>;
  }

  /**
   * Generate all modules for a trip
   */
  async generateAllModules(
    tripId: string,
    forceRefresh = false
  ): Promise<Record<ModuleType, ModuleGenerationResult<unknown>>> {
    const allModules: ModuleType[] = [
      'packing',
      'dos_donts',
      'safety',
      'language',
      'budget',
      'cultural',
      'documents',
    ];

    return this.generateModules(tripId, allModules, forceRefresh);
  }

  /**
   * Call the AI generation edge function
   */
  private async callGenerationEdgeFunction<T>(
    moduleType: ModuleType,
    context: TripGenerationContext
  ): Promise<{ success: boolean; data: T | null; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke(this.EDGE_FUNCTION_URL, {
        body: {
          action: 'generate',
          moduleType,
          context,
        },
      });

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data?.result as T,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Edge function call failed',
      };
    }
  }

  /**
   * Log generation for analytics
   */
  private async logGeneration(entry: GenerationLogEntry): Promise<void> {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - entry.startedAt.getTime();

    try {
      await supabase.from('ai_generation_logs').insert({
        trip_id: entry.tripId,
        user_id: entry.userId,
        module_type: entry.moduleType,
        cache_hit: entry.cacheHit,
        cache_key: entry.cacheKey,
        started_at: entry.startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
        duration_ms: durationMs,
        provider: entry.provider,
        model: entry.model,
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to log generation:', error);
    }
  }

  /**
   * Get generation history for a trip
   */
  async getGenerationHistory(tripId: string): Promise<{
    logs: Array<{
      moduleType: string;
      cached: boolean;
      generatedAt: string;
      durationMs: number;
    }>;
  }> {
    const { data, error } = await supabase
      .from('ai_generation_logs')
      .select('module_type, cache_hit, created_at, duration_ms')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { logs: [] };
    }

    return {
      logs: (data || []).map((log) => ({
        moduleType: log.module_type,
        cached: log.cache_hit,
        generatedAt: log.created_at,
        durationMs: log.duration_ms,
      })),
    };
  }

  /**
   * Rate a generated module (for quality feedback)
   */
  async rateGeneration(
    tripId: string,
    moduleType: ModuleType,
    rating: 1 | 2 | 3 | 4 | 5
  ): Promise<void> {
    try {
      // Find the most recent generation for this trip/module
      const { data } = await supabase
        .from('ai_generation_logs')
        .select('id')
        .eq('trip_id', tripId)
        .eq('module_type', moduleType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        await supabase
          .from('ai_generation_logs')
          .update({ user_rating: rating })
          .eq('id', data.id);
      }
    } catch (error) {
      console.error('Failed to rate generation:', error);
    }
  }

  /**
   * Invalidate cache for a trip (when trip details change)
   */
  async invalidateTripCache(tripId: string): Promise<void> {
    try {
      const context = await contextBuilderService.buildContext(tripId);
      const destinationCode = context.destination.basic.code;
      
      // Invalidate context-specific cache for this destination
      await cacheService.invalidateDestination(destinationCode);
    } catch (error) {
      console.error('Failed to invalidate trip cache:', error);
    }
  }
}

export const generationService = new GenerationService();
