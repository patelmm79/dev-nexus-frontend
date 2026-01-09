import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Chip,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Autocomplete,
  Paper,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { CrossRepoPattern } from '../../services/a2aClient';
import { useDeprecatePattern, useCrossRepoPatterns } from '../../hooks/usePatterns';

interface PatternDeprecationDialogProps {
  open: boolean;
  pattern: CrossRepoPattern | null;
  affectedRepositories?: string[];
  onClose: () => void;
}

export default function PatternDeprecationDialog({
  open,
  pattern,
  onClose,
}: PatternDeprecationDialogProps) {
  const [reason, setReason] = useState('');
  const [replacementPattern, setReplacementPattern] = useState<string | null>(null);
  const [migrationNotes, setMigrationNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const deprecateMutation = useDeprecatePattern();
  const { data: patternsData } = useCrossRepoPatterns();

  // Get list of other patterns for replacement suggestion
  const availablePatterns =
    patternsData?.patterns
      ?.filter((p) => p.pattern_name !== pattern?.pattern_name)
      .map((p) => p.pattern_name) || [];

  // Reset form when dialog opens/closes or pattern changes
  useEffect(() => {
    if (open) {
      setReason('');
      setReplacementPattern(null);
      setMigrationNotes([]);
      setNewNote('');
      setConfirmed(false);
    }
  }, [open]);

  const handleAddNote = () => {
    if (newNote.trim() && !migrationNotes.includes(newNote.trim())) {
      setMigrationNotes([...migrationNotes, newNote.trim()]);
      setNewNote('');
    }
  };

  const handleRemoveNote = (note: string) => {
    setMigrationNotes(migrationNotes.filter((n) => n !== note));
  };

  const handleSubmit = async () => {
    if (!reason.trim() || !confirmed) {
      return;
    }

    if (pattern) {
      await deprecateMutation.mutateAsync({
        pattern_name: pattern.pattern_name,
        reason,
        replacement_pattern: replacementPattern || undefined,
        migration_notes: migrationNotes.length > 0 ? migrationNotes : undefined,
      });

      onClose();
    }
  };

  const isSubmitDisabled =
    !reason.trim() ||
    !confirmed ||
    deprecateMutation.isPending ||
    !pattern;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6">
            Deprecate Pattern: {pattern?.pattern_name}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Warning Alert */}
        <Alert severity="warning" icon={<WarningIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            This will affect {pattern?.repositories?.length || 0} repositories
          </Typography>
          <Typography variant="body2">
            Deprecating this pattern will mark it as deprecated across all repositories that use it.
          </Typography>
        </Alert>

        {/* Affected Repositories */}
        {pattern?.repositories && pattern.repositories.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Affected Repositories
            </Typography>
            <Paper sx={{ p: 1.5, backgroundColor: '#fafafa', border: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {pattern.repositories.map((repo) => (
                  <Chip key={repo} label={repo} size="small" variant="outlined" />
                ))}
              </Box>
            </Paper>
          </Box>
        )}

        {/* Deprecation Reason */}
        <Box>
          <TextField
            fullWidth
            label="Reason for Deprecation"
            multiline
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this pattern being deprecated?"
            required
            error={!reason.trim() && open}
            helperText={!reason.trim() && open ? 'Reason is required' : ''}
            variant="outlined"
          />
        </Box>

        {/* Replacement Pattern */}
        <Box>
          <Autocomplete
            options={availablePatterns}
            value={replacementPattern}
            onChange={(_, value) => setReplacementPattern(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Replacement Pattern (Optional)"
                placeholder="Suggest a pattern to use instead"
              />
            )}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Users will be notified about this replacement during migration
          </Typography>
        </Box>

        {/* Migration Notes */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Migration Notes (Optional)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {migrationNotes.map((note) => (
              <Chip
                key={note}
                label={note}
                onDelete={() => handleRemoveNote(note)}
                size="small"
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Add migration tip"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddNote();
                  e.preventDefault();
                }
              }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddNote}
              disabled={!newNote.trim()}
            >
              Add
            </Button>
          </Box>
        </Box>

        {/* Confirmation Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2">
              I understand that this will deprecate the pattern for {pattern?.repositories?.length || 0} repositories
            </Typography>
          }
        />

        {deprecateMutation.isError && (
          <Typography color="error" variant="body2">
            {deprecateMutation.error instanceof Error
              ? deprecateMutation.error.message
              : 'An error occurred'}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={deprecateMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          startIcon={deprecateMutation.isPending ? <CircularProgress size={20} /> : undefined}
        >
          {deprecateMutation.isPending ? 'Deprecating...' : 'Deprecate Pattern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
