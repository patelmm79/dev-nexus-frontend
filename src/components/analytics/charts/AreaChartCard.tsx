import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AreaChartCardProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKeys: { key: string; color: string; name?: string }[];
  xAxisKey: string;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  height?: number;
  stacked?: boolean;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

export default function AreaChartCard({
  title,
  subtitle,
  data,
  dataKeys,
  xAxisKey,
  isLoading = false,
  isError = false,
  error = null,
  height = 400,
  stacked = true,
  margin = { top: 5, right: 30, left: 0, bottom: 5 },
}: AreaChartCardProps) {
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
          <AreaChart data={data} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((item) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={item.color}
                fill={item.color}
                name={item.name || item.key}
                stackId={stacked ? 'stack' : undefined}
                fillOpacity={stacked ? 0.8 : 0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
