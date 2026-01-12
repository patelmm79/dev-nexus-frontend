/**
 * Workflow Response Transformation Layer
 *
 * Adapts backend WorkflowStatusResponse to component-friendly format.
 * Backend returns repositories as strings, components expect objects with status/phases.
 */

import { WorkflowStatusResponse } from '../services/a2aClient'

/**
 * Repository status after transformation
 */
export interface TransformedRepository {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  patterns_extracted: number
  dependencies_discovered: number
  phases: Array<{
    name: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    error?: string
  }>
  error?: string
}

/**
 * Transform backend WorkflowStatusResponse to component-friendly format
 *
 * Phase 12: Backend now returns standardized progress metrics
 * - repositories_count: Total repositories in workflow
 * - repositories_completed: Number of completed repositories
 * - progress_percent: Overall progress 0-100%
 * - results: Optional detailed results by repository
 *
 * This creates component-friendly format with repositories array and overall progress
 */
export function transformWorkflowResponse(response: WorkflowStatusResponse): {
  repositories: TransformedRepository[]
  overall_progress: number
  status: string
  workflow_id: string
} {
  // Phase 12: Use new standardized progress metrics
  const overall_progress = response.progress_percent || 0
  const totalRepos = response.repositories_count || 0
  const completedRepos = response.repositories_completed || 0

  // Build transformed repositories array from results
  const transformedRepos: TransformedRepository[] = []

  if (response.results && Array.isArray(response.results)) {
    // Group results by repository if available
    const repoResultsMap = new Map<string, any>()

    response.results.forEach((result: any) => {
      const repoName = (result.repository || result.name || '') as string
      if (repoName) {
        repoResultsMap.set(repoName, result)
      }
    })

    // Transform each result into a repository object
    repoResultsMap.forEach((resultData, repoName) => {
      const repo: TransformedRepository = {
        name: repoName,
        status: (resultData.status as any) || 'pending',
        patterns_extracted: resultData.patterns_extracted || 0,
        dependencies_discovered: resultData.dependencies_discovered || 0,
        phases: resultData.phases || [],
        error: resultData.error,
      }
      transformedRepos.push(repo)
    })
  } else if (totalRepos > 0) {
    // Fallback: Create placeholder repositories when detailed results unavailable
    // This handles cases where backend only provides summary metrics
    for (let i = 0; i < totalRepos; i++) {
      transformedRepos.push({
        name: `Repository ${i + 1}`,
        status: i < completedRepos ? 'completed' : 'running',
        patterns_extracted: 0,
        dependencies_discovered: 0,
        phases: [],
      })
    }
  }

  return {
    repositories: transformedRepos,
    overall_progress,
    status: response.status,
    workflow_id: response.workflow_id,
  }
}
