/**
 * Performance Tracking Utilities for Phase 11
 * Tracks and analyzes skill execution performance
 */

import { StandardSkillResponse } from '../services/a2aClient';
import { calculatePerformanceStats, PerformanceStats } from './responseValidation';

/**
 * Performance metrics for a single skill
 */
export interface SkillPerformanceMetrics {
  skillId: string;
  executionTimes: number[];
  successCount: number;
  failureCount: number;
  lastUpdated: Date;
  stats?: PerformanceStats;
}

/**
 * Performance tracker for multiple skills
 */
export class PerformanceTracker {
  private metrics: Map<string, SkillPerformanceMetrics> = new Map();
  private maxHistorySize: number = 1000; // Keep last 1000 executions per skill

  /**
   * Record a skill execution
   */
  recordExecution(
    skillId: string,
    executionTimeMs: number,
    success: boolean
  ): SkillPerformanceMetrics {
    const existing = this.metrics.get(skillId) || {
      skillId,
      executionTimes: [],
      successCount: 0,
      failureCount: 0,
      lastUpdated: new Date(),
    };

    // Add execution time
    existing.executionTimes.push(executionTimeMs);

    // Keep history size bounded
    if (existing.executionTimes.length > this.maxHistorySize) {
      existing.executionTimes = existing.executionTimes.slice(
        existing.executionTimes.length - this.maxHistorySize
      );
    }

    // Update counters
    if (success) {
      existing.successCount++;
    } else {
      existing.failureCount++;
    }

    existing.lastUpdated = new Date();

    // Calculate stats
    existing.stats = calculatePerformanceStats(existing.executionTimes);

    this.metrics.set(skillId, existing);
    return existing;
  }

  /**
   * Record skill response
   */
  recordResponse(skillId: string, response: StandardSkillResponse): void {
    this.recordExecution(skillId, response.execution_time_ms, response.success);
  }

  /**
   * Get metrics for a single skill
   */
  getMetrics(skillId: string): SkillPerformanceMetrics | undefined {
    return this.metrics.get(skillId);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): SkillPerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get sorted metrics by average execution time (slowest first)
   */
  getSlowestSkills(): SkillPerformanceMetrics[] {
    return this.getAllMetrics().sort((a, b) => (b.stats?.avgMs || 0) - (a.stats?.avgMs || 0));
  }

  /**
   * Get skills with highest failure rate
   */
  getFailureRates(): Array<{ skillId: string; failureRate: number }> {
    return this.getAllMetrics()
      .map((m) => ({
        skillId: m.skillId,
        failureRate: m.failureCount / (m.successCount + m.failureCount),
      }))
      .sort((a, b) => b.failureRate - a.failureRate);
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalSkills: number;
    totalExecutions: number;
    totalSuccesses: number;
    totalFailures: number;
    overallAvgMs: number;
    overallP95Ms: number;
    slowestSkill?: { skillId: string; avgMs: number };
    failureProneSkill?: { skillId: string; failureRate: number };
  } {
    const metrics = this.getAllMetrics();
    const allTimes = metrics.flatMap((m) => m.executionTimes);

    const totalSuccesses = metrics.reduce((sum, m) => sum + m.successCount, 0);
    const totalFailures = metrics.reduce((sum, m) => sum + m.failureCount, 0);

    const overallStats = calculatePerformanceStats(allTimes);
    const slowestSkill = this.getSlowestSkills()[0];
    const failureRates = this.getFailureRates();

    return {
      totalSkills: metrics.length,
      totalExecutions: allTimes.length,
      totalSuccesses,
      totalFailures,
      overallAvgMs: overallStats.avgMs,
      overallP95Ms: overallStats.p95Ms,
      slowestSkill: slowestSkill ? { skillId: slowestSkill.skillId, avgMs: slowestSkill.stats?.avgMs || 0 } : undefined,
      failureProneSkill: failureRates[0] ? { skillId: failureRates[0].skillId, failureRate: failureRates[0].failureRate } : undefined,
    };
  }

  /**
   * Reset metrics for a skill
   */
  reset(skillId?: string): void {
    if (skillId) {
      this.metrics.delete(skillId);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Export metrics as JSON
   */
  export(): Record<string, SkillPerformanceMetrics> {
    const result: Record<string, SkillPerformanceMetrics> = {};
    for (const [skillId, metrics] of this.metrics) {
      result[skillId] = { ...metrics };
    }
    return result;
  }

  /**
   * Import metrics from JSON
   */
  import(data: Record<string, SkillPerformanceMetrics>): void {
    this.metrics.clear();
    for (const [skillId, metrics] of Object.entries(data)) {
      this.metrics.set(skillId, {
        ...metrics,
        lastUpdated: new Date(metrics.lastUpdated),
        stats: calculatePerformanceStats(metrics.executionTimes),
      });
    }
  }
}

/**
 * Global singleton instance
 */
let globalTracker: PerformanceTracker | null = null;

/**
 * Get or create global performance tracker
 */
export function getGlobalPerformanceTracker(): PerformanceTracker {
  if (!globalTracker) {
    globalTracker = new PerformanceTracker();
  }
  return globalTracker;
}

/**
 * Reset global tracker
 */
export function resetGlobalPerformanceTracker(): void {
  globalTracker = null;
}

/**
 * Performance alert threshold configuration
 */
export interface PerformanceAlertConfig {
  slowThresholdMs?: number; // Alert if execution > this (default 5000ms)
  p95ThresholdMs?: number; // Alert if p95 > this (default 10000ms)
  failureRateThreshold?: number; // Alert if failure rate > this (default 0.1 = 10%)
}

/**
 * Check performance metrics against thresholds
 */
export function checkPerformanceAlerts(
  tracker: PerformanceTracker,
  config: PerformanceAlertConfig = {}
): Array<{
  type: 'slow' | 'p95' | 'failure_rate';
  skillId?: string;
  message: string;
  value: number;
  threshold: number;
}> {
  const {
    slowThresholdMs = 5000,
    p95ThresholdMs = 10000,
    failureRateThreshold = 0.1,
  } = config;

  const alerts = [];

  // Check for slow executions
  const slowestSkills = tracker.getSlowestSkills();
  for (const skill of slowestSkills) {
    if (skill.stats && skill.stats.avgMs > slowThresholdMs) {
      alerts.push({
        type: 'slow' as const,
        skillId: skill.skillId,
        message: `Skill "${skill.skillId}" is running slowly (${skill.stats.avgMs.toFixed(0)}ms avg)`,
        value: skill.stats.avgMs,
        threshold: slowThresholdMs,
      });
    }

    if (skill.stats && skill.stats.p95Ms > p95ThresholdMs) {
      alerts.push({
        type: 'p95' as const,
        skillId: skill.skillId,
        message: `Skill "${skill.skillId}" 95th percentile is high (${skill.stats.p95Ms.toFixed(0)}ms)`,
        value: skill.stats.p95Ms,
        threshold: p95ThresholdMs,
      });
    }
  }

  // Check for high failure rates
  const failureRates = tracker.getFailureRates();
  for (const { skillId, failureRate } of failureRates) {
    if (failureRate > failureRateThreshold) {
      alerts.push({
        type: 'failure_rate' as const,
        skillId,
        message: `Skill "${skillId}" has high failure rate (${(failureRate * 100).toFixed(1)}%)`,
        value: failureRate,
        threshold: failureRateThreshold,
      });
    }
  }

  return alerts;
}
