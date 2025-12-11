import { Typography, Box, Card, CardContent, Chip, CircularProgress, Alert } from '@mui/material';
import { Hub, CheckCircle, Error as ErrorIcon, Help } from '@mui/icons-material';
import { useExternalAgents } from '../hooks/usePatterns';
import { formatDistanceToNow } from 'date-fns';

export default function Agents() {
  const { data, isLoading, isError, error } = useExternalAgents();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'unhealthy':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle />;
      case 'unhealthy':
        return <ErrorIcon />;
      default:
        return <Help />;
    }
  };

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load agents: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        External Agents
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Monitor health and status of connected external agents
      </Typography>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3, mt: 2 }}>
          {data?.agents.map((agent) => (
            <Card key={agent.name}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Hub color="primary" />
                  <Typography variant="h6" component="div">
                    {agent.name}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={getStatusIcon(agent.status)}
                    label={agent.status}
                    color={getStatusColor(agent.status)}
                    size="small"
                  />
                  <Chip
                    label={`Checked ${formatDistanceToNow(new Date(agent.last_checked), { addSuffix: true })}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                  URL: {agent.url}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {!isLoading && (!data?.agents || data.agents.length === 0) && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No external agents configured
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure external agents in the backend to monitor their health status
          </Typography>
        </Box>
      )}
    </Box>
  );
}
