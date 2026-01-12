/**
 * Phase 12: Skill Error Handler
 * Standardized error handling with metadata extraction
 * Converts StandardSkillResponse errors to user-friendly messages
 */

import { StandardSkillResponse } from '../services/a2aClient';
import { a2aClient } from '../services/a2aClient';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Structured error with metadata
 */
export interface StructuredError {
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  errorType?: string;
  errorCode?: string;
  skillId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  raw?: StandardSkillResponse;
}

/**
 * User-friendly error message mapping
 */
const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  ValidationError: {
    default: 'Invalid input parameters. Please check your input and try again.',
    required_field: 'Required field is missing.',
    invalid_format: 'Invalid format. Please check your input.',
    out_of_range: 'Value is outside valid range.',
  },
  NotFoundError: {
    default: 'The requested resource was not found.',
    repository: 'Repository not found. Please check the repository name.',
    pattern: 'Pattern not found. It may have been deleted.',
    workflow: 'Workflow not found. It may have expired.',
  },
  TimeoutError: {
    default: 'Request took too long. Please try again.',
    execution: 'Skill execution timed out. Please try again with smaller input.',
  },
  RateLimitError: {
    default: 'Too many requests. Please wait before trying again.',
  },
  PermissionError: {
    default: 'You do not have permission to perform this action.',
    unauthorized: 'Please log in to continue.',
    forbidden: 'This action is not allowed.',
  },
  ServerError: {
    default: 'Server error. Please try again later.',
    internal: 'An internal error occurred. Please try again.',
    unavailable: 'Service is temporarily unavailable.',
  },
};

/**
 * Handle skill execution error and return structured error object
 *
 * @param response Failed StandardSkillResponse
 * @param skillId Skill identifier
 * @returns StructuredError with user-friendly message
 *
 * @example
 * const response = await a2aClient.executeSkill('query_patterns', ...)
 * if (!response.success) {
 *   const error = handleSkillError(response, 'query_patterns')
 *   showError(error.userMessage)  // User-friendly message
 *   logError(error)  // For debugging
 * }
 */
export function handleSkillError(response: StandardSkillResponse, skillId: string): StructuredError {
  if (response.success) {
    console.warn('handleSkillError called with successful response');
    return {
      message: 'No error',
      userMessage: 'Operation completed successfully',
      severity: ErrorSeverity.INFO,
      skillId,
      timestamp: a2aClient.getTimestamp(response),
    };
  }

  const metadata = a2aClient.getErrorMetadata(response);
  const errorType = metadata.error_type || 'UnknownError';
  const errorCode = metadata.error_code || 'ERR_UNKNOWN';
  const errorSubType = metadata.error_subtype || 'default';

  // Get user-friendly message
  const userMessage =
    ERROR_MESSAGES[errorType]?.[errorSubType] ||
    ERROR_MESSAGES[errorType]?.['default'] ||
    ERROR_MESSAGES.ServerError.default;

  // Determine severity
  const severity = determineSeverity(errorType, metadata);

  return {
    message: a2aClient.getErrorMessage(response),
    userMessage,
    severity,
    errorType,
    errorCode,
    skillId,
    timestamp: a2aClient.getTimestamp(response),
    metadata,
    raw: response,
  };
}

/**
 * Determine error severity from error type and metadata
 */
function determineSeverity(errorType: string, _metadata: Record<string, any>): ErrorSeverity {
  if (errorType === 'ValidationError') {
    return ErrorSeverity.WARNING;
  }
  if (errorType === 'TimeoutError' || errorType === 'RateLimitError') {
    return ErrorSeverity.INFO;
  }
  if (errorType === 'PermissionError') {
    return ErrorSeverity.WARNING;
  }
  if (errorType === 'ServerError' || errorType === 'InternalError') {
    return ErrorSeverity.CRITICAL;
  }
  return ErrorSeverity.ERROR;
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: StructuredError): {
  title: string;
  message: string;
  icon: string;
} {
  const iconMap: Record<ErrorSeverity, string> = {
    [ErrorSeverity.INFO]: 'ℹ️',
    [ErrorSeverity.WARNING]: '⚠️',
    [ErrorSeverity.ERROR]: '❌',
    [ErrorSeverity.CRITICAL]: '🚨',
  };

  return {
    title: error.errorCode || 'Error',
    message: error.userMessage,
    icon: iconMap[error.severity],
  };
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: StructuredError): boolean {
  const retryableErrors = ['TimeoutError', 'RateLimitError', 'TemporaryServerError'];
  return retryableErrors.includes(error.errorType || '');
}

/**
 * Get retry delay in milliseconds
 */
export function getRetryDelay(error: StructuredError, attempt: number = 1): number {
  if (error.errorType === 'RateLimitError') {
    const retryAfter = error.metadata?.retry_after_ms;
    if (retryAfter) {
      return retryAfter;
    }
  }

  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  return Math.min(1000 * Math.pow(2, attempt - 1), 30000);
}

/**
 * Log error for debugging
 */
export function logError(error: StructuredError) {
  const color = {
    [ErrorSeverity.INFO]: 'color: blue',
    [ErrorSeverity.WARNING]: 'color: orange',
    [ErrorSeverity.ERROR]: 'color: red',
    [ErrorSeverity.CRITICAL]: 'color: darkred; font-weight: bold',
  }[error.severity];

  console.error(`%c[${error.errorCode}] ${error.message}`, color);
  console.error(`Skill: ${error.skillId}`);
  console.error(`Type: ${error.errorType}`);

  if (Object.keys(error.metadata || {}).length > 0) {
    console.error('Metadata:', error.metadata);
  }

  if (error.raw) {
    console.error('Raw Response:', error.raw);
  }
}

/**
 * Create error context for error boundaries
 */
export function createErrorContext(error: StructuredError) {
  const { skillId: orig_skillId, timestamp: orig_timestamp, ...rest } = error;
  return {
    id: `${error.errorCode}-${Date.now()}`,
    skillId: orig_skillId,
    timestamp: orig_timestamp.toISOString(),
    ...rest,
  };
}
