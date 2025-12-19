import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { a2aClient } from '../services/a2aClient';
import toast from 'react-hot-toast';

// ============================================
// Query Hooks (Read-Only Data Fetching)
// ============================================

/**
 * Fetch misplaced components for a repository
 */
export function useDetectMisplacedComponents(
  repository: string,
  filters?: {
    component_type?: string[];
    similarity_threshold?: number;
  }
) {
  return useQuery({
    queryKey: ['misplacedComponents', repository, filters],
    queryFn: () => a2aClient.detectMisplacedComponents(repository, filters),
    enabled: !!repository,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch component centrality analysis with 6-factor scoring
 */
export function useAnalyzeComponentCentrality(repository: string) {
  return useQuery({
    queryKey: ['componentCentrality', repository],
    queryFn: () => a2aClient.analyzeComponentCentrality(repository),
    enabled: !!repository,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch consolidation plan recommendations
 */
export function useRecommendConsolidationPlan(repository: string) {
  return useQuery({
    queryKey: ['consolidationPlan', repository],
    queryFn: () => a2aClient.recommendConsolidationPlan(repository),
    enabled: !!repository,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// ============================================
// Mutation Hooks (Manual Triggering)
// ============================================

/**
 * Mutation to detect misplaced components
 */
export function useDetectMisplacedComponentsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      repository: string;
      filters?: {
        component_type?: string[];
        similarity_threshold?: number;
      };
    }) => a2aClient.detectMisplacedComponents(params.repository, params.filters),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ['misplacedComponents', variables.repository, variables.filters],
        data
      );
      if (data.success) {
        toast.success('Component detection completed!');
      } else {
        toast.error('Component detection failed');
      }
    },
    onError: (error: Error) => {
      toast.error(`Detection error: ${error.message}`);
    },
  });
}

/**
 * Mutation to analyze component centrality
 */
export function useAnalyzeComponentCentralityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repository: string) => a2aClient.analyzeComponentCentrality(repository),
    onSuccess: (data, repository) => {
      queryClient.setQueryData(['componentCentrality', repository], data);
      if (data.success) {
        toast.success('Centrality analysis completed!');
      } else {
        toast.error('Centrality analysis failed');
      }
    },
    onError: (error: Error) => {
      toast.error(`Analysis error: ${error.message}`);
    },
  });
}

/**
 * Mutation to recommend consolidation plan
 */
export function useRecommendConsolidationPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repository: string) => a2aClient.recommendConsolidationPlan(repository),
    onSuccess: (data, repository) => {
      queryClient.setQueryData(['consolidationPlan', repository], data);
      if (data.success) {
        toast.success('Consolidation plan generated!');
      } else {
        toast.error('Plan generation failed');
      }
    },
    onError: (error: Error) => {
      toast.error(`Plan error: ${error.message}`);
    },
  });
}

// ============================================
// Utility Hooks for Combined Data
// ============================================

/**
 * Fetch all component analysis data for a repository
 */
export function useComponentAnalysis(repository: string) {
  const misplacedComponents = useDetectMisplacedComponents(repository);
  const componentCentrality = useAnalyzeComponentCentrality(repository);
  const consolidationPlan = useRecommendConsolidationPlan(repository);

  return {
    misplacedComponents,
    componentCentrality,
    consolidationPlan,
    isLoading:
      misplacedComponents.isLoading ||
      componentCentrality.isLoading ||
      consolidationPlan.isLoading,
    isError:
      misplacedComponents.isError ||
      componentCentrality.isError ||
      consolidationPlan.isError,
    error:
      misplacedComponents.error ||
      componentCentrality.error ||
      consolidationPlan.error,
  };
}
