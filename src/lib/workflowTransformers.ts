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
 * Backend returns:
 * - repositories: ["repo1", "repo2"] (strings)
 * - results: [{repository: "repo1", phase: "...", ...}] (flat array)
 *
 * This creates:
 * - repositories: [{name: "repo1", status: "...", phases: [...]}] (objects)
 */
export function transformWorkflowResponse(response: WorkflowStatusResponse): {
  repositories: TransformedRepository[]
  overall_progress: number
  status: string
  workflow_id: string
} {
  // Map of repo name to its phases
  const repoPhases = new Map<string, any[]>()

  // Initialize all repos
  response.repositories.forEach(repoName => {
    repoPhases.set(repoName, [])
  })

  // Extract phases from results array
  const phasesByRepo = new Map<string, Map<string, any>>()
  if (response.results && Array.isArray(response.results)) {
    response.results.forEach((result: any) => {
      const repo = (result.repository as string) || ''
      if (!phasesByRepo.has(repo)) {
        phasesByRepo.set(repo, new Map())
      }

      const phaseName = (result.phase as string) || 'unknown'
      phasesByRepo.get(repo)?.set(phaseName, result)
    })
  }

  // Build transformed repositories array
  const transformedRepos: TransformedRepository[] = response.repositories.map((repoName: string) => {
    const repoResults = phasesByRepo.get(repoName) || new Map()

    // Determine overall repo status (if any phase failed, repo failed)
    let repoStatus: 'pending' | 'running' | 'completed' | 'failed' = 'pending'
    let hasCompleted = false
    let hasRunning = false
    let hasFailed = false

    repoResults.forEach(result => {
      const phaseStatus = result.status || 'pending'
      if (phaseStatus === 'failed') hasFailed = true
      if (phaseStatus === 'running') hasRunning = true
      if (phaseStatus === 'completed') hasCompleted = true
    })

    if (hasFailed) repoStatus = 'failed'
    else if (hasRunning) repoStatus = 'running'
    else if (hasCompleted) repoStatus = 'completed'

    // Build phases array
    const phases = Array.from(repoResults.entries()).map(([phaseName, phaseData]) => ({
      name: phaseName,
      status: phaseData.status || 'pending',
      error: phaseData.error,
    }))

    return {
      name: repoName,
      status: repoStatus,
      patterns_extracted: repoResults.get('pattern_extraction' as string)?.patterns_extracted || 0,
      dependencies_discovered: repoResults.get('dependency_discovery' as string)?.dependencies_discovered || 0,
      phases,
      error: repoResults.get('error' as string),
    }
  })

  // Calculate overall progress
  const totalRepos = transformedRepos.length
  const completedRepos = transformedRepos.filter(r => r.status === 'completed').length
  const overall_progress = totalRepos > 0 ? Math.round((completedRepos / totalRepos) * 100) : 0

  return {
    repositories: transformedRepos,
    overall_progress,
    status: response.status,
    workflow_id: response.workflow_id,
  }
}
