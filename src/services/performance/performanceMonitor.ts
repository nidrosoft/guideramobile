/**
 * Performance Monitoring Service
 * 
 * Tracks and reports performance metrics:
 * - Screen load times
 * - API response times
 * - JS thread performance
 * - Memory usage
 * - Component render times
 */

import { InteractionManager } from 'react-native';
import { logger } from '@/services/logging';

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  screenLoad: {
    good: 500,
    acceptable: 1000,
    slow: 2000,
  },
  apiResponse: {
    good: 200,
    acceptable: 500,
    slow: 1000,
  },
  render: {
    good: 16, // 60fps
    acceptable: 33, // 30fps
    slow: 100,
  },
};

interface PerformanceMetric {
  name: string;
  type: 'screen_load' | 'api_call' | 'render' | 'interaction' | 'custom';
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
  rating: 'good' | 'acceptable' | 'slow' | 'critical';
}

interface ScreenMetrics {
  screenName: string;
  loadTime: number;
  timeToInteractive: number;
  renderCount: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private screenTimers: Map<string, number> = new Map();
  private apiTimers: Map<string, number> = new Map();
  private renderCounts: Map<string, number> = new Map();
  private isEnabled: boolean = true;
  private maxMetrics: number = 100;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // ==================== Screen Performance ====================

  /**
   * Start tracking screen load time
   */
  startScreenLoad(screenName: string): void {
    if (!this.isEnabled) return;
    this.screenTimers.set(screenName, performance.now());
  }

  /**
   * End screen load tracking and record metric
   */
  endScreenLoad(screenName: string): number {
    if (!this.isEnabled) return 0;

    const startTime = this.screenTimers.get(screenName);
    if (!startTime) {
      logger.warn(`No start time found for screen: ${screenName}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.screenTimers.delete(screenName);

    const rating = this.getRating(duration, THRESHOLDS.screenLoad);
    
    this.recordMetric({
      name: screenName,
      type: 'screen_load',
      duration,
      timestamp: new Date(),
      rating,
    });

    if (rating === 'slow' || rating === 'critical') {
      logger.warn(`Slow screen load: ${screenName}`, { duration: `${duration.toFixed(0)}ms`, rating });
    } else {
      logger.debug(`Screen loaded: ${screenName}`, { duration: `${duration.toFixed(0)}ms`, rating });
    }

    return duration;
  }

  /**
   * Track time to interactive (after animations complete)
   */
  trackTimeToInteractive(screenName: string): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      InteractionManager.runAfterInteractions(() => {
        const duration = performance.now() - startTime;
        
        this.recordMetric({
          name: `${screenName}_tti`,
          type: 'interaction',
          duration,
          timestamp: new Date(),
          rating: this.getRating(duration, THRESHOLDS.screenLoad),
        });

        resolve(duration);
      });
    });
  }

  // ==================== API Performance ====================

  /**
   * Start tracking API call
   */
  startApiCall(endpoint: string): string {
    if (!this.isEnabled) return endpoint;
    
    const id = `${endpoint}_${Date.now()}`;
    this.apiTimers.set(id, performance.now());
    return id;
  }

  /**
   * End API call tracking
   */
  endApiCall(id: string, status?: number): number {
    if (!this.isEnabled) return 0;

    const startTime = this.apiTimers.get(id);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.apiTimers.delete(id);

    const rating = this.getRating(duration, THRESHOLDS.apiResponse);
    const endpoint = id.split('_')[0];

    this.recordMetric({
      name: endpoint,
      type: 'api_call',
      duration,
      timestamp: new Date(),
      metadata: { status },
      rating,
    });

    if (rating === 'slow' || rating === 'critical') {
      logger.warn(`Slow API call: ${endpoint}`, { duration: `${duration.toFixed(0)}ms`, status });
    }

    return duration;
  }

  // ==================== Render Performance ====================

  /**
   * Track component render
   */
  trackRender(componentName: string): void {
    if (!this.isEnabled) return;

    const count = (this.renderCounts.get(componentName) || 0) + 1;
    this.renderCounts.set(componentName, count);

    // Warn if component is re-rendering too often
    if (count > 10) {
      logger.warn(`Excessive re-renders: ${componentName}`, { count });
    }
  }

  /**
   * Reset render count for a component
   */
  resetRenderCount(componentName: string): void {
    this.renderCounts.delete(componentName);
  }

  /**
   * Get render count for a component
   */
  getRenderCount(componentName: string): number {
    return this.renderCounts.get(componentName) || 0;
  }

  // ==================== Custom Metrics ====================

  /**
   * Track a custom performance metric
   */
  trackCustom(name: string, duration: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.recordMetric({
      name,
      type: 'custom',
      duration,
      timestamp: new Date(),
      metadata,
      rating: 'good', // Custom metrics don't have predefined thresholds
    });
  }

  /**
   * Measure async function execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    type: PerformanceMetric['type'] = 'custom'
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      const thresholds = type === 'api_call' ? THRESHOLDS.apiResponse : THRESHOLDS.screenLoad;
      
      this.recordMetric({
        name,
        type,
        duration,
        timestamp: new Date(),
        rating: this.getRating(duration, thresholds),
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name,
        type,
        duration,
        timestamp: new Date(),
        metadata: { error: true },
        rating: 'critical',
      });

      throw error;
    }
  }

  // ==================== Reporting ====================

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter((m) => m.type === type);
  }

  /**
   * Get average duration for a metric name
   */
  getAverageDuration(name: string): number {
    const matching = this.metrics.filter((m) => m.name === name);
    if (matching.length === 0) return 0;
    
    const total = matching.reduce((sum, m) => sum + m.duration, 0);
    return total / matching.length;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    byType: Record<string, number>;
    byRating: Record<string, number>;
    slowestScreens: { name: string; duration: number }[];
    slowestApis: { name: string; duration: number }[];
  } {
    const byType: Record<string, number> = {};
    const byRating: Record<string, number> = {};

    this.metrics.forEach((m) => {
      byType[m.type] = (byType[m.type] || 0) + 1;
      byRating[m.rating] = (byRating[m.rating] || 0) + 1;
    });

    const screenMetrics = this.metrics
      .filter((m) => m.type === 'screen_load')
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map((m) => ({ name: m.name, duration: m.duration }));

    const apiMetrics = this.metrics
      .filter((m) => m.type === 'api_call')
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map((m) => ({ name: m.name, duration: m.duration }));

    return {
      totalMetrics: this.metrics.length,
      byType,
      byRating,
      slowestScreens: screenMetrics,
      slowestApis: apiMetrics,
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.renderCounts.clear();
  }

  // ==================== Private Methods ====================

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the last N metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  private getRating(
    duration: number,
    thresholds: { good: number; acceptable: number; slow: number }
  ): PerformanceMetric['rating'] {
    if (duration <= thresholds.good) return 'good';
    if (duration <= thresholds.acceptable) return 'acceptable';
    if (duration <= thresholds.slow) return 'slow';
    return 'critical';
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export convenience functions
export const startScreenLoad = (name: string) => performanceMonitor.startScreenLoad(name);
export const endScreenLoad = (name: string) => performanceMonitor.endScreenLoad(name);
export const startApiCall = (endpoint: string) => performanceMonitor.startApiCall(endpoint);
export const endApiCall = (id: string, status?: number) => performanceMonitor.endApiCall(id, status);
export const trackRender = (name: string) => performanceMonitor.trackRender(name);
export const measureAsync = <T>(name: string, fn: () => Promise<T>) => performanceMonitor.measure(name, fn);
export const getPerformanceSummary = () => performanceMonitor.getSummary();

export default performanceMonitor;
