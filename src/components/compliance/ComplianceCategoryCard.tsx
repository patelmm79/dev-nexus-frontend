import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton,
  LinearProgress,
  Chip,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, CheckCircle, Cancel } from '@mui/icons-material';
import { ComplianceCategory } from '../../services/a2aClient';
import ComplianceViolationsList from './ComplianceViolationsList';

interface ComplianceCategoryCardProps {
  category: string;
  data: ComplianceCategory;
}

export default function ComplianceCategoryCard({ category, data }: ComplianceCategoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const percentage = Math.round(data.compliance_score * 100);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const categoryLabel = category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Card sx={{ mb: 2, background: 'rgba(255, 255, 255, 0.03)' }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={handleExpandClick}
        >
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6">{categoryLabel}</Typography>
              <Chip
                label={`${data.checks_performed} checks`}
                size="small"
                variant="outlined"
                sx={{ height: 24 }}
              />
              {data.passed ? (
                <Chip
                  icon={<CheckCircle />}
                  label="Passed"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              ) : (
                <Chip
                  icon={<Cancel />}
                  label="Failed"
                  size="small"
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Compliance Score</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {percentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: data.passed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: data.passed ? '#4caf50' : '#f44336',
                },
              }}
            />
          </Box>

          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleExpandClick();
            }}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
              ml: 2,
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {data.violations && data.violations.length > 0 ? (
              <ComplianceViolationsList
                violations={data.violations}
                title={`${categoryLabel} Violations`}
              />
            ) : (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  background: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                }}
              >
                <Typography variant="body2" sx={{ color: '#4caf50' }}>
                  ✓ All checks passed for this category
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
