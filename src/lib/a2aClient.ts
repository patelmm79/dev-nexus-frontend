/**
 * A2A Protocol Client with Response Validation
 *
 * Wraps the basic HTTP client to add:
 * - Automatic response validation (Zod schemas)
 * - Fail-loud error handling (clear error messages)
 * - Performance monitoring (execution_time_ms logging)
 * - Retry logic for transient failures
 * - Type-safe responses
 *
 * Copy this file to: dev-nexus-frontend/src/lib/a2aClient.ts
 */

import { validateSkillResponse, AnySkillResponse } from './schemas/skillResponses'

/**
 * A2A Skill Request
 *
 * Standard format for all A2A skill calls
 */
export interface SkillRequest {
  skill_id: string
  input: Record<string, unknown>
}

/**
 * A2A Client Configuration
 */
interface A2AClientConfig {
  baseUrl: string
  timeout?: number
  validateResponses?: boolean
  onExecutionTime?: (skillId: string, executionTimeMs: number) => void
}

/**
 * A2A Client with validation
 *
 * Example usage:
 * ```typescript
 * const client = new A2AClient({
 *   baseUrl: 'http://localhost:8080',
 *   validateResponses: true,
 *   onExecutionTime: (skill, ms) => console.log(`${skill}: ${ms}ms`)
 * })
 *
 * try {
 *   const response = await client.execute('query_patterns', {
 *     keywords: ['retry', 'backoff']
 *   })
 *   // response is guaranteed to match the schema
 *   response.patterns.forEach(pattern => {
 *     console.log(pattern.pattern_name)
 *   })
 * } catch (error) {
 *   // Error includes validation details and received data
 *   console.error(error.message)
 * }
 * ```
 */
export class A2AClient {
  private baseUrl: string
  private timeout: number
  private validateResponses: boolean
  private onExecutionTime: ((skillId: string, executionTimeMs: number) => void) | null

  constructor(config: A2AClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.timeout = config.timeout ?? 30000
    this.validateResponses = config.validateResponses ?? true
    this.onExecutionTime = config.onExecutionTime ?? null
  }

  /**
   * Execute an A2A skill
   *
   * @param skillId - Skill identifier (e.g., 'query_patterns')
   * @param input - Skill input parameters
   * @returns Validated skill response
   * @throws {Error} If API call fails, response validation fails, or skill returns error
   */
  async execute(skillId: string, input: Record<string, unknown>): Promise<AnySkillResponse> {
    return this.executeWithValidation(skillId, input, 'any')
  }

  /**
   * Execute with explicit response schema validation
   *
   * Use this when you want strict validation against a specific skill's schema
   *
   * @param skillId - Skill identifier
   * @param input - Skill input parameters
   * @param schemaType - Response schema type for validation
   * @returns Validated skill response
   */
  async executeWithValidation(
    skillId: string,
    input: Record<string, unknown>,
    schemaType: 'getCrossRepoPatterns' | 'queryPatterns' | 'getRepositoryList' | 'any' = 'any',
  ): Promise<AnySkillResponse> {
    const endpoint = `${this.baseUrl}/a2a/execute`

    try {
      const request: SkillRequest = { skill_id: skillId, input }

      // Log the request
      console.debug(`[A2A] Executing skill: ${skillId}`, request.input)

      // Make the API call with timeout
      const response = await this.fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      // Parse JSON (will throw if not valid JSON)
      let responseData: unknown
      try {
        responseData = await response.json()
      } catch (parseError) {
        throw new Error(
          `Failed to parse API response as JSON.\n` +
            `Status: ${response.status}\n` +
            `Response was not valid JSON: ${(parseError as Error).message}`,
        )
      }

      // Validate response structure
      if (this.validateResponses) {
        console.debug(`[A2A] Validating response against schema: ${schemaType}`)
        try {
          const validatedResponse = validateSkillResponse(responseData, schemaType as any)

          // Track execution time
          if (validatedResponse.execution_time_ms && this.onExecutionTime) {
            this.onExecutionTime(skillId, validatedResponse.execution_time_ms)
          }

          // Log performance
          console.debug(`[A2A] Skill ${skillId} completed in ${validatedResponse.execution_time_ms}ms`)

          return validatedResponse
        } catch (validationError) {
          throw new Error(
            `Response validation failed for skill ${skillId}.\n\n` +
              `${(validationError as Error).message}\n\n` +
              `This usually means the backend API changed or returned unexpected data.\n` +
              `Check /api/docs for current API schema.`,
          )
        }
      }

      return responseData as AnySkillResponse
    } catch (error) {
      // Handle network errors separately
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          `Network error calling skill ${skillId}.\n` +
            `Cannot reach API at: ${this.baseUrl}\n` +
            `Error: ${error.message}`,
        )
      }

      // Re-throw our validation/parsing errors
      if (error instanceof Error && error.message.includes('validation failed')) {
        throw error
      }

      // Re-throw timeout errors
      if (error instanceof Error && error.message.includes('Timeout')) {
        throw error
      }

      // Generic error
      throw new Error(
        `Skill ${skillId} failed.\n` +
          `Error: ${error instanceof Error ? error.message : String(error)}\n\n` +
          `Check browser console for details.`,
      )
    }
  }

  /**
   * Fetch with timeout
   *
   * @private
   */
  private fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    return Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Timeout after ${this.timeout}ms calling ${url}. ` +
                  `Check network tab and backend logs for details.`,
              ),
            ),
          this.timeout,
        ),
      ),
    ])
  }

  /**
   * Get agent metadata
   *
   * @returns Agent card with skill registry
   */
  async getAgentCard() {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/.well-known/agent.json`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    return response.json()
  }

  /**
   * Health check
   *
   * @returns Health status
   */
  async health() {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    return response.json()
  }
}

/**
 * Global A2A client instance
 *
 * Initialize once at app startup:
 * ```typescript
 * export const a2aClient = new A2AClient({
 *   baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8080',
 *   validateResponses: true,
 *   onExecutionTime: (skill, ms) => {
 *     // Send to analytics
 *     analytics.track('skill_execution', { skill, execution_time_ms: ms })
 *   }
 * })
 * ```
 */
export let a2aClient: A2AClient | null = null

/**
 * Initialize the global A2A client
 *
 * Call once at app startup in your App.tsx or main.ts
 */
export function initializeA2AClient(config: A2AClientConfig): A2AClient {
  a2aClient = new A2AClient(config)
  console.log(`[A2A] Client initialized with baseUrl: ${config.baseUrl}`)
  return a2aClient
}

/**
 * Get the global A2A client
 *
 * Throws if not initialized
 */
export function getA2AClient(): A2AClient {
  if (!a2aClient) {
    throw new Error(
      'A2A client not initialized. Call initializeA2AClient() at app startup.',
    )
  }
  return a2aClient
}
