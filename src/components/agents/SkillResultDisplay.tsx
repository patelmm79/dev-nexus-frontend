/**
 * Skill Result Display Component - Format and display skill execution results
 * Place in: dev-nexus-frontend/src/components/agents/SkillResultDisplay.tsx
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  Grid,
  Alert,
  Button,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface SkillResultDisplayProps {
  result: Record<string, any>;
}

export default function SkillResultDisplay({ result }: SkillResultDisplayProps) {
  const [expandAll, setExpandAll] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Determine if result indicates success
  const isSuccess = result.success !== false && !result.error;

  // Render different types of values
  const renderValue = (value: any, key?: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <Typography color="text.disabled">null</Typography>;
    }

    if (typeof value === 'boolean') {
      return (
        <Chip
          label={value ? 'true' : 'false'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      );
    }

    if (typeof value === 'number') {
      return (
        <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
          {value}
        </Typography>
      );
    }

    if (typeof value === 'string') {
      // Check if it's a URL
      if (value.startsWith('http')) {
        return (
          <a href={value} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        );
      }
      // Check if it's a date
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        return (
          <Chip
            label={new Date(value).toLocaleString()}
            size="small"
            variant="outlined"
          />
        );
      }
      return <Typography>{value}</Typography>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <Typography color="text.disabled">[]</Typography>;
      }

      // If array of strings or numbers
      if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
        return (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            {value.map((item, idx) => (
              <Chip key={idx} label={String(item)} size="small" />
            ))}
          </Stack>
        );
      }

      // If array of objects
      if (value.every((v) => typeof v === 'object')) {
        return <ResultTable data={value} />;
      }

      // Mixed array
      return (
        <Box sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
          <Typography component="pre" variant="caption">
            {JSON.stringify(value, null, 2)}
          </Typography>
        </Box>
      );
    }

    if (typeof value === 'object') {
      return <ResultObject obj={value} />;
    }

    return <Typography>{String(value)}</Typography>;
  };

  const handleToggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExpandAll = () => {
    if (expandAll) {
      setExpanded({});
    } else {
      const allKeys = Object.keys(result).filter(
        (k) => typeof result[k] === 'object' && result[k] !== null
      );
      const newExpanded = allKeys.reduce(
        (acc, k) => ({ ...acc, [k]: true }),
        {}
      );
      setExpanded(newExpanded);
    }
    setExpandAll(!expandAll);
  };

  return (
    <Box>
      {/* Status Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          p: 2,
          backgroundColor: isSuccess ? '#e8f5e9' : '#ffebee',
          borderRadius: 1,
          borderLeft: `4px solid ${isSuccess ? '#4caf50' : '#f44336'}`,
        }}
      >
        {isSuccess ? (
          <SuccessIcon sx={{ color: '#4caf50' }} />
        ) : (
          <ErrorIcon sx={{ color: '#f44336' }} />
        )}
        <Box flex={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {isSuccess ? 'Execution Successful' : 'Execution Failed'}
          </Typography>
          {result.error && (
            <Typography variant="body2" color="error">
              {result.error}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {result.skill_id && (
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Skill ID
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {result.skill_id}
              </Typography>
            </Paper>
          </Grid>
        )}
        {result.timestamp && (
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Executed At
              </Typography>
              <Typography variant="body2">
                {new Date(result.timestamp).toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
        )}
        {result.total_matches !== undefined && (
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Total Matches
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                {result.total_matches}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Expandable Sections */}
      {expandAll && Object.keys(result).length > 5 && (
        <Box sx={{ mb: 2 }}>
          <Button size="small" onClick={handleExpandAll}>
            Collapse All
          </Button>
        </Box>
      )}

      {Object.entries(result).map(([key, value]) => {
        // Skip non-content fields
        if (
          key === 'success' ||
          key === 'skill_id' ||
          key === 'timestamp' ||
          key === 'error'
        ) {
          return null;
        }

        // Large objects or arrays get accordion treatment
        if (
          (typeof value === 'object' && value !== null && !Array.isArray(value)) ||
          (Array.isArray(value) && value.length > 5)
        ) {
          return (
            <Accordion
              key={key}
              expanded={expanded[key] || false}
              onChange={() => handleToggle(key)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </Typography>
                {Array.isArray(value) && (
                  <Typography variant="caption" sx={{ ml: 'auto', mr: 2 }}>
                    {value.length} items
                  </Typography>
                )}
              </AccordionSummary>
              <AccordionDetails>
                {renderValue(value, key)}
              </AccordionDetails>
            </Accordion>
          );
        }

        // Regular fields
        return (
          <Box key={key} sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 'bold', textTransform: 'capitalize', display: 'block', mb: 0.5 }}
            >
              {key.replace(/_/g, ' ')}
            </Typography>
            <Box sx={{ ml: 1 }}>
              {renderValue(value, key)}
            </Box>
          </Box>
        );
      })}

      {/* Raw JSON */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Raw JSON Response</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: '400px',
            }}
          >
            <Typography component="pre" variant="caption" sx={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(result, null, 2)}
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

/* Helper component for rendering objects */
function ResultObject({ obj }: { obj: Record<string, any> }) {
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return <Typography color="text.disabled">{'{}'}</Typography>;
  }

  return (
    <Box sx={{ ml: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
      <Stack spacing={0.5}>
        {entries.map(([k, v]) => (
          <Box key={k} sx={{ display: 'flex', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', minWidth: '100px' }}>
              {k}:
            </Typography>
            <Box flex={1}>{renderSimpleValue(v)}</Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

/* Helper component for rendering tables */
function ResultTable({ data }: { data: Record<string, any>[] }) {
  if (data.length === 0) {
    return <Typography color="text.disabled">No data</Typography>;
  }

  const columns = Object.keys(data[0]);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            {columns.map((col) => (
              <TableCell key={col} sx={{ fontWeight: 'bold' }}>
                {col}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.slice(0, 20).map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={`${idx}-${col}`}>
                  {renderSimpleValue(row[col])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.length > 20 && (
        <Typography variant="caption" sx={{ p: 1, display: 'block' }}>
          Showing 20 of {data.length} rows
        </Typography>
      )}
    </TableContainer>
  );
}

/* Simple value renderer */
function renderSimpleValue(value: any): React.ReactNode {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean')
    return value ? <Chip label="true" size="small" color="success" /> : <Chip label="false" size="small" />;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value.substring(0, 50);
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return '[Object]';
  return String(value);
}
