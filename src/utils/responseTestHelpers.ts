/**
 * Response Testing Helpers for Phase 11
 * Utilities for creating mock responses and testing response validation
 */

import {
  StandardSkillResponse,
  AsyncWorkflowResponse,
  WorkflowStatusMetadata,
} from '../services/a2aClient';


/**
 * Create a failed response
 */
export function createErrorResponse(
  error: string = 'Operation failed',
  executionTimeMs: number = Math.random() * 1000,
  metadata?: Record<string, any>
): StandardSkillResponse {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    execution_time_ms: executionTimeMs,
    ...(metadata && { metadata }),
  };
}

/**
 * Create an async queued response
 */
export function createAsyncQueuedResponse(
  workflowId: string = `workflow_${Math.random().toString(36).substr(2, 9)}`,
  pollingIntervalMs: number = 5000,
  skillData: Record<string, any> = {}
): AsyncWorkflowResponse {
  return {
    success: true,
    state: 'async_queued',
    workflow_id: workflowId,
    polling_interval_ms: pollingIntervalMs,
    timestamp: new Date().toISOString(),
    execution_time_ms: 100,
    ...skillData,
  };
}

/**
 * Create a workflow status response
 */
export function createWorkflowStatusResponse(
  state: 'queued' | 'running' | 'completed' | 'failed' = 'running',
  progressPercent: number = 50,
  success: boolean = state !== 'failed',
  executionTimeMs: number = Math.random() * 5000
): StandardSkillResponse {
  const metadata: WorkflowStatusMetadata = {
    state,
    progress_percent: progressPercent,
    current_step: state === 'running' ? 'processing' : undefined,
    estimated_remaining_ms: state === 'running' ? 5000 : undefined,
  };

  return {
    success,
    timestamp: new Date().toISOString(),
    execution_time_ms: executionTimeMs,
    metadata: metadata as any,
    ...(state === 'failed' && { error: 'Workflow execution failed' }),
  };
}

/**
 * Create a response with specific timestamp (for testing time-based logic)
 */
export function createResponseWithTimestamp(
  baseResponse: StandardSkillResponse,
  timestamp: Date | string
): StandardSkillResponse {
  return {
    ...baseResponse,
    timestamp: typeof timestamp === 'string' ? timestamp : timestamp.toISOString(),
  };
}

/**
 * Create invalid responses for validation testing
 */

/**
 * Response missing success field
 */
export function createInvalidResponseNoSuccess(): any {
  return {
    timestamp: new Date().toISOString(),
    execution_time_ms: 100,
  };
}

/**
 * Response missing timestamp
 */
export function createInvalidResponseNoTimestamp(): any {
  return {
    success: true,
    execution_time_ms: 100,
  };
}

/**
 * Response missing execution_time_ms
 */
export function createInvalidResponseNoExecutionTime(): any {
  return {
    success: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Response with negative execution time
 */
export function createInvalidResponseNegativeTime(): StandardSkillResponse {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    execution_time_ms: -100,
  };
}

/**
 * Response with invalid timestamp format
 */
export function createInvalidResponseBadTimestamp(): any {
  return {
    success: true,
    timestamp: 'not-a-timestamp',
    execution_time_ms: 100,
  };
}

/**
 * Response with non-boolean success
 */
export function createInvalidResponseBadSuccess(): any {
  return {
    success: 'yes',
    timestamp: new Date().toISOString(),
    execution_time_ms: 100,
  };
}

/**
 * Test data generators for different skill types
 */

/**
 * Create pattern query response
 */
export function createPatternQueryResponse(
  patterns: any[] = [],
  repository: string = 'test-repo'
): StandardSkillResponse {
  return createSuccessResponse({
    repository,
    patterns: {
      patterns,
      decisions: [],
      reusable_components: [],
      dependencies: [],
      problem_domain: 'test',
      keywords: [],
      analyzed_at: new Date().toISOString(),
      commit_sha: '1234567890abcdef',
    },
    similar_repositories: [],
  });
}

/**
 * Create repository list response
 */
export function createRepositoryListResponse(
  repositories: string[] = ['repo1', 'repo2']
): StandardSkillResponse {
  return createSuccessResponse({
    repositories: repositories.map((name) => ({
      name,
      latest_patterns: {
        patterns: [],
        decisions: [],
        reusable_components: [],
        dependencies: [],
        problem_domain: 'test',
        keywords: [],
        analyzed_at: new Date().toISOString(),
        commit_sha: '1234567890abcdef',
      },
      history_count: 1,
      last_updated: new Date().toISOString(),
    })),
    total_repositories: repositories.length,
  });
}

/**
 * Create analytics response
 */
export function createAnalyticsResponse(
  data: Record<string, any> = {}
): StandardSkillResponse {
  return createSuccessResponse({
    overall_health: {
      score: 85,
      trend: 'improving',
    },
    ...data,
  });
}

/**
 * Generate multiple responses with varying execution times
 */
export function generateResponseSeries(
  count: number = 10,
  executionTimeFn: (index: number) => number = () => Math.random() * 1000
): StandardSkillResponse[] {
  return Array.from({ length: count }, (_, i) =>
    createSuccessResponse({}, executionTimeFn(i))
  );
}

/**
 * Generate response with metadata
 */
export function createResponseWithMetadata(
  metadata: Record<string, any> = {}
): StandardSkillResponse {
  return createSuccessResponse({}, 100, metadata);
}

/**
 * Typing fix for createSuccessResponse
 */
export function createSuccessResponse(
  skillData: Record<string, any> = {},
  executionTimeMs: number = Math.random() * 1000,
  metadata?: Record<string, any>
): StandardSkillResponse {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    execution_time_ms: executionTimeMs,
    ...(metadata && { metadata }),
    ...skillData,
  };
}

/**
 * Batch response creation for stress testing
 */
export function createBatchResponses(
  successCount: number = 8,
  errorCount: number = 2
): Array<StandardSkillResponse | null> {
  return [
    ...Array.from({ length: successCount }, () => createSuccessResponse()),
    ...Array.from({ length: errorCount }, () =>
      createErrorResponse(`Error ${Math.floor(Math.random() * 100)}`)
    ),
  ];
}

/**
 * Response comparison helpers
 */
export function areResponsesEqual(resp1: StandardSkillResponse, resp2: StandardSkillResponse): boolean {
  return (
    resp1.success === resp2.success &&
    resp1.error === resp2.error &&
    resp1.execution_time_ms === resp2.execution_time_ms &&
    JSON.stringify(resp1.metadata) === JSON.stringify(resp2.metadata)
  );
}

/**
 * Simulate slow response
 */
export function createSlowResponse(delayMs: number = 5000): StandardSkillResponse {
  return createSuccessResponse({}, delayMs);
}

/**
 * Simulate timeout response
 */
export function createTimeoutResponse(): StandardSkillResponse {
  return createErrorResponse('Request timeout', 30000, {
    error_type: 'TIMEOUT',
    error_code: 'ETIMEDOUT',
  });
}

/**
 * Simulate rate limit response
 */
export function createRateLimitResponse(): StandardSkillResponse {
  return createErrorResponse('Rate limit exceeded', 100, {
    error_type: 'RATE_LIMITED',
    error_code: 'RATE_LIMIT_EXCEEDED',
    retry_after_ms: 60000,
  });
}
