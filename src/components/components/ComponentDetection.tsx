import { useMemo, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  Button,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useDetectMisplacedComponents } from '../../hooks/useComponentSensibility';
import { useListComponents, useSuggestPattern, useCreatePattern, useCrossRepoPatterns } from '../../hooks/usePatterns';
import PatternSuggestionModal from '../patterns/PatternSuggestionModal';

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
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<any>(null);
  const [analyzingComponent, setAnalyzingComponent] = useState<string | null>(null);
  const [analyzeAllRepos, setAnalyzeAllRepos] = useState(false);
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Determine which repository to analyze
  const targetRepository = analyzeAllRepos ? undefined : repository;

  const { data, isLoading, isError, error, refetch } = useDetectMisplacedComponents(
    targetRepository,
    {
      min_similarity_score: similarityThreshold / 100, // Convert 0-100 to 0-1
    }
  );

  // Log when analysis completes
  const handleAnalysisComplete = () => {
    if (analysisStartTime) {
      const duration = Date.now() - analysisStartTime;
      console.log(`✓ Component analysis completed for "${targetRepository}" in ${(duration / 1000).toFixed(2)}s`);
      setAnalysisStartTime(null);
    }
  };

  // Effect to log when data loads
  useEffect(() => {
    if (!isLoading && analysisStartTime && data?.success) {
      handleAnalysisComplete();
    }
  }, [isLoading, data?.success, analysisStartTime]);

  const { data: componentsData } = useListComponents(repository);
  const totalComponentsScanned = componentsData?.total_count || 0;

  const suggestMutation = useSuggestPattern();
  const createMutation = useCreatePattern();
  const { data: patternsData } = useCrossRepoPatterns();

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

  const handleRefreshAnalysis = useCallback(() => {
    setAnalysisStartTime(Date.now());
    console.log(`🔄 Starting component analysis for "${targetRepository}"...`);
    // Invalidate cache to force fresh API call
    queryClient.invalidateQueries({
      queryKey: ['misplacedComponents', targetRepository],
    });
    // Also invalidate component list cache so Scoring Breakdown refreshes
    queryClient.invalidateQueries({
      queryKey: ['listComponents'],
    });
    refetch();
  }, [targetRepository, queryClient, refetch]);

  const handleToggleAnalyzeAllRepos = useCallback((checked: boolean) => {
    setAnalyzeAllRepos(checked);
    // Trigger analysis when toggling
    setTimeout(() => {
      setAnalysisStartTime(Date.now());
      const target = checked ? undefined : repository;
      console.log(`🔄 Starting component analysis for "${checked ? 'all' : 'selected'}"...`);
      // Invalidate cache to force fresh API call
      queryClient.invalidateQueries({
        queryKey: ['misplacedComponents', target],
      });
      // Also invalidate component list cache so Scoring Breakdown refreshes
      queryClient.invalidateQueries({
        queryKey: ['listComponents'],
      });
      refetch();
    }, 0);
  }, [repository, queryClient, refetch]);

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

  const handleSuggestPattern = async (issue: any) => {
    setAnalyzingComponent(issue.component_name);
    setSuggestionModalOpen(true);

    try {
      const suggestion = await suggestMutation.mutateAsync({
        component_name: issue.component_name,
        repository,
        duplication_count: data?.total_duplicates || 0,
        component_type: issue.issue_type,
        similarity_score: issue.similarity_score,
      });
      setCurrentSuggestion(suggestion);
    } catch (error) {
      setSuggestionModalOpen(false);
    } finally {
      setAnalyzingComponent(null);
    }
  };

  const handleCreatePattern = async (patternName: string, patternDescription: string) => {
    if (!currentSuggestion) return;

    await createMutation.mutateAsync({
      component_name: analyzingComponent!,
      repository,
      pattern_name: patternName,
      pattern_description: patternDescription,
      duplication_count: data?.total_duplicates || 0,
      component_type: 'duplicated',
    });

    setSuggestionModalOpen(false);
    setCurrentSuggestion(null);
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
      {/* Analysis Controls */}
      <Paper sx={{ p: 3, backgroundColor: 'background.default' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Analysis Controls
          </Typography>
          <Tooltip title="Refresh component analysis">
            <IconButton
              onClick={handleRefreshAnalysis}
              disabled={isLoading}
              color="primary"
              size="small"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={analyzeAllRepos}
                onChange={(e) => handleToggleAnalyzeAllRepos(e.target.checked)}
                disabled={isLoading}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Analyze All Repositories
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {analyzeAllRepos
                    ? 'Scanning all repositories for component issues'
                    : `Scanning only: ${repository}`}
                </Typography>
              </Box>
            }
          />
        </FormGroup>
      </Paper>

      {/* Status Message */}
      {isLoading && (
        <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">
            Analyzing {analyzeAllRepos ? 'all repositories' : 'selected repository'}...
          </Typography>
        </Alert>
      )}

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

      {/* Related Cross-Repo Patterns */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Related Cross-Repo Patterns
        </Typography>
        {patternsData?.patterns && patternsData.patterns.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {patternsData.patterns.slice(0, 5).map((pattern) => (
              <Chip
                key={pattern.pattern_name}
                label={`${pattern.pattern_name} (${pattern.occurrences})`}
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No cross-repository patterns found yet.
          </Typography>
        )}
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

                {issue.issue_type === 'duplicated' && issue.similarity_score >= 0.7 && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={() => handleSuggestPattern(issue)}
                      disabled={analyzingComponent === issue.component_name}
                    >
                      {analyzingComponent === issue.component_name ? 'Analyzing...' : 'Suggest as Pattern'}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">No component issues found with selected filters.</Typography>
        </Paper>
      )}

      <PatternSuggestionModal
        open={suggestionModalOpen}
        suggestion={currentSuggestion}
        isAnalyzing={suggestMutation.isPending}
        onClose={() => {
          setSuggestionModalOpen(false);
          setCurrentSuggestion(null);
          setAnalyzingComponent(null);
        }}
        onCreatePattern={handleCreatePattern}
      />
    </Box>
  );
}
