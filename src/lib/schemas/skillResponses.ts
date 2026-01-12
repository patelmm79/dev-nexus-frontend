/**
 * Zod Schemas for A2A Skill Response Validation
 *
 * Copy this file to: dev-nexus-frontend/src/lib/schemas/skillResponses.ts
 *
 * These schemas provide runtime validation of A2A skill responses.
 * Every API response is validated against these schemas before being used by components.
 *
 * Benefits:
 * - Catch API mismatches in browser (not in production)
 * - Fail loudly with clear error messages
 * - Type-safe component props
 * - Bridge between Python Pydantic models and TypeScript types
 *
 * Usage:
 * ```typescript
 * import { skillResponseSchemas } from '@/lib/schemas/skillResponses'
 *
 * // Validate a response
 * const result = skillResponseSchemas.getCrossRepoPatterns.safeParse(apiResponse)
 * if (!result.success) {
 *   console.error('Response validation failed:', result.error.flatten())
 *   throw new Error('API response does not match expected schema')
 * }
 * const validatedResponse = result.data // TypeScript knows the exact type
 * ```
 */

import { z } from 'zod'

/**
 * Base response schema that ALL A2A skills return
 *
 * Design Philosophy:
 * - success: boolean - Always check this first
 * - timestamp: ISO 8601 - Always present for audit logging
 * - execution_time_ms: number >= 0 - Always present for performance monitoring
 * - error: string | null - Only when success=false
 * - metadata: object | null - Optional context (pagination, warnings, features)
 *
 * IMPORTANT: Never access skill-specific fields unless success=true
 */
export const StandardSkillResponseSchema = z.object({
  success: z.boolean().describe('Whether skill execution succeeded'),
  timestamp: z
    .string()
    .datetime({})
    .describe('ISO 8601 timestamp when skill started. Use for audit logging'),
  execution_time_ms: z
    .number()
    .int()
    .nonnegative()
    .describe('Milliseconds skill took. Use for performance monitoring'),
  error: z
    .string()
    .nullable()
    .optional()
    .describe('Error message. Only present when success=false'),
  metadata: z
    .record(z.string(), z.unknown())
    .nullable()
    .optional()
    .describe('Optional metadata: pagination, warnings, feature flags'),
})

export type StandardSkillResponse = z.infer<typeof StandardSkillResponseSchema>

/**
 * Pattern object found across multiple repositories
 *
 * Design Choice: repositories as strings, not objects
 * - Why: Most queries only need repo names for display
 * - Details: Available via get_deployment_info if needed
 * - Benefit: Smaller payloads for large result sets
 *
 * IMPORTANT: Don't try to infer metadata from this object.
 * Call get_deployment_info separately for: last_updated, pattern_count, problem_domain
 */
export const CrossRepoPatternSchema = z.object({
  pattern_name: z.string().describe('Pattern name (e.g., "retry_with_exponential_backoff")'),
  repositories: z
    .array(z.string())
    .min(1)
    .describe(
      'List of repo names (format: "owner/repo") using this pattern. Strings only. Call get_deployment_info for full details',
    ),
  repository_count: z
    .number()
    .int()
    .nonnegative()
    .describe('Count of repositories. Provided separately for efficient aggregation without traversing list'),
  matched_components: z
    .array(z.string())
    .optional()
    .describe('Optional: Component names that matched this pattern'),
  relevance: z
    .enum(['high', 'medium', 'low'])
    .optional()
    .describe('Optional: Relevance score. Use to prioritize which patterns to show'),
})

export type CrossRepoPattern = z.infer<typeof CrossRepoPatternSchema>

/**
 * Response for get_cross_repo_patterns skill
 *
 * Design: Results are pattern-centric, not repository-centric
 * - patterns: Array of patterns with their repositories inside
 * - total_patterns: Count for pagination
 *
 * NOT repository-centric (which would duplicate data):
 * - You don't get: { repo1: [patterns], repo2: [patterns] }
 * - You get: [{ pattern: "X", repositories: ["repo1", "repo2"] }]
 *
 * This makes iteration and display straightforward.
 */
