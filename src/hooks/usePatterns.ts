import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { a2aClient, AddLessonLearnedInput } from '../services/a2aClient';
import toast from 'react-hot-toast';

/**
 * Hook to fetch health status
 */
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => a2aClient.healthCheck(),
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to fetch agent card
 */
export function useAgentCard() {
  return useQuery({
    queryKey: ['agentCard'],
    queryFn: () => a2aClient.getAgentCard(),
    staleTime: Infinity, // AgentCard rarely changes
  });
}

/**
 * Hook to fetch repository list
 */
export function useRepositories() {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: () => a2aClient.getRepositoryList(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch patterns for a specific repository
 */
export function usePatterns(repository: string, keywords?: string[]) {
  return useQuery({
    queryKey: ['patterns', repository, keywords],
    queryFn: () => a2aClient.queryPatterns(repository, keywords),
    enabled: !!repository, // Only run if repository is provided
  });
}

/**
 * Hook to fetch deployment info
 */
export function useDeploymentInfo(repository: string) {
  return useQuery({
    queryKey: ['deployment', repository],
    queryFn: () => a2aClient.getDeploymentInfo(repository),
    enabled: !!repository,
  });
}

/**
 * Hook to fetch cross-repo patterns
 */
export function useCrossRepoPatterns(minOccurrences: number = 2) {
  return useQuery({
    queryKey: ['crossRepoPatterns', minOccurrences],
    queryFn: () => a2aClient.getCrossRepoPatterns(minOccurrences),
  });
}

/**
 * Hook to fetch external agent health
 */
export function useExternalAgents() {
  return useQuery({
    queryKey: ['externalAgents'],
    queryFn: () => a2aClient.healthCheckExternal(),
    refetchInterval: 120000, // Refetch every 2 minutes
  });
}

/**
 * Hook to check documentation standards
 */
export function useDocumentationStandards(repository: string, filePaths?: string[]) {
  return useQuery({
    queryKey: ['documentationStandards', repository, filePaths],
    queryFn: () => a2aClient.checkDocumentationStandards(repository, filePaths),
    enabled: !!repository,
  });
}

/**
 * Mutation hook to add lesson learned
 */
export function useAddLessonLearned() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddLessonLearnedInput) => a2aClient.addLessonLearned(input),
    onSuccess: (_, variables) => {
      // Invalidate and refetch deployment info
      queryClient.invalidateQueries({ queryKey: ['deployment', variables.repository] });
      toast.success('Lesson learned added successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add lesson: ${error.message}`);
    },
  });
}

/**
 * Mutation hook to update dependency info
 */
export function useUpdateDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      repository: string;
      dependencyType: 'consumer' | 'derivative';
      dependentRepo: string;
      description: string;
    }) => a2aClient.updateDependencyInfo(
      params.repository,
      params.dependencyType,
      params.dependentRepo,
      params.description
    ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patterns', variables.repository] });
      toast.success('Dependency information updated!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update dependency: ${error.message}`);
    },
  });
}

/**
 * Mutation hook to add a repository
 */
export function useAddRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repository: string) => a2aClient.addRepository(repository),
    onSuccess: (data: { success: boolean; message?: string }) => {
      // Show backend-provided message when available
      if (data && data.message) {
        toast.success(data.message);
      } else {
        toast.success('Repository added successfully!');
      }

      // Invalidate repository list immediately, then refetch again after a short delay
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['repositories'] });
      }, 3000);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add repository: ${error.message}`);
    },
  });
}
