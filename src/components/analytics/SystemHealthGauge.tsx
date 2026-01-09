import { Box, Card, CardContent, CardHeader, Typography } from '@mui/material';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

interface SystemHealthGaugeProps {
  healthScore: number; // 0-100
  status: 'healthy' | 'warning' | 'critical';
  uptime?: number; // 0-100
}

const getStatusColor = (status: 'healthy' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'healthy':
      return '#4caf50';
    case 'warning':
      return '#ff9800';
    case 'critical':
      return '#f44336';
  }
};

const getStatusLabel = (status: 'healthy' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'warning':
      return 'Warning';
    case 'critical':
      return 'Critical';
  }
};

export default function SystemHealthGauge({
  healthScore,
  status,
  uptime = 99.9,
}: SystemHealthGaugeProps) {
  const data = [
    {
      name: 'Health',
      value: healthScore,
      fill: getStatusColor(status),
    },
  ];

  return (
    <Card>
      <CardHeader title="System Health" />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <ResponsiveContainer width="100%" height={250}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="80%"
              outerRadius="100%"
              data={data}
              startAngle={180}
              endAngle={0}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
                label={false}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: getStatusColor(status) }}>
              {healthScore}%
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {getStatusLabel(status)}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
              Uptime: {uptime}%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
