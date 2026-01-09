import {
  Alert,
  Typography,
  Box,
} from '@mui/material';

interface ComponentDependencyGraphProps {
  repository: string;
}

/**
 * TODO: Refactor to work with new single-component APIs
 * Currently disabled as it requires batch component data which is no longer
 * provided by the backend. This component needs to be redesigned to show
 * component dependencies using a different approach (e.g., file-based
 * dependency analysis or relationship queries).
 */
export default function ComponentDependencyGraph(_: ComponentDependencyGraphProps) {
  return (
    <Box>
      <Alert severity="info">
        <Typography variant="body2">
          Component Dependency Graph is currently being refactored to work with the new
          single-component analysis APIs. This feature will be available soon.
        </Typography>
      </Alert>
    </Box>
  );
}
