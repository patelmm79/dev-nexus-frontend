import { Typography, Box, Paper, Alert } from '@mui/material';
import { Info } from '@mui/icons-material';

export default function Deployment() {
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
          Select a repository from the Repositories page to view its deployment information.
        </Alert>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Available Features
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • View deployment scripts and configurations
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Browse lessons learned from past deployments
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Track CI/CD platform information
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Explore reusable deployment components
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
