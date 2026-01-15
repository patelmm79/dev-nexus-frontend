import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { a2aClient } from '../services/a2aClient';

/**
 * Fetch complexity analysis for a repository
 */
export function useComplexityAnalysis(repository: string) {
  return useQuery({
    queryKey: ['complexityAnalysis', repository],
    queryFn: async () => {
      const result = await a2aClient.getComplexityAnalysis(repository);

      // Defensive check for response structure
      if (!result.success) {
        throw new Error('Failed to fetch complexity analysis');
      }

      return result;
    },
    enabled: !!repository,
    staleTime: 30 * 24 * 60 * 60 * 1000, // 30 days (matches backend staleness)
    gcTime: 35 * 24 * 60 * 60 * 1000, // 35 days
    retry: 1,
  });
}

/**
 * Refresh complexity analysis by invalidating cache and refetching
 */
export function useTriggerComplexityAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repository: string) => {
      // Invalidate cache to trigger a fresh fetch
      queryClient.invalidateQueries({ queryKey: ['complexityAnalysis', repository] });
      return Promise.resolve();
    },
    onSuccess: async (_, repository) => {
      // Refetch complexity analysis after invalidating
      await queryClient.refetchQueries({ queryKey: ['complexityAnalysis', repository] });
      toast.success('Complexity analysis refreshed successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to refresh analysis: ${error.message}`);
    },
  });
}

/**
 * Manual refresh with cache invalidation
 */
export function useRefreshComplexityAnalysis(repository: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['complexityAnalysis', repository] });
    queryClient.refetchQueries({ queryKey: ['complexityAnalysis', repository] });
  };
}
