/**
 * AI GENERATION HOOKS
 * 
 * React hooks for interacting with the AI Generation Engine.
 */

import { useState, useCallback } from 'react';
import { generationService } from '@/services/ai-engine';
import type {
  ModuleType,
  ModuleGenerationResult,
  PackingListOutput,
  DosDontsOutput,
  SafetyOutput,
  LanguageOutput,
  BudgetOutput,
  CulturalOutput,
  DocumentsOutput,
} from '@/services/ai-engine';

// ============================================
// GENERIC MODULE HOOK
// ============================================

interface UseModuleGenerationOptions {
  autoGenerate?: boolean;
  forceRefresh?: boolean;
}

interface UseModuleGenerationResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  cached: boolean;
  generate: (forceRefresh?: boolean) => Promise<void>;
  rate: (rating: 1 | 2 | 3 | 4 | 5) => Promise<void>;
}

export function useModuleGeneration<T>(
  tripId: string | null,
  moduleType: ModuleType,
  _options: UseModuleGenerationOptions = {}
): UseModuleGenerationResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const generate = useCallback(async (forceRefresh = false) => {
    if (!tripId) {
      setError('Trip ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await generationService.generateModule<T>({
        tripId,
        moduleType,
        forceRefresh,
      });

      if (result.success && result.data) {
        setData(result.data);
        setCached(result.cached);
      } else {
        setError(result.error || 'Generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [tripId, moduleType]);

  const rate = useCallback(async (rating: 1 | 2 | 3 | 4 | 5) => {
    if (!tripId) return;
    await generationService.rateGeneration(tripId, moduleType, rating);
  }, [tripId, moduleType]);

  return {
    data,
    isLoading,
    error,
    cached,
    generate,
    rate,
  };
}

// ============================================
// SPECIFIC MODULE HOOKS
// ============================================

export function usePackingList(tripId: string | null, options?: UseModuleGenerationOptions) {
  return useModuleGeneration<PackingListOutput>(tripId, 'packing', options);
}

export function useDosDonts(tripId: string | null, options?: UseModuleGenerationOptions) {
  return useModuleGeneration<DosDontsOutput>(tripId, 'dos_donts', options);
}

export function useSafetyGuide(tripId: string | null, options?: UseModuleGenerationOptions) {
  return useModuleGeneration<SafetyOutput>(tripId, 'safety', options);
}

export function useLanguageGuide(tripId: string | null, options?: UseModuleGenerationOptions) {
  return useModuleGeneration<LanguageOutput>(tripId, 'language', options);
}

export function useBudgetGuide(tripId: string | null, options?: UseModuleGenerationOptions) {
  return useModuleGeneration<BudgetOutput>(tripId, 'budget', options);
}

export function useCulturalGuide(tripId: string | null, options?: UseModuleGenerationOptions) {
  return useModuleGeneration<CulturalOutput>(tripId, 'cultural', options);
}

export function useDocumentsChecklist(tripId: string | null, options?: UseModuleGenerationOptions) {
  return useModuleGeneration<DocumentsOutput>(tripId, 'documents', options);
}

// ============================================
// GENERATE ALL MODULES HOOK
// ============================================

interface UseAllModulesResult {
  modules: Partial<Record<ModuleType, ModuleGenerationResult<unknown>>>;
  isLoading: boolean;
  progress: number;
  generateAll: (forceRefresh?: boolean) => Promise<void>;
}

export function useAllModules(tripId: string | null): UseAllModulesResult {
  const [modules, setModules] = useState<Partial<Record<ModuleType, ModuleGenerationResult<unknown>>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateAll = useCallback(async (forceRefresh = false) => {
    if (!tripId) return;

    setIsLoading(true);
    setProgress(0);

    const moduleTypes: ModuleType[] = [
      'packing',
      'dos_donts',
      'safety',
      'language',
      'budget',
      'cultural',
      'documents',
    ];

    const results: Partial<Record<ModuleType, ModuleGenerationResult<unknown>>> = {};
    let completed = 0;

    for (const moduleType of moduleTypes) {
      try {
        const result = await generationService.generateModule({
          tripId,
          moduleType,
          forceRefresh,
        });
        results[moduleType] = result;
      } catch (error) {
        results[moduleType] = {
          success: false,
          moduleType,
          data: null,
          cached: false,
          generatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      completed++;
      setProgress((completed / moduleTypes.length) * 100);
      setModules({ ...results });
    }

    setIsLoading(false);
  }, [tripId]);

  return {
    modules,
    isLoading,
    progress,
    generateAll,
  };
}

// ============================================
// GENERATION HISTORY HOOK
// ============================================

interface GenerationLog {
  moduleType: string;
  cached: boolean;
  generatedAt: string;
  durationMs: number;
}

export function useGenerationHistory(tripId: string | null) {
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!tripId) return;

    setIsLoading(true);
    try {
      const result = await generationService.getGenerationHistory(tripId);
      setLogs(result.logs);
    } catch (error) {
      console.error('Failed to fetch generation history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  return {
    logs,
    isLoading,
    fetchHistory,
  };
}
