import { Chip } from '@mui/material';
import { CheckCircle, Warning, Archive } from '@mui/icons-material';

interface PatternStatusChipProps {
  status: 'active' | 'deprecated' | 'archived';
  size?: 'small' | 'medium';
}

export default function PatternStatusChip({ status, size = 'small' }: PatternStatusChipProps) {
  const getStatusColor = (status: string): 'success' | 'warning' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'deprecated':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle />;
      case 'deprecated':
        return <Warning />;
      case 'archived':
        return <Archive />;
    }
  };

  return (
    <Chip
      label={status.toUpperCase()}
      color={getStatusColor(status)}
      icon={getStatusIcon(status)}
      size={size}
    />
  );
}
