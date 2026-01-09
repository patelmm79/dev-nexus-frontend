import { Box, Card, CardContent, CardHeader, Alert, Typography, Divider } from '@mui/material';

export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  actionable: boolean;
  recommendation?: string;
}

interface AlertsListProps {
  alerts: AlertItem[];
}

const getSeverityColor = (
  severity: 'critical' | 'warning' | 'info'
): 'error' | 'warning' | 'info' => {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
  }
};

const getSeverityLabel = (severity: 'critical' | 'warning' | 'info'): string => {
  switch (severity) {
    case 'critical':
      return 'Critical';
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Info';
  }
};

export default function AlertsList({ alerts }: AlertsListProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader title="System Alerts" />
        <CardContent>
          <Alert severity="success">No active alerts</Alert>
        </CardContent>
      </Card>
    );
  }

  // Group alerts by severity
  const groupedAlerts = {
    critical: alerts.filter((a) => a.severity === 'critical'),
    warning: alerts.filter((a) => a.severity === 'warning'),
    info: alerts.filter((a) => a.severity === 'info'),
  };

  return (
    <Card>
      <CardHeader title="System Alerts" subheader={`${alerts.length} active alert(s)`} />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(groupedAlerts).map(([severity, severityAlerts]) =>
            severityAlerts.length > 0 ? (
              <Box key={severity}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {getSeverityLabel(severity as 'critical' | 'warning' | 'info')} (
                  {severityAlerts.length})
                </Typography>
                {severityAlerts.map((alert, index) => (
                  <Box key={alert.id} sx={{ mb: 1.5 }}>
                    <Alert severity={getSeverityColor(alert.severity)}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {alert.title}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {alert.description}
                        </Typography>
                        {alert.recommendation && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                            <strong>Recommendation:</strong> {alert.recommendation}
                          </Typography>
                        )}
                        <Typography variant="caption" color="inherit" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                          {new Date(alert.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    </Alert>
                    {index < severityAlerts.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))}
              </Box>
            ) : null
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
