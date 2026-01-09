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
import { CrossRepoPattern } from '../../services/a2aClient';

interface PatternDetailModalProps {
  open: boolean;
  pattern: CrossRepoPattern | null;
  onClose: () => void;
}

export default function PatternDetailModal({ open, pattern, onClose }: PatternDetailModalProps) {
  if (!pattern) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {pattern.pattern_name}
          </Typography>
          <Chip label={`${pattern.occurrences} repos`} color="primary" />
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
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
