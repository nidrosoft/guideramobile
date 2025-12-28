/**
 * App Health Check Service
 * 
 * Monitors the health of critical app services:
 * - API connectivity
 * - Authentication status
 * - Database connection (Supabase)
 * 
 * Used on app launch and periodically to ensure services are available.
 */

import { logger } from '@/services/logging';

export interface HealthStatus {
  isHealthy: boolean;
  api: ServiceStatus;
  auth: ServiceStatus;
  database: ServiceStatus;
  lastChecked: Date;
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency?: number;
  error?: string;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.guidera.app';
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

class HealthCheckService {
  private static instance: HealthCheckService;
  private lastStatus: HealthStatus | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Run a full health check on all services
   */
  async checkHealth(): Promise<HealthStatus> {
    logger.debug('Running health check...');

    const [api, auth, database] = await Promise.all([
      this.checkApiHealth(),
      this.checkAuthHealth(),
      this.checkDatabaseHealth(),
    ]);

    const status: HealthStatus = {
      isHealthy: api.status === 'healthy' && database.status !== 'down',
      api,
      auth,
      database,
      lastChecked: new Date(),
    };

    this.lastStatus = status;

    if (!status.isHealthy) {
      logger.warn('Health check failed', status);
    } else {
      logger.debug('Health check passed', status);
    }

    return status;
  }

  /**
   * Check API server health
   */
  private async checkApiHealth(): Promise<ServiceStatus> {
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

      // Try to reach a health endpoint or the base API
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        return { status: 'healthy', latency };
      } else if (response.status >= 500) {
        return { status: 'down', latency, error: `Server error: ${response.status}` };
      } else {
        return { status: 'degraded', latency, error: `HTTP ${response.status}` };
      }
    } catch (error: any) {
      const latency = Math.round(performance.now() - startTime);

      if (error.name === 'AbortError') {
        return { status: 'down', latency, error: 'Request timeout' };
      }

      return { status: 'down', latency, error: error.message };
    }
  }

  /**
   * Check authentication service health
   */
  private async checkAuthHealth(): Promise<ServiceStatus> {
    // TODO: Implement actual auth health check with Supabase
    // For now, return unknown since we need to check if user is logged in
    return { status: 'unknown' };
  }

  /**
   * Check database (Supabase) health
   */
  private async checkDatabaseHealth(): Promise<ServiceStatus> {
    const startTime = performance.now();

    try {
      // TODO: Replace with actual Supabase health check
      // const { error } = await supabase.from('health_check').select('count').single();
      
      const latency = Math.round(performance.now() - startTime);
      
      // For now, return healthy as placeholder
      return { status: 'healthy', latency };
    } catch (error: any) {
      const latency = Math.round(performance.now() - startTime);
      return { status: 'down', latency, error: error.message };
    }
  }

  /**
   * Get the last health status without running a new check
   */
  getLastStatus(): HealthStatus | null {
    return this.lastStatus;
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      this.stopPeriodicChecks();
    }

    // Run initial check
    this.checkHealth();

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, intervalMs);

    logger.info('Started periodic health checks', { intervalMs });
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Stopped periodic health checks');
    }
  }

  /**
   * Check if a specific service is available
   */
  isServiceAvailable(service: 'api' | 'auth' | 'database'): boolean {
    if (!this.lastStatus) return true; // Assume available if not checked yet

    const status = this.lastStatus[service];
    return status.status === 'healthy' || status.status === 'degraded';
  }
}

// Export singleton instance
export const healthCheck = HealthCheckService.getInstance();

// Export convenience functions
export const checkHealth = () => healthCheck.checkHealth();
export const getHealthStatus = () => healthCheck.getLastStatus();
export const isApiAvailable = () => healthCheck.isServiceAvailable('api');
export const startHealthChecks = (interval?: number) => healthCheck.startPeriodicChecks(interval);
export const stopHealthChecks = () => healthCheck.stopPeriodicChecks();

export default healthCheck;
