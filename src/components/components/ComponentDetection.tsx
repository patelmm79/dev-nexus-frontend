import { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Alert,
  Typography,
  LinearProgress,
  Paper,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Slider,
} from '@mui/material';
import { useDetectMisplacedComponents } from '../../hooks/useComponentSensibility';
import { useListComponents } from '../../hooks/usePatterns';

interface ComponentDetectionProps {
  repository: string;
}

const ISSUE_TYPES = [
  { value: 'duplicated', label: 'Duplicated' },
  { value: 'misplaced', label: 'Misplaced' },
  { value: 'orphaned', label: 'Orphaned' },
];

export default function ComponentDetection({ repository }: ComponentDetectionProps) {
  const [selectedIssueTypes, setSelectedIssueTypes] = useState<string[]>(['duplicated', 'misplaced']);
  const [similarityThreshold, setSimilarityThreshold] = useState(50);

  const { data, isLoading, isError, error } = useDetectMisplacedComponents(
    repository,
    {
      similarity_threshold: similarityThreshold,
    }
  );

  const { data: componentsData } = useListComponents(repository);
  const totalComponentsScanned = componentsData?.total_count || 0;

  const filteredIssues = useMemo(() => {
    if (!data?.component_issues) return [];
    return data.component_issues.filter((issue) =>
      selectedIssueTypes.includes(issue.issue_type)
    );
  }, [data?.component_issues, selectedIssueTypes]);

  const handleIssueTypeToggle = (type: string) => {
    setSelectedIssueTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getIssueTypeColor = (type: 'duplicated' | 'misplaced' | 'orphaned'): 'error' | 'warning' | 'info' => {
    switch (type) {
      case 'duplicated':
        return 'error';
      case 'misplaced':
        return 'warning';
      case 'orphaned':
        return 'info';
      default:
        return 'info';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load component detection data: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!data?.success) {
    return <Alert severity="error">Component detection failed. Please try again.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filters
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Issue Types
          </Typography>
          <FormGroup row>
            {ISSUE_TYPES.map((type) => (
              <FormControlLabel
                key={type.value}
                control={
                  <Checkbox
                    checked={selectedIssueTypes.includes(type.value)}
                    onChange={() => handleIssueTypeToggle(type.value)}
                  />
                }
                label={type.label}
              />
            ))}
          </FormGroup>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Similarity Threshold: {similarityThreshold}%
          </Typography>
          <Slider
            value={similarityThreshold}
            onChange={(_, newValue) => setSimilarityThreshold(newValue as number)}
            min={0}
            max={100}
            step={10}
            marks
            valueLabelDisplay="auto"
          />
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Components Scanned
            </Typography>
            <Typography variant="h5">{totalComponentsScanned}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Total Issues
            </Typography>
            <Typography variant="h5">{data?.component_issues?.length || 0}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Duplicates
            </Typography>
            <Typography variant="h5" sx={{ color: 'error.main' }}>
              {data?.total_duplicates || 0}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Misplaced
            </Typography>
            <Typography variant="h5" sx={{ color: 'warning.main' }}>
              {data?.total_misplaced || 0}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Avg. Similarity
            </Typography>
            <Typography variant="h5">
              {data?.component_issues && data.component_issues.length > 0
                ? (
                    (data.component_issues.reduce((sum, issue) => sum + issue.similarity_score, 0) /
                      data.component_issues.length) *
                    100
                  ).toFixed(0)
                : 'N/A'}%
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {filteredIssues.length > 0 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 2 }}>
          {filteredIssues.map((issue, index) => (
            <Card key={index} sx={{ height: '100%' }}>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ flex: 1 }}>
                      {issue.component_name}
                    </Typography>
                    <Chip
                      label={issue.issue_type}
                      size="small"
                      color={getIssueTypeColor(issue.issue_type)}
                      variant="outlined"
                    />
                  </Box>
                }
                subheader={
                  <Typography variant="caption" color="textSecondary">
                    Similarity: {(issue.similarity_score * 100).toFixed(0)}%
                  </Typography>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={issue.similarity_score * 100}
                    sx={{ mb: 1 }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary" display="block">
                    Current Location
                  </Typography>
                  <Typography variant="body2">{issue.current_location}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary" display="block">
                    Suggested Location
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                    {issue.suggested_location}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                    Reason
                  </Typography>
                  <Typography variant="body2">{issue.reason}</Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">No component issues found with selected filters.</Typography>
        </Paper>
      )}
    </Box>
  );
}