export const GetCrossRepoPatternsResponseSchema = StandardSkillResponseSchema.extend({
  success: z.literal(true).describe('Always true for successful responses'),
  patterns: z
    .array(CrossRepoPatternSchema)
    .describe('Array of patterns. Iterate directly for display'),
  total_patterns: z
    .number()
    .int()
    .nonnegative()
    .describe('Total count for pagination. May be > patterns.length if paginating'),
}).strict()

export type GetCrossRepoPatternsResponse = z.infer<typeof GetCrossRepoPatternsResponseSchema>

/**
 * Response for query_patterns skill
 *
 * Design: Echo the search criteria back + return results
 * - search_criteria: Always present so you can verify what was searched
 * - patterns: Results in same format as get_cross_repo_patterns for consistency
 */
export const QueryPatternsResponseSchema = StandardSkillResponseSchema.extend({
  success: z.literal(true),
  patterns: z.array(z.record(z.string(), z.unknown())).describe('Matching patterns'),
  total_patterns: z.number().int().nonnegative().describe('Total matches'),
  search_criteria: z
    .object({
      keywords: z.array(z.string()).optional(),
      patterns: z.array(z.string()).optional(),
      min_matches: z.number().int().optional(),
    })
    .describe('Echo of your search input for validation'),
}).strict()

export type QueryPatternsResponse = z.infer<typeof QueryPatternsResponseSchema>

/**
 * Repository metadata in list responses
 *
 * Returned by get_repository_list when include_metadata=true
 */
export const RepositoryMetadataSchema = z.object({
  name: z.string().describe('Repository name (format: "owner/repo")'),
  pattern_count: z.number().int().nonnegative().describe('Number of patterns in this repo'),
  last_updated: z
    .string()
    .datetime({})
    .describe('ISO 8601 timestamp of last analysis'),
  problem_domain: z
    .string()
    .optional()
    .describe('Problem domain/project description'),
  keywords: z.array(z.string()).optional().describe('Top keywords from latest analysis'),
})

export type RepositoryMetadata = z.infer<typeof RepositoryMetadataSchema>

/**
 * Response for get_repository_list skill
 *
 * Design: Repositories as objects with metadata (not just strings)
 * - Rationale: List endpoint should include useful context
 * - Alternative with include_metadata=false returns just repo name strings
 *
 * Use this to show: repo names, recent activity, pattern counts
 */
export const GetRepositoryListResponseSchema = StandardSkillResponseSchema.extend({
  success: z.literal(true),
  repositories: z
    .array(z.union([z.string(), RepositoryMetadataSchema]))
    .describe('Repository list. Format depends on include_metadata parameter'),
  total_repositories: z
    .number()
    .int()
    .nonnegative()
    .describe('Total repositories tracked'),
}).strict()

export type GetRepositoryListResponse = z.infer<typeof GetRepositoryListResponseSchema>

/**
 * Workflow status response
 *
 * Phase 12: Updated field names for consistency
 * - repositories_count: Total repositories in workflow
 * - repositories_completed: Number of completed repositories
 * - progress_percent: Overall progress 0-100%
 */
export const WorkflowStatusResponseSchema = z.object({
  workflow_id: z.string().describe('Unique workflow identifier'),
  status: z
    .enum(['queued', 'running', 'completed', 'failed', 'partial_success'])
    .describe('Current workflow status'),
  repositories_count: z
    .number()
    .int()
    .nonnegative()
    .describe('Total repositories in workflow'),
  repositories_completed: z
    .number()
    .int()
    .nonnegative()
    .describe('Number of repositories completed'),
  progress_percent: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe('Overall progress percentage 0-100'),
  results: z
    .array(z.record(z.string(), z.unknown()))
    .optional()
    .describe('Workflow results by repository'),
  error: z.string().nullable().optional().describe('Error message if workflow failed'),
  metadata: z
    .record(z.string(), z.unknown())
    .nullable()
    .optional()
    .describe('Optional metadata: warnings, features, etc'),
  // Legacy/compatibility fields for backward compatibility
  timestamp: z.string().datetime({}).optional(),
  execution_time_ms: z.number().int().nonnegative().optional(),
  success: z.boolean().optional(),
})

