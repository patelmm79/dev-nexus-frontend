/**
 * Phase 12: useSkillExecution Hook
 * Simplified skill execution state management without React Query
 * Used for direct skill API calls with automatic response validation
 */

import { useState, useCallback } from 'react';
import { StandardSkillResponse } from '../services/a2aClient';
import { a2aClient } from '../services/a2aClient';

/**
 * Execution state for a skill call
 */
export interface SkillExecutionState {
  loading: boolean;
  error: string | null;
  data: StandardSkillResponse | null;
  executionTime: number | null;
  timestamp: Date | null;
}

/**
 * Hook for executing A2A skills with automatic state management
 * Validates responses and extracts execution metrics
 *
 * @example
 * const { loading, error, data, executionTime, execute } = useSkillExecution()
 *
 * const handleExecute = async () => {
 *   await execute('query_patterns', { keywords: ['singleton'] })
 * }
 *
 * if (data?.success) {
 *   console.log(`Executed in ${executionTime}ms`)
 * }
 */
export function useSkillExecution() {
  const [state, setState] = useState<SkillExecutionState>({
    loading: false,
    error: null,
    data: null,
    executionTime: null,
    timestamp: null,
  });

  const execute = useCallback(
    async (skillId: string, input: Record<string, any> = {}) => {
      // Reset state before execution
      setState({ loading: true, error: null, data: null, executionTime: null, timestamp: null });

      try {
        const result = await a2aClient.executeSkill(skillId, input);

        // Validate response structure
        if (!a2aClient.isValidResponse(result)) {
          setState({
            loading: false,
            error: 'Invalid response structure from server',
            data: null,
            executionTime: null,
            timestamp: null,
          });
          return;
        }

        // Extract metrics
        const executionTime = a2aClient.getExecutionTime(result);
        const timestamp = a2aClient.getTimestamp(result);
        const errorMsg = a2aClient.getErrorMessage(result);

        // Update state
        setState({
          loading: false,
          error: errorMsg || null,
          data: result,
          executionTime,
          timestamp,
        });

        // Log execution
        console.log(a2aClient.formatResponseLog(result, skillId));

        return result as StandardSkillResponse;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        setState({
          loading: false,
          error: errorMessage,
          data: null,
          executionTime: null,
          timestamp: null,
        });

        console.error(`❌ ${skillId}: ${errorMessage}`);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null, executionTime: null, timestamp: null });
  }, []);

  const isSuccess = state.data?.success ?? false;

  return {
    ...state,
    execute,
    reset,
    // Convenience properties
    isSuccess,
    isErrorState: !isSuccess,
  };
}
