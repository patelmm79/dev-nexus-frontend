import {
  Alert,
  Typography,
  Box,
} from '@mui/material';

interface ConsolidationPlanProps {
  repository: string;
}

/**
 * TODO: Refactor to work with new single-component APIs
 * Currently disabled as it expects batch consolidation planning which is no longer
 * provided by the backend. This component should be redesigned to:
 * 1. List components in the repository
 * 2. Allow selection of a component to consolidate
 * 3. Call recommend_consolidation_plan for the selected component
 * 4. Show the detailed consolidation plan as a modal or new page
 */
export default function ConsolidationPlan(_: ConsolidationPlanProps) {
  return (
    <Box>
      <Alert severity="info">
        <Typography variant="body2">
          Consolidation Plan is currently being refactored to work with the new
          single-component analysis APIs. Users can select individual components
          in the Scoring Breakdown view to analyze their optimal locations and get
          consolidation recommendations.
        </Typography>
      </Alert>
    </Box>
  );
}
