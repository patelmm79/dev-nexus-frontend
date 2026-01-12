/**
 * Response Validation Utilities for Phase 11
 * Validates API responses against the standardized response format
 */

import { StandardSkillResponse } from '../services/a2aClient';

/**
 * Validates that a response has the required Phase 11 fields
 */
export function isValidStandardResponse(
  response: any
): response is StandardSkillResponse {
  if (!response || typeof response !== 'object') {
    return false;
  }

  // Check required fields
  if (typeof response.success !== 'boolean') {
    return false;
  }

  if (typeof response.timestamp !== 'string') {
    return false;
  }

  if (typeof response.execution_time_ms !== 'number' || response.execution_time_ms < 0) {
    return false;
  }

  // Optional: validate ISO 8601 timestamp
  try {
    const date = new Date(response.timestamp);
    if (isNaN(date.getTime())) {
      console.warn('Invalid ISO 8601 timestamp:', response.timestamp);
      return false;
    }
  } catch (e) {
    console.warn('Failed to parse timestamp:', response.timestamp);
    return false;
  }

  return true;
}

/**
 * Validates that a response has error information when success is false
 */
export function hasErrorInfo(response: StandardSkillResponse): boolean {
  return !response.success && !!response.error;
}

/**
 * Extracts execution metrics from a response
 */
export interface ExecutionMetrics {
  success: boolean;
  timestamp: string;
  executionTimeMs: number;
  error?: string;
  metadata?: Record<string, any>;
}

export function extractMetrics(response: StandardSkillResponse): ExecutionMetrics {
  return {
    success: response.success,
    timestamp: response.timestamp,
    executionTimeMs: response.execution_time_ms,
    error: response.error,
    metadata: response.metadata,
  };
}

/**
 * Validates ISO 8601 timestamp format
 */
export function isValidISO8601(timestamp: string): boolean {
  try {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) && timestamp === date.toISOString();
  } catch {
    return false;
  }
}

/**
 * Performance statistics for tracking execution times
 */
export interface PerformanceStats {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  p95Ms: number;
}

/**
 * Calculates performance statistics from execution times
 */
export function calculatePerformanceStats(executionTimes: number[]): PerformanceStats {
  if (executionTimes.length === 0) {
    return {
      count: 0,
      totalMs: 0,
      minMs: 0,
      maxMs: 0,
      avgMs: 0,
      p95Ms: 0,
    };
  }

  const sorted = [...executionTimes].sort((a, b) => a - b);
  const count = sorted.length;
  const totalMs = sorted.reduce((a, b) => a + b, 0);
  const minMs = sorted[0];
  const maxMs = sorted[count - 1];
  const avgMs = totalMs / count;

  // Calculate 95th percentile
  const p95Index = Math.ceil((95 / 100) * count) - 1;
  const p95Ms = sorted[Math.max(0, p95Index)];

  return { count, totalMs, minMs, maxMs, avgMs, p95Ms };
}

/**
 * Response validation result with errors
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Comprehensive validation of response structure
 */
export function validateResponse(response: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!response) {
    errors.push('Response is null or undefined');
    return { valid: false, errors, warnings };
  }

  if (typeof response !== 'object') {
    errors.push('Response is not an object');
    return { valid: false, errors, warnings };
  }

  // Check required fields
  if (typeof response.success !== 'boolean') {
    errors.push('Missing or invalid "success" field (must be boolean)');
  }

  if (typeof response.timestamp !== 'string') {
    errors.push('Missing or invalid "timestamp" field (must be string)');
  } else if (!isValidISO8601(response.timestamp)) {
    warnings.push(`Timestamp is not valid ISO 8601: ${response.timestamp}`);
  }

  if (typeof response.execution_time_ms !== 'number') {
    errors.push('Missing or invalid "execution_time_ms" field (must be number)');
  } else if (response.execution_time_ms < 0) {
    errors.push('execution_time_ms cannot be negative');
  }

  // Check error field for failed responses
  if (!response.success && !response.error) {
    warnings.push('Response has success=false but no error message');
  }

  if (response.error && typeof response.error !== 'string') {
    warnings.push('error field is not a string');
  }

  // Check metadata
  if (response.metadata && typeof response.metadata !== 'object') {
    warnings.push('metadata field is not an object');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Asserts that a response is valid, throws error if not
 */
export function assertValidResponse(response: any): asserts response is StandardSkillResponse {
  const result = validateResponse(response);
  if (!result.valid) {
    throw new Error(`Invalid response format: ${result.errors.join('; ')}`);
  }
}

/**
 * Safely extracts skill-specific data from response
 * Returns empty object if response is invalid
 */
export function extractSkillData(
  response: StandardSkillResponse,
  excludeStandardFields = true
): Record<string, any> {
  const data: Record<string, any> = { ...response };

  if (excludeStandardFields) {
    delete data.success;
    delete data.timestamp;
    delete data.execution_time_ms;
    delete data.error;
    delete data.metadata;
  }

  return data;
}
