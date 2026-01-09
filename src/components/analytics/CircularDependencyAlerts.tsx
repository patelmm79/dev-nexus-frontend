import {
  Box,
  Alert,
  AlertTitle,
  Chip,
  Card,
  CardHeader,
  CardContent,
  Typography,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { CircularDependencyPath } from '../../services/a2aClient';

interface CircularDependencyAlertsProps {
  cycles: CircularDependencyPath[];
  onComponentClick?: (componentName: string) => void;
}

export default function CircularDependencyAlerts({
  cycles,
  onComponentClick,
}: CircularDependencyAlertsProps) {

  if (cycles.length === 0) {
    return (
      <Alert severity="success" icon={<WarningIcon />}>
        <AlertTitle>No Circular Dependencies</AlertTitle>
        All dependencies form a clean directed acyclic graph (DAG) with no cycles.
      </Alert>
    );
  }

  // Group cycles by severity
  const highSeverityCycles = cycles.filter(c => c.severity === 'high');
  const mediumSeverityCycles = cycles.filter(c => c.severity === 'medium');
  const lowSeverityCycles = cycles.filter(c => c.severity === 'low');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Summary Alert */}
      <Alert
        severity={highSeverityCycles.length > 0 ? 'error' : mediumSeverityCycles.length > 0 ? 'warning' : 'info'}
        icon={highSeverityCycles.length > 0 ? <ErrorIcon /> : <WarningIcon />}
      >
        <AlertTitle>Circular Dependencies Detected</AlertTitle>
        Found {cycles.length} circular dependenc{cycles.length === 1 ? 'y' : 'ies'}
        {highSeverityCycles.length > 0 && ` - ${highSeverityCycles.length} critical`}
        {mediumSeverityCycles.length > 0 && ` - ${mediumSeverityCycles.length} medium severity`}
      </Alert>

      {/* High Severity Cycles */}
      {highSeverityCycles.length > 0 && (
        <Card sx={{ borderLeft: '4px solid #ff5252' }}>
          <CardHeader
            title={`Critical: ${highSeverityCycles.length} Direct Circular Dependenc${highSeverityCycles.length === 1 ? 'y' : 'ies'}`}
            avatar={<ErrorIcon sx={{ color: '#ff5252' }} />}
          />
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {highSeverityCycles.map((cycle, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.5,
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  border: '1px solid rgba(255, 82, 82, 0.2)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                    {cycle.components.slice(0, -1).map((comp, i) => (
                      <Box key={i} sx={{ display: 'inline' }}>
                        {i > 0 && ' → '}
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            color: 'primary.main',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            '&:hover': { opacity: 0.8 },
                          }}
                          onClick={() => onComponentClick?.(comp)}
                        >
                          {comp}
                        </Typography>
                      </Box>
                    ))}
                  </Typography>
                  <Chip label={`${cycle.cycle_length} nodes`} size="small" color="error" />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  ⚠️ This forms a direct cycle that must be broken to improve code architecture.
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Medium Severity Cycles */}
      {mediumSeverityCycles.length > 0 && (
        <Card sx={{ borderLeft: '4px solid #ff9800' }}>
          <CardHeader
            title={`Medium: ${mediumSeverityCycles.length} Multi-node Circular Dependenc${mediumSeverityCycles.length === 1 ? 'y' : 'ies'}`}
            avatar={<WarningIcon sx={{ color: '#ff9800' }} />}
          />
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {mediumSeverityCycles.map((cycle, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.5,
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  border: '1px solid rgba(255, 152, 0, 0.2)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {cycle.components.slice(0, -1).map((comp, i) => (
                      <Box key={i} sx={{ display: 'inline' }}>
                        {i > 0 && ' → '}
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            color: 'primary.main',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            '&:hover': { opacity: 0.8 },
                          }}
                          onClick={() => onComponentClick?.(comp)}
                        >
                          {comp}
                        </Typography>
                      </Box>
                    ))}
                  </Typography>
                  <Chip label={`${cycle.cycle_length} nodes`} size="small" color="warning" />
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Low Severity Cycles */}
      {lowSeverityCycles.length > 0 && (
        <Card sx={{ borderLeft: '4px solid #2196f3' }}>
          <CardHeader
            title={`Low: ${lowSeverityCycles.length} Complex Circular Dependenc${lowSeverityCycles.length === 1 ? 'y' : 'ies'}`}
            avatar={<WarningIcon sx={{ color: '#2196f3' }} />}
          />
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {lowSeverityCycles.map((cycle, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.5,
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  border: '1px solid rgba(33, 150, 243, 0.2)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {cycle.components.slice(0, 3).map((comp, i) => (
                      <Box key={i} sx={{ display: 'inline' }}>
                        {i > 0 && ' → '}
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            color: 'primary.main',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            '&:hover': { opacity: 0.8 },
                          }}
                          onClick={() => onComponentClick?.(comp)}
                        >
                          {comp}
                        </Typography>
                      </Box>
                    ))}
                    {cycle.cycle_length > 3 && (
                      <Typography component="span" variant="body2">
                        {' '}
                        ... +{cycle.cycle_length - 3} more
                      </Typography>
                    )}
                  </Typography>
                  <Chip label={`${cycle.cycle_length} nodes`} size="small" />
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
