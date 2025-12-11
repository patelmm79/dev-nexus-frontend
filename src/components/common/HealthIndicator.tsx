import { Chip, CircularProgress } from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import { useHealth } from '../../hooks/usePatterns';

export default function HealthIndicator() {
  const { data, isLoading, isError } = useHealth();

  if (isLoading) return <CircularProgress size={20} color="inherit" />;
  if (isError)
    return (
      <Chip icon={<Error />} label="Error" color="error" size="small" />
    );

  return (
    <Chip
      icon={<CheckCircle />}
      label={data?.status || 'Unknown'}
      color={data?.status === 'healthy' ? 'success' : 'warning'}
      size="small"
    />
  );
}
