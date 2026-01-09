import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Divider,
  Stack,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

export interface Highlight {
  timestamp: string;
  event_type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

interface TimelineHighlightsProps {
  highlights: Highlight[];
}

const getImpactColor = (impact: 'high' | 'medium' | 'low'): string => {
  switch (impact) {
    case 'high':
      return '#f44336';
    case 'medium':
      return '#ff9800';
    case 'low':
      return '#4caf50';
  }
};

const getEventIcon = (eventType: string) => {
  switch (eventType.toLowerCase()) {
    case 'success':
      return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
    case 'warning':
      return <WarningIcon sx={{ color: '#ff9800' }} />;
    case 'error':
      return <ErrorIcon sx={{ color: '#f44336' }} />;
    default:
      return <InfoIcon sx={{ color: '#2196f3' }} />;
  }
};

export default function TimelineHighlights({ highlights }: TimelineHighlightsProps) {
  if (!highlights || highlights.length === 0) {
    return (
      <Card>
        <CardHeader title="Recent Highlights" />
        <CardContent>
          <Typography color="textSecondary">No recent highlights</Typography>
        </CardContent>
      </Card>
    );
  }

  // Sort by timestamp (most recent first)
  const sortedHighlights = [...highlights].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card>
      <CardHeader title="Recent Highlights" subheader={`${highlights.length} event(s)`} />
      <CardContent>
        <Stack spacing={2}>
          {sortedHighlights.map((highlight, index) => (
            <div key={index}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingTop: '4px',
                    minWidth: '32px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: getImpactColor(highlight.impact),
                    }}
                  >
                    {getEventIcon(highlight.event_type)}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {highlight.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {highlight.description}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    <strong>Impact:</strong> {highlight.impact.toUpperCase()}
                    {' | '}
                    <strong>Time:</strong> {new Date(highlight.timestamp).toLocaleString()}
                  </Typography>
                </div>
              </div>
              {index < sortedHighlights.length - 1 && <Divider sx={{ my: 1 }} />}
            </div>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
