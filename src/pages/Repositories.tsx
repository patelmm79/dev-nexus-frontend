import { Typography, Box, Card, CardContent, Chip, CircularProgress, Alert } from '@mui/material';
import { Folder, AccessTime } from '@mui/icons-material';
import { useRepositories } from '../hooks/usePatterns';
import { formatDistanceToNow } from 'date-fns';

export default function Repositories() {
  const { data, isLoading, isError, error } = useRepositories();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load repositories: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Repositories
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Browse all tracked repositories in the Pattern Discovery system
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3, mt: 2 }}>
        {data?.repositories.map((repo) => (
          <Card key={repo.name}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Folder color="primary" />
                <Typography variant="h6" component="div">
                  {repo.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`${repo.latest_patterns?.patterns?.length || 0} patterns`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<AccessTime />}
                  label={formatDistanceToNow(new Date(repo.last_updated), { addSuffix: true })}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Domain: {repo.latest_patterns?.problem_domain || 'Unknown'}
              </Typography>

              {repo.latest_patterns?.keywords && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                  {repo.latest_patterns.keywords.slice(0, 5).map((keyword, idx) => (
                    <Chip key={idx} label={keyword} size="small" />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      {(!data?.repositories || data.repositories.length === 0) && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No repositories found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start tracking repositories by analyzing them with the backend service
          </Typography>
        </Box>
      )}
    </Box>
  );
}
