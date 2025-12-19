import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';

interface ComplianceScoreCardProps {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  repository: string;
}

const getGradeColor = (grade: 'A' | 'B' | 'C' | 'D' | 'F'): string => {
  switch (grade) {
    case 'A':
      return '#4caf50'; // green
    case 'B':
      return '#8bc34a'; // light green
    case 'C':
      return '#ff9800'; // orange
    case 'D':
      return '#ff7043'; // deep orange
    case 'F':
      return '#f44336'; // red
  }
};

const getGradeLabel = (grade: 'A' | 'B' | 'C' | 'D' | 'F'): string => {
  switch (grade) {
    case 'A':
      return 'Excellent';
    case 'B':
      return 'Good';
    case 'C':
      return 'Fair';
    case 'D':
      return 'Poor';
    case 'F':
      return 'Critical';
  }
};

export default function ComplianceScoreCard({ score, grade, repository }: ComplianceScoreCardProps) {
  const gradeColor = getGradeColor(grade);
  const gradeLabel = getGradeLabel(grade);
  const percentage = Math.round(score * 100);

  return (
    <Card sx={{ mb: 3, background: 'rgba(255, 255, 255, 0.05)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="textSecondary" gutterBottom>
              Repository Compliance
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {repository}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Overall Score</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {percentage}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={percentage} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              ml: 3,
              minWidth: 120,
            }}
          >
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: gradeColor,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#fff' }}>
                {grade}
              </Typography>
              <Typography variant="caption" sx={{ color: '#fff' }}>
                {percentage}%
              </Typography>
            </Box>
            <Typography variant="caption" align="center" sx={{ color: gradeColor, fontWeight: 'bold' }}>
              {gradeLabel}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
