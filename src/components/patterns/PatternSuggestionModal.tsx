import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { PatternSuggestion } from '../../services/a2aClient';

interface PatternSuggestionModalProps {
  open: boolean;
  suggestion: PatternSuggestion | null;
  isAnalyzing: boolean;
  onClose: () => void;
  onCreatePattern: (patternName: string, patternDescription: string) => void;
}

export default function PatternSuggestionModal({
  open,
  suggestion,
  isAnalyzing,
  onClose,
  onCreatePattern,
}: PatternSuggestionModalProps) {
  const [patternName, setPatternName] = useState('');
  const [patternDescription, setPatternDescription] = useState('');

  // Update fields when suggestion changes
  useEffect(() => {
    if (suggestion) {
      setPatternName(suggestion.pattern_name);
      setPatternDescription(suggestion.description);
    }
  }, [suggestion]);

  const handleCreate = () => {
    onCreatePattern(patternName, patternDescription);
  };

  const getEffortColor = (effort: string): 'success' | 'warning' | 'error' => {
    switch (effort) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Pattern Suggestion</DialogTitle>

      <DialogContent dividers>
        {isAnalyzing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
            <CircularProgress />
            <Typography color="text.secondary">
              Analyzing component for pattern worthiness...
            </Typography>
          </Box>
        ) : suggestion ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Worthiness Score */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="subtitle2">Worthiness Score:</Typography>
                <Chip
                  label={`${suggestion.worthiness_score}/10`}
                  color={suggestion.worthiness_score >= 7 ? 'success' : suggestion.worthiness_score >= 5 ? 'warning' : 'error'}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={suggestion.worthiness_score * 10}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>

            {/* Rationale */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Rationale:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {suggestion.rationale}
              </Typography>
            </Box>

            {/* Pattern Details */}
            <Box>
              <TextField
                fullWidth
                label="Pattern Name"
                value={patternName}
                onChange={(e) => setPatternName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Pattern Description"
                value={patternDescription}
                onChange={(e) => setPatternDescription(e.target.value)}
              />
            </Box>

            {/* Effort and Repositories */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="subtitle2">Estimated Effort:</Typography>
              <Chip
                label={suggestion.estimated_effort.toUpperCase()}
                color={getEffortColor(suggestion.estimated_effort)}
                size="small"
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Affected Repositories ({suggestion.affected_repositories.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {suggestion.affected_repositories.map((repo) => (
                  <Chip key={repo} label={repo} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>

            {/* Benefits */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Benefits:
              </Typography>
              <List dense>
                {suggestion.benefits.map((benefit, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemText primary={benefit} />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Implementation Notes */}
            {suggestion.implementation_notes.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Implementation Notes:
                </Typography>
                <List dense>
                  {suggestion.implementation_notes.map((note, idx) => (
                    <ListItem key={idx} sx={{ py: 0.5 }}>
                      <ListItemText primary={note} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Warning for low worthiness */}
            {suggestion.worthiness_score < 5 && (
              <Alert severity="warning">
                This component may not be a good candidate for pattern extraction. Consider reviewing the rationale before proceeding.
              </Alert>
            )}
          </Box>
        ) : (
          <Typography color="text.secondary">No suggestion available.</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {suggestion && !isAnalyzing && (
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!patternName || !patternDescription}
          >
            Create Pattern
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
