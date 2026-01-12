/**
 * Phase 11: useAsyncWorkflow Hook
 * Handles polling for async workflow execution results
 * Used when backend returns state: 'async_queued' with workflow_id
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AsyncWorkflowResponse, StandardSkillResponse } from '../services/a2aClient';

/**
 * State of an async workflow
 */
export type AsyncWorkflowState = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Async workflow execution state
 */
export interface AsyncWorkflowStatus {
  state: AsyncWorkflowState;
  workflowId: string;
  progressPercent?: number;
  currentStep?: string;
  estimatedRemainingMs?: number;
  completedAt?: string;
  error?: string;
}

/**
 * useAsyncWorkflow Hook
 * Manages polling for async workflow execution
 *
 * @param initialResponse - The async_queued response from initial skill call
 * @param pollFn - Function that polls the workflow status
 * @param enabled - Whether to start polling automatically
 *
 * @example
 * const response = await a2aClient.triggerWorkflow(...);
 * if (response.state === 'async_queued') {
 *   const { status, stop } = useAsyncWorkflow(response,
 *     () => a2aClient.getWorkflowStatus(response.workflow_id)
 *   );
 *   // status will update as workflow progresses
 * }
 */
export function useAsyncWorkflow<T extends StandardSkillResponse>(
  initialResponse: AsyncWorkflowResponse,
  pollFn: () => Promise<T>,
  enabled: boolean = true
) {
  const [status, setStatus] = useState<AsyncWorkflowStatus>({
    state: 'queued',
    workflowId: initialResponse.workflow_id,
  });

  const [isPolling, setIsPolling] = useState(enabled);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);

  const poll = useCallback(async () => {
    try {
      const response = await pollFn();

      // Extract workflow state from metadata
      const workflowMetadata = response.metadata as any;
      const newState: AsyncWorkflowState =
        workflowMetadata?.state || (response.success ? 'completed' : 'failed');

      const newStatus: AsyncWorkflowStatus = {
        state: newState,
        workflowId: initialResponse.workflow_id,
        progressPercent: workflowMetadata?.progress_percent,
        currentStep: workflowMetadata?.current_step,
        estimatedRemainingMs: workflowMetadata?.estimated_remaining_ms,
        error: response.error,
      };

      setStatus(newStatus);

      // Stop polling when workflow reaches terminal state
      if (newState === 'completed' || newState === 'failed') {
        setIsPolling(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        console.log(`🏁 Workflow ${initialResponse.workflow_id} reached terminal state:`, newState);
      }

      console.log(`📊 Workflow poll #${++pollCountRef.current}:`, {
        state: newState,
        progress: workflowMetadata?.progress_percent,
        step: workflowMetadata?.current_step,
      });

      return newStatus;
    } catch (error) {
      console.error('Error polling workflow status:', error);
      setStatus((prev) => ({
        ...prev,
        state: 'failed',
        error: error instanceof Error ? error.message : 'Polling error',
      }));
      setIsPolling(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [pollFn, initialResponse.workflow_id]);

  const start = useCallback(() => {
    if (pollIntervalRef.current) {
      console.warn('Polling already active');
      return;
    }

    setIsPolling(true);
    pollCountRef.current = 0;

    // Initial poll immediately
    poll();

    // Then poll at specified interval
    const interval = initialResponse.polling_interval_ms || 5000; // Default 5 seconds
    pollIntervalRef.current = setInterval(poll, interval);

    console.log(`🔄 Started polling workflow ${initialResponse.workflow_id} every ${interval}ms`);
  }, [poll, initialResponse.polling_interval_ms, initialResponse.workflow_id]);

  const stop = useCallback(() => {
    setIsPolling(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      console.log(`⏸️ Stopped polling workflow ${initialResponse.workflow_id}`);
    }
  }, [initialResponse.workflow_id]);

  // Auto-start polling if enabled
  useEffect(() => {
    if (enabled && !isPolling) {
      start();
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [enabled, isPolling, start]);

  return {
    status,
    isPolling,
    start,
    stop,
    pollCount: pollCountRef.current,
  };
}

/**
 * useAsyncWorkflowList Hook
 * Manages polling for multiple async workflows
 */
export interface WorkflowItem {
  workflowId: string;
  response: AsyncWorkflowResponse;
  status: AsyncWorkflowStatus;
  isPolling: boolean;
}

export function useAsyncWorkflowList(
  pollFn: (workflowId: string) => Promise<StandardSkillResponse>
) {
  const [workflows, setWorkflows] = useState<Map<string, WorkflowItem>>(new Map());

  const addWorkflow = useCallback(
    (response: AsyncWorkflowResponse) => {
      const workflowId = response.workflow_id;

      const workflowStatus: AsyncWorkflowStatus = {
        state: 'queued',
        workflowId,
      };

      setWorkflows((prev) => {
        const updated = new Map(prev);
        updated.set(workflowId, {
          workflowId,
          response,
          status: workflowStatus,
          isPolling: true,
        });
        return updated;
      });

      // Start polling
      const pollInterval = response.polling_interval_ms || 5000;
      const interval = setInterval(async () => {
        try {
          const pollResponse = await pollFn(workflowId);
          const workflowMetadata = pollResponse.metadata as any;
          const state: AsyncWorkflowState =
            workflowMetadata?.state || (pollResponse.success ? 'completed' : 'failed');

          setWorkflows((prev) => {
            const updated = new Map(prev);
            const item = updated.get(workflowId);
            if (item) {
              item.status = {
                state,
                workflowId,
                progressPercent: workflowMetadata?.progress_percent,
                currentStep: workflowMetadata?.current_step,
                estimatedRemainingMs: workflowMetadata?.estimated_remaining_ms,
                error: pollResponse.error,
              };

              // Stop polling on terminal state
              if (state === 'completed' || state === 'failed') {
                item.isPolling = false;
                clearInterval(interval);
              }
            }
            return updated;
          });
        } catch (error) {
          console.error(`Error polling workflow ${workflowId}:`, error);
          setWorkflows((prev) => {
            const updated = new Map(prev);
            const item = updated.get(workflowId);
            if (item) {
              item.status.state = 'failed';
              item.status.error = error instanceof Error ? error.message : 'Polling error';
              item.isPolling = false;
              clearInterval(interval);
            }
            return updated;
          });
        }
      }, pollInterval);

      console.log(`✅ Started tracking workflow ${workflowId}`);
    },
    [pollFn]
  );

  const removeWorkflow = useCallback((workflowId: string) => {
    setWorkflows((prev) => {
      const updated = new Map(prev);
      updated.delete(workflowId);
      return updated;
    });
    console.log(`❌ Removed workflow ${workflowId} from tracking`);
  }, []);

  const getWorkflow = useCallback(
    (workflowId: string) => workflows.get(workflowId),
    [workflows]
  );

  const getAllWorkflows = useCallback(() => Array.from(workflows.values()), [workflows]);

  const getActiveWorkflows = useCallback(
    () => Array.from(workflows.values()).filter((w) => w.isPolling),
    [workflows]
  );

  const getCompletedWorkflows = useCallback(
    () =>
      Array.from(workflows.values()).filter(
        (w) => w.status.state === 'completed' || w.status.state === 'failed'
      ),
    [workflows]
  );

  return {
    workflows: getAllWorkflows(),
    activeWorkflows: getActiveWorkflows(),
    completedWorkflows: getCompletedWorkflows(),
    addWorkflow,
    removeWorkflow,
    getWorkflow,
    getWorkflowCount: workflows.size,
  };
}
