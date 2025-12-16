import { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { Hub, CheckCircle, Error as ErrorIcon, Help } from '@mui/icons-material';
import { useExternalAgents } from '../hooks/usePatterns';
import { formatDistanceToNow } from 'date-fns';
import { a2aClient } from '../services/a2aClient';

export default function Agents() {
  const { data, isLoading, isError, error } = useExternalAgents();
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<string>('');

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
          {Array.isArray(data?.agents) ? data.agents.map((agent) => (
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
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={running[agent.name] === true}
                    onClick={async () => {
                      try {
                        setRunning((s) => ({ ...s, [agent.name]: true }));
                        // Default to using agent.name as skill id; integration docs may provide exact skill ids
                        const skillId = agent.name;
                        const res = await a2aClient.executeSkill(skillId, {});
                        setDialogContent(JSON.stringify(res, null, 2));
                        setDialogOpen(true);
                      } catch (e: any) {
                        setDialogContent(String(e?.response?.data ?? e?.message ?? e));
                        setDialogOpen(true);
                      } finally {
                        setRunning((s) => ({ ...s, [agent.name]: false }));
                      }
                    }}
                  >
                    {running[agent.name] ? 'Running…' : 'Run'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )) : null}
        </Box>
      )}

      {!isLoading && (!Array.isArray(data?.agents) || data.agents.length === 0) && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No external agents configured
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure external agents in the backend to monitor their health status
          </Typography>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Agent Run Result</DialogTitle>
        <DialogContent>
          <DialogContentText component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {dialogContent}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
