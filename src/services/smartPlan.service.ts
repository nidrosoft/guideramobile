import { supabase } from '@/lib/supabase/client';
import { invokeEdgeFn } from '@/utils/retry';

export interface SmartPlanStartResult {
  success: boolean;
  status: 'started' | 'already_running';
  generationStatus?: Record<string, any>;
  error?: string;
}

class SmartPlanService {
  async startGeneration(
    tripId: string,
    userId: string,
    forceRefresh = false
  ): Promise<SmartPlanStartResult> {
    const { data, error } = await invokeEdgeFn(
      supabase,
      'smart-plan-generate',
      { tripId, userId, forceRefresh },
      'fast'
    );

    if (error) {
      const body = (error as any).body;
      if ((error as any).status === 429 || body?.error === 'Rate limit exceeded') {
        throw new Error(
          body?.resetAt
            ? `Smart Plan is busy right now. Please try again after ${new Date(body.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
            : 'Smart Plan is busy right now. Please try again shortly.'
        );
      }
      throw new Error(error.message || 'Failed to start Smart Plan generation');
    }
    if (data?.error) throw new Error(data.error);
    return data as SmartPlanStartResult;
  }
}

export const smartPlanService = new SmartPlanService();
