import { Box, Card, CardContent, Typography, Chip, Stack } from '@mui/material';
import { TrendingUp, LightbulbOutlined } from '@mui/icons-material';
import { ComplianceRecommendation } from '../../services/a2aClient';

interface RecommendationsListProps {
  recommendations: ComplianceRecommendation[];
  maxDisplay?: number;
}

const getPriorityColor = (priority: 'critical' | 'high' | 'medium' | 'low'): any => {
  switch (priority) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'default';
  }
};

const getPriorityLabel = (priority: 'critical' | 'high' | 'medium' | 'low'): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

export default function RecommendationsList({ recommendations, maxDisplay = 10 }: RecommendationsListProps) {
  const displayedRecommendations = recommendations.slice(0, maxDisplay);
  const hiddenCount = Math.max(0, recommendations.length - maxDisplay);

  if (recommendations.length === 0) {
    return (
      <Card sx={{ background: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LightbulbOutlined sx={{ color: '#2196f3' }} />
            <Typography variant="body2" sx={{ color: '#2196f3' }}>
              No recommendations available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUp sx={{ color: '#2196f3' }} />
          <Typography variant="h6">
            Recommendations ({recommendations.length})
          </Typography>
        </Box>

        <Stack spacing={2}>
          {displayedRecommendations.map((rec, idx) => (
            <Box
              key={idx}
              sx={{
                p: 2,
                borderLeft: '3px solid',
                borderColor:
                  getPriorityColor(rec.priority) === 'error'
                    ? '#f44336'
                    : getPriorityColor(rec.priority) === 'warning'
                    ? '#ff9800'
                    : getPriorityColor(rec.priority) === 'info'
                    ? '#2196f3'
                    : '#9e9e9e',
                borderRadius: 1,
                background:
                  getPriorityColor(rec.priority) === 'error'
                    ? 'rgba(244, 67, 54, 0.05)'
                    : getPriorityColor(rec.priority) === 'warning'
                    ? 'rgba(255, 152, 0, 0.05)'
                    : getPriorityColor(rec.priority) === 'info'
                    ? 'rgba(33, 150, 243, 0.05)'
                    : 'rgba(158, 158, 158, 0.05)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                <Chip
                  label={getPriorityLabel(rec.priority)}
                  size="small"
                  color={getPriorityColor(rec.priority)}
                  sx={{ height: 24 }}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flex: 1 }}>
                  {rec.title}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {rec.description}
              </Typography>
              {(rec.estimated_effort || rec.impact) && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {rec.estimated_effort && (
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      <strong>Effort:</strong> {rec.estimated_effort}
                    </Typography>
                  )}
                  {rec.impact && (
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      <strong>Impact:</strong> {rec.impact}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Stack>

        {hiddenCount > 0 && (
          <Box sx={{ mt: 2, p: 1, textAlign: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              +{hiddenCount} more recommendations available
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
