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
} from '@mui/material';
import { ExpandMore, Code } from '@mui/icons-material';
import { useCrossRepoPatterns } from '../hooks/usePatterns';

export default function Patterns() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, isError, error } = useCrossRepoPatterns();

  const filteredPatterns = data?.patterns.filter(pattern =>
    pattern.pattern_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

      <TextField
        fullWidth
        label="Search patterns..."
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mt: 3, mb: 3 }}
      />

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredPatterns.map((pattern) => (
            <Accordion key={pattern.pattern_name}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Code />
                  <Typography variant="h6">{pattern.pattern_name}</Typography>
                  <Chip
                    label={`${pattern.occurrences} repos`}
                    color="primary"
                    size="small"
                  />
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
    </Box>
  );
}
