import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  loading = false,
}: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: `${color}.main`, mr: 1 }}>{icon}</Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        {loading ? (
          <Skeleton variant="text" width="60%" height={40} />
        ) : (
          <Typography variant="h3" color={`${color}.main`}>
            {value}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
