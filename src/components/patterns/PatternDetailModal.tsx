import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { History as HistoryIcon, Edit as EditIcon } from '@mui/icons-material';
import { CrossRepoPattern } from '../../services/a2aClient';
import PatternStatusChip from './PatternStatusChip';
import PatternEditDialog from './PatternEditDialog';
import PatternVersionHistory from './PatternVersionHistory';
import PatternDeprecationDialog from './PatternDeprecationDialog';

interface PatternDetailModalProps {
  open: boolean;
  pattern: CrossRepoPattern | null;
  onClose: () => void;
}

export default function PatternDetailModal({ open, pattern, onClose }: PatternDetailModalProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deprecateOpen, setDeprecateOpen] = useState(false);

  // For now, we'll treat all patterns as 'active' status (backend will provide actual status later)
  const patternStatus = 'active' as const;

  if (!pattern) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              {pattern.pattern_name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={`${pattern.occurrences} repos`} color="primary" />
              <PatternStatusChip status={patternStatus} />
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Used in repositories:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {pattern.repositories.map((repo) => (
                <Chip key={repo} label={repo} variant="outlined" />
              ))}
            </Box>
          </Box>

          {pattern.variations.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Variations ({pattern.variations.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {pattern.variations.map((variation, idx) => (
                  <Chip key={idx} label={variation} size="small" />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setHistoryOpen(true)}
            startIcon={<HistoryIcon />}
          >
            View History
          </Button>
          {patternStatus === 'active' && (
            <>
              <Button
                onClick={() => setEditOpen(true)}
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
              <Button
                onClick={() => setDeprecateOpen(true)}
                color="warning"
              >
                Deprecate
              </Button>
            </>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Nested Modals */}
      <PatternEditDialog
        open={editOpen}
        pattern={pattern}
        onClose={() => setEditOpen(false)}
      />
      <PatternVersionHistory
        open={historyOpen}
        patternName={pattern.pattern_name}
        onClose={() => setHistoryOpen(false)}
      />
      <PatternDeprecationDialog
        open={deprecateOpen}
        pattern={pattern}
        affectedRepositories={pattern.repositories}
        onClose={() => setDeprecateOpen(false)}
      />
    </>
  );
}
