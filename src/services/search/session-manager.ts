/**
 * Session Manager
 * Handles search session persistence, state management, and analytics
 */

import { supabase } from '@/lib/supabase/client';
import type {
  SearchSession,
  EnrichedQuery,
  SearchCategory,
  CategoryResults,
  UnifiedResult,
  AppliedFilters,
  SortOption,
  SessionStatus,
  PriceSnapshot,
  SessionAnalytics,
  ExecutionResult,
} from '@/types/search';
import { deduplicateResults, rankResults, applyFilters, sortResults } from './result-processor';

// Generate unique session token
function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Generate anonymous ID for non-logged-in users
function generateAnonymousId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Calculate average price from results
function calculateAvgPrice(results: UnifiedResult[]): number {
  if (results.length === 0) return 0;
  const sum = results.reduce((acc, r) => acc + r.price.amount, 0);
  return sum / results.length;
}

// Serialize session for database storage
function serializeSession(session: SearchSession): Record<string, unknown> {
  return {
    id: session.id,
    session_token: session.token,
    user_id: session.userId,
    anonymous_id: session.anonymousId,
    search_mode: session.query.mode,
    search_params: session.query,
    destination_city: session.query.resolvedDestination?.name,
    destination_country: session.query.resolvedDestination?.countryCode,
    destination_code: session.query.resolvedDestination?.code,
    origin_city: session.query.resolvedOrigin?.name,
    origin_code: session.query.resolvedOrigin?.code,
    start_date: session.query.dates.startDate,
    end_date: session.query.dates.endDate,
    flexible_dates: session.query.dates.type === 'flexible',
    adults: session.query.travelers.adults,
    children: session.query.travelers.children,
    infants: session.query.travelers.infants,
    rooms: session.query.travelers.rooms,
    total_results: Object.values(session.results).reduce((sum, r) => sum + r.totalCount, 0),
    results_by_category: Object.fromEntries(
      Object.entries(session.results).map(([k, v]) => [k, v.totalCount])
    ),
    providers_queried: Object.values(session.results)
      .flatMap(r => r.providers.map(p => p.code)),
    status: session.status,
    filters_applied: session.appliedFilters,
    sort_applied: session.sortBy,
    results_viewed: session.analytics.resultsViewed,
    offers_clicked: session.analytics.offersClicked,
    search_started_at: session.analytics.searchStarted.toISOString(),
    search_completed_at: session.analytics.searchCompleted?.toISOString(),
    duration_ms: session.analytics.searchCompleted
      ? session.analytics.searchCompleted.getTime() - session.analytics.searchStarted.getTime()
      : null,
    updated_at: new Date().toISOString(),
  };
}

// Deserialize session from database
function deserializeSession(data: Record<string, unknown>): SearchSession {
  const searchParams = data.search_params as EnrichedQuery;
  
  return {
    id: data.id as string,
    token: data.session_token as string,
    userId: data.user_id as string | undefined,
    anonymousId: data.anonymous_id as string | undefined,
    query: searchParams,
    results: {},
    appliedFilters: (data.filters_applied as AppliedFilters) || {},
    sortBy: (data.sort_applied as SortOption) || 'recommended',
    status: (data.status as SessionStatus) || 'pending',
    lastActivity: new Date(data.updated_at as string),
    priceSnapshots: [],
    analytics: {
      searchStarted: new Date(data.search_started_at as string),
      searchCompleted: data.search_completed_at 
        ? new Date(data.search_completed_at as string) 
        : undefined,
      resultsViewed: (data.results_viewed as number) || 0,
      filtersApplied: 0,
      sortsApplied: 0,
      offersClicked: (data.offers_clicked as string[]) || [],
      offersSaved: [],
      timeSpentSeconds: 0,
      deviceType: 'mobile',
    },
  };
}

/**
 * Session Manager class
 */
export class SessionManager {
  private cache: Map<string, SearchSession> = new Map();

  /**
   * Create a new search session
   */
  async createSession(query: EnrichedQuery, userId?: string): Promise<SearchSession> {
    const sessionToken = generateSessionToken();

    const session: SearchSession = {
      id: crypto.randomUUID(),
      token: sessionToken,
      userId,
      anonymousId: userId ? undefined : generateAnonymousId(),
      query,
      results: {},
      appliedFilters: {},
      sortBy: 'recommended',
      status: 'pending',
      lastActivity: new Date(),
      priceSnapshots: [],
      analytics: {
        searchStarted: new Date(),
        resultsViewed: 0,
        filtersApplied: 0,
        sortsApplied: 0,
        offersClicked: [],
        offersSaved: [],
        timeSpentSeconds: 0,
        deviceType: 'mobile',
      },
    };

    // Save to database
    await this.saveSession(session);

    // Cache locally
    this.cache.set(sessionToken, session);

    return session;
  }

