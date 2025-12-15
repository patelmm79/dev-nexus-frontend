import { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import { Info, ContentCopy } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useRepositories, useDeploymentInfo } from '../hooks/usePatterns';

export default function Deployment() {
  const { data: repos, isLoading: reposLoading } = useRepositories();
  const [selected, setSelected] = useState<string>('');

  const deploymentQuery = useDeploymentInfo(selected || '');

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Command copied to clipboard');
    } catch (e) {
      toast.error('Failed to copy');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Deployment
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        View deployment information, scripts, and lessons learned
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Alert severity="info" icon={<Info />}>
          Select a repository to load its deployment information and available actions.
        </Alert>

        <Box sx={{ mt: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="repo-select-label">Repository</InputLabel>
            <Select
              labelId="repo-select-label"
              value={selected}
              label="Repository"
              onChange={(e) => setSelected(e.target.value as string)}
              disabled={reposLoading || !repos}
            >
              {(repos?.repositories || []).map((r) => (
                <MenuItem key={r.name} value={r.name}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selected && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6">Deployment Scripts</Typography>

              {deploymentQuery.isLoading ? (
                <Typography>Loading deployment info...</Typography>
              ) : deploymentQuery.isError ? (
                <Alert severity="error">Failed to load deployment info</Alert>
              ) : (
                <List>
                  {deploymentQuery.data?.deployment?.scripts?.length ? (
                    deploymentQuery.data.deployment.scripts.map((script, idx) => (
                      <ListItem key={idx} secondaryAction={
                        <IconButton edge="end" onClick={() => handleCopy(script.commands.join('\n'))}>
                          <ContentCopy />
                        </IconButton>
                      }>
                        <ListItemText
                          primary={script.name}
                          secondary={script.description}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">No deployment scripts available</Typography>
                  )}
                </List>
              )}

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => window.location.assign('/repositories')}
                >
                  Manage Repositories
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
