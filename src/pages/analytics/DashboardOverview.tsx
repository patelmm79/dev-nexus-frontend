import { Box, CircularProgress, Alert, Paper } from '@mui/material';
import { useDashboardOverview } from '../../hooks/useAnalytics';
import SystemHealthGauge from '../../components/analytics/SystemHealthGauge';
import MetricsGrid, { Metric } from '../../components/analytics/MetricsGrid';
import AlertsList from '../../components/analytics/AlertsList';
import TimelineHighlights from '../../components/analytics/TimelineHighlights';

export default function DashboardOverview() {
  const { data: dashboardData, isLoading, isError, error } = useDashboardOverview();

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
        Failed to load dashboard: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!dashboardData || !dashboardData.success) {
    return (
      <Alert severity="warning">
        Dashboard data is unavailable
      </Alert>
    );
  }

  const metrics = dashboardData.metrics || [];
  const systemHealth = dashboardData.system_health;
  const alerts = dashboardData.alerts || [];
  const timelineHighlights = dashboardData.timeline_highlights || [];

  // Transform dashboard metrics for MetricsGrid
  const metricsForGrid: Metric[] = metrics.map((metric) => ({
    label: metric.label,
    value: metric.value,
    unit: metric.unit,
    trend: metric.trend,
    status: metric.status,
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* System Health Gauge */}
      {systemHealth && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
          <SystemHealthGauge
            healthScore={systemHealth.overall_health_score}
            status={systemHealth.status}
            uptime={systemHealth.uptime_percentage}
          />

          {/* Key Metrics */}
          <Box>
            <MetricsGrid metrics={metricsForGrid.slice(0, 3)} columns={3} />
          </Box>
        </Box>
      )}

      {/* Additional Metrics */}
      {metricsForGrid.length > 3 && (
        <MetricsGrid metrics={metricsForGrid.slice(3)} columns={3} />
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <AlertsList
          alerts={alerts.map((alert) => ({
            id: alert.id,
            severity: alert.severity,
            title: alert.title,
            description: alert.description,
            timestamp: alert.timestamp,
            actionable: alert.actionable,
            recommendation: alert.recommendation,
          }))}
        />
      )}

      {/* Timeline */}
      {timelineHighlights.length > 0 && (
        <TimelineHighlights
          highlights={timelineHighlights.map((highlight) => ({
            timestamp: highlight.timestamp,
            event_type: highlight.event_type,
            title: highlight.title,
            description: highlight.description,
            impact: highlight.impact,
          }))}
        />
      )}
    </Box>
  );
}
