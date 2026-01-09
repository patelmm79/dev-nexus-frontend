import { useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Slider,
  Paper,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@mui/material';
import { ExpandMore, Code } from '@mui/icons-material';
import { useCrossRepoPatterns } from '../hooks/usePatterns';
import PatternNetworkGraph from '../components/patterns/PatternNetworkGraph';
import PatternDetailModal from '../components/patterns/PatternDetailModal';
import PatternStatusChip from '../components/patterns/PatternStatusChip';

export default function Patterns() {
  const [searchTerm, setSearchTerm] = useState('');
  const [minOccurrences, setMinOccurrences] = useState(2);
  const [viewMode, setViewMode] = useState<'network' | 'list'>('network');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deprecated' | 'archived'>('all');
  const [selectedPattern, setSelectedPattern] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useCrossRepoPatterns(minOccurrences);

  const filteredPatterns = data?.patterns?.filter(pattern => {
    const matchesSearch = pattern.pattern_name.toLowerCase().includes(searchTerm.toLowerCase());
    // Status filter - for now all patterns are considered 'active'
    // When backend provides status field, we can filter by it
    const matchesStatus = statusFilter === 'all' || statusFilter === 'active';
    return matchesSearch && matchesStatus;
  }) || [];

  const handlePatternClick = (patternName: string) => {
    const pattern = filteredPatterns.find(p => p.pattern_name === patternName);
    if (pattern) {
      setSelectedPattern(pattern);
      setModalOpen(true);
    }
  };

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load patterns: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cross-Repository Patterns
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Discover patterns used across multiple repositories
      </Typography>

      {/* Controls */}
      <Paper sx={{ p: 2, mt: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Search patterns..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Minimum Repositories: {minOccurrences}
          </Typography>
          <Slider
            value={minOccurrences}
            onChange={(_, value) => setMinOccurrences(value as number)}
            min={2}
            max={10}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Status Filter
          </Typography>
          <FormControl component="fieldset" size="small">
            <RadioGroup
              row
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <FormControlLabel value="all" control={<Radio />} label="All" />
              <FormControlLabel value="active" control={<Radio />} label="Active" />
              <FormControlLabel value="deprecated" control={<Radio />} label="Deprecated" />
              <FormControlLabel value="archived" control={<Radio />} label="Archived" />
            </RadioGroup>
          </FormControl>
        </Box>

        <Tabs value={viewMode} onChange={(_, value) => setViewMode(value)}>
          <Tab label="Network View" value="network" />
          <Tab label="List View" value="list" />
        </Tabs>
      </Paper>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : viewMode === 'network' ? (
        <PatternNetworkGraph patterns={filteredPatterns} onPatternClick={handlePatternClick} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredPatterns.map((pattern) => (
            <Accordion key={pattern.pattern_name}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Code />
                  <Typography variant="h6" sx={{ flex: 1 }}>{pattern.pattern_name}</Typography>
                  <Chip
                    label={`${pattern.occurrences} repos`}
                    color="primary"
                    size="small"
                  />
                  <PatternStatusChip status="active" />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="subtitle2" gutterBottom>
                  Used in repositories:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {pattern.repositories.map(repo => (
                    <Chip key={repo} label={repo} variant="outlined" />
                  ))}
                </Box>

                {pattern.variations.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Variations:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {pattern.variations.map((variation, idx) => (
                        <Chip key={idx} label={variation} size="small" />
                      ))}
                    </Box>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {!isLoading && filteredPatterns.length === 0 && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'No patterns match your search' : 'No patterns found'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try a different search term' : 'Analyze repositories to discover patterns'}
          </Typography>
        </Box>
      )}

      <PatternDetailModal
        open={modalOpen}
        pattern={selectedPattern}
        onClose={() => setModalOpen(false)}
      />
    </Box>
  );
}
