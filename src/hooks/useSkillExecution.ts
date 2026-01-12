/**
 * Phase 11: useSkillExecution Hook
 * Wraps skill calls with automatic metrics tracking and error handling
 */

import { useState, useCallback } from 'react';
import { StandardSkillResponse } from '../services/a2aClient';
import {
  extractMetrics,
  ExecutionMetrics,
  validateResponse,
} from '../utils/responseValidation';

/**
 * Execution state tracking
 */
export interface SkillExecutionState {
  isRunning: boolean;
  didSucceed: boolean;
  didFail: boolean;
  executionMetrics: ExecutionMetrics | null;
  validationErrors: string[];
  validationWarnings: string[];
  errorMetadata?: Record<string, any>;
  isAsyncQueued: boolean;
}

/**
 * useSkillExecution Hook
 * Manages execution state and metrics for skill API calls
 *
 * @param skillId - The skill ID being executed (for logging/tracking)
 * @returns Object with state and execution function
 *
 * @example
 * const { state, execute } = useSkillExecution('query_patterns');
 * const response = await execute(async () => a2aClient.queryPatterns('repo'));
 * if (state.didSucceed) {
 *   console.log(`Executed in ${state.executionMetrics?.executionTimeMs}ms`);
 * }
 */
export function useSkillExecution(skillId: string) {
  const [state, setState] = useState<SkillExecutionState>({
    isRunning: false,
    didSucceed: false,
    didFail: false,
    executionMetrics: null,
    validationErrors: [],
    validationWarnings: [],
    isAsyncQueued: false,
  });

  const execute = useCallback(
    async <T extends StandardSkillResponse>(
      skillFn: () => Promise<T>
    ): Promise<T | null> => {
      setState((prev) => ({
        ...prev,
        isRunning: true,
        didSucceed: false,
        didFail: false,
        validationErrors: [],
        validationWarnings: [],
      }));

      try {
        const response = await skillFn();

        // Validate response structure
        const validation = validateResponse(response);
        if (!validation.valid) {
          setState((prev) => ({
            ...prev,
            isRunning: false,
            didFail: true,
            validationErrors: validation.errors,
            validationWarnings: validation.warnings,
            errorMetadata: { skillId, responseReceived: true },
          }));
          console.error(`Skill ${skillId} returned invalid response:`, {
            errors: validation.errors,
            warnings: validation.warnings,
            response,
          });
          return null;
        }

        // Extract metrics from response
        const metrics = extractMetrics(response);

        // Check for async queued response
        const isAsync = (response as any).state === 'async_queued';

        setState((prev) => ({
          ...prev,
          isRunning: false,
          didSucceed: response.success,
          didFail: !response.success,
          executionMetrics: metrics,
          validationWarnings: validation.warnings,
          isAsyncQueued: isAsync,
        }));

        if (response.success) {
          console.log(`✅ Skill ${skillId} succeeded in ${metrics.executionTimeMs}ms`, {
            timestamp: metrics.timestamp,
            skillId,
          });
        } else {
          console.error(`❌ Skill ${skillId} failed:`, {
            error: metrics.error,
            timestamp: metrics.timestamp,
            skillId,
          });
        }

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error during skill execution';

        setState((prev) => ({
          ...prev,
          isRunning: false,
          didFail: true,
          validationErrors: [errorMessage],
          errorMetadata: {
            skillId,
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            errorMessage,
          },
        }));

        console.error(`❌ Skill ${skillId} threw error:`, {
          error,
          skillId,
        });

        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      didSucceed: false,
      didFail: false,
      executionMetrics: null,
      validationErrors: [],
      validationWarnings: [],
      isAsyncQueued: false,
    });
  }, []);

  return { state, execute, reset };
}

/**
 * useSkillMetrics Hook
 * Tracks metrics for multiple skill executions
 */
export interface SkillMetricsTracker {
  skillId: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  totalExecutionMs: number;
  minExecutionMs: number;
  maxExecutionMs: number;
  avgExecutionMs: number;
  lastExecutionTime: string | null;
}

export function useSkillMetrics(skillId: string) {
  const [metrics, setMetrics] = useState<SkillMetricsTracker>({
    skillId,
    executionCount: 0,
    successCount: 0,
    failureCount: 0,
    totalExecutionMs: 0,
    minExecutionMs: Infinity,
    maxExecutionMs: 0,
    avgExecutionMs: 0,
    lastExecutionTime: null,
  });

  const recordExecution = useCallback((executionMetrics: ExecutionMetrics) => {
    setMetrics((prev) => {
      const executionMs = executionMetrics.executionTimeMs;
      const newCount = prev.executionCount + 1;
      const newSuccess = prev.successCount + (executionMetrics.success ? 1 : 0);
      const newFailure = prev.failureCount + (executionMetrics.success ? 0 : 1);
      const newTotal = prev.totalExecutionMs + executionMs;

      return {
        skillId,
        executionCount: newCount,
        successCount: newSuccess,
        failureCount: newFailure,
        totalExecutionMs: newTotal,
        minExecutionMs: Math.min(prev.minExecutionMs, executionMs),
        maxExecutionMs: Math.max(prev.maxExecutionMs, executionMs),
        avgExecutionMs: newTotal / newCount,
        lastExecutionTime: executionMetrics.timestamp,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setMetrics({
      skillId,
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      totalExecutionMs: 0,
      minExecutionMs: Infinity,
      maxExecutionMs: 0,
      avgExecutionMs: 0,
      lastExecutionTime: null,
    });
  }, []);

  return { metrics, recordExecution, reset };
}

/**
 * Hook that combines useSkillExecution and useSkillMetrics
 */
export function useSkillWithMetrics(skillId: string) {
  const execution = useSkillExecution(skillId);
  const metricsTracker = useSkillMetrics(skillId);

  const execute = useCallback(
    async <T extends StandardSkillResponse>(skillFn: () => Promise<T>) => {
      const result = await execution.execute(skillFn);
      if (execution.state.executionMetrics) {
        metricsTracker.recordExecution(execution.state.executionMetrics);
      }
      return result;
    },
    [execution, metricsTracker]
  );

  return {
    ...execution,
    execute,
    metrics: metricsTracker.metrics,
    resetMetrics: metricsTracker.reset,
  };
}
