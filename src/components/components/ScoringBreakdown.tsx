import { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Typography,
  LinearProgress,
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
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAnalyzeComponentCentrality } from '../../hooks/useComponentSensibility';

interface ScoringBreakdownProps {
  repository: string;
}

const FACTOR_LABELS: Record<string, string> = {
  purpose_score: 'Purpose',
  usage_score: 'Usage',
  centrality_score: 'Centrality',
  maintenance_score: 'Maintenance',
  complexity_score: 'Complexity',
  first_impl_score: 'First-Impl',
};

const FACTOR_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

const getGradeColor = (score: number): string => {
  if (score >= 0.9) return '#4caf50';
  if (score >= 0.8) return '#8bc34a';
  if (score >= 0.7) return '#ffc107';
  if (score >= 0.6) return '#ff9800';
  return '#f44336';
};

const getGradeLetter = (score: number): string => {
  if (score >= 0.9) return 'A';
  if (score >= 0.8) return 'B';
  if (score >= 0.7) return 'C';
  if (score >= 0.6) return 'D';
  return 'F';
};

export default function ScoringBreakdown({ repository }: ScoringBreakdownProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data, isLoading, isError, error } = useAnalyzeComponentCentrality(repository);

  const filteredComponents = useMemo(() => {
    if (!data?.components) return [];
    return data.components.filter((comp) =>
      comp.component_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.components, searchQuery]);

  const paginatedComponents = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredComponents.slice(start, start + itemsPerPage);
  }, [filteredComponents, page]);

  const pieData = useMemo(() => {
    if (!data?.score_weights) return [];
    return Object.entries(data.score_weights).map(([key, value]) => ({
      name: FACTOR_LABELS[key] || key,
      value: Math.round(value * 100),
    }));
  }, [data?.score_weights]);

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
        Failed to load scoring breakdown: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!data?.success) {
    return <Alert severity="error">Scoring analysis failed. Please try again.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Total Components
            </Typography>
            <Typography variant="h5">{data.components.length}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Average Score
            </Typography>
            <Typography variant="h5">
              {(data.summary_statistics.avg_score * 100).toFixed(0)}%
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              High Priority
            </Typography>
            <Typography variant="h5" sx={{ color: 'warning.main' }}>
              {data.summary_statistics.high_priority_count}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {pieData.length > 0 && (
        <Card>
          <CardHeader title="Factor Weights Distribution" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={FACTOR_COLORS[index % FACTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Component Scores"
          subheader={`${filteredComponents.length} components total`}
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
                  <TableCell>Component</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="right">Overall</TableCell>
                  <TableCell align="right">Purpose</TableCell>
                  <TableCell align="right">Usage</TableCell>
                  <TableCell align="right">Centrality</TableCell>
                  <TableCell align="right">Maintenance</TableCell>
                  <TableCell align="right">Complexity</TableCell>
                  <TableCell align="right">First-Impl</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedComponents.map((component, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ maxWidth: 150 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={component.component_name}
                      >
                        {component.component_name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 150 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={component.location}
                      >
                        {component.location}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={getGradeLetter(component.overall_score)}
                        size="small"
                        sx={{
                          backgroundColor: getGradeColor(component.overall_score),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </TableCell>
                    {[
                      component.purpose_score,
                      component.usage_score,
                      component.centrality_score,
                      component.maintenance_score,
                      component.complexity_score,
                      component.first_impl_score,
                    ].map((score, scoreIndex) => (
                      <TableCell key={scoreIndex} align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={score * 100}
                            sx={{ width: 50 }}
                          />
                          <Typography variant="caption">
                            {(score * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
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
    </Box>
  );
}
