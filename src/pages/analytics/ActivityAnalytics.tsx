import { useState } from 'react';
import { Box, CircularProgress, Alert, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useRepositoryActivitySummary } from '../../hooks/useAnalytics';
import AreaChartCard from '../../components/analytics/charts/AreaChartCard';
import PieChartCard from '../../components/analytics/charts/PieChartCard';
import BarChartCard from '../../components/analytics/charts/BarChartCard';

export default function ActivityAnalytics() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const { data: activityData, isLoading, isError, error } = useRepositoryActivitySummary(period, 10);

  if (isLoading) {
    return (
      <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load activity analytics: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!activityData || !activityData.success) {
    return (
      <Alert severity="warning">
        Activity analytics data is unavailable
      </Alert>
    );
  }

  const activityTimeline = activityData.activity_timeline || [];
  const activityByType = activityData.activity_by_type || [];
  const repositoryRankings = activityData.repository_rankings || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Period Selector */}
      <Paper sx={{ p: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
          >
            <MenuItem value="day">Daily</MenuItem>
            <MenuItem value="week">Weekly</MenuItem>
            <MenuItem value="month">Monthly</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Activity Timeline */}
      <AreaChartCard
        title="Activity Timeline"
        subtitle={`Repository activity by ${period}`}
        data={activityTimeline}
        dataKeys={[
          { key: 'pattern_scans', color: '#1976d2', name: 'Pattern Scans' },
          { key: 'component_scans', color: '#4caf50', name: 'Component Scans' },
          { key: 'compliance_checks', color: '#ff9800', name: 'Compliance Checks' },
        ]}
        xAxisKey="date"
        isLoading={isLoading}
        isError={isError}
        error={error}
        stacked={true}
        height={400}
      />

      {/* Activity Distribution by Type */}
      <PieChartCard
        title="Activity Distribution by Type"
        subtitle="Breakdown of all activities"
        data={activityByType}
        dataKey="count"
        nameKey="activity_type"
        isLoading={isLoading}
        isError={isError}
        error={error}
        height={400}
      />

      {/* Repository Activity Rankings */}
      <BarChartCard
        title="Repository Activity Rankings"
        subtitle="Total activity by repository"
        data={repositoryRankings}
        dataKeys={[{ key: 'total_activity', color: '#2196f3', name: 'Total Activity' }]}
        xAxisKey="repository_name"
        layout="vertical"
        height={Math.max(300, repositoryRankings.length * 35)}
        isLoading={isLoading}
        isError={isError}
        error={error}
      />
    </Box>
  );
}