export type WorkflowStatusResponse = z.infer<typeof WorkflowStatusResponseSchema>


/**
 * Error response
 *
 * Structure guaranteed when success=false
 */
export const ErrorResponseSchema = StandardSkillResponseSchema.extend({
  success: z.literal(false),
  error: z
    .string()
    .min(1)
    .describe('Human-readable error message. Always present'),
  error_type: z
    .string()
    .optional()
    .describe('Machine-readable error type (e.g., "NotFoundError")'),
  error_code: z
    .string()
    .optional()
    .describe('Error code for categorization and monitoring'),
  details: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Additional error context (e.g., available_repositories)'),
}).strict()

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

/**
 * Health check response
 *
 * Returned by GET /health endpoint
 */
export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime({}),
  services: z.record(z.string(), z.record(z.string(), z.unknown())),
  version: z.string(),
  uptime_seconds: z.number().int().nonnegative(),
})

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>

/**
 * Agent card response
 *
 * Returned by GET /.well-known/agent.json
 * Contains full agent metadata and skill registry
 */
export const AgentCardResponseSchema = z.object({
  agent_id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  protocols: z.array(z.string()),
  capabilities: z.array(z.string()),
  skills: z.array(z.record(z.string(), z.unknown())),
  contact: z.record(z.string(), z.string()).optional(),
})

export type AgentCardResponse = z.infer<typeof AgentCardResponseSchema>

/**
 * Composite union type for any A2A skill response
 *
 * Use this when you don't know which skill was called and want to accept any response
 */
export const AnySkillResponseSchema = z.union([
  GetCrossRepoPatternsResponseSchema,
  QueryPatternsResponseSchema,
  GetRepositoryListResponseSchema,
  WorkflowStatusResponseSchema,
  ErrorResponseSchema,
])

export type AnySkillResponse = z.infer<typeof AnySkillResponseSchema>

/**
 * Export all schemas as a registry for convenient access
 *
 * Usage:
 * ```typescript
 * const result = skillResponseSchemas.getCrossRepoPatterns.safeParse(response)
 * ```
 */
export const skillResponseSchemas = {
  standardSkillResponse: StandardSkillResponseSchema,
  crossRepoPattern: CrossRepoPatternSchema,
  getCrossRepoPatterns: GetCrossRepoPatternsResponseSchema,
  queryPatterns: QueryPatternsResponseSchema,
  getRepositoryList: GetRepositoryListResponseSchema,
  workflowStatus: WorkflowStatusResponseSchema,
  error: ErrorResponseSchema,
  healthCheck: HealthCheckResponseSchema,
  agentCard: AgentCardResponseSchema,
  any: AnySkillResponseSchema,
} as const

/**
 * Helper function to validate any skill response
 *
 * Usage:
 * ```typescript
 * const validated = validateSkillResponse(apiResponse, 'getCrossRepoPatterns')
 * ```
 */
export function validateSkillResponse(
  response: unknown,
  skillType: keyof typeof skillResponseSchemas = 'any',
): AnySkillResponse {
  const schema = skillResponseSchemas[skillType]
  const result = schema.safeParse(response)

  if (!result.success) {
    const formatted = result.error.flatten()
    const errorMessage = `
Skill Response Validation Failed (${skillType}):

Field Errors:
${Object.entries(formatted.fieldErrors)
  .map(([field, errors]) => `  ${field}: ${errors?.join(', ')}`)
  .join('\n')}

${formatted.formErrors.length > 0 ? `Other Errors:\n${formatted.formErrors.map((e) => `  ${e}`).join('\n')}` : ''}

Received:
${JSON.stringify(response, null, 2)}
    `.trim()

    throw new Error(errorMessage)
  }

  return result.data as AnySkillResponse
}