  /**
   * Update session with search results
   */
  async updateSessionResults(
    sessionToken: string,
    category: SearchCategory,
    executionResults: ExecutionResult[]
  ): Promise<void> {
    const session = await this.getSession(sessionToken);
    if (!session) throw new Error('Session not found');

    // Normalize and deduplicate results
    const allResults = executionResults
      .filter(r => r.success)
      .flatMap(r => r.results);

    const deduped = deduplicateResults(allResults, category);
    const ranked = rankResults(deduped.uniqueResults, session.query);

    // Update session results
    session.results[category] = {
      items: ranked,
      totalCount: ranked.length,
      pageInfo: {
        page: 1,
        pageSize: 50,
        totalPages: Math.ceil(ranked.length / 50),
        hasMore: ranked.length > 50,
      },
      providers: executionResults.map(r => ({
        code: r.provider,
        responseTime: r.responseTime,
        fromCache: r.fromCache,
        resultCount: r.results.length,
      })),
    };

    session.status = 'completed';
    session.lastActivity = new Date();
    session.analytics.searchCompleted = new Date();

    // Save price snapshot
    if (ranked.length > 0) {
      session.priceSnapshots.push({
        timestamp: new Date(),
        category,
        lowestPrice: ranked[0].price,
        avgPrice: calculateAvgPrice(ranked),
      });
    }

    await this.saveSession(session);
  }

  /**
   * Apply filters to session results
   */
  async applySessionFilters(
    sessionToken: string,
    category: SearchCategory,
    filters: AppliedFilters
  ): Promise<{ filteredResults: UnifiedResult[]; totalCount: number }> {
    const session = await this.getSession(sessionToken);
    if (!session) throw new Error('Session not found');

    const categoryResults = session.results[category];
    if (!categoryResults) throw new Error('No results for category');

    const filterResult = applyFilters(categoryResults.items, category, filters);

    // Update session
    session.appliedFilters = { ...session.appliedFilters, [category]: filters };
    session.analytics.filtersApplied++;
    session.lastActivity = new Date();

    await this.saveSession(session);

    return {
      filteredResults: filterResult.filteredResults,
      totalCount: filterResult.filteredResults.length,
    };
  }

  /**
   * Apply sorting to session results
   */
  async applySessionSort(
    sessionToken: string,
    category: SearchCategory,
    sortBy: SortOption
  ): Promise<UnifiedResult[]> {
    const session = await this.getSession(sessionToken);
    if (!session) throw new Error('Session not found');

    const categoryResults = session.results[category];
    if (!categoryResults) throw new Error('No results for category');

    const sorted = sortResults(categoryResults.items, sortBy);

    // Update session
    session.sortBy = sortBy;
    session.results[category].items = sorted;
    session.analytics.sortsApplied++;
    session.lastActivity = new Date();

    await this.saveSession(session);

    return sorted;
  }

  /**
   * Track offer click
   */
  async trackOfferClick(sessionToken: string, offerId: string): Promise<void> {
    const session = await this.getSession(sessionToken);
    if (!session) return;

    session.analytics.offersClicked.push(offerId);
    session.analytics.resultsViewed++;
    session.lastActivity = new Date();

    await this.saveSession(session);
  }

  /**
   * Get session by token
   */
  async getSession(token: string): Promise<SearchSession | null> {
    // Check cache first
    if (this.cache.has(token)) {
      return this.cache.get(token)!;
    }

    // Load from database
    const { data, error } = await supabase
      .from('search_sessions')
      .select('*')
      .eq('session_token', token)
      .single();

    if (error || !data) return null;

    const session = deserializeSession(data);
    this.cache.set(token, session);
    return session;
  }

  /**
   * Save session to database
   */
  private async saveSession(session: SearchSession): Promise<void> {
    this.cache.set(session.token, session);

    const serialized = serializeSession(session);

    await supabase
      .from('search_sessions')
      .upsert(serialized, { onConflict: 'session_token' });
  }

  /**
   * Get paginated results
   */
  async getPaginatedResults(
    sessionToken: string,
    category: SearchCategory,
    page: number,
    pageSize: number = 50
  ): Promise<{ items: UnifiedResult[]; pageInfo: CategoryResults[string]['pageInfo'] }> {
    const session = await this.getSession(sessionToken);
    if (!session) throw new Error('Session not found');

    const categoryResults = session.results[category];
    if (!categoryResults) throw new Error('No results for category');

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = categoryResults.items.slice(start, end);

    return {
      items,
      pageInfo: {
        page,
        pageSize,
        totalPages: Math.ceil(categoryResults.totalCount / pageSize),
        hasMore: end < categoryResults.totalCount,
      },
    };
  }

  /**
   * Clear expired sessions from cache
   */
  clearExpiredCache(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [token, session] of this.cache.entries()) {
      if (now - session.lastActivity.getTime() > maxAge) {
        this.cache.delete(token);
      }
    }
  }
}

export const sessionManager = new SessionManager();
