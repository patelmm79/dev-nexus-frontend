import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Chip,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { CrossRepoPattern } from '../../services/a2aClient';
import { useUpdatePattern } from '../../hooks/usePatterns';

interface PatternEditDialogProps {
  open: boolean;
  pattern: CrossRepoPattern | null;
  onClose: () => void;
}

export default function PatternEditDialog({
  open,
  pattern,
  onClose,
}: PatternEditDialogProps) {
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  const updateMutation = useUpdatePattern();

  // Reset form when dialog opens/closes or pattern changes
  useEffect(() => {
    if (open && pattern) {
      setDescription('');
      setKeywords(pattern.variations?.slice(0, 3) || []);
      setNewKeyword('');
      setChangeSummary('');
    }
  }, [open, pattern]);

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleSubmit = async () => {
    if (!changeSummary.trim()) {
      return;
    }

    if (pattern) {
      await updateMutation.mutateAsync({
        pattern_name: pattern.pattern_name,
        description: description || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        change_summary: changeSummary,
      });

      onClose();
    }
  };

  const isSubmitDisabled =
    !changeSummary.trim() ||
    updateMutation.isPending ||
    !pattern;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Edit Pattern: {pattern?.pattern_name}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Description */}
        <Box>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add or update pattern description"
            variant="outlined"
          />
        </Box>

        {/* Keywords */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Keywords/Tags
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            {keywords.map((keyword) => (
              <Chip
                key={keyword}
                label={keyword}
                onDelete={() => handleRemoveKeyword(keyword)}
                size="small"
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Add keyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddKeyword();
                  e.preventDefault();
                }
              }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddKeyword}
              startIcon={<AddIcon />}
              disabled={!newKeyword.trim()}
            >
              Add
            </Button>
          </Box>
        </Box>

        {/* Change Summary */}
        <Box>
          <TextField
            fullWidth
            label="Change Summary"
            multiline
            rows={2}
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="Describe what changed in this version"
            required
            error={!changeSummary.trim() && open}
            helperText={!changeSummary.trim() && open ? 'Change summary is required' : ''}
            variant="outlined"
          />
        </Box>

        {updateMutation.isError && (
          <Typography color="error" variant="body2">
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : 'An error occurred'}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={updateMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          startIcon={updateMutation.isPending ? <CircularProgress size={20} /> : undefined}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
