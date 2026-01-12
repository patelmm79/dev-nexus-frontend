/**
 * Response Logging Utilities for Phase 11
 * Logs skill execution details for debugging and analytics
 */

import { StandardSkillResponse, AsyncWorkflowResponse } from '../services/a2aClient';
import { ExecutionMetrics } from './responseValidation';

/**
 * Log level configuration
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxLogEntries: number;
  analyticsEndpoint?: string;
}

/**
 * Log entry format
 */
export interface LogEntry {
  timestamp: Date;
  skillId: string;
  level: LogLevel;
  message: string;
  response?: StandardSkillResponse;
  metrics?: ExecutionMetrics;
  metadata?: Record<string, any>;
  duration?: number;
}

/**
 * Response logger class
 */
export class ResponseLogger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableStorage: false,
      maxLogEntries: 1000,
      ...config,
    };
  }

  /**
   * Log skill execution
   */
  logExecution(
    skillId: string,
    response: StandardSkillResponse,
    metrics?: ExecutionMetrics
  ): void {
    const level = response.success ? 'info' : 'error';
    const message = response.success
      ? `✅ Skill "${skillId}" succeeded in ${response.execution_time_ms}ms`
      : `❌ Skill "${skillId}" failed: ${response.error}`;

    this.log(level, message, {
      skillId,
      response,
      metrics: metrics || {
        success: response.success,
        timestamp: response.timestamp,
        executionTimeMs: response.execution_time_ms,
        error: response.error,
      },
    });
  }

  /**
   * Log async workflow queued
   */
  logAsyncWorkflowQueued(skillId: string, response: AsyncWorkflowResponse): void {
    this.log('info', `⏳ Skill "${skillId}" queued workflow ${response.workflow_id}`, {
      skillId,
      response,
      metadata: {
        workflowId: response.workflow_id,
        pollingIntervalMs: response.polling_interval_ms,
      },
    });
  }

  /**
   * Log workflow polling
   */
  logWorkflowPolling(
    workflowId: string,
    pollNumber: number,
    state: string,
    progressPercent?: number
  ): void {
    this.log('debug', `🔄 Polling workflow ${workflowId} #${pollNumber}: ${state}`, {
      skillId: 'workflow_polling',
      metadata: {
        workflowId,
        pollNumber,
        state,
        progressPercent,
      },
    });
  }

  /**
   * Log validation error
   */
  logValidationError(skillId: string, errors: string[], response?: any): void {
    this.log('error', `⚠️ Skill "${skillId}" response validation failed`, {
      skillId,
      response,
      metadata: {
        errors,
        receivedResponse: response,
      },
    });
  }

  /**
   * Log execution error
   */
  logExecutionError(skillId: string, error: Error, context?: Record<string, any>): void {
    this.log('error', `❌ Skill "${skillId}" threw error: ${error.message}`, {
      skillId,
      metadata: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack,
        ...context,
      },
    });
  }

  /**
   * Log performance alert
   */
  logPerformanceAlert(skillId: string, alertType: string, value: number, threshold: number): void {
    this.log('warn', `⚡ Performance alert for "${skillId}": ${alertType}`, {
      skillId,
      metadata: {
        alertType,
        value,
        threshold,
      },
    });
  }

  /**
   * Generic logging method
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: {
      skillId?: string;
      response?: StandardSkillResponse;
      metrics?: ExecutionMetrics;
      metadata?: Record<string, any>;
    }
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      skillId: metadata?.skillId || 'unknown',
      level,
      message,
      response: metadata?.response,
      metrics: metadata?.metrics,
      metadata: metadata?.metadata,
    };

    this.logBuffer.push(entry);

    // Trim buffer if needed
    if (this.logBuffer.length > this.config.maxLogEntries) {
      this.logBuffer = this.logBuffer.slice(this.logBuffer.length - this.config.maxLogEntries);
    }

    // Log to console
    if (this.config.enableConsole && this.shouldLog(level)) {
      this.logToConsole(entry);
    }

    // Log to storage
    if (this.config.enableStorage) {
      this.logToStorage(entry);
    }

    // Send to analytics endpoint
    if (this.config.analyticsEndpoint && level === 'error') {
      this.sendToAnalytics(entry);
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.level);
    const entryLevel = levels.indexOf(level);
    return entryLevel >= configLevel;
  }

  /**
   * Log to browser console
   */
  private logToConsole(entry: LogEntry): void {
    const method = entry.level as 'debug' | 'info' | 'warn' | 'error';

    const data: any = {
      timestamp: entry.timestamp.toISOString(),
      skillId: entry.skillId,
      ...entry.metadata,
    };

    if (entry.metrics) {
      data.metrics = entry.metrics;
    }

    if (method === 'debug') {
      console.debug(entry.message, data);
    } else if (method === 'info') {
      console.info(entry.message, data);
    } else if (method === 'warn') {
      console.warn(entry.message, data);
    } else if (method === 'error') {
      console.error(entry.message, data);
    }
  }

  /**
   * Log to local storage
   */
  private logToStorage(entry: LogEntry): void {
    try {
      const logs = this.getLogsFromStorage();
      logs.push({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      } as any);

      // Keep only recent logs
      const kept = logs.slice(Math.max(0, logs.length - 100));
      localStorage.setItem('phase11_logs', JSON.stringify(kept));
    } catch (error) {
      console.warn('Failed to write logs to storage:', error);
    }
  }

  /**
   * Send error to analytics
   */
  private sendToAnalytics(entry: LogEntry): void {
    if (!this.config.analyticsEndpoint) return;

    const payload = {
      timestamp: entry.timestamp.toISOString(),
      skillId: entry.skillId,
      level: entry.level,
      message: entry.message,
      metadata: entry.metadata,
    };

    fetch(this.config.analyticsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((error) => {
      console.warn('Failed to send analytics:', error);
    });
  }

  /**
   * Get all logged entries
   */
  getAll(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Get logs by skill ID
   */
  getBySkillId(skillId: string): LogEntry[] {
    return this.logBuffer.filter((entry) => entry.skillId === skillId);
  }

  /**
   * Get logs by level
   */
  getByLevel(level: LogLevel): LogEntry[] {
    return this.logBuffer.filter((entry) => entry.level === level);
  }

  /**
   * Get logs from local storage
   */
  private getLogsFromStorage(): any[] {
    try {
      const logs = localStorage.getItem('phase11_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  /**
   * Export logs as JSON
   */
  export(): Record<string, any> {
    return {
      exported: new Date().toISOString(),
      count: this.logBuffer.length,
      logs: this.logBuffer.map((entry) => ({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      })),
    };
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logBuffer = [];
    try {
      localStorage.removeItem('phase11_logs');
    } catch {
      // Ignore storage clear errors
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Global singleton logger instance
 */
let globalLogger: ResponseLogger | null = null;

/**
 * Get or create global logger
 */
export function getGlobalLogger(): ResponseLogger {
  if (!globalLogger) {
    globalLogger = new ResponseLogger({
      level: import.meta.env.DEV ? 'debug' : 'info',
      enableConsole: true,
      enableStorage: false,
    });
  }
  return globalLogger;
}

/**
 * Reset global logger
 */
export function resetGlobalLogger(): void {
  globalLogger = null;
}

/**
 * Log execution helper
 */
export function logSkillExecution(
  skillId: string,
  response: StandardSkillResponse,
  metrics?: ExecutionMetrics
): void {
  getGlobalLogger().logExecution(skillId, response, metrics);
}

/**
 * Log async workflow helper
 */
export function logAsyncWorkflow(skillId: string, response: AsyncWorkflowResponse): void {
  getGlobalLogger().logAsyncWorkflowQueued(skillId, response);
}

/**
 * Log error helper
 */
export function logError(skillId: string, error: Error, context?: Record<string, any>): void {
  getGlobalLogger().logExecutionError(skillId, error, context);
}
