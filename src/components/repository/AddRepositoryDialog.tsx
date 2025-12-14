import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
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
    if (mutation.isSuccess) {
      onClose();
    }
  }, [mutation.isSuccess, onClose]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!repository) return;
    mutation.mutate(repository);
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
            disabled={mutation.isLoading}
            helperText={mutation.isError ? (mutation.error as Error).message : ''}
            error={mutation.isError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={mutation.isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isLoading || repository.trim() === ''}
          >
            {mutation.isLoading ? <CircularProgress size={20} /> : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
