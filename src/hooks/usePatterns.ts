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
    onError: (error: any) => {
      // If backend returned a structured error, show it and list available skills
      const serverErr = error?.response?.data;
      if (serverErr) {
        const msg = serverErr.error || serverErr.message || JSON.stringify(serverErr);
        const skills = serverErr.available_skills;
        const skillMsg = Array.isArray(skills) && skills.length ? ` Available skills: ${skills.join(', ')}` : '';
        toast.error(`Failed to add repository: ${msg}${skillMsg}`);
        return;
      }

      toast.error(`Failed to add repository: ${error?.message ?? String(error)}`);
    },
  });
}

/**
 * Hook to validate repository architecture
 */
export function useValidateArchitecture(repository: string, validationScope?: string[]) {
  return useQuery({
    queryKey: ['validateArchitecture', repository, validationScope],
    queryFn: () => a2aClient.validateRepositoryArchitecture(repository, validationScope),
    enabled: !!repository,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Mutation hook to validate repository architecture
 */
export function useValidateArchitectureMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { repository: string; validationScope?: string[] }) =>
      a2aClient.validateRepositoryArchitecture(params.repository, params.validationScope),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['validateArchitecture', variables.repository, variables.validationScope], data);
      if (data.success) {
        toast.success('Repository validation completed!');
      } else {
        toast.error('Repository validation failed');
      }
    },
    onError: (error: Error) => {
      toast.error(`Validation error: ${error.message}`);
    },
  });
}

/**
 * Hook to check a specific standard
 */
export function useCheckSpecificStandard(repository: string, standardCategory: string) {
  return useQuery({
    queryKey: ['checkStandard', repository, standardCategory],
    queryFn: () => a2aClient.checkSpecificStandard(repository, standardCategory),
    enabled: !!repository && !!standardCategory,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Mutation hook to check a specific standard
 */
export function useCheckSpecificStandardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { repository: string; standardCategory: string }) =>
      a2aClient.checkSpecificStandard(params.repository, params.standardCategory),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['checkStandard', variables.repository, variables.standardCategory], data);
      toast.success('Standard check completed!');
    },
    onError: (error: Error) => {
      toast.error(`Standard check error: ${error.message}`);
    },
  });
}

/**
 * Hook to get improvement suggestions
 */
export function useSuggestImprovements(repository: string, maxRecommendations?: number) {
  return useQuery({
    queryKey: ['suggestImprovements', repository, maxRecommendations],
    queryFn: () => a2aClient.suggestImprovements(repository, maxRecommendations),
    enabled: !!repository,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Mutation hook to get improvement suggestions
 */
export function useSuggestImprovementsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { repository: string; maxRecommendations?: number }) =>
      a2aClient.suggestImprovements(params.repository, params.maxRecommendations),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['suggestImprovements', variables.repository, variables.maxRecommendations], data);
      toast.success('Improvement suggestions loaded!');
    },
    onError: (error: Error) => {
      toast.error(`Error fetching suggestions: ${error.message}`);
    },
  });
}

/**
 * Mutation hook to scan repository for components
 */
export function useScanComponents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repository: string) => a2aClient.scanRepositoryComponents(repository),
    onSuccess: async () => {
      console.log('Scan successful, invalidating queries');
      // Invalidate repositories list to refresh last_updated timestamps
      await queryClient.invalidateQueries({ queryKey: ['repositories'] });
      // Invalidate all listComponents queries (all pagination/filter variants)
      const invalidated = await queryClient.invalidateQueries({ queryKey: ['listComponents'], exact: false });
      console.log('Invalidated listComponents queries:', invalidated);
      // Refetch immediately for better UX
      await queryClient.refetchQueries({ queryKey: ['repositories'] });
      await queryClient.refetchQueries({ queryKey: ['listComponents'], exact: false });
      console.log('Refetch complete');
      toast.success('Components scanned successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to scan components: ${error.message}`);
    },
  });
}

/**
 * Hook to list components with filtering and pagination
 */
export function useListComponents(
  repository?: string,
  componentType?: string,
  limit: number = 100,
  offset: number = 0
) {
  return useQuery({
    queryKey: ['listComponents', repository, componentType, limit, offset],
    queryFn: async () => {
      console.log('useListComponents queryFn called with:', { repository, componentType, limit, offset });
      const result = await a2aClient.listComponents(repository, componentType, limit, offset);

      // Handle backend errors
      if ((result as any).error) {
        console.error('listComponents API error:', {
          error: (result as any).error,
          available_skills: (result as any).available_skills,
        });
        // Return empty result on error so UI doesn't crash
        return { success: false, components: [], total_count: 0, filtered_count: 0, offset: 0, limit: 0 } as any;
      }

      console.log('listComponents result:', { repository, result });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!repository, // Only fetch if repository is provided
  });
}
