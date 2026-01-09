import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAnalyzeComponentCentrality } from '../../hooks/useComponentSensibility';

interface ComponentCentralityDetailProps {
  open: boolean;
  componentName: string;
  currentLocation: string;
  onClose: () => void;
}

export default function ComponentCentralityDetail({
  open,
  componentName,
  currentLocation,
  onClose,
}: ComponentCentralityDetailProps) {
  const { data, isLoading, isError, error } = useAnalyzeComponentCentrality(componentName, currentLocation);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Centrality Analysis: {componentName}
          </Typography>
          <Button
            size="small"
            startIcon={<CloseIcon />}
            onClick={onClose}
          >
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {isLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Alert severity="error">
            Failed to load centrality analysis: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        )}

        {data?.success && data.analysis && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Recommendation Card */}
            <Card>
              <CardHeader title="Recommendation" />
              <CardContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Current Location
                    </Typography>
                    <Chip
                      label={data.analysis.recommendation?.from || currentLocation}
                      variant="outlined"
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Best Location
                    </Typography>
                    <Chip
                      label={data.analysis.best_location}
                      color="primary"
                      variant="filled"
                    />
                  </Box>
                  {data.analysis.recommendation && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Improvement
                      </Typography>
                      <Chip
                        label={`+${(data.analysis.recommendation.improvement * 100).toFixed(1)}%`}
                        color="success"
                        variant="filled"
                      />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Location Scores Table */}
            <Card>
              <CardHeader title="Scores by Repository" />
              <CardContent>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'action.hover' }}>
                        <TableCell>Repository</TableCell>
                        <TableCell align="right">Score</TableCell>
                        <TableCell>Factors</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(data.analysis.all_scores || {}).map(([repositoryName, scoreData]: [string, any]) => (
                        <TableRow
                          key={repositoryName}
                          selected={repositoryName === data.analysis.best_location}
                          sx={{
                            backgroundColor:
                              repositoryName === data.analysis.best_location
                                ? 'action.selected'
                                : 'inherit',
                          }}
                        >
                          <TableCell>{repositoryName}</TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight:
                                  repositoryName === data.analysis.best_location
                                    ? 'bold'
                                    : 'normal',
                                color:
                                  repositoryName === data.analysis.best_location
                                    ? 'primary.main'
                                    : 'inherit',
                              }}
                            >
                              {scoreData.canonical_score.toFixed(3)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {Object.entries(scoreData.factors || {}).map(([factorName, factorValue]: [string, any]) => (
                                <Chip
                                  key={factorName}
                                  label={`${factorName}: ${(factorValue as number).toFixed(2)}`}
                                  size="small"
                                  variant="outlined"
                                  title={scoreData.reasoning}
                                />
                              ))}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Timestamp */}
            {data.analysis_timestamp && (
              <Typography variant="caption" color="textSecondary">
                Analysis performed: {new Date(data.analysis_timestamp).toLocaleString()}
              </Typography>
            )}
          </Box>
        )}

        {!data?.success && !isLoading && !isError && (
          <Alert severity="warning">
            No analysis data available. Please try again.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
