/**
 * TRIP SNAPSHOT SERVICE
 *
 * Two-phase snapshot: live data (Phase A) then streaming AI brief (Phase B).
 */

import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase/client';

// ─── Types ──────────────────────────────────────

export interface TripSnapshotRequest {
  destination: string;
  country?: string;
  startDate: string;
  endDate: string;
  travelers: { adults: number; children: number; infants: number };
  originCity?: string;
  originAirport?: string;
  currency?: string;
  nationality?: string;
  userPreferences?: {
    budgetAmount?: number;
    interests?: string[];
    travelStyle?: string;
    accommodationType?: string;
  };
  selectedTopics?: string[];
}

export interface FlightPreview {
  cheapest: { price: number; airline: string; stops: number; duration: string; cabin?: string } | null;
  fastest: { price: number; airline: string; stops: number; duration: string; cabin?: string } | null;
  premium: { price: number; airline: string; stops: number; duration: string; cabin?: string } | null;
  avgPrice: number;
  currency: string;
}

export interface HotelTiers {
  budget: { avgPrice: number; stars: number; count: number } | null;
  midRange: { avgPrice: number; stars: number; count: number } | null;
  luxury: { avgPrice: number; stars: number; count: number } | null;
  currency: string;
}

export interface ExperiencePreview {
  id: string;
  title: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  duration: string;
  image: string;
  category: string;
  freeCancellation: boolean;
  bookingUrl: string;
}

export interface EventPreview {
  name: string;
  category: string;
  dateRange: string;
  venue?: string;
  isFree: boolean;
  description: string;
}

export interface CostEstimate {
  low: number;
  high: number;
  breakdown: {
    flights: { low: number; high: number };
    hotels: { low: number; high: number };
    experiences: { low: number; high: number };
    food: { low: number; high: number };
    miscellaneous: { low: number; high: number };
  };
  currency: string;
  perDayBudget: { low: number; high: number };
  withinBudget?: boolean;
  budgetAmount?: number;
}

export interface BriefItem {
  label: string;
  detail: string;
}

export interface BriefSection {
  id: string;
  icon: string;
  title: string;
  items: BriefItem[];
  cachedAt?: string;
}

export interface DestinationIntelligence {
  overview: string;
  overviewCachedAt?: string;
  sections: BriefSection[];
}

export interface TripSnapshotLiveData {
  destination: string;
  country?: string;
  dates: { start: string; end: string; nights: number };
  travelers: { adults: number; children: number; infants: number; total: number };
  flights: FlightPreview | null;
  hotels: HotelTiers | null;
  experiences: ExperiencePreview[];
  events: EventPreview[];
  costEstimate: CostEstimate;
  generatedAt: string;
}

export interface TripSnapshot extends TripSnapshotLiveData {
  aiBrief: DestinationIntelligence | null;
}

export interface BriefStreamHandlers {
  onOverview?: (overview: string, cachedAt?: string) => void;
  onOverviewDelta?: (delta: string) => void;
  onSection?: (section: BriefSection, cachedAt?: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

// ─── SSE parser ──────────────────────────────────────

function dispatchSSEEvent(event: string, dataStr: string, handlers: BriefStreamHandlers): void {
  if (!dataStr) return;
  try {
    const data = JSON.parse(dataStr);
    if (event === 'overview' && data.overview) {
      handlers.onOverview?.(data.overview, data.cachedAt);
    } else if (event === 'overview_delta' && data.delta) {
      handlers.onOverviewDelta?.(data.delta);
    } else if (event === 'section' && data.section) {
      handlers.onSection?.({ ...data.section, cachedAt: data.cachedAt }, data.cachedAt);
    } else if (event === 'done') {
      handlers.onDone?.();
    } else if (event === 'error') {
      handlers.onError?.(new Error(data.message || 'Brief stream failed'));
    }
  } catch {
    // ignore malformed chunks
  }
}

function processSSEBuffer(buffer: string, handlers: BriefStreamHandlers): string {
  const parts = buffer.split('\n\n');
  const remainder = parts.pop() || '';

  for (const chunk of parts) {
    if (!chunk.trim()) continue;

    let event = 'message';
    let dataStr = '';

    for (const line of chunk.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
    }

    dispatchSSEEvent(event, dataStr, handlers);
  }

  return remainder;
}

async function consumeSSE(
  response: Response,
  handlers: BriefStreamHandlers,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    processSSEBuffer(text, handlers);
    handlers.onDone?.();
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = processSSEBuffer(buffer, handlers);
  }

  if (buffer.trim()) processSSEBuffer(`${buffer}\n\n`, handlers);
  handlers.onDone?.();
}

function consumeSSEViaXHR(
  url: string,
  body: Record<string, unknown>,
  handlers: BriefStreamHandlers,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let processedLen = 0;
    let parseBuffer = '';
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      const tail = xhr.responseText.slice(processedLen);
      processedLen = xhr.responseText.length;
      parseBuffer += tail;
      if (parseBuffer.trim()) parseBuffer = processSSEBuffer(`${parseBuffer}\n\n`, handlers);
      handlers.onDone?.();
      resolve();
    };

