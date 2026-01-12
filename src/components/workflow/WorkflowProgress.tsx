import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Alert,
  Typography,
  LinearProgress,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { WorkflowStatusResponse } from '../../services/a2aClient';

export interface WorkflowProgressProps {
  workflowId: string;
  status?: WorkflowStatusResponse;
  isLoading?: boolean;
  onViewResults: () => void;
  onRefresh: () => void;
}

export default function WorkflowProgress({
  workflowId,
  status,
  isLoading = false,
  onViewResults,
  onRefresh,
}: WorkflowProgressProps) {
  // Debug logging
  console.log('🔍 WorkflowProgress debug:', {
    workflowId,
    status,
    isLoading,
    hasRepositories: status?.repositories?.length || 0,
  });

  const isComplete =
    status && (status.status === 'completed' || status.status === 'failed');

  const getPhaseColor = (
    phaseStatus: 'pending' | 'running' | 'completed' | 'failed'
  ) => {
    switch (phaseStatus) {
      case 'pending':
        return '#9e9e9e';
      case 'running':
        return '#ff9800';
      case 'completed':
        return '#4caf50';
      case 'failed':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getPhaseIcon = (
    phaseStatus: 'pending' | 'running' | 'completed' | 'failed'
  ) => {
    switch (phaseStatus) {
      case 'pending':
        return '⏳';
      case 'running':
        return '⚙️';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '?';
    }
  };

  if (!status) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Overall Progress */}
      <Card>
        <CardHeader
          title="Workflow Progress"
          action={
            <Tooltip title="Refresh status">
              <IconButton
                onClick={onRefresh}
                disabled={isLoading}
                color="primary"
                size="small"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Overall Progress: {status.overall_progress}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={status.overall_progress}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>

            {status.status === 'failed' && (
              <Alert severity="error">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Workflow Failed
                </Typography>
                {status.error && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    {status.error}
                  </Typography>
                )}
              </Alert>
            )}

            {!isComplete && (
              <Alert severity="info">
                <Typography variant="body2">
                  Workflow is in progress. Click refresh to see updates.
                </Typography>
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Repository Status Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {(status.repositories || []).map((repo) => (
          <Card key={repo.name} sx={{ height: '100%' }}>
            <CardHeader
              title={repo.name}
              subheader={`Status: ${repo.status}`}
              avatar={
                <Chip
                  label={repo.status}
                  size="small"
                  color={
                    repo.status === 'completed'
                      ? 'success'
                      : repo.status === 'failed'
                        ? 'error'
                        : repo.status === 'running'
                          ? 'warning'
                          : 'default'
                  }
                  variant="outlined"
                />
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <Stack spacing={2}>
                {/* Phase Timeline */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Analysis Phases
                  </Typography>
                  {(repo.phases || []).map((phase, idx) => (
                    <Box
                      key={phase.name}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: idx < repo.phases.length - 1 ? 1 : 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: getPhaseColor(phase.status),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      >
                        {getPhaseIcon(phase.status)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {phase.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {phase.status}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Results Summary */}
                {repo.patterns_extracted !== undefined && repo.dependencies_discovered !== undefined && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Results
                    </Typography>
                    <Typography variant="body2">
                      📊 Patterns: {repo.patterns_extracted}
                    </Typography>
                    <Typography variant="body2">
                      🔗 Dependencies: {repo.dependencies_discovered}
                    </Typography>
                  </Box>
                )}

                {/* Error Display */}
                {repo.error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    <Typography variant="caption">{repo.error}</Typography>
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {isComplete && (
          <Button
            variant="contained"
            size="large"
            onClick={onViewResults}
            sx={{ minWidth: 200 }}
          >
            View Results
          </Button>
        )}
      </Box>

      {/* Workflow ID for reference */}
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        Workflow ID: {workflowId}
      </Typography>
    </Box>
  );
}
