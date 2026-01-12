import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { WorkflowMetadata } from '../../services/a2aClient';

export interface ResultsMetadataViewProps {
  metadata?: WorkflowMetadata[];
}

export default function ResultsMetadataView({
  metadata = [],
}: ResultsMetadataViewProps) {
  if (metadata.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            No metadata available yet.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card>
        <CardHeader title="Database Metadata" />
        <CardContent sx={{ pt: 0 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>PostgreSQL Statistics</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ width: '100%' }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 500 }}>
                        Total Repositories
                      </TableCell>
                      <TableCell align="right">{metadata.length}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 500 }}>
                        Total Patterns
                      </TableCell>
                      <TableCell align="right">
                        {metadata.reduce((sum, m) => sum + m.patterns_count, 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 500 }}>
                        Total Dependencies
                      </TableCell>
                      <TableCell align="right">
                        {metadata.reduce(
                          (sum, m) => sum + m.dependencies_count,
                          0
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 500 }}>
                        Total Components
                      </TableCell>
                      <TableCell align="right">
                        {metadata.reduce(
                          (sum, m) => sum + m.components_count,
                          0
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </AccordionDetails>
          </Accordion>

          {metadata.map((repo) => (
            <Accordion key={repo.repository}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{repo.repository}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ width: '100%' }}>
                  <Table size="small" sx={{ mb: 2 }}>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 500 }}>
                          Patterns
                        </TableCell>
                        <TableCell align="right">
                          {repo.patterns_count}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 500 }}>
                          Dependencies
                        </TableCell>
                        <TableCell align="right">
                          {repo.dependencies_count}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 500 }}>
                          Components
                        </TableCell>
                        <TableCell align="right">
                          {repo.components_count}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 500 }}>
                          Last Updated
                        </TableCell>
                        <TableCell align="right">
                          {new Date(repo.last_updated).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <Typography
                    variant="subtitle2"
                    sx={{ mt: 2, mb: 1, fontWeight: 500 }}
                  >
                    Sample Query
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: 'grey.900',
                      color: 'grey.100',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{ margin: 0, whiteSpace: 'pre-wrap' }}
                    >
{`SELECT * FROM patterns
WHERE repository = '${repo.repository}';

SELECT * FROM dependencies
WHERE source = '${repo.repository}'
OR target = '${repo.repository}';

SELECT COUNT(*) FROM components
WHERE repository = '${repo.repository}';`}
                    </Typography>
                  </Paper>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
