import { useQuery } from '@tanstack/react-query';
import { a2aClient } from '../services/a2aClient';

/**
 * Hook to fetch dashboard overview with system health metrics and alerts
 * Uses aggressive caching with 2-minute stale time for frequently-changing data
 */
export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: async () => {
      return await a2aClient.getDashboardOverview();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch pattern adoption trends over time
 * @param startDate - Optional start date for trend analysis
 * @param endDate - Optional end date for trend analysis
 */
export function usePatternAdoptionTrends(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['patternAdoptionTrends', startDate, endDate],
    queryFn: async () => {
      return await a2aClient.getPatternAdoptionTrends(startDate, endDate);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch pattern health summary with health scores and trends
 * Stable data, longer cache time
 */
export function usePatternHealthSummary() {
  return useQuery({
    queryKey: ['patternHealthSummary'],
    queryFn: async () => {
      return await a2aClient.getPatternHealthSummary();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch component duplication statistics and consolidation progress
 * Stable data, moderate cache time
 */
export function useComponentDuplicationStats() {
  return useQuery({
    queryKey: ['componentDuplicationStats'],
    queryFn: async () => {
      return await a2aClient.getComponentDuplicationStats();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch repository activity summary
 * @param period - Time period to analyze (day/week/month)
 * @param limit - Maximum number of repositories to return
 */
export function useRepositoryActivitySummary(
  period: 'day' | 'week' | 'month' = 'week',
  limit: number = 10
) {
  return useQuery({
    queryKey: ['repositoryActivitySummary', period, limit],
    queryFn: async () => {
      return await a2aClient.getRepositoryActivitySummary(period, limit);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
