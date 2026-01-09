import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Paper,
  Typography,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DonutChartCardProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  nameKey: string;
  centerLabel?: string;
  centerValue?: number | string;
  colors?: string[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  height?: number;
  cx?: string | number;
  cy?: string | number;
  innerRadius?: number;
  outerRadius?: number;
}

const DEFAULT_COLORS = [
  '#1976d2',
  '#2196f3',
  '#4caf50',
  '#ff9800',
  '#f44336',
  '#9c27b0',
  '#00bcd4',
  '#795548',
];

export default function DonutChartCard({
  title,
  subtitle,
  data,
  dataKey,
  nameKey,
  centerLabel,
  centerValue,
  colors = DEFAULT_COLORS,
  isLoading = false,
  isError = false,
  error = null,
  height = 400,
  cx = '50%',
  cy = '50%',
  innerRadius = 60,
  outerRadius = 100,
}: DonutChartCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader title={title} subheader={subtitle} />
        <CardContent>
          <Paper sx={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Paper>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader title={title} subheader={subtitle} />
        <CardContent>
          <Alert severity="error">
            Failed to load chart: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader title={title} subheader={subtitle} />
        <CardContent>
          <Paper sx={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Alert severity="info">No data available</Alert>
          </Paper>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={title} subheader={subtitle} />
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx={cx}
              cy={cy}
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        {centerValue && (
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: -3,
              mb: 2,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
                {centerValue}
              </Typography>
              {centerLabel && (
                <Typography variant="caption" sx={{ color: '#999' }}>
                  {centerLabel}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
