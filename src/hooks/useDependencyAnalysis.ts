import { useQuery, useQueryClient } from '@tanstack/react-query';
import { a2aClient } from '../services/a2aClient';

/**
 * Hook to fetch component dependencies for a repository
 * @param repository - Repository name to analyze
 * @param componentName - Optional specific component to analyze
 * @param analysisDepth - Depth of dependency analysis (1-5)
 */
export function useComponentDependencies(
  repository: string,
  componentName?: string,
  analysisDepth: number = 3
) {
  return useQuery({
    queryKey: ['componentDependencies', repository, componentName, analysisDepth],
    queryFn: async () => {
      return await a2aClient.getComponentDependencies(
        repository,
        componentName,
        analysisDepth
      );
    },
    enabled: !!repository,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch dependencies for all components in a repository
 * Useful for building the dependency graph view
 */
export function useRepositoryDependencies(
  repository: string,
  analysisDepth: number = 2
) {
  return useQuery({
    queryKey: ['repositoryDependencies', repository, analysisDepth],
    queryFn: async () => {
      // Get dependencies for the entire repository (no specific component)
      return await a2aClient.getComponentDependencies(
        repository,
        undefined,
        analysisDepth
      );
    },
    enabled: !!repository,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook to manually refetch component dependencies
 */
export function useRefreshComponentDependencies() {
  const queryClient = useQueryClient();

  return {
    refetch: (repository: string, componentName?: string, analysisDepth?: number) => {
      return queryClient.refetchQueries({
        queryKey: ['componentDependencies', repository, componentName, analysisDepth],
      });
    },
    invalidate: (repository: string, componentName?: string) => {
      return queryClient.invalidateQueries({
        queryKey: ['componentDependencies', repository, componentName],
      });
    },
  };
}
