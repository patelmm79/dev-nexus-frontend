import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartCardProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKeys: { key: string; color: string; name?: string }[];
  xAxisKey: string;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  height?: number;
  layout?: 'vertical' | 'horizontal';
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

export default function BarChartCard({
  title,
  subtitle,
  data,
  dataKeys,
  xAxisKey,
  isLoading = false,
  isError = false,
  error = null,
  height = 400,
  layout = 'vertical',
  margin = { top: 5, right: 30, bottom: 5, left: 0 },
}: BarChartCardProps) {
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
          <BarChart
            data={data}
            layout={layout}
            margin={layout === 'vertical' ? { top: 5, right: 30, bottom: 5, left: 100 } : margin}
          >
            <CartesianGrid strokeDasharray="3 3" />
            {layout === 'vertical' ? (
              <>
                <XAxis type="number" />
                <YAxis dataKey={xAxisKey} type="category" width={80} />
              </>
            ) : (
              <>
                <XAxis dataKey={xAxisKey} />
                <YAxis />
              </>
            )}
            <Tooltip />
            <Legend />
            {dataKeys.map((item) => (
              <Bar key={item.key} dataKey={item.key} fill={item.color} name={item.name || item.key} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
