import { Box, Card, CardContent, Typography } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

export interface Metric {
  label: string;
  value: number | string;
  unit: string;
  trend: number; // percentage change
  status: 'improving' | 'stable' | 'declining';
}

interface MetricsGridProps {
  metrics: Metric[];
  columns?: number;
}

const getTrendColor = (status: 'improving' | 'stable' | 'declining'): string => {
  switch (status) {
    case 'improving':
      return '#4caf50';
    case 'stable':
      return '#2196f3';
    case 'declining':
      return '#f44336';
  }
};

const getTrendIcon = (status: 'improving' | 'stable' | 'declining') => {
  switch (status) {
    case 'improving':
      return <TrendingUpIcon sx={{ color: '#4caf50' }} />;
    case 'stable':
      return <RemoveIcon sx={{ color: '#2196f3' }} />;
    case 'declining':
      return <TrendingDownIcon sx={{ color: '#f44336' }} />;
  }
};

export default function MetricsGrid({ metrics, columns = 3 }: MetricsGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: columns >= 2 ? '1fr 1fr' : '1fr',
          md: `repeat(${columns}, 1fr)`,
        },
        gap: 2,
      }}
    >
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  {metric.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {metric.value}
                  <Typography
                    variant="caption"
                    component="span"
                    sx={{ ml: 1, fontWeight: 'normal' }}
                  >
                    {metric.unit}
                  </Typography>
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {getTrendIcon(metric.status)}
                <Typography
                  variant="caption"
                  sx={{ color: getTrendColor(metric.status), fontWeight: 'bold' }}
                >
                  {Math.abs(metric.trend) > 0 ? `${metric.trend > 0 ? '+' : ''}${metric.trend}%` : 'No change'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
