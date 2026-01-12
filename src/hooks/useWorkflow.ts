import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { a2aClient } from '../services/a2aClient';
import { transformWorkflowResponse } from '../lib/workflowTransformers';
import type {
  TriggerFullAnalysisInput,
  TriggerFullAnalysisResponse,
  WorkflowStatusResponse,
  ExtractPatternsInput,
  ExtractPatternsResponse,
  DiscoverDependenciesInput,
  DiscoverDependenciesResponse,
  UpdateDependencyVerificationInput,
  UpdateDependencyVerificationResponse,
  WorkflowMetadataResponse,
} from '../services/a2aClient';
import toast from 'react-hot-toast';

// ============================================
// Query Hooks (Read-Only Data Fetching)
// ============================================

/**
 * Get workflow status and progress
 * Requires workflowId to be set; returns null if not available
 */
export function useWorkflowStatus(workflowId: string | null) {
  return useQuery<WorkflowStatusResponse | null>({
    queryKey: ['workflowStatus', workflowId],
    queryFn: async () => {
      if (!workflowId) {
        console.log('⚠️ useWorkflowStatus: workflowId is null, returning null');
        return null;
      }
      console.log('📊 Fetching workflow status for ID:', workflowId);
      const result = await a2aClient.getWorkflowStatus(workflowId);
      console.log('📈 Workflow status response:', result);
      return result;
    },
    enabled: !!workflowId,
    staleTime: 0, // Always fresh - user will manually refresh
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: false, // Manual refresh only
    retry: 2,
  });
}

/**
 * Get workflow metadata statistics
 */
export function useWorkflowMetadata() {
  return useQuery<WorkflowMetadataResponse>({
    queryKey: ['workflowMetadata'],
    queryFn: async () => await a2aClient.getWorkflowMetadata(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// ============================================
// Mutation Hooks (Manual Triggering)
// ============================================

/**
 * Trigger full analysis workflow for multiple repositories
 */
export function useTriggerWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TriggerFullAnalysisInput) =>
      a2aClient.triggerFullAnalysisWorkflow(input),
    onSuccess: (data: TriggerFullAnalysisResponse) => {
      console.log('🎯 Full trigger response:', data);

      // Check if response is async_queued (Phase 11 pattern)
      if ((data as any).state === 'async_queued') {
        console.log('⏳ Workflow queued for async execution');
        console.log('   Workflow ID:', (data as any).workflow_id);
        console.log('   Polling interval:', (data as any).polling_interval_ms, 'ms');
        console.log('   Repositories count:', (data as any).repositories_count);
        toast.success('Workflow queued! Monitoring progress...');
        return;
      }

      // Fallback for synchronous responses
      const repoCount = (data as any).repositories_processed !== undefined
        ? (data as any).repositories_processed
        : ((data as any).workflow_steps ?
            new Set((data as any).workflow_steps.map((step: any) => step.repository)).size
            : ((data as any).repositories_count || 0));

      console.log('   Repositories processed:', repoCount);
      console.log('   Timestamp:', data.timestamp);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['workflowMetadata'] });

      const message = repoCount === 1
        ? 'Workflow completed! 1 repository analyzed.'
        : `Workflow completed! ${repoCount} repositories analyzed.`;
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(`Failed to trigger workflow: ${error.message}`);
    },
  });
}

/**
 * Extract patterns from a single repository
 */
export function useExtractPatterns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExtractPatternsInput) =>
      a2aClient.extractRepositoryPatterns(input),
    onSuccess: (data: ExtractPatternsResponse) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['patterns'] });
      queryClient.invalidateQueries({ queryKey: ['workflowMetadata'] });

      toast.success(
        data.message || `Successfully extracted ${data.patterns_extracted} patterns!`
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to extract patterns: ${error.message}`);
    },
  });
}

/**
 * Discover dependencies in a single repository
 */
export function useDiscoverDependencies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DiscoverDependenciesInput) =>
      a2aClient.discoverRepositoryDependencies(input),
    onSuccess: (data: DiscoverDependenciesResponse) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['workflowMetadata'] });

      toast.success(
        data.message || `Successfully discovered ${data.dependencies_discovered} dependencies!`
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to discover dependencies: ${error.message}`);
    },
  });
}

/**
 * Update dependency verification confidence scores
 */
export function useUpdateDependencyVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDependencyVerificationInput) =>
      a2aClient.updateDependencyVerification(input),
    onSuccess: (data: UpdateDependencyVerificationResponse) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['workflowMetadata'] });

      toast.success(
        data.message || `Successfully updated ${data.updated_count} dependencies!`
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to update dependencies: ${error.message}`);
    },
  });
}

/**
 * Get workflow status with transformation for components
 * Converts backend response format to component-friendly format
 */
export function useWorkflowStatusTransformed(workflowId: string | null) {
  const baseQuery = useWorkflowStatus(workflowId);
  
  if (!baseQuery.data) {
    return {
      ...baseQuery,
      data: null,
      repositories: [],
      overall_progress: 0,
    };
  }

  const transformed = transformWorkflowResponse(baseQuery.data);
  
  return {
    ...baseQuery,
    data: transformed,
    repositories: transformed.repositories,
    overall_progress: transformed.overall_progress,
  };
}
