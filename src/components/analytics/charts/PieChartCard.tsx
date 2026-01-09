import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PieChartCardProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  nameKey: string;
  colors?: string[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  height?: number;
  cx?: string | number;
  cy?: string | number;
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

export default function PieChartCard({
  title,
  subtitle,
  data,
  dataKey,
  nameKey,
  colors = DEFAULT_COLORS,
  isLoading = false,
  isError = false,
  error = null,
  height = 400,
  cx = '50%',
  cy = '50%',
}: PieChartCardProps) {
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
              outerRadius={80}
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
      </CardContent>
    </Card>
  );
}
