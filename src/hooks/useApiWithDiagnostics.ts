/**
 * API Hook with Built-in Diagnostics
 *
 * Wraps useQuery/useMutation to add:
 * - Automatic response validation
 * - Error response logging
 * - Consistent error message extraction
 * - Diagnostic context
 *
 * Usage:
 * ```typescript
 * const { data, error, isLoading } = useApiWithDiagnostics(
 *   ['skillName', params],
 *   () => a2aClient.someSkill(params),
 *   'skill_name'
 * );
 * ```
 */

import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { logApiResponse, validateApiResponse, extractErrorMessage, createApiErrorReport } from '../utils/apiDiagnostics';
import { StandardSkillResponse } from '../services/a2aClient';

interface UseApiWithDiagnosticsOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  skillId: string;
  context?: Record<string, any>;
  onError?: (error: Error, errorReport: any) => void;
}

/**
 * useQuery wrapper with automatic diagnostics and error logging
 */
export function useApiWithDiagnostics<T extends StandardSkillResponse>(
  queryKey: (string | any)[],
  queryFn: () => Promise<T>,
  skillId: string,
  options?: Omit<UseApiWithDiagnosticsOptions<T>, 'skillId'>
) {
  return useQuery<T, Error>({
    ...options,
    queryKey,
    queryFn: async () => {
      try {
        const result = await queryFn();

        // Validate response structure
        const validation = validateApiResponse(result);
        if (!validation.valid) {
          logApiResponse(skillId, result, { validation });
        } else {
          logApiResponse(skillId, result, options?.context);
        }

        // Check for backend failure
        if (!result.success) {
          const errorMsg = extractErrorMessage(result, skillId);
          console.error(`[${skillId}] Skill execution failed:`, {
            error: result.error,
            metadata: result.metadata,
          });
          throw new Error(errorMsg);
        }

        return result;
      } catch (error) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        const response = error instanceof Error ? null : error;

        const errorReport = createApiErrorReport(skillId, response, typedError, options?.context);
        console.error(`[${skillId}] Query failed:`, errorReport);

        if (options?.onError) {
          options.onError(typedError, errorReport);
        }

        throw typedError;
      }
    },
  });
}
