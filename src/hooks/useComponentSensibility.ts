import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { a2aClient } from '../services/a2aClient';
import toast from 'react-hot-toast';

// ============================================
// Query Hooks (Read-Only Data Fetching)
// ============================================

/**
 * Fetch list of components with optional filtering
 */
export function useListComponents(
  repository?: string,
  componentType?: string,
  limit: number = 100,
  offset: number = 0
) {
  return useQuery({
    queryKey: ['listComponents', repository, componentType, limit, offset],
    queryFn: () => a2aClient.listComponents(repository, componentType, limit, offset),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Detect misplaced and duplicated components across repositories
 */
export function useDetectMisplacedComponents(
  repository?: string,
  options?: {
    component_types?: string[];
    min_similarity_score?: number;
    include_diverged?: boolean;
    top_k_matches?: number;
  }
) {
  return useQuery({
    queryKey: ['misplacedComponents', repository, options],
    queryFn: () => a2aClient.detectMisplacedComponents(repository, options),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Analyze a specific component's centrality and optimal location
 */
export function useAnalyzeComponentCentrality(
  component_name: string,
  current_location: string,
  candidate_locations?: string[]
) {
  return useQuery({
    queryKey: ['componentCentrality', component_name, current_location, candidate_locations],
    queryFn: () => a2aClient.analyzeComponentCentrality(component_name, current_location, candidate_locations),
    enabled: !!component_name && !!current_location,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch consolidation plan for a specific component
 */
export function useRecommendConsolidationPlan(
  component_name: string,
  from_repository: string,
  options?: {
    to_repository?: string;
    include_impact_analysis?: boolean;
    include_deep_analysis?: boolean;
  }
) {
  return useQuery({
    queryKey: ['consolidationPlan', component_name, from_repository, options],
    queryFn: () => a2aClient.recommendConsolidationPlan(component_name, from_repository, options),
    enabled: !!component_name && !!from_repository,
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
      repository?: string;
      options?: {
        component_types?: string[];
        min_similarity_score?: number;
        include_diverged?: boolean;
        top_k_matches?: number;
      };
    }) => a2aClient.detectMisplacedComponents(params.repository, params.options),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ['misplacedComponents', variables.repository, variables.options],
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
    mutationFn: (params: {
      component_name: string;
      current_location: string;
      candidate_locations?: string[];
    }) => a2aClient.analyzeComponentCentrality(params.component_name, params.current_location, params.candidate_locations),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['componentCentrality', variables.component_name, variables.current_location, variables.candidate_locations], data);
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
    mutationFn: (params: {
      component_name: string;
      from_repository: string;
      options?: {
        to_repository?: string;
        include_impact_analysis?: boolean;
        include_deep_analysis?: boolean;
      };
    }) => a2aClient.recommendConsolidationPlan(params.component_name, params.from_repository, params.options),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['consolidationPlan', variables.component_name, variables.from_repository, variables.options], data);
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

