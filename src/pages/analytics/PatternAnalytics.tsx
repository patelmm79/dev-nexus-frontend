import { Box, CircularProgress, Alert, Paper } from '@mui/material';
import { usePatternAdoptionTrends, usePatternHealthSummary } from '../../hooks/useAnalytics';
import LineChartCard from '../../components/analytics/charts/LineChartCard';
import AreaChartCard from '../../components/analytics/charts/AreaChartCard';
import BarChartCard from '../../components/analytics/charts/BarChartCard';
import PieChartCard from '../../components/analytics/charts/PieChartCard';

export default function PatternAnalytics() {
  const adoptionData = usePatternAdoptionTrends();
  const healthData = usePatternHealthSummary();

  const isLoading = adoptionData.isLoading || healthData.isLoading;
  const isError = adoptionData.isError || healthData.isError;
  const error = adoptionData.error || healthData.error;

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
        Failed to load pattern analytics: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  const adoptionTimeline = adoptionData.data?.adoption_timeline || [];
  const healthTrends = healthData.data?.health_trends || [];
  const patternScores = healthData.data?.pattern_scores || [];
  const issueBreakdown = healthData.data?.issue_breakdown || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Pattern Adoption Over Time */}
      <LineChartCard
        title="Pattern Adoption Trends"
        subtitle="Number of patterns and repositories over time"
        data={adoptionTimeline}
        dataKeys={[
          { key: 'pattern_count', color: '#1976d2', name: 'Pattern Count' },
          { key: 'repository_count', color: '#4caf50', name: 'Repository Count' },
        ]}
        xAxisKey="date"
        isLoading={adoptionData.isLoading}
        isError={adoptionData.isError}
        error={adoptionData.error}
        height={400}
      />

      {/* Health Score Trends */}
      <AreaChartCard
        title="Pattern Health Trends"
        subtitle="Average health score and issue count over time"
        data={healthTrends}
        dataKeys={[
          { key: 'avg_health_score', color: '#4caf50', name: 'Avg Health Score' },
          { key: 'total_issues', color: '#f44336', name: 'Total Issues' },
        ]}
        xAxisKey="date"
        isLoading={healthData.isLoading}
        isError={healthData.isError}
        error={healthData.error}
        stacked={false}
        height={400}
      />

      {/* Pattern Health Scores */}
      <BarChartCard
        title="Pattern Health Scores"
        subtitle="Health score breakdown by pattern"
        data={patternScores}
        dataKeys={[{ key: 'health_score', color: '#2196f3', name: 'Health Score' }]}
        xAxisKey="pattern_name"
        isLoading={healthData.isLoading}
        isError={healthData.isError}
        error={healthData.error}
        layout="vertical"
        height={Math.max(300, patternScores.length * 30)}
      />

      {/* Issue Distribution */}
      <PieChartCard
        title="Issue Distribution by Type"
        subtitle="Breakdown of issues by type"
        data={issueBreakdown}
        dataKey="count"
        nameKey="issue_type"
        isLoading={healthData.isLoading}
        isError={healthData.isError}
        error={healthData.error}
        height={400}
      />
    </Box>
  );
}
