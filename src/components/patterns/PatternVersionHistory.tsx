import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { ExpandMore, CheckCircle } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { usePatternHistory } from '../../hooks/usePatterns';

interface PatternVersionHistoryProps {
  open: boolean;
  patternName: string;
  onClose: () => void;
}

export default function PatternVersionHistory({
  open,
  patternName,
  onClose,
}: PatternVersionHistoryProps) {
  const { data: historyData, isLoading, isError, error } = usePatternHistory(patternName);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  const getChangeColor = (field: string): 'success' | 'warning' | 'error' => {
    if (field.includes('add') || field.includes('new')) return 'success';
    if (field.includes('delete') || field.includes('remove')) return 'error';
    return 'warning';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Version History: {patternName}
          </Typography>
          <Chip label={historyData?.total_versions || 0} color="primary" />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity="error">
            Failed to load version history: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        ) : historyData?.versions && historyData.versions.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {historyData.versions.map((version) => (
              <Accordion
                key={version.version_number}
                expanded={expandedVersion === version.version_number}
                onChange={() =>
                  setExpandedVersion(
                    expandedVersion === version.version_number ? null : version.version_number
                  )
                }
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <CheckCircle fontSize="small" color="success" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, minWidth: 120 }}>
                      v{version.version_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                      {version.change_summary}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                    </Typography>
                  </Box>
                </AccordionSummary>

                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Version Metadata */}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Details
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>Created by:</strong> {version.created_by}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Status:</strong>{' '}
                          <Chip
                            label={version.status.toUpperCase()}
                            size="small"
                            color={
                              version.status === 'active' ? 'success' : version.status === 'deprecated' ? 'warning' : 'default'
                            }
                          />
                        </Typography>
                      </Box>
                    </Box>

                    {/* Description */}
                    {version.description && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Description
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {version.description}
                        </Typography>
                      </Box>
                    )}

                    {/* Changes */}
                    {version.changes && version.changes.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Changes ({version.changes.length})
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ border: 'none' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell><strong>Field</strong></TableCell>
                                <TableCell><strong>Old Value</strong></TableCell>
                                <TableCell><strong>New Value</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {version.changes.map((change, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    <Chip
                                      label={change.field}
                                      size="small"
                                      color={getChangeColor(change.field)}
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontFamily: 'monospace',
                                        color: 'error.main',
                                        textDecoration: 'line-through',
                                      }}
                                    >
                                      {change.old_value || '(empty)'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontFamily: 'monospace',
                                        color: 'success.main',
                                        fontWeight: 500,
                                      }}
                                    >
                                      {change.new_value || '(empty)'}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">No version history available.</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
