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
  CircularProgress,
} from '@mui/material';
import { Save, PlayArrow } from '@mui/icons-material';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Config {
  apiUrl: string;
  authToken: string;
  notificationsEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export default function Configuration() {
  const [config, setConfig] = useState<Config>(() => {
    // Load from localStorage first, fall back to environment variable
    const saved = localStorage.getItem('app-config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
    return {
      apiUrl: import.meta.env.VITE_API_BASE_URL || '',
      authToken: '',
      notificationsEnabled: true,
      autoRefresh: true,
      refreshInterval: 60,
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    if (!config.apiUrl.trim()) {
      toast.error('Please enter an API URL first');
      return;
    }

    setIsTesting(true);
    try {
      const response = await axios.get(`${config.apiUrl}/health`, {
        timeout: 5000,
        headers: config.authToken ? { Authorization: `Bearer ${config.authToken}` } : undefined,
      });

      if (response.data?.status === 'healthy' || response.data?.status) {
        toast.success('✓ Connection successful! API is reachable.');
      } else {
        toast.success('✓ Connected! Got response from API.');
      }
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        toast.error('✗ Connection timeout - API took too long to respond');
      } else if (error.response?.status === 401) {
        toast.error('✗ Authentication failed - check your token');
      } else if (error.response?.status === 404) {
        toast.error('✗ API endpoint not found - check the URL');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('✗ Network error - cannot reach the API URL');
      } else {
        toast.error(`✗ Connection failed: ${error.message}`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('app-config', JSON.stringify(config));

      // Update the a2aClient with new API URL and auth token
      const { a2aClient } = await import('../services/a2aClient');

      if (config.apiUrl) {
        a2aClient.setBaseUrl(config.apiUrl);
      }

      if (config.authToken) {
        a2aClient.setAuthToken(config.authToken);
      } else {
        a2aClient.clearAuthToken();
      }

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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
              <TextField
                fullWidth
                label="API Base URL"
                value={config.apiUrl}
                onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                helperText="Backend API endpoint URL (e.g., https://your-api.com)"
              />
              <Button
                variant="outlined"
                startIcon={isTesting ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={handleTestConnection}
                disabled={isTesting || !config.apiUrl.trim()}
                sx={{ mt: 1, minWidth: 120 }}
              >
                {isTesting ? 'Testing...' : 'Test'}
              </Button>
            </Box>
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
