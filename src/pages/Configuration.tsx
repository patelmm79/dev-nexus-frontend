import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import toast from 'react-hot-toast';

interface Config {
  apiUrl: string;
  authToken: string;
  notificationsEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export default function Configuration() {
  const [config, setConfig] = useState<Config>({
    apiUrl: import.meta.env.VITE_API_BASE_URL || '',
    authToken: '',
    notificationsEnabled: true,
    autoRefresh: true,
    refreshInterval: 60,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('app-config', JSON.stringify(config));
      toast.success('Configuration saved successfully!');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage application settings and preferences
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Changes will be saved to your browser's local storage.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* API Settings */}
          <Box>
            <Typography variant="h6" gutterBottom>
              API Settings
            </Typography>
            <TextField
              fullWidth
              label="API Base URL"
              value={config.apiUrl}
              onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
              helperText="Backend API endpoint URL"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Authentication Token"
              type="password"
              value={config.authToken}
              onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
              helperText="Optional: For protected A2A endpoints"
            />
          </Box>

          <Divider />

          {/* App Settings */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Application Settings
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={config.notificationsEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, notificationsEnabled: e.target.checked })
                  }
                />
              }
              label="Enable notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.autoRefresh}
                  onChange={(e) => setConfig({ ...config, autoRefresh: e.target.checked })}
                />
              }
              label="Auto-refresh data"
            />
            {config.autoRefresh && (
              <TextField
                type="number"
                label="Refresh Interval (seconds)"
                value={config.refreshInterval}
                onChange={(e) =>
                  setConfig({ ...config, refreshInterval: parseInt(e.target.value) })
                }
                sx={{ mt: 2, width: '200px' }}
                inputProps={{ min: 10, max: 300 }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
