/**
 * UNIFIED DATA MODEL - PROVIDER TYPES
 * 
 * Provider-related types for the Provider Manager System.
 */

// ============================================
// PROVIDER CONFIGURATION
// ============================================

export interface Provider {
  id: string;
  providerCode: string;
  providerName: string;
  providerType: 'gds' | 'ota' | 'direct' | 'aggregator' | 'wholesaler';
  
  // Capabilities
  supportsFlights: boolean;
  supportsHotels: boolean;
  supportsCars: boolean;
  supportsExperiences: boolean;
  supportsPackages: boolean;
  supportsTransfers: boolean;
  
  // Booking capabilities
  supportsBooking: boolean;
  supportsHold: boolean;
  holdDurationMinutes?: number;
  supportsCancel: boolean;
  supportsModify: boolean;
  
  // Coverage
  coverageRegions: string[];
  strongRegions: string[];
  weakRegions: string[];
  coverageCountries: string[];
  
  // Pricing model
  pricingModel?: string;
  commissionPercent?: number;
  markupPercent?: number;
  
  // API details
  apiVersion?: string;
  baseUrl?: string;
  authType: 'oauth2' | 'api_key' | 'basic';
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
  avgResponseTimeMs?: number;
  
  // Cost
  costPerSearch?: number;
  costPerBooking?: number;
  monthlyMinimum?: number;
  
  // Status
  status: 'active' | 'degraded' | 'disabled' | 'testing';
  healthScore: number;
  lastHealthCheck?: string;
  lastSuccessfulCall?: string;
  lastFailedCall?: string;
  consecutiveFailures: number;
  
  // Settings
  priority: number;
  isPrimary: boolean;
  isFallback: boolean;
  enabled: boolean;
  
  // Metadata
  notes?: string;
  documentationUrl?: string;
  supportEmail?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Joined data
  capabilities?: ProviderCapability[];
}

// ============================================
// PROVIDER CAPABILITY
// ============================================

export interface ProviderCapability {
  id: string;
  providerId: string;
  category: 'flights' | 'hotels' | 'cars' | 'experiences' | 'packages';
  
  // Strength indicators
  isPrimary: boolean;
  isStrong: boolean;
  isSupported: boolean;
  
  // Search capabilities
  canSearch: boolean;
  canSearchOneway: boolean;
  canSearchRoundtrip: boolean;
  canSearchMulticity: boolean;
  canSearchFlexibleDates: boolean;
  maxTravelers?: number;
  maxRooms?: number;
  maxSegments?: number;
  advanceBookingDays?: number;
  sameDayBooking: boolean;
  
  // Filter capabilities
  supportsCabinFilter: boolean;
  supportsAirlineFilter: boolean;
  supportsStopsFilter: boolean;
  supportsTimeFilter: boolean;
  supportsPriceFilter: boolean;
  supportsAmenityFilter: boolean;
  supportsRatingFilter: boolean;
  
  // Sort capabilities
  supportsSortPrice: boolean;
  supportsSortDuration: boolean;
  supportsSortDeparture: boolean;
  supportsSortRating: boolean;
  
  // Booking capabilities
  instantConfirmation: boolean;
  requiresPassengerDetails: boolean;
  requiresPaymentUpfront: boolean;
  supportsHoldBooking: boolean;
  holdDurationMinutes?: number;
  
  // Pricing
  pricesIncludeTaxes: boolean;
  pricesIncludeFees: boolean;
  supportsPriceBreakdown: boolean;
  supportsFareRules: boolean;
  
  // Content
  providesImages: boolean;
  providesDescriptions: boolean;
  providesRatings: boolean;
  providesReviews: boolean;
  providesAmenities: boolean;
  
  // Special features
  supportsLoyaltyPrograms: boolean;
  supportsCorporateRates: boolean;
  supportsGroupBooking: boolean;
  hasPremiumInventory: boolean;
}

// ============================================
// PROVIDER SCORE
// ============================================

