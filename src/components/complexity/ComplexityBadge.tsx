import { Chip, ChipProps } from '@mui/material';
import { Warning as WarningIcon, CheckCircle as CheckIcon } from '@mui/icons-material';

interface ComplexityBadgeProps extends Omit<ChipProps, 'label' | 'color'> {
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  size?: 'small' | 'medium';
  showStale?: boolean;
  isStale?: boolean;
}

export default function ComplexityBadge({
  grade,
  size = 'small',
  showStale = false,
  isStale = false,
  ...chipProps
}: ComplexityBadgeProps) {
  const getGradeColor = (grade: string): any => {
    switch (grade) {
      case 'A':
        return 'success';
      case 'B':
        return 'info';
      case 'C':
        return 'warning';
      case 'D':
        return 'warning';
      case 'E':
        return 'error';
      case 'F':
        return 'error';
      default:
        return 'default';
    }
  };

  const getGradeDescription = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'Excellent';
      case 'B':
        return 'Good';
      case 'C':
        return 'Fair';
      case 'D':
        return 'Poor';
      case 'E':
        return 'Very Poor';
      case 'F':
        return 'Critical';
      default:
        return 'Unknown';
    }
  };

  return (
    <Chip
      label={`${grade} - ${getGradeDescription(grade)}`}
      color={getGradeColor(grade)}
      size={size}
      variant="outlined"
      icon={isStale && showStale ? <WarningIcon /> : grade === 'A' ? <CheckIcon /> : undefined}
      title={isStale ? 'Analysis is stale (>30 days old)' : getGradeDescription(grade)}
      {...chipProps}
    />
  );
}
