import { Typography, Box, Card, CardContent, Chip, CircularProgress, Alert, Button } from '@mui/material';
import { Folder, AccessTime, Search, Analytics, Refresh } from '@mui/icons-material';
import { useRepositories, useScanComponents, useListComponents } from '../hooks/usePatterns';
import { useComplexityAnalysis, useAnalyzeComplexity, useTriggerComplexityAnalysis } from '../hooks/useComplexityMetrics';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanRepositoryComponentsResponse, Repository } from '../services/a2aClient';
import ComplexityBadge from '../components/complexity/ComplexityBadge';

interface ScanResult {
  repository: string;
  result?: ScanRepositoryComponentsResponse;
  error?: string;
  isLoading: boolean;
}

interface RepositoryCardProps {
  repo: Repository;
  scanResult: ScanResult | undefined;
  onScan: (repositoryName: string) => Promise<void>;
  onAnalyzeComplexity: (repositoryName: string) => Promise<void>;
  isAnalyzing?: boolean;
}

function RepositoryCard({ repo, scanResult, onScan, onAnalyzeComplexity, isAnalyzing }: RepositoryCardProps) {
  const { data: componentsData } = useListComponents(repo.name);
  const { data: complexityData, isLoading: complexityLoading } = useComplexityAnalysis(repo.name);
  const refreshComplexity = useTriggerComplexityAnalysis();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAnalyzeClick = async () => {
    try {
      await onAnalyzeComplexity(repo.name);
    } catch (err) {
      // Error is handled by toast notification from the mutation
      console.error('Failed to analyze complexity:', err);
    }
  };

  const handleRefreshComplexity = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    try {
      refreshComplexity.mutate(repo.name);
    } finally {
      setIsRefreshing(false);
    }
  };
  const componentCount = componentsData?.total_components ?? scanResult?.result?.components_found ?? 0;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Folder color="primary" />
          <Typography variant="h6" component="div">
            {repo.name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`${repo.pattern_count || repo.latest_patterns?.patterns?.length || 0} patterns`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${componentCount} components`}
            size="small"
            color="secondary"
            variant="outlined"
          />
          {complexityLoading ? (
            <Chip label="Analyzing..." size="small" variant="outlined" />
          ) : complexityData?.success ? (
            <ComplexityBadge
              grade={complexityData.summary?.overall_grade || 'F'}
              showStale={true}
              isStale={complexityData.stale_analysis}
            />
          ) : null}
          <Chip
            icon={<AccessTime />}
            label={formatDistanceToNow(new Date(repo.last_updated), { addSuffix: true })}
            size="small"
            variant="outlined"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Domain: {repo.problem_domain || repo.latest_patterns?.problem_domain || 'Unknown'}
        </Typography>

        {(repo.keywords?.length || repo.latest_patterns?.keywords?.length) ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2, mb: 2 }}>
            {(repo.keywords || repo.latest_patterns?.keywords || []).slice(0, 5).map((keyword, idx) => (
              <Chip key={idx} label={keyword} size="small" />
            ))}
          </Box>
        ) : null}

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={scanResult?.isLoading ? <CircularProgress size={16} /> : <Search />}
              onClick={() => onScan(repo.name)}
              disabled={scanResult?.isLoading}
              sx={{ flex: 1 }}
            >
              {scanResult?.isLoading ? 'Scanning...' : 'Scan'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={complexityLoading || isRefreshing || isAnalyzing ? <CircularProgress size={16} /> : <Analytics />}
              onClick={handleAnalyzeClick}
              disabled={complexityLoading || isRefreshing || isAnalyzing}
              sx={{ flex: 1 }}
            >
              {isAnalyzing ? 'Analyzing...' : complexityLoading || isRefreshing ? 'Loading...' : 'Analyze'}
            </Button>
          </Box>
          {complexityData?.success && (
            <Button
              variant="text"
              size="small"
              startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
              onClick={handleRefreshComplexity}
              disabled={isRefreshing}
              fullWidth
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Analysis'}
            </Button>
          )}
        </Box>

        {scanResult?.result && scanResult.result.success && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'success.main' }}>
                ✅ Found {scanResult.result.components_found} components
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {scanResult.result.components.map((component, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    fontSize: '0.875rem',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 500, display: 'block' }}>
                    {component.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {component.type} • {component.loc} LOC • {component.methods} methods
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem' }}>
                    {component.files.join(', ')}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {scanResult?.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            ❌ Error: {scanResult.error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default function Repositories() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useRepositories();
  const scanMutation = useScanComponents();
  const analyzeMutation = useAnalyzeComplexity();
  const [scanResults, setScanResults] = useState<Record<string, ScanResult>>({});
  const [analyzingRepository, setAnalyzingRepository] = useState<string | null>(null);

  const handleScanRepository = async (repositoryName: string) => {
    setScanResults((prev) => ({
      ...prev,
      [repositoryName]: {
        repository: repositoryName,
        isLoading: true,
      },
    }));

    try {
      const result = await scanMutation.mutateAsync(repositoryName);
      setScanResults((prev) => ({
        ...prev,
        [repositoryName]: {
          repository: repositoryName,
          result,
          isLoading: false,
        },
      }));
    } catch (err) {
      setScanResults((prev) => ({
        ...prev,
        [repositoryName]: {
          repository: repositoryName,
          error: err instanceof Error ? err.message : 'Unknown error',
          isLoading: false,
        },
      }));
    }
  };

  const handleAnalyzeComplexity = async (repositoryName: string) => {
    setAnalyzingRepository(repositoryName);
    try {
      // First, scan components if not already scanned
      if (!scanResults[repositoryName]?.result?.success) {
        await scanMutation.mutateAsync(repositoryName);
      }

      // Then, trigger complexity analysis calculation
      await analyzeMutation.mutateAsync(repositoryName);

      // Navigate to dashboard after calculation completes
      navigate(`/complexity/${encodeURIComponent(repositoryName)}`);
    } finally {
      setAnalyzingRepository(null);
    }
  };

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
          <RepositoryCard
            key={repo.name}
            repo={repo}
            scanResult={scanResults[repo.name]}
            onScan={handleScanRepository}
            onAnalyzeComplexity={handleAnalyzeComplexity}
            isAnalyzing={analyzingRepository === repo.name}
          />
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
