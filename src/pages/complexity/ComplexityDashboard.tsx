import { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Autocomplete,
  Card,
  CardContent,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Pagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useRepositories } from '../../hooks/usePatterns';
import { useComplexityAnalysis, useTriggerComplexityAnalysis } from '../../hooks/useComplexityMetrics';
import ComplexityBadge from '../../components/complexity/ComplexityBadge';
import BarChartCard from '../../components/analytics/charts/BarChartCard';

interface TableParams {
  page: number;
  sortBy: 'simplified' | 'full_mccabe' | 'cognitive';
  searchQuery: string;
}

export default function ComplexityDashboard() {
  const { repository } = useParams<{ repository: string }>();
  const { data: repositoriesData } = useRepositories();
  const { data: complexityData, isLoading, error } = useComplexityAnalysis(repository || '');
  const triggerAnalysis = useTriggerComplexityAnalysis();
  const [selectedRepo, setSelectedRepo] = useState<string | null>(repository || null);
  const [tableParams, setTableParams] = useState<TableParams>({
    page: 1,
    sortBy: 'cognitive',
    searchQuery: '',
  });

  const repositoryList = useMemo(() => {
    return repositoriesData?.repositories?.map((repo) => repo.name) || [];
  }, [repositoriesData]);

  // Get current page components
  const itemsPerPage = 10;
  const filteredComponents = useMemo(() => {
    if (!Array.isArray(complexityData?.components)) return [];

    return complexityData.components
      .filter((comp: any) =>
        comp.component_name.toLowerCase().includes(tableParams.searchQuery.toLowerCase())
      )
      .sort((a: any, b: any) => {
        switch (tableParams.sortBy) {
          case 'cognitive':
            return (
              (b.complexity?.cognitive_complexity || 0) -
              (a.complexity?.cognitive_complexity || 0)
            );
          case 'full_mccabe':
            return (b.complexity?.full_mccabe || 0) - (a.complexity?.full_mccabe || 0);
          case 'simplified':
          default:
            return (
              (b.complexity?.simplified_mccabe?.score || 0) -
              (a.complexity?.simplified_mccabe?.score || 0)
            );
        }
      });
  }, [complexityData?.components, tableParams.searchQuery, tableParams.sortBy]);

  const paginatedComponents = useMemo(() => {
    const start = (tableParams.page - 1) * itemsPerPage;
    return filteredComponents.slice(start, start + itemsPerPage);
  }, [filteredComponents, tableParams.page]);

  const totalPages = Math.ceil(filteredComponents.length / itemsPerPage);

  const handleRefresh = () => {
    if (selectedRepo) {
      triggerAnalysis.mutate(selectedRepo);
    }
  };

  const getLevelColor = (level: string): any => {
    switch (level) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!selectedRepo) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Select a Repository
          </Typography>
          <Autocomplete
            options={repositoryList}
            value={selectedRepo}
            onChange={(_, newValue) => setSelectedRepo(newValue)}
            sx={{ maxWidth: 400, mb: 2 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Repository"
                placeholder="Choose a repository"
                helperText={
                  repositoryList.length > 0
                    ? `${repositoryList.length} repositories available`
                    : 'No repositories available'
                }
              />
            )}
          />
        </Paper>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    console.error('Complexity analysis error:', error);
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load complexity analysis: {error instanceof Error ? error.message : JSON.stringify(error)}
        </Alert>
      </Container>
    );
  }

  if (!complexityData) {
    console.warn('Complexity data is undefined after query completed');
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">No data returned from complexity analysis. Please try again.</Alert>
      </Container>
    );
  }

  if (!complexityData.success) {
    console.error('Complexity analysis failed:', complexityData);
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Complexity analysis failed: {complexityData.error || 'Unknown error. Check console for details.'}
        </Alert>
      </Container>
    );
  }

  const { summary, distribution, components } = complexityData;

  // Prepare distribution chart data
  const distributionChartData = Array.isArray(distribution)
    ? distribution.map((d) => ({
        name: d.level.charAt(0).toUpperCase() + d.level.slice(1),
        count: d.count,
        percentage: d.percentage,
      }))
    : [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom>
            Code Complexity Analysis
          </Typography>
          <Autocomplete
            options={repositoryList}
            value={selectedRepo}
            onChange={(_, newValue) => {
              setSelectedRepo(newValue);
              setTableParams({ ...tableParams, page: 1 });
            }}
            sx={{ maxWidth: 400 }}
            renderInput={(params) => (
              <TextField {...params} label="Repository" size="small" />
            )}
          />
        </Box>
        <Tooltip title="Refresh analysis">
          <IconButton
            onClick={handleRefresh}
            disabled={triggerAnalysis.isPending}
            color="primary"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stale Analysis Warning */}
      {complexityData.stale_analysis && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ This analysis is stale ({complexityData.days_since_analysis} days old). Consider
          triggering a new analysis for updated metrics.
        </Alert>
      )}

      {/* Metrics Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Summary Metrics
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
          {/* Simplified McCabe */}
          <Box>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Simplified McCabe - Average
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {summary?.average_simplified_score?.toFixed(2) ?? 'N/A'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="textSecondary">
                      Median: {summary?.median_simplified_score?.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Max: {summary?.max_simplified_score?.toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    Weighted: {summary?.weighted_score?.toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Full McCabe */}
          <Box>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Full McCabe - Average
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {summary?.average_full_mccabe?.toFixed(2) ?? 'N/A'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="textSecondary">
                    Median: {summary?.median_full_mccabe?.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Max: {summary?.max_full_mccabe?.toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Cognitive Complexity */}
          <Box>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Cognitive Complexity - Average
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {summary?.average_cognitive?.toFixed(2) ?? 'N/A'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="textSecondary">
                    Median: {summary?.median_cognitive?.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Max: {summary?.max_cognitive?.toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Overall Grade */}
          <Box>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Overall Grade
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <ComplexityBadge
                    grade={summary?.overall_grade || 'F'}
                    showStale={true}
                    isStale={complexityData.stale_analysis}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Distribution Chart */}
      {distributionChartData.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Component Distribution by Complexity Level
          </Typography>
          <BarChartCard
            data={distributionChartData}
            dataKeys={[{ key: "count", color: "#1976d2" }]}
            xAxisKey="name"
            height={300}
            title=""
            isLoading={false}
          />
        </Box>
      )}

      {/* Components Table */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Components by Complexity ({filteredComponents.length} total)
        </Typography>

        {/* Search */}
        <TextField
          placeholder="Search components..."
          value={tableParams.searchQuery}
          onChange={(e) =>
            setTableParams({
              ...tableParams,
              searchQuery: e.target.value,
              page: 1,
            })
          }
          sx={{ mb: 2, maxWidth: 300 }}
          size="small"
        />

        {/* Table */}
        {Array.isArray(components) && components.length > 0 ? (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: 'action.hover' }}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant={tableParams.sortBy === 'simplified' ? 'contained' : 'text'}
                        size="small"
                        onClick={() =>
                          setTableParams({ ...tableParams, sortBy: 'simplified', page: 1 })
                        }
                      >
                        Component
                      </Button>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant={tableParams.sortBy === 'simplified' ? 'contained' : 'text'}
                        size="small"
                        onClick={() =>
                          setTableParams({ ...tableParams, sortBy: 'simplified', page: 1 })
                        }
                      >
                        Simplified
                      </Button>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant={tableParams.sortBy === 'full_mccabe' ? 'contained' : 'text'}
                        size="small"
                        onClick={() =>
                          setTableParams({ ...tableParams, sortBy: 'full_mccabe', page: 1 })
                        }
                      >
                        Full McCabe
                      </Button>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant={tableParams.sortBy === 'cognitive' ? 'contained' : 'text'}
                        size="small"
                        onClick={() =>
                          setTableParams({ ...tableParams, sortBy: 'cognitive', page: 1 })
                        }
                      >
                        Cognitive
                      </Button>
                    </TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedComponents.map((component: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Typography variant="body2">{component.component_name}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={component.complexity?.simplified_mccabe?.grade || 'N/A'}
                          color={
                            component.complexity?.simplified_mccabe?.grade === 'A'
                              ? 'success'
                              : component.complexity?.simplified_mccabe?.grade === 'B'
                                ? 'info'
                                : component.complexity?.simplified_mccabe?.grade === 'C' ||
                                    component.complexity?.simplified_mccabe?.grade === 'D'
                                  ? 'warning'
                                  : 'error'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {component.complexity?.full_mccabe?.toFixed(1)}
                      </TableCell>
                      <TableCell align="right">
                        {component.complexity?.cognitive_complexity?.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={component.complexity?.level || 'Unknown'}
                          color={getLevelColor(component.complexity?.level)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={component.component_type} size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={totalPages}
                  page={tableParams.page}
                  onChange={(_, page) =>
                    setTableParams({ ...tableParams, page })
                  }
                />
              </Box>
            )}
          </>
        ) : (
          <Alert severity="info">No components available</Alert>
        )}
      </Box>
    </Container>
  );
}
