import { useState } from 'react';
import { Box, Container, Typography, Card, CardContent } from '@mui/material';
import RepositoryForm from '../../components/workflow/RepositoryForm';
import WorkflowProgress from '../../components/workflow/WorkflowProgress';
import WorkflowResults from '../../components/workflow/WorkflowResults';
import { useTriggerWorkflow, useWorkflowStatus, useUpdateDependencyVerification } from '../../hooks/useWorkflow';

type WorkflowPhase = 'configure' | 'executing' | 'results';

// Helper function to transform TriggerFullAnalysisResponse into a format compatible with WorkflowResults
function transformWorkflowResults(result: any): any {
  if (!result) return undefined;

  const repositoriesByName = new Map<string, any>();

  result.workflow_steps?.forEach((step: any) => {
    const repo = step.repository;
    if (!repositoriesByName.has(repo)) {
      repositoriesByName.set(repo, {
        name: repo,
        status: 'completed',
        patterns_extracted: 0,
        dependencies_discovered: 0,
        phases: [],
      });
    }

    const repoData = repositoriesByName.get(repo);
    repoData.phases.push({
      name: step.phase,
      status: step.status,
      error: step.result?.error,
    });

    if (step.result?.patterns_extracted) {
      repoData.patterns_extracted = step.result.patterns_extracted;
    }
    if (step.result?.dependencies_discovered) {
      repoData.dependencies_discovered = step.result.dependencies_discovered;
    }
  });

  return {
    success: result.success,
    status: 'completed',
    repositories: Array.from(repositoriesByName.values()),
    overall_progress: 100,
  };
}

export default function RepositoryInitialize() {
  const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>('configure');
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowResults, setWorkflowResults] = useState<any>(null);

  const triggerWorkflowMutation = useTriggerWorkflow();
  const { data: workflowStatus, refetch: refetchStatus, isLoading: isStatusLoading } = useWorkflowStatus(workflowId);
  const updateDepsMutation = useUpdateDependencyVerification();

  const handleStartWorkflow = async (
    repositories: string[],
    config: { patternExtraction: boolean; dependencyDiscovery: boolean }
  ) => {
    try {
      const result = await triggerWorkflowMutation.mutateAsync({
        repository_names: repositories,
        phases: {
          pattern_extraction: config.patternExtraction,
          dependency_discovery: config.dependencyDiscovery,
        },
      });

      if (result.success) {
        setWorkflowResults(result);
        setCurrentPhase('results');
      }
    } catch (error) {
      console.error('Failed to start workflow:', error);
    }
  };

  const handleRefreshStatus = async () => {
    await refetchStatus();
  };

  const handleViewResults = () => {
    setCurrentPhase('results');
  };

  const handleStartNew = () => {
    setCurrentPhase('configure');
    setWorkflowId(null);
    setWorkflowResults(null);
  };

  const handleUpdateDependencies = async (deps: any[]) => {
    try {
      await updateDepsMutation.mutateAsync({ dependencies: deps });
    } catch (error) {
      console.error('Failed to update dependencies:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Repository Workflow Orchestration
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Automate pattern extraction and dependency discovery across multiple repositories.
        </Typography>
      </Box>

      <Card sx={{ mb: 4, backgroundColor: 'action.hover' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: currentPhase === 'configure' ? 1 : 0.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: currentPhase === 'configure' ? 'primary.main' : 'divider', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Configure</Typography>
              </Box>
              <Box sx={{ flex: 1, height: 2, backgroundColor: currentPhase !== 'configure' ? 'primary.main' : 'divider', mt: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: currentPhase === 'executing' ? 1 : 0.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: currentPhase === 'executing' ? 'primary.main' : 'divider', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Execute</Typography>
              </Box>
              <Box sx={{ flex: 1, height: 2, backgroundColor: currentPhase === 'results' ? 'primary.main' : 'divider', mt: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: currentPhase === 'results' ? 1 : 0.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: currentPhase === 'results' ? 'primary.main' : 'divider', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Results</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ minHeight: '500px' }}>
        {currentPhase === 'configure' && (
          <RepositoryForm onStartWorkflow={handleStartWorkflow} isLoading={triggerWorkflowMutation.isPending} />
        )}
        {currentPhase === 'executing' && workflowId && (
          <WorkflowProgress workflowId={workflowId} status={workflowStatus || undefined} isLoading={isStatusLoading} onViewResults={handleViewResults} onRefresh={handleRefreshStatus} />
        )}
        {currentPhase === 'results' && (
          <WorkflowResults workflowStatus={transformWorkflowResults(workflowResults)} dependencies={[]} metadata={[]} onStartNew={handleStartNew} onUpdateDependencies={handleUpdateDependencies} isLoading={updateDepsMutation.isPending} />
        )}
      </Box>
    </Container>
  );
}
