import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useAddRepository } from '../../hooks/usePatterns';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddRepositoryDialog({ open, onClose }: Props) {
  const [repository, setRepository] = useState('');
  const mutation = useAddRepository();

  useEffect(() => {
    if (!open) {
      setRepository('');
    }
  }, [open]);

  useEffect(() => {
    if (mutation.status === 'success') {
      // Auto-close shortly after success so user can read the backend message
      const t = setTimeout(() => {
        onClose();
        mutation.reset?.();
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [mutation.status, mutation, onClose]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!repository) return;
    mutation.mutate(repository.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Repository</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Repository (owner/name or URL)"
            type="text"
            fullWidth
            variant="outlined"
            value={repository}
            onChange={(e) => setRepository(e.target.value)}
            disabled={mutation.status === 'pending' || mutation.status === 'success'}
            helperText={mutation.status === 'error' ? (mutation.error as Error)?.message ?? '' : ''}
            error={mutation.status === 'error'}
          />

          {mutation.status === 'success' && mutation.data?.message ? (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              {mutation.data.message}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              mutation.reset?.();
              onClose();
            }}
            disabled={mutation.status === 'pending'}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.status === 'pending' || repository.trim() === '' || mutation.status === 'success'}
          >
            {mutation.status === 'pending' ? <CircularProgress size={20} /> : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