export interface ProviderScore {
  providerId: string;
  providerCode: string;
  totalScore: number;
  breakdown: {
    geographic: number;
    category: number;
    preference: number;
    performance: number;
    cost: number;
    ruleBoost?: number;
  };
  eligible: boolean;
  reason?: string;
}

// ============================================
// ROUTING RULE
// ============================================

export interface RoutingRule {
  id: string;
  ruleName: string;
  ruleType: 'category' | 'region' | 'user' | 'time' | 'custom';
  priority: number;
  enabled: boolean;
  conditions: RoutingConditions;
  providerCode?: string;
  providerPriorityBoost?: number;
  providerPriorityPenalty?: number;
  executionStrategy?: string;
  maxProviders?: number;
  timeoutMs?: number;
  description?: string;
}

export interface RoutingConditions {
  category?: string;
  region?: string;
  routeType?: string;
  userBudget?: string;
  timeOfDay?: string;
  [key: string]: string | undefined;
}

// ============================================
// EXECUTION STRATEGY
// ============================================

export enum ExecutionStrategy {
  SINGLE_FASTEST = 'single_fastest',
  SINGLE_CHEAPEST = 'single_cheapest',
  PARALLEL_TOP_3 = 'parallel_top_3',
  PARALLEL_ALL = 'parallel_all',
  SEQUENTIAL_FALLBACK = 'sequential',
  WATERFALL = 'waterfall'
}

export interface ExecutionConfig {
  strategy: ExecutionStrategy;
  maxProviders: number;
  timeoutMs: number;
  waitForAll: boolean;
  minResultsRequired: number;
  deduplication: boolean;
}

// ============================================
// CIRCUIT BREAKER
// ============================================

export interface CircuitBreakerState {
  providerId: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  successCount: number;
  lastFailure: string | null;
  lastSuccess: string | null;
  nextRetryAt: string | null;
}

// ============================================
// HEALTH CHECK
// ============================================

export interface HealthCheckResult {
  healthy: boolean;
  responseTime?: number;
  error?: string;
  statusCode?: number;
}

export interface ProviderHealthCheck {
  id: string;
  providerId: string;
  checkType: 'ping' | 'search' | 'availability';
  checkTimestamp: string;
  success: boolean;
  responseTimeMs?: number;
  statusCode?: number;
  errorMessage?: string;
  endpointChecked?: string;
}

// ============================================
// RATE LIMIT
// ============================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  waitMs?: number;
}

// ============================================
// BUDGET
// ============================================

export interface BudgetStatus {
  allowed: boolean;
  dailyRemaining: number;
  monthlyRemaining: number;
  alertTriggered: boolean;
}

// ============================================
// FALLBACK CHAIN
// ============================================

export interface FallbackChain {
  category: string;
  region?: string;
  chain: string[];
  stopOnSuccess: boolean;
  maxAttempts: number;
}

// ============================================
// PROVIDER LOG
// ============================================

export interface ProviderLogEntry {
  requestId: string;
  sessionId?: string;
  userId?: string;
  providerId: string;
  providerCode: string;
  endpoint: string;
  method: string;
  requestType: string;
  category: string;
  startedAt: string;
  completedAt?: string;
  responseTimeMs?: number;
  success?: boolean;
  statusCode?: number;
  errorCode?: string;
  errorMessage?: string;
  cost?: number;
  requestSummary?: Record<string, unknown>;
  responseSummary?: Record<string, unknown>;
  resultCount?: number;
  routingScore?: number;
  wasFallback?: boolean;
  fallbackFrom?: string;
}

// ============================================
// SELECTED PROVIDER
// ============================================

export interface SelectedProvider {
  providerId: string;
  providerCode: string;
  score: number;
  isPrimary: boolean;
}

// ============================================
// EXECUTION RESULT
// ============================================

export interface ProviderExecutionResult {
  providerId: string;
  providerCode: string;
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  responseTimeMs: number;
  resultCount?: number;
}
