import { Box, Card, CardContent, Typography, Chip, Stack } from '@mui/material';
import { Sync, CheckCircle, Error as ErrorIcon, Pause } from '@mui/icons-material';
import { A2AIntegrationStatus as A2AStatusType } from '../../services/a2aClient';

interface A2AIntegrationStatusProps {
  integration?: A2AStatusType;
}

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle sx={{ fontSize: '1rem', color: '#4caf50' }} />;
    case 'error':
      return <ErrorIcon sx={{ fontSize: '1rem', color: '#f44336' }} />;
    case 'skipped':
      return <Pause sx={{ fontSize: '1rem', color: '#9e9e9e' }} />;
    default:
      return <Sync sx={{ fontSize: '1rem', color: '#2196f3' }} />;
  }
};

const getStatusColor = (status?: string): any => {
  switch (status) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'skipped':
      return 'default';
    default:
      return 'info';
  }
};

export default function A2AIntegrationStatus({ integration }: A2AIntegrationStatusProps) {
  if (!integration) {
    return null;
  }

  const agents = [
    { name: 'Monitoring Agent', key: 'monitoring' as const },
    { name: 'Orchestrator Agent', key: 'orchestrator' as const },
    { name: 'Pattern Miner Agent', key: 'pattern_miner' as const },
  ];

  const hasAnyStatus = agents.some((agent) => integration[agent.key]);

  if (!hasAnyStatus) {
    return null;
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Sync sx={{ color: '#2196f3' }} />
          <Typography variant="h6">A2A Integration Status</Typography>
        </Box>

        <Stack spacing={1.5}>
          {agents.map((agent) => {
            const status = integration[agent.key]?.status;
            if (!status) return null;

            return (
              <Box
                key={agent.key}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  background:
                    status === 'success'
                      ? 'rgba(76, 175, 80, 0.1)'
                      : status === 'error'
                      ? 'rgba(244, 67, 54, 0.1)'
                      : 'rgba(158, 158, 158, 0.1)',
                  border: '1px solid',
                  borderColor:
                    status === 'success'
                      ? 'rgba(76, 175, 80, 0.3)'
                      : status === 'error'
                      ? 'rgba(244, 67, 54, 0.3)'
                      : 'rgba(158, 158, 158, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(status)}
                  <Typography variant="body2">{agent.name}</Typography>
                </Box>
                <Chip
                  label={status?.charAt(0).toUpperCase() + (status?.slice(1) || '')}
                  size="small"
                  color={getStatusColor(status)}
                  variant="outlined"
                />
              </Box>
            );
          })}
        </Stack>

        <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
          Integration status shows which external agents were notified of this validation.
        </Typography>
      </CardContent>
    </Card>
  );
}
