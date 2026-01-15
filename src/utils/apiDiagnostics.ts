/**
 * API Diagnostics & Error Handling Utilities
 *
 * Provides standardized error logging, response validation, and user-facing error messages
 * for all A2A skill API interactions. This ensures consistent error handling across the
 * frontend and makes debugging easier.
 *
 * Pattern: Import these utilities in all data-fetching hooks to add automatic diagnostics.
 */

import { StandardSkillResponse } from '../services/a2aClient';

/**
 * Log API response with context
 * Always logs the full response to help diagnose API issues
 */
export function logApiResponse(skillId: string, response: any, context?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const level = response?.success ? 'info' : 'error';

  console.log(`[${timestamp}] API ${level.toUpperCase()}: ${skillId}`, {
    success: response?.success,
    error: response?.error,
    executionTime: response?.execution_time_ms,
    context,
    fullResponse: response,
  });
}

/**
 * Validate response structure matches StandardSkillResponse
 */
export function validateApiResponse(response: any): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!response || typeof response !== 'object') {
    issues.push('Response is not an object');
    return { valid: false, issues };
  }

  if (typeof response.success !== 'boolean') {
    issues.push('Missing or invalid "success" field');
  }

  if (typeof response.timestamp !== 'string') {
    issues.push('Missing or invalid "timestamp" field');
  }

  if (typeof response.execution_time_ms !== 'number') {
    issues.push('Missing or invalid "execution_time_ms" field');
  }

  if (!response.success && !response.error) {
    issues.push('Failed response missing "error" field');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Extract user-friendly error message from API response
 */
export function extractErrorMessage(response: StandardSkillResponse | any, skillId: string): string {
  // Check if it's a network/axios error
  if (response instanceof Error) {
    return `Network error: ${response.message}`;
  }

  // Check for backend error field
  if (response?.error) {
    return response.error;
  }

  // Check for validation issues
  const validation = validateApiResponse(response);
  if (!validation.valid) {
    return `Invalid response format: ${validation.issues.join(', ')}`;
  }

  return `Unknown error from ${skillId} skill`;
}

/**
 * Create a detailed diagnostic report for API failures
 * Useful for error boundaries and detailed error displays
 */
export function createApiErrorReport(
  skillId: string,
  response: any,
  error?: Error,
  context?: Record<string, any>
): {
  skillId: string;
  message: string;
  details: string;
  timestamp: string;
  context?: Record<string, any>;
} {
  const timestamp = new Date().toISOString();
  const validation = validateApiResponse(response);

  let details = '';

  if (error) {
    details += `Error: ${error.message}\n`;
  }

  if (!validation.valid) {
    details += `Validation issues: ${validation.issues.join(', ')}\n`;
  }

  if (response?.error) {
    details += `Backend error: ${response.error}\n`;
  }

  if (response?.metadata) {
    details += `Metadata: ${JSON.stringify(response.metadata, null, 2)}\n`;
  }

  return {
    skillId,
    message: extractErrorMessage(response, skillId),
    details: details.trim(),
    timestamp,
    context,
  };
}

/**
 * Severity level for error classification
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Classify error severity based on response
 */
export function getErrorSeverity(response: any): ErrorSeverity {
  if (!response) return 'error';

  // Check for validation errors - critical because it indicates a contract mismatch
  const validation = validateApiResponse(response);
  if (!validation.valid) {
    return 'critical';
  }

  // Check for specific error types in metadata
  if (response?.metadata?.error_type === 'timeout') {
    return 'warning'; // Transient error
  }

  if (response?.metadata?.error_type === 'not_found') {
    return 'info'; // Informational
  }

  return 'error';
}
