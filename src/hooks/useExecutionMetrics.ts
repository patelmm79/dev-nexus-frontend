/**
 * Phase 12: useExecutionMetrics Hook
 * Tracks and reports performance metrics for skill executions
 * Integrates with analytics and monitoring systems
 */

import { useCallback, useRef } from 'react';
import { StandardSkillResponse } from '../services/a2aClient';
import { a2aClient } from '../services/a2aClient';

/**
 * Single execution metric record
 */
export interface ExecutionMetric {
  skillId: string;
  executionTime: number;
  success: boolean;
  timestamp: Date;
  hasError: boolean;
  errorMessage?: string;
}

/**
 * Aggregated metrics for a skill
 */
export interface AggregatedMetrics {
  skillId: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  totalExecutionTime: number;
  lastExecutionTime: Date | null;
  successRate: number;
}

/**
 * Hook for tracking skill execution metrics
 * Records execution times, success rates, and error patterns
 *
 * @example
 * const { recordMetric, getMetrics, clearMetrics } = useExecutionMetrics()
 *
 * // After executing a skill
 * recordMetric(response, 'query_patterns')
 *
 * // Get aggregated metrics for a skill
 * const metrics = getMetrics('query_patterns')
 * console.log(`Success rate: ${metrics.successRate * 100}%`)
 */
export function useExecutionMetrics() {
  const metricsRef = useRef<Map<string, ExecutionMetric[]>>(new Map());

  /**
   * Record a single skill execution
   */
  const recordMetric = useCallback((response: StandardSkillResponse, skillId: string) => {
    const metric: ExecutionMetric = {
      skillId,
      executionTime: a2aClient.getExecutionTime(response),
      success: response.success,
      timestamp: a2aClient.getTimestamp(response),
      hasError: a2aClient.isError(response),
      errorMessage: a2aClient.getErrorMessage(response) || undefined,
    };

    // Add to metrics map
    const skillMetrics = metricsRef.current.get(skillId) || [];
    skillMetrics.push(metric);
    metricsRef.current.set(skillId, skillMetrics);

    // Send to analytics if available
    sendToAnalytics(metric);

    console.log(`[Metrics] ${a2aClient.formatResponseLog(response, skillId)}`);

    return metric;
  }, []);

  /**
   * Get aggregated metrics for a skill
   */
  const getMetrics = useCallback((skillId: string): AggregatedMetrics | null => {
    const metrics = metricsRef.current.get(skillId);

    if (!metrics || metrics.length === 0) {
      return null;
    }

    const executionTimes = metrics.map((m) => m.executionTime);
    const successCount = metrics.filter((m) => m.success).length;

    return {
      skillId,
      executionCount: metrics.length,
      successCount,
      failureCount: metrics.length - successCount,
      averageExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / metrics.length,
      minExecutionTime: Math.min(...executionTimes),
      maxExecutionTime: Math.max(...executionTimes),
      totalExecutionTime: executionTimes.reduce((a, b) => a + b, 0),
      lastExecutionTime: metrics[metrics.length - 1].timestamp,
      successRate: successCount / metrics.length,
    };
  }, []);

  /**
   * Get all tracked metrics
   */
  const getAllMetrics = useCallback((): Record<string, AggregatedMetrics> => {
    const result: Record<string, AggregatedMetrics> = {};

    metricsRef.current.forEach((_, skillId) => {
      const metrics = getMetrics(skillId);
      if (metrics) {
        result[skillId] = metrics;
      }
    });

    return result;
  }, [getMetrics]);

  /**
   * Get raw metrics for a skill
   */
  const getRawMetrics = useCallback((skillId: string): ExecutionMetric[] => {
    return metricsRef.current.get(skillId) || [];
  }, []);

  /**
   * Clear metrics for a skill or all metrics
   */
  const clearMetrics = useCallback((skillId?: string) => {
    if (skillId) {
      metricsRef.current.delete(skillId);
    } else {
      metricsRef.current.clear();
    }
  }, []);

  /**
   * Get slowest executing skills (by average time)
   */
  const getSlowestSkills = useCallback((limit: number = 5): AggregatedMetrics[] => {
    const all = getAllMetrics();
    return Object.values(all)
      .sort((a, b) => b.averageExecutionTime - a.averageExecutionTime)
      .slice(0, limit);
  }, [getAllMetrics]);

  /**
   * Get skills with highest failure rate
   */
  const getFailingSkills = useCallback((threshold: number = 0.1): AggregatedMetrics[] => {
    const all = getAllMetrics();
    return Object.values(all).filter((m) => (1 - m.successRate) > threshold);
  }, [getAllMetrics]);

  /**
   * Export metrics as JSON
   */
  const exportMetrics = useCallback((): Record<string, any> => {
    const all = getAllMetrics();
    return {
      exported: new Date().toISOString(),
      summary: all,
      raw: Object.fromEntries(metricsRef.current),
    };
  }, [getAllMetrics]);

  /**
   * Import metrics from JSON
   */
  const importMetrics = useCallback((data: Record<string, any>) => {
    try {
      if (data.raw && typeof data.raw === 'object') {
        metricsRef.current.clear();
        Object.entries(data.raw).forEach(([skillId, metrics]: [string, any]) => {
          if (Array.isArray(metrics)) {
            metricsRef.current.set(skillId, metrics);
          }
        });
      }
    } catch (err) {
      console.error('Failed to import metrics:', err);
    }
  }, []);

  return {
    recordMetric,
    getMetrics,
    getAllMetrics,
    getRawMetrics,
    clearMetrics,
    getSlowestSkills,
    getFailingSkills,
    exportMetrics,
    importMetrics,
  };
}

/**
 * Send metric to analytics service
 * Supports Google Analytics and custom analytics endpoints
 */
function sendToAnalytics(metric: ExecutionMetric) {
  // Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'skill_execution', {
      skill_id: metric.skillId,
      execution_time: metric.executionTime,
      success: metric.success,
      has_error: metric.hasError,
    });
  }

  // Custom analytics endpoint (if configured)
  const analyticsUrl = (window as any).__ANALYTICS_ENDPOINT;
  if (analyticsUrl) {
    navigator.sendBeacon(analyticsUrl, JSON.stringify(metric));
  }
}
