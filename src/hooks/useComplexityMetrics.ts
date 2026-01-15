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
 * Trigger new complexity analysis
 */
export function useTriggerComplexityAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repository: string) => a2aClient.triggerComplexityAnalysis(repository),
    onSuccess: async (_, repository) => {
      // Invalidate and refetch complexity analysis
      await queryClient.invalidateQueries({ queryKey: ['complexityAnalysis', repository] });
      await queryClient.refetchQueries({ queryKey: ['complexityAnalysis', repository] });
      toast.success('Complexity analysis triggered successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to trigger analysis: ${error.message}`);
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