    xhr.open('POST', url);
    const headers = edgeHeaders();
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));

    xhr.onprogress = () => {
      const chunk = xhr.responseText.slice(processedLen);
      processedLen = xhr.responseText.length;
      if (!chunk) return;
      parseBuffer += chunk;
      parseBuffer = processSSEBuffer(parseBuffer, handlers);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        finish();
      } else {
        reject(new Error(xhr.responseText || `Brief request failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Brief stream network error'));
    xhr.onabort = () => reject(new Error('Brief stream aborted'));
    xhr.send(JSON.stringify(body));
  });
}

function edgeHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  };
}

export function normalizeCostRange(range?: { low?: number; high?: number } | null): { low: number; high: number } {
  const low = typeof range?.low === 'number' && Number.isFinite(range.low) ? range.low : 0;
  const high = typeof range?.high === 'number' && Number.isFinite(range.high) ? range.high : 0;
  return { low, high };
}

export function normalizeCostEstimate(cost?: Partial<CostEstimate> | null): CostEstimate {
  const breakdown = (cost?.breakdown || {}) as Partial<CostEstimate['breakdown']> & { misc?: { low?: number; high?: number } };
  return {
    low: typeof cost?.low === 'number' && Number.isFinite(cost.low) ? cost.low : 0,
    high: typeof cost?.high === 'number' && Number.isFinite(cost.high) ? cost.high : 0,
    breakdown: {
      flights: normalizeCostRange(breakdown.flights),
      hotels: normalizeCostRange(breakdown.hotels),
      food: normalizeCostRange(breakdown.food),
      experiences: normalizeCostRange(breakdown.experiences),
      miscellaneous: normalizeCostRange(breakdown.miscellaneous ?? breakdown.misc),
    },
    currency: cost?.currency || 'USD',
    perDayBudget: normalizeCostRange(cost?.perDayBudget),
    withinBudget: cost?.withinBudget,
    budgetAmount: cost?.budgetAmount,
  };
}

function normalizeLiveData(data: TripSnapshotLiveData): TripSnapshotLiveData {
  return {
    ...data,
    costEstimate: normalizeCostEstimate(data.costEstimate),
  };
}

// ─── Service ──────────────────────────────────────

class TripSnapshotService {
  private prefetchedLiveDataKeys = new Set<string>();

  private async sleep(ms: number): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
  }

  private parseRetryAfterMs(error: unknown, attempt: number): number {
    const err = error as { context?: { status?: number; headers?: Record<string, string> }; message?: string };
    const retryHeader = err.context?.headers?.['retry-after'] || err.context?.headers?.['Retry-After'];
    if (retryHeader) {
      const sec = parseInt(retryHeader, 10);
      if (!Number.isNaN(sec)) return sec * 1000;
    }
    return Math.min(8000, Math.pow(2, attempt) * 1000);
  }

  /** Phase A — flights, hotels, experiences, events, cost (cached where possible) */
  async fetchLiveData(params: TripSnapshotRequest, maxRetries = 2): Promise<TripSnapshotLiveData> {
    let lastError: Error = new Error('Request failed');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await this.sleep(this.parseRetryAfterMs(lastError, attempt));
        }

        const { data, error } = await supabase.functions.invoke('trip-snapshot', {
          body: { ...params, phase: 'data' },
        });

        if (error) {
          lastError = new Error(error.message || 'Request failed');
          if (attempt < maxRetries) continue;
          throw lastError;
        }

        if (data?.error) {
          lastError = new Error(data.error);
          const isRateLimited = data.error.includes?.('wait') || data.error.includes?.('High demand');
          if (isRateLimited && attempt < maxRetries) continue;
          if (isRateLimited) throw lastError;
          if (attempt < maxRetries) continue;
          throw lastError;
        }

        return normalizeLiveData(data as TripSnapshotLiveData);
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isRateLimited = lastError.message?.includes?.('wait') || lastError.message?.includes?.('High demand');
        if (isRateLimited && attempt < maxRetries) continue;
        if (attempt === maxRetries) throw this.friendlyError(lastError);
      }
    }

    throw this.friendlyError(lastError);
  }

  /** Warm cache when user picks a destination */
  prefetchLiveData(params: Pick<TripSnapshotRequest, 'destination' | 'country' | 'originCity'>): void {
    if (!params.destination) return;

    const prefetchKey = [
      params.destination.trim().toLowerCase(),
      params.country?.trim().toLowerCase() || '',
      params.originCity?.trim().toLowerCase() || '',
    ].join('|');
    if (this.prefetchedLiveDataKeys.has(prefetchKey)) return;
    this.prefetchedLiveDataKeys.add(prefetchKey);

    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const weekLater = new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0];

    supabase.functions.invoke('trip-snapshot', {
      body: {
        destination: params.destination,
        country: params.country,
        startDate: tomorrow,
        endDate: weekLater,
        travelers: { adults: 1, children: 0, infants: 0 },
        originCity: params.originCity,
        phase: 'data',
      },
    }).catch(() => {});
  }

  /** Phase B — stream AI brief sections via SSE */
  async streamBrief(
    params: TripSnapshotRequest & { costEstimate?: CostEstimate },
    handlers: BriefStreamHandlers,
    maxRetries = 1,
  ): Promise<void> {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured');
    }

    const payload = {
      destination: params.destination,
      country: params.country,
      startDate: params.startDate,
      endDate: params.endDate,
      travelers: params.travelers,
      nationality: params.nationality,
      selectedTopics: params.selectedTopics,
      costEstimate: params.costEstimate
        ? { low: params.costEstimate.low, high: params.costEstimate.high }
        : undefined,
    };

    const url = `${supabaseUrl}/functions/v1/trip-snapshot-brief`;
    let lastError: Error = new Error('Brief stream failed');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await this.sleep(this.parseRetryAfterMs(lastError, attempt));
        }

        if (typeof XMLHttpRequest !== 'undefined') {
          await consumeSSEViaXHR(url, payload, handlers);
          return;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: edgeHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          lastError = new Error(text || `Brief request failed (${response.status})`);
          if ((response.status === 429 || response.status === 503) && attempt < maxRetries) continue;
          throw lastError;
        }

        await consumeSSE(response, handlers);
        return;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt === maxRetries) throw lastError;
      }
    }

    throw lastError;
  }

  /** Legacy full snapshot (fallback) */
  async generateSnapshot(params: TripSnapshotRequest, maxRetries = 2): Promise<TripSnapshot> {
    let lastError: Error = new Error('Request failed');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const { data, error } = await supabase.functions.invoke('trip-snapshot', {
          body: params,
        });

        if (error) {
          lastError = new Error(error.message || 'Request failed');
          if (attempt < maxRetries) continue;
          throw this.friendlyError(lastError);
        }

        if (data?.error) {
          lastError = new Error(data.error);
          const isRateLimited = data.error.includes?.('wait') || data.error.includes?.('High demand');
          if (isRateLimited && attempt < maxRetries) continue;
          if (isRateLimited) throw lastError;
          if (attempt < maxRetries) continue;
          throw this.friendlyError(lastError);
        }

        return data as TripSnapshot;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isRateLimited = lastError.message?.includes?.('wait') || lastError.message?.includes?.('High demand');
        if (isRateLimited && attempt < maxRetries) continue;
        if (attempt === maxRetries) throw this.friendlyError(lastError);
      }
    }

    throw this.friendlyError(lastError);
  }

  private friendlyError(err: Error): Error {
    if (__DEV__) console.warn('[TripSnapshot] Original error:', err.message);
    if (err.message?.includes?.('wait') && err.message?.includes?.('seconds')) {
      return err;
    }
    return new Error(
      "We couldn't generate your trip snapshot right now. Please check your internet connection and try again in a moment.",
    );
  }
}

export const tripSnapshotService = new TripSnapshotService();

/** Format cache timestamp as "Guide updated X days ago" */
export function formatGuideFreshness(cachedAt?: string): string | null {
  if (!cachedAt) return null;
  const diffMs = Date.now() - new Date(cachedAt).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'Guide updated today';
  if (days === 1) return 'Guide updated 1 day ago';
  return `Guide updated ${days} days ago`;
}
