import { Box, Card, CardContent, Typography, Chip, Stack } from '@mui/material';
import { Warning, Error as ErrorIcon, Info } from '@mui/icons-material';
import { ComplianceViolation } from '../../services/a2aClient';

interface ComplianceViolationsListProps {
  violations: ComplianceViolation[];
  title?: string;
}

const getSeverityColor = (severity: 'critical' | 'high' | 'medium' | 'low'): any => {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'default';
  }
};

const getSeverityIcon = (severity: 'critical' | 'high' | 'medium' | 'low') => {
  switch (severity) {
    case 'critical':
      return <ErrorIcon sx={{ fontSize: '1rem' }} />;
    case 'high':
      return <Warning sx={{ fontSize: '1rem' }} />;
    case 'medium':
      return <Info sx={{ fontSize: '1rem' }} />;
    case 'low':
      return <Info sx={{ fontSize: '1rem' }} />;
  }
};

export default function ComplianceViolationsList({
  violations,
  title = 'Violations',
}: ComplianceViolationsListProps) {
  if (violations.length === 0) {
    return (
      <Card sx={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#4caf50' }}>
            ✓ No violations found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            All compliance checks passed!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          {title} ({violations.length})
        </Typography>
        <Stack spacing={1.5}>
          {violations.map((violation, idx) => (
            <Box
              key={idx}
              sx={{
                p: 1.5,
                borderLeft: '4px solid',
                borderColor: getSeverityColor(violation.severity) === 'error' ? '#f44336' :
                             getSeverityColor(violation.severity) === 'warning' ? '#ff9800' :
                             getSeverityColor(violation.severity) === 'info' ? '#2196f3' : '#9e9e9e',
                borderRadius: 1,
                background: getSeverityColor(violation.severity) === 'error' ? 'rgba(244, 67, 54, 0.1)' :
                            getSeverityColor(violation.severity) === 'warning' ? 'rgba(255, 152, 0, 0.1)' :
                            getSeverityColor(violation.severity) === 'info' ? 'rgba(33, 150, 243, 0.1)' :
                            'rgba(158, 158, 158, 0.1)',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'flex-start' }}>
                <Box sx={{ mt: 0.5 }}>{getSeverityIcon(violation.severity)}</Box>
                <Box sx={{ flex: 1 }}>
                  <Chip
                    label={violation.severity.toUpperCase()}
                    size="small"
                    color={getSeverityColor(violation.severity)}
                    sx={{ mb: 0.5 }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {violation.message}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ ml: 3, mb: 0.5 }}>
                {violation.recommendation}
              </Typography>
              {violation.file_path && (
                <Typography variant="caption" sx={{ ml: 3, color: '#666' }}>
                  File: {violation.file_path}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
