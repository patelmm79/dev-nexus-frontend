import { useState } from 'react';
import { Box, Container, Typography, Card, CardContent } from '@mui/material';
import RepositoryForm from '../../components/workflow/RepositoryForm';
import WorkflowProgress from '../../components/workflow/WorkflowProgress';
import WorkflowResults from '../../components/workflow/WorkflowResults';
import { useTriggerWorkflow, useWorkflowStatus, useUpdateDependencyVerification } from '../../hooks/useWorkflow';

type WorkflowPhase = 'configure' | 'executing' | 'results';

export default function RepositoryInitialize() {
  const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>('configure');
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  // Hooks for API calls
  const triggerWorkflowMutation = useTriggerWorkflow();
  const { data: workflowStatus, refetch: refetchStatus, isLoading: isStatusLoading } = useWorkflowStatus(workflowId);
  const updateDepsMutation = useUpdateDependencyVerification();

  const handleStartWorkflow = async (
    repositories: string[],
    config: {
      patternExtraction: boolean;
      dependencyDiscovery: boolean;
    }
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
        setWorkflowId(result.workflow_id);
        setCurrentPhase('executing');
      }
    } catch (error) {
      // Error handled by mutation hook toast
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
  };

  const handleUpdateDependencies = async (deps: any[]) => {
    try {
      await updateDepsMutation.mutateAsync({
        dependencies: deps,
      });
    } catch (error) {
      // Error handled by mutation hook toast
      console.error('Failed to update dependencies:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Repository Workflow Orchestration
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Automate pattern extraction and dependency discovery across multiple repositories.
        </Typography>
      </Box>

      {/* Progress Indicator */}
      <Card sx={{ mb: 4, backgroundColor: 'action.hover' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flex: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  opacity: currentPhase === 'configure' ? 1 : 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor:
                      currentPhase === 'configure' ? 'primary.main' : 'divider',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  1
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Configure
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  backgroundColor:
                    currentPhase !== 'configure' ? 'primary.main' : 'divider',
                  mt: 2,
                }}
              />

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  opacity: currentPhase === 'executing' ? 1 : 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor:
                      currentPhase === 'executing' ? 'primary.main' : 'divider',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  2
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Execute
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  backgroundColor:
                    currentPhase === 'results' ? 'primary.main' : 'divider',
                  mt: 2,
                }}
              />

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  opacity: currentPhase === 'results' ? 1 : 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor:
                      currentPhase === 'results' ? 'primary.main' : 'divider',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  3
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Results
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Phase Content */}
      <Box sx={{ minHeight: '500px' }}>
        {currentPhase === 'configure' && (
          <RepositoryForm
            onStartWorkflow={handleStartWorkflow}
            isLoading={triggerWorkflowMutation.isPending}
          />
        )}

        {currentPhase === 'executing' && workflowId && (
          <WorkflowProgress
            workflowId={workflowId}
            status={workflowStatus || undefined}
            isLoading={isStatusLoading}
            onViewResults={handleViewResults}
            onRefresh={handleRefreshStatus}
          />
        )}

        {currentPhase === 'results' && (
          <WorkflowResults
            workflowStatus={workflowStatus || undefined}
            dependencies={[]} // TODO: Fetch from workflow results
            metadata={[]} // TODO: Fetch from workflow results
            onStartNew={handleStartNew}
            onUpdateDependencies={handleUpdateDependencies}
            isLoading={updateDepsMutation.isPending}
          />
        )}
      </Box>
    </Container>
  );
}
