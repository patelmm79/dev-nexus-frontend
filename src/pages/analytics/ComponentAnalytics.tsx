import { Box, CircularProgress, Alert, Paper, Card, CardContent, Typography } from '@mui/material';
import { useComponentDuplicationStats } from '../../hooks/useAnalytics';
import DonutChartCard from '../../components/analytics/charts/DonutChartCard';
import BarChartCard from '../../components/analytics/charts/BarChartCard';

export default function ComponentAnalytics() {
  const { data: duplicationData, isLoading, isError, error } = useComponentDuplicationStats();

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
        Failed to load component analytics: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!duplicationData || !duplicationData.success) {
    return (
      <Alert severity="warning">
        Component analytics data is unavailable
      </Alert>
    );
  }

  const duplicationDistribution = duplicationData.duplication_distribution || [];
  const consolidationProgress = duplicationData.consolidation_progress || [];
  const effortSavings = duplicationData.effort_savings || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Statistics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Total Duplicates
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
              {duplicationData.total_duplicates}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Unique Components
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
              {duplicationData.total_unique_components}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Duplication Distribution Donut */}
      <DonutChartCard
        title="Duplication Distribution"
        subtitle="Components by duplication level"
        data={duplicationDistribution}
        dataKey="component_count"
        nameKey="duplication_level"
        centerLabel="Components"
        centerValue={duplicationData.total_duplicates}
        height={400}
      />

      {/* Consolidation Progress */}
      <BarChartCard
        title="Consolidation Progress"
        subtitle="Progress by consolidation phase"
        data={consolidationProgress}
        dataKeys={[
          { key: 'completed', color: '#4caf50', name: 'Completed' },
          { key: 'total', color: '#e0e0e0', name: 'Total' },
        ]}
        xAxisKey="phase"
        height={300}
      />

      {/* Effort Savings */}
      <BarChartCard
        title="Effort Savings Estimate"
        subtitle="Estimated hours saved by consolidation type"
        data={effortSavings}
        dataKeys={[{ key: 'estimated_hours_saved', color: '#2196f3', name: 'Hours Saved' }]}
        xAxisKey="consolidation_type"
        layout="vertical"
        height={effortSavings.length > 0 ? Math.max(250, effortSavings.length * 40) : 250}
      />
    </Box>
  );
}
