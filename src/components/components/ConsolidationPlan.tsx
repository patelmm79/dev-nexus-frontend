import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Pagination,
  Button,
} from '@mui/material';
import { Search as SearchIcon, TrendingUp as ConsolidateIcon } from '@mui/icons-material';
import { useListComponents } from '../../hooks/useComponentSensibility';
import ConsolidationPlanDetail from './ConsolidationPlanDetail';

interface ConsolidationPlanProps {
  repository: string;
}

export default function ConsolidationPlan({ repository }: ConsolidationPlanProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<any | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const itemsPerPage = 10;

  const { data, isLoading, isError, error } = useListComponents(repository);

  const filteredComponents = useMemo(() => {
    if (!data?.components) return [];
    return data.components.filter((comp) =>
      comp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.components, searchQuery]);

  const paginatedComponents = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredComponents.slice(start, start + itemsPerPage);
  }, [filteredComponents, page]);

  const handleGetPlan = (component: any) => {
    setSelectedComponent(component);
    setPlanModalOpen(true);
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
        Failed to load components: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!data?.success) {
    return <Alert severity="error">Failed to load components. Please try again.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Statistics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Total Components
            </Typography>
            <Typography variant="h5">{data?.total_components || data?.total_count || 0}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Showing Filtered
            </Typography>
            <Typography variant="h5">{data?.filtered_count || 0}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Repository
            </Typography>
            <Typography variant="body2">{repository || 'All'}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Components Table */}
      <Card>
        <CardHeader
          title="Repository Components"
          subheader={`${filteredComponents.length} of ${data?.total_components || data?.total_count || 0} components`}
          action={
            <TextField
              size="small"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          }
        />
        <CardContent sx={{ pt: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell>Component Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">LOC</TableCell>
                  <TableCell align="right">Language</TableCell>
                  <TableCell align="right">Keywords</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedComponents.map((component, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={component.name}
                      >
                        {component.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={component.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{component.loc || '-'}</TableCell>
                    <TableCell align="right">{component.language || '-'}</TableCell>
                    <TableCell align="right">{component.keywords?.length || 0}</TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ConsolidateIcon />}
                        onClick={() => handleGetPlan(component)}
                      >
                        Get Plan
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredComponents.length > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={Math.ceil(filteredComponents.length / itemsPerPage)}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
              />
            </Box>
          )}

          {filteredComponents.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">No components found.</Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Consolidation Plan Detail Modal */}
      <ConsolidationPlanDetail
        open={planModalOpen}
        componentName={selectedComponent?.name || ''}
        fromRepository={repository}
        onClose={() => setPlanModalOpen(false)}
      />
    </Box>
  );
}
